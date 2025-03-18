<template>
    <div class="admin-container">
        <h1 class="text-2xl font-bold mb-6">Quiz Entries Administration</h1>

        <!-- Filters -->
        <div class="filters-section mb-6 p-4 bg-gray-800 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="filter-group">
                    <label class="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select v-model="filters.status" class="w-full bg-gray-700 text-white rounded-md border-gray-600">
                        <option value="all">All</option>
                        <option value="pending">Pending Review</option>
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
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import AdminTools from '../components/AdminTools.vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { quizStore } from '../stores/quizStore';
import QuizItem from '../components/QuizItem.vue';

const router = useRouter();
const authStore = useAuthStore();
const isAdmin = ref(false);
const store = quizStore();
const selectedEntry = ref(null);

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

// Delete entry
const deleteEntry = async (entry) => {
    if (!confirm('Are you sure you want to mark this quiz item as deleted?')) {
        return;
    }
    try {
        // First update the status
        await store.updateQuizItemStatus(entry.id, 'deleted');

        // Then record this change in the edit history
        store.draftQuizEntry = { ...entry, id: entry.id };
        await store.recordQuizEdit('Quiz item marked as deleted');

        // Refresh the list
        await store.fetchDraftQuizItems();
    } catch (error) {
        console.error('Error marking entry as deleted:', error);
        alert('Error marking quiz item as deleted: ' + error.message);
    }
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