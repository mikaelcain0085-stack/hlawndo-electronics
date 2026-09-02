"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Google Login
  const handleGoogleLogin = async () => {
    try {
      setMessage("");
      setIsLoggingIn(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://hlondoelectronics.store/admin-login",
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Google login error:", error);

      setMessage(
        "Unable to start Google login. Please try again."
      );

      setIsLoggingIn(false);
    }
  };

  // Check whether the logged-in user is authorized
  const checkAuthorizedUser = async () => {
    try {
      setCheckingSession(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        setCheckingSession(false);
        return;
      }

      const userEmail = session.user.email.toLowerCase();

      console.log("Logged in user:", userEmail);

      const { data, error } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", userEmail)
        .maybeSingle();

      if (error) {
        console.error("Authorization error:", error);

        setMessage(
          "Unable to verify your access. Please contact the administrator."
        );

        await supabase.auth.signOut();

        return;
      }

      // User is not authorized
      if (!data) {
        await supabase.auth.signOut();

        setMessage(
          `Access denied. ${userEmail} is not an authorized admin.`
        );

        return;
      }

      // User is authorized
      sessionStorage.setItem(
        "hlawndo-admin-logged-in",
        "true"
      );

      router.replace("/admin");

    } catch (error) {
      console.error("Session check error:", error);

      setMessage(
        "Something went wrong while checking your login."
      );

    } finally {
      setCheckingSession(false);
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    // Check existing session when page loads
    checkAuthorizedUser();

    // Listen for Google OAuth login completion
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event);

        if (event === "SIGNED_IN" && session?.user) {
          checkAuthorizedUser();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080d14] px-5 py-10 text-white">
      <div className="w-full max-w-md">

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-8 text-sm text-gray-400 transition hover:text-[#e9a33f]"
        >
          ← Back to Store
        </button>

        <div className="rounded-3xl border border-white/10 bg-[#0d141d] p-7 shadow-2xl md:p-10">

          <div className="text-center">

            <p className="text-xs tracking-[0.3em] text-[#e9a33f]">
              HLAWNDO ELECTRONICS
            </p>

            <div className="mt-6 text-5xl">
              🔐
            </div>

            <h1 className="mt-5 text-3xl font-bold">
              Admin{" "}
              <span className="text-[#e9a33f]">
                Login
              </span>
            </h1>

            <p className="mt-3 text-sm text-gray-400">
              Sign in with your authorized Google account.
            </p>

          </div>

          {message && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || checkingSession}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 font-bold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkingSession
              ? "Checking session..."
              : isLoggingIn
              ? "Signing in..."
              : "🔵 Continue with Google"}
          </button>

          <p className="mt-7 text-center text-xs text-gray-600">
            Authorized users only.
          </p>

        </div>
      </div>
    </main>
  );
}