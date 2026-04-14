import {
  VideoResult,
  getThumbnailUrl,
  getChannelAvatarUrl,
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
      className="hover-3d cursor-pointer"
      onClick={() => onPlay(video.videoId)}
    >
      <div className="card card-sm bg-base-200 shadow-sm hover:shadow-xl transition-all rounded-box">
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
          <h2 className="card-title text-sm line-clamp-2 flex items-center gap-2">
            <div className="avatar">
              <div className="w-8 rounded-full">
                <img src={getChannelAvatarUrl(video)} alt={video.author} />
              </div>
            </div>
            <span className="line-clamp-2">{video.title}</span>
          </h2>
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-xs truncate opacity-70 flex-1">{video.author}</span>
            <span className="badge badge-sm">{formatViews(video.viewCount)}</span>
            <span className="badge badge-sm">{video.publishedText}</span>
          </div>
        </div>
      </div>
      {/* 8 empty divs needed for the 3D hover effect */}
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}
