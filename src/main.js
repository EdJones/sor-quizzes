import { createApp } from 'vue'
import { createPinia, defineStore } from 'pinia'
import './style.css'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons'
import { faCircleMinus } from '@fortawesome/free-solid-svg-icons'
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons'
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons'
import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'
import { faFlaskVial } from '@fortawesome/free-solid-svg-icons'
import { faPodcast } from '@fortawesome/free-solid-svg-icons'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { faBook } from '@fortawesome/free-solid-svg-icons'

import { inject } from '@vercel/analytics';

//import * as LottiePlayer from "@lottiefiles/lottie-player";
import Vue3Lottie from 'vue3-lottie'

import LiteYouTubeEmbed from 'vue-lite-youtube-embed';
import 'vue-lite-youtube-embed/style.css'

import { auth, signInAnonymouslyWithPersistence } from './firebase';

inject();

library.add(faUserSecret)
library.add(faCircleQuestion)
library.add(faCircleMinus)
library.add(faCircleXmark)
library.add(faCircleCheck)
library.add(faCheck)
library.add(faFlaskVial)
library.add(faPodcast)
library.add(faExternalLinkAlt)
library.add(faBook)
const app = createApp(App)
const pinia = createPinia(); // Create a Pinia store instance

app.config.globalProperties.$userAnswers = []
app.use(Vue3Lottie)
app.component(LiteYouTubeEmbed)
app.component('font-awesome-icon', FontAwesomeIcon)

import { createRouter, createWebHistory } from 'vue-router'; // Import the router
//import App from './App.vue'; // Import the main App component
import NewItem from './components/NewItem.vue'; // Import the new component

// Define your routes
const routes = [
    { path: '/', component: App }, // Main application route
    { path: '/new-item', component: NewItem }, // New item route
];

// Create the router instance
const router = createRouter({
    history: createWebHistory(),
    routes,
});

app.use(router); // Use the router
app.use(pinia);

// Create an auth store with Pinia
export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        loading: true,
        error: null
    }),
    actions: {
        async signInAnonymously() {
            try {
                const user = await signInAnonymouslyWithPersistence();
                this.user = user;
                return user;
            } catch (error) {
                console.error('Error signing in:', error);
                this.error = error.message;
                throw error;
            }
        },

        initializeAuthListener() {
            auth.onAuthStateChanged((user) => {
                this.user = user;
                this.loading = false;
                console.log('Auth state changed:', user ? user.uid : 'No user');
            });
        }
    }
});

// Initialize auth store and sign in anonymously
const authStore = useAuthStore(pinia);
authStore.signInAnonymously().catch(console.error);

app.mount('#app')
