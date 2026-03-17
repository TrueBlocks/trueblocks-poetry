import { db } from "@models";
import { TableData, SortState } from "./tableTypes";
import { sortData } from "./tableSorting";

const ITEMS_PER_PAGE = 15;

interface GetCurrentDataParams {
  selectedTable: string;
  allEntities: db.Entity[] | null;
  allLinks: db.Relationship[] | null;
  clichesData: TableData[] | null;
  namesData: TableData[] | null;
  literaryTermsData: TableData[] | null;
  allSources: unknown[] | null;
  adHocResults: TableData[] | null;
  filterType: string | null;
  writersWithPoems: Set<number>;
  searchQuery: string;
  sortState: SortState;
  linkCounts: Record<number, { incoming: number; outgoing: number }>;
  currentPage: number;
}

export function getCurrentData(params: GetCurrentDataParams) {
  const {
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
  } = params;

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

  if (filterType && selectedTable === "items") {
    sourceData = sourceData.filter((row: TableData) => {
      const typeSlug = String(row.typeSlug || "").toLowerCase();
      switch (filterType) {
        case "quotes":
          if (typeSlug !== "title" || !row.description) return false;
          const openBrackets = ((row.description as string)?.match(/\[/g) || [])
            .length;
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

          const hasImage =
            (entity.attributes as Record<string, unknown>)?.has_image === 1 ||
            (entity.attributes as Record<string, unknown>)?.has_image === true;
          if (!hasImage) return false;

          return writersWithPoems.has(entity.id);
        }
        default:
          return true;
      }
    });
  } else if (selectedTable === "items") {
    sourceData = sourceData.filter((e) => e.typeSlug === "reference");
  }

  if (searchQuery && selectedTable !== "adhoc") {
    const lowerQuery = searchQuery.toLowerCase();
    sourceData = sourceData.filter((row: TableData) => {
      return Object.values(row).some(
        (value) =>
          value != null && String(value).toLowerCase().includes(lowerQuery),
      );
    });
  }

  const sortedData = sortData(sourceData, sortState, linkCounts);

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
}
