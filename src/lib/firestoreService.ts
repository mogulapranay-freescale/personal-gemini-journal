import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase.ts';
import {
  Reflection,
  Experiment,
  CheckIn,
  NotificationSettings,
  WeeklyReview,
} from '../types.ts';

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(data: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = sanitizeForFirestore(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.filter(item => item !== undefined);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

// ================= REFLECTIONS =================

export async function saveReflection(userId: string, reflection: Reflection): Promise<void> {
  const path = `users/${userId}/reflections/${reflection.id}`;
  try {
    const sanitized = sanitizeForFirestore(reflection as unknown as Record<string, unknown>);
    await setDoc(doc(db, 'users', userId, 'reflections', reflection.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateReflection(userId: string, reflectionId: string, updates: Partial<Reflection>): Promise<void> {
  const path = `users/${userId}/reflections/${reflectionId}`;
  try {
    const sanitized = sanitizeForFirestore({ ...updates, updatedAt: new Date().toISOString() });
    await updateDoc(doc(db, 'users', userId, 'reflections', reflectionId), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReflection(userId: string, reflectionId: string): Promise<void> {
  const path = `users/${userId}/reflections/${reflectionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'reflections', reflectionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToReflections(
  userId: string,
  onUpdate: (reflections: Reflection[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/reflections`;
  try {
    const q = query(collection(db, 'users', userId, 'reflections'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => d.data() as Reflection);
        onUpdate(list);
      },
      error => {
        if (onError) onError(error instanceof Error ? error : new Error(String(error)));
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ================= EXPERIMENTS =================

export async function saveExperiment(userId: string, experiment: Experiment): Promise<void> {
  const path = `users/${userId}/experiments/${experiment.id}`;
  try {
    const sanitized = sanitizeForFirestore(experiment as unknown as Record<string, unknown>);
    await setDoc(doc(db, 'users', userId, 'experiments', experiment.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateExperiment(userId: string, experimentId: string, updates: Partial<Experiment>): Promise<void> {
  const path = `users/${userId}/experiments/${experimentId}`;
  try {
    const sanitized = sanitizeForFirestore({ ...updates, updatedAt: new Date().toISOString() });
    await updateDoc(doc(db, 'users', userId, 'experiments', experimentId), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToExperiments(
  userId: string,
  onUpdate: (experiments: Experiment[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/experiments`;
  try {
    const q = query(collection(db, 'users', userId, 'experiments'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => d.data() as Experiment);
        onUpdate(list);
      },
      error => {
        if (onError) onError(error instanceof Error ? error : new Error(String(error)));
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ================= CHECK-INS =================

export async function saveCheckIn(userId: string, checkIn: CheckIn): Promise<void> {
  const path = `users/${userId}/checkins/${checkIn.id}`;
  try {
    const sanitized = sanitizeForFirestore(checkIn as unknown as Record<string, unknown>);
    await setDoc(doc(db, 'users', userId, 'checkins', checkIn.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToCheckIns(
  userId: string,
  onUpdate: (checkIns: CheckIn[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/checkins`;
  try {
    const q = query(collection(db, 'users', userId, 'checkins'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => d.data() as CheckIn);
        onUpdate(list);
      },
      error => {
        if (onError) onError(error instanceof Error ? error : new Error(String(error)));
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ================= SETTINGS =================

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  guardianAlerts: true,
  preferredHour: 20, // 8 PM
  preferredMinute: 0,
  frequency: 'daily',
  quietHoursStart: 22, // 10 PM
  quietHoursEnd: 8, // 8 AM
  snoozedUntil: null,
  updatedAt: new Date().toISOString(),
};

export async function getSettings(userId: string): Promise<NotificationSettings> {
  const path = `users/${userId}/settings/notifications`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'settings', 'notifications'));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as NotificationSettings) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
  const path = `users/${userId}/settings/notifications`;
  try {
    const full = {
      ...DEFAULT_SETTINGS,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    const sanitized = sanitizeForFirestore(full as unknown as Record<string, unknown>);
    await setDoc(doc(db, 'users', userId, 'settings', 'notifications'), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ================= WEEKLY REVIEWS =================

export async function saveWeeklyReview(userId: string, review: WeeklyReview): Promise<void> {
  const path = `users/${userId}/weeklyReviews/${review.id}`;
  try {
    const sanitized = sanitizeForFirestore(review as unknown as Record<string, unknown>);
    await setDoc(doc(db, 'users', userId, 'weeklyReviews', review.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getWeeklyReviews(userId: string): Promise<WeeklyReview[]> {
  const path = `users/${userId}/weeklyReviews`;
  try {
    const q = query(collection(db, 'users', userId, 'weeklyReviews'), orderBy('generatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as WeeklyReview);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
