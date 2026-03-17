import React from "react";
import { Link } from "react-router-dom";
import { Paper, Badge, Title, Text, Stack, Group } from "@mantine/core";
import { DefinitionRenderer } from "@components/ItemDetail/DefinitionRenderer";
import { SearchResultImage } from "./SearchResultImage";
import { db } from "@models";

const getFirstSentence = (text: string | null | undefined): string => {
  if (!text) return "No description";
  const match = text.match(/^[^.!?]+[.!?]/);
  return match
    ? match[0] + "..."
    : text.length > 100
      ? text.substring(0, 100) + "..."
      : text;
};

interface SearchResultCardProps {
  item: db.Entity | (Record<string, unknown> & Partial<db.Entity>);
  globalIndex: number;
  isSelected: boolean;
  isDark: boolean;
  itemWriters: Record<number, string[]>;
  allItems: db.Entity[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  resultRefs: React.MutableRefObject<(HTMLElement | null)[]>;
}

export const SearchResultCard = ({
  item,
  globalIndex,
  isSelected,
  isDark,
  itemWriters,
  allItems,
  audioRef,
  resultRefs,
}: SearchResultCardProps) => {
  const id = item.id as number;

  return (
    <Paper
      key={id}
      ref={(el: HTMLElement | null) => {
        resultRefs.current[globalIndex] = el;
      }}
      component={Link}
      to={`/item/${id}?tab=detail`}
      shadow="sm"
      p="md"
      radius="md"
      withBorder
      style={{
        textDecoration: "none",
        color: "var(--mantine-color-text)",
        backgroundColor: isSelected
          ? isDark
            ? "var(--mantine-color-dark-6)"
            : "var(--mantine-color-blue-0)"
          : undefined,
        borderColor: isSelected
          ? isDark
            ? "var(--mantine-color-dark-4)"
            : "var(--mantine-color-blue-5)"
          : undefined,
        borderWidth: isSelected ? "2px" : undefined,
      }}
    >
      <Stack gap="xs">
        <Group align="flex-start" wrap="nowrap">
          {item.typeSlug === "writer" && <SearchResultImage id={id} />}
          <Title
            order={3}
            c={
              isDark
                ? "var(--mantine-color-blue-2)"
                : "var(--mantine-color-blue-7)"
            }
          >
            {item.primaryLabel as React.ReactNode}
          </Title>
        </Group>
        <div>
          {item.description ? (
            <DefinitionRenderer
              text={getFirstSentence(item.description as string)}
              allEntities={allItems}
              stopAudio={() => {}}
              currentAudioRef={audioRef}
              entity={item as db.Entity}
            />
          ) : (
            <Text component="span">No description</Text>
          )}
          {itemWriters[id] && itemWriters[id].length > 0 && (
            <Text component="span" size="sm" c="dimmed">
              {" "}
              Writers: {itemWriters[id].join(", ")}
            </Text>
          )}
        </div>
        <Group>
          {item.typeSlug ? <Badge>{String(item.typeSlug)}</Badge> : null}
          {(item.attributes as Record<string, unknown>)?.source ? (
            <Text size="xs" c="dimmed">
              Source:{" "}
              {String((item.attributes as Record<string, unknown>).source)}
            </Text>
          ) : null}
        </Group>
      </Stack>
    </Paper>
  );
};

export { getFirstSentence };
