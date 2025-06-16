import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'
import SignupWithImage from '@/views/SignupWithImage.vue'
import QuestionaireView from '@/views/QuestionaireView.vue'
import ProfileView from '@/views/ProfileView.vue'
import StudySetupView from '@/views/StudySetupView.vue'
import TermCourseSetup from '@/components/study-setup/TermCourseSetup.vue'
import TopicSetup from '@/components/study-setup/TopicSetup.vue'
import AvailabilitySetup from '@/components/study-setup/AvailabilitySetup.vue'
import GeneratePlan from '@/components/study-setup/GeneratePlan.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/signupWithImage',
      name: 'signupWithImage',
      component: SignupWithImage,
    },
    {
      path: '/question-pref',
      name: 'question',
      component: QuestionaireView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/study-setup',
      component: StudySetupView,
      children: [
        { path: 'term', name: 'term', component: TermCourseSetup },
        { path: 'course', name: 'course', component: TermCourseSetup },
        { path: 'topic', name: 'topic', component: TopicSetup },
        { path: 'availability', name: 'availability', component: AvailabilitySetup },
        { path: 'generate', name: 'generate', component: GeneratePlan },
        { path: '', redirect: { name: 'term' } },
      ],
    },
  ],
})

export default router
