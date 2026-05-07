import { Command, type Child } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";

const COMPANION_PORT = 8282;
const COMPANION_BASE = `http://localhost:${COMPANION_PORT}`;

let companionProcess: Child | null = null;

export function getCompanionBase(): string {
  return COMPANION_BASE;
}

export async function getDashManifestUrl(videoId: string): Promise<string> {
  const isAndroid = (window as any).__TAURI_INTERNALS__?.platform === "android";
  
  if (isAndroid) {
    try {
      const response = await invoke<{dashUrl: string}>("plugin:newpipe|get_dash_url", { videoId });
      const rewrittenXml = await invoke<string>("fetch_and_rewrite_manifest", { url: response.dashUrl });
      return URL.createObjectURL(new Blob([rewrittenXml], { type: "application/dash+xml" }));
    } catch (e) {
      console.error("Failed to fetch dash manifest from NewPipe:", e);
      throw e;
    }
  }

  return `${COMPANION_BASE}/companion/api/manifest/dash/id/${videoId}?local=true`;
}

export async function startCompanion(): Promise<void> {
  if (companionProcess) return;

  const secretKey = import.meta.env.VITE_COMPANION_SECRET_KEY;
  if (!secretKey) {
    throw new Error("VITE_COMPANION_SECRET_KEY is not set in .env");
  }

  const command = Command.sidecar("binaries/invidious-companion", [], {
    env: {
      SERVER_SECRET_KEY: secretKey,
    },
  });

  command.on("error", (error) => {
    console.error("[companion] error:", error);
  });

  command.stdout.on("data", (line) => {
    console.log("[companion]", line);
  });

  command.stderr.on("data", (line) => {
    console.error("[companion]", line);
  });

  const child = await command.spawn();
  companionProcess = child;

  await waitForReady();
}

async function waitForReady(): Promise<void> {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await invoke<string>("proxy_fetch", {
        url: `${COMPANION_BASE}/healthz`,
      });
      if (result) {
        console.log("[companion] ready on port", COMPANION_PORT);
        return;
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Companion failed to start within 30 seconds");
}

export async function stopCompanion(): Promise<void> {
  if (companionProcess) {
    await companionProcess.kill();
    companionProcess = null;
    console.log("[companion] stopped");
  }
}
