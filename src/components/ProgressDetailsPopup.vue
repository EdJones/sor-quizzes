<template>
    <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div class="mt-3">
                <div class="mt-2">
                    <!-- Loading State -->
                    <div v-if="!progressStore.initialized" class="text-center py-4">
                        <div
                            class="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full mx-auto mb-2">
                        </div>
                        <p class="text-gray-600 dark:text-gray-400">Loading progress...</p>
                    </div>

                    <template v-else>
                        <!-- Anonymous User Warning -->
                        <div v-if="authStore.user?.isAnonymous"
                            class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                            <div class="flex items-center gap-2">
                                <svg class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span class="text-sm text-yellow-800 dark:text-yellow-200">
                                    Anonymous User: Progress will not be saved between sessions
                                </span>
                            </div>
                            <div class="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                                <router-link to="/login"
                                    class="underline hover:text-yellow-900 dark:hover:text-yellow-100"
                                    @click="$emit('close')">
                                    Sign in
                                </router-link>
                                to save your progress permanently
                            </div>
                        </div>

                        <!-- Overall Stats -->
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                                    {{ progressStore.quizCompletionCount }}/{{ progressStore.totalQuizzes }}
                                </div>
                                <div class="text-sm text-gray-600 dark:text-gray-300">Quizzes Completed</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                                    {{ progressStore.correctItemsCount }}/{{ progressStore.totalQuizItems }}
                                </div>
                                <div class="text-sm text-gray-600 dark:text-gray-300">Items Correct</div>
                            </div>
                        </div>

                        <!-- Per Quiz Set Progress -->
                        <div class="space-y-2">
                            <div v-for="(quizSet, index) in publishedQuizSets" :key="quizSet.setName"
                                class="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                                @click="showMissedItems(quizSet, index)">
                                <div class="flex justify-between mb-1">
                                    <span
                                        class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                        {{ quizSet.setName }}
                                    </span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium text-gray-900 dark:text-white">
                                            {{ getProgress(quizSet).correct }}/{{ getProgress(quizSet).total }}
                                        </span>
                                        <!-- Toggle between info and close icons -->
                                        <svg v-if="selectedQuizSet !== index" xmlns="http://www.w3.org/2000/svg"
                                            class="h-4 text-gray-500" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 text-gray-500"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 15l7-7 7 7" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600">
                                    <div class="bg-blue-600 h-1.5 rounded-full"
                                        :style="{ width: `${getProgress(quizSet).percentage}%` }">
                                    </div>
                                </div>

                                <!-- Missed Items Section -->
                                <div v-if="selectedQuizSet === index"
                                    class="mt-2 text-sm text-gray-600 dark:text-gray-300 text-left">
                                    <div class="font-medium mb-1 pl-2">Questions Missed:</div>
                                    <ul class="list-disc pl-6 ml-2">
                                        <li v-for="item in missedItems" :key="item.id" class="pl-1">
                                            {{ item.title || 'Untitled Question' }}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Last Updated -->
                        <div class="text-sm text-gray-500 dark:text-gray-400 mt-4">
                            Last updated: {{ lastUpdatedText }}
                        </div>

                        <!-- Close Button -->
                        <div class="mt-4">
                            <button @click="handleClose"
                                class="bg-gray-500 text-white active:bg-gray-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150">
                                Close
                            </button>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useProgressStore } from '../stores/progressStore';
import { quizSets } from '../data/quizSets';
import { computed, ref, watch } from 'vue';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../stores/authStore';

