import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const SUBSCRIBERS_PATH = path.join(process.cwd(), "app", "data", "subscribers.json");

type SubscribersStore = {
  emails: string[];
  updatedAt: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  // Validación simple (MVP)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getSecret() {
  const secret = process.env.SUBSCRIPTION_SECRET;
  if (!secret) {
    throw new Error("Falta SUBSCRIPTION_SECRET en variables de entorno");
  }
  return secret;
}

export function makeUnsubscribeToken(email: string) {
  const secret = getSecret();
  return crypto.createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string) {
  try {
    const expected = makeUnsubscribeToken(email);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

async function readStore(): Promise<SubscribersStore> {
  try {
    const raw = await fs.readFile(SUBSCRIBERS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<SubscribersStore>;
    const emails = Array.isArray(parsed.emails) ? parsed.emails.filter((e) => typeof e === "string") : [];
    return {
      emails: Array.from(new Set(emails.map(normalizeEmail))).filter(isValidEmail),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return { emails: [], updatedAt: new Date().toISOString() };
  }
}

async function writeStore(store: SubscribersStore) {
  await fs.mkdir(path.dirname(SUBSCRIBERS_PATH), { recursive: true });
  await fs.writeFile(
    SUBSCRIBERS_PATH,
    JSON.stringify({ emails: store.emails, updatedAt: store.updatedAt }, null, 2),
    "utf-8"
  );
}

export async function listSubscribers() {
  const store = await readStore();
  return store.emails;
}

export async function addSubscriber(email: string) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) throw new Error("Email inválido");

  const store = await readStore();
  const set = new Set(store.emails.map(normalizeEmail));
  set.add(normalized);

  const next: SubscribersStore = {
    emails: Array.from(set).sort(),
    updatedAt: new Date().toISOString(),
  };
  await writeStore(next);
  return next.emails;
}

export async function removeSubscriber(email: string) {
  const normalized = normalizeEmail(email);
  const store = await readStore();
  const next: SubscribersStore = {
    emails: store.emails.map(normalizeEmail).filter((e) => e !== normalized),
    updatedAt: new Date().toISOString(),
  };
  await writeStore(next);
  return next.emails;
}
