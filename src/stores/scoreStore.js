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
            const usersWithEmail = state.allScores.filter(score =>
                score.email &&
                score.email !== 'Anonymous' &&
                !score.email?.includes('undefined')
            );
            return usersWithEmail.length > 0 ? usersWithEmail[0, 1] : null;
        }
    },

    actions: {
        // Format display name from email
        formatDisplayName(email) {
            if (!email || email === 'Anonymous') return 'Anonymous';
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

                    // Store all scores
                    this.allScores = scores;

                    // Only show top 5 in the list
                    this.topScores = scores.slice(0, 5);

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
            try {
                this.isLoading = true;
                this.error = null;

                // First try to fetch scores from Firestore
                const scoresLoaded = await this.fetchTopScoresFromFirestore();

                // If scores were loaded successfully, we're done
                if (scoresLoaded) {
                    return;
                }

                // Otherwise, calculate scores from scratch
                console.log('Calculating scores from scratch...');

                // Calculate total available questions
                this.totalAvailableQuestions = this.calculateTotalQuestions();
                console.log('Total available questions:', this.totalAvailableQuestions);

                // Query both userProgress and quizAttempts collections
                const progressRef = collection(db, 'userProgress');
                const attemptsRef = collection(db, 'quizAttempts');

                const [progressSnapshot, attemptsSnapshot] = await Promise.all([
                    getDocs(progressRef),
                    getDocs(attemptsRef)
                ]);

                const authStore = useAuthStore();
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
                            displayName: this.formatDisplayName(attempt.userEmail),
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
                        displayName: this.formatDisplayName(authStore.user.email)
                    });

                    userScores.set(authStore.user.uid, {
                        displayName: this.formatDisplayName(authStore.user.email),
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
                        userScore.displayName = this.formatDisplayName(authStore.user.email);
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

                // Store all scores
                this.allScores = scores;

                // Only show top 5 in the list
                this.topScores = scores.slice(0, 5);

                // Save top scores to Firestore
                await this.saveTopScoresToFirestore(scores);

            } catch (err) {
                console.error('Error fetching top scores:', err);
                this.error = 'Failed to load top scores';
            } finally {
                this.isLoading = false;
            }
        }
    }
}); 