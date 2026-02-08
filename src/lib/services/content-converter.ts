import DOMPurify from 'isomorphic-dompurify';

/**
 * Result of content conversion
 */
export interface ConversionResult {
  /** HTML content */
  html: string;
  /** Conversion statistics */
  stats: {
    paragraphCount: number;
    headingCount: number;
    listCount: number;
    tableCount: number;
    codeBlockCount: number;
  };
}

/**
 * Allowed HTML tags for sanitization
 */
const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'pre', 'code',
  'strong', 'em', 'b', 'i', 'br', 'hr', 'div', 'span'
];

/**
 * Allowed HTML attributes for sanitization
 */
const ALLOWED_ATTRS: Record<string, string[]> = {
  'img': ['src', 'alt', 'width', 'height'],
  'table': ['class'],
  '*': ['class']
};

/**
 * Detects if a line is a heading
 */
function detectHeading(line: string): boolean {
  const trimmed = line.trim();
  
  // Empty lines are not headings
  if (trimmed.length === 0) return false;
  
  // Short line check (< 100 chars)
  if (trimmed.length > 100) return false;
  
  // Markdown-style heading (already has #)
  if (/^#{1,6}\s+/.test(trimmed)) return true;
  
  // All uppercase (and more than 3 chars, but not too long)
  // Must be relatively short to be a heading
  if (trimmed.length < 50 && trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    // But not just a number
    if (!/^\d+$/.test(trimmed)) return true;
  }
  
  // Contains heading keywords at the START
  const headingPatterns = /^(chapter|part|section|appendix|introduction|conclusion|preface|prologue|epilogue)\s*[\d:\-]+/i;
  if (headingPatterns.test(trimmed)) return true;
  
  // Numbered heading (e.g., "1. Introduction", "1.1 Overview")
  // Must be followed by a single capitalized word (not a sentence)
  const numberedMatch = trimmed.match(/^(\d+(?:\.\d+)*)\.?\s+(\w+)/);
  if (numberedMatch) {
    const rest = trimmed.substring(numberedMatch[0].length).trim();
    // If followed by more text, it should not look like a sentence
    if (rest.length === 0 || (rest[0] === rest[0].toUpperCase() && !rest.includes('.'))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gets heading level based on content
 */
function getHeadingLevel(line: string): number {
  const trimmed = line.trim();
  
  // Check for markdown-style heading
  const markdownMatch = trimmed.match(/^(#{1,6})\s+/);
  if (markdownMatch) {
    return markdownMatch[1].length;
  }
  
  // Chapter headings get h1
  if (/^chapter\s+\d+/i.test(trimmed)) return 1;
  if (/^part\s+\d+/i.test(trimmed)) return 1;
  
  // Numbered headings: 1. = h1, 1.1 = h2, 1.1.1 = h3
  const numberedMatch = trimmed.match(/^(\d+(?:\.\d+)*)/);
  if (numberedMatch) {
    const level = numberedMatch[1].split('.').length;
    return Math.min(level + 1, 6); // h2 for 1., h3 for 1.1, etc.
  }
  
  // All caps main headings get h2
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) return 2;
  
  // Default to h3 for other headings
  return 3;
}

/**
 * Detects list type for a line
 * Distinguishes between "1. Introduction" (heading) and "1. Buy milk" (list item)
 */
function detectListType(line: string, nextLine: string = ''): 'ol' | 'ul' | null {
  const trimmed = line.trim();
  const nextTrimmed = nextLine.trim();
  
  // Bullet list: "- Item", "* Item", "+ Item" - always lists
  if (/^[-*+]\s+/.test(trimmed)) return 'ul';
  
  // Numbered list: "1. Item", "1) Item", "(1) Item"
  const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
  if (numberedMatch) {
    const content = numberedMatch[2];
    
    // Heuristic: If it's "1. Word" (single word, capitalized), likely a heading
    // If it's "1. Multiple words description", likely a list item
    const words = content.split(/\s+/);
    const isSingleWord = words.length === 1;
    const isCapitalized = content[0] === content[0].toUpperCase();
    const hasNoPeriod = !content.includes('.');
    const nextIsSimilarNumber = /^\d+[.)]/.test(nextTrimmed);
    
    // If next line is also numbered, this is definitely a list
    if (nextIsSimilarNumber) return 'ol';
    
    // If single word, capitalized, no period, and no following number - treat as heading
    if (isSingleWord && isCapitalized && hasNoPeriod) {
      return null; // Will be treated as heading
    }
    
    return 'ol';
  }
  
  return null;
}

/**
 * Extracts list item content (removes the bullet/number)
 */
function extractListItemContent(line: string): string {
  return line.trim().replace(/^(\d+[.)]|\(\d+\)|[-*+])\s+/, '');
}

/**
 * Checks if a line is a code block delimiter (triple backticks)
 */
function isCodeBlockDelimiter(line: string): boolean {
  return line.trim().startsWith('```');
}

/**
 * Checks if a line is indented (for code blocks)
 */
function isIndentedLine(line: string): boolean {
  return line.startsWith('    ') || line.startsWith('\t');
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, c => map[c] || c);
}

/**
 * Detects code block and returns its extent
 */
function detectCodeBlock(lines: string[], startIndex: number): { isCode: boolean; endIndex: number; content: string } {
  const line = lines[startIndex];
  
  // Check for triple backticks
  if (isCodeBlockDelimiter(line)) {
    let endIndex = -1;
    for (let i = startIndex + 1; i < lines.length; i++) {
      if (isCodeBlockDelimiter(lines[i])) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex !== -1) {
      const content = lines.slice(startIndex + 1, endIndex).join('\n');
      return { isCode: true, endIndex, content };
    }
  }
  
  // Check for indented block
  if (isIndentedLine(line)) {
    let endIndex = startIndex;
    for (let i = startIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine.trim() === '' || isIndentedLine(currentLine)) {
        endIndex = i;
        if (currentLine.trim() !== '') {
          endIndex = i;
        }
      } else {
        break;
      }
    }
    
    // Need at least 2 consecutive indented lines for a code block
    if (endIndex > startIndex) {
      const content = lines.slice(startIndex, endIndex + 1)
        .map(l => l.replace(/^(    |\t)/, ''))  // Remove indentation
        .join('\n');
      return { isCode: true, endIndex, content };
    }
  }
  
  return { isCode: false, endIndex: startIndex, content: '' };
}

/**
 * Converts a list starting at the given index
 */
function convertList(lines: string[], startIndex: number, listType: 'ol' | 'ul'): { html: string; endIndex: number } {
  const items: string[] = [];
  let i = startIndex;
  
  while (i < lines.length) {
    const line = lines[i];
    const currentListType = detectListType(line);
    
    if (currentListType === listType) {
      items.push(extractListItemContent(line));
      i++;
    } else if (line.trim() === '') {
      // Check if next non-empty line continues the list
      let nextIndex = i + 1;
      while (nextIndex < lines.length && lines[nextIndex].trim() === '') {
        nextIndex++;
      }
      if (nextIndex < lines.length && detectListType(lines[nextIndex]) === listType) {
        i = nextIndex;
        continue;
      }
      break;
    } else {
      break;
    }
  }
  
  const listItems = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const tag = listType === 'ol' ? 'ol' : 'ul';
  
  return { html: `<${tag}>${listItems}</${tag}>`, endIndex: i - 1 };
}

/**
 * Converts a paragraph starting at the given index
 */
function convertParagraph(lines: string[], startIndex: number): { html: string; endIndex: number } {
  const content: string[] = [lines[startIndex].trim()];
  let i = startIndex + 1;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Stop on empty line
    if (line.trim() === '') break;
    
    // Stop on heading
    if (detectHeading(line)) break;
    
    // Stop on list item
    if (detectListType(line)) break;
    
    // Stop on code block
    if (isCodeBlockDelimiter(line) || isIndentedLine(line)) break;
    
    // Stop on table placeholder
    if (line.trim().startsWith('[TABLE:')) break;
    
    content.push(line.trim());
    i++;
  }
  
  const paragraphText = content.join(' ');
  return { html: `<p>${escapeHtml(paragraphText)}</p>`, endIndex: i - 1 };
}

