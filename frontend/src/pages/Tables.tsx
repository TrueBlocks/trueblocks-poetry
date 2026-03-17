import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Select,
  Pagination,
  Loader,
  Group,
  TextInput,
  Alert,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GetEntityImage, AddRecentSearch } from "@wailsjs/go/app/App";
import {
  GetEntity,
  UpdateEntity,
  GetAllEntities,
} from "@wailsjs/go/services/EntityService";
import { LogError } from "@wailsjs/runtime/runtime.js";
import { LogError as UtilsLogError } from "@utils/logger";
import { IconSearch, IconAlertTriangle } from "@tabler/icons-react";
import { useUI } from "@/contexts/UIContext";
import { TableData, SortState } from "@/components/Tables/tableTypes";
import { SortableTable } from "@/components/Tables/SortableTable";
import {
  useItemsColumns,
  useAdHocColumns,
  getColumnsForTable,
  getKeyField,
} from "@/components/Tables/tableColumns";
import {
  createHandleColumnClick,
  createGetSortIcon,
  createGetSortIndicator,
} from "@/components/Tables/tableSorting";
import { getCurrentData } from "@/components/Tables/tableDataUtils";
import { useTableData } from "@/hooks/useTableData";

const ITEMS_PER_PAGE = 15;

export default function Tables() {
  const [searchParams] = useSearchParams();
  const {
    lastTable,
    setLastTable,
    tableSorts,
    setTableSort,
    currentSearch,
    setCurrentSearch,
  } = useUI();
  const [selectedTable, setSelectedTable] = useState<string>(
    lastTable || "items",
  );
  const [filterType, setFilterType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(currentSearch || "");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 500);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInitialized = useRef(false);

  const sortState: SortState = (tableSorts[
    selectedTable
  ] as unknown as SortState) || {
    field1: "",
    dir1: "",
    field2: "",
    dir2: "",
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "/" || e.key === "?")) {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const tableParam = searchParams.get("table");
    const filterParam = searchParams.get("filter");
    const sqlParam = searchParams.get("sql");

    if (tableParam) {
      setSelectedTable(tableParam);
    }

    if (filterParam) {
      setFilterType(filterParam);
    } else {
      setFilterType(null);
    }

    if (sqlParam) {
      setSearchQuery(sqlParam);
      setSelectedTable("adhoc");
    }
  }, [searchParams]);

  const isSqlSearch = useMemo(() => {
    return debouncedSearchQuery.trim().toUpperCase().startsWith("SELECT");
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (isSqlSearch && selectedTable !== "adhoc") {
      setSelectedTable("adhoc");
    }
  }, [isSqlSearch, selectedTable]);

  const {
    allEntities,
    setAllEntities,
    allLinks,
    allSources,
    adHocResults,
    setAdHocResults,
    adHocError,
    clichesData,
    namesData,
    literaryTermsData,
    isLoading,
    loadAdHocData,
  } = useTableData(
    selectedTable,
    isSqlSearch,
    debouncedSearchQuery,
    searchInitialized,
    setSearchQuery,
  );

  const linkCounts = useMemo(() => {
    if (!allLinks || selectedTable !== "items") return {};

    const counts: Record<number, { incoming: number; outgoing: number }> = {};
    allLinks.forEach((link) => {
      if (!counts[link.sourceId]) {
        counts[link.sourceId] = { incoming: 0, outgoing: 0 };
      }
      if (!counts[link.targetId]) {
        counts[link.targetId] = { incoming: 0, outgoing: 0 };
      }
      counts[link.sourceId].outgoing++;
      counts[link.targetId].incoming++;
    });
    return counts;
  }, [allLinks, selectedTable]);

  const [itemImages, setItemImages] = useState<Record<number, string | null>>(
    {},
  );

  const titleToWriter = useMemo(() => {
    if (!allEntities || !allLinks) return new Map<number, number>();

    const itemTypes = new Map<number, string>();
    allEntities.forEach((i) => itemTypes.set(i.id, i.typeSlug));

    const map = new Map<number, number>();

    allLinks.forEach((l) => {
      const sType = (itemTypes.get(l.sourceId) || "").toLowerCase();
      const dType = (itemTypes.get(l.targetId) || "").toLowerCase();

      if (sType === "title" && dType === "writer") {
        map.set(l.sourceId, l.targetId);
      } else if (dType === "title" && sType === "writer") {
        map.set(l.targetId, l.sourceId);
      }
    });

    return map;
  }, [allEntities, allLinks]);

  const writersWithPoems = useMemo(() => {
    const writers = new Set<number>();
    if (!titleToWriter || !allEntities) return writers;

    const poemTitles = new Set<number>();
    allEntities.forEach((e) => {
      if (e.typeSlug === "title" && e.description) {
        const openBrackets = (e.description.match(/\[/g) || []).length;
        const closeBrackets = (e.description.match(/\]/g) || []).length;
        if (openBrackets > 0 && openBrackets === closeBrackets) {
          poemTitles.add(e.id);
        }
      }
    });

    titleToWriter.forEach((writerId, titleId) => {
      if (poemTitles.has(titleId)) {
        writers.add(writerId);
      }
    });
    return writers;
  }, [titleToWriter, allEntities]);

  const handleColumnClick = createHandleColumnClick(
    sortState,
    setTableSort,
    selectedTable,
  );
  const getSortIcon = createGetSortIcon(sortState);
  const getSortIndicator = createGetSortIndicator(sortState);

  const handleMarkToggle = useCallback(
    async (id: number, currentMark: string | null) => {
      const newMark = currentMark === "1" ? "0" : "1";
      try {
        if (selectedTable === "adhoc") {
          setAdHocResults([]);
        }

        const entity = await GetEntity(id);
        if (entity) {
          if (!entity.attributes) entity.attributes = {};
          entity.attributes.mark = newMark;
          await UpdateEntity(entity);
        }
        GetAllEntities()
          .then(setAllEntities)
          .catch(() => {});
        if (selectedTable === "adhoc") {
          loadAdHocData();
        }
      } catch (error) {
        UtilsLogError(`Failed to toggle mark: ${error}`);
      }
    },
    [selectedTable, loadAdHocData, setAdHocResults, setAllEntities],
  );

  const itemsColumns = useItemsColumns(handleMarkToggle);
  const adHocColumns = useAdHocColumns(adHocResults, itemsColumns);

  const { data, total, totalPages } = getCurrentData({
    selectedTable,
    allEntities,
    allLinks,
    clichesData,
    namesData,
    literaryTermsData,
    allSources,
    adHocResults,
    filterType,
    writersWithPoems,
    searchQuery,
    sortState,
    linkCounts,
    currentPage,
  });

  useEffect(() => {
    if (selectedTable !== "items" || !data) return;

    const fetchImages = async () => {
      const idsToFetch = new Set<number>();

      data.forEach((row: TableData) => {
        const typeSlug = String(row.typeSlug || "").toLowerCase();
        if (typeSlug === "writer") {
          idsToFetch.add(row.id as number);
        } else if (typeSlug === "title") {
          const writerId = titleToWriter.get(row.id as number);
          if (writerId) idsToFetch.add(writerId);
        }
      });

      const missingIds = Array.from(idsToFetch).filter(
        (id) => itemImages[id] === undefined,
      );

      if (missingIds.length === 0) return;

      const newImages: Record<number, string | null> = {};

      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const img = await GetEntityImage(id);
            newImages[id] = img || null;
          } catch (error) {
            LogError(`Failed to load image for item ${id}: ${error}`);
            newImages[id] = null;
          }
        }),
      );

      setItemImages((prev) => ({ ...prev, ...newImages }));
    };

    fetchImages();
  }, [data, selectedTable, titleToWriter, itemImages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setCurrentSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, setCurrentSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const step = e.repeat ? 3 : 1;
        setCurrentPage((prev) => Math.max(1, prev - step));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const step = e.repeat ? 3 : 1;
        setCurrentPage((prev) => Math.min(totalPages, prev + step));
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentPage(totalPages);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  useEffect(() => {
    if (lastTable && !searchParams.get("table")) {
      setSelectedTable(lastTable);
    }
  }, [lastTable, searchParams]);

  const handleTableChange = (value: string | null) => {
    if (value) {
      setSelectedTable(value);
      setCurrentPage(1);
      setLastTable(value);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim().length > 0) {
      AddRecentSearch(searchQuery.trim());
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">
            Data Tables
          </Title>
          <Text c="dimmed">Browse and manage database tables</Text>
        </div>

        <Paper p="lg" withBorder>
          <Stack gap="md">
            <Group justify="space-between" align="flex-end">
              <Group align="flex-end">
                <TextInput
                  ref={searchInputRef}
                  placeholder="Search table..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  onKeyDown={handleSearchKeyDown}
                  style={{ width: 300 }}
                />
                <Select
                  label="Select Table"
                  value={selectedTable}
                  onChange={handleTableChange}
                  data={[
                    { value: "items", label: "Entities" },
                    { value: "links", label: "Relationships" },
                    { value: "cliches", label: "Clich\u00e9s" },
                    { value: "names", label: "Names" },
                    { value: "literaryTerms", label: "Literary Terms" },
                    { value: "sources", label: "Sources" },
                    { value: "adhoc", label: "Ad Hoc Query" },
                  ]}
                  style={{ width: 200 }}
                />
              </Group>

              {selectedTable === "adhoc" && adHocError && (
                <Alert
                  icon={<IconAlertTriangle size={16} />}
                  title="Query Error"
                  color="red"
                  variant="light"
                  mb="md"
                  style={{ width: "100%" }}
                >
                  <Text size="sm">{String(adHocError)}</Text>
                </Alert>
              )}

              <Group align="center">
                {!isLoading && totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={setCurrentPage}
                    size="sm"
                  />
                )}
                {!isLoading && (
                  <Text size="sm" c="dimmed">
                    Showing{" "}
                    {data.length > 0
                      ? (currentPage - 1) * ITEMS_PER_PAGE + 1
                      : 0}
                    -{Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total}{" "}
                    records
                  </Text>
                )}
              </Group>
            </Group>

            {isLoading && (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Loader />
              </div>
            )}

            {!isLoading && data.length > 0 && (
              <SortableTable
                tableName={selectedTable}
                columns={getColumnsForTable(
                  selectedTable,
                  itemsColumns,
                  adHocColumns,
                )}
                data={data}
                keyField={getKeyField(selectedTable, adHocColumns)}
                sortState={sortState}
                onSort={handleColumnClick}
                getSortIcon={getSortIcon}
                getSortIndicator={getSortIndicator}
                extraData={{ linkCounts, itemImages, titleToWriter }}
                useIndexAsKey={selectedTable === "adhoc"}
              />
            )}

            {!isLoading && data.length === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                No records found
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
