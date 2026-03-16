import { Container, Title, Text, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { CheckpointDatabase } from "@wailsjs/go/app/App";
import { LinkIntegrityReport, ItemHealthReport } from "@components/Reports";
import { LogError } from "@utils/logger";

export default function Reports() {
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        try {
          await CheckpointDatabase();
        } catch (error) {
          LogError(`Failed to checkpoint database: ${error}`);
        }
        setReloadKey((k) => k + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Container size="100%" py="xl" px="xl">
      <Stack gap="sm">
        <div>
          <Title order={1} mb="xs">
            Reports
          </Title>
          <Text c="dimmed">Data quality and analysis reports</Text>
        </div>

        <LinkIntegrityReport key={`link-${reloadKey}`} />
        <ItemHealthReport key={`health-${reloadKey}`} />
      </Stack>
    </Container>
  );
}
