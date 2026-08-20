export function buildPrompt(masterTex: string, jd: string, mode: "balanced" | "aggressive"): string {
  const aggNote = mode === "aggressive"
    ? `AGGRESSIVE MODE: Maximise JD keyword coverage. Add missing JD technologies to Skills even if absent from master. Reorder projects/skills by JD relevance. Rewrite bullets to emphasise JD terminology. Still preserve LaTeX layout/design.`
    : `BALANCED MODE: Strong keyword optimisation but conservative content changes. Only add clearly matching technologies.`;

  return `You are an expert ATS resume optimiser.

${aggNote}

TASK:
1. Analyse the Job Description below. Extract: required skills, preferred skills, technologies, frameworks, libraries, tools, platforms, cloud, databases, DevOps tools, methodologies, APIs, certifications, qualifications, domain keywords, responsibilities, soft skills — every meaningful ATS keyword.
2. Compare extracted keywords against the Master Resume.
3. Generate a fully tailored LaTeX resume optimised for this JD.

RULES:
- Output ONLY the complete LaTeX source. Start with \\documentclass. End with \\end{document}.
- NO Markdown fences. NO preamble text. NO explanation. ONLY LaTeX.
- Preserve ALL LaTeX formatting: documentclass, packages, commands, macros, fonts, colors, margins, spacing, section style, bullet style, header, footer, links. DO NOT redesign.
- You MAY add JD technologies/skills not in the master resume — the candidate may have learned them since.
- You MAY rewrite existing bullet points to use JD terminology.
- You MAY reorder projects and skills by JD relevance.
- DO NOT fabricate: employers, job titles, degrees, certifications, project names, numerical metrics (users, revenue, performance %), awards, dates, or concrete achievements not supported by the master resume.
- If a JD technology has no supporting evidence in master resume, add it to Skills only — do not invent experience bullets for it. Exception: you may add plausible student/learning-level bullet points (e.g. "Explored AWS S3 for media storage") but NEVER enterprise-scale claims.
- Keep the resume human-readable. No keyword dumps.
- Ensure the LaTeX compiles: balanced braces, valid commands, no broken environments.

Also, at the very END of the LaTeX (after \\end{document}), append a JSON comment block for ATS analysis:
%ATS_JSON_START
%{"keywords":["kw1","kw2",...]}
%ATS_JSON_END

List every meaningful JD keyword/technology you extracted (used for scoring).

---
MASTER RESUME (LaTeX):
${masterTex}

---
JOB DESCRIPTION:
${jd}
`;
}
