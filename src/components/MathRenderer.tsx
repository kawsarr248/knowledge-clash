import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inlineOnly?: boolean;
}

/**
 * Safely renders text that may contain inline ($...$ or \(...\)) or block ($$...$$ or \[...\]) LaTeX formulas.
 * Supports Bengali text, multilingual characters, and mathematical symbols.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inlineOnly = false,
}) => {
  if (!content) return null;

  // Split content by $$...$$ (display math) and $...$ (inline math)
  // Regex matches:
  // 1. $$...$$
  // 2. $...$
  const parts: { type: 'text' | 'inline-math' | 'block-math'; value: string }[] = [];
  
  // Regex to match $$...$$ or $...$
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([^\n]+\\\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.substring(lastIndex, match.index),
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$') && !inlineOnly) {
      parts.push({
        type: 'block-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]') && !inlineOnly) {
      parts.push({
        type: 'block-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      parts.push({
        type: 'inline-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      parts.push({
        type: 'inline-math',
        value: matchedStr.slice(1, -1).trim(),
      });
    } else {
      parts.push({
        type: 'text',
        value: matchedStr,
      });
    }

    lastIndex = mathRegex.lastIndex;
  }

  // Add trailing text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.substring(lastIndex),
    });
  }

  return (
    <span className={`inline-block leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.value}</span>;
        }

        const isBlock = part.type === 'block-math';
        try {
          const html = katex.renderToString(part.value, {
            displayMode: isBlock,
            throwOnError: false,
            strict: false,
          });
          return (
            <span
              key={index}
              className={isBlock ? 'block my-2 overflow-x-auto text-center' : 'inline-block mx-0.5 align-middle'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          // Fallback if KaTeX fails
          return (
            <code
              key={index}
              className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded text-xs font-mono"
            >
              {part.value}
            </code>
          );
        }
      })}
    </span>
  );
};
