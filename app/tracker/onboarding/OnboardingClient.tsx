"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function OnboardingClient({
  userPhone,
  initialName,
  initialUsername,
}: {
  userPhone: string;
  initialName: string;
  initialUsername: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameOk = name.trim().length >= 1 && name.trim().length <= 60;
  const usernameFormatOk = USERNAME_PATTERN.test(username);
  const usernameOk = usernameFormatOk && usernameStatus === "available";
  const canSubmit = nameOk && usernameOk && !submitting;

  // Debounced username availability check.
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (!username) {
      setUsernameStatus("idle");
      return;
    }
    if (!usernameFormatOk) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/tracker/onboarding?username=${encodeURIComponent(username)}`,
          { method: "GET" }
        );
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 350);
    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [username, usernameFormatOk]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/tracker/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), username: username.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save profile. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push("/tracker/dashboard");
    router.refresh();
  }

  const usernameHelp = (() => {
    if (!username) return "3-20 chars. Lowercase letters, numbers, underscore.";
    if (usernameStatus === "invalid")
      return "Only lowercase letters, numbers and underscore. 3-20 chars.";
    if (usernameStatus === "checking") return "Checking availability…";
    if (usernameStatus === "taken") return "That username is already taken.";
    if (usernameStatus === "available") return "Available ✓";
    return "3-20 chars. Lowercase letters, numbers, underscore.";
  })();

  const usernameHelpColor =
    usernameStatus === "available"
      ? "text-green-400"
      : usernameStatus === "taken" || usernameStatus === "invalid"
      ? "text-red-400/90"
      : "text-white/40";

  return (
    <div className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-2xl p-8 shadow-2xl">
      <p className="font-inter text-xs font-semibold uppercase tracking-[0.18em] text-amber-400 mb-3">
        Welcome
      </p>
      <h1 className="font-playfair text-3xl font-bold mb-2">
        Let's set up your profile
      </h1>
      <p className="font-inter text-sm text-white/55 leading-relaxed mb-7">
        Just two quick fields. You can change them later from Settings.
        {userPhone ? (
          <>
            <br />
            <span className="text-white/35">Signed in as {userPhone}</span>
          </>
        ) : null}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-1.5">
            Your name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vimal Kumar"
            maxLength={60}
            autoFocus
            className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-medium text-white/55 mb-1.5">
            Username <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium select-none">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="vimal_k"
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-white/10 border border-white/15 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition"
            />
          </div>
          <p className={`text-[11px] mt-1.5 ${usernameHelpColor}`}>
            {usernameHelp}
          </p>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-amber-400 text-[#0F1E40] font-inter font-bold text-sm py-3 rounded-xl hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {submitting ? "Saving…" : "Continue to MBL PFin"}
        </button>
      </form>

      <p className="text-[11px] text-white/30 mt-6 text-center">
        These details stay private. Read our{" "}
        <a href="/privacy" className="underline hover:text-white/60">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
