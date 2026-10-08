import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { listStaff, removeStaff, getUser, createStaffInvitation, listStaffInvitations, cancelStaffInvitation, getMyPermissions } from "../../api/common.js";

export default function ManagerTutorManageView({ platformId }) {
	const [tutors, setTutors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [inviteMethod, setInviteMethod] = useState("email");
	const [inviteValue, setInviteValue] = useState("");
	const [invitations, setInvitations] = useState([]);
	const [createdLink, setCreatedLink] = useState("");
	const [enrolling, setEnrolling] = useState(false);
	const [enrollError, setEnrollError] = useState("");
	const [expandedId, setExpandedId] = useState(null);
	// 강사 초대/삭제는 '강사 초대 / 삭제'(TUTOR_MANAGE) 권한이 있는 그룹만 — 없으면 조회만 가능하다.
	const [canManageTutors, setCanManageTutors] = useState(false);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setTutors([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const allStaff = await listStaff(platformId, true);
		const canInvite = (await getMyPermissions(platformId).catch(() => [])).includes("TUTOR_MANAGE");
		setCanManageTutors(canInvite);
		const staff = allStaff.filter((s) => s.staffRole === "TUTOR");
		const withDetail = await Promise.all(
			staff.map(async (s) => {
				const u = await getUser(s.userId);
				return { ...s, email: u.email, name: u.name, phone: u.phone };
			})
		);
		setTutors(withDetail);
		setInvitations(canInvite ? (await listStaffInvitations(platformId).catch(() => [])).filter((i) => i.staffRole === "TUTOR") : []);
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	// 강사 추가는 초대 링크 방식 — 이메일 또는 연락처로 초대하고, 상대가 링크로 로그인해 수락해야 배정된다.
	async function submitInvite() {
		if (!inviteValue.trim()) {
			setEnrollError(`${inviteMethod === "email" ? "이메일" : "연락처"}를 입력하세요.`);
			return;
		}
		setEnrolling(true);
		setEnrollError("");
		try {
			const inv = await createStaffInvitation(platformId, { staffRole: "TUTOR", [inviteMethod]: inviteValue.trim() });
			setCreatedLink(`${window.location.origin}/invite/${inv.token}`);
			setInviteValue("");
			await refresh();
		} catch (err) {
			setEnrollError(err.message || "강사 초대에 실패했습니다.");
		} finally {
			setEnrolling(false);
		}
	}

	async function cancelInvite(id) {
		await cancelStaffInvitation(id);
		await refresh();
	}

	function copyLink(link) {
		navigator.clipboard.writeText(link).catch(() => window.prompt("초대 링크를 복사하세요", link));
	}

	async function remove(userId) {
		await removeStaff(platformId, userId);
		await refresh();
	}

	const filtered = tutors.filter((t) => !search || t.name?.includes(search) || t.email.toLowerCase().includes(search.toLowerCase()));

	return (
		<>
		<div className="page" id="manager-instructors">
			<div className="page-header">
				<div className="page-label">INSTRUCTORS</div>
				<div className="page-title">강사 관리</div>
				<div className="page-subtitle">소속 강사를 초대하고 관리하세요</div>
			</div>

			<div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
				<input
					type="text"
					placeholder="이름 / 이메일 검색..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{
						flex: "1",
						minWidth: "160px",
						padding: "8px 14px",
						background: "var(--surface)",
						border: "1px solid var(--border)",
						borderRadius: "20px",
						color: "var(--text)",
						fontSize: "13px",
						outline: "none"
					}}
				/>
				{canManageTutors && (
					<button className="btn btn-primary btn-sm" onClick={() => { setCreatedLink(""); openModal("addInstructorModal"); }}>
						+ 강사 초대
					</button>
				)}
			</div>

			{!canManageTutors && (
				<div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px" }}>강사 목록 조회만 가능합니다. 초대/삭제는 '강사 초대 / 삭제' 권한이 있는 그룹만 처리할 수 있습니다.</div>
			)}

			<div className="card" style={{ padding: "0", overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr>
								<th>이름</th>
								<th>연락처</th>
								<th>이메일</th>
								<th>상태</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : filtered.length === 0 ? (
								<tr>
									<td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>
										{tutors.length === 0 ? "등록된 강사가 없습니다" : "검색 결과가 없습니다"}
									</td>
								</tr>
							) : (
								filtered.map((t) => {
									const isOpen = expandedId === t.id;
									return (
										<>
										<tr key={t.id} onClick={() => setExpandedId(isOpen ? null : t.id)} style={{ cursor: "pointer" }}>
											<td style={{ fontWeight: 600 }}>{t.name}</td>
											<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{t.phone || "-"}</td>
											<td>{t.email}</td>
											<td>
												<span className={`badge ${t.isActive ? "bs-active" : "bs-expired"}`} style={{ fontSize: "10px" }}>
													{t.isActive ? "활성" : "비활성"}
												</span>
											</td>
											<td>{isOpen ? "▾" : "▸"}</td>
										</tr>
										{isOpen && (
											<tr>
												<td colSpan={5} style={{ padding: 0 }}>
													<div className="member-detail" style={{ margin: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
														<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>담당 이메일: {t.email}</div>
														{t.isActive && canManageTutors && (
															<button
																className="btn btn-ghost btn-sm"
																onClick={(e) => { e.stopPropagation(); remove(t.userId); }}
															>
																배정 해제
															</button>
														)}
													</div>
												</td>
											</tr>
										)}
										</>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		{invitations.length > 0 && (
			<div className="card" style={{ margin: "16px 0", padding: "12px 16px" }}>
				<div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>수락 대기 중인 초대</div>
				{invitations.map((i) => (
					<div key={i.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontSize: "13px" }}>
						<span style={{ flex: 1 }}>{[i.email, i.phone].filter(Boolean).join(" / ")}</span>
						<button className="btn btn-ghost btn-sm" onClick={() => copyLink(`${window.location.origin}/invite/${i.token}`)}>링크 복사</button>
						<button className="btn btn-ghost btn-sm" onClick={() => cancelInvite(i.id)}>취소</button>
					</div>
				))}
			</div>
		)}

		<div className="modal-overlay" id="addInstructorModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">강사 초대</div>
					<button className="modal-close" onClick={() => closeModal("addInstructorModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div style={{ display: "flex", gap: "6px" }}>
						{[["email", "이메일"], ["phone", "연락처"]].map(([m, label]) => (
							<button
								key={m} type="button"
								className={`btn btn-sm ${inviteMethod === m ? "btn-primary" : "btn-ghost"}`}
								onClick={() => { setInviteMethod(m); setInviteValue(""); setCreatedLink(""); }}
							>{label}</button>
						))}
					</div>
					<div className="form-field">
						<label>{inviteMethod === "email" ? "이메일" : "연락처"}</label>
						<input
							type={inviteMethod === "email" ? "email" : "tel"}
							value={inviteValue}
							onChange={(e) => setInviteValue(e.target.value)}
							placeholder={inviteMethod === "email" ? "tutor@example.com" : "010-0000-0000"}
						/>
					</div>
					<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
						선택한 이메일 또는 연락처로 초대합니다. 발급된 링크를 직접 전달하세요 — 상대가 가입/로그인한 계정의 이메일 또는 연락처가 일치해야 수락할 수 있습니다. (7일간 유효)
					</div>
					{createdLink && (
						<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
							<input readOnly value={createdLink} style={{ flex: 1, fontSize: "12px" }} onFocus={(e) => e.target.select()} />
							<button className="btn btn-ghost btn-sm" onClick={() => copyLink(createdLink)}>복사</button>
						</div>
					)}
					{enrollError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{enrollError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("addInstructorModal")}>취소</button>
						<button className="btn btn-primary" disabled={enrolling} onClick={submitInvite}>
							{enrolling ? "발급 중..." : "초대 링크 만들기"}
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
