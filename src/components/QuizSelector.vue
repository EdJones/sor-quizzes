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
        <div class="flex flex-col gap-2">
            <label for="template-select" class="text-stone-400">Choose a starting point:</label>
            <CustomDropdown v-model="selectedTemplate" @change="useTemplate" :userDrafts="userDraftQuizItems"
                :pendingItems="pendingQuizItems" :otherDrafts="otherDraftQuizItems" :permanentItems="permanentQuizItems"
                :isLoading="isLoadingDrafts" :error="draftLoadError" />
        </div>
    </template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { quizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';
import { quizEntries } from '../data/quiz-items';
import CustomDropdown from './CustomDropdown.vue';

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
    // Fetch draft items when component mounts
    console.log('QuizSelector mounted, fetching draft items...');
    await store.fetchDraftQuizItems();
});

const userDraftQuizItems = computed(() => {
    const items = store.draftQuizItems
        .filter(item => item.userId === auth.user?.uid)
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    console.log('User draft items:', items);
    return items;
});

const otherDraftQuizItems = computed(() => {
    const items = store.draftQuizItems
        .filter(item => item.userId !== auth.user?.uid && item.status === 'draft')
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    console.log('Other draft items:', items);
    return items;
});

const pendingQuizItems = computed(() => {
    const items = store.draftQuizItems
        .filter(item => item.status === 'pending')
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    console.log('Pending items:', items);
    return items;
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
    console.log('Using template:', selectedTemplate.value);

    if (!selectedTemplate.value) {
        console.log('No template selected, resetting draft entry');
        store.resetDraftQuizEntry();
        return;
    }

    // First check if it's a permanent quiz item
    const permanentItem = permanentQuizItems.value.find(item => item.id === selectedTemplate.value);
    if (permanentItem) {
        console.log('Using permanent item as template:', permanentItem);
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
        console.log('Using draft item as template:', draftItem);
        const copyItem = { ...draftItem };
        copyItem.originalId = copyItem.id;
        copyItem.id = null;
        store.updateDraftQuizEntry(copyItem);
    }
};
</script>