import React from "react";
import {
  IconArrowUp,
  IconArrowDown,
  IconArrowsUpDown,
} from "@tabler/icons-react";
import { TableData, SortState, SortDirection } from "./tableTypes";

export function createHandleColumnClick(
  sortState: SortState,
  setTableSort: (table: string, state: SortState) => void,
  selectedTable: string,
) {
  return (field: string) => {
    let newState = { ...sortState };

    if (sortState.field1 === field) {
      if (sortState.dir1 === "asc") {
        newState.dir1 = "desc";
      } else if (sortState.dir1 === "desc") {
        newState.field1 = sortState.field2;
        newState.dir1 = sortState.dir2;
        newState.field2 = "";
        newState.dir2 = "";
      }
    } else if (sortState.field2 === field) {
      if (sortState.dir2 === "asc") {
        newState.dir2 = "desc";
      } else if (sortState.dir2 === "desc") {
        newState.field2 = "";
        newState.dir2 = "";
      }
    } else {
      if (!sortState.field1) {
        newState.field1 = field;
        newState.dir1 = "asc";
      } else if (!sortState.field2) {
        newState.field2 = field;
        newState.dir2 = "asc";
      } else {
        newState.field2 = field;
        newState.dir2 = "asc";
      }
    }

    setTableSort(selectedTable, newState);
  };
}

export function createGetSortIcon(sortState: SortState) {
  return function getSortIcon(field: string): React.ReactNode {
    if (sortState.field1 === field) {
      return sortState.dir1 === "asc"
        ? React.createElement(IconArrowUp, { size: 14 })
        : React.createElement(IconArrowDown, { size: 14 });
    }
    if (sortState.field2 === field) {
      return sortState.dir2 === "asc"
        ? React.createElement(IconArrowUp, { size: 14 })
        : React.createElement(IconArrowDown, { size: 14 });
    }
    return React.createElement(IconArrowsUpDown, {
      size: 14,
      style: { opacity: 0.3 },
    });
  };
}

export function createGetSortIndicator(sortState: SortState) {
  return (field: string): string => {
    if (sortState.field1 === field) return "1";
    if (sortState.field2 === field) return "2";
    return "";
  };
}

export function compareValues(
  a: TableData,
  b: TableData,
  field: string,
  dir: SortDirection,
  linkCounts: Record<number, { incoming: number; outgoing: number }>,
) {
  let aVal = a[field];
  let bVal = b[field];

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

  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return dir === "asc" ? 1 : -1;
  if (bVal == null) return dir === "asc" ? -1 : 1;

  if (typeof aVal === "number" && typeof bVal === "number") {
    return dir === "asc" ? aVal - bVal : bVal - aVal;
  }

  const aStr = String(aVal).toLowerCase();
  const bStr = String(bVal).toLowerCase();
  const result = aStr.localeCompare(bStr);
  return dir === "asc" ? result : -result;
}

export function sortData(
  data: TableData[],
  sortState: SortState,
  linkCounts: Record<number, { incoming: number; outgoing: number }>,
) {
  if (!sortState.field1) return data;

  return [...data].sort((a, b) => {
    let result = compareValues(
      a,
      b,
      sortState.field1,
      sortState.dir1,
      linkCounts,
    );

    if (result === 0 && sortState.field2) {
      result = compareValues(
        a,
        b,
        sortState.field2,
        sortState.dir2,
        linkCounts,
      );
    }

    return result;
  });
}
