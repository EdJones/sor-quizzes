<template>
    <div class="github-issues bg-gray-900 text-white">
        <div class="p-4 header-section">
            <h2 class="text-2xl mb-6 flex items-center gap-3">
                <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path
                        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Quiz Issues
            </h2>
            <div class="issue-filters">
                <button v-for="filter in filters" :key="filter.state" @click="changeFilter(filter.state)"
                    :class="['filter-btn', { active: currentFilter === filter.state }]">
                    <span class="issue-icon" v-if="filter.state !== 'all'">
                        <svg class="octicon" viewBox="0 0 16 16" width="16" height="16"
                            :style="{ color: filter.state === 'open' ? '#238636' : '#8957e5' }">
                            <path v-if="filter.state === 'open'" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z">
                            </path>
                            <path v-if="filter.state === 'open'"
                                d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z">
                            </path>
                            <path v-if="filter.state === 'closed'"
                                d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z">
                            </path>
                            <path v-if="filter.state === 'closed'"
                                d="M11.78 4.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.72 6.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6.5 7.44l3.72-3.72a.75.75 0 0 1 1.06 0Z">
                            </path>
                        </svg>
                    </span>
                    <font-awesome-icon v-else icon="list" class="mr-2 text-gray-400" />
                    {{ filter.label }}
                    <span class="count" v-if="filter.count !== undefined">({{ filter.count }})</span>
                </button>
            </div>

            <button @click="showNewIssueForm = !showNewIssueForm"
                class="mb-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Issue
            </button>

            <NewIssueForm v-if="showNewIssueForm" @submit="createIssue" @cancel="showNewIssueForm = false" />
        </div>

        <div v-if="store.githubIssuesLoading" class="loading text-gray-400">
            Loading issues...
        </div>

        <div v-else-if="store.githubIssuesError" class="error">
            {{ store.githubIssuesError }}
        </div>

        <div v-else class="issues-list">
            <a v-for="issue in store.githubIssues" :key="issue.number" :href="issue.html_url" target="_blank"
                rel="noopener noreferrer" class="issue-item block hover:bg-gray-800 border-b border-gray-700">
                <div class="issue-content">
                    <div class="issue-header">
                        <h3 class="issue-title flex items-center gap-2">
                            <span class="issue-icon">
                                <svg class="octicon" viewBox="0 0 16 16" width="16" height="16"
                                    :style="{ color: issue.state === 'open' ? '#238636' : '#8957e5' }">
                                    <path v-if="issue.state === 'open'" d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z">
                                    </path>
                                    <path v-if="issue.state === 'open'"
                                        d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z">
                                    </path>
                                    <path v-if="issue.state === 'closed'"
                                        d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z">
                                    </path>
                                    <path v-if="issue.state === 'closed'"
                                        d="M11.78 4.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.72 6.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6.5 7.44l3.72-3.72a.75.75 0 0 1 1.06 0Z">
                                    </path>
                                </svg>
                            </span>
                            <span>{{ issue.title }}</span>
                        </h3>
                        <div class="flex items-center gap-2 text-sm pl-7">
                            <span class="text-gray-400">
                                #{{ issue.number }} {{ issue.state === 'open' ? 'opened' : 'closed' }}
                                {{ formatDate(issue.created_at) }} by {{ issue.user.login }}
                            </span>
                            <div v-if="issue.labels.length" class="flex gap-1">
                                <span v-for="label in issue.labels" :key="label.id"
                                    class="px-2 py-0.5 rounded-full text-xs"
                                    :style="{ backgroundColor: `#${label.color}` }">
                                    {{ label.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div v-if="issue.body" class="mt-4 text-gray-400 text-sm leading-6 pl-7">
                        <div :class="{ 'line-clamp-3': !expandedIssues[issue.number] }">
                            <div class="whitespace-pre-wrap">{{ issue.body }}</div>
                        </div>
                        <button v-if="issue.body.split('\n').length > 3" @click.stop.prevent="toggleIssue(issue.number)"
                            class="text-gray-500 hover:text-gray-400 text-xs mt-1">
                            {{ expandedIssues[issue.number] ? 'Show less' : 'Show more' }}
                        </button>
                    </div>
                </div>
            </a>
        </div>
    </div>
</template>

<script>
import { onMounted, ref, computed, watch } from 'vue';
import { quizStore } from '../stores/quizStore';
import { library } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { faList } from '@fortawesome/free-solid-svg-icons';
import NewIssueForm from './NewIssueForm.vue';

// Add icons to library
library.add(faList);

export default {
    name: 'GitHubIssues',
    components: {
        NewIssueForm
    },
    setup() {
        const store = quizStore();
        const currentFilter = ref('all');
        const expandedIssues = ref({});
        const showNewIssueForm = ref(false);

        const filters = computed(() => [
            {
                state: 'open',
                label: 'Open',
                icon: ['far', 'dot-circle'],
                count: store.allGithubIssues.filter(i => i.state === 'open').length
            },
            {
                state: 'closed',
                label: 'Closed',
                count: store.allGithubIssues.filter(i => i.state === 'closed').length
            },
            {
                state: 'all',
                label: 'All',
                count: store.allGithubIssues.length
            }
        ]);

        const changeFilter = async (filter) => {
            currentFilter.value = filter;
            await store.fetchGitHubIssues(filter);
        };

        onMounted(async () => {
            await store.fetchGitHubIssues('all');
        });

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString();
        };

        const toggleIssue = (issueNumber) => {
            expandedIssues.value[issueNumber] = !expandedIssues.value[issueNumber];
        };

        const createIssue = async (issueData) => {
            try {
                console.log('Creating issue:', issueData);
                const createdIssue = await store.createGitHubIssue(issueData);
                console.log('Issue created successfully:', createdIssue.number);
                showNewIssueForm.value = false;

                // Force UI update
                currentFilter.value = 'all';
                console.log('Refreshing display...');

                // Add a small delay to ensure GitHub API has propagated the change
                await new Promise(resolve => setTimeout(resolve, 1000));
                await store.fetchGitHubIssues('all');

                console.log('Display refreshed');
            } catch (error) {
                console.error('Failed to create issue:', error);
            }
        };

        // Watch for changes in the issues list
        watch(() => store.githubIssues, (newIssues, oldIssues) => {
            console.log('Issues updated:', {
                oldCount: oldIssues?.length,
                newCount: newIssues?.length,
                newIssueNumbers: newIssues.map(i => i.number)
            });
        }, { deep: true });

        return {
            store,
            formatDate,
            filters,
            currentFilter,
            changeFilter,
            expandedIssues,
            toggleIssue,
            showNewIssueForm,
            createIssue
        };
    }
}
</script>

<style scoped>
.github-issues {
    padding: 0;
    max-width: 1200px;
    margin: 0 auto;
    text-align: left;
}

.loading,
.error {
    text-align: center;
    padding: 2rem;
}

.error {
    color: #dc2626;
}

.issues-list {
    border: none;
    border-radius: 0;
    text-align: left;
}

.issue-item {
    display: block;
    padding: 1rem;
    transition: background-color 0.2s;
}

.issue-item:last-child {
    border-bottom: none;
}

.issue-content {
    flex: 1;
    min-width: 0;
}

.issue-header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.25rem;
}

