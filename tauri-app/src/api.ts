import { invoke } from "@tauri-apps/api/core";

const BASE_URL = "https://api.piped.private.coffee";

async function tauriFetch(url: string): Promise<unknown> {
  try {
    const text = await invoke<string>("proxy_fetch", { url });
    return JSON.parse(text);
  } catch (e) {
    throw new Error(String(e));
  }
}

export interface VideoResult {
  type: string;
  title: string;
  videoId: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  thumbnail: string;
  viewCount: number;
  lengthSeconds: number;
  publishedText: string;
}

export interface FormatStream {
  url: string;
  format: string;
  quality: string;
  mimeType: string;
  videoOnly: boolean;
}

export interface VideoDetails {
  title: string;
  videoId: string;
  thumbnailUrl: string;
  description: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  lengthSeconds: number;
  viewCount: number;
  videoStreams: FormatStream[];
}

interface PipedSearchResult {
  items: {
    url: string;
    type: string;
    title: string;
    thumbnail: string;
    uploaderName: string;
    uploaderUrl: string;
    uploaderAvatar: string;
    uploadedDate: string;
    duration: number;
    views: number;
    isShort: boolean;
  }[];
}

interface PipedStreamResult {
  title: string;
  description: string;
  uploader: string;
  uploaderUrl: string;
  uploaderAvatar: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  videoStreams: {
    url: string;
    format: string;
    quality: string;
    mimeType: string;
    videoOnly: boolean;
    itag: number;
  }[];
}

function extractVideoId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/);
  return match?.[1] ?? url.replace("/watch?v=", "");
}

function extractChannelId(url: string): string {
  return url.replace("/channel/", "");
}

export async function searchVideos(query: string): Promise<VideoResult[]> {
  const data = (await tauriFetch(
    `${BASE_URL}/search?q=${encodeURIComponent(query)}&filter=videos`
  )) as PipedSearchResult;

  return data.items
    .filter((item) => item.type === "stream" && !item.isShort)
    .map((item) => ({
      type: "video",
      title: item.title,
      videoId: extractVideoId(item.url),
      author: item.uploaderName,
      authorId: extractChannelId(item.uploaderUrl),
      authorAvatar: item.uploaderAvatar ?? "",
      thumbnail: item.thumbnail,
      viewCount: item.views,
      lengthSeconds: item.duration,
      publishedText: item.uploadedDate ?? "",
    }));
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const data = (await tauriFetch(
    `${BASE_URL}/streams/${encodeURIComponent(videoId)}`
  )) as PipedStreamResult;

  return {
    title: data.title,
    videoId,
    thumbnailUrl: data.thumbnailUrl,
    description: data.description,
    author: data.uploader,
    authorId: extractChannelId(data.uploaderUrl),
    authorAvatar: data.uploaderAvatar ?? "",
    lengthSeconds: data.duration,
    viewCount: data.views,
    videoStreams: data.videoStreams,
  };
}

export function getThumbnailUrl(video: VideoResult): string {
  return video.thumbnail;
}

export function getChannelAvatarUrl(video: { authorAvatar: string }): string {
  return video.authorAvatar;
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
