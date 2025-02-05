<template>
    <div>
        <div class="flex gap-3 mb-4">
            <button @click="selectedTemplate = 'feedback'" :class="['px-4 py-2 rounded-md',
                selectedTemplate === 'feedback'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200']">
                Content
            </button>
            <button @click="selectedTemplate = ''" :class="['px-4 py-2 rounded-md',
                !selectedTemplate
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200']">
                App Software
            </button>
        </div>

        <form @submit.prevent="submitIssue" class="mb-8 bg-gray-800 p-4 rounded-md">
            <div class="mb-4">
                <label for="template" class="block text-sm font-medium mb-2">Issue Type</label>
                <select v-if="!selectedTemplate" id="template" v-model="selectedTemplate" @change="applyTemplate"
                    class="w-48 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500">
                    <option value="">Choose a type...</option>
                    <optgroup label="Application Software Issues">
                        <option value="bug">Bug report</option>
                        <option value="feature">Feature request</option>
                        <option value="blank">Blank issue</option>
                    </optgroup>
                </select>
                <p class="mt-1 text-sm text-gray-400">
                    {{ templateDescriptions[selectedTemplate] || 'Select an issue type' }}</p>
            </div>
            <div class="mb-4">
                <label for="title" class="block text-sm font-medium mb-2">Title</label>
                <input type="text" id="title" v-model="issueData.title" required
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500"
                    placeholder="Issue title">
            </div>
            <div class="mb-4">
                <label for="body" class="block text-sm font-medium mb-2">Description</label>
                <textarea id="body" v-model="issueData.body" rows="8"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                    placeholder="Describe the issue"></textarea>
            </div>
            <div class="flex justify-end gap-3">
                <button type="button" @click="$emit('cancel')" class="px-4 py-2 text-gray-400 hover:text-white">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                    Create Issue
                </button>
            </div>
        </form>
    </div>
</template>

<script>
import { ref, watch } from 'vue'

const templateDescriptions = {
    'new-quiz': 'Start a new quiz item from scratch.',
    'improve': 'How can we make a quiz item better?',
    'feedback': 'Any sort of improvements to the content.',
    'bug': 'Something broken? Create a report to help us improve',
    'feature': 'Suggest an idea for this project',
    'blank': 'Create a new issue from scratch'
}

const templates = {
    'new-quiz': `### Quiz Item Details
* Topic/Subject:
* Difficulty Level:
* Target Age Group:

### Question
[Enter the quiz question here]

### Answer Options
1. 
2. 
3. 
4. 

### Correct Answer
[Specify the correct answer and explain why]

### Additional Notes
[Any additional context or educational value]`,

    'improve': `### Current Quiz Item
[Link or reference to the existing quiz item]

### Suggested Improvements
[Describe what could be improved]

### Why This Improvement?
[Explain the educational or engagement benefit]

### Additional Context
[Any other relevant information]`,

    'feedback': `### How can the content be improved?


### Context
* Quiz set:
* Quiz Item:
* Feature/Section

### Action Items
[Any specific actions needed based on this feedback]`,

    'bug': `### Description
A clear and concise description of the bug.

### Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### Expected Behavior
A clear description of what you expected to happen.

### Actual Behavior
A clear description of what actually happened.

### Additional Context
Add any other context about the problem here.`,

    'feature': `### Problem
What feature would you like to see added?

### Proposed Solution
A clear and concise description of what you want to happen.

### Alternative Solutions
A clear and concise description of any alternative solutions or features you've considered.

### Additional Context
Add any other context about the feature request here.`,

    'blank': ''
}

export default {
    name: 'NewIssueForm',
    emits: ['submit', 'cancel'],
    setup(props, { emit }) {
        const issueData = ref({
            title: '',
            body: ''
        })
        const selectedTemplate = ref('feedback')

        const applyTemplate = () => {
            if (selectedTemplate.value) {
                issueData.value.body = templates[selectedTemplate.value] || ''
            } else {
                issueData.value.body = ''
            }
        }

        applyTemplate()

        watch(selectedTemplate, (newValue) => {
            applyTemplate()
        })

        const submitIssue = () => {
            emit('submit', {
                ...issueData.value,
                labels: selectedTemplate.value ? [`type:${selectedTemplate.value}`] : []
            })
            issueData.value = { title: '', body: '' }
            selectedTemplate.value = 'feedback'
        }

        return {
            issueData,
            selectedTemplate,
            templateDescriptions,
            applyTemplate,
            submitIssue
        }
    }
}
</script>

<style scoped>
/* Add styling for the option groups */
optgroup {
    color: #E5E7EB;
    /* text-gray-200 */
    font-weight: 600;
}

option {
    color: white;
    font-weight: normal;
    padding: 8px;
}
</style>