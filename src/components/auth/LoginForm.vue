<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-6 text-center text-gray-900">{{ isRegister ? 'Register' : 'Login' }}</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" v-model="email" required
          class="mt-1 block w-full rounded-md border-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900" />
      </div>


      <div>
        <label class="block text-sm font-medium text-gray-700">Password</label>
        <input type="password" v-model="password" required
          class="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Username</label>
        <input type="text" v-model="username" required
          class="mt-1 block w-full rounded-md border-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900" />
      </div>

      <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

      <button type="submit"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        {{ isRegister ? 'Register' : 'Login' }}
      </button>
    </form>

    <div class="mt-4 space-y-3">
      <button @click="handleGoogleLogin"
        class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center">
        <img src="/google-icon.svg" alt="Google" class="w-5 h-5 mr-2" />
        Continue with Google
      </button>

      <button @click="handleGithubLogin"
        class="w-full bg-[#24292e] border border-gray-300 text-white py-2 px-4 rounded-md hover:bg-[#2f363d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center">
        <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
        Continue with GitHub
      </button>
    </div>

    <p class="mt-4 text-center text-sm text-gray-600">
      {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
      <button @click="isRegister = !isRegister" class="text-blue-600 hover:text-blue-500">
        {{ isRegister ? 'Login' : 'Register' }}
      </button>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'vue-router';
import { names } from '../../data/names';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const isRegister = ref(false);

const generateUniqueUsername = () => {
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomNumber = Math.floor(Math.random() * 1000); // Random number between 0 and 999
  return `${randomName}${randomNumber}`;
};

const username = ref(generateUniqueUsername());

const handleSubmit = async () => {
  try {
    error.value = '';
    if (isRegister.value) {
      await authStore.registerWithEmail(email.value, password.value);
    } else {
      await authStore.loginWithEmail(email.value, password.value);
    }
    router.push('/');
  } catch (err) {
    error.value = err.message;
  }
};

const handleGoogleLogin = async () => {
  try {
    error.value = '';
    await authStore.loginWithGoogle();
    router.push('/');
  } catch (err) {
    error.value = err.message;
  }
};

const handleGithubLogin = async () => {
  try {
    error.value = '';
    await authStore.signInWithGithub();
    router.push('/');
  } catch (err) {
    error.value = err.message;
  }
};
</script>
