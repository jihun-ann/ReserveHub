import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import AdminDashboardView from "../views/admin/DashboardView.vue";
import UserProfileView from "../views/user/ProfileView.vue";

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/admin", name: "admin", component: AdminDashboardView },
  { path: "/me", name: "me", component: UserProfileView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
