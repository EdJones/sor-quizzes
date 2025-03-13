<template>
    <div class="p-4">
        <div class="flex justify-end gap-2 mb-4">

            <button @click="handleNewQuizItem" class="bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center
                       px-3 py-1 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="hidden md:inline">Create/Edit A Quiz Item</span>
                <span class="md:hidden">New Item</span>
            </button>
            <button @click="showCreateModal = true"
                class="flex items-center gap-1 px-3 py-1 text-sm border-green-400 bg-gray-700 hover:bg-gray-600 text-green-400 rounded-lg transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span class="hidden md:inline">Create New Quiz Set</span>
                <span class="md:hidden">New Set</span>
            </button>

            <button @click="router.push('/issues')"
                class="flex items-center gap-1 px-3 py-1 text-sm border-green-400 bg-gray-700 hover:bg-gray-600 text-green-400 rounded-lg transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="hidden md:inline">Issues</span>
            </button>

            <Discuss :quiz-sets="[...publishedQuizSets, ...betaQuizSets, ...proposedQuizSets]" />
        </div>
        <div> <span class="text-sm text-orange-300">Quiz Set editor is in fluid developent. Caveat emptor.</span></div>
        <!-- Quiz Sets Overview Visualization with Tree -->
        <QuizSetTree :publishedQuizSets="publishedQuizSets" :proposedQuizSets="proposedQuizSets"
            @select-quiz-set="handleSelectQuizSet" />

        <!-- Preview InProgress Component if a proposed quizset is selected -->
        <div v-if="selectedQuizSet && selectedQuizSet.inProgress" class="my-4">
            <InProgress :quizSet="selectedQuizSet" @close="selectedQuizSet = null" />
        </div>

        <!-- Tab Navigation -->
        <div class="border-b border-gray-700 mt-6">
            <nav class="flex justify-between items-center">
                <div class="flex space-x-1">
                    <button @click="currentTab = 'current'" :class="[
                        currentTab === 'current'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-gray-300',
                        'px-4 py-2 text-center border-b-2 font-medium text-sm transition-colors duration-200'
                    ]">
                        Current
                    </button>
                    <button @click="currentTab = 'beta'" :class="[
                        currentTab === 'beta'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-gray-300',
                        'px-4 py-2 text-center border-b-2 font-medium text-sm transition-colors duration-200'
                    ]">
                        Beta
                    </button>
                    <button @click="currentTab = 'proposed'" :class="[
                        currentTab === 'proposed'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-gray-400 hover:text-gray-300',
                        'px-4 py-2 text-center border-b-2 font-medium text-sm transition-colors duration-200'
                    ]">
                        Proposed
                    </button>
                </div>
            </nav>
        </div>

        <!-- Tab Content -->
        <div class="mt-6">
            <!-- Current Quiz Sets -->
            <div v-if="currentTab === 'current'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="quizSet in publishedQuizSets" :key="quizSet.setName"
                    class="bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-lg font-semibold text-white">
                            {{ quizSet.setName }}
                        </h3>
                        <span class="text-sm text-gray-400">
                            {{ quizSet.items.length }} items
                        </span>
                    </div>

                    <!-- Quiz Set Details -->
                    <div class="space-y-2">
                        <!-- Basic/Expert Mode -->
                        <div class="flex items-center text-sm">
                            <span class="text-gray-300">Mode:</span>
                            <span :class="[
                                'ml-2 px-2 py-1 rounded text-xs font-medium',
                                quizSet.basicMode
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-purple-900 text-purple-200'
                            ]">
                                {{ quizSet.basicMode ? 'Basic' : 'Expert' }}
                            </span>
                        </div>

                        <!-- Quiz Items List -->
                        <div class="mt-3 space-y-1">
                            <div class="flex justify-between items-center">
                                <h4 class="text-sm font-medium text-gray-700 text-left">Quiz
                                    Items:
                                </h4>
                                <button @click="toggleQuestions(quizSet.setName)"
                                    class="text-sm text-blue-500 hover:text-blue-600 flex items-center">
                                    <span class="mr-1">{{ expandedSets.has(quizSet.setName) ? 'Hide' : 'Show' }}
                                        Questions</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                        :class="{ 'transform rotate-180': expandedSets.has(quizSet.setName) }"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <ul class="text-sm text-gray-600 list-disc pl-5 text-left">
                                <li v-for="itemId in quizSet.items" :key="itemId" class="mb-2">
                                    <div class="truncate relative">
                                        <span class="cursor-pointer hover:text-blue-500"
                                            @click="handleEditClick(itemId)" @mouseenter="showQuizDetails(itemId)"
                                            @mouseleave="hideQuizDetails">
                                            {{ getQuizItemTitle(itemId) || 'Untitled Question' }}
                                        </span>
                                        <!-- Quiz Details Hover Modal -->
                                        <div v-show="hoveredQuizId === itemId"
                                            class="fixed z-[9999] ml-4 w-[600px] max-w-[90vw] bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6"
                                            style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                            <div class="space-y-4">
                                                <h4 class="font-medium text-white text-lg break-words">
                                                    {{ getQuizItemTitle(itemId) }}
                                                </h4>
                                                <div class="text-gray-300">
                                                    <p class="font-medium mb-2">Question:</p>
                                                    <p class="mb-4 whitespace-normal break-words">{{
                                                        getQuizItemQuestion(itemId) }}</p>
                                                    <p class="font-medium mb-2">Options:</p>
                                                    <ul class="space-y-2 ml-4">
                                                        <li v-for="(option, index) in getQuizItemOptions(itemId)"
                                                            :key="index"
                                                            class="whitespace-normal break-words flex items-center gap-1"
                                                            :class="{ 'text-green-600 font-medium': isCorrectAnswer(itemId, index + 1) }">
                                                            <svg v-if="isCorrectAnswer(itemId, index + 1)"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                class="h-4 w-4 text-green-600 flex-shrink-0"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2.5" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {{ index + 1 }}. {{ option }}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="expandedSets.has(quizSet.setName)"
                                        class="mt-1 pl-4 text-sm text-gray-400 italic">
                                        {{ getQuizItemQuestion(itemId) }}
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- Additional Resources -->
                        <div v-if="quizSet.podcastEpisodes || quizSet.resource" class="text-sm text-gray-400">
                            <div v-if="quizSet.podcastEpisodes" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Includes podcast episodes
                            </div>
                            <div v-if="quizSet.resource" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Additional resources
                            </div>
                        </div>

                        <!-- Edit Button -->
                        <div class="flex justify-end mt-4">
                            <button @click="handleQuizSetClick(quizSet)" :class="[
                                'px-3 py-1 text-sm rounded transition-colors duration-200 flex items-center text-white',
                                isUserOwnedDraft(quizSet) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                            ]">
                                <span>View Details</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Beta Quiz Sets -->
            <div v-else-if="currentTab === 'beta'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="quizSet in betaQuizSets" :key="quizSet.setName"
                    class="bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-lg font-semibold text-white">
                            {{ quizSet.setName }}
                        </h3>
                        <span class="text-sm text-gray-400">
                            {{ quizSet.items.length }} items
                        </span>
                    </div>

                    <!-- Quiz Set Details -->
                    <div class="space-y-2">
                        <!-- Basic/Expert Mode -->
                        <div class="flex items-center text-sm">
                            <span class="text-gray-300">Mode:</span>
                            <span :class="[
                                'ml-2 px-2 py-1 rounded text-xs font-medium',
                                quizSet.basicMode
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-purple-900 text-purple-200'
                            ]">
                                {{ quizSet.basicMode ? 'Basic' : 'Expert' }}
                            </span>
                        </div>

                        <!-- Beta Badge -->
                        <div class="flex items-center text-sm">
                            <span
                                class="bg-yellow-900 text-yellow-200 px-2 py-1 rounded text-xs font-medium">Beta</span>
                        </div>

                        <!-- Quiz Items List -->
                        <div class="mt-3 space-y-1">
                            <div class="flex justify-between items-center">
                                <h4 class="text-sm font-medium text-gray-300 text-left">Quiz Items:</h4>
                                <button @click="toggleQuestions(quizSet.setName)"
                                    class="text-sm text-blue-500 hover:text-blue-600 flex items-center">
                                    <span class="mr-1">{{ expandedSets.has(quizSet.setName) ? 'Hide' : 'Show' }}
                                        Questions</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                        :class="{ 'transform rotate-180': expandedSets.has(quizSet.setName) }"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <ul class="text-sm text-gray-400 list-disc pl-5 text-left">
                                <li v-for="itemId in quizSet.items" :key="itemId" class="mb-2">
                                    <div class="truncate relative">
                                        <span class="cursor-pointer hover:text-blue-500"
                                            @click="handleEditClick(itemId)" @mouseenter="showQuizDetails(itemId)"
                                            @mouseleave="hideQuizDetails">
                                            {{ getQuizItemTitle(itemId) || 'Untitled Question' }}
                                        </span>
                                    </div>
                                    <div v-if="expandedSets.has(quizSet.setName)"
                                        class="mt-1 pl-4 text-sm text-gray-400 italic">
                                        {{ getQuizItemQuestion(itemId) }}
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- Edit Button -->
                        <div class="flex justify-end mt-4">
                            <button @click="handleQuizSetClick(quizSet)" :class="[
                                'px-3 py-1 text-sm rounded transition-colors duration-200 flex items-center text-white',
                                isUserOwnedDraft(quizSet) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                            ]">
                                <span>View Details</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proposed Quiz Sets -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="quizSet in proposedQuizSets" :key="quizSet.setName"
                    class="bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-lg font-semibold text-white">
                            {{ quizSet.setName }}
                        </h3>
                        <span class="text-sm text-gray-400">
                            {{ quizSet.items.length }} items
                        </span>
                    </div>

                    <!-- Quiz Set Details -->
                    <div class="space-y-2">
                        <!-- Basic/Expert Mode -->
                        <div class="flex items-center text-sm">
                            <span class="text-gray-300">Mode:</span>
                            <span :class="[
                                'ml-2 px-2 py-1 rounded text-xs font-medium',
                                quizSet.basicMode
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-purple-900 text-purple-200'
                            ]">
                                {{ quizSet.basicMode ? 'Basic' : 'Expert' }}
                            </span>
                        </div>

                        <!-- In Progress Text -->
                        <div v-if="quizSet.inProgressText" class="text-sm text-amber-600 italic mt-2">
                            {{ quizSet.inProgressText }}
                        </div>

                        <!-- Quiz Items List -->
                        <div class="mt-3 space-y-1">
                            <div class="flex justify-between items-center">
                                <h4 class="text-sm font-medium text-gray-700 text-left">Quiz
                                    Items:
                                </h4>
                                <button @click="toggleQuestions(quizSet.setName)"
                                    class="text-sm text-blue-500 hover:text-blue-600 flex items-center">
                                    <span class="mr-1">{{ expandedSets.has(quizSet.setName) ? 'Hide' : 'Show' }}
                                        Questions</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                        :class="{ 'transform rotate-180': expandedSets.has(quizSet.setName) }"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                            <ul class="text-sm text-gray-600 list-disc pl-5 text-left">
                                <li v-for="itemId in quizSet.items" :key="itemId" class="mb-2">
                                    <div class="truncate relative">
                                        <span class="cursor-pointer hover:text-blue-500"
                                            @click="handleEditClick(itemId)" @mouseenter="showQuizDetails(itemId)"
                                            @mouseleave="hideQuizDetails">
                                            {{ getQuizItemTitle(itemId) || 'Untitled Question' }}
                                        </span>
                                        <!-- Quiz Details Hover Modal -->
                                        <div v-show="hoveredQuizId === itemId"
                                            class="fixed z-[9999] ml-4 w-[600px] max-w-[90vw] bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6"
                                            style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                                            <div class="space-y-4">
                                                <h4 class="font-medium text-white text-lg break-words">
                                                    {{ getQuizItemTitle(itemId) }}
                                                </h4>
                                                <div class="text-gray-300">
                                                    <p class="font-medium mb-2">Question:</p>
                                                    <p class="mb-4 whitespace-normal break-words">{{
                                                        getQuizItemQuestion(itemId) }}</p>
                                                    <p class="font-medium mb-2">Options:</p>
                                                    <ul class="space-y-2 ml-4">
                                                        <li v-for="(option, index) in getQuizItemOptions(itemId)"
                                                            :key="index"
                                                            class="whitespace-normal break-words flex items-center gap-1"
                                                            :class="{ 'text-green-600 font-medium': isCorrectAnswer(itemId, index + 1) }">
                                                            <svg v-if="isCorrectAnswer(itemId, index + 1)"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                class="h-4 w-4 text-green-600 flex-shrink-0"
                                                                viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2.5" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {{ index + 1 }}. {{ option }}
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="expandedSets.has(quizSet.setName)"
                                        class="mt-1 pl-4 text-sm text-gray-400 italic">
                                        {{ getQuizItemQuestion(itemId) }}
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <!-- Additional Resources -->
                        <div v-if="quizSet.podcastEpisodes || quizSet.resource" class="text-sm text-gray-400">
                            <div v-if="quizSet.podcastEpisodes" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Includes podcast episodes
                            </div>
                            <div v-if="quizSet.resource" class="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Additional resources
                            </div>
                        </div>

                        <!-- Edit Button -->
                        <div class="flex justify-end mt-4">
                            <button @click="handleQuizSetClick(quizSet)" :class="[
                                'px-3 py-1 text-sm rounded transition-colors duration-200 flex items-center text-white',
                                isUserOwnedDraft(quizSet) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
                            ]">
                                <span>View Details</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none"
                                    viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Quiz Set Modal -->
        <div v-if="showCreateModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-xl font-bold text-white">Create New Quiz Set</h2>
                    <button @click="showCreateModal = false" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="createQuizSet" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Quiz Set Name
                        </label>
                        <input v-model="newQuizSet.setName" type="text" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Mode
                        </label>
                        <select v-model="newQuizSet.basicMode"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option :value="true">Basic</option>
                            <option :value="false">Expert</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Scope
                        </label>
                        <textarea v-model="newQuizSet.inProgressText" rows="2"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe the scope of this quiz set..."></textarea>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" @click="showCreateModal = false"
                            class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                            Cancel
                        </button>
                        <button type="submit"
                            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200">
                            Create Quiz Set
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="selectedQuizSet"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto"
        @click="selectedQuizSet = null">
        <div class="relative my-8 bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-auto" @click.stop>
            <div class="modal-header flex justify-between items-center mb-4 sticky top-0 bg-gray-800 z-10">
                <h3 class="text-xl font-bold text-white">{{ selectedQuizSet.setName }}</h3>
                <button @click="selectedQuizSet = null" class="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="modal-body overflow-y-auto">
                <InProgress v-if="selectedQuizSet && selectedQuizSet.inProgress" :quizSet="selectedQuizSet"
                    @close="selectedQuizSet = null" />
                <div v-else class="space-y-6">
                    <div v-for="itemId in selectedQuizSet.items" :key="itemId" class="quiz-item-container">
                        <QuizItem :currentQuizItem="getQuizItem(itemId)" :itemNum="0" :reviewMode="false"
                            :basicMode="selectedQuizSet.basicMode" :debug="false" :userAnswer="null" />
                        <div class="edit-button-container">
                            <button @click="handleEditClick(itemId)" :class="[
                                'edit-button px-3 py-1 text-sm rounded transition-colors duration-200 flex items-center text-white',
                                'bg-blue-500 hover:bg-blue-600'
                            ]">
                                Edit Quiz Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { quizSets } from '../data/quizSets';
