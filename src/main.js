import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import firebaseConfig from './firebaseConfig'
import { initializeApp } from "firebase/app";

initializeApp(firebaseConfig);
const app = createApp(App)
app.use(router)
app.mount('#app')

