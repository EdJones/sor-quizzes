<template>
    <div v-if="shouldShowTopScores" class="top-scores bg-gray-800/50 dark:bg-gray-900/50 rounded-lg p-2 text-sm">
        <div class="flex items-center gap-2 mb-0.5">
            <svg class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span class="text-gray-300 dark:text-gray-400 text-xs">Top Scores</span>
        </div>
        <div v-if="scoreStore.isLoading" class="text-gray-400 text-xs">Loading...</div>
        <div v-else-if="scoreStore.error" class="text-red-400 text-xs">{{ scoreStore.error }}</div>
        <div v-else class="space-y-0">
            <!-- Top 5 scores -->
            <div v-for="(score, index) in scoreStore.topScores" :key="index"
                class="flex items-center justify-between text-gray-300 dark:text-gray-400" style="gap: 0.5rem;">
                <div class="flex items-center gap-1">
                    <span class="w-3">{{ index + 1 }}</span>
                    <span class="text-xs truncate max-w-[120px]">{{ displayName(score) }}</span>
                </div>
                <span class="text-xs">{{ score.totalScore }}/{{ scoreStore.totalAvailableQuestions }}</span>
            </div>

            <!-- Next user with email (not in top 5) -->
        </div>
    </div>
</template>

<script setup>
import { onMounted, watch, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useScoreStore } from '../stores/scoreStore';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const scoreStore = useScoreStore();
const route = useRoute();

// Compute whether to show top scores based on current route
const shouldShowTopScores = computed(() => {
    const hiddenRoutes = ['/edit-item', '/quizsetview', '/issues'];
    const currentPath = route.path.toLowerCase();
    return !hiddenRoutes.some(path => currentPath.startsWith(path));
});

// Helper function to check if a score has a valid email
const hasValidEmail = (score) => {
    try {
        if (!score) return false;
        return score.email &&
            score.email !== 'Anonymous' &&
            !score.email?.includes('undefined') &&
            score.email.includes('@');
    } catch (error) {
        console.error('Error in hasValidEmail:', error, { score });
        return false;
    }
};

// Helper function to display the name or email
const displayName = (score) => {
    try {
        if (!score) return 'Anon_user';
        console.log('Score data for display name:', {
            score,
            hasUsername: !!score.username,
            username: score.username,
            email: score.email,
            userId: score.userId
        });
        if (score.username) {
            return score.username;
        }
        if (score.email && score.email !== 'Anonymous' && !score.email.includes('undefined') && score.email.includes('@')) {
            return score.email.split('@')[0];
        }
        // Always generate Anon_ format for anonymous users, ignore stored displayName
        return `Anon_${score.userId?.substring(0, 6) || 'user'}`;
    } catch (error) {
        console.error('Error in displayName:', error, { score });
        return 'Anon_user';
    }
};

// Fetch scores on mount
onMounted(() => {
    try {
        scoreStore.fetchTopScores().catch(error => {
            console.error('Error fetching top scores:', error);
            // Handle specific cross-origin errors
            if (error.name === 'SecurityError') {
                console.warn('Cross-origin security error detected. This may be due to iframe interactions.');
            }
        });
    } catch (error) {
        console.error('Error in TopScores component:', error);
    }
});

// Re-fetch when auth state changes
watch(() => authStore.user, () => {
    try {
        scoreStore.fetchTopScores().catch(error => {
            console.error('Error fetching top scores on auth change:', error);
        });
    } catch (error) {
        console.error('Error in TopScores auth watch:', error);
    }
}, { deep: true });
</script>

<style scoped>
.top-scores {
    backdrop-filter: blur(8px);
}
</style>