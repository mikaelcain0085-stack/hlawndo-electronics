"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Enquiry = {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  message: string;
  created_at: string;
};

const ADMIN_LOGIN_KEY = "hlawndo-admin-logged-in";

export default function EnquiriesPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(true);
  const [deletingEnquiryId, setDeletingEnquiryId] =
    useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState("");

  const loadEnquiries = async () => {
    setEnquiriesLoading(true);

    try {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Load enquiries error:", error);

        setMessage(
          `Could not load enquiries: ${error.message}`
        );

        return;
      }

      setEnquiries((data || []) as Enquiry[]);
    } catch (error) {
      console.error(
        "Unexpected enquiry loading error:",
        error
      );

      setMessage(
        "Something went wrong while loading enquiries."
      );
    } finally {
      setEnquiriesLoading(false);
    }
  };

  const deleteEnquiry = async (enquiry: Enquiry) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete this enquiry from ${enquiry.full_name}?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingEnquiryId(enquiry.id);

    setMessage(
      `Deleting enquiry from ${enquiry.full_name}...`
    );

    try {
      const { data, error } = await supabase
        .from("enquiries")
        .delete()
        .eq("id", enquiry.id)
        .select();

      if (error) {
        console.error("Enquiry delete error:", error);

        setMessage(
          `Could not delete enquiry: ${error.message}`
        );

        return;
      }

      if (!data || data.length === 0) {
        setMessage(
          "Enquiry could not be deleted. Please check your Supabase permissions."
        );

        return;
      }

      setEnquiries((current) =>
        current.filter(
          (currentEnquiry) =>
            currentEnquiry.id !== enquiry.id
        )
      );

      setMessage(
        `Enquiry from ${enquiry.full_name} deleted.`
      );
    } catch (error) {
      console.error(
        "Unexpected enquiry delete error:",
        error
      );

      setMessage(
        "Something went wrong while deleting the enquiry."
      );
    } finally {
      setDeletingEnquiryId(null);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await supabase.auth.signOut();

    sessionStorage.removeItem(
      ADMIN_LOGIN_KEY
    );

    router.replace("/admin-login");
  };

  useEffect(() => {
    const verifyAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        sessionStorage.removeItem(
          ADMIN_LOGIN_KEY
        );

        router.replace("/admin-login");
        return;
      }

      const userEmail =
        session.user.email.toLowerCase();

      const { data, error } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", userEmail)
        .maybeSingle();

      if (error || !data) {
        await supabase.auth.signOut();

        sessionStorage.removeItem(
          ADMIN_LOGIN_KEY
        );

        router.replace("/admin-login");
        return;
      }

      setIsAuthorized(true);

      loadEnquiries();
    };

    verifyAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          router.replace("/admin-login");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#05070b] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#e9a33f]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">

        {/* HEADER */}
        <header className="mb-14">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="mb-6 rounded-2xl border border-white/10 bg-[#0b1018] px-5 py-3 text-sm text-gray-300 transition hover:border-[#e9a33f]/50 hover:text-[#ffd078]"
              >
                ← Back to Dashboard
              </button>

              <p className="text-xs font-bold tracking-[0.3em] text-[#e9a33f]">
                HLAWNDO ELECTRONICS
              </p>

              <h1 className="mt-3 text-4xl font-normal sm:text-5xl">
                Customer{" "}
                <span className="bg-gradient-to-r from-[#ffd078] to-[#e9a33f] bg-clip-text text-transparent">
                  Enquiries
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-500 sm:text-base">
                Questions and requests submitted through
                the website&apos;s enquiry form.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                type="button"
                onClick={loadEnquiries}
                disabled={enquiriesLoading}
                className="rounded-2xl border border-white/10 bg-[#0b1018] px-5 py-3.5 text-sm text-gray-300 transition hover:border-[#e9a33f]/50 hover:text-[#ffd078] disabled:cursor-not-allowed disabled:opacity-50"
              >
                ↻ Refresh Enquiries
              </button>

              <div className="rounded-2xl border border-[#e9a33f]/20 bg-[#e9a33f]/5 px-5 py-3.5 text-sm font-bold text-[#ffd078]">
                {enquiries.length} Enquiries
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-3.5 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                    Logging out...
                  </span>
                ) : (
                  "Logout"
                )}
              </button>

            </div>
          </div>
        </header>

        {/* MESSAGE */}
        {message && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-[#0b1018] px-5 py-4 text-sm text-gray-300">
            {message}
          </div>
        )}

        {/* ENQUIRIES */}
        {enquiriesLoading ? (

          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b1018] py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#e9a33f]" />

            <p className="mt-5 text-sm text-gray-500">
              Loading enquiries...
            </p>
          </div>

        ) : enquiries.length === 0 ? (

          <div className="rounded-[2rem] border border-dashed border-white/10 bg-[#0b1018] py-24 text-center">
            <div className="text-3xl">
              ✉️
            </div>

            <h3 className="mt-6 text-4xl font-medium">
              No enquiries yet
            </h3>

            <p className="mt-3 text-sm text-gray-500">
              Enquiries submitted from the website
              will automatically appear here.
            </p>
          </div>

        ) : (

          <div className="space-y-8">

            {enquiries.map((enquiry) => (

              <article
                key={enquiry.id}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1018] p-8 shadow-2xl"
              >

                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                  <div>

                    <p className="text-xs tracking-[0.25em] text-gray-500">
                      {new Date(
                        enquiry.created_at
                      ).toLocaleString()}
                    </p>

                    <h3 className="mt-2 text-2xl font-medium">
                      {enquiry.full_name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-400">
                      {enquiry.phone}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      {enquiry.address}
                    </p>

                    <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                      {enquiry.message}
                    </p>

                  </div>

                  <div className="flex shrink-0 items-start">

                    <button
                      type="button"
                      disabled={
                        deletingEnquiryId === enquiry.id
                      }
                      onClick={() =>
                        deleteEnquiry(enquiry)
                      }
                      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-7 py-4 text-sm font-bold text-red-400 transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingEnquiryId === enquiry.id ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                          Deleting...
                        </span>
                      ) : (
                        "🗑 Delete Enquiry"
                      )}
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

        {/* FOOTER */}
        <footer className="mt-24 border-t border-white/10 py-10 text-center">
          <div className="flex flex-col items-center gap-3">

            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-[#e9a33f]">
                ⚡
              </span>
              HLAWNDO ELECTRONICS
            </div>

            <p className="text-1xs text-gray-600">
              Premium e-commerce management system. @ 2024
              All rights reserved.
            </p>

          </div>
        </footer>

      </div>
    </main>
  );
}