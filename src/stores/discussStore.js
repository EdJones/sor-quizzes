import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { useAuthStore } from './authStore';

export const useDiscussStore = defineStore('discuss', () => {
    const messages = ref({});  // Map of quizSetId to messages
    const unreadCount = ref({});  // Map of quizSetId to unread count
    const lastReadTimestamp = ref({});  // Map of quizSetId to last read timestamp
    const isLoading = ref({});
    const error = ref(null);
    const unsubscribe = ref({});  // Map of quizSetId to unsubscribe function

    const authStore = useAuthStore();

    // Get current user's display name
    const getUserDisplayName = () => {
        if (!authStore.user) return 'Anonymous';
        if (authStore.user.displayName) return authStore.user.displayName;
        return authStore.user.email ? authStore.user.email.split('@')[0] : 'Anonymous';
    };

    // Subscribe to messages for a specific quiz set
    const subscribeToMessages = (quizSetId) => {
        if (unsubscribe.value[quizSetId]) {
            unsubscribe.value[quizSetId]();
        }

        isLoading.value[quizSetId] = true;
        messages.value[quizSetId] = [];

        const messagesQuery = query(
            collection(db, 'discussions'),
            where('quizSetId', '==', quizSetId),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        unsubscribe.value[quizSetId] = onSnapshot(messagesQuery,
            (snapshot) => {
                const newMessages = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    newMessages.unshift({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate() || new Date()
                    });
                });
                messages.value[quizSetId] = newMessages;
                updateUnreadCount(quizSetId);
                isLoading.value[quizSetId] = false;
            },
            (err) => {
                console.error('Error subscribing to messages:', err);
                error.value = err;
                isLoading.value[quizSetId] = false;
            }
        );
    };

    // Send a new message
    const sendMessage = async (quizSetId, content) => {
        if (!content.trim()) return;

        try {
            const messageData = {
                content: content.trim(),
                userId: authStore.user?.uid || 'anonymous',
                userName: getUserDisplayName(),
                timestamp: serverTimestamp(),
                userEmail: authStore.user?.email || null,
                quizSetId
            };

            await addDoc(collection(db, 'discussions'), messageData);
        } catch (err) {
            console.error('Error sending message:', err);
            error.value = err;
        }
    };

    // Update unread count for a specific quiz set
    const updateUnreadCount = (quizSetId) => {
        if (!lastReadTimestamp.value[quizSetId]) {
            unreadCount.value[quizSetId] = messages.value[quizSetId]?.length || 0;
            return;
        }

        unreadCount.value[quizSetId] = (messages.value[quizSetId] || []).filter(
            msg => msg.timestamp > lastReadTimestamp.value[quizSetId] && msg.userId !== authStore.user?.uid
        ).length;
    };

    // Mark messages as read for a specific quiz set
    const markAsRead = (quizSetId) => {
        lastReadTimestamp.value[quizSetId] = new Date();
        unreadCount.value[quizSetId] = 0;
    };

    // Get total unread count across all quiz sets
    const totalUnreadCount = computed(() => {
        return Object.values(unreadCount.value).reduce((sum, count) => sum + count, 0);
    });

    // Cleanup on unmount
    const cleanup = (quizSetId) => {
        if (quizSetId) {
            if (unsubscribe.value[quizSetId]) {
                unsubscribe.value[quizSetId]();
                delete unsubscribe.value[quizSetId];
            }
        } else {
            // Cleanup all subscriptions
            Object.values(unsubscribe.value).forEach(unsub => unsub?.());
            unsubscribe.value = {};
        }
    };

    return {
        messages,
        unreadCount,
        isLoading,
        error,
        sendMessage,
        subscribeToMessages,
        markAsRead,
        cleanup,
        totalUnreadCount
    };
}); 