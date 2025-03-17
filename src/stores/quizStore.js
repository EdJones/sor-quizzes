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
                // Log the query parameters
                console.log('Querying for status == draft or pending');

                const q = query(draftsRef,
                    or(
                        where('status', '==', 'draft'),
                        where('status', '==', 'pending')
                    )
                );
                const querySnapshot = await getDocs(q);

                // Log the raw results with version numbers
                console.log('Raw query results with versions:', querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        status: data.status,
                        version: data.version || 1, // Ensure version is at least 1
                        title: data.title
                    };
                }));

                this.draftQuizItems = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        version: data.version || 1 // Ensure version is at least 1
                    };
                });

                // Log processed items with versions
                console.log('Processed draft/pending items with versions:', this.draftQuizItems.map(item => ({
                    id: item.id,
                    status: item.status,
                    version: item.version,
                    title: item.title
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
                Object.entries(obj).forEach(([key, value]) => {
                    if (value === undefined) {
                        result[key] = null;  // Convert undefined to null for Firestore
                    } else if (typeof value === 'object' && value !== null) {
                        result[key] = sanitizeData(value);  // Recursively sanitize nested objects
                    } else {
                        result[key] = value;
                    }
                });
                return result;
            };

            const beforeState = this.lastSavedDraftQuizEntry ?
                sanitizeData({ ...this.lastSavedDraftQuizEntry }) :
                null;

            const afterState = sanitizeData({ ...this.draftQuizEntry });

            // Ensure we're using the correct quiz item ID
            const quizItemId = afterState?.id || beforeState?.id;
            if (!quizItemId) {
                console.error('No quiz item ID found for version history');
                return;
            }

            try {
                // Get the latest revision number for this quiz item
                const editHistoryRef = collection(db, 'quizEditHistory');
                const q = query(
                    editHistoryRef,
                    where('quizItemId', '==', quizItemId),
                    orderBy('revisionNumber', 'desc'),
                    limit(1)
                );

                const querySnapshot = await getDocs(q);
                const lastRevision = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().revisionNumber;
                const newRevisionNumber = lastRevision + 1;

                // Create the version history entry
                await addDoc(editHistoryRef, {
                    quizItemId,
                    userId: auth.user?.uid,
                    userEmail: auth.user?.email,
                    timestamp: serverTimestamp(),
                    versionMessage,
                    revisionNumber: newRevisionNumber,
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
                const user = auth.currentUser;
                if (!user) throw new Error('No user found');

                // Store the current state before saving
                const previousState = { ...this.lastSavedDraftQuizEntry };

                // Get the current quiz ID - use the existing ID if available
                const currentId = this.draftQuizEntry.id;

                // Set up the entry to save
                const entryToSave = {
                    ...this.draftQuizEntry,
                    userId: user.uid,
                    userEmail: user.email,
                    isAnonymous: user.isAnonymous,
                    status: this.draftQuizEntry.status || 'draft',  // Preserve existing status
                    version: currentId ? (this.draftQuizEntry.version || 1) + 1 : 1,
                    timestamp: serverTimestamp(),
                };

                let docRef;
                let savedId;

                // Log the current state
                console.log('Saving draft with state:', {
                    currentId,
                    isNewItem: !currentId,
                    currentVersion: this.draftQuizEntry.version
                });

                if (!currentId) {
                    // Only create new document if we don't have an ID
                    docRef = await addDoc(collection(db, 'quizEntries'), entryToSave);
                    savedId = docRef.id;
                    console.log('Created new quiz item with ID:', savedId, 'and version:', entryToSave.version);
                } else {
                    // Update existing document
                    docRef = doc(db, 'quizEntries', currentId);
                    await setDoc(docRef, entryToSave);
                    savedId = currentId;
                    console.log('Updated existing quiz item:', savedId, 'with version:', entryToSave.version);
                }

                // Update the draft entry with the saved ID and version
                this.draftQuizEntry = {
                    ...entryToSave,
                    id: savedId
                };

                // Update lastSavedDraftQuizEntry AFTER successful save
                this.lastSavedDraftQuizEntry = { ...this.draftQuizEntry };

                // Refresh the draft items list
                await this.fetchDraftQuizItems();

                // Validate the saved entry
                const validation = this.validateDraftQuizEntry(this.draftQuizEntry);
                console.log('Validation after save:', validation);

                this.saveStatus = {
                    message: 'Draft saved successfully!',
                    type: 'success',
                    show: true
                };

                return savedId;
            } catch (e) {
                console.error('Error saving draft:', e);
                this.saveStatus = {
                    message: e.message || 'Error saving draft',
                    type: 'error',
                    show: true
                };
                throw e;
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

        validateDraftQuizEntry(draft) {
            const validation = {
                errors: [],
                invalidFields: new Set()
            };

            // Default values to check against
            const defaultValues = {
                title: '',
                subtitle: '',
                Question: 'What is your question?',
                questionP2: '',
                option1: 'First option',
                option2: 'Second option',
                option3: 'Third option',
                option4: 'Fourth option',
                option5: 'Fifth option',
                explanation: 'Here is why option 1 is correct...'
            };

            // Required fields - check for empty or default values
            if (!draft.title?.trim() || draft.title === defaultValues.title) {
                validation.errors.push('Title is required');
                validation.invalidFields.add('title');
            }

            if (!draft.Question?.trim() || draft.Question === defaultValues.Question) {
                validation.errors.push('Question is required');
                validation.invalidFields.add('Question');
            }

            // Answer type specific validation
            if (draft.answer_type === 'mc') {
                // For multiple choice, need at least 2 options and a correct answer
                const options = [
                    draft.option1,
                    draft.option2,
                    draft.option3,
                    draft.option4,
                    draft.option5
                ];

                // Check if options are just default values
                const nonDefaultOptions = options.filter(
                    (opt, index) => opt?.trim() && opt !== defaultValues[`option${index + 1}`]
                );

                if (nonDefaultOptions.length < 2) {
                    validation.errors.push('Multiple choice questions require at least 2 non-default options');
                    // Mark all empty or default options as invalid
                    options.forEach((opt, index) => {
                        if (!opt?.trim() || opt === defaultValues[`option${index + 1}`]) {
                            validation.invalidFields.add(`option${index + 1}`);
                        }
                    });
                }

                if (!draft.correctAnswer || draft.correctAnswer < 1 || draft.correctAnswer > nonDefaultOptions.length) {
                    validation.errors.push('Please select a valid correct answer');
                    validation.invalidFields.add('correctAnswer');
                }

                // Check if the selected correct answer is still a default value
                const correctOptionIndex = draft.correctAnswer - 1;
                if (correctOptionIndex >= 0 &&
                    options[correctOptionIndex] === defaultValues[`option${draft.correctAnswer}`]) {
                    validation.errors.push('The correct answer cannot be a default option');
                    validation.invalidFields.add(`option${draft.correctAnswer}`);
                }
            } else if (draft.answer_type === 'ms') {
                // For multiple select, need at least 2 options and at least two correct answers
                const options = [
                    draft.option1,
                    draft.option2,
                    draft.option3,
                    draft.option4,
                    draft.option5
                ];

                // Check if options are just default values
                const nonDefaultOptions = options.filter(
                    (opt, index) => opt?.trim() && opt !== defaultValues[`option${index + 1}`]
                );

                if (nonDefaultOptions.length < 2) {
                    validation.errors.push('Multiple select questions require at least 2 non-default options');
                    // Mark all empty or default options as invalid
                    options.forEach((opt, index) => {
                        if (!opt?.trim() || opt === defaultValues[`option${index + 1}`]) {
                            validation.invalidFields.add(`option${index + 1}`);
                        }
                    });
                }

                if (!draft.correctAnswers || !Array.isArray(draft.correctAnswers) || draft.correctAnswers.length < 2) {
                    validation.errors.push('Multiple select questions require at least two correct answers');
                    validation.invalidFields.add('correctAnswers');
                }

                // Check if any of the selected correct answers are default values
                if (draft.correctAnswers) {
                    draft.correctAnswers.forEach(answer => {
                        const index = answer - 1;
                        if (index >= 0 && options[index] === defaultValues[`option${answer}`]) {
                            validation.errors.push(`Correct answer option ${answer} cannot be a default option`);
                            validation.invalidFields.add(`option${answer}`);
                        }
                    });
                }
            }

            // Explanation validation - check for default value
            if (!draft.explanation?.trim() || draft.explanation === defaultValues.explanation) {
                validation.errors.push('Explanation is required');
                validation.invalidFields.add('explanation');
            }

            // Media validation - if URLs are provided, they should be valid
            if (draft.videoUrl && !this.isValidUrl(draft.videoUrl)) {
                validation.errors.push('Invalid video URL');
                validation.invalidFields.add('videoUrl');
            }
            if (draft.imageUrl && !this.isValidUrl(draft.imageUrl)) {
                validation.errors.push('Invalid image URL');
                validation.invalidFields.add('imageUrl');
            }

            // Podcast episode validation
            if (draft.podcastEpisode?.EpisodeUrl && !this.isValidUrl(draft.podcastEpisode.EpisodeUrl)) {
                validation.errors.push('Invalid podcast episode URL');
                validation.invalidFields.add('podcastEpisodeUrl');
            }
            if (draft.podcastEpisode?.audioUrl && !this.isValidUrl(draft.podcastEpisode.audioUrl)) {
                validation.errors.push('Invalid podcast audio URL');
                validation.invalidFields.add('podcastAudioUrl');
            }

            // Citations validation
            if (draft.citations?.length > 0) {
                draft.citations.forEach((citation, index) => {
                    if (!citation.title?.trim()) {
                        validation.errors.push(`Citation ${index + 1} requires a title`);
                        validation.invalidFields.add(`citation-${index}-title`);
                    }
                    if (citation.url && !this.isValidUrl(citation.url)) {
                        validation.errors.push(`Citation ${index + 1} has an invalid URL`);
                        validation.invalidFields.add(`citation-${index}-url`);
                    }
                });
            }

            return validation;
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
                currentId: this.draftQuizEntry.id  // Log current ID for debugging
            });

            // Ensure we preserve both the ID and version number
            const updatedEntry = {
                ...this.draftQuizEntry,  // Start with current draft to preserve existing values
                ...entry,                 // Override with new values
                id: entry.id || this.draftQuizEntry.id,  // Preserve existing ID if new one is null
                version: entry.version || this.draftQuizEntry.version || 1,
                // Initialize correctAnswers array for multiple select questions
                correctAnswers: entry.answer_type === 'ms' ? (entry.correctAnswers || []) : []
            };

            // Log the final updated entry
            console.log('Final updated entry:', {
                id: updatedEntry.id,
                version: updatedEntry.version,
                title: updatedEntry.title,
                status: updatedEntry.status,
                previousId: this.draftQuizEntry.id  // Log previous ID for debugging
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

                // Update the status to approved
                await updateDoc(quizRef, {
                    status: 'approved',
                    approvedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Add to permanent quiz entries
                const permanentRef = doc(db, 'permanentQuizEntries', itemId);
                await setDoc(permanentRef, {
                    ...quizData,
                    status: 'approved',
                    approvedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });

                // Record this change in version history
                this.draftQuizEntry = { ...quizData, id: itemId };
                await this.recordQuizEdit('Quiz item approved and moved to permanent entries');

                // Refresh the draft items list
                await this.fetchDraftQuizItems();

                return true;
            } catch (error) {
                console.error('Error accepting quiz item:', error);
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
        }
    },
});
