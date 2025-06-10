<template>
    <div class="admin-container">
        <h1 class="text-2xl font-bold mb-6">Quiz Entries Administration</h1>

        <!-- Add new section for entries with edit history -->
        

        <!-- Add new section for entries without edit history -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Entries Without Edit History</h2>
                <button @click="createInitialHistoryEntries"
                    :disabled="isProcessing || entriesWithoutHistory.length === 0"
                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isProcessing ? 'Processing...' : `Create History (${entriesWithoutHistory.length})` }}
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                    <thead class="bg-gray-900">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Title</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Author</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                        <tr v-for="entry in entriesWithoutHistory" :key="entry.id"
                            class="hover:bg-gray-700 transition-colors duration-200">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-white">{{ entry.title }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm text-gray-300">{{ entry.userEmail || 'Anonymous' }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="[
                                    'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                                    {
                                        'bg-yellow-200 text-yellow-800': entry.status === 'pending',
                                        'bg-green-200 text-green-800': entry.status === 'approved',
                                        'bg-blue-200 text-blue-800': entry.status === 'accepted',
                                        'bg-red-200 text-red-800': entry.status === 'rejected',
                                        'bg-gray-200 text-gray-800': entry.status === 'draft',
                                        'bg-purple-200 text-purple-800': entry.status === 'deleted'
                                    }
                                ]">
                                    {{ entry.status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {{ formatDate(entry.timestamp) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button @click="viewEntry(entry)"
                                    class="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                                    View
                                </button>
                                <button @click="editEntry(entry)"
                                    class="text-green-400 hover:text-green-300 transition-colors duration-200">
                                    Edit
                                </button>
                                <button @click="viewEditHistory(entry)"
                                    class="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                                    View History
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div>
            <h2 class="text-xl font-bold">Entries </h2>
        </div>
        <!-- Filters -->
        <div class="filters-section mb-6 p-4 bg-gray-800 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select v-model="filters.status" class="w-full bg-gray-700 text-white rounded-md border-gray-600">
                        <option value="all">All</option>
                        <option value="pending">Pending Review</option>
                        <option value="accepted">Accepted</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="deleted">Deleted</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                    <select v-model="filters.sortBy" class="w-full bg-gray-700 text-white rounded-md border-gray-600">
                        <option value="date">Submission Date</option>
                        <option value="title">Title</option>
                        <option value="author">Author</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Search</label>
                    <input type="text" v-model="filters.search" placeholder="Search by title or author..."
                        class="w-full bg-gray-700 text-white rounded-md border-gray-600 placeholder-gray-400">
                </div>
            </div>
        </div>

        <!-- Quiz Entries Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead class="bg-gray-900">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Author</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                    <tr v-for="entry in filteredEntries" :key="entry.id"
                        class="hover:bg-gray-700 transition-colors duration-200">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-white">{{ entry.title }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-300">{{ entry.userEmail || 'Anonymous' }}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span :class="[
                                'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                                {
                                    'bg-yellow-200 text-yellow-800': entry.status === 'pending',
                                    'bg-green-200 text-green-800': entry.status === 'approved',
                                    'bg-blue-200 text-blue-800': entry.status === 'accepted',
                                    'bg-red-200 text-red-800': entry.status === 'rejected',
                                    'bg-gray-200 text-gray-800': entry.status === 'draft',
                                    'bg-purple-200 text-purple-800': entry.status === 'deleted'
                                }
                            ]">
                                {{ entry.status }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {{ formatDate(entry.timestamp) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button @click="viewEntry(entry)"
                                class="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                                View
                            </button>
                            <button @click="editEntry(entry)"
                                class="text-green-400 hover:text-green-300 transition-colors duration-200">
                                Edit
                            </button>
                            <template v-if="entry.status === 'pending'">
                                <button @click="acceptEntry(entry)"
                                    class="text-green-400 hover:text-green-300 transition-colors duration-200">
                                    Accept
                                </button>
                                <button @click="rejectEntry(entry)"
                                    class="text-red-400 hover:text-red-300 transition-colors duration-200">
                                    Reject
                                </button>
                            </template>
                            <template v-if="entry.status === 'accepted'">
                                <button @click="approveEntry(entry)"
                                    class="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                                    Approve
                                </button>
                            </template>
                            <template v-if="entry.status !== 'deleted'">
                                <button @click="deleteEntry(entry)"
                                    class="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                                    Delete
                                </button>
                            </template>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Preview Modal -->
        <div v-if="selectedEntry" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-white">Quiz Entry Preview</h2>
                        <button @click="selectedEntry = null" class="text-gray-400 hover:text-gray-300">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <QuizItem :currentQuizItem="selectedEntry" :itemNum="0" :reviewMode="true" :basicMode="false"
                        :debug="false" :userAnswer="selectedEntry.correctAnswer" />
                </div>
            </div>
        </div>

        <!-- Edit History Modal -->
        <div v-if="showEditHistory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div class="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-white">Edit History for: {{ selectedEntry?.title }}</h2>
                        <button @click="showEditHistory = false" class="text-gray-400 hover:text-gray-300">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div v-for="history in editHistory" :key="history.id" class="bg-gray-700 p-4 rounded-lg">
                            <div class="flex justify-between items-start mb-2">
                                <div class="text-sm text-gray-300">
                                    <span class="font-semibold">Revision {{ history.revisionNumber }}</span>
                                    <span class="mx-2">•</span>
                                    <span>{{ history.userEmail }}</span>
                                    <span class="mx-2">•</span>
                                    <span>{{ history.timestamp?.toLocaleString() || 'Unknown date' }}</span>
                                </div>
                            </div>
                            <div class="text-sm text-gray-300 mb-2"><span class="font-semibold">Message:</span> {{
                                history.versionMessage || 'No message provided' }}</div>
                            <div class="text-sm text-gray-300">
                                <span class="font-semibold">Status:</span> {{ history.status }}
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
import { useAuthStore } from '../stores/authStore';
import AdminTools from '../components/AdminTools.vue';
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { quizStore } from '../stores/quizStore';
import QuizItem from '../components/QuizItem.vue';

const router = useRouter();
const authStore = useAuthStore();
const isAdmin = ref(false);
const store = quizStore();
const selectedEntry = ref(null);
const showEditHistory = ref(false);
const editHistory = ref([]);
const isProcessing = ref(false);

const filters = ref({
    status: 'all',
    sortBy: 'date',
    search: ''
});

onMounted(async () => {
    if (!authStore.user) {
        router.push('/');
        return;
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', authStore.user.uid));
    if (userDoc.exists()) {
        isAdmin.value = userDoc.data().isAdmin === true;
    }

    if (!isAdmin.value) {
        router.push('/');
    }

    await store.fetchDraftQuizItems();
    await fetchEditHistory();
});

// Computed property for filtered and sorted entries
const filteredEntries = computed(() => {
    let entries = store.draftQuizItems;

    // Filter by status
    if (filters.value.status !== 'all') {
        entries = entries.filter(entry => entry.status === filters.value.status);
    }

    // Filter by search term
    if (filters.value.search) {
        const searchTerm = filters.value.search.toLowerCase();
        entries = entries.filter(entry =>
            entry.title?.toLowerCase().includes(searchTerm) ||
            entry.userEmail?.toLowerCase().includes(searchTerm)
        );
    }

    // Sort entries
    entries = [...entries].sort((a, b) => {
        switch (filters.value.sortBy) {
            case 'date':
                return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
            case 'title':
                return (a.title || '').localeCompare(b.title || '');
            case 'author':
                return (a.userEmail || '').localeCompare(b.userEmail || '');
            default:
                return 0;
        }
    });

    return entries;
});

// Format timestamp to readable date
const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// View entry details
const viewEntry = (entry) => {
    selectedEntry.value = entry;
};

// Accept entry
const acceptEntry = async (entry) => {
    try {
        await store.acceptQuizItem(entry.id);
        // Show success message
        alert('Quiz item accepted successfully!');
    } catch (error) {
        console.error('Error accepting entry:', error);
        alert('Error accepting quiz item: ' + error.message);
    }
};

// Reject entry
const rejectEntry = async (entry) => {
    try {
        await store.updateQuizItemStatus(entry.id, 'rejected');
        await store.fetchDraftQuizItems(); // Refresh the list
    } catch (error) {
        console.error('Error rejecting entry:', error);
    }
};

// Approve entry
const approveEntry = async (entry) => {
    try {
        await store.approveQuizItem(entry.id);
        // Show success message
        alert('Quiz item approved successfully!');
    } catch (error) {
        console.error('Error approving entry:', error);
        alert('Error approving quiz item: ' + error.message);
    }
};

// Delete entry
const deleteEntry = async (entry) => {
    if (!confirm('Are you sure you want to mark this quiz item as deleted?')) {
        return;
    }
    try {
        // First update the status
        await store.updateQuizItemStatus(entry.id, 'deleted');

        // Then record this change in the edit history
        store.draftQuizEntry = { ...entry };
        store.lastSavedDraftQuizEntry = { ...entry, status: entry.status }; // Store the previous status
        await store.recordQuizEdit('Quiz item marked as deleted');

        // Refresh the list
        await store.fetchDraftQuizItems();
    } catch (error) {
        console.error('Error marking entry as deleted:', error);
        alert('Error marking quiz item as deleted: ' + error.message);
    }
};

// Add new computed property for entries with edit history
const entriesWithHistory = computed(() => {
    return store.draftQuizItems.filter(entry => entry.hasEditHistory);
});

// Add new function to fetch edit history
const fetchEditHistory = async () => {
    try {
        const editHistoryRef = collection(db, 'quizEditHistory');
        const querySnapshot = await getDocs(editHistoryRef);

        // Get unique quiz item IDs from edit history, normalized to strings
        const quizItemIds = new Set();
        querySnapshot.forEach(doc => {
            const quizItemId = doc.data().quizItemId;
            // Normalize to string to handle both string and numeric IDs
            quizItemIds.add(String(quizItemId));
        });

        console.log('Edit history quiz item IDs:', Array.from(quizItemIds));
        console.log('Quiz entries IDs:', store.draftQuizItems.map(entry => ({ id: entry.id, type: typeof entry.id, title: entry.title })));

        // Fetch ALL items from both collections to check for edit history across all versions
        const draftsRef = collection(db, 'quizEntries');
        const permanentRef = collection(db, 'permanentQuizEntries');
        
        const [allDraftsSnapshot, allPermanentSnapshot] = await Promise.all([
            getDocs(query(draftsRef, orderBy('timestamp', 'desc'))),
            getDocs(query(permanentRef, orderBy('timestamp', 'desc')))
        ]);

        // Get all item IDs from the database (all versions)
        const allItemIds = new Set();
        allDraftsSnapshot.docs.forEach(doc => {
            allItemIds.add(String(doc.id));
        });
        allPermanentSnapshot.docs.forEach(doc => {
            allItemIds.add(String(doc.id));
        });

        console.log('All item IDs in database:', Array.from(allItemIds));

        // Mark entries that have edit history, comparing normalized string IDs
        store.draftQuizItems.forEach(entry => {
            // Normalize entry ID to string for comparison
            const normalizedEntryId = String(entry.id);
            const hasHistory = quizItemIds.has(normalizedEntryId);
            entry.hasEditHistory = hasHistory;
            
            // Debug logging for entries without history
            if (!hasHistory) {
                console.log(`Entry "${entry.title}" (ID: ${entry.id}, type: ${typeof entry.id}) has no edit history`);
            }
        });

        // Check for edit history across all versions of each item
        console.log('Checking for edit history across all versions...');
        for (const entry of store.draftQuizItems) {
            if (!entry.hasEditHistory) {
                // Check if any version of this item (by title) has edit history
                // We need to check all items in the database, not just the filtered list
                const allItemsWithSameTitle = [
                    ...allDraftsSnapshot.docs.filter(doc => doc.data().title === entry.title),
                    ...allPermanentSnapshot.docs.filter(doc => doc.data().title === entry.title)
                ];
                
                const allIdsForTitle = allItemsWithSameTitle.map(doc => String(doc.id));
                
                // Check if any of these IDs have edit history
                const hasHistoryForAnyVersion = allIdsForTitle.some(id => quizItemIds.has(id));
                
                if (hasHistoryForAnyVersion) {
                    console.log(`Found edit history for "${entry.title}" in a different version. All IDs for this title:`, allIdsForTitle);
                    entry.hasEditHistory = true;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching edit history:', error);
    }
};

// View edit history
const viewEditHistory = async (entry) => {
    try {
        const editHistoryRef = collection(db, 'quizEditHistory');
        const q = query(
            editHistoryRef,
            where('quizItemId', '==', entry.id),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        editHistory.value = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || null
        }));

        selectedEntry.value = entry;
        showEditHistory.value = true;
    } catch (error) {
        console.error('Error fetching edit history:', error);
        alert('Error fetching edit history: ' + error.message);
    }
};

// Add new computed property for entries without edit history
const entriesWithoutHistory = computed(() => {
    return store.draftQuizItems.filter(entry => !entry.hasEditHistory);
});

// Add function to create initial history entries
const createInitialHistoryEntries = async () => {
    if (!confirm('This will create initial history entries for all quiz items without history. Continue?')) {
        return;
    }

    isProcessing.value = true;
    let successCount = 0;
    let errorCount = 0;

    try {
        for (const entry of entriesWithoutHistory.value) {
            try {
                // Create the initial history entry
                const editHistoryRef = collection(db, 'quizEditHistory');
                await addDoc(editHistoryRef, {
                    quizItemId: entry.id,
                    userId: entry.userId || 'system',
                    userEmail: entry.userEmail || 'system',
                    timestamp: entry.timestamp || serverTimestamp(),
                    versionMessage: 'Initial history entry created by admin tool',
                    revisionNumber: 1,
                    changes: {
                        before: null,
                        after: entry
                    },
                    status: entry.status || 'draft'
                });
                successCount++;
            } catch (error) {
                console.error(`Error creating history for entry ${entry.id}:`, error);
                errorCount++;
            }
        }

        // Refresh the list
        await store.fetchDraftQuizItems();
        await fetchEditHistory();

        alert(`Operation completed. Successfully created ${successCount} history entries. ${errorCount} errors occurred.`);
    } catch (error) {
        console.error('Error in createInitialHistoryEntries:', error);
        alert('Error creating history entries: ' + error.message);
    } finally {
        isProcessing.value = false;
    }
};

// Add the editEntry function in the script section
const editEntry = (entry) => {
    router.push(`/quiz-item-editor/${entry.id}`);
};
</script>

<style scoped>
.admin-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.filters-section {
    backdrop-filter: blur(8px);
}

input,
select {
    padding: 0.5rem;
    border: 1px solid;
}

input:focus,
select:focus {
    outline: none;
    ring-width: 2px;
    ring-offset-width: 2px;
    ring-color: #3b82f6;
}
</style>