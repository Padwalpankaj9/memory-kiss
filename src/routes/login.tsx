import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FloatingHearts } from "@/components/FloatingHearts";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/my-kisses",
  }),
  head: () => ({
    meta: [
      { title: "Memory Kiss — Sign in" },
      { name: "description", content: "Sign in to create and manage Memory Kiss links." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSending(true);
      setMessage("");
      await auth.signInWithEmail(email, redirect);
      setMessage("Check your email for a sign-in link.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send the sign-in link.");
    } finally {
      setSending(false);
    }
  };

  if (!auth.isConfigured) {
    return (
      <CenteredShell title="Local mode is on" copy="Connect Supabase to enable sign-in.">
        <Link
          to="/"
          className="mt-6 block rounded-full px-6 py-3 text-center text-base font-medium"
          style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
        >
          Go home
        </Link>
      </CenteredShell>
    );
  }

  if (!auth.loading && auth.user) {
    void navigate({ to: redirect });
  }

  return (
    <CenteredShell title="Sign in to create" copy="We'll send a private magic link to your email.">
      <form onSubmit={onSubmit} className="mt-6">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-2xl border px-4 py-3 text-base outline-none transition focus:border-[#6e2a33]"
          style={{ borderColor: "#eedbd2", backgroundColor: "#fdf5f3", color: "#2a221e" }}
        />
        <button
          type="submit"
          disabled={sending}
          className="mt-4 w-full rounded-full px-6 py-4 text-base font-medium transition active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
        >
          {sending ? "Sending..." : "Email me a sign-in link"}
        </button>
      </form>
      {message && (
        <p
          className="mt-4 text-sm italic"
          style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}
        >
          {message}
        </p>
      )}
    </CenteredShell>
  );
}

function CenteredShell({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#fdf5f3" }}>
      <FloatingHearts />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div
          className="w-full max-w-md rounded-3xl px-7 py-10 text-center"
          style={{
            backgroundColor: "#faf0ec",
            boxShadow: "0 20px 60px -20px rgba(110,42,51,0.18)",
          }}
        >
          <h1 className="text-3xl leading-tight" style={{ fontWeight: 600 }}>
            {title}
          </h1>
          <p className="mt-3 italic" style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}>
            {copy}
          </p>
          {children}
        </div>
      </section>
    </main>
  );
}
