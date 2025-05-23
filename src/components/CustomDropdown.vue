<template>
    <div class="custom-dropdown relative" @keydown.esc="isOpen = false">
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
                                <button v-if="item.userId !== auth.user?.uid" @click="handleFork(item, $event)"
                                    :disabled="isForking"
                                    class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                                    <span v-if="isForking">Forking...</span>
                                    <span v-else>Fork</span>
                                    <svg v-if="isForking" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </button>
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
                                <button v-if="item.userId !== auth.user?.uid" @click="handleFork(item, $event)"
                                    :disabled="isForking"
                                    class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                                    <span v-if="isForking">Forking...</span>
                                    <span v-else>Fork</span>
                                    <svg v-if="isForking" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </button>
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
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-blue-300">{{ formatDate(item.timestamp) }}</span>
                                <button v-if="item.userId !== auth.user?.uid" @click="handleFork(item, $event)"
                                    :disabled="isForking"
                                    class="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                                    <span v-if="isForking">Forking...</span>
                                    <span v-else>Fork</span>
                                    <svg v-if="isForking" class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fork Success Message -->
                <div v-if="forkSuccess" class="px-4 py-2 text-green-400 bg-gray-800 border-t border-gray-700">
                    Successfully forked quiz item!
                </div>

                <!-- Fork Error Message -->
                <div v-if="forkError" class="px-4 py-2 text-red-400 bg-gray-800 border-t border-gray-700">
                    {{ forkError }}
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { quizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';

const props = defineProps({
    modelValue: {
        type: String,
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
    acceptedItems: {
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
const store = quizStore();
const auth = useAuthStore();
const isOpen = ref(false);
const selectedValue = ref(props.modelValue);
const isForking = ref(false);
const forkSuccess = ref(false);
const forkError = ref(null);

const selectedLabel = computed(() => {
    const allItems = [...props.userDrafts, ...props.pendingItems, ...props.otherDrafts, ...props.permanentItems];
    const selected = allItems.find(item => item.id === props.modelValue);
    if (!selected) return '';
    return selected.title || 'Untitled';
});

const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
    // Reset fork states when opening dropdown
    if (isOpen.value) {
        forkSuccess.value = false;
        forkError.value = null;
    }
};

const selectOption = async (value) => {
    selectedValue.value = value;
    emit('update:modelValue', value);
    emit('change', value);
    isOpen.value = false;
};

const handleFork = async (item, event) => {
    event.stopPropagation(); // Prevent dropdown from closing
    isForking.value = true;
    forkError.value = null;
    
    try {
        // Log the item being forked
        console.log('Forking quiz entry:', {
            id: item.id,
            title: item.title,
            isPermanent: item.isPermanent,
            originalId: item.originalId || item.id // Use originalId if available, otherwise use id
        });

        // Ensure we have a valid ID
        if (!item.id && !item.originalId) {
            throw new Error('Invalid quiz entry ID');
        }

        // Fork the quiz entry using the appropriate ID
        const idToFork = item.originalId || item.id;
        const newId = await store.forkQuizEntry(idToFork);
        
        // Log the result
        console.log('Successfully forked quiz entry:', {
            originalId: idToFork,
            newId: newId
        });

        forkSuccess.value = true;
        // Close dropdown after successful fork
        setTimeout(() => {
            isOpen.value = false;
            isForking.value = false;
            forkSuccess.value = false;
        }, 1500);
    } catch (error) {
        console.error('Error forking quiz entry:', error);
        forkError.value = error.message || 'Failed to fork quiz entry';
        isForking.value = false;
    }
};

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
    if (!event.target.closest('.custom-dropdown')) {
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
.custom-dropdown {
    position: relative;
    width: 100%;
}

.custom-dropdown button {
    transition: all 0.2s ease;
}

.custom-dropdown button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.max-h-96 {
    max-height: 24rem;
}

.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>