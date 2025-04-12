<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
        @click.self="handleClose">
        <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-2xl w-full max-h-[80vh] border border-gray-200 dark:border-gray-700">
            <button @click="handleClose"
                class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-xl transition-colors"
                aria-label="Close">
                ×
            </button>

            <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Version History</h3>

            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-2">
                <div
                    class="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full mx-auto mb-1">
                </div>
                <p class="text-gray-600 dark:text-gray-400 text-sm">Loading version history...</p>
            </div>

            <!-- Version List -->
            <div v-else-if="versions.length > 0" class="space-y-2 max-h-[calc(80vh-8rem)] overflow-y-auto pr-2">
                <div v-for="(version, index) in versions" :key="index"
                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {{ version.timestamp.toLocaleString(undefined, { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) }}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {{ version.userEmail }}
                            </p>
                        </div>
                    </div>
                    <div v-if="version.versionMessage"
                        class="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
                        <p class="flex items-left gap-1 text-xs font-medium mb-0.5 text-gray-500 dark:text-gray-400">
                            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Version commit message:
                        </p>
                        <p class="flex items-left gap-1 text-sm whitespace-pre-wrap">{{ version.versionMessage }}</p>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1">
                        <span
                            class="px-1.5 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Version {{ version.versionNumber }}
                        </span>
                        <!-- Add status badge -->
                        <span v-if="version.status" :class="[
                            'px-1.5 py-0.5 text-xs rounded-full',
                            {
                                'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200': version.status === 'draft',
                                'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': version.status === 'pending',
                                'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200': version.status === 'approved',
                                'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200': version.status === 'rejected'
                            }
                        ]">
                            {{ version.status.charAt(0).toUpperCase() + version.status.slice(1) }}
                        </span>
                        <!-- Show status change if it occurred -->
                        <span v-if="version.statusChange"
                            class="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Status changed: {{ version.statusChange.from }} → {{ version.statusChange.to }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- No Versions -->
            <div v-else class="text-center py-4">
                <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No version history</h3>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This quiz item doesn't have any recorded changes yet.
                </p>
            </div>

            <!-- Error State -->
            <div v-if="error" class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-2">
                        <h3 class="text-xs font-medium text-red-800 dark:text-red-200">
                            Error loading version history
                        </h3>
                        <div class="mt-0.5 text-xs text-red-700 dark:text-red-300">
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
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    },
    quizItemId: {
        type: String,
        required: false,
        default: null
    },
    originalId: {
        type: String,
        required: false,
        default: null
    }
});

const emit = defineEmits(['close']);

const versions = ref([]);
const isLoading = ref(false);
const error = ref(null);

const fetchVersions = async () => {
    const targetId = props.quizItemId || props.originalId;
    if (!targetId) {
        error.value = 'No quiz item ID provided';
        return;
    }

    isLoading.value = true;
    error.value = null;

    try {
        // First get the current quiz item to get its current status
        const quizItemRef = doc(db, 'quizEntries', targetId);
        const quizItemDoc = await getDoc(quizItemRef);
        const currentStatus = quizItemDoc.data()?.status || 'draft';
        const currentVersion = quizItemDoc.data()?.version || 1;

        const versionsRef = collection(db, 'quizEditHistory');
        const q = query(
            versionsRef,
            where('quizItemId', '==', targetId),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        console.log('Found versions:', querySnapshot.size);

        let previousStatus = currentStatus;
        versions.value = querySnapshot.docs.map((doc, index) => {
            const data = doc.data();
            console.log('Version data:', data);

            // Handle timestamp conversion properly
            let timestamp;
            if (data.timestamp?.toDate) {
                timestamp = data.timestamp.toDate();
            } else if (data.timestamp instanceof Date) {
                timestamp = data.timestamp;
            } else {
                timestamp = new Date();
            }

            // Check if status changed in this version
            const statusChange = data.status && data.status !== previousStatus ? {
                from: previousStatus,
                to: data.status
            } : null;

            // Update previous status for next iteration
            previousStatus = data.status || previousStatus;

            // Use version from history or fall back to revisionNumber
            const versionNumber = data.version || data.revisionNumber || (currentVersion - index);

            return {
                id: doc.id,
                versionNumber: versionNumber,
                timestamp: timestamp,
                userEmail: data.userEmail || 'Unknown',
                versionMessage: data.versionMessage || 'No message provided',
                changes: data.changes || {},
                status: data.status || previousStatus,
                statusChange
            };
        });

        // Log the versions for debugging
        console.log('Processed versions:', versions.value.map(v => ({
            version: v.versionNumber,
            timestamp: v.timestamp,
            message: v.versionMessage
        })));
    } catch (error) {
        console.error('Error fetching versions:', error);
        error.value = 'Failed to load version history';
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

// Add watch for quizItemId changes
watch(() => props.quizItemId, (newId, oldId) => {
    console.log('Quiz item ID changed:', { oldId, newId });
    if (props.show && newId) {
        console.log('Fetching new versions for ID:', newId);
        fetchVersions();
    }
});

// Add watch for show prop
watch(() => props.show, async (newVal) => {
    console.log('Show prop changed:', { oldValue: !newVal, newValue: newVal });
    if (newVal) {
        console.log('Modal shown, fetching versions for ID:', props.quizItemId || props.originalId);
        await fetchVersions();
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