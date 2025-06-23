// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import MainMenu from '@/views/MainMenu.vue'
import Game from '@/views/Game.vue'

const routes = [
  {
    path: '/',
    component: MainMenu,
  },
  {
    path: '/:pathMatch(.*)*', // attrape toutes les autres routes
    component: Game,
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
