import { memo, useCallback, useMemo } from "react";
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

export default memo(function VideoCard({ video, onPlay }: VideoCardProps) {
  const thumbnail = useMemo(() => getThumbnailUrl(video), [video.thumbnail]);
  const avatar = useMemo(() => getChannelAvatarUrl(video), [video.authorAvatar]);
  const duration = useMemo(() => formatDuration(video.lengthSeconds), [video.lengthSeconds]);
  const views = useMemo(() => formatViews(video.viewCount), [video.viewCount]);

  const handleClick = useCallback(() => onPlay(video.videoId), [onPlay, video.videoId]);

  return (
    <div
      className="hover-3d cursor-pointer"
      onClick={handleClick}
    >
      <div className="card card-sm bg-base-200 shadow-sm hover:shadow-xl transition-all rounded-box">
        <figure className="relative">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={video.title}
              className="w-full aspect-video object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full aspect-video bg-base-300 flex items-center justify-center">
              <span className="opacity-30 text-4xl">▶</span>
            </div>
          )}
          <span className="absolute bottom-2 right-2 badge badge-neutral">
            {duration}
          </span>
        </figure>
        <div className="card-body">
          <h2 className="card-title text-sm line-clamp-2 flex items-center gap-2">
            {avatar ? (
              <div className="avatar">
                <div className="w-8 rounded-full">
                  <img src={avatar} alt={video.author} loading="lazy" decoding="async" />
                </div>
              </div>
            ) : (
              <div className="avatar avatar-placeholder">
                <div className="bg-neutral text-neutral-content w-8 rounded-full">
                  <span className="text-xs">{video.author?.[0]}</span>
                </div>
              </div>
            )}
            <span className="line-clamp-2">{video.title}</span>
          </h2>
          <div className="flex flex-row items-center gap-2 w-full">
            <span className="text-xs truncate opacity-70 flex-1">{video.author}</span>
            <span className="badge badge-sm">{views}</span>
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
});
