
// ══════════════════════════════════════════
//  ReserveHub 서브담당자 JS
// ══════════════════════════════════════════

// ── 사이드바 ──────────────────────────────
function openSidebar(){ document.getElementById('subsup-sidebar').classList.add('open'); document.getElementById('subsup-overlay').classList.add('open'); }
function closeSidebar(){ document.getElementById('subsup-sidebar').classList.remove('open'); document.getElementById('subsup-overlay').classList.remove('open'); }
function toggleCollapse(){ document.getElementById('subsup-sidebar').classList.toggle('collapsed'); }

// ── 페이지 전환 ───────────────────────────
const PAGE_TITLES = { dashboard:'대시보드', approval:'승인 관리', members:'회원 관리', instructors:'강사 관리', billing:'수강권 / 결제', calc:'상담 계산툴', calendar:'캘린더', history:'수업 이력', mypage:'내 정보' };
window.showPage = function(name, el) {
    document.querySelectorAll('#subsup-app .page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#subsup-nav .nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('subsup-' + name).classList.add('active');
    if (el) el.classList.add('active');
    document.getElementById('topbar-title').textContent = PAGE_TITLES[name] || name;
    closeSidebar();
};

// ── 모달 ─────────────────────────────────
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
window.openShareEventModal = () => openModal('shareEventModal');
window.closeShareEventModal = () => closeModal('shareEventModal');
window.openDiscountModal = () => openModal('discountModal');
window.openAddMemberModal = () => openModal('addMemberModal');
window.openAddInstructorModal = () => openModal('addInstructorModal');
window.openPassModal = () => openModal('passModal');

// ── 토스트 ───────────────────────────────
window.showToast = function(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
};

// ═══════════════════════════════════════════
//  플랫폼 데이터
// ═══════════════════════════════════════════
const PLATS_DATA = {
    pilates: { emoji:'🤸', name:'스튜디오 필라테스 강남', short:'🤸 필라테스 강남', members:'142', instructors:'4', revenue:'9.8만', attend:'93%', pending:'2' },
    yoga:    { emoji:'🧘', name:'요가라운지 홍대',        short:'🧘 요가라운지 홍대', members:'86',  instructors:'2', revenue:'5.2만', attend:'89%', pending:'0' },
};
let currentPlat = 'pilates';

window.switchPlat = function(id, el) {
    currentPlat = id;
    const p = PLATS_DATA[id];
    document.querySelectorAll('.plat-tab-btn').forEach(t => { t.classList.remove('active'); });
    el.classList.add('active');
    document.getElementById('topbar-plat').textContent = p.short;
    document.getElementById('dash-plat-title').textContent = p.name;
    // KPI 업데이트
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('kpi-members', p.members); set('kpi-revenue', p.revenue); set('kpi-attend', p.attend); set('kpi-pending', p.pending);
};

// ═══════════════════════════════════════════
//  대시보드 — 재결제 임박 렌더
// ═══════════════════════════════════════════
const RENEWAL_DATA = [
    { dday:1,  name:'박서준', pass:'개인 10회권', exp:'2026.03.12', dcolor:'#f87171', bg:'rgba(248,113,113,.15)' },
    { dday:3,  name:'홍길동', pass:'그룹 월정액',  exp:'2026.03.14', dcolor:'#f6ad55', bg:'rgba(246,173,85,.15)' },
    { dday:5,  name:'이나은', pass:'개인 5회권',  exp:'2026.03.16', dcolor:'#f6ad55', bg:'rgba(246,173,85,.15)' },
    { dday:7,  name:'정하준', pass:'그룹 월정액',  exp:'2026.03.18', dcolor:'#7c6af7', bg:'rgba(124,106,247,.12)' },
    { dday:7,  name:'오지현', pass:'그룹 월정액',  exp:'2026.03.18', dcolor:'#7c6af7', bg:'rgba(124,106,247,.12)' },
];
function renderRenewal() {
    const el = document.getElementById('renewal-list');
    if (!el) return;
    el.innerHTML = RENEWAL_DATA.map(r => `
    <div class="renewal-item">
      <div class="renewal-dday" style="background:${r.bg};color:${r.dcolor}">D-${r.dday}</div>
      <div class="renewal-body">
        <div class="renewal-name">${r.name}</div>
        <div class="renewal-meta">${r.pass} · ${r.exp} 만료</div>
      </div>
      <button class="btn btn-sm" style="background:${r.bg};color:${r.dcolor};border:1px solid ${r.dcolor.replace(')',',0.3)').replace('rgb','rgba')};font-size:11px;flex-shrink:0" onclick="showToast('${r.name}님께 알림을 발송했습니다.')">연락</button>
    </div>`).join('');
}

// ═══════════════════════════════════════════
//  승인 관리
// ═══════════════════════════════════════════
let APPROVAL_DATA = [
    { id:'a1', title:'홍길동 — 1:1 개인레슨 일정 변경', requester:'이수진 트레이너', from:'2026.03.11 10:00', to:'2026.03.14 14:00', reason:'수강생 개인 사정으로 인한 일정 조정 요청입니다.', date:'2026.03.10', status:'pending' },
    { id:'a2', title:'박서준 — 수강권 환불 요청', requester:'자동 시스템', from:'개인 10회권 잔여 6회', to:'결제 취소 (환불)', reason:'수강생 부상으로 인한 수강 중단 및 잔여분 환불 요청입니다.', date:'2026.03.09', status:'pending' },
    { id:'a3', title:'김민지 — 그룹반 A 일정 변경', requester:'이수진 트레이너', from:'2026.03.05 09:00', to:'2026.03.07 10:00', reason:'강사 일정으로 인한 수업 조정 요청입니다.', date:'2026.03.04', status:'approved', memo:'승인 처리 완료', processedAt:'2026.03.05 09:30' },
    { id:'a4', title:'최유나 — 개인레슨 취소', requester:'김현우 트레이너', from:'2026.02.28 16:00', to:'취소 요청', reason:'수강생 해외 출장으로 인한 레슨 취소 요청입니다.', date:'2026.02.27', status:'rejected', memo:'환불 정책 미충족으로 반려', processedAt:'2026.02.28 08:00' },
];
let approvalFilter_current = 'all';

function renderApprovals() {
    const el = document.getElementById('approval-list');
    if (!el) return;
    const data = approvalFilter_current === 'all' ? APPROVAL_DATA : APPROVAL_DATA.filter(r => r.status === approvalFilter_current);
    const stMap = { pending:{ lbl:'대기 중', cls:'bs-pending', lc:'var(--accent3)' }, approved:{ lbl:'승인됨', cls:'bs-approved', lc:'var(--green)' }, rejected:{ lbl:'반려됨', cls:'bs-rejected', lc:'var(--red)' } };
    if (data.length === 0) { el.innerHTML = '<div class="card" style="text-align:center;padding:32px;color:var(--text-dim)">해당 조건의 요청이 없습니다</div>'; return; }
    el.innerHTML = data.map(r => {
        const st = stMap[r.status];
        const borderColor = r.status === 'pending' ? 'var(--accent3)' : r.status === 'approved' ? 'var(--green)' : 'var(--red)';
        const processedBlock = r.status !== 'pending' ? `
      <div style="margin-top:10px;background:${r.status==='approved'?'rgba(74,222,128,.06)':'rgba(248,113,113,.06)'};border:1px solid ${r.status==='approved'?'rgba(74,222,128,.2)':'rgba(248,113,113,.2)'};border-radius:var(--rs);padding:10px 12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;font-weight:600;color:${r.status==='approved'?'var(--green)':'var(--red)'}">${r.status==='approved'?'✓ 승인됨':'✗ 반려됨'}</span>
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim)">${r.processedAt}</span>
        </div>
        <div style="font-size:11px;color:var(--text-sub)">처리자: <span style="color:var(--accent);font-weight:600">정미래 점장</span> · 메모: ${r.memo}</div>
      </div>` : `
      <div style="margin-bottom:10px">
        <div style="font-size:10px;color:var(--text-dim);letter-spacing:1px;margin-bottom:5px">처리 메모</div>
        <textarea class="req-memo" data-id="${r.id}" placeholder="처리 사유나 특이사항을 입력하세요..."></textarea>
      </div>
      <div class="req-footer">
        <div class="req-footer-hint">처리 시 <span style="color:var(--accent);font-weight:600">정미래 점장</span> · 현재 시각 자동 기록</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-danger btn-sm" onclick="processApproval('${r.id}','rejected')">반려</button>
          <button class="btn btn-sm" style="background:rgba(74,222,128,.15);color:var(--green);border:1px solid rgba(74,222,128,.3)" onclick="processApproval('${r.id}','approved')">승인</button>
        </div>
      </div>`;
        return `
      <div class="req-card" style="border-left-color:${borderColor}">
        <div class="req-header">
          <div>
            <div class="req-title">${r.title}</div>
            <div class="req-meta">요청자: ${r.requester} · ${r.date}</div>
          </div>
          <span class="badge ${st.cls}">${st.lbl}</span>
        </div>
        <div class="req-date-row">
          <div class="req-date-box"><div class="req-date-lbl">기존 일정</div><div class="req-date-val">${r.from}</div></div>
          <div class="req-date-box"><div class="req-date-lbl">변경 희망</div><div class="req-date-val" style="color:var(--accent)">${r.to}</div></div>
        </div>
        <div class="req-reason">${r.reason}</div>
        ${processedBlock}
      </div>`;
    }).join('');
}

window.approvalFilter = function(el, filter) {
    document.querySelectorAll('#subsup-approval .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    approvalFilter_current = filter;
    renderApprovals();
};

window.processApproval = function(id, action) {
    const req = APPROVAL_DATA.find(r => r.id === id);
    if (!req) return;
    const memoEl = document.querySelector(`.req-memo[data-id="${id}"]`);
    req.memo = memoEl ? memoEl.value || '—' : '—';
    const now = new Date();
    req.processedAt = (now.getMonth()+1).toString().padStart(2,'0') + '.' + now.getDate().toString().padStart(2,'0') + ' ' + now.toTimeString().slice(0,5);
    req.status = action;
    renderApprovals();
    // 배지 카운트
    const cnt = APPROVAL_DATA.filter(r => r.status === 'pending').length;
    const badge = document.getElementById('approval-badge');
    if (badge) { badge.textContent = cnt; badge.style.display = cnt > 0 ? 'flex' : 'none'; }
    document.getElementById('kpi-pending').textContent = cnt;
    showToast(action === 'approved' ? '✅ 승인 처리되었습니다.' : '❌ 반려 처리되었습니다.');
};

// ═══════════════════════════════════════════
//  회원 관리
// ═══════════════════════════════════════════
let MEMBERS = [
    { name:'박서준', phone:'010-5555-4444', pass:'개인 10회권', exp:'2026.03.12', dday:1,  status:'soon',    notes:[] },
    { name:'홍길동', phone:'010-1234-5678', pass:'그룹 월정액',  exp:'2026.03.14', dday:3,  status:'soon',    notes:[] },
    { name:'김민지', phone:'010-9876-5432', pass:'그룹 월정액',  exp:'2026.04.10', dday:30, status:'active',  notes:[] },
    { name:'이나은', phone:'010-3333-2222', pass:'개인 5회권',   exp:'2026.03.16', dday:5,  status:'soon',    notes:[] },
    { name:'정하준', phone:'010-7777-8888', pass:'그룹 월정액',  exp:'2026.04.20', dday:40, status:'active',  notes:[] },
    { name:'오지현', phone:'010-1111-9999', pass:'그룹 월정액',  exp:'2026.04.01', dday:21, status:'active',  notes:[] },
    { name:'최유나', phone:'010-2020-3030', pass:'그룹 월정액',  exp:'2026.04.15', dday:35, status:'active',  notes:[] },
    { name:'이지은', phone:'010-2222-3333', pass:'—',            exp:'만료',       dday:null, status:'expired', notes:[] },
];
let memberFilterCurrent = 'all';
let memberDetailIdx = null;

window.renderMembers = function() {
    const search = (document.getElementById('memberSearch')?.value || '').trim().toLowerCase();
    const tbody = document.getElementById('memberTbody');
    if (!tbody) return;
    const filtered = MEMBERS.filter(m => {
        const matchFilter = memberFilterCurrent === 'all' || m.status === memberFilterCurrent;
        const matchSearch = !search || m.name.includes(search) || m.phone.includes(search);
        return matchFilter && matchSearch;
    });
    tbody.innerHTML = filtered.map((m, i) => {
        const realIdx = MEMBERS.indexOf(m);
        const ddayEl = m.dday === null ? '—' :
            m.status === 'expired' ? '<span class="badge bs-expired" style="font-size:10px">만료</span>' :
                m.dday <= 3 ? `<span class="badge bs-expired" style="font-size:10px">D-${m.dday}</span>` :
                    m.dday <= 7 ? `<span class="badge bs-soon" style="font-size:10px">D-${m.dday}</span>` :
                        `<span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--accent2)">D-${m.dday}</span>`;
        const stMap = { active:'bs-active', soon:'bs-soon', expired:'bs-expired' };
        const stLbl = { active:'활성', soon:'임박', expired:'만료' };
        return `<tr>
      <td style="font-weight:600">${m.name}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px">${m.phone}</td>
      <td>${m.pass}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px">${m.exp}</td>
      <td>${ddayEl}</td>
      <td><span class="badge ${stMap[m.status]}" style="font-size:10px">${stLbl[m.status]}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="showMemberDetail(${realIdx})">상세</button></td>
    </tr>`;
    }).join('');
};

window.memberFilter = function(el, filter) {
    document.querySelectorAll('#subsup-members .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    memberFilterCurrent = filter;
    renderMembers();
};

window.showMemberDetail = function(idx) {
    memberDetailIdx = idx;
    const m = MEMBERS[idx];
    const panel = document.getElementById('memberDetailPanel');
    if (!panel) return;
    panel.style.display = 'block';
    panel.innerHTML = `
    <div class="member-detail">
      <div class="member-detail-header">
        <div style="font-size:16px;font-weight:700">${m.name} 상세 정보</div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('memberDetailPanel').style.display='none'">닫기</button>
      </div>
      <div class="member-detail-grid" style="margin-bottom:16px">
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--accent2)">${m.pass}</div><div class="detail-stat-key">현재 수강권</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:${m.status==='expired'?'var(--red)':'var(--accent3)'}">${m.exp}</div><div class="detail-stat-key">만료일</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--green)">18회</div><div class="detail-stat-key">이번달 출석</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--accent)">92%</div><div class="detail-stat-key">출결률</div></div>
      </div>
      <!-- 메모 -->
      <div style="font-size:11px;color:var(--text-sub);margin-bottom:8px;font-weight:600;letter-spacing:.5px">CONSULTATION NOTES</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;min-height:40px" id="memoList-${idx}">
        ${m.notes.length === 0 ? '<div style="font-size:12px;color:var(--text-dim);padding:8px 0">상담 메모가 없습니다</div>' :
        m.notes.map(n => `<div class="memo-item"><span class="memo-date">${n.date}</span><div style="flex:1;font-size:12px">${n.text}</div><span class="memo-author">${n.author}</span></div>`).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <input type="text" id="memoInput-${idx}" placeholder="상담 메모 입력..." style="flex:1;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;outline:none;font-family:'Pretendard',sans-serif;">
        <button class="btn btn-primary btn-sm" style="background:var(--accent);color:#0f0f13" onclick="addMemo(${idx})">추가</button>
      </div>
    </div>`;
    panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
};

window.addMemo = function(idx) {
    const input = document.getElementById(`memoInput-${idx}`);
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const date = (now.getMonth()+1).toString().padStart(2,'0') + '.' + now.getDate().toString().padStart(2,'0');
    MEMBERS[idx].notes.unshift({ date, text, author:'정미래' });
    input.value = '';
    showMemberDetail(idx);
    showToast('메모가 저장되었습니다.');
};

window.submitAddMember = function() {
    const name = document.getElementById('newMemberName').value.trim();
    const phone = document.getElementById('newMemberPhone').value.trim();
    const passVal = document.getElementById('newMemberPass').value;
    if (!name || !phone) { showToast('⚠️ 이름과 연락처를 입력해 주세요.'); return; }
    const [pass, exp] = passVal.split('|');
    const today = new Date();
    const expDate = new Date(exp);
    const dday = Math.ceil((expDate - today) / (1000*60*60*24));
    const status = dday <= 7 ? 'soon' : 'active';
    MEMBERS.unshift({ name, phone, pass, exp: exp.replace(/-/g,'.'), dday, status, notes:[] });
    closeModal('addMemberModal');
    renderMembers();
    showToast(`✅ ${name}님이 등록되었습니다.`);
};

// ═══════════════════════════════════════════
//  강사 관리
// ═══════════════════════════════════════════
let INSTRUCTORS = [
    { name:'이수진', title:'트레이너', program:'그룹반 A · 그룹반 B · 1:1 개인레슨', students:18, lessons:86, attend:'93%', status:'active', color:'linear-gradient(135deg,var(--accent2),#667eea)' },
    { name:'김현우', title:'트레이너', program:'그룹반 A 보조 · 그룹반 C', students:12, lessons:42, attend:'90%', status:'active', color:'linear-gradient(135deg,#f6ad55,#ed8936)' },
    { name:'박지현', title:'트레이너', program:'요가 기초반 · 요가 심화반', students:16, lessons:54, attend:'88%', status:'active', color:'linear-gradient(135deg,#4fd1c5,#38b2ac)' },
    { name:'최수민', title:'트레이너', program:'1:1 개인레슨 (요가)', students:5, lessons:20, attend:'95%', status:'active', color:'linear-gradient(135deg,#f87171,#fc8181)' },
];

function renderInstructors() {
    const el = document.getElementById('instructor-list');
    if (!el) return;
    el.innerHTML = INSTRUCTORS.map(inst => `
    <div class="card" style="display:flex;align-items:center;gap:16px">
      <div style="width:46px;height:46px;border-radius:50%;background:${inst.color};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:white;flex-shrink:0">${inst.name[0]}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:700">${inst.name} ${inst.title}</div>
        <div style="font-size:11px;color:var(--text-sub);margin-top:3px">${inst.program}</div>
        <div style="display:flex;gap:14px;margin-top:8px;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:16px;color:var(--accent2)">${inst.students}</div><div style="font-size:10px;color:var(--text-dim)">담당 수강생</div></div>
          <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:16px;color:var(--accent)">${inst.lessons}</div><div style="font-size:10px;color:var(--text-dim)">이번달 레슨</div></div>
          <div style="text-align:center"><div style="font-family:'DM Mono',monospace;font-size:16px;color:var(--green)">${inst.attend}</div><div style="font-size:10px;color:var(--text-dim)">출결률</div></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0">
        <span class="badge bs-active" style="font-size:10px">재직 중</span>
        <button class="btn btn-ghost btn-sm">수정</button>
      </div>
    </div>`).join('');
}

window.submitAddInstructor = function() {
    const name = document.getElementById('newInstName').value.trim();
    const program = document.getElementById('newInstProgram').value.trim();
    if (!name) { showToast('⚠️ 이름을 입력해 주세요.'); return; }
    INSTRUCTORS.unshift({ name: name.replace(' 트레이너',''), title:'트레이너', program: program || '—', students:0, lessons:0, attend:'—', status:'active', color:'linear-gradient(135deg,#7c6af7,#a78bfa)' });
    closeModal('addInstructorModal');
    renderInstructors();
    showToast(`✅ ${name}이 등록되었습니다.`);
};

// ═══════════════════════════════════════════
//  수강권/결제 탭
// ═══════════════════════════════════════════
window.billingTab = function(tab, el) {
    document.querySelectorAll('#subsup-billing .tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#subsup-billing .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btab-' + tab).classList.add('active');
    el.classList.add('active');
};

// 할인 정책 데이터
let DISCOUNTS = [
    { id:'d1', name:'재등록 할인', rate:10, target:'전체 수강권', active:true },
    { id:'d2', name:'가족 할인', rate:15, target:'그룹 월정액', active:true },
    { id:'d3', name:'학생 할인', rate:20, target:'그룹 월정액', active:false },
];

function renderDiscounts() {
    const el = document.getElementById('discount-list');
    if (!el) return;
    el.innerHTML = DISCOUNTS.map(d => `
    <div class="card" id="disc-${d.id}" style="opacity:${d.active?1:.55}">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700">${d.name}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:4px">${d.target} · ${d.rate}% 할인</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div onclick="toggleDiscount('${d.id}')" style="width:36px;height:20px;border-radius:10px;background:${d.active?'var(--accent)':'var(--border)'};cursor:pointer;position:relative;transition:background .2s;flex-shrink:0">
            <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;${d.active?'right:2px':'left:2px'};transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>
          </div>
          <span style="font-size:11px;font-weight:600;color:${d.active?'var(--accent)':'var(--text-dim)'};min-width:28px">${d.active?'활성':'비활성'}</span>
          <button class="btn btn-ghost btn-sm" onclick="editDiscount('${d.id}')">수정</button>
        </div>
      </div>
    </div>`).join('');
}

window.toggleDiscount = function(id) {
    const d = DISCOUNTS.find(x => x.id === id);
    if (d) { d.active = !d.active; renderDiscounts(); }
};
window.editDiscount = function(id) { openModal('discountModal'); };

window.submitDiscount = function() {
    const name = document.getElementById('newDiscName').value.trim();
    const rate = parseFloat(document.getElementById('newDiscRate').value) || 10;
    const target = document.getElementById('newDiscTarget').value;
    if (!name) { showToast('⚠️ 정책명을 입력하세요.'); return; }
    const newId = 'd' + Date.now();
    DISCOUNTS.unshift({ id:newId, name, rate, target, active:true });
    closeModal('discountModal');
    renderDiscounts();
    showToast('✅ 할인 정책이 추가되었습니다.');
};

window.submitPass = function() {
    const name = document.getElementById('newPassName').value.trim();
    if (!name) { showToast('⚠️ 수강권명을 입력하세요.'); return; }
    closeModal('passModal');
    showToast(`✅ "${name}" 수강권이 추가되었습니다.`);
};

// ═══════════════════════════════════════════
//  상담 계산툴
// ═══════════════════════════════════════════
const PASS_LIST = [
    { name:'그룹 월정액', price:95000, unit:'무제한', period:'30일' },
    { name:'개인 10회권', price:350000, unit:'10회', period:'60일' },
    { name:'개인 5회권', price:190000, unit:'5회', period:'45일' },
    { name:'체험 1회권', price:30000, unit:'1회', period:'1일' },
];
const DISC_LIST = [
    { name:'재등록 할인', rate:10 },
    { name:'가족 할인', rate:15 },
    { name:'학생 할인', rate:20 },
];

function renderCalcUI() {
    const passEl = document.getElementById('passCheckList');
    if (passEl) {
        passEl.innerHTML = PASS_LIST.map((p,i) => `
      <label class="calc-pass-row" data-price="${p.price}" data-name="${p.name}" data-unit="${p.unit}">
        <input type="checkbox" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0" onchange="calcRender()">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600">${p.name}</div>
          <div style="font-size:11px;color:var(--text-sub)">${p.unit} · ${p.period}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--accent)">${p.price.toLocaleString('ko-KR')}원</div>
          <div style="display:flex;align-items:center;gap:4px;margin-top:4px;justify-content:flex-end">
            <button type="button" class="qty-btn" onclick="event.preventDefault();changeQty(this,-1)">−</button>
            <span class="qty-val" style="font-family:'DM Mono',monospace;font-size:12px;min-width:16px;text-align:center">1</span>
            <button type="button" class="qty-btn" onclick="event.preventDefault();changeQty(this,1)">+</button>
          </div>
        </div>
      </label>`).join('');
    }
    const discEl = document.getElementById('discCheckList');
    if (discEl) {
        discEl.innerHTML = DISC_LIST.map(d => `
      <label class="calc-disc-row" data-name="${d.name}" data-rate="${d.rate}">
        <input type="checkbox" style="width:16px;height:16px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0" onchange="calcRender()">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600">${d.name}</div>
          <div style="font-size:11px;color:var(--text-sub)">${d.rate}% 할인</div>
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--accent2)">-${d.rate}%</div>
      </label>`).join('');
    }
    calcRender();
}

const fmt = n => Math.round(n).toLocaleString('ko-KR') + '원';

window.changeQty = function(btn, delta) {
    const row = btn.closest('.calc-pass-row');
    const span = row.querySelector('.qty-val');
    let qty = parseInt(span.textContent) + delta;
    if (qty < 1) qty = 1; if (qty > 24) qty = 24;
    span.textContent = qty;
    calcRender();
};

window.calcRender = function() {
    const passRows = document.querySelectorAll('.calc-pass-row');
    let passes = [], subtotal = 0;
    passRows.forEach(row => {
        const cb = row.querySelector('input[type=checkbox]');
        row.classList.toggle('checked', cb.checked);
        if (!cb.checked) return;
        const price = parseInt(row.dataset.price), qty = parseInt(row.querySelector('.qty-val').textContent);
        const lineTotal = price * qty;
        passes.push({ name:row.dataset.name, price, qty, unit:row.dataset.unit, lineTotal });
        subtotal += lineTotal;
    });

    const discRows = document.querySelectorAll('.calc-disc-row');
    let discs = [];
    discRows.forEach(row => {
        const cb = row.querySelector('input[type=checkbox]');
        row.classList.toggle('checked', cb.checked);
        if (!cb.checked) return;
        discs.push({ name:row.dataset.name, rate:parseFloat(row.dataset.rate) });
    });
    const customCb = document.getElementById('customDiscCheck');
    if (customCb && customCb.checked) {
        const rate = parseFloat(document.getElementById('customDiscVal').value) || 0;
        if (rate > 0) discs.push({ name:'직접 할인', rate });
    }

    let running = subtotal, steps = [], totalSaved = 0;
    discs.forEach(d => {
        const amt = running * d.rate / 100;
        totalSaved += amt;
        steps.push({ name:d.name, rate:d.rate, amt, before:running, after:running - amt });
        running -= amt;
    });

    const passListEl = document.getElementById('quotePassList');
    if (passListEl) {
        passListEl.innerHTML = passes.length === 0
            ? '<div class="quote-row"><span style="font-size:12px;color:var(--text-sub)">수강권을 선택하세요</span><span style="font-family:\'DM Mono\',monospace;font-size:12px;color:var(--text-dim)">0원</span></div>'
            : passes.map(p => `<div class="quote-row"><span style="font-size:12px">${p.name} × ${p.qty}</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--accent)">${fmt(p.lineTotal)}</span></div>`).join('');
    }
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    set('quoteSubtotal', fmt(subtotal));
    const discEl = document.getElementById('quoteDiscSteps');
    if (discEl) {
        discEl.innerHTML = steps.length === 0
            ? '<div class="quote-row"><span style="font-size:12px;color:var(--text-sub)">할인 없음</span><span style="font-family:\'DM Mono\',monospace;font-size:12px;color:var(--text-dim)">0원</span></div>'
            : steps.map((d,i) => `<div class="quote-disc-row"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-size:12px;font-weight:600;color:var(--accent2)">${i+1}. ${d.name} (${d.rate}%)</span><span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--red)">— ${fmt(d.amt)}</span></div><div style="font-size:10px;color:var(--text-dim)">${fmt(d.before)} × ${d.rate}% → ${fmt(d.after)}</div></div>`).join('');
    }
    set('quoteFinal', fmt(running));
    set('quoteSaving', '— ' + fmt(totalSaved));
    const now = new Date();
    set('calcTimestamp', (now.getMonth()+1).toString().padStart(2,'0') + '.' + now.getDate().toString().padStart(2,'0') + ' ' + now.toTimeString().slice(0,5));

    // 미리보기
    const platName = PLATS_DATA[currentPlat].name;
    const memo = document.getElementById('calcMemo')?.value || '';
    let lines = [`[${platName} 수강권 안내]`, ''];
    if (passes.length) { lines.push('■ 수강권'); passes.forEach(p => lines.push(`  · ${p.name} × ${p.qty}  ${fmt(p.lineTotal)}`)); lines.push(`  소계: ${fmt(subtotal)}`); lines.push(''); }
    if (steps.length) { lines.push('■ 할인 내역'); steps.forEach((d,i) => lines.push(`  ${i+1}. ${d.name} ${d.rate}%  — ${fmt(d.amt)}`)); lines.push(`  총 절약: ${fmt(totalSaved)}`); lines.push(''); }
    lines.push(`■ 최종 금액: ${fmt(running)}`);
    if (memo) { lines.push(''); lines.push(`메모: ${memo}`); }
    const prev = document.getElementById('calcPreview');
    if (prev) prev.value = lines.join('\n');
};

window.calcCopy = function() {
    const text = document.getElementById('calcPreview')?.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const hist = document.getElementById('calcHistory');
        if (hist) {
            const final = document.getElementById('quoteFinal')?.textContent || '—';
            const now = new Date();
            const ts = (now.getMonth()+1).toString().padStart(2,'0') + '.' + now.getDate().toString().padStart(2,'0') + ' ' + now.toTimeString().slice(0,5);
            const passes = [...document.querySelectorAll('.calc-pass-row')].filter(r => r.querySelector('input').checked).map(r => r.dataset.name + '×' + r.querySelector('.qty-val').textContent).join(', ') || '—';
            const placeholder = hist.querySelector('[style*="자동 기록"]');
            if (placeholder) placeholder.remove();
            hist.insertAdjacentHTML('afterbegin', `<div style="display:flex;justify-content:space-between;padding:9px 12px;background:rgba(79,209,197,.06);border:1px solid rgba(79,209,197,.2);border-radius:var(--rs)"><div><div style="font-size:12px;font-weight:600">${passes}</div></div><div style="text-align:right"><div style="font-family:'DM Mono',monospace;font-size:13px;color:var(--accent)">${final}</div><div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--text-dim)">${ts}</div></div></div>`);
        }
        showToast('📋 클립보드에 복사되었습니다!');
    }).catch(() => showToast('📋 복사 완료!'));
};

window.calcReset = function() {
    document.querySelectorAll('.calc-pass-row input, .calc-disc-row input, #customDiscCheck').forEach(cb => { cb.checked = false; });
    document.querySelectorAll('.calc-pass-row, .calc-disc-row').forEach(r => r.classList.remove('checked'));
    document.querySelectorAll('.qty-val').forEach(s => s.textContent = '1');
    const cv = document.getElementById('customDiscVal'); if (cv) cv.value = '0';
    const cm = document.getElementById('calcMemo'); if (cm) cm.value = '';
    calcRender();
};

// ═══════════════════════════════════════════
//  캘린더
// ═══════════════════════════════════════════
const CAL_EVENTS = {
    '2026-3': {
        3:  [{ color:'#7c6af7', label:'그룹반 A' }],
        5:  [{ color:'#7c6af7', label:'그룹반 A' },{ color:'#4fd1c5', label:'1:1 레슨' }],
        7:  [{ color:'#4fd1c5', label:'홍길동 1:1' }],
        10: [{ color:'#7c6af7', label:'그룹반 A' },{ color:'#7c6af7', label:'그룹반 B' }],
        11: [{ color:'#7c6af7', label:'그룹반 A' },{ color:'#4fd1c5', label:'1:1 레슨' },{ color:'#f6ad55', label:'플랫폼 공지' }],
        14: [{ color:'#7c6af7', label:'그룹반 A' }],
        17: [{ color:'#7c6af7', label:'그룹반 A' },{ color:'#7c6af7', label:'그룹반 B' }],
        19: [{ color:'#4fd1c5', label:'박서준 1:1' }],
        20: [{ color:'#f87171', label:'본사 공지' }],
        21: [{ color:'#7c6af7', label:'그룹반 A' }],
        24: [{ color:'#7c6af7', label:'그룹반 A' },{ color:'#4fd1c5', label:'1:1 레슨' }],
        26: [{ color:'#7c6af7', label:'그룹반 A' }],
        28: [{ color:'#4fd1c5', label:'홍길동 1:1' }],
    },
};
const CAL_DETAIL = {
    '2026-3': {
        11: [{ time:'09:00', label:'그룹반 A', color:'#7c6af7', inst:'이수진' },{ time:'10:00', label:'홍길동 1:1', color:'#4fd1c5', inst:'이수진' },{ time:'14:00', label:'플랫폼 공지', color:'#f6ad55', inst:'—' },{ time:'16:00', label:'김민지 1:1', color:'#4fd1c5', inst:'이수진' }],
    },
};
const WEEKDAYS = ['일','월','화','수','목','금','토'];
let calYear = 2026, calMonth = 3, calSelDay = 11;

function renderCal() {
    const lbl = document.getElementById('calLbl');
    if (lbl) lbl.textContent = calYear + '년 ' + calMonth + '월';
    const container = document.getElementById('calDays');
    if (!container) return;
    container.innerHTML = '';
    const today = new Date(); const isCur = today.getFullYear() === calYear && today.getMonth()+1 === calMonth;
    const todayDay = isCur ? today.getDate() : -1;
    const firstDow = new Date(calYear, calMonth-1, 1).getDay();
    const daysInMon = new Date(calYear, calMonth, 0).getDate();
    const daysInPrev = new Date(calYear, calMonth-1, 0).getDate();
    const evData = (CAL_EVENTS[calYear+'-'+calMonth]) || {};

    for (let i=0; i<firstDow; i++) { const c=document.createElement('div'); c.className='cal-cell dim'; c.textContent=daysInPrev-firstDow+1+i; container.appendChild(c); }
    for (let d=1; d<=daysInMon; d++) {
        const cell = document.createElement('div');
        let cls = 'cal-cell';
        if (d === calSelDay) cls += ' selected';
        else if (d === todayDay) cls += ' today';
        cell.className = cls;
        const numEl = document.createElement('div'); numEl.style.cssText = 'font-size:11px;font-weight:500;line-height:1'; numEl.textContent = d; cell.appendChild(numEl);
        const evs = evData[d] || [];
        if (evs.length > 0) {
            const seen = new Set();
            evs.forEach(e => { if (!seen.has(e.color)) { seen.add(e.color); const bar = document.createElement('div'); bar.className='event-bar'; bar.style.background=e.color; cell.appendChild(bar); } });
        }
        const _d = d;
        cell.addEventListener('click', () => { calSelDay = _d; renderCal(); renderCalDetail(_d); });
        container.appendChild(cell);
    }
    const total = firstDow + daysInMon;
    const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i=1; i<=remain; i++) { const c=document.createElement('div'); c.className='cal-cell dim'; c.textContent=i; container.appendChild(c); }
    renderCalDetail(calSelDay);
}

