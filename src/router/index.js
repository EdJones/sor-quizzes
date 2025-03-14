import { createRouter, createWebHistory } from 'vue-router';
import { requireAuth, requireAdmin } from './guards';
import LoginForm from '../components/auth/LoginForm.vue';
import Home from '../components/Home.vue';
import GitHubIssues from '../components/GitHubIssues.vue';
import QuizSetView from '../views/QuizSetView.vue';
import QuizItemEditor from '../views/QuizItemEditor.vue';
import AdminPage from '../views/AdminPage.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginForm
  },
  {
    path: '/edit-item/:id',
    name: 'edit-item',
    component: QuizItemEditor,
    beforeEnter: requireAuth,
    props: route => ({
      itemId: route.params.id === 'new' ? null : route.params.id
    })
  },
  {
    path: '/edit-item/new',
    name: 'NewQuizItem',
    component: QuizItemEditor,
    beforeEnter: requireAuth
  },
  {
    path: '/quiz/:id',
    name: 'Quiz',
    component: () => import('../components/Quiz.vue')
  },
  {
    path: '/issues',
    name: 'issues',
    component: GitHubIssues
  },
  {
    path: '/quizSetView',
    name: 'QuizSetView',
    component: QuizSetView
  },
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminPage,
    beforeEnter: requireAdmin
  },
  // Catch all route for 404 - must be last
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Add navigation debugging
router.beforeEach((to, from, next) => {
  console.log('Global navigation guard:', {
    from: from.fullPath,
    to: to.fullPath,
    timestamp: Date.now()
  });
  next();
});

// Prevent immediate redirects to home
router.beforeEach((to, from, next) => {
  // If we're navigating from a protected route to home without user interaction
  if (from.matched.some(record => record.beforeEnter === requireAuth) &&
    to.path === '/' &&
    // Check if this is happening right after a successful navigation
    Date.now() - (window._lastSuccessfulNav || 0) < 1000) {
    console.log('Preventing automatic redirect to home');
    return next(false);
  }
  next();
});

// Track successful navigations
router.afterEach((to) => {
  window._lastSuccessfulNav = Date.now();
  console.log('Navigation completed successfully to:', to.fullPath);
});

export default router;
