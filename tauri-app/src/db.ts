import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase, removeRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedKeyEncryptionCryptoJsStorage } from "rxdb/plugins/encryption-crypto-js";

if (import.meta.env.DEV) {
  // Only load heavy dev plugins during development
  import("rxdb/plugins/dev-mode").then(({ RxDBDevModePlugin }) => {
    addRxPlugin(RxDBDevModePlugin);
  });
}

const DB_NAME = "daisy_invidious_db";
export interface Subscription {
  id: string;
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  isDeleted: boolean;
}

const subscriptionSchema = {
  version: 0,
  primaryKey: "id",
  type: "object" as const,
  properties: {
    id: { type: "string", maxLength: 100 },
    channelId: { type: "string" },
    channelName: { type: "string" },
    channelThumbnail: { type: "string" },
    isDeleted: { type: "boolean" },
  },
  required: ["id", "channelId", "channelName", "channelThumbnail", "isDeleted"],
  encrypted: ["channelId", "channelName", "channelThumbnail"],
};

export type SubscriptionCollection = RxCollection<Subscription>;

type DatabaseCollections = {
  subscriptions: SubscriptionCollection;
};

async function getStorage() {
  const baseStorage = getRxStorageDexie();
  if (import.meta.env.DEV) {
    // AJV validator only in dev — catches schema errors early without prod overhead
    const { wrappedValidateAjvStorage } = await import("rxdb/plugins/validate-ajv");
    return wrappedKeyEncryptionCryptoJsStorage({
      storage: wrappedValidateAjvStorage({ storage: baseStorage }),
    });
  }
  return wrappedKeyEncryptionCryptoJsStorage({ storage: baseStorage });
}

async function createDb(password: string): Promise<RxDatabase<DatabaseCollections>> {
  const storage = await getStorage();
  try {
    const db = await createRxDatabase<DatabaseCollections>({
      name: DB_NAME,
      storage,
      password,
    });
    await db.addCollections({
      subscriptions: { schema: subscriptionSchema },
    });
    return db;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("different password")) {
      throw new Error("Incorrect password for the database.");
    }
    throw e;
  }
}

let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;

export function initDatabase(password: string): Promise<RxDatabase<DatabaseCollections>> {
  if (!dbPromise) {
    dbPromise = createDb(password).catch((e) => {
      // Clear the promise on failure so we can try again
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

export function getDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (!dbPromise) {
    throw new Error("Database not initialized. Call initDatabase first.");
  }
  return dbPromise;
}

export async function checkDbExists(): Promise<boolean> {
  if (!window.indexedDB || !window.indexedDB.databases) {
    return false;
  }
  const dbs = await window.indexedDB.databases();
  return dbs.some((db) => db.name && db.name.includes(DB_NAME));
}

export async function resetDatabase(): Promise<void> {
  const storage = await getStorage();
  await removeRxDatabase(DB_NAME, storage);
  dbPromise = null;
}
