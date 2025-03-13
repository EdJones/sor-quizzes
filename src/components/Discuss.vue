<template>
    <div class="discuss-container">
        <!-- Discussion Button -->
        <button @click="handleShowDiscussion"
            class="flex items-center gap-1 px-3 py-1 text-sm border-green-400 bg-gray-700 hover:bg-gray-600 text-green-400 rounded-lg transition-colors duration-200">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span class="hidden md:inline">Discuss</span>
            <span v-if="discussStore.totalUnreadCount > 0"
                class="ml-1 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
                {{ discussStore.totalUnreadCount }}
            </span>
        </button>

        <!-- Discussion Modal -->
        <div v-if="showDiscussion"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-4xl sm:w-full">
                <!-- Modal Header -->
                <div class="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Discussions</h3>
                    <button @click="handleCloseDiscussion"
                        class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="flex flex-col sm:flex-row h-[calc(70vh-4rem)] sm:h-[32rem]">
                    <!-- Quiz Sets List -->
                    <div
                        class="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 overflow-y-auto max-h-64 sm:max-h-full">
                        <div class="p-2 sm:p-4">
                            <!-- App Title and General Discussion in same row on mobile -->
                            <div class="flex items-center justify-between sm:block mb-2 sm:mb-3">
                                <h2 class="text-base sm:text-xl font-bold text-gray-900 dark:text-white">SorQuizzes</h2>
                                <div @click="selectQuizSet(null)"
                                    class="flex-shrink-0 px-2 py-1 sm:px-3 sm:py-2 rounded-lg cursor-pointer transition-colors"
                                    :class="[
                                        !selectedQuizSet
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    ]">
                                    <div class="text-sm sm:text-base font-medium">General</div>
                                    <div v-if="discussStore.unreadCount['_general']" class="text-xs">
                                        <span class="px-1.5 py-0.5 bg-green-500 text-white rounded-full">
                                            {{ discussStore.unreadCount['_general'] }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Compact divider on mobile -->
                            <div class="border-t border-gray-200 dark:border-gray-700 my-2 sm:my-4"></div>

                            <!-- Quiz Sets Section with compact spacing on mobile -->
                            <h3 class="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-3">Quiz
                                Sets</h3>
                            <div class="grid grid-cols-2 sm:grid-cols-1 gap-1 sm:gap-2">
                                <div v-for="quizSet in filteredQuizSets" :key="quizSet.setName"
                                    @click="selectQuizSet(quizSet)"
                                    class="p-1.5 sm:p-2 rounded-lg cursor-pointer transition-colors" :class="[
                                        selectedQuizSet?.setName === quizSet.setName
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    ]">
                                    <div class="text-sm sm:text-base font-medium truncate">{{ quizSet.setName }}</div>
                                    <div class="text-xs flex items-center justify-between" :class="[
                                        selectedQuizSet?.setName === quizSet.setName
                                            ? 'text-white opacity-75'
                                            : 'text-gray-600 dark:text-gray-400'
                                    ]">
                                        <span>{{ quizSet.items.length }} items</span>
                                        <span v-if="discussStore.unreadCount[quizSet.setName]"
                                            class="px-1.5 py-0.5 bg-green-500 text-white rounded-full">
                                            {{ discussStore.unreadCount[quizSet.setName] }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div class="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-h-0">
                        <!-- Messages Container -->
                        <div class="flex-1 p-3 sm:p-4 overflow-y-auto" ref="messagesContainer">
                            <div v-if="discussStore.isLoading[selectedQuizSet?.setName || '_general']"
                                class="flex justify-center items-center h-full">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                            <div v-else-if="discussStore.error" class="text-red-500 text-center">
                                Error loading messages. Please try again.
                            </div>
                            <template v-else>
                                <!-- Welcome message when no messages -->
                                <div v-if="!discussStore.messages[selectedQuizSet?.setName || '_general']?.length"
                                    class="text-center text-gray-500 dark:text-gray-400 mt-4">
                                    {{ selectedQuizSet ?
                                        `Start the discussion about ${selectedQuizSet.setName}` :
                                        'Welcome to General Discussion! Feel free to start a conversation.' }}
                                </div>
                                <!-- Messages -->
                                <div v-else
                                    v-for="message in discussStore.messages[selectedQuizSet?.setName || '_general']"
                                    :key="message.id" class="mb-4"
                                    :class="{ 'ml-auto': message.userId === authStore.user?.uid }">
                                    <div class="flex items-start gap-2"
                                        :class="{ 'flex-row-reverse': message.userId === authStore.user?.uid }">
                                        <div
                                            class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-200">
                                            {{ message.userName?.charAt(0).toUpperCase() }}
                                        </div>
                                        <div class="flex flex-col">
                                            <div class="flex items-center gap-2"
                                                :class="{ 'flex-row-reverse': message.userId === authStore.user?.uid }">
                                                <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                    {{ message.userName }}
                                                </span>
                                                <span class="text-xs text-gray-500 dark:text-gray-400">
                                                    {{ formatTime(message.timestamp) }}
                                                </span>
                                            </div>
                                            <div class="mt-1 p-3 rounded-lg" :class="[
                                                message.userId === authStore.user?.uid
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                            ]">
                                                {{ message.content }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <!-- Message Input -->
                        <div class="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                            <form @submit.prevent="handleSendMessage" class="flex gap-2">
                                <input v-model="newMessage" type="text" :placeholder="selectedQuizSet ?
                                    `Message about ${selectedQuizSet.setName}...` :
                                    'Type your message...'"
                                    class="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <button type="submit" :disabled="isSending || !newMessage.trim()"
                                    class="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base">
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useDiscussStore } from '../stores/discussStore';

