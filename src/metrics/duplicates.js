import { readFile } from 'fs/promises';

/**
 * Find potential duplicate code blocks using line-hash matching.
 * Uses a sliding window of 6-line blocks, normalized.
 */
const WINDOW_SIZE = 6;

export async function findDuplicates(filePaths) {
  const blocks = new Map(); // hash -> [{ file, line }]
  
  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i <= lines.length - WINDOW_SIZE; i++) {
        const block = lines.slice(i, i + WINDOW_SIZE)
          .map(l => l.trim())
          .filter(l => l.length > 2) // skip empty/short lines
          .join('\n');
        
        if (block.length < 20) continue; // too short to matter
        
        const hash = simpleHash(block);
        
        if (!blocks.has(hash)) {
          blocks.set(hash, []);
        }
        blocks.get(hash).push({ file: filePath, line: i + 1, preview: block.split('\n')[0] });
      }
    } catch {
      // skip
    }
  }
  
  // Only return blocks that appear in more than one location
  const duplicates = [];
  for (const [, locations] of blocks) {
    if (locations.length > 1) {
      // Check if they're in different files or far apart
      const files = new Set(locations.map(l => l.file));
      if (files.size > 1) {
        duplicates.push({
          occurrences: locations.length,
          locations: locations.slice(0, 5).map(l => ({
            file: l.file.split('/').pop(),
            line: l.line,
          })),
          preview: locations[0].preview.substring(0, 80),
        });
      }
    }
  }
  
  return duplicates.sort((a, b) => b.occurrences - a.occurrences);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}
