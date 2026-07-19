/**
 * Configure BenchDial intake client tools on ElevenLabs.
 * Usage:
 *   $env:ELEVENLABS_API_KEY="sk_..."
 *   node scripts/configure-intake-tools.mjs
 */
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_INTAKE_AGENT_ID || "agent_2701kxwe3ws0e2ns6wf6ks7rgwe7";
if (!API_KEY) {
  console.error("Set ELEVENLABS_API_KEY first.");
  process.exit(1);
}

const scopeProps = {
  type: "object",
  description: "ScopePrint draft fields for the BenchDial Estimator form",
  properties: {
    instrumentCategory: { type: "string", description: "Instrument category, e.g. Centrifuge" },
    manufacturer: { type: "string", description: "Manufacturer name" },
    model: { type: "string", description: "Model name" },
    serialNumber: { type: "string", description: "Serial number if known" },
    symptoms: { type: "string", description: "Failure symptoms" },
    errorCodes: { type: "string", description: "Comma-separated error codes" },
    site: { type: "string", description: "Site / location" },
    deadline: { type: "string", description: "YYYY-MM-DD" },
    calibrationRequired: { type: "boolean", description: "Calibration required" },
    responseHoursRequired: { type: "number", description: "Response hours" },
    deliverables: { type: "string", description: "Deliverables" },
    constraints: { type: "string", description: "Constraints" },
    approvalAuthority: { type: "string", description: "Approval authority" },
  },
};

async function createTool(name, description, expects_response, required = []) {
  const res = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      tool_config: {
        type: "client",
        name,
        description,
        expects_response,
        parameters: { ...scopeProps, required },
      },
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${name}: ${JSON.stringify(body)}`);
  return body.id || body.tool_id;
}

const updateId = await createTool(
  "update_scope_draft",
  "Update Estimator ScopePrint draft fields during the interview. Pass any subset of known fields.",
  false,
  [],
);
const submitId = await createTool(
  "submit_confirmed_scope",
  "After the user confirms the full readback, submit the complete scope into the Estimator draft. Never invent a hash.",
  true,
  ["instrumentCategory","manufacturer","model","symptoms","site","deadline","calibrationRequired","responseHoursRequired","deliverables","approvalAuthority"],
);

const agentRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
  headers: { "xi-api-key": API_KEY },
});
const agent = await agentRes.json();
if (!agentRes.ok) throw new Error(`agent get: ${JSON.stringify(agent)}`);
const existing = agent?.conversation_config?.agent?.prompt?.tool_ids || [];
const merged = [...new Set([...existing, updateId, submitId])];
const patchRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
  method: "PATCH",
  headers: { "xi-api-key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    conversation_config: { agent: { prompt: { tool_ids: merged } } },
    version_description: "Add Estimator client tools update_scope_draft + submit_confirmed_scope",
  }),
});
const patched = await patchRes.json();
if (!patchRes.ok) throw new Error(`agent patch: ${JSON.stringify(patched)}`);
console.log(JSON.stringify({ ok: true, AGENT_ID, updateId, submitId, tool_ids: merged }, null, 2));
