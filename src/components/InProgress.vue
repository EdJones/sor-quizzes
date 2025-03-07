<template>
    <div class="sm:w-full md:w-9/12 lg:w-5/6 lg:px-4 quizzes-container text-center">
        <div
            class="grid quiz-item w-full border-4 border-dashed place-self-center place-content-center text-center relative">
            <div class="absolute top-4 right-4">
                <button @click="returnToQuizzes" class="return-button">
                    Return to Quizzes
                </button>
            </div>

            <div class="p-8 sm:p-4">
                <div class="md:text-center sm:text-left sm:pl-2 sm:pr-24">
                    <div class="flex items-center justify-center gap-2 mb-4">
                        <h2 class="text-2xl">Coming Soon</h2>
                        <div>
                            <font-awesome-icon :icon="['fas', 'tools']" class="text-xl text-gray-400" />
                        </div>
                    </div>
                    <p class="text-lg mb-6">Want to see a "{{ quizTitle }}" quiz? </p>
                    <p class="text-lg mb-6 relative pr-16">
                        Add/improve a question. Together we can raise up teachers everywhere.
                        <img src="/images/partners.png" alt="Partners" class="absolute right-0 top-1/2 -translate-y-1/2"
                            width="34" height="34" />
                    </p>
                </div>

                <div class="router-link-container">
                    <router-link to="/edit-item/new" class="button-77">Add/Edit a New Quiz Entry</router-link>
                </div>
                <div class="feedback-section">
                    <p class="mt-4 mb-4">OR </p>
                    <p class="mb-4">Tell us what would you like to see in this quiz</p>
                    <textarea v-model="feedback" class="w-full p-4 mb-4 min-h-[120px] rounded-lg"
                        placeholder="Share your thoughts..."></textarea>
                    <button @click="submitFeedback"
                        class="bg-stone-400 px-6 h-10 text-amber-400 rounded hover:bg-stone-500 transition-colors">
                        Submit Suggestion
                    </button>
                </div>
                <div class="podcast-episode">
                    {{ Array.isArray(podcastEpisodes) }}
                    <PodcastReference v-for="(episode, index) in podcastEpisodes" :key="index"
                        :podcastEpisode="episode" />

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { quizSets } from '../data/quizSets';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import PodcastReference from './PodcastReference.vue';
import { useProgressStore } from '../stores/progressStore';

// Add the tools icon to the library
library.add(faTools);

export default {
    name: 'InProgress',
    components: {
        PodcastReference
    },
    emits: ['change-view'],
    props: {
        selectedQuiz: {
            type: Number,
            required: false,
            default: null
        },
        quizSet: {
            type: Object,
            required: false,
            default: null
        }
    },
    data() {
        return {
            feedback: '',
            quizTitle: '',
            podcastEpisode: null,
            podcastEpisodes: null
        }
    },
    computed: {
        currentQuiz() {
            // If quizSet is provided directly, use it
            if (this.quizSet) {
                return this.quizSet;
            }
            // Otherwise, look up the quiz set by index
            else if (this.selectedQuiz !== null) {
                return quizSets[this.selectedQuiz];
            }
            // Fallback
            return null;
        }
    },
    created() {
        if (!this.currentQuiz) {
            console.error('No quiz data available - either selectedQuiz or quizSet must be provided');
            return;
        }

        console.log('Quiz Name:', this.currentQuiz?.setName);
        console.log('Full Quiz Data:', this.currentQuiz);
        this.quizTitle = this.currentQuiz?.setName || 'New';

        // Ensure we get the episodes array
        if (this.currentQuiz?.podcastEpisodes) {
            console.log('Found podcastEpisodes:', this.currentQuiz.podcastEpisodes);
            this.podcastEpisodes = [...this.currentQuiz.podcastEpisodes];
        } else if (this.currentQuiz?.podcastEpisode) {
            console.log('Found single podcastEpisode');
            this.podcastEpisode = this.currentQuiz.podcastEpisode;
        } else {
            console.log('No podcast data found');
        }

        console.log('Final podcastEpisodes:', this.podcastEpisodes);
        console.log('Is Array?:', Array.isArray(this.podcastEpisodes));

        const progressStore = useProgressStore();
    },
    methods: {
        async submitFeedback() {
            if (this.feedback.trim()) {
                try {
                    const progressStore = useProgressStore();
                    // Use selectedQuiz if available, otherwise try to find the index
                    const quizId = this.selectedQuiz !== null ?
                        this.selectedQuiz :
                        quizSets.findIndex(set => set.setName === this.currentQuiz?.setName);

                    if (quizId === -1) {
                        throw new Error('Could not determine quiz ID for feedback');
                    }

                    await progressStore.saveQuizProgress(quizId, {
                        inProgressFeedback: this.feedback,
                        timestamp: new Date()
                    });
                    this.feedback = '';
                    alert('Thank you for your feedback!');
                    this.$emit('change-view', { showQuizzes: true });
                } catch (error) {
                    console.error('Error saving feedback:', error);
                }
            }
        },
        returnToQuizzes() {
            this.$emit('change-view', { showQuizzes: true });
        }
    }
}
</script>

<style scoped>
.button-77 {
    align-items: center;
    background-image: linear-gradient(90deg, #4a7ff3 40%, #702afa);
    border: 0;
    border-radius: 10px;
    box-sizing: border-box;
    color: #fff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-family: "Codec cold", sans-serif;
    font-size: 16px;
    font-weight: 100;
    height: 30px;
    justify-content: center;
    letter-spacing: .4px;
    line-height: 1;
    max-width: fit-content;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 3px;
    margin-top: 10px;
    text-decoration: none;
    text-transform: uppercase;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
}

textarea {
    background: rgba(63, 63, 136, 0.15);
    border: 1px solid rgba(74, 144, 226, 0.3);
    color: #333;
    font-size: 1rem;
    line-height: 1.5;
    resize: vertical;
    transition: all 0.3s ease;
}

textarea:focus {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(74, 144, 226, 0.5);
    box-shadow: 0 0 20px rgba(74, 144, 226, 0.2);
    outline: none;
}

:root[class~="dark"] textarea {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
}

.construction-animation {
    animation: bounce 2s infinite;
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}

.return-button {
    @apply bg-stone-400 text-amber-400 rounded hover:bg-stone-500 transition-all text-sm sm:text-base inline-block text-center leading-tight py-2;
    width: auto !important;
    padding: 0.5rem !important;
    margin: 0 !important;
    line-height: 1 !important;
    font-size: 0.875rem !important;
}

@media (max-width: 640px) {
    .return-button {
        width: 60px !important;
        padding: 0.25rem 0.35rem !important;
        font-size: 1rem !important;
    }
}

.border-dashed {
    border-style: dashed !important;
}
</style>