function renderCalDetail(day) {
    const title = document.getElementById('calDetailTitle');
    const body  = document.getElementById('calDetailBody');
    if (!title || !body) return;
    const dow = new Date(calYear, calMonth-1, day).getDay();
    const today = new Date(); const isToday = today.getFullYear()===calYear && today.getMonth()+1===calMonth && today.getDate()===day;
    title.textContent = calMonth + '월 ' + day + '일 ' + WEEKDAYS[dow] + '요일' + (isToday ? ' — 오늘' : '');
    const evs = ((CAL_DETAIL[calYear+'-'+calMonth]) || {})[day] || ((CAL_EVENTS[calYear+'-'+calMonth]) || {})[day] || [];
    if (evs.length === 0) { body.innerHTML = '<div style="font-size:13px;color:var(--text-dim);text-align:center;padding:24px 0">이 날의 일정이 없습니다</div>'; return; }
    body.innerHTML = evs.map(e => {
        const timeStr = e.time || '';
        const instStr = e.inst ? ` · ${e.inst} 트레이너` : '';
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:3px;height:36px;border-radius:2px;background:${e.color};flex-shrink:0"></div>
      ${timeStr ? `<div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-sub);min-width:40px">${timeStr}</div>` : ''}
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${e.label}</div><div style="font-size:11px;color:var(--text-dim);margin-top:2px">${instStr}</div></div>
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

window.submitShareEvent = function() {
    closeModal('shareEventModal');
    showToast('✅ 공유 이벤트가 등록되었습니다.');
};

// ═══════════════════════════════════════════
//  수업 이력
// ═══════════════════════════════════════════
const HIST_DATA = [
    { date:'03.11', inst:'이수진', prog:'그룹반 A',    type:'group',   students:8, attended:7 },
    { date:'03.11', inst:'이수진', prog:'홍길동 1:1',  type:'private', students:1, attended:1 },
    { date:'03.10', inst:'김현우', prog:'그룹반 A 보조', type:'group',  students:8, attended:6 },
    { date:'03.07', inst:'이수진', prog:'그룹반 B',    type:'group',   students:8, attended:8 },
    { date:'03.05', inst:'이수진', prog:'김민지 1:1',  type:'private', students:1, attended:1 },
    { date:'03.05', inst:'김현우', prog:'그룹반 A 보조', type:'group',  students:8, attended:7 },
    { date:'03.03', inst:'이수진', prog:'그룹반 A',    type:'group',   students:8, attended:8 },
    { date:'03.03', inst:'이수진', prog:'박서준 1:1',  type:'private', students:1, attended:1 },
    { date:'02.26', inst:'이수진', prog:'그룹반 A',    type:'group',   students:8, attended:7 },
    { date:'02.24', inst:'김현우', prog:'그룹반 A 보조', type:'group',  students:8, attended:8 },
    { date:'02.22', inst:'이수진', prog:'그룹반 B',    type:'group',   students:8, attended:6 },
    { date:'02.21', inst:'이수진', prog:'최유나 1:1',  type:'private', students:1, attended:1 },
];
const INST_COLORS = { '이수진':'linear-gradient(135deg,var(--accent2),#667eea)', '김현우':'linear-gradient(135deg,#f6ad55,#ed8936)' };

window.histRender = function() {
    const instFilt = document.getElementById('histInstructor')?.value || 'all';
    const typeFilt = document.getElementById('histType')?.value || 'all';
    const filtered = HIST_DATA.filter(r => (instFilt==='all'||r.inst===instFilt) && (typeFilt==='all'||r.type===typeFilt));
    const total=filtered.length, groups=filtered.filter(r=>r.type==='group').length, privs=filtered.filter(r=>r.type==='private').length;
    const studs=filtered.reduce((s,r)=>s+r.attended,0);
    const attend = total>0 ? Math.round(filtered.reduce((s,r)=>s+r.attended/r.students*100,0)/total) : 0;
    const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    set('histTotal',total); set('histGroup',groups); set('histPrivate',privs); set('histStudents',studs); set('histAttend',attend+'%');

    const byInst = {};
    filtered.forEach(r => { if(!byInst[r.inst]) byInst[r.inst]={total:0,group:0,priv:0,att:0,stu:0}; byInst[r.inst].total++; r.type==='group'?byInst[r.inst].group++:byInst[r.inst].priv++; byInst[r.inst].att+=r.attended; byInst[r.inst].stu+=r.students; });
    const maxC = Math.max(...Object.values(byInst).map(v=>v.total), 1);
    const barsEl = document.getElementById('histBars');
    if (barsEl) {
        if (!Object.keys(byInst).length) { barsEl.innerHTML='<div style="font-size:13px;color:var(--text-sub)">해당 조건 없음</div>'; }
        else barsEl.innerHTML = Object.entries(byInst).map(([name,v]) => {
            const pct=Math.round(v.total/maxC*100), attPct=Math.round(v.att/v.stu*100);
            const avatarBg = INST_COLORS[name] || 'linear-gradient(135deg,var(--accent),var(--accent2))';
            const barColor = name==='이수진'?'#7c6af7':'#4fd1c5';
            return `<div>
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:24px;height:24px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white">${name[0]}</div>
            <span style="font-size:13px;font-weight:600">${name} 트레이너</span>
          </div>
          <span style="font-family:'DM Mono',monospace;font-size:13px;color:${barColor};font-weight:600">${v.total}회</span>
        </div>
        <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${barColor};border-radius:4px;transition:width .3s"></div>
        </div>
        <div style="display:flex;gap:12px;margin-top:5px">
          <span style="font-size:10px;color:var(--text-dim)">그룹 ${v.group}회</span>
          <span style="font-size:10px;color:var(--text-dim)">개인 ${v.priv}회</span>
          <span style="font-size:10px;color:var(--green)">출결 ${attPct}%</span>
        </div>
      </div>`;
        }).join('');
    }
    const tbody = document.getElementById('histTbody');
    if (tbody) {
        tbody.innerHTML = filtered.length === 0
            ? '<tr><td colspan="7" style="text-align:center;color:var(--text-sub);padding:20px">해당 조건의 수업이 없습니다</td></tr>'
            : filtered.map(r => {
                const pct=Math.round(r.attended/r.students*100), pctColor=pct>=90?'var(--green)':pct>=75?'#f6ad55':'#f87171';
                const tColor=r.type==='group'?'#7c6af7':'#4fd1c5', tBg=r.type==='group'?'rgba(124,106,247,.12)':'rgba(79,209,197,.12)';
                const avatarBg=INST_COLORS[r.inst]||'linear-gradient(135deg,var(--accent),var(--accent2))';
                return `<tr>
            <td style="font-family:'DM Mono',monospace;font-size:12px">${r.date}</td>
            <td><div style="display:flex;align-items:center;gap:6px"><div style="width:22px;height:22px;border-radius:50%;background:${avatarBg};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white">${r.inst[0]}</div>${r.inst}</div></td>
            <td><span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${tBg};color:${tColor}">${r.type==='group'?'그룹':'개인'}</span></td>
            <td style="font-weight:500">${r.prog}</td>
            <td style="font-family:'DM Mono',monospace;text-align:center">${r.students}</td>
            <td style="font-family:'DM Mono',monospace;text-align:center">${r.attended}</td>
            <td style="font-family:'DM Mono',monospace;text-align:center;font-weight:700;color:${pctColor}">${pct}%</td>
          </tr>`;
            }).join('');
    }
};

// ═══════════════════════════════════════════
//  초기화
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    renderRenewal();
    renderApprovals();
    renderMembers();
    renderInstructors();
    renderDiscounts();
    renderCalcUI();
    renderCal();
    histRender();
});