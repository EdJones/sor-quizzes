<template>
    <div class="p-4">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl">Quiz Set View</h1>
            <button @click="showCreateModal = true"
                class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create New Quiz Set
            </button>
        </div>

        <!-- Quiz Sets Overview Visualization -->
        <div class="mb-2">
            <QuizSetTree :publishedQuizSets="publishedQuizSets" :proposedQuizSets="proposedQuizSets" />
        </div>

        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
            <nav class="-mb-px flex">
                <button @click="currentTab = 'current'" :class="[
                    currentTab === 'current'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'w-24 py-2 px-1 text-center border-b-2 font-medium text-sm'
                ]">
                    Current
                </button>
                <button @click="currentTab = 'proposed'" :class="[
                    currentTab === 'proposed'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                    'w-24 py-2 px-1 text-center border-b-2 font-medium text-sm'
                ]">
                    Proposed
                </button>
            </nav>
        </div>

        <!-- Tab Content -->
        <div class="mt-4">
            <!-- Current Quiz Sets -->
            <div v-if="currentTab === 'current'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="quizSet in publishedQuizSets" :key="quizSet.setName"
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {{ quizSet.setName }}
                        </h3>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            {{ quizSet.items.length }} items
                        </span>
                    </div>

                    <!-- Quiz Set Details -->
                    <div class="space-y-2">
                        <!-- Basic/Expert Mode -->
                        <div class="flex items-center text-sm">
                            <span class="text-gray-600 dark:text-gray-300">Mode:</span>
                            <span :class="[
                                'ml-2 px-2 py-1 rounded text-xs font-medium',
                                quizSet.basicMode
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            ]">
                                {{ quizSet.basicMode ? 'Basic' : 'Expert' }}
                            </span>
                        </div>

                        <!-- Quiz Items List -->
                        <div class="mt-3 space-y-1">
                            <div class="flex justify-between items-center">
                                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 text-left">Quiz Items:
                                </h4>
                                <button @click="toggleQuestions(quizSet.setName)"
                                    class="text-sm text-blue-500 hover:text-blue-600 flex items-center">
                                    <span class="mr-1">{{ expandedSets.has(quizSet.setName) ? 'Hide' : 'Show' }}
                                        Questions</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                        :class="{ 'transform rotate-180': expandedSets.has(quizSet.setName) }"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <ul class="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 text-left">
                                <li v-for="itemId in quizSet.items" :key="itemId" class="mb-2">
                                    <div class="truncate relative">
                                        <span class="cursor-help hover:text-blue-500"
                                            @mouseenter="showQuizDetails(itemId)" @mouseleave="hideQuizDetails">
                                            {{ getQuizItemTitle(itemId) || 'Untitled Question' }}
                                        </span>
                                        <!-- Quiz Details Hover Modal -->
                                        <div v-show="hoveredQuizId === itemId"
                                            class="fixed z-[9999] ml-4 w-[600px] max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
                                            style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                            <div class="space-y-4">
                                                <h4
                                                    class="font-medium text-gray-900 dark:text-white text-lg break-words">
                                                    {{ getQuizItemTitle(itemId) }}
                                                </h4>
                                                <div class="text-gray-700 dark:text-gray-300">
                                                    <p class="font-medium mb-2">Question:</p>
                                                    <p class="mb-4 whitespace-normal break-words">{{
                                                        getQuizItemQuestion(itemId) }}</p>
                                                    <p class="font-medium mb-2">Options:</p>
                                                    <ul class="space-y-2 ml-4">
                                                        <li v-for="(option, index) in getQuizItemOptions(itemId)"
                                                            :key="index"
                                                            class="whitespace-normal break-words flex items-center gap-1"
                                                            :class="{ 'text-green-600 dark:text-green-400 font-medium': isCorrectAnswer(itemId, index + 1) }">
                                                            <svg v-if="isCorrectAnswer(itemId, index + 1)"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                class="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2.5" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {{ index + 1 }}. {{ option }}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="expandedSets.has(quizSet.setName)"
                                        class="mt-1 pl-4 text-sm text-gray-500 dark:text-gray-400 italic">
                                        {{ getQuizItemQuestion(itemId) }}
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- Additional Resources -->
                        <div v-if="quizSet.podcastEpisodes || quizSet.resource"
                            class="text-sm text-gray-600 dark:text-gray-300">
                            <div v-if="quizSet.podcastEpisodes" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Includes podcast episodes
                            </div>
                            <div v-if="quizSet.resource" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Additional resources
                            </div>
                        </div>

                        <!-- Start Quiz Button -->
                        <div class="flex justify-end mt-4">
                            <button @click="startQuiz(quizSet)"
                                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 flex items-center">
                                <span>Start Quiz</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proposed Quiz Sets -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="quizSet in proposedQuizSets" :key="quizSet.setName"
                    class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {{ quizSet.setName }}
                        </h3>
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            {{ quizSet.items.length }} items
                        </span>
                    </div>

                    <!-- Quiz Set Details -->
                    <div class="space-y-2">
                        <!-- Basic/Expert Mode -->
                        <div class="flex items-center text-sm">
                            <span class="text-gray-600 dark:text-gray-300">Mode:</span>
                            <span :class="[
                                'ml-2 px-2 py-1 rounded text-xs font-medium',
                                quizSet.basicMode
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            ]">
                                {{ quizSet.basicMode ? 'Basic' : 'Expert' }}
                            </span>
                        </div>

                        <!-- In Progress Text -->
                        <div v-if="quizSet.inProgressText"
                            class="text-sm text-amber-600 dark:text-amber-400 italic mt-2">
                            {{ quizSet.inProgressText }}
                        </div>

                        <!-- Quiz Items List -->
                        <div class="mt-3 space-y-1">
                            <div class="flex justify-between items-center">
                                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 text-left">Quiz Items:
                                </h4>
                                <button @click="toggleQuestions(quizSet.setName)"
                                    class="text-sm text-blue-500 hover:text-blue-600 flex items-center">
                                    <span class="mr-1">{{ expandedSets.has(quizSet.setName) ? 'Hide' : 'Show' }}
                                        Questions</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                        :class="{ 'transform rotate-180': expandedSets.has(quizSet.setName) }"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <ul class="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 text-left">
                                <li v-for="itemId in quizSet.items" :key="itemId" class="mb-2">
                                    <div class="truncate relative">
                                        <span class="cursor-help hover:text-blue-500"
                                            @mouseenter="showQuizDetails(itemId)" @mouseleave="hideQuizDetails">
                                            {{ getQuizItemTitle(itemId) || 'Untitled Question' }}
                                        </span>
                                        <!-- Quiz Details Hover Modal -->
                                        <div v-show="hoveredQuizId === itemId"
                                            class="fixed z-[9999] ml-4 w-[600px] max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
                                            style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                            <div class="space-y-4">
                                                <h4
                                                    class="font-medium text-gray-900 dark:text-white text-lg break-words">
                                                    {{ getQuizItemTitle(itemId) }}
                                                </h4>
                                                <div class="text-gray-700 dark:text-gray-300">
                                                    <p class="font-medium mb-2">Question:</p>
                                                    <p class="mb-4 whitespace-normal break-words">{{
                                                        getQuizItemQuestion(itemId) }}</p>
                                                    <p class="font-medium mb-2">Options:</p>
                                                    <ul class="space-y-2 ml-4">
                                                        <li v-for="(option, index) in getQuizItemOptions(itemId)"
                                                            :key="index"
                                                            class="whitespace-normal break-words flex items-center gap-1"
                                                            :class="{ 'text-green-600 dark:text-green-400 font-medium': isCorrectAnswer(itemId, index + 1) }">
                                                            <svg v-if="isCorrectAnswer(itemId, index + 1)"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                class="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2.5" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {{ index + 1 }}. {{ option }}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="expandedSets.has(quizSet.setName)"
                                        class="mt-1 pl-4 text-sm text-gray-500 dark:text-gray-400 italic">
                                        {{ getQuizItemQuestion(itemId) }}
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- Additional Resources -->
                        <div v-if="quizSet.podcastEpisodes || quizSet.resource"
                            class="text-sm text-gray-600 dark:text-gray-300">
                            <div v-if="quizSet.podcastEpisodes" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Includes podcast episodes
                            </div>
                            <div v-if="quizSet.resource" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Additional resources
                            </div>
                        </div>

                        <!-- Start Quiz Button -->
                        <div class="flex justify-end mt-4">
                            <button @click="startQuiz(quizSet)"
                                class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 flex items-center">
                                <span>Start Quiz</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Quiz Set Modal -->
        <div v-if="showCreateModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Create New Quiz Set</h2>
                    <button @click="showCreateModal = false" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="createQuizSet" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quiz Set Name
                        </label>
                        <input v-model="newQuizSet.setName" type="text" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Mode
                        </label>
                        <select v-model="newQuizSet.basicMode"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option :value="true">Basic</option>
                            <option :value="false">Expert</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Scope
                        </label>
                        <textarea v-model="newQuizSet.inProgressText" rows="2"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Describe the scope of this quiz set..."></textarea>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" @click="showCreateModal = false"
                            class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                            Cancel
                        </button>
                        <button type="submit"
                            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200">
                            Create Quiz Set
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { quizSets } from '../data/quizSets';
import { quizEntries } from '../data/quiz-items';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import QuizSetTree from '../components/QuizSetTree.vue';

