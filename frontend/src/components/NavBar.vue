<template>
  <header class="nav">
    <h1>ReserveHub</h1>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/user">User</RouterLink>
      <RouterLink to="/tutor">Tutor</RouterLink>
      <RouterLink to="/subsup">Sub Super</RouterLink>
      <RouterLink to="/super">Super</RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #d9dee8;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.nav a {
  text-decoration: none;
  color: #1f3a56;
  font-size: 14px;
  font-weight: 600;
}
</style>
