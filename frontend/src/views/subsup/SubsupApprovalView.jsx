import {useState,useEffect} from "react";

export default function SubsupApprovalView(){
    let APPROVAL_DATA = [
        { id:'a1', title:'홍길동 — 1:1 개인레슨 일정 변경', requester:'이수진 트레이너', from:'2026.03.11 10:00', to:'2026.03.14 14:00', reason:'수강생 개인 사정으로 인한 일정 조정 요청입니다.', date:'2026.03.10', status:'pending' },
        { id:'a2', title:'박서준 — 수강권 환불 요청', requester:'자동 시스템', from:'개인 10회권 잔여 6회', to:'결제 취소 (환불)', reason:'수강생 부상으로 인한 수강 중단 및 잔여분 환불 요청입니다.', date:'2026.03.09', status:'pending' },
        { id:'a3', title:'김민지 — 그룹반 A 일정 변경', requester:'이수진 트레이너', from:'2026.03.05 09:00', to:'2026.03.07 10:00', reason:'강사 일정으로 인한 수업 조정 요청입니다.', date:'2026.03.04', status:'approved', memo:'승인 처리 완료', processedAt:'2026.03.05 09:30' },
        { id:'a4', title:'최유나 — 개인레슨 취소', requester:'김현우 트레이너', from:'2026.02.28 16:00', to:'취소 요청', reason:'수강생 해외 출장으로 인한 레슨 취소 요청입니다.', date:'2026.02.27', status:'rejected', memo:'환불 정책 미충족으로 반려', processedAt:'2026.02.28 08:00' },
    ];

    useEffect(()=>{
        renderApprovals()
    })

    const[approvalFilter_current, setApprovalFilter_current] = useState('all')



    return(
        <div className="page" id="super-approval">

            {/* ══════════════ 승인 관리 ══════════════ */}
            <div className="page-header">
                <div className="page-label">APPROVAL</div>
                <div className="page-title">승인 관리</div>
                <div className="page-subtitle">일정 변경 요청을 검토하고 처리 이력을 남기세요</div>
            </div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap'}}>
                <button className={`filter-chip ${approvalFilter_current === 'all'?'active':''}`} onClick={()=>approvalFilter('all')}>전체</button>
                <button className={`filter-chip ${approvalFilter_current === 'pending'?'active':''}`} onClick={()=>approvalFilter('pending')}>대기 중</button>
                <button className={`filter-chip ${approvalFilter_current === 'approved'?'active':''}`} onClick={()=>approvalFilter('approved')}>승인됨</button>
                <button className={`filter-chip ${approvalFilter_current === 'rejected'?'active':''}`} onClick={()=>approvalFilter('rejected')}>반려됨</button>
            </div>
            <div id="approval-list">{/* JS 렌더 */}</div>
        </div>
    )

    function approvalFilter(filter) {
        setApprovalFilter_current(filter);
        renderApprovals();
    }


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

}
