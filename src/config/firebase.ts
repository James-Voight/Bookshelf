import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Firebase configuration - Replace with your own config from Firebase Console
const firebaseConfig = {
  apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: "bookshelf-8cc13.firebaseapp.com",
  projectId: "bookshelf-8cc13",
  storageBucket: "bookshelf-8cc13.firebasestorage.app",
  messagingSenderId: "100332364026",
  appId: "1:100332364026:web:baeb9f4c6548b4172aa943",
  measurementId: "G-5BNT8TG9D4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : (() => {
        try {
          const { getReactNativePersistence } = require('firebase/auth/react-native');
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
          });
        } catch (error) {
          // Falls back if auth was already initialized
          return getAuth(app);
        }
      })();
export const db = getFirestore(app);

// Auth functions
export const signInWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};

export const resetPassword = async (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export { onAuthStateChanged, type FirebaseUser };
