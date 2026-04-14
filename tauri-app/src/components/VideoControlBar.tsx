import { useState, useEffect, useRef, useCallback } from "react";
import { PlayIcon } from "./icons/PlayIcon";
import { PauseIcon } from "./icons/PauseIcon";
import { Forward10Icon } from "./icons/Forward10Icon";
import { Replay10Icon } from "./icons/Replay10Icon";
import { FullScreenIcon } from "./icons/FullScreenIcon";
import { PictureInPictureIcon } from "./icons/PictureInPictureIcon";
import { SpeedIcon } from "./icons/SpeedIcon";
import { MuteIcon } from "./icons/MuteIcon";
import { SpeakerIcon } from "./icons/SpeakerIcon";
import { SponsorSegment, CATEGORY_INFO } from "../sponsorblock";

interface VideoControlBarProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  segments?: SponsorSegment[];
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoControlBar({ videoRef, containerRef, segments = [] }: VideoControlBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [skipNotice, setSkipNotice] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSkippedRef = useRef<string | null>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!showSpeed) setShowControls(false);
    }, 3000);
  }, [showSpeed]);

  // Attach mouse listeners to the container so they work even when overlay is hidden
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onMove = () => resetHideTimer();
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseenter", onMove);
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseenter", onMove);
    };
  }, [containerRef, resetHideTimer]);

  // Sync state from video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => { if (!isSeeking) setCurrentTime(video.currentTime); };
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [videoRef, isSeeking]);

  // Fullscreen tracking
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Close speed menu on outside click
  useEffect(() => {
    if (!showSpeed) return;
    const onClick = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeed(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showSpeed]);

  // SponsorBlock auto-skip
  useEffect(() => {
    if (segments.length === 0) return;
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const t = video.currentTime;
      for (const seg of segments) {
        const [start, end] = seg.segment;
        // Skip if we're inside a segment (with 0.5s tolerance to avoid re-triggering)
        if (t >= start && t < end - 0.5 && lastSkippedRef.current !== seg.UUID) {
          video.currentTime = end;
          lastSkippedRef.current = seg.UUID;
          const info = CATEGORY_INFO[seg.category];
          setSkipNotice(`Skipped ${info?.label ?? seg.category}`);
          if (skipNoticeTimerRef.current) clearTimeout(skipNoticeTimerRef.current);
          skipNoticeTimerRef.current = setTimeout(() => setSkipNotice(null), 3000);
          break;
        }
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [videoRef, segments]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function seekRelative(offset: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + offset));
  }

  function handleProgressDown(e: React.MouseEvent) {
    setIsSeeking(true);
    seekToPosition(e);
    const onMove = (me: MouseEvent) => seekToPosition(me);
    const onUp = () => {
      setIsSeeking(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function seekToPosition(e: MouseEvent | React.MouseEvent) {
    const bar = progressRef.current;
    const video = videoRef.current;
    if (!bar || !video || !isFinite(video.duration)) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
    setCurrentTime(pct * video.duration);
  }

  function handleProgressHover(e: React.MouseEvent) {
    const bar = progressRef.current;
    if (!bar || !isFinite(duration) || duration === 0) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pct * duration);
    setHoverX(e.clientX - rect.left);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen();
  }

  function togglePiP() {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    else video.requestPictureInPicture();
  }

  function setPlaybackSpeed(s: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = s;
    setSpeed(s);
    setShowSpeed(false);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={(e) => {
        // Click on the video area (not controls) toggles play
        if (e.target === e.currentTarget) togglePlay();
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* SponsorBlock skip notification */}
      {skipNotice && (
        <div className="absolute top-4 right-4 z-20 bg-base-300/90 backdrop-blur-md text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
          {skipNotice}
        </div>
      )}

      {/* Controls container */}
      <div className="relative z-10 px-4 pb-3 flex flex-col gap-2">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="group/progress relative h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all duration-150"
          onMouseDown={handleProgressDown}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Buffered / played */}
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
          {/* SponsorBlock segment markers */}
          {duration > 0 && segments.map((seg) => {
            const left = (seg.segment[0] / duration) * 100;
            const width = ((seg.segment[1] - seg.segment[0]) / duration) * 100;
            const color = CATEGORY_INFO[seg.category]?.color ?? "#ff0000";
            return (
              <div
                key={seg.UUID}
                className="absolute inset-y-0 opacity-70 hover:opacity-100 transition-opacity"
                style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
                title={CATEGORY_INFO[seg.category]?.label ?? seg.category}
              />
            );
          })}
          {/* Scrub thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-primary rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 bg-base-300 text-xs px-2 py-0.5 rounded shadow-lg pointer-events-none"
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center gap-1">
          {/* Left group */}
          <button className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
          </button>
          <button className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15" onClick={() => seekRelative(-10)} title="Replay 10s">
            <Replay10Icon size={24} />
          </button>
          <button className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15" onClick={() => seekRelative(10)} title="Forward 10s">
            <Forward10Icon size={24} />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/vol">
            <button className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted || volume === 0 ? (
                <MuteIcon size={24} />
              ) : (
                <SpeakerIcon size={24} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="range range-xs range-primary w-0 group-hover/vol:w-20 transition-all duration-200 opacity-0 group-hover/vol:opacity-100"
            />
          </div>

          {/* Time display */}
          <span className="text-white text-xs tabular-nums ml-1 select-none">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right group */}
          {/* Speed */}
          <div className="relative" ref={speedMenuRef}>
            <button
              className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15"
              onClick={() => setShowSpeed((v) => !v)}
              title="Playback speed"
            >
              <SpeedIcon size={24} />
            </button>
            {showSpeed && (
              <div className="absolute bottom-full right-0 mb-2 bg-base-300/95 backdrop-blur-md rounded-lg shadow-xl p-1 min-w-[120px]">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-white/10 transition-colors ${speed === s ? "text-primary font-semibold" : "text-base-content"}`}
                    onClick={() => setPlaybackSpeed(s)}
                  >
                    {s === 1 ? "Normal" : `${s}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Picture in Picture */}
          <button className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15" onClick={togglePiP} title="Picture in Picture">
            <PictureInPictureIcon size={24} />
          </button>

          {/* Fullscreen */}
          <button className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/15" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            <FullScreenIcon size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
