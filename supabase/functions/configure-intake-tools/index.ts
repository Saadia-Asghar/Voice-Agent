const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-benchdial-admin",
};

type JsonSchema = {
  type: "object";
  description?: string;
  required?: string[];
  properties: Record<string, {
    type: string;
    description: string;
  }>;
};

function scopeParams(requiredAll: boolean): JsonSchema {
  const properties: JsonSchema["properties"] = {
    instrumentCategory: { type: "string", description: "Instrument category, e.g. Centrifuge" },
    manufacturer: { type: "string", description: "Manufacturer name" },
    model: { type: "string", description: "Model name" },
    serialNumber: { type: "string", description: "Serial number if known, else empty" },
    symptoms: { type: "string", description: "Failure symptoms as spoken/confirmed" },
    errorCodes: { type: "string", description: "Comma-separated error codes if any" },
    site: { type: "string", description: "Site / location for service" },
    deadline: { type: "string", description: "Service deadline as YYYY-MM-DD" },
    calibrationRequired: { type: "boolean", description: "Whether calibration is required" },
    responseHoursRequired: { type: "number", description: "Required response time in hours" },
    deliverables: { type: "string", description: "Required deliverables" },
    constraints: { type: "string", description: "Access or site constraints" },
    approvalAuthority: { type: "string", description: "Human approval authority name/title" },
  };
  return {
    type: "object",
    description: "ScopePrint draft fields for the BenchDial Estimator form",
    required: requiredAll
      ? [
        "instrumentCategory",
        "manufacturer",
        "model",
        "symptoms",
        "site",
        "deadline",
        "calibrationRequired",
        "responseHoursRequired",
        "deliverables",
        "approvalAuthority",
      ]
      : [],
    properties,
  };
}

async function createClientTool(
  apiKey: string,
  name: string,
  description: string,
  expectsResponse: boolean,
  parameters: JsonSchema,
) {
  const response = await fetch("https://api.elevenlabs.io/v1/convai/tools", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tool_config: {
        type: "client",
        name,
        description,
        expects_response: expectsResponse,
        parameters,
      },
    }),
  });
  const text = await response.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    return { ok: false as const, status: response.status, body };
  }
  const toolId = (typeof body.id === "string" ? body.id : undefined)
    ?? (typeof body.tool_id === "string" ? body.tool_id : undefined);
  return { ok: true as const, toolId, body };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json({ error: "POST only." }, { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  const intakeAgentId = Deno.env.get("ELEVENLABS_INTAKE_AGENT_ID")
    ?? Deno.env.get("VITE_ELEVENLABS_INTAKE_AGENT_ID");
  if (!apiKey || !intakeAgentId) {
    return Response.json({
      error: "Missing ELEVENLABS_API_KEY or ELEVENLABS_INTAKE_AGENT_ID secret.",
      hasApiKey: Boolean(apiKey),
      hasIntakeAgentId: Boolean(intakeAgentId),
      hint: "Set both as Supabase Edge Function secrets, then retry.",
    }, { status: 500, headers: corsHeaders });
  }

  // Optional shared secret. If unset, allow one-shot setup for this deploy.
  const admin = Deno.env.get("BENCHBID_TOOL_SECRET") ?? Deno.env.get("CONFIGURE_TOOLS_SECRET");
  if (admin) {
    const provided = request.headers.get("x-benchdial-admin") ?? "";
    if (provided !== admin) {
      return Response.json({ error: "Unauthorized." }, { status: 401, headers: corsHeaders });
    }
  }

  const updateTool = await createClientTool(
    apiKey,
    "update_scope_draft",
    "Update Estimator ScopePrint draft fields during the interview. Pass any subset of known fields as soon as they are confirmed.",
    false,
    scopeParams(false),
  );
  if (!updateTool.ok) {
    return Response.json({ error: "Failed to create update_scope_draft", detail: updateTool }, { status: 502, headers: corsHeaders });
  }

  const submitTool = await createClientTool(
    apiKey,
    "submit_confirmed_scope",
    "After the user explicitly confirms the complete readback, submit the full scope into the Estimator draft. Never invent a scope hash.",
    true,
    scopeParams(true),
  );
  if (!submitTool.ok) {
    return Response.json({ error: "Failed to create submit_confirmed_scope", detail: submitTool }, { status: 502, headers: corsHeaders });
  }

  const agentRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(intakeAgentId)}`, {
    headers: { "xi-api-key": apiKey },
  });
  const agentText = await agentRes.text();
  let agent: Record<string, unknown> = {};
  try {
    agent = JSON.parse(agentText);
  } catch {
    agent = { raw: agentText };
  }
  if (!agentRes.ok) {
    return Response.json({ error: "Failed to load intake agent", detail: agent }, { status: 502, headers: corsHeaders });
  }

  const conversationConfig = (agent.conversation_config ?? {}) as Record<string, unknown>;
  const agentCfg = (conversationConfig.agent ?? {}) as Record<string, unknown>;
  const prompt = (agentCfg.prompt ?? {}) as Record<string, unknown>;
  const existingIds = Array.isArray(prompt.tool_ids)
    ? prompt.tool_ids.filter((id): id is string => typeof id === "string")
    : [];
  const newIds = [updateTool.toolId, submitTool.toolId].filter((id): id is string => Boolean(id));
  const merged = [...new Set([...existingIds, ...newIds])];

  const patchRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(intakeAgentId)}`, {
    method: "PATCH",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            tool_ids: merged,
          },
        },
      },
      version_description: "Add Estimator client tools update_scope_draft + submit_confirmed_scope",
    }),
  });
  const patchText = await patchRes.text();
  let patchBody: Record<string, unknown> = {};
  try {
    patchBody = JSON.parse(patchText);
  } catch {
    patchBody = { raw: patchText };
  }
  if (!patchRes.ok) {
    return Response.json({
      error: "Tools created but agent patch failed",
      updateToolId: updateTool.toolId,
      submitToolId: submitTool.toolId,
      detail: patchBody,
    }, { status: 502, headers: corsHeaders });
  }

  return Response.json({
    ok: true,
    intakeAgentId,
    update_scope_draft: updateTool.toolId,
    submit_confirmed_scope: submitTool.toolId,
    tool_ids: merged,
  }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
});
