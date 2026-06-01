import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FloatingHearts } from "@/components/FloatingHearts";
import { DEMO_KISS_ID, createKiss } from "@/lib/kisses";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Memory Kiss — Tiny surprise rituals for mom" },
      { name: "description", content: "Create a private photo reveal for the moms you love." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const onCreate = async () => {
    try {
      setCreating(true);
      setError("");
      if (auth.isConfigured && !auth.user) {
        await navigate({ to: "/login", search: { redirect: "/my-kisses" } });
        return;
      }
      const kiss = await createKiss("You");
      await navigate({ to: "/upload/$id", params: { id: kiss.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a kiss yet.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#fdf5f3" }}>
      <FloatingHearts />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-12">
        <div className="mx-auto w-full max-w-md text-center">
          <img
            src="/illustrations/hero-mother.png"
            alt=""
            className="mx-auto mb-6 w-56 sm:w-64 fade-in"
            draggable={false}
          />
          <h1 className="text-5xl leading-tight" style={{ fontWeight: 600 }}>
            Memory Kiss
          </h1>
          <p
            className="mx-auto mt-5 max-w-sm text-lg italic leading-relaxed"
            style={{ color: "#2a221e", fontFamily: "var(--font-body)" }}
          >
            You add the memories. We do the surprising.
          </p>
          <p
            className="mx-auto mt-3 max-w-xs text-sm italic leading-relaxed"
            style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}
          >
            A few surprise photos with personal notes,
            <br />
            delivered to Mom at unexpected moments
            <br />
            throughout the week.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/kiss/$id"
              params={{ id: DEMO_KISS_ID }}
              className="rounded-full px-7 py-4 text-center text-base font-medium transition active:scale-[0.98]"
              style={{
                backgroundColor: "#6e2a33",
                color: "#fdf5f3",
                boxShadow: "0 12px 28px -14px rgba(110,42,51,0.6)",
              }}
            >
              Open Mom's surprise
            </Link>
            <button
              onClick={onCreate}
              disabled={creating}
              className="rounded-full px-7 py-4 text-base font-medium transition active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: "#f5cccb", color: "#6e2a33" }}
            >
              {creating ? "Creating..." : "Create one for your mom"}
            </button>
            {auth.isConfigured && auth.user && (
              <Link
                to="/my-kisses"
                className="rounded-full px-7 py-4 text-center text-base font-medium transition active:scale-[0.98]"
                style={{ backgroundColor: "#faf0ec", color: "#6e2a33" }}
              >
                My kisses
              </Link>
            )}
          </div>
          {error && (
            <p className="mt-4 text-sm" style={{ color: "#8f3f4a" }}>
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21s-7.5-4.6-9.5-9.1C1 8.6 3 5 6.5 5c2 0 3.4 1.1 4.3 2.4C11.7 6.1 13.1 5 15.1 5 18.6 5 20.6 8.6 19.1 11.9 17.1 16.4 12 21 12 21z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
    >
      <path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-6 w-6"
    >
      <polyline points="16 3 21 3 21 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" y1="20" x2="21" y2="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="21 16 21 21 16 21" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="15" y1="15" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" y1="4" x2="9" y2="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
