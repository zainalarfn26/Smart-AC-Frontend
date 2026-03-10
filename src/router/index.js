import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoomDetailView from '../views/RoomDetailView.vue'
import AddDeviceView from '../views/AddDeviceView.vue'
import HistoryView from '../views/HistoryView.vue' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/room/:id', name: 'room-detail', component: RoomDetailView, props: true },
    { path: '/add-device', name: 'add-device', component: AddDeviceView },
    { path: '/history', name: 'history', component: HistoryView } 
  ]
})

export default router