<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ReserveHub — 사용자 + 일반관리자</title>
<link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #0f0f13;
  --surface: #18181f;
  --surface2: #21212b;
  --border: #2e2e3a;
  --accent: #7c6af7;
  --accent2: #4fd1c5;
  --accent3: #f6ad55;
  --red: #f87171;
  --green: #4ade80;
  --text: #e8e8f0;
  --text-sub: #8888a0;
  --text-dim: #55556a;
  --sidebar-w: 220px;
  --sidebar-collapsed: 60px;
  --radius: 14px;
  --radius-sm: 8px;
  --transition: 0.22s ease;
}

* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Pretendard',-apple-system,sans-serif; background:var(--bg); color:var(--text); min-height:100vh; overflow-x:hidden; }

/* ═══════════════════ LAYOUT ═══════════════════ */
.app { display:flex; min-height:100vh; }

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  position: fixed; top:0; left:0; height:100vh;
  z-index: 200;
  transition: width var(--transition);
  overflow: hidden;
}
.sidebar.collapsed { width: var(--sidebar-collapsed); }

.logo {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 16px 20px 20px;
  border-bottom: 1px solid var(--border);
  min-height: 65px;
  flex-shrink: 0;
}
.logo-texts { overflow:hidden; white-space:nowrap; }
.logo-mark { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:3px; color:var(--accent); text-transform:uppercase; margin-bottom:2px; }
.logo-name  { font-size:17px; font-weight:700; }
.sidebar.collapsed .logo-texts { display:none; }

.collapse-btn {
  width:28px; height:28px; flex-shrink:0;
  background:var(--surface2); border:1px solid var(--border); border-radius:6px;
  cursor:pointer; display:flex;align-items:center;justify-content:center;
  color:var(--text-sub); font-size:13px; transition:all 0.15s;
}
.collapse-btn:hover { color:var(--accent); border-color:var(--accent); }

.nav { padding:14px 8px; flex:1; display:flex; flex-direction:column; gap:3px; overflow:hidden; }
.nav-item {
  display:flex; align-items:center; gap:10px;
  padding:11px 14px; border-radius:var(--radius-sm);
  cursor:pointer; color:var(--text-sub); font-size:13px; font-weight:500;
  border:none; background:none; width:100%; text-align:left;
  transition:all 0.15s; white-space:nowrap; overflow:hidden;
}
.nav-item:hover { background:var(--surface2); color:var(--text); }
.nav-item.active { background:rgba(124,106,247,0.15); color:var(--accent); }
.nav-icon { font-size:16px; width:20px; text-align:center; flex-shrink:0; }
.nav-label { overflow:hidden; }
.sidebar.collapsed .nav-label { display:none; }
.sidebar.collapsed .nav-item { justify-content:center; padding:11px; }

.sidebar-footer { padding:10px 8px; border-top:1px solid var(--border); flex-shrink:0; }
.user-pill {
  display:flex; align-items:center; gap:10px;
  padding:9px 10px; background:var(--surface2); border-radius:var(--radius-sm);
  overflow:hidden; white-space:nowrap;
}
.sidebar.collapsed .user-pill { justify-content:center; padding:9px; }
.sidebar.collapsed .user-info { display:none; }
.avatar { width:30px;height:30px; background:linear-gradient(135deg,var(--accent),var(--accent2)); border-radius:50%; display:flex;align-items:center;justify-content:center; font-size:12px;font-weight:700;color:white; flex-shrink:0; }
.user-name { font-size:13px;font-weight:600; }
.user-role { font-size:11px;color:var(--text-sub); }

/* ── Main ── */
.main {
  margin-left: var(--sidebar-w);
  flex:1; padding: 36px 40px; min-height:100vh;
  transition: margin-left var(--transition);
}
.sidebar.collapsed ~ .main { margin-left: var(--sidebar-collapsed); }

.page { display:none; }
.page.active { display:block; }

/* hamburger mobile */
.hamburger { display:none; position:fixed;top:14px;left:14px;z-index:300; width:36px;height:36px; background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);align-items:center;justify-content:center;cursor:pointer;font-size:16px; }
.sidebar-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:150; }

/* ═══════════════════ COMMON ═══════════════════ */
.page-header { margin-bottom:28px; }
.page-label { font-family:'DM Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--accent);text-transform:uppercase;margin-bottom:5px; }
.page-title  { font-size:24px;font-weight:700; }
.page-subtitle { font-size:13px;color:var(--text-sub);margin-top:3px; }

.card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:22px; }
.card-title { font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px; }

.btn { padding:9px 18px;border-radius:var(--radius-sm);border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:'Pretendard',sans-serif;transition:all 0.15s; }
.btn-primary { background:var(--accent);color:white; }
.btn-primary:hover { background:#6b5ce7; }
.btn-ghost   { background:var(--surface2);color:var(--text-sub);border:1px solid var(--border); }
.btn-ghost:hover { color:var(--text);border-color:var(--text-sub); }
.btn-danger  { background:rgba(248,113,113,0.15);color:var(--red);border:1px solid rgba(248,113,113,0.3); }
.btn-danger:hover { background:rgba(248,113,113,0.25); }
.btn-sm { padding:6px 12px; font-size:12px; }

/* ═══════════════════════════════════════════════
   PAGE: 마이페이지 (수정)
══════════════════════════════════════════════════ */

/* 프로필 상단 1줄 */
.mypage-hero {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.hero-avatar {
  width:60px;height:60px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));
  border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:24px;font-weight:700;color:white;flex-shrink:0;
}
.hero-identity { flex:0 0 160px; }
.hero-name  { font-size:18px;font-weight:700; }
.hero-email { font-size:12px;color:var(--text-sub);margin-top:3px; }

.hero-divider { width:1px;height:48px;background:var(--border);flex-shrink:0; }

.hero-stats { display:flex;gap:0;flex:1; }
.hero-stat { flex:1;text-align:center;padding:0 16px; }
.hero-stat + .hero-stat { border-left:1px solid var(--border); }
.hstat-val { font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:var(--accent); }
.hstat-key { font-size:10px;color:var(--text-dim);margin-top:3px; }

.hero-edit { flex-shrink:0; margin-left:auto; }

/* 마이페이지 본문 그리드 */
.mypage-body { display:grid;grid-template-columns:1fr 1fr;gap:20px; }

.platform-item { display:flex;align-items:flex-start;gap:12px;padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);margin-bottom:9px; }
.platform-item:last-child { margin-bottom:0; }
.plat-emoji { width:40px;height:40px;background:var(--surface);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0; }
.plat-detail { flex:1; }
.plat-name { font-size:14px;font-weight:700; }
.plat-tag { display:inline-block;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;margin:3px 0 5px; }
.plat-dates { font-size:11px;color:var(--text-sub); }
.billing-row { display:flex;align-items:center;gap:7px;margin-top:5px;flex-wrap:wrap; }
.billing-badge { font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;background:rgba(246,173,85,0.15);color:var(--accent3); }
.billing-date  { font-family:'DM Mono',monospace;font-size:12px;color:var(--accent3); }
.billing-amt   { font-size:11px;color:var(--text-sub); }
.plat-status { font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;flex-shrink:0; }
.ps-active  { background:rgba(74,222,128,0.12);color:var(--green); }
.ps-expired { background:rgba(248,113,113,0.12);color:var(--red); }

.res-hist { display:flex;flex-direction:column;gap:7px; }
.res-item { display:flex;align-items:center;gap:12px;padding:11px 14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border); }
.res-date { font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);width:88px;flex-shrink:0; }
.res-name { font-size:13px;flex:1; }
.res-status { font-size:10px;padding:3px 10px;border-radius:20px;font-weight:600; }
.rs-confirmed { background:rgba(74,222,128,0.12);color:var(--green); }
.rs-completed { background:rgba(124,106,247,0.12);color:var(--accent); }
.rs-canceled  { background:rgba(248,113,113,0.12);color:var(--red); }

