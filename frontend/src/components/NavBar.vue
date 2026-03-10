<template>
  <header class="nav">
    <h1>ReserveHub</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/admin">Admin</a>
      <a href="/me">Profile</a>
    </nav>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #ccc;
  padding: 16px 24px;
}

.nav a {
  margin-right: 12px;
  text-decoration: none;
  color: #1f3a56;
}
</style>
