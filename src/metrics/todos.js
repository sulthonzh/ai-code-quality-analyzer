const TODO_PATTERN = /(?:\/\/|#|<!--)\s*(TODO|FIXME|HACK|XXX|BUG|OPTIMIZE|NOTE)(?:\(([^)]+)\))?\s*:\s*(.+)/gi;

export function findTodos(content) {
  const results = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;
    TODO_PATTERN.lastIndex = 0;
    
    while ((match = TODO_PATTERN.exec(line)) !== null) {
      results.push({
        type: match[1].toUpperCase(),
        assignee: match[2] || null,
        text: match[3].trim(),
        line: i + 1,
      });
    }
  }
  
  return results;
}
