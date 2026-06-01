import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FloatingHearts } from "@/components/FloatingHearts";
import { type Kiss, type Memory, pickRandomReveal, randomClosing } from "@/lib/kisses";

type Stage = "notify" | "reveal" | "end";

export function RevealExperience({ kiss, memories }: { kiss: Kiss; memories: Memory[] }) {
  const [stage, setStage] = useState<Stage>("notify");
  const [selectedMemories, setSelectedMemories] = useState<Memory[]>([]);
  const [idx, setIdx] = useState(0);
  const [closing, setClosing] = useState("");
  const [showEnd, setShowEnd] = useState(false);

  const startReveal = () => {
    setSelectedMemories(pickRandomReveal(memories));
    setIdx(0);
    setShowEnd(false);
    setStage("reveal");
  };

  const watchAgain = () => {
    setIdx(0);
    setShowEnd(false);
    setStage("reveal");
  };

  useEffect(() => {
    if (stage !== "reveal" || selectedMemories.length === 0) return;
    if (idx >= selectedMemories.length) {
      const timer = setTimeout(() => {
        setClosing(randomClosing());
        setStage("end");
        setShowEnd(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [idx, stage, selectedMemories]);

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#fdf5f3" }}>
      <FloatingHearts />
      <div className="relative z-10">
        {stage === "notify" && <NotifyScreen senderName={kiss.senderName} onOpen={startReveal} />}
        {stage === "reveal" && selectedMemories.length > 0 && idx < selectedMemories.length && (
          <RevealScreen
            memories={selectedMemories}
            idx={idx}
            onPrev={() => setIdx((i) => Math.max(0, i - 1))}
            onNext={() => setIdx((i) => i + 1)}
            onJump={(i) => setIdx(i)}
          />
        )}
        {stage === "end" && showEnd && <EndScreen message={closing} onAgain={watchAgain} />}
      </div>
    </main>
  );
}

function NotifyScreen({ senderName, onOpen }: { senderName: string; onOpen: () => void }) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <p
        className="mb-4 text-xs font-medium uppercase tracking-widest"
        style={{ color: "#8a7d72", fontFamily: "var(--font-ui)" }}
      >
        What Mom sees
      </p>
      <div
        className="fade-in w-full max-w-md rounded-3xl px-7 py-10 text-center"
        style={{ backgroundColor: "#faf0ec", boxShadow: "0 20px 60px -20px rgba(110,42,51,0.18)" }}
      >
        <img
          src="/illustrations/surprise-envelope.png"
          alt=""
          className="mx-auto mb-5 h-36 w-36 object-contain fade-in"
          draggable={false}
        />
        <h1 className="text-3xl leading-tight" style={{ fontWeight: 600 }}>
          A new kiss from {senderName}
        </h1>
        <p
          className="mt-3 text-base italic"
          style={{ color: "#5a4d44", fontFamily: "var(--font-body)" }}
        >
          You have a surprise waiting
        </p>
        <p className="mt-2 text-xs" style={{ color: "#8a7d72", fontFamily: "var(--font-ui)" }}>
          Sent from 8,000 miles away
        </p>
        <button
          onClick={onOpen}
          className="mt-8 w-full rounded-full px-6 py-4 text-base font-medium transition active:scale-[0.98]"
          style={{
            backgroundColor: "#6e2a33",
            color: "#fdf5f3",
            boxShadow: "0 10px 24px -10px rgba(110,42,51,0.5)",
          }}
        >
          Open Your Surprise
        </button>
      </div>
    </section>
  );
}

function RevealScreen({
  memories,
  idx,
  onPrev,
  onNext,
  onJump,
}: {
  memories: Memory[];
  idx: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (i: number) => void;
}) {
  const memory = memories[idx];
  const multiple = memories.length > 1;
  const key = useMemo(() => `${idx}-${memory.id}`, [idx, memory.id]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div key={key} className="photo-rise flex-1">
        <div
          className="overflow-hidden rounded-3xl"
          style={{
            backgroundColor: "#faf0ec",
            boxShadow: "0 24px 60px -24px rgba(110,42,51,0.22)",
          }}
        >
          <img
            src={memory.photoUrl}
            alt={memory.caption}
            className="w-full max-h-[65vh] object-contain"
            style={{ backgroundColor: "#faf0ec" }}
          />
          <p
            className="flex items-center justify-center border-t px-6 py-5 text-center italic"
            style={{
              borderColor: "#eedbd2",
              fontFamily: "var(--font-body)",
              fontSize: "clamp(18px, 5vw, 22px)",
              lineHeight: 1.38,
              color: "#2a221e",
            }}
          >
            {memory.caption}
          </p>
        </div>
      </div>

      {multiple && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            onClick={onPrev}
            disabled={idx === 0}
            aria-label="Previous"
            className="flex h-16 w-16 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-30"
            style={{ backgroundColor: "#f5cccb", color: "#6e2a33" }}
          >
            <ArrowIcon dir="left" />
          </button>
          <div className="flex gap-2">
            {memories.map((_, i) => (
              <button
                key={i}
                onClick={() => onJump(i)}
                aria-label={`Go to photo ${i + 1}`}
                className="h-3 rounded-full transition-all"
                style={{
                  width: i === idx ? 28 : 12,
                  backgroundColor: i === idx ? "#6e2a33" : "#eedbd2",
                }}
              />
            ))}
          </div>
          <button
            onClick={onNext}
            aria-label="Next"
            className="flex h-16 w-16 items-center justify-center rounded-full transition active:scale-95"
            style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
          >
            <ArrowIcon dir="right" />
          </button>
        </div>
      )}

      {!multiple && (
        <div className="mt-6">
          <button
            onClick={onNext}
            className="w-full rounded-full px-6 py-4 text-base font-medium transition active:scale-[0.98]"
            style={{ backgroundColor: "#6e2a33", color: "#fdf5f3" }}
          >
            Continue
          </button>
        </div>
      )}
    </section>
  );
}

function EndScreen({ message, onAgain }: { message: string; onAgain: () => void }) {
  return (
    <section
      className="soft-in flex min-h-screen items-center justify-center px-5 py-10"
      style={{ background: "linear-gradient(160deg, #fceae9 0%, #fdf5f3 100%)" }}
    >
      <div className="w-full max-w-md text-center">
        <h2 className="text-3xl leading-snug" style={{ fontWeight: 600 }}>
          {message}
        </h2>
        <div className="mt-8 flex justify-center">
          <img
            src="/illustrations/warm-hug.png"
            alt=""
            className="h-44 w-44 object-contain fade-in"
            draggable={false}
          />
        </div>
        <button
          onClick={onAgain}
          className="mt-10 w-full rounded-full px-6 py-4 text-base font-medium transition active:scale-[0.98]"
          style={{
            backgroundColor: "#6e2a33",
            color: "#fdf5f3",
            boxShadow: "0 10px 24px -10px rgba(110,42,51,0.5)",
          }}
        >
          Watch Again
        </button>
        <Link
          to="/"
          className="mt-4 block text-sm underline-offset-4 hover:underline"
          style={{ color: "#5a4d44", fontFamily: "var(--font-ui)" }}
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}

function HeartIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M12 21s-7.5-4.6-9.5-9.1C1 8.6 3 5 6.5 5c2 0 3.4 1.1 4.3 2.4C11.7 6.1 13.1 5 15.1 5 18.6 5 20.6 8.6 19.1 11.9 17.1 16.4 12 21 12 21z" />
    </svg>
  );
}

function ArrowIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
    >
      {dir === "left" ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}
