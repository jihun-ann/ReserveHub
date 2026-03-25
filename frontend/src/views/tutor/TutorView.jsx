import './TutorView.css'

export default function TutorView() {
    return (

        <div className="app" id="tutor-app">

            <div className="overlay" id="tutor-overlay" onClick="closeSidebar()"></div>

            <nav className="sidebar" id="tutor-sidebar">
                <div className="sidebar-top">
                    <div className="logo">
                        <div className="logo-icon">🛠</div>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <button className="collapse-btn" onClick="toggleCollapse()">◀</button>
                </div>

                <div className="user-card">
                    <div className="avatar">이</div>
                    <div className="user-info">
                        <div className="user-name">이수진 트레이너</div>
                        <div className="user-role">일반관리자 · 강사</div>
                    </div>
                </div>

                <div className="nav" id="tutor-nav">
                    <button className="nav-item active" onClick="showPage('calendar', this)">
                        <span className="nav-icon">📅</span>
                        <span className="nav-label">내 캘린더</span>
                    </button>
                    <button className="nav-item" onClick="showPage('attend', this)">
                        <span className="nav-icon">✅</span>
                        <span className="nav-label">출결 관리</span>
                    </button>
                    <button className="nav-item" onClick="showPage('request', this)">
                        <span className="nav-icon">📝</span>
                        <span className="nav-label">일정 변경 요청</span>
                    </button>
                    <button className="nav-item" onClick="showPage('mypage', this)">
                        <span className="nav-icon">👤</span>
                        <span className="nav-label">내 정보</span>
                    </button>
                </div>

                <div className="sidebar-bottom">
                    <button className="btn-logout">🚪 <span>로그아웃</span></button>
                </div>
            </nav>

            <div className="main" id="tutor-main">
                <div className="topbar">
                    <button className="hamburger" onClick="openSidebar()">☰</button>
                    <div className="topbar-title" id="topbar-title">내 캘린더</div>
                    <div className="topbar-right">
                        <button className="notif-btn" title="알림">🔔<span className="notif-dot"></span></button>
                    </div>
                </div>

                <div className="content">

                    <div className="page active" id="tutor-calendar">
                        <div className="page-header">
                            <div className="page-label">CALENDAR</div>
                            <div className="page-title">내 캘린더</div>
                            <div className="page-subtitle">레슨 일정과 수강생 현황을 한눈에 확인하세요</div>
                        </div>

                        <div className="kpi-row">
                            <div className="kpi-card">
                                <div className="kpi-val" style="color:var(--accent)" id="kpiToday">4</div>
                                <div className="kpi-key">오늘 레슨</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-val" style="color:var(--green)" id="kpiStudents">18</div>
                                <div className="kpi-key">오늘 수강생</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-val" style="color:var(--accent3)" id="kpiPending">2</div>
                                <div className="kpi-key">미출석 확인</div>
                            </div>
                            <div className="kpi-card">
                                <div className="kpi-val" style="color:var(--accent2)" id="kpiMonthly">86</div>
                                <div className="kpi-key">이번달 레슨</div>
                            </div>
                        </div>

                        <div className="cal-layout">
                            <div className="card">
                                <div className="cal-nav-row">
                                    <span className="cal-month-lbl" id="calMonthLbl">2026년 3월</span>
                                    <div className="cal-nav-btns">
                                        <button className="cal-nav-btn" onClick="calNav(-1)">‹</button>
                                        <button className="cal-nav-btn" onClick="calNav(1)">›</button>
                                    </div>
                                </div>
                                <div className="cal-dow">
                                    <div className="cal-dow-lbl" style="color:#f87171">일</div>
                                    <div className="cal-dow-lbl">월</div>
                                    <div className="cal-dow-lbl">화</div>
                                    <div className="cal-dow-lbl">수</div>
                                    <div className="cal-dow-lbl">목</div>
                                    <div className="cal-dow-lbl">금</div>
                                    <div className="cal-dow-lbl" style="color:#60a5fa">토</div>
                                </div>
                                <div className="cal-grid" id="calDays"></div>

                                <div className="plat-legend">
                                    <div className="plat-legend-item">
                                        <div className="plat-legend-dot" style="background:#7c6af7"></div>
                                        필라테스
                                    </div>
                                    <div className="plat-legend-item">
                                        <div className="plat-legend-dot" style="background:#4fd1c5"></div>
                                        요가
                                    </div>
                                    <div className="plat-legend-item">
                                        <div className="plat-legend-dot" style="background:#f6ad55"></div>
                                        음악
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="timeline-header">
                                    <div>
                                        <span className="timeline-date" id="tlDate">3월 11일</span>
                                        <span className="timeline-dow" id="tlDow">화요일 · 오늘</span>
                                    </div>
                                    <button className="btn btn-ghost btn-sm"
                                            onClick="showPage('attend', document.querySelectorAll('#tutor-nav .nav-item')[1])">출결
                                        처리 →
                                    </button>
                                </div>
                                <div className="timeline" id="timeline">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="page" id="tutor-attend">
                        <div className="page-header">
                            <div className="page-label">ATTENDANCE</div>
                            <div className="page-title">출결 관리</div>
                            <div className="page-subtitle">수강생 출석을 확인하고 처리하세요</div>
                        </div>

                        <div className="attend-layout">
                            <div>
                                <div
                                    style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
                                    <span style="font-size:15px;font-weight:700;flex:1;" id="attendDateLabel">2026년 3월 11일 화요일</span>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;" id="attendFilterRow">
                                        <button className="filter-chip active" onClick="attendFilter(this,'all')">전체
                                        </button>
                                        <button className="filter-chip" onClick="attendFilter(this,'그룹반 A')">그룹반 A
                                        </button>
                                        <button className="filter-chip" onClick="attendFilter(this,'그룹반 B')">그룹반 B
                                        </button>
                                        <button className="filter-chip" onClick="attendFilter(this,'개인레슨')">개인레슨
                                        </button>
                                    </div>
                                </div>

                                <div className="card" style="padding:0;overflow:hidden;">
                                    <div style="overflow-x:auto;">
                                        <table className="attend-table" id="attendTable">
                                            <thead>
                                            <tr>
                                                <th>수강생</th>
                                                <th>프로그램</th>
                                                <th>플랫폼</th>
                                                <th>시간</th>
                                                <th>출결</th>
                                            </tr>
                                            </thead>
                                            <tbody id="attendTbody">
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="attend-summary">
                                <div className="card">
                                    <div className="card-title">오늘 출결 현황</div>
                                    <div className="attend-stat-grid">
                                        <div className="attend-stat">
                                            <div className="attend-stat-val" style="color:var(--green)"
                                                 id="sumPresent">0
                                            </div>
                                            <div className="attend-stat-key">출석</div>
                                        </div>
                                        <div className="attend-stat">
                                            <div className="attend-stat-val" style="color:var(--accent3)"
                                                 id="sumLate">0
                                            </div>
                                            <div className="attend-stat-key">지각</div>
                                        </div>
                                        <div className="attend-stat">
                                            <div className="attend-stat-val" style="color:var(--red)" id="sumAbsent">0
                                            </div>
                                            <div className="attend-stat-key">결석</div>
                                        </div>
                                        <div className="attend-stat">
                                            <div className="attend-stat-val" style="color:var(--text-sub)"
                                                 id="sumPending">6
                                            </div>
                                            <div className="attend-stat-key">미처리</div>
                                        </div>
                                    </div>
                                    <div style="margin-top:14px;">
                                        <div
                                            style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-sub);margin-bottom:6px;">
                                            <span>출석률</span><span id="sumRate"
                                                                  style="color:var(--green);font-weight:700;">0%</span>
                                        </div>
                                        <div className="attend-rate-bar">
                                            <div className="attend-rate-fill" id="sumRateBar" style="width:0%"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-title">이번달 통계</div>
                                    <div style="display:flex;flex-direction:column;gap:10px;">
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <span style="font-size:13px;color:var(--text-sub);">총 레슨</span>
                                            <span
                                                style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;">86회</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <span style="font-size:13px;color:var(--text-sub);">평균 출석률</span>
                                            <span
                                                style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--green);">93%</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <span style="font-size:13px;color:var(--text-sub);">총 수강생 수</span>
                                            <span
                                                style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;">24명</span>
                                        </div>
                                        <div style="display:flex;justify-content:space-between;align-items:center;">
                                            <span style="font-size:13px;color:var(--text-sub);">결석 처리</span>
                                            <span
                                                style="font-family:'DM Mono',monospace;font-size:15px;font-weight:600;color:var(--red);">5건</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="btn btn-primary"
                                        style="width:100%;background:var(--accent);color:#0f0f13;"
                                        onClick="saveAttend()">출결 저장하기
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="page" id="tutor-request">
                        <div className="page-header">
                            <div className="page-label">SCHEDULE REQUEST</div>
                            <div className="page-title">일정 변경 요청</div>
                            <div className="page-subtitle">수강생 또는 개인 사정으로 인한 일정 변경을 요청하세요</div>
                        </div>

                        <div className="card" style="margin-bottom:24px;">
                            <div className="card-title">📝 새 변경 요청 작성</div>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>수강생</label>
                                    <select id="reqStudent">
                                        <option>홍길동</option>
                                        <option>김민지</option>
                                        <option>박서준</option>
                                        <option>이나은</option>
                                        <option>정하준</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>프로그램</label>
                                    <select id="reqProgram">
                                        <option>1:1 개인 레슨</option>
                                        <option>그룹반 A</option>
                                        <option>그룹반 B</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>기존 일정</label>
                                    <input type="datetime-local" id="reqFrom" value="2026-03-11T10:00"/>
                                </div>
                                <div className="form-field">
                                    <label>변경 희망 일정</label>
                                    <input type="datetime-local" id="reqTo" value="2026-03-14T14:00"/>
                                </div>
                            </div>
                            <div className="form-field" style="margin-bottom:16px;">
                                <label>변경 사유</label>
                                <textarea id="reqReason" placeholder="변경이 필요한 이유를 상세히 작성해주세요..."></textarea>
                            </div>
                            <div style="display:flex;justify-content:flex-end;gap:8px;">
                                <button className="btn btn-ghost" onClick="clearReqForm()">초기화</button>
                                <button className="btn btn-primary" style="background:var(--accent);color:#0f0f13;"
                                        onClick="submitRequest()">요청 제출
                                </button>
                            </div>
                        </div>

                        <div className="card-title" style="margin-bottom:14px;">요청 이력</div>
                        <div id="reqList">
                        </div>
                    </div>

                    <div className="page" id="tutor-mypage">
                        <div className="page-header">
                            <div className="page-label">MY PAGE</div>
                            <div className="page-title">내 정보</div>
                            <div className="page-subtitle">계정 정보와 소속 플랫폼 현황을 확인하세요</div>
                        </div>

                        <div className="hero">
                            <div className="hero-avatar">이</div>
                            <div className="hero-info">
                                <div className="hero-name">이수진 트레이너</div>
                                <div className="hero-email">lee.sujin@reservehub.kr · 010-1234-5678</div>
                            </div>
                            <div className="hero-stats">
                                <div className="hero-stat">
                                    <div className="hstat-val">2</div>
                                    <div className="hstat-key">소속 플랫폼</div>
                                </div>
                                <div className="hero-stat">
                                    <div className="hstat-val" style="color:var(--green)">24</div>
                                    <div className="hstat-key">담당 수강생</div>
                                </div>
                                <div className="hero-stat">
                                    <div className="hstat-val" style="color:var(--accent3)">86</div>
                                    <div className="hstat-key">이번달 레슨</div>
                                </div>
                                <div className="hero-stat">
                                    <div className="hstat-val" style="color:var(--green)">93%</div>
                                    <div className="hstat-key">출결률</div>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm">✏️ 정보 수정</button>
                        </div>

                        <div className="mypage-grid">
                            <div className="card">
                                <div className="card-title">소속 플랫폼</div>
                                <div className="plat-item">
                                    <div className="plat-icon" style="background:rgba(124,106,247,.12)">🤸</div>
                                    <div className="plat-body">
                                        <div className="plat-name">스튜디오 필라테스 강남</div>
                                        <div className="plat-tags">
                                            <span className="plat-tag"
                                                  style="background:rgba(124,106,247,.15);color:#7c6af7">필라테스</span>
                                        </div>
                                        <div className="plat-sub">그룹반 A · 그룹반 B · 1:1 개인레슨 · 수강생 18명</div>
                                    </div>
                                    <span className="plat-status ps-active">재직 중</span>
                                </div>
                                <div className="plat-item">
                                    <div className="plat-icon" style="background:rgba(79,209,197,.12)">🧘</div>
                                    <div className="plat-body">
                                        <div className="plat-name">요가라운지 홍대</div>
                                        <div className="plat-tags">
                                            <span className="plat-tag"
                                                  style="background:rgba(79,209,197,.15);color:#4fd1c5">요가</span>
                                        </div>
                                        <div className="plat-sub">요가 기초반 · 요가 심화반 · 수강생 6명</div>
                                    </div>
                                    <span className="plat-status ps-active">재직 중</span>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-title">이번 주 일정</div>
                                <div className="sch-item">
                                    <div className="sch-dot" style="background:#7c6af7"></div>
                                    <div className="sch-time">09:00</div>
                                    <div className="sch-name">그룹반 A — 필라테스</div>
                                    <span className="sch-badge"
                                          style="background:rgba(74,222,128,.12);color:var(--green)">오늘</span>
                                </div>
                                <div className="sch-item">
                                    <div className="sch-dot" style="background:#7c6af7"></div>
                                    <div className="sch-time">10:00</div>
                                    <div className="sch-name">홍길동 — 1:1 개인레슨</div>
                                    <span className="sch-badge"
                                          style="background:rgba(74,222,128,.12);color:var(--green)">오늘</span>
                                </div>
                                <div className="sch-item">
                                    <div className="sch-dot" style="background:#4fd1c5"></div>
                                    <div className="sch-time">14:00</div>
                                    <div className="sch-name">요가 기초반</div>
                                    <span className="sch-badge"
                                          style="background:rgba(79,209,197,.12);color:#4fd1c5">오늘</span>
                                </div>
                                <div className="sch-item">
                                    <div className="sch-dot" style="background:#7c6af7"></div>
                                    <div className="sch-time">10:00</div>
                                    <div className="sch-name">그룹반 A — 필라테스</div>
                                    <span className="sch-badge"
                                          style="background:var(--surface2);color:var(--text-sub)">목 3/14</span>
                                </div>
                                <div className="sch-item">
                                    <div className="sch-dot" style="background:#7c6af7"></div>
                                    <div className="sch-time">16:00</div>
                                    <div className="sch-name">김민지 — 1:1 개인레슨</div>
                                    <span className="sch-badge"
                                          style="background:var(--surface2);color:var(--text-sub)">금 3/15</span>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-title">계정 정보</div>
                                <div style="display:flex;flex-direction:column;gap:14px;">
                                    <div className="form-field"><label>이름</label><input type="text" value="이수진" readOnly
                                                                                        style="opacity:.7;cursor:default;"/>
                                    </div>
                                    <div className="form-field"><label>이메일</label><input type="email"
                                                                                         value="lee.sujin@reservehub.kr"/>
                                    </div>
                                    <div className="form-field"><label>연락처</label><input type="tel"
                                                                                         value="010-1234-5678"/></div>
                                    <div className="form-field"><label>소개 (Bio)</label><textarea
                                        style="min-height:60px;resize:none;">필라테스 자격증 보유 · 요가 지도사 2급 · 현장 경력 5년</textarea>
                                    </div>
                                    <button className="btn btn-primary"
                                            style="background:var(--accent);color:#0f0f13;align-self:flex-end;"
                                            onClick="showToast('정보가 저장되었습니다.')">저장
                                    </button>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-title">비밀번호 변경</div>
                                <div style="display:flex;flex-direction:column;gap:14px;">
                                    <div className="form-field"><label>현재 비밀번호</label><input type="password"
                                                                                             placeholder="••••••••"/>
                                    </div>
                                    <div className="form-field"><label>새 비밀번호</label><input type="password"
                                                                                            placeholder="8자 이상"/></div>
                                    <div className="form-field"><label>새 비밀번호 확인</label><input type="password"
                                                                                               placeholder="동일하게 입력"/>
                                    </div>
                                    <button className="btn btn-ghost" style="align-self:flex-end;"
                                            onClick="showToast('비밀번호가 변경되었습니다.')">변경하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

    )
}