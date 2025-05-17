import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from '@/firebase/firebase'
import apiClient from '@/services/AxiosClient' // Axios instance with interceptor

const provider = new GoogleAuthProvider()

// Common helper to store token and trigger backend user-saving
const postLoginSetup = async (user: any) => {
  const idToken = await user.getIdToken()
  localStorage.setItem('access_token', idToken)

  try {
    await apiClient.get('/ping') // `/ping` or any lightweight endpoint
  } catch (error) {
    console.warn('Post-login backend sync failed:', error.message)
  }

  return { user, idToken }
}

// Google Sign-Up (same as sign-in)
export const googleSignUp = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    return await postLoginSetup(result.user)
  } catch (error) {
    console.error('Error during Google sign-up: ', error.message)
    throw error
  }
}

// Google Sign-In
export const googleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const { idToken } = await postLoginSetup(user)

    return {
      user,
      displayName: user.displayName,
      photoURL: user.photoURL,
      idToken,
    }
  } catch (error) {
    console.error('Error during Google login: ', error.message)
    throw error
  }
}

// Email/Password Sign-Up
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return await postLoginSetup(userCredential.user)
  } catch (error) {
    throw new Error('Error signing up: ' + error.message)
  }
}

// Email/Password Sign-In
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return await postLoginSetup(userCredential.user)
  } catch (error) {
    throw new Error('Error signing in: ' + error.message)
  }
}
