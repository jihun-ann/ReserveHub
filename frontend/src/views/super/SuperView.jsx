export default function SuperView() {
    return (
        <div className="app" id="super-app">
            <div className="overlay" id="super-overlay" onClick="closeSidebar()"></div>

            {/* ══ 사이드바 ══ */}
            <nav className="sidebar" id="super-sidebar">
                <div className="sidebar-top">
                    <div className="logo">
                        <div className="logo-icon">🏪</div>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <button className="collapse-btn" onClick="toggleCollapse()">◀</button>
                </div>

                {/* 플랫폼 전환 */}
                <div className="plat-switch">
                    <div className="plat-switch-label">담당 플랫폼</div>
                    <button className="plat-tab-btn active" id="platTab-pilates" onClick="switchPlat('pilates',this)">
                        <div className="plat-dot" style="background:#7c6af7"></div>
                        <span>스튜디오 필라테스 강남</span>
                    </button>
                    <button className="plat-tab-btn" id="platTab-yoga" onClick="switchPlat('yoga',this)">
                        <div className="plat-dot" style="background:#4fd1c5"></div>
                        <span>요가라운지 홍대</span>
                    </button>
                </div>

                <div className="user-card">
                    <div className="avatar">정</div>
                    <div className="user-info">
                        <div className="user-name">정미래 점장</div>
                        <div className="user-role">서브담당자</div>
                    </div>
                </div>

                <div className="nav" id="super-nav">
                    <button className="nav-item active" onClick="showPage('dashboard',this)"><span
                        className="nav-icon">📊</span><span className="nav-label">대시보드</span></button>
                    <button className="nav-item" onClick="showPage('approval',this)"><span className="nav-icon">✅</span><span
                        className="nav-label">승인 관리</span><span className="nav-badge" id="approval-badge">2</span>
                    </button>
                    <button className="nav-item" onClick="showPage('members',this)"><span
                        className="nav-icon">👥</span><span
                        className="nav-label">회원 관리</span></button>
                    <button className="nav-item" onClick="showPage('instructors',this)"><span
                        className="nav-icon">🧑‍🏫</span><span
                        className="nav-label">강사 관리</span></button>
                    <button className="nav-item" onClick="showPage('payment',this)"><span
                        className="nav-icon">💳</span><span
                        className="nav-label">수강권 / 결제</span></button>
                    <button className="nav-item" onClick="showPage('calc',this)"><span
                        className="nav-icon">🧮</span><span
                        className="nav-label">상담 계산툴</span></button>
                    <button className="nav-item" onClick="showPage('calendar',this)"><span className="nav-icon">📅</span><span
                        className="nav-label">캘린더</span></button>
                    <button className="nav-item" onClick="showPage('history',this)"><span
                        className="nav-icon">📋</span><span
                        className="nav-label">수업 이력</span></button>
                    <button className="nav-item" onClick="showPage('mypage',this)"><span
                        className="nav-icon">👤</span><span
                        className="nav-label">내 정보</span></button>
                </div>

                <div className="sidebar-bottom">
                    <button className="btn-logout">🚪 <span>로그아웃</span></button>
                </div>
            </nav>

            {/* ══ 메인 ══ */}
            <div className="main">
                <div className="topbar">
                    <button className="hamburger" onClick="openSidebar()">☰</button>
                    <div className="topbar-title" id="topbar-title">대시보드</div>
                    <span className="topbar-plat" id="topbar-plat">🤸 필라테스 강남</span>
                    <div className="topbar-right">
                        <button className="notif-btn">🔔<span className="notif-dot"></span></button>
                    </div>
                </div>

                <div className="content">

                </div>
                {/* /content */}
            </div>
            {/* /main */}
        </div>
{/* /app */
}

{/* ══ 모달들 ══ */
}
{/* 공유 이벤트 등록 모달 */
}
    <div className="modal-overlay" id="shareEventModal">
        <div className="modal-box">
            <div className="modal-header">
                <div className="modal-title">📢 공유 이벤트 등록</div>
                <button className="modal-close" onClick="closeModal('shareEventModal')">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div className="form-field"><label>이벤트 제목</label><input type="text" placeholder="예: 3월 그룹반 특가 이벤트">
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div className="form-field"><label>시작일</label><input type="date" value="2026-03-11"></div>
                    <div className="form-field"><label>종료일</label><input type="date" value="2026-03-31"></div>
                </div>
                <div className="form-field">
                    <label>공개 범위</label>
                    <select>
                        <option>전체 회원</option>
                        <option>활성 회원만</option>
                        <option>VIP 회원</option>
                    </select>
                </div>
                <div className="form-field"><label>내용</label><textarea placeholder="이벤트 상세 내용을 입력하세요..."></textarea>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px">
                    <button className="btn btn-ghost" onClick="closeModal('shareEventModal')">취소</button>
                    <button className="btn btn-primary" style="background:var(--accent);color:#0f0f13"
                            onClick="submitShareEvent()">등록
                    </button>
                </div>
            </div>
        </div>
    </div>

{/* 회원 등록 모달 */
}
    <div className="modal-overlay" id="addMemberModal">
        <div className="modal-box">
            <div className="modal-header">
                <div className="modal-title">👤 회원 등록</div>
                <button className="modal-close" onClick="closeModal('addMemberModal')">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div className="form-field"><label>이름</label><input type="text" id="newMemberName"
                                                                        placeholder="홍길동">
                    </div>
                    <div className="form-field"><label>연락처</label><input type="tel" id="newMemberPhone"
                                                                         placeholder="010-0000-0000"></div>
                </div>
                <div className="form-field"><label>수강권</label>
                    <select id="newMemberPass">
                        <option value="그룹 월정액|2026-04-10">그룹 월정액 (30일)</option>
                        <option value="개인 10회권|2026-05-10">개인 10회권 (60일)</option>
                        <option value="개인 5회권|2026-04-25">개인 5회권 (45일)</option>
                    </select>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px">
                    <button className="btn btn-ghost" onClick="closeModal('addMemberModal')">취소</button>
                    <button className="btn btn-primary" style="background:var(--accent);color:#0f0f13"
                            onClick="submitAddMember()">등록
                    </button>
                </div>
            </div>
        </div>
    </div>

{/* 강사 등록 모달 */
}
    <div className="modal-overlay" id="addInstructorModal">
        <div className="modal-box">
            <div className="modal-header">
                <div className="modal-title">🧑‍🏫 강사 등록</div>
                <button className="modal-close" onClick="closeModal('addInstructorModal')">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div className="form-field"><label>이름</label><input type="text" id="newInstName"
                                                                        placeholder="홍길동 트레이너">
                    </div>
                    <div className="form-field"><label>연락처</label><input type="tel" id="newInstPhone"
                                                                         placeholder="010-0000-0000"></div>
                </div>
                <div className="form-field"><label>담당 프로그램</label><input type="text" id="newInstProgram"
                                                                         placeholder="예: 그룹반 C · 개인 레슨"></div>
                <div style="display:flex;justify-content:flex-end;gap:8px">
                    <button className="btn btn-ghost" onClick="closeModal('addInstructorModal')">취소</button>
                    <button className="btn btn-primary" style="background:var(--accent);color:#0f0f13"
                            onClick="submitAddInstructor()">등록
                    </button>
                </div>
            </div>
        </div>
    </div>

{/* 할인 정책 모달 */
}
    <div className="modal-overlay" id="discountModal">
        <div className="modal-box">
            <div className="modal-header">
                <div className="modal-title">🏷 할인 정책 설정</div>
                <button className="modal-close" onClick="closeModal('discountModal')">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div className="form-field"><label>정책명</label><input type="text" id="newDiscName"
                                                                     placeholder="예: 재등록 할인 10%"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div className="form-field"><label>할인율</label><input type="number" id="newDiscRate" value="10"
                                                                         min="1"
                                                                         max="100"></div>
                    <div className="form-field"><label>적용 대상</label>
                        <select id="newDiscTarget">
                            <option>전체 수강권</option>
                            <option>그룹 월정액</option>
                            <option>개인 10회권</option>
                            <option>개인 5회권</option>
                        </select>
                    </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px">
                    <button className="btn btn-ghost" onClick="closeModal('discountModal')">취소</button>
                    <button className="btn btn-primary" style="background:var(--accent);color:#0f0f13"
                            onClick="submitDiscount()">저장
                    </button>
                </div>
            </div>
        </div>
    </div>

{/* 수강권 추가 모달 */
}
    <div className="modal-overlay" id="passModal">
        <div className="modal-box">
            <div className="modal-header">
                <div className="modal-title">💳 수강권 추가</div>
                <button className="modal-close" onClick="closeModal('passModal')">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:14px">
                <div className="form-field"><label>수강권명</label><input type="text" id="newPassName"
                                                                      placeholder="예: 그룹 주 2회권"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div className="form-field"><label>금액 (원)</label><input type="number" id="newPassPrice"
                                                                            placeholder="150000"></div>
                    <div className="form-field"><label>기간 (일)</label><input type="number" id="newPassDays"
                                                                            placeholder="30">
                    </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px">
                    <button className="btn btn-ghost" onClick="closeModal('passModal')">취소</button>
                    <button className="btn btn-primary" style="background:var(--accent);color:#0f0f13"
                            onClick="submitPass()">추가
                    </button>
                </div>
            </div>
        </div>
    </div>
)
}