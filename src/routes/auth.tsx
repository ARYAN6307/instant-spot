import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail, phoneToPassword } from "@/lib/oneslot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — OneSlot" },
      {
        name: "description",
        content: "Sign in to OneSlot with your mobile number to book slots and manage memberships.",
      },
      { property: "og:title", content: "Sign in to OneSlot" },
      { property: "og:description", content: "One number, all your recurring bookings." },
    ],
  }),
  component: AuthPage,
});

const MOCK_OTP = "123456";

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"consumer" | "provider">("consumer");
  const [busy, setBusy] = useState(false);

  function sendOtp() {
    if (phone.replace(/\D/g, "").length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setStep("otp");
    toast.success(`OTP sent to +91 ${phone} (demo code ${MOCK_OTP})`);
  }

  async function verify() {
    if (otp !== MOCK_OTP) {
      toast.error("Incorrect OTP. Use " + MOCK_OTP + " for the demo.");
      return;
    }
    setBusy(true);
    const email = phoneToEmail(phone);
    const password = phoneToPassword(phone);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || `User ${phone.slice(-4)}`, phone, role },
          },
        });
        if (signUpError) throw signUpError;
      }
      toast.success("Signed in");
      void navigate({ to: role === "provider" ? "/dashboard" : "/" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 pb-10 pt-6">
      <button onClick={() => history.back()} className="mb-8 w-fit text-muted-foreground">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight">One</span>
          <span className="text-3xl font-extrabold tracking-tight text-primary">Slot</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === "phone"
            ? "Enter your mobile number to continue."
            : `We sent a 6-digit code to +91 ${phone}.`}
        </p>

        {step === "phone" ? (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3.5">
              <span className="text-sm font-semibold text-muted-foreground">+91</span>
              <input
                value={phone}
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="98450 00000"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (new users)"
              className="w-full rounded-2xl bg-surface px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              {(["consumer", "provider"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex-1 rounded-2xl py-3 text-xs font-semibold ring-1 ring-border",
                    role === r ? "bg-primary text-primary-foreground ring-primary" : "bg-card",
                  )}
                >
                  {r === "consumer" ? "I'm booking" : "I run a business"}
                </button>
              ))}
            </div>
            <button
              onClick={sendOtp}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground"
            >
              Send OTP
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <input
              value={otp}
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className="w-full rounded-2xl bg-surface px-4 py-3.5 text-center text-lg tracking-[0.5em] outline-none"
            />
            <button
              disabled={busy}
              onClick={() => void verify()}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              onClick={() => setStep("phone")}
              className="w-full text-center text-xs text-muted-foreground"
            >
              Change number
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
          OTP delivery and payments are mocked in this demo — use code{" "}
          <b className="text-foreground">{MOCK_OTP}</b>. Accounts and bookings are real records.
        </p>
      </div>
    </div>
  );
}
