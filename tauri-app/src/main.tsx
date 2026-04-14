import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { fetch } from "@tauri-apps/plugin-http";
import App from "./App";

// Override globalThis.fetch so all libraries (Appwrite, etc.) route
// through Tauri's HTTP plugin, which works on Android/iOS.
globalThis.fetch = fetch as typeof globalThis.fetch;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