/**
 * Replaces table placeholders with actual table HTML
 */
function replaceTablePlaceholders(html: string, tables: { html: string; pageNumber: number }[]): string {
  let result = html;
  
  // Replace [TABLE:N] placeholders with actual table HTML
  const tableRegex = /\[TABLE:(\d+)\]/g;
  result = result.replace(tableRegex, (match, index) => {
    const tableIndex = parseInt(index, 10);
    if (tables[tableIndex]) {
      return tables[tableIndex].html;
    }
    return '<!-- Table not found -->';
  });
  
  return result;
}

/**
 * Converts plain text to HTML
 */
export function convertTextToHTML(text: string, tables: { html: string; pageNumber: number }[] = []): ConversionResult {
  const lines = text.split('\n');
  const htmlParts: string[] = [];
  let i = 0;
  
  const stats = {
    paragraphCount: 0,
    headingCount: 0,
    listCount: 0,
    tableCount: 0,
    codeBlockCount: 0
  };
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }
    
    // Check for table placeholder
    if (line.trim().startsWith('[TABLE:')) {
      htmlParts.push(line.trim());
      stats.tableCount++;
      i++;
      continue;
    }
    
    // Check for list BEFORE heading (list items like "1. Item" should not be headings)
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    const listType = detectListType(line, nextLine);
    if (listType) {
      const { html, endIndex } = convertList(lines, i, listType);
      htmlParts.push(html);
      stats.listCount++;
      i = endIndex + 1;
      continue;
    }
    
    // Check for heading
    if (detectHeading(line)) {
      const level = getHeadingLevel(line);
      const headingText = line.trim().replace(/^#{1,6}\s+/, ''); // Remove markdown # if present
      htmlParts.push(`<h${level}>${escapeHtml(headingText)}</h${level}>`);
      stats.headingCount++;
      i++;
      continue;
    }
    
    // Check for code block
    const codeCheck = detectCodeBlock(lines, i);
    if (codeCheck.isCode) {
      htmlParts.push(`<pre><code>${escapeHtml(codeCheck.content)}</code></pre>`);
      stats.codeBlockCount++;
      i = codeCheck.endIndex + 1;
      continue;
    }
    
    // Regular paragraph
    const { html, endIndex } = convertParagraph(lines, i);
    htmlParts.push(html);
    stats.paragraphCount++;
    i = endIndex + 1;
  }
  
  // Join HTML parts and replace table placeholders
  let html = htmlParts.join('\n\n');
  html = replaceTablePlaceholders(html, tables);
  
  return { html, stats };
}

/**
 * Sanitizes HTML to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['src', 'alt', 'width', 'height', 'class'],
    KEEP_CONTENT: true
  });
}

/**
 * Converts text to sanitized HTML (convenience function)
 */
export function convertAndSanitize(text: string, tables: { html: string; pageNumber: number }[] = []): ConversionResult {
  const result = convertTextToHTML(text, tables);
  result.html = sanitizeHTML(result.html);
  return result;
}
