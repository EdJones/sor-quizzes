<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">User Profile</h2>
                <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- User Information -->
            <div class="space-y-4">
                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-500 dark:text-gray-400">Username</label>
                    <div class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ username }}
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-500 dark:text-gray-400">Email</label>
                    <div class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ authStore.user?.email || 'Not available' }}
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-500 dark:text-gray-400">Account Type</label>
                    <div class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ authStore.user?.isAnonymous ? 'Anonymous' : 'Registered User' }}
                    </div>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-500 dark:text-gray-400">Login Provider</label>
                    <div class="text-lg font-medium text-gray-900 dark:text-white">
                        {{ authStore.user?.providerData[0]?.providerId || 'Email/Password' }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close']);
const authStore = useAuthStore();
const username = ref('');

// Fetch the username from Firestore when the component is mounted
onMounted(async () => {
    if (authStore.user?.uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', authStore.user.uid));
            if (userDoc.exists()) {
                username.value = userDoc.data().username || 'Not set';
            } else {
                username.value = 'Not set';
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            username.value = 'Error loading username';
        }
    }
});
</script>