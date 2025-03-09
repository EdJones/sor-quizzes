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
                                const username = userDoc.exists() ? userDoc.data().username : null;

                                // Format display name consistently
                                let displayName;
                                if (username) {
                                    displayName = username;
                                } else if (score.email && score.email !== 'Anonymous' && !score.email.includes('undefined') && score.email.includes('@')) {
                                    displayName = this.formatDisplayName(score.email);
                                } else {
                                    displayName = `Anon_${score.userId.substring(0, 6)}...`;
                                }

                                return {
                                    ...score,
                                    username,
                                    displayName
                                };
                            }
                            return {
                                ...score,
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
                console.log(`Checking if user ${userId} is now a top scorer with score ${score} on quiz ${quizId}`);

                // Get the user's document to fetch the username
                const userDoc = await getDoc(doc(db, 'users', userId));
                const username = userDoc.exists() ? userDoc.data().username : null;

                // Get the user's current score document
                const userScoreRef = doc(db, 'userScores', userId);
                const userScoreDoc = await getDoc(userScoreRef);

                let userTotalScore = 0;
                let userQuizCount = 0;
                let displayName;

                // Set display name with preference order: username > email > anonymous format
                if (username) {
                    displayName = username;
                } else if (userEmail && userEmail !== 'Anonymous' && !userEmail.includes('undefined') && userEmail.includes('@')) {
                    displayName = this.formatDisplayName(userEmail);
                } else {
                    displayName = `Anon_${userId.substring(0, 6)}...`;
                }

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
                this.totalAvailableQuestions = this.calculateTotalQuestions();

                // First get existing scores from Firestore
                const topScoresRef = doc(db, 'topScores', 'latest');
                const topScoresDoc = await getDoc(topScoresRef);

                let existingScores = [];
                if (topScoresDoc.exists()) {
                    const data = topScoresDoc.data();
                    existingScores = data.scores || [];
                    console.log('Existing scores from Firestore:', existingScores);
                }

                // Then fetch from userProgress
                const progressRef = collection(db, 'userProgress');
                const progressSnapshot = await getDocs(progressRef);

                console.log(`Found ${progressSnapshot.docs.length} documents in userProgress`);

                // First get all user documents to have email data ready
                const userDocs = await Promise.all(
                    [...new Set(progressSnapshot.docs.map(doc => doc.id.split('_')[0]))].map(async userId => {
                        const userDoc = await getDoc(doc(db, 'users', userId));
                        return {
                            userId,
                            data: userDoc.exists() ? userDoc.data() : null
                        };
                    })
                );

                // Create a map of user data
                const userDataMap = new Map(userDocs.map(doc => [doc.userId, doc.data]));
                console.log('User data map:', Object.fromEntries(userDataMap));

                // Group progress by base user ID (removing suffixes) to aggregate scores
                const userProgressMap = new Map();

                progressSnapshot.docs.forEach(doc => {
                    const progressData = doc.data();
                    // Extract base user ID by removing the suffix
                    const baseUserId = doc.id.split('_')[0];
                    const userData = userDataMap.get(baseUserId);

                    console.log(`Processing progress for base user ${baseUserId}:`, progressData);

                    // Get the current aggregated data or create new
                    const currentData = userProgressMap.get(baseUserId) || {
                        userId: baseUserId,
                        totalCorrect: 0,
                        totalAnswered: 0,
                        email: userData?.email,
                        lastUpdated: null,
                        quizAttempts: new Set() // Track unique quiz attempts
                    };

                    // Get quiz ID to track unique attempts
                    const quizId = progressData.quizId;

                    // Add this document's scores to the total if it's a completed quiz
                    const correctItems = Number(progressData.totalCorrect || progressData.correctItems || 0);
                    const completedQuizzes = Number(progressData.totalAnswered || progressData.completedQuizzes || 0);
                    const isCompleted = completedQuizzes > 0 || progressData.complete;

                    if (isCompleted && quizId && !currentData.quizAttempts.has(quizId)) {
                        // Add scores from this new quiz attempt
                        currentData.totalCorrect += correctItems;
                        currentData.totalAnswered += 1; // Count each completed quiz as 1
                        currentData.quizAttempts.add(quizId);

                        // Update lastUpdated if this document is more recent
                        const docDate = progressData.lastUpdated || progressData.timestamp;
                        if (docDate && (!currentData.lastUpdated || docDate > currentData.lastUpdated)) {
                            currentData.lastUpdated = docDate;
                        }

                        userProgressMap.set(baseUserId, currentData);
                        console.log(`Updated progress for ${baseUserId}:`, {
                            ...currentData,
                            quizAttempts: Array.from(currentData.quizAttempts)
                        });
                    }
                });

                const progressArray = Array.from(userProgressMap.values())
                    .map(data => ({
                        ...data,
                        quizAttempts: Array.from(data.quizAttempts)
                    }));
                console.log('Aggregated user progress by base ID:', progressArray);

                // Get the auth store to access current user
                const authStore = useAuthStore();

                // Convert progress data to score format
                const progressScores = progressArray
                    .filter(progress => progress.totalAnswered > 0 && progress.totalCorrect > 0)
                    .map(progress => {
                        const userData = userDataMap.get(progress.userId);
                        let email = progress.email || userData?.email;
                        let displayName = null;

                        // Try to get display name in order of preference:
                        // 1. Username from user data
                        // 2. Email username if available
                        // 3. First 8 chars of user ID + "..."
                        if (userData?.username) {
                            displayName = userData.username;
                        } else if (email && email !== 'Anonymous' && !email.includes('undefined')) {
                            displayName = this.formatDisplayName(email);
                        } else {
                            displayName = `Anon_${progress.userId.substring(0, 6)}...`;
                        }

                        const scoreData = {
                            userId: progress.userId,
                            totalScore: progress.totalCorrect,
                            quizCount: progress.totalAnswered,
                            email: email || 'Anonymous',
                            username: userData?.username || null,
                            displayName,
                            lastUpdated: progress.lastUpdated?.toDate() || new Date(),
                            quizAttempts: progress.quizAttempts
                        };

                        console.log(`Created score data for ${progress.userId}:`, scoreData);
                        return scoreData;
                    });

                console.log('Valid progress scores:', progressScores);

                // Merge scores, preferring progress scores over existing ones
                const mergedScores = [...existingScores];

                progressScores.forEach(progressScore => {
                    const existingIndex = mergedScores.findIndex(s => s.userId === progressScore.userId);
                    if (existingIndex >= 0) {
                        // Update existing score if progress score is higher
                        if (progressScore.totalScore > mergedScores[existingIndex].totalScore) {
                            mergedScores[existingIndex] = progressScore;
                        }
                    } else {
                        // Add new score
                        mergedScores.push(progressScore);
                    }
                });

                // Filter and sort by total score, but keep anonymous users
                const finalScores = mergedScores
                    .filter(score => score.totalScore > 0) // Only filter out zero scores
                    .sort((a, b) => b.totalScore - a.totalScore);

                console.log('Final merged scores:', finalScores);

                if (finalScores.length > 0) {
                    // Update topScores document with merged scores
                    await setDoc(topScoresRef, {
                        scores: finalScores,
                        totalAvailableQuestions: this.totalAvailableQuestions,
                        lastUpdated: serverTimestamp()
                    });

                    // Update store state
                    this.allScores = finalScores;
                    this.topScores = finalScores.slice(0, 5);
                    console.log('Updated store with top scores:', this.topScores);
                } else {
                    console.log('No valid scores found after merging');
                    this.allScores = [];
                    this.topScores = [];
                }

                this.isLoading = false;
            } catch (err) {
                console.error('Error fetching top scores:', err);
                this.error = 'Failed to load top scores';
                this.isLoading = false;
            }
        }
    }
}); 