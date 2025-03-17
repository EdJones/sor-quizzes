<template>
    <div class="short-answer-container">
        <div class="question-text mb-4">{{ quizItem.Question }}</div>
        <div v-if="quizItem.questionP2" class="question-text mb-4">{{ quizItem.questionP2 }}</div>

        <div class="answer-input-container">
            <input v-if="!reviewMode" type="text" v-model="localAnswer" @input="handleInput"
                class="answer w-full px-4 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                :placeholder="'Enter your answer...'" />
            <div v-else class="answer-display">
                <div class="answer mb-4">
                    <div class="font-medium mb-2">Your answer:</div>
                    <div class="p-2 rounded-md">{{ userAnswer || 'No answer provided' }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, watch } from 'vue';

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

        watch(() => props.userAnswer, (newVal) => {
            localAnswer.value = newVal || '';
        });

        const handleInput = () => {
            emit('update:userAnswer', localAnswer.value);
            emit('answer-selected', localAnswer.value);
        };

        return {
            localAnswer,
            handleInput
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
</style>