/* ═══════════════════════════════════════════════
   ADMIN LAYOUT (별도 앱 분리 느낌)
══════════════════════════════════════════════════ */
.admin-wrap { display:none; }
.admin-wrap.active { display:flex; }

/* admin sidebar 색 오버라이드 */
.admin-sidebar { --accent: #4fd1c5; }
.admin-sidebar .logo-mark { color:var(--accent2); }
.admin-sidebar .nav-item.active { background:rgba(79,209,197,0.15);color:var(--accent2); }
.admin-sidebar .avatar { background:linear-gradient(135deg,var(--accent2),#667eea); }

/* ═══════════════════════════════════════════════
   ADMIN PAGE: 캘린더 (일반관리자)
══════════════════════════════════════════════════ */
.admin-cal-layout { display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start; }

/* mini cal */
.cal-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:18px; }
.cal-month  { font-size:19px;font-weight:700; }
.cal-nav    { display:flex;gap:7px; }
.cal-btn    { width:30px;height:30px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-sub);font-size:14px;transition:all 0.15s; }
.cal-btn:hover { border-color:var(--accent2);color:var(--accent2); }

.cal-days-header { display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:5px; }
.cal-day-label   { text-align:center;font-size:10px;font-weight:600;color:var(--text-dim);padding:5px 0;letter-spacing:1px; }
.cal-days        { display:grid;grid-template-columns:repeat(7,1fr);gap:3px; }

.cal-day {
  aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  border-radius:var(--radius-sm);cursor:pointer;position:relative;
  transition:background 0.15s;font-size:13px;font-weight:500;gap:3px;
}
.cal-day:hover { background:var(--surface2); }
.cal-day.dim    { color:var(--text-dim);cursor:default; }
.cal-day.dim:hover { background:transparent; }
.day-num  { line-height:1; }
.day-dots { display:flex;gap:2px;height:4px;align-items:center; }
.dot      { width:4px;height:4px;border-radius:50%;flex-shrink:0; }

.cal-day.today .day-num {
  background:var(--accent2);color:white;
  width:24px;height:24px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;
}
.cal-day.selected { background:rgba(79,209,197,0.15); }
.cal-day.selected .day-num { color:var(--accent2);font-weight:700; }

/* 일정 상세 */
.day-detail { margin-top:18px;padding-top:18px;border-top:1px solid var(--border); }
.day-detail-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:12px; }
.day-detail-title  { font-size:14px;font-weight:700; }
.day-detail-date   { font-family:'DM Mono',monospace;font-size:11px;color:var(--text-sub); }
.day-events { display:flex;flex-direction:column;gap:7px; }
.day-event-item { display:flex;align-items:center;gap:12px;padding:11px 13px;background:var(--surface2);border-radius:var(--radius-sm);border-left:3px solid transparent; }
.event-time { font-family:'DM Mono',monospace;font-size:11px;width:42px;flex-shrink:0; }
.event-info { flex:1; }
.event-name { font-size:13px;font-weight:600; }
.event-sub  { font-size:11px;color:var(--text-sub);margin-top:2px; }
.event-badge { font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;flex-shrink:0; }
.no-event { font-size:13px;color:var(--text-dim);text-align:center;padding:18px 0; }

/* 플랫폼 칩 */
.plat-chip {
  display:inline-flex;align-items:center;gap:4px;
  font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;
  border:1px solid transparent;white-space:nowrap;flex-shrink:0;
}

/* 오른쪽 패널 */
.admin-cal-right { display:flex;flex-direction:column;gap:18px; }

/* 오늘 일정 요약 카드 */
.today-summary {
  display:grid;grid-template-columns:repeat(3,1fr);gap:0;
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
  overflow:hidden;margin-bottom:20px;
}
.summary-cell { padding:18px 14px;text-align:center; }
.summary-cell + .summary-cell { border-left:1px solid var(--border); }
.summary-val { font-family:'DM Mono',monospace;font-size:24px;font-weight:500; }
.summary-key { font-size:10px;color:var(--text-dim);margin-top:3px;letter-spacing:1px; }

/* 오늘 스케줄 리스트 */
.schedule-list { display:flex;flex-direction:column;gap:9px; }
.schedule-item {
  background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
  padding:14px;display:flex;align-items:flex-start;gap:12px;
  border-left:3px solid var(--accent2);
  position:relative;
}
.sch-time { font-family:'DM Mono',monospace;font-size:12px;color:var(--accent2);width:38px;flex-shrink:0;margin-top:1px; }
.sch-info { flex:1; }
.sch-name { font-size:14px;font-weight:700; }
.sch-meta { font-size:12px;color:var(--text-sub);margin-top:3px; }
.sch-actions { display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap; }

/* ═══════════════════════════════════════════════
   ADMIN PAGE: 출석 관리
══════════════════════════════════════════════════ */
.attend-layout { display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start; }

/* 날짜/필터 바 */
.attend-filter { display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap; }
.attend-date { font-size:15px;font-weight:700;flex:1; }
.filter-chip { padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:none;color:var(--text-sub);font-size:12px;font-weight:500;cursor:pointer;font-family:'Pretendard',sans-serif;transition:all 0.15s; }
.filter-chip.active { background:rgba(79,209,197,0.15);border-color:var(--accent2);color:var(--accent2); }

/* 수강생 출석 테이블 */
.attend-table { width:100%;border-collapse:collapse; }
.attend-table th { font-size:11px;font-weight:600;color:var(--text-sub);text-transform:uppercase;letter-spacing:1px;padding:8px 12px;text-align:left;border-bottom:1px solid var(--border); }
.attend-table td { padding:12px 12px;border-bottom:1px solid var(--border);font-size:13px;vertical-align:middle; }
.attend-table tr:last-child td { border-bottom:none; }
.attend-table tr:hover td { background:rgba(255,255,255,0.02); }

.student-name { font-weight:600; }
.student-sub  { font-size:11px;color:var(--text-sub);margin-top:1px; }

.attend-toggle {
  display:flex;gap:4px;
}
.atbtn {
  padding:5px 11px;border-radius:6px;border:1px solid var(--border);
  background:none;color:var(--text-dim);font-size:11px;font-weight:600;cursor:pointer;
  font-family:'Pretendard',sans-serif;transition:all 0.15s;
}
.atbtn.present { background:rgba(74,222,128,0.15);border-color:rgba(74,222,128,0.4);color:var(--green); }
.atbtn.absent  { background:rgba(248,113,113,0.15);border-color:rgba(248,113,113,0.4);color:var(--red); }
.atbtn.late    { background:rgba(246,173,85,0.15);border-color:rgba(246,173,85,0.4);color:var(--accent3); }

/* 통계 사이드 */
.attend-stats { display:flex;flex-direction:column;gap:14px; }
.stat-row { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border); }
.stat-row:last-child { border-bottom:none; }
.stat-label { font-size:13px;color:var(--text-sub); }
.stat-value { font-family:'DM Mono',monospace;font-size:14px;font-weight:500; }

/* ═══════════════════════════════════════════════
   ADMIN PAGE: 일정 변경 요청
══════════════════════════════════════════════════ */
.request-list { display:flex;flex-direction:column;gap:12px; }
.request-card {
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;
}
.req-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:12px; }
.req-title  { font-size:14px;font-weight:700; }
.req-status-badge { font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600; }
.rs-pending  { background:rgba(246,173,85,0.15);color:var(--accent3); }
.rs-approved { background:rgba(74,222,128,0.12);color:var(--green); }
.rs-rejected { background:rgba(248,113,113,0.12);color:var(--red); }

.req-body { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px; }
.req-field { background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px; }
.req-field-label { font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px; }
.req-field-val   { font-size:13px;font-weight:600; }
.req-reason { background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px; }
.req-reason-text { font-size:13px;color:var(--text-sub);line-height:1.5; }

.req-actions { display:flex;gap:8px;justify-content:flex-end; }

