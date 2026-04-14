import { useEffect, useState } from "react";
import { getVideoDetails, VideoDetails } from "../api";
import { getDatabase } from "../db";

interface VideoPlayerProps {
  videoId: string;
  onBack: () => void;
}

export default function VideoPlayer({ videoId, onBack }: VideoPlayerProps) {
  const [details, setDetails] = useState<VideoDetails | null>(null);
  const [error, setError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setError("");
    setDetails(null);
    getVideoDetails(videoId)
      .then(setDetails)
      .catch((e) => setError(e.message));
  }, [videoId]);

  useEffect(() => {
    if (!details) return;
    let cancelled = false;
    getDatabase().then(async (db) => {
      const doc = await db.subscriptions
        .findOne({ selector: { channelId: details.authorId, isDeleted: false } })
        .exec();
      if (!cancelled) setIsSubscribed(!!doc);
    });
    return () => {
      cancelled = true;
    };
  }, [details]);

  async function toggleSubscribe() {
    if (!details) return;
    const db = await getDatabase();

    if (isSubscribed) {
      const doc = await db.subscriptions
        .findOne({ selector: { channelId: details.authorId, isDeleted: false } })
        .exec();
      if (doc) await doc.patch({ isDeleted: true });
      setIsSubscribed(false);
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
    }
  }

  function getStreamUrl(streams: VideoDetails["videoStreams"]): string {
    const mp4 = streams.find(
      (s) => !s.videoOnly && s.mimeType?.startsWith("video/mp4") && s.quality !== "LBRY"
    );
    return mp4?.url ?? streams.find((s) => !s.videoOnly)?.url ?? "";
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
            <button className="btn btn-outline" onClick={onBack}>Go Back</button>
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

  const streamUrl = getStreamUrl(details.videoStreams);

  return (
    <div className="flex flex-col gap-4">
      <button className="btn btn-ghost btn-sm self-start" onClick={onBack}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to results
      </button>

      {streamUrl ? (
        <video
          className="w-full max-h-[70vh] rounded-lg bg-black"
          controls
          autoPlay
          src={streamUrl}
        />
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
              <div className="avatar avatar-placeholder">
                <div className="bg-primary text-primary-content w-12 rounded-full">
                  <span className="text-lg">{details.author[0]}</span>
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="card-title text-lg">{details.title}</h2>
                <p className="text-sm opacity-70">{details.author}</p>
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
