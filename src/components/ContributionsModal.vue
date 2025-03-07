<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-xl">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Your Quiz Items
                </h2>
                <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <!-- Stats Section -->
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 dark:text-gray-400">Total Items</div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ userQuizItems.length }}</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 dark:text-gray-400">Published</div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ publishedCount }}</div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div class="text-sm text-gray-500 dark:text-gray-400">Drafts</div>
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ draftCount }}</div>
                </div>
            </div>

            <!-- Quiz Items List -->
            <div class="space-y-4 max-h-[60vh] overflow-y-auto">
                <!-- Loading State -->
                <div v-if="isLoading" class="text-center py-8">
                    <svg class="animate-spin h-8 w-8 mx-auto text-purple-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                        </circle>
                        <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        </path>
                    </svg>
                    <div class="mt-2 text-gray-500 dark:text-gray-400">Loading your quiz items...</div>
                </div>

                <!-- Empty State -->
                <div v-else-if="userQuizItems.length === 0" class="text-center py-8">
                    <div class="text-gray-500 dark:text-gray-400">No quiz items yet</div>
                    <button @click="handleNewContribution"
                        class="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                        Create Your First Quiz Item
                    </button>
                </div>

                <!-- Quiz Items -->
                <div v-else v-for="item in userQuizItems" :key="item.id"
                    class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-medium text-gray-900 dark:text-white">{{ item.title || 'Untitled Question'
                                }}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ item.Question }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span :class="[
                                'px-2 py-1 text-xs rounded-full',
                                getItemStatus(item) === 'published'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            ]">
                                {{ getItemStatus(item) === 'published' ? 'Published' : 'Draft' }}
                            </span>
                            <button @click="showVersionHistory(item.id)"
                                class="p-1 text-gray-500 hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400"
                                title="View Version History">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <button @click="handleEditItem(item.id)"
                                class="p-1 text-gray-500 hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        Created {{ item.timestamp.toDate().toLocaleDateString() }}
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-6 flex justify-between items-center">
                <button @click="handleNewContribution"
                    class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    New Quiz Item
                </button>
                <button @click="$emit('close')"
                    class="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    Close
                </button>
            </div>
        </div>
    </div>

    <!-- Version History Modal -->
    <VersionHistoryModal v-if="selectedQuizItemId" :show="showVersionHistoryModal" :quizItemId="selectedQuizItemId"
        @close="showVersionHistoryModal = false" />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import { quizEntries } from '../data/quiz-items';
import VersionHistoryModal from './VersionHistoryModal.vue';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close']);

const router = useRouter();
const authStore = useAuthStore();
const userQuizItems = ref([]);
const isLoading = ref(false);

// Add this computed property to find published items by email
const publishedItemTitles = computed(() => {
    // Create a Set of published item titles for O(1) lookup
    return new Set(
        quizEntries
            .filter(qi => qi.userEmail === authStore.user?.email)
            .map(qi => qi.title)
    );
});

// Computed stats using the cached published items
const publishedCount = computed(() =>
    userQuizItems.value.filter(item => publishedItemTitles.value.has(item.title)).length
);

const draftCount = computed(() =>
    userQuizItems.value.filter(item => !publishedItemTitles.value.has(item.title)).length
);

// Modify getItemStatus to use the cached set
const getItemStatus = (item) => {
    return publishedItemTitles.value.has(item.title) ? 'published' : 'draft';
};

