import {
  Paper,
  Text,
  Group,
  Table,
  Button,
  ScrollArea,
  Checkbox,
  Switch,
  useMantineTheme,
} from "@mantine/core";
import { Link as RouterLink } from "react-router-dom";
import { Network, ArrowRight, CheckSquare } from "lucide-react";
import { database } from "@wailsjs/go/models";
import { ToggleEntityMark } from "@wailsjs/go/main/App";
import { useQueryClient } from "@tanstack/react-query";
import { LogError } from "@utils/logger";

interface HubsListProps {
  hubs: database.Entity[] | null;
  onToggle?: () => void;
}

export function HubsList({ hubs, onToggle }: HubsListProps) {
  const queryClient = useQueryClient();
  const theme = useMantineTheme();

  if (!hubs || hubs.length === 0) return null;

  const handleMarkToggle = async (
    itemId: number,
    currentMark: string | null,
  ) => {
    const newMark = !currentMark;
    try {
      await ToggleEntityMark(itemId, newMark);
      queryClient.invalidateQueries({ queryKey: ["topHubs"] });
      queryClient.invalidateQueries({ queryKey: ["markedItems"] });
    } catch (error) {
      LogError(`Failed to toggle mark: ${error}`);
    }
  };

  return (
    <Paper withBorder p="md" radius="md" h="100%">
      <Group mb="md" justify="space-between">
        <Group>
          <Network size={20} />
          <Text fw={500}>Top Connected Hubs</Text>
        </Group>
        {onToggle && (
          <Switch
            checked={false}
            onChange={onToggle}
            size="xs"
            onLabel={<CheckSquare size={12} color={theme.colors.blue[6]} />}
            offLabel={<Network size={12} color={theme.colors.gray[6]} />}
          />
        )}
      </Group>
      <ScrollArea h={450}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 40 }}></Table.Th>
              <Table.Th>Word</Table.Th>
              <Table.Th>Links</Table.Th>
              <Table.Th style={{ width: 80 }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {hubs.map((hub) => (
              <Table.Tr key={hub.id}>
                <Table.Td>
                  <Checkbox
                    checked={!!hub.attributes?.mark}
                    onChange={() =>
                      handleMarkToggle(hub.id, hub.attributes?.mark || null)
                    }
                    size="xs"
                  />
                </Table.Td>
                <Table.Td fw={500}>{hub.primaryLabel}</Table.Td>
                <Table.Td>{hub.attributes?.linkCount}</Table.Td>
                <Table.Td>
                  <Button
                    component={RouterLink}
                    to={`/item/${hub.id}`}
                    variant="subtle"
                    size="xs"
                    rightSection={<ArrowRight size={14} />}
                  >
                    Go
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
