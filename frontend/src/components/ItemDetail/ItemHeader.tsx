import { Link, useNavigate } from "react-router-dom";
import { Group, Title, Button, Badge, ActionIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconNetwork,
  IconSparkles,
  IconPilcrow,
  IconCopy,
  IconCheck,
  IconVolume,
} from "@tabler/icons-react";
import { BrowserOpenURL } from "@wailsjs/runtime/runtime.js";
import { getEntityColor } from "@utils/colors";
import { db } from "@models";

interface ItemHeaderProps {
  item: db.Entity;
  itemId: string;
  links: db.Relationship[] | null;
  revealMarkdown: boolean;
  onToggleRevealMarkdown: () => void;
  onDelete: () => void;
  onSpeakWord: () => void;
  onSpeakQuote: () => void;
  deleteLoading: boolean;
}

export function ItemHeader({
  item,
  itemId,
  links,
  revealMarkdown,
  onToggleRevealMarkdown,
  onDelete,
  onSpeakWord,
  onSpeakQuote,
  deleteLoading,
}: ItemHeaderProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Action Bar */}
      <div
        style={{
          borderBottom: "1px solid #e9ecef",
          padding: "1rem 2rem",
        }}
      >
        <Group justify="space-between">
          <Group gap="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              variant="subtle"
              leftSection={<IconSparkles size={18} />}
              onClick={() => {
                let query = "";
                const type = item?.typeSlug || "";

                if (type === "Title" || type === "Writer") {
                  query = `"${item?.primaryLabel || ""}"`;
                } else {
                  query = item?.description
                    ? `${item.primaryLabel} ${item.description}`
                    : item?.primaryLabel || "";
                }

                BrowserOpenURL(
                  `https://www.google.com/search?q=${encodeURIComponent(query)}&ai=1`,
                );
              }}
            >
              AI
            </Button>
            <Button
              variant={revealMarkdown ? "filled" : "subtle"}
              leftSection={<IconPilcrow size={18} />}
              onClick={onToggleRevealMarkdown}
              title="Show/hide markdown formatting"
            >
              ¶
            </Button>
          </Group>
          <Group gap="sm">
            <Button
              component={Link}
              to={`/item/${itemId}/edit`}
              leftSection={<IconEdit size={16} />}
            >
              Edit
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={onDelete}
              loading={deleteLoading}
              disabled={
                (links &&
                  links.filter((l) => l.targetId === Number(itemId)).length >
                    0) ||
                undefined
              }
              title={
                links &&
                links.filter((l) => l.targetId === Number(itemId)).length > 0
                  ? "Cannot delete: item has incoming connections"
                  : "Delete this item"
              }
            >
              Delete
            </Button>
          </Group>
        </Group>
      </div>

      {/* Title Row */}
      <Group gap="sm" align="center">
        <Title order={1} size="3rem" mb="sm">
          {item.primaryLabel}
        </Title>
        <ActionIcon
          size="lg"
          variant="subtle"
          color="gray"
          title="Copy to clipboard"
          onClick={() => {
            navigator.clipboard.writeText(item.primaryLabel);
            notifications.show({
              title: "Copied!",
              message: `"${item.primaryLabel}" copied to clipboard`,
              color: "green",
              icon: <IconCheck size={16} />,
            });
          }}
        >
          <IconCopy size={20} />
        </ActionIcon>
        <ActionIcon
          size="lg"
          variant="subtle"
          color="gray"
          title="View in graph"
          component={Link}
          to={`/item/${itemId}?tab=graph`}
        >
          <IconNetwork size={20} />
        </ActionIcon>
      </Group>
      <Group gap="sm">
        <Badge
          size="lg"
          style={{
            backgroundColor: getEntityColor(item.typeSlug),
            color: "#000",
          }}
        >
          {item.typeSlug}
        </Badge>
        {item.typeSlug === "Reference" && (
          <ActionIcon
            size="lg"
            variant="light"
            color="blue"
            title="Pronounce word"
            onClick={onSpeakWord}
          >
            <IconVolume size={22} />
          </ActionIcon>
        )}
        {item.typeSlug === "Title" &&
          item.description &&
          /\[\s*\n/.test(item.description) && (
            <ActionIcon
              size="lg"
              variant="light"
              color="green"
              title="Read quoted text"
              onClick={onSpeakQuote}
            >
              <IconVolume size={22} />
            </ActionIcon>
          )}
      </Group>
    </>
  );
}
