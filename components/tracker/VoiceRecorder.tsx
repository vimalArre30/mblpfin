"use client";

import { useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "done" | "unsupported";
type ErrorType = "permission" | "no-speech" | "generic" | null;

export default function VoiceRecorder({
  onUse,
}: {
  onUse: (text: string) => void;
}) {
  const [recState, setRecState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const recognitionRef = useRef<any>(null);

  // Check browser support once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) setRecState("unsupported");
  }, []);

  function startRecording() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? prev + " " + finalChunk : finalChunk));
        setInterim("");
      } else {
        setInterim(interimChunk);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setErrorType("permission");
      } else if (event.error === "no-speech") {
        setErrorType("no-speech");
      } else {
        setErrorType("generic");
      }
      setInterim("");
      setRecState("done");
    };

    recognition.onend = () => {
      setInterim("");
      setRecState("done");
    };

    // Reset before starting
    setTranscript("");
    setInterim("");
    setErrorType(null);
    setRecState("recording");

    try {
      recognition.start();
    } catch {
      setErrorType("generic");
      setRecState("done");
    }
  }

  function stopRecording() {
    try {
      recognitionRef.current?.stop();
    } catch {
      // already stopped
    }
  }

  function handleUse() {
    const text = transcript.trim();
    if (text) onUse(text);
    reset();
  }

  function reset() {
    setTranscript("");
    setInterim("");
    setErrorType(null);
    setRecState("idle");
  }

  // ── Unsupported ─────────────────────────────────────────────────────────────
  if (recState === "unsupported") {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-2">
        <span>⚠️</span>
        <span>Voice input requires Chrome on desktop or Android.</span>
      </div>
    );
  }

  const hasTranscript = transcript.trim().length > 0;

  return (
    <div className="space-y-3">
      {/* Mic / Stop button row */}
      <div className="flex items-center gap-3">
        {recState === "recording" ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 min-w-[48px] min-h-[48px] justify-center bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-red-500/25 transition"
            aria-label="Stop recording"
          >
            <span className="w-3.5 h-3.5 bg-red-400 rounded-sm shrink-0" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 min-w-[48px] min-h-[48px] justify-center bg-white/8 border border-white/15 text-white/70 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/12 hover:text-white transition"
            aria-label="Start recording"
          >
            <span className="text-base">🎙️</span>
            {recState === "done" ? "Record again" : "Tap to speak"}
          </button>
        )}

        {recState === "recording" && (
          <span className="flex items-center gap-1.5 text-xs text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Listening…
          </span>
        )}
      </div>

      {/* Live transcript area */}
      {(hasTranscript || interim) && (
        <div className="bg-white/6 border border-white/12 rounded-lg px-3 py-2.5 text-sm leading-relaxed min-h-[52px]">
          <span className="text-white/90">{transcript}</span>
          {interim && (
            <span className="text-white/35 italic"> {interim}</span>
          )}
        </div>
      )}

      {/* Error messages */}
      {errorType && (
        <p className="text-xs text-red-400/80">
          {errorType === "permission" && "Please allow microphone access in your browser settings."}
          {errorType === "no-speech" && "No speech detected — try again."}
          {errorType === "generic" && "Something went wrong. Please try again."}
        </p>
      )}

      {/* Actions after recording */}
      {recState === "done" && hasTranscript && !errorType && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUse}
            className="flex-1 bg-white text-[#0F1E40] text-xs font-semibold rounded-lg py-2 hover:bg-white/90 transition"
          >
            Use this ✓
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-white/40 border border-white/15 rounded-lg px-3 py-2 hover:text-white/60 hover:border-white/25 transition"
          >
            Discard
          </button>
        </div>
      )}

      {/* Done but empty / only error */}
      {recState === "done" && !hasTranscript && (
        <button
          type="button"
          onClick={reset}
          className="text-xs text-white/40 hover:text-white/60 transition"
        >
          ← Try again
        </button>
      )}
    </div>
  );
}
