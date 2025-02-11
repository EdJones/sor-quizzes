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
    getDocs
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
            id: null
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

                // Add quiz attempt to Firestore
                const quizAttemptRef = await addDoc(collection(db, 'quizAttempts'), {
                    userId: auth.currentUser.uid,
                    quizId: this.currentQuizId,
                    quizStarted: serverTimestamp(),
                    completedAt: serverTimestamp(),
                    score: validatedScore,
                    totalQuestions: validatedTotal,
                    userAnswers: this.userAnswers,
                    isAnonymous: auth.currentUser.isAnonymous
                });

                console.log('Quiz attempt recorded:', quizAttemptRef.id);

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
                console.log('Querying for status == draft');

                const q = query(draftsRef, where('status', '==', 'draft'));
                const querySnapshot = await getDocs(q);

                // Log the raw results
                console.log('Raw query results:', querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    status: doc.data().status
                })));

                this.draftQuizItems = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                console.log('Fetched draft items:', this.draftQuizItems.length);
                return this.draftQuizItems;
            } catch (error) {
                console.error('Error fetching draft items:', error);
                throw error;
            }
        },

        async saveDraftQuizEntry() {
            try {
                const user = auth.currentUser;
                if (!user) throw new Error('No user found');

                // Create a copy of the draft entry without the id field
                const { id, ...entryWithoutId } = this.draftQuizEntry;

                const entryToSave = {
                    ...entryWithoutId,
                    userId: user.uid,
                    userEmail: user.email,
                    isAnonymous: user.isAnonymous,
                    status: 'draft',
                    podcastEpisode: this.draftQuizEntry.podcastEpisode || {
                        title: '',
                        EpisodeUrl: '',
                        audioUrl: '',
                        description: '',
                        podcastStartTime: 0
                    },
                    podcastEpisode2: this.draftQuizEntry.podcastEpisode2 || {
                        title: '',
                        EpisodeUrl: '',
                        audioUrl: '',
                        description: '',
                        podcastStartTime: 0
                    },
                    timestamp: serverTimestamp(),
                };

                let docRef;

                // Always create a new document if this is a copy (originalId exists)
                if (this.draftQuizEntry.originalId) {
                    // Create new document
                    docRef = await addDoc(collection(db, 'quizEntries'), entryToSave);
                    // Update store state with new ID
                    this.draftQuizEntry = {
                        ...this.draftQuizEntry,
                        id: docRef.id
                    };
                    console.log('Created new copy with ID:', docRef.id);
                }
                // If we have an ID, try to update the existing draft
                else if (this.draftQuizEntry.id) {
                    const existingDraft = this.draftQuizItems.find(item => item.id === this.draftQuizEntry.id);
                    if (existingDraft && existingDraft.userId === user.uid) {
                        // Update existing draft
                        docRef = doc(db, 'quizEntries', this.draftQuizEntry.id);
                        await setDoc(docRef, entryToSave, { merge: true });
                        console.log('Updated existing draft:', this.draftQuizEntry.id);
                    } else {
                        // Create new draft if we can't update the existing one
                        docRef = await addDoc(collection(db, 'quizEntries'), entryToSave);
                        // Update store state with new ID
                        this.draftQuizEntry = {
                            ...this.draftQuizEntry,
                            id: docRef.id
                        };
                        console.log('Created new draft from existing with ID:', docRef.id);
                    }
                } else {
                    // Create new draft
                    docRef = await addDoc(collection(db, 'quizEntries'), entryToSave);
                    // Update store state with new ID
                    this.draftQuizEntry = {
                        ...this.draftQuizEntry,
                        id: docRef.id
                    };
                    console.log('Created new draft with ID:', docRef.id);
                }

                // Refresh the draft items list
                await this.fetchDraftQuizItems();

                this.saveStatus = {
                    message: 'Draft saved successfully!',
                    type: 'success',
                    show: true
                };

                return this.draftQuizEntry.id;
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

                const entryToUpdate = {
                    ...this.draftQuizEntry,
                    userId: user.uid,
                    userEmail: user.email,
                    isAnonymous: user.isAnonymous,
                    status: 'draft',
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

        async submitForReview(draftId) {
            try {
                const user = auth.currentUser;
                if (!user) throw new Error('No user found');
                if (user.isAnonymous) throw new Error('Must be signed in to submit for review');

                // Make sure we have the latest draft items
                await this.fetchDraftQuizItems();

                // Verify ownership before submitting
                const existingDraft = this.draftQuizItems.find(item => item.id === draftId);
                if (!existingDraft) {
                    throw new Error('Draft not found - please try saving again');
                }
                if (existingDraft.userId !== user.uid) {
                    throw new Error('You can only submit your own drafts');
                }

                // Final validation before submission
                const validation = this.validateDraftQuizEntry(this.draftQuizEntry);
                if (validation.errors.length > 0) {
                    this.saveStatus = {
                        message: 'Cannot submit: ' + validation.errors.join(', '),
                        type: 'error',
                        show: true
                    };
                    throw new Error('Validation failed: ' + validation.errors.join(', '));
                }

                const docRef = doc(db, 'quizEntries', draftId);
                await setDoc(docRef, {
                    status: 'pending',
                    submittedAt: serverTimestamp(),
                    timestamp: serverTimestamp(),
                }, { merge: true });

                // Refresh the draft items list after submission
                await this.fetchDraftQuizItems();

                this.saveStatus = {
                    message: 'Quiz entry submitted for review!',
                    type: 'success',
                    show: true
                };
                return draftId;
            } catch (e) {
                console.error('Error submitting for review:', e);
                this.saveStatus = {
                    message: e.message || 'Error submitting for review',
                    type: 'error',
                    show: true
                };
                throw e;
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
            const currentId = this.draftQuizEntry.id;
            this.draftQuizEntry = {
                ...this.draftQuizEntry,
                ...entry,
                id: entry.id || currentId // Keep existing ID if new entry doesn't have one
            };
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
                status: 'draft'
            };
        },

        async recordQuizEdit() {
            try {
                const auth = useAuthStore();
                const editData = {
                    userId: auth.user?.uid || 'anonymous',
                    userEmail: auth.user?.email || 'anonymous',
                    timestamp: serverTimestamp(),
                    quizStarted: false,  // Set a default value
                    quizCompleted: false,  // Set a default value if needed
                    editType: 'draft',
                    draftId: this.draftQuizEntry.id || null,
                    originalId: this.draftQuizEntry.originalId || null
                };

                const docRef = await addDoc(collection(db, 'quizEdits'), editData);
                console.log('Quiz edit recorded:', docRef.id);
                return docRef.id;
            } catch (error) {
                console.error('Error recording quiz edit:', error);
                throw error;
            }
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
        }
    },
});
