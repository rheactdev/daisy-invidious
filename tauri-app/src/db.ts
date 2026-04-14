import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase, removeRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { wrappedKeyEncryptionCryptoJsStorage } from "rxdb/plugins/encryption-crypto-js";

addRxPlugin(RxDBDevModePlugin);

const DB_NAME = "daisy_invidious_db";
const DB_PASSWORD = import.meta.env.VITE_RXDB_PASSWORD;

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

const storage = wrappedKeyEncryptionCryptoJsStorage({
  storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
});

async function createDb(): Promise<RxDatabase<DatabaseCollections>> {
  try {
    const db = await createRxDatabase<DatabaseCollections>({
      name: DB_NAME,
      storage,
      password: DB_PASSWORD,
      ignoreDuplicate: true,
    });
    await db.addCollections({
      subscriptions: { schema: subscriptionSchema },
    });
    return db;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("different password")) {
      console.warn("RxDB password mismatch — removing old database and recreating");
      await removeRxDatabase(DB_NAME, storage);
      const db = await createRxDatabase<DatabaseCollections>({
        name: DB_NAME,
        storage,
        password: DB_PASSWORD,
        ignoreDuplicate: true,
      });
      await db.addCollections({
        subscriptions: { schema: subscriptionSchema },
      });
      return db;
    }
    throw e;
  }
}

let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;

export function getDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (!dbPromise) {
    dbPromise = createDb();
  }
  return dbPromise;
}
