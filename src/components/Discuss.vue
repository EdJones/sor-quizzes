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
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl">
                <!-- Modal Header -->
                <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Discussions</h3>
                    <button @click="handleCloseDiscussion"
                        class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="flex h-[32rem]">
                    <!-- Quiz Sets List -->
                    <div class="w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                        <div class="p-4">
                            <div v-for="quizSet in quizSets" :key="quizSet.setName" @click="selectQuizSet(quizSet)"
                                class="mb-2 p-2 rounded-lg cursor-pointer transition-colors" :class="[
                                    selectedQuizSet?.setName === quizSet.setName
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                                ]">
                                <div class="font-medium">{{ quizSet.setName }}</div>
                                <div class="text-xs" :class="[
                                    selectedQuizSet?.setName === quizSet.setName
                                        ? 'text-white opacity-75'
                                        : 'text-gray-600 dark:text-gray-400'
                                ]">
                                    {{ quizSet.items.length }} items
                                    <span v-if="discussStore.unreadCount[quizSet.setName]"
                                        class="ml-2 px-1.5 py-0.5 bg-green-500 text-white rounded-full">
                                        {{ discussStore.unreadCount[quizSet.setName] }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div class="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                        <div v-if="!selectedQuizSet"
                            class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            Select a quiz set to view discussions
                        </div>
                        <template v-else>
                            <!-- Messages Container -->
                            <div class="flex-1 p-4 overflow-y-auto" ref="messagesContainer">
                                <div v-if="discussStore.isLoading[selectedQuizSet.setName]"
                                    class="flex justify-center items-center h-full">
                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                                <div v-else-if="discussStore.error" class="text-red-500 text-center">
                                    Error loading messages. Please try again.
                                </div>
                                <template v-else>
                                    <div v-for="message in discussStore.messages[selectedQuizSet.setName]"
                                        :key="message.id" class="mb-4"
                                        :class="{ 'ml-auto': message.userId === authStore.user?.uid }">
                                        <div class="flex items-start gap-2"
                                            :class="{ 'flex-row-reverse': message.userId === authStore.user?.uid }">
                                            <div
                                                class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-200">
                                                {{ message.userName.charAt(0).toUpperCase() }}
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
                            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <form @submit.prevent="handleSendMessage" class="flex gap-2">
                                    <input v-model="newMessage" type="text" placeholder="Type your message..."
                                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400">
                                    <button type="submit"
                                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        :disabled="!newMessage.trim() || isSending">
                                        {{ isSending ? 'Sending...' : 'Send' }}
                                    </button>
                                </form>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
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

        // Subscribe to messages for all quiz sets
        onMounted(() => {
            props.quizSets.forEach(quizSet => {
                discussStore.subscribeToMessages(quizSet.setName);
            });
        });

        // Cleanup on unmount
        onUnmounted(() => {
            discussStore.cleanup();
        });

        // Scroll to bottom when new messages arrive
        watch(() => selectedQuizSet.value && discussStore.messages[selectedQuizSet.value.setName], async () => {
            if (showDiscussion.value && selectedQuizSet.value) {
                await nextTick();
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
            }
        }, { deep: true });

        const selectQuizSet = (quizSet) => {
            selectedQuizSet.value = quizSet;
            discussStore.markAsRead(quizSet.setName);
        };

        const handleShowDiscussion = () => {
            showDiscussion.value = true;
            if (selectedQuizSet.value) {
                discussStore.markAsRead(selectedQuizSet.value.setName);
            }
        };

        const handleCloseDiscussion = () => {
            showDiscussion.value = false;
            if (selectedQuizSet.value) {
                discussStore.markAsRead(selectedQuizSet.value.setName);
            }
        };

        const handleSendMessage = async () => {
            if (!newMessage.value.trim() || isSending.value || !selectedQuizSet.value) return;

            isSending.value = true;
            try {
                await discussStore.sendMessage(selectedQuizSet.value.setName, newMessage.value);
                newMessage.value = '';
            } catch (error) {
                console.error('Failed to send message:', error);
                // Show error to user
                alert('Failed to send message. Please try again.');
            } finally {
                isSending.value = false;
            }
        };

        // Add error handling for subscription
        watch(() => selectedQuizSet.value, (newQuizSet) => {
            if (newQuizSet) {
                try {
                    discussStore.subscribeToMessages(newQuizSet.setName);
                } catch (error) {
                    console.error('Failed to subscribe to messages:', error);
                    alert('Failed to load messages. Please try refreshing the page.');
                }
            }
        }, { immediate: true });

        // Scroll to bottom when messages change or when opening modal
        watch([
            () => showDiscussion.value,
            () => selectedQuizSet.value && discussStore.messages[selectedQuizSet.value.setName]
        ], async () => {
            if (showDiscussion.value && selectedQuizSet.value) {
                await nextTick();
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
            }
        }, { deep: true });

        const formatTime = (timestamp) => {
            if (!timestamp) return '';
            return new Intl.DateTimeFormat('default', {
                hour: 'numeric',
                minute: 'numeric'
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