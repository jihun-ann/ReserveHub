export default function SuperDashBoardView(){
    return(
        <div className="page active" id="super-dashboard">
            <div className="topbar">
                <div className="topbar-title" id="topbar-title">대시보드</div>
                <span className="topbar-plat" id="topbar-plat">🤸 필라테스 강남</span>
                <div className="topbar-right">
                    <button className="notif-btn">🔔<span className="notif-dot"></span></button>
                </div>
            </div>
            {/* ══════════════ 대시보드 ══════════════ */}
            <div className="page-header">
                <div className="page-label">DASHBOARD</div>
                <div className="page-title" id="dash-plat-title">스튜디오 필라테스 강남</div>
                <div className="page-subtitle">플랫폼 현황과 처리 대기 업무를 확인하세요</div>
            </div>

            <div className="dash-kpi">
                <div className="kpi-card">
                    <div className="kpi-val" style={{color: 'var(--accent2)'}} id="kpi-members">142</div>
                    <div className="kpi-key">전체 회원</div>
                    <div className="kpi-sub" style={{color: 'var(--green)'}}>+8 이번달</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-val" style={{color: 'var(--accent)'}} id="kpi-revenue">9.8만</div>
                    <div className="kpi-key">이번달 매출</div>
                    <div className="kpi-sub" style={{color: 'var(--green)'}}>↑12% vs 지난달</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-val" style={{color: 'var(--accent3)'}} id="kpi-attend">93%</div>
                    <div className="kpi-key">출결률</div>
                    <div className="kpi-sub" style={{color: 'var(--text-sub)'}}>이번달 평균</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-val" style={{color: 'var(--red)'}} id="kpi-pending">2</div>
                    <div className="kpi-key">승인 대기</div>
                    <div className="kpi-sub" style={{color: 'var(--red)'}}>처리 필요</div>
                </div>
            </div>

            <div className="dash-grid">
                {/* 재결제 임박 */}
                <div className="card">
                    <div className="card-title"
                         style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        재결제 임박 고객
                        <span className="badge bs-expired" style={{fontSize: '10px'}}>D-7 이내 5명</span>
                    </div>
                    <div id="renewal-list">
                        {/* JS 렌더 */}
                    </div>
                </div>

                {/* 대기 업무 */}
                <div className="card">
                    <div className="card-title">처리 대기 업무</div>
                    <div className="pending-item" style={{borderLeft: '3px solid var(--accent3)'}}>
                        <div className="pending-dot" style={{background: 'var(--accent3)'}}></div>
                        <div className="pending-body">
                            <div className="pending-title">홍길동 — 1:1 레슨 일정 변경 요청</div>
                            <div className="pending-meta">이수진 트레이너 · 2026.03.10</div>
                        </div>
                        <button className="btn btn-ghost btn-sm"
                                onClick="showPage('approval',document.querySelectorAll('#super-nav .nav-item')[1])">처리
                        </button>
                    </div>
                    <div className="pending-item" style={{borderLeft: '3px solid var(--accent3)'}}>
                        <div className="pending-dot" style={{background: 'var(--accent3)'}}></div>
                        <div className="pending-body">
                            <div className="pending-title">박서준 — 수강권 환불 요청</div>
                            <div className="pending-meta">자동 알림 · 2026.03.09</div>
                        </div>
                        <button className="btn btn-ghost btn-sm"
                                onClick="showPage('approval',document.querySelectorAll('#super-nav .nav-item')[1])">처리
                        </button>
                    </div>
                    <div className="pending-item" style={{borderLeft: '3px solid var(--text-dim)', opacity: '.6'}}>
                        <div className="pending-dot" style={{background: 'var(--green)'}}></div>
                        <div className="pending-body">
                            <div className="pending-title">이번달 레슨 통계 정산 완료</div>
                            <div className="pending-meta">자동 처리 · 2026.03.01</div>
                        </div>
                    </div>
                </div>

                {/* 최근 활동 */}
                <div className="card">
                    <div className="card-title">최근 활동</div>
                    <div className="activity-item">
                        <div className="activity-icon" style={{background: 'rgba(74,222,128,.12)'}}>✅</div>
                        <div className="activity-body">
                            <div className="activity-title">김민지 일정 변경 — 승인됨</div>
                            <div className="activity-time">2026.03.09 14:32</div>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon" style={{background: 'rgba(79,209,197,.12)'}}>👤</div>
                        <div className="activity-body">
                            <div className="activity-title">오지현 신규 회원 등록</div>
                            <div className="activity-time">2026.03.08 11:20</div>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon" style={{background: 'rgba(246,173,85,.12)'}}>💳</div>
                        <div className="activity-body">
                            <div className="activity-title">홍길동 그룹 월정액 재결제</div>
                            <div className="activity-time">2026.03.07 10:05</div>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon" style={{background: 'rgba(248,113,113,.12)'}}>❌</div>
                        <div className="activity-body">
                            <div className="activity-title">이지은 수강권 만료 알림 발송</div>
                            <div className="activity-time">2026.03.05 09:00</div>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon" style={{background: 'rgba(124,106,247,.12)'}}>📊</div>
                        <div className="activity-body">
                            <div className="activity-title">2월 수업 이력 통계 확인</div>
                            <div className="activity-time">2026.03.01 08:30</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    function showPage(){
        document.querySelectorAll('#subsup-app .page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('#subsup-nav .nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('subsup-' + name).classList.add('active');
        if (el) el.classList.add('active');
        document.getElementById('topbar-title').textContent = PAGE_TITLES[name] || name;
        closeSidebar();
    }
}