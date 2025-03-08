<template>
    <div class="top-scores bg-gray-800/50 dark:bg-gray-900/50 rounded-lg p-2 text-sm">
        <div class="flex items-center gap-2 mb-1">
            <svg class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span class="text-gray-300 dark:text-gray-400">Top Performers</span>
        </div>
        <div v-if="isLoading" class="text-gray-400 text-xs">Loading...</div>
        <div v-else-if="error" class="text-red-400 text-xs">{{ error }}</div>
        <div v-else class="space-y-1">
            <div v-for="(score, index) in topScores" :key="index"
                class="flex items-center justify-between text-gray-300 dark:text-gray-400">
                <div class="flex items-center gap-2">
                    <span class="text-xs w-4">{{ index + 1 }}</span>
                    <span class="truncate max-w-[120px]">{{ score.displayName }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-yellow-400">{{ score.averagePercentage }}%</span>
                    <span class="text-xs text-gray-500">({{ score.quizCount }})</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const topScores = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchTopScores = async () => {
    try {
        isLoading.value = true;
        error.value = null;

        // Query all quiz attempts
        const attemptsRef = collection(db, 'quizAttempts');
        const querySnapshot = await getDocs(attemptsRef);

        // Aggregate scores by user
        const userScores = new Map();

        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            const userEmail = data.userEmail || 'Anonymous';

            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    displayName: userEmail.split('@')[0],
                    totalScore: 0,
                    totalQuestions: 0,
                    quizCount: 0
                });
            }

            const userScore = userScores.get(userId);
            userScore.totalScore += data.score || 0;
            userScore.totalQuestions += data.totalQuestions || 0;
            userScore.quizCount++;
        });

        // Calculate averages and convert to array
        const scores = Array.from(userScores.values())
            .map(score => ({
                ...score,
                averagePercentage: Math.round((score.totalScore / score.totalQuestions) * 100)
            }))
            .filter(score => score.quizCount >= 2) // Only include users who have taken at least 2 quizzes
            .sort((a, b) => b.averagePercentage - a.averagePercentage)
            .slice(0, 5);

        topScores.value = scores;
    } catch (err) {
        console.error('Error fetching top scores:', err);
        error.value = 'Failed to load top scores';
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchTopScores();
});
</script>

<style scoped>
.top-scores {
    backdrop-filter: blur(8px);
}
</style>