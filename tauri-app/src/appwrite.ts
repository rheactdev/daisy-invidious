import { Client, Account, Databases, ID, Query, Models, Permission, Role } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = "daisytube";
export const SUBSCRIPTIONS_COLLECTION = "subscriptions";

export interface CloudSubscription extends Models.Document {
  channelId: string;
  channelName: string;
  channelThumbnail: string;
}

export async function getSession() {
  try {
    return await account.get();
  } catch (e: unknown) {
    // 401 is expected when no session exists — suppress it
    if (e instanceof Error && 'code' in e && (e as { code: number }).code === 401) {
      return null;
    }
    // Rethrow unexpected errors
    console.warn("Session check failed:", e);
    return null;
  }
}

export async function login(email: string, password: string) {
  await account.createEmailPasswordSession(email, password);
  return account.get();
}

export async function signup(email: string, password: string, name: string) {
  await account.create(ID.unique(), email, password, name);
  return login(email, password);
}

export async function logout() {
  await account.deleteSession("current");
}

export async function getCloudSubscriptions(): Promise<CloudSubscription[]> {
  const res = await databases.listDocuments<CloudSubscription>(
    DATABASE_ID,
    SUBSCRIPTIONS_COLLECTION,
    [Query.limit(500)]
  );
  return res.documents;
}

export async function addCloudSubscription(
  channelId: string,
  channelName: string,
  channelThumbnail: string,
  userId: string
) {
  return databases.createDocument(
    DATABASE_ID,
    SUBSCRIPTIONS_COLLECTION,
    ID.unique(),
    { channelId, channelName, channelThumbnail },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]
  );
}

export async function deleteCloudSubscription(documentId: string) {
  return databases.deleteDocument(
    DATABASE_ID,
    SUBSCRIPTIONS_COLLECTION,
    documentId
  );
}
