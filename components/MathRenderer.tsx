import React, { useEffect, useRef } from 'react';

// Declare MathJax on window for TypeScript
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        promise?: Promise<void>;
      };
    };
  }
}

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Converts basic markdown-like syntax to HTML for rendering in chat bubbles.
 * Handles: bold, headers, bullet points, line breaks.
 * LaTeX delimiters \(...\) and \[...\] are preserved for MathJax.
 */
function formatTextToHtml(text: string): string {
  if (!text) return '';

  // Split by lines
  const lines = text.split('\n');
  const htmlLines: string[] = [];

  for (const line of lines) {
    let processed = line;

    // Headers: ## text → <strong>text</strong>
    processed = processed.replace(/^###\s+(.+)$/, '<strong style="font-size:1em;">$1</strong>');
    processed = processed.replace(/^##\s+(.+)$/, '<strong style="font-size:1.05em;">$1</strong>');

    // Bold: **text** → <strong>text</strong>
    processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Bullet points: - text → styled bullet
    processed = processed.replace(/^[-•]\s+(.+)$/, '<span style="display:flex;gap:6px;align-items:baseline;"><span style="color:#6366f1;">•</span><span>$1</span></span>');

    htmlLines.push(processed);
  }

  // Join with <br> for line breaks
  return htmlLines.join('<br/>');
}

const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set the formatted HTML content
    containerRef.current.innerHTML = formatTextToHtml(text);

    // Trigger MathJax to typeset the new content
    const typeset = () => {
      if (window.MathJax?.typesetPromise) {
        window.MathJax.typesetPromise([containerRef.current!]).catch((err: any) => {
          console.warn('MathJax typeset error:', err);
        });
      }
    };

    // MathJax may not be loaded yet (async script), so wait for it
    if (window.MathJax?.typesetPromise) {
      typeset();
    } else {
      // Poll until MathJax is ready (max ~5 seconds)
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.MathJax?.typesetPromise) {
          clearInterval(interval);
          typeset();
        }
        if (attempts > 50) {
          clearInterval(interval);
        }
      }, 100);
    }
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`math-renderer ${className}`}
      style={{ lineHeight: 1.7, wordBreak: 'break-word' }}
    />
  );
};

export default MathRenderer;