<template>
    <div v-show="show" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
        @click.self="$emit('close')">
        <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full border border-gray-200 dark:border-gray-700">
            <button @click="$emit('close')"
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
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    rows="4" placeholder="Describe your changes..."></textarea>
            </div>

            <div class="flex justify-end gap-3">
                <button @click="$emit('close')"
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
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close', 'save']);

const message = ref('');

// Reset message when modal is closed
watch(() => props.show, (newVal) => {
    if (!newVal) {
        message.value = '';
    }
});

const handleSave = () => {
    if (message.value.trim()) {
        emit('save', message.value.trim());
        message.value = '';
    }
};
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