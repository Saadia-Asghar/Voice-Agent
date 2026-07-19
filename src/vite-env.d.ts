/// <reference types="vite/client" />

declare module "*.css";

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ELEVENLABS_INTAKE_AGENT_ID?: string;
  readonly VITE_ELEVENLABS_BUYER_AGENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
