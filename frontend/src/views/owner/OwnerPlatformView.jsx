import { useEffect, useState } from "react";
import { apiGet } from "../../api/http.js";
import {
	BUSINESS_TYPES,
	businessTypeLabel,
	createPlatform,
	grantTaxAccountant,
	hexAlpha,
	INCOME_TYPE_LABEL,
	listActionLogs,
	listPrograms,
	listStaff,
	PROGRAM_TYPE_LABEL,
	ENROLLMENT_MODE_LABEL,
	listTaxAccountants,
	revokeTaxAccountant,
	setPlatformSuspended,
	updateStaffIncomeType,
	updateStaffSessionRate,
	updateTaxAccountantIncomeType,
	updateManagerTier,
	MANAGER_TIER_LABEL
} from "../../api/common.js";
import { formatDateTime } from "../../utils/formatDateTime.js";

const TABS = [
	{ key: "info", label: "기본 정보" },
	{ key: "programs", label: "프로그램/슬롯" },
	{ key: "instructors", label: "강사" },
	{ key: "managers", label: "매니저" },
	{ key: "members", label: "사용자" },
	{ key: "billing", label: "수강권/결제" },
	{ key: "stats", label: "수익/통계" },
	{ key: "taxaccountants", label: "세무사" },
	{ key: "activityLog", label: "활동 이력" }
];

const TARGET_LABEL = {
	SCHEDULE_REQUEST: "일정 변경 요청",
	MEMBER_MEMO: "회원 메모",
	STAFF_CHANGE: "스태프 변경",
	PASS_REFUND: "수강권 환불",
	PLATFORM_CHANGE: "플랫폼 상태",
	PROGRAM_CHANGE: "프로그램 변경",
	PASS_CHANGE: "수강권 변경",
	DISCOUNT_CHANGE: "할인 정책 변경",
	FINANCIAL_REQUEST: "재무 일정"
};

const NOT_CONNECTED_TABS = { members: true, billing: true, stats: true };

const EMPTY_FORM = { name: "", businessType: "PILATES", phone: "", address: "", description: "" };
const EMPTY_TAX_FORM = { username: "", email: "", password: "", name: "", phone: "" };

