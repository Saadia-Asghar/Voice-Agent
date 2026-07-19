const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

type ExtractFields = {
  instrumentCategory?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  symptoms?: string;
  errorCodes?: string;
  site?: string;
  deadline?: string;
  calibrationRequired?: boolean;
  responseHoursRequired?: number;
  deliverables?: string;
  constraints?: string;
  approvalAuthority?: string;
};

function pickString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeFields(raw: Record<string, unknown>): ExtractFields {
  const deadline = pickString(raw.deadline)?.slice(0, 10);
  const responseHours = raw.responseHoursRequired ?? raw.response_hours_required;
  return {
    instrumentCategory: pickString(raw.instrumentCategory) ?? pickString(raw.instrument_category),
    manufacturer: pickString(raw.manufacturer),
    model: pickString(raw.model),
    serialNumber: pickString(raw.serialNumber) ?? pickString(raw.serial_number),
    symptoms: pickString(raw.symptoms),
    errorCodes: pickString(raw.errorCodes) ?? pickString(raw.error_codes),
    site: pickString(raw.site),
    deadline,
    calibrationRequired: typeof raw.calibrationRequired === "boolean"
      ? raw.calibrationRequired
      : typeof raw.calibration_required === "boolean"
        ? raw.calibration_required
        : undefined,
    responseHoursRequired: typeof responseHours === "number" && responseHours > 0 ? responseHours : undefined,
    deliverables: pickString(raw.deliverables) ?? pickString(raw.requiredDeliverables),
    constraints: pickString(raw.constraints),
    approvalAuthority: pickString(raw.approvalAuthority) ?? pickString(raw.approval_authority),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return Response.json({ error: "Method not allowed." }, { status: 405, headers: corsHeaders });

  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not configured.", fields: null }, { status: 503, headers: corsHeaders });
  }

  const body = await request.json().catch(() => null) as {
    fileName?: string;
    mimeType?: string;
    contentBase64?: string;
    textHint?: string;
  } | null;
  if (!body?.fileName || !body.contentBase64) {
    return Response.json({ error: "fileName and contentBase64 are required." }, { status: 400, headers: corsHeaders });
  }
  if (body.contentBase64.length > 6_000_000) {
    return Response.json({ error: "Document too large for extract." }, { status: 413, headers: corsHeaders });
  }

  const mimeType = body.mimeType || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");
  const userContent: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: `Extract laboratory equipment repair scope fields from this service document (${body.fileName}).
Return ONLY compact JSON with keys:
instrumentCategory, manufacturer, model, serialNumber, symptoms, errorCodes, site, deadline (YYYY-MM-DD),
calibrationRequired (boolean), responseHoursRequired (number), deliverables, constraints, approvalAuthority.
Use null for unknown fields. Never invent part numbers or prices.
${body.textHint ? `Optional OCR/text hint:\n${body.textHint.slice(0, 6000)}` : ""}`,
    },
  ];

  if (isImage) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${body.contentBase64}` },
    });
  } else if (body.textHint) {
    userContent[0] = {
      type: "text",
      text: `${(userContent[0] as { text: string }).text}\n\nDocument text:\n${body.textHint.slice(0, 10000)}`,
    };
  } else {
    // PDF/binary without text hint — still ask the model using filename + short note.
    userContent[0] = {
      type: "text",
      text: `${(userContent[0] as { text: string }).text}\n\nBinary document attached as base64 length ${body.contentBase64.length}. Prefer textHint when available; otherwise return nulls rather than inventing.`,
    };
  }

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You extract structured repair-scope fields. Never invent facts. Unknown → null.",
        },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text();
    return Response.json({ error: "Model extract failed.", detail: detail.slice(0, 400) }, { status: 502, headers: corsHeaders });
  }

  const completion = await upstream.json();
  const content = completion?.choices?.[0]?.message?.content;
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(typeof content === "string" ? content : "{}");
  } catch {
    return Response.json({ error: "Model returned non-JSON." }, { status: 502, headers: corsHeaders });
  }

  const fields = normalizeFields(parsed);
  const cleaned = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
  return Response.json({ fields: cleaned, source: "model" }, { headers: { ...corsHeaders, "Cache-Control": "no-store" } });
});
