import React, { useEffect, useRef } from "react";

// Declare MathJax on window
declare global {
  interface Window {
    MathJax: any;
  }
}

interface LatexProps {
  children: string;
  block?: boolean;
  className?: string;
}

export const Latex: React.FC<LatexProps> = ({
  children,
  block = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let isMounted = true;
    const el = containerRef.current;
    if (!el) return;

    const renderMath = async () => {
      // Wait for MathJax to load if it hasn't yet
      if (!window.MathJax || !window.MathJax.typesetPromise) {
        setTimeout(() => {
          if (isMounted) renderMath();
        }, 200);
        return;
      }

      // Set the content with appropriate delimiters for MathJax
      // Inline: $...$, Block: $$...$$
      const delimiter = block ? "$$" : "$";
      el.innerText = `${delimiter} ${children} ${delimiter}`;
      el.style.visibility = "hidden"; // Hide until rendered to prevent flash of raw latex

      try {
        await window.MathJax.typesetPromise([el]);
        if (isMounted) {
          el.style.visibility = "visible";
        }
      } catch (e) {
        console.warn("MathJax render error:", e);
        if (isMounted) {
          el.innerText = children; // Fallback
          el.style.visibility = "visible";
        }
      }
    };

    renderMath();

    return () => {
      isMounted = false;
    };
  }, [children, block]);

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ display: block ? "block" : "inline-block" }}
    />
  );
};
