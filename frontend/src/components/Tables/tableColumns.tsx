import { useMemo } from "react";
import { Text, Badge, Anchor, Group, Checkbox } from "@mantine/core";
import { Link } from "react-router-dom";
import { ColumnDef, TableData } from "./tableTypes";

export function useItemsColumns(
  handleMarkToggle: (id: number, currentMark: string | null) => void,
): ColumnDef[] {
  return useMemo(
    () => [
      {
        field: "mark",
        header: "",
        width: 40,
        sortable: false,
        align: "center" as const,
        render: (row: TableData) => (
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
        render: (row: TableData) => (
          <Badge size="sm">{row.typeSlug as React.ReactNode}</Badge>
        ),
      },
      {
        field: "primaryLabel",
        header: "Primary Label",
        width: "20%",
        render: (row: TableData, extraData) => {
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
        align: "right" as const,
        width: "8%",
        render: (row: TableData, extraData) => {
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
        align: "right" as const,
        width: "8%",
        render: (row: TableData, extraData) => {
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
        render: (row: TableData) => (
          <div>
            {row.description ? (
              <Text size="sm" lineClamp={2}>
                {row.description as string}
              </Text>
            ) : (
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
}

export const linksColumns: ColumnDef[] = [
  {
    field: "sourceId",
    header: "Source Item",
    width: "30%",
    render: (row: TableData) => (
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
    render: (row: TableData) => (
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
    render: (row: TableData) => (
      <Badge size="sm" variant="light">
        {row.label as React.ReactNode}
      </Badge>
    ),
  },
  {
    field: "createdAt",
    header: "Created",
    width: "20%",
    render: (row: TableData) => (
      <Text size="sm" c="dimmed">
        {new Date(row.createdAt as string).toLocaleDateString()}
      </Text>
    ),
  },
];

export const clichesColumns: ColumnDef[] = [
  {
    field: "phrase",
    header: "Phrase",
    width: "70%",
    render: (row: TableData) => (
      <Text fw={600}>{row.phrase as React.ReactNode}</Text>
    ),
  },
  {
    field: "created_at",
    header: "Created",
    width: "30%",
    render: (row: TableData) => (
      <Text size="sm" c="dimmed">
        {new Date(row.created_at as string).toLocaleDateString()}
      </Text>
    ),
  },
];

export const namesColumns: ColumnDef[] = [
  {
    field: "name",
    header: "Name",
    width: "20%",
    render: (row: TableData) => (
      <Text fw={600}>{row.name as React.ReactNode}</Text>
    ),
  },
  {
    field: "type",
    header: "Type",
    width: "10%",
    render: (row: TableData) =>
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
    render: (row: TableData) => {
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
    render: (row: TableData) => (
      <Text size="sm" lineClamp={2}>
        {(row.description as React.ReactNode) || (
          <em style={{ color: "#999" }}>No description</em>
        )}
      </Text>
    ),
  },
];

export const literaryTermsColumns: ColumnDef[] = [
  {
    field: "term",
    header: "Term",
    width: "20%",
    render: (row: TableData) => (
      <Group gap="xs">
        <Text fw={600}>{String(row.term)}</Text>
      </Group>
    ),
  },
  {
    field: "type",
    header: "Type",
    width: "10%",
    render: (row: TableData) =>
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
    render: (row: TableData) => (
      <Text size="sm" lineClamp={2}>
        {(row.definition as React.ReactNode) || (
          <em style={{ color: "#999" }}>No definition</em>
        )}
      </Text>
    ),
  },
];

export const sourcesColumns: ColumnDef[] = [
  {
    field: "title",
    header: "Title",
    width: "30%",
    render: (row: TableData) => (
      <Text fw={600}>{row.title as React.ReactNode}</Text>
    ),
  },
  {
    field: "author",
    header: "Author",
    width: "20%",
    render: (row: TableData) => (
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
    render: (row: TableData) => (
      <Text size="sm" lineClamp={2}>
        {(row.notes as React.ReactNode) || <em style={{ color: "#999" }}>—</em>}
      </Text>
    ),
  },
];

export function useAdHocColumns(
  adHocResults: TableData[] | null,
  itemsColumns: ColumnDef[],
): ColumnDef[] {
  return useMemo(() => {
    if (!adHocResults || adHocResults.length === 0) return [];

    const firstRow = adHocResults[0];
    if ("id" in firstRow || "item_id" in firstRow) {
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
}

export function getColumnsForTable(
  selectedTable: string,
  itemsColumns: ColumnDef[],
  adHocColumns: ColumnDef[],
): ColumnDef[] {
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
}

export function getKeyField(
  selectedTable: string,
  adHocColumns: ColumnDef[],
): string {
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
}
