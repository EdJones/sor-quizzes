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
                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                {{ version.timestamp?.toDate?.()?.toLocaleString() || 'Unknown date' }}
                            </p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                by {{ version.userEmail }}
                            </p>
                        </div>
                    </div>
                    <p v-if="version.versionMessage" class="text-gray-900 dark:text-white mb-2">
                        {{ version.versionMessage }}
                    </p>
                    <div class="text-sm">
                        <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Changes made</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- No Versions -->
            <div v-else class="text-center py-4 text-gray-600 dark:text-gray-400">
                No version history available.
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

const fetchVersions = async () => {
    if (!props.quizItemId) {
        console.log('No quizItemId provided');
        return;
    }

    isLoading.value = true;
    try {
        console.log('Fetching versions for quizItemId:', props.quizItemId);
        const editHistoryRef = collection(db, 'quizEditHistory');
        const q = query(
            editHistoryRef,
            where('quizItemId', '==', props.quizItemId),
            orderBy('timestamp', 'desc')
        );

        console.log('Executing query:', q);
        const querySnapshot = await getDocs(q);
        console.log('Query snapshot size:', querySnapshot.size);

        versions.value = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Version data:', {
                id: doc.id,
                timestamp: data.timestamp,
                userEmail: data.userEmail,
                versionMessage: data.versionMessage,
                changes: {
                    before: data.changes?.before,
                    after: data.changes?.after
                }
            });
            return {
                id: doc.id,
                ...data
            };
        });

        console.log('Final versions array:', versions.value);
    } catch (error) {
        console.error('Error fetching version history:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
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