export function formatHuman(results, { quiet = false } = {}) {
  const { summary, files, duplicates, recommendations } = results;
  const lines = [];
  
  // Header
  lines.push(`codeq — code quality report`);
  lines.push(`─────────────────────────────`);
  lines.push(`📁 ${summary.codeFiles} code files (${summary.totalFiles} total)`);
  lines.push(`📝 ${summary.codeLines} lines of code (${summary.totalLines} total)`);
  lines.push(`⭐ Score: ${summary.score}/100`);
  lines.push('');
  
  if (!quiet) {
    // Top complex files
    const byComplexity = [...files]
      .filter(f => f.complexity.total > 5)
      .sort((a, b) => b.complexity.total - a.complexity.total)
      .slice(0, 10);
    
    if (byComplexity.length > 0) {
      lines.push('Most complex files:');
      for (const f of byComplexity) {
        const bar = '█'.repeat(Math.min(Math.round(f.complexity.total / 3), 30));
        lines.push(`  ${f.path.padEnd(40)} complexity: ${f.complexity.total} ${bar}`);
      }
      lines.push('');
    }
    
    // Largest files
    const bySize = [...files]
      .sort((a, b) => b.totalLines - a.totalLines)
      .slice(0, 5);
    
    if (bySize.length > 0) {
      lines.push('Largest files:');
      for (const f of bySize) {
        lines.push(`  ${f.path.padEnd(40)} ${f.totalLines} lines`);
      }
      lines.push('');
    }
    
    // TODOs
    const allTodos = files.flatMap(f => f.todos.map(t => ({ ...t, file: f.path })));
    if (allTodos.length > 0) {
      lines.push(`TODOs & FIXMEs (${allTodos.length}):`);
      for (const t of allTodos.slice(0, 15)) {
        const tag = t.assignee ? `${t.type}(${t.assignee})` : t.type;
        lines.push(`  ${t.file}:${t.line} — ${tag}: ${t.text}`);
      }
      if (allTodos.length > 15) lines.push(`  ... and ${allTodos.length - 15} more`);
      lines.push('');
    }
    
    // Duplicates
    if (duplicates.length > 0) {
      lines.push(`Potential duplicates (${duplicates.length}):`);
      for (const d of duplicates.slice(0, 5)) {
        lines.push(`  "${d.preview}..." — found ${d.occurrences}x`);
      }
      lines.push('');
    }
  }
  
  // Recommendations
  if (recommendations.length > 0) {
    lines.push('Recommendations:');
    for (const r of recommendations) {
      const icon = r.severity === 'good' ? '✅' : r.severity === 'warning' ? '⚠️' : '💡';
      lines.push(`  ${icon} ${r.message}`);
    }
  }
  
  return lines.join('\n');
}

export function formatJson(results) {
  return JSON.stringify(results, null, 2);
}
