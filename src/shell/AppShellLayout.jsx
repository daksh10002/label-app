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
  ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function AppShellLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { pathname } = useLocation();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      withBorder={true}
      padding="md"
      style={{ background: "#f6f7f9", color: "black" }}
    >
      {/* ---------- Header ---------- */}
      <AppShellHeader withBorder>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} c="black">
              Sticker Studio
            </Title>
          </Group>
          <Text size="sm" c="dimmed">
            Supabase + React + Mantine
          </Text>
        </Group>
      </AppShellHeader>

      {/* ---------- Sidebar Navigation ---------- */}
      <AppShellNavbar p="sm" withBorder>
        <ScrollArea>
          {/* Home */}
          <NavLink
            component={Link}
            to="/"
            label="Home"
            active={pathname === "/"}
            styles={{ label: { color: "black" } }}
          />

          {/* Brand Labels */}
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

          {/* Collapsible group for smaller sticker sizes */}
          <NavLink
            label="Small Stickers"
            defaultOpened
            childrenOffset={12}
            styles={{ label: { color: "black", fontWeight: 600 } }}
          >
            <NavLink
              component={Link}
              to="/jar"
              label="Jar Stickers (38×25 mm)"
              active={pathname.startsWith("/jar")}
              styles={{ label: { color: "black" } }}
            />
            <NavLink
              component={Link}
              to="/katta"
              label="Katta Stickers (38×24 mm)"
              active={pathname.startsWith("/katta")}
              styles={{ label: { color: "black" } }}
            />
          </NavLink>

          {/* Upload Labels */}
          <NavLink
            component={Link}
            to="/upload"
            label="Upload Labels"
            active={pathname.startsWith("/upload")}
            styles={{ label: { color: "black" } }}
          />
        </ScrollArea>
      </AppShellNavbar>

      {/* ---------- Main Body ---------- */}
      <AppShellMain>
        <Outlet />
      </AppShellMain>
    </AppShell>
  );
}
