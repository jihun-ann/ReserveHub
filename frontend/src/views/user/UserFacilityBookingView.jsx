import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listFacilities, bookFacility, listMyFacilityBookings, cancelFacilityBooking, reportFacilityIssue
} from "../../api/common.js";

function todayStr() {
	return new Date().toISOString().slice(0, 10);
}

const EMPTY_BOOKING_FORM = { facilityId: "", bookingDate: todayStr(), startTime: "10:00", endTime: "11:00", purpose: "" };

export default function UserFacilityBookingView({ platformId }) {
	const [facilities, setFacilities] = useState([]);
	const [myBookings, setMyBookings] = useState([]);
	const [loading, setLoading] = useState(true);

	const [bookingForm, setBookingForm] = useState(EMPTY_BOOKING_FORM);
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

	function openBookingModal() {
		setBookingForm({ ...EMPTY_BOOKING_FORM, facilityId: facilities[0]?.id || "" });
		setBookingError("");
		openModal("facilityBookingModal");
	}

	async function submitBooking() {
		if (!bookingForm.facilityId) return;
		setSaving(true);
		setBookingError("");
		try {
			await bookFacility(bookingForm.facilityId, {
				bookingDate: bookingForm.bookingDate,
				startTime: bookingForm.startTime,
				endTime: bookingForm.endTime,
				purpose: bookingForm.purpose.trim() || null
			});
			closeModal("facilityBookingModal");
			await refresh();
		} catch (err) {
			setBookingError(err.message || "예약에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	async function cancel(id) {
		await cancelFacilityBooking(id);
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

	return (
		<>
		<div className="page" id="user-facility">
			<div className="page-header">
				<div className="page-label">Facilities</div>
				<div className="page-title">시설물 예약</div>
				<div className="page-subtitle">연습실 등 시설물을 시간대별로 예약하세요. 고장/이상이 있으면 신고할 수 있습니다.</div>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
				<button className="btn btn-primary btn-sm" onClick={openBookingModal} disabled={facilities.length === 0}>+ 예약하기</button>
			</div>

			<div className="card-title" style={{ marginBottom: "10px" }}>시설물 목록</div>
			{loading ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
			) : facilities.length === 0 ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)", marginBottom: "20px" }}>등록된 시설물이 없습니다</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
					{facilities.map((f) => (
						<div className="card" key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<div>
								<div style={{ fontWeight: 600 }}>{f.name}</div>
								{f.description && <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "2px" }}>{f.description}</div>}
							</div>
							<button className="btn btn-ghost btn-sm" onClick={() => openIssueModal(f.id)}>고장/이상 신고</button>
						</div>
					))}
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

		<div className="modal-overlay" id="facilityBookingModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">시설물 예약</div>
					<button className="modal-close" onClick={() => closeModal("facilityBookingModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>시설물</label>
						<select value={bookingForm.facilityId} onChange={(e) => setBookingForm({ ...bookingForm, facilityId: e.target.value })}>
							{facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
						</select>
					</div>
					<div className="form-field">
						<label>날짜</label>
						<input type="date" value={bookingForm.bookingDate} onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })} />
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
						<div className="form-field">
							<label>시작 시간</label>
							<input type="time" value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })} />
						</div>
						<div className="form-field">
							<label>종료 시간</label>
							<input type="time" value={bookingForm.endTime} onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })} />
						</div>
					</div>
					<div className="form-field">
						<label>목적 (선택)</label>
						<input type="text" value={bookingForm.purpose} onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })} placeholder="예: 개인 연습" />
					</div>
					{bookingError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{bookingError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("facilityBookingModal")}>취소</button>
						<button className="btn btn-primary" onClick={submitBooking} disabled={saving}>{saving ? "예약 중..." : "예약"}</button>
					</div>
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
