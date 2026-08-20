import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { buildPrompt } from "@/lib/prompts";
import { stripFences, validateLatex } from "@/lib/latex";
import { calcATS } from "@/lib/ats";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  let body: { masterTex: string; jd: string; mode: "balanced" | "aggressive" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { masterTex, jd, mode = "aggressive" } = body;

  if (!masterTex?.trim()) {
    return NextResponse.json({ error: "No master resume saved" }, { status: 400 });
  }
  if (!jd?.trim()) {
    return NextResponse.json({ error: "Job description is empty" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(masterTex, jd, mode);

  let raw: string;
  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    raw = result.text ?? "";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429")) return NextResponse.json({ error: "Rate limit hit. Wait a moment and retry." }, { status: 429 });
    if (msg.includes("API_KEY") || msg.includes("401")) return NextResponse.json({ error: "Invalid Gemini API key" }, { status: 401 });
    return NextResponse.json({ error: `Gemini error: ${msg}` }, { status: 502 });
  }

  // Extract ATS keywords from comment block
  let jdKeywords: string[] = [];
  const kwMatch = raw.match(/%ATS_JSON_START\s*\n%(\{[\s\S]*?\})\s*\n%ATS_JSON_END/);
  if (kwMatch) {
    try {
      const parsed = JSON.parse(kwMatch[1].replace(/^%/gm, "").trim());
      jdKeywords = parsed.keywords ?? [];
    } catch { /* ignore */ }
    // Strip the comment block from LaTeX
    raw = raw.replace(/%ATS_JSON_START[\s\S]*?%ATS_JSON_END/g, "").trim();
  }

  const tex = stripFences(raw);
  const validation = validateLatex(tex);

  if (!validation.ok) {
    return NextResponse.json({ error: `Invalid LaTeX output: ${validation.error}` }, { status: 502 });
  }

  const ats = calcATS(jdKeywords, masterTex, tex);

  return NextResponse.json({ tex, ats });
}
