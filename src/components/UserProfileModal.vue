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
                <div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">Username:</span>
                    <span class="text-lg font-medium text-gray-900 dark:text-white">{{ authStore.user.displayName
                        }}</span>
                </div>
                <div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                    <span class="text-lg font-medium text-gray-900 dark:text-white">{{ authStore.user.email }}</span>
                </div>
                <!-- Add more user information as needed -->
            </div>
        </div>
    </div>
</template>

<script setup>
import { useAuthStore } from '../stores/authStore';
import { ref } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close']);

const authStore = useAuthStore();
</script>

<style scoped>
/* Add any additional styling here */
</style>