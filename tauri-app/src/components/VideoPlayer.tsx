import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { MediaPlayer } from "dashjs";
import { getVideoDetails, VideoDetails } from "../api";
import { getDatabase } from "../db";
import { syncSubscriptions } from "../sync";
import { Models } from "appwrite";
import VideoControlBar from "./VideoControlBar";
import { getSegments, SponsorSegment } from "../sponsorblock";

interface LayoutContext {
  user: Models.User<Models.Preferences> | null;
}

export default function VideoPlayer() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useOutletContext<LayoutContext>();
  const userId = user?.$id ?? null;
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [segments, setSegments] = useState<SponsorSegment[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<ReturnType<typeof MediaPlayer>["create"]> | null>(null);

  useEffect(() => {
    if (!videoId) return;
    setError("");
    setDetails(null);
    setSegments([]);
    getVideoDetails(videoId)
      .then(setDetails)
      .catch((e) => setError(e.message));
    getSegments(videoId).then(setSegments);
  }, [videoId]);

  // Initialize dash.js when we have the manifest URL
  useEffect(() => {
    if (!details?.dashManifestUrl || !videoRef.current) return;

    const player = MediaPlayer().create();
    player.initialize(videoRef.current, details.dashManifestUrl, true);
    playerRef.current = player;

    return () => {
      player.destroy();
      playerRef.current = null;
    };
  }, [details]);

  // Media Session API — OS-level Now Playing controls
  useEffect(() => {
    if (!details || !videoRef.current) return;
    const video = videoRef.current;

    if ("mediaSession" in navigator) {
      let thumb = details.thumbnailUrl;
      if (thumb.startsWith("//")) thumb = "https:" + thumb;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: details.title,
        artist: details.author,
        artwork: thumb ? [{ src: thumb, sizes: "512x512", type: "image/jpeg" }] : [],
      });

      navigator.mediaSession.setActionHandler("play", () => {
        video.play();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        video.pause();
      });
      navigator.mediaSession.setActionHandler("seekbackward", (evt) => {
        video.currentTime = Math.max(0, video.currentTime - (evt.seekOffset ?? 10));
      });
      navigator.mediaSession.setActionHandler("seekforward", (evt) => {
        video.currentTime = Math.min(video.duration, video.currentTime + (evt.seekOffset ?? 10));
      });
      navigator.mediaSession.setActionHandler("seekto", (evt) => {
        if (evt.seekTime != null) video.currentTime = evt.seekTime;
      });

      const updatePosition = () => {
        if (!isNaN(video.duration)) {
          navigator.mediaSession.setPositionState({
            duration: video.duration,
            playbackRate: video.playbackRate,
            position: video.currentTime,
          });
        }
      };
      video.addEventListener("timeupdate", updatePosition);

      return () => {
        video.removeEventListener("timeupdate", updatePosition);
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      };
    }
  }, [details]);

  useEffect(() => {
    if (!details) return;
    let cancelled = false;
    getDatabase().then(async (db) => {
      // id === channelId; can't use selector on encrypted channelId field
      const doc = await db.subscriptions.findOne(details.authorId).exec();
      if (!cancelled) setIsSubscribed(!!doc && !doc.isDeleted);
    });
    return () => {
      cancelled = true;
    };
  }, [details]);

  async function toggleSubscribe() {
    if (!details) return;
    const db = await getDatabase();

    if (isSubscribed) {
      const doc = await db.subscriptions.findOne(details.authorId).exec();
      if (doc) await doc.patch({ isDeleted: true });
      setIsSubscribed(false);
      if (userId) syncSubscriptions(userId).catch(console.error);
    } else {
      let thumb = details.authorAvatar ?? "";
      if (thumb.startsWith("//")) thumb = "https:" + thumb;
      await db.subscriptions.upsert({
        id: details.authorId,
        channelId: details.authorId,
        channelName: details.author,
        channelThumbnail: thumb,
        isDeleted: false,
      });
      setIsSubscribed(true);
      if (userId) syncSubscriptions(userId).catch(console.error);
    }
  }

  if (error) {
    return (
      <div className="hero min-h-[60vh]">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <div role="alert" className="alert alert-error alert-soft mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button className="btn btn-outline" onClick={() => navigate(-1)}>Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="skeleton w-full aspect-video rounded-lg" />
        <div className="flex items-center gap-4">
          <div className="skeleton h-12 w-12 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button className="btn btn-ghost btn-sm self-start" onClick={() => navigate(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to results
      </button>

      {details.dashManifestUrl ? (
        <div ref={videoContainerRef} className="relative group rounded-lg overflow-hidden bg-black cursor-pointer">
          <video
            ref={videoRef}
            className="w-full max-h-[70vh] bg-black"
          />
          <VideoControlBar videoRef={videoRef} containerRef={videoContainerRef} segments={segments} />
        </div>
      ) : (
        <div role="alert" className="alert alert-warning alert-soft">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>No playable stream found for this video.</span>
        </div>
      )}

      <div className="card card-border bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {details.authorAvatar ? (
                <div 
                  className="avatar cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/channel/${details.authorId}`)}
                >
                  <div className="w-12 rounded-full">
                    <img src={details.authorAvatar} alt={details.author} />
                  </div>
                </div>
              ) : (
                <div 
                  className="avatar avatar-placeholder cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/channel/${details.authorId}`)}
                >
                  <div className="bg-primary text-primary-content w-12 rounded-full">
                    <span className="text-lg">{details.author[0]}</span>
                  </div>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="card-title text-lg">{details.title}</h2>
                <p 
                  className="text-sm opacity-70 cursor-pointer hover:underline"
                  onClick={() => navigate(`/channel/${details.authorId}`)}
                >
                  {details.author}
                </p>
              </div>
            </div>
            <button
              className={`btn ${isSubscribed ? "btn-error btn-outline" : "btn-primary"}`}
              onClick={toggleSubscribe}
            >
              {isSubscribed ? "Unsubscribe" : "Subscribe"}
            </button>
          </div>
          <div className="divider my-1" />
          <p className="text-sm opacity-60 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {details.description}
          </p>
        </div>
      </div>
    </div>
  );
}
