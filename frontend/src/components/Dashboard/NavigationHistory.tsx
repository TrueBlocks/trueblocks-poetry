import {
  Paper,
  Text,
  Group,
  ScrollArea,
  Button,
  ActionIcon,
} from "@mantine/core";
import { Link as RouterLink } from "react-router-dom";
import {
  IconHistory,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { db } from "@wailsjs/go/models";
import { getEntityColor } from "@utils/colors";
import { useUI } from "@/contexts/UIContext";

interface NavigationHistoryProps {
  history: db.Entity[] | null;
}

export function NavigationHistory({ history }: NavigationHistoryProps) {
  const { recentPathCollapsed, setRecentPathCollapsed } = useUI();

  if (!history || history.length === 0) return null;

  const displayedHistory = !recentPathCollapsed
    ? history
    : history.slice(0, 10);

  return (
    <Paper withBorder p="md" radius="md">
      <Group mb="md" justify="space-between">
        <Group>
          <IconHistory size={20} />
          <Text fw={500}>Recent Path</Text>
        </Group>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => setRecentPathCollapsed(!recentPathCollapsed)}
          aria-label={!recentPathCollapsed ? "Collapse" : "Expand"}
        >
          {!recentPathCollapsed ? (
            <IconChevronUp size={16} />
          ) : (
            <IconChevronDown size={16} />
          )}
        </ActionIcon>
      </Group>
      <ScrollArea
        type="hover"
        scrollbarSize={6}
        h={!recentPathCollapsed ? 200 : undefined}
      >
        <Group wrap={!recentPathCollapsed ? "wrap" : "nowrap"} gap="xs">
          {displayedHistory.map((item) => (
            <Button
              key={item.id}
              component={RouterLink}
              to={`/item/${item.id}`}
              variant="light"
              size="xs"
              color="gray"
              style={{
                backgroundColor: getEntityColor(item.typeSlug),
                color: "#000",
                border: "1px solid #dee2e6",
              }}
            >
              {item.primaryLabel}
            </Button>
          ))}
        </Group>
      </ScrollArea>
    </Paper>
  );
}
