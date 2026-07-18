import { z } from "zod";

export const evidenceRefSchema = z.object({
  id: z.string().min(1),
  source: z.enum(["voice_interview", "document", "live_transcript", "post_call_transcript"]),
  label: z.string().min(1),
});

export const serviceScopeSchema = z.object({
  version: z.number().int().positive(),
  instrumentCategory: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().nullable(),
  symptoms: z.array(z.string().min(1)).min(1),
  errorCodes: z.array(z.string().min(1)),
  site: z.string().min(1),
  deadline: z.string().datetime(),
  requiredDeliverables: z.array(z.string().min(1)).min(1),
  calibrationRequired: z.boolean(),
  responseHoursRequired: z.number().positive(),
  constraints: z.array(z.string()),
  approvalAuthority: z.string().min(1),
  evidence: z.array(evidenceRefSchema),
  unknownFields: z.array(z.string()),
  confirmationStatus: z.enum(["draft", "needs_review", "confirmed"]),
  canonicalHash: z.string().regex(/^sha256:[a-f0-9]{64}$/).nullable(),
});

export const callOutcomeSchema = z.object({
  callId: z.string().uuid(),
  conversationId: z.string().min(1),
  scopeHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  providerId: z.string().uuid(),
  provenance: z.enum(["LIVE", "RECORDED_LIVE_RUN", "SIMULATED_FIXTURE"]),
  status: z.enum(["quote", "callback", "declined", "incomplete", "failed"]),
  disclosureHandled: z.boolean(),
  endedAt: z.string().datetime(),
});

export type ServiceScope = z.infer<typeof serviceScopeSchema>;
export type CallOutcome = z.infer<typeof callOutcomeSchema>;