export default {
    name: 'Discuss',
    props: {
        quizSets: {
            type: Array,
            required: true
        }
    },
    setup(props) {
        const showDiscussion = ref(false);
        const selectedQuizSet = ref(null);
        const newMessage = ref('');
        const isSending = ref(false);
        const messagesContainer = ref(null);
        const authStore = useAuthStore();
        const discussStore = useDiscussStore();
        const filteredQuizSets = computed(() => {
            return props.quizSets.filter(quizSet =>
                quizSet.setName.toLowerCase() !== 'test-expert' &&
                !quizSet.debug
            );
        });

        // Subscribe to messages for all quiz sets and general discussion
        onMounted(() => {
            // Subscribe to general discussion
            discussStore.subscribeToMessages('_general');

            // Subscribe to quiz set discussions
            filteredQuizSets.value.forEach(quizSet => {
                discussStore.subscribeToMessages(quizSet.setName);
            });
        });

        // Cleanup on unmount
        onUnmounted(() => {
            discussStore.cleanup();
        });

        // Scroll to bottom when new messages arrive
        watch([
            () => showDiscussion.value,
            () => selectedQuizSet.value,
            () => {
                const topicId = selectedQuizSet.value?.setName || 'general';
                return discussStore.messages[topicId];
            }
        ], async () => {
            if (showDiscussion.value) {
                await nextTick();
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
            }
        }, { deep: true });

        const selectQuizSet = (quizSet) => {
            selectedQuizSet.value = quizSet;
            const topicId = quizSet?.setName || '_general';
            discussStore.markAsRead(topicId);
        };

        const handleShowDiscussion = () => {
            showDiscussion.value = true;
            const topicId = selectedQuizSet.value?.setName || '_general';
            discussStore.markAsRead(topicId);
        };

        const handleCloseDiscussion = () => {
            showDiscussion.value = false;
            const topicId = selectedQuizSet.value?.setName || '_general';
            discussStore.markAsRead(topicId);
        };

        const handleSendMessage = async () => {
            if (!newMessage.value.trim() || isSending.value) return;

            isSending.value = true;
            const topicId = selectedQuizSet.value?.setName || '_general';

            try {
                await discussStore.sendMessage({
                    content: newMessage.value.trim(),
                    quizSetId: topicId,
                    userId: authStore.user.uid,
                    userName: authStore.user.displayName || 'Anonymous',
                    timestamp: new Date()
                });
                newMessage.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                isSending.value = false;
            }
        };

        const formatTime = (timestamp) => {
            if (!timestamp) return '';
            return new Intl.DateTimeFormat('default', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            }).format(timestamp);
        };

        return {
            showDiscussion,
            selectedQuizSet,
            newMessage,
            isSending,
            messagesContainer,
            authStore,
            discussStore,
            filteredQuizSets,
            selectQuizSet,
            handleShowDiscussion,
            handleCloseDiscussion,
            handleSendMessage,
            formatTime
        };
    }
};
</script>

<style scoped>
.discuss-container {
    position: relative;
}
</style>