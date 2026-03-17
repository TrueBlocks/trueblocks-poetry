import { Table, Group, Text } from "@mantine/core";
import { SortableTableProps } from "./tableTypes";

export function SortableTable({
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