/* 새 요청 폼 */
.request-form { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:22px;margin-bottom:20px; }
.form-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px; }
.form-field label { display:block;font-size:11px;color:var(--text-sub);margin-bottom:6px;letter-spacing:1px;text-transform:uppercase; }
.form-field input,
.form-field select,
.form-field textarea {
  width:100%;padding:10px 12px;
  background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);
  color:var(--text);font-size:13px;font-family:'Pretendard',sans-serif;
  outline:none;transition:border 0.15s;
}
.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus { border-color:var(--accent2); }
.form-field textarea { resize:vertical;min-height:72px; }
.form-field select option { background:var(--surface2); }

/* ═══════════════════ RESPONSIVE ═══════════════════ */
@media (max-width:1100px) {
  .admin-cal-layout { grid-template-columns:1fr; }
  .admin-cal-right { display:grid;grid-template-columns:1fr 1fr;gap:18px; }
  .attend-layout { grid-template-columns:1fr; }
  .mypage-body { grid-template-columns:1fr; }
}

@media (max-width:768px) {
  .sidebar { transform:translateX(-100%);width:220px !important; }
  .sidebar.open { transform:translateX(0); }
  .sidebar-overlay.open { display:block; }
  .hamburger { display:flex; }
  .main, .admin-main { margin-left:0 !important; padding:60px 16px 24px; }
  .admin-cal-right { grid-template-columns:1fr; }
  .today-summary  { grid-template-columns:1fr 1fr; }
  .form-grid, .req-body { grid-template-columns:1fr; }
  .mypage-hero { flex-direction:column;align-items:flex-start; }
  .hero-divider { display:none; }
  .hero-stats { width:100%;flex-wrap:wrap; }
  .hero-stat { flex:0 0 50%; border:none;border-bottom:1px solid var(--border);padding:8px 0; }
  .hero-edit { margin-left:0; }
}

/* ── 레이아웃 깨짐 수정 ── */

/* 출석 테이블 가로 스크롤 */
.attend-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.attend-table {
  min-width: 560px;
}

/* 요청 폼 / 카드 최소 너비 보호 */
.request-form,
.request-card {
  min-width: 0;
  overflow: hidden;
}

/* form-grid 최소 너비 깨짐 방지 */
.form-grid {
  min-width: 0;
}
.form-field input,
.form-field select,
.form-field textarea {
  min-width: 0;
  max-width: 100%;
}

/* req-body 카드 내부 텍스트 말줄임 */
.req-field-val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 타임라인 모바일 */
@media (max-width: 600px) {
  .form-grid  { grid-template-columns: 1fr; }
  .req-body   { grid-template-columns: 1fr; }
  .mypage-body { grid-template-columns: 1fr; }
}


