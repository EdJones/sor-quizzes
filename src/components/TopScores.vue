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
                class="flex items-center justify-between text-gray-300 dark:text-gray-400">
                <div class="flex items-center gap-2">
                    <span class="text-xs w-4">{{ index + 1 }}</span>
                    <span class="truncate max-w-[120px]">{{ score.displayName }}</span>
                </div>
                <div class="flex items-center gap-4">

                    <span class="text-xs text-gray-500">{{ score.totalScore }}/{{ totalAvailableQuestions }}</span>
                </div>
            </div>

            <!-- Next user with email -->
            <div v-if="nextEmailUser" class="border-t border-gray-700 my-1 pt-1"></div>
            <div v-if="nextEmailUser" class="flex items-center justify-between text-gray-300 dark:text-gray-400">
                <div class="flex items-center gap-2">


                </div>
                <div class="flex items-center gap-2">

                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import { quizSets } from '../data/quizSets';

const topScores = ref([]);
const allScores = ref([]); // Store all scores
const isLoading = ref(true);
const error = ref(null);
const authStore = useAuthStore();
const totalAvailableQuestions = ref(0);
const lastUpdated = ref(null);

// Function to format display name from email
const formatDisplayName = (email) => {
    if (!email || email === 'Anonymous') return 'Anonymous';
    return email.split('@')[0];
};

