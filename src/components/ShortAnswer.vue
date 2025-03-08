<template>
    <div class="short-answer-container">
        <div class="question-text mb-4">{{ quizItem.Question }}</div>
        <div v-if="quizItem.questionP2" class="question-text mb-4">{{ quizItem.questionP2 }}</div>

        <div class="answer-input-container">
            <input v-if="!reviewMode" type="text" v-model="localAnswer" @input="handleInput"
                class="answer w-full px-4 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                :placeholder="'Enter your answer...'" />
            <div v-else class="answer-display">
                <div class="answer mb-4"
                    :class="{ 'border-red-500 dark:border-red-600': !isCorrect, 'border-green-500 dark:border-green-600': isCorrect }">
                    <div class="font-medium mb-2">Your answer:</div>
                    <div class="p-2 rounded-md">{{ userAnswer || 'No answer provided' }}</div>
                    <div v-if="userAnswer" class="mt-2 text-sm"
                        :class="{ 'text-red-500': !isCorrect, 'text-green-500': isCorrect }">
                        {{ assessmentMessage }}
                        <div v-if="isLoading" class="mt-1 text-gray-500">Assessing answer...</div>
                    </div>
                </div>
                <div class="answer">
                    <div class="font-medium mb-2">Correct answer:</div>
                    <div class="p-2 rounded-md">{{ quizItem.correctAnswer }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, watch, computed } from 'vue';

export default {
    name: 'ShortAnswer',
    props: {
        quizItem: {
            type: Object,
            required: true
        },
        reviewMode: {
            type: Boolean,
            required: true
        },
        userAnswer: {
            type: String,
            default: null
        }
    },
    emits: ['update:userAnswer', 'answer-selected'],
    setup(props, { emit }) {
        const localAnswer = ref(props.userAnswer || '');
        const isLoading = ref(false);
        const aiAssessment = ref(null);

        watch(() => props.userAnswer, (newVal) => {
            localAnswer.value = newVal || '';
        });

        const handleInput = () => {
            emit('update:userAnswer', localAnswer.value);
            emit('answer-selected', localAnswer.value);
        };

        const assessAnswerWithAI = async (userAnswer, correctAnswer) => {
            if (!userAnswer || !correctAnswer) return null;

            isLoading.value = true;
            try {
                const response = await fetch('/api/assess-answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userAnswer,
                        correctAnswer,
                        question: props.quizItem.Question
                    })
                });

                if (!response.ok) throw new Error('API request failed');

                const data = await response.json();
                aiAssessment.value = data;
                return data;
            } catch (error) {
                console.error('AI assessment failed:', error);
                return null;
            } finally {
                isLoading.value = false;
            }
        };

        const fallbackAssessment = () => {
            if (!props.userAnswer || !props.quizItem.correctAnswer) return false;

            const userAnswerLower = props.userAnswer.toLowerCase().trim();
            const correctAnswerLower = props.quizItem.correctAnswer.toLowerCase().trim();

            if (userAnswerLower === correctAnswerLower) return true;
            if (userAnswerLower.includes(correctAnswerLower)) return true;
            if (correctAnswerLower.includes(userAnswerLower)) return true;

            return false;
        };

        const isCorrect = computed(() => {
            if (aiAssessment.value) {
                return aiAssessment.value.isCorrect;
            }
            return fallbackAssessment();
        });

        const assessmentMessage = computed(() => {
            if (!props.userAnswer) return '';
            if (isLoading.value) return 'Assessing your answer...';

            if (aiAssessment.value) {
                return aiAssessment.value.message;
            }

            const userAnswerLower = props.userAnswer.toLowerCase().trim();
            const correctAnswerLower = props.quizItem.correctAnswer.toLowerCase().trim();

            if (userAnswerLower === correctAnswerLower) return 'Correct!';
            if (userAnswerLower.includes(correctAnswerLower)) return 'Correct! (Contains the answer)';
            if (correctAnswerLower.includes(userAnswerLower)) return 'Partially correct';
            return 'Incorrect';
        });

        // Trigger AI assessment when in review mode and we have both answers
        watch(() => props.reviewMode, async (newVal) => {
            if (newVal && props.userAnswer && props.quizItem.correctAnswer) {
                await assessAnswerWithAI(props.userAnswer, props.quizItem.correctAnswer);
            }
        });

        return {
            localAnswer,
            handleInput,
            isCorrect,
            assessmentMessage,
            isLoading
        };
    }
};
</script>

<style scoped>
.short-answer-container {
    @apply w-full;
}

.question-text {
    @apply text-gray-900 dark:text-white text-lg;
}

.answer-input-container {
    @apply mt-4;
}

.answer {
    @apply border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
}

.answer-display {
    @apply space-y-4;
}

.answer-display .answer {
    @apply border-gray-300 dark:border-gray-600;
}

.answer-display .answer:last-child {
    @apply border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-900/20;
}
</style>