import { Link } from "react-router-dom";
import { Text, Group, Stack, Paper, ActionIcon } from "@mantine/core";
import {
  IconNetwork,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { db, services } from "@models";
import { getEntityColor } from "@utils/colors";

interface IncomingConnectionsProps {
  links: services.RelationshipDetail[] | null;
  id: string;
  linkedItemsData: Record<number, db.Entity>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function IncomingConnections({
  links,
  id,
  linkedItemsData,
  collapsed,
  onToggleCollapsed,
}: IncomingConnectionsProps) {
  return (
    <div>
      <Group
        gap="xs"
        mb="xs"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={onToggleCollapsed}
      >
        {collapsed ? (
          <IconChevronRight size={14} />
        ) : (
          <IconChevronDown size={14} />
        )}
        <Text size="sm" fw={500}>
          Incoming (
          {links?.filter((l) => l.targetId === Number(id)).length || 0})
        </Text>
      </Group>
      {!collapsed && (
        <Stack gap="xs">
          {links &&
          links.filter((l) => l.targetId === Number(id)).length > 0 ? (
            links
              .filter((link) => link.targetId === Number(id))
              .map((link) => {
                const linkedItemId = link.sourceId;
                const linkedItem = linkedItemsData?.[linkedItemId];

                return (
                  <Paper
                    key={link.id}
                    p="xs"
                    withBorder
                    style={{
                      backgroundColor: linkedItem?.typeSlug
                        ? getEntityColor(linkedItem.typeSlug)
                        : undefined,
                    }}
                  >
                    {linkedItem ? (
                      <Group gap="xs" align="center">
                        <Text
                          component={Link}
                          to={`/item/${linkedItemId}?tab=detail`}
                          size="xs"
                          fw={600}
                          c="dark"
                          style={{
                            textDecoration: "none",
                            lineHeight: 1.2,
                            flex: 1,
                          }}
                          onClick={(e: React.MouseEvent) => {
                            if (e.metaKey || e.ctrlKey) {
                              e.preventDefault();
                            }
                          }}
                        >
                          {linkedItem.primaryLabel}
                        </Text>
                        <ActionIcon
                          component={Link}
                          to={`/item/${linkedItemId}?tab=graph`}
                          size="xs"
                          variant="subtle"
                          color="dark"
                          title="Show in graph"
                        >
                          <IconNetwork size={12} />
                        </ActionIcon>
                      </Group>
                    ) : (
                      <Text size="xs" c="dark">
                        Loading...
                      </Text>
                    )}
                  </Paper>
                );
              })
          ) : (
            <Text size="xs" c="dimmed" ta="center">
              No incoming connections
            </Text>
          )}
        </Stack>
      )}
    </div>
  );
}
