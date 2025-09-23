// src/shell/AppShellLayout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Burger,
  Group,
  NavLink,
  Title,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function AppShellLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      withBorder={true}
      padding="md"
      style={{ background: "#f6f7f9", color: "black" }}
    >
      <AppShellHeader withBorder>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} c="black">Label Maker</Title>
          </Group>
          <Text size="sm" c="dimmed">Standalone — Supabase + React</Text>
        </Group>
      </AppShellHeader>

      <AppShellNavbar p="sm" withBorder>
        <NavLink
          component={Link}
          to="/"
          label="Home"
          active={pathname === "/"}
          styles={{ label: { color: "black" } }}
        />
        <NavLink
          component={Link}
          to="/goshudh"
          label="Goshudh"
          active={pathname.startsWith("/goshudh")}
          styles={{ label: { color: "black" } }}
        />
        <NavLink
          component={Link}
          to="/trinetra"
          label="Trinetra"
          active={pathname.startsWith("/trinetra")}
          styles={{ label: { color: "black" } }}
        />
        <NavLink
          component={Link}
          to="/groshaat"
          label="Groshaat"
          active={pathname.startsWith("/groshaat")}
          styles={{ label: { color: "black" } }}
        />
        <NavLink
          component={Link}
          to="/jar"
          label="Jar Stickers"
          active={pathname.startsWith("/jar")}
          styles={{ label: { color: "black" } }}
        />
        {/* NEW: Upload Labels */}
        <NavLink
          component={Link}
          to="/upload"
          label="Upload Labels"
          active={pathname.startsWith("/upload")}
          styles={{ label: { color: "black" } }}
        />
      </AppShellNavbar>

      <AppShellMain>
        <Outlet />
      </AppShellMain>
    </AppShell>
  );
}
