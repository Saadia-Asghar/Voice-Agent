import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConversationProvider } from "@elevenlabs/react";
import App from "./App";
import { AuthProvider } from "./Auth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider><ConversationProvider><App /></ConversationProvider></AuthProvider>
  </StrictMode>,
);
