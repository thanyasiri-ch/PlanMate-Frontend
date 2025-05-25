import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import SignupWithImage from '@/views/SignupWithImage.vue'
import QuestionaireView from '@/views/QuestionaireView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/signupWithImage',
      name: 'signupWithImage',
      component: SignupWithImage
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/question-pref',
      name: 'question',
      component: QuestionaireView
    }
  ],
})

export default router
