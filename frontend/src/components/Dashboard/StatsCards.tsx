import { SimpleGrid, Paper, Text, Group, ThemeIcon } from "@mantine/core";
import {
  IconTrendingUp,
  IconLink as IconLinkIcon,
  IconQuote,
  IconBook,
  IconFeather,
  IconHeading,
  IconTypography,
  IconAlertTriangle,
  IconPencil,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";

export interface DashboardStats {
  totalEntities: number;
  totalLinks: number;
  quoteCount: number;
  citedCount: number;
  writerCount: number;
  poetCount: number;
  titleCount: number;
  wordCount: number;
  errorCount: number;
}

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  const items = [
    {
      title: "Total Items",
      value: stats.totalEntities || 0,
      icon: IconTrendingUp,
      color: "blue",
      to: "/tables?table=items",
    },
    {
      title: "Poems",
      value: stats.quoteCount || 0,
      icon: IconQuote,
      color: "grape",
      to: "/tables?table=items&filter=quotes",
    },
    {
      title: "Writers",
      value: stats.writerCount || 0,
      icon: IconFeather,
      color: "pink",
      to: "/tables?table=items&filter=writer",
    },
    {
      title: "Words",
      value: stats.wordCount || 0,
      icon: IconTypography,
      color: "indigo",
      to: "/tables?table=items&filter=reference",
    },
    {
      title: "Total Links",
      value: stats.totalLinks || 0,
      icon: IconLinkIcon,
      color: "cyan",
      to: "/tables?table=links",
    },
    {
      title: "Sourced",
      value: stats.citedCount || 0,
      icon: IconBook,
      color: "green",
      to: "/tables?table=items&filter=cited",
      disabled: true,
    },
    {
      title: "Poets",
      value: stats.poetCount || 0,
      icon: IconPencil,
      color: "teal",
      to: "/tables?table=items&filter=poets",
      disabled: false,
    },
    {
      title: "Titles",
      value: stats.titleCount || 0,
      icon: IconHeading,
      color: "violet",
      to: "/tables?table=items&filter=title",
    },
    {
      title: "Errors",
      value: stats.errorCount || 0,
      icon: IconAlertTriangle,
      color: "red",
      to: "/reports",
    },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
      {items
        .filter((item) => !item.disabled)
        .map((item) => (
          <Paper
            key={item.title}
            component={Link}
            to={item.to}
            withBorder
            p="md"
            radius="md"
            style={{
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="xs" tt="uppercase" fw={700}>
                  {item.title}
                </Text>
                <Text fw={700} size="xl">
                  {item.value.toLocaleString()}
                </Text>
              </div>
              <ThemeIcon
                color={item.color}
                variant="light"
                size={38}
                radius="md"
              >
                <item.icon size={20} />
              </ThemeIcon>
            </Group>
          </Paper>
        ))}
    </SimpleGrid>
  );
}
