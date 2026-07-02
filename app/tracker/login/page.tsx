"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OtpStep = "phone" | "otp";
type PhoneStatus = "idle" | "sending" | "sent" | "verifying";

const COUNTRY_CODES = [
  { label: "🇮🇳 +91",  value: "+91"  },
  { label: "🇺🇸 +1",   value: "+1"   },
  { label: "🇸🇬 +65",  value: "+65"  },
  { label: "🇦🇪 +971", value: "+971" },
  { label: "🇲🇾 +60",  value: "+60"  },
  { label: "🇦🇺 +61",  value: "+61"  },
  { label: "🇬🇧 +44",  value: "+44"  },
];

const INPUT =
  "w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition disabled:opacity-60";

const BTN_PRIMARY =
  "w-full bg-white text-navy-dark font-semibold text-sm rounded-lg py-2.5 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [countryCode, setCountryCode] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("idle");
  const [phoneError, setPhoneError] = useState("");
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);

  const phoneOtpRef = useRef<HTMLInputElement>(null);

  // Combined phone used for all Supabase calls
  const phone = countryCode + localNumber.trim();

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const t = setTimeout(() => setPhoneResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneResendCooldown]);

  useEffect(() => {
    if (otpStep === "otp") phoneOtpRef.current?.focus();
  }, [otpStep]);

  const isValidPhone = /^\+[1-9]\d{7,14}$/.test(phone);

  async function handleSendOtp() {
    if (!isValidPhone) {
      setPhoneError("Enter a valid local number (digits only, no country code).");
      return;
    }
    setPhoneError("");
    setPhoneStatus("sending");
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) { setPhoneError(error.message); setPhoneStatus("idle"); return; }
      const masked =
        phone.length > 4
          ? phone.slice(0, 3) + "X".repeat(phone.length - 7) + phone.slice(-4)
          : phone;
      setOtpSentMessage(`OTP sent to ${masked}`);
      setOtpStep("otp");
      setPhoneStatus("sent");
      setPhoneResendCooldown(30);
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Failed to send OTP.");
      setPhoneStatus("idle");
    }
  }

  async function handleVerifyOtp(code?: string) {
    const token = (code ?? otp).trim();
    if (token.length !== 6) return;
    setPhoneError("");
    setPhoneStatus("verifying");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });
      if (error) {
        const msg = error.message.toLowerCase();
        setPhoneError(
          msg.includes("expired")
            ? "Code expired — tap Resend"
            : "Incorrect code — please try again"
        );
        setOtp("");
        setPhoneStatus("sent");
        return;
      }
      if (data.user && data.session) {
        await fetch("/api/tracker/seed-user", { method: "POST" });
        // Check onboarding status — send new users directly to onboarding
        // instead of bouncing through dashboard first.
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("name, username")
          .eq("user_id", data.user.id)
          .single();
        const isOnboarded =
          !!profile?.name?.trim() && !!profile?.username?.trim();
        router.push(isOnboarded ? "/tracker/dashboard" : "/tracker/onboarding");
        router.refresh();
      }
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Verification failed.");
      setPhoneStatus("sent");
    }
  }

  function handlePhoneOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    if (val.length === 6) handleVerifyOtp(val);
  }

  function handlePhoneResend() {
    setOtp("");
    setPhoneError("");
    setOtpSentMessage(null);
    setOtpStep("phone");
    setPhoneStatus("idle");
  }

  return (
    <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center px-4">
      {/* Brand */}
      <div className="mb-10 text-center">
        <p className="font-playfair text-2xl font-semibold text-white tracking-tight">
          MBL PFin
        </p>
        <p className="mt-1 text-white/40 text-sm">Track Every Rupee. By Voice.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl px-8 py-10 backdrop-blur-sm">
        <h1 className="font-playfair text-xl font-semibold text-white mb-1">
          {otpStep === "phone" ? "Sign in to MBL PFin" : "Enter your OTP"}
        </h1>
        <p className="text-white/40 text-sm mb-8">
          {otpStep === "phone"
            ? "We'll send a 6-digit code via SMS."
            : otpSentMessage ?? "Check your messages."}
        </p>

        {/* Step 1 — phone number */}
        {otpStep === "phone" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="local-number"
                className="block text-xs font-medium text-white/50 mb-1.5"
              >
                Phone number
              </label>
              <div className="flex gap-2">
                {/* Country code dropdown */}
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value);
                    setPhoneError("");
                  }}
                  className="flex-shrink-0 bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition [color-scheme:dark]"
                  aria-label="Country code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                {/* Local number */}
                <input
                  id="local-number"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={localNumber}
                  onChange={(e) => {
                    setLocalNumber(e.target.value.replace(/\D/g, ""));
                    setPhoneError("");
                  }}
                  placeholder="9876543210"
                  className={INPUT}
                />
              </div>
            </div>

            {phoneError && <ErrorBanner>{phoneError}</ErrorBanner>}

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={phoneStatus === "sending"}
              className={BTN_PRIMARY}
            >
              {phoneStatus === "sending" ? "Sending OTP…" : "Send OTP"}
            </button>
          </div>
        )}

        {/* Step 2 — OTP entry */}
        {otpStep === "otp" && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="phone-otp"
                className="block text-xs font-medium text-white/50 mb-1.5"
              >
                6-digit code
              </label>
              <input
                ref={phoneOtpRef}
                id="phone-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={handlePhoneOtpChange}
                placeholder="123456"
                disabled={phoneStatus === "verifying"}
                className={`${INPUT} text-center tracking-[0.5em] text-base font-mono`}
              />
            </div>

            {phoneError && <ErrorBanner>{phoneError}</ErrorBanner>}

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={otp.length !== 6 || phoneStatus === "verifying"}
              className={BTN_PRIMARY}
            >
              {phoneStatus === "verifying" ? "Verifying…" : "Verify"}
            </button>

            <div className="text-center pt-1">
              {phoneResendCooldown > 0 ? (
                <p className="text-xs text-white/30">
                  Resend in {phoneResendCooldown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handlePhoneResend}
                  className="text-xs text-white/50 underline underline-offset-2 hover:text-white transition"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ children }: { children: string }) {
  return (
    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}
