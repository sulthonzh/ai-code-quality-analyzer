export function analyzeImports(content, ext) {
  const imports = [];
  
  if (['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    // ESM: import ... from '...'
    const esmPattern = /import\s+(?:.*?)\s+from\s+['"]([^'"]+)['"]/g;
    // CJS: require('...')
    const cjsPattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    let match;
    while ((match = esmPattern.exec(content)) !== null) {
      imports.push(classifyImport(match[1]));
    }
    while ((match = cjsPattern.exec(content)) !== null) {
      imports.push(classifyImport(match[1]));
    }
  } else if (ext === '.py') {
    const pyPattern = /(?:import|from)\s+(\S+)/g;
    let match;
    while ((match = pyPattern.exec(content)) !== null) {
      imports.push({ module: match[1], type: 'external' });
    }
  }
  
  return {
    total: imports.length,
    external: imports.filter(i => i.type === 'external').map(i => i.module),
    local: imports.filter(i => i.type === 'local').map(i => i.module),
  };
}

function classifyImport(modulePath) {
  const isLocal = modulePath.startsWith('.') || modulePath.startsWith('/');
  return { module: modulePath, type: isLocal ? 'local' : 'external' };
}
