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
  min-height: 100vh;
  font-family: "Pretendard", "Apple SD Gothic Neo", sans-serif;
  background: #f4f7fb;
}

.page {
  padding: 20px;
}
</style>
