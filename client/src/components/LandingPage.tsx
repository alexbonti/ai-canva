import { useState } from "react";
import { signInWithGoogle } from "../lib/auth.js";

const BOXES = [
  { icon: "💡", label: "Idea", color: "#fbbf24" },
  { icon: "🔍", label: "Research", color: "#60a5fa" },
  { icon: "📄", label: "PRD", color: "#818cf8" },
  { icon: "💻", label: "Code", color: "#22d3ee" },
  { icon: "📊", label: "Slides", color: "#fb923c" },
  { icon: "🎨", label: "Cartoon", color: "#f472b6" },
  { icon: "📋", label: "Summarize", color: "#a78bfa" },
  { icon: "🖼️", label: "Image", color: "#34d399" },
];

const PIPELINE = [
  { icon: "💡", label: "Idea", color: "#fbbf24" },
  { icon: "🔍", label: "Research", color: "#60a5fa" },
  { icon: "📄", label: "PRD", color: "#818cf8" },
  { icon: "💻", label: "Code", color: "#22d3ee" },
];

export default function LandingPage() {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("Sign-in failed:", e);
      setSigningIn(false);
    }
  };

  return (
    <div className="landing-bg h-full w-full flex items-center justify-center px-4">
      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">

        {/* Logo */}
        <div className="fade-in text-5xl mb-4">🎨</div>

        {/* Headline */}
        <h1 className="fade-in fade-in-delay-1 text-5xl md:text-6xl font-bold text-center mb-4 tracking-tight">
          <span className="gradient-text">AI Canva</span>
        </h1>

        {/* Subtext */}
        <p className="fade-in fade-in-delay-2 text-lg md:text-xl text-slate-300 text-center mb-2 max-w-lg leading-relaxed">
          Build AI pipelines visually.
        </p>
        <p className="fade-in fade-in-delay-2 text-sm md:text-base text-slate-400 text-center mb-8 max-w-lg">
          Connect boxes, run AI prompts, and watch your ideas flow from research to code.
        </p>

        {/* Login button */}
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="fade-in fade-in-delay-3 flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-slate-800 font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-wait"
        >
          {signingIn ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              className="w-5 h-5"
            />
          )}
          {signingIn ? "Connecting..." : "Sign in with Google"}
        </button>

        {/* Pipeline preview card */}
        <div className="fade-in fade-in-delay-4 glass-card float mt-10 p-6 w-full max-w-lg">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 flex-wrap">
            {PIPELINE.map((box, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3">
                <div
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: box.color + "20", border: "1px solid " + box.color + "40" }}
                >
                  <span className="text-xl">{box.icon}</span>
                  <span className="text-xs font-medium" style={{ color: box.color }}>{box.label}</span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <span className="text-slate-500 text-sm">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400">
            Visual pipeline of AI-powered boxes
          </p>
        </div>

        {/* Feature badges */}
        <div className="fade-in fade-in-delay-4 flex items-center gap-3 mt-8 text-xs text-slate-500">
          <span className="flex items-center gap-1">📦 8 Box Types</span>
          <span>·</span>
          <span className="flex items-center gap-1">🤖 Ollama AI</span>
          <span>·</span>
          <span className="flex items-center gap-1">🎨 fal.ai</span>
          <span>·</span>
          <span className="flex items-center gap-1">🔥 Firestore</span>
        </div>

        {/* Box type icons grid */}
        <div className="fade-in fade-in-delay-4 flex flex-wrap items-center justify-center gap-2 mt-6 max-w-md">
          {BOXES.map((box) => (
            <div
              key={box.label}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ backgroundColor: box.color + "15", color: box.color }}
            >
              <span>{box.icon}</span>
              <span className="font-medium">{box.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}