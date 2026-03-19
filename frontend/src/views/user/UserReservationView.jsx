export default function UserReservationView() {
    return (
        <div className="page" id="page-reservation">
            <div className="page-header">
                <div className="page-label">RESERVATION</div>
                <div className="page-title">예약하기</div>
                <div className="page-subtitle">원하는 프로그램과 시간을 선택하세요</div>
            </div>

            <div className="res-grid">
                {/* 왼쪽: 프로그램 목록 */}
                <div>
                    <div className="filter-bar">
                        <button className="filter-chip active" onClick="filterChip(this,'all')">전체</button>
                        <button className="filter-chip" onClick="filterChip(this,'pilates')">🤸 필라테스</button>
                        <button className="filter-chip" onClick="filterChip(this,'yoga')">🧘 요가</button>
                        <button className="filter-chip" onClick="filterChip(this,'music')">🎵 음악</button>
                        <button className="filter-chip" onClick="filterChip(this,'fitness')">🏋️ 헬스</button>
                    </div>

                    <div className="program-list" id="programList">
                        {/* JS로 렌더 */}
                    </div>
                </div>

                {/* 오른쪽: 슬롯 패널 */}
                <div>
                    <div className="card">
                        <div className="slot-panel-header">
                            <div>
                                <div className="slot-panel-date" id="slotDateLabel">필라테스 그룹반 A</div>
                                <div className="slot-panel-sub" id="slotSubLabel">날짜를 선택하세요</div>
                            </div>
                        </div>

                        {/* 날짜 선택 (7일) */}
                        <div className="slot-nav-row" id="slotDateRow">
                            {/* JS 렌더 */}
                        </div>

                        <div className="slot-list" id="slotList">
                            {/* JS 렌더 */}
                        </div>

                        <div className="confirm-box" id="confirmBox" style="display:none">
                            <div className="confirm-row"><span>프로그램</span><strong
                                id="confirmProg">—</strong></div>
                            <div className="confirm-row"><span>날짜</span><strong id="confirmDate">—</strong>
                            </div>
                            <div className="confirm-row"><span>시간</span><strong id="confirmTime">—</strong>
                            </div>
                            <div className="confirm-row"><span>잔여석</span><strong id="confirmRemain"
                                                                                 style="color:var(--accent2)">—</strong>
                            </div>
                            <button className="btn-confirm" id="confirmBtn" onClick="doReserve()">예약 확정하기
                            </button>
                        </div>
                        <div id="noSlotMsg"
                             style="text-align:center;padding:32px 0;color:var(--text-dim);font-size:13px;">
                            프로그램을 선택해 주세요
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
    function filterChip(el, cat) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        if (el) el.classList.add('active');
        currentFilter = cat;
        renderPrograms();
    };
}