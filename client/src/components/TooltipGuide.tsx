import { useEffect, useMemo, useRef, useState } from "react";
import { getStepByNumber, OnboardingStep } from "../onboarding/content";

type Props = {
  isOpen: boolean;
  activeStepNumber: number;
  steps: OnboardingStep[];
  onClose: () => void;
  onComplete: () => void;
  onGoToStep: (stepNumber: number) => void;
};

type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

const TOOLTIP_WIDTH = 320;
const TOOLTIP_ESTIMATED_HEIGHT = 200;
const PANEL_MIN_WIDTH = 220;
const PANEL_MIN_HEIGHT = 170;
const PANEL_MAX_WIDTH = 560;
const PANEL_MAX_HEIGHT = 620;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const TooltipGuide = ({ isOpen, activeStepNumber, steps, onClose, onComplete, onGoToStep }: Props) => {
  const [anchorRect, setAnchorRect] = useState<AnchorRect>(null);
  const [panelMode, setPanelMode] = useState<"open" | "minimized" | "closed">("open");
  const [panelPosition, setPanelPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { left: 16, top: 96 };
    }

    return {
      left: Math.max(16, window.innerWidth - TOOLTIP_WIDTH - 16),
      top: 96,
    };
  });
  const [panelSize, setPanelSize] = useState({ width: 320, height: 300 });
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const autoScrolledStepRef = useRef<number | null>(null);

  const activeIndex = useMemo(() => steps.findIndex((step) => step.number === activeStepNumber), [activeStepNumber, steps]);
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;
  const isMinimized = panelMode === "minimized";

  useEffect(() => {
    if (isOpen) {
      setPanelMode("open");

      const viewportWidth = window.innerWidth;
      const defaultLeft = Math.max(16, viewportWidth - panelSize.width - 16);
      setPanelPosition((prev) => ({
        left: clamp(prev.left, 16, Math.max(16, viewportWidth - panelSize.width - 16)),
        top: prev.top || 88,
      }));

      if (!Number.isFinite(panelPosition.left)) {
        setPanelPosition({ left: defaultLeft, top: 88 });
      }
    } else {
      autoScrolledStepRef.current = null;
    }
  }, [isOpen, panelPosition.left, panelSize.width]);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      if (dragRef.current) {
        const nextLeft = clamp(event.clientX - dragRef.current.offsetX, 8, window.innerWidth - 80);
        const nextTop = clamp(event.clientY - dragRef.current.offsetY, 8, window.innerHeight - 60);
        setPanelPosition({ left: nextLeft, top: nextTop });
      }

      if (resizeRef.current) {
        const deltaX = event.clientX - resizeRef.current.startX;
        const deltaY = event.clientY - resizeRef.current.startY;
        const nextWidth = clamp(resizeRef.current.startWidth + deltaX, PANEL_MIN_WIDTH, Math.min(PANEL_MAX_WIDTH, window.innerWidth - 32));
        const nextHeight = clamp(resizeRef.current.startHeight + deltaY, PANEL_MIN_HEIGHT, Math.min(PANEL_MAX_HEIGHT, window.innerHeight - 32));
        setPanelSize({ width: nextWidth, height: nextHeight });
      }
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const keepPanelInViewport = () => {
      setPanelPosition((previous) => ({
        left: clamp(previous.left, 8, Math.max(8, window.innerWidth - panelSize.width - 8)),
        top: clamp(previous.top, 8, Math.max(8, window.innerHeight - 56)),
      }));
    };

    keepPanelInViewport();
    window.addEventListener("resize", keepPanelInViewport);

    return () => {
      window.removeEventListener("resize", keepPanelInViewport);
    };
  }, [panelSize.width]);

  useEffect(() => {
    if (!isOpen || !activeStep) {
      setAnchorRect(null);
      return;
    }

    const updatePosition = () => {
      const targetElement = document.querySelector(activeStep.target);
      if (!targetElement) {
        setAnchorRect(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();

      if (autoScrolledStepRef.current !== activeStep.number) {
        const isOffscreen = rect.top < 72 || rect.bottom > window.innerHeight - 24;
        if (isOffscreen) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
        autoScrolledStepRef.current = activeStep.number;
      }

      setAnchorRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activeStep, isOpen]);

  const isLastStep = activeIndex === steps.length - 1;
  const isFirstStep = activeIndex <= 0;

  const tooltipPosition = useMemo(() => {
    if (!anchorRect) {
      return {
        top: 16,
        left: 16,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxLeft = Math.max(16, viewportWidth - TOOLTIP_WIDTH - 16);

    let left = Math.min(maxLeft, Math.max(16, anchorRect.left));
    let top = anchorRect.top + anchorRect.height + 12;

    if (top + TOOLTIP_ESTIMATED_HEIGHT > viewportHeight - 16) {
      top = Math.max(16, anchorRect.top - TOOLTIP_ESTIMATED_HEIGHT - 12);
    }

    if (anchorRect.width > TOOLTIP_WIDTH) {
      left = Math.min(maxLeft, Math.max(16, anchorRect.left + 12));
    }

    return { top, left };
  }, [anchorRect]);

  if (!isOpen || steps.length === 0 || !activeStep) {
    return (
      <button
        type="button"
        onClick={() => onGoToStep(1)}
        style={{
          position: "fixed",
          right: "16px",
          bottom: "20px",
          zIndex: 1200,
          border: "1px solid #2d6a4f",
          borderRadius: "999px",
          background: "#2d6a4f",
          color: "#fff",
          padding: "10px 14px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Open Tips
      </button>
    );
  }

  const goPrevious = () => {
    if (isFirstStep) {
      return;
    }

    const next = steps[activeIndex - 1];
    onGoToStep(next.number);
  };

  const goNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }

    const next = steps[activeIndex + 1];
    onGoToStep(next.number);
  };

  const goToFirstStep = () => {
    const firstStep = getStepByNumber(1);
    if (firstStep) {
      onGoToStep(firstStep.number);
    }
  };

  const startDragPanel = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    dragRef.current = {
      offsetX: event.clientX - panelPosition.left,
      offsetY: event.clientY - panelPosition.top,
    };
  };

  const startResizePanel = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.button !== 0) {
      return;
    }

    resizeRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: panelSize.width,
      startHeight: panelSize.height,
    };
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, pointerEvents: "none" }}>
      {anchorRect && (
        <div
          style={{
            position: "fixed",
            top: anchorRect.top - 4,
            left: anchorRect.left - 4,
            width: anchorRect.width + 8,
            height: anchorRect.height + 8,
            borderRadius: "8px",
            border: "2px solid #2d6a4f",
            boxShadow: "0 0 0 4px rgba(45, 106, 79, 0.15)",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        role="dialog"
        aria-live="polite"
        style={{
          position: "fixed",
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          width: `min(${TOOLTIP_WIDTH}px, calc(100vw - 32px))`,
          backgroundColor: "#fff",
          border: "1px solid #d9dfd6",
          borderRadius: "12px",
          boxShadow: "0 14px 28px rgba(0, 0, 0, 0.16)",
          padding: "14px",
          pointerEvents: "auto",
        }}
      >
        <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#6f7a70" }}>
          Tooltip #{activeStep.number} of {steps.length}
        </p>
        <h3 style={{ margin: "4px 0 6px", fontSize: "16px", color: "#244735" }}>{activeStep.title}</h3>
        <p style={{ margin: 0, color: "#444", fontSize: "14px", lineHeight: 1.45 }}>{activeStep.body}</p>
      </div>

      {panelMode === "closed" ? (
        <button
          type="button"
          onClick={() => setPanelMode("open")}
          style={{
            position: "fixed",
            right: "16px",
            bottom: "20px",
            zIndex: 1200,
            border: "1px solid #2d6a4f",
            borderRadius: "999px",
            background: "#2d6a4f",
            color: "#fff",
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
            pointerEvents: "auto",
          }}
        >
          Open tips
        </button>
      ) : (
        <aside
          style={{
            position: "fixed",
            left: `${panelPosition.left}px`,
            top: `${panelPosition.top}px`,
            width: panelMode === "minimized" ? "132px" : `${panelSize.width}px`,
            height: panelMode === "minimized" ? "auto" : `${panelSize.height}px`,
            border: "1px solid #d9dfd6",
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0 16px 30px rgba(0, 0, 0, 0.16)",
            padding: panelMode === "minimized" ? "8px" : "12px",
            zIndex: 1200,
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            onMouseDown={startDragPanel}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", cursor: "move", userSelect: "none" }}
          >
            <strong style={{ color: "#244735", fontSize: panelMode === "minimized" ? "12px" : "14px" }}>#{activeStep.number}</strong>
            <div style={{ display: "flex", gap: "6px" }}>
              <button type="button" onClick={() => setPanelMode(panelMode === "minimized" ? "open" : "minimized")} style={{ border: "1px solid #ccd4cc", borderRadius: "8px", background: "#fff", padding: isMinimized ? "2px 6px" : "4px 8px", fontSize: isMinimized ? "11px" : "13px", cursor: "pointer" }}>
                {panelMode === "minimized" ? "Expand" : "Min"}
              </button>
              <button type="button" onClick={onClose} style={{ border: "1px solid #ccd4cc", borderRadius: "8px", background: "#fff", padding: isMinimized ? "2px 6px" : "4px 8px", fontSize: isMinimized ? "11px" : "13px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>

          {panelMode === "open" && (
            <>
              <div style={{ overflow: "auto", marginTop: "10px", flex: 1 }}>
                <h4 style={{ margin: "0 0 8px", color: "#244735", fontSize: "16px" }}>{activeStep.title}</h4>
                <p style={{ margin: 0, color: "#444", fontSize: "14px", lineHeight: 1.45 }}>{activeStep.body}</p>
              </div>
            </>
          )}

          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", gap: "8px" }}>
            <button
              type="button"
              onClick={goPrevious}
              disabled={isFirstStep}
              style={{ border: "1px solid #cfd7ce", borderRadius: "8px", background: "#fff", color: isFirstStep ? "#a8b0a8" : "#4f5a52", padding: isMinimized ? "5px 8px" : "8px 10px", fontSize: isMinimized ? "12px" : "14px", fontWeight: 700, cursor: isFirstStep ? "default" : "pointer" }}
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              style={{ border: "1px solid #2d6a4f", borderRadius: "8px", background: "#2d6a4f", color: "#fff", padding: isMinimized ? "5px 8px" : "8px 10px", fontSize: isMinimized ? "12px" : "14px", fontWeight: 700, cursor: "pointer" }}
            >
              {isLastStep ? "Finish" : "→"}
            </button>
          </div>

          {!isMinimized && (
            <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
              <button type="button" onClick={goToFirstStep} style={{ border: "1px solid #cfd7ce", borderRadius: "8px", background: "#fff", color: "#4f5a52", padding: "7px 10px", fontWeight: 600, cursor: "pointer" }}>
                First
              </button>
              <button type="button" onClick={onClose} style={{ border: "1px solid #cfd7ce", borderRadius: "8px", background: "#fff", color: "#4f5a52", padding: "7px 10px", fontWeight: 600, cursor: "pointer" }}>
                Dismiss
              </button>
              <button type="button" onClick={onComplete} style={{ border: "1px solid #2d6a4f", borderRadius: "8px", background: "#2d6a4f", color: "#fff", padding: "7px 10px", fontWeight: 600, cursor: "pointer" }}>
                Skip all
              </button>
            </div>
          )}

          {panelMode === "open" && (
            <div
              onMouseDown={startResizePanel}
              role="presentation"
              style={{
                position: "absolute",
                right: "6px",
                bottom: "6px",
                width: "16px",
                height: "16px",
                cursor: "nwse-resize",
                background:
                  "linear-gradient(135deg, transparent 0 45%, #9aa79f 45% 55%, transparent 55% 100%)",
              }}
            />
          )}
        </aside>
      )}
    </div>
  );
};

export default TooltipGuide;