export default function OwnerPlatformView({ platforms, currentPlatformId, onSelectPlatform, onPlatformsChanged }) {
	const [activeTab, setActiveTab] = useState("info");
	const [showCreate, setShowCreate] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);
	const [saving, setSaving] = useState(false);

	const [programs, setPrograms] = useState([]);

	const [staff, setStaff] = useState([]);

	const [taxAccountants, setTaxAccountants] = useState([]);
	const [showTaxForm, setShowTaxForm] = useState(false);
	const [taxForm, setTaxForm] = useState(EMPTY_TAX_FORM);
	const [taxSaving, setTaxSaving] = useState(false);
	const [taxError, setTaxError] = useState("");

	const [activityLogs, setActivityLogs] = useState([]);

	const plat = platforms.find((p) => p.id === currentPlatformId) || null;

	function refreshStaff(platformId) {
		listStaff(platformId)
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
	}

	useEffect(() => {
		if (!plat) return;
		listPrograms(plat.id).then(setPrograms).catch(() => setPrograms([]));
		refreshStaff(plat.id);
		refreshTaxAccountants(plat.id);
		listActionLogs(plat.id).then(setActivityLogs).catch(() => setActivityLogs([]));
	}, [plat?.id]);

	function refreshTaxAccountants(platformId) {
		listTaxAccountants(platformId).then(setTaxAccountants).catch(() => setTaxAccountants([]));
	}

	async function submitTaxAccountant(e) {
		e.preventDefault();
		setTaxError("");
		setTaxSaving(true);
		try {
			await grantTaxAccountant(plat.id, taxForm);
			setTaxForm(EMPTY_TAX_FORM);
			setShowTaxForm(false);
			refreshTaxAccountants(plat.id);
		} catch (err) {
			setTaxError(err.message || "세무사 초대에 실패했습니다.");
		} finally {
			setTaxSaving(false);
		}
	}

	async function removeTaxAccountant(userId) {
		try {
			await revokeTaxAccountant(plat.id, userId);
			refreshTaxAccountants(plat.id);
		} catch (err) {
			alert(err.message || "접근 해제에 실패했습니다.");
		}
	}

	async function changeStaffIncomeType(userId, incomeType) {
		try {
			await updateStaffIncomeType(plat.id, userId, incomeType);
			refreshStaff(plat.id);
		} catch (err) {
			alert(err.message || "소득유형 변경에 실패했습니다.");
		}
	}

	async function changeSessionRate(userId, sessionRate) {
		try {
			await updateStaffSessionRate(plat.id, userId, sessionRate);
			refreshStaff(plat.id);
		} catch (err) {
			alert(err.message || "강사료 변경에 실패했습니다.");
		}
	}

	async function changeManagerTier(userId, managerTier) {
		try {
			await updateManagerTier(plat.id, userId, managerTier);
			refreshStaff(plat.id);
		} catch (err) {
			alert(err.message || "권한 등급 변경에 실패했습니다.");
		}
	}

	async function changeTaxAccountantIncomeType(userId, incomeType) {
		try {
			await updateTaxAccountantIncomeType(plat.id, userId, incomeType);
			refreshTaxAccountants(plat.id);
		} catch (err) {
			alert(err.message || "소득유형 변경에 실패했습니다.");
		}
	}

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
									<div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "14px" }}>
										수업 종류는 매니저의 "수강권/결제" 메뉴에서 수강권과 함께 등록합니다. 여기서는 조회만 가능합니다.
									</div>
									<div style={{ overflowX: "auto" }}>
										<table className="data-table">
											<thead><tr><th>프로그램명</th><th>유형</th><th>정원</th><th>시간</th><th>상태</th></tr></thead>
											<tbody>
											{programs.map((pr) => (
												<tr key={pr.id}>
													<td style={{ fontWeight: 600 }}>{pr.name}</td>
													<td>
														<span className="plat-chip" style={{ background: "var(--surface2)", color: "var(--text-sub)", borderColor: "var(--border)" }}>
															{PROGRAM_TYPE_LABEL[pr.type] || pr.type}
															{pr.type === "GROUP" && ` · ${ENROLLMENT_MODE_LABEL[pr.enrollmentMode] || pr.enrollmentMode}`}
														</span>
													</td>
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
									{staff.filter((s) => s.staffRole === "TUTOR").map((s) => (
										<div key={s.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
											<div className="avatar" style={{ background: "linear-gradient(135deg,var(--accent2),#667eea)", width: "38px", height: "38px", fontSize: "15px" }}>{s.email?.[0]?.toUpperCase() || "?"}</div>
											<div style={{ flex: 1 }}>
												<div style={{ fontSize: "14px", fontWeight: 700 }}>{s.email}</div>
											</div>
											<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
												<span style={{ fontSize: "11px", color: "var(--text-dim)" }}>회당</span>
												<input
													type="number" min="0" defaultValue={s.sessionRate ?? ""} placeholder="강사료"
													onBlur={(e) => {
														const v = Number(e.target.value);
														if (e.target.value !== "" && v !== s.sessionRate) changeSessionRate(s.userId, v);
													}}
													style={{ width: "90px", fontSize: "12px", padding: "4px 8px" }}
												/>
												<span style={{ fontSize: "11px", color: "var(--text-dim)" }}>원</span>
											</div>
											<select
												value={s.incomeType || ""}
												onChange={(e) => changeStaffIncomeType(s.userId, e.target.value)}
												style={{ fontSize: "12px", padding: "4px 8px" }}
											>
												<option value="" disabled>소득유형 선택</option>
												{Object.entries(INCOME_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
											</select>
											<span className="plat-status ps-active" style={{ fontSize: "10px" }}>재직</span>
										</div>
									))}
									{staff.filter((s) => s.staffRole === "TUTOR").length === 0 && (
										<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>배정된 강사가 없습니다</div>
									)}
									<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>* 이메일로 사용자를 검색해 배정하는 API가 아직 없어 등록 UI는 제공하지 않습니다.</div>
								</div>
							)}

							{activeTab === "managers" && (
								<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
									<div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "4px" }}>
										매니저 권한 등급(L/M/H) — L은 일반 처리만, M은 강사 배정까지, H는 휴가 승인과 등급 변경까지 가능합니다.
									</div>
									{staff.filter((s) => s.staffRole === "MANAGER").map((s) => (
										<div key={s.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
											<div className="avatar" style={{ background: "linear-gradient(135deg,var(--owner),#f7b955)", width: "38px", height: "38px", fontSize: "15px" }}>{s.email?.[0]?.toUpperCase() || "?"}</div>
											<div style={{ flex: 1 }}>
												<div style={{ fontSize: "14px", fontWeight: 700 }}>{s.email}</div>
											</div>
											<select
												value={s.managerTier || ""}
												onChange={(e) => changeManagerTier(s.userId, e.target.value)}
												style={{ fontSize: "12px", padding: "4px 8px" }}
											>
												<option value="" disabled>등급 선택</option>
												{Object.entries(MANAGER_TIER_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
											</select>
											<span className="plat-status ps-active" style={{ fontSize: "10px" }}>재직</span>
										</div>
									))}
									{staff.filter((s) => s.staffRole === "MANAGER").length === 0 && (
										<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>배정된 매니저가 없습니다</div>
									)}
								</div>
							)}

							{activeTab === "taxaccountants" && (
								<div>
									<div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "14px" }}>
										초대한 세무사만 이 플랫폼의 매출 집계와 강사·매니저 정산 계좌를 볼 수 있습니다.
									</div>
									<div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
										{taxAccountants.map((a) => (
											<div key={a.id} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
												<div className="avatar" style={{ background: "linear-gradient(135deg,var(--owner),var(--owner-soft))", width: "38px", height: "38px", fontSize: "15px" }}>{a.name?.[0] || "?"}</div>
												<div style={{ flex: 1 }}>
													<div style={{ fontSize: "14px", fontWeight: 700 }}>{a.name}</div>
													<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>{a.email}</div>
												</div>
												<select
													value={a.incomeType || ""}
													onChange={(e) => changeTaxAccountantIncomeType(a.id, e.target.value)}
													style={{ fontSize: "12px", padding: "4px 8px" }}
												>
													<option value="" disabled>소득유형 선택</option>
													{Object.entries(INCOME_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
												</select>
												<button className="btn btn-sm btn-danger" onClick={() => removeTaxAccountant(a.id)}>접근 해제</button>
											</div>
										))}
										{taxAccountants.length === 0 && (
											<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>초대된 세무사가 없습니다</div>
										)}
									</div>

									<button className="btn btn-primary btn-sm" onClick={() => setShowTaxForm((v) => !v)}>+ 세무사 초대</button>
									{showTaxForm && (
										<form onSubmit={submitTaxAccountant} className="card" style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
											<div className="form-field"><label>아이디</label><input required value={taxForm.username} onChange={(e) => setTaxForm({ ...taxForm, username: e.target.value })} /></div>
											<div className="form-field"><label>이메일</label><input type="email" required value={taxForm.email} onChange={(e) => setTaxForm({ ...taxForm, email: e.target.value })} /></div>
											<div className="form-field"><label>이름</label><input required value={taxForm.name} onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })} /></div>
											<div className="form-field"><label>연락처</label><input value={taxForm.phone} onChange={(e) => setTaxForm({ ...taxForm, phone: e.target.value })} /></div>
											<div className="form-field" style={{ gridColumn: "1/-1" }}>
												<label>초기 비밀번호</label>
												<input type="password" required value={taxForm.password} onChange={(e) => setTaxForm({ ...taxForm, password: e.target.value })} />
											</div>
											<div style={{ gridColumn: "1/-1", fontSize: "11px", color: "var(--text-dim)" }}>
												이미 세무사로 등록된 이메일이면 비밀번호/이름/연락처는 무시되고 이 플랫폼 접근만 추가됩니다.
											</div>
											{taxError && <div style={{ gridColumn: "1/-1", color: "var(--red)", fontSize: "12px" }}>{taxError}</div>}
											<button className="btn btn-primary btn-sm" style={{ gridColumn: "1/-1" }} type="submit" disabled={taxSaving}>
												{taxSaving ? "초대 중..." : "초대하기"}
											</button>
										</form>
									)}
								</div>
							)}

							{activeTab === "activityLog" && (
								<div style={{ overflowX: "auto" }}>
									<table className="data-table">
										<thead><tr><th>일시</th><th>처리자</th><th>항목</th><th>작업</th><th>메모</th></tr></thead>
										<tbody>
											{activityLogs.length === 0 ? (
												<tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-dim)", padding: "16px" }}>이력이 없습니다</td></tr>
											) : (
												activityLogs.map((l) => (
													<tr key={l.id}>
														<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{formatDateTime(l.createdAt)}</td>
														<td>{l.actorName || "-"}</td>
														<td>{TARGET_LABEL[l.targetType] || l.targetType}</td>
														<td>{l.action}</td>
														<td style={{ color: "var(--text-sub)" }}>{l.memo || "-"}</td>
													</tr>
												))
											)}
										</tbody>
									</table>
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