import { quizEntries } from '../data/quiz-items';
import { useRouter } from 'vue-router';
import { db } from '../firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import QuizSetTree from '../components/QuizSetTree.vue';
import InProgress from '../components/InProgress.vue'; // Import the InProgress component
import { useAuth } from '../composables/useAuth';
import QuizItem from '../components/QuizItem.vue';
import { quizStore } from '../stores/quizStore';
import Discuss from '../components/Discuss.vue';

const router = useRouter();
const currentTab = ref('current');
const expandedSets = ref(new Set());
const showCreateModal = ref(false);
const hoveredQuizId = ref(null);

// New quiz set form data
const newQuizSet = reactive({
    setName: '',
    basicMode: true,
    inProgress: true,
    inProgressText: '',
    items: []
});

// Filtered quiz sets
const publishedQuizSets = quizSets.filter(set => !set.inProgress && !set.beta);
const betaQuizSets = quizSets.filter(set => !set.inProgress && set.beta);
const proposedQuizSets = quizSets.filter(set => set.inProgress);

// Use a ref to track the selected quiz set (for previewing the InProgress component)
const selectedQuizSet = ref(null);

// Add auth setup in script setup section after other const declarations
const auth = useAuth();

// Event handler for when a quiz set is selected from the QuizSetTree (via click)
const handleSelectQuizSet = (quizSet) => {
    selectedQuizSet.value = quizSet;
    // Optionally, switch to the 'proposed' tab if the quiz set is in progress
    currentTab.value = quizSet.inProgress ? 'proposed' : 'current';
};

