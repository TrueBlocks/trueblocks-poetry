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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  GetDanglingRelationships,
  DeleteRelationship,
} from "@wailsjs/go/main/App";
import { LogInfo } from "@wailsjs/runtime/runtime.js";
import { AlertTriangle, Trash2 } from "lucide-react";
import { DanglingLinkResult } from "./types";

export function DanglingLinksReport() {
  const queryClient = useQueryClient();
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const { data: danglingLinks, isLoading } = useQuery({
    queryKey: ["danglingLinks"],
    queryFn: async () => {
      const results = await GetDanglingRelationships();
      return results as DanglingLinkResult[];
    },
  });

  const handleDeleteRelationship = async (
    sourceId: number,
    targetId: number,
    relationshipId: number,
  ) => {
    LogInfo(
      `[DanglingLinksReport] Deleting link: sourceId=${sourceId}, targetId=${targetId}`,
    );
    setDeletingIds((prev) => new Set(prev).add(relationshipId));
    try {
      await DeleteRelationship(relationshipId);
      LogInfo("[DanglingLinksReport] Link deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["danglingLinks"] });
    } catch (error) {
      LogInfo(
        `[DanglingLinksReport] Failed to delete link: ${error instanceof Error ? error.message : String(error)}`,
      );
      alert(
        "Failed to delete link: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(relationshipId);
        return next;
      });
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Text size="sm" c="dimmed">
          Links pointing to deleted or non-existent items
        </Text>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader />
        </div>
      )}

      {!isLoading && danglingLinks && danglingLinks.length === 0 && (
        <Alert color="green" icon={<AlertTriangle size={20} />}>
          <Text fw={600}>No dangling links found!</Text>
          <Text size="sm">
            All links in your database point to valid items.
          </Text>
        </Alert>
      )}

      {!isLoading && danglingLinks && danglingLinks.length > 0 && (
        <>
          <Alert color="red" icon={<AlertTriangle size={20} />}>
            <Text fw={600}>Found {danglingLinks.length} dangling links</Text>
            <Text size="sm">
              These links point to items that no longer exist, likely due to
              database corruption during deletion.
            </Text>
          </Alert>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Link ID</Table.Th>
                <Table.Th>Source Item</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Missing Side</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {danglingLinks.map((link) => (
                <Table.Tr key={link.relationshipId}>
                  <Table.Td>{link.relationshipId}</Table.Td>
                  <Table.Td>
                    {link.missingSide === "destination" ? (
                      <Anchor
                        component={Link}
                        to={`/item/${link.sourceId}?tab=detail`}
                        fw={600}
                      >
                        {link.sourceLabel}
                      </Anchor>
                    ) : (
                      <Text c="dimmed" fs="italic">
                        Missing Source ({link.sourceId})
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm">{link.label}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="red" variant="light">
                      {link.missingSide}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      leftSection={<Trash2 size={14} />}
                      loading={deletingIds.has(link.relationshipId)}
                      onClick={() =>
                        handleDeleteRelationship(
                          link.sourceId,
                          link.targetId,
                          link.relationshipId,
                        )
                      }
                    >
                      Delete Link
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </>
      )}
    </Stack>
  );
}
