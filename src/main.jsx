import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

// 🧩 Layout
import AppShellLayout from "./shell/AppShellLayout.jsx";

// 🏷️ Pages
// 🏷️ Pages
import Home from "./pages/Home.jsx";
import TrinetraPage from "./pages/Trinetra.jsx";
import JarPage from "./pages/Jar.jsx";
import KattaPage from "./pages/Katta.jsx";
import NewLabelsPage from "./pages/NewLabels.jsx";
import NewLabels_3x3_Page from "./pages/NewLabels_3x3.jsx";
import UploadLabels from "./pages/UploadLabels.jsx";
import ManageLabels from "./pages/ManageLabels.jsx";

// 🧭 Router setup
const router = createHashRouter([
  {
    path: "/",
    element: <AppShellLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "trinetra", element: <TrinetraPage /> },
      { path: "jar", element: <JarPage /> },
      { path: "katta", element: <KattaPage /> },
      { path: "new-labels", element: <NewLabelsPage /> },
      { path: "new-labels-3x3", element: <NewLabels_3x3_Page /> },
      { path: "upload", element: <UploadLabels /> },
      { path: "manage", element: <ManageLabels /> },
    ],
  },
]);

// ⚙️ Render app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MantineProvider
      theme={{
        fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
        headings: { fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif" },
        defaultRadius: "md",
        primaryColor: "blue",
      }}
      forceColorScheme="light"
    >
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>
);
