<template>
    <div class="top-scores bg-gray-800/50 dark:bg-gray-900/50 rounded-lg p-2 text-sm">
        <div class="flex items-center gap-2 mb-1">
            <svg class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span class="text-gray-300 dark:text-gray-400">Best Scores</span>
        </div>
        <div v-if="isLoading" class="text-gray-400 text-xs">Loading...</div>
        <div v-else-if="error" class="text-red-400 text-xs">{{ error }}</div>
        <div v-else class="space-y-1">
            <div v-for="(score, index) in topScores" :key="index"
                class="flex items-center justify-between text-gray-300 dark:text-gray-400"
                :class="{ 'font-bold': score.isCurrentUser }">
                <div class="flex items-center gap-2">
                    <span class="text-xs w-4">{{ index + 1 }}</span>
                    <span class="truncate max-w-[120px]">{{ score.displayName }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-yellow-400">{{ score.totalScore }}</span>
                    <span class="text-xs text-gray-500">({{ score.quizCount }})</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { useAuthStore } from '../stores/authStore';

const topScores = ref([]);
const isLoading = ref(true);
const error = ref(null);
const authStore = useAuthStore();

const fetchTopScores = async () => {
    try {
        isLoading.value = true;
        error.value = null;

        // Query both userProgress and quizAttempts collections
        const progressRef = collection(db, 'userProgress');
        const attemptsRef = collection(db, 'quizAttempts');

        const [progressSnapshot, attemptsSnapshot] = await Promise.all([
            getDocs(progressRef),
            getDocs(attemptsRef)
        ]);

        console.log('Current user:', {
            uid: authStore.user?.uid,
            email: authStore.user?.email,
            isAnonymous: authStore.user?.isAnonymous
        });
        console.log('Total progress docs:', progressSnapshot.size);
        console.log('Total attempt docs:', attemptsSnapshot.size);

        // Aggregate scores by user
        const userScores = new Map();

        // Process progress documents
        progressSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Use userId from the data first, then fall back to extracting from doc ID
            const userId = data.userId || doc.id.split('_')[0];
            const userEmail = data.userEmail || 'Anonymous';
            const isCurrentUser = userId === authStore.user?.uid;

            console.log('Processing progress doc:', {
                docId: doc.id,
                userId,
                userEmail,
                data,
                lastUpdated: data.lastUpdated?.toDate(),
                isCurrentUser,
                currentUserEmail: authStore.user?.email,
                totalCorrect: data.totalCorrect,
                userAnswers: data.userAnswers?.filter(a => a.correct)?.length
            });

            if (!userId) {
                console.warn('Progress document missing userId:', doc.id);
                return;
            }

            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    displayName: userEmail === 'Anonymous' ? 'Anonymous' : userEmail.split('@')[0],
                    totalScore: 0,
                    quizCount: 0,
                    isCurrentUser
                });
            }

            const userScore = userScores.get(userId);

            // Count correct answers from userAnswers or totalCorrect
            if (data.userAnswers) {
                const correctAnswers = data.userAnswers.filter(answer => answer.correct).length;
                console.log('Adding correct answers from userAnswers:', correctAnswers);
                userScore.totalScore += correctAnswers;
            } else if (data.totalCorrect) {
                console.log('Adding totalCorrect:', data.totalCorrect);
                userScore.totalScore += data.totalCorrect;
            }

            // Only increment quiz count if this is a completed quiz
            if (data.complete || data.totalCorrect > 0) {
                userScore.quizCount++;
                console.log('Incremented quiz count for user:', userId, 'New count:', userScore.quizCount);
            }
        });

        // Process attempt documents
        attemptsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // For attempt documents, use the userId from the data
            const userId = data.userId;
            const userEmail = data.userEmail || 'Anonymous';
            const isCurrentUser = userId === authStore.user?.uid;

            console.log('Processing attempt doc:', {
                docId: doc.id,
                userId,
                userEmail,
                data,
                lastUpdated: data.lastUpdated?.toDate(),
                isCurrentUser,
                currentUserEmail: authStore.user?.email,
                score: data.score,
                totalQuestions: data.totalQuestions
            });

            if (!userId) {
                console.warn('Attempt document missing userId:', doc.id);
                return;
            }

            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    displayName: userEmail === 'Anonymous' ? 'Anonymous' : userEmail.split('@')[0],
                    totalScore: 0,
                    quizCount: 0,
                    isCurrentUser
                });
            }

            const userScore = userScores.get(userId);

            // Add score from attempt
            if (data.score) {
                console.log('Adding score from attempt:', data.score);
                userScore.totalScore += data.score;
            }

            // Increment quiz count for completed attempts
            if (data.completedAt) {
                userScore.quizCount++;
                console.log('Incremented quiz count for user:', userId, 'New count:', userScore.quizCount);
            }
        });

        console.log('Final user scores before filtering:', Array.from(userScores.entries()).map(([userId, score]) => ({
            userId,
            ...score
        })));

        // Convert to array and sort by total score
        let scores = Array.from(userScores.values())
            .filter(score => score.quizCount >= 1) // Include all users who have taken at least 1 quiz
            .sort((a, b) => b.totalScore - a.totalScore);

        console.log('Final sorted scores:', scores);

        topScores.value = scores.slice(0, 5);
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