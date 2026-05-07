import { useState, useEffect } from "react";
import { checkDbExists, initDatabase, resetDatabase } from "../db";
import { VideoIcon } from "./icons/VideoIcon";

interface Props {
  onUnlock: () => void;
}

export default function PasswordPrompt({ onUnlock }: Props) {
  const [isChecking, setIsChecking] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    checkDbExists().then((exists) => {
      setIsSetup(!exists);
      if (!exists) {
        // Auto-generate secure password for new setup
        setPassword(crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8));
      }
      setIsChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await initDatabase(password);
      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
    setIsLoading(true);
    try {
      await resetDatabase();
      setIsSetup(true);
      setPassword(crypto.randomUUID() + "-" + crypto.randomUUID().slice(0, 8));
      setShowConfirmReset(false);
    } catch (err) {
      setError("Failed to reset database");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="text-primary mb-4">
            <VideoIcon size={64} />
          </div>
          <h2 className="card-title text-2xl mb-2">
            {isSetup ? "Secure Your Database" : "Database Locked"}
          </h2>
          <p className="text-base-content/70 mb-6">
            {isSetup
              ? "This is your first time opening the app. A secure password has been generated for your local database. Save it somewhere safe!"
              : "Please enter your database password to unlock."}
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">Database Password</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                required
              />
              {isSetup && (
                <label className="label">
                  <span className="label-text-alt text-warning">
                    Do not lose this! There is no recovery option.
                  </span>
                </label>
              )}
            </div>

            {error && (
              <div className="alert alert-error mt-4 text-sm py-2">
                <span>{error}</span>
              </div>
            )}

            <div className="card-actions mt-6 flex-col gap-3">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : isSetup ? (
                  "Initialize Database"
                ) : (
                  "Unlock"
                )}
              </button>

              {!isSetup && !showConfirmReset && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full text-error"
                  onClick={() => setShowConfirmReset(true)}
                  disabled={isLoading}
                >
                  Reset Database
                </button>
              )}

              {showConfirmReset && (
                <div className="w-full bg-error/10 p-4 rounded-box border border-error/20 mt-2 text-left">
                  <p className="text-error font-bold mb-2">Are you sure?</p>
                  <p className="text-sm mb-4">
                    This will permanently delete your existing database, including all local subscriptions and settings.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-error btn-sm flex-1"
                      onClick={handleReset}
                      disabled={isLoading}
                    >
                      Yes, Wipe Data
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm flex-1"
                      onClick={() => setShowConfirmReset(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
