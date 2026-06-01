import { supabase } from "@/lib/supabase";

export type Kiss = {
  id: string;
  senderName: string;
  shareToken: string;
  createdAt: string;
  isDemo?: boolean;
};

export type Memory = {
  id: string;
  kissId: string;
  photoUrl: string;
  caption: string;
  createdAt: string;
  isDemo?: boolean;
};

export const DEMO_KISS_ID = "demo";

export const DEMO_KISS: Kiss = {
  id: DEMO_KISS_ID,
  senderName: "Memory Kiss",
  shareToken: DEMO_KISS_ID,
  createdAt: new Date("2026-05-09T00:00:00Z").toISOString(),
  isDemo: true,
};

export const DEMO_MEMORIES: Memory[] = [
  {
    id: "letter-one",
    kissId: DEMO_KISS_ID,
    photoUrl: "/illustrations/surprise-envelope.png",
    caption: "A small note saved for exactly the right moment.",
    createdAt: DEMO_KISS.createdAt,
    isDemo: true,
  },
  {
    id: "warm-hug",
    kissId: DEMO_KISS_ID,
    photoUrl: "/illustrations/warm-hug.png",
    caption: "A quiet hug from someone who is thinking of you.",
    createdAt: DEMO_KISS.createdAt,
    isDemo: true,
  },
  {
    id: "shared-memory",
    kissId: DEMO_KISS_ID,
    photoUrl: "/illustrations/share-envelope.png",
    caption: "One memory, wrapped up and waiting to be opened.",
    createdAt: DEMO_KISS.createdAt,
    isDemo: true,
  },
  {
    id: "new-upload",
    kissId: DEMO_KISS_ID,
    photoUrl: "/illustrations/upload-prompt.png",
    caption: "Add your own photo and make this demo personal.",
    createdAt: DEMO_KISS.createdAt,
    isDemo: true,
  },
];

export const SURPRISE_CAPTIONS = [
  "A little memory from me to you",
  "Just thinking of you right now",
  "This one made me smile",
  "Sending you a quiet hug",
  "Because you deserve every good thing",
];

export const CLOSING_MESSAGES = [
  "See you soon with more memories",
  "Today's little kiss",
  "More memories will find you soon",
  "Keeping more hugs safe for later",
  "You are always on my mind",
];

const LOCAL_KISSES_KEY = "memory_kiss_local_kisses_v1";
const LOCAL_MEMORIES_PREFIX = "memory_kiss_local_memories_v1:";

type KissRow = {
  id: string;
  sender_name: string;
  share_token?: string | null;
  created_at: string;
};

type MemoryRow = {
  id: string;
  kiss_id: string;
  photo_url: string;
  caption: string;
  created_at: string;
};

function fromKissRow(row: KissRow): Kiss {
  return {
    id: row.id,
    senderName: row.sender_name,
    shareToken: row.share_token || row.id,
    createdAt: row.created_at,
  };
}

function fromMemoryRow(row: MemoryRow): Memory {
  return {
    id: row.id,
    kissId: row.kiss_id,
    photoUrl: row.photo_url,
    caption: row.caption,
    createdAt: row.created_at,
  };
}

function loadLocalKisses(): Kiss[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KISSES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalKisses(kisses: Kiss[]) {
  localStorage.setItem(LOCAL_KISSES_KEY, JSON.stringify(kisses));
}

function normalizeLocalKiss(kiss: Kiss): Kiss {
  return {
    ...kiss,
    shareToken: kiss.shareToken || kiss.id,
  };
}

function localMemoriesKey(kissId: string) {
  return `${LOCAL_MEMORIES_PREFIX}${kissId}`;
}

function loadLocalMemories(kissId: string): Memory[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(localMemoriesKey(kissId)) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is Memory =>
        typeof m?.id === "string" &&
        typeof m?.kissId === "string" &&
        typeof m?.photoUrl === "string" &&
        (m.photoUrl.startsWith("data:image/") ||
          m.photoUrl.startsWith("/photos/") ||
          m.photoUrl.startsWith("http")) &&
        typeof m?.caption === "string" &&
        typeof m?.createdAt === "string",
    );
  } catch {
    return [];
  }
}

