export interface SponsorSegment {
  segment: [number, number]; // [startTime, endTime]
  category: string;
  UUID: string;
  actionType: string;
}

const SB_API = "https://sponsor.ajay.app/api";

// Categories to skip by default
const SKIP_CATEGORIES = [
  "sponsor",
  "selfpromo",
  "interaction",
  "intro",
  "outro",
  "music_offtopic",
];

async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getSegments(videoId: string): Promise<SponsorSegment[]> {
  try {
    // Privacy-preserving: send only hash prefix
    const hash = await sha256Hex(videoId);
    const prefix = hash.slice(0, 4);

    const resp = await fetch(
      `${SB_API}/skipSegments/${prefix}?categories=${encodeURIComponent(JSON.stringify(SKIP_CATEGORIES))}`
    );

    if (resp.status === 404) return []; // No segments found
    if (!resp.ok) return [];

    const allResults: { videoID: string; segments: SponsorSegment[] }[] = await resp.json();
    const match = allResults.find((r) => r.videoID === videoId);
    return match?.segments ?? [];
  } catch (e) {
    console.warn("SponsorBlock fetch failed:", e);
    return [];
  }
}

/** Category display info */
export const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  sponsor: { label: "Sponsor", color: "#00d400" },
  selfpromo: { label: "Self-Promotion", color: "#ffff00" },
  interaction: { label: "Interaction", color: "#cc00ff" },
  intro: { label: "Intro", color: "#00ffff" },
  outro: { label: "Outro", color: "#0202ed" },
  music_offtopic: { label: "Non-Music", color: "#ff9900" },
};
