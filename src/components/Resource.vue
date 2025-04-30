<template>
    <div class="resource">
        <div class="resource-content">
            <font-awesome-icon :icon="['fas', 'book']" class="resource-icon" />
            <div class="resource-text-container">
                <p v-if="resource.text" class="resource-description">
                    {{ resource.text }}
                </p>
                <p class="resource-text">
                    {{ resource.title }}, {{ resource.author }}, {{ resource.year }},
                    <a :href="resource.url" target="_blank" class="resource-link" :title="resource.url">
                        {{ truncatedUrl }}
                    </a>
                </p>
                <p class="resource-text">
                    {{ resource.description }}
                </p>
            </div>
        </div>
        <div v-if="resource.imageUrl" class="resource-image-wrapper">
            <img :src="resource.imageUrl" :alt="resource.imageAltText" class="resource-image" />
        </div>
    </div>
</template>

<script>
export default {
    name: 'Resource',
    props: {
        resource: {
            type: Object,
            required: true
        }
    },
    computed: {
        truncatedUrl() {
            if (this.resource.url.length <= 55) {
                return this.resource.url;
            }
            return this.resource.url.substring(0, 52) + '...';
        }
    }
}
</script>

<style scoped>
.resource {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    border: 1px solid rgba(180, 185, 190, 0.3);
    border-radius: 12px;
    padding: 1.25rem;
    margin: 1rem 0;
    background: rgba(100, 110, 120, 0.08);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.resource:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    border-color: rgba(180, 185, 190, 0.5);
}

.resource-content {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: flex-start;
}

.resource-icon {
    flex-shrink: 0;
    margin-right: 0.75rem;
    font-size: 1.25rem;
    color: #4a5568;
    opacity: 0.8;
}

.resource-text-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.resource-description {
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0;
    color: #4a5568;
}

.resource-text {
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    color: #4a5568;
}

.resource-link {
    color: #3182ce;
    text-decoration: none;
    word-break: break-all;
    transition: color 0.2s ease;
}

.resource-link:hover {
    color: #2c5282;
    text-decoration: underline;
}

.resource-image-wrapper {
    flex-shrink: 0;
    width: 100px;
}

.resource-image {
    width: 100%;
    height: auto;
    object-fit: cover;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
    .resource {
        flex-direction: row;
        padding: 1rem;
    }

    .resource-icon {
        font-size: 1rem;
    }

    .resource-text {
        font-size: 0.75rem;
    }

    .resource-image-wrapper {
        width: 80px;
    }

    .resource-description {
        font-size: 0.875rem;
    }
}

:root[class~="dark"] .resource {
    background: rgba(30, 35, 40, 0.5);
    border-color: rgba(255, 255, 255, 0.1);
}

:root[class~="dark"] .resource-text {
    color: rgba(255, 255, 255, 0.9);
}

:root[class~="dark"] .resource-icon {
    color: rgba(255, 255, 255, 0.8);
}

:root[class~="dark"] .resource-link {
    color: #63b3ed;
}

:root[class~="dark"] .resource-link:hover {
    color: #90cdf4;
}

:root[class~="dark"] .resource-description {
    color: rgba(255, 255, 255, 0.9);
}
</style>
