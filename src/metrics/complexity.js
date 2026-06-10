/**
 * Estimate cyclomatic complexity by counting decision points.
 * Simple but effective heuristic: if/else/for/while/case/&&/||/??/catch/?
 */
export function measureComplexity(content) {
  const decisionPatterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /&&/g,
    /\|\|/g,
    /\?\?/g,
    /\bcatch\b/g,
    /\?\.\w+/g,
  ];

  let total = 1; // base complexity
  for (const pattern of decisionPatterns) {
    const matches = content.match(pattern);
    if (matches) total += matches.length;
  }

  // Per-function estimation
  const funcPattern = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>|(?:async\s+)?function\s*\(|(?:public|private|static)\s+\w+\s*\()/g;
  const functions = content.match(funcPattern);
  const funcCount = functions ? functions.length : 0;

  // Estimate max complexity per function
  const lines = content.split('\n');
  let maxPerFunc = 1;
  let currentBlockComplexity = 0;
  let braceDepth = 0;

  for (const line of lines) {
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    
    const lineDecisions = countDecisions(line);
    currentBlockComplexity += lineDecisions;
    
    braceDepth += opens - closes;
    
    if (braceDepth <= 0 && currentBlockComplexity > 0) {
      maxPerFunc = Math.max(maxPerFunc, currentBlockComplexity + 1);
      currentBlockComplexity = 0;
    }
  }
  maxPerFunc = Math.max(maxPerFunc, currentBlockComplexity + 1);

  return {
    total: Math.max(1, total),
    functions: funcCount,
    max: Math.min(maxPerFunc, total),
    average: funcCount > 0 ? Math.round(total / funcCount * 10) / 10 : total,
  };
}

function countDecisions(line) {
  let count = 0;
  const patterns = [/\bif\b/, /\belse\s+if\b/, /\bfor\b/, /\bwhile\b/, /\bcase\b/, /&&/, /\|\|/, /\?\?/, /\bcatch\b/];
  for (const p of patterns) {
    if (p.test(line)) count++;
  }
  return count;
}
