<template>
    <div class="user-status flex items-center gap-2 p-1 text-sm">
        <template v-if="authStore.user">
            <div class="flex flex-col gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                <!-- User Status with Provider Icon -->
                <div class="flex items-center gap-2">
                    <!-- Google Icon -->
                    <svg v-if="provider === 'google.com'" class="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <!-- GitHub Icon -->
                    <svg v-else-if="provider === 'github.com'" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path
                            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <!-- Email Icon -->
                    <svg v-else-if="provider === 'password'" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span class="text-gray-600">
                        {{ displayName }}
                    </span>
                    <!-- Settings Gear Icon -->
                    <svg @click="showUserProfile = true"
                        class="h-4 w-4 text-gray-600 cursor-pointer hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-14c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                    <!-- Contributor Badge -->
                    <button v-if="hasContributed" @click="showContributions = true"
                        class="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full flex items-center gap-1 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Contributor
                    </button>
                    <!-- Contributor Mode Badge -->
                    <span v-if="contributorMode"
                        class="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full flex items-center gap-1">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Editing
                    </span>
                </div>

                <!-- Progress Indicator with Info Icon -->
                <div @click="showProgressDetails = true"
                    class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-2 py-1 transition-colors group">
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <div class="flex items-center gap-2">
                        <span>{{ progressText }}</span>
                        <div class="w-24 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div class="h-full bg-green-500 rounded-full"
                                :style="{ width: `${progressStore.progressPercentage}%` }">
                            </div>
                        </div>
                        <!-- Info Icon (bigger) -->
                        <svg class="h-4 w-4 ml-1 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-300" @click="showContributions = true">
                    <div
                        class="flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-2 py-1 transition-colors">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span v-if="contributionStats.total > 0">
                            {{ contributionStats.total }} quiz {{ contributionStats.total === 1 ? 'entry' : 'entries' }}
                            ({{ contributionStats.published }} published)
                        </span>

                        <span v-else>No quiz entries yet</span>
                        <svg class="h-4 w-4 ml-1 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <!-- Contributor Mode Toggle -->

                <!-- Login/Sign Out Buttons -->
                <router-link v-if="authStore.user.isAnonymous" to="/login"
                    class="text-blue-500 hover:text-blue-600 text-xs transition-colors">
                    Sign In
                </router-link>
                <button v-else @click="handleSignOut"
                    class="text-gray-500 hover:text-red-500 text-xs transition-colors flex items-center gap-1"
                    title="Sign Out">
                    <span>Sign Out</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </template>
        <template v-else>
            <router-link to="/login"
                class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors">
                Sign In
            </router-link>
        </template>

        <!-- Progress Details Popup -->
        <ProgressDetailsPopup :show="showProgressDetails" @close="showProgressDetails = false" />

        <!-- Contributions Modal -->
        <ContributionsModal :show="showContributions" @close="showContributions = false" />

        <!-- User Profile Modal -->
        <UserProfileModal :show="showUserProfile" @close="showUserProfile = false" />
    </div>
</template>

