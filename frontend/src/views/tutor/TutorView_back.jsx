import { useMemo, useState } from 'react'
import './TutorView.css'
import TutorCalendarPage from './TutorCalendarPage.jsx'
import TutorAttendancePage from './TutorAttendancePage.jsx'
import TutorRequestPage from './TutorRequestPage.jsx'
import TutorMypagePage from './TutorMypagePage.jsx'

const PAGE_TITLES = { calendar: '강사 캘린더', attend: '출결 관리', request: '일정 변경 요청', mypage: '내 정보' }
const PLATFORMS = {
    pilates: { name: '필라테스', emoji: '필', color: '#7c6af7', bg: 'rgba(124,106,247,.15)', border: 'rgba(124,106,247,.3)' },
    yoga: { name: '요가', emoji: '요', color: '#4fd1c5', bg: 'rgba(79,209,197,.15)', border: 'rgba(79,209,197,.3)' },
    music: { name: '뮤직', emoji: '뮤', color: '#f6ad55', bg: 'rgba(246,173,85,.15)', border: 'rgba(246,173,85,.3)' },
}
const EVENTS = {
    '2026-3': {
        3: [{ time: '10:00', name: '그룹반 A', type: 'group', platform: 'pilates', color: '#7c6af7', students: ['한유진', '김민서', '박서준'] }],
        5: [{ time: '09:00', name: '그룹반 A', type: 'group', platform: 'pilates', color: '#7c6af7', students: ['한유진', '김민서'] }, { time: '14:00', name: '요가 기초반', type: 'group', platform: 'yoga', color: '#4fd1c5', students: ['이하윤', '정하준'] }],
        11: [{ time: '09:00', name: '그룹반 A', type: 'group', platform: 'pilates', color: '#7c6af7', students: ['한유진', '김민서', '박서준', '이하윤'] }, { time: '10:00', name: '한유진 개인레슨', type: 'private', platform: 'pilates', color: '#7c6af7', students: ['한유진'] }, { time: '14:00', name: '요가 기초반', type: 'group', platform: 'yoga', color: '#4fd1c5', students: ['이하윤', '정하준'] }],
    },
}
const INITIAL_ATTENDANCE = [
    { name: '한유진', phone: '010-1234-5678', program: '개인레슨', platform: 'pilates', time: '10:00', status: 'present' },
    { name: '김민서', phone: '010-2222-3333', program: '그룹반 A', platform: 'pilates', time: '09:00', status: 'late' },
    { name: '박서준', phone: '010-3333-4444', program: '그룹반 A', platform: 'pilates', time: '09:00', status: null },
    { name: '이하윤', phone: '010-5555-6666', program: '그룹반 B', platform: 'yoga', time: '14:00', status: null },
]
const INITIAL_REQUEST_FORM = { student: '한유진', program: '개인레슨', from: '2026-03-11T10:00', to: '2026-03-14T14:00', reason: '' }
const INITIAL_REQUESTS = [
    { title: '한유진 개인레슨 일정 변경', from: '2026.03.11 10:00', to: '2026.03.14 14:00', reason: '수강생 요청으로 일정 변경이 필요합니다.', date: '2026.03.10', platform: '필라테스 강남', status: 'pending' },
    { title: '요가 그룹반 B 보강 요청', from: '2026.03.05 14:00', to: '2026.03.08 15:00', reason: '강사 이동으로 보강 수업이 필요합니다.', date: '2026.03.04', platform: '요가 홍대', status: 'approved' },
]

