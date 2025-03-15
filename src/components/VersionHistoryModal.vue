<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
        @click.self="handleClose">
        <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full border border-gray-200 dark:border-gray-700">
            <button @click="handleClose"
                class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-xl transition-colors"
                aria-label="Close">
                ×
            </button>

            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Version History</h3>

            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-4">
                <div
                    class="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full mx-auto mb-2">
                </div>
                <p class="text-gray-600 dark:text-gray-400">Loading version history...</p>
            </div>

            <!-- Version List -->
            <div v-else-if="versions.length > 0" class="space-y-4">
                <div v-for="(version, index) in versions" :key="index"
                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1">
                            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {{ version.timestamp?.toDate?.()?.toLocaleString() || 'Unknown date' }}
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {{ version.userEmail }}
                            </p>
                        </div>
                    </div>
                    <div v-if="version.versionMessage"
                        class="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
                        <p class="text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">Changes made:</p>
                        <p class="whitespace-pre-wrap">{{ version.versionMessage }}</p>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <span
                            class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Version {{ versions.length - index }}
                        </span>
                        <span v-if="version.changes?.before"
                            class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Has changes
                        </span>
                    </div>
                </div>
            </div>

            <!-- No Versions -->
            <div v-else class="text-center py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No version history</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    This quiz item doesn't have any recorded changes yet.
                </p>
            </div>

            <!-- Error State -->
            <div v-if="error" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                            Error loading version history
                        </h3>
                        <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                            {{ error }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    quizItemId: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['close']);

const versions = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchVersions = async () => {
    if (!props.quizItemId) {
        console.log('No quizItemId provided');
        return;
    }

    isLoading.value = true;
    error.value = null;

    try {
        console.log('Fetching versions for quizItemId:', props.quizItemId);
        const editHistoryRef = collection(db, 'quizEditHistory');
        const q = query(
            editHistoryRef,
            where('quizItemId', '==', props.quizItemId),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        console.log('Query snapshot size:', querySnapshot.size);

        versions.value = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Format the version message if it exists
                versionMessage: data.versionMessage ? data.versionMessage.trim() : 'No description provided'
            };
        });

        if (versions.value.length === 0) {
            console.log('No versions found for quiz item');
        }
    } catch (error) {
        console.error('Error fetching version history:', error);
        error.value = error.message || 'Failed to load version history';
    } finally {
        isLoading.value = false;
    }
};

const handleClose = () => {
    emit('close');
};

onMounted(() => {
    if (props.show && props.quizItemId) {
        fetchVersions();
    }
});

// Add watch effect for show prop
watch(() => props.show, (newValue) => {
    if (newValue && props.quizItemId) {
        fetchVersions();
    }
});
</script>

<style scoped>
/* Ensure modal is above everything */
.fixed {
    z-index: 9999 !important;
}

/* Add transition for smooth show/hide */
.fixed {
    transition: opacity 0.2s ease-in-out;
}

/* Ensure the modal content is above the overlay */
.relative {
    z-index: 10000;
}
</style>