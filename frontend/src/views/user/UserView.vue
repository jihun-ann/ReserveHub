<script>
export default {
  name: "userView.vue"
}
</script>

<template>
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReserveHub — 사용자</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <style>
    </style>
  </head>
  <body>

  <!-- ══════════════════════════════════════
       사용자 앱
  ══════════════════════════════════════ -->
  <div class="app" id="user-app">

    <!-- 모바일 오버레이 -->
    <div class="overlay" id="user-overlay" onclick="closeSidebar()"></div>

    <!-- ── 사이드바 ── -->
    <nav class="sidebar" id="user-sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <div class="logo-icon">🗓</div>
          <span class="logo-text">ReserveHub</span>
        </div>
        <button class="collapse-btn" onclick="toggleCollapse()">◀</button>
      </div>

      <div class="user-card">
        <div class="avatar">김</div>
        <div class="user-info">
          <div class="user-name">김지수</div>
          <div class="user-role">수강생 · 일반회원</div>
        </div>
      </div>

      <div class="nav" id="user-nav">
        <button class="nav-item active" onclick="showPage('calendar', this)">
          <span class="nav-icon">📅</span>
          <span class="nav-label">캘린더</span>
        </button>
        <button class="nav-item" onclick="showPage('reservation', this)">
          <span class="nav-icon">🎯</span>
          <span class="nav-label">예약하기</span>
        </button>
        <button class="nav-item" onclick="showPage('mypage', this)">
          <span class="nav-icon">👤</span>
          <span class="nav-label">마이페이지</span>
        </button>
      </div>

      <div class="sidebar-bottom">
        <button class="btn-logout">🚪 <span>로그아웃</span></button>
      </div>
    </nav>

    <!-- ── 메인 ── -->
    <div class="main" id="user-main">
      <div class="topbar">
        <button class="hamburger" onclick="openSidebar()">☰</button>
        <div class="topbar-title" id="topbar-title">내 캘린더</div>
        <div class="topbar-right">
          <button class="notif-btn" title="알림">🔔<span class="notif-dot"></span></button>
        </div>
      </div>

      <div class="content">

        <!-- ══ 캘린더 ══ -->
        <div class="page active" id="page-calendar">
          <div class="page-header">
            <div class="page-label">CALENDAR</div>
            <div class="page-title">내 캘린더</div>
            <div class="page-subtitle">레슨 일정과 예약 현황을 한눈에 확인하세요</div>
          </div>

          <div class="cal-grid">
            <!-- 달력 카드 -->
            <div class="card">
              <div class="cal-nav-row">
                <span class="cal-month-label" id="calMonthLabel">2026년 3월</span>
                <div class="cal-nav-btns">
                  <button class="cal-nav-btn" onclick="calNav(-1)">‹</button>
                  <button class="cal-nav-btn" onclick="calNav(1)">›</button>
                </div>
              </div>
              <div class="cal-dow">
                <div class="cal-dow-label" style="color:#f87171">일</div>
                <div class="cal-dow-label">월</div>
                <div class="cal-dow-label">화</div>
                <div class="cal-dow-label">수</div>
                <div class="cal-dow-label">목</div>
                <div class="cal-dow-label">금</div>
                <div class="cal-dow-label" style="color:#60a5fa">토</div>
              </div>
              <div class="cal-days" id="calDays"></div>
              <div class="cal-legend">
                <div class="legend-item">
                  <div class="legend-dot" style="background:var(--accent)"></div>
                  오늘
                </div>
                <div class="legend-item">
                  <div class="legend-dot" style="background:var(--accent2)"></div>
                  예약 있음
                </div>
                <div class="legend-item">
                  <div class="legend-dot" style="background:var(--accent3)"></div>
                  오늘+예약
                </div>
              </div>
            </div>

            <!-- 오른쪽 패널 -->
            <div class="cal-right">

              <!-- 선택 날 레슨 -->
              <div class="card">
                <div class="card-title" id="calDayTitle">3월 11일 화요일 — 오늘</div>
                <div id="calDayDetail">
                  <div class="lesson-list">
                    <div class="lesson-item">
                      <div class="lesson-time">10:00</div>
                      <div class="lesson-body">
                        <div class="lesson-name">필라테스 그룹반 A</div>
                        <div class="lesson-place">스튜디오 필라테스 강남점</div>
                      </div>
                      <div class="lesson-tag">예약됨</div>
                    </div>
                    <div class="lesson-item" style="border-left-color:var(--accent3)">
                      <div class="lesson-time" style="color:var(--accent3)">14:00</div>
                      <div class="lesson-body">
                        <div class="lesson-name">1번 연습실</div>
                        <div class="lesson-place">뮤직하우스 홍대점</div>
                      </div>
                      <div class="lesson-tag music">예약됨</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 타이머 -->
              <div class="card">
                <div class="card-title">운동 · 연습 타이머</div>
                <div class="timer-type-row">
                  <button class="type-btn active" onclick="setTimerType(this,'운동')">🏋️ 운동</button>
                  <button class="type-btn" onclick="setTimerType(this,'스트레칭')">🧘 스트레칭</button>
                  <button class="type-btn" onclick="setTimerType(this,'연습')">🎵 연습</button>
                </div>
                <div class="timer-digits" id="timerDigits">00:00:00</div>
                <div class="timer-label">ELAPSED TIME</div>
                <div class="timer-btn-row">
                  <button id="timerToggleBtn" onclick="toggleTimer()" style="background:var(--accent);color:white;">시작
                  </button>
                  <button onclick="resetTimer()"
                          style="background:var(--surface2);color:var(--text-sub);border:1px solid var(--border);">초기화
                  </button>
                </div>
                <div class="timer-stats">
                  <div class="timer-stat">
                    <div class="timer-stat-val" id="todayTotal">01:42</div>
                    <div class="timer-stat-key">오늘 총 시간</div>
                  </div>
                  <div class="timer-stat">
                    <div class="timer-stat-val">3</div>
                    <div class="timer-stat-key">이번달 기록</div>
                  </div>
                  <div class="timer-stat">
                    <div class="timer-stat-val">12</div>
                    <div class="timer-stat-key">누적 세션</div>
                  </div>
                </div>
              </div>

              <!-- 최근 이력 -->
              <div class="card">
                <div class="card-title">최근 이력</div>
                <div class="history-list">
                  <div class="history-item">
                    <div class="history-dot" style="background:var(--accent2)"></div>
                    <div class="history-date">03.07 10:00</div>
                    <div class="history-name">필라테스 그룹반 A</div>
                    <div class="history-dur">60분</div>
                  </div>
                  <div class="history-item">
                    <div class="history-dot" style="background:var(--accent3)"></div>
                    <div class="history-date">03.05 14:00</div>
                    <div class="history-name">연습실 자율 연습</div>
                    <div class="history-dur">90분</div>
                  </div>
                  <div class="history-item">
                    <div class="history-dot" style="background:var(--accent)"></div>
                    <div class="history-date">03.03 10:00</div>
                    <div class="history-name">필라테스 그룹반 A</div>
                    <div class="history-dur">60분</div>
                  </div>
                  <div class="history-item">
                    <div class="history-dot" style="background:var(--accent3)"></div>
                    <div class="history-date">02.28 13:00</div>
                    <div class="history-name">개인 운동 타이머</div>
                    <div class="history-dur">45분</div>
                  </div>
                  <div class="history-item">
                    <div class="history-dot" style="background:var(--accent2)"></div>
                    <div class="history-date">02.26 10:00</div>
                    <div class="history-name">필라테스 그룹반 A</div>
                    <div class="history-dur">60분</div>
                  </div>
                </div>
              </div>

            </div><!-- /cal-right -->
          </div><!-- /cal-grid -->
        </div>

        <!-- ══ 예약하기 ══ -->
        <div class="page" id="page-reservation">
          <div class="page-header">
            <div class="page-label">RESERVATION</div>
            <div class="page-title">예약하기</div>
            <div class="page-subtitle">원하는 프로그램과 시간을 선택하세요</div>
          </div>

          <div class="res-grid">
            <!-- 왼쪽: 프로그램 목록 -->
            <div>
              <div class="filter-bar">
                <button class="filter-chip active" onclick="filterChip(this,'all')">전체</button>
                <button class="filter-chip" onclick="filterChip(this,'pilates')">🤸 필라테스</button>
                <button class="filter-chip" onclick="filterChip(this,'yoga')">🧘 요가</button>
                <button class="filter-chip" onclick="filterChip(this,'music')">🎵 음악</button>
                <button class="filter-chip" onclick="filterChip(this,'fitness')">🏋️ 헬스</button>
              </div>

              <div class="program-list" id="programList">
                <!-- JS로 렌더 -->
              </div>
            </div>

            <!-- 오른쪽: 슬롯 패널 -->
            <div>
              <div class="card">
                <div class="slot-panel-header">
                  <div>
                    <div class="slot-panel-date" id="slotDateLabel">필라테스 그룹반 A</div>
                    <div class="slot-panel-sub" id="slotSubLabel">날짜를 선택하세요</div>
                  </div>
                </div>

                <!-- 날짜 선택 (7일) -->
                <div class="slot-nav-row" id="slotDateRow">
                  <!-- JS 렌더 -->
                </div>

                <div class="slot-list" id="slotList">
                  <!-- JS 렌더 -->
                </div>

                <div class="confirm-box" id="confirmBox" style="display:none">
                  <div class="confirm-row"><span>프로그램</span><strong id="confirmProg">—</strong></div>
                  <div class="confirm-row"><span>날짜</span><strong id="confirmDate">—</strong></div>
                  <div class="confirm-row"><span>시간</span><strong id="confirmTime">—</strong></div>
                  <div class="confirm-row"><span>잔여석</span><strong id="confirmRemain"
                                                                   style="color:var(--accent2)">—</strong></div>
                  <button class="btn-confirm" id="confirmBtn" onclick="doReserve()">예약 확정하기</button>
                </div>
                <div id="noSlotMsg" style="text-align:center;padding:32px 0;color:var(--text-dim);font-size:13px;">
                  프로그램을 선택해 주세요
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ 마이페이지 ══ -->
        <div class="page" id="page-mypage">
          <div class="page-header">
            <div class="page-label">MY PAGE</div>
            <div class="page-title">마이페이지</div>
            <div class="page-subtitle">내 정보와 등록된 플랫폼을 확인하세요</div>
          </div>

          <!-- 프로필 히어로 -->
          <div class="mypage-hero">
            <div class="mypage-avatar">김</div>
            <div class="mypage-info">
              <div class="mypage-name">김지수</div>
              <div class="mypage-email">jisu.kim@example.com · 010-1234-5678</div>
              <div class="mypage-tags">
                <span class="mypage-tag">필라테스</span>
                <span class="mypage-tag">음악</span>
                <span class="mypage-tag">일반회원</span>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm">프로필 수정</button>
          </div>

          <!-- 통계 -->
          <div class="mypage-grid" style="margin-bottom:20px">
            <div class="mypage-stat-card">
              <div class="mypage-stat-val">23</div>
              <div class="mypage-stat-key">이번달 누적 예약</div>
            </div>
            <div class="mypage-stat-card">
              <div class="mypage-stat-val" style="color:var(--accent2)">18</div>
              <div class="mypage-stat-key">이번달 출석 횟수</div>
            </div>
            <div class="mypage-stat-card">
              <div class="mypage-stat-val" style="color:var(--green)">78%</div>
              <div class="mypage-stat-key">출석률</div>
            </div>
            <div class="mypage-stat-card">
              <div class="mypage-stat-val" style="color:var(--accent3)">D-7</div>
              <div class="mypage-stat-key">수강권 만료까지</div>
            </div>
          </div>

          <!-- 등록 플랫폼 -->
          <div class="card" style="margin-bottom:20px">
            <div class="card-title">등록 플랫폼</div>
            <div class="platform-list">
              <div class="platform-item">
                <div class="platform-icon" style="background:rgba(124,106,247,.15)">🤸</div>
                <div class="platform-body">
                  <div class="platform-name">스튜디오 필라테스 강남점</div>
                  <div class="platform-meta">그룹반 A · 담당: 이수진 트레이너 · 만료 2026.03.18</div>
                </div>
                <div class="platform-remain">
                  <div class="platform-remain-num">4</div>
                  <div class="platform-remain-label">잔여 횟수</div>
                </div>
                <span class="platform-status ps-soon">만료 임박</span>
              </div>
              <div class="platform-item">
                <div class="platform-icon" style="background:rgba(246,173,85,.15)">🎵</div>
                <div class="platform-body">
                  <div class="platform-name">뮤직하우스 홍대점</div>
                  <div class="platform-meta">연습실 이용권 · 만료 2026.04.30</div>
                </div>
                <div class="platform-remain">
                  <div class="platform-remain-num">8</div>
                  <div class="platform-remain-label">잔여 횟수</div>
                </div>
                <span class="platform-status ps-active">이용 중</span>
              </div>
            </div>
          </div>

          <!-- 예약 이력 -->
          <div class="card">
            <div class="card-title">예약 이력</div>
            <div class="res-list">
              <div class="res-item">
                <div class="res-date-block">
                  <div class="res-day">14</div>
                  <div class="res-mon">3월</div>
                </div>
                <div class="res-divider"></div>
                <div class="res-body">
                  <div class="res-name">필라테스 그룹반 A</div>
                  <div class="res-time">10:00 – 11:00 · 스튜디오 필라테스 강남점</div>
                </div>
                <span class="res-status rs-upcoming">예정</span>
              </div>
              <div class="res-item">
                <div class="res-date-block">
                  <div class="res-day">11</div>
                  <div class="res-mon">3월</div>
                </div>
                <div class="res-divider"></div>
                <div class="res-body">
                  <div class="res-name">1번 연습실</div>
                  <div class="res-time">14:00 – 15:00 · 뮤직하우스 홍대점</div>
                </div>
                <span class="res-status rs-upcoming">예정</span>
              </div>
              <div class="res-item">
                <div class="res-date-block">
                  <div class="res-day">07</div>
                  <div class="res-mon">3월</div>
                </div>
                <div class="res-divider"></div>
                <div class="res-body">
                  <div class="res-name">필라테스 그룹반 A</div>
                  <div class="res-time">10:00 – 11:00 · 스튜디오 필라테스 강남점</div>
                </div>
                <span class="res-status rs-done">완료</span>
              </div>
              <div class="res-item">
                <div class="res-date-block">
                  <div class="res-day">05</div>
                  <div class="res-mon">3월</div>
                </div>
                <div class="res-divider"></div>
                <div class="res-body">
                  <div class="res-name">연습실 자율 연습</div>
                  <div class="res-time">14:00 – 15:30 · 뮤직하우스 홍대점</div>
                </div>
                <span class="res-status rs-done">완료</span>
              </div>
              <div class="res-item">
                <div class="res-date-block">
                  <div class="res-day">28</div>
                  <div class="res-mon">2월</div>
                </div>
                <div class="res-divider"></div>
                <div class="res-body">
                  <div class="res-name">필라테스 1:1 개인레슨</div>
                  <div class="res-time">11:00 – 11:50 · 스튜디오 필라테스 강남점</div>
                </div>
                <span class="res-status rs-cancel">취소됨</span>
              </div>
            </div>
          </div>

        </div><!-- /page-mypage -->

      </div><!-- /content -->
    </div><!-- /main -->
  </div><!-- /app -->

  <!-- 토스트 -->
  <div class="toast" id="toast"></div>

  <script defer src="./UserView.js"></script>
  </body>
  </html>
</template>

<style scoped>

</style>