<script>
import { useAuthStore } from '../stores/authStore';
import { useProgressStore } from '../stores/progressStore';
import { onMounted, computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ProgressDetailsPopup from './ProgressDetailsPopup.vue';
import ContributionsModal from './ContributionsModal.vue';
import { doc, getDoc, query, collection, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { quizEntries } from '../data/quiz-items';
import UserProfileModal from './UserProfileModal.vue';

export default {
    name: 'UserStatus',
    components: {
        ProgressDetailsPopup,
        ContributionsModal,
        UserProfileModal
    },
    setup() {
        const authStore = useAuthStore();
        const progressStore = useProgressStore();
        const showProgressDetails = ref(false);
        const showContributions = ref(false);
        const router = useRouter();
        const contributorMode = ref(false);
        const hasContributed = ref(false);
        const userQuizItems = ref([]);
        const contributionStats = ref({
            total: 0,
            published: 0,
            draft: 0
        });
        const showUserProfile = ref(false);

        const fetchContributorStatus = async () => {
            if (!authStore.user || authStore.user.isAnonymous) return;

            try {
                // Create queries for both email and userId
                const emailQuery = query(
                    collection(db, 'quizEntries'),
                    where('userEmail', '==', authStore.user.email)
                );
                const userIdQuery = query(
                    collection(db, 'quizEntries'),
                    where('userId', '==', authStore.user.uid)
                );

                // Execute both queries
                const [emailSnapshot, userIdSnapshot] = await Promise.all([
                    getDocs(emailQuery),
                    getDocs(userIdQuery)
                ]);

                // Combine results and remove duplicates
                const uniqueEntries = new Map();
                [...emailSnapshot.docs, ...userIdSnapshot.docs].forEach(doc => {
                    if (!uniqueEntries.has(doc.id)) {
                        uniqueEntries.set(doc.id, doc.data());
                    }
                });

                // Calculate stats
                const entries = Array.from(uniqueEntries.values());
                userQuizItems.value = entries;

                // Update contribution stats
                contributionStats.value = {
                    total: entries.length,
                    published: entries.filter(entry => !entry.isDraft).length,
                    draft: entries.filter(entry => entry.isDraft).length
                };

                // User has contributed if they have any entries
                hasContributed.value = contributionStats.value.total > 0;

                console.log('Contributor status:', {
                    email: authStore.user.email,
                    uid: authStore.user.uid,
                    stats: contributionStats.value,
                    hasContributed: hasContributed.value,
                    entries: entries.length
                });
            } catch (error) {
                console.error('Error fetching contributor status:', error);
            }
        };

        onMounted(async () => {
            console.log('UserStatus mounted');
            if (!progressStore.initialized) {
                await progressStore.initialize();
                await progressStore.fetchProgress();
            }
            // Load contributor mode from localStorage
            const savedMode = localStorage.getItem('contributorMode');
            if (savedMode) {
                contributorMode.value = JSON.parse(savedMode);
            }
            await fetchContributorStatus();
        });

        // Watch for changes in progress, but don't re-fetch if already initialized
        watch(() => progressStore.lastUpdated, () => {
            console.log('Progress updated in store');
        }, { deep: true });

        // Watch for changes in contributor mode and save to localStorage
        watch(contributorMode, (newValue) => {
            localStorage.setItem('contributorMode', JSON.stringify(newValue));
        });

        // Watch for auth changes to update contributor status
        watch(() => authStore.user, async (newUser) => {
            if (newUser && !newUser.isAnonymous) {
                await fetchContributorStatus();
            } else {
                hasContributed.value = false;
            }
        });

        // Watch for changes in userQuizItems and update stats
        watch([userQuizItems, () => authStore.user?.email], () => {
            if (!authStore.user?.email) return;

            // Get published items by matching the full email
            const publishedItems = quizEntries.filter(item =>
                item.userEmail === authStore.user.email
            );
            const published = publishedItems.length;

            console.log('Published items found:', {
                email: authStore.user.email,
                count: published,
                items: publishedItems.map(item => item.title)
            });

            // Get draft items by checking if they're not in the published list
            const draftItems = userQuizItems.value.filter(item =>
                !quizEntries.some(qi =>
                    qi.userEmail === authStore.user.email &&
                    qi.title === item.title
                )
            );
            const draft = draftItems.length;

            console.log('Draft items found:', {
                count: draft,
                items: draftItems.map(item => item.title)
            });

            contributionStats.value = {
                total: published + draft,
                published,
                draft
            };

            console.log('Updated contribution stats:', contributionStats.value);
        });

        const displayName = computed(() => {
            if (authStore.user.isAnonymous) return 'Anonymous User';
            if (!authStore.user.email) return 'Signed In';
            return authStore.user.email.split('@')[0];
        });

        const provider = computed(() => {
            return authStore.user?.providerData?.[0]?.providerId || 'anonymous';
        });

        const progressText = computed(() => {
            return `${progressStore.quizCompletionCount}/${progressStore.totalQuizzes} quizzes`;
        });

        const toggleContributorMode = () => {
            contributorMode.value = !contributorMode.value;
        };

        const handleSignOut = async () => {
            try {
                await authStore.signOut();
                router.push('/');
            } catch (error) {
                console.error('Sign out error:', error);
            }
        };

        return {
            authStore,
            progressStore,
            showProgressDetails,
            showContributions,
            displayName,
            provider,
            progressText,
            handleSignOut,
            contributorMode,
            toggleContributorMode,
            hasContributed,
            contributionStats,
            userQuizItems,
            showUserProfile
        };
    }
};
</script>