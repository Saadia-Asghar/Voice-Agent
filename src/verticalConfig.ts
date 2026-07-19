export type VerticalConfig = {
  id: string;
  label: string;
  buyerPersona: string;
  supportedDocumentTypes: readonly string[];
  requiredScopeFields: readonly string[];
  comparableQuoteFields: readonly string[];
  negotiationLevers: readonly string[];
  suspiciousLowQuoteThreshold: number;
  discoverySources: readonly string[];
};

export const labEquipmentRepair: VerticalConfig = {
  id: "lab-equipment-repair",
  label: "Laboratory equipment repair",
  buyerPersona: "Laboratory operations lead",
  supportedDocumentTypes: ["Service report", "Prior quote", "PDF work order"],
  requiredScopeFields: ["instrument category", "manufacturer", "model", "symptoms", "site", "service deadline", "required deliverables", "calibration requirement", "required response time", "access constraints", "approval authority"],
  comparableQuoteFields: ["package total", "diagnostic/callout fee", "labor", "parts", "travel", "calibration", "response time", "turnaround", "warranty", "loaner", "taxes", "exclusions", "expiration"],
  negotiationLevers: ["price", "response", "warranty", "calibration", "loaner", "fee treatment"],
  suspiciousLowQuoteThreshold: 0.3,
  discoverySources: ["Google Places", "Yelp", "OpenStreetMap", "customer-approved provider list"],
};
