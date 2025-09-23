// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import AppShellLayout from "./shell/AppShellLayout.jsx";

// Pages
import Home from "./pages/Home.jsx";
import GoshudhPage from "./pages/Goshudh.jsx";
import TrinetraPage from "./pages/Trinetra.jsx";
import GroshaatPage from "./pages/Groshaat.jsx";
import JarPage from "./pages/Jar.jsx";
import UploadLabels from "./pages/UploadLabels.jsx"; // ← new

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShellLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "goshudh", element: <GoshudhPage /> },
      { path: "trinetra", element: <TrinetraPage /> },
      { path: "groshaat", element: <GroshaatPage /> },
      { path: "jar", element: <JarPage /> },
      { path: "upload", element: <UploadLabels /> }, // ← new route
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MantineProvider
      theme={{
        fontFamily:
          "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
        headings: {
          fontFamily:
            "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
        },
        defaultRadius: "md",
        primaryColor: "blue",
      }}
      forceColorScheme="light"
    >
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>
);
