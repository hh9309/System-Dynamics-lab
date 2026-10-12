import React, { useMemo } from 'react';
import katex from 'katex';

interface KatexMathProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Renders a pure KaTeX math formula (inline or block).
 */
export const KatexMath: React.FC<KatexMathProps> = ({
  math,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch (err) {
      console.warn('KaTeX rendering error for:', math, err);
      return katex.renderToString(math.trim(), {
        displayMode,
        throwOnError: false,
      });
    }
  }, [math, displayMode]);

  return (
    <span
      className={`katex-math-wrapper ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Parses mixed text containing markdown inline math `$formula$` or `$$blockFormula$$`
 * and renders inline KaTeX math seamlessly.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    if (!text || typeof text !== 'string') return [];

    // Match $$display$$ or $inline$
    const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
    const tokens: Array<{ type: 'text' | 'math' | 'displayMath'; content: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }

      const raw = match[0];
      if (raw.startsWith('$$') && raw.endsWith('$$')) {
        tokens.push({
          type: 'displayMath',
          content: raw.slice(2, -2),
        });
      } else if (raw.startsWith('$') && raw.endsWith('$')) {
        tokens.push({
          type: 'math',
          content: raw.slice(1, -1),
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    return tokens;
  }, [text]);

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.type === 'text') {
          return <React.Fragment key={i}>{p.content}</React.Fragment>;
        }
        return (
          <KatexMath
            key={i}
            math={p.content}
            displayMode={p.type === 'displayMath'}
          />
        );
      })}
    </span>
  );
};
