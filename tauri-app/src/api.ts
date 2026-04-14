const BASE_URL = "https://inv.thepixora.com/api/v1";

export interface VideoResult {
  type: string;
  title: string;
  videoId: string;
  author: string;
  authorId: string;
  authorUrl: string;
  videoThumbnails: { quality: string; url: string; width: number; height: number }[];
  viewCount: number;
  lengthSeconds: number;
  publishedText: string;
}

export interface FormatStream {
  url: string;
  itag: string;
  type: string;
  quality: string;
  container: string;
  resolution: string;
}

export interface VideoDetails {
  title: string;
  videoId: string;
  videoThumbnails: { quality: string; url: string; width: number; height: number }[];
  description: string;
  author: string;
  authorId: string;
  authorThumbnails: { url: string; width: number; height: number }[];
  lengthSeconds: number;
  viewCount: number;
  formatStreams: FormatStream[];
}

export async function searchVideos(query: string): Promise<VideoResult[]> {
  const res = await fetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&type=video`
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const res = await fetch(`${BASE_URL}/videos/${encodeURIComponent(videoId)}`);
  if (!res.ok) throw new Error(`Video fetch failed: ${res.status}`);
  return res.json();
}

export function getThumbnailUrl(video: VideoResult): string {
  const medium = video.videoThumbnails.find((t) => t.quality === "medium");
  return medium?.url ?? video.videoThumbnails[0]?.url ?? "";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}