const router = useRouter();
const currentTab = ref('current');
const expandedSets = ref(new Set());
const showCreateModal = ref(false);
const hoveredQuizId = ref(null);

// New quiz set form data
const newQuizSet = reactive({
    setName: '',
    basicMode: true,
    inProgress: true,
    inProgressText: '',
    items: []
});

// Filter quiz sets based on inProgress flag
const publishedQuizSets = quizSets.filter(set => !set.inProgress);
const proposedQuizSets = quizSets.filter(set => set.inProgress);

// Create new quiz set
const createQuizSet = async () => {
    try {
        // Create a new quiz set document in Firestore
        const quizSetRef = doc(db, 'quizSets', newQuizSet.setName.toLowerCase().replace(/\s+/g, '-'));
        await setDoc(quizSetRef, {
            setName: newQuizSet.setName,
            basicMode: newQuizSet.basicMode,
            inProgress: newQuizSet.inProgress,
            inProgressText: newQuizSet.inProgressText,
            items: [],
            createdAt: new Date().toISOString()
        });

        // Add the new quiz set to the local array
        quizSets.push({
            setName: newQuizSet.setName,
            basicMode: newQuizSet.basicMode,
            inProgress: newQuizSet.inProgress,
            inProgressText: newQuizSet.inProgressText,
            items: []
        });

        // Reset form and close modal
        Object.assign(newQuizSet, {
            setName: '',
            basicMode: true,
            inProgress: true,
            inProgressText: '',
            items: []
        });
        showCreateModal.value = false;

        // Switch to appropriate tab
        currentTab.value = newQuizSet.inProgress ? 'proposed' : 'current';
    } catch (error) {
        console.error('Error creating quiz set:', error);
        alert('Failed to create quiz set. Please try again.');
    }
};

