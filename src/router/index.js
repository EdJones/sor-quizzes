import { createRouter, createWebHistory } from 'vue-router';
import { requireAuth } from './guards';
import LoginForm from '../components/auth/LoginForm.vue';
import Home from '../components/Home.vue';
import NewItem from '../components/NewItem.vue';
import GitHubIssues from '../components/GitHubIssues.vue';
import QuizSetView from '../views/QuizSetView.vue';
import QuizItemEditor from '../views/QuizItemEditor.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginForm
  },
  {
    path: '/new-item',
    name: 'NewItem',
    component: NewItem
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
    path: '/edit-item/:id',
    name: 'edit-item',
    component: QuizItemEditor,
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
  // Catch all route for 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
