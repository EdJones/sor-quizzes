// 1. CSS imports first
import './style.css'

// 2. Vue core imports
import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 3. FontAwesome imports
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

// 4. Third-party plugins
import { inject } from '@vercel/analytics'
import Vue3Lottie from 'vue3-lottie'
import LiteYouTubeEmbed from 'vue-lite-youtube-embed'
import 'vue-lite-youtube-embed/style.css'

// 5. Your app components
import App from './App.vue'

// 6. Setup
inject();

// Add global error handler for cross-origin issues
window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('cross-origin')) {
        console.warn('Cross-origin error detected:', event.message);
        event.preventDefault(); // Prevent the error from propagating
    }
});

library.add(
    faUserSecret,
    faCircleQuestion,
    faCircleMinus,
    faCircleXmark,
    faCircleCheck,
    faCheck,
    faFlaskVial,
    faPodcast,
    faExternalLinkAlt,
    faBook
)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(Vue3Lottie)
app.use(LiteYouTubeEmbed)
app.component('font-awesome-icon', FontAwesomeIcon)

// Initialize the auth store and sign in anonymously if no user
import { useAuthStore } from './stores/authStore';
const authStore = useAuthStore();
await authStore.init();
if (!authStore.user) {
    await authStore.signInAnonymously();
}

// Add router
import router from './router'
app.use(router)

app.mount('#app')
