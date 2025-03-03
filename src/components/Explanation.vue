<template>
    <div class="explanation-wrapper">
        <!-- Display explanation content here -->
        <div :class="{ [`hidden`]: !reviewMode }"
            class="rounded-md explanation p-4 lg:mt-0 sm:mt-2 place-self-center lg:ml-10 lg:w-full lg:mr-20 text-gray-900 dark:text-white">
            <div class="content-wrapper">
                <div class="text-content justified">
                    <div v-if="quizItem.answer_type === 'sortable' && showFeedback" class="mt-4">
                        <p v-if="isCorrect" class="text-green-600">Correct! Well done!</p>
                        <p v-else class="text-red-600">Not quite right.</p>
                    </div>
                    <!-- Move all the text content here -->
                    <p class=" mb-4">{{ quizItem.explanation }}</p>
                    <p v-if="quizItem.explanation2" class="0">{{ quizItem.explanation2 }}</p>
                    <p v-if="quizItem.explanation3" class="0">{{ quizItem.explanation3 }}</p>
                    <p v-if="quizItem.ref1" class="mt-2 text-sm">{{ quizItem.ref1 }}</p>
                    <p v-if="quizItem.ref2" class="text-sm">{{ quizItem.ref2 }}</p>
                    <p v-if="quizItem.ref3" class="mb- text-sm">{{ quizItem.ref3 }}</p>

                    <!-- Modal button - only show if modal content exists -->
                    <div v-if="quizItem.modal && quizItem.modal.trim() !== '' && quizItem.modal !== 'Enter modal content here'"
                        class="mt-4">
                        <button @click="showModal = true" class="modal-button">
                            Learn More
                        </button>
                    </div>

                    <div v-if="quizItem.resources && quizItem.resources.length > 0 && quizItem.resources[0].title != ''"
                        class="resources-wrapper">
                        <Resource v-for="(resource, index) in quizItem.resources" :key="index" :resource="resource" />
                    </div>
                </div>

                <ExplainerVideo v-if="quizItem.videoId" :videoId="quizItem.videoId" :caption="quizItem.videoCaption"
                    :startTime="quizItem.videoStartTime" />
                <ExplainerImage v-if="quizItem.imageUrl" :imageUrl="quizItem.imageUrl"
                    :altText="quizItem.imageAltText" />
                <ExplainerImage v-else-if="quizItem.image" :imageUrl="quizItem.image"
                    :altText="quizItem.imageAltText" />
            </div>
            <PodcastReference
                v-if="quizItem.podcastEpisode && quizItem.podcastEpisode.title && quizItem.podcastEpisode.title !== 'Episode Title'"
                :podcastEpisode="quizItem.podcastEpisode" />
            <PodcastReference
                v-if="quizItem.podcastEpisode2 && quizItem.podcastEpisode2.title && quizItem.podcastEpisode2.title !== ''"
                :podcastEpisode="quizItem.podcastEpisode2" />
            <!-- New line for second podcast reference -->
            <div v-if="quizItem.citations && quizItem.citations.length > 0 && quizItem.citations[0].title != ''"
                class="citations-wrapper">
                <Citation v-for="(citation, index) in quizItem.citations" :key="index" :citation="citation" />
            </div>
            <Caution :message="quizItem.caution" />
        </div>

        <!-- Modal Dialog -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            @click.self="showModal = false">
            <div class="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl max-h-[90vh] overflow-y-auto">
                <button @click="showModal = false"
                    class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white text-xl"
                    aria-label="Close">
                    ×
                </button>
                <div class="modal-content prose dark:prose-invert max-w-none text-left" v-html="formattedModalContent">
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed } from 'vue';
import ExplainerVideo from './ExplainerVideo.vue'
import ExplainerImage from './ExplainerImage.vue'
import Citation from './Citation.vue'
import Caution from './Caution.vue'
import PodcastReference from './PodcastReference.vue'
import Resource from './Resource.vue'
export default {
    name: 'Explanation',
    components: {
        ExplainerVideo,
        ExplainerImage,
        Citation,
        Caution,
        PodcastReference,
        Resource
    },
    props: {
        quizItem: {
            type: Object,
            required: true
        },
        reviewMode: {
            type: Boolean,
            default: false
        },
        userAnswer: {
            type: [String, Array, Number],
            default: null
        }
    },
    setup(props) {
        console.log('Explanation setup, quizItem:', props.quizItem);
        const showFeedback = ref(false);
        const showModal = ref(false);

        const isCorrect = computed(() => {
            if (props.quizItem.answer_type === 'sortable') {
                return props.userAnswer.every((id, index) => id === props.quizItem.correctOrder[index]);
            }
            // ... handle other question types ...
        });

        // Format modal content to handle line breaks
        const formattedModalContent = computed(() => {
            if (!props.quizItem.modal) return '';

            // Process the content with Markdown-like formatting
            let content = props.quizItem.modal
                // Handle headings
                .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mb-4 text-left">$1</h1>')
                .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mb-3 mt-4 text-left">$1</h2>')
                .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mb-2 mt-3 text-left">$1</h3>')

                // Handle lists
                .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1 text-left">$1</li>')

                // Handle bold text
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

                // Handle paragraphs and line breaks
                .replace(/\n\n/g, '</p><p class="mb-4 text-left">')
                .replace(/\n/g, '<br>');

            // Wrap in paragraph tags if not already wrapped
            if (!content.startsWith('<h1') && !content.startsWith('<h2') && !content.startsWith('<h3')) {
                content = '<p class="mb-4 text-left">' + content;
            }

            // Close any unclosed paragraphs
            if (!content.endsWith('</p>') && !content.endsWith('</h1>') && !content.endsWith('</h2>') && !content.endsWith('</h3>')) {
                content += '</p>';
            }

            // Wrap lists in ul tags
            content = content.replace(/<li class="ml-4 mb-1 text-left">(.+?)<\/li>/g, function (match) {
                return '<ul class="list-disc ml-6 mb-4">' + match + '</ul>';
            });

            // Fix nested ul tags
            content = content.replace(/<\/ul><ul class="list-disc ml-6 mb-4">/g, '');

            return content;
        });

        // Function to be called when an answer is submitted
        const checkAnswer = () => {
            showFeedback.value = true;
        };

        return {
            showFeedback,
            showModal,
            isCorrect,
            checkAnswer,
            formattedModalContent
        };
    },
    mounted() {
        // Add event listener for escape key to close modal
        document.addEventListener('keydown', this.handleKeyDown);
    },
    beforeUnmount() {
        // Remove event listener
        document.removeEventListener('keydown', this.handleKeyDown);
    },
    methods: {
        handleKeyDown(e) {
            if (e.key === 'Escape' && this.showModal) {
                this.showModal = false;
            }
        }
    }
}
</script>

