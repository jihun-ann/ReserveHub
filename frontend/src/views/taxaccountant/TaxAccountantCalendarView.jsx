import { useState, useEffect, useCallback } from "react";
import {
	createFinancialRequest,
	listFinancialRequests,
	FINANCIAL_REQUEST_TYPE_LABEL
} from "../../api/common.js";

const STATUS_LABEL = {
	PENDING: { lbl: "대기 중", color: "var(--accent3)" },
	APPROVED: { lbl: "승인됨", color: "var(--green)" },
	REJECTED: { lbl: "반려됨", color: "var(--red)" }
};

const TYPE_OPTIONS = Object.entries(FINANCIAL_REQUEST_TYPE_LABEL);

function todayStr() {
	return new Date().toISOString().slice(0, 10);
}

export default function TaxAccountantCalendarView({ platformId, platformName }) {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState({ type: "PAYDAY", title: "", eventDate: todayStr(), memo: "" });

	const refresh = useCallback(async () => {
		if (!platformId) {
			setRequests([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setRequests(await listFinancialRequests(platformId));
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function handleSubmit(e) {
		e.preventDefault();
		if (!form.title.trim() || !form.eventDate) return;
		setSubmitting(true);
		try {
			await createFinancialRequest(platformId, form);
			setForm({ type: form.type, title: "", eventDate: todayStr(), memo: "" });
			await refresh();
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="page" id="taxacct-calendar">
			<div className="page-header">
				<div className="page-label">Tax Accountant / Calendar</div>
				<div className="page-title">재무 일정</div>
				<div className="page-subtitle">
					{platformName ? `${platformName}의 ` : ""}월급날·지출일·명세서 제출일을 등록하면 매니저에게 승인 요청이 갑니다
				</div>
			</div>

			<div className="card" style={{ marginBottom: "20px" }}>
				<div className="card-title">재무 일정 등록</div>
				<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
						<div className="form-field">
							<label>구분</label>
							<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
								{TYPE_OPTIONS.map(([value, label]) => (
									<option key={value} value={value}>{label}</option>
								))}
							</select>
						</div>
						<div className="form-field">
							<label>해당 일자</label>
							<input
								type="date"
								value={form.eventDate}
								onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
							/>
						</div>
					</div>
					<div className="form-field">
						<label>제목</label>
						<input
							type="text"
							placeholder="예: 8월 급여 지급일"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
						/>
					</div>
					<div className="form-field">
						<label>메모</label>
						<input
							type="text"
							placeholder="매니저에게 전달할 메모 (선택)"
							value={form.memo}
							onChange={(e) => setForm({ ...form, memo: e.target.value })}
						/>
					</div>
					<div>
						<button type="submit" className="btn btn-primary" disabled={submitting || !platformId}>
							요청 등록
						</button>
					</div>
				</form>
			</div>

			<div className="card-title" style={{ marginBottom: "10px" }}>등록한 요청</div>
			{loading ? (
				<div style={{ padding: "40px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
			) : requests.length === 0 ? (
				<div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-dim)" }}>
					등록된 재무 일정이 없습니다
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{requests.map((r) => {
						const st = STATUS_LABEL[r.status];
						return (
							<div key={r.id} className="card" style={{ borderLeft: `3px solid ${st.color}` }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
									<div>
										<div style={{ fontSize: "10px", color: "var(--taxacct)", letterSpacing: "1px", fontWeight: 600 }}>
											{FINANCIAL_REQUEST_TYPE_LABEL[r.type] || r.type}
										</div>
										<div style={{ fontSize: "15px", fontWeight: 700, marginTop: "2px" }}>{r.title}</div>
									</div>
									<span className="badge" style={{ color: st.color, whiteSpace: "nowrap" }}>{st.lbl}</span>
								</div>
								<div style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-sub)" }}>
									해당 일자: <span style={{ fontFamily: "'DM Mono',monospace" }}>{r.eventDate}</span>
								</div>
								{r.memo && (
									<div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-dim)" }}>메모: {r.memo}</div>
								)}
								{r.status !== "PENDING" && r.decisionMemo && (
									<div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-sub)" }}>
										<span style={{ fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
											{r.status === "REJECTED" ? "반려 사유" : "승인 메모"}
										</span>
										<div style={{ marginTop: "4px" }}>{r.decisionMemo}</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
