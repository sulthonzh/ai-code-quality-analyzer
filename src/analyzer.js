import { glob } from 'glob';
import { readFile, stat } from 'fs/promises';
import { resolve, extname } from 'path';
import { measureComplexity } from './metrics/complexity.js';
import { findTodos } from './metrics/todos.js';
import { findDuplicates } from './metrics/duplicates.js';
import { analyzeImports } from './metrics/imports.js';

const SUPPORTED_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt',
  '.c', '.cpp', '.h', '.hpp',
]);

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/__pycache__/**',
  '**/.next/**',
  '**/vendor/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.map',
];

export async function analyze(rootDir) {
  const absRoot = resolve(rootDir);
  const pattern = '**/*';
  
  const files = await glob(pattern, {
    cwd: absRoot,
    ignore: IGNORE_PATTERNS,
    absolute: true,
    nodir: true,
  });

  const codeFiles = files.filter(f => SUPPORTED_EXTENSIONS.has(extname(f)));
  
  const fileResults = [];
  let totalLines = 0;
  let totalCodeLines = 0;
  
  for (const filePath of codeFiles) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#'));
      
      totalLines += lines.length;
      totalCodeLines += codeLines.length;
      
      fileResults.push({
        path: filePath.replace(absRoot + '/', ''),
        totalLines: lines.length,
        codeLines: codeLines.length,
        complexity: measureComplexity(content),
        todos: findTodos(content),
        imports: analyzeImports(content, extname(filePath)),
      });
    } catch {
      // Skip unreadable files
    }
  }

  const duplicates = await findDuplicates(codeFiles);
  
  // Calculate overall score (0-100)
  const score = calculateScore(fileResults, duplicates, codeFiles.length);
  
  return {
    rootDir: absRoot,
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      codeFiles: codeFiles.length,
      totalLines,
      codeLines,
      score,
    },
    files: fileResults,
    duplicates: duplicates.slice(0, 50), // cap at 50
    recommendations: generateRecommendations(fileResults, duplicates, score),
  };
}

function calculateScore(files, duplicates, fileCount) {
  if (fileCount === 0) return 100;
  
  let score = 100;
  
  // Penalize large files (>500 lines)
  const largeFiles = files.filter(f => f.totalLines > 500);
  score -= largeFiles.length * 2;
  
  // Penalize high complexity functions
  const complexFiles = files.filter(f => f.complexity.max > 20);
  score -= complexFiles.length * 3;
  
  // Penalize TODOs
  const todoCount = files.reduce((sum, f) => sum + f.todos.length, 0);
  score -= Math.min(todoCount * 0.5, 15);
  
  // Penalize duplicates
  score -= Math.min(duplicates.length * 1.5, 20);
  
  // Penalize if many files have very low code ratio
  const lowRatioFiles = files.filter(f => f.totalLines > 50 && f.codeLines / f.totalLines < 0.4);
  score -= lowRatioFiles.length * 1;
  
  return Math.max(0, Math.round(score));
}

function generateRecommendations(files, duplicates, score) {
  const recs = [];
  
  const largeFiles = files.filter(f => f.totalLines > 500);
  if (largeFiles.length > 0) {
    recs.push({
      type: 'large-files',
      severity: 'warning',
      message: `${largeFiles.length} file(s) exceed 500 lines. Consider splitting.`,
      files: largeFiles.map(f => f.path),
    });
  }
  
  const complexFiles = files.filter(f => f.complexity.max > 20);
  if (complexFiles.length > 0) {
    recs.push({
      type: 'high-complexity',
      severity: 'warning',
      message: `${complexFiles.length} file(s) have functions with complexity > 20. Refactor recommended.`,
      files: complexFiles.map(f => f.path),
    });
  }
  
  if (duplicates.length > 5) {
    recs.push({
      type: 'duplicates',
      severity: 'info',
      message: `${duplicates.length} potential duplicate blocks found. Consider extracting shared code.`,
    });
  }
  
  const hackTodos = files.flatMap(f => f.todos).filter(t => t.type === 'HACK');
  if (hackTodos.length > 0) {
    recs.push({
      type: 'hacks',
      severity: 'info',
      message: `${hackTodos.length} HACK comments found. These usually indicate tech debt.`,
    });
  }
  
  if (score >= 80) {
    recs.push({ type: 'overall', severity: 'good', message: 'Codebase looks healthy overall.' });
  }
  
  return recs;
}
