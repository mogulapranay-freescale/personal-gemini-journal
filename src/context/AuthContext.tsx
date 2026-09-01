import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          const now = new Date().toISOString();
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setProfile(data);
            // Update lastActiveAt
            await setDoc(
              userRef,
              { lastActiveAt: now },
              { merge: true }
            );
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || null,
              displayName: currentUser.displayName || 'Journaler',
              photoURL: currentUser.photoURL || null,
              createdAt: now,
              lastActiveAt: now,
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err: any) {
          console.error('Error synchronizing user profile in Firestore:', err);
          // If Firestore is still propagating rules, keep local profile
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || null,
            displayName: currentUser.displayName || 'Journaler',
            photoURL: currentUser.photoURL || null,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err?.message || 'Failed to sign in with Google. Please check your popup settings and try again.');
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign Out error:', err);
      setError(err?.message || 'Failed to sign out.');
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        signInWithGoogle,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