// Create new quiz set
const createQuizSet = async () => {
    try {
        const quizSetRef = doc(db, 'quizSets', newQuizSet.setName.toLowerCase().replace(/\s+/g, '-'));
        await setDoc(quizSetRef, {
            setName: newQuizSet.setName,
            basicMode: newQuizSet.basicMode,
            inProgress: newQuizSet.inProgress,
            inProgressText: newQuizSet.inProgressText,
            items: [],
            createdAt: new Date().toISOString()
        });

        quizSets.push({
            setName: newQuizSet.setName,
            basicMode: newQuizSet.basicMode,
            inProgress: newQuizSet.inProgress,
            inProgressText: newQuizSet.inProgressText,
            items: []
        });

        Object.assign(newQuizSet, {
            setName: '',
            basicMode: true,
            inProgress: true,
            inProgressText: '',
            items: []
        });
        showCreateModal.value = false;
        currentTab.value = newQuizSet.inProgress ? 'proposed' : 'current';
    } catch (error) {
        console.error('Error creating quiz set:', error);
        alert('Failed to create quiz set. Please try again.');
    }
};

// Function to get quiz item title by ID
const getQuizItemTitle = (id) => {
    const quizItem = quizEntries.find(item => item.id === id);
    return quizItem?.title || `Question ${id}`;
};

