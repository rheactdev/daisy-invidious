import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useSearchParams, Link, Outlet } from "react-router-dom";
import "./App.css";
import SearchBar from "./components/SearchBar";
import VideoGrid from "./components/VideoGrid";
import VideoPlayer from "./components/VideoPlayer";
import Sidebar from "./components/Sidebar";
import AuthModal from "./components/AuthModal";
import { searchVideos, VideoResult } from "./api";
import { VideoIcon } from "./components/icons/VideoIcon";
import { getSession } from "./appwrite";
import { syncSubscriptions } from "./sync";
import { Models } from "appwrite";
import { startCompanion, stopCompanion } from "./companion";

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

  function handleChannelClick(_channelId: string, channelName: string) {
    handleSearch(channelName);
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
        <main className="flex-1 overflow-y-auto p-4">
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
        <ul className="menu bg-base-200 min-h-full w-64 p-4">
          <Sidebar onChannelClick={handleChannelClick} userId={user?.$id ?? null} />
        </ul>
      </div>
    </div>
  );
}

function HomePage() {
  return (
    <VideoGrid videos={[]} onPlay={() => {}} />
  );
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

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="watch/:videoId" element={<VideoPlayer />} />
      </Route>
    </Routes>
  );
}

export default App;