function saveLocalMemories(kissId: string, memories: Memory[]) {
  localStorage.setItem(localMemoriesKey(kissId), JSON.stringify(memories));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function isDemoKiss(id: string) {
  return id === DEMO_KISS_ID;
}

function createShareToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

export async function createKiss(senderName = "You"): Promise<Kiss> {
  if (supabase) {
    const shareToken = createShareToken();
    const { data, error } = await supabase
      .from("kisses")
      .insert({ sender_name: senderName, share_token: shareToken })
      .select("id, sender_name, share_token, created_at")
      .single();

    if (error) throw error;
    return fromKissRow(data as KissRow);
  }

  const kiss: Kiss = {
    id: crypto.randomUUID(),
    senderName,
    shareToken: createShareToken(),
    createdAt: new Date().toISOString(),
  };
  saveLocalKisses([kiss, ...loadLocalKisses()]);
  return kiss;
}

export async function listKisses(): Promise<Kiss[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("kisses")
      .select("id, sender_name, share_token, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as KissRow[]).map(fromKissRow);
  }

  return loadLocalKisses().map(normalizeLocalKiss);
}

export async function getKiss(id: string): Promise<Kiss | null> {
  if (isDemoKiss(id)) return DEMO_KISS;

  if (supabase) {
    const { data, error } = await supabase
      .from("kisses")
      .select("id, sender_name, share_token, created_at")
      .eq("id", id)
      .single();

    if (error) return null;
    return fromKissRow(data as KissRow);
  }

  return loadLocalKisses().find((kiss) => kiss.id === id) || null;
}

export async function getPublicKiss(shareToken: string): Promise<Kiss | null> {
  if (isDemoKiss(shareToken)) return DEMO_KISS;

  if (supabase) {
    const { data, error } = await supabase
      .rpc("get_public_kiss", { p_share_token: shareToken })
      .maybeSingle();

    if (error || !data) return null;
    return fromKissRow(data as KissRow);
  }

  return (
    loadLocalKisses()
      .map(normalizeLocalKiss)
      .find((kiss) => kiss.shareToken === shareToken || kiss.id === shareToken) || null
  );
}

export async function getMemories(kissId: string): Promise<Memory[]> {
  const localMemories = loadLocalMemories(kissId);
  if (isDemoKiss(kissId)) return [...localMemories, ...DEMO_MEMORIES];

  if (supabase) {
    const { data, error } = await supabase
      .from("memories")
      .select("id, kiss_id, photo_url, caption, created_at")
      .eq("kiss_id", kissId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as MemoryRow[]).map(fromMemoryRow);
  }

  return localMemories;
}

export async function getPublicMemories(shareToken: string): Promise<Memory[]> {
  if (isDemoKiss(shareToken)) return [...loadLocalMemories(shareToken), ...DEMO_MEMORIES];

  if (supabase) {
    const { data, error } = await supabase.rpc("get_public_memories", {
      p_share_token: shareToken,
    });

    if (error) throw error;
    return (data as MemoryRow[]).map(fromMemoryRow);
  }

  const kiss = await getPublicKiss(shareToken);
  return kiss ? loadLocalMemories(kiss.id) : [];
}

export async function addMemory(kissId: string, file: File, caption: string): Promise<Memory> {
  const finalCaption =
    caption.trim() || SURPRISE_CAPTIONS[Math.floor(Math.random() * SURPRISE_CAPTIONS.length)];

  if (supabase && !isDemoKiss(kissId)) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError || new Error("Please sign in first.");

    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userData.user.id}/${kissId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(path);
    const { data, error } = await supabase
      .from("memories")
      .insert({ kiss_id: kissId, photo_url: publicUrlData.publicUrl, caption: finalCaption })
      .select("id, kiss_id, photo_url, caption, created_at")
      .single();

    if (error) throw error;
    return fromMemoryRow(data as MemoryRow);
  }

  const memory: Memory = {
    id: crypto.randomUUID(),
    kissId,
    photoUrl: await fileToDataUrl(file),
    caption: finalCaption,
    createdAt: new Date().toISOString(),
  };
  saveLocalMemories(kissId, [memory, ...loadLocalMemories(kissId)]);
  return memory;
}

export async function deleteMemory(kissId: string, memoryId: string) {
  if (supabase && !isDemoKiss(kissId)) {
    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", memoryId)
      .eq("kiss_id", kissId);
    if (error) throw error;
    return;
  }

  saveLocalMemories(
    kissId,
    loadLocalMemories(kissId).filter((memory) => memory.id !== memoryId),
  );
}

export function pickRandomReveal(memories: Memory[]): Memory[] {
  const minCount = memories.length >= 2 ? 2 : 1;
  const count = Math.min(memories.length, minCount + Math.floor(Math.random() * 2));
  const shuffled = [...memories].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function randomClosing(): string {
  return CLOSING_MESSAGES[Math.floor(Math.random() * CLOSING_MESSAGES.length)];
}
