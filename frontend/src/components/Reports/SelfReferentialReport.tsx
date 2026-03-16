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
  GetSelfReferentialEntities,
  GetEntity,
  UpdateEntity,
} from "@wailsjs/go/app/App";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { LogError } from "@utils/logger";
import { SelfRefResult } from "./types";
import { db } from "@wailsjs/go/models";

export function SelfReferentialReport() {
  const [fixingItem, setFixingItem] = useState<number | null>(null);
  const [selfRefs, setSelfRefs] = useState<SelfRefResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    GetSelfReferentialEntities()
      .then((results) => setSelfRefs(results as SelfRefResult[]))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFix = async (itemResult: SelfRefResult) => {
    setFixingItem(itemResult.id);
    try {
      const item = await GetEntity(itemResult.id);
      if (!item) {
        throw new Error("Item not found");
      }

      // Reconstruct regex based on the tag found
      const tagContent = itemResult.tag.slice(1, -1); // remove { and }
      const [prefix, primaryLabel] = tagContent.split(":").map((s) => s.trim());

      // Regex: \{prefix:\s*primaryLabel\}
      const escapedWord = primaryLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = `\\{${prefix}:\\s*${escapedWord}\\}`;
      const regex = new RegExp(pattern, "gi");

      const replacement = primaryLabel; // Just the primaryLabel

      const updatedItem = new db.Entity(item);
      let changed = false;

      if (updatedItem.description) {
        const newVal = updatedItem.description.replace(regex, replacement);
        if (newVal !== updatedItem.description) {
          updatedItem.description = newVal;
          changed = true;
        }
      }
      if (updatedItem.attributes?.derivation) {
        const newVal = updatedItem.attributes.derivation.replace(
          regex,
          replacement,
        );
        if (newVal !== updatedItem.attributes.derivation) {
          updatedItem.attributes.derivation = newVal;
          changed = true;
        }
      }
      if (updatedItem.attributes?.appendicies) {
        const newVal = updatedItem.attributes.appendicies.replace(
          regex,
          replacement,
        );
        if (newVal !== updatedItem.attributes.appendicies) {
          updatedItem.attributes.appendicies = newVal;
          changed = true;
        }
      }

      if (changed) {
        await UpdateEntity(updatedItem);
        loadData();
        notifications.show({
          title: "Fixed",
          message: `Removed self-reference in ${item.primaryLabel}`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "No changes",
          message: `Could not find the tag to replace in ${item.primaryLabel}`,
          color: "yellow",
        });
      }
    } catch (error) {
      LogError(`Failed to fix item: ${error}`);
      notifications.show({
        title: "Error",
        message: "Failed to fix item",
        color: "red",
      });
    } finally {
      setFixingItem(null);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Text size="sm" c="dimmed">
          Items that reference themselves in their definition
        </Text>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader />
        </div>
      )}

      {!isLoading && selfRefs && selfRefs.length === 0 && (
        <Alert color="green" icon={<IconCheck size={20} />}>
          <Text fw={600}>No self-referential items found!</Text>
        </Alert>
      )}

      {!isLoading && selfRefs && selfRefs.length > 0 && (
        <>
          <Alert color="yellow" icon={<IconAlertTriangle size={20} />}>
            <Text fw={600}>Found {selfRefs.length} self-referential items</Text>
            <Text size="sm">
              These items contain tags that reference themselves. Click
              &quot;Fix&quot; to replace the tag with plain text.
            </Text>
          </Alert>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Tag Found</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {selfRefs.map((item) => (
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
                    <Badge
                      variant="outline"
                      color="gray"
                      style={{ textTransform: "none" }}
                    >
                      {item.tag}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Button
                      size="xs"
                      variant="light"
                      color="blue"
                      loading={fixingItem === item.id}
                      onClick={() => handleFix(item)}
                    >
                      Fix
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
