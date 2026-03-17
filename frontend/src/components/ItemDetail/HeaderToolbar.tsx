import { useNavigate } from "react-router-dom";
import { Button, Group, useMantineColorScheme } from "@mantine/core";
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconSparkles,
  IconPilcrow,
} from "@tabler/icons-react";
import { BrowserOpenURL } from "@wailsjs/runtime/runtime.js";
import { db, services } from "@models";

interface HeaderToolbarProps {
  entity: db.Entity;
  id: string;
  links: services.RelationshipDetail[] | null;
  revealMarkdown: boolean;
  deleteIsPending: boolean;
  onToggleRevealMarkdown: () => void;
  onEnterEditMode?: () => void;
  onDelete: () => void;
}

export function HeaderToolbar({
  entity,
  id,
  links,
  revealMarkdown,
  deleteIsPending,
  onToggleRevealMarkdown,
  onEnterEditMode,
  onDelete,
}: HeaderToolbarProps) {
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: colorScheme === "dark" ? "#1a1b1e" : "white",
        borderBottom: `1px solid ${colorScheme === "dark" ? "#373A40" : "#e9ecef"}`,
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
              const type = entity?.typeSlug || "";

              if (type === "Title") {
                const writtenByMatch = entity?.description?.match(
                  /Written by:\s*\{writer:\s*([^}]+)\}/i,
                );
                if (writtenByMatch) {
                  const writer = writtenByMatch[1].trim();
                  query = `"${entity?.primaryLabel || ""}" written by ${writer}`;
                } else {
                  query = `"${entity?.primaryLabel || ""}"`;
                }
              } else if (type === "Writer") {
                query = `"${entity?.primaryLabel || ""}"`;
              } else {
                query = entity?.description
                  ? `${entity.primaryLabel} ${entity.description}`
                  : entity?.primaryLabel || "";
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
            onClick={onEnterEditMode}
            leftSection={<IconEdit size={16} />}
          >
            Edit
          </Button>
          <Button
            color="red"
            leftSection={<IconTrash size={16} />}
            onClick={onDelete}
            loading={deleteIsPending}
            disabled={
              !!(
                links &&
                links.filter((l) => l.targetId === Number(id)).length > 0
              )
            }
            title={
              links && links.filter((l) => l.targetId === Number(id)).length > 0
                ? "Cannot delete: item has incoming connections"
                : "Delete this item"
            }
          >
            Delete
          </Button>
        </Group>
      </Group>
    </div>
  );
}
