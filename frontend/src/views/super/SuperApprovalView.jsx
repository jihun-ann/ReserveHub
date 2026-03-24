export default function SuperApprovalView(){
    return(
        <div className="page" id="super-approval">
            {/* ══════════════ 승인 관리 ══════════════ */}
            <div className="page-header">
                <div className="page-label">APPROVAL</div>
                <div className="page-title">승인 관리</div>
                <div className="page-subtitle">일정 변경 요청을 검토하고 처리 이력을 남기세요</div>
            </div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap'}}>
                <button className="filter-chip active" onClick="approvalFilter(this,'all')">전체</button>
                <button className="filter-chip" onClick="approvalFilter(this,'pending')">대기 중</button>
                <button className="filter-chip" onClick="approvalFilter(this,'approved')">승인됨</button>
                <button className="filter-chip" onClick="approvalFilter(this,'rejected')">반려됨</button>
            </div>
            <div id="approval-list">{/* JS 렌더 */}</div>
        </div>
    )
}
