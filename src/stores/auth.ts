/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineStore } from 'pinia'
import {
  login,
  googleSignIn,
  updateUserPhoto,
  formatUser, // Make sure this is exported from services/auth.ts
} from '@/services/auth'
import apiClient from '@/services/AxiosClient'
import type { User } from '@/types'
import { auth, storage } from '@/firebase/firebase' // Import Firebase storage
import { ref as firebaseStorageRef, uploadBytes, getDownloadURL } from 'firebase/storage' // For image upload
import { updateProfile, type User as FirebaseUser } from 'firebase/auth' // Import Firebase User type

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as User | null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    displayName: (state) => state.user?.displayName || '',
    image: (state) => state.user?.image || 'https://www.example.com/default-avatar.png',
  },
  actions: {
    async loginWithEmail(email: string, password: string) {
      const user = await login(email, password) // login service now returns formatted User
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken()
        this.setAuth(user, idToken)
        await apiClient.get('/ping')
      } else {
        console.error('Login successful but auth.currentUser is null.')
        throw new Error('Could not finalize login session.')
      }
    },

    // New comprehensive sign-up action
    async signUpWithProfileImage(
      email: string,
      password: string,
      displayName: string,
      imageFile: File | null, // Accept the File object
    ) {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User was not properly created or authenticated.')
      }

      let finalPhotoURL: string | null = null

      if (imageFile) {
        // Use UID in the path for better organization and uniqueness
        const imagePath = `profileImages/${currentUser.uid}_${Date.now()}_${imageFile.name}`
        const imageRef = firebaseStorageRef(storage, imagePath)
        await uploadBytes(imageRef, imageFile)
        finalPhotoURL = await getDownloadURL(imageRef)

        // Step 3: Update the user's profile with the new photoURL
        await updateUserPhoto(currentUser, finalPhotoURL)
      }

      // Step 4: Get the ID token for the authenticated user
      // auth.currentUser should be the same as firebaseUser at this point
      if (!auth.currentUser) {
        console.error('Firebase user not available after profile update to get ID token.')
        throw new Error('Sign up processing error: current user not found.')
      }
      const idToken = await auth.currentUser.getIdToken()

      // Step 5: Format the Firebase user to your app's User type
      // (firebaseUser object should have been updated in memory by updateProfile)
      const appUser = formatUser(auth.currentUser)

      // Step 6: Set the authentication state in the store
      this.setAuth(appUser, idToken)
      await apiClient.get('/ping')
    },

    async loginWithGoogle() {
      const user = await googleSignIn() // googleSignIn service returns formatted User
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken()
        this.setAuth(user, idToken)
        await apiClient.get('/ping')
      } else {
        console.error('Google sign-in successful but auth.currentUser is null.')
        throw new Error('Could not finalize Google login session.')
      }
    },

    async updateUserProfile(newDisplayName: string, newImageFile: File | null) {
      // 1. Get the current authenticated Firebase user.
      const firebaseUser = auth.currentUser
      if (!firebaseUser) {
        throw new Error("No user is currently logged in to update.")
      }

      let newPhotoURL: string | null = null

      // 2. Handle the image upload to Firebase Storage (if a new file is provided).
      if (newImageFile) {
        const imagePath = `profileImages/${firebaseUser.uid}_${Date.now()}_${newImageFile.name}`
        const imageRef = firebaseStorageRef(storage, imagePath)

        // Upload the file and get its public URL
        await uploadBytes(imageRef, newImageFile)
        newPhotoURL = await getDownloadURL(imageRef)
      }

      // 3. Prepare the payload for Firebase Auth updateProfile.
      // This object only contains the fields that are actually changing.
      const updates: { displayName?: string; photoURL?: string } = {}
      if (newDisplayName && newDisplayName !== this.displayName) {
        updates.displayName = newDisplayName
      }
      if (newPhotoURL) {
        updates.photoURL = newPhotoURL
      }

      // 4. Call Firebase Auth's updateProfile function if there's something to update.
      if (Object.keys(updates).length > 0) {
        await updateProfile(firebaseUser, updates)
      }

      // 5. Update the local state (Pinia and localStorage) to reflect the changes immediately.
      // We re-format the user from the (now updated) auth.currentUser.
      const updatedAppUser = formatUser(auth.currentUser)

      // Update the user object in the store and in localStorage.
      this.user = updatedAppUser
      localStorage.setItem('user', JSON.stringify(updatedAppUser))
    },

    setAuth(user: User, token: string) {
      this.user = user
      this.token = token
      localStorage.setItem('access_token', token)
      localStorage.setItem('user', JSON.stringify(user))
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },

    async logout() {
      try {
        const token = this.token
        if (token) {
          // Call backend to revoke the refresh tokens
          await apiClient.post('/logout', null, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        }

        // Sign out from Firebase
        await auth.signOut()

        // Clear state and local storage
        this.token = null
        this.user = null
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        delete apiClient.defaults.headers.common['Authorization']
      } catch (error) {
        console.error('Logout failed:', error)
      }
    },
    checkAuthStatus() {
      const token = localStorage.getItem('access_token')
      const userString = localStorage.getItem('user')
      if (token && userString) {
        try {
          const user = JSON.parse(userString)
          this.token = token
          this.user = user
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch (error) {
          console.error('Error parsing user from localStorage:', error)
          this.logout() // Clear invalid state
        }
      }
    },
  },
})
