export default function UserMypageView() {
    return (
        <div className="page" id="page-mypage">
            <div className="page-header">
                <div className="page-label">MY PAGE</div>
                <div className="page-title">마이페이지</div>
                <div className="page-subtitle">내 정보와 등록된 플랫폼을 확인하세요</div>
            </div>

            {/* 프로필 히어로 */}
            <div className="mypage-hero">
                <div className="mypage-avatar">김</div>
                <div className="mypage-info">
                    <div className="mypage-name">김지수</div>
                    <div className="mypage-email">jisu.kim@example.com · 010-1234-5678</div>
                    <div className="mypage-tags">
                        <span className="mypage-tag">필라테스</span>
                        <span className="mypage-tag">음악</span>
                        <span className="mypage-tag">일반회원</span>
                    </div>
                </div>
                <button className="btn btn-ghost btn-sm">프로필 수정</button>
            </div>

            {/* 통계 */}
            <div className="mypage-grid" style="margin-bottom:20px">
                <div className="mypage-stat-card">
                    <div className="mypage-stat-val">23</div>
                    <div className="mypage-stat-key">이번달 누적 예약</div>
                </div>
                <div className="mypage-stat-card">
                    <div className="mypage-stat-val" style="color:var(--accent2)">18</div>
                    <div className="mypage-stat-key">이번달 출석 횟수</div>
                </div>
                <div className="mypage-stat-card">
                    <div className="mypage-stat-val" style="color:var(--green)">78%</div>
                    <div className="mypage-stat-key">출석률</div>
                </div>
                <div className="mypage-stat-card">
                    <div className="mypage-stat-val" style="color:var(--accent3)">D-7</div>
                    <div className="mypage-stat-key">수강권 만료까지</div>
                </div>
            </div>

            {/* 등록 플랫폼 */}
            <div className="card" style="margin-bottom:20px">
                <div className="card-title">등록 플랫폼</div>
                <div className="platform-list">
                    <div className="platform-item">
                        <div className="platform-icon" style="background:rgba(124,106,247,.15)">🤸</div>
                        <div className="platform-body">
                            <div className="platform-name">스튜디오 필라테스 강남점</div>
                            <div className="platform-meta">그룹반 A · 담당: 이수진 트레이너 · 만료 2026.03.18</div>
                        </div>
                        <div className="platform-remain">
                            <div className="platform-remain-num">4</div>
                            <div className="platform-remain-label">잔여 횟수</div>
                        </div>
                        <span className="platform-status ps-soon">만료 임박</span>
                    </div>
                    <div className="platform-item">
                        <div className="platform-icon" style="background:rgba(246,173,85,.15)">🎵</div>
                        <div className="platform-body">
                            <div className="platform-name">뮤직하우스 홍대점</div>
                            <div className="platform-meta">연습실 이용권 · 만료 2026.04.30</div>
                        </div>
                        <div className="platform-remain">
                            <div className="platform-remain-num">8</div>
                            <div className="platform-remain-label">잔여 횟수</div>
                        </div>
                        <span className="platform-status ps-active">이용 중</span>
                    </div>
                </div>
            </div>

            {/* 예약 이력 */}
            <div className="card">
                <div className="card-title">예약 이력</div>
                <div className="res-list">
                    <div className="res-item">
                        <div className="res-date-block">
                            <div className="res-day">14</div>
                            <div className="res-mon">3월</div>
                        </div>
                        <div className="res-divider"></div>
                        <div className="res-body">
                            <div className="res-name">필라테스 그룹반 A</div>
                            <div className="res-time">10:00 – 11:00 · 스튜디오 필라테스 강남점</div>
                        </div>
                        <span className="res-status rs-upcoming">예정</span>
                    </div>
                    <div className="res-item">
                        <div className="res-date-block">
                            <div className="res-day">11</div>
                            <div className="res-mon">3월</div>
                        </div>
                        <div className="res-divider"></div>
                        <div className="res-body">
                            <div className="res-name">1번 연습실</div>
                            <div className="res-time">14:00 – 15:00 · 뮤직하우스 홍대점</div>
                        </div>
                        <span className="res-status rs-upcoming">예정</span>
                    </div>
                    <div className="res-item">
                        <div className="res-date-block">
                            <div className="res-day">07</div>
                            <div className="res-mon">3월</div>
                        </div>
                        <div className="res-divider"></div>
                        <div className="res-body">
                            <div className="res-name">필라테스 그룹반 A</div>
                            <div className="res-time">10:00 – 11:00 · 스튜디오 필라테스 강남점</div>
                        </div>
                        <span className="res-status rs-done">완료</span>
                    </div>
                    <div className="res-item">
                        <div className="res-date-block">
                            <div className="res-day">05</div>
                            <div className="res-mon">3월</div>
                        </div>
                        <div className="res-divider"></div>
                        <div className="res-body">
                            <div className="res-name">연습실 자율 연습</div>
                            <div className="res-time">14:00 – 15:30 · 뮤직하우스 홍대점</div>
                        </div>
                        <span className="res-status rs-done">완료</span>
                    </div>
                    <div className="res-item">
                        <div className="res-date-block">
                            <div className="res-day">28</div>
                            <div className="res-mon">2월</div>
                        </div>
                        <div className="res-divider"></div>
                        <div className="res-body">
                            <div className="res-name">필라테스 1:1 개인레슨</div>
                            <div className="res-time">11:00 – 11:50 · 스튜디오 필라테스 강남점</div>
                        </div>
                        <span className="res-status rs-cancel">취소됨</span>
                    </div>
                </div>
            </div>

        </div>
    )
}