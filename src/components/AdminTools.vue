<template>
    <div class="admin-tools p-4">
        <button @click="updateMostRecentAttempts"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" :disabled="isUpdating">
            {{ isUpdating ? 'Updating...' : 'Update Most Recent Attempts' }}
        </button>
        <div v-if="updateStatus" :class="['mt-2', updateStatus.success ? 'text-green-600' : 'text-red-600']">
            {{ updateStatus.message }}
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useScoreStore } from '../stores/scoreStore';

const scoreStore = useScoreStore();
const isUpdating = ref(false);
const updateStatus = ref(null);

const updateMostRecentAttempts = async () => {
    try {
        isUpdating.value = true;
        await scoreStore.collectAndUpdateMostRecentAttempts();
        updateStatus.value = {
            success: true,
            message: 'Successfully updated most recent attempts'
        };
    } catch (error) {
        console.error('Error updating most recent attempts:', error);
        updateStatus.value = {
            success: false,
            message: 'Failed to update most recent attempts: ' + error.message
        };
    } finally {
        isUpdating.value = false;
    }
};
</script>