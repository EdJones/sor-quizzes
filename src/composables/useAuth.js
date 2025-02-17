import { ref } from 'vue';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const user = ref(null);

// Create a single instance of the auth state
export function useAuth() {
    // Set up auth state listener
    onAuthStateChanged(auth, (newUser) => {
        user.value = newUser;
    });

    return {
        user,
        isAuthenticated: () => !!user.value,
        getUserId: () => user.value?.uid,
    };
} 