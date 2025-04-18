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
                let mostRecentAttempts = {};

                // Get most recent attempts for each quiz set
                const attemptsRef = collection(db, 'quizAttempts');
                const attemptsQuery = query(attemptsRef, where('userId', '==', userId));
                const attemptsSnapshot = await getDocs(attemptsQuery);

                // Group attempts by quizId and keep only the most recent
                attemptsSnapshot.forEach(doc => {
                    const attempt = doc.data();
                    if (!mostRecentAttempts[attempt.quizId] ||
                        attempt.completedAt > mostRecentAttempts[attempt.quizId].completedAt) {
                        mostRecentAttempts[attempt.quizId] = {
                            totalCorrect: attempt.score,
                            totalAnswered: attempt.totalQuestions
                        };
                    }
                });

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
                    // Preserve existing attempts that haven't been updated
                    if (userData.mostRecentAttempts) {
                        mostRecentAttempts = {
                            ...userData.mostRecentAttempts,
                            ...mostRecentAttempts
                        };
                    }
                }

                // Add the new score
                userTotalScore += score;
                userQuizCount += 1;

                // Calculate totalRecentAnswers from mostRecentAttempts
                const totalRecentAnswers = Object.values(mostRecentAttempts).reduce((sum, attempt) =>
                    sum + (attempt.totalAnswered || 0), 0);

                // Update the user's score document
                await setDoc(userScoreRef, {
                    userId,
                    displayName,
                    username,
                    email: userEmail,
                    totalScore: userTotalScore,
                    quizCount: userQuizCount,
                    mostRecentAttempts,
                    totalRecentAnswers,
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
                        mostRecentAttempts,
                        totalRecentAnswers,
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
                        mostRecentAttempts,
                        totalRecentAnswers,
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