<!-- QuizItemSelectorView.vue -->
<template>
    <div class="min-h-screen bg-gray-900 text-white p-8">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-3xl font-bold mb-8">Create or Edit Quiz Item</h1>

            <!-- Main action buttons -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- New Item Button -->
                <button @click="createNewItem" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg 
                       transition duration-200 ease-in-out transform hover:scale-105
                       flex flex-col items-center justify-center gap-2">
                    <span class="text-xl">New Item</span>
                    <span class="text-sm text-blue-200">Create a quiz item from scratch</span>
                </button>

                <!-- My Drafts Button -->
                <button @click="showDrafts = true" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg 
                       transition duration-200 ease-in-out transform hover:scale-105
                       flex flex-col items-center justify-center gap-2">
                    <span class="text-xl">My Drafts</span>
                    <span class="text-sm text-purple-200">Continue working on a draft</span>
                </button>

                <!-- Fork Item Button -->
                <button class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg 
                       transition duration-200 ease-in-out transform hover:scale-105
                       flex flex-col items-center justify-center gap-2
                       opacity-50 cursor-not-allowed">
                    <span class="text-xl">Fork Item</span>
                    <span class="text-sm text-gray-300">Coming soon...</span>
                </button>
            </div>

            <!-- My Drafts Modal -->
            <div v-if="showDrafts" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-2xl font-bold">My Draft Quiz Items</h2>
                        <button @click="showDrafts = false" class="text-gray-400 hover:text-white">
                            <span class="sr-only">Close</span>
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div v-if="isLoading" class="text-center py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto">
                        </div>
                        <p class="mt-4">Loading your drafts...</p>
                    </div>

                    <div v-else-if="userDrafts.length === 0" class="text-center py-8">
                        <p class="text-gray-400">You don't have any drafts yet.</p>
                        <button @click="createNewItem" class="mt-4 text-blue-400 hover:text-blue-300">
                            Create your first quiz item
                        </button>
                    </div>

                    <div v-else class="space-y-4 max-h-96 overflow-y-auto">
                        <div v-for="draft in userDrafts" :key="draft.id" @click="editDraft(draft)" class="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer
                        transition duration-200 ease-in-out">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-semibold text-lg">{{ draft.title || 'Untitled Draft' }}</h3>
                                    <p class="text-sm text-gray-400">Version {{ draft.version }}</p>
                                </div>
                                <div class="text-right">
                                    <span class="text-sm text-gray-400">
                                        {{ formatDate(draft.timestamp) }}
                                    </span>
                                    <span :class="getStatusClass(draft.status)"
                                        class="ml-2 px-2 py-1 rounded-full text-xs">
                                        {{ draft.status }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { quizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const store = quizStore();
const auth = useAuthStore();

const showDrafts = ref(false);
const isLoading = ref(false);

// Computed property for user's drafts
const userDrafts = computed(() => {
    return store.draftQuizItems
        .filter(item => item.userId === auth.user?.uid)
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
});

// Load drafts when component mounts
onMounted(async () => {
    isLoading.value = true;
    try {
        await store.fetchDraftQuizItems();
    } catch (error) {
        console.error('Error fetching drafts:', error);
    } finally {
        isLoading.value = false;
    }
});

// Format timestamp for display
const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp.seconds * 1000);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
};

// Get status badge styling
const getStatusClass = (status) => {
    const classes = {
        draft: 'bg-blue-900 text-blue-200',
        pending: 'bg-yellow-900 text-yellow-200',
        accepted: 'bg-blue-900 text-blue-200',
        approved: 'bg-green-900 text-green-200',
        rejected: 'bg-red-900 text-red-200',
        deleted: 'bg-red-900 text-red-200'
    };
    return classes[status] || 'bg-gray-900 text-gray-200';
};

// Navigation functions
const createNewItem = () => {
    router.push({ name: 'quizItemEditor', query: { new: 'true' } });
};

const editDraft = (draft) => {
    showDrafts.value = false;
    router.push({ name: 'quizItemEditor', params: { id: draft.id } });
};
</script>