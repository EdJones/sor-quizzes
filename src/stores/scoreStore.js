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

            // If it's a valid email, only show the part before the @ symbol
            if (email.includes('@') && !email.includes('undefined')) {
                return email.split('@')[0];
            }

            // Otherwise return the email as is
            return email;
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
                                return {
                                    ...score,
                                    username: userDoc.exists() ? userDoc.data().username : null
                                };
                            }
                            return score;
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
                console.log(`Checking if user ${userId} is now a top scorer with score ${score} on quiz ${quizId}`);

                // Get the user's document to fetch the username
                const userDoc = await getDoc(doc(db, 'users', userId));
                const username = userDoc.exists() ? userDoc.data().username : null;

                // Get the user's current score document
                const userScoreRef = doc(db, 'userScores', userId);
                const userScoreDoc = await getDoc(userScoreRef);

                let userTotalScore = 0;
                let userQuizCount = 0;
                let displayName = username || this.formatDisplayName(userEmail);

                // If user already has a score document, use that data
                if (userScoreDoc.exists()) {
                    const userData = userScoreDoc.data();
                    userTotalScore = userData.totalScore || 0;
                    userQuizCount = userData.quizCount || 0;
                }

                // Add the new score
                userTotalScore += score;
                userQuizCount += 1;

                // Update the user's score document
                await setDoc(userScoreRef, {
                    userId,
                    displayName,
                    username,
                    email: userEmail,
                    totalScore: userTotalScore,
                    quizCount: userQuizCount,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

                // Get the current top scores document
                const topScoresRef = doc(db, 'topScores', 'latest');
                const topScoresDoc = await getDoc(topScoresRef);
                const totalAvailableQs = this.calculateTotalQuestions();

                let scores = [];
                if (topScoresDoc.exists()) {
                    scores = topScoresDoc.data().scores || [];
                }

                // Find if the user is already in the scores
                const userScoreIndex = scores.findIndex(s => s.userId === userId);

                if (userScoreIndex >= 0) {
                    // Update the user's score
                    scores[userScoreIndex] = {
                        ...scores[userScoreIndex],
                        totalScore: userTotalScore,
                        quizCount: userQuizCount,
                        displayName,
                        username,
                        email: userEmail,
                        lastUpdated: new Date()
                    };
                } else {
                    // Add the user to the scores
                    scores.push({
                        userId,
                        displayName,
                        username,
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