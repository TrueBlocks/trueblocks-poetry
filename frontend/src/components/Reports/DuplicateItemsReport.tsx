import {
  Stack,
  Text,
  Alert,
  Loader,
  Table,
  Badge,
  Anchor,
  Button,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  GetDuplicateEntities,
  MergeDuplicateEntities,
} from "@wailsjs/go/app/App";
import { IconAlertTriangle } from "@tabler/icons-react";
import { DuplicateResult } from "./types";
import { LogError } from "@utils/logger";

export function DuplicateItemsReport() {
  const [deletingDuplicates, setDeletingDuplicates] = useState<string | null>(
    null,
  );
  const [duplicates, setDuplicates] = useState<DuplicateResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    GetDuplicateEntities()
      .then((results) => setDuplicates(results as DuplicateResult[]))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteDuplicates = async (
    originalId: number,
    strippedLabel: string,
    duplicateIds: number[],
  ) => {
    setDeletingDuplicates(strippedLabel);
    try {
      await MergeDuplicateEntities(originalId, duplicateIds);
      loadData();
    } catch (error) {
      LogError(`Failed to merge duplicates: ${error}`);
    } finally {
      setDeletingDuplicates(null);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Text size="sm" c="dimmed">
          Items with the same name after stripping possessives
        </Text>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader />
        </div>
      )}

      {!isLoading && duplicates && duplicates.length === 0 && (
        <Alert color="green" icon={<IconAlertTriangle size={20} />}>
          <Text fw={600}>No duplicate items found!</Text>
          <Text size="sm">
            All items have unique names after stripping possessives.
          </Text>
        </Alert>
      )}

      {!isLoading && duplicates && duplicates.length > 0 && (
        <>
          <Alert color="yellow" icon={<IconAlertTriangle size={20} />}>
            <Text fw={600}>
              Found {duplicates.length} sets of duplicate items
            </Text>
            <Text size="sm">
              These items have the same name when possessives are removed. Click
              &quot;Remove Duplicates&quot; to delete the duplicate entries.
            </Text>
          </Alert>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Original Item</Table.Th>
                <Table.Th>Duplicates</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {duplicates.map((group) => {
                const isDeleting = deletingDuplicates === group.strippedLabel;
                const duplicateIds = group.duplicates.map((d) => d.id);

                return (
                  <Table.Tr key={group.strippedLabel}>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        to={`/item/${group.original.id}?tab=detail`}
                        fw={600}
                      >
                        {group.original.primaryLabel}
                      </Anchor>
                      <Badge size="xs" ml="xs">
                        {group.original.typeSlug}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {group.duplicates.map((dup) => (
                          <Badge
                            key={dup.id}
                            size="sm"
                            color="red"
                            variant="light"
                          >
                            {dup.primaryLabel} ({dup.typeSlug})
                          </Badge>
                        ))}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        loading={isDeleting}
                        onClick={() =>
                          handleDeleteDuplicates(
                            group.original.id,
                            group.strippedLabel,
                            duplicateIds,
                          )
                        }
                      >
                        Remove Duplicates
                      </Button>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Badge size="sm" color="orange">
                        {group.count}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </>
      )}
    </Stack>
  );
}
