import { useEffect, useRef, useState } from "react";
import { apiGet } from "../../api/http.js";
import {
	BUSINESS_TYPES,
	businessTypeLabel,
	businessTypeEmoji,
	createPlatform,
	cancelStaffInvitation,
	removeStaff,
	createStaffInvitation,
	grantTaxAccountant,
	hexAlpha,
	INCOME_TYPE_LABEL,
	listActionLogs,
	listPrograms,
	listStaff,
	listStaffInvitations,
	PROGRAM_TYPE_LABEL,
	ENROLLMENT_MODE_LABEL,
	listTaxAccountants,
	revokeTaxAccountant,
	setPlatformSuspended,
	updateStaffIncomeType,
	updateStaffSessionRate,
	updateTaxAccountantIncomeType,
	ACTION_TARGET_LABEL,
	ACTION_LABEL
} from "../../api/common.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import ManagerAdminPanel from "../../components/ManagerAdminPanel.jsx";

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

const NOT_CONNECTED_TABS = { members: true, billing: true, stats: true };

const EMPTY_FORM = { name: "", businessType: "FITNESS", phone: "", address: "", description: "" };
const EMPTY_TAX_FORM = { username: "", email: "", password: "", name: "", phone: "" };
const EMPTY_STAFF_FORM = { method: "email", value: "" };
const PAGE_SIZE = 10;

