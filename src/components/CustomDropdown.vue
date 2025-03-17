<template>
    <div class="relative" @keydown.esc="isOpen = false">
        <button type="button" @click="toggleDropdown" class="w-full px-4 py-2 rounded-lg border border-gray-300/50 
                bg-white/50 dark:bg-gray-500/50 
                dark:border-gray-600/50 text-white
                focus:ring-2 focus:ring-amber-400 focus:border-transparent
                backdrop-blur-sm
                transition-colors duration-200 ease-in-out
                appearance-none cursor-pointer
                hover:bg-white/40 dark:hover:bg-gray-500/40
                flex justify-between items-center">
            <span>{{ selectedLabel || 'Start from scratch' }}</span>
            <svg class="w-5 h-5 ml-2" :class="{ 'transform rotate-180': isOpen }" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        <div v-if="isOpen"
            class="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <!-- Start from scratch option -->
            <div @click="selectOption('')" class="px-4 py-2 cursor-pointer hover:bg-gray-700 border-b border-gray-700">
                Start from scratch
            </div>

            <!-- Loading state -->
            <div v-if="isLoading" class="px-4 py-2 text-gray-400">
                Loading draft items...
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="px-4 py-2 text-red-400">
                Error loading drafts: {{ error }}
            </div>

            <!-- Content -->
            <template v-else>
                <!-- My Draft Quiz Items -->
                <div v-if="userDrafts.length" class="border-b border-gray-700">
                    <div class="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800">My Draft Quiz Items</div>
                    <div v-for="item in userDrafts" :key="item.id" @click="selectOption(item.id)"
                        class="px-4 py-2 cursor-pointer hover:bg-gray-700">
                        <div class="flex justify-between items-center">
                            <span class="text-white">{{ item.title || 'Untitled Draft' }}</span>
                            <div class="flex items-center gap-2">
                                <span v-if="item.version" class="text-xs text-gray-400">v{{ item.version }}</span>
                                <span class="text-xs text-gray-400">{{ formatDate(item.timestamp) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pending Review -->
                <div v-if="pendingItems.length" class="border-b border-gray-700">
                    <div class="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800">Pending Review</div>
                    <div v-for="item in pendingItems" :key="item.id" @click="selectOption(item.id)"
                        class="px-4 py-2 cursor-pointer hover:bg-gray-700">
                        <div class="flex justify-between items-center">
                            <div>
                                <span class="text-white">{{ item.title || 'Untitled Pending' }}</span>
                                <span class="text-sm text-gray-400">({{ item.userEmail || 'Anonymous' }})</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span v-if="item.version" class="text-xs text-gray-400">v{{ item.version }}</span>
                                <span class="text-xs text-gray-400">{{ formatDate(item.timestamp) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Other Draft Items -->
                <div v-if="otherDrafts.length" class="border-b border-gray-700">
                    <div class="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800">Other Draft Items</div>
                    <div v-for="item in otherDrafts" :key="item.id" @click="selectOption(item.id)"
                        class="px-4 py-2 cursor-pointer hover:bg-gray-700">
                        <div class="flex justify-between items-center">
                            <span class="text-white">{{ item.title || 'Untitled Draft' }}</span>
                            <div class="flex items-center gap-2">
                                <span v-if="item.version" class="text-xs text-gray-400">v{{ item.version }}</span>
                                <span class="text-xs text-gray-400">{{ formatDate(item.timestamp) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Permanent Quiz Items -->
                <div v-if="permanentItems.length">
                    <div class="px-4 py-2 text-sm font-medium text-blue-400 bg-gray-800">Permanent Quiz Items</div>
                    <div v-for="item in permanentItems" :key="item.id" @click="selectOption(item.id)"
                        class="px-4 py-2 cursor-pointer hover:bg-gray-700">
                        <div class="flex justify-between items-center">
                            <span class="text-blue-400">{{ String(item.id).padStart(3, '0') }}. {{ item.title }}</span>
                            <span class="text-xs text-blue-300">{{ formatDate(item.timestamp) }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: ''
    },
    userDrafts: {
        type: Array,
        default: () => []
    },
    pendingItems: {
        type: Array,
        default: () => []
    },
    otherDrafts: {
        type: Array,
        default: () => []
    },
    permanentItems: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    error: {
        type: String,
        default: ''
    }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);

const selectedLabel = computed(() => {
    const allItems = [...props.userDrafts, ...props.pendingItems, ...props.otherDrafts, ...props.permanentItems];
    const selected = allItems.find(item => item.id === props.modelValue);
    if (!selected) return '';
    return selected.title || 'Untitled';
});

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
};

const selectOption = (value) => {
    emit('update:modelValue', value);
    emit('change');
    isOpen.value = false;
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.relative')) {
        isOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Log props for debugging
console.log('CustomDropdown props:', {
    userDrafts: props.userDrafts.map(item => ({
        id: item.id,
        title: item.title,
        version: item.version
    })),
    pendingItems: props.pendingItems.map(item => ({
        id: item.id,
        title: item.title,
        version: item.version
    })),
    otherDrafts: props.otherDrafts.map(item => ({
        id: item.id,
        title: item.title,
        version: item.version
    }))
});
</script>

<style scoped>
.max-h-96 {
    max-height: 24rem;
}
</style>