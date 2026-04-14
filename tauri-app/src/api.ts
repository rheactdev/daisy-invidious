import { Innertube, Platform } from "youtubei.js";
import { invoke } from "@tauri-apps/api/core";
import { getDashManifestUrl } from "./companion";

Platform.shim.eval = (data, env) => {
  const keys = Object.keys(env);
  const values = keys.map((k) => env[k]);
  const exportNames = data.exported;
  const body = `${keys.map((k, i) => `var ${k} = __env__[${i}];`).join("\n")}
${data.output}
return { ${exportNames.join(", ")} };`;
  const fn = new Function("__env__", body);
  return fn(values);
};

interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

async function tauriFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let url: string;
  let method: string;
  let headers: Record<string, string> = {};
  let body: string | undefined;

  if (input instanceof Request) {
    url = input.url;
    method = init?.method ?? input.method ?? "GET";
    input.headers.forEach((v, k) => {
      headers[k] = v;
    });
    if (init?.body) {
      body = typeof init.body === "string" ? init.body : undefined;
    } else if (input.body) {
      try {
        body = await input.text();
      } catch {
        // no body
      }
    }
  } else {
    url = typeof input === "string" ? input : input.toString();
    method = init?.method ?? "GET";
  }

  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => {
        headers[k] = v;
      });
    } else if (Array.isArray(init.headers)) {
      for (const [k, v] of init.headers) {
        headers[k] = v;
      }
    } else {
      Object.assign(headers, init.headers);
    }
  }

  if (init?.body && !body) {
    if (typeof init.body === "string") {
      body = init.body;
    } else if (init.body instanceof ArrayBuffer) {
      body = new TextDecoder().decode(init.body);
    } else if (init.body instanceof Uint8Array) {
      body = new TextDecoder().decode(init.body);
    }
  }

  const result = await invoke<ProxyResponse>("proxy_request", {
    url,
    method,
    headers,
    body: body ?? null,
  });

  return new Response(result.body, {
    status: result.status,
    headers: result.headers,
  });
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
  dashManifestUrl: string;
}

let ytClient: Innertube | null = null;

async function getClient(): Promise<Innertube> {
  if (!ytClient) {
    try {
      ytClient = await Innertube.create({
        fetch: tauriFetch as unknown as typeof globalThis.fetch,
      });
    } catch (e) {
      console.error("Failed to create Innertube client:", e);
      throw e;
    }
  }
  return ytClient;
}

function parseViewCount(text: string | undefined): number {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export async function searchVideos(query: string): Promise<VideoResult[]> {
  const yt = await getClient();
  const search = await yt.search(query, { type: "video" });

  const seen = new Set<string>();
  return search.videos
    .filter((v: { id?: string }) => {
      if (!v.id || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    })
    .map((v: {
      id?: string;
      title?: { text?: string } | string;
      author?: { name?: string; id?: string; best_thumbnail?: { url?: string } };
      best_thumbnail?: { url?: string };
      view_count?: { text?: string };
      duration?: { seconds?: number; text?: string };
      published?: { text?: string };
    }) => ({
      type: "video",
      title: (typeof v.title === "object" ? v.title?.text : v.title) ?? "",
      videoId: v.id ?? "",
      author: v.author?.name ?? "",
      authorId: v.author?.id ?? "",
      authorAvatar: fixUrl(v.author?.best_thumbnail?.url ?? ""),
      thumbnail: fixUrl(v.best_thumbnail?.url ?? ""),
      viewCount: parseViewCount(v.view_count?.text),
      lengthSeconds: v.duration?.seconds ?? 0,
      publishedText: v.published?.text ?? "",
    }));
}

/** Fix protocol-relative URLs */
function fixUrl(url: string): string {
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

export async function getVideoDetails(
  videoId: string
): Promise<VideoDetails> {
  const yt = await getClient();
  const info = await yt.getInfo(videoId);
  const basic = info.basic_info;

  // info.secondary_info.owner.author has the channel avatar
  const ownerThumb =
    info.secondary_info?.owner?.author?.best_thumbnail?.url ?? "";

  return {
    title: basic.title ?? "",
    videoId,
    thumbnailUrl: fixUrl(basic.thumbnail?.[0]?.url ?? ""),
    description: basic.short_description ?? "",
    author: basic.author ?? "",
    authorId: basic.channel_id ?? "",
    authorAvatar: fixUrl(ownerThumb),
    lengthSeconds: basic.duration ?? 0,
    viewCount: basic.view_count ?? 0,
    dashManifestUrl: getDashManifestUrl(videoId),
  };
}

export async function getChannelVideos(channelId: string): Promise<VideoResult[]> {
  const yt = await getClient();
  const channel = await yt.getChannel(channelId);

  const channelName = channel.metadata?.title ?? "";
  let channelAvatar = "";

  // Try C4TabbedHeader.author.best_thumbnail
  const header = channel.header;
  if (header) {
    const h = header as unknown as Record<string, unknown>;
    // C4TabbedHeader has .author.best_thumbnail
    const author = h.author as { best_thumbnail?: { url?: string }; thumbnails?: { url: string }[] } | undefined;
    if (author?.best_thumbnail?.url) {
      channelAvatar = author.best_thumbnail.url;
    } else if (author?.thumbnails?.length) {
      channelAvatar = author.thumbnails[0].url;
    }
    // PageHeader has .content.image.avatar.image (Thumbnail[])
    if (!channelAvatar) {
      const content = h.content as { image?: { avatar?: { image?: { url: string }[] } } } | undefined;
      if (content?.image?.avatar?.image?.length) {
        channelAvatar = content.image.avatar.image[0].url;
      }
    }
  }

  // Fallback to metadata avatar/thumbnail
  if (!channelAvatar) {
    const avatars = channel.metadata?.avatar as { url: string }[] | undefined;
    const thumbs = channel.metadata?.thumbnail as { url: string }[] | undefined;
    if (avatars?.length) {
      channelAvatar = avatars[0].url;
    } else if (thumbs?.length) {
      channelAvatar = thumbs[0].url;
    }
  }

  channelAvatar = fixUrl(channelAvatar);

  const videosTab = await channel.getVideos();

  const seen = new Set<string>();
  return videosTab.videos
    .filter((v: { id?: string }) => {
      if (!v.id || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    })
    .slice(0, 10)
    .map((v: {
      id?: string;
      title?: { text?: string } | string;
      author?: { name?: string; id?: string; best_thumbnail?: { url?: string } };
      best_thumbnail?: { url?: string };
      view_count?: { text?: string };
      duration?: { seconds?: number; text?: string };
      published?: { text?: string };
    }) => ({
      type: "video",
      title: (typeof v.title === "object" ? v.title?.text : v.title) ?? "",
      videoId: v.id ?? "",
      author: v.author?.name || channelName,
      authorId: v.author?.id ?? channelId,
      authorAvatar: fixUrl(v.author?.best_thumbnail?.url ?? "") || channelAvatar,
      thumbnail: fixUrl(v.best_thumbnail?.url ?? ""),
      viewCount: parseViewCount(v.view_count?.text),
      lengthSeconds: v.duration?.seconds ?? 0,
      publishedText: v.published?.text ?? "",
    }));
}

export function getThumbnailUrl(video: VideoResult): string {
  return video.thumbnail;
}

export function getChannelAvatarUrl(video: { authorAvatar: string }): string {
  return video.authorAvatar;
}

export function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}
