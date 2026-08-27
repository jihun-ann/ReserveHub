import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { listMembers, listMemberMemos, createMemberMemo, deleteMemberMemo, listPasses, enrollMember } from "../../api/common.js";

function deriveStatus(expiresAt) {
	const days = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
	if (days < 0) return { key: "expired", label: "만료", cls: "bs-expired", days };
	if (days <= 7) return { key: "soon", label: "임박", cls: "bs-soon", days };
	return { key: "active", label: "활성", cls: "bs-active", days };
}

export default function ManagerMemberManageView({ platformId }) {
	const [members, setMembers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [expandedKey, setExpandedKey] = useState(null);
	const [expandedMember, setExpandedMember] = useState(null);
	const [memos, setMemos] = useState([]);
	const [memoText, setMemoText] = useState("");

	const [passes, setPasses] = useState([]);
	const [newName, setNewName] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newPassId, setNewPassId] = useState("");
	const [enrolling, setEnrolling] = useState(false);
	const [enrollError, setEnrollError] = useState("");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setMembers([]);
			setPasses([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [memberList, passList] = await Promise.all([listMembers(platformId), listPasses(platformId)]);
		setMembers(memberList);
		setPasses(passList);
		setNewPassId((prev) => prev || passList[0]?.id || "");
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function submitEnroll() {
		if (!newName.trim() || !newEmail.trim() || !newPassword.trim() || !newPassId) return;
		setEnrolling(true);
		setEnrollError("");
		try {
			await enrollMember(platformId, newEmail.trim(), newPassword.trim(), newName.trim(), newPhone.trim() || null, newPassId);
			setNewName("");
			setNewPhone("");
			setNewEmail("");
			setNewPassword("");
			closeModal("addMemberModal");
			await refresh();
		} catch (err) {
			setEnrollError(err.message || "회원 등록에 실패했습니다.");
		} finally {
			setEnrolling(false);
		}
	}

	async function toggleDetail(member) {
		const key = member.userId + "::" + member.passName;
		if (expandedKey === key) {
			setExpandedKey(null);
			setExpandedMember(null);
			return;
		}
		setExpandedKey(key);
		setExpandedMember(member);
		setMemoText("");
		setMemos(await listMemberMemos(platformId, member.userId));
	}

	async function addMemo() {
		if (!memoText.trim() || !expandedMember) return;
		await createMemberMemo(platformId, expandedMember.userId, memoText.trim());
		setMemoText("");
		setMemos(await listMemberMemos(platformId, expandedMember.userId));
	}

	async function removeMemo(memoId) {
		if (!expandedMember) return;
		await deleteMemberMemo(platformId, expandedMember.userId, memoId);
		setMemos(await listMemberMemos(platformId, expandedMember.userId));
	}

	const filtered = members.filter((m) => {
		const st = deriveStatus(m.expiresAt);
		const matchStatus = statusFilter === "all" || st.key === statusFilter;
		const matchSearch = !search || m.name?.includes(search) || m.email.toLowerCase().includes(search.toLowerCase());
		return matchStatus && matchSearch;
	});

	return (
		<>
		<div className="page" id="manager-members">
			<div className="page-header">
				<div className="page-label">MEMBERS</div>
				<div className="page-title">회원 관리</div>
				<div className="page-subtitle">플랫폼 회원을 조회하고 관리하세요</div>
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
				{["all", "active", "soon", "expired"].map((s) => (
					<button
						key={s}
						className={`filter-chip ${statusFilter === s ? "active" : ""}`}
						onClick={() => setStatusFilter(s)}
					>
						{s === "all" ? "전체" : s === "active" ? "활성" : s === "soon" ? "만료 임박" : "만료"}
					</button>
				))}
				<button className="btn btn-primary btn-sm" onClick={() => openModal("addMemberModal")}>
					+ 회원 등록
				</button>
			</div>

			<div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "16px" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr>
								<th>이름</th>
								<th>연락처</th>
								<th>이메일</th>
								<th>수강권</th>
								<th>사용</th>
								<th>만료일</th>
								<th>D-day</th>
								<th>상태</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : filtered.length === 0 ? (
								<tr><td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>회원이 없습니다</td></tr>
							) : (
								filtered.map((m) => {
									const st = deriveStatus(m.expiresAt);
									const key = m.userId + "::" + m.passName;
									const isOpen = expandedKey === key;
									return (
										<>
										<tr key={key} onClick={() => toggleDetail(m)} style={{ cursor: "pointer" }}>
											<td style={{ fontWeight: 600 }}>{m.name}</td>
											<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{m.phone || "-"}</td>
											<td>{m.email}</td>
											<td>{m.passName}</td>
											<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
												{m.sessionsTotal != null ? `${m.sessionsUsed}/${m.sessionsTotal}` : `${m.sessionsUsed}회`}
											</td>
											<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{m.expiresAt}</td>
											<td>
												{st.key === "expired" ? (
													<span className="badge bs-expired" style={{ fontSize: "10px" }}>만료</span>
												) : st.days <= 7 ? (
													<span className={`badge ${st.cls}`} style={{ fontSize: "10px" }}>D-{st.days}</span>
												) : (
													<span style={{ fontSize: "12px", fontFamily: "'DM Mono',monospace", color: "var(--accent2)" }}>D-{st.days}</span>
												)}
											</td>
											<td><span className={`badge ${st.cls}`} style={{ fontSize: "10px" }}>{st.label}</span></td>
											<td>{isOpen ? "▾" : "▸"}</td>
										</tr>
										{isOpen && (
											<tr>
												<td colSpan={9} style={{ padding: 0 }}>
													<div className="member-detail" style={{ margin: "8px 12px" }}>
														<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "8px", fontWeight: 600, letterSpacing: ".5px" }}>
															CONSULTATION NOTES
														</div>
														<div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px", minHeight: "40px" }}>
															{memos.length === 0 ? (
																<div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "8px 0" }}>상담 메모가 없습니다</div>
															) : (
																memos.map((n) => (
																	<div className="memo-item" key={n.id} onClick={(e) => e.stopPropagation()}>
																		<span className="memo-date">{new Date(n.createdAt).toLocaleDateString()}</span>
																		<div style={{ flex: 1, fontSize: "12px" }}>{n.content}</div>
																		<button
																			className="btn btn-ghost btn-sm"
																			style={{ padding: "2px 6px", fontSize: "11px" }}
																			onClick={() => removeMemo(n.id)}
																		>
																			삭제
																		</button>
																	</div>
																))
															)}
														</div>
														<div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
															<input
																type="text"
																placeholder="상담 메모 입력..."
																value={memoText}
																onChange={(e) => setMemoText(e.target.value)}
																style={{
																	flex: 1, padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border)",
																	borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none",
																	fontFamily: "'Pretendard',sans-serif"
																}}
															/>
															<button className="btn btn-primary btn-sm" style={{ background: "var(--manager)", color: "#fff" }} onClick={addMemo}>
																추가
															</button>
														</div>
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

		<div className="modal-overlay" id="addMemberModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">회원 등록</div>
					<button className="modal-close" onClick={() => closeModal("addMemberModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>이름</label>
						<input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="회원 이름" />
					</div>
					<div className="form-field">
						<label>연락처</label>
						<input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="010-0000-0000" />
					</div>
					<div className="form-field">
						<label>이메일</label>
						<input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="member@example.com" />
					</div>
					<div className="form-field">
						<label>초기 비밀번호</label>
						<input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="회원에게 안내할 비밀번호" />
					</div>
					<div className="form-field">
						<label>수강권</label>
						<select value={newPassId} onChange={(e) => setNewPassId(e.target.value)}>
							{passes.length === 0 && <option value="">등록된 수강권이 없습니다</option>}
							{passes.map((p) => (
								<option key={p.id} value={p.id}>{p.name}</option>
							))}
						</select>
					</div>
					{enrollError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{enrollError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("addMemberModal")}>취소</button>
						<button className="btn btn-primary" disabled={enrolling} onClick={submitEnroll}>
							{enrolling ? "등록 중..." : "저장"}
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
