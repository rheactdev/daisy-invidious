import { useState } from "react";
import "./App.css";
import SearchBar from "./components/SearchBar";
import VideoGrid from "./components/VideoGrid";
import VideoPlayer from "./components/VideoPlayer";
import Sidebar from "./components/Sidebar";
import { searchVideos, VideoResult } from "./api";
import { VideoIcon } from "./components/icons/VideoIcon";

type View = { kind: "search" } | { kind: "player"; videoId: string };

function App() {
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<View>({ kind: "search" });
  const [searchError, setSearchError] = useState("");

  async function handleSearch(query: string) {
    setIsLoading(true);
    setSearchError("");
    setView({ kind: "search" });
    try {
      const results = await searchVideos(query);
      setVideos(results.filter((v) => v.type === "video"));
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }

  function handlePlay(videoId: string) {
    setView({ kind: "player", videoId });
  }

  function handleBack() {
    setView({ kind: "search" });
  }

  function handleChannelClick(_channelId: string, channelName: string) {
    handleSearch(channelName);
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
          <div className="flex gap-2 items-center  font-bold text-lg mr-2">
            <VideoIcon size={28} />
            DaisyTube</div>
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          {searchError && (
            <div role="alert" className="alert alert-error alert-soft mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{searchError}</span>
            </div>
          )}
          {view.kind === "search" ? (
            <VideoGrid videos={videos} onPlay={handlePlay} />
          ) : (
            <VideoPlayer videoId={view.videoId} onBack={handleBack} />
          )}
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
          <Sidebar onChannelClick={handleChannelClick} />
        </ul>
      </div>
    </div>
  );
}

export default App;
