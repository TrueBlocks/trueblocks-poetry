import { useState, useEffect, useRef } from "react";
import { Group, Text } from "@mantine/core";
import { GetSettings, GetEntity } from "@wailsjs/go/app/App";

export default function Footer() {
  const [settings, setSettings] = useState<{
    lastWordId?: number;
    currentSearch?: string;
  } | null>(null);
  const [currentItem, setCurrentItem] = useState<{
    primaryLabel?: string;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadSettings = () => {
      GetSettings()
        .then(setSettings)
        .catch(() => {});
    };
    loadSettings();
    intervalRef.current = setInterval(loadSettings, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (settings?.lastWordId && settings.lastWordId > 0) {
      GetEntity(settings.lastWordId)
        .then(setCurrentItem)
        .catch(() => {});
    }
  }, [settings?.lastWordId]);

  let currentItemDisplay = "None - Select an item";
  if (currentItem?.primaryLabel) {
    currentItemDisplay = currentItem.primaryLabel;
  }

  const currentSearch = settings?.currentSearch || "";

  return (
    <Group
      justify="space-between"
      px="md"
      py="xs"
      style={{
        borderTop: "1px solid var(--mantine-color-gray-4)",
        backgroundColor: "var(--mantine-color-body)",
        minHeight: "32px",
      }}
    >
      <Text size="xs" c="dimmed">
        DB: poetry.db
      </Text>
      <Group gap="xl">
        {currentSearch && <Text size="xs">Search: {currentSearch}</Text>}
        <Text size="xs" c={currentItem?.primaryLabel ? undefined : "dimmed"}>
          Current: {currentItemDisplay}
        </Text>
      </Group>
    </Group>
  );
}
