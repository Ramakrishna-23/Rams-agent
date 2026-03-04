"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const PASSCODE = "230104";
const STORAGE_KEY = "rams-auth";
// Session lasts 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  try {
    const { expires } = JSON.parse(stored);
    return Date.now() < expires;
  } catch {
    return false;
  }
}

function setAuthenticated() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ expires: Date.now() + SESSION_DURATION_MS })
  );
}

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, []);

  useEffect(() => {
    if (authed === false) {
      inputRef.current?.focus();
    }
  }, [authed]);

  // Loading state
  if (authed === null) return null;

  if (authed) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === PASSCODE) {
      setAuthenticated();
      setAuthed(true);
    } else {
      setError(true);
      setCode("");
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleSubmit}
        className="flex w-80 flex-col items-center gap-6 rounded-xl border p-8 shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold">Rams Agent</h1>
          <p className="text-sm text-muted-foreground">Enter passcode to continue</p>
        </div>
        <Input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          placeholder="------"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`text-center text-2xl tracking-[0.5em] ${
            error ? "border-destructive" : ""
          }`}
        />
        {error && (
          <p className="text-sm text-destructive">Wrong passcode</p>
        )}
        <Button type="submit" className="w-full" disabled={code.length < 6}>
          Unlock
        </Button>
      </form>
    </div>
  );
}
