import { VideoResult } from "../api";
import { SearchIcon } from "./icons/SearchIcon";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: VideoResult[];
  onPlay: (videoId: string) => void;
}

export default function VideoGrid({ videos, onPlay }: VideoGridProps) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.videoId} video={video} onPlay={onPlay} />
      ))}
    </div>
  );
}
