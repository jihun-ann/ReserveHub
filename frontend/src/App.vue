<template>
  <div class="app-shell">
    <NavBar />
    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import NavBar from "./components/NavBar.vue";
</script>

<style scoped>
.app-shell {
  font-family: "Georgia", serif;
}

.page {
  padding: 24px;
}
</style>
