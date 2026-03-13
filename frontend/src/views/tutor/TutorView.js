
// ══════════════════════════════════════════
//  ReserveHub 강사 (일반관리자) JS
// ══════════════════════════════════════════

// ── 사이드바 ──────────────────────────────
function openSidebar() {
    document.getElementById('admin-sidebar').classList.add('open');
    document.getElementById('admin-overlay').classList.add('open');
}
function closeSidebar() {
    document.getElementById('admin-sidebar').classList.remove('open');
    document.getElementById('admin-overlay').classList.remove('open');
}
function toggleCollapse() {
    document.getElementById('admin-sidebar').classList.toggle('collapsed');
}

// ── 페이지 전환 ───────────────────────────
const PAGE_TITLES = {
    calendar: '내 캘린더',
    attend:   '출결 관리',
    request:  '일정 변경 요청',
    mypage:   '내 정보',
};
window.showPage = function(name, el) {
    document.querySelectorAll('#admin-app .page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#admin-nav .nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('admin-' + name).classList.add('active');
    if (el) el.classList.add('active');
    document.getElementById('topbar-title').textContent = PAGE_TITLES[name] || name;
    closeSidebar();
};

// ═══════════════════════════════════════════
//  데이터
// ═══════════════════════════════════════════
const PLATS = {
    pilates: { name:'스튜디오 필라테스', emoji:'🤸', color:'#7c6af7', bg:'rgba(124,106,247,.15)', border:'rgba(124,106,247,.3)' },
    yoga:    { name:'요가라운지',        emoji:'🧘', color:'#4fd1c5', bg:'rgba(79,209,197,.15)',  border:'rgba(79,209,197,.3)'  },
    music:   { name:'뮤직하우스',        emoji:'🎵', color:'#f6ad55', bg:'rgba(246,173,85,.15)',  border:'rgba(246,173,85,.3)'  },
};

// 날짜별 레슨 데이터 (month key: "YYYY-M")
const EVENTS = {
    '2026-3': {
        3:  [{ time:'10:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준','이나은'] }],
        5:  [{ time:'09:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준'] },
            { time:'14:00', name:'요가 기초반', type:'group', plat:'yoga', students:['이나은','정하준'] }],
        7:  [{ time:'10:00', name:'홍길동 — 1:1', type:'private', plat:'pilates', students:['홍길동'] }],
        10: [{ time:'09:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준','이나은','정하준'] },
            { time:'14:00', name:'그룹반 B', type:'group',   plat:'yoga',    students:['정하준','이나은'] }],
        11: [{ time:'09:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준','이나은','정하준','오지현'] },
            { time:'10:00', name:'홍길동 — 1:1 개인레슨', type:'private', plat:'pilates', students:['홍길동'] },
            { time:'14:00', name:'요가 기초반', type:'group', plat:'yoga', students:['이나은','정하준'] },
            { time:'16:00', name:'김민지 — 1:1 개인레슨', type:'private', plat:'pilates', students:['김민지'] }],
        14: [{ time:'10:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준'] }],
        17: [{ time:'09:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준','이나은'] },
            { time:'14:00', name:'그룹반 B', type:'group',   plat:'yoga',    students:['정하준','이나은'] }],
        19: [{ time:'10:00', name:'박서준 — 1:1', type:'private', plat:'pilates', students:['박서준'] }],
        21: [{ time:'09:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준'] }],
        24: [{ time:'09:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준','이나은'] },
            { time:'14:00', name:'요가 기초반', type:'group', plat:'yoga', students:['이나은','정하준','오지현'] }],
        26: [{ time:'10:00', name:'그룹반 A', type:'group',   plat:'pilates', students:['홍길동','김민지','박서준'] }],
        28: [{ time:'10:00', name:'홍길동 — 1:1', type:'private', plat:'pilates', students:['홍길동'] }],
    },
    '2026-4': {
        2:  [{ time:'09:00', name:'그룹반 A', type:'group', plat:'pilates', students:['홍길동','김민지'] }],
        7:  [{ time:'14:00', name:'요가 기초반', type:'group', plat:'yoga', students:['이나은','정하준'] }],
        14: [{ time:'09:00', name:'그룹반 A', type:'group', plat:'pilates', students:['홍길동','김민지','박서준'] }],
    },
};

