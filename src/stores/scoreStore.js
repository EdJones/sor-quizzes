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
            if (!email || email === 'Anonymous') return 'Anonymous';

            // If it's a valid email, show the full email
            if (email.includes('@') && !email.includes('undefined')) {
                return email; // Return the full email address
            }

            // Otherwise just return the part before the @ symbol
            return email.split('@')[0];
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
            try {
                this.isLoading = true;
                this.error = null;

                // Get the top scores document from Firestore
                const topScoresRef = doc(db, 'topScores', 'latest');
                const topScoresDoc = await getDoc(topScoresRef);

                if (topScoresDoc.exists()) {
                    const data = topScoresDoc.data();
                    console.log('Fetched top scores from Firestore:', data);

                    // Set the total available questions
                    this.totalAvailableQuestions = data.totalAvailableQuestions || this.calculateTotalQuestions();

                    // Set the last updated timestamp
                    this.lastUpdated = data.lastUpdated?.toDate() || new Date();

                    // Process the scores
                    const scores = data.scores || [];

                    // Process each score to ensure email is properly handled
                    const processedScores = scores.map(score => {
                        // Ensure email is properly formatted
                        const hasValidEmail = score.email &&
                            score.email !== 'Anonymous' &&
                            !score.email?.includes('undefined') &&
                            score.email.includes('@');

                        // If it has a valid email, use it for the display name
                        if (hasValidEmail) {
                            return {
                                ...score,
                                displayName: score.email // Use email as display name for consistency
                            };
                        }

                        return score;
                    });

                    // Store all scores
                    this.allScores = processedScores;

                    // Only show top 5 in the list
                    this.topScores = processedScores.slice(0, 5);

                    console.log('Top scores loaded from Firestore successfully');

                    // If the current user is logged in, check if they're in the scores
                    const authStore = useAuthStore();
                    if (authStore.user?.uid) {
                        const userScoreRef = doc(db, 'userScores', authStore.user.uid);
                        const userScoreDoc = await getDoc(userScoreRef);

                        if (userScoreDoc.exists()) {
                            const userData = userScoreDoc.data();
                            console.log('Current user score from Firestore:', userData);

                            // Check if the user is already in the scores
                            const userInScores = this.allScores.some(score => score.userId === authStore.user.uid);

                            if (!userInScores) {
                                // Add the current user to the scores
                                const userScore = {
                                    userId: authStore.user.uid,
                                    displayName: userData.displayName || this.formatDisplayName(authStore.user.email),
                                    email: userData.email || authStore.user.email,
                                    totalScore: userData.totalScore || 0,
                                    quizCount: userData.quizCount || 0,
                                    isCurrentUser: true
                                };

                                this.allScores.push(userScore);

                                // Re-sort the scores
                                this.allScores.sort((a, b) => b.totalScore - a.totalScore);
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
                this.error = 'Failed to load scores';
                return false;
            } finally {
                this.isLoading = false;
            }
        },

        // Check and update top scores when a quiz is completed
        async checkAndUpdateTopScores(userId, quizId, score, userEmail) {
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
                    displayName = userData.displayName || this.formatDisplayName(userEmail);
                } else {
                    // Otherwise, format the display name from the email
                    displayName = this.formatDisplayName(userEmail);
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
                    const totalAvailableQs = data.totalAvailableQuestions || this.calculateTotalQuestions();

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

                    // Refresh the store's data
                    await this.fetchTopScoresFromFirestore();

                    return true;
                } else {
                    // If no top scores document exists yet, recalculate from scratch
                    await this.fetchTopScores();
                    return true;
                }
            } catch (err) {
                console.error('Error checking and updating top scores:', err);
                this.error = 'Failed to update scores';
                return false;
            }
        },

        // Fetch top scores (first try from Firestore, then calculate if needed)
        async fetchTopScores() {
            this.isLoading = true;
            this.error = null;

            try {
                // Calculate total available questions
                this.calculateTotalQuestions();

                // Try to fetch from Firestore first
                const scoresLoaded = await this.fetchTopScoresFromFirestore();

                // If no scores in Firestore, calculate them
                if (!scoresLoaded) {
                    // Implement score calculation logic here if needed
                    console.log('No scores in Firestore, would calculate them here');
                }

                this.isLoading = false;
            } catch (err) {
                // Handle specific cross-origin errors
                if (err.name === 'SecurityError' && err.message.includes('cross-origin')) {
                    console.warn('Cross-origin security error detected in scoreStore:', err.message);
                    this.error = 'Security restriction prevented loading scores';

                    // Set empty scores to prevent further errors
                    this.topScores = [];
                    this.allScores = [];
                } else {
                    console.error('Error fetching top scores:', err);
                    this.error = 'Failed to load top scores';
                }

                this.isLoading = false;
            }
        }
    }
}); 