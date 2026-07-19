export type CallStatus = "quote" | "callback" | "declined" | "incomplete";

export type Evidence = {
  id: string;
  at: string;
  quote: string;
};

export type MoneyComponent = {
  amount: number | null;
  inclusion: "included" | "additional" | "excluded" | "unknown";
};

export type ServiceQuote = {
  provider: string;
  providerType: string;
  status: CallStatus;
  packageTotal: number | null;
  callout: MoneyComponent;
  calibration: MoneyComponent;
  parts: MoneyComponent;
  responseHours: number | null;
  turnaroundHours: number | null;
  warrantyDays: number | null;
  loanerIncluded: boolean | null;
  scopeMatch: number;
  unknowns: string[];
  evidence: Evidence[];
};

export type CostScenario = {
  downtimeCostPerHour: number;
  requiredExcludedServices: Record<string, number>;
};

export const knownCashTotal = (quote: ServiceQuote): number | null => {
  if (quote.packageTotal === null) return null;
  const components = [quote.callout, quote.calibration, quote.parts];
  if (components.some((component) => component.inclusion === "unknown")) return null;
  const additional = components.filter((component) => component.inclusion === "additional");
  if (additional.some((component) => component.amount === null)) return null;
  return quote.packageTotal + additional.reduce((total, component) => total + (component.amount ?? 0), 0);
};

export const effectiveCost = (
  quote: ServiceQuote,
  scenario: CostScenario,
): number | null => {
  const cash = knownCashTotal(quote);
  if (cash === null || quote.turnaroundHours === null) return null;
  const exclusions = quote.unknowns.reduce(
    (total, unknown) => total + (scenario.requiredExcludedServices[unknown] ?? 0),
    0,
  );
  return cash + quote.turnaroundHours * scenario.downtimeCostPerHour + exclusions;
};

export const rankQuotes = (quotes: ServiceQuote[], scenario: CostScenario) =>
  quotes
    .map((quote) => ({ quote, effective: effectiveCost(quote, scenario) }))
    .sort((a, b) => {
      if (a.effective === null && b.effective === null) return 0;
      if (a.effective === null) return 1;
      if (b.effective === null) return -1;
      return a.effective - b.effective;
    });

export const isSuspiciouslyLowQuote = (
  candidate: ServiceQuote,
  peers: ServiceQuote[],
  threshold = 0.3,
) => {
  const candidateTotal = knownCashTotal(candidate);
  const peerTotals = peers
    .filter((peer) => peer.provider !== candidate.provider)
    .map(knownCashTotal)
    .filter((total): total is number => total !== null)
    .sort((a, b) => a - b);
  if (candidateTotal === null || peerTotals.length < 1 || threshold <= 0 || threshold >= 1) return false;
  const middle = Math.floor(peerTotals.length / 2);
  const median = peerTotals.length % 2 ? peerTotals[middle] : (peerTotals[middle - 1] + peerTotals[middle]) / 2;
  return candidateTotal <= median * (1 - threshold);
};

export const currency = (value: number | null) =>
  value === null
    ? "Unknown"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
