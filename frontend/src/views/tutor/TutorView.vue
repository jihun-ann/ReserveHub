<script>
export default {
  name: "TutorView.vue"
}
</script>

<template>
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReserveHub — 강사 (일반관리자)</title>
    <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      /* ── 리셋 & 변수 ── */
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg:        #0f0f13;
        --surface:   #18181f;
        --surface2:  #21212b;
        --border:    #2e2e3a;
        --accent:    #4fd1c5;   /* 민트 — 강사 */
        --accent2:   #7c6af7;   /* 보라 */
        --accent3:   #f6ad55;   /* 오렌지 */
        --red:       #f87171;
        --green:     #4ade80;
        --text:      #e8e8f0;
        --text-sub:  #8888a0;
        --text-dim:  #55556a;
        --sw:  220px;
        --sw-c: 60px;
        --r:  14px;
        --rs: 8px;
        --tr: .22s ease;
      }
      body { background: var(--bg); color: var(--text); font-family: 'Pretendard', sans-serif; height: 100vh; overflow: hidden; }

      /* ── 앱 ── */
      .app { display: flex; height: 100vh; overflow: hidden; }

      /* ── 오버레이 ── */
      .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 100; backdrop-filter: blur(2px); }
      .overlay.open { display: block; }

      /* ── 사이드바 ── */
      .sidebar {
        width: var(--sw); min-width: var(--sw); height: 100vh;
        background: var(--surface); border-right: 1px solid var(--border);
        display: flex; flex-direction: column;
        transition: width var(--tr), min-width var(--tr);
        position: relative; z-index: 101; overflow: hidden;
      }
      .sidebar.collapsed { width: var(--sw-c); min-width: var(--sw-c); }
      .sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 20px 16px 16px; border-bottom: 1px solid var(--border); }
      .logo { display: flex; align-items: center; gap: 10px; overflow: hidden; }
      .logo-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), #38b2ac); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
      .logo-text { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; }
      .collapse-btn { background: none; border: none; color: var(--text-sub); cursor: pointer; font-size: 14px; padding: 4px; transition: color var(--tr); }
      .collapse-btn:hover { color: var(--text); }
      .sidebar.collapsed .logo-text { opacity: 0; width: 0; }
      .sidebar.collapsed .collapse-btn { transform: rotate(180deg); }

      .user-card { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); overflow: hidden; }
      .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #38b2ac); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; color: #0f0f13; }
      .user-info { overflow: hidden; }
      .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; }
      .user-role { font-size: 11px; color: var(--accent); white-space: nowrap; }
      .sidebar.collapsed .user-info { display: none; }

      .nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
      .nav-item {
        display: flex; align-items: center; gap: 12px; padding: 10px;
        border-radius: var(--rs); background: none; border: none; color: var(--text-sub);
        cursor: pointer; font-size: 13px; font-weight: 500; font-family: inherit;
        transition: background var(--tr), color var(--tr); width: 100%; text-align: left;
        white-space: nowrap; overflow: hidden;
      }
      .nav-item:hover { background: var(--surface2); color: var(--text); }
      .nav-item.active { background: rgba(79,209,197,.15); color: var(--accent); font-weight: 600; }
      .nav-icon { font-size: 17px; flex-shrink: 0; }
      .sidebar.collapsed .nav-label { display: none; }
      .sidebar.collapsed .nav-item { justify-content: center; }

      .sidebar-bottom { padding: 12px; border-top: 1px solid var(--border); }
      .btn-logout { width: 100%; padding: 9px; border-radius: var(--rs); background: none; border: 1px solid var(--border); color: var(--text-sub); font-size: 12px; cursor: pointer; font-family: inherit; transition: all var(--tr); display: flex; align-items: center; justify-content: center; gap: 6px; }
      .btn-logout:hover { border-color: var(--red); color: var(--red); }
      .sidebar.collapsed .btn-logout span { display: none; }

      /* ── 메인 ── */
      .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
      .topbar { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; top: 0; z-index: 50; }
      .hamburger { display: none; background: none; border: none; color: var(--text); font-size: 20px; cursor: pointer; padding: 4px; }
      .topbar-title { font-size: 15px; font-weight: 600; }
      .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }
      .notif-btn { position: relative; background: none; border: none; color: var(--text-sub); font-size: 18px; cursor: pointer; padding: 4px; }
      .notif-dot { position: absolute; top: 2px; right: 2px; width: 7px; height: 7px; border-radius: 50%; background: var(--accent3); border: 2px solid var(--surface); }
      .content { flex: 1; padding: 24px; }

      /* ── 페이지 ── */
      .page { display: none; }
      .page.active { display: block; }
      .page-header { margin-bottom: 24px; }
      .page-label { font-size: 10px; color: var(--accent); letter-spacing: 2px; font-weight: 600; margin-bottom: 4px; }
      .page-title { font-size: 22px; font-weight: 700; }
      .page-subtitle { font-size: 13px; color: var(--text-sub); margin-top: 4px; }

      /* ── 카드 ── */
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 20px; }
      .card-title { font-size: 12px; font-weight: 700; color: var(--text-sub); letter-spacing: .5px; margin-bottom: 14px; text-transform: uppercase; }

      /* ── 버튼 ── */
      .btn { padding: 8px 16px; border-radius: var(--rs); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; border: none; transition: all var(--tr); }
      .btn-primary { background: var(--accent); color: #0f0f13; }
      .btn-primary:hover { opacity: .85; }
      .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text-sub); }
      .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
      .btn-sm { padding: 5px 12px; font-size: 12px; }

      /* ── 칩 / 뱃지 ── */
      .chip { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; border: 1px solid transparent; }
      .filter-chip { padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border); background: none; color: var(--text-sub); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all var(--tr); }
      .filter-chip:hover { border-color: var(--accent); color: var(--accent); }
      .filter-chip.active { background: rgba(79,209,197,.15); border-color: var(--accent); color: var(--accent); }

      /* ════════════════════════════════
         캘린더 페이지
      ════════════════════════════════ */
      .kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
      .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; text-align: center; }
      .kpi-val { font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 500; line-height: 1; }
      .kpi-key { font-size: 11px; color: var(--text-sub); margin-top: 6px; }

      .cal-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }

      /* 달력 */
      .cal-nav-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .cal-month-lbl { font-size: 15px; font-weight: 700; }
      .cal-nav-btns { display: flex; gap: 6px; }
      .cal-nav-btn { width: 28px; height: 28px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all var(--tr); }
      .cal-nav-btn:hover { background: var(--accent); border-color: var(--accent); color: #0f0f13; }
      .cal-dow { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 4px; }
      .cal-dow-lbl { text-align: center; font-size: 10px; color: var(--text-dim); font-weight: 600; padding: 3px 0; }
      .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
      .cal-cell {
        aspect-ratio: 1; border-radius: 6px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; font-size: 12px; font-weight: 500;
        cursor: pointer; transition: all var(--tr); position: relative; gap: 2px;
        border: 1.5px solid transparent;
      }
      .cal-cell:hover { background: var(--surface2); }
      .cal-cell.dim { color: var(--text-dim); cursor: default; }
      .cal-cell.dim:hover { background: none; }
      .cal-cell.today { background: rgba(79,209,197,.15); border-color: var(--accent); color: var(--accent); font-weight: 700; }
      .cal-cell.selected { background: var(--accent); color: #0f0f13; border-color: var(--accent); font-weight: 700; }
      .cal-cell .dot-row { display: flex; gap: 2px; }
      .dot { width: 4px; height: 4px; border-radius: 50%; }

      /* 타임라인 */
      .timeline-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .timeline-date { font-size: 15px; font-weight: 700; }
      .timeline-dow { font-size: 12px; color: var(--text-sub); margin-left: 8px; }
      .timeline { display: flex; flex-direction: column; gap: 10px; }
      .tl-item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: var(--surface2); border-radius: var(--rs); border-left: 3px solid transparent; transition: border-color var(--tr); }
      .tl-item:hover { border-left-color: var(--accent); }
      .tl-time { font-family: 'DM Mono', monospace; font-size: 13px; min-width: 48px; color: var(--text-sub); padding-top: 2px; }
      .tl-body { flex: 1; min-width: 0; }
      .tl-name { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
      .tl-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .tl-chip { font-size: 11px; padding: 2px 9px; border-radius: 20px; font-weight: 600; border: 1px solid transparent; }
      .tl-students { font-size: 12px; color: var(--text-sub); margin-top: 6px; display: flex; gap: 8px; flex-wrap: wrap; }
      .tl-student-tag { font-size: 11px; padding: 2px 8px; background: var(--surface); border-radius: 20px; border: 1px solid var(--border); }
      .tl-status { font-size: 12px; padding: 4px 12px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
      .no-event { font-size: 13px; color: var(--text-dim); text-align: center; padding: 32px 0; }

      /* 플랫폼 범례 */
      .plat-legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }
      .plat-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-sub); font-weight: 600; }
      .plat-legend-dot { width: 10px; height: 10px; border-radius: 2px; }

      /* ════════════════════════════════
         출결 관리 페이지
      ════════════════════════════════ */
      .attend-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
      .attend-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .attend-table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-sub); letter-spacing: .5px; border-bottom: 1px solid var(--border); background: var(--surface2); }
      .attend-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
      .attend-table tr:last-child td { border-bottom: none; }
      .attend-table tr:hover td { background: rgba(255,255,255,.02); }
      .attend-toggle { display: flex; gap: 4px; }
      .atbtn { padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border); background: none; color: var(--text-sub); font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all var(--tr); }
      .atbtn:hover { border-color: var(--accent); color: var(--accent); }
      .atbtn.present { background: rgba(74,222,128,.15); border-color: var(--green); color: var(--green); }
      .atbtn.late    { background: rgba(246,173,85,.15);  border-color: var(--accent3); color: var(--accent3); }
      .atbtn.absent  { background: rgba(248,113,113,.15); border-color: var(--red); color: var(--red); }

      /* 출결 요약 사이드 */
      .attend-summary { display: flex; flex-direction: column; gap: 14px; }
      .attend-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .attend-stat { background: var(--surface2); border-radius: var(--rs); padding: 12px; text-align: center; }
      .attend-stat-val { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 500; }
      .attend-stat-key { font-size: 10px; color: var(--text-sub); margin-top: 4px; }
      .attend-rate-bar { height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; margin-top: 8px; }
      .attend-rate-fill { height: 100%; background: var(--green); border-radius: 4px; transition: width .6s ease; }

      /* ════════════════════════════════
         일정 변경 요청 페이지
      ════════════════════════════════ */
      .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 14px; margin-bottom: 14px; }
      .form-field { display: flex; flex-direction: column; gap: 6px; }
      .form-field label { font-size: 11px; font-weight: 600; color: var(--text-sub); letter-spacing: .5px; }
      .form-field input, .form-field select, .form-field textarea {
        background: var(--surface2); border: 1px solid var(--border); border-radius: var(--rs);
        color: var(--text); font-family: inherit; font-size: 13px; padding: 9px 12px;
        outline: none; transition: border-color var(--tr); width: 100%;
      }
      .form-field input:focus, .form-field select:focus, .form-field textarea:focus { border-color: var(--accent); }
      .form-field textarea { resize: vertical; min-height: 80px; }
      .form-field select option { background: var(--surface2); }

      /* 요청 이력 카드 */
      .req-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 16px; margin-bottom: 12px; }
      .req-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
      .req-title { font-size: 14px; font-weight: 700; }
      .req-meta { font-size: 11px; color: var(--text-dim); font-family: 'DM Mono', monospace; margin-top: 4px; }
      .req-date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
      .req-date-box { background: var(--surface2); border-radius: var(--rs); padding: 10px 12px; }
      .req-date-lbl { font-size: 10px; color: var(--text-dim); letter-spacing: 1px; margin-bottom: 4px; }
      .req-date-val { font-size: 13px; font-weight: 600; }
      .req-reason { background: var(--surface2); border-radius: var(--rs); padding: 10px 12px; font-size: 13px; color: var(--text-sub); line-height: 1.6; margin-bottom: 10px; }
      .req-status { font-size: 12px; padding: 4px 12px; border-radius: 20px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
      .rs-pending  { background: rgba(246,173,85,.12);  color: var(--accent3); }
      .rs-approved { background: rgba(74,222,128,.12);  color: var(--green); }
      .rs-rejected { background: rgba(248,113,113,.12); color: var(--red); }

      /* ════════════════════════════════
         마이페이지
      ════════════════════════════════ */
      .hero { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: linear-gradient(135deg, rgba(79,209,197,.12), rgba(124,106,247,.08)); border: 1px solid rgba(79,209,197,.25); border-radius: var(--r); margin-bottom: 20px; }
      .hero-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #38b2ac); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #0f0f13; flex-shrink: 0; }
      .hero-info { flex: 1; }
      .hero-name { font-size: 18px; font-weight: 700; }
      .hero-email { font-size: 12px; color: var(--text-sub); margin-top: 4px; }
      .hero-stats { display: flex; gap: 24px; flex-wrap: wrap; }
      .hero-stat { text-align: center; }
      .hstat-val { font-family: 'DM Mono', monospace; font-size: 20px; font-weight: 600; color: var(--accent); }
      .hstat-key { font-size: 10px; color: var(--text-sub); margin-top: 2px; }
      .mypage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

      .plat-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
      .plat-item:last-child { border-bottom: none; }
      .plat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
      .plat-body { flex: 1; min-width: 0; }
      .plat-name { font-size: 14px; font-weight: 600; }
      .plat-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
      .plat-tag { font-size: 11px; padding: 2px 9px; border-radius: 20px; font-weight: 600; }
      .plat-sub { font-size: 11px; color: var(--text-sub); margin-top: 4px; }
      .plat-status { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
      .ps-active { background: rgba(74,222,128,.12); color: var(--green); }

      .sch-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
      .sch-item:last-child { border-bottom: none; }
      .sch-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .sch-time { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text-sub); min-width: 42px; }
      .sch-name { flex: 1; font-size: 13px; font-weight: 500; }
      .sch-badge { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600; }

      /* ── 반응형 ── */
      @media (max-width: 1100px) {
        .cal-layout { grid-template-columns: 1fr; }
        .attend-layout { grid-template-columns: 1fr; }
      }
      @media (max-width: 768px) {
        .sidebar { position: fixed; left: -100%; z-index: 200; transition: left var(--tr); width: var(--sw) !important; min-width: var(--sw) !important; }
        .sidebar.open { left: 0; }
        .hamburger { display: flex; }
        .collapse-btn { display: none; }
        .sidebar .logo-text,
        .sidebar .user-info,
        .sidebar .nav-label { opacity: 1 !important; width: auto !important; display: block !important; }
        .sidebar .nav-item { justify-content: flex-start !important; }
        .kpi-row { grid-template-columns: repeat(2,1fr); }
      }
      @media (max-width: 600px) {
        .content { padding: 16px; }
        .kpi-row { grid-template-columns: repeat(2,1fr); }
        .mypage-grid { grid-template-columns: 1fr; }
      }

      /* 토스트 */
      .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--surface); border: 1px solid var(--accent); border-radius: var(--r); padding: 13px 24px; font-size: 14px; font-weight: 600; color: var(--accent); z-index: 999; transition: transform .3s ease, opacity .3s ease; opacity: 0; pointer-events: none; white-space: nowrap; }
      .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
    </style>
  </head>
  <body>

  <div class="app" id="admin-app">

    <div class="overlay" id="admin-overlay" onclick="closeSidebar()"></div>

    <!-- ── 사이드바 ── -->
    <nav class="sidebar" id="admin-sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <div class="logo-icon">🛠</div>
          <span class="logo-text">ReserveHub</span>
        </div>
        <button class="collapse-btn" onclick="toggleCollapse()">◀</button>
      </div>

      <div class="user-card">
        <div class="avatar">이</div>
        <div class="user-info">
          <div class="user-name">이수진 트레이너</div>
          <div class="user-role">일반관리자 · 강사</div>
        </div>
      </div>

      <div class="nav" id="admin-nav">
        <button class="nav-item active" onclick="showPage('calendar', this)">
          <span class="nav-icon">📅</span>
          <span class="nav-label">내 캘린더</span>
        </button>
        <button class="nav-item" onclick="showPage('attend', this)">
          <span class="nav-icon">✅</span>
          <span class="nav-label">출결 관리</span>
        </button>
        <button class="nav-item" onclick="showPage('request', this)">
          <span class="nav-icon">📝</span>
          <span class="nav-label">일정 변경 요청</span>
        </button>
        <button class="nav-item" onclick="showPage('mypage', this)">
          <span class="nav-icon">👤</span>
          <span class="nav-label">내 정보</span>
        </button>
      </div>

      <div class="sidebar-bottom">
        <button class="btn-logout">🚪 <span>로그아웃</span></button>
      </div>
    </nav>

    <!-- ── 메인 ── -->
    <div class="main" id="admin-main">
      <div class="topbar">
        <button class="hamburger" onclick="openSidebar()">☰</button>
        <div class="topbar-title" id="topbar-title">내 캘린더</div>
        <div class="topbar-right">
          <button class="notif-btn" title="알림">🔔<span class="notif-dot"></span></button>
        </div>
      </div>

      <div class="content">

        <!-- ══ 내 캘린더 ══ -->
        <div class="page active" id="admin-calendar">
          <div class="page-header">
            <div class="page-label">CALENDAR</div>
            <div class="page-title">내 캘린더</div>
            <div class="page-subtitle">레슨 일정과 수강생 현황을 한눈에 확인하세요</div>
          </div>

          <!-- KPI -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-val" style="color:var(--accent)" id="kpiToday">4</div>
              <div class="kpi-key">오늘 레슨</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color:var(--green)" id="kpiStudents">18</div>
              <div class="kpi-key">오늘 수강생</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color:var(--accent3)" id="kpiPending">2</div>
              <div class="kpi-key">미출석 확인</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-val" style="color:var(--accent2)" id="kpiMonthly">86</div>
              <div class="kpi-key">이번달 레슨</div>
            </div>
          </div>

          <!-- 캘린더 + 타임라인 -->
          <div class="cal-layout">
            <!-- 달력 -->
            <div class="card">
              <div class="cal-nav-row">
                <span class="cal-month-lbl" id="calMonthLbl">2026년 3월</span>
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
              <div class="cal-grid" id="calDays"></div>

              <div class="plat-legend">
                <div class="plat-legend-item">
                  <div class="plat-legend-dot" style="background:#7c6af7"></div> 필라테스
                </div>
                <div class="plat-legend-item">
                  <div class="plat-legend-dot" style="background:#4fd1c5"></div> 요가
                </div>
                <div class="plat-legend-item">
                  <div class="plat-legend-dot" style="background:#f6ad55"></div> 음악
                </div>
              </div>
            </div>

            <!-- 타임라인 -->
            <div class="card">
              <div class="timeline-header">
                <div>
                  <span class="timeline-date" id="tlDate">3월 11일</span>
                  <span class="timeline-dow" id="tlDow">화요일 · 오늘</span>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="showPage('attend', document.querySelectorAll('#admin-nav .nav-item')[1])">출결 처리 →</button>
              </div>
              <div class="timeline" id="timeline">
                <!-- JS 렌더 -->
              </div>
            </div>
          </div>
        </div>

        <!-- ══ 출결 관리 ══ -->
        <div class="page" id="admin-attend">
          <div class="page-header">
            <div class="page-label">ATTENDANCE</div>
            <div class="page-title">출결 관리</div>
            <div class="page-subtitle">수강생 출석을 확인하고 처리하세요</div>
          </div>

          <div class="attend-layout">
            <!-- 테이블 -->
            <div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                <span style="font-size:15px;font-weight:700;flex:1;" id="attendDateLabel">2026년 3월 11일 화요일</span>
                <div style="display:flex;gap:6px;flex-wrap:wrap;" id="attendFilterRow">
                  <button class="filter-chip active" onclick="attendFilter(this,'all')">전체</button>
                  <button class="filter-chip" onclick="attendFilter(this,'그룹반 A')">그룹반 A</button>
                  <button class="filter-chip" onclick="attendFilter(this,'그룹반 B')">그룹반 B</button>
                  <button class="filter-chip" onclick="attendFilter(this,'개인레슨')">개인레슨</button>
                </div>
              </div>

              <div class="card" style="padding:0;overflow:hidden;">
                <div style="overflow-x:auto;">
                  <table class="attend-table" id="attendTable">
                    <thead>
                    <tr>
                      <th>수강생</th>
                      <th>프로그램</th>
                      <th>플랫폼</th>
                      <th>시간</th>
                      <th>출결</th>
                    </tr>
                    </thead>
                    <tbody id="attendTbody">
                    <!-- JS 렌더 -->
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- 요약 사이드 -->
            <div class="attend-summary">
              <div class="card">
                <div class="card-title">오늘 출결 현황</div>
                <div class="attend-stat-grid">
                  <div class="attend-stat">
                    <div class="attend-stat-val" style="color:var(--green)" id="sumPresent">0</div>
                    <div class="attend-stat-key">출석</div>
                  </div>
                  <div class="attend-stat">
                    <div class="attend-stat-val" style="color:var(--accent3)" id="sumLate">0</div>
                    <div class="attend-stat-key">지각</div>
                  </div>
                  <div class="attend-stat">
                    <div class="attend-stat-val" style="color:var(--red)" id="sumAbsent">0</div>
                    <div class="attend-stat-key">결석</div>
                  </div>
                  <div class="attend-stat">
                    <div class="attend-stat-val" style="color:var(--text-sub)" id="sumPending">6</div>
                    <div class="attend-stat-key">미처리</div>
                  </div>
                </div>
                <div style="margin-top:14px;">
                  <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-sub);margin-bottom:6px;">
                    <span>출석률</span><span id="sumRate" style="color:var(--green);font-weight:700;">0%</span>
                  </div>
                  <div class="attend-rate-bar">
                    <div class="attend-rate-fill" id="sumRateBar" style="width:0%"></div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card-title">이번달 통계</div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:var(--text-sub);">총 레슨</span>
                    <span style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;">86회</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:var(--text-sub);">평균 출석률</span>
                    <span style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--green);">93%</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:var(--text-sub);">총 수강생 수</span>
                    <span style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;">24명</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:13px;color:var(--text-sub);">결석 처리</span>
                    <span style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--red);">5건</span>
                  </div>
                </div>
              </div>

              <button class="btn btn-primary" style="width:100%;background:var(--accent);color:#0f0f13;" onclick="saveAttend()">출결 저장하기</button>
            </div>
          </div>
        </div>

        <!-- ══ 일정 변경 요청 ══ -->
        <div class="page" id="admin-request">
          <div class="page-header">
            <div class="page-label">SCHEDULE REQUEST</div>
            <div class="page-title">일정 변경 요청</div>
            <div class="page-subtitle">수강생 또는 개인 사정으로 인한 일정 변경을 요청하세요</div>
          </div>

          <!-- 새 요청 폼 -->
          <div class="card" style="margin-bottom:24px;">
            <div class="card-title">📝 새 변경 요청 작성</div>
            <div class="form-grid">
              <div class="form-field">
                <label>수강생</label>
                <select id="reqStudent">
                  <option>홍길동</option><option>김민지</option><option>박서준</option>
                  <option>이나은</option><option>정하준</option>
                </select>
              </div>
              <div class="form-field">
                <label>프로그램</label>
                <select id="reqProgram">
                  <option>1:1 개인 레슨</option><option>그룹반 A</option><option>그룹반 B</option>
                </select>
              </div>
              <div class="form-field">
                <label>기존 일정</label>
                <input type="datetime-local" id="reqFrom" value="2026-03-11T10:00">
              </div>
              <div class="form-field">
                <label>변경 희망 일정</label>
                <input type="datetime-local" id="reqTo" value="2026-03-14T14:00">
              </div>
            </div>
            <div class="form-field" style="margin-bottom:16px;">
              <label>변경 사유</label>
              <textarea id="reqReason" placeholder="변경이 필요한 이유를 상세히 작성해주세요..."></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
              <button class="btn btn-ghost" onclick="clearReqForm()">초기화</button>
              <button class="btn btn-primary" style="background:var(--accent);color:#0f0f13;" onclick="submitRequest()">요청 제출</button>
            </div>
          </div>

          <!-- 요청 이력 -->
          <div class="card-title" style="margin-bottom:14px;">요청 이력</div>
          <div id="reqList">
            <!-- JS 렌더 -->
          </div>
        </div>

        <!-- ══ 내 정보 ══ -->
        <div class="page" id="admin-mypage">
          <div class="page-header">
            <div class="page-label">MY PAGE</div>
            <div class="page-title">내 정보</div>
            <div class="page-subtitle">계정 정보와 소속 플랫폼 현황을 확인하세요</div>
          </div>

          <!-- 프로필 히어로 -->
          <div class="hero">
            <div class="hero-avatar">이</div>
            <div class="hero-info">
              <div class="hero-name">이수진 트레이너</div>
              <div class="hero-email">lee.sujin@reservehub.kr · 010-1234-5678</div>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <div class="hstat-val">2</div>
                <div class="hstat-key">소속 플랫폼</div>
              </div>
              <div class="hero-stat">
                <div class="hstat-val" style="color:var(--green)">24</div>
                <div class="hstat-key">담당 수강생</div>
              </div>
              <div class="hero-stat">
                <div class="hstat-val" style="color:var(--accent3)">86</div>
                <div class="hstat-key">이번달 레슨</div>
              </div>
              <div class="hero-stat">
                <div class="hstat-val" style="color:var(--green)">93%</div>
                <div class="hstat-key">출결률</div>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm">✏️ 정보 수정</button>
          </div>

          <div class="mypage-grid">
            <!-- 소속 플랫폼 -->
            <div class="card">
              <div class="card-title">소속 플랫폼</div>
              <div class="plat-item">
                <div class="plat-icon" style="background:rgba(124,106,247,.12)">🤸</div>
                <div class="plat-body">
                  <div class="plat-name">스튜디오 필라테스 강남</div>
                  <div class="plat-tags">
                    <span class="plat-tag" style="background:rgba(124,106,247,.15);color:#7c6af7">필라테스</span>
                  </div>
                  <div class="plat-sub">그룹반 A · 그룹반 B · 1:1 개인레슨 · 수강생 18명</div>
                </div>
                <span class="plat-status ps-active">재직 중</span>
              </div>
              <div class="plat-item">
                <div class="plat-icon" style="background:rgba(79,209,197,.12)">🧘</div>
                <div class="plat-body">
                  <div class="plat-name">요가라운지 홍대</div>
                  <div class="plat-tags">
                    <span class="plat-tag" style="background:rgba(79,209,197,.15);color:#4fd1c5">요가</span>
                  </div>
                  <div class="plat-sub">요가 기초반 · 요가 심화반 · 수강생 6명</div>
                </div>
                <span class="plat-status ps-active">재직 중</span>
              </div>
            </div>

            <!-- 이번주 일정 -->
            <div class="card">
              <div class="card-title">이번 주 일정</div>
              <div class="sch-item">
                <div class="sch-dot" style="background:#7c6af7"></div>
                <div class="sch-time">09:00</div>
                <div class="sch-name">그룹반 A — 필라테스</div>
                <span class="sch-badge" style="background:rgba(74,222,128,.12);color:var(--green)">오늘</span>
              </div>
              <div class="sch-item">
                <div class="sch-dot" style="background:#7c6af7"></div>
                <div class="sch-time">10:00</div>
                <div class="sch-name">홍길동 — 1:1 개인레슨</div>
                <span class="sch-badge" style="background:rgba(74,222,128,.12);color:var(--green)">오늘</span>
              </div>
              <div class="sch-item">
                <div class="sch-dot" style="background:#4fd1c5"></div>
                <div class="sch-time">14:00</div>
                <div class="sch-name">요가 기초반</div>
                <span class="sch-badge" style="background:rgba(79,209,197,.12);color:#4fd1c5">오늘</span>
              </div>
              <div class="sch-item">
                <div class="sch-dot" style="background:#7c6af7"></div>
                <div class="sch-time">10:00</div>
                <div class="sch-name">그룹반 A — 필라테스</div>
                <span class="sch-badge" style="background:var(--surface2);color:var(--text-sub)">목 3/14</span>
              </div>
              <div class="sch-item">
                <div class="sch-dot" style="background:#7c6af7"></div>
                <div class="sch-time">16:00</div>
                <div class="sch-name">김민지 — 1:1 개인레슨</div>
                <span class="sch-badge" style="background:var(--surface2);color:var(--text-sub)">금 3/15</span>
              </div>
            </div>

            <!-- 계정 정보 -->
            <div class="card">
              <div class="card-title">계정 정보</div>
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div class="form-field"><label>이름</label><input type="text" value="이수진" readonly style="opacity:.7;cursor:default;"></div>
                <div class="form-field"><label>이메일</label><input type="email" value="lee.sujin@reservehub.kr"></div>
                <div class="form-field"><label>연락처</label><input type="tel" value="010-1234-5678"></div>
                <div class="form-field"><label>소개 (Bio)</label><textarea style="min-height:60px;resize:none;">필라테스 자격증 보유 · 요가 지도사 2급 · 현장 경력 5년</textarea></div>
                <button class="btn btn-primary" style="background:var(--accent);color:#0f0f13;align-self:flex-end;" onclick="showToast('정보가 저장되었습니다.')">저장</button>
              </div>
            </div>

            <!-- 비밀번호 변경 -->
            <div class="card">
              <div class="card-title">비밀번호 변경</div>
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div class="form-field"><label>현재 비밀번호</label><input type="password" placeholder="••••••••"></div>
                <div class="form-field"><label>새 비밀번호</label><input type="password" placeholder="8자 이상"></div>
                <div class="form-field"><label>새 비밀번호 확인</label><input type="password" placeholder="동일하게 입력"></div>
                <button class="btn btn-ghost" style="align-self:flex-end;" onclick="showToast('비밀번호가 변경되었습니다.')">변경하기</button>
              </div>
            </div>
          </div>
        </div>

      </div><!-- /content -->
    </div><!-- /main -->
  </div><!-- /app -->

  <div class="toast" id="toast"></div>

  <script defer src="./TutorView.js"></script>
  </body>
  </html>

</template>

<style scoped>

</style>