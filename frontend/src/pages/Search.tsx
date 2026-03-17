import {
  Container,
  Title,
  Text,
  Loader,
  Stack,
  Paper,
  Group,
  Center,
  Divider,
  Combobox,
  TextInput,
  Button,
  useMantineColorScheme,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { db } from "@models";
import { SearchResultCard } from "@components/Search/SearchResultCard";
import { SearchFilters } from "@components/Search/SearchFilters";
import { SaveSearchModal } from "@components/Search/SaveSearchModal";
import { SqlResultsList } from "@components/Search/SqlResultsList";
import { useSearchLogic } from "@components/Search/useSearchLogic";

export default function Search() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const {
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
  } = useSearchLogic();

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
                    leftSection={<IconSearch size={20} />}
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

            <SearchFilters
              selectedTypes={selectedTypes}
              setSelectedTypes={setSelectedTypes}
              useRegex={useRegex}
              setUseRegex={setUseRegex}
              hasImage={hasImage}
              setHasImage={setHasImage}
              hasTts={hasTts}
              setHasTts={setHasTts}
              savedSearches={savedSearches}
              onLoadSavedSearch={handleLoadSavedSearch}
              onDeleteSavedSearch={handleDeleteSavedSearch}
              onOpenSaveModal={() => setSaveModalOpen(true)}
              query={query}
            />
          </Group>

          <Text size="sm" c="dimmed">
            Full-text search across primaryLabels, descriptions, and
            derivations. Supports AND, OR, NOT, and parentheses.
          </Text>
        </Stack>
      </form>

      <SaveSearchModal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        searchName={searchName}
        onSearchNameChange={setSearchName}
        onSave={handleSaveSearch}
      />

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
            <SqlResultsList
              results={results as Record<string, unknown>[]}
              allItems={allItems}
              audioRef={audioRef}
            />
          ) : (
            <>
              {exactMatches.length > 0 && (
                <>
                  {exactMatches.map((item, index: number) => {
                    const globalIndex = index;
                    return (
                      <SearchResultCard
                        key={item.id}
                        item={item}
                        globalIndex={globalIndex}
                        isSelected={selectedIndex === globalIndex}
                        isDark={isDark}
                        itemWriters={itemWriters}
                        allItems={allItems}
                        audioRef={audioRef}
                        resultRefs={resultRefs}
                      />
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
                return (
                  <SearchResultCard
                    key={item.id}
                    item={item}
                    globalIndex={globalIndex}
                    isSelected={selectedIndex === globalIndex}
                    isDark={isDark}
                    itemWriters={itemWriters}
                    allItems={allItems}
                    audioRef={audioRef}
                    resultRefs={resultRefs}
                  />
                );
              })}

              {primaryLabelMatches.length > 0 && otherResults.length > 0 && (
                <Divider my="md" label="Other Results" labelPosition="center" />
              )}

              {otherResults.map((item, index: number) => {
                const globalIndex =
                  exactMatches.length + primaryLabelMatches.length + index;
                return (
                  <SearchResultCard
                    key={item.id as number}
                    item={item}
                    globalIndex={globalIndex}
                    isSelected={selectedIndex === globalIndex}
                    isDark={isDark}
                    itemWriters={itemWriters}
                    allItems={allItems}
                    audioRef={audioRef}
                    resultRefs={resultRefs}
                  />
                );
              })}
            </>
          )}
        </Stack>
      )}

      {allResults && allResults.length > 0 && (
        <Center mt="md">
          <Stack align="center" gap="xs">
            <Text size="sm" c="dimmed">
              Showing {allResults.length} of{" "}
              {(results as db.Entity[])?.length || allResults.length} results
            </Text>
            {allResults.length < ((results as db.Entity[])?.length || 0) && (
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
            <IconSearch size={48} />
            <Text size="lg" c="dimmed">
              Start typing to search
            </Text>
          </Stack>
        </Center>
      )}
    </Container>
  );
}
