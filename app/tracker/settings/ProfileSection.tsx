"use client";

import { useState, useEffect } from "react";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Props = {
  initialName:     string;
  initialUsername: string;
};

export default function ProfileSection({ initialName, initialUsername }: Props) {
  const [name,        setName]        = useState(initialName);
  const [username,    setUsername]    = useState(initialUsername);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  // Clear success banner after 3 s
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const usernameError =
    username.length > 0 && !USERNAME_RE.test(username)
      ? "3-20 chars · lowercase letters, numbers, underscore only"
      : null;

  const canSave =
    name.trim().length > 0 &&
    USERNAME_RE.test(username) &&
    (name.trim() !== initialName || username !== initialUsername);

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/tracker/onboarding", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: name.trim(), username }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save. Please try again.");
      return;
    }

    setSuccess(true);
  }

  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2 className="font-playfair text-lg font-bold text-white">Profile</h2>
        <p className="mt-0.5 text-white/40 text-sm">
          Your display name and @username inside MBL PFin.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 max-w-lg flex flex-col gap-4">

        {/* Name */}
        <div>
          <label className="block font-inter text-xs text-white/50 mb-1.5">
            Display name
          </label>
          <input
            type="text"
            value={name}
            maxLength={60}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="Your name"
            className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2.5 font-inter text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block font-inter text-xs text-white/50 mb-1.5">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-inter text-sm text-white/30 select-none">
              @
            </span>
            <input
              type="text"
              value={username}
              maxLength={20}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                setError(null);
              }}
              placeholder="your_handle"
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg pl-7 pr-3 py-2.5 font-inter text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          {usernameError && (
            <p className="mt-1 font-inter text-[11px] text-amber-400/80">{usernameError}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="font-inter text-xs text-red-400">{error}</p>
        )}

        {/* Success */}
        {success && (
          <p className="font-inter text-xs text-green-400">Profile updated.</p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="self-start font-inter text-sm font-medium bg-white text-[#0A1628] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Divider */}
      <div className="mt-10 border-t border-white/[0.07]" />
    </section>
  );
}
