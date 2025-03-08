<template>
    <div class="top-scores bg-gray-800/50 dark:bg-gray-900/50 rounded-lg p-2 text-sm">
        <div class="flex items-center gap-2 mb-1">
            <svg class="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span class="text-gray-300 dark:text-gray-400">Top Scores</span>
        </div>
        <div v-if="isLoading" class="text-gray-400 text-xs">Loading...</div>
        <div v-else-if="error" class="text-red-400 text-xs">{{ error }}</div>
        <div v-else class="space-y-1">
            <!-- Top 5 scores -->
            <div v-for="(score, index) in topScores" :key="index"
                class="flex items-center justify-between text-gray-300 dark:text-gray-400"
                :class="{ 'font-bold': score.isCurrentUser }">
                <div class="flex items-center gap-2">
                    <span class="text-xs w-4">{{ index + 1 }}</span>
                    <span class="truncate max-w-[120px]">{{ score.displayName }}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-yellow-400">{{ score.totalScore }}</span>
                    <span class="text-xs text-gray-500">({{ score.totalScore }}/{{ totalAvailableQuestions }})</span>
                </div>
            </div>

            <!-- Divider line -->
            <div v-if="edJonesScore" class="border-t border-gray-700 my-1 pt-1"></div>

            <!-- Ed Jones score -->
            <div v-if="edJonesScore"
                class="flex items-center justify-between text-gray-300 dark:text-gray-400 font-bold">
                <div class="flex items-center gap-2">
                    <span class="text-xs w-4">{{ edJonesRank }}</span>
                    <span class="truncate max-w-[120px]">ed.jones</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-yellow-400">{{ edJonesScore.totalScore }}</span>
                    <span class="text-xs text-gray-500">({{ edJonesScore.totalScore }}/{{ totalAvailableQuestions
                    }})</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import { quizSets } from '../data/quizSets';

const topScores = ref([]);
const allScores = ref([]); // Store all scores to find Ed Jones' rank
const isLoading = ref(true);
const error = ref(null);
const authStore = useAuthStore();
const totalAvailableQuestions = ref(0);

// Function to format display name from email
const formatDisplayName = (email) => {
    if (!email || email === 'Anonymous') return 'Anonymous';
    return email.split('@')[0];
};

// Find Ed Jones' score
const edJonesScore = computed(() => {
    return allScores.value.find(score =>
        score.displayName === 'ed.jones' ||
        score.email === 'ed.jones@gmail.com'
    );
});

// Calculate Ed Jones' rank
const edJonesRank = computed(() => {
    if (!edJonesScore.value) return '';
    const rank = allScores.value.findIndex(score =>
        score.displayName === 'ed.jones' ||
        score.email === 'ed.jones@gmail.com'
    ) + 1;
    return rank;
});

// Calculate total questions from all published quiz sets
const calculateTotalQuestions = () => {
    let total = 0;
    quizSets.forEach(set => {
        if (!set.inProgress) { // Only count published quiz sets
            total += set.items.length;
        }
    });
    return total;
};

