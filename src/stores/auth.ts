// stores/auth.ts
import { defineStore } from 'pinia';
// Import new service functions and formatUser
import {
  login,
  googleSignIn,
  createInitialUser,
  updateUserPhoto,
  formatUser, // Make sure this is exported from services/auth.ts
} from '@/services/auth';
import apiClient from '@/services/AxiosClient';
import type { User } from '@/types';
import { auth, storage } from '@/firebase/firebase'; // Import Firebase storage
import { ref as firebaseStorageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // For image upload
import type { User as FirebaseUser } from 'firebase/auth'; // Import Firebase User type

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
      const user = await login(email, password); // login service now returns formatted User
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        this.setAuth(user, idToken);
      } else {
        console.error("Login successful but auth.currentUser is null.");
        throw new Error("Could not finalize login session.");
      }
    },

    // New comprehensive sign-up action
    async signUpWithProfileImage(
      email: string,
      password: string,
      displayName: string,
      imageFile: File | null // Accept the File object
    ) {
      // Step 1: Create the user with Firebase Auth and set initial display name
      const firebaseUser: FirebaseUser = await createInitialUser(email, password, displayName);

      let finalPhotoURL: string | null = null;

      // Step 2: If an image file is provided, upload it to Firebase Storage
      if (imageFile) {
        // Use UID in the path for better organization and uniqueness
        const imagePath = `profileImages/${firebaseUser.uid}_${Date.now()}_${imageFile.name}`;
        const imageRef = firebaseStorageRef(storage, imagePath);
        await uploadBytes(imageRef, imageFile);
        finalPhotoURL = await getDownloadURL(imageRef);

        // Step 3: Update the user's profile with the new photoURL
        await updateUserPhoto(firebaseUser, finalPhotoURL);
      }

      // Step 4: Get the ID token for the authenticated user
      // auth.currentUser should be the same as firebaseUser at this point
      if (!auth.currentUser) {
        console.error('Firebase user not available after profile update to get ID token.');
        throw new Error('Sign up processing error: current user not found.');
      }
      const idToken = await auth.currentUser.getIdToken();

      // Step 5: Format the Firebase user to your app's User type
      // (firebaseUser object should have been updated in memory by updateProfile)
      const appUser = formatUser(auth.currentUser);

      // Step 6: Set the authentication state in the store
      this.setAuth(appUser, idToken);
    },

    async loginWithGoogle() {
      const user = await googleSignIn(); // googleSignIn service returns formatted User
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        this.setAuth(user, idToken);
      } else {
        console.error("Google sign-in successful but auth.currentUser is null.");
        throw new Error("Could not finalize Google login session.");
      }
    },

    setAuth(user: User, token: string) {
      this.user = user;
      this.token = token;
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    logout() {
      // It's also good practice to sign the user out from Firebase here
      auth.signOut().then(() => {
        this.token = null;
        this.user = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
        // Optionally redirect or perform other cleanup
      }).catch(error => {
        console.error("Error signing out from Firebase:", error);
        // Still clear local state as a fallback
        this.token = null;
        this.user = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
      });
    },

    checkAuthStatus() {
      const token = localStorage.getItem('access_token');
      const userString = localStorage.getItem('user');
      if (token && userString) {
        try {
          const user = JSON.parse(userString);
          this.token = token;
          this.user = user;
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          this.logout(); // Clear invalid state
        }
      }
    }
  }
});
