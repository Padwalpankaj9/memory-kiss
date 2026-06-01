import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RevealExperience } from "@/components/RevealExperience";
import { type Kiss, type Memory, getPublicKiss, getPublicMemories } from "@/lib/kisses";

export const Route = createFileRoute("/kiss/$id")({
  head: () => ({
    meta: [
      { title: "Memory Kiss — A kiss is waiting" },
      { name: "description", content: "Open a private memory reveal." },
    ],
  }),
  component: KissPage,
});

function KissPage() {
  const { id: shareToken } = Route.useParams();
  const [kiss, setKiss] = useState<Kiss | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const nextKiss = await getPublicKiss(shareToken);
        if (!active) return;
        setKiss(nextKiss);
        if (nextKiss) setMemories(await getPublicMemories(shareToken));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "This kiss could not be opened.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [shareToken]);

  if (loading) return <CenteredMessage title="Opening your kiss..." />;
  if (error) return <CenteredMessage title="This kiss needs a moment" copy={error} />;
  if (!kiss)
    return (
      <CenteredMessage
        title="This kiss was not found"
        copy="The link may be incomplete or expired."
      />
    );
  if (memories.length === 0) {
    return (
      <CenteredMessage
        title="This kiss is still being filled with memories"
        copy="Please check back soon."
      />
    );
  }

  return <RevealExperience kiss={kiss} memories={memories} />;
}

function CenteredMessage({ title, copy }: { title: string; copy?: string }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-5 text-center"
      style={{ backgroundColor: "#fdf5f3" }}
    >
      <div
        className="max-w-md rounded-3xl px-7 py-10"
        style={{ backgroundColor: "#faf0ec", boxShadow: "0 20px 60px -20px rgba(110,42,51,0.18)" }}
      >
        <h1 className="text-3xl leading-tight" style={{ fontWeight: 600 }}>
          {title}
        </h1>
        {copy && (
          <p className="mt-3 italic" style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}>
            {copy}
          </p>
        )}
      </div>
    </main>
  );
}
