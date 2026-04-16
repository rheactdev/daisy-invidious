import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useSearchParams, useParams, Link, Outlet } from "react-router-dom";
import "./App.css";
import SearchBar from "./components/SearchBar";
import VideoGrid from "./components/VideoGrid";
import VideoPlayer from "./components/VideoPlayer";
import Sidebar from "./components/Sidebar";
import AuthModal from "./components/AuthModal";
import { searchVideos, getChannelVideos, VideoResult } from "./api";
import { VideoIcon } from "./components/icons/VideoIcon";
import { getSession } from "./appwrite";
import { syncSubscriptions } from "./sync";
import { getDatabase, Subscription } from "./db";
import { Models } from "appwrite";
import { startCompanion, stopCompanion } from "./companion";
import { SyncIcon } from "./components/icons/SyncIcon";

function Layout() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    startCompanion().catch((e) =>
      console.error("Failed to start companion:", e)
    );
    return () => {
      stopCompanion();
    };
  }, []);

  useEffect(() => {
    getSession().then((u) => {
      if (u) {
        setUser(u);
        syncSubscriptions(u.$id).catch(console.error);
      }
    });
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    },
    [navigate]
  );

  function handleChannelClick(channelId: string, _channelName: string) {
    navigate(`/channel/${channelId}`);
  }

  function handleAuth(u: Models.User<Models.Preferences> | null) {
    setUser(u);
    if (u) {
      syncSubscriptions(u.$id).catch(console.error);
    }
  }

  return (
    <div className="drawer lg:drawer-open h-screen">
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col overflow-y-auto">
        {/* Navbar */}
        <div className="navbar bg-base-300 gap-2 px-4">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="sidebar-drawer"
              aria-label="open sidebar"
              className="btn btn-square btn-ghost"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-6 w-6 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </label>
          </div>
          <Link to="/" className="flex gap-2 items-center font-bold text-lg mr-2">
            <VideoIcon size={28} />
            DaisyTube
          </Link>
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
          <AuthModal user={user} onAuth={handleAuth} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-10">
          <Outlet context={{ user, isLoading, setIsLoading }} />
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label
          htmlFor="sidebar-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <ul className="menu bg-base-200 min-h-full flex flex-col w-64 p-4 justify-between">
          <Sidebar onChannelClick={handleChannelClick} userId={user?.$id ?? null} />
        </ul>
      </div>
    </div>
  );
}

// Module-level cache so feed survives navigation + app restarts
const FEED_CACHE_KEY = "daisytube_feed_cache";

function loadFeedCache(): { videos: VideoResult[]; time: Date | null } {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return { videos: [], time: null };
    const parsed = JSON.parse(raw);
    return { videos: parsed.videos ?? [], time: parsed.time ? new Date(parsed.time) : null };
  } catch {
    return { videos: [], time: null };
  }
}

function saveFeedCache(videos: VideoResult[], time: Date) {
  try {
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ videos, time: time.toISOString() }));
  } catch {
    // storage full — ignore
  }
}

let cachedFeedVideos: VideoResult[] = [];
let cachedFeedTime: Date | null = null;

// Restore from localStorage on first load
const _restored = loadFeedCache();
cachedFeedVideos = _restored.videos;
cachedFeedTime = _restored.time;

