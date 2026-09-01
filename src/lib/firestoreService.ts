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
import { db, auth } from './firebase';
import { JournalReflection, ChatMessage } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): Error {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

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
  const path = `users/${userId}/reflections/${reflection.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...reflection,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, 'users', userId, 'reflections', reflection.id);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    throw handleFirestoreError(error, OperationType.WRITE, path);
  }
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
  const path = `users/${userId}/reflections/${reflectionId}/messages/${message.id}`;
  try {
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
  } catch (error) {
    throw handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a journal reflection
 */
export async function deleteJournalReflection(
  userId: string,
  reflectionId: string
): Promise<void> {
  if (!userId || !reflectionId) throw new Error('User ID and Reflection ID are required');
  const path = `users/${userId}/reflections/${reflectionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'reflections', reflectionId);
    await deleteDoc(docRef);
  } catch (error) {
    throw handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches all reflections for the authenticated user
 */
export async function fetchUserReflections(userId: string): Promise<JournalReflection[]> {
  if (!userId) return [];
  const path = `users/${userId}/reflections`;
  try {
    const collRef = collection(db, 'users', userId, 'reflections');
    const q = query(collRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const list: JournalReflection[] = [];
    snap.forEach((d) => {
      list.push(d.data() as JournalReflection);
    });
    return list;
  } catch (error) {
    throw handleFirestoreError(error, OperationType.GET, path);
  }
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
  const path = `users/${userId}/reflections`;
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
      const wrappedError = handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(wrappedError);
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
  const path = `users/${userId}/reflections/${reflectionId}/messages`;
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
      const wrappedError = handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(wrappedError);
    }
  );
}

/**
 * Saves current Growth Experiment for the authenticated user
 * /users/{userId}/growth/current
 */
export async function saveGrowthExperiment(
  userId: string,
  experiment: import('../types').GrowthExperiment
): Promise<void> {
  if (!userId) throw new Error('User ID is required');
  const path = `users/${userId}/growth/current`;
  try {
    const sanitized = sanitizeForFirestore({
      ...experiment,
      updatedAt: new Date().toISOString(),
    });
    const docRef = doc(db, 'users', userId, 'growth', 'current');
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    throw handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches current Growth Experiment
 */
export async function fetchGrowthExperiment(
  userId: string
): Promise<import('../types').GrowthExperiment | null> {
  if (!userId) return null;
  const path = `users/${userId}/growth/current`;
  try {
    const docRef = doc(db, 'users', userId, 'growth', 'current');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as import('../types').GrowthExperiment;
    }
    return null;
  } catch (error) {
    throw handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribes to realtime updates of user's active Growth Experiment
 */
export function subscribeGrowthExperiment(
  userId: string,
  callback: (experiment: import('../types').GrowthExperiment | null) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};
  const path = `users/${userId}/growth/current`;
  const docRef = doc(db, 'users', userId, 'growth', 'current');

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as import('../types').GrowthExperiment);
      } else {
        callback(null);
      }
    },
    (err) => {
      const wrappedError = handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(wrappedError);
    }
  );
}

/**
 * Saves user notification & reminder settings
 * /users/{userId}/settings/notifications
 */
export async function saveNotificationSettings(
  userId: string,
  settings: import('../types').NotificationSettings
): Promise<void> {
  if (!userId) throw new Error('User ID is required');
  const path = `users/${userId}/settings/notifications`;
  try {
    const sanitized = sanitizeForFirestore(settings);
    const docRef = doc(db, 'users', userId, 'settings', 'notifications');
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    throw handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches user notification & reminder settings
 */
export async function fetchNotificationSettings(
  userId: string
): Promise<import('../types').NotificationSettings | null> {
  if (!userId) return null;
  const path = `users/${userId}/settings/notifications`;
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'notifications');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as import('../types').NotificationSettings;
    }
    return null;
  } catch (error) {
    throw handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Subscribes to realtime updates of notification settings
 */
export function subscribeNotificationSettings(
  userId: string,
  callback: (settings: import('../types').NotificationSettings | null) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};
  const path = `users/${userId}/settings/notifications`;
  const docRef = doc(db, 'users', userId, 'settings', 'notifications');

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as import('../types').NotificationSettings);
      } else {
        callback(null);
      }
    },
    (err) => {
      const wrappedError = handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(wrappedError);
    }
  );
}

/**
 * Saves a Growth Check-In document
 * /users/{userId}/checkins/{checkinId}
 */
export async function saveGrowthCheckIn(
  userId: string,
  checkIn: import('../types').GrowthCheckIn
): Promise<void> {
  if (!userId || !checkIn.id) throw new Error('User ID and CheckIn ID are required');
  const path = `users/${userId}/checkins/${checkIn.id}`;
  try {
    const sanitized = sanitizeForFirestore({
      ...checkIn,
      userId,
      createdAt: checkIn.createdAt || new Date().toISOString(),
    });
    const docRef = doc(db, 'users', userId, 'checkins', checkIn.id);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    throw handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches user's past Growth Check-Ins
 */
export async function fetchUserCheckIns(
  userId: string
): Promise<import('../types').GrowthCheckIn[]> {
  if (!userId) return [];
  const path = `users/${userId}/checkins`;
  try {
    const collRef = collection(db, 'users', userId, 'checkins');
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const list: import('../types').GrowthCheckIn[] = [];
    snap.forEach((d) => {
      list.push(d.data() as import('../types').GrowthCheckIn);
    });
    return list;
  } catch (error) {
    throw handleFirestoreError(error, OperationType.GET, path);
  }
}

