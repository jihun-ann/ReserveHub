import {useState, useEffect} from 'react'
import {closeSidebar, toggleCollapse, openSidebar} from '../default.js'
import './SuperView.css'
import SuperApprovalView from "./SuperApprovalView.jsx";
import SuperCalculationView from "./SuperCalculationView.jsx";
import SuperCalendarView from "./SuperCalendarView.jsx";
import SuperDashBoardView from "./SuperDashBoardView.jsx";
import SuperMemberManageView from "./SuperMemberManageView.jsx";
import SuperMypageView from "./SuperMypageView.jsx";
import SuperPaymentView from "./SuperPaymentView.jsx";
import SuperStudyHistoryView from "./SuperStudyHistoryView.jsx";
import SuperTutorManageView from "./SuperTutorManageView.jsx";

export default function SuperView() {
    const [currentPlatform, setCurrentPlatform] = useState('pilates')
    const [currentContext, setCurrentContext] = useState('dashboard')


    return (
        <div className="app" id="super-app">
            <div className="overlay" id="super-overlay" onClick={closeSidebar}></div>

            {/* ══ 사이드바 ══ */}
            <nav className="sidebar" id="super-sidebar">
                <div className="sidebar-top">
                    <div className="logo">
                        <div className="logo-icon">🏪</div>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <button className="collapse-btn" onClick={toggleCollapse}>◀</button>
                </div>

                {/* 플랫폼 전환 */}
                <div className="plat-switch">
                    <div className="plat-switch-label">담당 플랫폼</div>
                    <button className={`plat-tab-btn ${currentPlatform === 'pilates' ? 'active' : ''}`}  id="platTab-pilates" onClick={()=>switchPlat('pilates')}>
                        <div className="plat-dot" style={{background: '#7c6af7'}}></div>
                        <span>스튜디오 필라테스 강남</span>
                    </button>
                    <button className={`plat-tab-btn ${currentPlatform === 'yoga' ? 'active' : ''}`} id="platTab-yoga" onClick={() =>switchPlat('yoga')}>
                        <div className="plat-dot" style={{background: '#4fd1c5'}}></div>
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
                    <button className={`nav-item ${currentContext === 'dashboard' ? 'active' : ''}`} onClick={()=>showPage('dashboard')}>
                        <span className="nav-icon">📊</span>
                        <span className="nav-label">대시보드</span></button>
                    <button className={`nav-item ${currentContext === 'approval' ? 'active' : ''}`} onClick={()=>showPage('approval')}>
                        <span className="nav-icon">✅</span>
                        <span className="nav-label">승인 관리</span>
                        <span className="nav-badge" id="approval-badge">2</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'members' ? 'active' : ''}`} onClick={()=>showPage('members')}>
                        <span className="nav-icon">👥</span>
                        <span className="nav-label">회원 관리</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'tutor' ? 'active' : ''}`} onClick={()=>showPage('tutor')}>
                        <span className="nav-icon">🧑‍🏫</span>
                        <span className="nav-label">강사 관리</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'payment' ? 'active' : ''}`} onClick={()=>showPage('payment')}>
                        <span className="nav-icon">💳</span>
                        <span className="nav-label">수강권 / 결제</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'calc' ? 'active' : ''}`} onClick={()=>showPage('calc')}>
                        <span className="nav-icon">🧮</span>
                        <span className="nav-label">상담 계산툴</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'calendar' ? 'active' : ''}`} onClick={()=>showPage('calendar')}>
                        <span className="nav-icon">📅</span>
                        <span
                        className="nav-label">캘린더</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'history' ? 'active' : ''}`} onClick={()=>showPage('history')}>
                        <span className="nav-icon">📋</span>
                        <span className="nav-label">수업 이력</span>
                    </button>
                    <button className={`nav-item ${currentContext === 'mypage' ? 'active' : ''}`} onClick={()=>showPage('mypage')}>
                        <span className="nav-icon">👤</span>
                        <span className="nav-label">내 정보</span>
                    </button>
                </div>

                <div className="sidebar-bottom">
                    <button className="btn-logout">🚪 <span>로그아웃</span></button>
                </div>
            </nav>

            {/* ══ 메인 ══ */}
            <div className="main">
                <div className="topbar">
                    <button className="hamburger" onClick={openSidebar}>☰</button>
                    <div className="topbar-title" id="topbar-title"><SetTopbarTitle currentContext={currentContext}/></div>
                    <span className="topbar-plat" id="topbar-plat">🤸 필라테스 강남</span>
                    <div className="topbar-right">
                        <button className="notif-btn" title="알림">🔔<span className="notif-dot"></span></button>
                    </div>
                </div>

                <div className="content">
                    <RenderContext currentContext={currentContext} currentPlatform={currentPlatform}/>
                </div>
                {/* /content */}
            </div>
            {/* /main */}
        </div>
    )

    function switchPlat (parm) {
        setCurrentPlatform(parm)
    }
    function showPage (parm) {
        setCurrentContext(parm)
    }

    //변경된 컨텐츠 적용
    function RenderContext({currentContext, currentPlatform}){
        switch (currentContext) {
            case 'dashboard': return <SuperDashBoardView />;
            case 'approval': return <SuperApprovalView />;
            case 'members': return <SuperMemberManageView />;
            case 'tutor': return <SuperTutorManageView />;
            case 'payment': return <SuperPaymentView />;
            case 'calc': return <SuperCalculationView />;
            case 'calendar': return <SuperCalendarView />;
            case 'history': return <SuperStudyHistoryView />;
            case 'mypage': return <SuperMypageView />;
            default: return <SuperDashBoardView />;
        }
    }

    function SetTopbarTitle({currentContext}){
        switch (currentContext) {
            case 'dashboard': return "대시보드";
            case 'approval': return "승인관리";
            case 'members': return "회원관리";
            case 'tutor': return "강사관리";
            case 'payment': return "결제관리";
            case 'calc': return "계산툴";
            case 'calendar': return "캘린더";
            case 'history': return "수강이력";
            case 'mypage': return "마이페이지";
            default: return "대시보드";
        }
    }

}
