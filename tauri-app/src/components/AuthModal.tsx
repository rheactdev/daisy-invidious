import { useState } from "react";
import { login, signup, logout } from "../appwrite";
import { Models } from "appwrite";

interface AuthModalProps {
  user: Models.User<Models.Preferences> | null;
  onAuth: (user: Models.User<Models.Preferences> | null) => void;
}

export default function AuthModal({ user, onAuth }: AuthModalProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const u = isSignup
        ? await signup(email, password, name)
        : await login(email, password);
      onAuth(u);
      setEmail("");
      setPassword("");
      setName("");
      (document.getElementById("auth-modal") as HTMLDialogElement)?.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    onAuth(null);
  }

  if (user) {
    return (
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar avatar-placeholder">
          <div className="bg-primary text-primary-content w-10 rounded-full">
            <span>{user.name?.[0] || user.email[0]}</span>
          </div>
        </div>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content bg-base-200 rounded-box mt-3 w-52 p-2 shadow z-50"
        >
          <li className="menu-title">{user.name || user.email}</li>
          <li>
            <button onClick={handleLogout}>Sign out</button>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <>
      <button
        className="btn btn-primary btn-sm"
        onClick={() =>
          (document.getElementById("auth-modal") as HTMLDialogElement)?.showModal()
        }
      >
        Sign in
      </button>

      <dialog id="auth-modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-4">
            {isSignup ? "Create Account" : "Sign In"}
          </h3>

          {error && (
            <div role="alert" className="alert alert-error alert-soft mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isSignup && (
              <label className="input w-full">
                <span className="label">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            )}
            <label className="input w-full">
              <span className="label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="input w-full">
              <span className="label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <button
              type="submit"
              className={`btn btn-primary w-full ${loading ? "btn-disabled" : ""}`}
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-sm" />}
              {isSignup ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <div className="divider text-xs">OR</div>
          <button
            className="btn btn-ghost btn-sm w-full"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
