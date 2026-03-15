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
import { GetLinkedEntitiesNotInDescription } from "@wailsjs/go/main/App";
import { DeleteRelationship } from "@wailsjs/go/services/EntityService";
import { AlertTriangle } from "lucide-react";
import { notifications } from "@mantine/notifications";
import { LinkedNotInDefResult } from "./types";
import { LogError } from "@utils/logger";

export function LinkedItemsNotInDefinitionReport() {
  const queryClient = useQueryClient();
  const [deletingLink, setDeletingLink] = useState<string | null>(null);

  const { data: linkedNotInDef, isLoading } = useQuery({
    queryKey: ["linkedNotInDef"],
    queryFn: async () => {
      const results = await GetLinkedEntitiesNotInDescription();
      return results as LinkedNotInDefResult[];
    },
  });

  const handleDeleteLink = async (relationshipId: number, label: string) => {
    setDeletingLink(String(relationshipId));
    try {
      await DeleteRelationship(relationshipId);
      queryClient.invalidateQueries({ queryKey: ["linkedNotInDef"] });

      notifications.show({
        title: "Link deleted",
        message: `Removed link to ${label}`,
        color: "green",
      });
    } catch (error) {
      LogError(`Failed to delete link: ${error}`);
      notifications.show({
        title: "Error",
        message: "Failed to delete link",
        color: "red",
      });
    } finally {
      setDeletingLink(null);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Text size="sm" c="dimmed">
          Links exist but items aren&apos;t tagged in definitions
        </Text>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader />
        </div>
      )}

      {!isLoading && linkedNotInDef && linkedNotInDef.length === 0 && (
        <Alert color="green" icon={<AlertTriangle size={20} />}>
          <Text fw={600}>All linked items are properly referenced!</Text>
          <Text size="sm">
            All items with links have those links referenced in their
            definitions.
          </Text>
        </Alert>
      )}

      {!isLoading && linkedNotInDef && linkedNotInDef.length > 0 && (
        <>
          <Alert color="yellow" icon={<AlertTriangle size={20} />}>
            <Text fw={600}>
              Found {linkedNotInDef.length} items with unreferenced links
            </Text>
            <Text size="sm">
              These items have links in the database but don&apos;t reference
              the linked item in their definition text.
            </Text>
          </Alert>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Unreferenced Links</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {linkedNotInDef.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Anchor
                      component={Link}
                      to={`/item/${item.id}?tab=detail`}
                      fw={600}
                    >
                      {item.primaryLabel}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm">{item.typeSlug}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                    >
                      {item.missingReferences.map((ref, idx) => (
                        <Button
                          key={idx}
                          size="xs"
                          color="orange"
                          variant="light"
                          loading={deletingLink === String(ref.relationshipId)}
                          onClick={() =>
                            handleDeleteLink(ref.relationshipId, ref.label)
                          }
                          title="Click to remove link"
                        >
                          {ref.label}
                        </Button>
                      ))}
                    </div>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Badge size="sm" color="orange">
                      {item.missingReferences.length}
                    </Badge>
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
