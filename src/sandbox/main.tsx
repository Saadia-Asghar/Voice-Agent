import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConversationProvider } from "@elevenlabs/react";
import { AuthProvider } from "../Auth";
import SandboxApp from "./SandboxApp";
import "../styles.css";
import "./sandbox.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ConversationProvider>
        <SandboxApp />
      </ConversationProvider>
    </AuthProvider>
  </StrictMode>,
);