.issue-title {
    font-weight: normal;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
}

.issue-meta {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
}

.issue-labels {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.issue-label {
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: normal;
}

.header-section {
    margin-bottom: 2rem;
}

.issue-filters {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.filter-btn {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s;
}

.filter-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}

.filter-btn.active {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.count {
    margin-left: 0.5rem;
    opacity: 0.7;
}

svg {
    color: rgba(255, 255, 255, 0.9);
}

.issue-icon {
    display: inline-flex;
    margin-right: 0.5rem;
}

.issue-icon svg {
    fill: currentColor;
}

.issue-icon.open {
    color: #238636;
    /* green for open */
}

.issue-icon.closed {
    color: #8957e5;
    /* purple for closed */
}

.issue-body {
    margin-top: 1rem;
    padding: 1rem;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 0.5rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
}

.issue-body :deep(p) {
    margin-bottom: 1rem;
}

.issue-body :deep(a) {
    color: #58a6ff;
    text-decoration: none;
}

.issue-body :deep(a:hover) {
    text-decoration: underline;
}

.issue-body :deep(pre) {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1rem 0;
}

.issue-body :deep(code) {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
}

.issue-body :deep(ul),
.issue-body :deep(ol) {
    margin: 1rem 0;
    padding-left: 2rem;
}

.issue-body :deep(li) {
    margin: 0.5rem 0;
}

.issue-body :deep(blockquote) {
    border-left: 4px solid rgba(255, 255, 255, 0.2);
    padding-left: 1rem;
    margin: 1rem 0;
    color: rgba(255, 255, 255, 0.6);
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>