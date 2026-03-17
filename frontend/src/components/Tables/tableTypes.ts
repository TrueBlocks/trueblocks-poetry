import React from "react";

export type TableData = Record<string, unknown>;

export interface ExtraData {
  linkCounts: Record<number, { incoming: number; outgoing: number }>;
  itemImages: Record<number, string | null>;
  titleToWriter: Map<number, number>;
}

export type SortDirection = "asc" | "desc" | "";

export interface SortState {
  field1: string;
  dir1: SortDirection;
  field2: string;
  dir2: SortDirection;
}

export interface ColumnDef {
  field: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string | number;
  render?: (row: TableData, allData?: ExtraData) => React.ReactNode;
}

export interface SortableTableProps {
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
