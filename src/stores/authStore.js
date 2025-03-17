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
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
    error: null,
    isAdminUser: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAnonymous: (state) => state.user?.isAnonymous ?? true,
    canEdit: (state) => state.user && !state.user.isAnonymous,
    isAdmin: (state) => state.isAdminUser
  },

  actions: {
    async init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.user = user;
          if (user && !user.isAnonymous) {
            // Check admin status
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            this.isAdminUser = userDoc.exists() && userDoc.data().isAdmin === true;
          } else {
            this.isAdminUser = false;
          }
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
    },

    async updateUsername(username) {
      this.loading = true;
      this.error = null;
      try {
        if (!this.user) throw new Error('No user logged in');

        // Update Firebase Auth profile
        await updateProfile(this.user, {
          displayName: username
        });

        // Update or create Firestore user document
        const userRef = doc(db, 'users', this.user.uid);
        await setDoc(userRef, {
          username: username,
          email: this.user.email,
          updatedAt: new Date(),
          createdAt: new Date() // Only used if document is being created
        }, { merge: true }); // Use merge to preserve existing fields if document exists

        // Update local state
        this.user = auth.currentUser;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
