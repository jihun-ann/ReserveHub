import {useEffect} from "react";

export default function UserCalendarView() {

    useEffect(() => {
        init()
    })

    let timerInterval = null, timerSec = 0, timerRunning = false
    let calYear = 2026, calMonth = 3, calSelectedDay = 11;
    const WEEKDAYS_KO = ['일','월','화','수','목','금','토'];

    //예약 예제
    const RESERVATIONS = {
        '2026-3': {
            3: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'}],
            5: [{time: '14:00', name: '1번 연습실', place: '뮤직하우스 홍대점', color: 'var(--accent3)'}],
            7: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'}],
            10: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'},
                {time: '14:00', name: '1번 연습실', place: '뮤직하우스 홍대점', color: 'var(--accent3)'}],
            11: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'},
                {time: '14:00', name: '1번 연습실', place: '뮤직하우스 홍대점', color: 'var(--accent3)'}],
            14: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'}],
            17: [{time: '14:00', name: '1번 연습실', place: '뮤직하우스 홍대점', color: 'var(--accent3)'}],
            21: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'}],
            24: [{time: '14:00', name: '1번 연습실', place: '뮤직하우스 홍대점', color: 'var(--accent3)'}],
        },
        '2026-4': {
            2: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'}],
            7: [{time: '14:00', name: '1번 연습실', place: '뮤직하우스 홍대점', color: 'var(--accent3)'}],
            14: [{time: '10:00', name: '필라테스 그룹반 A', place: '스튜디오 필라테스 강남점', color: 'var(--accent)'}],
        },
    }

    return (
        <div className="user-view page active" id="page-calendar">
            <div className="page-header">
                <div className="page-label">CALENDAR</div>
                <div className="page-title">내 캘린더</div>
                <div className="page-subtitle">레슨 일정과 예약 현황을 한눈에 확인하세요</div>
            </div>

            <div className="cal-grid">
                {/* 달력 카드 */}
                <div className="card">
                    <div className="cal-nav-row">
                        <span className="cal-month-label" id="calMonthLabel">{calYear + '년 ' + calMonth + '월'}</span>
                        <div className="cal-nav-btns">
                            <button className="cal-nav-btn" onClick={() => calNav(-1)}>‹</button>
                            <button className="cal-nav-btn" onClick={() => calNav(1)}>›</button>
                        </div>
                    </div>
                    <div className="cal-dow">
                        <div className="cal-dow-label" style={{color: '#f87171'}}>일</div>
                        <div className="cal-dow-label">월</div>
                        <div className="cal-dow-label">화</div>
                        <div className="cal-dow-label">수</div>
                        <div className="cal-dow-label">목</div>
                        <div className="cal-dow-label">금</div>
                        <div className="cal-dow-label" style={{color: '#60a5fa'}}>토</div>
                    </div>
                    <div className="cal-days" id="calDays"></div>
                    <div className="cal-legend">
                        <div className="legend-item">
                            <div className="legend-dot" style={{background: 'var(--accent)'}}></div>
                            오늘
                        </div>
                        <div className="legend-item">
                            <div className="legend-dot" style={{background: 'var(--accent2)'}}></div>
                            예약 있음
                        </div>
                        <div className="legend-item">
                            <div className="legend-dot" style={{background: 'var(--accent3)'}}></div>
                            오늘+예약
                        </div>
                    </div>
                </div>

                {/* 오른쪽 패널 */}
                <div className="cal-right">

                    {/* 선택 날 레슨 */}
                    <div className="card">
                        <div className="card-title" id="calDayTitle">3월 11일 화요일 — 오늘</div>
                        <div id="calDayDetail">
                            <div className="lesson-list">
                                <div className="lesson-item">
                                    <div className="lesson-time">10:00</div>
                                    <div className="lesson-body">
                                        <div className="lesson-name">필라테스 그룹반 A</div>
                                        <div className="lesson-place">스튜디오 필라테스 강남점</div>
                                    </div>
                                    <div className="lesson-tag">예약됨</div>
                                </div>
                                <div className="lesson-item" style={{borderLeftColor: 'var(--accent3)'}}>
                                    <div className="lesson-time" style={{color: 'var(--accent3)'}}>14:00</div>
                                    <div className="lesson-body">
                                        <div className="lesson-name">1번 연습실</div>
                                        <div className="lesson-place">뮤직하우스 홍대점</div>
                                    </div>
                                    <div className="lesson-tag music">예약됨</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 타이머 */}
                    <div className="card">
                        <div className="card-title">운동 · 연습 타이머</div>
                        <div className="timer-type-row">
                            <button className="type-btn active">🏋️ 운동</button>
                            {/*<button className="type-btn active" onClick="setTimerType(this,'운동')">🏋️ 운동</button>
                            <button className="type-btn" onClick="setTimerType(this,'스트레칭')">🧘 스트레칭</button>
                            <button className="type-btn" onClick="setTimerType(this,'연습')">🎵 연습</button>*/}
                        </div>
                        <div className="timer-digits" id="timerDigits">00:00:00</div>
                        <div className="timer-label">ELAPSED TIME</div>
                        <div className="timer-btn-row">
                            <button id="timerToggleBtn" onClick={toggleTimer}
                                    style={{
                                        background: 'var(--accent)',
                                        color: 'white'
                                    }}>시작
                            </button>
                            <button onClick={resetTimer}
                                    style={{
                                        background: 'var(--surface2)',
                                        color: 'var(--text-sub)',
                                        border: '1px solid var(--border)'
                                    }}>초기화
                            </button>
                        </div>
                        <div className="timer-stats">
                            <div className="timer-stat">
                                <div className="timer-stat-val" id="todayTotal">01:42</div>
                                <div className="timer-stat-key">오늘 총 시간</div>
                            </div>
                            <div className="timer-stat">
                                <div className="timer-stat-val">3</div>
                                <div className="timer-stat-key">이번달 기록</div>
                            </div>
                            <div className="timer-stat">
                                <div className="timer-stat-val">12</div>
                                <div className="timer-stat-key">누적 세션</div>
                            </div>
                        </div>
                    </div>

                    {/* 최근 이력 */}
                    <div className="card">
                        <div className="card-title">최근 이력</div>
                        <div className="history-list">
                            <div className="history-item">
                                <div className="history-dot" style={{background: 'var(--accent2)'}}></div>
                                <div className="history-date">03.07 10:00</div>
                                <div className="history-name">필라테스 그룹반 A</div>
                                <div className="history-dur">60분</div>
                            </div>
                            <div className="history-item">
                                <div className="history-dot" style={{background: 'var(--accent3)'}}></div>
                                <div className="history-date">03.05 14:00</div>
                                <div className="history-name">연습실 자율 연습</div>
                                <div className="history-dur">90분</div>
                            </div>
                            <div className="history-item">
                                <div className="history-dot" style={{background: 'var(--accent)'}}></div>
                                <div className="history-date">03.03 10:00</div>
                                <div className="history-name">필라테스 그룹반 A</div>
                                <div className="history-dur">60분</div>
                            </div>
                            <div className="history-item">
                                <div className="history-dot" style={{background: 'var(--accent3)'}}></div>
                                <div className="history-date">02.28 13:00</div>
                                <div className="history-name">개인 운동 타이머</div>
                                <div className="history-dur">45분</div>
                            </div>
                        </div>
                    </div>

                </div>
                {/* /cal-right */}
            </div>
            {/* /cal-grid */}
        </div>
    )

    //달력 월 변경
    function calNav(delta) {
        calMonth += delta;
        if (calMonth > 12) {
            calMonth = 1;
            calYear++;
        }
        if (calMonth < 1) {
            calMonth = 12;
            calYear--;
        }
        calSelectedDay = 1;
        renderCal();
    }

    //타이머 토글 버튼
    function toggleTimer() {
        const btn = document.getElementById('timerToggleBtn');
        if (!timerRunning) {
            timerRunning = true;
            if (btn) {
                btn.textContent = '일시정지';
                btn.style.background = 'var(--accent2)';
                btn.style.color = '#0f0f13';
            }
            timerInterval = setInterval(function () {
                timerSec++;
                updateTimerDisplay();
            }, 1000);
        } else {
            timerRunning = false;
            if (btn) {
                btn.textContent = '재개';
                btn.style.background = 'var(--accent)';
                btn.style.color = 'white';
            }
            clearInterval(timerInterval);
        }
    }

    //타이머 초기화
    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSec = 0;
        updateTimerDisplay();
        const btn = document.getElementById('timerToggleBtn');
        if (btn) {
            btn.textContent = '시작';
            btn.style.background = 'var(--accent)';
            btn.style.color = 'white';
        }
    }

    //타이머 시간 진행
    function updateTimerDisplay() {
        const h = Math.floor(timerSec / 3600);
        const m = Math.floor((timerSec % 3600) / 60);
        const s = timerSec % 60;
        const el = document.getElementById('timerDigits');
        if (el) el.textContent = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    }

    //두자리수 만들기 (한 자리수 0을 채움)
    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    //달력 랜더링
    function renderCal() {
        const label = document.getElementById('calMonthLabel');
        if (label) label.textContent = calYear + '년 ' + calMonth + '월';

        const container = document.getElementById('calDays');
        if (!container) return;
        container.innerHTML = '';

        const today = new Date();
        const isCurrentMonth = (today.getFullYear() === calYear && today.getMonth() + 1 === calMonth);
        const todayDay = isCurrentMonth ? today.getDate() : -1;

        const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const daysInPrev = new Date(calYear, calMonth - 1, 0).getDate();
        const resData = RESERVATIONS[getResKey()] || {};

        // 이전달 빈칸
        for (let i = 0; i < firstDow; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-cell dim';
            cell.textContent = daysInPrev - firstDow + 1 + i;
            container.appendChild(cell);
        }

        // 이번달
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            const hasRes = !!resData[d];
            const isToday = (d === todayDay);
            const isSel = (d === calSelectedDay);

            let cls = 'cal-cell';
            if (isSel) cls += ' selected';
            else if (isToday) cls += ' today';
            if (hasRes) cls += ' has-lesson';
            cell.className = cls;
            cell.textContent = d;

            const _d = d;
            cell.addEventListener('click', function () {
                calSelectedDay = _d;
                renderCal();
                renderDayDetail(_d);
            });
            container.appendChild(cell);
        }

        // 다음달 빈칸
        const total = firstDow + daysInMonth;
        const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
        for (let i = 1; i <= remain; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-cell dim';
            cell.textContent = i;
            container.appendChild(cell);
        }

        // 선택된 날 상세 업데이트
        renderDayDetail(calSelectedDay);
    }

    function renderDayDetail(day) {
        const titleEl = document.getElementById('calDayTitle');
        const detailEl = document.getElementById('calDayDetail');
        if (!titleEl || !detailEl) return;

        const dow = new Date(calYear, calMonth - 1, day).getDay();
        const today = new Date();
        const isToday = (today.getFullYear() === calYear && today.getMonth() + 1 === calMonth && today.getDate() === day);
        titleEl.textContent = calMonth + '월 ' + day + '일 ' + WEEKDAYS_KO[dow] + '요일' + (isToday ? ' — 오늘' : '');

        const resData = (RESERVATIONS[getResKey()] || {})[day];
        if (!resData || resData.length === 0) {
            detailEl.innerHTML = '<div class="no-event">예약된 일정이 없습니다</div>';
            return;
        }
        detailEl.innerHTML = '<div class="lesson-list">' +
            resData.map(r => `
              <div class="lesson-item" style="border-left-color:${r.color}">
                <div class="lesson-time" style="color:${r.color}">${r.time}</div>
                <div class="lesson-body">
                  <div class="lesson-name">${r.name}</div>
                  <div class="lesson-place">${r.place}</div>
                </div>
                <div class="lesson-tag" style="background:rgba(124,106,247,.12);color:${r.color}">예약됨</div>
              </div>`).join('') +
            '</div>';
    }

    function getResKey(){
        return calYear + '-' + calMonth
    }

    function init() {
        console.log("init")
        renderCal()
    }

}