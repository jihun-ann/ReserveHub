export default function SuperTutorManageView(){
    return(
        <div className="page" id="super-instructors">
            {/* ══════════════ 강사 관리 ══════════════ */}
            <div className="page-header">
                <div className="page-label">INSTRUCTORS</div>
                <div className="page-title">강사 관리</div>
                <div className="page-subtitle">소속 강사를 등록하고 KPI를 확인하세요</div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
                <button className="btn btn-primary btn-sm" onClick="openAddInstructorModal()">+ 강사 등록
                </button>
            </div>
            <div id="instructor-list"
                 style="display:flex;flex-direction:column;gap:12px;">{/* JS 렌더 */}</div>
        </div>
    )
}