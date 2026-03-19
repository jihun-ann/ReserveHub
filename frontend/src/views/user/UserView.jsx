import {useState} from 'react'
import './UserView.css'
import './UserView.js'
import UserMypage from './UserMypageView.jsx'
import UserReservation from './UserReservationView.jsx'
import UserCalendar from './UserCalendarView.jsx'

export default function UserView() {
    const [currentContext, setCurrentContext] = useState('calendar')

    return (
        <div className="app" id="user-app">

            {/* 모바일 오버레이 */}
            <div className="overlay" id="user-overlay" onClick={closeSidebar}></div>

            {/* ── 사이드바 ── */}
            <nav className="sidebar" id="user-sidebar">
                <div className="sidebar-top">
                    <div className="logo">
                        <div className="logo-icon">🗓</div>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <button className="collapse-btn" onClick={toggleCollapse}>◀</button>
                </div>

                {/*로그인 데이터를 받아 처리할 항목*/}
                <div className="user-card">
                    <div className="avatar">김</div>
                    <div className="user-info">
                        <div className="user-name">김지수</div>
                        <div className="user-role">수강생 · 일반회원</div>
                    </div>
                </div>

                <div className="nav" id="user-nav">
                    <button className={`nav-item ${currentContext === 'calendar' ? 'active' : ''}`}
                            onClick={() => showPage('calendar')}>
                        <span className="nav-icon">📅</span>
                        <span className="nav-label">캘린더</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'reservation' ? 'active' : ''}`}
                            onClick={() => showPage('reservation')}>
                        <span className="nav-icon">🎯</span>
                        <span className="nav-label">예약하기</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'mypage' ? 'active' : ''}`}
                            onClick={() => showPage('mypage')}>
                        <span className="nav-icon">👤</span>
                        <span className="nav-label">마이페이지</span>
                    </button>
                </div>

                <div className="sidebar-bottom">
                    <button className="btn-logout">🚪 <span>로그아웃</span></button>
                </div>
            </nav>

            {/* ── 메인 ── */}
            <div className="main" id="user-main">
                <div className="topbar">
                    <button className="hamburger" onClick={openSidebar}>☰</button>
                    <div className="topbar-title" id="topbar-title">내 캘린더</div>
                    <div className="topbar-right">
                        <button className="notif-btn" title="알림">🔔<span className="notif-dot"></span></button>
                    </div>
                </div>

                <div className="content">
                    {renderContext()}
                </div>
                {/* /content */}
            </div>
            {/* /main */}
        </div>
    )

    //사이드바 닫기
    function closeSidebar() {
        document.getElementById('user-sidebar').classList.remove('open');
        document.getElementById('user-overlay').classList.remove('open');
    }
    //사이드바 토글
    function toggleCollapse() {
        document.getElementById('user-sidebar').classList.toggle('collapsed');
    }
    //사이드바 열기
    function openSidebar() {
        document.getElementById('user-sidebar').classList.add('open');
        document.getElementById('user-overlay').classList.add('open');
    }

    //메인 컨텐츠 처리 메서드 (currentContext 값을 변경하여 메인 컨텐츠 변경)
    function showPage(parm) {
        setCurrentContext(parm)
    }

    //변경된 컨텐츠 적용
    function renderContext(){
        let resultContext = '';

        switch (currentContext) {
            case 'calendar': resultContext = <UserCalendar />; break;
            case 'reservation': resultContext = <UserReservation />; break;
            case 'mypage': resultContext = <UserMypage />; break;
            default: resultContext = <UserCalendar />; break;
        }

        return resultContext
    }
}