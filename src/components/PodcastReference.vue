<template>
    <div v-if="podcastEpisode" class="podcast-reference">
        <div class="podcast-header">
            <font-awesome-icon icon="podcast" class="podcast-icon" />
            <h4 class="podcast-title">{{ podcastEpisode.title }}</h4>
        </div>
        <div class="podcast-content">
            <audio v-if="podcastEpisode.audioUrl" ref="audio" :src="podcastEpisode.audioUrl" controls
                class="podcast-player"></audio>
            <p v-if="podcastEpisode.description" class="podcast-description">{{ podcastEpisode.description }}</p>
            <a :href="podcastEpisode.EpisodeUrl" target="_blank" rel="noopener noreferrer" class="podcast-link">
                <font-awesome-icon icon="external-link-alt" /> &nbsp; {{ podcastEpisode.audioUrl ? 'Episode Page' :
                'Listen to Episode' }}
            </a>

            <!-- Add Snipd section -->
            <div v-if="podcastEpisode.snipdUrl" class="snipd-section">
                <div class="snipd-header">
                </div>
                <div class="snipd-content">
                    <img :src="snipdLogo" alt="Snipd Logo" class="snipd-logo" />
                    <a :href="podcastEpisode.snipdUrl" target="_blank" rel="noopener noreferrer" class="snipd-link">
                        <font-awesome-icon icon="external-link-alt" /> &nbsp; {{ podcastEpisode.snipdTitle || 'View Snip' }}
                    </a>
                    <p v-if="podcastEpisode.snipdDescription" class="snipd-description">
                        {{ podcastEpisode.snipdDescription }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPodcast, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import snipdLogo from '../assets/snipd-logo.png'

library.add(faPodcast, faExternalLinkAlt)

export default {
    name: 'PodcastReference',
    components: {
        FontAwesomeIcon
    },
    data() {
        return {
            snipdLogo
        }
    },
    props: {
        podcastEpisode: {
            type: Object,
            default: () => ({
                title: '',
                EpisodeUrl: '',
                audioUrl: '',
                description: '',
                podcastStartTime: 0
            })
        }
    },
    mounted() {
        console.log('PodcastReference mounted, podcastEpisode:', this.podcastEpisode);
        if (this.podcastEpisode && this.podcastEpisode.podcastStartTime > 0) {
            this.$nextTick(() => {
                this.$refs.audio.currentTime = this.podcastEpisode.podcastStartTime;
            });
        }
    }
}
</script>

<style scoped>
.podcast-reference {
    width: 100%;
    max-width: 66.666%;
    margin-left: auto;
    margin-top: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-color: #ffffff;
}

.podcast-header {
    display: flex;
    align-items: center;
    padding: 0.7rem .5rem;
    background-color: #f0f4f8;
    /* Lighter background color */
    border-bottom: 1px solid #e2e8f0;
}

.podcast-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
    color: #4a5568;
}

.podcast-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    /* Less weight */
    color: #2d3748;
}

.podcast-content {
    padding: 1rem;
    padding-bottom: 0rem;
}

.podcast-player {
    width: 100%;
    margin-bottom: 1rem;
}

.podcast-description {
    font-size: 0.8rem;
    color: #4a5568;
    margin-bottom: .5rem;
    line-height: 1.5;
    text-align: left;
}

.podcast-link {
    display: inline-flex;
    align-items: center;
    color: #7f8386;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.7rem;
    transition: color 0.2s ease;
}

.podcast-link:hover {
    color: #2c5282;
    text-decoration: underline;
}

.podcast-link .fa-external-link-alt {
    margin-right: 0.5rem;
    font-size: 0.8rem;
}

.snipd-section {


}

.snipd-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
}

.snipd-logo {
    width: 24px;
    height: 24px;
    margin-right: 0.5rem;
}

.snipd-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 500;
    color: #2d3748;
}

.snipd-content {
    padding-left: .1rem;
}

.snipd-link {
    display: inline-flex;
    align-items: center;
    color: #7f8386;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.7rem;
    transition: color 0.2s ease;
    margin-bottom: 0.5rem;
}

.snipd-link:hover {
    color: #2c5282;
    text-decoration: underline;
}

.snipd-description {
    font-size: 0.8rem;
    color: #4a5568;
    line-height: 1.5;
    text-align: left;
    margin-top: 0.5rem;
}

@media (max-width: 768px) {
    .podcast-reference {
        max-width: 100%;
    }
    .snipd-content {
        padding-left: 1rem;
    }
}
</style>