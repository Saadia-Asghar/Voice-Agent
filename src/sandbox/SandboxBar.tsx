import { Check, Copy, ExternalLink, RotateCcw } from "lucide-react";
import { useState } from "react";
import { mainAppLink } from "./config";

const sandboxUrl = () => window.location.href.split("#")[0];

const steps = [
  { id: "call", label: "Caller — preview fixtures or start live" },
  { id: "closer", label: "Closer — move downtime slider" },
  { id: "award", label: "Award — acknowledge recommendation" },
] as const;

export type SandboxStep = (typeof steps)[number]["id"] | "welcome";

export function SandboxBar({
  active,
  onReset,
  onJump,
}: {
  active: SandboxStep;
  onReset: () => void;
  onJump: (step: "Call room" | "Deal room" | "Award memo") => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(sandboxUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy sandbox link:", sandboxUrl());
    }
  };

  const stepIndex = active === "welcome" ? -1 : steps.findIndex((step) => step.id === active);

  return (
    <aside className="sandbox-bar" aria-label="Sandbox demo guide">
      <div className="sandbox-bar-head">
        <div>
          <span className="sandbox-badge">Sandbox only</span>
          <strong>SpinPro X2 · Error E17</strong>
          <p>Not the production app — fixtures labeled, reset anytime.</p>
        </div>
        <a className="sandbox-icon-btn" href={mainAppLink()} title="Open full BenchDial app"><ExternalLink size={16} /></a>
      </div>
      <ol className="sandbox-steps">
        {steps.map((step, index) => {
          const done = stepIndex > index;
          const current = stepIndex === index;
          return (
            <li key={step.id} className={done ? "done" : current ? "current" : ""}>
              <span>{done ? <Check size={12} /> : index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                {current && step.id === "call" && <button type="button" onClick={() => onJump("Call room")}>Go to Caller</button>}
                {current && step.id === "closer" && <button type="button" onClick={() => onJump("Deal room")}>Go to Closer</button>}
                {current && step.id === "award" && <button type="button" onClick={() => onJump("Award memo")}>Go to Award</button>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="sandbox-actions">
        <button type="button" className="sandbox-secondary" onClick={() => void copyLink()}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
        </button>
        <button type="button" className="sandbox-secondary" onClick={onReset}><RotateCcw size={14} /> Reset case</button>
      </div>
    </aside>
  );
}
