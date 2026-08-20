"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "resume_tailor_master";

type Tab = "master" | "tailor";
type Mode = "balanced" | "aggressive";

interface ATSResult {
  score: number;
  matched: string[];
  added: string[];
  missing: string[];
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("master");
  const [masterTex, setMasterTex] = useState("");
  const [masterSaved, setMasterSaved] = useState(false);
  const [jd, setJd] = useState("");
  const [mode, setMode] = useState<Mode>("aggressive");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [generatedTex, setGeneratedTex] = useState("");
  const [ats, setAts] = useState<ATSResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setMasterTex(saved);
      setMasterSaved(true);
    }
  }, []);

  const saveMaster = () => {
    if (!masterTex.trim()) return;
    localStorage.setItem(STORAGE_KEY, masterTex);
    setMasterSaved(true);
  };

  const clearMaster = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMasterTex("");
    setMasterSaved(false);
  };

  const tailorResume = useCallback(async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setError("No master resume saved. Go to Master Resume tab and save it first.");
      return;
    }
    if (!jd.trim()) {
      setError("Paste a job description first.");
      return;
    }

    setError("");
    setGeneratedTex("");
    setAts(null);
    setLoading(true);

    const msgs = ["Analysing JD...", "Optimising resume...", "Generating LaTeX..."];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => {
      i = (i + 1) % msgs.length;
      setLoadingMsg(msgs[i]);
    }, 1800);

    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterTex: saved, jd, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setGeneratedTex(data.tex);
        setAts(data.ats);
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setLoadingMsg("");
    }
  }, [jd, mode]);

  const copyTex = async () => {
    await navigator.clipboard.writeText(generatedTex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTex = () => {
    const blob = new Blob([generatedTex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume_tailored.tex";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <span className="text-lg font-bold tracking-tight text-white">Resume Tailor</span>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">ATS · LaTeX · Gemini</span>
      </header>

      <div className="flex border-b border-zinc-800 px-6">
        {(["master", "tailor"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm capitalize transition-colors ${
              tab === t
                ? "text-white border-b-2 border-blue-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "master" ? "Master Resume" : "Tailor Resume"}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-5xl mx-auto">
        {tab === "master" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-zinc-400">Paste your master LaTeX resume once. Persists between sessions.</h2>
              {masterSaved && (
                <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                  ✓ Master resume saved
                </span>
              )}
            </div>

            <textarea
              value={masterTex}
              onChange={(e) => setMasterTex(e.target.value)}
              placeholder={`\\documentclass{article}\n...\n\\begin{document}\n...\n\\end{document}`}
              className="w-full h-[60vh] bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
              spellCheck={false}
            />

            <div className="flex gap-3">
              <button
                onClick={saveMaster}
                disabled={!masterTex.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                {masterSaved ? "Update Master Resume" : "Save Master Resume"}
              </button>
              <button
                onClick={clearMaster}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {tab === "tailor" && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500">ATS Mode:</span>
              {(["balanced", "aggressive"] as Mode[]).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="accent-blue-500"
                  />
                  <span className={`text-sm capitalize ${mode === m ? "text-white" : "text-zinc-500"}`}>
                    {m}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Job Description</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full h-56 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                spellCheck={false}
              />
            </div>

            <button
              onClick={tailorResume}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⟳</span>
                  {loadingMsg}
                </>
              ) : (
                "Generate Tailored Resume"
              )}
            </button>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {ats && (
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white">{ats.score}%</span>
                  <span className="text-sm text-zinc-400">Estimated ATS Match</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {ats.matched.length > 0 && (
                    <div>
                      <div className="text-zinc-500 mb-1">Strong matches ({ats.matched.length})</div>
                      {ats.matched.slice(0, 10).map((k) => (
                        <div key={k} className="text-emerald-400">✓ {k}</div>
                      ))}
                      {ats.matched.length > 10 && <div className="text-zinc-600">+{ats.matched.length - 10} more</div>}
                    </div>
                  )}
                  {ats.added.length > 0 && (
                    <div>
                      <div className="text-zinc-500 mb-1">Added from JD ({ats.added.length})</div>
                      {ats.added.slice(0, 10).map((k) => (
                        <div key={k} className="text-blue-400">+ {k}</div>
                      ))}
                      {ats.added.length > 10 && <div className="text-zinc-600">+{ats.added.length - 10} more</div>}
                    </div>
                  )}
                  {ats.missing.length > 0 && (
                    <div>
                      <div className="text-zinc-500 mb-1">Not covered ({ats.missing.length})</div>
                      {ats.missing.slice(0, 10).map((k) => (
                        <div key={k} className="text-zinc-600">✗ {k}</div>
                      ))}
                      {ats.missing.length > 10 && <div className="text-zinc-600">+{ats.missing.length - 10} more</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {generatedTex && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Generated LaTeX</span>
                  <div className="flex gap-2">
                    <button
                      onClick={copyTex}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                    >
                      {copied ? "✓ Copied" : "Copy LaTeX"}
                    </button>
                    <button
                      onClick={downloadTex}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                    >
                      Download .tex
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={generatedTex}
                  className="w-full h-[60vh] bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-300 resize-none focus:outline-none font-mono leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
