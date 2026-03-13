<template>
  <section class="home">
    <div class="hero">
      <p class="eyebrow">ReserveHub Draft Pages</p>
      <h2>역할별 화면 초안 진입</h2>
      <p class="subtitle">다운로드한 HTML 초안을 각 뷰 디렉토리에 연결했습니다. 아래에서 역할별 화면으로 이동할 수 있습니다.</p>
    </div>

    <div class="grid">
      <RouterLink class="card" to="/user">
        <strong>사용자</strong>
        <span>마이페이지, 예약/이력 중심</span>
      </RouterLink>
      <RouterLink class="card" to="/tutor">
        <strong>일반관리자</strong>
        <span>강사/관리자 업무 화면</span>
      </RouterLink>
      <RouterLink class="card" to="/subsup">
        <strong>서브슈퍼관리자</strong>
        <span>플랫폼 운영 및 승인 흐름</span>
      </RouterLink>
      <RouterLink class="card" to="/super">
        <strong>슈퍼관리자</strong>
        <span>전체 플랫폼 통합 관리</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
.home {
  display: grid;
  gap: 24px;
}

.hero {
  padding: 32px;
  border: 1px solid #d9dee8;
  border-radius: 20px;
  background: linear-gradient(135deg, #f8fafc, #eef4ff);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5a6b85;
}

h2 {
  margin: 0 0 10px;
  font-size: 32px;
  color: #162033;
}

.subtitle {
  margin: 0;
  max-width: 720px;
  color: #526179;
  line-height: 1.6;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.card {
  display: grid;
  gap: 8px;
  padding: 22px;
  border: 1px solid #d9dee8;
  border-radius: 18px;
  text-decoration: none;
  color: #162033;
  background: #fff;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: #7c8fb0;
}

.card span {
  color: #5a6b85;
}
</style>
