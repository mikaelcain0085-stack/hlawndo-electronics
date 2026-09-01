"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = new URLSearchParams(window.location.search).get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("OAuth callback error:", error);
            router.replace("/admin-login?error=auth");
            return;
          }
        }

        router.replace("/admin-login");
      } catch (error) {
        console.error("Callback error:", error);
        router.replace("/admin-login?error=auth");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080d14] text-white">
      <div className="text-center">
        <div className="text-4xl">🔐</div>

        <h1 className="mt-4 text-xl font-semibold">
          Signing you in...
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Please wait while we verify your account.
        </p>
      </div>
    </main>
  );
}