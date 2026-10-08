import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listFacilities, listFacilityBookingsForPlatform, cancelFacilityBooking,
	listFacilityIssues, reportFacilityIssue, markFacilityIssueInProgress, resolveFacilityIssue,
	getUser, FACILITY_ISSUE_STATUS_LABEL, getMyPermissions
} from "../../api/common.js";

const ISSUE_STATUS_CLS = { OPEN: "bs-pending", IN_PROGRESS: "bs-soon", RESOLVED: "bs-active" };

function todayStr() {
	return new Date().toISOString().slice(0, 10);
}

export default function ManagerFacilityView({ platformId }) {
	const [date, setDate] = useState(todayStr());
	const [facilities, setFacilities] = useState([]);
	const [bookings, setBookings] = useState([]);
	const [issues, setIssues] = useState([]);
	const [usersById, setUsersById] = useState({});
	const [loading, setLoading] = useState(true);
	// 시설 예약 취소(타인)/이슈 처리는 M등급 이상 매니저만 — 백엔드 FacilityService가 실제로 검증하고,
	// 여기선 등급 미달 매니저에게 눌러도 막힐 버튼을 아예 안 보여주기 위한 용도.
	const [permissions, setPermissions] = useState([]);
	const canManageFacility = permissions.includes("FACILITY_MANAGE");

	const [issueFacilityId, setIssueFacilityId] = useState(null);
	const [issueDescription, setIssueDescription] = useState("");
	const [issueError, setIssueError] = useState("");
	const [issueSaving, setIssueSaving] = useState(false);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setFacilities([]);
			setBookings([]);
			setIssues([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [facilityList, bookingList, issueList, perms] = await Promise.all([
			listFacilities(platformId),
			listFacilityBookingsForPlatform(platformId, date),
			listFacilityIssues(platformId),
			getMyPermissions(platformId).catch(() => [])
		]);
		setFacilities(facilityList);
		setBookings(bookingList.filter((b) => b.status === "CONFIRMED"));
		setIssues(issueList);
		setPermissions(perms);

		const userIds = [...new Set([...bookingList.map((b) => b.userId), ...issueList.map((i) => i.reportedBy)])];
		const users = await Promise.all(userIds.map((id) => getUser(id).catch(() => null)));
		setUsersById(Object.fromEntries(userIds.map((id, i) => [id, users[i]])));

		setLoading(false);
	}, [platformId, date]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function cancel(id) {
		await cancelFacilityBooking(id);
		await refresh();
	}

	async function setInProgress(id) {
		await markFacilityIssueInProgress(id);
		await refresh();
	}

	async function resolve(id) {
		await resolveFacilityIssue(id);
		await refresh();
	}

	function openIssueModal() {
		setIssueFacilityId(facilities[0]?.id || "");
		setIssueDescription("");
		setIssueError("");
		openModal("managerFacilityIssueModal");
	}

	async function submitIssue() {
		if (!issueFacilityId || !issueDescription.trim()) return;
		setIssueSaving(true);
		setIssueError("");
		try {
			await reportFacilityIssue(issueFacilityId, issueDescription.trim());
			closeModal("managerFacilityIssueModal");
			await refresh();
		} catch (err) {
			setIssueError(err.message || "신고에 실패했습니다.");
		} finally {
			setIssueSaving(false);
		}
	}

	const facilitiesById = Object.fromEntries(facilities.map((f) => [f.id, f]));
	const sortedBookings = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));

	return (
		<>
		<div className="page" id="manager-facility">
			<div className="page-header">
				<div className="page-label">Facilities</div>
				<div className="page-title">시설물 현황</div>
				<div className="page-subtitle">시설물 예약 현황과 고장 신고를 확인하고 처리하세요</div>
			</div>

			<div className="card-title" style={{ marginBottom: "10px" }}>예약 현황</div>
			<div className="form-field" style={{ maxWidth: "220px", marginBottom: "14px" }}>
				<input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
			</div>
			<div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "24px" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr><th>시설물</th><th>시간</th><th>예약자</th><th>목적</th><th></th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : sortedBookings.length === 0 ? (
								<tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>해당 날짜에 예약이 없습니다</td></tr>
							) : (
								sortedBookings.map((b) => {
									const user = usersById[b.userId];
									return (
										<tr key={b.id}>
											<td style={{ fontWeight: 600 }}>{facilitiesById[b.facilityId]?.name || "-"}</td>
											<td style={{ fontFamily: "'DM Mono',monospace" }}>{b.startTime?.slice(0, 5)}-{b.endTime?.slice(0, 5)}</td>
											<td>{user?.name || user?.email || "-"}</td>
											<td style={{ color: "var(--text-sub)" }}>{b.purpose || "-"}</td>
											<td>{canManageFacility && <button className="btn btn-ghost btn-sm" onClick={() => cancel(b.id)}>예약 취소</button>}</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>

			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
				<div className="card-title" style={{ marginBottom: "0" }}>고장/이상 신고</div>
				<button className="btn btn-ghost btn-sm" onClick={openIssueModal} disabled={facilities.length === 0}>+ 고장 신고</button>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
				{loading ? (
					<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
				) : issues.length === 0 ? (
					<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>신고된 문제가 없습니다</div>
				) : (
					issues.map((issue) => {
						const reporter = usersById[issue.reportedBy];
						return (
							<div className="card" key={issue.id}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
									<div>
										<div style={{ fontWeight: 700 }}>{facilitiesById[issue.facilityId]?.name || "-"}</div>
										<div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "4px" }}>
											신고자: {reporter?.name || reporter?.email || "-"} · {new Date(issue.createdAt).toLocaleString()}
										</div>
										<div style={{ marginTop: "8px" }}>{issue.description}</div>
										{issue.resolutionMemo && (
											<div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-dim)" }}>처리 메모: {issue.resolutionMemo}</div>
										)}
									</div>
									<div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
										<span className={`badge ${ISSUE_STATUS_CLS[issue.status]}`} style={{ fontSize: "10px" }}>
											{FACILITY_ISSUE_STATUS_LABEL[issue.status] || issue.status}
										</span>
										{canManageFacility && issue.status === "OPEN" && (
											<button className="btn btn-ghost btn-sm" onClick={() => setInProgress(issue.id)}>보수 중으로 변경</button>
										)}
										{canManageFacility && issue.status !== "RESOLVED" && (
											<button className="btn btn-ghost btn-sm" onClick={() => resolve(issue.id)}>보수 완료 처리</button>
										)}
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>

		<div className="modal-overlay" id="managerFacilityIssueModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">고장/이상 신고</div>
					<button className="modal-close" onClick={() => closeModal("managerFacilityIssueModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>시설물</label>
						<select value={issueFacilityId || ""} onChange={(e) => setIssueFacilityId(e.target.value)}>
							{facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
						</select>
					</div>
					<div className="form-field">
						<label>어떤 문제인가요?</label>
						<textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="예: 에어컨이 작동하지 않습니다" />
					</div>
					{issueError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{issueError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("managerFacilityIssueModal")}>취소</button>
						<button className="btn btn-primary" onClick={submitIssue} disabled={issueSaving}>{issueSaving ? "신고 중..." : "신고하기"}</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
