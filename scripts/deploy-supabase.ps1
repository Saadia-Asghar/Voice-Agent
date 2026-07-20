# Deploy all Supabase edge functions (run after: npx supabase login)
$ErrorActionPreference = "Stop"
$ref = "gnzxgxvzflkystgrcfbz"
$functions = @(
  "elevenlabs-token",
  "elevenlabs-webhook",
  "call-tools",
  "extract-scope",
  "persist-scope",
  "health",
  "list-vendors",
  "configure-intake-tools"
)

Write-Host "Deploying $($functions.Count) edge functions to $ref..."
foreach ($name in $functions) {
  $noJwt = @("elevenlabs-webhook", "call-tools", "health", "list-vendors") -contains $name
  if ($noJwt) {
    npx supabase functions deploy $name --project-ref $ref --no-verify-jwt
  } else {
    npx supabase functions deploy $name --project-ref $ref
  }
}
Write-Host "Done. Run: node scripts/verify-stack.mjs"
