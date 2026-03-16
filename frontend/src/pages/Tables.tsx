import {
  Container,
  Title,
  Text,
  Stack,
  Paper,
  Table,
  Select,
  Pagination,
  Badge,
  Anchor,
  Loader,
  Group,
  TextInput,
  Alert,
  Checkbox,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  GetAllSources,
  GetSettings,
  GetEntityImage,
  RunAdHocQuery,
  AddRecentSearch,
} from "@wailsjs/go/app/App";
import {
  GetEntity,
  UpdateEntity,
  GetAllEntities,
  GetAllRelationships,
} from "@wailsjs/go/services/EntityService";
import { LogError } from "@wailsjs/runtime/runtime.js";
import { db } from "@models";
import { LogError as UtilsLogError } from "@utils/logger";
import {
  IconArrowUp,
  IconArrowDown,
  IconArrowsUpDown,
  IconSearch,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useUI } from "@/contexts/UIContext";

// Table data can be any object type
type TableData = Record<string, unknown>;

// Extra data passed to render functions
interface ExtraData {
  linkCounts: Record<number, { incoming: number; outgoing: number }>;
  itemImages: Record<number, string | null>;
  titleToWriter: Map<number, number>;
}

const ITEMS_PER_PAGE = 15;

type SortDirection = "asc" | "desc" | "";

interface SortState {
  field1: string;
  dir1: SortDirection;
  field2: string;
  dir2: SortDirection;
}

interface ColumnDef {
  field: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string | number;
  render?: (row: TableData, allData?: ExtraData) => React.ReactNode;
}

interface SortableTableProps {
  tableName: string;
  columns: ColumnDef[];
  data: TableData[];
  keyField: string;
  sortState: SortState;
  onSort: (field: string) => void;
  getSortIcon: (field: string) => React.ReactNode;
  getSortIndicator: (field: string) => string;
  extraData?: ExtraData;
  useIndexAsKey?: boolean;
}