// Function to get quiz item question by ID
const getQuizItemQuestion = (id) => {
    const quizItem = quizEntries.find(item => item.id === id);
    return quizItem?.Question || 'No question available';
};

// Function to toggle questions visibility for a quiz set
const toggleQuestions = (setName) => {
    const newExpandedSets = new Set(expandedSets.value);
    if (newExpandedSets.has(setName)) {
        newExpandedSets.delete(setName);
    } else {
        newExpandedSets.add(setName);
    }
    expandedSets.value = newExpandedSets;
};

// handle new quiz item
const handleNewQuizItem = () => {
    quizStore().resetDraftQuizEntry();
    router.push({
        path: '/edit-item/new',
        query: { new: 'true' }
    });
};

// Update handleEditClick function
const handleEditClick = async (quizSetOrItemId) => {
    // If the argument is a string, it's a quiz item ID
    if (typeof quizSetOrItemId === 'string' || typeof quizSetOrItemId === 'number') {
        router.push(`/edit-item/${quizSetOrItemId}`);
        return;
    }

    // Otherwise, it's a quiz set
    const quizSet = quizSetOrItemId;
    if (isUserOwnedDraft(quizSet)) {
        // Navigate directly to edit the draft
        router.push(`/edit-item/${quizSet.id}`);
    } else {
        try {
            // Create a copy of the quiz set for proposing changes
            const quizSetCopy = {
                setName: quizSet.setName,
                basicMode: quizSet.basicMode,
                items: [...quizSet.items],
                podcastEpisodes: quizSet.podcastEpisodes || [],
                resource: quizSet.resource || null,
                originalId: quizSet.id || quizSet.setName,
                isDraft: true,
                inProgress: true,
                createdBy: auth.user?.uid || 'anonymous',
                createdAt: new Date().toISOString(),
                status: 'proposed'
            };

            // Save to Firebase
            const docRef = await addDoc(collection(db, 'quizSets'), quizSetCopy);

            // Navigate to edit the new copy
            router.push(`/edit-item/${docRef.id}`);
        } catch (error) {
            console.error('Error creating proposal:', error);
            alert('Failed to create proposal. Please try again.');
        }
    }
};

