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

<script>
	window.collapseSidebar = function(sidebarId) {
		const s = document.getElementById(sidebarId);
		s.classList.toggle('collapsed');
		s.querySelector('.collapse-btn').textContent = s.classList.contains('collapsed') ? '▶' : '◀';
	};

	window.toggleSidebar = function(sidebarId, overlayId) {
		document.getElementById(sidebarId).classList.toggle('open');
		document.getElementById(overlayId).classList.toggle('open');
	};

	window.showTutorPage = function(name, el) {
		document.querySelectorAll('#tutor-app .page').forEach(p => p.classList.remove('active'));
		document.querySelectorAll('#tutor-sidebar .nav-item').forEach(n => n.classList.remove('active'));
		document.getElementById(name).classList.add('active');
		el.classList.add('active');
		if (window.innerWidth <= 768) document.getElementById('tutor-sidebar').classList.remove('open');
	};

	// ── 관리자 캘린더 ──
	// 플랫폼 정의 — 색상 & 이름 한곳에서 관리

	const PLATFORMS = {
		pilates: { name:'스튜디오 필라테스', emoji:'🤸', color:'#7c6af7', bg:'rgba(124,106,247,0.15)', border:'rgba(124,106,247,0.35)' },
		yoga:    { name:'요가라운지',        emoji:'🧘', color:'#4fd1c5', bg:'rgba(79,209,197,0.15)',  border:'rgba(79,209,197,0.35)'  },
		music:   { name:'뮤직하우스',        emoji:'🎵', color:'#f6ad55', bg:'rgba(246,173,85,0.15)',  border:'rgba(246,173,85,0.35)'  },
	};

	const TUTOR_EVENTS = {
		5:  [{ time:'10:00', name:'홍길동 — 1:1 개인 레슨', type:'private', status:'완료', platform:'pilates' }],
		10: [{ time:'09:00', name:'그룹반 A', type:'group', status:'완료', platform:'pilates' },
			{ time:'14:00', name:'그룹반 B', type:'group', status:'완료', platform:'yoga' }],
		15: [{ time:'10:00', name:'김민지 — 1:1 개인 레슨', type:'private', status:'완료', platform:'pilates' }],
		18: [{ time:'09:00', name:'그룹반 A', type:'group', status:'완료', platform:'pilates' }],
		20: [{ time:'10:00', name:'홍길동 — 1:1 개인 레슨', type:'private', status:'변경됨', platform:'pilates' }],
		22: [{ time:'09:00', name:'그룹반 A', type:'group', status:'완료', platform:'yoga' }],
		26: [{ time:'09:00', name:'그룹반 A', type:'group',   status:'예정', platform:'pilates' },
			{ time:'10:00', name:'홍길동 — 1:1 개인 레슨', type:'private', status:'예정', platform:'pilates' },
			{ time:'14:00', name:'그룹반 B', type:'group',   status:'예정', platform:'yoga' },
			{ time:'16:00', name:'김민지 — 1:1 개인 레슨', type:'private', status:'예정', platform:'pilates' }],
	};

	const DAYS_KO = ['일','월','화','수','목','금','토'];

	(function renderTutorCal() {
		const c = document.getElementById('tutorCalDays');
		c.innerHTML='';
		for(let i=0;i<0;i++){ const d=document.createElement('div');d.className='cal-day dim';d.innerHTML=`<span class="day-num">${27+i}</span>`;c.appendChild(d); }
		for(let d=1;d<=28;d++) {
			const el=document.createElement('div'); el.className='cal-day';
			if(d===26) el.classList.add('today','selected');
			let dots='';
			if(TUTOR_EVENTS[d]) {
// 플랫폼별 고유 도트 (중복 제거)
				const seen=new Set();
				TUTOR_EVENTS[d].forEach(e=>{
					if(!seen.has(e.platform)){
						seen.add(e.platform);
						const p=PLATFORMS[e.platform];
						dots+=`<span class="dot" style="background:${p?p.color:'var(--accent)'}"></span>`;
					}
				});
			}
			el.innerHTML=`<span class="day-num">${d}</span><span class="day-dots">${dots}</span>`;
			el.onclick=()=>{ document.querySelectorAll('#tutorCalDays .cal-day').forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); showTutorDayDetail(d); };
			c.appendChild(el);
		}
	})();

	function showTutorDayDetail(day) {
		const det=document.getElementById('tutorDayDetail');
		document.getElementById('tutorDayTitle').textContent=`2월 ${day}일의 일정`;
		document.getElementById('tutorDayDate').textContent=DAYS_KO[(0+day-1)%7]+'요일';
		const ev=document.getElementById('tutorDayEvents'); ev.innerHTML='';
		const list=TUTOR_EVENTS[day];
		if(!list||!list.length){ ev.innerHTML='<div class="no-event">이 날의 일정이 없습니다</div>'; }
		else {
			list.forEach(e=>{
				const p = PLATFORMS[e.platform] || { name:e.platform, emoji:'📍', color:'var(--text-sub)', bg:'var(--surface2)', border:'var(--border)' };
				const typeColor = e.type==='private' ? 'var(--accent)' : p.color;
				const statusBg   = e.status==='완료'  ? 'rgba(124,106,247,0.12)' : e.status==='예정' ? 'rgba(74,222,128,0.12)' : 'rgba(246,173,85,0.12)';
				const statusColor= e.status==='완료'  ? 'var(--accent)' : e.status==='예정' ? 'var(--green)' : 'var(--accent3)';
				const typeLbl    = e.type==='private' ? '개인레슨' : '그룹레슨';
				ev.innerHTML+=`
<div class="day-event-item" style="border-left-color:${typeColor}">
<div class="event-time" style="color:${typeColor}">${e.time}</div>
<div class="event-info">
<div class="event-name">${e.name}</div>
<div style="display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap;">
<span class="plat-chip" style="background:${p.bg};color:${p.color};border-color:${p.border}">${p.emoji} ${p.name}</span>
<span class="plat-chip" style="background:var(--surface);color:var(--text-sub);border-color:var(--border)">${e.type==='private'?'👤':'👥'} ${typeLbl}</span>
</div>
</div>
<span class="event-badge" style="background:${statusBg};color:${statusColor}">${e.status}</span>
</div>`;
			});
		}
		det.style.display='block';
	}
	showTutorDayDetail(26);

	window.setAttend = function(btn, type) {
		btn.closest('.attend-toggle').querySelectorAll('.atbtn').forEach(b => { b.className = 'atbtn'; });
		btn.classList.add(type);
	};

	window.openRequestModal = function() {
		window.showTutorPage('tutor-request', document.querySelectorAll('#tutor-sidebar .nav-item')[2]);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
</script>
</template>
<style scoped>

</style>
