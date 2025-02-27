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

        const isCorrect = computed(() => {
            if (props.quizItem.answer_type === 'sortable') {
                return props.userAnswer.every((id, index) => id === props.quizItem.correctOrder[index]);
            }
            // ... handle other question types ...
        });

        // Function to be called when an answer is submitted
        const checkAnswer = () => {
            showFeedback.value = true;
        };

        return {
            showFeedback,
            isCorrect,
            checkAnswer
        };
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
</style>