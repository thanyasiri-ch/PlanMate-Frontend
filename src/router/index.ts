import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import SignupWithImage from '@/views/SignupWithImage.vue'
import QuestionaireView from '@/views/QuestionnaireView.vue'
import ProfileView from '@/views/ProfileView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
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
      path: '/question-pref',
      name: 'question',
      component: QuestionaireView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    }
  ],
})

export default router
