<template>
  <div :class="[
    'app-container min-h-screen',
    !isHomePath ? 'bg-gray-900 text-white' : ''
  ]">
    <header :class="[
      'flex justify-between items-center py-2 px-4',
      !isHomePath ? 'bg-gray-800' : ''
    ]">
      <div class="flex items-center gap-3">
        <router-link to="/" class="flex items-center">
          <img :src="logo" alt="SOR Quizzes" class="h-7 md:h-8" />
        </router-link>
        <h1 class="text-xxl font-semibold text-gray-200 hidden md:block">
          Science of Reading Quizzes
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <TopScores />
        <UserStatus />
      </div>
    </header>

    <!-- Help Modal -->
    <div v-if="showHelp" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="showHelp = false">
      <div class="bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-xl">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-bold text-white">About SOR Quizzes</h2>
          <button @click="showHelp = false" class="text-gray-400 hover:text-gray-300 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="space-y-4 text-gray-300">
          <p>
            SOR Quizzes is a community-driven effort to create and share quiz content
            related to Science of Reading concepts.
          </p>
          <p>
            You can:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Take quizzes to test your knowledge</li>
            <li>Create and submit new quiz questions</li>
            <li>Sign in with Google or GitHub to track your progress</li>
            <li>Contribute to the <a href="https://github.com/EdJones/sor-quizzes" class="text-blue-400 hover:underline"
                target="_blank">open source project</a></li>
          </ul>
          <p>
            Created by <a href="https://skunkworks-edu.com" class="text-blue-400 hover:underline"
              target="_blank">Skunkworks\edu</a>
          </p>
        </div>
      </div>
    </div>

    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import UserStatus from './components/UserStatus.vue';
import TopScores from './components/TopScores.vue';
import logo from './assets/sor-quizzes-logo.png';
import { useAuthStore } from './stores/authStore';
import { useProgressStore } from './stores/progressStore';
import { useRoute } from 'vue-router';

const showHelp = ref(false);
const authStore = useAuthStore();
const progressStore = useProgressStore();
const route = useRoute();

const isHomePath = computed(() => {
  return route.path === '/' || route.path === '/home';
});

// Watch for auth changes
watch(() => authStore.user, async (newUser) => {
  if (newUser && !newUser.isAnonymous) {
    await progressStore.fetchProgress();
  } else {
    progressStore.reset();
  }
});

// Initial fetch if user is already logged in
onMounted(async () => {
  if (authStore.user && !authStore.user.isAnonymous) {
    await progressStore.fetchProgress();
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
