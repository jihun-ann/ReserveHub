export default function SuperMemberManageView(){
    return (
        <div className="page" id="super-members">
            {/* ══════════════ 회원 관리 ══════════════ */}
            <div className="page-header">
                <div className="page-label">MEMBERS</div>
                <div className="page-title">회원 관리</div>
                <div className="page-subtitle">플랫폼 회원을 조회하고 관리하세요</div>
            </div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center'}}>
                <input type="text" id="memberSearch" placeholder="이름 / 연락처 검색..." onInput="renderMembers()"
                       style={{flex: '1', minWidth: '160px', padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text)', fontSize: '13px', outline: 'none'}}/>
                <button className="filter-chip active" onClick="memberFilter(this,'all')">전체</button>
                <button className="filter-chip" onClick="memberFilter(this,'active')">활성</button>
                <button className="filter-chip" onClick="memberFilter(this,'soon')">만료 임박</button>
                <button className="filter-chip" onClick="memberFilter(this,'expired')">만료</button>
                <button className="btn btn-primary btn-sm" onClick="openAddMemberModal()">+ 회원 등록
                </button>
            </div>
            <div className="card" style={{padding: '0', overflow: 'hidden', marginBottom: '16px'}}>
                <div style={{overflowX: 'auto'}}>
                    <table className="data-table" id="memberTable">
                        <thead>
                        <tr>
                            <th>이름</th>
                            <th>연락처</th>
                            <th>수강권</th>
                            <th>만료일</th>
                            <th>D-day</th>
                            <th>상태</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody id="memberTbody">{/* JS 렌더 */}</tbody>
                    </table>
                </div>
            </div>
            <div id="memberDetailPanel" style={{display: 'none'}}>{/* JS 렌더 */}</div>
        </div>
    )
}