// Fetch user's quiz items
const fetchUserQuizItems = async () => {
    if (!authStore.user || authStore.user.isAnonymous) {
        console.log('User not logged in or anonymous:', authStore.user);
        return;
    }

    isLoading.value = true;
    try {
        const userInfo = {
            email: authStore.user.email,
            uid: authStore.user.uid,
            isAnonymous: authStore.user.isAnonymous,
            provider: authStore.user.providerData?.[0]?.providerId
        };
        console.log('Current user info:', userInfo);

        let allDocs = [];

        // Try all possible field combinations
        const queries = [
            // Email-based queries
            query(collection(db, 'quizEntries'), where('userEmail', '==', authStore.user.email)),
            query(collection(db, 'quizEntries'), where('email', '==', authStore.user.email)),
            query(collection(db, 'quizEntries'), where('createdBy', '==', authStore.user.email)),

            // UID-based queries
            query(collection(db, 'quizEntries'), where('userId', '==', authStore.user.uid)),
            query(collection(db, 'quizEntries'), where('uid', '==', authStore.user.uid)),
            query(collection(db, 'quizEntries'), where('createdBy', '==', authStore.user.uid))
        ];

        console.log('Running queries on quizEntries collection for fields: userEmail, email, createdBy, userId, uid');

        // Execute all queries
        for (const [index, q] of queries.entries()) {
            try {
                const snapshot = await getDocs(q);
                if (snapshot.docs.length > 0) {
                    console.log(`Query ${index} found ${snapshot.docs.length} documents`);
                    allDocs = [...allDocs, ...snapshot.docs];
                }
            } catch (error) {
                console.error(`Error in query ${index}:`, error);
            }
        }

        // Remove duplicates and create final items array
        const combinedItems = new Map();
        allDocs.forEach(doc => {
            if (!combinedItems.has(doc.id)) {
                const data = doc.data();
                combinedItems.set(doc.id, {
                    id: doc.id,
                    ...data,
                    status: data.isDraft ? 'draft' : 'published'
                });
            }
        });

        userQuizItems.value = Array.from(combinedItems.values());
        console.log('Final combined items:', userQuizItems.value);

    } catch (error) {
        console.error('Error fetching user quiz items:', error);
    } finally {
        isLoading.value = false;
    }
};

// Navigation handlers
const handleEditItem = async (itemId) => {
    try {
        console.log('Handling edit for item:', itemId);

        // Wait for auth state to be initialized
        if (authStore.loading) {
            console.log('Waiting for auth initialization...');
            await authStore.init();
        }

        console.log('Auth state:', {
            isAuthenticated: authStore.isAuthenticated,
            canEdit: authStore.canEdit,
            isAnonymous: authStore.isAnonymous,
            user: authStore.user?.email,
            currentRoute: router.currentRoute.value.path
        });

        // Check if user can edit
        if (!authStore.canEdit) {
            console.log('User cannot edit, redirecting to login');
            // Redirect to login with return URL
            await router.push({
                path: '/login',
                query: { redirect: `/edit-item/${itemId}` }
            });
            emit('close');
            return;
        }

        // User can edit, proceed with navigation
        console.log('User can edit, proceeding with navigation');

        // First close the modal
        emit('close');

        // Then navigate using name and wait for it to complete
        try {
            await router.push({
                name: 'edit-item',
                params: { id: itemId },
                // Force navigation even if we're already on a similar path
                replace: false,
                // Add a timestamp to force a new navigation
                query: { _t: Date.now() }
            });

            // Double check that we ended up where we expected
            const expectedPath = `/edit-item/${itemId}`;
            if (router.currentRoute.value.path !== expectedPath) {
                console.warn('Navigation may have been intercepted, retrying with path...');
                await router.push(expectedPath);
            }

            console.log('Navigation completed to:', router.currentRoute.value.path);
        } catch (navError) {
            console.error('Navigation error:', navError);
            throw navError;
        }
    } catch (error) {
        console.error('Error in handleEditItem:', error);
    }
};

const handleNewContribution = () => {
    // Close the modal first
    emit('close');
    // Then navigate
    router.push({ name: 'NewQuizItem' });
};

const showVersionHistoryModal = ref(false);
const selectedQuizItemId = ref('');

const showVersionHistory = (itemId) => {
    if (itemId) {
        selectedQuizItemId.value = itemId;
        showVersionHistoryModal.value = true;
    }
};

onMounted(() => {
    if (props.show) {
        fetchUserQuizItems();
    }
});

// Watch for show prop changes to refresh data when modal opens
watch(() => props.show, (newValue) => {
    if (newValue) {
        fetchUserQuizItems();
    }
});
</script>