import { useLayoutEffect, useRef, useState } from "react";
import { t } from "./lib/i18n";
import { TOUR_STEPS, type TourStep } from "./lib/tour";

type Rect = { top: number; left: number; width: number; height: number };

function readTarget(target: string | null): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!(el instanceof HTMLElement)) return null;
  const box = el.getBoundingClientRect();
  if (box.width < 2 && box.height < 2) return null;
  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

export function TourOverlay({
  stepIndex,
  step,
  onPrev,
  onNext,
  onSkip,
}: {
  stepIndex: number;
  step: TourStep;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const s = t();
  const copy = s.tourSteps[step.id as keyof typeof s.tourSteps];
  const cardRef = useRef<HTMLElement>(null);
  const [spot, setSpot] = useState<Rect | null>(null);
  const [card, setCard] = useState({ top: 80, left: 24, width: 420 });

  useLayoutEffect(() => {
    const update = () => {
      const next = readTarget(step.target);
      setSpot(next);
      const cardBox = cardRef.current?.getBoundingClientRect();
      const width = cardBox?.width || 420;
      const height = cardBox?.height || 220;
      const gap = 14;
      let top = (window.innerHeight - height) / 2;
      let left = (window.innerWidth - width) / 2;
      if (next && step.placement !== "center") {
        if (step.placement === "bottom") top = next.top + next.height + gap;
        if (step.placement === "top") top = next.top - height - gap;
        if (step.placement === "right") {
          left = next.left + next.width + gap;
          top = next.top;
        }
        if (step.placement === "left") {
          left = next.left - width - gap;
          top = next.top;
        }
        if (step.placement === "bottom" || step.placement === "top") {
          left = next.left + next.width / 2 - width / 2;
        }
      }
      left = Math.max(16, Math.min(left, window.innerWidth - width - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - height - 16));
      setCard({ top, left, width });
    };
    const frame = requestAnimationFrame(() => requestAnimationFrame(update));
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [step, stepIndex]);

  const last = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {spot && (
        <div
          className="tour-spot"
          style={{
            top: spot.top - 6,
            left: spot.left - 6,
            width: spot.width + 12,
            height: spot.height + 12,
          }}
        />
      )}
      <section
        ref={cardRef}
        className="tour-card"
        style={{ top: card.top, left: card.left }}
      >
        <p className="tour-count">
          {s.tourProgress(stepIndex + 1, TOUR_STEPS.length)}
        </p>
        <h2 id="tour-title">{copy?.title ?? step.id}</h2>
        <p>{copy?.body}</p>
        <div className="sheet-actions">
          <button type="button" className="ghost" onClick={onSkip}>
            {s.tourSkip}
          </button>
          {stepIndex > 0 && (
            <button type="button" className="ghost" onClick={onPrev}>
              {s.tourBack}
            </button>
          )}
          <button type="button" onClick={onNext}>
            {last ? s.tourDone : s.tourNext}
          </button>
        </div>
      </section>
    </div>
  );
}
