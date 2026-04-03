import { useEffect } from "react";

export default function SubsupCalendarView() {
	let calYear = 2026,
		calMonth = 3,
		calSelDay = 11;
	const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

	const CAL_EVENTS = {
		"2026-3": {
			3: [{ color: "#7c6af7", label: "그룹반 A" }],
			5: [
				{ color: "#7c6af7", label: "그룹반 A" },
				{ color: "#4fd1c5", label: "1:1 레슨" }
			],
			7: [{ color: "#4fd1c5", label: "홍길동 1:1" }],
			10: [
				{ color: "#7c6af7", label: "그룹반 A" },
				{ color: "#7c6af7", label: "그룹반 B" }
			],
			11: [
				{ color: "#7c6af7", label: "그룹반 A" },
				{ color: "#4fd1c5", label: "1:1 레슨" },
				{ color: "#f6ad55", label: "플랫폼 공지" }
			],
			14: [{ color: "#7c6af7", label: "그룹반 A" }],
			17: [
				{ color: "#7c6af7", label: "그룹반 A" },
				{ color: "#7c6af7", label: "그룹반 B" }
			],
			19: [{ color: "#4fd1c5", label: "박서준 1:1" }],
			20: [{ color: "#f87171", label: "본사 공지" }],
			21: [{ color: "#7c6af7", label: "그룹반 A" }],
			24: [
				{ color: "#7c6af7", label: "그룹반 A" },
				{ color: "#4fd1c5", label: "1:1 레슨" }
			],
			26: [{ color: "#7c6af7", label: "그룹반 A" }],
			28: [{ color: "#4fd1c5", label: "홍길동 1:1" }]
		}
	};

	const CAL_DETAIL = {
		"2026-3": {
			11: [
				{ time: "09:00", label: "그룹반 A", color: "#7c6af7", inst: "이수진" },
				{ time: "10:00", label: "홍길동 1:1", color: "#4fd1c5", inst: "이수진" },
				{ time: "14:00", label: "플랫폼 공지", color: "#f6ad55", inst: "—" },
				{ time: "16:00", label: "김민지 1:1", color: "#4fd1c5", inst: "이수진" }
			]
		}
	};

	useEffect(() => {
		renderCal();
	});

	return (
		<div className="page" id="super-calendar">
			{/* ══════════════ 캘린더 ══════════════ */}
			<div className="page-header">
				<div className="page-label">CALENDAR</div>
				<div className="page-title">캘린더</div>
				<div className="page-subtitle">플랫폼 전체 일정을 한눈에 확인하세요</div>
			</div>

			{/* 범례 */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "14px",
					flexWrap: "wrap",
					padding: "10px 16px",
					background: "var(--surface)",
					border: "1px solid var(--border)",
					borderRadius: "10px",
					marginBottom: "20px"
				}}
			>
				<span
					style={{
						fontSize: "10px",
						color: "var(--text-dim)",
						letterSpacing: "1px",
						textTransform: "uppercase"
					}}
				>
					범례
				</span>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "5px",
						fontSize: "11px",
						fontWeight: "600",
						color: "#7c6af7"
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "10px",
							height: "4px",
							background: "#7c6af7",
							borderRadius: "2px"
						}}
					></span>
					그룹 레슨
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "5px",
						fontSize: "11px",
						fontWeight: "600",
						color: "#4fd1c5"
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "10px",
							height: "4px",
							background: "#4fd1c5",
							borderRadius: "2px"
						}}
					></span>
					개인 레슨
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "5px",
						fontSize: "11px",
						fontWeight: "600",
						color: "#f6ad55"
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "10px",
							height: "4px",
							background: "#f6ad55",
							borderRadius: "2px"
						}}
					></span>
					플랫폼 공지/휴무
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "5px",
						fontSize: "11px",
						fontWeight: "600",
						color: "#f87171"
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: "10px",
							height: "4px",
							background: "#f87171",
							borderRadius: "2px"
						}}
					></span>
					본사 공지
				</div>
				<button
					className="btn btn-primary btn-sm"
					style={{ marginLeft: "auto", background: "var(--accent)", color: "#0f0f13" }}
					onClick={openShareEventModal}
				>
					+ 공유 이벤트 등록
				</button>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 320px",
					gap: "20px",
					alignItems: "start"
				}}
			>
				{/* 달력 */}
				<div className="card">
					<div className="cal-nav-row">
						<span className="cal-month-lbl" id="calLbl">
							2026년 3월
						</span>
						<div className="cal-nav-btns">
							<button className="cal-nav-btn" onClick={() => calNav(-1)}>
								‹
							</button>
							<button className="cal-nav-btn" onClick={() => calNav(1)}>
								›
							</button>
						</div>
					</div>
					<div className="cal-dow">
						<div className="cal-dow-lbl" style={{ color: "#f87171" }}>
							일
						</div>
						<div className="cal-dow-lbl">월</div>
						<div className="cal-dow-lbl">화</div>
						<div className="cal-dow-lbl">수</div>
						<div className="cal-dow-lbl">목</div>
						<div className="cal-dow-lbl">금</div>
						<div className="cal-dow-lbl" style={{ color: "#60a5fa" }}>
							토
						</div>
					</div>
					<div className="cal-grid-7" id="calDays"></div>
				</div>

				{/* 일별 상세 */}
				<div>
					<div className="card">
						<div className="card-title" id="calDetailTitle">
							3월 11일 화요일 — 오늘
						</div>
						<div id="calDetailBody">
							<div
								style={{
									fontSize: "13px",
									color: "var(--text-dim)",
									textAlign: "center",
									padding: "24px 0"
								}}
							>
								날짜를 선택하세요
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	function openModal(id) {
		document.getElementById(id).classList.add("open");
	}

	function closeModal(id) {
		document.getElementById(id).classList.remove("open");
	}

	function openShareEventModal() {
		openModal("shareEventModal");
	}

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
		calSelDay = 1;
		renderCal();
	}

	function renderCal() {
		const lbl = document.getElementById("calLbl");
		if (lbl) lbl.textContent = calYear + "년 " + calMonth + "월";
		const container = document.getElementById("calDays");
		if (!container) return;
		container.innerHTML = "";
		const today = new Date();
		const isCur = today.getFullYear() === calYear && today.getMonth() + 1 === calMonth;
		const todayDay = isCur ? today.getDate() : -1;
		const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
		const daysInMon = new Date(calYear, calMonth, 0).getDate();
		const daysInPrev = new Date(calYear, calMonth - 1, 0).getDate();
		const evData = CAL_EVENTS[calYear + "-" + calMonth] || {};

		for (let i = 0; i < firstDow; i++) {
			const c = document.createElement("div");
			c.className = "cal-cell dim";
			c.textContent = daysInPrev - firstDow + 1 + i;
			container.appendChild(c);
		}
		for (let d = 1; d <= daysInMon; d++) {
			const cell = document.createElement("div");
			let cls = "cal-cell";
			if (d === calSelDay) cls += " selected";
			else if (d === todayDay) cls += " today";
			cell.className = cls;
			const numEl = document.createElement("div");
			numEl.style.cssText = "font-size:11px;font-weight:500;line-height:1";
			numEl.textContent = d;
			cell.appendChild(numEl);
			const evs = evData[d] || [];
			if (evs.length > 0) {
				const seen = new Set();
				evs.forEach((e) => {
					if (!seen.has(e.color)) {
						seen.add(e.color);
						const bar = document.createElement("div");
						bar.className = "event-bar";
						bar.style.background = e.color;
						cell.appendChild(bar);
					}
				});
			}
			const _d = d;
			cell.addEventListener("click", () => {
				calSelDay = _d;
				renderCal();
				renderCalDetail(_d);
			});
			container.appendChild(cell);
		}
		const total = firstDow + daysInMon;
		const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
		for (let i = 1; i <= remain; i++) {
			const c = document.createElement("div");
			c.className = "cal-cell dim";
			c.textContent = i;
			container.appendChild(c);
		}
		renderCalDetail(calSelDay);
	}

	function renderCalDetail(day) {
		const title = document.getElementById("calDetailTitle");
		const body = document.getElementById("calDetailBody");
		if (!title || !body) return;
		const dow = new Date(calYear, calMonth - 1, day).getDay();
		const today = new Date();
		const isToday =
			today.getFullYear() === calYear &&
			today.getMonth() + 1 === calMonth &&
			today.getDate() === day;
		title.textContent =
			calMonth + "월 " + day + "일 " + WEEKDAYS[dow] + "요일" + (isToday ? " — 오늘" : "");
		const evs =
			(CAL_DETAIL[calYear + "-" + calMonth] || {})[day] ||
			(CAL_EVENTS[calYear + "-" + calMonth] || {})[day] ||
			[];
		if (evs.length === 0) {
			body.innerHTML =
				'<div style="font-size:13px;color:var(--text-dim);text-align:center;padding:24px 0">이 날의 일정이 없습니다</div>';
			return;
		}
		body.innerHTML = evs
			.map((e) => {
				const timeStr = e.time || "";
				const instStr = e.inst ? ` · ${e.inst} 트레이너` : "";
				return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:3px;height:36px;border-radius:2px;background:${e.color};flex-shrink:0"></div>
      ${timeStr ? `<div style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-sub);min-width:40px">${timeStr}</div>` : ""}
      <div style="flex:1"><div style="font-size:13px;font-weight:600">${e.label}</div><div style="font-size:11px;color:var(--text-dim);margin-top:2px">${instStr}</div></div>
    </div>`;
			})
			.join("");
	}
}
