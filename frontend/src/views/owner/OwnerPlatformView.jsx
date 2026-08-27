import { useEffect, useState } from "react";
import { apiGet } from "../../api/http.js";
import {
	BUSINESS_TYPES,
	businessTypeLabel,
	createPlatform,
	createProgram,
	hexAlpha,
	listPrograms,
	listStaff,
	setPlatformSuspended
} from "../../api/common.js";

const TABS = [
	{ key: "info", label: "기본 정보" },
	{ key: "programs", label: "프로그램/슬롯" },
	{ key: "instructors", label: "일반관리자" },
	{ key: "members", label: "사용자" },
	{ key: "billing", label: "수강권/결제" },
	{ key: "stats", label: "수익/통계" }
];

const NOT_CONNECTED_TABS = { members: true, billing: true, stats: true };

const EMPTY_FORM = { name: "", businessType: "PILATES", phone: "", address: "", description: "" };
const EMPTY_PROGRAM = { name: "", type: "GROUP", capacity: 8, durationMin: 60, description: "" };

export default function OwnerPlatformView({ platforms, currentPlatformId, onSelectPlatform, onPlatformsChanged }) {
	const [activeTab, setActiveTab] = useState("info");
	const [showCreate, setShowCreate] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [saving, setSaving] = useState(false);

	const [programs, setPrograms] = useState([]);
	const [showProgramForm, setShowProgramForm] = useState(false);
	const [programForm, setProgramForm] = useState(EMPTY_PROGRAM);

	const [staff, setStaff] = useState([]);

	const plat = platforms.find((p) => p.id === currentPlatformId) || null;

	useEffect(() => {
		if (!plat) return;
		listPrograms(plat.id).then(setPrograms).catch(() => setPrograms([]));
		listStaff(plat.id)
			.then(async (rows) => {
				const withEmail = await Promise.all(
					rows.map(async (s) => {
						try {
							const u = await apiGet(`/api/v1/users/${s.userId}`);
							return { ...s, email: u.email };
						} catch {
							return { ...s, email: s.userId };
						}
					})
				);
				setStaff(withEmail);
			})
			.catch(() => setStaff([]));
	}, [plat?.id]);

	async function submitCreate(e) {
		e.preventDefault();
		setSaving(true);
		try {
			await createPlatform(form);
			setForm(EMPTY_FORM);
			setShowCreate(false);
			await onPlatformsChanged();
		} catch (err) {
			alert(err.message || "플랫폼 생성에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	async function toggleSuspend() {
		if (!plat) return;
		try {
			await setPlatformSuspended(plat.id, plat.status === "ACTIVE");
			await onPlatformsChanged();
		} catch (err) {
			alert(err.message || "상태 변경에 실패했습니다.");
		}
	}

	async function submitProgram(e) {
		e.preventDefault();
		setSaving(true);
		try {
			await createProgram(plat.id, programForm);
			setProgramForm(EMPTY_PROGRAM);
			setShowProgramForm(false);
			setPrograms(await listPrograms(plat.id));
		} catch (err) {
			alert(err.message || "프로그램 생성에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div id="owner-platforms" className="page">
			<div className="page-header">
				<div className="page-label">Owner Admin / Platforms</div>
				<div className="page-title">플랫폼 관리</div>
				<div className="page-subtitle">플랫폼을 선택해 상세 정보를 관리하세요</div>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", alignItems: "start" }}>

				{/* 플랫폼 목록 */}
				<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						<div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-sub)", letterSpacing: "1px", textTransform: "uppercase" }}>플랫폼 목록</span>
							<button className="btn btn-sm btn-primary" style={{ padding: "5px 10px", fontSize: "11px" }} onClick={() => setShowCreate((v) => !v)}>+ 추가</button>
						</div>
						{platforms.map((p) => (
							<div
								key={p.id}
								className={`platform-list-item ${currentPlatformId === p.id ? "active" : ""}`}
								onClick={() => onSelectPlatform(p.id)}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									padding: "14px 16px",
									cursor: "pointer",
									borderBottom: "1px solid var(--border)",
									background: currentPlatformId === p.id ? hexAlpha(p.colorHex, 0.08) : "transparent",
									borderLeft: `3px solid ${currentPlatformId === p.id ? p.colorHex : "transparent"}`
								}}
							>
								<span style={{ fontSize: "18px" }}>{p.emoji}</span>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ fontSize: "13px", fontWeight: 700 }}>{p.name}</div>
									<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>{businessTypeLabel(p.businessType)}</div>
								</div>
								<span className={`plat-status ${p.status === "ACTIVE" ? "ps-active" : "ps-expired"}`} style={{ fontSize: "10px", flexShrink: 0 }}>{p.status === "ACTIVE" ? "운영" : p.status}</span>
							</div>
						))}
						{platforms.length === 0 && (
							<div style={{ padding: "16px", fontSize: "12px", color: "var(--text-dim)", textAlign: "center" }}>등록된 플랫폼이 없습니다</div>
						)}
					</div>

					{showCreate && (
						<form onSubmit={submitCreate} className="card" style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
							<div className="form-field"><label>플랫폼명</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
							<div className="form-field">
								<label>업종</label>
								<select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })}>
									{BUSINESS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
								</select>
							</div>
							<div className="form-field"><label>대표 전화</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
							<div className="form-field"><label>주소</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
							<div className="form-field"><label>소개</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
							<button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? "생성 중..." : "생성"}</button>
						</form>
					)}
				</div>

				{/* 플랫폼 상세 */}
				{!plat ? (
					<div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)" }}>플랫폼을 선택하거나 새로 추가하세요</div>
				) : (
					<div className="card" style={{ padding: 0, overflow: "hidden" }}>
						<div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
								<span style={{ fontSize: "22px" }}>{plat.emoji}</span>
								<div>
									<div style={{ fontSize: "16px", fontWeight: 700 }}>{plat.name}</div>
									<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>{businessTypeLabel(plat.businessType)}{plat.address ? ` · ${plat.address}` : ""}</div>
								</div>
							</div>
							<button className="btn btn-sm btn-danger" onClick={toggleSuspend}>{plat.status === "ACTIVE" ? "비활성화" : "활성화"}</button>
						</div>

						<div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
							{TABS.map((t) => (
								<button key={t.key} className={`plat-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
							))}
						</div>

						<div style={{ padding: "20px" }}>

							{activeTab === "info" && (
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
									<div className="form-field"><label>플랫폼명</label><input readOnly value={plat.name} /></div>
									<div className="form-field"><label>업종</label><input readOnly value={businessTypeLabel(plat.businessType)} /></div>
									<div className="form-field"><label>대표 전화</label><input readOnly value={plat.phone || "-"} /></div>
									<div className="form-field"><label>주소</label><input readOnly value={plat.address || "-"} /></div>
									<div className="form-field" style={{ gridColumn: "1/-1" }}><label>소개</label><textarea readOnly style={{ minHeight: "60px" }} value={plat.description || "-"} /></div>
									<div style={{ gridColumn: "1/-1", fontSize: "11px", color: "var(--text-dim)" }}>* 정보 수정 API는 아직 백엔드에 없습니다 (운영 상태 전환만 지원).</div>
								</div>
							)}

							{activeTab === "programs" && (
								<div>
									<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
										<button className="btn btn-primary btn-sm" onClick={() => setShowProgramForm((v) => !v)}>+ 프로그램 추가</button>
									</div>
									{showProgramForm && (
										<form onSubmit={submitProgram} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
											<div className="form-field"><label>프로그램명</label><input required value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} /></div>
											<div className="form-field">
												<label>유형</label>
												<select value={programForm.type} onChange={(e) => setProgramForm({ ...programForm, type: e.target.value })}>
													<option value="GROUP">그룹레슨</option>
													<option value="PRIVATE">개인레슨</option>
													<option value="SEMIPRIVATE">반개인레슨</option>
												</select>
											</div>
											<div className="form-field"><label>정원</label><input type="number" min="1" required value={programForm.capacity} onChange={(e) => setProgramForm({ ...programForm, capacity: Number(e.target.value) })} /></div>
											<div className="form-field"><label>시간(분)</label><input type="number" min="1" required value={programForm.durationMin} onChange={(e) => setProgramForm({ ...programForm, durationMin: Number(e.target.value) })} /></div>
											<div className="form-field" style={{ gridColumn: "1/-1" }}><label>설명</label><textarea value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} /></div>
											<button className="btn btn-primary btn-sm" style={{ gridColumn: "1/-1" }} type="submit" disabled={saving}>{saving ? "생성 중..." : "저장"}</button>
										</form>
									)}
									<div style={{ overflowX: "auto" }}>
										<table className="data-table">
											<thead><tr><th>프로그램명</th><th>유형</th><th>정원</th><th>시간</th><th>상태</th></tr></thead>
											<tbody>
											{programs.map((pr) => (
												<tr key={pr.id}>
													<td style={{ fontWeight: 600 }}>{pr.name}</td>
													<td><span className="plat-chip" style={{ background: "var(--surface2)", color: "var(--text-sub)", borderColor: "var(--border)" }}>{pr.type}</span></td>
													<td>{pr.capacity}명</td>
													<td>{pr.durationMin}분</td>
													<td><span className={`plat-status ${pr.isActive ? "ps-active" : "ps-expired"}`} style={{ fontSize: "10px" }}>{pr.isActive ? "운영" : "중단"}</span></td>
												</tr>
											))}
											{programs.length === 0 && (
												<tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-dim)", padding: "16px" }}>등록된 프로그램이 없습니다</td></tr>
											)}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{activeTab === "instructors" && (
								<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
									{staff.filter((s) => s.staffRole === "ADMIN").map((s) => (
										<div key={s.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
											<div className="avatar" style={{ background: "linear-gradient(135deg,var(--accent2),#667eea)", width: "38px", height: "38px", fontSize: "15px" }}>{s.email?.[0]?.toUpperCase() || "?"}</div>
											<div style={{ flex: 1 }}>
												<div style={{ fontSize: "14px", fontWeight: 700 }}>{s.email}</div>
											</div>
											<span className="plat-status ps-active" style={{ fontSize: "10px" }}>재직</span>
										</div>
									))}
									{staff.filter((s) => s.staffRole === "ADMIN").length === 0 && (
										<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>배정된 일반관리자가 없습니다</div>
									)}
									<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>* 이메일로 사용자를 검색해 배정하는 API가 아직 없어 등록 UI는 제공하지 않습니다.</div>
								</div>
							)}

							{NOT_CONNECTED_TABS[activeTab] && (
								<div style={{ textAlign: "center", padding: "40px", color: "var(--text-dim)", fontSize: "13px" }}>
									이 탭에 대응하는 백엔드 API가 아직 없어 연동하지 않았습니다.
								</div>
							)}

						</div>
					</div>
				)}
			</div>
		</div>
	);
}
