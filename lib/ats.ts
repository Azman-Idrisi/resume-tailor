export interface ATSResult {
  score: number;
  matched: string[];
  added: string[];
  missing: string[];
}

export function calcATS(
  jdKeywords: string[],
  masterTex: string,
  generatedTex: string
): ATSResult {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, " ");
  const masterNorm = norm(masterTex);
  const genNorm = norm(generatedTex);

  const matched: string[] = [];
  const added: string[] = [];
  const missing: string[] = [];

  for (const kw of jdKeywords) {
    const k = norm(kw);
    const inGen = genNorm.includes(k);
    const inMaster = masterNorm.includes(k);

    if (inGen && inMaster) matched.push(kw);
    else if (inGen && !inMaster) added.push(kw);
    else missing.push(kw);
  }

  const total = jdKeywords.length || 1;
  const score = Math.round(((matched.length + added.length) / total) * 100);

  return { score, matched, added, missing };
}
