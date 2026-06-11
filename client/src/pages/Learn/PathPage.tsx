import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Circle, ChevronDown, ExternalLink, BookOpen, Lock } from "lucide-react";
import { getPathBySlug, getCompletedModules, markModuleComplete } from "../../data/learningPaths";
import { ConceptLink } from "../../components/ConceptLink";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

export default function PathPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const userId = currentUser?.uid ?? "anon";

  const path = slug ? getPathBySlug(slug) : undefined;
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | undefined>();

  useEffect(() => {
    currentUser
      ?.getIdToken()
      .then(setAuthToken)
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (!slug) return;
    setCompleted(getCompletedModules(userId, slug));
  }, [userId, slug]);

  useEffect(() => {
    // auto-open first uncompleted module on load
    if (!path) return;
    const firstUncompleted = path.modules.find((m) => !completed.has(m.id));
    if (firstUncompleted && !openModuleId) setOpenModuleId(firstUncompleted.id);
  }, [path, completed, openModuleId]);

  if (!path) {
    return (
      <div className="app-page">
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-sm font-semibold text-gray-700 mb-3">Path not found</p>
          <Link to="/learn" className="text-sm font-semibold text-purple-600 hover:underline">
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = path.modules.filter((m) => completed.has(m.id)).length;
  const progressPct = (completedCount / path.modules.length) * 100;
  const allDone = completedCount === path.modules.length;

  const handleMarkComplete = (moduleId: string) => {
    if (!slug) return;
    const next = markModuleComplete(userId, slug, moduleId, authToken);
    setCompleted(new Set(next));
    // open the next module
    const currentIndex = path.modules.findIndex((m) => m.id === moduleId);
    const nextModule = path.modules[currentIndex + 1];
    if (nextModule) {
      setTimeout(() => setOpenModuleId(nextModule.id), 300);
    } else {
      setOpenModuleId(null);
    }
  };

  return (
    <div className="app-page">
      <div className="max-w-2xl mx-auto pb-12">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-3 border",
              path.color,
              path.borderColor,
              path.textColor
            )}
          >
            <span>{path.emoji}</span>
            {path.subtitle}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{path.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-4">{path.description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-500 shrink-0">
              {completedCount}/{path.modules.length} done
            </span>
          </div>
        </motion.div>

        {/* Completion banner */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Path complete!</p>
                <p className="text-xs text-emerald-600 mt-0.5">You've worked through every module in this path.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modules */}
        <div className="space-y-3">
          {path.modules.map((module, index) => {
            const isDone = completed.has(module.id);
            const isOpen = openModuleId === module.id;
            const isLocked = index > 0 && !completed.has(path.modules[index - 1].id);

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className={cn(
                  "bg-white rounded-xl border overflow-hidden transition-all",
                  isDone ? "border-emerald-200" : isOpen ? "border-purple-300 shadow-sm" : "border-gray-200"
                )}
              >
                {/* Module header */}
                <button
                  type="button"
                  onClick={() => {
                    if (isLocked) return;
                    setOpenModuleId(isOpen ? null : module.id);
                  }}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors",
                    !isLocked && "hover:bg-gray-50",
                    isLocked && "cursor-not-allowed opacity-60"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-gray-300" />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Module {index + 1}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          Done
                        </span>
                      )}
                    </div>
                    <p className={cn("text-sm font-bold mt-0.5", isDone ? "text-gray-500" : "text-gray-900")}>
                      {module.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{module.summary}</p>
                  </div>
                  {!isLocked && (
                    <ChevronDown
                      className={cn("w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform", isOpen && "rotate-180")}
                    />
                  )}
                </button>

                {/* Module content */}
                <AnimatePresence>
                  {isOpen && !isLocked && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                        {/* Content paragraphs */}
                        <div className="space-y-3 mb-5">
                          {module.content.map((para, i) => (
                            <p key={i} className="text-sm text-gray-600 leading-relaxed">
                              {para}
                            </p>
                          ))}
                        </div>

                        {/* Related concepts */}
                        {module.conceptSlugs && module.conceptSlugs.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-[11px] text-gray-400 font-semibold self-center">Deep dive:</span>
                            {module.conceptSlugs.map((slug) => (
                              <ConceptLink key={slug} slug={slug} className="text-[11px]" />
                            ))}
                          </div>
                        )}

                        {/* Action item */}
                        <div className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-3 mb-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <BookOpen className="w-3 h-3 text-purple-600 shrink-0" />
                            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Action</p>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{module.actionItem}</p>
                          {module.actionPath && (
                            <Link
                              to={module.actionPath}
                              className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-purple-600 hover:text-purple-700"
                            >
                              Go <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        {/* Mark complete */}
                        {!isDone ? (
                          <button
                            type="button"
                            onClick={() => handleMarkComplete(module.id)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark as done
                          </button>
                        ) : (
                          <p className="text-center text-xs text-emerald-600 font-semibold py-1">Completed</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Back to learn */}
        <div className="mt-8 text-center">
          <Link to="/learn" className="text-xs font-semibold text-gray-400 hover:text-purple-600 transition-colors">
            ← All learning paths and topics
          </Link>
        </div>
      </div>
    </div>
  );
}