function SortableTable({
  columns,
  data,
  keyField,
  onSort,
  getSortIcon,
  getSortIndicator,
  extraData,
  useIndexAsKey,
}: SortableTableProps) {
  const SortableHeader = ({
    field,
    children,
    align,
    width,
  }: {
    field: string;
    children: React.ReactNode;
    align?: "left" | "right" | "center";
    width?: string | number;
  }) => {
    const style: React.CSSProperties = {
      cursor: "pointer",
      userSelect: "none",
      textAlign: align || "left",
      width: width,
    };

    return (
      <Table.Th style={style} onClick={() => onSort(field)}>
        <Group
          gap={4}
          wrap="nowrap"
          justify={align === "right" ? "flex-end" : "flex-start"}
        >
          {children}
          {getSortIcon(field)}
          {getSortIndicator(field) && (
            <Text size="xs" c="dimmed" fw={700}>
              {getSortIndicator(field)}
            </Text>
          )}
        </Group>
      </Table.Th>
    );
  };

  return (
    <Table
      striped
      highlightOnHover
      style={{ tableLayout: "fixed", width: "100%" }}
    >
      <Table.Thead>
        <Table.Tr>
          {columns.map((col) =>
            col.sortable !== false ? (
              <SortableHeader
                key={col.field}
                field={col.field}
                align={col.align}
                width={col.width}
              >
                {col.header}
              </SortableHeader>
            ) : (
              <Table.Th
                key={col.field}
                style={{ textAlign: col.align || "left", width: col.width }}
              >
                {col.header}
              </Table.Th>
            ),
          )}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.map((row, index: number) => (
          <Table.Tr
            key={useIndexAsKey ? `row-${index}` : String(row[keyField])}
          >
            {columns.map((col) => (
              <Table.Td
                key={col.field}
                style={{
                  textAlign: col.align || "left",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {col.render
                  ? col.render(row, extraData)
                  : (row[col.field] as React.ReactNode)}
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

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

  // Keyboard shortcut for search
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

  // Handle URL parameters
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

  // Determine if current search is SQL
  const isSqlSearch = useMemo(() => {
    return debouncedSearchQuery.trim().toUpperCase().startsWith("SELECT");
  }, [debouncedSearchQuery]);

  // Automatically switch to adhoc table if SQL is detected
  useEffect(() => {
    if (isSqlSearch && selectedTable !== "adhoc") {
      setSelectedTable("adhoc");
    }
  }, [isSqlSearch, selectedTable]);

  const [settings, setSettings] = useState<Awaited<
    ReturnType<typeof GetSettings>
  > | null>(null);
  const [allEntities, setAllEntities] = useState<db.Entity[] | null>(null);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [allLinks, setAllLinks] = useState<db.Relationship[] | null>(null);
  const [linksLoading, setLinksLoading] = useState(true);
  const [allSources, setAllSources] = useState<unknown[] | null>(null);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [adHocResults, setAdHocResults] = useState<TableData[] | null>(null);
  const [adHocLoading, setAdHocLoading] = useState(false);
  const [adHocError, setAdHocError] = useState<string | null>(null);
  const [clichesData, setClichesData] = useState<TableData[] | null>(null);
  const [clichesLoading, setClichesLoading] = useState(false);
  const [namesData, setNamesData] = useState<TableData[] | null>(null);
  const [namesLoading, setNamesLoading] = useState(false);
  const [literaryTermsData, setLiteraryTermsData] = useState<
    TableData[] | null
  >(null);
  const [literaryTermsLoading, setLiteraryTermsLoading] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      GetSettings()
        .then(setSettings)
        .catch(() => {});
    };
    loadSettings();
    const interval = setInterval(loadSettings, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (settings?.currentSearch !== undefined && !searchInitialized.current) {
      setSearchQuery(settings.currentSearch);
      searchInitialized.current = true;
    }
  }, [settings]);

  useEffect(() => {
    setEntitiesLoading(true);
    GetAllEntities()
      .then(setAllEntities)
      .catch(() => {})
      .finally(() => setEntitiesLoading(false));

    setLinksLoading(true);
    GetAllRelationships()
      .then(setAllLinks)
      .catch(() => {})
      .finally(() => setLinksLoading(false));
  }, []);

  useEffect(() => {
    if (selectedTable === "sources") {
      setSourcesLoading(true);
      GetAllSources()
        .then((s) => setAllSources(s as unknown as unknown[]))
        .catch(() => {})
        .finally(() => setSourcesLoading(false));
    }
  }, [selectedTable]);

  const loadAdHocData = useCallback(() => {
    if (selectedTable === "adhoc" && isSqlSearch) {
      setAdHocLoading(true);
      setAdHocError(null);
      RunAdHocQuery(debouncedSearchQuery)
        .then(setAdHocResults)
        .catch((e: Error) => setAdHocError(e.message))
        .finally(() => setAdHocLoading(false));
    }
  }, [selectedTable, isSqlSearch, debouncedSearchQuery]);

  useEffect(() => {
    loadAdHocData();
  }, [loadAdHocData]);

  useEffect(() => {
    if (selectedTable === "cliches") {
      setClichesLoading(true);
      RunAdHocQuery("SELECT * FROM cliches")
        .then(setClichesData)
        .catch(() => {})
        .finally(() => setClichesLoading(false));
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable === "names") {
      setNamesLoading(true);
      RunAdHocQuery("SELECT * FROM names")
        .then(setNamesData)
        .catch(() => {})
        .finally(() => setNamesLoading(false));
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable === "literaryTerms") {
      setLiteraryTermsLoading(true);
      RunAdHocQuery("SELECT * FROM literary_terms")
        .then(setLiteraryTermsData)
        .catch(() => {})
        .finally(() => setLiteraryTermsLoading(false));
    }
  }, [selectedTable]);

  const isLoading =
    entitiesLoading ||
    linksLoading ||
    sourcesLoading ||
    adHocLoading ||
    clichesLoading ||
    namesLoading ||
    literaryTermsLoading;

  // Calculate link counts for items
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

  // Map Title items to their Writer items
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

  // Pre-calculate writers with poems for the "poets" filter
  const writersWithPoems = useMemo(() => {
    const writers = new Set<number>();
    if (!titleToWriter || !allEntities) return writers;

    // Get all titles that are poems (have brackets in description)
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

    // Find writers linked to these poem titles
    titleToWriter.forEach((writerId, titleId) => {
      if (poemTitles.has(titleId)) {
        writers.add(writerId);
      }
    });
    return writers;
  }, [titleToWriter, allEntities]);

  // Handle column click for sorting
  const handleColumnClick = (field: string) => {
    let newState = { ...sortState };

    // If clicking the first sort field
    if (sortState.field1 === field) {
      // Cycle through: asc -> desc -> unsorted
      if (sortState.dir1 === "asc") {
        newState.dir1 = "desc";
      } else if (sortState.dir1 === "desc") {
        // Remove this field, promote field2 to field1
        newState.field1 = sortState.field2;
        newState.dir1 = sortState.dir2;
        newState.field2 = "";
        newState.dir2 = "";
      }
    }
    // If clicking the second sort field
    else if (sortState.field2 === field) {
      // Cycle through: asc -> desc -> unsorted
      if (sortState.dir2 === "asc") {
        newState.dir2 = "desc";
      } else if (sortState.dir2 === "desc") {
        newState.field2 = "";
        newState.dir2 = "";
      }
    }
    // Clicking a new field
    else {
      if (!sortState.field1) {
        // Set as primary sort
        newState.field1 = field;
        newState.dir1 = "asc";
      } else if (!sortState.field2) {
        // Set as secondary sort
        newState.field2 = field;
        newState.dir2 = "asc";
      } else {
        // Already have two sorts, replace the secondary
        newState.field2 = field;
        newState.dir2 = "asc";
      }
    }

    setTableSort(selectedTable, newState);
  };

  // Get sort icon for a column
  const getSortIcon = (field: string) => {
    if (sortState.field1 === field) {
      return sortState.dir1 === "asc" ? (
        <IconArrowUp size={14} />
      ) : (
        <IconArrowDown size={14} />
      );
    }
    if (sortState.field2 === field) {
      return sortState.dir2 === "asc" ? (
        <IconArrowUp size={14} />
      ) : (
        <IconArrowDown size={14} />
      );
    }
    return <IconArrowsUpDown size={14} style={{ opacity: 0.3 }} />;
  };

  // Get sort indicator (1 or 2)
  const getSortIndicator = (field: string) => {
    if (sortState.field1 === field) return "1";
    if (sortState.field2 === field) return "2";
    return "";
  };

  // Sort data
  const sortData = (data: TableData[]) => {
    if (!sortState.field1) return data;

    return [...data].sort((a, b) => {
      // Primary sort
      let result = compareValues(a, b, sortState.field1, sortState.dir1);

      // Secondary sort if primary is equal
      if (result === 0 && sortState.field2) {
        result = compareValues(a, b, sortState.field2, sortState.dir2);
      }

      return result;
    });
  };

  const compareValues = (
    a: TableData,
    b: TableData,
    field: string,
    dir: SortDirection,
  ) => {
    let aVal = a[field];
    let bVal = b[field];

    // Handle link counts for items table
    if (field === "nIncoming") {
      const aId = a.id as number;
      const bId = b.id as number;
      aVal = linkCounts[aId]?.incoming || 0;
      bVal = linkCounts[bId]?.incoming || 0;
    } else if (field === "nOutgoing") {
      const aId = a.id as number;
      const bId = b.id as number;
      aVal = linkCounts[aId]?.outgoing || 0;
      bVal = linkCounts[bId]?.outgoing || 0;
    }

    // Handle undefined/null
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return dir === "asc" ? 1 : -1;
    if (bVal == null) return dir === "asc" ? -1 : 1;

    // Compare based on type
    if (typeof aVal === "number" && typeof bVal === "number") {
      return dir === "asc" ? aVal - bVal : bVal - aVal;
    }

    // String comparison
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    const result = aStr.localeCompare(bStr);
    return dir === "asc" ? result : -result;
  };

  // Calculate pagination for current table
  const getCurrentData = () => {
    let sourceData: TableData[] = [];

    if (selectedTable === "items" && allEntities) {
      sourceData = allEntities as unknown as TableData[];
    } else if (selectedTable === "links" && allLinks) {
      sourceData = allLinks as unknown as TableData[];
    } else if (selectedTable === "cliches" && clichesData) {
      sourceData = clichesData;
    } else if (selectedTable === "names" && namesData) {
      sourceData = namesData;
    } else if (selectedTable === "literaryTerms" && literaryTermsData) {
      sourceData = literaryTermsData;
    } else if (selectedTable === "sources" && allSources) {
      sourceData = allSources as unknown as TableData[];
    } else if (selectedTable === "adhoc" && adHocResults) {
      sourceData = adHocResults;
    }

    // Apply URL filters
    if (filterType && selectedTable === "items") {
      sourceData = sourceData.filter((row: TableData) => {
        const typeSlug = String(row.typeSlug || "").toLowerCase();
        switch (filterType) {
          case "quotes":
            // Matches logic in pkg/parser/parser.go IsPoem()
            if (typeSlug !== "title" || !row.description) return false;
            const openBrackets = (
              (row.description as string)?.match(/\[/g) || []
            ).length;
            const closeBrackets = (
              (row.description as string)?.match(/\]/g) || []
            ).length;
            return openBrackets > 0 && openBrackets === closeBrackets;
          case "writer":
            return typeSlug === "writer";
          case "reference":
            return typeSlug === "reference";
          case "title":
            return typeSlug === "title";
          case "cited":
            return (
              (row.attributes as Record<string, unknown>)?.source &&
              (row.attributes as Record<string, unknown>)?.source !== ""
            );
          case "poets": {
            const entity = row as unknown as db.Entity;
            if (typeSlug !== "writer") return false;

            // Check for image
            const hasImage =
              (entity.attributes as Record<string, unknown>)?.has_image === 1 ||
              (entity.attributes as Record<string, unknown>)?.has_image ===
                true;
            if (!hasImage) return false;

            // Check for poems (incoming links from Titles)
            // We need to check if this writer is the target of any link from a Title
            // We can use the titleToWriter map, but that maps Title -> Writer
            // So we need to check if any value in titleToWriter equals this entity.id
            // This is O(N) which is slow inside a filter loop.
            // Better to pre-calculate a set of writers with poems.
            return writersWithPoems.has(entity.id);
          }
          default:
            return true;
        }
      });
    } else if (selectedTable === "items") {
      // Default filter for items table if no filter is specified
      // Show only references by default to match previous behavior
      sourceData = sourceData.filter((e) => e.typeSlug === "reference");
    }

    // Apply search filter (skip for adhoc queries as the query IS the search)
    if (searchQuery && selectedTable !== "adhoc") {
      const lowerQuery = searchQuery.toLowerCase();
      sourceData = sourceData.filter((row: TableData) => {
        return Object.values(row).some(
          (value) =>
            value != null && String(value).toLowerCase().includes(lowerQuery),
        );
      });
    }

    // Apply sorting
    const sortedData = sortData(sourceData);

    if (sortedData.length > 0) {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return {
        data: sortedData.slice(startIndex, endIndex),
        total: sortedData.length,
        totalPages: Math.ceil(sortedData.length / ITEMS_PER_PAGE),
      };
    }

    return { data: [], total: 0, totalPages: 0 };
  };

  const { data, total, totalPages } = getCurrentData();

  // Fetch images for visible items
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

      // Filter out already fetched
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

  // Reset to page 1 when changing tables or search
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Save search query to settings when it changes
  useEffect(() => {
    setCurrentSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, setCurrentSearch]);

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
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

  // Load last table from store if not in URL
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
    [selectedTable, loadAdHocData],
  );

  // Column definitions for each table
  const itemsColumns: ColumnDef[] = useMemo(
    () => [
      {
        field: "mark",
        header: "",
        width: 40,
        sortable: false,
        align: "center",
        render: (row) => (
          <Checkbox
            checked={!!(row.attributes as Record<string, unknown>)?.mark}
            onChange={() =>
              handleMarkToggle(
                row.id as number,
                (row.attributes as Record<string, unknown>)?.mark as
                  | string
                  | null,
              )
            }
            size="xs"
          />
        ),
      },
      {
        field: "type",
        header: "Type",
        width: "10%",
        render: (row) => (
          <Badge size="sm">{row.typeSlug as React.ReactNode}</Badge>
        ),
      },
      {
        field: "primaryLabel",
        header: "Primary Label",
        width: "20%",
        render: (row, extraData) => {
          let imageSrc: string | null = null;
          let linkedItemId: number | null = null;
          const typeSlug = String(row.typeSlug || "").toLowerCase();

          if (typeSlug === "writer") {
            const id = row.id as number;
            imageSrc = extraData?.itemImages?.[id] ?? null;
            linkedItemId = id;
          } else if (typeSlug === "title") {
            const id = row.id as number;
            const writerId = extraData?.titleToWriter?.get(id);
            if (writerId) {
              imageSrc = extraData?.itemImages?.[writerId] ?? null;
              linkedItemId = writerId;
            }
          }

          return (
            <Group gap="xs" wrap="nowrap">
              <Anchor
                component={Link}
                to={`/item/${row.id as number}?tab=detail`}
                fw={600}
              >
                {row.primaryLabel as React.ReactNode}
              </Anchor>
              {imageSrc &&
                (linkedItemId ? (
                  <Link
                    to={`/item/${linkedItemId}?tab=detail`}
                    style={{ display: "block", lineHeight: 0 }}
                  >
                    <img
                      src={imageSrc}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Link>
                ) : (
                  <img
                    src={imageSrc}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ))}
            </Group>
          );
        },
      },
      {
        field: "nIncoming",
        header: "In",
        align: "right",
        width: "8%",
        render: (row, extraData) => {
          const counts = extraData?.linkCounts?.[row.id as number] || {
            incoming: 0,
            outgoing: 0,
          };
          return <Text size="sm">{counts.incoming}</Text>;
        },
      },
      {
        field: "nOutgoing",
        header: "Out",
        align: "right",
        width: "8%",
        render: (row, extraData) => {
          const counts = extraData?.linkCounts?.[row.id as number] || {
            incoming: 0,
            outgoing: 0,
          };
          return <Text size="sm">{counts.outgoing}</Text>;
        },
      },
      {
        field: "definition",
        header: "Definition (Preview)",
        width: "54%",
        render: (row) => (
          <div>
            {row.description ? (
              <Text size="sm" lineClamp={2}>
                {row.description as string}
              </Text>
            ) : (
              // <DefinitionRenderer
              //   definition={row.description as string}
              //   compact={true}
              //   lineClamp={2}
              // />
              <Text size="sm">
                <em style={{ color: "#999" }}>No definition</em>
              </Text>
            )}
          </div>
        ),
      },
    ],
    [handleMarkToggle],
  );

  const linksColumns: ColumnDef[] = [
    {
      field: "sourceId",
      header: "Source Item",
      width: "30%",
      render: (row) => (
        <Anchor
          component={Link}
          to={`/item/${row.sourceId}?tab=detail`}
          size="sm"
        >
          Item #{row.sourceId as React.ReactNode}
        </Anchor>
      ),
    },
    {
      field: "targetId",
      header: "Destination Item",
      width: "30%",
      render: (row) => (
        <Anchor
          component={Link}
          to={`/item/${row.targetId}?tab=detail`}
          size="sm"
        >
          Item #{row.targetId as React.ReactNode}
        </Anchor>
      ),
    },
    {
      field: "label",
      header: "Link Type",
      width: "20%",
      render: (row) => (
        <Badge size="sm" variant="light">
          {row.label as React.ReactNode}
        </Badge>
      ),
    },
    {
      field: "createdAt",
      header: "Created",
      width: "20%",
      render: (row) => (
        <Text size="sm" c="dimmed">
          {new Date(row.createdAt as string).toLocaleDateString()}
        </Text>
      ),
    },
  ];

  const clichesColumns: ColumnDef[] = [
    {
      field: "phrase",
      header: "Phrase",
      width: "70%",
      render: (row) => <Text fw={600}>{row.phrase as React.ReactNode}</Text>,
    },
    {
      field: "created_at",
      header: "Created",
      width: "30%",
      render: (row) => (
        <Text size="sm" c="dimmed">
          {new Date(row.created_at as string).toLocaleDateString()}
        </Text>
      ),
    },
  ];

  const namesColumns: ColumnDef[] = [
    {
      field: "name",
      header: "Name",
      width: "20%",
      render: (row) => <Text fw={600}>{row.name as React.ReactNode}</Text>,
    },
    {
      field: "type",
      header: "Type",
      width: "10%",
      render: (row) =>
        row.type ? (
          <Badge size="sm">{row.type as React.ReactNode}</Badge>
        ) : (
          <em style={{ color: "#999" }}>—</em>
        ),
    },
    {
      field: "gender",
      header: "Gender",
      width: "10%",
      render: (row) => {
        const gender = row.gender as string;
        return gender ? (
          <Badge
            size="sm"
            color={
              gender === "male" ? "blue" : gender === "female" ? "pink" : "gray"
            }
          >
            {gender}
          </Badge>
        ) : (
          <em style={{ color: "#999" }}>—</em>
        );
      },
    },
    {
      field: "description",
      header: "Description (Preview)",
      width: "65%",
      render: (row) => (
        <Text size="sm" lineClamp={2}>
          {(row.description as React.ReactNode) || (
            <em style={{ color: "#999" }}>No description</em>
          )}
        </Text>
      ),
    },
  ];

  /*
  const handleMergeTerm = async (termId: number, termName: string) => {
    try {
      LogInfo(`Merging term: ${termName} (${termId})`);
      await MergeLiteraryTerm(termId);
      queryClient.invalidateQueries({ queryKey: ["allLiteraryTerms"] });
      notifications.show({
        title: "Merged",
        message: `Merged ${termName} into items table`,
        color: "green",
      });
    } catch (error) {
      LogError(`Failed to merge term: ${error}`);
      notifications.show({
        title: "Error",
        message: "Failed to merge term",
        color: "red",
      });
    }
  };

  const handleDeleteTerm = async (termId: number, termName: string) => {
    LogInfo(`Requesting delete for term: ${termName} (${termId})`);
    try {
      await DeleteLiteraryTerm(termId);
      LogInfo(`Successfully deleted term: ${termName}`);
      queryClient.invalidateQueries({ queryKey: ["allLiteraryTerms"] });
      notifications.show({
        title: "Deleted",
        message: `Deleted ${termName}`,
        color: "blue",
      });
    } catch (error) {
      LogError(`Failed to delete term: ${error}`);
      notifications.show({
        title: "Error",
        message: "Failed to delete term",
        color: "red",
      });
    }
  };
  */

  const literaryTermsColumns: ColumnDef[] = [
    {
      field: "term",
      header: "Term",
      width: "20%",
      render: (row) => (
        <Group gap="xs">
          <Text fw={600}>{String(row.term)}</Text>
        </Group>
      ),
    },
    {
      field: "type",
      header: "Type",
      width: "10%",
      render: (row) =>
        row.type ? (
          <Badge size="sm">{row.type as React.ReactNode}</Badge>
        ) : (
          <em style={{ color: "#999" }}>—</em>
        ),
    },
    {
      field: "definition",
      header: "Definition (Preview)",
      width: "70%",
      render: (row) => (
        <Text size="sm" lineClamp={2}>
          {(row.definition as React.ReactNode) || (
            <em style={{ color: "#999" }}>No definition</em>
          )}
        </Text>
      ),
    },
  ];

  const sourcesColumns: ColumnDef[] = [
    {
      field: "title",
      header: "Title",
      width: "30%",
      render: (row) => <Text fw={600}>{row.title as React.ReactNode}</Text>,
    },
    {
      field: "author",
      header: "Author",
      width: "20%",
      render: (row) => (
        <Text size="sm">
          {(row.author as React.ReactNode) || (
            <em style={{ color: "#999" }}>—</em>
          )}
        </Text>
      ),
    },
    {
      field: "notes",
      header: "Notes",
      width: "50%",
      render: (row) => (
        <Text size="sm" lineClamp={2}>
          {(row.notes as React.ReactNode) || (
            <em style={{ color: "#999" }}>—</em>
          )}
        </Text>
      ),
    },
  ];

  // Dynamic columns for ad-hoc query
  const adHocColumns: ColumnDef[] = useMemo(() => {
    if (!adHocResults || adHocResults.length === 0) return [];

    // If the result looks like an item (has id, word, type), use items columns
    const firstRow = adHocResults[0];
    if ("id" in firstRow || "item_id" in firstRow) {
      // Map snake_case to camelCase if needed for the itemsColumns renderer
      adHocResults.forEach((row: TableData) => {
        if ("item_id" in row && !("id" in row)) {
          row.id = row.item_id;
        }
        if ("word" in row && !("primaryLabel" in row)) {
          row.primaryLabel = row.word;
        }
        if ("primary_label" in row && !("primaryLabel" in row)) {
          row.primaryLabel = row.primary_label;
        }
        if ("type" in row && !("typeSlug" in row)) {
          row.typeSlug = row.type;
        }
        if ("type_slug" in row && !("typeSlug" in row)) {
          row.typeSlug = row.type_slug;
        }
        if (typeof row.attributes === "string") {
          try {
            row.attributes = JSON.parse(row.attributes);
          } catch {
            // ignore
          }
        }
      });

      // Return items columns but remove nIncoming/nOutgoing and expand definition
      return itemsColumns
        .filter((col) => col.field !== "nIncoming" && col.field !== "nOutgoing")
        .map((col) => {
          if (col.field === "definition") {
            return { ...col, width: "auto" };
          }
          return col;
        });
    }

    return Object.keys(adHocResults[0]).map((key) => ({
      field: key,
      header: key,
      width: "auto",
      render: (row: TableData) => {
        const val = row[key];
        if (val === null) return <em style={{ color: "#999" }}>NULL</em>;
        return String(val);
      },
    }));
  }, [adHocResults, itemsColumns]);

  const getColumnsForTable = () => {
    switch (selectedTable) {
      case "items":
        return itemsColumns;
      case "links":
        return linksColumns;
      case "cliches":
        return clichesColumns;
      case "names":
        return namesColumns;
      case "literaryTerms":
        return literaryTermsColumns;
      case "sources":
        return sourcesColumns;
      case "adhoc":
        return adHocColumns;
      default:
        return [];
    }
  };

  const getKeyField = () => {
    switch (selectedTable) {
      case "items":
        return "id";
      case "links":
        return "id";
      case "cliches":
        return "id";
      case "names":
        return "id";
      case "literaryTerms":
        return "id";
      case "sources":
        return "sourceId";
      case "adhoc":
        return adHocColumns.length > 0 ? adHocColumns[0].field : "id";
      default:
        return "id";
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
                    { value: "cliches", label: "Clichés" },
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
                columns={getColumnsForTable()}
                data={data}
                keyField={getKeyField()}
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
