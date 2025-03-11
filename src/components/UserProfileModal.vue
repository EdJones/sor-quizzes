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
                    <div class="flex items-center gap-2">
                        <template v-if="isEditing">
                            <input v-model="editedUsername" type="text"
                                class="flex-1 px-3 py-2 border rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter username" />
                            <button @click="saveUsername"
                                class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                :disabled="isSaving">
                                <span v-if="isSaving">Saving...</span>
                                <span v-else>Save</span>
                            </button>
                            <button @click="cancelEdit"
                                class="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                :disabled="isSaving">
                                Cancel
                            </button>
                        </template>
                        <template v-else>
                            <div class="text-lg font-medium text-gray-900 dark:text-white flex-1">
                                {{ username }}
                            </div>
                            <button @click="startEdit" class="text-blue-500 hover:text-blue-600 transition-colors"
                                title="Edit username">
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </template>
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
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
const editedUsername = ref('');
const isEditing = ref(false);
const isSaving = ref(false);

const startEdit = () => {
    editedUsername.value = username.value;
    isEditing.value = true;
};

const cancelEdit = () => {
    editedUsername.value = username.value;
    isEditing.value = false;
};

const saveUsername = async () => {
    if (!authStore.user?.uid || !editedUsername.value.trim()) return;

    isSaving.value = true;
    try {
        await authStore.updateUsername(editedUsername.value.trim());
        username.value = editedUsername.value.trim();
        isEditing.value = false;
    } catch (error) {
        console.error('Error updating username:', error);
        // Show error message to the user
        alert('Failed to update username. Please try again.');
    } finally {
        isSaving.value = false;
    }
};

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