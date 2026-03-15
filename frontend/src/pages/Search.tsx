import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Title,
  Text,
  Loader,
  Stack,
  Paper,
  Badge,
  Group,
  Center,
  Divider,
  Combobox,
  TextInput,
  useCombobox,
  Accordion,
  Checkbox,
  Switch,
  Button,
  Modal,
  useMantineColorScheme,
} from "@mantine/core";
import {
  RunAdHocQuery,
  GetEntityImage,
  GetRecentSearches,
  GetSavedSearches,
  AddRecentSearch,
  SaveSearch,
  DeleteSavedSearch,
  RemoveRecentSearch,
} from "@wailsjs/go/main/App.js";
import {
  SearchEntities,
  SearchEntitiesWithOptions,
  GetRelationships,
  GetEntity,
  GetAllEntities,
} from "@wailsjs/go/services/EntityService";
import { LogInfo } from "@wailsjs/runtime/runtime.js";
import { Search as SearchIcon, Save, Trash2 } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { DefinitionRenderer } from "@components/ItemDetail/DefinitionRenderer";
import { useUIStore } from "@stores/useUIStore";
import { database } from "@models";

interface SavedSearch {
  name: string;
  query: string;
  types?: string[];
  source?: string;
}

// Helper to get first sentence from description
const getFirstSentence = (text: string | null | undefined): string => {
  if (!text) return "No description";
  const match = text.match(/^[^.!?]+[.!?]/);
  return match
    ? match[0] + "..."
    : text.length > 100
      ? text.substring(0, 100) + "..."
      : text;
};

const SearchResultImage = ({ id }: { id: number }) => {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    GetEntityImage(id).then(setImage);
  }, [id]);

  if (!image) return null;

  return (
    <img
      src={image}
      alt="Writer"
      style={{
        width: 50,
        height: 50,
        objectFit: "cover",
        borderRadius: 4,
        marginRight: 12,
        flexShrink: 0,
      }}
    />
  );
};

