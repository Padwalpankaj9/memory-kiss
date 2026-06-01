import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingHearts } from "@/components/FloatingHearts";
import { type Kiss, createKiss, listKisses } from "@/lib/kisses";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/my-kisses")({
  head: () => ({
    meta: [
      { title: "Memory Kiss — My kisses" },
      { name: "description", content: "Manage the Memory Kiss links you created." },
    ],
  }),
  component: MyKissesPage,
});

function MyKissesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [kisses, setKisses] = useState<Kiss[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (auth.loading) return;
      if (auth.isConfigured && !auth.user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const nextKisses = await listKisses();
        if (active) setKisses(nextKisses);
      } catch (err) {
        if (active) setMessage(err instanceof Error ? err.message : "Could not load your kisses.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [auth.isConfigured, auth.loading, auth.user]);

  const onCreate = async () => {
    try {
      setCreating(true);
      setMessage("");
      const kiss = await createKiss(auth.user?.email?.split("@")[0] || "You");
      await navigate({ to: "/upload/$id", params: { id: kiss.id } });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create a kiss.");
    } finally {
      setCreating(false);
    }
  };

  const onSignOut = async () => {
    await auth.signOut();
    await navigate({ to: "/" });
  };

  if (!auth.loading && auth.isConfigured && !auth.user) {
    return (
      <CenteredMessage
        title="Sign in first"
        copy="Your upload pages are protected by your account."
        action={
          <Link
            to="/login"
            search={{ redirect: "/my-kisses" }}
            className="mt-6 block rounded-full px-6 py-3 text-center text-base font-medium"
            style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
          >
            Sign in
          </Link>
        }
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#fdf5f3" }}>
      <FloatingHearts />
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 py-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-xs underline-offset-4 hover:underline"
            style={{ color: "#5a4d44", fontFamily: "var(--font-ui)" }}
          >
            Home
          </Link>
          {auth.user && (
            <button
              onClick={onSignOut}
              className="rounded-full px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: "#faf0ec", color: "#6e2a33" }}
            >
              Sign out
            </button>
          )}
        </div>

        <div className="mt-8">
          <h1 className="text-4xl leading-tight" style={{ fontWeight: 600 }}>
            My kisses
          </h1>
          <p
            className="mt-2 text-sm italic"
            style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}
          >
            Create and manage the surprise links you send.
          </p>
          <button
            onClick={onCreate}
            disabled={creating || loading}
            className="mt-6 rounded-full px-7 py-4 text-base font-medium transition active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
          >
            {creating ? "Creating..." : "Create a new kiss"}
          </button>
        </div>

        {message && (
          <p
            className="mt-4 text-sm italic"
            style={{ color: "#8f3f4a", fontFamily: "var(--font-body)" }}
          >
            {message}
          </p>
        )}

        <div className="mt-8 grid gap-4">
          {loading && <p style={{ color: "#5a4d44" }}>Loading...</p>}
          {!loading && kisses.length === 0 && (
            <div
              className="rounded-3xl p-6"
              style={{
                backgroundColor: "#faf0ec",
                boxShadow: "0 16px 40px -24px rgba(110,42,51,0.18)",
              }}
            >
              <p className="italic" style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}>
                No kisses yet.
              </p>
            </div>
          )}
          {kisses.map((kiss) => (
            <div
              key={kiss.id}
              className="rounded-3xl p-5"
              style={{
                backgroundColor: "#faf0ec",
                boxShadow: "0 16px 40px -24px rgba(110,42,51,0.18)",
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl" style={{ fontWeight: 600 }}>
                    Kiss from {kiss.senderName}
                  </h2>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "#8a7d72", fontFamily: "var(--font-ui)" }}
                  >
                    Created {new Date(kiss.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/upload/$id"
                    params={{ id: kiss.id }}
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "#f5cccb", color: "#6e2a33" }}
                  >
                    Edit
                  </Link>
                  <Link
                    to="/kiss/$id"
                    params={{ id: kiss.shareToken }}
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
                  >
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function CenteredMessage({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action: React.ReactNode;
}) {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 text-center"
      style={{ backgroundColor: "#fdf5f3" }}
    >
      <div
        className="w-full max-w-md rounded-3xl px-7 py-10"
        style={{ backgroundColor: "#faf0ec", boxShadow: "0 20px 60px -20px rgba(110,42,51,0.18)" }}
      >
        <h1 className="text-3xl leading-tight" style={{ fontWeight: 600 }}>
          {title}
        </h1>
        <p className="mt-3 italic" style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}>
          {copy}
        </p>
        {action}
      </div>
    </main>
  );
}
