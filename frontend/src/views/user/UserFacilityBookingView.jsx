import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listFacilities, bookFacility, listMyFacilityBookings, cancelFacilityBooking, reportFacilityIssue,
	listFacilityBookingSlots
} from "../../api/common.js";

const UNSPECIFIED_FLOOR = "미지정";
const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "22:00";
const SLOT_MINUTES = 60;
const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n) {
	return String(n).padStart(2, "0");
}

function isoDate(d) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr() {
	return isoDate(new Date());
}

// 오늘부터 7일 — 수업 예약 화면의 날짜 네비게이션과 동일한 방식.
function next7Days() {
	const today = new Date();
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(today);
		d.setDate(today.getDate() + i);
		return { iso: isoDate(d), mon: d.getMonth() + 1, day: d.getDate(), dow: WEEKDAYS_KO[d.getDay()] };
	});
}

function toMinutes(hhmm) {
	const [h, m] = hhmm.split(":").map(Number);
	return h * 60 + m;
}

function toHHMM(mins) {
	return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

// 시설물의 이용 시작~종료 시간을 1시간 단위로 쪼갠 예약 가능 시간대 목록 (마지막 칸은 종료 시간에 맞춰 짧아질 수 있음).
function generateSlots(openTime, closeTime) {
	const open = toMinutes(openTime ? openTime.slice(0, 5) : DEFAULT_OPEN);
	const close = toMinutes(closeTime ? closeTime.slice(0, 5) : DEFAULT_CLOSE);
	const slots = [];
	for (let t = open; t < close; t += SLOT_MINUTES) {
		slots.push({ start: toHHMM(t), end: toHHMM(Math.min(t + SLOT_MINUTES, close)) });
	}
	return slots;
}

// 이 시간대와 겹치는 확정 예약 건수 — 정원(capacity)만큼 겹쳐도 되므로 불리언이 아니라 카운트.
function slotUsedCount(slot, bookingSlots) {
	return bookingSlots.filter((b) => {
		const bStart = b.startTime?.slice(0, 5);
		const bEnd = b.endTime?.slice(0, 5);
		return slot.start < bEnd && slot.end > bStart;
	}).length;
}

export default function UserFacilityBookingView({ platformId }) {
	const [facilities, setFacilities] = useState([]);
	const [myBookings, setMyBookings] = useState([]);
	const [loading, setLoading] = useState(true);

	const [selectedFloor, setSelectedFloor] = useState(null);
	const [selectedFacilityId, setSelectedFacilityId] = useState(null);
	const [statusDate, setStatusDate] = useState(todayStr());
	const [bookingSlots, setBookingSlots] = useState([]);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState(null);
	const [purpose, setPurpose] = useState("");
	const [bookingError, setBookingError] = useState("");
	const [saving, setSaving] = useState(false);

	const [issueFacilityId, setIssueFacilityId] = useState(null);
	const [issueDescription, setIssueDescription] = useState("");
	const [issueError, setIssueError] = useState("");
	const [issueSaving, setIssueSaving] = useState(false);
	const [issueSent, setIssueSent] = useState(false);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setFacilities([]);
			setMyBookings([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [facilityList, bookingList] = await Promise.all([
			listFacilities(platformId),
			listMyFacilityBookings()
		]);
		setFacilities(facilityList);
		setMyBookings(bookingList.filter((b) => b.platformId === platformId && b.status === "CONFIRMED"));
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	useEffect(() => {
		setSelectedSlot(null);
		setBookingError("");
		if (!selectedFacilityId) {
			setBookingSlots([]);
			return;
		}
		setSlotsLoading(true);
		listFacilityBookingSlots(selectedFacilityId, statusDate)
			.then(setBookingSlots)
			.catch(() => setBookingSlots([]))
			.finally(() => setSlotsLoading(false));
	}, [selectedFacilityId, statusDate]);

	function selectFacility(facilityId) {
		setSelectedFacilityId(facilityId);
		setStatusDate(todayStr());
		setPurpose("");
	}

	async function confirmBooking() {
		if (!selectedFacilityId || !selectedSlot) return;
		setSaving(true);
		setBookingError("");
		try {
			await bookFacility(selectedFacilityId, {
				bookingDate: statusDate,
				startTime: selectedSlot.start,
				endTime: selectedSlot.end,
				purpose: purpose.trim() || null
			});
			setSelectedSlot(null);
			setPurpose("");
			listFacilityBookingSlots(selectedFacilityId, statusDate).then(setBookingSlots).catch(() => {});
			await refresh();
		} catch (err) {
			setBookingError(err.message || "예약에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	async function cancel(id) {
		await cancelFacilityBooking(id);
		if (selectedFacilityId) listFacilityBookingSlots(selectedFacilityId, statusDate).then(setBookingSlots).catch(() => {});
		await refresh();
	}

	function openIssueModal(facilityId) {
		setIssueFacilityId(facilityId);
		setIssueDescription("");
		setIssueError("");
		setIssueSent(false);
		openModal("facilityIssueModal");
	}

	async function submitIssue() {
		if (!issueDescription.trim()) return;
		setIssueSaving(true);
		setIssueError("");
		try {
			await reportFacilityIssue(issueFacilityId, issueDescription.trim());
			setIssueSent(true);
		} catch (err) {
			setIssueError(err.message || "신고에 실패했습니다.");
		} finally {
			setIssueSaving(false);
		}
	}

	const facilitiesById = Object.fromEntries(facilities.map((f) => [f.id, f]));
	const sortedMyBookings = [...myBookings].sort((a, b) => (a.bookingDate + a.startTime).localeCompare(b.bookingDate + b.startTime));

	const floors = [...new Set(facilities.map((f) => f.floor || UNSPECIFIED_FLOOR))];
	const activeFloor = selectedFloor && floors.includes(selectedFloor) ? selectedFloor : floors[0];
	const onFloor = facilities.filter((f) => (f.floor || UNSPECIFIED_FLOOR) === activeFloor);
	const placed = onFloor.filter((f) => f.posX != null && f.posY != null);
	const unplaced = onFloor.filter((f) => f.posX == null || f.posY == null);
	const selectedFacility = facilitiesById[selectedFacilityId];

	const dateOptions = next7Days();
	const selectedDay = dateOptions.find((d) => d.iso === statusDate);
	const capacity = selectedFacility?.capacity || 1;
	const slotsWithStatus = (selectedFacility ? generateSlots(selectedFacility.openTime, selectedFacility.closeTime) : []).map((slot) => {
		const used = slotUsedCount(slot, bookingSlots);
		const remain = capacity - used;
		const isFull = remain <= 0;
		let statusCls = "status-open", statusLabel = "예약 가능";
		if (isFull) {
			statusCls = "status-full";
			statusLabel = "마감";
		} else if (remain <= 2 && capacity > 1) {
			statusCls = "status-few";
			statusLabel = "마감 임박";
		}
		return { ...slot, used, remain, isFull, statusCls, statusLabel };
	});
	const selectedSlotStatus = selectedSlot ? slotsWithStatus.find((s) => s.start === selectedSlot.start) : null;

	return (
		<>
		<div className="page" id="user-facility">
			<div className="page-header">
				<div className="page-label">Facilities</div>
				<div className="page-title">시설물 예약</div>
				<div className="page-subtitle">배치도에서 연습실/레슨실/PT실 등 시설물을 눌러 예약 가능한 시간대를 확인하고 예약하세요.</div>
			</div>

			{loading ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)", marginBottom: "20px" }}>불러오는 중...</div>
			) : facilities.length === 0 ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)", marginBottom: "20px" }}>등록된 시설물이 없습니다</div>
			) : (
				<div style={{ marginBottom: "24px" }}>
					<div className="card-title" style={{ marginBottom: "10px" }}>배치도</div>
					{floors.length > 0 && (
						<div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
							{floors.map((fl) => (
								<button
									key={fl}
									className={`filter-chip ${fl === activeFloor ? "active" : ""}`}
									onClick={() => setSelectedFloor(fl)}
								>
									{fl}
								</button>
							))}
						</div>
					)}
					{unplaced.length > 0 && (
						<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
							{unplaced.map((f) => (
								<div
									key={f.id}
									onClick={() => selectFacility(f.id)}
									className="plat-chip"
									style={{
										cursor: "pointer",
										background: f.id === selectedFacilityId ? "var(--accent2)" : "var(--surface2)",
										color: f.id === selectedFacilityId ? "#0f0f13" : "var(--text-sub)",
										borderColor: "var(--border)"
									}}
								>
									{f.name}
								</div>
							))}
						</div>
					)}
					<div
						style={{
							position: "relative",
							width: "100%",
							height: "360px",
							background: "var(--surface2)",
							border: "1px dashed var(--border)",
							borderRadius: "var(--radius)"
						}}
					>
						{placed.length === 0 && unplaced.length === 0 && (
							<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "12px" }}>
								이 층에 배치된 시설물이 없습니다
							</div>
						)}
						{placed.map((f) => (
							<div
								key={f.id}
								onClick={() => selectFacility(f.id)}
								style={{
									position: "absolute",
									left: `${f.posX}%`,
									top: `${f.posY}%`,
									transform: "translate(-50%, -50%)",
									cursor: "pointer",
									padding: "8px 12px",
									background: f.id === selectedFacilityId ? "var(--accent2)" : "var(--surface)",
									color: f.id === selectedFacilityId ? "#0f0f13" : "var(--text)",
									border: `1px solid ${f.id === selectedFacilityId ? "var(--accent2)" : "var(--border)"}`,
									borderRadius: "var(--radius-sm)",
									fontSize: "12px",
									fontWeight: 600,
									whiteSpace: "nowrap"
								}}
							>
								{f.name}
							</div>
						))}
					</div>

					{selectedFacility && (
						<div className="card" style={{ marginTop: "14px" }}>
							<div className="slot-panel-header">
								<div>
									<div className="slot-panel-date">{selectedFacility.name}</div>
									<div className="slot-panel-sub">
										{selectedDay ? `${selectedDay.mon}월 ${selectedDay.day}일 ${selectedDay.dow}요일` : ""} · 정원 {capacity}명
										{selectedFacility.description ? ` · ${selectedFacility.description}` : ""}
									</div>
								</div>
								<button className="btn btn-ghost btn-sm" onClick={() => openIssueModal(selectedFacility.id)}>고장/이상 신고</button>
							</div>

							<div className="slot-nav-row">
								{dateOptions.map((d) => (
									<button
										key={d.iso}
										className={`slot-nav-btn${d.iso === statusDate ? " active" : ""}`}
										onClick={() => setStatusDate(d.iso)}
									>
										{d.mon}/{d.day}<br /><small>{d.dow}</small>
									</button>
								))}
							</div>

							{slotsLoading ? (
								<div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "16px 0" }}>불러오는 중...</div>
							) : (
								<div className="slot-list">
									{slotsWithStatus.map((slot) => (
										<div
											key={slot.start}
											className={`slot-item${slot.isFull ? " full" : ""}${selectedSlot?.start === slot.start ? " selected-slot" : ""}`}
											onClick={() => !slot.isFull && setSelectedSlot(slot)}
										>
											<div className="slot-time">{slot.start}-{slot.end}</div>
											<div className="slot-bar-wrap">
												<div className="slot-bar-bg"><div className="slot-bar" style={{ width: `${Math.round((slot.used / capacity) * 100)}%` }}></div></div>
												<div className="slot-count">{slot.used} / {capacity}명</div>
											</div>
											<span className={`slot-status ${slot.statusCls}`}>{slot.statusLabel}</span>
										</div>
									))}
								</div>
							)}

							{selectedSlotStatus && (
								<div className="confirm-box">
									<div className="confirm-row"><span>시설물</span><strong>{selectedFacility.name}</strong></div>
									<div className="confirm-row"><span>날짜</span><strong>{selectedDay ? `${selectedDay.mon}월 ${selectedDay.day}일` : statusDate}</strong></div>
									<div className="confirm-row"><span>시간</span><strong>{selectedSlotStatus.start}-{selectedSlotStatus.end}</strong></div>
									<div className="confirm-row"><span>잔여 정원</span><strong style={{ color: "var(--accent2)" }}>{selectedSlotStatus.remain}명</strong></div>
									<div className="form-field" style={{ marginBottom: "12px" }}>
										<label>목적 (선택)</label>
										<input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="예: 개인 연습" />
									</div>
									{bookingError && <div style={{ color: "var(--red)", fontSize: "12px", marginBottom: "8px" }}>{bookingError}</div>}
									<button className="btn-confirm" onClick={confirmBooking} disabled={saving}>{saving ? "예약 중..." : "예약 하기"}</button>
								</div>
							)}
						</div>
					)}
				</div>
			)}

			<div className="card-title" style={{ marginBottom: "10px" }}>내 예약</div>
			<div className="card" style={{ padding: "0", overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr><th>시설물</th><th>날짜</th><th>시간</th><th>목적</th><th></th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : sortedMyBookings.length === 0 ? (
								<tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>예약 내역이 없습니다</td></tr>
							) : (
								sortedMyBookings.map((b) => (
									<tr key={b.id}>
										<td style={{ fontWeight: 600 }}>{facilitiesById[b.facilityId]?.name || "-"}</td>
										<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{b.bookingDate}</td>
										<td style={{ fontFamily: "'DM Mono',monospace" }}>{b.startTime?.slice(0, 5)}-{b.endTime?.slice(0, 5)}</td>
										<td style={{ color: "var(--text-sub)" }}>{b.purpose || "-"}</td>
										<td><button className="btn btn-ghost btn-sm" onClick={() => cancel(b.id)}>예약 취소</button></td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="facilityIssueModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">고장/이상 신고 — {facilitiesById[issueFacilityId]?.name}</div>
					<button className="modal-close" onClick={() => closeModal("facilityIssueModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{issueSent ? (
						<div style={{ color: "var(--green)", fontSize: "13px" }}>신고가 접수되었습니다. 관리자가 확인 후 처리합니다.</div>
					) : (
						<>
							<div className="form-field">
								<label>어떤 문제인가요?</label>
								<textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="예: 스피커에서 소리가 나지 않습니다" />
							</div>
							{issueError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{issueError}</div>}
						</>
					)}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("facilityIssueModal")}>{issueSent ? "닫기" : "취소"}</button>
						{!issueSent && (
							<button className="btn btn-primary" onClick={submitIssue} disabled={issueSaving}>{issueSaving ? "신고 중..." : "신고하기"}</button>
						)}
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
