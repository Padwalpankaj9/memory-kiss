import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type Kiss,
  type Memory,
  addMemory,
  deleteMemory,
  getKiss,
  getMemories,
  isDemoKiss,
} from "@/lib/kisses";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/upload/$id")({
  head: () => ({
    meta: [
      { title: "Memory Kiss — Add memories" },
      { name: "description", content: "Upload photos and captions for a private Memory Kiss." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const { id } = Route.useParams();
  const auth = useAuth();
  const [kiss, setKiss] = useState<Kiss | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [caption, setCaption] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const momLink = useMemo(() => {
    const shareToken = kiss?.shareToken || id;
    if (typeof window === "undefined") return `/kiss/${shareToken}`;
    return `${window.location.origin}/kiss/${shareToken}`;
  }, [id, kiss?.shareToken]);

  const refresh = useCallback(async () => {
    const nextKiss = await getKiss(id);
    setKiss(nextKiss);
    if (nextKiss) setMemories(await getMemories(id));
  }, [id]);

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
        await refresh();
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [auth.isConfigured, auth.loading, auth.user, refresh]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const onSave = async () => {
    if (!pendingFile) return;
    try {
      setSaving(true);
      setMessage("");
      await addMemory(id, pendingFile, caption);
      setPendingFile(null);
      setPendingPreview(null);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
      setMessage("Memory saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save this memory.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (memory: Memory) => {
    if (memory.isDemo) return;
    try {
      await deleteMemory(id, memory.id);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not delete this memory.");
    }
  };

  const copyMomLink = async () => {
    try {
      await navigator.clipboard.writeText(momLink);
      setMessage("Link copied!");
    } catch {
      setMessage("Copy failed. Select the link manually.");
    }
  };

  if (auth.loading || loading) return <CenteredMessage title="Loading memories..." />;
  if (auth.isConfigured && !auth.user) {
    return (
      <CenteredMessage
        title="Sign in first"
        copy="Only the creator can add or edit memories."
        action={
          <Link
            to="/login"
            search={{ redirect: `/upload/${id}` }}
            className="mt-6 block rounded-full px-6 py-3 text-center text-base font-medium"
            style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
          >
            Sign in
          </Link>
        }
      />
    );
  }
  if (!kiss)
    return (
      <CenteredMessage
        title="This kiss was not found"
        copy="Create a new one from the home page."
      />
    );

  const hasMemories = memories.length > 0;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#fdf5f3" }}>
      <div
        className="px-5 pb-3 pt-10"
        style={{ background: "linear-gradient(180deg, #faf0ec 0%, #fdf5f3 100%)" }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <Link
            to="/"
            className="mb-4 inline-block text-xs underline-offset-4 hover:underline"
            style={{ color: "#5a4d44", fontFamily: "var(--font-ui)" }}
          >
            ← Home
          </Link>
          <h1 className="text-3xl sm:text-4xl" style={{ fontWeight: 600 }}>
            Your memories, her surprises
          </h1>
          <p
            className="mt-1 text-sm italic"
            style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}
          >
            Start adding photos below. They'll be delivered to Mom as surprise memories.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 pb-16">
        {/* Step 1: Upload */}
        <section
          className="mt-4 rounded-3xl p-5"
          style={{
            backgroundColor: "#faf0ec",
            boxShadow: "0 16px 40px -24px rgba(110,42,51,0.18)",
          }}
        >
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition"
            style={{
              borderColor: dragOver ? "#6e2a33" : "#eedbd2",
              backgroundColor: dragOver ? "#fceae9" : "transparent",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {pendingPreview ? (
              <img
                src={pendingPreview}
                alt="preview"
                className="max-h-64 rounded-xl object-cover"
              />
            ) : (
              <>
                <img
                  src="/illustrations/upload-prompt.png"
                  alt=""
                  className="mb-3 h-20 w-20 object-contain"
                  draggable={false}
                />
                <p className="text-base font-medium" style={{ color: "#2a221e" }}>
                  Add a photo
                </p>
                <p className="mt-1 text-sm" style={{ color: "#5a4d44" }}>
                  Drag & drop or tap to choose
                </p>
              </>
            )}
          </label>

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            className="mt-5 w-full rounded-2xl border px-4 py-3 text-base outline-none transition focus:border-[#6e2a33]"
            style={{ borderColor: "#eedbd2", backgroundColor: "#fdf5f3", color: "#2a221e" }}
          />

          <button
            onClick={onSave}
            disabled={!pendingFile || saving}
            className="mt-4 w-full rounded-full border px-6 py-3.5 text-base font-medium transition active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: "#f5cccb", color: "#6e2a33", borderColor: "#eedbd2" }}
          >
            {saving ? "Saving..." : "Save memory"}
          </button>
          {message && (
            <p
              className="mt-3 text-sm italic"
              style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}
            >
              {message}
            </p>
          )}
        </section>

        {/* Share CTA - always visible, disabled until memories exist */}
        <button
          onClick={() => {
            if (hasMemories) {
              document.getElementById("share-section")?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          disabled={!hasMemories}
          className="mt-6 w-full rounded-full px-6 py-4 text-base font-medium transition active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
        >
          Share with Mom
        </button>

        {/* Step 2: Memory grid */}
        {hasMemories && (
          <section className="mt-10">
            <h2 className="text-xl" style={{ fontWeight: 600, color: "#1e1815" }}>
              {memories.length} {memories.length === 1 ? "memory" : "memories"} added
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="group relative overflow-hidden rounded-2xl"
                  style={{
                    backgroundColor: "#faf0ec",
                    boxShadow: "0 8px 20px -12px rgba(110,42,51,0.2)",
                  }}
                >
                  <img
                    src={memory.photoUrl}
                    alt={memory.caption}
                    className="aspect-square w-full object-cover"
                  />
                  <p
                    className="px-3 py-2.5 text-xs italic leading-snug"
                    style={{ color: "#2a221e", fontFamily: "var(--font-body)" }}
                  >
                    {memory.caption}
                  </p>
                  {!memory.isDemo && (
                    <button
                      onClick={() => onDelete(memory)}
                      aria-label="Delete"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition"
                      style={{ backgroundColor: "rgba(110,42,51,0.85)" }}
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step 3: Share with Mom (only shown after memories exist) */}
        {hasMemories && (
          <section
            id="share-section"
            className="mt-10 rounded-3xl p-5"
            style={{
              backgroundColor: "#faf0ec",
              boxShadow: "0 16px 40px -24px rgba(110,42,51,0.18)",
            }}
          >
            <div className="flex items-center gap-3">
              <img
                src="/illustrations/share-envelope.png"
                alt=""
                className="h-10 w-10 object-contain"
                draggable={false}
              />
              <h2 className="text-lg" style={{ fontWeight: 600, color: "#1e1815" }}>
                Share with Mom
              </h2>
            </div>
            <p className="mt-1 text-sm" style={{ color: "#5a4d44" }}>
              Send this link to Mom. She'll receive a few surprise photos with your personal notes
              at unexpected moments throughout the week.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                readOnly
                value={momLink}
                className="min-w-0 flex-1 rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: "#eedbd2", backgroundColor: "#fdf5f3", color: "#5a4d44" }}
              />
              <button
                onClick={copyMomLink}
                aria-label="Copy link"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition active:scale-90"
                style={{ backgroundColor: "#f5cccb", color: "#6e2a33" }}
              >
                <CopyIcon />
              </button>
            </div>
            <Link
              to="/kiss/$id"
              params={{ id: kiss.shareToken }}
              className="mt-4 block rounded-full px-5 py-3 text-center text-sm font-medium transition active:scale-95"
              style={{ backgroundColor: "#f5cccb", color: "#6e2a33" }}
            >
              Preview what Mom sees
            </Link>
            {!auth.isConfigured && !isDemoKiss(id) && (
              <p
                className="mt-3 text-xs italic"
                style={{ color: "#8a7d72", fontFamily: "var(--font-body)" }}
              >
                Local mode: this works in this browser only. Connect Supabase to share across
                devices.
              </p>
            )}
          </section>
        )}

        {/* Bookmark reminder */}
        <p
          className="mt-8 text-center text-xs italic"
          style={{ color: "#8a7d72", fontFamily: "var(--font-body)" }}
        >
          Bookmark this page to add more memories later.
        </p>
      </div>
    </main>
  );
}

function CenteredMessage({
  title,
  copy,
  action,
}: {
  title: string;
  copy?: string;
  action?: React.ReactNode;
}) {
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
        {action}
      </div>
    </main>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        ry="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-3.5 w-3.5"
    >
      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
    </svg>
  );
}