// Function to check if a quiz set is user-owned and in draft status
const isUserOwnedDraft = (quizSet) => {
    return quizSet.isDraft && quizSet.createdBy === auth.user?.uid;
};

// Function to get edit button label
const getEditButtonLabel = (quizSet) => {
    if (isUserOwnedDraft(quizSet)) {
        return 'Edit';
    }
    return 'Propose Changes';
};

// Function to show quiz details
const showQuizDetails = (id) => {
    console.log('Showing quiz details for id:', id);
    hoveredQuizId.value = id;
};

// Function to hide quiz details
const hideQuizDetails = () => {
    console.log('Hiding quiz details, current id:', hoveredQuizId.value);
    hoveredQuizId.value = null;
};

// Function to get quiz item options
const getQuizItemOptions = (id) => {
    const quizItem = quizEntries.find(item => item.id === id);
    if (!quizItem) return [];
    return [
        quizItem.option1,
        quizItem.option2,
        quizItem.option3,
        quizItem.option4,
        quizItem.option5,
        quizItem.option6
    ].filter(option => option);
};

// Function to check if an option is the correct answer
const isCorrectAnswer = (id, optionNumber) => {
    const quizItem = quizEntries.find(item => item.id === id);
    return quizItem?.correctAnswer === optionNumber;
};