const WEEKDAYS = ['일','월','화','수','목','금','토'];
let calYear = 2026, calMonth = 3, calSelDay = 11;

// ═══════════════════════════════════════════
//  달력
// ═══════════════════════════════════════════
function getEvKey() { return calYear + '-' + calMonth; }

function renderCal() {
    const lbl = document.getElementById('calMonthLbl');
    if (lbl) lbl.textContent = calYear + '년 ' + calMonth + '월';

    const container = document.getElementById('calDays');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const isCurMon = today.getFullYear() === calYear && today.getMonth() + 1 === calMonth;
    const todayDay = isCurMon ? today.getDate() : -1;

    const firstDow   = new Date(calYear, calMonth - 1, 1).getDay();
    const daysInMon  = new Date(calYear, calMonth, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth - 1, 0).getDate();
    const evData = (EVENTS[getEvKey()] || {});

    // 이전달 빈칸
    for (let i = 0; i < firstDow; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell dim';
        cell.textContent = daysInPrev - firstDow + 1 + i;
        container.appendChild(cell);
    }

    // 이번달
    for (let d = 1; d <= daysInMon; d++) {
        const cell = document.createElement('div');
        const evs = evData[d] || [];
        const isToday = d === todayDay;
        const isSel   = d === calSelDay;

        let cls = 'cal-cell';
        if (isSel) cls += ' selected';
        else if (isToday) cls += ' today';
        cell.className = cls;

        // 날짜 숫자
        const numSpan = document.createElement('span');
        numSpan.textContent = d;
        cell.appendChild(numSpan);

        // 플랫폼 도트
        if (evs.length > 0) {
            const dotRow = document.createElement('div');
            dotRow.className = 'dot-row';
            const seen = new Set();
            evs.forEach(e => {
                if (!seen.has(e.plat)) {
                    seen.add(e.plat);
                    const dot = document.createElement('span');
                    dot.className = 'dot';
                    const p = PLATS[e.plat];
                    dot.style.background = p ? p.color : '#888';
                    dotRow.appendChild(dot);
                }
            });
            cell.appendChild(dotRow);
        }

        const _d = d;
        cell.addEventListener('click', function() {
            calSelDay = _d;
            renderCal();
            renderTimeline(_d);
        });
        container.appendChild(cell);
    }

    // 다음달 빈칸
    const total = firstDow + daysInMon;
    const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= remain; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell dim';
        cell.textContent = i;
        container.appendChild(cell);
    }

    renderTimeline(calSelDay);
}

function renderTimeline(day) {
    const tlDate = document.getElementById('tlDate');
    const tlDow  = document.getElementById('tlDow');
    const tl     = document.getElementById('timeline');
    if (!tl) return;

    const dow = new Date(calYear, calMonth - 1, day).getDay();
    const today = new Date();
    const isToday = today.getFullYear() === calYear && today.getMonth() + 1 === calMonth && today.getDate() === day;
    if (tlDate) tlDate.textContent = calMonth + '월 ' + day + '일';
    if (tlDow)  tlDow.textContent  = WEEKDAYS[dow] + '요일' + (isToday ? ' · 오늘' : '');

    const evs = (EVENTS[getEvKey()] || {})[day] || [];

    // KPI 업데이트
    const kpiToday = document.getElementById('kpiToday');
    if (kpiToday) kpiToday.textContent = evs.length;
    const kpiStudents = document.getElementById('kpiStudents');
    if (kpiStudents) kpiStudents.textContent = evs.reduce((s, e) => s + e.students.length, 0);

    if (evs.length === 0) {
        tl.innerHTML = '<div class="no-event">이 날의 레슨이 없습니다</div>';
        return;
    }

    tl.innerHTML = evs.map(e => {
        const p = PLATS[e.plat] || { name:e.plat, emoji:'📍', color:'#888', bg:'var(--surface2)', border:'var(--border)' };
        const typeColor = e.type === 'private' ? '#7c6af7' : p.color;
        const typeLbl   = e.type === 'private' ? '👤 개인레슨' : '👥 그룹레슨';
        const studentTags = e.students.map(s => `<span class="tl-student-tag">${s}</span>`).join('');
        return `
      <div class="tl-item" style="border-left-color:${typeColor}">
        <div class="tl-time" style="color:${typeColor}">${e.time}</div>
        <div class="tl-body">
          <div class="tl-name">${e.name}</div>
          <div class="tl-meta">
            <span class="tl-chip" style="background:${p.bg};color:${p.color};border-color:${p.border}">${p.emoji} ${p.name}</span>
            <span class="tl-chip" style="background:var(--surface2);color:var(--text-sub);border-color:var(--border)">${typeLbl}</span>
          </div>
          <div class="tl-students">${studentTags}</div>
        </div>
      </div>`;
    }).join('');
}

