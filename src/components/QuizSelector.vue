<template>
    <!-- Display mode for editing existing item -->
    <div v-if="existingItem?.title || existingItem?.originalId" class="w-full px-4 py-2 rounded-lg border border-gray-300/50 
                bg-white/50 dark:bg-gray-500/50 
                dark:border-gray-600/50 color:#ffffff
                backdrop-blur-sm
                transition-colors duration-200 ease-in-out">
        <div class="text-lg text-white text-left">{{ existingItem.title || 'Untitled Quiz Item' }}</div>
        <div v-if="existingItem.subtitle" class="text-sm text-stone-300">{{ existingItem.subtitle }}</div>
        <!--div class="text-xs text-stone-400 mt-1">Quiz Item #{{ existingItem.id || existingItem.originalId }}</div-->
    </div>

    <!-- Selection mode for new items -->
    <template v-else>
        <label for="template-select" class="text-stone-400">Choose a starting point:</label>
        <select id="template-select" v-model="selectedTemplate" @change="useTemplate" class="w-full px-4 py-2 rounded-lg border border-gray-300/50 
                         bg-white/50 dark:bg-gray-500/50 
                         dark:border-gray-600/50 color:#ffffff
                         focus:ring-2 focus:ring-amber-400 focus:border-transparent
                         backdrop-blur-sm
                         transition-colors duration-200 ease-in-out
                         appearance-none cursor-pointer
                         hover:bg-white/40 dark:hover:bg-gray-500/40
                         dark:[&>*]:bg-gray-700 text-white">
            <option value="" class="py-2 text-white">Start from scratch</option>
            <template v-if="isLoadingDrafts">
                <option disabled>Loading draft items...</option>
            </template>
            <template v-else-if="draftLoadError">
                <option disabled>Error loading drafts: {{ draftLoadError }}</option>
            </template>
            <template v-else>
                <optgroup label="My Draft Quiz Items" class="font-medium text-sm" v-if="userDraftQuizItems.length">
                    <option v-for="item in userDraftQuizItems" :key="item.id" :value="item.id" class="py-1">
                        {{ item.title || 'Untitled Draft' }} &nbsp; &nbsp; &nbsp; &nbsp; {{ item.timestamp ? `(${new
                            Date(item.timestamp.seconds *
                                1000).toLocaleDateString()} ${new Date(item.timestamp.seconds * 1000).toLocaleTimeString([],
                                    { hour: '2-digit', minute: '2-digit' })})` : '' }}
                    </option>
                </optgroup>
                <optgroup label="Pending Review" class="font-medium" v-if="pendingQuizItems.length">
                    <option v-for="item in pendingQuizItems" :key="item.id" :value="item.id" class="py-1">
                        {{ item.title || 'Untitled Pending' }} ({{ item.userEmail || 'Anonymous' }}) &nbsp; &nbsp;
                        &nbsp; &nbsp; {{ item.timestamp ?
                            `(${new Date(item.timestamp.seconds * 1000).toLocaleDateString()} ${new
                                Date(item.timestamp.seconds * 1000).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })})` : '' }}
                    </option>
                </optgroup>
                <optgroup label="Other Draft Items" class="font-medium" v-if="otherDraftQuizItems.length">
                    <option v-for="item in otherDraftQuizItems" :key="item.id" :value="item.id" class="py-1">
                        {{ item.title || 'Untitled Draft' }} &nbsp; &nbsp; &nbsp; &nbsp; {{ item.timestamp ? `(${new
                            Date(item.timestamp.seconds *
                                1000).toLocaleDateString()} ${new Date(item.timestamp.seconds * 1000).toLocaleTimeString([],
                                    { hour: '2-digit', minute: '2-digit' })})` : '' }}
                    </option>
                </optgroup>
            </template>
            <optgroup label="Permanent Quiz Items" class="font-medium text-blue-500">
                <option v-for="item in permanentQuizItems" :key="item.id" :value="item.id" class="py-1 text-blue-700">
                    {{ String(item.id).padStart(3, '0') }}. {{ item.title }} &nbsp; &nbsp; &nbsp; &nbsp; {{
                        item.timestamp
                            ?
                            `(${new Date(item.timestamp.seconds *
                                1000).toLocaleString()})` : '' }}
                </option>
            </optgroup>
        </select>
    </template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { quizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';
import { quizEntries } from '../data/quiz-items';

const store = quizStore();
const auth = useAuthStore();

// Add prop for existing item
const props = defineProps({
    existingItem: {
        type: Object,
        default: null
    }
});

const selectedTemplate = ref('');

onMounted(async () => {
    await store.fetchDraftQuizItems();
});

const userDraftQuizItems = computed(() => {
    return store.draftQuizItems
        .filter(item => item.userId === auth.user?.uid)
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
});

const otherDraftQuizItems = computed(() => {
    return store.draftQuizItems
        .filter(item => item.userId && item.userId !== auth.user?.uid)
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
});

const pendingQuizItems = computed(() => {
    return store.draftQuizItems
        .filter(item => item.status === 'pending')
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
});

const permanentQuizItems = computed(() => {
    return [...quizEntries].sort((a, b) => {
        const aId = typeof a.id === 'string' ? parseInt(a.id, 10) : a.id;
        const bId = typeof b.id === 'string' ? parseInt(b.id, 10) : b.id;
        return aId - bId;
    });
});

const isLoadingDrafts = computed(() => store.draftQuizItemsLoading);
const draftLoadError = computed(() => store.draftQuizItemsError);

const useTemplate = () => {
    if (!selectedTemplate.value) {
        store.resetDraftQuizEntry();
        return;
    }

    // First check if it's a permanent quiz item
    const permanentItem = permanentQuizItems.value.find(item => item.id === selectedTemplate.value);
    if (permanentItem) {
        const copyItem = { ...permanentItem };
        copyItem.originalId = copyItem.id;
        copyItem.id = null;
        store.updateDraftQuizEntry(copyItem);
        return;
    }

    // If not permanent, check drafts
    const draftItem = [...userDraftQuizItems.value, ...otherDraftQuizItems.value, ...pendingQuizItems.value]
        .find(item => item.id === selectedTemplate.value);

    if (draftItem) {
        const copyItem = { ...draftItem };
        copyItem.originalId = copyItem.id;
        copyItem.id = null;
        store.updateDraftQuizEntry(copyItem);
    }
};
</script>