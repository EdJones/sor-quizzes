import { defineStore } from 'pinia';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from './authStore';
import { quizSets } from '../data/quizSets';

export const useScoreStore = defineStore('scores', {
    state: () => ({
        topScores: [],
        allScores: [],
        totalAvailableQuestions: 0,
        lastUpdated: null,
        isLoading: false,
        error: null
    }),

    getters: {
        // Get the next user with a valid email
        nextEmailUser: (state) => {
            // Filter users with valid emails (excluding the top 5 users to avoid duplication)
            const topFiveIds = state.topScores.map(score => score.userId);

            const usersWithEmail = state.allScores.filter(score =>
                score.email &&
                score.email !== 'Anonymous' &&
                !score.email?.includes('undefined') &&
                !topFiveIds.includes(score.userId) // Exclude users already in top 5
            );

            console.log('Users with email (excluding top 5):', usersWithEmail);

            // Return the first one (highest score) if available
            return usersWithEmail.length > 0 ? usersWithEmail[0] : null;
        }
    },

    actions: {
        // Format display name from email
        formatDisplayName(email) {
            if (!email || email === 'Anonymous') return 'Anon_user';

            // If it's a valid email, only show the part before the @ symbol
            if (email.includes('@') && !email.includes('undefined')) {
                return email.split('@')[0];
            }

            // Otherwise return the email as is, or Anon_user if it's Anonymous
            return email === 'Anonymous' ? 'Anon_user' : email;
        },

        // Calculate total questions from all published quiz sets
        calculateTotalQuestions() {
            let total = 0;
            quizSets.forEach(set => {
                if (!set.inProgress) { // Only count published quiz sets
                    total += set.items.length;
                }
            });
            return total;
        },

        // Save top scores to Firestore
        async saveTopScoresToFirestore(scores) {
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
                    totalAvailableQuestions: this.totalAvailableQuestions,
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
                this.error = 'Failed to save scores';
            }
        },

        // Fetch top scores from Firestore
        async fetchTopScoresFromFirestore() {
            this.isLoading = true;
            this.error = null;
            try {
                // Get the top scores document from Firestore
                const topScoresRef = doc(db, 'topScores', 'latest');
                const topScoresDoc = await getDoc(topScoresRef);

                if (topScoresDoc.exists()) {
                    const data = topScoresDoc.data();
                    console.log('Fetched top scores from Firestore:', data);

                    // Set the total available questions
                    this.totalAvailableQuestions = data.totalAvailableQuestions || this.calculateTotalQuestions();

                    // Get all user documents for the scores to fetch usernames
                    const processedScores = await Promise.all(
                        (data.scores || []).map(async (score) => {
                            if (score.userId) {
                                const userDoc = await getDoc(doc(db, 'users', score.userId));
                                // Get username from user document or from existing score data
                                const username = userDoc.exists() ?
                                    userDoc.data().username :
                                    score.username || null;

                                // Format display name consistently
                                let displayName;
                                if (username) {
                                    displayName = username;
                                } else if (score.email && score.email !== 'Anonymous' && !score.email.includes('undefined') && score.email.includes('@')) {
                                    displayName = this.formatDisplayName(score.email);
                                } else {
                                    displayName = `Anon_${score.userId.substring(0, 6)}...`;
                                }

                                console.log('Processing score:', {
                                    userId: score.userId,
                                    username,
                                    displayName,
                                    originalUsername: score.username
                                });

                                return {
                                    ...score,
                                    username,
                                    displayName
                                };
                            }
                            return {
                                ...score,
                                username: null,
                                displayName: score.userId ? `Anon_${score.userId.substring(0, 6)}...` : 'Anon_user'
                            };
                        })
                    );

                    // Store all scores
                    this.allScores = processedScores;

                    // Only show top 5 in the list
                    this.topScores = processedScores.slice(0, 5);

                    this.lastUpdated = data.lastUpdated?.toDate() || new Date();
                    console.log('Processed scores:', this.topScores);
                } else {
                    console.log('No top scores document found in Firestore');
                    this.topScores = [];
                    this.allScores = [];
                }
            } catch (error) {
                console.error('Error fetching top scores:', error);
                this.error = error.message;
            } finally {
                this.isLoading = false;
            }
        },

        // Check and update top scores when a quiz is completed
        async checkAndUpdateTopScores(userId, quizId, score, userEmail) {
            try {
                console.log(`Checking if user ${userId} score ${score} on quiz ${quizId} belongs in top 10`);

                // Get the user's document to fetch the username
                const userDoc = await getDoc(doc(db, 'users', userId));
                const username = userDoc.exists() ? userDoc.data().username : null;

                // Set display name with preference order: username > email > anonymous format
                let displayName;
                if (username) {
                    displayName = username;
                } else if (userEmail && userEmail !== 'Anonymous' && !userEmail.includes('undefined') && userEmail.includes('@')) {
                    displayName = this.formatDisplayName(userEmail);
                } else {
                    displayName = `Anon_${userId.substring(0, 6)}...`;
                }

                // Get current top scores
                const topScoresRef = doc(db, 'topScores', 'latest');
                const topScoresDoc = await getDoc(topScoresRef);
                const data = topScoresDoc.exists() ? topScoresDoc.data() : { scores: [] };
                let scores = data.scores || [];

                // Find if the user already has a score
                const existingScoreIndex = scores.findIndex(s => s.userId === userId);
                const now = new Date();

                if (existingScoreIndex >= 0) {
                    // Update existing score if the new score is higher
                    const existingScore = scores[existingScoreIndex];
                    if (score > existingScore.totalScore) {
                        scores[existingScoreIndex] = {
                            ...existingScore,
                            totalScore: score,
                            displayName,
                            username,
                            email: userEmail,
                            lastUpdated: now
                        };
                        scores.sort((a, b) => b.totalScore - a.totalScore);
                    }
                } else {
                    // Add new score
                    const newScore = {
                        userId,
                        displayName,
                        username,
                        email: userEmail,
                        totalScore: score,
                        lastUpdated: now
                    };

                    // Add to scores array if it's in top 10
                    scores.push(newScore);
                    scores.sort((a, b) => b.totalScore - a.totalScore);
                    scores = scores.slice(0, 10); // Keep only top 10
                }

                // Save updated scores if there were changes
                await setDoc(topScoresRef, {
                    scores,
                    totalAvailableQuestions: this.calculateTotalQuestions(),
                    lastUpdated: serverTimestamp()
                });

                console.log('Top scores updated successfully');

                // Refresh the store's data
                await this.fetchTopScoresFromFirestore();

                return true;
            } catch (err) {
                console.error('Error checking and updating top scores:', err);
                this.error = 'Failed to update scores';
                return false;
            }
        },

        // Fetch top scores (first try from Firestore, then calculate if needed)
        async fetchTopScores() {
            return this.fetchTopScoresFromFirestore();
        },

        // For use by AdminTools.vue
        // One-time function to collect mostRecentAttempts from userProgress and update topScores
        async collectAndUpdateMostRecentAttempts() {
            try {
                // Get all userProgress documents
                const progressRef = collection(db, 'userProgress');
                const progressSnapshot = await getDocs(progressRef);

                // Create a map of quiz set names
                const quizSetNames = {};
                // Map quiz IDs to their set names
                quizSets.forEach((set, index) => {
                    if (set.display !== "debug") {
                        // Map both the setName and the numeric index
                        quizSetNames[set.setName] = set.setName;
                        quizSetNames[String(index)] = set.setName;
                    }
                });
                // Map legacy ID "0" to "general"
                quizSetNames["0"] = "general";

                console.log('Quiz set names:', quizSetNames);

                // Group progress by userId
                const userProgressMap = new Map();

                progressSnapshot.docs.forEach(doc => {
                    const progressData = doc.data();
                    const [userId, quizId] = doc.id.split('_');

                    // Map quiz ID to set name
                    const mappedQuizId = quizId === "0" ? "general" : quizId;
                    const quizSetName = quizSetNames[mappedQuizId] || quizSets[Number(mappedQuizId)]?.setName || mappedQuizId;

                    if (!userProgressMap.has(userId)) {
                        userProgressMap.set(userId, new Map());
                    }

                    const userAttempts = userProgressMap.get(userId);
                    const existingAttempt = userAttempts.get(mappedQuizId);

                    if (!existingAttempt || progressData.lastUpdated > existingAttempt.lastUpdated) {
                        userAttempts.set(mappedQuizId, {
                            totalCorrect: progressData.totalCorrect || 0,
                            totalAnswered: progressData.totalQuestions || 0,
                            lastUpdated: progressData.lastUpdated,
                            quizSetName: quizSetName
                        });
                    }
                });

                // Get current top scores
                const topScoresRef = doc(db, 'topScores', 'latest');
                const topScoresDoc = await getDoc(topScoresRef);

                if (!topScoresDoc.exists()) {
                    console.log('No top scores document found');
                    return;
                }

                const data = topScoresDoc.data();
                let scores = data.scores || [];

                // Update each score with mostRecentAttempts
                scores = scores.map(score => {
                    const userAttempts = userProgressMap.get(score.userId);
                    if (!userAttempts) return score;

                    const mostRecentAttempts = {};
                    userAttempts.forEach((attempt, quizId) => {
                        mostRecentAttempts[quizId] = {
                            totalCorrect: attempt.totalCorrect,
                            totalAnswered: attempt.totalAnswered,
                            quizSetName: attempt.quizSetName
                        };
                    });

                    // Calculate totalRecentAnswers
                    const totalRecentAnswers = Object.values(mostRecentAttempts).reduce((sum, attempt) =>
                        sum + (attempt.totalAnswered || 0), 0);

                    console.log(`Processing user ${score.userId}:`, {
                        mostRecentAttempts,
                        totalRecentAnswers
                    });

                    return {
                        ...score,
                        mostRecentAttempts,
                        totalRecentAnswers
                    };
                });

                // Save updated scores
                await setDoc(topScoresRef, {
                    ...data,
                    scores,
                    lastUpdated: serverTimestamp()
                });

                console.log('Successfully updated top scores with mostRecentAttempts and quiz set names');

                // Refresh the store's data
                await this.fetchTopScoresFromFirestore();

            } catch (error) {
                console.error('Error collecting and updating most recent attempts:', error);
                this.error = 'Failed to update most recent attempts';
            }
        }
    }
}); 