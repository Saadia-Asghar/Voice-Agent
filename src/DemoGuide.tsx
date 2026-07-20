import { Check, ChevronRight, Circle, Sparkles } from "lucide-react";

type StepId = "Call room" | "Deal room" | "Award memo";

const checklist: { id: StepId; short: string; doNow: string; skip?: string }[] = [
  {
    id: "Call room",
    short: "Call vendors",
    doNow: "Click the blue Compare quotes → button (top bar or big button below). You do NOT need to start a call first — sample quotes are already filled in.",
    skip: "Optional: click Preview sample call on any vendor row to hear a demo transcript.",
  },
  {
    id: "Deal room",
    short: "Compare quotes",
    doNow: "Drag the downtime slider ($/hour). Watch the ranking change. Then click Open Award memo → in the top bar or the big button on the right.",
  },
  {
    id: "Award memo",
    short: "Award memo",
    doNow: "Check I've read the recommendation, click Approve, then read What to do next. You are done.",
  },
];

export function DemoGuide({
  active,
  onNext,
  done,
}: {
  active: StepId;
  onNext?: () => void;
  done?: boolean;
}) {
  const currentIndex = checklist.findIndex((item) => item.id === active);
  const current = checklist[currentIndex];

  return (
    <aside className="demo-guide" role="navigation" aria-label="Demo walkthrough — what to click next">
      <div className="demo-guide-head">
        <Sparkles size={16} />
        <div>
          <strong>Your 3-minute demo script</strong>
          <small>Follow these clicks — no login needed. Case: SpinPro X2 · Error E17.</small>
        </div>
      </div>

      <ol className="demo-guide-steps">
        <li className="demo-guide-step done">
          <span className="demo-guide-icon"><Check size={14} /></span>
          <div>
            <strong>Repair brief loaded</strong>
            <p>SpinPro X2 centrifuge · City Labs · Brief BD-7F3A-1042</p>
          </div>
        </li>
        {checklist.map((item, index) => {
          const state = done ? "done" : index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
          return (
            <li key={item.id} className={`demo-guide-step ${state}`}>
              <span className="demo-guide-icon">
                {state === "done" ? <Check size={14} /> : state === "current" ? <ChevronRight size={14} /> : <Circle size={12} />}
              </span>
              <div>
                <strong>
                  Step {index + 2} · {item.short}
                  {state === "current" && <em> — you are here</em>}
                </strong>
                {state === "current" && <p className="demo-guide-action">{item.doNow}</p>}
                {state === "current" && item.skip && <p className="demo-guide-skip">{item.skip}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {done ? (
        <p className="demo-guide-done">Demo complete. You can export the memo or go back to Home.</p>
      ) : current && onNext ? (
        <button type="button" className="demo-guide-next" onClick={onNext}>
          {active === "Call room" ? "Compare quotes →" : active === "Deal room" ? "Open Award memo →" : "Next"}
          <ChevronRight size={14} />
        </button>
      ) : null}
    </aside>
  );
}