/* ══ 슈퍼관리자 전용 ══ */
.super-sidebar .nav-item.active { background:rgba(246,173,85,0.15);color:#f6ad55; }
.super-sidebar .collapse-btn:hover { border-color:#f6ad55;color:#f6ad55; }

.plat-tab {
  padding:11px 18px;border:none;background:none;color:var(--text-sub);
  font-size:13px;font-weight:500;cursor:pointer;font-family:'Pretendard',sans-serif;
  border-bottom:2px solid transparent;white-space:nowrap;transition:all 0.15s;flex-shrink:0;
}
.plat-tab:hover { color:var(--text); }
.plat-tab.active { color:#f6ad55;border-bottom-color:#f6ad55; }

.platform-list-item { transition:background 0.15s; }
.platform-list-item:hover { background:var(--surface2); }
.platform-list-item.active { background:rgba(124,106,247,0.08)!important; }

@media(max-width:900px) {
  #super-platforms > div > div:first-child { display:none; }
  #super-platforms > div { grid-template-columns:1fr; }
}
@media(max-width:768px) {
  .today-summary { grid-template-columns:1fr 1fr; }
}


/* ══ 서브슈퍼관리자 전용 ══ */
.subsup-sidebar .nav-item.active { background:rgba(79,209,197,0.15); color:#4fd1c5; }
.subsup-sidebar .collapse-btn:hover { border-color:#4fd1c5; color:#4fd1c5; }
.subsup-plat-tab { transition: all 0.15s; }
.subsup-plat-tab:hover { background: var(--surface2) !important; }
.subsup-plat-tab.active { background: rgba(124,106,247,0.15) !important; }


  /* ══ USER: 캘린더 ══ */
  .calendar-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; }
  .cal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .cal-month { font-size:18px; font-weight:700; }
  .cal-nav { display:flex; gap:8px; }
  .cal-btn { width:32px; height:32px; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--text-sub); font-size:14px; transition:all 0.15s; }
  .cal-btn:hover { border-color:var(--accent); color:var(--accent); }
  .cal-days-header { display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:8px; }
  .cal-day-label { text-align:center; font-size:11px; font-weight:600; color:var(--text-dim); padding:6px 0; letter-spacing:1px; }
  .cal-days { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .cal-day { aspect-ratio:1; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:var(--radius-sm); cursor:pointer; position:relative; transition:background 0.15s; font-size:14px; font-weight:500; }
  .cal-day:hover { background:var(--surface2); }
  .cal-day.today { background:rgba(124,106,247,0.18); color:var(--accent); font-weight:700; }
  .cal-day.today::after { content:''; position:absolute; bottom:6px; width:4px; height:4px; background:var(--accent); border-radius:50%; }
  .cal-day.has-lesson::after { content:''; position:absolute; bottom:6px; width:4px; height:4px; background:var(--accent2); border-radius:50%; }
  .cal-day.today.has-lesson::after { background:var(--accent3); }
  .cal-day.dim { color:var(--text-dim); }
  .cal-day.selected { background:rgba(124,106,247,0.3); color:var(--text); }
  .cal-right { display:flex; flex-direction:column; gap:20px; }
  .today-lessons { display:flex; flex-direction:column; gap:10px; }
  .lesson-item { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--surface2); border-radius:var(--radius-sm); border-left:3px solid var(--accent2); }
  .lesson-time { font-family:monospace; font-size:12px; color:var(--accent2); width:40px; flex-shrink:0; }
  .lesson-info { flex:1; }
  .lesson-name { font-size:13px; font-weight:600; }
  .lesson-place { font-size:11px; color:var(--text-sub); margin-top:2px; }
  .lesson-badge { font-size:10px; padding:2px 8px; border-radius:20px; font-weight:600; background:rgba(74,222,128,0.15); color:var(--confirmed); }
  .timer-display { text-align:center; padding:28px 20px; }
  .timer-type-selector { display:flex; gap:8px; justify-content:center; margin-bottom:20px; }
  .type-btn { padding:6px 14px; border-radius:20px; border:1px solid var(--border); background:none; color:var(--text-sub); font-size:12px; cursor:pointer; font-family:'Pretendard',sans-serif; transition:all 0.15s; }
  .type-btn.active { background:rgba(124,106,247,0.2); border-color:var(--accent); color:var(--accent); }
  .timer-digits { font-family:monospace; font-size:52px; font-weight:500; letter-spacing:4px; color:var(--text); margin-bottom:8px; line-height:1; }
  .timer-label { font-size:11px; color:var(--text-dim); letter-spacing:2px; margin-bottom:24px; }
  .timer-btns { display:flex; gap:10px; justify-content:center; }
  .timer-today-record { margin-top:16px; padding-top:16px; border-top:1px solid var(--border); display:flex; justify-content:center; gap:24px; }
  .record-item { text-align:center; }
  .record-val { font-family:monospace; font-size:16px; font-weight:500; color:var(--accent2); }
  .record-key { font-size:10px; color:var(--text-dim); margin-top:2px; }
  .history-list { display:flex; flex-direction:column; gap:8px; }
  .history-item { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); }
  .history-item:last-child { border-bottom:none; }
  .history-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .history-date { font-family:monospace; font-size:11px; color:var(--text-dim); width:90px; flex-shrink:0; }
  .history-name { font-size:13px; flex:1; }
  .history-duration { font-size:11px; color:var(--text-sub); }
  @keyframes userPulse { 0%,100%{opacity:1}50%{opacity:0.3} }
  .timer-running .timer-digits { color:var(--accent2); }

  /* ══ USER: 예약 ══ */
  .reservation-layout { display:grid; grid-template-columns:1fr 300px; gap:24px; }
  .filter-bar { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
  .filter-chip { padding:7px 16px; border-radius:20px; border:1px solid var(--border); background:none; color:var(--text-sub); font-size:12px; font-weight:500; cursor:pointer; font-family:'Pretendard',sans-serif; transition:all 0.15s; }
  .filter-chip.active { background:rgba(124,106,247,0.2); border-color:var(--accent); color:var(--accent); }
  .program-list { display:flex; flex-direction:column; gap:12px; }
  .program-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:18px 20px; display:flex; align-items:center; gap:16px; cursor:pointer; transition:all 0.15s; }
  .program-card:hover { border-color:var(--accent); }
  .program-card.selected { border-color:var(--accent); background:rgba(124,106,247,0.06); }
  .program-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
  .program-info { flex:1; }
  .program-name { font-size:15px; font-weight:600; }
  .program-meta { font-size:12px; color:var(--text-sub); margin-top:3px; }
  .program-type-badge { font-size:10px; padding:3px 10px; border-radius:20px; font-weight:600; flex-shrink:0; }
  .badge-group { background:rgba(124,106,247,0.15); color:var(--accent); }
  .badge-private { background:rgba(79,209,197,0.15); color:var(--accent2); }
  .badge-room { background:rgba(246,173,85,0.15); color:var(--accent3); }
  .slot-panel { position:sticky; top:24px; }
  .slot-date-header { font-size:15px; font-weight:700; margin-bottom:16px; }
  .slot-date-sub { font-size:12px; color:var(--text-sub); font-weight:400; }
  .slot-list { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
  .slot-item { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--surface2); border-radius:var(--radius-sm); border:1px solid var(--border); cursor:pointer; transition:all 0.15s; }
  .slot-item:hover { border-color:var(--accent); }
  .slot-item.selected-slot { border-color:var(--accent); background:rgba(124,106,247,0.12); }
  .slot-item.full { opacity:0.4; cursor:not-allowed; }
  .slot-time { font-family:monospace; font-size:13px; color:var(--text); width:90px; flex-shrink:0; }
  .slot-capacity { flex:1; }
  .capacity-bar-bg { height:4px; background:var(--border); border-radius:2px; overflow:hidden; margin-bottom:3px; }
  .capacity-bar { height:100%; background:var(--accent2); border-radius:2px; }
  .capacity-text { font-size:10px; color:var(--text-dim); }
  .slot-status { font-size:10px; font-weight:600; }
  .status-open { color:var(--confirmed); }
  .status-full { color:var(--canceled); }
  .confirm-section { padding:16px; background:var(--surface2); border-radius:var(--radius-sm); border:1px solid var(--border); margin-top:16px; }
  .confirm-row { display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px; }
  .confirm-label { color:var(--text-sub); }
  .confirm-val { font-weight:600; }
  .btn-confirm { width:100%; padding:12px; background:var(--accent); color:white; border:none; border-radius:var(--radius-sm); font-size:14px; font-weight:700; cursor:pointer; margin-top:14px; font-family:'Pretendard',sans-serif; transition:background 0.15s; }
  .btn-confirm:hover { background:#6b5ce7; }

  /* ══ USER: 마이페이지 ══ */
  .mypage-grid { display:grid; grid-template-columns:280px 1fr; gap:24px; }
  .profile-card { text-align:center; padding:32px 24px; }
  .profile-avatar { width:72px; height:72px; background:linear-gradient(135deg,var(--accent),var(--accent2)); border-radius:50%; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:700; color:white; }
  .profile-name { font-size:18px; font-weight:700; margin-bottom:4px; }
  .profile-email { font-size:13px; color:var(--text-sub); margin-bottom:18px; }
  .profile-stats { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:20px; }
  .stat-box { background:var(--surface2); border-radius:var(--radius-sm); padding:12px 10px; text-align:center; }
  .stat-val { font-family:monospace; font-size:20px; font-weight:500; color:var(--accent); }
  .stat-key { font-size:10px; color:var(--text-dim); margin-top:2px; }
  .btn-edit-profile { width:100%; padding:10px; background:var(--surface2); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-sub); font-size:13px; cursor:pointer; font-family:'Pretendard',sans-serif; transition:all 0.15s; }
  .btn-edit-profile:hover { color:var(--text); border-color:var(--text-sub); }
  .mypage-right { display:flex; flex-direction:column; gap:20px; }
  .platform-item { display:flex; align-items:flex-start; gap:14px; padding:16px; background:var(--surface2); border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:10px; }
  .platform-item:last-child { margin-bottom:0; }
  .platform-emoji { font-size:24px; width:44px; height:44px; background:var(--surface); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .platform-detail { flex:1; }
  .platform-name-label { font-size:14px; font-weight:700; }
  .platform-type-tag { display:inline-block; font-size:10px; padding:2px 8px; border-radius:20px; margin:4px 0 6px; font-weight:600; }
  .platform-dates { font-size:12px; color:var(--text-sub); }
  .billing-info { display:flex; align-items:center; gap:8px; margin-top:6px; }
  .billing-badge { font-size:10px; padding:2px 8px; border-radius:20px; font-weight:600; background:rgba(246,173,85,0.15); color:var(--accent3); }
  .billing-date { font-family:monospace; font-size:12px; color:var(--accent3); }
  .platform-status-badge { flex-shrink:0; font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px; }
  .ps-active { background:rgba(74,222,128,0.12); color:var(--confirmed); }
  .ps-expired { background:rgba(248,113,113,0.12); color:var(--canceled); }
  .reservation-history { display:flex; flex-direction:column; gap:8px; }
  .res-item { display:flex; align-items:center; gap:14px; padding:12px 16px; background:var(--surface2); border-radius:var(--radius-sm); border:1px solid var(--border); }
  .res-date { font-family:monospace; font-size:11px; color:var(--text-dim); width:100px; flex-shrink:0; }
  .res-name { font-size:13px; flex:1; }
  .res-status { font-size:10px; padding:3px 10px; border-radius:20px; font-weight:600; }
  .rs-confirmed { background:rgba(74,222,128,0.12); color:var(--confirmed); }
  .rs-completed { background:rgba(124,106,247,0.12); color:var(--accent); }
  .rs-canceled { background:rgba(248,113,113,0.12); color:var(--canceled); }

  @media(max-width:900px) {
    .calendar-grid { grid-template-columns:1fr; }
    .reservation-layout { grid-template-columns:1fr; }
    .mypage-grid { grid-template-columns:1fr; }
    .slot-panel { position:static; }
  }
</style>
</head>
<body>
id="super-app" style="display:none;">
  <button class="hamburger" onclick="toggleSidebar('super-sidebar','super-overlay')">☰</button>
  <div class="sidebar-overlay" id="super-overlay" onclick="toggleSidebar('super-sidebar','super-overlay')"></div>

  <nav class="sidebar super-sidebar" id="super-sidebar">
    <div class="logo">
      <div class="logo-texts">
        <div class="logo-mark" style="color:#f6ad55;">Super</div>
        <div class="logo-name">ReserveHub</div>
      </div>
      <button class="collapse-btn" onclick="collapseSidebar('super-sidebar')">◀</button>
    </div>
    <div class="nav">
      <button class="nav-item active" onclick="showSuperPage('super-dashboard',this)"><span class="nav-icon">📊</span><span class="nav-label">대시보드</span></button>
      <button class="nav-item" onclick="showSuperPage('super-platforms',this)"><span class="nav-icon">🏢</span><span class="nav-label">플랫폼 관리</span></button>
      <button class="nav-item" onclick="showSuperPage('super-approval',this)">
        <span class="nav-icon">✅</span><span class="nav-label">승인 관리</span>
        <span style="margin-left:auto;background:#f87171;color:white;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;flex-shrink:0;">2</span>
      </button>
      <button class="nav-item" onclick="showSuperPage('super-mypage',this)"><span class="nav-icon">👤</span><span class="nav-label">내 정보</span></button>
    </div>
    <div class="sidebar-footer">
      <div class="user-pill">
        <div class="avatar" style="background:linear-gradient(135deg,#f6ad55,#ed8936);">박</div>
        <div class="user-info">
          <div class="user-name">박지훈 원장</div>
          <div class="user-role" style="color:#f6ad55;">슈퍼관리자</div>
        </div>
      </div>
    </div>
  </nav>

  <main class="main" id="super-main">

    <!-- ══════════════ 대시보드 ══════════════ -->
    <div id="super-dashboard" class="page active">
      <div class="page-header">
        <div class="page-label">Super Admin / Dashboard</div>
        <div class="page-title">대시보드</div>
        <div class="page-subtitle">전체 플랫폼 현황을 한눈에 확인하세요</div>
      </div>

      <!-- KPI 4칸 -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">활성 플랫폼</div>
          <div style="font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:#f6ad55;line-height:1;">3</div>
          <div style="font-size:11px;color:var(--green);margin-top:6px;">+1 이번 달</div>
        </div>
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">전체 회원</div>
          <div style="font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:#7c6af7;line-height:1;">284</div>
          <div style="font-size:11px;color:var(--green);margin-top:6px;">+12 이번 달</div>
        </div>
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">이번 달 매출</div>
          <div style="font-family:'DM Mono',monospace;font-size:28px;font-weight:500;color:#4fd1c5;line-height:1;">18.4<span style="font-size:14px;">만</span></div>
          <div style="font-size:11px;color:var(--green);margin-top:6px;">↑ 9% vs 지난달</div>
        </div>
        <div class="card" style="padding:20px;text-align:center;">
          <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">대기 승인</div>
          <div style="font-family:'DM Mono',monospace;font-size:32px;font-weight:500;color:#f87171;line-height:1;">2</div>
          <div style="font-size:11px;color:var(--red);margin-top:6px;">처리 필요</div>
        </div>
      </div>

      <!-- 플랫폼별 현황 + 승인 대기 -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;">

        <!-- 플랫폼 현황 테이블 -->
        <div class="card">
          <div class="card-title">플랫폼별 현황</div>
          <div style="overflow-x:auto;">
            <table class="attend-table">
              <thead>
                <tr>
                  <th>플랫폼</th>
                  <th>회원</th>
                  <th>강사</th>
                  <th>이번 달 매출</th>
                  <th>출결률</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr style="cursor:pointer;" onclick="showSuperPage('super-platforms', document.querySelectorAll('#super-sidebar .nav-item')[1]); selectPlatform('pilates')">
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="display:inline-block;width:10px;height:10px;background:#7c6af7;border-radius:2px;flex-shrink:0;"></span>
                      <div><div style="font-weight:700;font-size:13px;">스튜디오 필라테스 강남</div><div style="font-size:11px;color:var(--text-sub);">필라테스</div></div>
                    </div>
                  </td>
                  <td><span style="font-family:'DM Mono',monospace;">142명</span></td>
                  <td><span style="font-family:'DM Mono',monospace;">4명</span></td>
                  <td><span style="font-family:'DM Mono',monospace;color:#4fd1c5;">9.8만</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div style="width:50px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="width:93%;height:100%;background:#4fd1c5;border-radius:2px;"></div></div>
                      <span style="font-size:11px;color:#4fd1c5;">93%</span>
                    </div>
                  </td>
                  <td><span class="plat-status ps-active" style="font-size:10px;">운영 중</span></td>
                </tr>
                <tr style="cursor:pointer;" onclick="showSuperPage('super-platforms', document.querySelectorAll('#super-sidebar .nav-item')[1]); selectPlatform('yoga')">
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="display:inline-block;width:10px;height:10px;background:#4fd1c5;border-radius:2px;flex-shrink:0;"></span>
                      <div><div style="font-weight:700;font-size:13px;">요가라운지 홍대</div><div style="font-size:11px;color:var(--text-sub);">요가</div></div>
                    </div>
                  </td>
                  <td><span style="font-family:'DM Mono',monospace;">86명</span></td>
                  <td><span style="font-family:'DM Mono',monospace;">2명</span></td>
                  <td><span style="font-family:'DM Mono',monospace;color:#4fd1c5;">5.2만</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div style="width:50px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="width:88%;height:100%;background:#4fd1c5;border-radius:2px;"></div></div>
                      <span style="font-size:11px;color:#4fd1c5;">88%</span>
                    </div>
                  </td>
                  <td><span class="plat-status ps-active" style="font-size:10px;">운영 중</span></td>
                </tr>
                <tr style="cursor:pointer;" onclick="showSuperPage('super-platforms', document.querySelectorAll('#super-sidebar .nav-item')[1]); selectPlatform('music')">
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="display:inline-block;width:10px;height:10px;background:#f6ad55;border-radius:2px;flex-shrink:0;"></span>
                      <div><div style="font-weight:700;font-size:13px;">뮤직하우스 홍대</div><div style="font-size:11px;color:var(--text-sub);">음악</div></div>
                    </div>
                  </td>
                  <td><span style="font-family:'DM Mono',monospace;">56명</span></td>
                  <td><span style="font-family:'DM Mono',monospace;">3명</span></td>
                  <td><span style="font-family:'DM Mono',monospace;color:#4fd1c5;">3.4만</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div style="width:50px;height:4px;background:var(--border);border-radius:2px;overflow:hidden;"><div style="width:79%;height:100%;background:#4fd1c5;border-radius:2px;"></div></div>
                      <span style="font-size:11px;color:#4fd1c5;">79%</span>
                    </div>
                  </td>
                  <td><span class="plat-status ps-active" style="font-size:10px;">운영 중</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 승인 대기 빠른 처리 -->
        <div class="card">
          <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
            <span>승인 대기</span>
            <span style="background:rgba(248,113,113,0.15);color:#f87171;font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;">2건</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);padding:14px;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
                <div>
                  <div style="font-size:13px;font-weight:700;">홍길동 — 1:1 레슨 변경</div>
                  <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">02.26 10:00 → 02.28 14:00</div>
                  <div style="margin-top:4px;"><span class="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">🤸 필라테스</span></div>
                </div>
              </div>
              <div style="font-size:11px;color:var(--text-sub);margin-bottom:10px;">요청자: 이수진 트레이너</div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-sm" style="flex:1;background:rgba(74,222,128,0.12);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onclick="approveRequest(this)">승인</button>
                <button class="btn btn-sm btn-danger" style="flex:1;" onclick="rejectRequest(this)">반려</button>
              </div>
            </div>
            <div style="background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border);padding:14px;">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
                <div>
                  <div style="font-size:13px;font-weight:700;">최유나 — 그룹반 B 변경</div>
                  <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">02.26 14:00 → 03.01 14:00</div>
                  <div style="margin-top:4px;"><span class="plat-chip" style="background:rgba(79,209,197,0.12);color:#4fd1c5;border-color:rgba(79,209,197,0.3);">🧘 요가</span></div>
                </div>
              </div>
              <div style="font-size:11px;color:var(--text-sub);margin-bottom:10px;">요청자: 이수진 트레이너</div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-sm" style="flex:1;background:rgba(74,222,128,0.12);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onclick="approveRequest(this)">승인</button>
                <button class="btn btn-sm btn-danger" style="flex:1;" onclick="rejectRequest(this)">반려</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════ 플랫폼 관리 ══════════════ -->
    <div id="super-platforms" class="page">
      <div class="page-header">
        <div class="page-label">Super Admin / Platforms</div>
        <div class="page-title">플랫폼 관리</div>
        <div class="page-subtitle">플랫폼을 선택해 상세 정보를 관리하세요</div>
      </div>

      <!-- 플랫폼 목록 + 상세 -->
      <div style="display:grid;grid-template-columns:260px 1fr;gap:20px;align-items:start;">

        <!-- 플랫폼 목록 -->
        <div style="display:flex;flex-direction:column;gap:0;">
          <div class="card" style="padding:0;overflow:hidden;">
            <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:11px;font-weight:600;color:var(--text-sub);letter-spacing:1px;text-transform:uppercase;">플랫폼 목록</span>
              <button class="btn btn-sm btn-primary" style="padding:5px 10px;font-size:11px;">+ 추가</button>
            </div>
            <div id="platformList">
              <div class="platform-list-item active" onclick="selectPlatform('pilates')" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;border-bottom:1px solid var(--border);background:rgba(124,106,247,0.08);border-left:3px solid #7c6af7;">
                <span style="font-size:18px;">🤸</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:700;">스튜디오 필라테스</div>
                  <div style="font-size:11px;color:var(--text-sub);">강남 · 회원 142명</div>
                </div>
                <span class="plat-status ps-active" style="font-size:10px;flex-shrink:0;">운영</span>
              </div>
              <div class="platform-list-item" onclick="selectPlatform('yoga')" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;border-bottom:1px solid var(--border);border-left:3px solid transparent;">
                <span style="font-size:18px;">🧘</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:700;">요가라운지</div>
                  <div style="font-size:11px;color:var(--text-sub);">홍대 · 회원 86명</div>
                </div>
                <span class="plat-status ps-active" style="font-size:10px;flex-shrink:0;">운영</span>
              </div>
              <div class="platform-list-item" onclick="selectPlatform('music')" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;border-left:3px solid transparent;">
                <span style="font-size:18px;">🎵</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13px;font-weight:700;">뮤직하우스</div>
                  <div style="font-size:11px;color:var(--text-sub);">홍대 · 회원 56명</div>
                </div>
                <span class="plat-status ps-active" style="font-size:10px;flex-shrink:0;">운영</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 플랫폼 상세 (탭) -->
        <div class="card" style="padding:0;overflow:hidden;">
          <!-- 상단 헤더 -->
          <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:22px;" id="platDetailEmoji">🤸</span>
              <div>
                <div style="font-size:16px;font-weight:700;" id="platDetailName">스튜디오 필라테스 강남</div>
                <div style="font-size:11px;color:var(--text-sub);" id="platDetailSub">필라테스 · 강남구 역삼동</div>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-ghost btn-sm">수정</button>
              <button class="btn btn-sm btn-danger">비활성화</button>
            </div>
          </div>

          <!-- 탭 -->
          <div style="display:flex;border-bottom:1px solid var(--border);overflow-x:auto;" id="platTabs">
            <button class="plat-tab active" onclick="selectPlatTab('info',this)">기본 정보</button>
            <button class="plat-tab" onclick="selectPlatTab('programs',this)">프로그램/슬롯</button>
            <button class="plat-tab" onclick="selectPlatTab('members',this)">사용자</button>
            <button class="plat-tab" onclick="selectPlatTab('instructors',this)">일반관리자</button>
            <button class="plat-tab" onclick="selectPlatTab('billing',this)">수강권/결제</button>
            <button class="plat-tab" onclick="selectPlatTab('stats',this)">수익/통계</button>
          </div>

          <!-- 탭 컨텐츠 -->
          <div style="padding:20px;" id="platTabContent">

            <!-- 기본 정보 -->
            <div id="tab-info" class="plat-tab-content">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div class="form-field"><label>플랫폼명</label><input type="text" value="스튜디오 필라테스 강남"></div>
                <div class="form-field"><label>업종</label><select><option selected>필라테스</option><option>요가</option><option>음악</option><option>헬스</option></select></div>
                <div class="form-field"><label>대표 전화</label><input type="text" value="02-1234-5678"></div>
                <div class="form-field"><label>주소</label><input type="text" value="서울시 강남구 역삼동 123-45"></div>
                <div class="form-field" style="grid-column:1/-1;"><label>소개</label><textarea style="min-height:60px;">강남 최고의 필라테스 스튜디오입니다.</textarea></div>
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:14px;">
                <button class="btn btn-primary" style="background:#f6ad55;color:#0f0f13;">저장</button>
              </div>
            </div>

            <!-- 프로그램/슬롯 -->
            <div id="tab-programs" class="plat-tab-content" style="display:none;">
              <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
                <button class="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 프로그램 추가</button>
              </div>
              <div style="overflow-x:auto;">
                <table class="attend-table">
                  <thead><tr><th>프로그램명</th><th>유형</th><th>정원</th><th>시간</th><th>상태</th><th></th></tr></thead>
                  <tbody>
                    <tr><td style="font-weight:600;">그룹반 A — 기초</td><td><span class="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">그룹레슨</span></td><td>8명</td><td>60분</td><td><span class="plat-status ps-active" style="font-size:10px;">운영</span></td><td><button class="btn btn-ghost btn-sm">수정</button></td></tr>
                    <tr><td style="font-weight:600;">그룹반 B — 심화</td><td><span class="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">그룹레슨</span></td><td>8명</td><td>60분</td><td><span class="plat-status ps-active" style="font-size:10px;">운영</span></td><td><button class="btn btn-ghost btn-sm">수정</button></td></tr>
                    <tr><td style="font-weight:600;">1:1 개인레슨</td><td><span class="plat-chip" style="background:rgba(79,209,197,0.12);color:#4fd1c5;border-color:rgba(79,209,197,0.3);">개인레슨</span></td><td>1명</td><td>50분</td><td><span class="plat-status ps-active" style="font-size:10px;">운영</span></td><td><button class="btn btn-ghost btn-sm">수정</button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 사용자 -->
            <div id="tab-members" class="plat-tab-content" style="display:none;">
              <div style="display:flex;gap:8px;margin-bottom:14px;">
                <input type="text" placeholder="이름 / 연락처 검색..." style="flex:1;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;outline:none;">
                <button class="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 회원 등록</button>
              </div>
              <div style="overflow-x:auto;">
                <table class="attend-table">
                  <thead><tr><th>이름</th><th>연락처</th><th>등록일</th><th>다음 결제</th><th>상태</th><th></th></tr></thead>
                  <tbody>
                    <tr><td style="font-weight:600;">홍길동</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-1234-5678</td><td>2025.10.01</td><td style="color:#f6ad55;font-family:'DM Mono',monospace;font-size:12px;">2026.03.01</td><td><span class="plat-status ps-active" style="font-size:10px;">활성</span></td><td><button class="btn btn-ghost btn-sm">상세</button></td></tr>
                    <tr><td style="font-weight:600;">김민지</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-9876-5432</td><td>2025.11.15</td><td style="color:#f6ad55;font-family:'DM Mono',monospace;font-size:12px;">2026.03.15</td><td><span class="plat-status ps-active" style="font-size:10px;">활성</span></td><td><button class="btn btn-ghost btn-sm">상세</button></td></tr>
                    <tr><td style="font-weight:600;">박서준</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-5555-4444</td><td>2025.09.01</td><td style="color:#f87171;font-family:'DM Mono',monospace;font-size:12px;">2026.02.28</td><td><span class="plat-status ps-active" style="font-size:10px;">활성</span></td><td><button class="btn btn-ghost btn-sm">상세</button></td></tr>
                    <tr><td style="font-weight:600;">이지은</td><td style="font-family:'DM Mono',monospace;font-size:12px;">010-2222-3333</td><td>2024.06.01</td><td style="color:var(--text-dim);font-size:12px;">만료</td><td><span class="plat-status ps-expired" style="font-size:10px;">만료</span></td><td><button class="btn btn-ghost btn-sm">상세</button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 일반관리자 -->
            <div id="tab-instructors" class="plat-tab-content" style="display:none;">
              <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
                <button class="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 관리자 등록</button>
              </div>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;align-items:center;gap:14px;">
                  <div class="avatar" style="background:linear-gradient(135deg,var(--accent2),#667eea);width:38px;height:38px;font-size:15px;">이</div>
                  <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;">이수진 트레이너</div>
                    <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">그룹반 A · 그룹반 B · 1:1 개인레슨 담당 · 수강생 18명</div>
                  </div>
                  <span class="plat-status ps-active" style="font-size:10px;">재직</span>
                  <button class="btn btn-ghost btn-sm">수정</button>
                </div>
                <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;display:flex;align-items:center;gap:14px;">
                  <div class="avatar" style="background:linear-gradient(135deg,#f6ad55,#ed8936);width:38px;height:38px;font-size:15px;">김</div>
                  <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;">김현우 트레이너</div>
                    <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">그룹반 A 보조 · 수강생 12명</div>
                  </div>
                  <span class="plat-status ps-active" style="font-size:10px;">재직</span>
                  <button class="btn btn-ghost btn-sm">수정</button>
                </div>
              </div>
            </div>

            <!-- 수강권/결제 -->
            <div id="tab-billing" class="plat-tab-content" style="display:none;">
              <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
                <button class="btn btn-primary btn-sm" style="background:#f6ad55;color:#0f0f13;">+ 수강권 추가</button>
              </div>
              <div style="overflow-x:auto;">
                <table class="attend-table">
                  <thead><tr><th>수강권명</th><th>금액</th><th>기간</th><th>가입자</th><th>상태</th></tr></thead>
                  <tbody>
                    <tr><td style="font-weight:600;">그룹 월정액</td><td style="font-family:'DM Mono',monospace;color:#4fd1c5;">95,000원</td><td>30일</td><td>98명</td><td><span class="plat-status ps-active" style="font-size:10px;">판매중</span></td></tr>
                    <tr><td style="font-weight:600;">개인 10회권</td><td style="font-family:'DM Mono',monospace;color:#4fd1c5;">350,000원</td><td>60일</td><td>24명</td><td><span class="plat-status ps-active" style="font-size:10px;">판매중</span></td></tr>
                    <tr><td style="font-weight:600;">체험 1회권</td><td style="font-family:'DM Mono',monospace;color:#4fd1c5;">30,000원</td><td>1일</td><td>20명</td><td><span class="plat-status ps-expired" style="font-size:10px;">중단</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 수익/통계 -->
            <div id="tab-stats" class="plat-tab-content" style="display:none;">
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
                <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;border:1px solid var(--border);">
                  <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;">이번 달 매출</div>
                  <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#4fd1c5;">9.8만</div>
                </div>
                <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;border:1px solid var(--border);">
                  <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;">신규 가입</div>
                  <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#7c6af7;">8명</div>
                </div>
                <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;border:1px solid var(--border);">
                  <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;">재등록률</div>
                  <div style="font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#f6ad55;">78%</div>
                </div>
              </div>
              <!-- 월별 매출 바 -->
              <div style="font-size:11px;color:var(--text-sub);margin-bottom:12px;letter-spacing:1px;text-transform:uppercase;">월별 매출 추이</div>
              <div style="display:flex;align-items:flex-end;gap:8px;height:80px;">
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
                  <div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:60%;opacity:0.6;"></div></div>
                  <span style="font-size:9px;color:var(--text-dim);">10월</span>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
                  <div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:70%;opacity:0.7;"></div></div>
                  <span style="font-size:9px;color:var(--text-dim);">11월</span>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
                  <div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:75%;opacity:0.8;"></div></div>
                  <span style="font-size:9px;color:var(--text-dim);">12월</span>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
                  <div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#7c6af7;border-radius:3px 3px 0 0;height:80%;opacity:0.9;"></div></div>
                  <span style="font-size:9px;color:var(--text-dim);">1월</span>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;">
                  <div style="flex:1;width:100%;display:flex;align-items:flex-end;"><div style="width:100%;background:#4fd1c5;border-radius:3px 3px 0 0;height:100%;"></div></div>
                  <span style="font-size:9px;color:var(--accent2);">2월</span>
                </div>
              </div>
              <div style="height:1px;background:var(--border);margin-top:2px;"></div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════ 승인 관리 ══════════════ -->
    <div id="super-approval" class="page">
      <div class="page-header">
        <div class="page-label">Super Admin / Approval</div>
        <div class="page-title">승인 관리</div>
        <div class="page-subtitle">일반관리자의 일정 변경 요청을 검토하고 승인하세요</div>
      </div>

      <!-- 필터 -->
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
        <button class="filter-chip active">전체</button>
        <button class="filter-chip">대기 중</button>
        <button class="filter-chip">승인됨</button>
        <button class="filter-chip">반려됨</button>
        <div style="flex:1;min-width:160px;"><input type="text" placeholder="이름 / 플랫폼 검색..." style="width:100%;padding:7px 12px;background:var(--surface);border:1px solid var(--border);border-radius:20px;color:var(--text);font-size:12px;outline:none;"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">

        <!-- 대기 -->
        <div class="card" style="border-left:3px solid #f6ad55;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
            <div>
              <div style="font-size:14px;font-weight:700;">홍길동 — 1:1 개인 레슨 일정 변경</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
                <span class="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">🤸 스튜디오 필라테스</span>
                <span style="font-size:11px;color:var(--text-sub);">요청자: 이수진 트레이너</span>
                <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);">2026.02.25</span>
              </div>
            </div>
            <span class="res-status" style="background:rgba(246,173,85,0.12);color:var(--accent3);flex-shrink:0;">대기 중</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">기존 일정</div><div style="font-size:13px;font-weight:600;">2026.02.26 10:00</div></div>
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">변경 희망</div><div style="font-size:13px;font-weight:600;color:#4fd1c5;">2026.02.28 14:00</div></div>
          </div>
          <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px;font-size:13px;color:var(--text-sub);line-height:1.5;">수강생 개인 사정으로 인한 일정 조정 요청입니다.</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-ghost btn-sm">메모 추가</button>
            <button class="btn btn-sm btn-danger" onclick="rejectRequest(this)">반려</button>
            <button class="btn btn-sm" style="background:rgba(74,222,128,0.15);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onclick="approveRequest(this)">승인</button>
          </div>
        </div>

        <div class="card" style="border-left:3px solid #f6ad55;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;">
            <div>
              <div style="font-size:14px;font-weight:700;">최유나 — 그룹반 B 일정 변경</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
                <span class="plat-chip" style="background:rgba(79,209,197,0.12);color:#4fd1c5;border-color:rgba(79,209,197,0.3);">🧘 요가라운지</span>
                <span style="font-size:11px;color:var(--text-sub);">요청자: 이수진 트레이너</span>
                <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);">2026.02.25</span>
              </div>
            </div>
            <span class="res-status" style="background:rgba(246,173,85,0.12);color:var(--accent3);flex-shrink:0;">대기 중</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">기존 일정</div><div style="font-size:13px;font-weight:600;">2026.02.26 14:00</div></div>
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;"><div style="font-size:10px;color:var(--text-dim);margin-bottom:4px;letter-spacing:1px;">변경 희망</div><div style="font-size:13px;font-weight:600;color:#4fd1c5;">2026.03.01 14:00</div></div>
          </div>
          <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px;font-size:13px;color:var(--text-sub);line-height:1.5;">수강생 업무 일정 충돌로 인한 변경 요청입니다.</div>
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button class="btn btn-ghost btn-sm">메모 추가</button>
            <button class="btn btn-sm btn-danger" onclick="rejectRequest(this)">반려</button>
            <button class="btn btn-sm" style="background:rgba(74,222,128,0.15);color:var(--green);border:1px solid rgba(74,222,128,0.3);" onclick="approveRequest(this)">승인</button>
          </div>
        </div>

        <!-- 처리 완료 -->
        <div class="card" style="border-left:3px solid var(--green);opacity:0.7;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap;">
            <div>
              <div style="font-size:14px;font-weight:700;">김민지 — 그룹반 A 일정 변경</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap;">
                <span class="plat-chip" style="background:rgba(124,106,247,0.12);color:#7c6af7;border-color:rgba(124,106,247,0.3);">🤸 스튜디오 필라테스</span>
                <span style="font-size:11px;color:var(--text-sub);">요청자: 이수진 트레이너</span>
                <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);">2026.02.18</span>
              </div>
            </div>
            <span class="res-status rs-completed">승인됨</span>
          </div>
          <div style="font-size:12px;color:var(--text-dim);font-family:'DM Mono',monospace;">2026.02.20 09:00 → 2026.02.22 09:00 · 승인일: 2026.02.19</div>
        </div>

      </div>
    </div>

    <!-- ══════════════ 내 정보 ══════════════ -->
    <div id="super-mypage" class="page">
      <div class="page-header">
        <div class="page-label">Super Admin / My Page</div>
        <div class="page-title">내 정보</div>
        <div class="page-subtitle">슈퍼관리자 계정 정보를 확인하세요</div>
      </div>

      <div class="mypage-hero" style="margin-bottom:24px;">
        <div class="hero-avatar" style="background:linear-gradient(135deg,#f6ad55,#ed8936);">박</div>
        <div class="hero-identity">
          <div class="hero-name">박지훈 원장</div>
          <div class="hero-email"><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="553f3c3d3a3a3b7b2534273e15273026302723303d20377b363a38">[email&#160;protected]</a></div>
        </div>
        <div class="hero-divider"></div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="hstat-val" style="color:#f6ad55;">3</div><div class="hstat-key">관리 플랫폼</div></div>
          <div class="hero-stat"><div class="hstat-val" style="color:#f6ad55;">284</div><div class="hstat-key">전체 회원</div></div>
          <div class="hero-stat"><div class="hstat-val" style="color:#f6ad55;">9</div><div class="hstat-key">일반관리자</div></div>
          <div class="hero-stat"><div class="hstat-val" style="color:var(--green);">18.4만</div><div class="hstat-key">이번 달 매출</div></div>
        </div>
        <button class="btn btn-ghost hero-edit btn-sm">✏️ 정보 수정</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div class="card">
          <div class="card-title">관리 플랫폼</div>
          <div class="platform-item"><div class="plat-emoji">🤸</div><div class="plat-detail"><div class="plat-name">스튜디오 필라테스 강남</div><span class="plat-tag" style="background:rgba(124,106,247,0.15);color:#7c6af7;">필라테스</span><div class="plat-dates">회원 142명 · 강사 4명</div></div><span class="plat-status ps-active">운영 중</span></div>
          <div class="platform-item"><div class="plat-emoji">🧘</div><div class="plat-detail"><div class="plat-name">요가라운지 홍대</div><span class="plat-tag" style="background:rgba(79,209,197,0.15);color:#4fd1c5;">요가</span><div class="plat-dates">회원 86명 · 강사 2명</div></div><span class="plat-status ps-active">운영 중</span></div>
          <div class="platform-item"><div class="plat-emoji">🎵</div><div class="plat-detail"><div class="plat-name">뮤직하우스 홍대</div><span class="plat-tag" style="background:rgba(246,173,85,0.15);color:#f6ad55;">음악</span><div class="plat-dates">회원 56명 · 강사 3명</div></div><span class="plat-status ps-active">운영 중</span></div>
        </div>
        <div class="card">
          <div class="card-title">전체 매출 현황</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:#4fd1c5;">18.4만</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px;">이번 달</div></div>
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:#7c6af7;">16.9만</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px;">지난 달</div></div>
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:var(--green);">↑9%</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px;">성장률</div></div>
            <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center;"><div style="font-family:'DM Mono',monospace;font-size:20px;font-weight:500;color:#f6ad55;">196만</div><div style="font-size:10px;color:var(--text-dim);margin-top:3px;">연간 누적</div></div>
          </div>
        </div>
      </div>
    </div>

  </main>
</div>

<!-- ══════════════════════════════════════════════════
     SUB-SUPER ADMIN MODE (서브슈퍼관리자 = 점주/사장)
══════════════════════════════════════════════════ -->
<div class="app" 
<script>
// ReserveHub — 슈퍼관리자
// ──────────────────────────────

window.collapseSidebar = function(sidebarId) {
  const s = document.getElementById(sidebarId);
  s.classList.toggle('collapsed');
  s.querySelector('.collapse-btn').textContent = s.classList.contains('collapsed') ? '▶' : '◀';
};

window.toggleSidebar = function(sidebarId, overlayId) {
  document.getElementById(sidebarId).classList.toggle('open');
  document.getElementById(overlayId).classList.toggle('open');
};

window.showSuperPage = function(name, el) {
  document.querySelectorAll('#super-app .page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#super-sidebar .nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  el.classList.add('active');
  if (window.innerWidth <= 768) document.getElementById('super-sidebar').classList.remove('open');
};

// ── 플랫폼 선택 ──

const PLAT_DATA = {
  pilates: { emoji:'🤸', name:'스튜디오 필라테스 강남', sub:'필라테스 · 강남구 역삼동', color:'#7c6af7' },
  yoga:    { emoji:'🧘', name:'요가라운지 홍대',        sub:'요가 · 마포구 홍대',       color:'#4fd1c5' },
  music:   { emoji:'🎵', name:'뮤직하우스 홍대',        sub:'음악 · 마포구 홍대',       color:'#f6ad55' },
};

window.selectPlatform = function(id) {
  const p = PLAT_DATA[id]; if(!p) return;
  document.getElementById('platDetailEmoji').textContent = p.emoji;
  document.getElementById('platDetailName').textContent  = p.name;
  document.getElementById('platDetailSub').textContent   = p.sub;
  document.querySelectorAll('.platform-list-item').forEach((el,i) => {
    const ids = ['pilates','yoga','music'];
    const isActive = ids[i] === id;
    el.classList.toggle('active', isActive);
    el.style.background = isActive ? `rgba(${id==='pilates'?'124,106,247':id==='yoga'?'79,209,197':'246,173,85'},0.08)` : '';
    el.style.borderLeftColor = isActive ? p.color : 'transparent';
  });
  // 기본 탭 info로 리셋
  selectPlatTab('info', document.querySelector('.plat-tab'));
};

// ── 플랫폼 내 탭 전환 ──

window.selectPlatTab = function(tab, el) {
  document.querySelectorAll('.plat-tab-content').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.plat-tab').forEach(t => t.classList.remove('active'));
  const target = document.getElementById('tab-' + tab);
  if (target) target.style.display = 'block';
  if (el) el.classList.add('active');
};

// ── 승인/반려 ──

window.approveRequest = function(btn) {
  const card = btn.closest('.card') || btn.closest('div[style*="border-left"]');
  const badge = card.querySelector('.res-status,[style*="대기"]');
  if(badge){ badge.textContent='승인됨'; badge.className='res-status rs-completed'; }
  btn.closest('[style*="display:flex"]').querySelectorAll('button').forEach(b => b.disabled = true);
  card.style.opacity='0.6'; card.style.borderLeftColor='var(--green)';
};

window.rejectRequest = function(btn) {
  const card = btn.closest('.card') || btn.closest('div[style*="border-left"]');
  const badge = card.querySelector('.res-status,[style*="대기"]');
  if(badge){ badge.textContent='반려됨'; badge.className='res-status rs-canceled'; }
  btn.closest('[style*="display:flex"]').querySelectorAll('button').forEach(b => b.disabled = true);
  card.style.opacity='0.6'; card.style.borderLeftColor='var(--red)';
};

// ── filter chip 토글 ──
document.addEventListener('click', function(e) {
  if(e.target.classList.contains('filter-chip')) {
    const siblings = e.target.closest('div').querySelectorAll('.filter-chip');
    siblings.forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
  }
});


// ── 서브슈퍼 페이지 전환 ──
</script>
</body>
</html>