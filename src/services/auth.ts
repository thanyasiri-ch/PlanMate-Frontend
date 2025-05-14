import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '@/firebase/firebase' // Import your Firebase instance

const provider = new GoogleAuthProvider()

// Google auto-registers the user on first sign-in
export const googleSignUp = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    return user
  } catch (error) {
    console.error('Error during Google sign-up: ', error.message)
    throw error
  }
}

// Sign-In with Google
export const googleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    return user
  } catch (error) {
    console.error('Error during Google login: ', error.message)
    throw error
  }
}

// Create user with email and password
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw new Error('Error signing up: ' + error.message)
  }
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw new Error('Error signing in: ' + error.message)
  }
}