// Function to get quiz item title by ID
const getQuizItemTitle = (id) => {
    const quizItem = quizEntries.find(item => item.id === id);
    return quizItem?.title || `Question ${id}`;
};

// Function to get quiz item question by ID
const getQuizItemQuestion = (id) => {
    const quizItem = quizEntries.find(item => item.id === id);
    return quizItem?.Question || 'No question available';
};

// Function to toggle questions visibility for a quiz set
const toggleQuestions = (setName) => {
    const newExpandedSets = new Set(expandedSets.value);
    if (newExpandedSets.has(setName)) {
        newExpandedSets.delete(setName);
    } else {
        newExpandedSets.add(setName);
    }
    expandedSets.value = newExpandedSets;
};

// Function to start a quiz
const startQuiz = (quizSet) => {
    // Find the index of the quiz set in the original quizSets array
    const quizIndex = quizSets.findIndex(set => set.setName === quizSet.setName);
    if (quizIndex !== -1) {
        router.push(`/quiz/${quizIndex}`);
    }
};

// Function to show quiz details
const showQuizDetails = (id) => {
    console.log('Showing quiz details for id:', id); // Debug log
    hoveredQuizId.value = id;
};

// Function to hide quiz details
const hideQuizDetails = () => {
    console.log('Hiding quiz details, current id:', hoveredQuizId.value); // Debug log
    hoveredQuizId.value = null;
};

// Function to get quiz item options
const getQuizItemOptions = (id) => {
    const quizItem = quizEntries.find(item => item.id === id);
    if (!quizItem) return [];

    return [
        quizItem.option1,
        quizItem.option2,
        quizItem.option3,
        quizItem.option4,
        quizItem.option5,
        quizItem.option6
    ].filter(option => option); // Filter out empty options
};

// Function to check if an option is the correct answer
const isCorrectAnswer = (id, optionNumber) => {
    const quizItem = quizEntries.find(item => item.id === id);
    return quizItem?.correctAnswer === optionNumber;
};
</script>

<style scoped>
/* Add these styles at the bottom of the file */
.group:hover {
    z-index: 50;
}

/* Ensure modal content is above other elements */
.absolute {
    isolation: isolate;
}

.fixed {
    position: fixed !important;
}

[class*="z-9999"] {
    z-index: 9999 !important;
}
</style>