import {useState, useEffect} from "react";
import UserReservationComponent from "./Component/UserReservationComponent.jsx";

export default function UserReservationView() {
    let [currentFilter, setCurrentFilter] = useState('all')
    let selectedProg = null, selectedDateOffset = 0, selectedSlotIdx = null;

    useEffect(() => {
        window.selectProgram = selectProgram;
        window.selectSlot = selectSlot;
        renderPrograms()
    })

    //예제 강습
    const PROGRAMS = [
        {
            id: 'p1',
            cat: 'pilates',
            icon: '🤸',
            name: '필라테스 그룹반 A',
            meta: '스튜디오 필라테스 강남 · 60분 · 최대 8명',
            badge: '그룹 레슨',
            badgeCls: 'badge-group',
            bg: 'rgba(124,106,247,.15)',
            maxSlots: 8
        },
        {
            id: 'p2',
            cat: 'pilates',
            icon: '🤸',
            name: '필라테스 1:1 개인레슨',
            meta: '스튜디오 필라테스 강남 · 50분 · 개인',
            badge: '개인 레슨',
            badgeCls: 'badge-private',
            bg: 'rgba(79,209,197,.15)',
            maxSlots: 1
        },
        {
            id: 'p3',
            cat: 'yoga',
            icon: '🧘',
            name: '요가 기초반',
            meta: '요가라운지 홍대 · 60분 · 최대 10명',
            badge: '그룹 레슨',
            badgeCls: 'badge-group',
            bg: 'rgba(124,106,247,.15)',
            maxSlots: 10
        },
        {
            id: 'p4',
            cat: 'music',
            icon: '🎵',
            name: '1번 연습실',
            meta: '뮤직하우스 홍대 · 60분 단위 · 개인/팀',
            badge: '공간 예약',
            badgeCls: 'badge-room',
            bg: 'rgba(246,173,85,.15)',
            maxSlots: 1
        },
        {
            id: 'p5',
            cat: 'music',
            icon: '🎸',
            name: '2번 연습실 (드럼)',
            meta: '뮤직하우스 홍대 · 60분 단위 · 개인/팀',
            badge: '공간 예약',
            badgeCls: 'badge-room',
            bg: 'rgba(246,173,85,.15)',
            maxSlots: 1
        },
        {
            id: 'p6',
            cat: 'fitness',
            icon: '🏋️',
            name: '헬스장 자유이용',
            meta: '피트니스 클럽 서초 · 시간 자유 · 개인',
            badge: '자유이용',
            badgeCls: 'badge-room',
            bg: 'rgba(246,173,85,.15)',
            maxSlots: 20
        },
    ];
    const WEEKDAYS_KO = ['일','월','화','수','목','금','토'];
    const SLOT_TIMES = ['09:00','10:00','11:00','14:00','15:00','16:00','18:00','19:00'];

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
                        <button className={`filter-chip ${currentFilter === 'all' ? 'active' : ''}`}
                                onClick={() => filterChip('all')}>전체
                        </button>
                        <button className={`filter-chip ${currentFilter === 'pilates' ? 'active' : ''}`}
                                onClick={() => filterChip('pilates')}>🤸 필라테스
                        </button>
                        <button className={`filter-chip ${currentFilter === 'yoga' ? 'active' : ''}`}
                                onClick={() => filterChip('yoga')}>🧘 요가
                        </button>
                        <button className={`filter-chip ${currentFilter === 'music' ? 'active' : ''}`}
                                onClick={() => filterChip('music')}>🎵 음악
                        </button>
                        <button className={`filter-chip ${currentFilter === 'fitness' ? 'active' : ''}`}
                                onClick={() => filterChip('fitness')}>🏋️ 헬스
                        </button>
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

                        <div className="confirm-box" id="confirmBox" style={{display: 'none'}}>
                            <div className="confirm-row">
                                <span>프로그램</span>
                                <strong id="confirmProg">—</strong></div>
                            <div className="confirm-row">
                                <span>날짜</span>
                                <strong id="confirmDate">—</strong>
                            </div>
                            <div className="confirm-row">
                                <span>시간</span>
                                <strong id="confirmTime">—</strong>
                            </div>
                            <div className="confirm-row">
                                <span>잔여석</span>
                                <strong id="confirmRemain" style={{color: 'var(--accent2)'}}>—</strong>
                            </div>
                            <button className="btn-confirm" id="confirmBtn" onClick={doReserve}>
                                예약 하기
                            </button>
                        </div>
                        <div id="noSlotMsg"
                             style={{
                                 textAlign: 'center',
                                 padding: '32px 0',
                                 color: 'var(--text-dim)',
                                 fontSize: '13px'
                             }}>
                            프로그램을 선택해 주세요
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    function selectProgram(id) {
        selectedProg = PROGRAMS.find(p => p.id === id) || null;
        selectedDateOffset = 0;
        selectedSlotIdx = null;
        renderPrograms();
        renderSlotPanel();
    }

    function filterChip(cat) {
        setCurrentFilter(cat)
        renderPrograms();
    }


    function renderPrograms() {
        const list = document.getElementById('programList');
        if (!list) return;
        const visible = currentFilter === 'all' ? PROGRAMS : PROGRAMS.filter(p => p.cat === currentFilter);
        console.log(visible)
        const visibleeComponent = UserReservationComponent
        list.innerHTML = visible.map(p => `
        <div class="program-card${selectedProg && selectedProg.id === p.id ? ' selected' : ''}"
             onclick="selectProgram('${p.id}')">
          <div class="program-icon" style="background:${p.bg}">${p.icon}</div>
          <div class="program-body">
            <div class="program-name">${p.name}</div>
            <div class="program-meta">${p.meta}</div>
          </div>
          <span class="prog-badge ${p.badgeCls}">${p.badge}</span>
        </div>`).join('');
    }

    function doReserve() {
        if (!selectedProg || selectedSlotIdx === null) return;
        const slots = getSlots(selectedProg, selectedDateOffset);
        const slot = slots[selectedSlotIdx];
        showToast('✅ ' + selectedProg.name + ' ' + slot.time + ' 예약 완료!');
        selectedSlotIdx = null;
        document.getElementById('confirmBox').style.display = 'none';
        renderSlotPanel();
    }

    function showToast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () {
            t.classList.remove('show');
        }, 3000);
    }

    function renderSlotPanel() {
        const dateLabel = document.getElementById('slotDateLabel');
        const subLabel = document.getElementById('slotSubLabel');
        const dateRow = document.getElementById('slotDateRow');
        const slotList = document.getElementById('slotList');
        const confirmBox = document.getElementById('confirmBox');
        const noMsg = document.getElementById('noSlotMsg');

        if (!selectedProg) {
            if (noMsg) noMsg.style.display = 'block';
            if (confirmBox) confirmBox.style.display = 'none';
            if (slotList) slotList.innerHTML = '';
            if (dateRow) dateRow.innerHTML = '';
            return;
        }
        if (noMsg) noMsg.style.display = 'none';

        if (dateLabel) dateLabel.textContent = selectedProg.name;

        // 날짜 버튼 7일
        const today = new Date(2026, 2, 11); // 2026-03-11
        if (dateRow) {
            dateRow.innerHTML = Array.from({length: 7}, (_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() + i);
                const mon = d.getMonth() + 1;
                const day = d.getDate();
                const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
                return `<button class="slot-nav-btn${i === selectedDateOffset ? ' active' : ''}"
                onclick="selectDate(${i})">${mon}/${day}<br><small>${dow}</small></button>`;
            }).join('');
        }

        // 선택 날짜
        const selDate = new Date(today);
        selDate.setDate(today.getDate() + selectedDateOffset);
        const mon = selDate.getMonth() + 1;
        const day = selDate.getDate();
        const dow = WEEKDAYS_KO[selDate.getDay()];
        if (subLabel) subLabel.textContent = mon + '월 ' + day + '일 ' + dow + '요일';

        // 슬롯
        const slots = getSlots(selectedProg, selectedDateOffset);
        if (slotList) {
            slotList.innerHTML = slots.map((s, i) => {
                const isFull = s.used >= s.max;
                const pct = Math.round(s.used / s.max * 100);
                const remain = s.max - s.used;
                let statusCls = 'status-open', statusLabel = '예약 가능';
                if (isFull) {
                    statusCls = 'status-full';
                    statusLabel = '마감';
                } else if (remain <= 2) {
                    statusCls = 'status-few';
                    statusLabel = '마감 임박';
                }
                const isSel = (i === selectedSlotIdx);
                return `<div class="slot-item${isFull ? ' full' : ''}${isSel ? ' selected-slot' : ''}"
                   onclick="selectSlot(${i})">
        <div class="slot-time">${s.time}</div>
        <div class="slot-bar-wrap">
          <div class="slot-bar-bg"><div class="slot-bar" style="width:${pct}%"></div></div>
          <div class="slot-count">${s.used} / ${s.max}명</div>
        </div>
        <span class="slot-status ${statusCls}">${statusLabel}</span>
      </div>`;
            }).join('');
        }

        renderConfirm();
    }

    function getSlots(prog, dateOffset) {
        // 시드 기반 결정적 랜덤
        const seed = (prog.id.charCodeAt(1) * 7 + dateOffset * 13) % 100;
        return SLOT_TIMES.map((t, i) => {
            const used = Math.floor(((seed + i * 17) % 100) / 100 * prog.maxSlots);
            return { time: t, used, max: prog.maxSlots };
        });
    }

    function renderConfirm() {
        const confirmBox = document.getElementById('confirmBox');
        if (!confirmBox) return;
        if (!selectedProg || selectedSlotIdx === null) {
            confirmBox.style.display = 'none';
            return;
        }
        confirmBox.style.display = 'block';

        const slots = getSlots(selectedProg, selectedDateOffset);
        const slot  = slots[selectedSlotIdx];
        const today = new Date(2026, 2, 11);
        const selDate = new Date(today);
        selDate.setDate(today.getDate() + selectedDateOffset);

        const mon = selDate.getMonth() + 1;
        const day = selDate.getDate();

        document.getElementById('confirmProg').textContent   = selectedProg.name;
        document.getElementById('confirmDate').textContent   = mon + '월 ' + day + '일';
        document.getElementById('confirmTime').textContent   = slot.time;
        document.getElementById('confirmRemain').textContent = (slot.max - slot.used) + '석';
    }

    function selectSlot(idx) {
        const slots = getSlots(selectedProg, selectedDateOffset);
        if (!slots[idx] || slots[idx].used >= slots[idx].max) return;
        selectedSlotIdx = idx;
        renderSlotPanel();
    }
}
