<template>
    <div v-show="isVisible" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
        @click.self="handleClose">
        <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full border border-gray-200 dark:border-gray-700">
            <button @click="handleClose"
                class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-xl transition-colors"
                aria-label="Close">
                ×
            </button>

            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Version Info</h3>

            <div class="mb-4">
                <label for="versionMessage" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What changes did you make in this version?
                </label>
                <textarea id="versionMessage" v-model="message"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900 placeholder-gray-500"
                    rows="4" placeholder="Describe your changes..."></textarea>
            </div>

            <div class="flex justify-end gap-4">
                <button @click="showVersionHistory = true"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    View History
                </button>
                <button @click="handleClose"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    Cancel
                </button>
                <button @click="handleSave"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    :disabled="!message.trim()">
                    Save Draft
                </button>
            </div>
        </div>
    </div>

    <!-- Version History Modal -->
    <VersionHistoryModal v-if="quizItemId" :show="showVersionHistory" :quizItemId="quizItemId"
        @close="showVersionHistory = false" />
</template>

<script setup>
import { ref, watch } from 'vue';
import VersionHistoryModal from './VersionHistoryModal.vue';

const emit = defineEmits(['close', 'save']);

const message = ref('');
const isVisible = ref(false);
const showVersionHistory = ref(false);
const quizItemId = ref('');

const handleClose = () => {
    isVisible.value = false;
    message.value = '';
    emit('close');
};

const handleSave = () => {
    if (message.value.trim()) {
        emit('save', message.value.trim());
        message.value = '';
        isVisible.value = false;
    }
};

const show = (id) => {
    isVisible.value = true;
    quizItemId.value = id;
};

defineExpose({
    show
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