const inviteLink = (token) => `${window.location.origin}/invite/${token}`;

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

	const [showStaffForm, setShowStaffForm] = useState(false);
	const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
	const [staffSaving, setStaffSaving] = useState(false);
	const [staffError, setStaffError] = useState("");
	const [invitations, setInvitations] = useState([]);
	const [staffSubTab, setStaffSubTab] = useState("registered"); // registered | pending
	const [contract, setContract] = useState(null); // 계약 설정 모달 대상: { s, incomeType, sessionRate }
	const [contractError, setContractError] = useState("");
	const [notice, setNotice] = useState(""); // 저장/삭제 같은 작업이 끝났을 때 잠깐 보여주는 알림
	const noticeTimer = useRef(null);
	useEffect(() => () => clearTimeout(noticeTimer.current), []);

	function notify(message) {
		setNotice(message);
		clearTimeout(noticeTimer.current);
		noticeTimer.current = setTimeout(() => setNotice(""), 2500);
	}
	const [staffQuery, setStaffQuery] = useState("");
	const [staffPage, setStaffPage] = useState(0);

	const [activityLogs, setActivityLogs] = useState([]);

	const plat = platforms.find((p) => p.id === currentPlatformId) || null;

	function refreshStaff(platformId) {
		listStaff(platformId)
			.then(async (rows) => {
				const withEmail = await Promise.all(
					rows.map(async (s) => {
						try {
							const u = await apiGet(`/api/v1/users/${s.userId}`);
							return { ...s, email: u.email, name: u.name };
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
		refreshInvitations(plat.id);
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

	function refreshInvitations(platformId) {
		listStaffInvitations(platformId).then(setInvitations).catch(() => setInvitations([]));
	}

	// 강사/매니저 탭 공용 초대 폼 — 링크만 발급하고, 전달은 직접 한다(메일/SMS 발송 없음).
	async function submitInvite(e, role) {
		e.preventDefault();
		setStaffError("");
		setStaffSaving(true);
		try {
			const { method, value } = staffForm;
			await createStaffInvitation(plat.id, { staffRole: role, [method]: value.trim() });
			setStaffForm(EMPTY_STAFF_FORM);
			setShowStaffForm(false);
			refreshInvitations(plat.id);
			notify("초대 링크를 만들었습니다.");
		} catch (err) {
			setStaffError(err.message || "초대에 실패했습니다.");
		} finally {
			setStaffSaving(false);
		}
	}

	async function cancelInvite(id) {
		try {
			await cancelStaffInvitation(id);
			refreshInvitations(plat.id);
			notify("초대를 취소했습니다.");
		} catch (err) {
			alert(err.message || "초대 취소에 실패했습니다.");
		}
	}

	async function copyInviteLink(token) {
		try {
			await navigator.clipboard.writeText(inviteLink(token));
			notify("초대 링크를 복사했습니다.");
		} catch {
			window.prompt("초대 링크를 복사하세요", inviteLink(token));
		}
	}

	// 삭제는 이 플랫폼에서 그 사람의 모든 직원 역할(강사+매니저 겸직 포함)을 함께 끝낸다.
	async function removeStaffMember(s) {
		if (!window.confirm(`${s.email}을(를) 이 플랫폼에서 삭제할까요?\n겸직 중인 다른 역할도 함께 해제됩니다.`)) return;
		try {
			await removeStaff(plat.id, s.userId);
			refreshStaff(plat.id);
			notify("삭제했습니다.");
		} catch (err) {
			alert(err.message || "삭제에 실패했습니다.");
		}
	}

	// 등록된 직원 목록 — 이메일/이름 검색 + 10개씩 페이지. 탭이 바뀌면 검색/페이지를 초기화한다.
	useEffect(() => { setStaffQuery(""); setStaffPage(0); }, [activeTab, staffSubTab]);
	
	function registeredStaff(role) {
		const q = staffQuery.trim().toLowerCase();
		return staff.filter((s) => s.staffRole === role && (!q || [s.email, s.name].some((v) => v?.toLowerCase().includes(q))));
	}
	
	function pageOf(list) {
		const page = Math.min(staffPage, Math.max(0, Math.ceil(list.length / PAGE_SIZE) - 1));
		return list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
	}
	
	function staffToolbarUi() {
		return (
			<input
				type="text" placeholder="이메일/이름 검색" value={staffQuery}
				onChange={(e) => { setStaffQuery(e.target.value); setStaffPage(0); }}
				style={{ padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", color: "var(--text)", fontSize: "13px", outline: "none" }}
			/>
		);
	}
	
	function staffPagerUi(total) {
		const pages = Math.ceil(total / PAGE_SIZE);
		if (pages <= 1) return null;
		const page = Math.min(staffPage, pages - 1);
		return (
			<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "12px" }}>
				<button className="btn btn-sm btn-ghost" disabled={page === 0} onClick={() => setStaffPage(page - 1)}>이전</button>
				<span>{page + 1} / {pages}</span>
				<button className="btn btn-sm btn-ghost" disabled={page >= pages - 1} onClick={() => setStaffPage(page + 1)}>다음</button>
			</div>
		);
	}
	
	function staffSubTabsUi(role) {
		const counts = {
			registered: staff.filter((s) => s.staffRole === role).length,
			pending: invitations.filter((i) => i.staffRole === role).length
		};
		return (
			<div style={{ display: "flex", gap: "6px" }}>
				{[["registered", "등록됨"], ["pending", "초대 중"]].map(([key, label]) => (
					<button
						key={key} type="button"
						className={`btn btn-sm ${staffSubTab === key ? "btn-primary" : "btn-ghost"}`}
						onClick={() => setStaffSubTab(key)}
					>{label} {counts[key]}</button>
				))}
				{notice && <span style={{ alignSelf: "center", marginLeft: "auto", fontSize: "12px", color: "var(--green)" }}>{notice}</span>}
			</div>
		);
	}

	function staffFormUi(role) {
		const pending = invitations.filter((i) => i.staffRole === role);
		return (
			<>
				{pending.map((i) => (
					<div key={i.id} style={{ background: "var(--surface2)", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
						<div style={{ flex: 1, fontSize: "13px" }}>
							{[i.email, i.phone].filter(Boolean).join(" / ")}
							<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>수락 대기 · {formatDateTime(i.expiresAt)}까지</div>
						</div>
						<button className="btn btn-sm" onClick={() => copyInviteLink(i.token)}>링크 복사</button>
						<button className="btn btn-sm btn-danger" onClick={() => cancelInvite(i.id)}>취소</button>
					</div>
				))}
				<button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setShowStaffForm((v) => !v)}>
					+ {role === "MANAGER" ? "매니저" : "강사"} 초대
				</button>
				{showStaffForm && (
					<form onSubmit={(e) => submitInvite(e, role)} className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
						<div style={{ gridColumn: "1/-1", display: "flex", gap: "6px" }}>
							{[["email", "이메일"], ["phone", "연락처"]].map(([m, label]) => (
								<button
									key={m} type="button"
									className={`btn btn-sm ${staffForm.method === m ? "btn-primary" : "btn-ghost"}`}
									onClick={() => setStaffForm({ method: m, value: "" })}
								>{label}</button>
							))}
						</div>
						<div className="form-field" style={{ gridColumn: "1/-1" }}>
							<label>{staffForm.method === "email" ? "이메일" : "연락처"}</label>
							<input
								required
								type={staffForm.method === "email" ? "email" : "tel"}
								placeholder={staffForm.method === "email" ? "user@example.com" : "010-0000-0000"}
								value={staffForm.value}
								onChange={(e) => setStaffForm({ ...staffForm, value: e.target.value })}
							/>
						</div>
						<div style={{ gridColumn: "1/-1", fontSize: "11px", color: "var(--text-dim)" }}>
							{role === "MANAGER" && "수락한 뒤 '그룹 설정'에서 그룹을 지정하기 전까지는 권한이 없습니다. "}
							선택한 이메일 또는 연락처로 초대합니다. 발급된 링크를 직접 전달하세요 — 상대가 가입/로그인한 계정의 이메일 또는 연락처가 여기 적은 값과 일치해야 수락할 수 있습니다. (7일간 유효)
						</div>
						{staffError && <div style={{ gridColumn: "1/-1", color: "var(--red)", fontSize: "12px" }}>{staffError}</div>}
						<button className="btn btn-primary btn-sm" style={{ gridColumn: "1/-1" }} type="submit" disabled={staffSaving}>
							{staffSaving ? "발급 중..." : "초대 링크 만들기"}
						</button>
					</form>
				)}
			</>
		);
	}

	async function removeTaxAccountant(userId) {
		try {
			await revokeTaxAccountant(plat.id, userId);
			refreshTaxAccountants(plat.id);
		} catch (err) {
			alert(err.message || "접근 해제에 실패했습니다.");
		}
	}

	// 계약 설정 모달 저장 — 바뀐 항목만 각각의 API로 보낸다.
	async function saveContract(e) {
		e.preventDefault();
		const { s, incomeType, sessionRate } = contract;
		setContractError("");
		try {
			if (incomeType && incomeType !== s.incomeType) await updateStaffIncomeType(plat.id, s.userId, incomeType);
			if (sessionRate !== "" && Number(sessionRate) !== s.sessionRate) await updateStaffSessionRate(plat.id, s.userId, Number(sessionRate));
			setContract(null);
			refreshStaff(plat.id);
			notify("계약 설정을 저장했습니다.");
		} catch (err) {
			setContractError(err.message || "계약 설정 저장에 실패했습니다.");
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

			<div className="grid-side-main" style={{ gap: "20px", "--side-w": "260px" }}>

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
								<span style={{ fontSize: "18px" }}>{businessTypeEmoji(p.businessType)}</span>
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
								<span style={{ fontSize: "22px" }}>{businessTypeEmoji(plat.businessType)}</span>
								<div>
									<div style={{ fontSize: "16px", fontWeight: 700 }}>{plat.name}</div>
									<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>ID {plat.code} · {businessTypeLabel(plat.businessType)}{plat.address ? ` · ${plat.address}` : ""}</div>
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
								<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "14px" }}>
									<div className="form-field"><label>플랫폼 ID</label><input readOnly value={plat.code} style={{ fontFamily: "'DM Mono',monospace", letterSpacing: "1px" }} /></div>
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
									{staffSubTabsUi("TUTOR")}
									{staffSubTab === "registered" && staffToolbarUi()}
									{staffSubTab === "registered" && pageOf(registeredStaff("TUTOR")).map((s) => (
										<div key={s.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
											<div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
												<div className="avatar" style={{ background: "linear-gradient(135deg,var(--accent2),#667eea)", width: "38px", height: "38px", fontSize: "15px" }}>{s.email?.[0]?.toUpperCase() || "?"}</div>
												<div style={{ flex: 1 }}>
													<div style={{ fontSize: "14px", fontWeight: 700 }}>{s.email}</div>
													{s.name && <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{s.name}</div>}
												</div>
												<div style={{ fontSize: "12px", color: "var(--text-sub)", textAlign: "right" }}>
													<div>{s.incomeType ? INCOME_TYPE_LABEL[s.incomeType] : "소득유형 미설정"}</div>
													<div>{s.sessionRate != null ? `회당 ${s.sessionRate.toLocaleString()}원` : "강사료 미설정"}</div>
												</div>
												<button
													className="btn btn-sm"
													onClick={() => { setContractError(""); setContract(contract?.s.id === s.id ? null : { s, incomeType: s.incomeType || "", sessionRate: s.sessionRate ?? "" }); }}
												>계약 설정</button>
												<span className="plat-status ps-active" style={{ fontSize: "10px" }}>재직</span>
												<button className="btn btn-sm btn-danger" onClick={() => removeStaffMember(s)}>삭제</button>
											</div>
											{contract?.s.id === s.id && (
												<form onSubmit={saveContract} className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
													<div className="form-field">
														<label>소득유형</label>
														<select required value={contract.incomeType} onChange={(e) => setContract({ ...contract, incomeType: e.target.value })}>
															<option value="" disabled>소득유형 선택</option>
															{Object.entries(INCOME_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
														</select>
													</div>
													<div className="form-field">
														<label>회당 강사료 (원)</label>
														<input type="number" min="0" required value={contract.sessionRate} onChange={(e) => setContract({ ...contract, sessionRate: e.target.value })} />
													</div>
													{contractError && <div style={{ gridColumn: "1/-1", color: "var(--red)", fontSize: "12px" }}>{contractError}</div>}
													<div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
														<button type="button" className="btn btn-ghost btn-sm" onClick={() => setContract(null)}>닫기</button>
														<button type="submit" className="btn btn-primary btn-sm">저장</button>
													</div>
												</form>
											)}
										</div>
									))}
									{staffSubTab === "registered" && registeredStaff("TUTOR").length === 0 && (
										<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>배정된 강사가 없습니다</div>
									)}
									{staffSubTab === "registered" && staffPagerUi(registeredStaff("TUTOR").length)}
									{staffSubTab === "pending" && staffFormUi("TUTOR")}
								</div>
							)}

							{activeTab === "managers" && <ManagerAdminPanel key={plat.id} platformId={plat.id} />}

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
										<form onSubmit={submitTaxAccountant} className="card" style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
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
														<td>{ACTION_TARGET_LABEL[l.targetType] || l.targetType}</td>
														<td>{ACTION_LABEL[l.action] || l.action}</td>
														<td style={{ color: "var(--text-sub)", minWidth: "260px", whiteSpace: "pre-wrap" }}>{l.memo || "-"}</td>
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
