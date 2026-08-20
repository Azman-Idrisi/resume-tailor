export function stripFences(text: string): string {
  return text
    .replace(/^```(?:latex|tex)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

export function validateLatex(tex: string): { ok: boolean; error?: string } {
  if (!tex.includes("\\documentclass")) return { ok: false, error: "Missing \\documentclass" };
  if (!tex.includes("\\begin{document}")) return { ok: false, error: "Missing \\begin{document}" };
  if (!tex.includes("\\end{document}")) return { ok: false, error: "Missing \\end{document}" };
  return { ok: true };
}