const props = defineProps({
    show: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close']);

const progressStore = useProgressStore();
const authStore = useAuthStore();
const quizSetProgress = ref(new Map());
const selectedQuizSet = ref(null);
const missedItems = ref([]);
const currentQuizId = ref(null);

// Add computed properties for published quiz sets
const publishedQuizSets = computed(() => {
    return quizSets.filter(set => !set.inProgress);
});

// Watch for changes to the show prop
watch(() => props.show, async (newVal) => {
    if (newVal) {
        // Fetch progress for each quiz set
        for (const set of quizSets) {
            try {
                // Get the quiz ID from the array index
                const quizId = quizSets.findIndex(s => s.setName === set.setName);

                console.log('Fetching progress for quiz:', {
                    setName: set.setName,
                    quizId,
                    userId: authStore.user?.uid
                });

                // Get the user's progress for this quiz
                const progressRef = doc(db, 'userProgress', `${authStore.user?.uid}_${quizId}`);
                const progressDoc = await getDoc(progressRef);

                console.log('Progress doc for quiz:', {
                    setName: set.setName,
                    exists: progressDoc.exists(),
                    data: progressDoc.data()
                });

                if (progressDoc.exists()) {
                    const data = progressDoc.data();
                    const correctAnswers = data.totalCorrect || 0;
                    const totalQuestions = set.items.length;
                    const percentage = totalQuestions > 0
                        ? (correctAnswers / totalQuestions) * 100
                        : 0;

                    console.log('Calculated progress:', {
                        setName: set.setName,
                        correctAnswers,
                        totalQuestions,
                        percentage: Math.round(percentage)
                    });

                    quizSetProgress.value.set(set.setName, {
                        correct: correctAnswers,
                        total: totalQuestions,
                        percentage: Math.round(percentage)
                    });
                } else {
                    console.log('No progress found for quiz:', set.setName);
                    quizSetProgress.value.set(set.setName, {
                        correct: 0,
                        total: set.items.length,
                        percentage: 0
                    });
                }
            } catch (error) {
                console.error('Error fetching progress for quiz:', set.setName, error);
            }
        }
    }
});

const getProgress = (quizSet) => {
    return quizSetProgress.value.get(quizSet.setName) || {
        correct: 0,
        total: quizSet.items.length,
        percentage: 0
    };
};

const showMissedItems = async (quizSet, index) => {
    console.log('Showing missed items for quiz:', {
        quizSet,
        index,
        setName: quizSet.setName,
        items: quizSet.items
    });

    if (selectedQuizSet.value === index) {
        // If clicking the same quiz set, collapse it
        selectedQuizSet.value = null;
        missedItems.value = [];
        return;
    }

    selectedQuizSet.value = index;
    missedItems.value = [];

    try {
        // Get the quiz ID from the array index
        const quizId = quizSets.findIndex(s => s.setName === quizSet.setName);

        // Get the user's progress for this quiz
        const progressRef = doc(db, 'userProgress', `${authStore.user?.uid}_${quizId}`);
        const progressDoc = await getDoc(progressRef);

        console.log('Progress doc:', progressDoc.data());

        if (progressDoc.exists()) {
            const data = progressDoc.data();

            // Update to handle both userAnswers and incorrectQuestions
            if (data.userAnswers) {
                missedItems.value = data.userAnswers
                    .filter(answer => !answer.correct)
                    .map(answer => ({
                        id: answer.questionId,
                        title: answer.questionTitle || 'Untitled Question'
                    }));
            } else if (data.incorrectQuestions) {
                missedItems.value = data.incorrectQuestions.map(q => ({
                    id: q.id,
                    title: q.title || 'Untitled Question'
                }));
            }

            console.log('Found missed items:', missedItems.value);
        }
    } catch (error) {
        console.error('Error fetching missed items:', error);
    }
};

const lastUpdatedText = computed(() => {
    if (!progressStore.lastUpdated) return 'Never';
    return new Date(progressStore.lastUpdated).toLocaleString();
});

const quizScore = computed(() => {
    const score = progressStore.getQuizScore(currentQuizId.value);
    return `${score.score}/${score.total} questions`;
});

const handleClose = () => {
    emit('close');
};
</script>

<style scoped>
.bg-opacity-50 {
    backdrop-filter: blur(4px);
}

/* Add these styles to ensure popup is above other content */
.fixed {
    isolation: isolate;
}
</style>