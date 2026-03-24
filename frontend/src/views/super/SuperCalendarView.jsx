export default function SuperCalendarView(){
    return(
        <div className="page" id="super-calendar">
            {/* ══════════════ 캘린더 ══════════════ */}
            <div className="page-header">
                <div className="page-label">CALENDAR</div>
                <div className="page-title">캘린더</div>
                <div className="page-subtitle">플랫폼 전체 일정을 한눈에 확인하세요</div>
            </div>

            {/* 범례 */}
            <div
                style={{display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', padding: '10px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '20px'}}>
                        <span
                            style={{fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase'}}>범례</span>
                <div
                    style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', color: '#7c6af7'}}>
                            <span
                                style={{display: 'inline-block', width: '10px', height: '4px', background: '#7c6af7', borderRadius: '2px'}}></span>그룹
                    레슨
                </div>
                <div
                    style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', color: '#4fd1c5'}}>
                            <span
                                style={{display: 'inline-block', width: '10px', height: '4px', background: '#4fd1c5', borderRadius: '2px'}}></span>개인
                    레슨
                </div>
                <div
                    style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', color: '#f6ad55'}}>
                            <span
                                style={{display: 'inline-block', width: '10px', height: '4px', background: '#f6ad55', borderRadius: '2px'}}></span>플랫폼
                    공지/휴무
                </div>
                <div
                    style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', color: '#f87171'}}>
                            <span
                                style={{display: 'inline-block', width: '10px', height: '4px', background: '#f87171', borderRadius: '2px'}}></span>본사
                    공지
                </div>
                <button className="btn btn-primary btn-sm"
                        style={{marginLeft: 'auto', background: 'var(--accent)', color: '#0f0f13'}}
                        onClick="openShareEventModal()">+ 공유 이벤트 등록
                </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start'}}>
                {/* 달력 */}
                <div className="card">
                    <div className="cal-nav-row">
                        <span className="cal-month-lbl" id="calLbl">2026년 3월</span>
                        <div className="cal-nav-btns">
                            <button className="cal-nav-btn" onClick="calNav(-1)">‹</button>
                            <button className="cal-nav-btn" onClick="calNav(1)">›</button>
                        </div>
                    </div>
                    <div className="cal-dow">
                        <div className="cal-dow-lbl" style={{color: '#f87171'}}>일</div>
                        <div className="cal-dow-lbl">월</div>
                        <div className="cal-dow-lbl">화</div>
                        <div className="cal-dow-lbl">수</div>
                        <div className="cal-dow-lbl">목</div>
                        <div className="cal-dow-lbl">금</div>
                        <div className="cal-dow-lbl" style={{color: '#60a5fa'}}>토</div>
                    </div>
                    <div className="cal-grid-7" id="calDays"></div>
                </div>

                {/* 일별 상세 */}
                <div>
                    <div className="card">
                        <div className="card-title" id="calDetailTitle">3월 11일 화요일 — 오늘</div>
                        <div id="calDetailBody">
                            <div
                                style={{fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0'}}>날짜를
                                선택하세요
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>)
}