<style scoped>
-wrapper {
    /* Add your styles here */
    margin-top: .3 rem;
    padding: 1rem;
    border: 1px none #ccc;
    border-radius: 4px;
}

.explanation-wrapper {
    /* margin-top: 1rem; */
    padding: 1rem;
    border: 1px none #ccc;
    border-radius: 4px;
}

.content-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.text-content {
    flex: 0 0 66.666%;
    max-width: 66.666%;
    line-height: 1.4;
    /* Adjust this value to tighten the line height */
}

.justified {
    text-align: justify;
}

.explainer-video-wrapper,
.explainer-image-wrapper {
    flex: 0 0 33.333%;
    max-width: 33.333%;
    /* Ensure the video/image doesn't get too small */
    margin-top: .7rem;
}

.explanation {
    color: #333 !important;
}

@media (prefers-color-scheme: dark) {
    .explanation {
        color: #f7fafc !important;
    }
}

@media (max-width: 768px) {
    .content-wrapper {
        flex-direction: column;
    }

    .text-content,
    .explainer-video-wrapper,
    .explainer-image-wrapper,
    .citations-wrapper {
        flex: 0 0 100%;
        max-width: 100%;
        width: 100%;
        /* Add this line */
    }
}

.citations-wrapper {
    flex: 0 0 80%;
    max-width: 80%;
    margin-left: auto;
    /* Align to the right */
    margin-top: 1rem;
    margin-right: -1rem;
    padding-right: 0%;
}

/* Modal styles */
.modal-button {
    background-image: linear-gradient(90deg, #4a7ff3 40%, #702afa);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.modal-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

.modal-content {
    color: #333;
    text-align: left !important;
}

:root[class~="dark"] .modal-content {
    color: #f7fafc;
}

/* Add specific styling for modal content elements */
:deep(.modal-content h1),
:deep(.modal-content h2),
:deep(.modal-content h3),
:deep(.modal-content p),
:deep(.modal-content ul),
:deep(.modal-content ol) {
    text-align: left !important;
    margin-bottom: 1rem;
}

:deep(.modal-content ul),
:deep(.modal-content ol) {
    padding-left: 1.5rem;
}

:deep(.modal-content li) {
    margin-bottom: 0.5rem;
    text-align: left !important;
}

/* Ensure proper contrast */
.modal-content {
    background-color: white;
    color: #333 !important;
}

:root[class~="dark"] .modal-content {
    background-color: #1f2937;
    color: #f7fafc !important;
}

/* Animation for modal */
.fixed {
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
</style>