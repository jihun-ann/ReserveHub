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


      /* 토스트 */
      .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--surface); border: 1px solid var(--accent); border-radius: var(--r); padding: 13px 24px; font-size: 14px; font-weight: 600; color: var(--accent); z-index: 999; transition: transform .3s ease, opacity .3s ease; opacity: 0; pointer-events: none; white-space: nowrap; }
      .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
    </style>
  </head>
  <body>

  <div class="toast" id="toast"></div>

  <script defer src="TutorView_back.js"></script>
  </body>
  </html>

</template>
<style scoped>

</style>