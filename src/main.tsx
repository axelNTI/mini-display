import { availableMonitors, getCurrentWindow } from "@tauri-apps/api/window";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

import "@unocss/reset/eric-meyer.css";
import "@unocss/reset/sanitize/sanitize.css";
import "virtual:uno.css";

const setupWindow = async () => {
  const monitors = await availableMonitors();

  await getCurrentWindow().setFullscreenOnMonitor(monitors[2].position);
};

setupWindow();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
