import { describe, it, expect } from 'vitest';
import { 
  convertTextToHTML, 
  sanitizeHTML, 
  convertAndSanitize,
  ConversionResult 
} from '@/lib/services/content-converter';

describe('Content Converter', () => {
  describe('convertTextToHTML', () => {
    it('should convert plain text paragraphs', () => {
      const text = `This is the first paragraph.
It continues on the same line.

This is a second paragraph.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<p>This is the first paragraph. It continues on the same line.</p>');
      expect(result.html).toContain('<p>This is a second paragraph.</p>');
      expect(result.stats.paragraphCount).toBe(2);
    });

    it('should detect chapter headings', () => {
      const text = `CHAPTER 1: INTRODUCTION

This is the content.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<h1>CHAPTER 1: INTRODUCTION</h1>');
      expect(result.stats.headingCount).toBe(1);
    });

    it('should detect numbered headings', () => {
      const text = `1. Introduction

Content here.

1.1 Overview

More content.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<h2>1. Introduction</h2>');
      expect(result.html).toContain('<h3>1.1 Overview</h3>');
      expect(result.stats.headingCount).toBe(2);
    });

    it('should detect all-caps headings', () => {
      const text = `EXECUTIVE SUMMARY

This is the summary content.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<h2>EXECUTIVE SUMMARY</h2>');
      expect(result.stats.headingCount).toBe(1);
    });

    it('should convert numbered lists', () => {
      const text = `Here is a list:

1. First item
2. Second item
3. Third item

End of list.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<ol>');
      expect(result.html).toContain('<li>First item</li>');
      expect(result.html).toContain('<li>Second item</li>');
      expect(result.html).toContain('<li>Third item</li>');
      expect(result.html).toContain('</ol>');
      expect(result.stats.listCount).toBe(1);
    });

    it('should convert bullet lists', () => {
      const text = `Bullet points:

- First bullet
- Second bullet
- Third bullet`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<ul>');
      expect(result.html).toContain('<li>First bullet</li>');
      expect(result.html).toContain('<li>Second bullet</li>');
      expect(result.html).toContain('<li>Third bullet</li>');
      expect(result.html).toContain('</ul>');
      expect(result.stats.listCount).toBe(1);
    });

    it('should handle code blocks with triple backticks', () => {
      const text = `Here is some code:

\`\`\`
function hello() {
  console.log('world');
}
\`\`\`

More text.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<pre><code>');
      expect(result.html).toContain('function hello()');
      expect(result.html).toContain('console.log(');
      expect(result.html).toContain('</code></pre>');
      expect(result.stats.codeBlockCount).toBe(1);
    });

    it('should handle indented code blocks', () => {
      const text = `Code example:

    function add(a, b) {
      return a + b;
    }
    
    console.log(add(1, 2));

End of code.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).toContain('<pre><code>');
      expect(result.html).toContain('function add(a, b)');
      expect(result.html).toContain('</code></pre>');
      expect(result.stats.codeBlockCount).toBe(1);
    });

    it('should preserve table placeholders', () => {
      const text = `Some text before.

[TABLE:0]

Some text after.`;
      
      const tables = [{
        html: '<table class="extracted-table"><tr><td>Cell 1</td></tr></table>',
        pageNumber: 1
      }];
      
      const result = convertTextToHTML(text, tables);
      
      expect(result.html).toContain('<table class="extracted-table">');
      expect(result.html).toContain('<td>Cell 1</td>');
      expect(result.stats.tableCount).toBe(1);
    });

    it('should replace multiple table placeholders', () => {
      const text = `First table:

[TABLE:0]

Second table:

[TABLE:1]`;
      
      const tables = [
        { html: '<table><tr><td>Table 1</td></tr></table>', pageNumber: 1 },
        { html: '<table><tr><td>Table 2</td></tr></table>', pageNumber: 2 }
      ];
      
      const result = convertTextToHTML(text, tables);
      
      expect(result.html).toContain('<td>Table 1</td>');
      expect(result.html).toContain('<td>Table 2</td>');
      expect(result.stats.tableCount).toBe(2);
    });

    it('should handle mixed content', () => {
      const text = `CHAPTER 1

Introduction paragraph.

- First item
- Second item

\`\`\`
code here
\`\`\`

Conclusion.`;
      
      const result = convertTextToHTML(text);
      
      expect(result.stats.headingCount).toBe(1);  // CHAPTER 1
      expect(result.stats.paragraphCount).toBe(2); // Intro, Conclusion (code block is separate)
      expect(result.stats.listCount).toBe(1);     // bullet list
      expect(result.stats.codeBlockCount).toBe(1);
    });

    it('should escape HTML characters', () => {
      const text = `Text with <script> and & special "characters".`;
      
      const result = convertTextToHTML(text);
      
      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
      expect(result.html).toContain('&amp;');
      expect(result.html).toContain('&quot;');
    });
  });

  describe('sanitizeHTML', () => {
    it('should remove script tags', () => {
      const html = '<p>Safe content</p><script>alert("xss")</script>';
      const sanitized = sanitizeHTML(html);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should remove event handlers', () => {
      const html = '<p onclick="alert(\'xss\')">Click me</p>';
      const sanitized = sanitizeHTML(html);
      
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('<p>Click me</p>');
    });

    it('should allow safe tags', () => {
      const html = '<h1>Title</h1><p>Paragraph</p><ul><li>Item</li></ul>';
      const sanitized = sanitizeHTML(html);
      
      expect(sanitized).toContain('<h1>Title</h1>');
      expect(sanitized).toContain('<p>Paragraph</p>');
      expect(sanitized).toContain('<ul><li>Item</li></ul>');
    });

    it('should allow table tags', () => {
      const html = '<table class="extracted-table"><tr><th>Header</th></tr><tr><td>Data</td></tr></table>';
      const sanitized = sanitizeHTML(html);
      
      expect(sanitized).toContain('<table');
      expect(sanitized).toContain('<tr>');
      expect(sanitized).toContain('<th>Header</th>');
      expect(sanitized).toContain('<td>Data</td>');
    });

    it('should allow img tags with src and alt', () => {
      const html = '<img src="/storage/images/book-123/image-1.png" alt="Description" width="100">';
      const sanitized = sanitizeHTML(html);
      
      expect(sanitized).toContain('<img');
      expect(sanitized).toContain('src=');
      expect(sanitized).toContain('alt=');
      expect(sanitized).toContain('width='); // width is in allowed attrs
    });

    it('should neutralize javascript: URLs', () => {
      const html = '<a href="javascript:alert(\'xss\')">Click</a>';
      const sanitized = sanitizeHTML(html);
      
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('convertAndSanitize', () => {
    it('should convert and sanitize in one step', () => {
      const text = `Normal text.

<script>alert('xss')</script>

More text.`;
      
      const result = convertAndSanitize(text);
      
      expect(result.html).toContain('<p>Normal text.</p>');
      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('<p>More text.</p>');
    });

    it('should handle XSS in table HTML', () => {
      const text = `[TABLE:0]`;
      const tables = [{
        html: '<table><tr><td onclick="alert(\'xss\')">Cell</td></tr></table>',
        pageNumber: 1
      }];
      
      const result = convertAndSanitize(text, tables);
      
      expect(result.html).toContain('<td>Cell</td>');
      expect(result.html).not.toContain('onclick');
    });
  });
});
