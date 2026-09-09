import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { listFacilities, reportFacilityIssue } from "../../api/common.js";

export default function TutorFacilityReportView({ platformId }) {
	const [facilities, setFacilities] = useState([]);
	const [loading, setLoading] = useState(true);

	const [issueFacilityId, setIssueFacilityId] = useState(null);
	const [issueDescription, setIssueDescription] = useState("");
	const [issueError, setIssueError] = useState("");
	const [issueSaving, setIssueSaving] = useState(false);
	const [issueSent, setIssueSent] = useState(false);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setFacilities([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setFacilities(await listFacilities(platformId));
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function openIssueModal(facilityId) {
		setIssueFacilityId(facilityId);
		setIssueDescription("");
		setIssueError("");
		setIssueSent(false);
		openModal("tutorFacilityIssueModal");
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

	return (
		<>
		<div className="page" id="tutor-facility-report">
			<div className="page-header">
				<div className="page-label">Facilities</div>
				<div className="page-title">시설물 고장 신고</div>
				<div className="page-subtitle">시설물에 문제가 있으면 신고하세요. 관리자/오너가 확인 후 처리합니다.</div>
			</div>

			{loading ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
			) : facilities.length === 0 ? (
				<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>등록된 시설물이 없습니다</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
		</div>

		<div className="modal-overlay" id="tutorFacilityIssueModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">고장/이상 신고 — {facilitiesById[issueFacilityId]?.name}</div>
					<button className="modal-close" onClick={() => closeModal("tutorFacilityIssueModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{issueSent ? (
						<div style={{ color: "var(--green)", fontSize: "13px" }}>신고가 접수되었습니다. 관리자가 확인 후 처리합니다.</div>
					) : (
						<>
							<div className="form-field">
								<label>어떤 문제인가요?</label>
								<textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} placeholder="예: 거울이 깨졌습니다" />
							</div>
							{issueError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{issueError}</div>}
						</>
					)}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("tutorFacilityIssueModal")}>{issueSent ? "닫기" : "취소"}</button>
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
