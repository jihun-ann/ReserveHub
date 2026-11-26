import { useCallback, useEffect, useState } from "react";
import {
	BUSINESS_TYPES, businessTypeLabel, submitPlatformApplication, listMyPlatformApplications,
	cancelPlatformApplication, openPlatformCertificate, APPLICATION_STATUS, formatBusinessNumber
} from "../api/common.js";
import { formatDateTime } from "../utils/formatDateTime.js";

const EMPTY_FORM = { name: "", businessType: "FITNESS", phone: "", address: "", description: "", businessNumber: "" };

const inputStyle = {
	width: "100%", padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)",
	borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box"
};
const labelStyle = { display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-sub)" };
const itemStyle = {
	background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
	padding: "16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap"
};

// 플랫폼 개설 신청 폼 + 내 신청 내역. 사업자등록증을 첨부해 신청하면 운영자가 확인 후 승인하고,
// 승인되면 그 플랫폼의 오너가 된다. onApproved는 승인된 신청이 보이면 호출된다(사이드바 플랫폼 목록 새로고침용).
export default function PlatformApplicationPanel({ onApproved, defaultOpen = false }) {
	const [open, setOpen] = useState(defaultOpen);
	const [form, setForm] = useState(EMPTY_FORM);
	const [file, setFile] = useState(null);
	const [fileKey, setFileKey] = useState(0); // 제출 후 파일 입력칸을 비우기 위해 다시 그린다
	const [mine, setMine] = useState([]);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [busy, setBusy] = useState(false);

	const load = useCallback(() => {
		listMyPlatformApplications().then(setMine).catch(() => setMine([]));
	}, []);
	useEffect(load, [load]);

	const approvedCount = mine.filter((a) => a.status === "APPROVED").length;
	useEffect(() => {
		if (approvedCount > 0) onApproved?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [approvedCount]);

	const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

	async function submit(e) {
		e.preventDefault();
		setError("");
		if (!file) {
			setError("사업자등록증 파일을 첨부해 주세요.");
			return;
		}
		setBusy(true);
		try {
			await submitPlatformApplication(form, file);
			setForm(EMPTY_FORM);
			setFile(null);
			setFileKey((k) => k + 1);
			setOpen(false);
			setNotice("개설 신청을 보냈습니다. 운영자가 사업자등록증을 확인한 뒤 승인하면 플랫폼이 열립니다.");
			load();
		} catch (err) {
			setError(err.message || "신청에 실패했습니다.");
		} finally {
			setBusy(false);
		}
	}

	async function cancel(application) {
		if (!window.confirm(`'${application.name}' 개설 신청을 취소할까요?`)) return;
		try {
			await cancelPlatformApplication(application.id);
			load();
		} catch (err) {
			alert(err.message || "취소에 실패했습니다.");
		}
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
				<div>
					<div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>내 플랫폼 개설</div>
					<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>사업자등록증을 첨부해 신청하면 운영자 확인 후 플랫폼이 열립니다</div>
				</div>
				<button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen((v) => !v)}>
					{open ? "닫기" : "개설 신청"}
				</button>
			</div>

			{notice && <div style={{ color: "var(--green)", fontSize: "13px" }}>{notice}</div>}

			{open && (
				<form onSubmit={submit} className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "12px" }}>
					<label style={labelStyle}>플랫폼명 *
						<input required maxLength={100} value={form.name} onChange={set("name")} style={inputStyle} />
					</label>
					<label style={labelStyle}>업종 *
						<select value={form.businessType} onChange={set("businessType")} style={inputStyle}>
							{BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</label>
					<label style={labelStyle}>사업자등록번호 *
						<input
							required inputMode="numeric" pattern="[0-9]{3}-?[0-9]{2}-?[0-9]{5}" placeholder="123-45-67890"
							value={form.businessNumber} onChange={set("businessNumber")} style={inputStyle}
						/>
					</label>
					<label style={labelStyle}>대표 전화
						<input type="tel" value={form.phone} onChange={set("phone")} style={inputStyle} />
					</label>
					<label style={{ ...labelStyle, gridColumn: "1/-1" }}>주소
						<input value={form.address} onChange={set("address")} style={inputStyle} />
					</label>
					<label style={{ ...labelStyle, gridColumn: "1/-1" }}>소개
						<textarea rows={3} value={form.description} onChange={set("description")} style={{ ...inputStyle, resize: "vertical" }} />
					</label>
					<label style={{ ...labelStyle, gridColumn: "1/-1" }}>사업자등록증 * (PDF, PNG, JPG · 10MB 이하)
						<input
							key={fileKey} type="file" required accept="application/pdf,image/png,image/jpeg"
							onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ fontSize: "13px", color: "var(--text-sub)" }}
						/>
					</label>
					{error && <div style={{ gridColumn: "1/-1", color: "var(--red)", fontSize: "13px" }}>{error}</div>}
					<div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}>
						<button type="submit" className="btn btn-sm btn-primary" disabled={busy}>{busy ? "보내는 중..." : "신청 보내기"}</button>
					</div>
				</form>
			)}

			{mine.map((a) => (
				<div key={a.id} style={itemStyle}>
					<div style={{ flex: 1, minWidth: "200px" }}>
						<div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
						<div style={{ fontSize: "12px", color: "var(--text-sub)" }}>
							{businessTypeLabel(a.businessType)} · 사업자번호 {formatBusinessNumber(a.businessNumber)}
						</div>
						<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{formatDateTime(a.createdAt)} 신청</div>
						{a.decisionMemo && (
							<div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "4px" }}>
								{a.status === "REJECTED" ? "반려 사유" : "운영자 메모"}: {a.decisionMemo}
							</div>
						)}
						{a.status === "APPROVED" && (
							<div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>사이드바의 플랫폼 전환에서 오너로 들어갈 수 있습니다.</div>
						)}
					</div>
					<button type="button" className="btn btn-sm btn-ghost" onClick={() => openPlatformCertificate(a.id).catch((err) => alert(err.message))}>
						등록증
					</button>
					<span style={{ fontSize: "12px", fontWeight: 600, color: APPLICATION_STATUS[a.status]?.color }}>
						{APPLICATION_STATUS[a.status]?.label || a.status}
					</span>
					{a.status === "PENDING" && <button type="button" className="btn btn-sm btn-ghost" onClick={() => cancel(a)}>신청 취소</button>}
				</div>
			))}
		</div>
	);
}