export default function Search() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const { currentSearch, setCurrentSearch } = useUIStore();
  const [query, setQuery] = useState(currentSearch || "");
  const [debouncedQuery, setDebouncedQuery] = useState(currentSearch || "");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [useRegex, setUseRegex] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [hasTts, setHasTts] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [showAllResults, setShowAllResults] = useState(false);
  const [allItems, setAllItems] = useState<database.Entity[]>([]);
  const navigate = useNavigate();
  const resultRefs = useRef<(HTMLElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // Debounce search query with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      // Treat '*' as wildcard (empty query to return all records)
      if (query === "*") {
        setDebouncedQuery("");
      }
      // Only search if query is at least 2 characters
      else if (query.length >= 2) {
        setDebouncedQuery(query);
      } else {
        setDebouncedQuery("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Save current search to settings whenever it changes
  useEffect(() => {
    setCurrentSearch(debouncedQuery);
  }, [debouncedQuery, setCurrentSearch]);

  // Load recent and saved searches on mount
  useEffect(() => {
    GetRecentSearches().then((searches) => {
      setRecentSearches(searches || []);
    });
    GetSavedSearches().then((searches) => {
      setSavedSearches(searches || []);
    });
    GetAllEntities().then((items) => {
      setAllItems(items || []);
    });
  }, []);

  // Filter recent searches based on query
  const filteredRecentSearches = useMemo(() => {
    if (!query) return recentSearches;
    const lowerQuery = query.toLowerCase();
    return recentSearches.filter((search) =>
      search.toLowerCase().includes(lowerQuery),
    );
  }, [query, recentSearches]);

  const isSqlSearch = useMemo(() => {
    return debouncedQuery.trim().toUpperCase().startsWith("SELECT");
  }, [debouncedQuery]);

  const {
    data: results,
    isLoading,
    error,
  } = useQuery<database.Entity[] | Record<string, unknown>[]>({
    queryKey: [
      "search",
      debouncedQuery,
      selectedTypes,
      selectedSource,
      useRegex,
      hasImage,
      hasTts,
      isSqlSearch,
    ],
    queryFn: () => {
      if (isSqlSearch) {
        return RunAdHocQuery(debouncedQuery);
      }
      // Use SearchEntitiesWithOptions if any filters are active or query is empty (wildcard)
      const hasFilters =
        selectedTypes.length > 0 ||
        selectedSource ||
        useRegex ||
        hasImage ||
        hasTts;
      if (hasFilters || debouncedQuery === "") {
        return SearchEntitiesWithOptions(
          debouncedQuery,
          selectedTypes,
          selectedSource,
        );
      }
      return SearchEntities(debouncedQuery, "");
    },
    enabled:
      debouncedQuery.length > 0 ||
      hasImage ||
      hasTts ||
      selectedTypes.length > 0 ||
      !!selectedSource,
    staleTime: 30000, // Cache results for 30 seconds
  });

  const { exactMatches, primaryLabelMatches, otherResults, allResults } =
    useMemo(() => {
      if (!results || results.length === 0) {
        return {
          exactMatches: [],
          primaryLabelMatches: [],
          otherResults: [],
          allResults: [],
        };
      }

      if (isSqlSearch) {
        return {
          exactMatches: [],
          primaryLabelMatches: [],
          otherResults: results,
          allResults: results,
          totalCount: results.length,
          hasMore: false,
        };
      }

      const normalizedQuery = debouncedQuery.trim().toLowerCase();

      const exact: database.Entity[] = [];
      const primaryLabels: database.Entity[] = [];
      const other: database.Entity[] = [];

      (results as database.Entity[]).forEach((item) => {
        const itemWord = item.primaryLabel.trim().toLowerCase();

        if (itemWord === normalizedQuery) {
          exact.push(item);
        } else {
          // Check if query matches a complete primaryLabel within the item's primaryLabel
          const itemWords = itemWord.split(/\s+/);
          if (itemWords.includes(normalizedQuery)) {
            primaryLabels.push(item);
          } else {
            other.push(item);
          }
        }
      });

      const all = [...exact, ...primaryLabels, ...other];

      // Limit results to 50 unless "Show All" is enabled
      const RESULT_LIMIT = 50;
      const limitedAll = showAllResults ? all : all.slice(0, RESULT_LIMIT);
      const hasMore = all.length > RESULT_LIMIT;

      return {
        exactMatches: exact,
        primaryLabelMatches: primaryLabels,
        otherResults: other,
        allResults: limitedAll,
        totalCount: all.length,
        hasMore: !showAllResults && hasMore,
      };
    }, [results, debouncedQuery, showAllResults, isSqlSearch]);

  // Fetch links for all result items to get writer names
  const linkQueries = useQueries({
    queries: ((results || []) as database.Entity[]).map((item) => ({
      queryKey: ["searchItemLinks", item.id],
      queryFn: async () => {
        const links = await GetRelationships(item.id);
        const outgoingLinks = links.filter((link) => link.sourceId === item.id);
        const writerItems = await Promise.all(
          outgoingLinks.map(async (link) => {
            const linkedItem = await GetEntity(link.targetId);
            return linkedItem?.typeSlug === "writer"
              ? linkedItem.primaryLabel
              : null;
          }),
        );
        return writerItems.filter(Boolean);
      },
      enabled: !!debouncedQuery && results && results.length > 0,
    })),
  });

  // Map item IDs to their writer names
  const itemWriters = useMemo(() => {
    const map: Record<number, string[]> = {};
    (results as database.Entity[] | undefined)?.forEach(
      (item, index: number) => {
        const writers =
          linkQueries[index]?.data?.filter((w): w is string => w !== null) ||
          [];
        map[item.id] = writers;
      },
    );
    return map;
  }, [results, linkQueries]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      setDebouncedQuery(trimmedQuery);
      await AddRecentSearch(trimmedQuery);
      // Update local state
      const searches = await GetRecentSearches();
      setRecentSearches(searches || []);

      // Blur input to allow arrow key navigation immediately
      searchInputRef.current?.blur();
    }
  };

  const handleRecentSearchClick = async (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    combobox.closeDropdown();
    await AddRecentSearch(term);
    const searches = await GetRecentSearches();
    setRecentSearches(searches || []);
  };

  const handleSaveSearch = async () => {
    if (!searchName || !query) {
      notifications.show({
        title: "Error",
        message: "Name and query required",
        color: "red",
      });
      return;
    }
    try {
      await SaveSearch(searchName, query, selectedTypes, selectedSource);
      const searches = await GetSavedSearches();
      setSavedSearches(searches || []);
      setSaveModalOpen(false);
      setSearchName("");
      notifications.show({
        title: "Success",
        message: "Search saved",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Error",
        message: String(err),
        color: "red",
      });
    }
  };

  const handleLoadSavedSearch = async (saved: SavedSearch) => {
    setQuery(saved.query);
    setDebouncedQuery(saved.query);
    setSelectedTypes(saved.types || []);
    setSelectedSource(saved.source || "");
    await AddRecentSearch(saved.query);
  };

  const handleDeleteSavedSearch = async (name: string) => {
    try {
      await DeleteSavedSearch(name);
      const searches = await GetSavedSearches();
      setSavedSearches(searches || []);
      notifications.show({
        title: "Success",
        message: "Search deleted",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Error",
        message: String(err),
        color: "red",
      });
    }
  };

  // Handle arrow key navigation in results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if we have results and input is not focused
      if (!allResults.length || combobox.dropdownOpened) return;

      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === "INPUT";

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.min(prev + 1, allResults.length - 1);
          resultRefs.current[next]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          resultRefs.current[next]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          return next;
        });
      } else if (e.key === "Enter" && !isInputFocused && selectedIndex >= 0) {
        e.preventDefault();
        const selectedItem = allResults[selectedIndex];
        if (selectedItem) {
          navigate(`/item/${selectedItem.id}?tab=detail`);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [allResults, selectedIndex, navigate, combobox.dropdownOpened]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
    resultRefs.current = [];
  }, [debouncedQuery]);

  // Handle Delete/Backspace key for removing recent searches
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // On macOS, the Delete key shows as 'Backspace' in the logs
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        combobox.dropdownOpened
      ) {
        const selectedIndex = combobox.selectedOptionIndex;
        LogInfo(
          `[Search] Delete/Backspace pressed, selectedIndex: ${selectedIndex}, filteredRecentSearches: ${JSON.stringify(filteredRecentSearches)}`,
        );

        if (
          selectedIndex !== undefined &&
          typeof selectedIndex === "number" &&
          selectedIndex >= 0 &&
          selectedIndex < filteredRecentSearches.length
        ) {
          e.preventDefault();
          const searchToDelete = filteredRecentSearches[selectedIndex];
          LogInfo(
            `[Search] Deleting recent search at index ${selectedIndex}: ${searchToDelete}`,
          );

          await RemoveRecentSearch(searchToDelete);
          const searches = await GetRecentSearches();
          setRecentSearches(searches || []);

          LogInfo(
            `[Search] Recent search deleted, remaining: ${searches?.length || 0}`,
          );
        } else {
          LogInfo(
            `[Search] Skipping delete - selectedIndex invalid: ${selectedIndex}`,
          );
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    combobox.dropdownOpened,
    combobox.selectedOptionIndex,
    filteredRecentSearches,
  ]);

  return (
    <Container size="lg">
      <Title order={1} mb="xl">
        Search
      </Title>

      <form onSubmit={handleSearch}>
        <Stack gap="xs" mb="xl">
          <Group align="flex-start" gap="md">
            <div style={{ flex: 1 }}>
              <Combobox
                store={combobox}
                onOptionSubmit={(value) => {
                  handleRecentSearchClick(value);
                }}
              >
                <Combobox.Target>
                  <TextInput
                    ref={searchInputRef}
                    leftSection={<SearchIcon size={20} />}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      combobox.openDropdown();
                      combobox.updateSelectedOptionIndex();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" && !combobox.dropdownOpened) {
                        e.preventDefault();
                        combobox.openDropdown();
                      }
                    }}
                    onFocus={() => {
                      if (filteredRecentSearches.length > 0) {
                        combobox.openDropdown();
                      }
                    }}
                    onBlur={() => combobox.closeDropdown()}
                    placeholder="Search primaryLabels, descriptions, derivations..."
                    size="lg"
                    autoFocus
                  />
                </Combobox.Target>

                <Combobox.Dropdown>
                  <Combobox.Options>
                    {filteredRecentSearches.length > 0 ? (
                      filteredRecentSearches.map((search) => (
                        <Combobox.Option value={search} key={search}>
                          {search}
                        </Combobox.Option>
                      ))
                    ) : (
                      <Combobox.Empty>No recent searches</Combobox.Empty>
                    )}
                  </Combobox.Options>
                </Combobox.Dropdown>
              </Combobox>
            </div>

            <Accordion variant="contained" style={{ minWidth: "200px" }}>
              <Accordion.Item value="advanced">
                <Accordion.Control>Advanced Options</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Type Filters
                      </Text>
                      <Group>
                        <Checkbox
                          label="Reference"
                          checked={selectedTypes.includes("Reference")}
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              setSelectedTypes([...selectedTypes, "Reference"]);
                            } else {
                              setSelectedTypes(
                                selectedTypes.filter((t) => t !== "Reference"),
                              );
                            }
                          }}
                        />
                        <Checkbox
                          label="Writer"
                          checked={selectedTypes.includes("Writer")}
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              setSelectedTypes([...selectedTypes, "Writer"]);
                            } else {
                              setSelectedTypes(
                                selectedTypes.filter((t) => t !== "Writer"),
                              );
                            }
                          }}
                        />
                        <Checkbox
                          label="Title"
                          checked={selectedTypes.includes("Title")}
                          onChange={(e) => {
                            if (e.currentTarget.checked) {
                              setSelectedTypes([...selectedTypes, "Title"]);
                            } else {
                              setSelectedTypes(
                                selectedTypes.filter((t) => t !== "Title"),
                              );
                            }
                          }}
                        />
                      </Group>
                    </div>

                    <Switch
                      label="Regex Mode"
                      description="Use regular expressions instead of full-text search"
                      checked={useRegex}
                      onChange={(e) => setUseRegex(e.currentTarget.checked)}
                    />

                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Media Filters
                      </Text>
                      <Group>
                        <Checkbox
                          label="Has Image"
                          checked={hasImage}
                          onChange={(e) => setHasImage(e.currentTarget.checked)}
                        />
                        <Checkbox
                          label="Has TTS"
                          checked={hasTts}
                          onChange={(e) => setHasTts(e.currentTarget.checked)}
                        />
                      </Group>
                    </div>

                    <div>
                      <Text size="sm" fw={500} mb="xs">
                        Saved Searches
                      </Text>
                      {savedSearches.length > 0 ? (
                        <Stack gap="xs">
                          {savedSearches.map((saved) => (
                            <Group key={saved.name} justify="space-between">
                              <Button
                                variant="light"
                                size="xs"
                                onClick={() => handleLoadSavedSearch(saved)}
                              >
                                {saved.name}
                              </Button>
                              <Button
                                variant="subtle"
                                size="xs"
                                color="red"
                                onClick={() =>
                                  handleDeleteSavedSearch(saved.name)
                                }
                              >
                                <Trash2 size={14} />
                              </Button>
                            </Group>
                          ))}
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No saved searches
                        </Text>
                      )}
                      <Button
                        leftSection={<Save size={16} />}
                        size="xs"
                        variant="outline"
                        mt="xs"
                        onClick={() => setSaveModalOpen(true)}
                        disabled={!query}
                      >
                        Save Current Search
                      </Button>
                    </div>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Group>

          <Text size="sm" c="dimmed">
            Full-text search across primaryLabels, descriptions, and
            derivations. Supports AND, OR, NOT, and parentheses.
          </Text>
        </Stack>
      </form>

      <Modal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Search"
      >
        <Stack>
          <TextInput
            label="Search Name"
            placeholder="My search..."
            value={searchName}
            onChange={(e) => setSearchName(e.currentTarget.value)}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch}>Save</Button>
          </Group>
        </Stack>
      </Modal>

      {error && isSqlSearch && (
        <Paper p="md" withBorder c="red" bg="red.0" mb="md">
          <Text fw={500}>Query Error</Text>
          <Text size="sm">{String(error)}</Text>
        </Paper>
      )}

      {isLoading && (
        <Center p="xl">
          <Loader size="xl" />
        </Center>
      )}

      {results && results.length > 0 && (
        <Stack>
          <Text size="sm" c="dimmed">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </Text>

          {isSqlSearch ? (
            <Stack>
              {(results as Record<string, unknown>[]).map(
                (row, index: number) => {
                  const item = { ...row } as Record<string, unknown> &
                    Partial<database.Entity>;
                  if ("item_id" in item && item.item_id && !item.id) {
                    item.id = item.item_id as number;
                  }
                  const isItem = item.id && item.primaryLabel;

                  return (
                    <Paper
                      key={index}
                      p="md"
                      withBorder
                      shadow="sm"
                      radius="md"
                    >
                      {isItem ? (
                        <Stack gap="xs">
                          <Group justify="space-between" align="flex-start">
                            <Group align="flex-start" wrap="nowrap">
                              {item.typeSlug === "writer" && item.id && (
                                <SearchResultImage id={item.id} />
                              )}
                              <Link
                                to={`/item/${item.id ?? 0}?tab=detail`}
                                style={{
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                              >
                                <Title order={3}>{item.primaryLabel}</Title>
                              </Link>
                            </Group>
                            {item.typeSlug && <Badge>{item.typeSlug}</Badge>}
                          </Group>
                          {item.description && (
                            <DefinitionRenderer
                              text={getFirstSentence(
                                item.description as string,
                              )}
                              allEntities={allItems}
                              stopAudio={() => {}}
                              currentAudioRef={audioRef}
                              entity={item as database.Entity}
                            />
                          )}
                        </Stack>
                      ) : (
                        <Stack gap="xs">
                          {Object.entries(row).map(([k, v]) => (
                            <Group key={k} align="flex-start">
                              <Text
                                fw={700}
                                size="sm"
                                style={{ minWidth: 100 }}
                              >
                                {k}:
                              </Text>
                              <Text
                                size="sm"
                                style={{ primaryLabelBreak: "break-all" }}
                              >
                                {String(v)}
                              </Text>
                            </Group>
                          ))}
                        </Stack>
                      )}
                    </Paper>
                  );
                },
              )}
            </Stack>
          ) : (
            <>
              {exactMatches.length > 0 && (
                <>
                  {exactMatches.map((item, index: number) => {
                    const globalIndex = index;
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <Paper
                        key={item.id}
                        ref={(el: HTMLElement | null) => {
                          resultRefs.current[globalIndex] = el;
                        }}
                        component={Link}
                        to={`/item/${item.id}?tab=detail`}
                        shadow="sm"
                        p="md"
                        radius="md"
                        withBorder
                        style={{
                          textDecoration: "none",
                          color: "var(--mantine-color-text)",
                          backgroundColor: isSelected
                            ? isDark
                              ? "var(--mantine-color-dark-6)"
                              : "var(--mantine-color-blue-0)"
                            : undefined,
                          borderColor: isSelected
                            ? isDark
                              ? "var(--mantine-color-dark-4)"
                              : "var(--mantine-color-blue-5)"
                            : undefined,
                          borderWidth: isSelected ? "2px" : undefined,
                        }}
                      >
                        <Stack gap="xs">
                          <Group align="flex-start" wrap="nowrap">
                            {item.typeSlug === "writer" && (
                              <SearchResultImage id={item.id} />
                            )}
                            <Title
                              order={3}
                              c={
                                isDark
                                  ? "var(--mantine-color-blue-2)"
                                  : "var(--mantine-color-blue-7)"
                              }
                            >
                              {item.primaryLabel}
                            </Title>
                          </Group>
                          <div>
                            {item.description ? (
                              <DefinitionRenderer
                                text={getFirstSentence(item.description)}
                                allEntities={allItems}
                                stopAudio={() => {}}
                                currentAudioRef={audioRef}
                                entity={item}
                              />
                            ) : (
                              <Text component="span">No description</Text>
                            )}
                            {itemWriters[item.id]?.length > 0 && (
                              <Text component="span" size="sm" c="dimmed">
                                {" "}
                                Writers: {itemWriters[item.id].join(", ")}
                              </Text>
                            )}
                          </div>
                          <Group>
                            <Badge>{item.typeSlug}</Badge>
                            {item.attributes?.source && (
                              <Text size="xs" c="dimmed">
                                Source: {item.attributes.source}
                              </Text>
                            )}
                          </Group>
                        </Stack>
                      </Paper>
                    );
                  })}

                  {(primaryLabelMatches.length > 0 ||
                    otherResults.length > 0) && (
                    <Divider
                      my="md"
                      label="Word Matches"
                      labelPosition="center"
                    />
                  )}
                </>
              )}

              {primaryLabelMatches.map((item, index: number) => {
                const globalIndex = exactMatches.length + index;
                const isSelected = selectedIndex === globalIndex;
                return (
                  <Paper
                    key={item.id}
                    ref={(el: HTMLElement | null) => {
                      resultRefs.current[globalIndex] = el;
                    }}
                    component={Link}
                    to={`/item/${item.id}?tab=detail`}
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      textDecoration: "none",
                      color: "var(--mantine-color-text)",
                      backgroundColor: isSelected
                        ? isDark
                          ? "var(--mantine-color-dark-6)"
                          : "var(--mantine-color-blue-0)"
                        : undefined,
                      borderColor: isSelected
                        ? isDark
                          ? "var(--mantine-color-dark-4)"
                          : "var(--mantine-color-blue-5)"
                        : undefined,
                      borderWidth: isSelected ? "2px" : undefined,
                    }}
                  >
                    <Stack gap="xs">
                      <Group align="flex-start" wrap="nowrap">
                        {item.typeSlug === "writer" && (
                          <SearchResultImage id={item.id} />
                        )}
                        <Title
                          order={3}
                          c={
                            isDark
                              ? "var(--mantine-color-blue-2)"
                              : "var(--mantine-color-blue-7)"
                          }
                        >
                          {item.primaryLabel}
                        </Title>
                      </Group>
                      <div>
                        {item.description ? (
                          <DefinitionRenderer
                            text={getFirstSentence(item.description)}
                            allEntities={allItems}
                            stopAudio={() => {}}
                            currentAudioRef={audioRef}
                            entity={item}
                          />
                        ) : (
                          <Text component="span">No description</Text>
                        )}
                        {itemWriters[item.id]?.length > 0 && (
                          <Text component="span" size="sm" c="dimmed">
                            {" "}
                            Writers: {itemWriters[item.id].join(", ")}
                          </Text>
                        )}
                      </div>
                      <Group>
                        <Badge>{item.typeSlug}</Badge>
                        {item.attributes?.source && (
                          <Text size="xs" c="dimmed">
                            Source: {item.attributes.source}
                          </Text>
                        )}
                      </Group>
                    </Stack>
                  </Paper>
                );
              })}

              {primaryLabelMatches.length > 0 && otherResults.length > 0 && (
                <Divider my="md" label="Other Results" labelPosition="center" />
              )}

              {otherResults.map((item, index: number) => {
                const globalIndex =
                  exactMatches.length + primaryLabelMatches.length + index;
                const isSelected = selectedIndex === globalIndex;
                const id = item.id as number;
                return (
                  <Paper
                    key={id}
                    ref={(el: HTMLElement | null) => {
                      resultRefs.current[globalIndex] = el;
                    }}
                    component={Link}
                    to={`/item/${id}?tab=detail`}
                    shadow="sm"
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      textDecoration: "none",
                      color: "var(--mantine-color-text)",
                      backgroundColor: isSelected
                        ? isDark
                          ? "var(--mantine-color-dark-6)"
                          : "var(--mantine-color-blue-0)"
                        : undefined,
                      borderColor: isSelected
                        ? isDark
                          ? "var(--mantine-color-dark-4)"
                          : "var(--mantine-color-blue-5)"
                        : undefined,
                      borderWidth: isSelected ? "2px" : undefined,
                    }}
                  >
                    <Stack gap="xs">
                      <Group align="flex-start" wrap="nowrap">
                        {item.typeSlug === "writer" && (
                          <SearchResultImage id={id} />
                        )}
                        <Title
                          order={3}
                          c={
                            isDark
                              ? "var(--mantine-color-blue-2)"
                              : "var(--mantine-color-blue-7)"
                          }
                        >
                          {item.primaryLabel as React.ReactNode}
                        </Title>
                      </Group>
                      <div>
                        {item.description ? (
                          <DefinitionRenderer
                            text={getFirstSentence(item.description as string)}
                            allEntities={allItems}
                            stopAudio={() => {}}
                            currentAudioRef={audioRef}
                            entity={item as database.Entity}
                          />
                        ) : (
                          <Text component="span">No description</Text>
                        )}
                        {itemWriters[id] && itemWriters[id].length > 0 && (
                          <Text component="span" size="sm" c="dimmed">
                            {" "}
                            Writers: {itemWriters[id].join(", ")}
                          </Text>
                        )}
                      </div>
                      <Group>
                        {item.typeSlug ? (
                          <Badge>{String(item.typeSlug)}</Badge>
                        ) : null}
                        {(item.attributes as Record<string, unknown>)
                          ?.source ? (
                          <Text size="xs" c="dimmed">
                            Source:{" "}
                            {String(
                              (item.attributes as Record<string, unknown>)
                                .source,
                            )}
                          </Text>
                        ) : null}
                      </Group>
                    </Stack>
                  </Paper>
                );
              })}
            </>
          )}
        </Stack>
      )}

      {/* Show More Button and Result Count */}
      {allResults && allResults.length > 0 && (
        <Center mt="md">
          <Stack align="center" gap="xs">
            <Text size="sm" c="dimmed">
              Showing {allResults.length} of{" "}
              {(results as database.Entity[])?.length || allResults.length}{" "}
              results
            </Text>
            {allResults.length <
              ((results as database.Entity[])?.length || 0) && (
              <Button variant="light" onClick={() => setShowAllResults(true)}>
                Show All Results
              </Button>
            )}
          </Stack>
        </Center>
      )}

      {debouncedQuery && results && results.length === 0 && !isLoading && (
        <Center p="xl">
          <Stack align="center">
            <Text size="lg" c="dimmed">
              No results found
            </Text>
            <Text size="sm" c="dimmed">
              Try a different search term or use fewer than 2 characters
            </Text>
          </Stack>
        </Center>
      )}

      {!debouncedQuery && (
        <Center p="xl">
          <Stack align="center">
            <SearchIcon size={48} />
            <Text size="lg" c="dimmed">
              Start typing to search
            </Text>
          </Stack>
        </Center>
      )}
    </Container>
  );
}
