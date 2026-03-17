import React from "react";
import { Link } from "react-router-dom";
import { Paper, Badge, Title, Text, Stack, Group } from "@mantine/core";
import { DefinitionRenderer } from "@components/ItemDetail/DefinitionRenderer";
import { SearchResultImage } from "./SearchResultImage";
import { getFirstSentence } from "./SearchResultCard";
import { db } from "@models";

interface SqlResultsListProps {
  results: Record<string, unknown>[];
  allItems: db.Entity[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const SqlResultsList = ({
  results,
  allItems,
  audioRef,
}: SqlResultsListProps) => {
  return (
    <Stack>
      {results.map((row, index: number) => {
        const item = { ...row } as Record<string, unknown> & Partial<db.Entity>;
        if ("item_id" in item && item.item_id && !item.id) {
          item.id = item.item_id as number;
        }
        const isItem = item.id && item.primaryLabel;

        return (
          <Paper key={index} p="md" withBorder shadow="sm" radius="md">
            {isItem ? (
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Group align="flex-start" wrap="nowrap">
                    {item.typeSlug === "writer" && item.id && (
                      <SearchResultImage id={item.id} />
                    )}
                    <Link
                      to={`/item/${item.id ?? 0}?tab=detail`}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <Title order={3}>{item.primaryLabel}</Title>
                    </Link>
                  </Group>
                  {item.typeSlug && <Badge>{item.typeSlug}</Badge>}
                </Group>
                {item.description && (
                  <DefinitionRenderer
                    text={getFirstSentence(item.description as string)}
                    allEntities={allItems}
                    stopAudio={() => {}}
                    currentAudioRef={audioRef}
                    entity={item as db.Entity}
                  />
                )}
              </Stack>
            ) : (
              <Stack gap="xs">
                {Object.entries(row).map(([k, v]) => (
                  <Group key={k} align="flex-start">
                    <Text fw={700} size="sm" style={{ minWidth: 100 }}>
                      {k}:
                    </Text>
                    <Text size="sm" style={{ primaryLabelBreak: "break-all" }}>
                      {String(v)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
};
