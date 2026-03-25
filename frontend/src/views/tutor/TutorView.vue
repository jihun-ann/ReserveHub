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

  <div class="toast" id="toast"></div>

  <script defer src="./TutorView.js"></script>
  </body>
  </html>

</template>
<style scoped>

</style>