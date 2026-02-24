import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { Platform } from 'react-native';
import { 
  User, 
  UserSubscription, 
  SubscriptionTier, 
  OWNER_EMAIL,
  SUBSCRIPTION_PLANS 
} from '../types/subscription';
import {
  auth,
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  type FirebaseUser,
} from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateSubscription: (subscription: Partial<UserSubscription>) => Promise<void>;
  hasFeature: (feature: 'unlimited_books' | 'ai' | 'cloud_sync' | 'family') => boolean;
  canAddBook: (currentBookCount: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@bookshelf_user';

// Default free subscription
const getDefaultSubscription = (): UserSubscription => ({
  tier: 'free',
  status: 'active',
  currentPeriodEnd: '',
  cancelAtPeriodEnd: false,
});

// Check if email is owner
const isOwnerEmail = (email: string): boolean => {
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
};

// Get owner subscription (free premium)
const getOwnerSubscription = (): UserSubscription => ({
  tier: 'bookworm',
  status: 'active',
  currentPeriodEnd: '2099-12-31',
  cancelAtPeriodEnd: false,
});

function getUserStorageKey(uid: string) {
  return `${USER_STORAGE_KEY}_${uid}`;
}

function buildUserFromFirebase(firebaseUser: FirebaseUser, subscription?: UserSubscription, createdAt?: string): User {
  const email = firebaseUser.email || '';
  const isOwner = isOwnerEmail(email);
  const finalSubscription = isOwner ? getOwnerSubscription() : (subscription || getDefaultSubscription());

  return {
    uid: firebaseUser.uid,
    email,
    displayName: firebaseUser.displayName || email.split('@')[0] || 'User',
    photoURL: firebaseUser.photoURL || undefined,
    subscription: finalSubscription,
    isOwner,
    createdAt: createdAt || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const key = getUserStorageKey(firebaseUser.uid);
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const storedData = JSON.parse(stored);
          const storedSubscription: UserSubscription | undefined = storedData?.subscription;
          const storedCreatedAt: string | undefined = storedData?.createdAt;
          setUser(buildUserFromFirebase(firebaseUser, storedSubscription, storedCreatedAt));
        } else {
          const newUser = buildUserFromFirebase(firebaseUser);
          await AsyncStorage.setItem(
            key,
            JSON.stringify({ subscription: newUser.subscription, createdAt: newUser.createdAt })
          );
          setUser(newUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(buildUserFromFirebase(firebaseUser));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmail(email, password);
    if (!credential?.user) {
      throw new Error('No user returned from Firebase sign-in.');
    }
    console.log('Signed in:', credential.user.uid);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const credential = await signUpWithEmail(email, password);
    if (!credential?.user) {
      throw new Error('No user returned from Firebase sign-up.');
    }
    console.log('Signed up:', credential.user.uid);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
  };

  const signInWithGoogle = async () => {
    if (Platform.OS !== 'web') {
      throw new Error('Google sign-in on native needs OAuth client IDs configured.');
    }
    const credential = await firebaseSignInWithGoogle();
    if (!credential?.user) {
      throw new Error('No user returned from Google sign-in.');
    }
    console.log('Google sign-in:', credential.user.uid);
  };

  const signOut = async () => {
    await firebaseSignOut();
  };

  const resetPassword = async (email: string) => {
    await firebaseResetPassword(email);
  };

  const updateSubscription = async (subscription: Partial<UserSubscription>) => {
    if (!user) return;
    
    const updatedUser: User = {
      ...user,
      subscription: { ...user.subscription, ...subscription },
    };

    const key = getUserStorageKey(user.uid);
    try {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({ subscription: updatedUser.subscription, createdAt: updatedUser.createdAt })
      );
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
    setUser(updatedUser);
  };

  const hasFeature = (feature: 'unlimited_books' | 'ai' | 'cloud_sync' | 'family'): boolean => {
    if (!user) return false;
    if (user.isOwner) return true;
    
    const plan = SUBSCRIPTION_PLANS[user.subscription.tier];
    
    switch (feature) {
      case 'unlimited_books':
        return plan.bookLimit === null;
      case 'ai':
        return plan.aiFeatures;
      case 'cloud_sync':
        return plan.cloudSync;
      case 'family':
        return plan.familySharing > 0;
      default:
        return false;
    }
  };

  const canAddBook = (currentBookCount: number): boolean => {
    if (!user) return currentBookCount < 50; // Default free limit for non-logged in
    if (user.isOwner) return true;
    
    const plan = SUBSCRIPTION_PLANS[user.subscription.tier];
    if (plan.bookLimit === null) return true;
    return currentBookCount < plan.bookLimit;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
      updateSubscription,
      hasFeature,
      canAddBook,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