export default function TutorView_back() {
    const [currentPage, setCurrentPage] = useState('calendar')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [calendarDate, setCalendarDate] = useState({ year: 2026, month: 3 })
    const [selectedDay, setSelectedDay] = useState(11)
    const [attendanceFilter, setAttendanceFilter] = useState('all')
    const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE)
    const [requestForm, setRequestForm] = useState(INITIAL_REQUEST_FORM)
    const [requests, setRequests] = useState(INITIAL_REQUESTS)
    const [toast, setToast] = useState('')

    const navItems = useMemo(() => [
        { key: 'calendar', icon: '달', label: '캘린더' },
        { key: 'attend', icon: '출', label: '출결 관리' },
        { key: 'request', icon: '변', label: '일정 변경 요청' },
        { key: 'mypage', icon: '정', label: '내 정보' },
    ], [])

    function showToast(message) {
        setToast(message)
        window.clearTimeout(window.__tutorToastTimer)
        window.__tutorToastTimer = window.setTimeout(() => setToast(''), 2500)
    }

    function changeMonth(delta) {
        setCalendarDate((prev) => {
            let month = prev.month + delta
            let year = prev.year
            if (month > 12) { month = 1; year += 1 }
            if (month < 1) { month = 12; year -= 1 }
            return { year, month }
        })
        setSelectedDay(1)
    }

    function updateAttendanceStatus(name, time, status) {
        setAttendanceRecords((prev) => prev.map((record) => record.name === name && record.time === time ? { ...record, status } : record))
    }

    function updateRequestForm(field, value) {
        setRequestForm((prev) => ({ ...prev, [field]: value }))
    }

    function resetRequestForm() {
        setRequestForm(INITIAL_REQUEST_FORM)
    }

    function submitRequest() {
        if (!requestForm.reason.trim()) {
            showToast('변경 사유를 입력하세요.')
            return
        }
        setRequests((prev) => [{ title: `${requestForm.student} ${requestForm.program} 일정 변경`, from: requestForm.from.replace('T', ' ').replaceAll('-', '.'), to: requestForm.to.replace('T', ' ').replaceAll('-', '.'), reason: requestForm.reason, date: '2026.03.11', platform: '필라테스 강남', status: 'pending' }, ...prev])
        resetRequestForm()
        showToast('요청이 저장되었습니다.')
    }

    return (
        <div className="app" id="tutor-app">
            <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
            <nav className={`sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-top">
                    <div className="logo"><div className="logo-icon">강</div><span className="logo-text">ReserveHub</span></div>
                    <button className="collapse-btn" onClick={() => setCollapsed((prev) => !prev)}>접기</button>
                </div>
                <div className="user-card">
                    <div className="avatar">이</div>
                    <div className="user-info"><div className="user-name">이수진 트레이너</div><div className="user-role">강사</div></div>
                </div>
                <div className="nav">
                    {navItems.map((item) => (
                        <button key={item.key} className={`nav-item ${currentPage === item.key ? 'active' : ''}`} onClick={() => { setCurrentPage(item.key); setSidebarOpen(false) }}>
                            <span className="nav-icon">{item.icon}</span><span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </div>
                <div className="sidebar-bottom"><button className="btn-logout">로그아웃</button></div>
            </nav>
            <div className="main">
                <div className="topbar">
                    <button className="hamburger" onClick={() => setSidebarOpen(true)}>메뉴</button>
                    <div className="topbar-title">{PAGE_TITLES[currentPage]}</div>
                    <div className="topbar-right"><button className="notif-btn" title="알림">알<span className="notif-dot"></span></button></div>
                </div>
                <div className="content">
                    {currentPage === 'calendar' && <TutorCalendarPage calendarDate={calendarDate} selectedDay={selectedDay} eventsByMonth={EVENTS} platforms={PLATFORMS} onPrevMonth={() => changeMonth(-1)} onNextMonth={() => changeMonth(1)} onSelectDay={setSelectedDay} onMoveAttend={() => setCurrentPage('attend')} />}
                    {currentPage === 'attend' && <TutorAttendancePage records={attendanceRecords} platforms={PLATFORMS} filter={attendanceFilter} onFilterChange={setAttendanceFilter} onStatusChange={updateAttendanceStatus} onSave={() => showToast('출결이 저장되었습니다.')} />}
                    {currentPage === 'request' && <TutorRequestPage form={requestForm} requests={requests} onChange={updateRequestForm} onSubmit={submitRequest} onReset={resetRequestForm} />}
                    {currentPage === 'mypage' && <TutorMypagePage />}
                </div>
            </div>
            <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
        </div>
    )
}
