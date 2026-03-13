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
    <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
      /* ── 리셋 & 변수 ── */
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg:        #0f0f13;
        --surface:   #18181f;
        --surface2:  #21212b;
        --border:    #2e2e3a;
        --accent:    #7c6af7;   /* 보라 — 사용자 */
        --accent2:   #4fd1c5;   /* 민트 */
        --accent3:   #f6ad55;   /* 오렌지 */
        --red:       #f87171;
        --green:     #4ade80;
        --text:      #e8e8f0;
        --text-sub:  #8888a0;
        --text-dim:  #55556a;
        --sw: 220px;            /* 사이드바 너비 */
        --sw-c: 60px;           /* 접힌 너비 */
        --r:  14px;
        --rs: 8px;
        --tr: .22s ease;
      }
      body { background: var(--bg); color: var(--text); font-family: 'Pretendard', sans-serif; height: 100vh; overflow: hidden; }

      /* ── 앱 레이아웃 ── */
      .app { display: flex; height: 100vh; overflow: hidden; }

      /* ── 오버레이 (모바일) ── */
      .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 100; backdrop-filter: blur(2px); }
      .overlay.open { display: block; }

      /* ── 사이드바 ── */
      .sidebar {
        width: var(--sw); min-width: var(--sw); height: 100vh;
        background: var(--surface); border-right: 1px solid var(--border);
        display: flex; flex-direction: column; transition: width var(--tr), min-width var(--tr);
        position: relative; z-index: 101; overflow: hidden;
      }
      .sidebar.collapsed { width: var(--sw-c); min-width: var(--sw-c); }
      .sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 20px 16px 16px; border-bottom: 1px solid var(--border); }
      .logo { display: flex; align-items: center; gap: 10px; overflow: hidden; }
      .logo-icon { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--accent), #a78bfa); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
      .logo-text { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; }
      .collapse-btn { background: none; border: none; color: var(--text-sub); cursor: pointer; font-size: 14px; padding: 4px; transition: color var(--tr); }
      .collapse-btn:hover { color: var(--text); }
      .sidebar.collapsed .logo-text { opacity: 0; width: 0; }
      .sidebar.collapsed .collapse-btn { transform: rotate(180deg); }

      .user-card { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--border); overflow: hidden; }
      .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #a78bfa); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
      .user-info { overflow: hidden; }
      .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; }
      .user-role { font-size: 11px; color: var(--accent); white-space: nowrap; }
      .sidebar.collapsed .user-info { display: none; }

      .nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
      .nav-item {
        display: flex; align-items: center; gap: 12px; padding: 10px 10px;
        border-radius: var(--rs); background: none; border: none; color: var(--text-sub);
        cursor: pointer; font-size: 13px; font-weight: 500; font-family: inherit;
        transition: background var(--tr), color var(--tr); width: 100%; text-align: left;
        white-space: nowrap; overflow: hidden;
      }
      .nav-item:hover { background: var(--surface2); color: var(--text); }
      .nav-item.active { background: rgba(124,106,247,.15); color: var(--accent); font-weight: 600; }
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
      .notif-dot { position: absolute; top: 2px; right: 2px; width: 7px; height: 7px; border-radius: 50%; background: var(--accent); border: 2px solid var(--surface); }
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
      .card-title { font-size: 13px; font-weight: 700; color: var(--text-sub); letter-spacing: .5px; margin-bottom: 14px; text-transform: uppercase; }

      /* ── 버튼 ── */
      .btn { padding: 8px 16px; border-radius: var(--rs); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; border: none; transition: all var(--tr); }
      .btn-primary { background: var(--accent); color: white; }
      .btn-primary:hover { opacity: .85; }
      .btn-ghost { background: none; border: 1px solid var(--border); color: var(--text-sub); }
      .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
      .btn-sm { padding: 5px 12px; font-size: 12px; }

      /* ════════════════════════════════
         캘린더 페이지
      ════════════════════════════════ */
      .cal-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }

      /* 달력 카드 */
      .cal-nav-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
      .cal-month-label { font-size: 16px; font-weight: 700; }
      .cal-nav-btns { display: flex; gap: 6px; }
      .cal-nav-btn { width: 30px; height: 30px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); cursor: pointer; font-size: 15px; display: flex; align-items: center; justify-content: center; transition: all var(--tr); }
      .cal-nav-btn:hover { background: var(--accent); border-color: var(--accent); color: white; }
      .cal-dow { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 6px; }
      .cal-dow-label { text-align: center; font-size: 11px; color: var(--text-dim); font-weight: 600; padding: 4px 0; }
      .cal-days { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
      .cal-cell {
        aspect-ratio: 1; border-radius: 8px; display: flex; flex-direction: column;
        align-items: center; justify-content: center; font-size: 13px; font-weight: 500;
        cursor: pointer; transition: all var(--tr); position: relative; gap: 2px;
        border: 1.5px solid transparent;
      }
      .cal-cell:hover { background: var(--surface2); }
      .cal-cell.dim { color: var(--text-dim); cursor: default; }
      .cal-cell.dim:hover { background: none; }
      .cal-cell.today { background: rgba(124,106,247,.15); border-color: var(--accent); color: var(--accent); font-weight: 700; }
      .cal-cell.selected { background: var(--accent); color: white; border-color: var(--accent); }
      .cal-cell.selected:hover { opacity: .9; }
      .cal-cell.has-lesson::after { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--accent2); }
      .cal-cell.today.has-lesson::after { background: var(--accent3); }
      .cal-cell.selected.has-lesson::after { background: white; }
      .cal-legend { display: flex; gap: 16px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
      .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-sub); }
      .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

      /* 오른쪽 패널 */
      .cal-right { display: flex; flex-direction: column; gap: 16px; }

      /* 오늘 레슨 */
      .lesson-list { display: flex; flex-direction: column; gap: 10px; }
      .lesson-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--surface2); border-radius: var(--rs); border-left: 3px solid var(--accent); }
      .lesson-time { font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; color: var(--accent); min-width: 42px; }
      .lesson-body { flex: 1; min-width: 0; }
      .lesson-name { font-size: 13px; font-weight: 600; }
      .lesson-place { font-size: 11px; color: var(--text-sub); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .lesson-tag { font-size: 10px; padding: 3px 8px; border-radius: 20px; background: rgba(124,106,247,.15); color: var(--accent); white-space: nowrap; font-weight: 600; }
      .lesson-tag.music { background: rgba(246,173,85,.15); color: var(--accent3); }

      /* 선택된 날 상세 */
      .day-detail { background: var(--surface2); border-radius: var(--rs); padding: 14px; }
      .day-detail-header { font-size: 12px; color: var(--text-sub); margin-bottom: 10px; }
      .day-event-list { display: flex; flex-direction: column; gap: 8px; }
      .day-event { display: flex; align-items: center; gap: 10px; }
      .day-event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .day-event-time { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text-sub); min-width: 40px; }
      .day-event-name { font-size: 13px; font-weight: 500; }
      .no-event { font-size: 13px; color: var(--text-dim); text-align: center; padding: 12px 0; }

      /* 타이머 */
      .timer-type-row { display: flex; gap: 6px; margin-bottom: 16px; }
      .type-btn { flex: 1; padding: 7px 6px; border-radius: var(--rs); background: var(--surface2); border: 1px solid var(--border); color: var(--text-sub); font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all var(--tr); }
      .type-btn.active { background: rgba(124,106,247,.2); border-color: var(--accent); color: var(--accent); }
      .timer-digits { font-family: 'DM Mono', monospace; font-size: 38px; font-weight: 500; text-align: center; letter-spacing: 2px; color: var(--text); margin: 4px 0 6px; }
      .timer-label { text-align: center; font-size: 10px; letter-spacing: 3px; color: var(--text-dim); margin-bottom: 16px; }
      .timer-btn-row { display: flex; gap: 8px; margin-bottom: 16px; }
      .timer-btn-row button { flex: 1; padding: 10px; border-radius: var(--rs); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; border: none; transition: all var(--tr); }
      .timer-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
      .timer-stat { background: var(--surface2); border-radius: var(--rs); padding: 10px; text-align: center; }
      .timer-stat-val { font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 500; color: var(--accent); }
      .timer-stat-key { font-size: 10px; color: var(--text-dim); margin-top: 3px; }

      /* 최근이력 */
      .history-list { display: flex; flex-direction: column; gap: 8px; }
      .history-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--surface2); border-radius: var(--rs); }
      .history-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .history-date { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-dim); min-width: 80px; }
      .history-name { flex: 1; font-size: 13px; font-weight: 500; }
      .history-dur { font-size: 11px; color: var(--text-sub); white-space: nowrap; }

      /* ════════════════════════════════
         예약하기 페이지
      ════════════════════════════════ */
      .res-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
      .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
      .filter-chip { padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border); background: none; color: var(--text-sub); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all var(--tr); }
      .filter-chip:hover { border-color: var(--accent); color: var(--accent); }
      .filter-chip.active { background: rgba(124,106,247,.15); border-color: var(--accent); color: var(--accent); }
      .program-list { display: flex; flex-direction: column; gap: 8px; }
      .program-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--r); cursor: pointer; transition: all var(--tr); }
      .program-card:hover { border-color: var(--accent); }
      .program-card.selected { border-color: var(--accent); background: rgba(124,106,247,.08); }
      .program-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
      .program-body { flex: 1; min-width: 0; }
      .program-name { font-size: 14px; font-weight: 700; }
      .program-meta { font-size: 11px; color: var(--text-sub); margin-top: 3px; }
      .prog-badge { font-size: 10px; padding: 3px 9px; border-radius: 20px; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
      .badge-group   { background: rgba(124,106,247,.15); color: var(--accent); }
      .badge-private { background: rgba(79,209,197,.15);  color: var(--accent2); }
      .badge-room    { background: rgba(246,173,85,.15);  color: var(--accent3); }

      /* 슬롯 패널 */
      .slot-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .slot-panel-date { font-size: 14px; font-weight: 700; }
      .slot-panel-sub { font-size: 11px; color: var(--text-sub); }
      .slot-nav-row { display: flex; gap: 6px; margin-bottom: 14px; }
      .slot-nav-btn { flex: 1; padding: 7px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--rs); color: var(--text-sub); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all var(--tr); text-align: center; }
      .slot-nav-btn.active { background: rgba(124,106,247,.15); border-color: var(--accent); color: var(--accent); }
      .slot-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
      .slot-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: var(--surface2); border: 1.5px solid transparent; border-radius: var(--rs); cursor: pointer; transition: all var(--tr); }
      .slot-item:hover:not(.full) { border-color: var(--accent); }
      .slot-item.selected-slot { border-color: var(--accent); background: rgba(124,106,247,.1); }
      .slot-item.full { opacity: .5; cursor: not-allowed; }
      .slot-time { font-family: 'DM Mono', monospace; font-size: 13px; min-width: 90px; }
      .slot-bar-wrap { flex: 1; }
      .slot-bar-bg { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
      .slot-bar { height: 100%; background: var(--accent2); border-radius: 3px; transition: width .3s; }
      .slot-count { font-size: 11px; color: var(--text-dim); margin-top: 3px; }
      .slot-status { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
      .status-open { background: rgba(74,222,128,.12); color: var(--green); }
      .status-few  { background: rgba(246,173,85,.12);  color: var(--accent3); }
      .status-full { background: rgba(248,113,113,.12); color: var(--red); }

      /* 예약 확정 */
      .confirm-box { border-top: 1px solid var(--border); padding-top: 14px; margin-top: 4px; }
      .confirm-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-sub); margin-bottom: 8px; }
      .confirm-row strong { color: var(--text); font-weight: 600; }
      .btn-confirm { width: 100%; padding: 12px; margin-top: 12px; border-radius: var(--r); background: linear-gradient(135deg, var(--accent), #a78bfa); border: none; color: white; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity var(--tr); }
      .btn-confirm:hover { opacity: .88; }
      .btn-confirm:disabled { opacity: .4; cursor: not-allowed; }

      /* ════════════════════════════════
         마이페이지
      ════════════════════════════════ */
      .mypage-hero { display: flex; align-items: center; gap: 16px; padding: 20px; background: linear-gradient(135deg, rgba(124,106,247,.15), rgba(79,209,197,.08)); border: 1px solid rgba(124,106,247,.25); border-radius: var(--r); margin-bottom: 20px; }
      .mypage-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #a78bfa); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; flex-shrink: 0; }
      .mypage-info { flex: 1; }
      .mypage-name { font-size: 18px; font-weight: 700; }
      .mypage-email { font-size: 12px; color: var(--text-sub); margin-top: 4px; }
      .mypage-tags { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
      .mypage-tag { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(124,106,247,.12); color: var(--accent); font-weight: 600; }
      .mypage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .mypage-stat-card { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); }
      .mypage-stat-val { font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 500; color: var(--accent); }
      .mypage-stat-key { font-size: 11px; color: var(--text-sub); margin-top: 4px; }
      .platform-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
      .platform-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); }
      .platform-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
      .platform-body { flex: 1; min-width: 0; }
      .platform-name { font-size: 14px; font-weight: 600; }
      .platform-meta { font-size: 11px; color: var(--text-sub); margin-top: 2px; }
      .platform-remain { font-family: 'DM Mono', monospace; text-align: right; }
      .platform-remain-num { font-size: 18px; font-weight: 600; color: var(--accent2); }
      .platform-remain-label { font-size: 10px; color: var(--text-dim); }
      .platform-status { font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 600; }
      .ps-active { background: rgba(74,222,128,.12); color: var(--green); }
      .ps-soon   { background: rgba(246,173,85,.12);  color: var(--accent3); }
      .ps-exp    { background: rgba(248,113,113,.12); color: var(--red); }
      .res-list { display: flex; flex-direction: column; gap: 10px; }
      .res-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); }
      .res-date-block { min-width: 40px; text-align: center; }
      .res-day { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 600; color: var(--accent); line-height: 1; }
      .res-mon { font-size: 10px; color: var(--text-sub); }
      .res-divider { width: 1px; height: 32px; background: var(--border); }
      .res-body { flex: 1; }
      .res-name { font-size: 13px; font-weight: 600; }
      .res-time { font-size: 11px; color: var(--text-sub); margin-top: 3px; }
      .res-status { font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
      .rs-upcoming { background: rgba(124,106,247,.12); color: var(--accent); }
      .rs-done     { background: rgba(136,136,160,.1);  color: var(--text-sub); }
      .rs-cancel   { background: rgba(248,113,113,.12); color: var(--red); }

      /* ── 반응형 ── */
      @media (max-width: 900px) {
        .cal-grid { grid-template-columns: 1fr; }
        .res-grid { grid-template-columns: 1fr; }
        .mypage-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 768px) {
        .sidebar { position: fixed; left: -100%; z-index: 200; transition: left var(--tr); width: var(--sw) !important; min-width: var(--sw) !important; }
        .sidebar.open { left: 0; }
        .sidebar.collapsed { left: -100%; }
        .hamburger { display: flex; }
        .collapse-btn { display: none; }
        .sidebar .logo-text { opacity: 1 !important; width: auto !important; }
        .sidebar .user-info { display: block !important; }
        .sidebar .nav-label { display: inline !important; }
        .sidebar .nav-item { justify-content: flex-start !important; }
      }
      @media (max-width: 600px) {
        .content { padding: 16px; }
        .mypage-grid { grid-template-columns: 1fr 1fr; }
        .timer-stats { grid-template-columns: repeat(3,1fr); }
      }

      /* 예약 완료 토스트 */
      .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--surface); border: 1px solid var(--accent); border-radius: var(--r); padding: 14px 24px; font-size: 14px; font-weight: 600; color: var(--accent); z-index: 999; transition: transform .3s ease, opacity .3s ease; opacity: 0; pointer-events: none; white-space: nowrap; }
      .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
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
                <div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div> 오늘</div>
                <div class="legend-item"><div class="legend-dot" style="background:var(--accent2)"></div> 예약 있음</div>
                <div class="legend-item"><div class="legend-dot" style="background:var(--accent3)"></div> 오늘+예약</div>
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
                  <button id="timerToggleBtn" onclick="toggleTimer()" style="background:var(--accent);color:white;">시작</button>
                  <button onclick="resetTimer()" style="background:var(--surface2);color:var(--text-sub);border:1px solid var(--border);">초기화</button>
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
                  <div class="confirm-row"><span>잔여석</span><strong id="confirmRemain" style="color:var(--accent2)">—</strong></div>
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