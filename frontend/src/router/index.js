import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import UserView from "../views/user/UserView.vue";
import TutorView from "../views/tutor/TutorView.vue";
import SubsupView from "../views/subsup/SubsupView.vue";

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/user", name: "user", component: UserView },
  { path: "/tutor", name: "tutor", component: TutorView },
  { path: "/subsup", name: "subsup", component: SubsupView },
  { path: "/super", name: "super", component: SuperView },
  { path: "/me", redirect: "/user" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