// Update the click handler for quiz sets to show modal instead of direct edit
const handleQuizSetClick = (quizSet) => {
    selectedQuizSet.value = quizSet;
};

// Add getQuizItem function
const getQuizItem = (id) => {
    return quizEntries.find(item => item.id === id);
};

const userPublishedItems = computed(() => {
    return quizEntries.filter(item =>
        item.userEmail === auth.user?.email
    );
});

// When displaying items, we can mark them as published
const getItemStatus = (item) => {
    if (quizEntries.some(qi =>
        qi.userEmail === auth.user?.email &&
        qi.title === item.title
    )) {
        return 'published';
    }
    return item.status || 'draft';
};
</script>

<style scoped>
/* Add these styles at the bottom of the file */
.group:hover {
    z-index: 50;
}

/* Ensure modal content is above other elements */
.absolute {
    isolation: isolate;
}

.fixed {
    position: fixed !important;
}

[class*="z-9999"] {
    z-index: 9999 !important;
}

.modal-body {
    max-height: calc(90vh - 100px);
    /* Subtract header height and padding */
    overflow-y: auto;
}

.quiz-item-container {
    position: relative;
    padding-bottom: 3rem;
    border-bottom: 1px solid rgba(156, 163, 175, 0.2);
    background-color: white;
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
}

.quiz-item-container:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.edit-button-container {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
}

.edit-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

@media (prefers-color-scheme: dark) {
    .quiz-item-container {
        background-color: rgb(31, 41, 55);
    }
}
</style>