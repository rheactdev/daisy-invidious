import {
  VideoResult,
  getThumbnailUrl,
  formatDuration,
  formatViews,
} from "../api";

interface VideoCardProps {
  video: VideoResult;
  onPlay: (videoId: string) => void;
}

export default function VideoCard({ video, onPlay }: VideoCardProps) {
  return (
    <div
      className="card card-sm bg-base-100 shadow-md cursor-pointer hover:shadow-xl transition-all hover:-translate-y-0.5"
      onClick={() => onPlay(video.videoId)}
    >
      <figure className="relative">
        <img
          src={getThumbnailUrl(video)}
          alt={video.title}
          className="w-full aspect-video object-cover"
        />
        <span className="absolute bottom-2 right-2 badge badge-neutral">
          {formatDuration(video.lengthSeconds)}
        </span>
      </figure>
      <div className="card-body">
        <h2 className="card-title text-sm line-clamp-2">{video.title}</h2>
        <div className="flex items-center gap-2">
          <div className="avatar avatar-placeholder">
            <div className="bg-neutral text-neutral-content w-6 rounded-full">
              <span className="text-xs">{video.author[0]}</span>
            </div>
          </div>
          <span className="text-xs opacity-70 truncate">{video.author}</span>
        </div>
        <div className="card-actions justify-end">
          <span className="badge badge-ghost badge-sm">{formatViews(video.viewCount)}</span>
          <span className="badge badge-ghost badge-sm">{video.publishedText}</span>
        </div>
      </div>
    </div>
  );
}
