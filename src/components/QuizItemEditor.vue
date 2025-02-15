<template>
    <div class="editor-container p-4">
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="mb-6 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ isNewProposal ? 'Propose Changes' : 'Edit Quiz Item' }}
                </h2>
                <div class="text-sm text-gray-500 dark:text-gray-400" v-if="originalId">
                    Based on Quiz Item #{{ originalId }}
                </div>
            </div>

            <!-- Preview Toggle -->
            <div class="mb-4">
                <button type="button" @click="previewMode = !previewMode"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    {{ previewMode ? 'Edit Mode' : 'Preview Mode' }}
                </button>
            </div>

            <!-- Preview Section -->
            <div v-if="previewMode" class="mb-6">
                <QuizItem :currentQuizItem="editedItem" :itemNum="0" :reviewMode="true" :basicMode="false"
                    :debug="false" :userAnswer="editedItem.correctAnswer" />
            </div>

            <!-- Edit Form -->
            <form v-else @submit.prevent="saveQuizItem"
                class="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <!-- Title -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title
                    </label>
                    <input v-model="editedItem.title" type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required />
                </div>

                <!-- Question -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question
                    </label>
                    <textarea v-model="editedItem.Question" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required></textarea>
                </div>

                <!-- Options -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Answer Options
                    </label>
                    <div v-for="n in 6" :key="n" class="mb-2">
                        <div class="flex items-center gap-2">
                            <input :id="'option' + n" v-model="editedItem['option' + n]" type="text"
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                :placeholder="'Option ' + n" />
                            <input type="radio" :value="n" v-model="editedItem.correctAnswer" :name="'correct-answer'"
                                class="h-4 w-4 text-blue-600 focus:ring-blue-500 dark:bg-gray-700" />
                            <label :for="'option' + n" class="text-sm text-gray-600 dark:text-gray-400">
                                Correct
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Explanation -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Explanation
                    </label>
                    <textarea v-model="editedItem.explanation" rows="4"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end gap-4">
                    <button type="button" @click="$router.back()"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                        Cancel
                    </button>
                    <button type="submit"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {{ isNewProposal ? 'Submit Proposal' : 'Save Changes' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../composables/useAuth';
import QuizItem from './QuizItem.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const previewMode = ref(false);

const editedItem = ref({
    title: '',
    Question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    option5: '',
    option6: '',
    correctAnswer: null,
    explanation: '',
    answer_type: 'mc'
});

const originalId = ref(null);
const isNewProposal = ref(false);

onMounted(async () => {
    const itemId = route.params.id;
    if (itemId) {
        const docRef = doc(db, 'proposedQuizItems', itemId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            editedItem.value = { ...docSnap.data() };
            originalId.value = editedItem.value.originalId;
            isNewProposal.value = true;
        }
    }
});

const saveQuizItem = async () => {
    try {
        const itemId = route.params.id;
        const docRef = doc(db, 'proposedQuizItems', itemId);

        await setDoc(docRef, {
            ...editedItem.value,
            lastModified: new Date().toISOString(),
            modifiedBy: auth.user.value?.uid || 'anonymous'
        });

        router.push('/quizSetView');
    } catch (error) {
        console.error('Error saving quiz item:', error);
        alert('Failed to save changes. Please try again.');
    }
};
</script>

<style scoped>
.editor-container {
    min-height: 100vh;
    background-color: #f3f4f6;
}

@media (prefers-color-scheme: dark) {
    .editor-container {
        background-color: #111827;
    }
}
</style>