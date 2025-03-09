import { defineStore } from 'pinia';
import { auth, githubProvider, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAnonymous: (state) => state.user?.isAnonymous ?? true,
    canEdit: (state) => state.user && !state.user.isAnonymous,
  },

  actions: {
    async init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          this.user = user;
          this.loading = false;
          resolve(user);
        });
      });
    },

    async signInAnonymously() {
      try {
        if (!auth.currentUser) {
          const credential = await signInAnonymously(auth);
          this.user = credential.user;
          return credential.user;
        }
        return auth.currentUser;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async registerWithEmail(email, password, username) {
      this.loading = true;
      this.error = null;
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        this.user = result.user;
        await updateProfile(this.user, {
          displayName: username
        });

        // Add user profile to Firestore
        await setDoc(doc(db, 'users', this.user.uid), {
          username: username,
          email: email,
          createdAt: new Date()
        });
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loginWithEmail(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        this.user = result.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loginWithGoogle() {
      this.loading = true;
      this.error = null;
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        this.user = result.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async signInWithGithub() {
      this.loading = true;
      this.error = null;
      try {
        const result = await signInWithPopup(auth, githubProvider);
        this.user = result.user;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async signOut() {
      this.loading = true;
      this.error = null;
      try {
        await firebaseSignOut(auth);
        this.user = null;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    setUser(user) {
      this.user = user;
    }
  }
});
