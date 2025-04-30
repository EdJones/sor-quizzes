// src/stores/quizStore.js
import { defineStore } from 'pinia';
import { auth, db } from '../firebase';
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    query,
    where,
    getDocs,
    or,
    orderBy,
    limit,
    updateDoc,
    getDoc
} from 'firebase/firestore';
import { useAuthStore } from './authStore';
import { useProgressStore } from './progressStore';
import { quizEntries } from '../data/quiz-items';

export const quizStore = defineStore('quiz', {
    state: () => ({
        quizAttempts: [],
        quizEdits: [],
        userAnswers: [],
        simpleAnswers: [],
        currentQuizId: null,
        draftQuizItems: [],
        draftQuizItemsLoading: false,
        draftQuizItemsError: null,
        lastSavedDraftQuizEntry: null,
        draftQuizEntry: {
            title: '',
            subtitle: '',
            Question: 'What is your question?',
            questionP2: '',
            answer_type: 'mc',
            option1: 'First option',
            option2: 'Second option',
            option3: 'Third option',
            option4: 'Fourth option',
            option5: 'Fifth option',
            correctAnswer: 1,
            explanation: 'Here is why option 1 is correct...',
            explanation2: '',
            videoUrl: '',
            videoId: '',
            image: '',
            imageUrl: '',
            imageAltText: '',
            podcastEpisode: {
                title: 'Episode Title',
                EpisodeUrl: '',
                audioUrl: '',
                description: '',
                podcastStartTime: 0,
            },
            podcastEpisode2: {
                title: '',
                EpisodeUrl: '',
                audioUrl: '',
                description: '',
                podcastStartTime: 0,
            },
            cautionLevel: '',
            caution: '',
            citations: [],
            ref1: '',
            ref2: '',
            resources: [],
            closingText: '',
            closingText2: '',
            modal: '',
            status: 'draft',
            version: 1
        },
        saveStatus: {
            message: '',
            type: '',
            show: false
        },
        incorrectQuestions: [],
        githubIssues: [],
        allGithubIssues: [],
        githubIssuesLoading: false,
        githubIssuesError: null,
        currentFilter: 'all'
    }),
    actions: {
        // =============================================
        // Quiz Taking Actions
        // Actions related to taking quizzes, recording answers,
        // and tracking quiz attempts
        // =============================================

        setCurrentQuiz(quizId) {
            console.log('Setting current quiz:', quizId);
            this.currentQuizId = quizId;
            this.userAnswers = [];
            this.simpleAnswers = [];
            this.incorrectQuestions = [];
        },

        async setUserAnswer(index, selectedAnswer, correctAnswer, questionId, questionTitle, quizEntry) {
            if (selectedAnswer === undefined) {
                console.error('Invalid selectedAnswer:', selectedAnswer);
                return;
            }

            this.simpleAnswers[index] = selectedAnswer;

            if (Array.isArray(selectedAnswer)) {
                // For multiple select questions
                if (quizEntry.answer_type === 'ms') {
                    const correctAnswers = quizEntry.correctAnswers || [];
                    const isCorrect = selectedAnswer.length === correctAnswers.length &&
                        selectedAnswer.every(answer => correctAnswers.includes(answer));

                    this.userAnswers[index] = {
                        selected: selectedAnswer,
                        correct: isCorrect,
                        questionId: questionId || '',
                        questionTitle: questionTitle || '',
                        timestamp: new Date().toISOString()
                    };

                    if (!isCorrect && !this.incorrectQuestions.some(q => q.id === questionId)) {
                        const chosenOptionsText = selectedAnswer
                            .map(answer => quizEntry[`option${answer}`])
                            .filter(Boolean)
                            .join(', ');
                        this.incorrectQuestions.push({
                            id: questionId || '',
                            title: questionTitle || '',
                            chosenAnswer: chosenOptionsText.substring(0, 100) || ''
                        });
                    }
                    return;
                }
                // For sortable list answers
                console.log('Sortable list answer - skipping correctness check');
                this.userAnswers[index] = {
                    selected: selectedAnswer,
                    questionId: questionId || '',
                    questionTitle: questionTitle || '',
                    timestamp: new Date().toISOString()
                };
                return;
            }

            // For short answer questions
            if (quizEntry.answer_type === 'short_answer') {
                const isCorrect = correctAnswer === true; // Use the correctAnswer parameter as the correctness flag
                this.userAnswers[index] = {
                    selected: selectedAnswer,
                    correct: isCorrect,
                    questionId: questionId || '',
                    questionTitle: questionTitle || '',
                    timestamp: new Date().toISOString()
                };

                if (!isCorrect && !this.incorrectQuestions.some(q => q.id === questionId)) {
                    this.incorrectQuestions.push({
                        id: questionId || '',
                        title: questionTitle || '',
                        chosenAnswer: selectedAnswer?.substring(0, 100) || ''
                    });
                }
                return;
            }

            // For multiple choice, ensure consistent string comparison
            const isCorrect = String(selectedAnswer) === String(correctAnswer);

            console.log('Answer comparison:', {
                selectedAnswer: String(selectedAnswer),
                correctAnswer: String(correctAnswer),
                isCorrect,
                types: {
                    selected: typeof selectedAnswer,
                    correct: typeof correctAnswer
                }
            });

            this.userAnswers[index] = {
                selected: selectedAnswer,
                correct: isCorrect,
                questionId: questionId || '',
                questionTitle: questionTitle || '',
                timestamp: new Date().toISOString()
            };

            if (!isCorrect && !this.incorrectQuestions.some(q => q.id === questionId)) {
                const chosenOptionText = quizEntry?.[`option${selectedAnswer}`] || '';
                this.incorrectQuestions.push({
                    id: questionId || '',
                    title: questionTitle || '',
                    chosenAnswer: chosenOptionText?.substring(0, 100) || ''
                });
            }

            try {
                const userId = auth.currentUser?.uid;
                if (!userId) {
                    console.error('No user ID available');
                    return;
                }

                const cleanUserAnswers = this.userAnswers.filter(answer =>
                    answer !== null && answer !== undefined
                );

                const cleanIncorrectQuestions = this.incorrectQuestions.filter(q =>
                    q !== null && q !== undefined
                );

                const attemptRef = doc(db, 'quizAttempts', `${userId}_${this.currentQuizId}`);
                await setDoc(attemptRef, {
                    userId,
                    quizId: this.currentQuizId,
                    userAnswers: cleanUserAnswers,
                    incorrectQuestions: cleanIncorrectQuestions,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

            } catch (error) {
                console.error('Firebase save error:', error);
                throw error;
            }
        },

        async recordQuizAttempt({ quizStarted, score, totalQuestions }) {
            if (!auth.currentUser) {
                console.log('No authenticated user, skipping quiz attempt recording');
                return;
            }

            try {
                // Ensure we have valid values for all fields
                const validatedScore = Number(score) || 0;
                const validatedTotal = Number(totalQuestions) || 0;

                console.log('Recording quiz attempt:', {
                    score: validatedScore,
                    totalQuestions: validatedTotal,
                    userAnswers: this.userAnswers
                });

                // Create a consistent document ID
                const attemptId = `${auth.currentUser.uid}_${this.currentQuizId}_${Date.now()}`;
                const attemptRef = doc(db, 'quizAttempts', attemptId);

                // Add quiz attempt to Firestore
                await setDoc(attemptRef, {
                    userId: auth.currentUser.uid,
                    userEmail: auth.currentUser.email || 'Anonymous',
                    quizId: this.currentQuizId,
                    quizStarted: serverTimestamp(),
                    completedAt: serverTimestamp(),
                    score: validatedScore,
                    totalQuestions: validatedTotal,
                    userAnswers: this.userAnswers,
                    isAnonymous: auth.currentUser.isAnonymous
                });

                console.log('Quiz attempt recorded:', attemptRef.id);

                // Save final progress using the original system
                const progressStore = useProgressStore();
                await progressStore.saveQuizProgress(this.currentQuizId, {
                    complete: true,
                    userAnswers: this.userAnswers,
                    totalCorrect: validatedScore,
                    totalQuestions: validatedTotal,
                    timestamp: new Date()
                });

            } catch (error) {
                console.error('Error recording quiz attempt:', error);
                throw error;
            }
        },

        setUserAnswers(answers) {
            this.userAnswers = answers;
        },

        async saveUserAnswers() {
            if (!this.userAnswers || this.userAnswers.length === 0) {
                console.error("No user answers to save.");
                return;
            }

            const attempt = {
                userAnswers: this.userAnswers,
                timestamp: new Date(),
            };

            try {
                const docRef = await addDoc(collection(db, 'userAnswers'), attempt);
                console.log("User answers saved with ID: ", docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        },

        // =============================================
        // Quiz Editing Actions
        // Actions related to creating, editing, and managing
        // quiz entries and drafts
        // =============================================

        async fetchDraftQuizItems() {
            try {
                console.log('Fetching draft quiz items...');
                const draftsRef = collection(db, 'quizEntries');
                const permanentRef = collection(db, 'permanentQuizEntries');

                // Log the query parameters
                console.log('Querying for all items in quizEntries');

                // Fetch all items from quizEntries
                const draftsQuery = query(draftsRef, orderBy('timestamp', 'desc'));
                const draftsSnapshot = await getDocs(draftsQuery);
                console.log('Found items in quizEntries:', draftsSnapshot.docs.length);

                // Fetch permanent (approved) items
                const permanentQuery = query(permanentRef, orderBy('timestamp', 'desc'));
                const permanentSnapshot = await getDocs(permanentQuery);
                console.log('Found items in permanentQuizEntries:', permanentSnapshot.docs.length);

                // Combine both sets of items
                const allItems = [
                    ...draftsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        isPermanent: false
                    })),
                    ...permanentSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        isPermanent: true
                    }))
                ];

                console.log('Total items found:', allItems.length);
                console.log('Items by status:', allItems.reduce((acc, item) => {
                    acc[item.status] = (acc[item.status] || 0) + 1;
                    return acc;
                }, {}));

                // Group items by title to handle multiple versions
                const itemsByTitle = new Map();
                for (const item of allItems) {
                    const title = item.title;
                    if (!itemsByTitle.has(title)) {
                        itemsByTitle.set(title, []);
                    }
                    itemsByTitle.get(title).push({
                        ...item,
                        version: item.version || 1 // Ensure version is at least 1
                    });
                }

                // For each title, keep only the latest version
                this.draftQuizItems = Array.from(itemsByTitle.values())
                    .map(versions => {
                        // Sort by version number (descending) and then by timestamp (descending)
                        versions.sort((a, b) => {
                            if (a.version !== b.version) {
                                return b.version - a.version;
                            }
                            return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
                        });
                        return versions[0]; // Return the latest version
                    });

                // Log processed items with versions
                console.log('Processed items with versions:', this.draftQuizItems.map(item => ({
                    id: item.id,
                    status: item.status,
                    version: item.version,
                    title: item.title,
                    timestamp: item.timestamp,
                    isPermanent: item.isPermanent
                })));

                return this.draftQuizItems;
            } catch (error) {
                console.error('Error fetching draft items:', error);
                throw error;
            }
        },

        async recordQuizEdit(versionMessage = '') {
            const auth = useAuthStore();

            // Create sanitized versions of the states
            const sanitizeData = (obj) => {
                const result = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (value === undefined) {
                        result[key] = null;  // Convert undefined to null for Firestore
                    } else if (typeof value === 'object' && value !== null) {
                        if (Array.isArray(value)) {
                            // Handle arrays, ensuring they exist
                            result[key] = value.map(item => {
                                if (typeof item === 'object' && item !== null) {
                                    return sanitizeData(item);
                                }
                                return item;
                            });
                        } else {
                            result[key] = sanitizeData(value);  // Recursively sanitize nested objects
                        }
                    } else {
                        result[key] = value;
                    }
                }
                return result;
            };

            const beforeState = this.lastSavedDraftQuizEntry ?
                sanitizeData({ ...this.lastSavedDraftQuizEntry }) :
                null;

            const afterState = sanitizeData({ ...this.draftQuizEntry });

            // Ensure arrays are initialized
            if (!afterState.citations) afterState.citations = [];
            if (!afterState.resources) afterState.resources = [];

            // Ensure we're using the correct quiz item ID
            const quizItemId = afterState?.id || beforeState?.id;
            if (!quizItemId) {
                console.error('No quiz item ID found for version history');
                return;
            }

            try {
                // Get the current version from the quiz item
                const quizItemRef = doc(db, 'quizEntries', quizItemId);
                const quizItemDoc = await getDoc(quizItemRef);
                const currentVersion = quizItemDoc.data()?.version || 1;

                // Create the version history entry
                const editHistoryRef = collection(db, 'quizEditHistory');
                await addDoc(editHistoryRef, {
                    quizItemId,
                    userId: auth.user?.uid,
                    userEmail: auth.user?.email,
                    timestamp: serverTimestamp(),
                    versionMessage,
                    version: currentVersion, // Use the same version number as the quiz item
                    changes: {
                        before: beforeState,
                        after: afterState
                    },
                    status: afterState.status || 'draft' // Add status to version history
                });

            } catch (error) {
                console.error('Error recording version:', error);
                throw error;
            }
        },

        async saveDraftQuizEntry() {
            try {
                const authStore = useAuthStore();
                console.log('Starting saveDraftQuizEntry with:', {
                    currentUser: authStore.user?.uid,
                    draftEntry: this.draftQuizEntry,
                    lastSavedEntry: this.lastSavedDraftQuizEntry
                });

                if (!this.draftQuizEntry) {
                    throw new Error('No draft entry to save');
                }

                // Check if we have an authenticated user
                if (!authStore.user) {
                    console.error('No authenticated user found when trying to save entry');
                    throw new Error('You must be logged in to save entries');
                }

                // Get the current ID from the entry
                const currentId = this.draftQuizEntry.id;

                // Create a clean copy of the entry data
                const entryToSave = {
                    ...this.draftQuizEntry,
                    id: undefined, // Remove id from the saved data
                    updatedAt: new Date().toISOString(),
                    timestamp: new Date().toISOString(),
                    version: 1,
                    userId: authStore.user.uid,
                    userEmail: authStore.user.email,
                    status: 'draft'
                };

                let savedId;

                if (currentId) {
                    // Update existing entry
                    console.log('Updating existing entry:', {
                        entryId: currentId,
                        currentVersion: this.draftQuizEntry.version,
                        title: this.draftQuizEntry.title
                    });

                    // Get the current version from the existing entry
                    const existingEntryRef = doc(db, 'quizEntries', currentId);
                    const existingEntryDoc = await getDoc(existingEntryRef);
                    
                    if (!existingEntryDoc.exists()) {
                        throw new Error('Existing entry not found');
                    }

                    const existingEntry = existingEntryDoc.data();
                    const currentVersion = existingEntry.version || 1;
                    const newVersion = currentVersion + 1;

                    // Update the document with new version
                    await updateDoc(existingEntryRef, {
                        ...entryToSave,
                        version: newVersion,
                        updatedAt: serverTimestamp(),
                        timestamp: serverTimestamp()
                    });

                    savedId = currentId;
                } else {
                    // Create new entry
                    console.log('Creating new entry');
                    const docRef = await addDoc(collection(db, 'quizEntries'), {
                        ...entryToSave,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        timestamp: serverTimestamp()
                    });
                    savedId = docRef.id;
                }

                // Update the draft and last saved entries with the new ID
                const updatedEntry = {
                    ...entryToSave,
                    id: savedId
                };

                this.draftQuizEntry = updatedEntry;
                this.lastSavedDraftQuizEntry = updatedEntry;

                return savedId;

            } catch (error) {
                console.error('Error in saveDraftQuizEntry:', {
                    error,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    currentUser: useAuthStore().user?.uid,
                    draftEntry: this.draftQuizEntry
                });
                throw error;
            }
        },

        async updateExistingDraftEntry(draftId) {
            try {
                const user = auth.currentUser;
                if (!user) throw new Error('No user found');

                // Verify ownership before updating
                const existingDraft = this.draftQuizItems.find(item => item.id === draftId);
                if (!existingDraft) {
                    throw new Error('Draft not found');
                }
                if (existingDraft.userId !== user.uid) {
                    throw new Error('You can only edit your own drafts');
                }

                // Increment version number
                const currentVersion = existingDraft.version || 1;
                const newVersion = currentVersion + 1;

                const entryToUpdate = {
                    ...this.draftQuizEntry,
                    userId: user.uid,
                    userEmail: user.email,
                    isAnonymous: user.isAnonymous,
                    status: 'draft',
                    version: newVersion,  // Add incremented version number
                    timestamp: serverTimestamp(),
                };

                console.log('Updating draft entry:', entryToUpdate);
                const docRef = doc(db, 'quizEntries', draftId);
                await setDoc(docRef, entryToUpdate, { merge: true });
                console.log('Document updated:', draftId);

                this.saveStatus = {
                    message: 'Draft updated successfully!',
                    type: 'success',
                    show: true
                };
                return draftId;
            } catch (e) {
                console.error('Error updating draft:', e);
                this.saveStatus = {
                    message: e.message || 'Error updating draft',
                    type: 'error',
                    show: true
                };
                throw e;
            }
        },

        async submitForReview(quizId) {
            try {
                const docRef = doc(db, 'quizEntries', quizId);

                // Create a complete entry update that includes all current data
                const entryToUpdate = {
                    ...this.draftQuizEntry,
                    status: 'pending',
                    submittedAt: serverTimestamp(),
                    version: (this.draftQuizEntry.version || 1)  // Preserve current version
                };

                // Update the document with all data
                await setDoc(docRef, entryToUpdate);

                // Update the local draft entry status
                this.draftQuizEntry = entryToUpdate;

                // Record this change in version history
                await this.recordQuizEdit('Submitted for review');

                // Refresh the draft items list to reflect the new status
                await this.fetchDraftQuizItems();

                // Update the save status to show success
                this.saveStatus = {
                    message: 'Successfully submitted for review!',
                    type: 'success',
                    show: true
                };

            } catch (error) {
                console.error('Error submitting for review:', error);
                this.saveStatus = {
                    message: 'Error submitting for review: ' + error.message,
                    type: 'error',
                    show: true
                };
                throw error;
            }
        },

        validateDraftQuizEntry(entry) {
            const errors = [];
            const invalidFields = new Set();

            // Required fields validation
            if (!entry.title?.trim()) {
                errors.push('Title is required');
                invalidFields.add('title');
            }

            if (!entry.Question?.trim()) {
                errors.push('Question is required');
                invalidFields.add('Question');
            }

            // Validate options based on answer type
            if (entry.answer_type === 'mc' || entry.answer_type === 'ms') {
                let optionCount = 0;
                for (let i = 1; i <= 6; i++) {
                    if (entry[`option${i}`]?.trim()) {
                        optionCount++;
                    }
                }

                if (optionCount < 2) {
                    errors.push('At least 2 options are required');
                    for (let i = 1; i <= 2; i++) {
                        invalidFields.add(`option${i}`);
                    }
                }

                // Validate correct answer selection
                if (entry.answer_type === 'mc' && !entry.correctAnswer) {
                    errors.push('Please select a correct answer');
                } else if (entry.answer_type === 'ms') {
                    if (entry.hasNoneOfTheAbove) {
                        // For "None of the Above" case, only one correct answer is allowed
                        if (!entry.correctAnswers || entry.correctAnswers.length !== 1) {
                            errors.push('When "None of the Above" is selected, exactly one correct answer is required');
                        }
                    } else {
                        // For regular multiple select, at least two correct answers are required
                        if (!entry.correctAnswers || entry.correctAnswers.length < 2) {
                            errors.push('Please select at least two correct answers');
                        }
                    }
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                invalidFields
            };
        },

        isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (_) {
                return false;
            }
        },

        updateDraftQuizEntry(entry) {
            // Log the incoming entry details
            console.log('updateDraftQuizEntry called with:', {
                entryId: entry.id,
                entryVersion: entry.version,
                entryTitle: entry.title,
                currentId: this.draftQuizEntry.id,
                currentEntry: this.draftQuizEntry,
                modelValue: entry.modelValue,
                template: entry.template
            });

            // Get the ID from the entry or the current draft
            let templateId = entry.id || this.draftQuizEntry.id;
            
            // If we still don't have an ID, try to get it from the entry's properties
            if (!templateId && entry.entryId) {
                templateId = entry.entryId;
            }

            // If we still don't have an ID, try to get it from the template
            if (!templateId && entry.template) {
                templateId = entry.template;
            }

            // If we still don't have an ID, try to get it from the modelValue
            if (!templateId && entry.modelValue) {
                templateId = entry.modelValue;
            }

            // If we still don't have an ID, try to get it from the current draft's modelValue
            if (!templateId && this.draftQuizEntry.modelValue) {
                templateId = this.draftQuizEntry.modelValue;
            }

            // If we still don't have an ID, throw an error
            if (!templateId) {
                console.error('No ID found in template or current draft entry:', {
                    entry,
                    currentDraft: this.draftQuizEntry,
                    template: entry.template,
                    modelValue: entry.modelValue,
                    currentDraftModelValue: this.draftQuizEntry.modelValue
                });
                throw new Error('Cannot update draft: No document ID found');
            }

            const updatedEntry = {
                ...this.draftQuizEntry,  // Start with current draft to preserve existing values
                ...entry,                 // Override with new values
                id: templateId,           // Use the template ID
                version: entry.version || this.draftQuizEntry.version || 1,
                status: entry.status || 'draft',
                // Initialize correctAnswers array for multiple select questions
                correctAnswers: entry.answer_type === 'ms' ? (entry.correctAnswers || []) : []
            };

            // Log the final updated entry
            console.log('Final updated entry:', {
                id: updatedEntry.id,
                version: updatedEntry.version,
                title: updatedEntry.title,
                status: updatedEntry.status,
                hasRequiredFields: {
                    title: !!updatedEntry.title,
                    Question: !!updatedEntry.Question,
                    answer_type: !!updatedEntry.answer_type,
                    correctAnswer: !!updatedEntry.correctAnswer,
                    explanation: !!updatedEntry.explanation
                }
            });

            // Update both the draft entry and the last saved entry
            this.draftQuizEntry = updatedEntry;
            this.lastSavedDraftQuizEntry = { ...updatedEntry };
        },

        resetDraftQuizEntry() {
            this.draftQuizEntry = {
                title: '',
                subtitle: '',
                Question: 'What is your question?',
                questionP2: '',
                answer_type: 'mc',
                option1: 'First option',
                option2: 'Second option',
                option3: 'Third option',
                option4: 'Fourth option',
                option5: 'Fifth option',
                correctAnswer: 1,
                correctAnswers: [], // For multiple select questions
                explanation: 'Here is why option 1 is correct...',
                explanation2: '',
                videoUrl: '',
                videoId: '',
                image: '',
                imageUrl: '',
                imageAltText: '',
                podcastEpisode: {
                    title: 'Episode Title',
                    EpisodeUrl: '',
                    audioUrl: '',
                    description: '',
                    podcastStartTime: 0,
                },
                podcastEpisode2: {
                    title: '',
                    EpisodeUrl: '',
                    audioUrl: '',
                    description: '',
                    podcastStartTime: 0,
                },
                cautionLevel: '',
                caution: '',
                citations: [],
                ref1: '',
                ref2: '',
                resources: [],
                closingText: '',
                closingText2: '',
                modal: '',
                status: 'draft',
                version: 1  // Initialize version number
            };
        },

        clearSaveStatus() {
            this.saveStatus = {
                message: '',
                type: '',
                show: false
            };
        },

        async fetchGitHubIssues(state = 'all') {
            this.githubIssuesLoading = true;
            this.githubIssuesError = null;

            try {
                const token = import.meta.env.VITE_GITHUB_TOKEN;
                const repo = import.meta.env.VITE_GITHUB_REPO;

                const response = await fetch(
                    `https://api.github.com/repos/${repo}/issues?state=${state}`,
                    {
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const issues = await response.json();
                console.log('Fetched issues:', issues.length, 'Latest:', issues[0]?.number);

                // Update state in a single operation
                if (state === 'all') {
                    this.allGithubIssues = [...issues];
                }
                this.githubIssues = [...issues];

                return issues;
            } catch (error) {
                console.error('Error fetching GitHub issues:', error);
                this.githubIssuesError = error.message;
                throw error;
            } finally {
                this.githubIssuesLoading = false;
            }
        },

        async createGitHubIssue(issueData) {
            this.githubIssuesLoading = true;
            this.githubIssuesError = null;

            try {
                const token = import.meta.env.VITE_GITHUB_TOKEN;
                const repo = import.meta.env.VITE_GITHUB_REPO;

                console.log('Creating issue with data:', issueData);
                const response = await fetch(
                    `https://api.github.com/repos/${repo}/issues`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(issueData)
                    }
                );

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const issue = await response.json();
                console.log('Issue created:', issue.number);

                // Clear existing issues to force a fresh state
                this.githubIssues = [];
                this.allGithubIssues = [];

                // Fetch fresh data
                const freshIssues = await this.fetchGitHubIssues('all');
                console.log('Fresh issues fetched:', freshIssues.length);

                return issue;
            } catch (error) {
                console.error('Error creating GitHub issue:', error);
                this.githubIssuesError = error.message;
                throw error;
            } finally {
                this.githubIssuesLoading = false;
            }
        },

        async updateQuizItemStatus(itemId, status) {
            try {
                const quizRef = doc(db, 'quizEntries', itemId);
                await updateDoc(quizRef, {
                    status: status,
                    updatedAt: serverTimestamp()
                });

                // Refresh the draft items list
                await this.fetchDraftQuizItems();

                return true;
            } catch (error) {
                console.error('Error updating quiz item status:', error);
                throw error;
            }
        },

        async acceptQuizItem(itemId) {
            try {
                // Get the quiz item
                const quizRef = doc(db, 'quizEntries', itemId);
                const quizDoc = await getDoc(quizRef);

                if (!quizDoc.exists()) {
                    throw new Error('Quiz item not found');
                }

                const quizData = quizDoc.data();

                // Verify it's a pending item
                if (quizData.status !== 'pending') {
                    throw new Error('Quiz item is not pending review');
                }

                // Update the status to accepted
                await updateDoc(quizRef, {
                    status: 'accepted',
                    acceptedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Record this change in version history
                this.draftQuizEntry = { ...quizData, id: itemId };
                await this.recordQuizEdit('Quiz item accepted');

                // Refresh the draft items list
                await this.fetchDraftQuizItems();

                return true;
            } catch (error) {
                console.error('Error accepting quiz item:', error);
                throw error;
            }
        },

        async approveQuizItem(itemId) {
            try {
                console.log('Starting approveQuizItem for ID:', itemId);
                
                // Get the quiz item
                const quizRef = doc(db, 'quizEntries', itemId);
                const quizDoc = await getDoc(quizRef);

                if (!quizDoc.exists()) {
                    console.error('Quiz item not found in quizEntries:', itemId);
                    throw new Error('Quiz item not found');
                }

                const quizData = quizDoc.data();
                console.log('Found quiz item:', {
                    id: itemId,
                    status: quizData.status,
                    title: quizData.title
                });

                // Verify it's an accepted item
                if (quizData.status !== 'accepted') {
                    console.error('Quiz item is not accepted:', {
                        currentStatus: quizData.status,
                        requiredStatus: 'accepted'
                    });
                    throw new Error('Quiz item must be accepted before it can be approved');
                }

                // Update the status to approved
                console.log('Updating status to approved in quizEntries');
                await updateDoc(quizRef, {
                    status: 'approved',
                    approvedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Add to permanent quiz entries
                console.log('Adding to permanentQuizEntries');
                const permanentRef = doc(db, 'permanentQuizEntries', itemId);
                await setDoc(permanentRef, {
                    ...quizData,
                    status: 'approved',
                    approvedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Record this change in version history
                console.log('Recording version history');
                this.draftQuizEntry = { ...quizData, id: itemId };
                await this.recordQuizEdit('Quiz item approved and moved to permanent entries');

                // Refresh the draft items list
                console.log('Refreshing draft items list');
                await this.fetchDraftQuizItems();

                return true;
            } catch (error) {
                console.error('Error approving quiz item:', error);
                throw error;
            }
        },

        async fetchAllQuizItems() {
            try {
                const quizRef = collection(db, 'quizEntries');
                const querySnapshot = await getDocs(quizRef);
                return querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('Error fetching all quiz items:', error);
                throw error;
            }
        },

        async forkQuizEntry(quizId) {
            try {
                // Ensure quizId is a string for Firestore operations
                const quizIdStr = String(quizId);
                const quizIdNum = Number.parseInt(quizIdStr, 10);
                
                // First try to get the quiz entry from the quizEntries array
                const quizEntry = quizEntries.find(entry => entry.id === quizIdNum);
                if (quizEntry) {
                    console.log('Found quiz entry in quizEntries array:', {
                        id: quizEntry.id,
                        title: quizEntry.title
                    });

                    // Create a new draft entry with fork information
                    const forkedEntry = {
                        ...quizEntry,
                        id: null, // Will be set when saved
                        status: 'draft',
                        version: 1,
                        forkedFrom: {
                            id: quizIdStr,
                            originalId: quizIdNum,
                            version: 1,
                            title: quizEntry.title,
                            timestamp: serverTimestamp(),
                            isPermanent: true
                        },
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        timestamp: serverTimestamp()
                    };

                    // Save the forked entry
                    const docRef = await addDoc(collection(db, 'quizEntries'), forkedEntry);
                    
                    // Update the draft entry in the store
                    this.draftQuizEntry = { ...forkedEntry, id: docRef.id };
                    this.lastSavedDraftQuizEntry = { ...forkedEntry, id: docRef.id };

                    return docRef.id;
                }

                // If not found in quizEntries array, try to get it from Firestore collections
                const quizRef = doc(db, 'quizEntries', quizIdStr);
                const permanentRef = doc(db, 'permanentQuizEntries', quizIdStr);
                
                // Try to get the document from quizEntries first
                let quizDoc = await getDoc(quizRef);
                let isPermanent = false;
                
                // If not found in quizEntries, try permanentQuizEntries
                if (!quizDoc.exists()) {
                    quizDoc = await getDoc(permanentRef);
                    isPermanent = true;
                }
                
                if (!quizDoc.exists()) {
                    // If not found in either collection, try to find it by integer ID
                    const quizEntriesRef = collection(db, 'quizEntries');
                    const permanentEntriesRef = collection(db, 'permanentQuizEntries');
                    
                    // Search in both collections
                    const [quizEntriesSnapshot, permanentEntriesSnapshot] = await Promise.all([
                        getDocs(query(quizEntriesRef, where('id', '==', quizIdNum))),
                        getDocs(query(permanentEntriesRef, where('id', '==', quizIdNum)))
                    ]);
                    
                    if (quizEntriesSnapshot.docs.length > 0) {
                        quizDoc = quizEntriesSnapshot.docs[0];
                    } else if (permanentEntriesSnapshot.docs.length > 0) {
                        quizDoc = permanentEntriesSnapshot.docs[0];
                        isPermanent = true;
                    } else {
                        throw new Error('Quiz entry not found in either collection');
                    }
                }

                const quizData = quizDoc.data();
                
                // Create a new draft entry with fork information
                const forkedEntry = {
                    ...quizData,
                    id: null, // Will be set when saved
                    status: 'draft',
                    version: 1,
                    forkedFrom: {
                        id: quizIdStr,
                        originalId: quizIdNum, // Store the original integer ID
                        version: quizData.version || 1,
                        title: quizData.title,
                        timestamp: serverTimestamp(),
                        isPermanent: isPermanent // Add flag to indicate if it was forked from permanent collection
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    timestamp: serverTimestamp()
                };

                // Save the forked entry
                const docRef = await addDoc(collection(db, 'quizEntries'), forkedEntry);
                
                // Update the draft entry in the store
                this.draftQuizEntry = { ...forkedEntry, id: docRef.id };
                this.lastSavedDraftQuizEntry = { ...forkedEntry, id: docRef.id };

                return docRef.id;
            } catch (error) {
                console.error('Error forking quiz entry:', error);
                throw error;
            }
        }
    },
});