window.calNav = function(delta) {
    calMonth += delta;
    if (calMonth > 12) { calMonth = 1; calYear++; }
    if (calMonth < 1)  { calMonth = 12; calYear--; }
    calSelDay = 1;
    renderCal();
};

// ═══════════════════════════════════════════
//  출결 관리
// ═══════════════════════════════════════════
const ATTEND_DATA = [
    { name:'홍길동', phone:'010-1234-5678', prog:'1:1 개인레슨', plat:'pilates', time:'10:00', status:'present' },
    { name:'김민지', phone:'010-9876-5432', prog:'그룹반 A',     plat:'pilates', time:'09:00', status:'late' },
    { name:'박서준', phone:'010-5555-4444', prog:'그룹반 A',     plat:'pilates', time:'09:00', status:null },
    { name:'이나은', phone:'010-3333-2222', prog:'그룹반 B',     plat:'yoga',    time:'14:00', status:null },
    { name:'정하준', phone:'010-7777-8888', prog:'그룹반 B',     plat:'yoga',    time:'14:00', status:null },
    { name:'오지현', phone:'010-1111-9999', prog:'그룹반 A',     plat:'pilates', time:'09:00', status:null },
];

let currentFilter = 'all';

function renderAttend() {
    const tbody = document.getElementById('attendTbody');
    if (!tbody) return;
    const data = currentFilter === 'all' ? ATTEND_DATA : ATTEND_DATA.filter(r => r.prog.includes(currentFilter));

    tbody.innerHTML = data.map((r, i) => {
        const p = PLATS[r.plat] || { name:r.plat, emoji:'📍', color:'#888', bg:'var(--surface2)', border:'var(--border)' };
        const ps = (s) => s === r.status ? ' ' + s : '';
        return `
      <tr data-idx="${i}">
        <td><div style="font-weight:600">${r.name}</div><div style="font-size:11px;color:var(--text-sub)">${r.phone}</div></td>
        <td>${r.prog}</td>
        <td><span class="chip" style="background:${p.bg};color:${p.color};border-color:${p.border}">${p.emoji} ${p.name}</span></td>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px">${r.time}</span></td>
        <td>
          <div class="attend-toggle">
            <button class="atbtn${ps('present')}" onclick="setAttend(this,'present',${i})">출석</button>
            <button class="atbtn${ps('late')}"    onclick="setAttend(this,'late',${i})">지각</button>
            <button class="atbtn${ps('absent')}"  onclick="setAttend(this,'absent',${i})">결석</button>
          </div>
        </td>
      </tr>`;
    }).join('');

    updateAttendSummary();
}

window.setAttend = function(btn, type, idx) {
    ATTEND_DATA[idx].status = type;
    btn.closest('.attend-toggle').querySelectorAll('.atbtn').forEach(b => {
        b.className = 'atbtn' + (['present','late','absent'].find(t => b.textContent.includes(t === 'present' ? '출석' : t === 'late' ? '지각' : '결석')) === type ? ' ' + type : '');
    });
    updateAttendSummary();
};

function updateAttendSummary() {
    const present = ATTEND_DATA.filter(r => r.status === 'present').length;
    const late    = ATTEND_DATA.filter(r => r.status === 'late').length;
    const absent  = ATTEND_DATA.filter(r => r.status === 'absent').length;
    const pending = ATTEND_DATA.filter(r => !r.status).length;
    const total   = ATTEND_DATA.length;
    const rate    = total > 0 ? Math.round((present + late) / total * 100) : 0;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('sumPresent', present);
    set('sumLate',    late);
    set('sumAbsent',  absent);
    set('sumPending', pending);
    set('sumRate',    rate + '%');
    const bar = document.getElementById('sumRateBar');
    if (bar) bar.style.width = rate + '%';
}