function HomePage() {
  const [videos, setVideos] = useState<VideoResult[]>(cachedFeedVideos);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(cachedFeedTime);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const navigate = useNavigate();

  // Load subscriptions reactively
  useEffect(() => {
    let sub: { unsubscribe: () => void } | undefined;
    getDatabase().then((db) => {
      sub = db.subscriptions
        .find({ selector: { isDeleted: false } })
        .$.subscribe((docs) => {
          setSubs(docs.map((d) => d.toMutableJSON()));
        });
    });
    return () => sub?.unsubscribe();
  }, []);

  async function fetchFeed() {
    if (subs.length === 0) return;
    setIsLoading(true);
    setProgress({ done: 0, total: subs.length });

    const allVideos: VideoResult[] = [];
    let done = 0;

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const vids = await getChannelVideos(sub.channelId);
        done++;
        setProgress({ done, total: subs.length });
        return vids;
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") {
        allVideos.push(...r.value);
      }
    }

    // Sort by publishedText heuristic — newest first
    // publishedText is like "2 hours ago", "3 days ago" etc.
    allVideos.sort((a, b) => {
      const wa = parseAge(a.publishedText);
      const wb = parseAge(b.publishedText);
      if (wa < wb) return -1;
      if (wa > wb) return 1;
      return 0;
    });

    cachedFeedVideos = allVideos;
    cachedFeedTime = new Date();
    saveFeedCache(cachedFeedVideos, cachedFeedTime);
    setVideos(allVideos);
    setLastFetched(cachedFeedTime);
    setIsLoading(false);
  }

  function handlePlay(videoId: string) {
    navigate(`/watch/${videoId}`);
  }

  if (subs.length === 0) {
    return (
      <div className="hero min-h-[60vh]">
        <div className="hero-content text-center">
          <div className="max-w-md flex flex-col items-center gap-2">
            <VideoIcon size={120} />
            <h2 className="text-2xl font-bold">Your feed is empty</h2>
            <p className="opacity-60">Subscribe to channels to see their latest videos here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold">Subscription Feed</h2>
          {lastFetched && (
            <span className="text-xs opacity-50">
              Updated {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={fetchFeed}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              {progress.done}/{progress.total}
            </>
          ) : (
            <>
              <SyncIcon size={16} />
              Refresh
            </>
          )}
        </button>
      </div>
      {videos.length === 0 && !isLoading ? (
        <div className="hero min-h-[40vh]">
          <div className="hero-content text-center">
            <div className="max-w-md flex flex-col items-center gap-2">
              <SyncIcon size={120} />
              <p className="opacity-60">Hit Refresh to load latest videos from your subscriptions</p>
            </div>
          </div>
        </div>
      ) : (
        <VideoGrid videos={videos} onPlay={handlePlay} />
      )}
    </div>
  );
}

/** Parse "X time ago" strings into rough seconds for sorting (lower = more recent) */
function parseAge(text: string): number {
  const match = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/i);
  if (!match) return Infinity;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    second: 1, minute: 60, hour: 3600, day: 86400,
    week: 604800, month: 2592000, year: 31536000,
  };
  return n * (multipliers[unit] ?? Infinity);
}

function SearchPage() {
  const [searchParams] = useSearchParams();
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  useEffect(() => {
    if (!query) return;
    setIsLoading(true);
    setSearchError("");
    searchVideos(query)
      .then((results) => setVideos(results.filter((v) => v.type === "video")))
      .catch((e) => setSearchError(e instanceof Error ? e.message : "Search failed"))
      .finally(() => setIsLoading(false));
  }, [query]);

  function handlePlay(videoId: string) {
    navigate(`/watch/${videoId}`);
  }

  return (
    <>
      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {searchError && (
        <div role="alert" className="alert alert-error alert-soft mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{searchError}</span>
        </div>
      )}
      {!isLoading && <VideoGrid videos={videos} onPlay={handlePlay} />}
    </>
  );
}

function ChannelPage() {
  const { channelId } = useParams();
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!channelId) return;
    setIsLoading(true);
    setError("");
    getChannelVideos(channelId)
      .then(setVideos)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setIsLoading(false));
  }, [channelId]);

  function handlePlay(videoId: string) {
    navigate(`/watch/${videoId}`);
  }

  return (
    <>
      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && (
        <div role="alert" className="alert alert-error alert-soft mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      {!isLoading && <VideoGrid videos={videos} onPlay={handlePlay} />}
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="channel/:channelId" element={<ChannelPage />} />
        <Route path="watch/:videoId" element={<VideoPlayer />} />
      </Route>
    </Routes>
  );
}

export default App;