const fetchTopScores = async () => {
    try {
        isLoading.value = true;
        error.value = null;

        // Calculate total available questions
        totalAvailableQuestions.value = calculateTotalQuestions();
        console.log('Total available questions:', totalAvailableQuestions.value);

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

        // Track the most recent attempt for each user and quiz
        const userQuizAttempts = new Map();

        // Process progress documents first to get the most recent attempts
        progressSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = data.userId || doc.id.split('_')[0];
            const quizId = data.quizId || doc.id.split('_')[1];
            const timestamp = data.lastUpdated?.toDate() || data.timestamp || new Date(0);
            const userEmail = data.userEmail || 'Anonymous';

            if (!userId || !quizId) return;

            const key = `${userId}_${quizId}`;

            if (!userQuizAttempts.has(key) || timestamp > userQuizAttempts.get(key).timestamp) {
                userQuizAttempts.set(key, {
                    userId,
                    quizId,
                    timestamp,
                    userEmail,
                    totalCorrect: data.totalCorrect || 0,
                    isComplete: data.complete || false
                });
            }
        });

        // Process attempt documents to update or add to the most recent attempts
        attemptsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const userId = data.userId;
            const quizId = data.quizId;
            const timestamp = data.completedAt?.toDate() || data.timestamp || new Date(0);
            const userEmail = data.userEmail || 'Anonymous';

            if (!userId || !quizId) return;

            const key = `${userId}_${quizId}`;

            if (!userQuizAttempts.has(key) || timestamp > userQuizAttempts.get(key).timestamp) {
                userQuizAttempts.set(key, {
                    userId,
                    quizId,
                    timestamp,
                    userEmail,
                    totalCorrect: data.score || 0,
                    isComplete: true
                });
            }
        });

        // Now aggregate the most recent attempts by user
        userQuizAttempts.forEach((attempt, key) => {
            const userId = attempt.userId;
            const isCurrentUser = userId === authStore.user?.uid;
            const isEdJones = attempt.userEmail === 'ed.jones@gmail.com';

            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    displayName: formatDisplayName(attempt.userEmail),
                    email: attempt.userEmail,
                    totalScore: 0,
                    quizCount: 0,
                    isCurrentUser,
                    isEdJones,
                    userId,
                    quizzes: new Set()
                });
            }

            const userScore = userScores.get(userId);

            // Only count if the attempt is complete
            if (attempt.isComplete) {
                // Only count each quiz once (the most recent attempt)
                if (!userScore.quizzes.has(attempt.quizId)) {
                    userScore.totalScore += attempt.totalCorrect;
                    userScore.quizCount++;
                    userScore.quizzes.add(attempt.quizId);
                }
            }
        });

        // Special handling for current user if they don't have any scores yet
        if (authStore.user?.uid && !userScores.has(authStore.user.uid)) {
            console.log('Adding current user to scores list:', authStore.user.uid);
            userScores.set(authStore.user.uid, {
                displayName: formatDisplayName(authStore.user.email),
                email: authStore.user.email,
                totalScore: 0,
                quizCount: 0,
                isCurrentUser: true,
                isEdJones: authStore.user.email === 'ed.jones@gmail.com',
                userId: authStore.user.uid,
                quizzes: new Set()
            });
        }

        // Special handling for Ed Jones if not already in the list
        const hasEdJones = Array.from(userScores.values()).some(
            score => score.email === 'ed.jones@gmail.com' || score.displayName === 'ed.jones'
        );

        if (!hasEdJones) {
            // Create a placeholder for Ed Jones with zero score
            userScores.set('ed_jones_placeholder', {
                displayName: 'ed.jones',
                email: 'ed.jones@gmail.com',
                totalScore: 0,
                quizCount: 0,
                isCurrentUser: authStore.user?.email === 'ed.jones@gmail.com',
                isEdJones: true,
                userId: 'ed_jones_placeholder',
                quizzes: new Set()
            });
        }

        // Convert to array and sort by total score
        let scores = Array.from(userScores.values())
            .filter(score => score.quizCount >= 1 || score.isCurrentUser || score.isEdJones)
            .sort((a, b) => b.totalScore - a.totalScore);

        console.log('Final sorted scores:', scores);

        // Store all scores for rank calculation
        allScores.value = scores;

        // Only show top 5 in the list
        topScores.value = scores.slice(0, 5);
    } catch (err) {
        console.error('Error fetching top scores:', err);
        error.value = 'Failed to load top scores';
    } finally {
        isLoading.value = false;
    }
};

// Fetch scores on mount
onMounted(() => {
    fetchTopScores();
});

// Re-fetch when auth state changes
watch(() => authStore.user, () => {
    fetchTopScores();
}, { deep: true });
</script>

<style scoped>
.top-scores {
    backdrop-filter: blur(8px);
}
</style>