import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ExternalLink, ChevronRight } from "lucide-react";
import { getConceptBySlug, getRelatedConcepts } from "../../data/concepts";
import { cn } from "../../lib/utils";

export default function ConceptPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const concept = slug ? getConceptBySlug(slug) : undefined;
  const related = slug ? getRelatedConcepts(slug) : [];

  if (!concept) {
    return (
      <div className="app-page">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Concept not found</p>
          <p className="text-xs text-gray-400 mb-4">This topic doesn't exist yet.</p>
          <Link to="/learn" className="text-sm font-semibold text-purple-600 hover:underline">
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="max-w-2xl mx-auto pb-12">
        {/* Back nav */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-50 rounded-md">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Financial concept</p>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{concept.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">{concept.summary}</p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6 mb-10">
          {concept.sections.map((section, i) => (
            <motion.div
              key={section.heading}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <h2 className="text-sm font-bold text-gray-900 mb-2">{section.heading}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
            </motion.div>
          ))}
        </div>

        {/* See in app CTA */}
        {concept.seeInApp && (
          <div className="mb-8 p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-900 mb-0.5">See this in your data</p>
              <p className="text-xs text-purple-700">{concept.seeInApp.label}</p>
            </div>
            <Link
              to={concept.seeInApp.path}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors shrink-0"
            >
              Go <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Related concepts */}
        {related.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Related concepts</p>
            <div className="space-y-2">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/learn/concepts/${rel.slug}`}
                  className={cn(
                    "flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-purple-300 hover:shadow-sm transition-all group"
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                      {rel.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{rel.summary}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 shrink-0 ml-3 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All concepts link */}
        <div className="mt-8 text-center">
          <Link to="/learn" className="text-xs font-semibold text-gray-400 hover:text-purple-600 transition-colors">
            Browse all topics in Learn →
          </Link>
        </div>
      </div>
    </div>
  );
}
