<script>
export default {
  name: "superView"
}
</script>

<template>
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReserveHub — 서브담당자 (서브슈퍼)</title>
    <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>

    </style>
  </head>
  <body>

  <div class="app" id="super-app">
    <div class="overlay" id="super-overlay" onclick="closeSidebar()"></div>

    <!-- ══ 사이드바 ══ -->
    <nav class="sidebar" id="super-sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <div class="logo-icon">🏪</div>
          <span class="logo-text">ReserveHub</span>
        </div>
        <button class="collapse-btn" onclick="toggleCollapse()">◀</button>
      </div>

      <!-- 플랫폼 전환 -->
      <div class="plat-switch">
        <div class="plat-switch-label">담당 플랫폼</div>
        <button class="plat-tab-btn active" id="platTab-pilates" onclick="switchPlat('pilates',this)">
          <div class="plat-dot" style="background:#7c6af7"></div>
          <span>스튜디오 필라테스 강남</span>
        </button>
        <button class="plat-tab-btn" id="platTab-yoga" onclick="switchPlat('yoga',this)">
          <div class="plat-dot" style="background:#4fd1c5"></div>
          <span>요가라운지 홍대</span>
        </button>
      </div>

      <div class="user-card">
        <div class="avatar">정</div>
        <div class="user-info">
          <div class="user-name">정미래 점장</div>
          <div class="user-role">서브담당자</div>
        </div>
      </div>

      <div class="nav" id="super-nav">
        <button class="nav-item active" onclick="showPage('dashboard',this)"><span class="nav-icon">📊</span><span class="nav-label">대시보드</span></button>
        <button class="nav-item" onclick="showPage('approval',this)"><span class="nav-icon">✅</span><span class="nav-label">승인 관리</span><span class="nav-badge" id="approval-badge">2</span></button>
        <button class="nav-item" onclick="showPage('members',this)"><span class="nav-icon">👥</span><span class="nav-label">회원 관리</span></button>
        <button class="nav-item" onclick="showPage('instructors',this)"><span class="nav-icon">🧑‍🏫</span><span class="nav-label">강사 관리</span></button>
        <button class="nav-item" onclick="showPage('billing',this)"><span class="nav-icon">💳</span><span class="nav-label">수강권 / 결제</span></button>
        <button class="nav-item" onclick="showPage('calc',this)"><span class="nav-icon">🧮</span><span class="nav-label">상담 계산툴</span></button>
        <button class="nav-item" onclick="showPage('calendar',this)"><span class="nav-icon">📅</span><span class="nav-label">캘린더</span></button>
        <button class="nav-item" onclick="showPage('history',this)"><span class="nav-icon">📋</span><span class="nav-label">수업 이력</span></button>
        <button class="nav-item" onclick="showPage('mypage',this)"><span class="nav-icon">👤</span><span class="nav-label">내 정보</span></button>
      </div>

      <div class="sidebar-bottom">
        <button class="btn-logout">🚪 <span>로그아웃</span></button>
      </div>
    </nav>

    <!-- ══ 메인 ══ -->
    <div class="main">
      <div class="topbar">
        <button class="hamburger" onclick="openSidebar()">☰</button>
        <div class="topbar-title" id="topbar-title">대시보드</div>
        <span class="topbar-plat" id="topbar-plat">🤸 필라테스 강남</span>
        <div class="topbar-right">
          <button class="notif-btn">🔔<span class="notif-dot"></span></button>
        </div>
      </div>

      <div class="content">

        <!-- ══════════════ 대시보드 ══════════════ -->
        <div class="page active" id="super-dashboard">
          <div class="page-header">
            <div class="page-label">DASHBOARD</div>
            <div class="page-title" id="dash-plat-title">스튜디오 필라테스 강남</div>
            <div class="page-subtitle">플랫폼 현황과 처리 대기 업무를 확인하세요</div>
          </div>

          <div class="dash-kpi">
            <div class="kpi-card"><div class="kpi-val" style="color:var(--accent2)" id="kpi-members">142</div><div class="kpi-key">전체 회원</div><div class="kpi-sub" style="color:var(--green)">+8 이번달</div></div>
            <div class="kpi-card"><div class="kpi-val" style="color:var(--accent)" id="kpi-revenue">9.8만</div><div class="kpi-key">이번달 매출</div><div class="kpi-sub" style="color:var(--green)">↑12% vs 지난달</div></div>
            <div class="kpi-card"><div class="kpi-val" style="color:var(--accent3)" id="kpi-attend">93%</div><div class="kpi-key">출결률</div><div class="kpi-sub" style="color:var(--text-sub)">이번달 평균</div></div>
            <div class="kpi-card"><div class="kpi-val" style="color:var(--red)" id="kpi-pending">2</div><div class="kpi-key">승인 대기</div><div class="kpi-sub" style="color:var(--red)">처리 필요</div></div>
          </div>

          <div class="dash-grid">
            <!-- 재결제 임박 -->
            <div class="card">
              <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
                재결제 임박 고객
                <span class="badge bs-expired" style="font-size:10px">D-7 이내 5명</span>
              </div>
              <div id="renewal-list">
                <!-- JS 렌더 -->
              </div>
            </div>

            <!-- 대기 업무 -->
            <div class="card">
              <div class="card-title">처리 대기 업무</div>
              <div class="pending-item" style="border-left:3px solid var(--accent3)">
                <div class="pending-dot" style="background:var(--accent3)"></div>
                <div class="pending-body">
                  <div class="pending-title">홍길동 — 1:1 레슨 일정 변경 요청</div>
                  <div class="pending-meta">이수진 트레이너 · 2026.03.10</div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="showPage('approval',document.querySelectorAll('#super-nav .nav-item')[1])">처리</button>
              </div>
              <div class="pending-item" style="border-left:3px solid var(--accent3)">
                <div class="pending-dot" style="background:var(--accent3)"></div>
                <div class="pending-body">
                  <div class="pending-title">박서준 — 수강권 환불 요청</div>
                  <div class="pending-meta">자동 알림 · 2026.03.09</div>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="showPage('approval',document.querySelectorAll('#super-nav .nav-item')[1])">처리</button>
              </div>
              <div class="pending-item" style="border-left:3px solid var(--text-dim);opacity:.6">
                <div class="pending-dot" style="background:var(--green)"></div>
                <div class="pending-body">
                  <div class="pending-title">이번달 레슨 통계 정산 완료</div>
                  <div class="pending-meta">자동 처리 · 2026.03.01</div>
                </div>
              </div>
            </div>

            <!-- 최근 활동 -->
            <div class="card">
              <div class="card-title">최근 활동</div>
              <div class="activity-item">
                <div class="activity-icon" style="background:rgba(74,222,128,.12)">✅</div>
                <div class="activity-body">
                  <div class="activity-title">김민지 일정 변경 — 승인됨</div>
                  <div class="activity-time">2026.03.09 14:32</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon" style="background:rgba(79,209,197,.12)">👤</div>
                <div class="activity-body">
                  <div class="activity-title">오지현 신규 회원 등록</div>
                  <div class="activity-time">2026.03.08 11:20</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon" style="background:rgba(246,173,85,.12)">💳</div>
                <div class="activity-body">
                  <div class="activity-title">홍길동 그룹 월정액 재결제</div>
                  <div class="activity-time">2026.03.07 10:05</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon" style="background:rgba(248,113,113,.12)">❌</div>
                <div class="activity-body">
                  <div class="activity-title">이지은 수강권 만료 알림 발송</div>
                  <div class="activity-time">2026.03.05 09:00</div>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-icon" style="background:rgba(124,106,247,.12)">📊</div>
                <div class="activity-body">
                  <div class="activity-title">2월 수업 이력 통계 확인</div>
                  <div class="activity-time">2026.03.01 08:30</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════ 승인 관리 ══════════════ -->
        <div class="page" id="super-approval">
          <div class="page-header">
            <div class="page-label">APPROVAL</div>
            <div class="page-title">승인 관리</div>
            <div class="page-subtitle">일정 변경 요청을 검토하고 처리 이력을 남기세요</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
            <button class="filter-chip active" onclick="approvalFilter(this,'all')">전체</button>
            <button class="filter-chip" onclick="approvalFilter(this,'pending')">대기 중</button>
            <button class="filter-chip" onclick="approvalFilter(this,'approved')">승인됨</button>
            <button class="filter-chip" onclick="approvalFilter(this,'rejected')">반려됨</button>
          </div>
          <div id="approval-list"><!-- JS 렌더 --></div>
        </div>

        <!-- ══════════════ 회원 관리 ══════════════ -->
        <div class="page" id="super-members">
          <div class="page-header">
            <div class="page-label">MEMBERS</div>
            <div class="page-title">회원 관리</div>
            <div class="page-subtitle">플랫폼 회원을 조회하고 관리하세요</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
            <input type="text" id="memberSearch" placeholder="이름 / 연락처 검색..." oninput="renderMembers()" style="flex:1;min-width:160px;padding:8px 14px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--text);font-size:13px;outline:none;">
            <button class="filter-chip active" onclick="memberFilter(this,'all')">전체</button>
            <button class="filter-chip" onclick="memberFilter(this,'active')">활성</button>
            <button class="filter-chip" onclick="memberFilter(this,'soon')">만료 임박</button>
            <button class="filter-chip" onclick="memberFilter(this,'expired')">만료</button>
            <button class="btn btn-primary btn-sm" onclick="openAddMemberModal()">+ 회원 등록</button>
          </div>
          <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">
            <div style="overflow-x:auto;">
              <table class="data-table" id="memberTable">
                <thead><tr><th>이름</th><th>연락처</th><th>수강권</th><th>만료일</th><th>D-day</th><th>상태</th><th></th></tr></thead>
                <tbody id="memberTbody"><!-- JS 렌더 --></tbody>
              </table>
            </div>
          </div>
          <div id="memberDetailPanel" style="display:none;"><!-- JS 렌더 --></div>
        </div>

        <!-- ══════════════ 강사 관리 ══════════════ -->
        <div class="page" id="super-instructors">
          <div class="page-header">
            <div class="page-label">INSTRUCTORS</div>
            <div class="page-title">강사 관리</div>
            <div class="page-subtitle">소속 강사를 등록하고 KPI를 확인하세요</div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
            <button class="btn btn-primary btn-sm" onclick="openAddInstructorModal()">+ 강사 등록</button>
          </div>
          <div id="instructor-list" style="display:flex;flex-direction:column;gap:12px;"><!-- JS 렌더 --></div>
        </div>

        <!-- ══════════════ 수강권/결제 ══════════════ -->
        <div class="page" id="super-billing">
          <div class="page-header">
            <div class="page-label">BILLING</div>
            <div class="page-title">수강권 / 결제</div>
            <div class="page-subtitle">수강권과 할인 정책을 관리하세요</div>
          </div>
          <div class="tab-row">
            <button class="tab-btn active" onclick="billingTab('pass',this)">수강권 목록</button>
            <button class="tab-btn" onclick="billingTab('discount',this)">할인 정책</button>
            <button class="tab-btn" onclick="billingTab('history',this)">결제 현황</button>
          </div>

          <!-- 수강권 목록 -->
          <div class="tab-pane active" id="btab-pass">
            <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
              <button class="btn btn-primary btn-sm" onclick="openPassModal()">+ 수강권 추가</button>
            </div>
            <div class="card" style="padding:0;overflow:hidden;margin-bottom:16px;">
              <div style="overflow-x:auto;">
                <table class="data-table">
                  <thead><tr><th>수강권명</th><th>금액</th><th>기간</th><th>가입자</th><th>상태</th><th></th></tr></thead>
                  <tbody>
                  <tr><td style="font-weight:600">그룹 월정액</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">95,000원</td><td>30일</td><td>98명</td><td><span class="badge bs-active" style="font-size:10px">판매중</span></td><td><button class="btn btn-ghost btn-sm">수정</button></td></tr>
                  <tr><td style="font-weight:600">개인 10회권</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">350,000원</td><td>60일</td><td>24명</td><td><span class="badge bs-active" style="font-size:10px">판매중</span></td><td><button class="btn btn-ghost btn-sm">수정</button></td></tr>
                  <tr><td style="font-weight:600">개인 5회권</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">190,000원</td><td>45일</td><td>12명</td><td><span class="badge bs-active" style="font-size:10px">판매중</span></td><td><button class="btn btn-ghost btn-sm">수정</button></td></tr>
                  <tr><td style="font-weight:600">체험 1회권</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">30,000원</td><td>1일</td><td>20명</td><td><span class="badge bs-expired" style="font-size:10px">중단</span></td><td><button class="btn btn-ghost btn-sm">수정</button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card">
              <div class="card-title">이번달 결제 현황</div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;color:var(--accent)">9.8만</div><div style="font-size:10px;color:var(--text-dim);margin-top:4px">총 매출</div></div>
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;color:var(--accent2)">118건</div><div style="font-size:10px;color:var(--text-dim);margin-top:4px">결제 수</div></div>
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;color:var(--accent3)">78%</div><div style="font-size:10px;color:var(--text-dim);margin-top:4px">재등록률</div></div>
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;color:var(--green)">5명</div><div style="font-size:10px;color:var(--text-dim);margin-top:4px">신규 가입</div></div>
              </div>
            </div>
          </div>

          <!-- 할인 정책 -->
          <div class="tab-pane" id="btab-discount">
            <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
              <button class="btn btn-primary btn-sm" onclick="openDiscountModal()">+ 할인 정책 추가</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;" id="discount-list"><!-- JS 렌더 --></div>
          </div>

          <!-- 결제 현황 -->
          <div class="tab-pane" id="btab-history">
            <div class="card" style="padding:0;overflow:hidden;">
              <div style="overflow-x:auto;">
                <table class="data-table">
                  <thead><tr><th>날짜</th><th>회원</th><th>수강권</th><th>금액</th><th>할인</th><th>최종</th><th>상태</th></tr></thead>
                  <tbody>
                  <tr><td style="font-family:'DM Mono',monospace;font-size:12px">03.10</td><td style="font-weight:600">오지현</td><td>그룹 월정액</td><td style="font-family:'DM Mono',monospace">95,000</td><td style="font-family:'DM Mono',monospace;color:var(--accent3)">-0</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">95,000</td><td><span class="badge bs-active" style="font-size:10px">완료</span></td></tr>
                  <tr><td style="font-family:'DM Mono',monospace;font-size:12px">03.07</td><td style="font-weight:600">홍길동</td><td>그룹 월정액</td><td style="font-family:'DM Mono',monospace">95,000</td><td style="font-family:'DM Mono',monospace;color:var(--accent3)">-9,500</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">85,500</td><td><span class="badge bs-active" style="font-size:10px">완료</span></td></tr>
                  <tr><td style="font-family:'DM Mono',monospace;font-size:12px">03.05</td><td style="font-weight:600">박서준</td><td>개인 10회권</td><td style="font-family:'DM Mono',monospace">350,000</td><td style="font-family:'DM Mono',monospace;color:var(--accent3)">-35,000</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">315,000</td><td><span class="badge bs-pending" style="font-size:10px">환불 요청</span></td></tr>
                  <tr><td style="font-family:'DM Mono',monospace;font-size:12px">03.03</td><td style="font-weight:600">김민지</td><td>그룹 월정액</td><td style="font-family:'DM Mono',monospace">95,000</td><td style="font-family:'DM Mono',monospace;color:var(--accent3)">-0</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">95,000</td><td><span class="badge bs-active" style="font-size:10px">완료</span></td></tr>
                  <tr><td style="font-family:'DM Mono',monospace;font-size:12px">03.01</td><td style="font-weight:600">이나은</td><td>개인 5회권</td><td style="font-family:'DM Mono',monospace">190,000</td><td style="font-family:'DM Mono',monospace;color:var(--accent3)">-19,000</td><td style="font-family:'DM Mono',monospace;color:var(--accent)">171,000</td><td><span class="badge bs-active" style="font-size:10px">완료</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════ 상담 계산툴 ══════════════ -->
        <div class="page" id="super-calc">
          <div class="page-header">
            <div class="page-label">CALCULATOR</div>
            <div class="page-title">상담 계산툴</div>
            <div class="page-subtitle">수강권을 선택하고 할인을 적용해 최종 견적을 계산하세요</div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">
            <!-- 좌: 선택 영역 -->
            <div style="display:flex;flex-direction:column;gap:14px;">

              <!-- 수강권 선택 -->
              <div class="card">
                <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
                  <span>① 수강권 선택</span>
                  <span style="font-size:11px;color:var(--text-sub);font-weight:400">복수 선택 가능</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;" id="passCheckList">
                  <!-- JS 렌더 -->
                </div>
              </div>

              <!-- 할인 선택 -->
              <div class="card">
                <div class="card-title">② 할인 적용</div>
                <div style="display:flex;flex-direction:column;gap:6px;" id="discCheckList">
                  <!-- JS 렌더 -->
                </div>
                <!-- 직접 입력 -->
                <div class="calc-disc-row" style="margin-top:6px;gap:10px;">
                  <input type="checkbox" id="customDiscCheck" style="width:16px;height:16px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0;" onchange="calcRender()">
                  <div style="flex:1">
                    <div style="font-size:13px;font-weight:600">직접 할인 입력</div>
                    <div style="font-size:11px;color:var(--text-sub)">임의 할인율 적용</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <input type="number" id="customDiscVal" value="0" min="0" max="100" style="width:60px;padding:4px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;font-family:'DM Mono',monospace;outline:none;text-align:center;" oninput="calcRender()">
                    <span style="font-size:13px;color:var(--text-sub)">%</span>
                  </div>
                </div>
              </div>

              <!-- 메모 -->
              <div class="card">
                <div class="card-title">③ 상담 메모</div>
                <textarea id="calcMemo" placeholder="고객 특이사항이나 메모를 입력하세요..." style="width:100%;min-height:72px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;font-family:'Pretendard',sans-serif;outline:none;resize:vertical;" oninput="calcRender()"></textarea>
              </div>
            </div>

            <!-- 우: 견적 출력 -->
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div class="card">
                <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
                  <span>💰 견적서</span>
                  <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim)" id="calcTimestamp">—</span>
                </div>
                <!-- 수강권 줄 -->
                <div style="font-size:11px;color:var(--text-sub);margin-bottom:6px;letter-spacing:.5px">수강권</div>
                <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;" id="quotePassList">
                  <div class="quote-row"><span style="font-size:12px;color:var(--text-sub)">수강권을 선택하세요</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-dim)">0원</span></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding:8px 10px;background:var(--surface2);border-radius:var(--rs);">
                  <span style="font-size:12px;color:var(--text-sub)">소계</span>
                  <span style="font-family:'DM Mono',monospace;font-size:13px;font-weight:600" id="quoteSubtotal">0원</span>
                </div>
                <!-- 할인 줄 -->
                <div style="font-size:11px;color:var(--text-sub);margin-bottom:6px;letter-spacing:.5px">할인 내역 (순차 적용)</div>
                <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;" id="quoteDiscSteps">
                  <div class="quote-row"><span style="font-size:12px;color:var(--text-sub)">할인 없음</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-dim)">0원</span></div>
                </div>
                <!-- 절약 -->
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-size:12px;color:var(--text-sub)">총 절약</span>
                  <span style="font-family:'DM Mono',monospace;font-size:13px;color:var(--red)" id="quoteSaving">— 0원</span>
                </div>
                <!-- 최종 -->
                <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:rgba(79,209,197,.08);border:1px solid rgba(79,209,197,.3);border-radius:var(--rs);margin-bottom:14px;">
                  <span style="font-size:14px;font-weight:700">최종 금액</span>
                  <span style="font-family:'DM Mono',monospace;font-size:22px;font-weight:700;color:var(--accent)" id="quoteFinal">0원</span>
                </div>
                <!-- 복사용 텍스트 -->
                <textarea id="calcPreview" readonly style="width:100%;min-height:120px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text-sub);font-size:11px;font-family:'DM Mono',monospace;resize:none;outline:none;line-height:1.6;"></textarea>
                <div style="display:flex;gap:8px;margin-top:10px;">
                  <button class="btn btn-primary" style="flex:1;background:var(--accent);color:#0f0f13" onclick="calcCopy()">📋 복사해서 전송</button>
                  <button class="btn btn-ghost" onclick="calcReset()">초기화</button>
                </div>
              </div>

              <!-- 복사 이력 -->
              <div class="card">
                <div class="card-title">상담 이력</div>
                <div id="calcHistory" style="display:flex;flex-direction:column;gap:6px;">
                  <div style="font-size:12px;color:var(--text-dim);text-align:center;padding:12px 0">복사 시 자동 기록됩니다</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════ 캘린더 ══════════════ -->
        <div class="page" id="super-calendar">
          <div class="page-header">
            <div class="page-label">CALENDAR</div>
            <div class="page-title">캘린더</div>
            <div class="page-subtitle">플랫폼 전체 일정을 한눈에 확인하세요</div>
          </div>

          <!-- 범례 -->
          <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:10px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:20px;">
            <span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase">범례</span>
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#7c6af7"><span style="display:inline-block;width:10px;height:4px;background:#7c6af7;border-radius:2px"></span>그룹 레슨</div>
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#4fd1c5"><span style="display:inline-block;width:10px;height:4px;background:#4fd1c5;border-radius:2px"></span>개인 레슨</div>
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#f6ad55"><span style="display:inline-block;width:10px;height:4px;background:#f6ad55;border-radius:2px"></span>플랫폼 공지/휴무</div>
            <div style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#f87171"><span style="display:inline-block;width:10px;height:4px;background:#f87171;border-radius:2px"></span>본사 공지</div>
            <button class="btn btn-primary btn-sm" style="margin-left:auto;background:var(--accent);color:#0f0f13" onclick="openShareEventModal()">+ 공유 이벤트 등록</button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start;">
            <!-- 달력 -->
            <div class="card">
              <div class="cal-nav-row">
                <span class="cal-month-lbl" id="calLbl">2026년 3월</span>
                <div class="cal-nav-btns">
                  <button class="cal-nav-btn" onclick="calNav(-1)">‹</button>
                  <button class="cal-nav-btn" onclick="calNav(1)">›</button>
                </div>
              </div>
              <div class="cal-dow">
                <div class="cal-dow-lbl" style="color:#f87171">일</div>
                <div class="cal-dow-lbl">월</div><div class="cal-dow-lbl">화</div>
                <div class="cal-dow-lbl">수</div><div class="cal-dow-lbl">목</div>
                <div class="cal-dow-lbl">금</div>
                <div class="cal-dow-lbl" style="color:#60a5fa">토</div>
              </div>
              <div class="cal-grid-7" id="calDays"></div>
            </div>

            <!-- 일별 상세 -->
            <div>
              <div class="card">
                <div class="card-title" id="calDetailTitle">3월 11일 화요일 — 오늘</div>
                <div id="calDetailBody">
                  <div style="font-size:13px;color:var(--text-dim);text-align:center;padding:24px 0">날짜를 선택하세요</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════ 수업 이력 ══════════════ -->
        <div class="page" id="super-history">
          <div class="page-header">
            <div class="page-label">HISTORY</div>
            <div class="page-title">수업 이력</div>
            <div class="page-subtitle">강사별·기간별 수업 현황을 분석하세요</div>
          </div>
          <!-- 필터 -->
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
            <div class="form-field" style="margin:0">
              <select id="histYear" onchange="histRender()" style="padding:7px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;outline:none;">
                <option value="2026">2026년</option><option value="2025">2025년</option><option value="2024">2024년</option>
              </select>
            </div>
            <div class="form-field" style="margin:0">
              <select id="histMonth" onchange="histRender()" style="padding:7px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;outline:none;">
                <option value="0">전체 월</option>
                <option value="1">1월</option><option value="2">2월</option><option value="3" selected>3월</option>
                <option value="4">4월</option><option value="5">5월</option><option value="6">6월</option>
                <option value="7">7월</option><option value="8">8월</option><option value="9">9월</option>
                <option value="10">10월</option><option value="11">11월</option><option value="12">12월</option>
              </select>
            </div>
            <div class="form-field" style="margin:0">
              <select id="histInstructor" onchange="histRender()" style="padding:7px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;outline:none;">
                <option value="all">전체 강사</option>
                <option value="이수진">이수진 트레이너</option>
                <option value="김현우">김현우 트레이너</option>
              </select>
            </div>
            <div class="form-field" style="margin:0">
              <select id="histType" onchange="histRender()" style="padding:7px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;outline:none;">
                <option value="all">전체 유형</option><option value="group">그룹 레슨</option><option value="private">개인 레슨</option>
              </select>
            </div>
          </div>
          <!-- KPI -->
          <div class="hist-kpi">
            <div class="kpi-card"><div class="kpi-val" style="color:var(--accent2)" id="histTotal">0</div><div class="kpi-key">총 수업</div></div>
            <div class="kpi-card"><div class="kpi-val" style="color:var(--accent)" id="histGroup">0</div><div class="kpi-key">그룹 레슨</div></div>
            <div class="kpi-card"><div class="kpi-val" style="color:var(--accent3)" id="histPrivate">0</div><div class="kpi-key">개인 레슨</div></div>
            <div class="kpi-card"><div class="kpi-val" style="color:var(--green)" id="histStudents">0</div><div class="kpi-key">수강 인원</div></div>
            <div class="kpi-card"><div class="kpi-val" style="color:var(--green)" id="histAttend">0%</div><div class="kpi-key">출결률</div></div>
          </div>
          <!-- 강사 바 차트 + 테이블 -->
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:18px;">
            <div class="card">
              <div class="card-title">강사별 수업 수</div>
              <div id="histBars" style="display:flex;flex-direction:column;gap:14px;"></div>
            </div>
            <div class="card" style="padding:0;overflow:hidden;">
              <div style="overflow-x:auto;">
                <table class="data-table">
                  <thead><tr><th>날짜</th><th>강사</th><th>유형</th><th>프로그램</th><th>정원</th><th>출석</th><th>출결률</th></tr></thead>
                  <tbody id="histTbody"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════ 마이페이지 ══════════════ -->
        <div class="page" id="super-mypage">
          <div class="page-header">
            <div class="page-label">MY PAGE</div>
            <div class="page-title">내 정보</div>
            <div class="page-subtitle">계정 정보와 담당 플랫폼 현황을 확인하세요</div>
          </div>

          <div class="hero">
            <div class="hero-avatar">정</div>
            <div class="hero-info">
              <div class="hero-name">정미래 점장</div>
              <div class="hero-email">jung.mirae@reservehub.kr · 010-9999-1234</div>
            </div>
            <div class="hero-stats">
              <div class="hstat"><div class="hstat-val">2</div><div class="hstat-key">담당 플랫폼</div></div>
              <div class="hstat"><div class="hstat-val" style="color:var(--green)">228</div><div class="hstat-key">전체 회원</div></div>
              <div class="hstat"><div class="hstat-val" style="color:var(--accent3)">6</div><div class="hstat-key">소속 강사</div></div>
              <div class="hstat"><div class="hstat-val" style="color:var(--green)">15만</div><div class="hstat-key">이번달 매출</div></div>
            </div>
            <button class="btn btn-ghost btn-sm">✏️ 정보 수정</button>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
            <div class="card">
              <div class="card-title">담당 플랫폼</div>
              <div style="display:flex;flex-direction:column;gap:0">
                <div style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)">
                  <div style="width:38px;height:38px;border-radius:10px;background:rgba(124,106,247,.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🤸</div>
                  <div style="flex:1">
                    <div style="font-size:14px;font-weight:600">스튜디오 필라테스 강남</div>
                    <div style="font-size:11px;color:var(--text-sub);margin-top:3px">회원 142명 · 강사 4명 · 매출 9.8만</div>
                  </div>
                  <span class="badge bs-active" style="font-size:10px">담당 중</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;padding:14px 0">
                  <div style="width:38px;height:38px;border-radius:10px;background:rgba(79,209,197,.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🧘</div>
                  <div style="flex:1">
                    <div style="font-size:14px;font-weight:600">요가라운지 홍대</div>
                    <div style="font-size:11px;color:var(--text-sub);margin-top:3px">회원 86명 · 강사 2명 · 매출 5.2만</div>
                  </div>
                  <span class="badge bs-active" style="font-size:10px">담당 중</span>
                </div>
              </div>
            </div>
            <div class="card">
              <div class="card-title">이번달 처리 이력</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:22px;color:var(--green)">8</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px">승인 처리</div></div>
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:22px;color:var(--red)">2</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px">반려 처리</div></div>
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:22px;color:var(--accent)">5</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px">상담 기록</div></div>
                <div style="background:var(--surface2);border-radius:var(--rs);padding:14px;text-align:center"><div style="font-family:'DM Mono',monospace;font-size:22px;color:var(--accent3)">3</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px">회원 등록</div></div>
              </div>
            </div>
            <div class="card">
              <div class="card-title">계정 정보</div>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div class="form-field"><label>이름</label><input type="text" value="정미래" readonly style="opacity:.7;cursor:default"></div>
                <div class="form-field"><label>이메일</label><input type="email" value="jung.mirae@reservehub.kr"></div>
                <div class="form-field"><label>연락처</label><input type="tel" value="010-9999-1234"></div>
                <button class="btn btn-primary" style="align-self:flex-end;background:var(--accent);color:#0f0f13" onclick="showToast('정보가 저장되었습니다.')">저장</button>
              </div>
            </div>
            <div class="card">
              <div class="card-title">비밀번호 변경</div>
              <div style="display:flex;flex-direction:column;gap:12px">
                <div class="form-field"><label>현재 비밀번호</label><input type="password" placeholder="••••••••"></div>
                <div class="form-field"><label>새 비밀번호</label><input type="password" placeholder="8자 이상"></div>
                <div class="form-field"><label>새 비밀번호 확인</label><input type="password" placeholder="동일하게 입력"></div>
                <button class="btn btn-ghost" style="align-self:flex-end" onclick="showToast('비밀번호가 변경되었습니다.')">변경하기</button>
              </div>
            </div>
          </div>
        </div>

      </div><!-- /content -->
    </div><!-- /main -->
  </div><!-- /app -->

  <!-- ══ 모달들 ══ -->
  <!-- 공유 이벤트 등록 모달 -->
  <div class="modal-overlay" id="shareEventModal">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">📢 공유 이벤트 등록</div>
        <button class="modal-close" onclick="closeModal('shareEventModal')">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-field"><label>이벤트 제목</label><input type="text" placeholder="예: 3월 그룹반 특가 이벤트"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-field"><label>시작일</label><input type="date" value="2026-03-11"></div>
          <div class="form-field"><label>종료일</label><input type="date" value="2026-03-31"></div>
        </div>
        <div class="form-field">
          <label>공개 범위</label>
          <select>
            <option>전체 회원</option><option>활성 회원만</option><option>VIP 회원</option>
          </select>
        </div>
        <div class="form-field"><label>내용</label><textarea placeholder="이벤트 상세 내용을 입력하세요..."></textarea></div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-ghost" onclick="closeModal('shareEventModal')">취소</button>
          <button class="btn btn-primary" style="background:var(--accent);color:#0f0f13" onclick="submitShareEvent()">등록</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 회원 등록 모달 -->
  <div class="modal-overlay" id="addMemberModal">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">👤 회원 등록</div>
        <button class="modal-close" onclick="closeModal('addMemberModal')">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-field"><label>이름</label><input type="text" id="newMemberName" placeholder="홍길동"></div>
          <div class="form-field"><label>연락처</label><input type="tel" id="newMemberPhone" placeholder="010-0000-0000"></div>
        </div>
        <div class="form-field"><label>수강권</label>
          <select id="newMemberPass">
            <option value="그룹 월정액|2026-04-10">그룹 월정액 (30일)</option>
            <option value="개인 10회권|2026-05-10">개인 10회권 (60일)</option>
            <option value="개인 5회권|2026-04-25">개인 5회권 (45일)</option>
          </select>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-ghost" onclick="closeModal('addMemberModal')">취소</button>
          <button class="btn btn-primary" style="background:var(--accent);color:#0f0f13" onclick="submitAddMember()">등록</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 강사 등록 모달 -->
  <div class="modal-overlay" id="addInstructorModal">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">🧑‍🏫 강사 등록</div>
        <button class="modal-close" onclick="closeModal('addInstructorModal')">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-field"><label>이름</label><input type="text" id="newInstName" placeholder="홍길동 트레이너"></div>
          <div class="form-field"><label>연락처</label><input type="tel" id="newInstPhone" placeholder="010-0000-0000"></div>
        </div>
        <div class="form-field"><label>담당 프로그램</label><input type="text" id="newInstProgram" placeholder="예: 그룹반 C · 개인 레슨"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-ghost" onclick="closeModal('addInstructorModal')">취소</button>
          <button class="btn btn-primary" style="background:var(--accent);color:#0f0f13" onclick="submitAddInstructor()">등록</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 할인 정책 모달 -->
  <div class="modal-overlay" id="discountModal">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">🏷 할인 정책 설정</div>
        <button class="modal-close" onclick="closeModal('discountModal')">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-field"><label>정책명</label><input type="text" id="newDiscName" placeholder="예: 재등록 할인 10%"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-field"><label>할인율</label><input type="number" id="newDiscRate" value="10" min="1" max="100"></div>
          <div class="form-field"><label>적용 대상</label>
            <select id="newDiscTarget">
              <option>전체 수강권</option><option>그룹 월정액</option><option>개인 10회권</option><option>개인 5회권</option>
            </select>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-ghost" onclick="closeModal('discountModal')">취소</button>
          <button class="btn btn-primary" style="background:var(--accent);color:#0f0f13" onclick="submitDiscount()">저장</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 수강권 추가 모달 -->
  <div class="modal-overlay" id="passModal">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title">💳 수강권 추가</div>
        <button class="modal-close" onclick="closeModal('passModal')">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="form-field"><label>수강권명</label><input type="text" id="newPassName" placeholder="예: 그룹 주 2회권"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-field"><label>금액 (원)</label><input type="number" id="newPassPrice" placeholder="150000"></div>
          <div class="form-field"><label>기간 (일)</label><input type="number" id="newPassDays" placeholder="30"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-ghost" onclick="closeModal('passModal')">취소</button>
          <button class="btn btn-primary" style="background:var(--accent);color:#0f0f13" onclick="submitPass()">추가</button>
        </div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script defer src="SubsupView.js"></script>
  </body>
  </html>

</template>

<style scoped>

</style>