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
    const subscriptions = ref({});  // Map of quizSetId to unsubscribe function

    const authStore = useAuthStore();

    // Get current user's display name
    const getUserDisplayName = () => {
        if (!authStore.user) return 'Anonymous';
        if (authStore.user.displayName) return authStore.user.displayName;
        return authStore.user.email ? authStore.user.email.split('@')[0] : 'Anonymous';
    };

    // Subscribe to messages for a specific quiz set
    const subscribeToMessages = async (quizSetId) => {
        try {
            console.log(`Creating subscription for quiz set: ${quizSetId}`);

            // Initialize state for this quiz set
            messages[quizSetId] = [];
            isLoading[quizSetId] = true;
            error.value = null;
            unreadCount[quizSetId] = 0;
            lastReadTimestamp[quizSetId] = Date.now();

            // Create query based on quiz set ID
            const q = query(
                collection(db, 'discussions'),
                where('quizSetId', '==', quizSetId === '_general' ? 'general' : quizSetId),
                orderBy('timestamp', 'asc'),
                limit(100)
            );

            // Subscribe to messages
            const unsubscribe = onSnapshot(q, (snapshot) => {
                console.log(`Received update for quiz set: ${quizSetId}`);
                messages[quizSetId] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Update unread count
                updateUnreadCount(quizSetId);
                isLoading[quizSetId] = false;
            }, (error) => {
                console.error(`Error in subscription for quiz set ${quizSetId}:`, error);
                error.value = error;
                isLoading[quizSetId] = false;
            });

            // Store unsubscribe function
            subscriptions[quizSetId] = unsubscribe;
            console.log(`Subscription created for quiz set: ${quizSetId}`);

        } catch (err) {
            console.error(`Error setting up subscription for quiz set ${quizSetId}:`, err);
            error.value = err;
            isLoading[quizSetId] = false;
        }
    };

    // Send a new message
    const sendMessage = async (messageData) => {
        try {
            console.log('Sending message:', messageData);
            const { quizSetId, text, userId, userName } = messageData;

            const message = {
                quizSetId: quizSetId === '_general' ? 'general' : quizSetId,
                text,
                userId,
                userName,
                timestamp: serverTimestamp()
            };

            await addDoc(collection(db, 'discussions'), message);
            console.log('Message sent successfully');
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        }
    };

    // Update unread count for a specific quiz set
    const updateUnreadCount = (quizSetId) => {
        if (!lastReadTimestamp.value[quizSetId]) {
            lastReadTimestamp.value[quizSetId] = new Date();
            unreadCount.value[quizSetId] = 0;
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
            if (subscriptions.value[quizSetId]) {
                console.log('Cleaning up subscription for quiz set:', quizSetId);
                subscriptions.value[quizSetId]();
                delete subscriptions.value[quizSetId];
            }
        } else {
            // Cleanup all subscriptions
            console.log('Cleaning up all subscriptions');
            Object.values(subscriptions.value).forEach(unsub => unsub?.());
            subscriptions.value = {};
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