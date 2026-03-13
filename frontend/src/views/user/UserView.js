
// ══════════════════════════════════════════
//  ReserveHub 사용자 JS
// ══════════════════════════════════════════

// ── 사이드바 ──────────────────────────────
function openSidebar() {
    document.getElementById('user-sidebar').classList.add('open');
    document.getElementById('user-overlay').classList.add('open');
}
function closeSidebar() {
    document.getElementById('user-sidebar').classList.remove('open');
    document.getElementById('user-overlay').classList.remove('open');
}
function toggleCollapse() {
    document.getElementById('user-sidebar').classList.toggle('collapsed');
}

// ── 페이지 전환 ───────────────────────────
const PAGE_TITLES = {
    calendar:    '내 캘린더',
    reservation: '예약하기',
    mypage:      '마이페이지',
};
window.showPage = function(name, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#user-nav .nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    if (el) el.classList.add('active');
    document.getElementById('topbar-title').textContent = PAGE_TITLES[name] || name;
    closeSidebar();
};

// ═══════════════════════════════════════════
//  달력
// ═══════════════════════════════════════════
// 날짜별 예약 데이터 (월별 key: "YYYY-M")
const RESERVATIONS = {
    '2026-3': {
        3:  [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' }],
        5:  [{ time:'14:00', name:'1번 연습실', place:'뮤직하우스 홍대점', color:'var(--accent3)' }],
        7:  [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' }],
        10: [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' },
            { time:'14:00', name:'1번 연습실',       place:'뮤직하우스 홍대점',         color:'var(--accent3)' }],
        11: [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' },
            { time:'14:00', name:'1번 연습실',       place:'뮤직하우스 홍대점',         color:'var(--accent3)' }],
        14: [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' }],
        17: [{ time:'14:00', name:'1번 연습실',       place:'뮤직하우스 홍대점',         color:'var(--accent3)' }],
        21: [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' }],
        24: [{ time:'14:00', name:'1번 연습실',       place:'뮤직하우스 홍대점',         color:'var(--accent3)' }],
    },
    '2026-4': {
        2:  [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' }],
        7:  [{ time:'14:00', name:'1번 연습실',       place:'뮤직하우스 홍대점',         color:'var(--accent3)' }],
        14: [{ time:'10:00', name:'필라테스 그룹반 A', place:'스튜디오 필라테스 강남점', color:'var(--accent)' }],
    },
};

const WEEKDAYS_KO = ['일','월','화','수','목','금','토'];
let calYear = 2026, calMonth = 3, calSelectedDay = 11;

function getResKey() { return calYear + '-' + calMonth; }

function renderCal() {
    const label = document.getElementById('calMonthLabel');
    if (label) label.textContent = calYear + '년 ' + calMonth + '월';

    const container = document.getElementById('calDays');
    if (!container) return;
    container.innerHTML = '';

    const today = new Date();
    const isCurrentMonth = (today.getFullYear() === calYear && today.getMonth() + 1 === calMonth);
    const todayDay = isCurrentMonth ? today.getDate() : -1;

    const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const daysInPrev  = new Date(calYear, calMonth - 1, 0).getDate();
    const resData = RESERVATIONS[getResKey()] || {};

    // 이전달 빈칸
    for (let i = 0; i < firstDow; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell dim';
        cell.textContent = daysInPrev - firstDow + 1 + i;
        container.appendChild(cell);
    }

    // 이번달
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const hasRes = !!resData[d];
        const isToday = (d === todayDay);
        const isSel   = (d === calSelectedDay);

        let cls = 'cal-cell';
        if (isSel)  cls += ' selected';
        else if (isToday) cls += ' today';
        if (hasRes) cls += ' has-lesson';
        cell.className = cls;
        cell.textContent = d;

        const _d = d;
        cell.addEventListener('click', function() {
            calSelectedDay = _d;
            renderCal();
            renderDayDetail(_d);
        });
        container.appendChild(cell);
    }

    // 다음달 빈칸
    const total = firstDow + daysInMonth;
    const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= remain; i++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell dim';
        cell.textContent = i;
        container.appendChild(cell);
    }

    // 선택된 날 상세 업데이트
    renderDayDetail(calSelectedDay);
}

function renderDayDetail(day) {
    const titleEl  = document.getElementById('calDayTitle');
    const detailEl = document.getElementById('calDayDetail');
    if (!titleEl || !detailEl) return;

    const dow = new Date(calYear, calMonth - 1, day).getDay();
    const today = new Date();
    const isToday = (today.getFullYear() === calYear && today.getMonth() + 1 === calMonth && today.getDate() === day);
    titleEl.textContent = calMonth + '월 ' + day + '일 ' + WEEKDAYS_KO[dow] + '요일' + (isToday ? ' — 오늘' : '');

    const resData = (RESERVATIONS[getResKey()] || {})[day];
    if (!resData || resData.length === 0) {
        detailEl.innerHTML = '<div class="no-event">예약된 일정이 없습니다</div>';
        return;
    }
    detailEl.innerHTML = '<div class="lesson-list">' +
        resData.map(r => `
      <div class="lesson-item" style="border-left-color:${r.color}">
        <div class="lesson-time" style="color:${r.color}">${r.time}</div>
        <div class="lesson-body">
          <div class="lesson-name">${r.name}</div>
          <div class="lesson-place">${r.place}</div>
        </div>
        <div class="lesson-tag" style="background:rgba(124,106,247,.12);color:${r.color}">예약됨</div>
      </div>`).join('') +
        '</div>';
}

window.calNav = function(delta) {
    calMonth += delta;
    if (calMonth > 12) { calMonth = 1; calYear++; }
    if (calMonth < 1)  { calMonth = 12; calYear--; }
    calSelectedDay = 1;
    renderCal();
};

// ═══════════════════════════════════════════
//  타이머
// ═══════════════════════════════════════════
let timerInterval = null, timerSec = 0, timerRunning = false;

function pad2(n) { return String(n).padStart(2, '0'); }

function updateTimerDisplay() {
    const h = Math.floor(timerSec / 3600);
    const m = Math.floor((timerSec % 3600) / 60);
    const s = timerSec % 60;
    const el = document.getElementById('timerDigits');
    if (el) el.textContent = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
}

window.toggleTimer = function() {
    const btn = document.getElementById('timerToggleBtn');
    if (!timerRunning) {
        timerRunning = true;
        if (btn) { btn.textContent = '일시정지'; btn.style.background = 'var(--accent2)'; btn.style.color = '#0f0f13'; }
        timerInterval = setInterval(function() { timerSec++; updateTimerDisplay(); }, 1000);
    } else {
        timerRunning = false;
        if (btn) { btn.textContent = '재개'; btn.style.background = 'var(--accent)'; btn.style.color = 'white'; }
        clearInterval(timerInterval);
    }
};

window.resetTimer = function() {
    clearInterval(timerInterval);
    timerRunning = false;
    timerSec = 0;
    updateTimerDisplay();
    const btn = document.getElementById('timerToggleBtn');
    if (btn) { btn.textContent = '시작'; btn.style.background = 'var(--accent)'; btn.style.color = 'white'; }
};

window.setTimerType = function(el) {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
};

// ═══════════════════════════════════════════
//  예약하기
// ═══════════════════════════════════════════
const PROGRAMS = [
    { id:'p1', cat:'pilates', icon:'🤸', name:'필라테스 그룹반 A', meta:'스튜디오 필라테스 강남 · 60분 · 최대 8명',    badge:'그룹 레슨',   badgeCls:'badge-group',   bg:'rgba(124,106,247,.15)', maxSlots:8 },
    { id:'p2', cat:'pilates', icon:'🤸', name:'필라테스 1:1 개인레슨', meta:'스튜디오 필라테스 강남 · 50분 · 개인',    badge:'개인 레슨',   badgeCls:'badge-private', bg:'rgba(79,209,197,.15)',  maxSlots:1 },
    { id:'p3', cat:'yoga',    icon:'🧘', name:'요가 기초반',       meta:'요가라운지 홍대 · 60분 · 최대 10명',           badge:'그룹 레슨',   badgeCls:'badge-group',   bg:'rgba(124,106,247,.15)', maxSlots:10 },
    { id:'p4', cat:'music',   icon:'🎵', name:'1번 연습실',        meta:'뮤직하우스 홍대 · 60분 단위 · 개인/팀',         badge:'공간 예약',   badgeCls:'badge-room',    bg:'rgba(246,173,85,.15)',  maxSlots:1 },
    { id:'p5', cat:'music',   icon:'🎸', name:'2번 연습실 (드럼)', meta:'뮤직하우스 홍대 · 60분 단위 · 개인/팀',         badge:'공간 예약',   badgeCls:'badge-room',    bg:'rgba(246,173,85,.15)',  maxSlots:1 },
    { id:'p6', cat:'fitness', icon:'🏋️', name:'헬스장 자유이용',  meta:'피트니스 클럽 서초 · 시간 자유 · 개인',          badge:'자유이용',    badgeCls:'badge-room',    bg:'rgba(246,173,85,.15)',  maxSlots:20 },
];

// 시간대별 예약 현황 (프로그램별 · 날짜별 랜덤)
const SLOT_TIMES = ['09:00','10:00','11:00','14:00','15:00','16:00','18:00','19:00'];
function getSlots(prog, dateOffset) {
    // 시드 기반 결정적 랜덤
    const seed = (prog.id.charCodeAt(1) * 7 + dateOffset * 13) % 100;
    return SLOT_TIMES.map((t, i) => {
        const used = Math.floor(((seed + i * 17) % 100) / 100 * prog.maxSlots);
        return { time: t, used, max: prog.maxSlots };
    });
}

let selectedProg = null, selectedDateOffset = 0, selectedSlotIdx = null;
let currentFilter = 'all';

function renderPrograms() {
    const list = document.getElementById('programList');
    if (!list) return;
    const visible = currentFilter === 'all' ? PROGRAMS : PROGRAMS.filter(p => p.cat === currentFilter);
    list.innerHTML = visible.map(p => `
    <div class="program-card${selectedProg && selectedProg.id === p.id ? ' selected' : ''}"
         onclick="selectProgram('${p.id}')">
      <div class="program-icon" style="background:${p.bg}">${p.icon}</div>
      <div class="program-body">
        <div class="program-name">${p.name}</div>
        <div class="program-meta">${p.meta}</div>
      </div>
      <span class="prog-badge ${p.badgeCls}">${p.badge}</span>
    </div>`).join('');
}

window.filterChip = function(el, cat) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    currentFilter = cat;
    renderPrograms();
};

window.selectProgram = function(id) {
    selectedProg = PROGRAMS.find(p => p.id === id) || null;
    selectedDateOffset = 0;
    selectedSlotIdx = null;
    renderPrograms();
    renderSlotPanel();
};

function renderSlotPanel() {
    const dateLabel = document.getElementById('slotDateLabel');
    const subLabel  = document.getElementById('slotSubLabel');
    const dateRow   = document.getElementById('slotDateRow');
    const slotList  = document.getElementById('slotList');
    const confirmBox = document.getElementById('confirmBox');
    const noMsg      = document.getElementById('noSlotMsg');

    if (!selectedProg) {
        if (noMsg) noMsg.style.display = 'block';
        if (confirmBox) confirmBox.style.display = 'none';
        if (slotList) slotList.innerHTML = '';
        if (dateRow) dateRow.innerHTML = '';
        return;
    }
    if (noMsg) noMsg.style.display = 'none';

    if (dateLabel) dateLabel.textContent = selectedProg.name;

    // 날짜 버튼 7일
    const today = new Date(2026, 2, 11); // 2026-03-11
    if (dateRow) {
        dateRow.innerHTML = Array.from({length: 7}, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const mon = d.getMonth() + 1;
            const day = d.getDate();
            const dow = ['일','월','화','수','목','금','토'][d.getDay()];
            return `<button class="slot-nav-btn${i === selectedDateOffset ? ' active' : ''}"
                onclick="selectDate(${i})">${mon}/${day}<br><small>${dow}</small></button>`;
        }).join('');
    }

    // 선택 날짜
    const selDate = new Date(today);
    selDate.setDate(today.getDate() + selectedDateOffset);
    const mon = selDate.getMonth() + 1;
    const day = selDate.getDate();
    const dow = WEEKDAYS_KO[selDate.getDay()];
    if (subLabel) subLabel.textContent = mon + '월 ' + day + '일 ' + dow + '요일';

    // 슬롯
    const slots = getSlots(selectedProg, selectedDateOffset);
    if (slotList) {
        slotList.innerHTML = slots.map((s, i) => {
            const isFull = s.used >= s.max;
            const pct    = Math.round(s.used / s.max * 100);
            const remain = s.max - s.used;
            let statusCls = 'status-open', statusLabel = '예약 가능';
            if (isFull) { statusCls = 'status-full'; statusLabel = '마감'; }
            else if (remain <= 2) { statusCls = 'status-few'; statusLabel = '마감 임박'; }
            const isSel = (i === selectedSlotIdx);
            return `<div class="slot-item${isFull ? ' full' : ''}${isSel ? ' selected-slot' : ''}"
                   onclick="selectSlot(${i})">
        <div class="slot-time">${s.time}</div>
        <div class="slot-bar-wrap">
          <div class="slot-bar-bg"><div class="slot-bar" style="width:${pct}%"></div></div>
          <div class="slot-count">${s.used} / ${s.max}명</div>
        </div>
        <span class="slot-status ${statusCls}">${statusLabel}</span>
      </div>`;
        }).join('');
    }

    renderConfirm();
}

window.selectDate = function(offset) {
    selectedDateOffset = offset;
    selectedSlotIdx = null;
    renderSlotPanel();
};

window.selectSlot = function(idx) {
    const slots = getSlots(selectedProg, selectedDateOffset);
    if (!slots[idx] || slots[idx].used >= slots[idx].max) return;
    selectedSlotIdx = idx;
    renderSlotPanel();
};

function renderConfirm() {
    const confirmBox = document.getElementById('confirmBox');
    if (!confirmBox) return;
    if (!selectedProg || selectedSlotIdx === null) {
        confirmBox.style.display = 'none';
        return;
    }
    confirmBox.style.display = 'block';

    const slots = getSlots(selectedProg, selectedDateOffset);
    const slot  = slots[selectedSlotIdx];
    const today = new Date(2026, 2, 11);
    const selDate = new Date(today);
    selDate.setDate(today.getDate() + selectedDateOffset);

    const mon = selDate.getMonth() + 1;
    const day = selDate.getDate();

    document.getElementById('confirmProg').textContent   = selectedProg.name;
    document.getElementById('confirmDate').textContent   = mon + '월 ' + day + '일';
    document.getElementById('confirmTime').textContent   = slot.time;
    document.getElementById('confirmRemain').textContent = (slot.max - slot.used) + '석';
}

window.doReserve = function() {
    if (!selectedProg || selectedSlotIdx === null) return;
    const slots = getSlots(selectedProg, selectedDateOffset);
    const slot  = slots[selectedSlotIdx];
    showToast('✅ ' + selectedProg.name + ' ' + slot.time + ' 예약 완료!');
    selectedSlotIdx = null;
    document.getElementById('confirmBox').style.display = 'none';
    renderSlotPanel();
};

// ── 토스트 ──────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
}

// ═══════════════════════════════════════════
//  초기화
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    renderCal();
    renderPrograms();
    renderSlotPanel();
});