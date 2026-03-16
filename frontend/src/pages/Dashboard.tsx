import { Link } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
import { useHotkeys } from "@mantine/hooks";
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Loader,
  Badge,
  Paper,
  Grid,
} from "@mantine/core";
import {
  GetRandomEntity,
  GetExtendedStats,
  GetNavigationHistory,
  GetMarkedEntities,
  GetTopHubs,
} from "@wailsjs/go/app/App";
import { GetAllEntities } from "@wailsjs/go/services/EntityService";
import { IconSparkles, IconPlus } from "@tabler/icons-react";
import { StatsCards, DashboardStats } from "@components/Dashboard/StatsCards";
import { NavigationHistory } from "@components/Dashboard/NavigationHistory";
import { Workbench } from "@components/Dashboard/Workbench";
import { HubsList } from "@components/Dashboard/HubsList";
import { DefinitionRenderer } from "@components/ItemDetail/DefinitionRenderer";
import { useUI } from "@/contexts/UIContext";
import { appConfig } from "@/config";
import { db } from "@models";

export default function Dashboard() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showMarked, setShowMarked } = useUI();

  const [allItems, setAllItems] = useState<db.Entity[] | null>(null);
  const [randomItem, setRandomItem] = useState<db.Entity | null>(null);
  const [isLoadingRandom, setIsLoadingRandom] = useState(true);
  const [extendedStats, setExtendedStats] = useState<unknown>(null);
  const [navigationHistory, setNavigationHistory] = useState<db.Entity[]>([]);
  const [markedItems, setMarkedItems] = useState<db.Entity[]>([]);
  const [topHubs, setTopHubs] = useState<db.Entity[]>([]);

  useEffect(() => {
    GetAllEntities()
      .then(setAllItems)
      .catch(() => {});
    GetExtendedStats()
      .then(setExtendedStats)
      .catch(() => {});
    GetNavigationHistory()
      .then((h) => setNavigationHistory(h || []))
      .catch(() => {});
  }, []);

  const loadDashboardData = useCallback(() => {
    GetMarkedEntities()
      .then((m) => setMarkedItems(m || []))
      .catch(() => {});
    GetTopHubs(20)
      .then((h) => setTopHubs(h || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refetchRandomItem = useCallback(() => {
    setIsLoadingRandom(true);
    GetRandomEntity()
      .then(setRandomItem)
      .catch(() => {})
      .finally(() => setIsLoadingRandom(false));
  }, []);

  useEffect(() => {
    refetchRandomItem();
  }, [refetchRandomItem]);

  useHotkeys([
    [
      "mod+r",
      (e) => {
        e.preventDefault();
        refetchRandomItem();
      },
    ],
  ]);

  const handleToggleShowMarked = async () => {
    setShowMarked(!showMarked);
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed">Your literary ecosystem at a glance</Text>
        </div>
        <Button
          component={Link}
          to="/item/new?tab=detail"
          leftSection={<IconPlus size={20} />}
        >
          New Item
        </Button>
      </Group>

      <div style={{ marginBottom: "var(--mantine-spacing-xl)" }}>
        <NavigationHistory history={navigationHistory || []} />
      </div>

      <div style={{ marginBottom: "var(--mantine-spacing-xl)" }}>
        <StatsCards
          stats={(extendedStats as unknown as DashboardStats) || null}
        />
      </div>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Stack gap="md">
            {showMarked ? (
              <Workbench
                items={markedItems || []}
                onToggle={handleToggleShowMarked}
                onRefresh={loadDashboardData}
              />
            ) : (
              <HubsList
                hubs={topHubs || []}
                onToggle={handleToggleShowMarked}
                onRefresh={loadDashboardData}
              />
            )}
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper radius="md" withBorder p="md" h="100%">
            <Group mb="md" justify="space-between">
              <Group>
                <IconSparkles size={20} />
                <Text fw={500}>Random Discovery</Text>
              </Group>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => refetchRandomItem()}
                loading={isLoadingRandom}
              >
                Shuffle
              </Button>
            </Group>

            {isLoadingRandom ? (
              <Group justify="center" p="xl">
                <Loader />
              </Group>
            ) : randomItem ? (
              <Stack
                gap="md"
                justify="center"
                h="100%"
                style={{ minHeight: 300 }}
              >
                <Stack gap="xs" align="center" ta="center">
                  <Badge
                    size="lg"
                    variant="light"
                    color={
                      appConfig.entityTypes.find(
                        (t) => t.slug === randomItem.typeSlug,
                      )?.color || "gray"
                    }
                  >
                    {randomItem.typeSlug}
                  </Badge>
                  <Title order={2} style={{ fontSize: "2rem" }}>
                    <Link
                      to={`/item/${randomItem.id}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {randomItem.primaryLabel}
                    </Link>
                  </Title>
                  {randomItem.description && (
                    <div
                      style={{
                        maxWidth: "80%",
                        textAlign: "left",
                        maxHeight: "300px",
                        overflow: "hidden",
                        position: "relative",
                        maskImage:
                          "linear-gradient(to bottom, black 80%, transparent 100%)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, black 80%, transparent 100%)",
                      }}
                    >
                      <DefinitionRenderer
                        text={randomItem.description}
                        allEntities={allItems || []}
                        stopAudio={() => {
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current = null;
                          }
                        }}
                        currentAudioRef={audioRef}
                        entity={randomItem}
                      />
                    </div>
                  )}
                  <Button
                    component={Link}
                    to={`/item/${randomItem.id}`}
                    variant="light"
                    mt="md"
                  >
                    View Details
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Text ta="center" c="dimmed">
                No items found.
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
