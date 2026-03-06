"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function KeyboardNav() {
  const router = useRouter();
  const lastKey = useRef("");
  const lastTime = useRef(0);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      if (e.key === lastKey.current && now - lastTime.current < 300) {
        if (e.key === "d") router.push("/");
        if (e.key === "a") router.push("/actions");
        lastKey.current = "";
        lastTime.current = 0;
        return;
      }

      lastKey.current = e.key;
      lastTime.current = now;
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
