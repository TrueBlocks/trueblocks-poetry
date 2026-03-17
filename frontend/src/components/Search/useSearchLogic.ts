import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCombobox } from "@mantine/core";
import {
  RunAdHocQuery,
  GetRecentSearches,
  GetSavedSearches,
  AddRecentSearch,
  SaveSearch,
  DeleteSavedSearch,
  RemoveRecentSearch,
} from "@wailsjs/go/app/App";
import {
  SearchEntities,
  SearchEntitiesWithOptions,
  GetRelationships,
  GetEntity,
  GetAllEntities,
} from "@wailsjs/go/services/EntityService";
import { LogInfo } from "@wailsjs/runtime/runtime.js";
import { notifications } from "@mantine/notifications";
import { useUI } from "@/contexts/UIContext";
import { db } from "@models";
import { settings } from "@models";

export function useSearchLogic() {
  const { currentSearch, setCurrentSearch } = useUI();
  const [query, setQuery] = useState(currentSearch || "");
  const [debouncedQuery, setDebouncedQuery] = useState(currentSearch || "");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<settings.SavedSearch[]>(
    [],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [useRegex, setUseRegex] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [hasTts, setHasTts] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [showAllResults, setShowAllResults] = useState(false);
  const [allItems, setAllItems] = useState<db.Entity[]>([]);
  const navigate = useNavigate();
  const resultRefs = useRef<(HTMLElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query === "*") {
        setDebouncedQuery("");
      } else if (query.length >= 2) {
        setDebouncedQuery(query);
      } else {
        setDebouncedQuery("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setCurrentSearch(debouncedQuery);
  }, [debouncedQuery, setCurrentSearch]);

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

  const [results, setResults] = useState<
    db.Entity[] | Record<string, unknown>[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const shouldSearch =
      debouncedQuery.length > 0 ||
      hasImage ||
      hasTts ||
      selectedTypes.length > 0 ||
      !!selectedSource;

    if (!shouldSearch) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const doSearch = () => {
      if (isSqlSearch) {
        return RunAdHocQuery(debouncedQuery);
      }
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
    };

    doSearch()
      .then(setResults)
      .catch((e: Error) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [
    debouncedQuery,
    selectedTypes,
    selectedSource,
    useRegex,
    hasImage,
    hasTts,
    isSqlSearch,
  ]);

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

      const exact: db.Entity[] = [];
      const primaryLabels: db.Entity[] = [];
      const other: db.Entity[] = [];

      (results as db.Entity[]).forEach((item) => {
        const itemWord = item.primaryLabel.trim().toLowerCase();

        if (itemWord === normalizedQuery) {
          exact.push(item);
        } else {
          const itemWords = itemWord.split(/\s+/);
          if (itemWords.includes(normalizedQuery)) {
            primaryLabels.push(item);
          } else {
            other.push(item);
          }
        }
      });

      const all = [...exact, ...primaryLabels, ...other];

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

  const [itemWriters, setItemWriters] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (!debouncedQuery || !results || results.length === 0) {
      setItemWriters({});
      return;
    }

    const fetchWriters = async () => {
      const map: Record<number, string[]> = {};
      await Promise.all(
        ((results || []) as db.Entity[]).map(async (item) => {
          try {
            const links = await GetRelationships(item.id);
            const outgoingLinks = links.filter(
              (link) => link.sourceId === item.id,
            );
            const writerItems = await Promise.all(
              outgoingLinks.map(async (link) => {
                const linkedItem = await GetEntity(link.targetId);
                return linkedItem?.typeSlug === "writer"
                  ? linkedItem.primaryLabel
                  : null;
              }),
            );
            map[item.id] = writerItems.filter((w): w is string => w !== null);
          } catch {
            map[item.id] = [];
          }
        }),
      );
      setItemWriters(map);
    };

    fetchWriters();
  }, [results, debouncedQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      setDebouncedQuery(trimmedQuery);
      await AddRecentSearch(trimmedQuery);
      const searches = await GetRecentSearches();
      setRecentSearches(searches || []);
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

  const handleLoadSavedSearch = async (saved: settings.SavedSearch) => {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  useEffect(() => {
    setSelectedIndex(0);
    resultRefs.current = [];
  }, [debouncedQuery]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
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

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    isLoading,
    error,
    isSqlSearch,
    exactMatches,
    primaryLabelMatches,
    otherResults,
    allResults,
    selectedIndex,
    selectedTypes,
    setSelectedTypes,
    useRegex,
    setUseRegex,
    hasImage,
    setHasImage,
    hasTts,
    setHasTts,
    saveModalOpen,
    setSaveModalOpen,
    searchName,
    setSearchName,
    showAllResults,
    setShowAllResults,
    allItems,
    itemWriters,
    savedSearches,
    resultRefs,
    audioRef,
    searchInputRef,
    combobox,
    filteredRecentSearches,
    handleSearch,
    handleRecentSearchClick,
    handleSaveSearch,
    handleLoadSavedSearch,
    handleDeleteSavedSearch,
  };
}
