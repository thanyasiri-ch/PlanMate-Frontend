import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
  type User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/firebase/firebase';
import type { User } from '@/types';

const provider = new GoogleAuthProvider();

// Converts Firebase user to your app's user shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatUser = (firebaseUser: FirebaseUser | any): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Guest',
    image: firebaseUser.photoURL || 'https://www.example.com/default-avatar.png',
  };
};

// Step 1: Create user account with initial display name (photoURL will be set later)
export async function createInitialUser(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Set display name and image
  await updateProfile(userCredential.user, {
    displayName,
    photoURL: null,
  });

  return userCredential.user;
}

// Step 2: Update user's photoURL (and optionally displayName if needed again)
export async function updateUserPhoto(
  user: FirebaseUser,
  photoURL: string
): Promise<void> {
  await updateProfile(user, {
    photoURL,
  });
}

// Log in with email and password
export const login = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return formatUser(userCredential.user);
};

// Google sign-in
export const googleSignIn = async (): Promise<User> => {
  const result = await signInWithPopup(auth, provider);
  return formatUser(result.user);
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe(); // Unsubscribe to prevent memory leaks
        resolve(user);
      },
      reject // Handle potential errors
    );
  });
};
