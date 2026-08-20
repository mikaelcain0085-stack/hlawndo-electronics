"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  /*
  ========================================
  ADMIN LOGIN DETAILS

  Change these values if you want to use
  a different Admin ID or Password.
  ========================================
  */

  const correctAdminId = "sangtea041";
  const correctPassword = "hlawndo@041";

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");

    const enteredAdminId = adminId.trim();
    const enteredPassword = password.trim();

    if (
      enteredAdminId === correctAdminId &&
      enteredPassword === correctPassword
    ) {
      setIsLoggingIn(true);

      /*
      ========================================
      SAVE ADMIN LOGIN STATUS

      This exact key must also be checked
      inside app/admin/page.tsx
      ========================================
      */

      sessionStorage.setItem(
        "hlawndo-admin-logged-in",
        "true"
      );

      /*
      Redirect to Admin Console
      */

      router.replace("/admin");

      return;
    }

    setMessage(
      "Incorrect Admin ID or Password."
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080d14] px-5 py-10 text-white">
      <div className="w-full max-w-md">

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-8 text-sm text-gray-400 transition hover:text-[#e9a33f]"
        >
          ← Back to Store
        </button>

        {/* LOGIN CARD */}

        <div className="rounded-3xl border border-white/10 bg-[#0d141d] p-7 shadow-2xl md:p-10">

          {/* HEADER */}

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
              Enter your administrator credentials to
              access the admin console.
            </p>
          </div>

          {/* ERROR MESSAGE */}

          {message && (
            <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {message}
            </div>
          )}

          {/* LOGIN FORM */}

          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-5"
          >

            {/* ADMIN ID */}

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Admin ID
              </label>

              <input
                type="text"
                value={adminId}
                onChange={(event) => {
                  setAdminId(event.target.value);
                  setMessage("");
                }}
                placeholder="Enter Admin ID"
                autoComplete="username"
                disabled={isLoggingIn}
                className="w-full rounded-xl border border-white/10 bg-[#080d14] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <label className="mb-2 block text-sm text-gray-400">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setMessage("");
                }}
                placeholder="Enter Password"
                autoComplete="current-password"
                disabled={isLoggingIn}
                className="w-full rounded-xl border border-white/10 bg-[#080d14] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-[#e9a33f] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-xl bg-[#e9a33f] px-6 py-4 font-bold text-black transition hover:bg-[#ffd078] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn
                ? "Opening Admin Console..."
                : "Login to Admin Console →"}
            </button>

          </form>

          {/* FOOTER */}

          <p className="mt-7 text-center text-xs text-gray-600">
            Authorized administrators only.
          </p>

        </div>

      </div>
    </main>
  );
}