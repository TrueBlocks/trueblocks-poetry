import { Outlet, Link, useLocation } from "react-router-dom";
import {
  AppShell,
  NavLink,
  Group,
  Title,
  Text,
  Button,
  Stack,
  Divider,
} from "@mantine/core";
import {
  IconHome,
  IconSearch,
  IconBook,
  IconMoon,
  IconSun,
  IconDownload,
  IconSettings,
  IconFileText,
  IconTable,
  IconFlask,
} from "@tabler/icons-react";
import useDarkMode from "@hooks/useDarkMode";
import Footer from "./Footer";
import { LogInfo } from "@wailsjs/runtime/runtime.js";
import { useUI } from "@/contexts/UIContext";
import { appConfig } from "@/config";

interface LayoutProps {
  stats?: Record<string, number> | null;
}

export default function Layout({ stats }: LayoutProps) {
  const location = useLocation();
  const { isDark, toggle } = useDarkMode();
  const { sidebarWidth, setSidebarWidth, lastWordId } = useUI();

  // Icon-only mode when sidebar is narrower than 120px
  // Minimum width is 60px to accommodate icons
  const iconOnlyThreshold = 120;
  const minWidth = 60;
  const showLabels = sidebarWidth >= iconOnlyThreshold;

  return (
    <AppShell
      navbar={{ width: sidebarWidth, breakpoint: "sm" }}
      padding="md"
      style={{ borderTop: "1px solid var(--mantine-color-gray-4)" }}
    >
      <AppShell.Navbar
        p="md"
        style={{
          borderRight: "1px solid var(--mantine-color-gray-4)",
          borderTop: "1px solid var(--mantine-color-gray-4)",
        }}
      >
        <AppShell.Section>
          {showLabels ? (
            <>
              <Group>
                <IconBook />
                <Title order={3}>Poetry DB</Title>
              </Group>
              {stats && (
                <Text size="sm" c="dimmed">
                  {stats.items?.toLocaleString() || 0} words
                </Text>
              )}
            </>
          ) : (
            <Group justify="center">
              <IconBook />
            </Group>
          )}
        </AppShell.Section>

        <Divider my="md" />

        <AppShell.Section grow>
          <Stack gap="xs">
            <NavLink
              component={Link}
              to="/"
              label={showLabels ? "Dashboard" : undefined}
              leftSection={<IconHome size={20} />}
              active={location.pathname === "/"}
              onClick={() => LogInfo("[Layout] Dashboard link clicked")}
            />
            <NavLink
              component={Link}
              to={
                lastWordId
                  ? `/item/${lastWordId}?tab=detail`
                  : `/item/1?tab=detail`
              }
              label={showLabels ? "Item" : undefined}
              leftSection={<IconBook size={20} />}
              active={location.pathname.startsWith("/item")}
              onClick={(e) => {
                if (location.pathname.startsWith("/item")) {
                  e.preventDefault();
                }
              }}
            />
            <NavLink
              component={Link}
              to="/search"
              label={showLabels ? "Search" : undefined}
              leftSection={<IconSearch size={20} />}
              active={location.pathname === "/search"}
            />
            <NavLink
              component={Link}
              to="/tables"
              label={showLabels ? "Tables" : undefined}
              leftSection={<IconTable size={20} />}
              active={location.pathname === "/tables"}
            />
            <NavLink
              component={Link}
              to="/reports"
              label={showLabels ? "Reports" : undefined}
              leftSection={<IconFileText size={20} />}
              active={location.pathname === "/reports"}
            />
            <NavLink
              component={Link}
              to="/export"
              label={showLabels ? "Export" : undefined}
              leftSection={<IconDownload size={20} />}
              active={location.pathname === "/export"}
            />
            <NavLink
              component={Link}
              to="/settings"
              label={showLabels ? "Settings" : undefined}
              leftSection={<IconSettings size={20} />}
              active={location.pathname === "/settings"}
            />

            <Divider
              my="xs"
              label={showLabels ? "Entities" : undefined}
              labelPosition="center"
            />
            {appConfig.entityTypes
              .filter(
                (type) =>
                  !["person", "character", "cliche", "term"].includes(
                    type.slug,
                  ),
              )
              .map((type) => (
                <NavLink
                  key={type.slug}
                  component={Link}
                  to={`/entities/${type.slug}`}
                  label={showLabels ? type.displayName : undefined}
                  leftSection={<IconTable size={20} />}
                  active={location.pathname.startsWith(
                    `/entities/${type.slug}`,
                  )}
                />
              ))}

            <NavLink
              component={Link}
              to="/experimental"
              label={showLabels ? "Experimental" : undefined}
              leftSection={<IconFlask size={20} />}
              active={location.pathname === "/experimental"}
              onClick={() => LogInfo("[Layout] Experimental link clicked")}
            />
          </Stack>
        </AppShell.Section>

        <Divider my="md" />

        <AppShell.Section>
          <Button
            fullWidth
            variant="light"
            leftSection={
              showLabels ? (
                isDark ? (
                  <IconSun size={20} />
                ) : (
                  <IconMoon size={20} />
                )
              ) : undefined
            }
            onClick={toggle}
          >
            {showLabels ? (
              isDark ? (
                "Light Mode"
              ) : (
                "Dark Mode"
              )
            ) : isDark ? (
              <IconSun size={20} />
            ) : (
              <IconMoon size={20} />
            )}
          </Button>
        </AppShell.Section>

        {stats && (
          <>
            <Divider my="md" />
            <AppShell.Section>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Links:
                  </Text>
                  <Text size="xs">{stats.links?.toLocaleString() || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Clichés:
                  </Text>
                  <Text size="xs">{stats.cliches?.toLocaleString() || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Names:
                  </Text>
                  <Text size="xs">{stats.names?.toLocaleString() || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    Literary Terms:
                  </Text>
                  <Text size="xs">
                    {stats.literary_terms?.toLocaleString() || 0}
                  </Text>
                </Group>
              </Stack>
            </AppShell.Section>
          </>
        )}
      </AppShell.Navbar>

      <div
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = sidebarWidth;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            // Only enforce minimum width to protect icons
            if (newWidth >= minWidth) {
              setSidebarWidth(newWidth);
            }
          };

          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
        style={{
          position: "fixed",
          left: sidebarWidth,
          top: 0,
          bottom: 0,
          width: "4px",
          cursor: "ew-resize",
          backgroundColor: "transparent",
          zIndex: 1000,
        }}
      />

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
