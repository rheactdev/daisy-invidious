import { useState, useEffect } from "react";
import { VideoResult } from "../api";
import { SearchIcon } from "./icons/SearchIcon";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: VideoResult[];
  onPlay: (videoId: string) => void;
}

const PAGE_SIZE = 24;

export default function VideoGrid({ videos, onPlay }: VideoGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if videos list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [videos]);

  if (videos.length === 0) {
    return (
      <div className="hero min-h-[60vh]">
        <div className="hero-content text-center">
          <div className="max-w-md flex flex-col items-center gap-2">
            <SearchIcon size={120} />
            <h2 className="text-2xl font-bold">Find something to watch</h2>
            <p className="opacity-60">Search for videos using the search bar above</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(videos.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentVideos = videos.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentVideos.map((video) => (
          <VideoCard key={video.videoId} video={video} onPlay={onPlay} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center w-full pb-8">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button className="join-item btn btn-active">Page {currentPage} / {totalPages}</button>
            <button
              className="join-item btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
