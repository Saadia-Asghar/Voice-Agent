import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { LogIn, LogOut, ShieldCheck, X } from "lucide-react";

type AuthValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthMode = "sign-in" | "sign-up" | "reset";

const AuthContext = createContext<AuthValue | null>(null);

const makeClient = (): SupabaseClient | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && publishableKey
    ? createClient(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
};

export const supabase = makeClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(() => ({
    session,
    loading,
    signIn: async (email, password) => {
      if (!supabase) throw new Error("Supabase authentication is not configured.");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password) => {
      if (!supabase) throw new Error("Supabase authentication is not configured.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      return Boolean(data.session);
    },
    resetPassword: async (email) => {
      if (!supabase) throw new Error("Supabase authentication is not configured.");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
    },
    signOut: async () => {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}

export function AuthControl({ onOpen }: { onOpen: () => void }) {
  const { session, loading, signOut } = useAuth();
  if (loading) return <span className="auth-state">Checking live access…</span>;
  if (!session) return <button className="auth-button" onClick={onOpen}><LogIn size={15} /> Unlock live calls</button>;
  return <div className="auth-user"><span><ShieldCheck size={14} /> {session.user.email?.split("@")[0] ?? "Buyer"}</span><button onClick={() => void signOut()} aria-label="Log out"><LogOut size={15} /></button></div>;
}

export function LoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    emailRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPassword("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim();
      if (mode === "sign-in") {
        await signIn(normalizedEmail, password);
        onClose();
      } else if (mode === "sign-up") {
        const signedIn = await signUp(normalizedEmail, password);
        if (signedIn) onClose();
        else setMessage("Confirm your buyer account from the message we sent, then unlock live calls.");
      } else {
        await resetPassword(normalizedEmail);
        setMessage("Recovery link sent. Use it to restore live-call access.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not unlock live calls.");
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === "sign-in" ? "Unlock live negotiations." : mode === "sign-up" ? "Create your buyer seat." : "Restore live-call access.";
  const submitLabel = mode === "sign-in" ? "Unlock live calls" : mode === "sign-up" ? "Create buyer seat" : "Send recovery link";

  return <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description" onKeyDown={handleKeyDown}>
      <button className="auth-close" onClick={onClose} aria-label="Close authentication"><X /></button>
      <span className="eyebrow">BenchDial live access</span>
      <h2 id="auth-title">{title}</h2>
      <p id="auth-description">Walk the simulated Call Room freely. Sign in only when you are ready for billable voice intake and recorded provider negotiations.</p>
      <div className="auth-tabs" role="tablist" aria-label="Buyer access">
        <button type="button" role="tab" aria-selected={mode === "sign-in"} onClick={() => changeMode("sign-in")}>Unlock</button>
        <button type="button" role="tab" aria-selected={mode === "sign-up"} onClick={() => changeMode("sign-up")}>New buyer seat</button>
      </div>
      <form onSubmit={(event) => void submit(event)}>
        <label>Buyer work email<input ref={emailRef} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="saadia@citylabs.example" autoComplete="email" required /></label>
        {mode !== "reset" && <label>Access password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={8} required /></label>}
        {error && <p className="warning" role="alert" aria-live="assertive">{error}</p>}
        {message && <p className="auth-message" role="status" aria-live="polite">{message}</p>}
        <button className="home-primary" disabled={submitting}>{submitting ? "Opening live access…" : submitLabel}</button>
      </form>
      {mode === "sign-in" && <button type="button" className="auth-link" onClick={() => changeMode("reset")}>Forgot access password?</button>}
      {mode === "reset" && <button type="button" className="auth-link" onClick={() => changeMode("sign-in")}>Back to unlock</button>}
      <small><ShieldCheck size={14} /> Supabase Auth holds credentials. BenchDial never stores them in the client.</small>
    </section>
  </div>;
}
