import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalReflection, ChatMessage } from '../types';

/**
 * Strips undefined properties recursively so Firestore does not reject writes
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (value === undefined ? null : value))
  );
}

/**
 * Creates or updates a journal reflection document in the user's isolated subcollection:
 * /users/{userId}/reflections/{reflectionId}
 */
export async function saveJournalReflection(
  userId: string,
  reflection: JournalReflection
): Promise<void> {
  if (!userId) throw new Error('User ID is required to save reflection');
  const sanitized = sanitizeForFirestore({
    ...reflection,
    updatedAt: new Date().toISOString(),
  });
  const docRef = doc(db, 'users', userId, 'reflections', reflection.id);
  await setDoc(docRef, sanitized, { merge: true });
}

/**
 * Saves a multi-turn chat message within a reflection:
 * /users/{userId}/reflections/{reflectionId}/messages/{messageId}
 */
export async function saveReflectionMessage(
  userId: string,
  reflectionId: string,
  message: ChatMessage
): Promise<void> {
  if (!userId || !reflectionId) throw new Error('User ID and Reflection ID are required');
  const sanitized = sanitizeForFirestore(message);
  const msgRef = doc(
    db,
    'users',
    userId,
    'reflections',
    reflectionId,
    'messages',
    message.id
  );
  await setDoc(msgRef, sanitized);
}

/**
 * Deletes a journal reflection
 */
export async function deleteJournalReflection(
  userId: string,
  reflectionId: string
): Promise<void> {
  if (!userId || !reflectionId) throw new Error('User ID and Reflection ID are required');
  const docRef = doc(db, 'users', userId, 'reflections', reflectionId);
  await deleteDoc(docRef);
}

/**
 * Fetches all reflections for the authenticated user
 */
export async function fetchUserReflections(userId: string): Promise<JournalReflection[]> {
  if (!userId) return [];
  const collRef = collection(db, 'users', userId, 'reflections');
  const q = query(collRef, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  const list: JournalReflection[] = [];
  snap.forEach((d) => {
    list.push(d.data() as JournalReflection);
  });
  return list;
}

/**
 * Subscribes to realtime updates of reflections for the current authenticated user
 */
export function subscribeUserReflections(
  userId: string,
  callback: (reflections: JournalReflection[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};
  const collRef = collection(db, 'users', userId, 'reflections');
  const q = query(collRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const results: JournalReflection[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data() as JournalReflection);
      });
      callback(results);
    },
    (err) => {
      console.error('Realtime reflections subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to realtime chat messages in a specific reflection
 */
export function subscribeReflectionMessages(
  userId: string,
  reflectionId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId || !reflectionId) return () => {};
  const collRef = collection(
    db,
    'users',
    userId,
    'reflections',
    reflectionId,
    'messages'
  );
  const q = query(collRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const results: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        results.push(docSnap.data() as ChatMessage);
      });
      callback(results);
    },
    (err) => {
      console.error('Realtime messages subscription error:', err);
      if (onError) onError(err);
    }
  );
}