// Find the next user with an email
const nextEmailUser = computed(() => {
    // Filter users with valid emails
    const usersWithEmail = allScores.value.filter(score =>
        score.email &&
        score.email !== 'Anonymous' &&
        !score.email?.includes('undefined')
    );

    // Return the first one (highest score) if available
    return usersWithEmail.length > 0 ? usersWithEmail[0] : null;
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

// Save top scores to Firestore
const saveTopScoresToFirestore = async (scores) => {
    try {
        console.log('Saving top scores to Firestore:', scores);

        // Get current timestamp as a Date object instead of serverTimestamp()
        const now = new Date();

        // Create a document in the topScores collection
        const topScoresRef = doc(db, 'topScores', 'latest');

        // Prepare the data to save
        const topScoresData = {
            scores: scores.map(score => ({
                userId: score.userId,
                displayName: score.displayName,
                email: score.email,
                totalScore: score.totalScore,
                quizCount: score.quizCount,
                // Use a regular Date object instead of serverTimestamp()
                lastUpdated: now
            })),
            totalAvailableQuestions: totalAvailableQuestions.value,
            // Use serverTimestamp() only at the top level
            lastUpdated: serverTimestamp()
        };

        // Save to Firestore
        await setDoc(topScoresRef, topScoresData);
        console.log('Top scores saved successfully');

        // Also save individual user scores
        for (const score of scores) {
            if (score.userId) {
                const userScoreRef = doc(db, 'userScores', score.userId);
                await setDoc(userScoreRef, {
                    userId: score.userId,
                    displayName: score.displayName,
                    email: score.email,
                    totalScore: score.totalScore,
                    quizCount: score.quizCount,
                    // This is fine because it's not in an array
                    lastUpdated: serverTimestamp()
                }, { merge: true }); // Use merge to update only these fields
            }
        }
        console.log('Individual user scores saved successfully');

    } catch (err) {
        console.error('Error saving top scores to Firestore:', err);
    }
};

// Fetch top scores from Firestore
const fetchTopScoresFromFirestore = async () => {
    try {
        isLoading.value = true;
        error.value = null;

        // Get the top scores document from Firestore
        const topScoresRef = doc(db, 'topScores', 'latest');
        const topScoresDoc = await getDoc(topScoresRef);

        if (topScoresDoc.exists()) {
            const data = topScoresDoc.data();
            console.log('Fetched top scores from Firestore:', data);

            // Set the total available questions
            totalAvailableQuestions.value = data.totalAvailableQuestions || calculateTotalQuestions();

            // Set the last updated timestamp
            lastUpdated.value = data.lastUpdated?.toDate() || new Date();

            // Process the scores
            const scores = data.scores || [];

            // Store all scores
            allScores.value = scores;

            // Only show top 5 in the list
            topScores.value = scores.slice(0, 5);

            console.log('Top scores loaded from Firestore successfully');

            // If the current user is logged in, check if they're in the scores
            if (authStore.user?.uid) {
                const userScoreRef = doc(db, 'userScores', authStore.user.uid);
                const userScoreDoc = await getDoc(userScoreRef);

                if (userScoreDoc.exists()) {
                    const userData = userScoreDoc.data();
                    console.log('Current user score from Firestore:', userData);

                    // Check if the user is already in the scores
                    const userInScores = allScores.value.some(score => score.userId === authStore.user.uid);

                    if (!userInScores) {
                        // Add the current user to the scores
                        const userScore = {
                            userId: authStore.user.uid,
                            displayName: userData.displayName || formatDisplayName(authStore.user.email),
                            email: userData.email || authStore.user.email,
                            totalScore: userData.totalScore || 0,
                            quizCount: userData.quizCount || 0,
                            isCurrentUser: true
                        };

                        allScores.value.push(userScore);

                        // Re-sort the scores
                        allScores.value.sort((a, b) => b.totalScore - a.totalScore);
                    }
                }
            }

            return true;
        } else {
            console.log('No top scores document found in Firestore, will calculate scores');
            return false;
        }
    } catch (err) {
        console.error('Error fetching top scores from Firestore:', err);
        return false;
    } finally {
        isLoading.value = false;
    }
};

// Check and update top scores when a quiz is completed
const checkAndUpdateTopScores = async (userId, quizId, score, userEmail) => {
    try {
        console.log(`Checking if user ${userId} is now a top scorer with score ${score} on quiz ${quizId}`);

        // First, get the current top scores
        const topScoresRef = doc(db, 'topScores', 'latest');
        const topScoresDoc = await getDoc(topScoresRef);

        // Get the user's current score document
        const userScoreRef = doc(db, 'userScores', userId);
        const userScoreDoc = await getDoc(userScoreRef);

        let userTotalScore = 0;
        let userQuizCount = 0;
        let displayName = 'Anonymous';

        // If user already has a score document, use that data
        if (userScoreDoc.exists()) {
            const userData = userScoreDoc.data();
            userTotalScore = userData.totalScore || 0;
            userQuizCount = userData.quizCount || 0;
            displayName = userData.displayName || formatDisplayName(userEmail);
        } else {
            // Otherwise, format the display name from the email
            displayName = formatDisplayName(userEmail);
        }

        // Add the new score
        userTotalScore += score;
        userQuizCount += 1;

        // Update the user's score document
        await setDoc(userScoreRef, {
            userId,
            displayName,
            email: userEmail,
            totalScore: userTotalScore,
            quizCount: userQuizCount,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        // If we have top scores, check if the user is now a top scorer
        if (topScoresDoc.exists()) {
            const data = topScoresDoc.data();
            const scores = data.scores || [];
            const totalAvailableQs = data.totalAvailableQuestions || calculateTotalQuestions();

            // Find if the user is already in the scores
            const userScoreIndex = scores.findIndex(s => s.userId === userId);

            if (userScoreIndex >= 0) {
                // Update the user's score
                scores[userScoreIndex].totalScore = userTotalScore;
                scores[userScoreIndex].quizCount = userQuizCount;
                scores[userScoreIndex].displayName = displayName;
                scores[userScoreIndex].email = userEmail;
            } else {
                // Add the user to the scores
                scores.push({
                    userId,
                    displayName,
                    email: userEmail,
                    totalScore: userTotalScore,
                    quizCount: userQuizCount,
                    lastUpdated: new Date()
                });
            }

            // Sort the scores
            scores.sort((a, b) => b.totalScore - a.totalScore);

            // Save the updated scores
            await setDoc(topScoresRef, {
                scores,
                totalAvailableQuestions: totalAvailableQs,
                lastUpdated: serverTimestamp()
            });

            console.log('Top scores updated successfully after quiz completion');

            // Refresh the component's data
            await fetchTopScoresFromFirestore();

            return true;
        } else {
            // If no top scores document exists yet, recalculate from scratch
            await fetchTopScores();
            return true;
        }
    } catch (err) {
        console.error('Error checking and updating top scores:', err);
        return false;
    }
};

const fetchTopScores = async () => {
    try {
        isLoading.value = true;
        error.value = null;

        // First try to fetch scores from Firestore
        const scoresLoaded = await fetchTopScoresFromFirestore();

        // If scores were loaded successfully, we're done
        if (scoresLoaded) {
            return;
        }

        // Otherwise, calculate scores from scratch
        console.log('Calculating scores from scratch...');

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

            // Try multiple fields for email to increase chances of finding it
            const userEmail = data.userEmail || data.email || data.user?.email || 'Anonymous';

            console.log('Progress doc:', { userId, quizId, userEmail, data });

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

            // Try multiple fields for email to increase chances of finding it
            const userEmail = data.userEmail || data.email || data.user?.email || 'Anonymous';

            console.log('Attempt doc:', { userId, quizId, userEmail, data });

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

            if (!userScores.has(userId)) {
                userScores.set(userId, {
                    displayName: formatDisplayName(attempt.userEmail),
                    email: attempt.userEmail,
                    totalScore: 0,
                    quizCount: 0,
                    isCurrentUser,
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
            console.log('Adding current user to scores list:', {
                uid: authStore.user.uid,
                email: authStore.user.email,
                displayName: formatDisplayName(authStore.user.email)
            });

            userScores.set(authStore.user.uid, {
                displayName: formatDisplayName(authStore.user.email),
                email: authStore.user.email,
                totalScore: 0,
                quizCount: 0,
                isCurrentUser: true,
                userId: authStore.user.uid,
                quizzes: new Set()
            });
        }
        // If current user exists but doesn't have email set, update it
        else if (authStore.user?.uid && userScores.has(authStore.user.uid) && authStore.user.email) {
            const userScore = userScores.get(authStore.user.uid);
            if (!userScore.email || userScore.email === 'Anonymous') {
                console.log('Updating current user email:', {
                    before: userScore.email,
                    after: authStore.user.email
                });
                userScore.email = authStore.user.email;
                userScore.displayName = formatDisplayName(authStore.user.email);
            }
        }

        // Convert to array and sort by total score
        let scores = Array.from(userScores.values())
            .filter(score => score.quizCount >= 1 || score.isCurrentUser)
            .sort((a, b) => b.totalScore - a.totalScore);

        console.log('Final sorted scores:', scores);

        // Check if we have any users with emails
        const hasEmailUsers = scores.some(score =>
            score.email &&
            score.email !== 'Anonymous' &&
            !score.email?.includes('undefined')
        );

        // If no email users found, add a test one for debugging
        if (!hasEmailUsers && !scores.some(s => s.email === 'test.user@example.com')) {
            console.log('No email users found, adding a test user for debugging');
            scores.push({
                displayName: 'test.user',
                email: 'test.user@example.com',
                totalScore: Math.floor(Math.random() * 20) + 10, // Random score between 10-30
                quizCount: 1,
                isCurrentUser: false,
                userId: 'test_user_id',
                quizzes: new Set(['general'])
            });

            // Re-sort the scores
            scores = scores.sort((a, b) => b.totalScore - a.totalScore);
        }

        // Store all scores for rank calculation
        allScores.value = scores;

        // Only show top 5 in the list
        topScores.value = scores.slice(0, 5);

        // Save top scores to Firestore
        await saveTopScoresToFirestore(scores);

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

// Export the checkAndUpdateTopScores function so it can be called from other components
defineExpose({
    checkAndUpdateTopScores
});
</script>

<style scoped>
.top-scores {
    backdrop-filter: blur(8px);
}
</style>