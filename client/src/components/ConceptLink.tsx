import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { getConceptBySlug } from "../data/concepts";
import { cn } from "../lib/utils";

type Props = {
  slug: string;
  children?: React.ReactNode;
  className?: string;
};

export function ConceptLink({ slug, children, className }: Props) {
  const concept = getConceptBySlug(slug);
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!showTooltip) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowTooltip(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTooltip]);

  if (!concept) {
    return <span className={className}>{children ?? slug}</span>;
  }

  return (
    <span ref={ref} className="relative inline-block">
      <Link
        to={`/learn/concepts/${slug}`}
        className={cn(
          "underline decoration-dotted underline-offset-2 text-purple-600 hover:text-purple-800 transition-colors",
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(false)}
      >
        {children ?? concept.title}
      </Link>
      {showTooltip && (
        <span className="absolute bottom-full left-0 mb-1.5 z-50 w-56 bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl pointer-events-none">
          <span className="flex items-center gap-1.5 mb-1 font-bold text-white">
            <BookOpen className="w-3 h-3 shrink-0" />
            {concept.title}
          </span>
          {concept.summary}
        </span>
      )}
    </span>
  );
}