window.attendFilter = function(el, filter) {
    document.querySelectorAll('#attendFilterRow .filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    currentFilter = filter;
    renderAttend();
};

function saveAttend() {
    showToast('✅ 출결이 저장되었습니다.');
}

// ═══════════════════════════════════════════
//  일정 변경 요청
// ═══════════════════════════════════════════
const REQUESTS = [
    {
        title:'홍길동 — 1:1 개인레슨 일정 변경',
        from:'2026.03.11 10:00', to:'2026.03.14 14:00',
        reason:'수강생 개인 사정으로 인한 일정 조정 요청입니다.',
        date:'2026.03.10', plat:'스튜디오 필라테스 강남',
        status:'pending'
    },
    {
        title:'그룹반 B — 요가 수업 보강',
        from:'2026.03.05 14:00', to:'2026.03.08 15:00',
        reason:'강사 컨디션 이슈로 인한 수업 보강 요청입니다.',
        date:'2026.03.04', plat:'요가라운지 홍대',
        status:'approved'
    },
    {
        title:'김민지 — 1:1 개인레슨 취소',
        from:'2026.02.28 16:00', to:'취소 (환불 요청)',
        reason:'수강생 부상으로 인한 레슨 취소 및 잔여 횟수 환급 요청.',
        date:'2026.02.27', plat:'스튜디오 필라테스 강남',
        status:'rejected'
    },
];

function renderRequests() {
    const list = document.getElementById('reqList');
    if (!list) return;
    const statusMap = {
        pending:  { lbl:'검토 중',  cls:'rs-pending'  },
        approved: { lbl:'승인됨',   cls:'rs-approved' },
        rejected: { lbl:'반려됨',   cls:'rs-rejected' },
    };
    list.innerHTML = REQUESTS.map(r => {
        const st = statusMap[r.status] || statusMap.pending;
        return `
      <div class="req-card">
        <div class="req-header">
          <div>
            <div class="req-title">${r.title}</div>
            <div class="req-meta">요청일: ${r.date} · ${r.plat}</div>
          </div>
          <span class="req-status ${st.cls}">${st.lbl}</span>
        </div>
        <div class="req-date-grid">
          <div class="req-date-box">
            <div class="req-date-lbl">기존 일정</div>
            <div class="req-date-val">${r.from}</div>
          </div>
          <div class="req-date-box">
            <div class="req-date-lbl">변경 희망</div>
            <div class="req-date-val" style="color:var(--accent)">${r.to}</div>
          </div>
        </div>
        <div class="req-reason">${r.reason}</div>
      </div>`;
    }).join('');
}

window.submitRequest = function() {
    const student = document.getElementById('reqStudent').value;
    const program = document.getElementById('reqProgram').value;
    const from    = document.getElementById('reqFrom').value;
    const to      = document.getElementById('reqTo').value;
    const reason  = document.getElementById('reqReason').value.trim();
    if (!reason) { showToast('⚠️ 변경 사유를 입력해 주세요.'); return; }

    const fromFormatted = from.replace('T', ' ').replace(/-/g, '.').slice(2);
    const toFormatted   = to.replace('T', ' ').replace(/-/g, '.').slice(2);
    REQUESTS.unshift({
        title: `${student} — ${program} 일정 변경`,
        from: fromFormatted, to: toFormatted, reason,
        date: '2026.03.11', plat: '스튜디오 필라테스 강남',
        status: 'pending',
    });
    renderRequests();
    clearReqForm();
    showToast('✅ 요청이 제출되었습니다.');
};

window.clearReqForm = function() {
    document.getElementById('reqReason').value = '';
};

// ── 토스트 ──────────────────────────────────
window.showToast = function(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
};

// ── setAttend 재정의 (toggle 방식) ───────────
window.setAttend = function(btn, type, idx) {
    if (idx !== undefined) {
        ATTEND_DATA[idx].status = type;
    }
    const toggle = btn.closest('.attend-toggle');
    toggle.querySelectorAll('.atbtn').forEach(b => b.className = 'atbtn');
    btn.classList.add(type);
    updateAttendSummary();
};

// ═══════════════════════════════════════════
//  초기화
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    renderCal();
    renderAttend();
    renderRequests();
});