import React from "react";
import { createRoot } from "react-dom/client";
import "@xyflow/react/dist/style.css";
import "./style.css";
import App from "./App.jsx";
import { HelpProvider } from "./components/Help.jsx";

createRoot(document.getElementById("root")).render(
  <HelpProvider>
    <App />
  </HelpProvider>,
);
