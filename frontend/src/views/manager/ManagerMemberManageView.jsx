import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listMembers, listMemberMemos, createMemberMemo, deleteMemberMemo, listPasses,
	listPrograms, registerMemberPayment, updateMemberGuardian, listJoinRequests, approveJoinRequest, rejectJoinRequest,
	createStaffInvitation, listStaffInvitations, cancelStaffInvitation,
	PAYMENT_METHOD_LABEL, CASH_RECEIPT_STATUS_LABEL, TAX_TYPE_LABEL
} from "../../api/common.js";
import { formatDateTime } from "../../utils/formatDateTime.js";

function PaymentFields({ form, setForm, programs }) {
	const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
	return (
		<>
			<div className="form-field">
				<label>수강과목/반</label>
				<select value={form.programId} onChange={set("programId")}>
					<option value="">선택 안 함</option>
					{programs.map((p) => (
						<option key={p.id} value={p.id}>{p.name}</option>
					))}
				</select>
			</div>
			<div style={{ display: "flex", gap: "8px" }}>
				<div className="form-field" style={{ flex: 1 }}>
					<label>수강 시작일</label>
					<input type="date" value={form.enrollStart} onChange={set("enrollStart")} />
				</div>
				<div className="form-field" style={{ flex: 1 }}>
					<label>수강 종료일</label>
					<input type="date" value={form.enrollEnd} onChange={set("enrollEnd")} />
				</div>
			</div>
			<div style={{ display: "flex", gap: "8px" }}>
				<div className="form-field" style={{ flex: 1 }}>
					<label>결제수단</label>
					<select value={form.paymentMethod} onChange={set("paymentMethod")}>
						{Object.entries(PAYMENT_METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
					</select>
				</div>
				<div className="form-field" style={{ flex: 1 }}>
					<label>세금 구분</label>
					<select value={form.taxType} onChange={set("taxType")}>
						{Object.entries(TAX_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
					</select>
				</div>
			</div>
			<div style={{ display: "flex", gap: "8px" }}>
				<div className="form-field" style={{ flex: 1 }}>
					<label>현금영수증</label>
					<select value={form.cashReceiptStatus} onChange={set("cashReceiptStatus")}>
						{Object.entries(CASH_RECEIPT_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
					</select>
				</div>
				<div className="form-field" style={{ flex: 1 }}>
					<label>증빙번호</label>
					<input type="text" value={form.receiptNumber} onChange={set("receiptNumber")} placeholder="카드/현금영수증 승인번호" />
				</div>
			</div>
		</>
	);
}

function deriveStatus(expiresAt) {
	const days = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
	if (days < 0) return { key: "expired", label: "만료", cls: "bs-expired", days };
	if (days <= 7) return { key: "soon", label: "임박", cls: "bs-soon", days };
	return { key: "active", label: "활성", cls: "bs-active", days };
}

// embedded: 오너 플랫폼 관리 탭 안에 넣을 때 — 탭 이름이 제목 역할을 하므로 페이지 헤더를 숨긴다
export default function ManagerMemberManageView({ platformId, embedded = false }) {
	const [members, setMembers] = useState([]);
	const [joinRequests, setJoinRequests] = useState([]); // 가입 신청(대기/승인) — 권한이 없으면 빈 목록
	const [joinNotice, setJoinNotice] = useState("");
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [expandedKey, setExpandedKey] = useState(null);
	const [expandedMember, setExpandedMember] = useState(null);
	const [memos, setMemos] = useState([]);
	const [memoText, setMemoText] = useState("");

	const [passes, setPasses] = useState([]);
	const [programs, setPrograms] = useState([]);
	// 회원 초대 — 센터가 계정을 대신 만들지 않는다. 회원이 링크로 수락하면 "수강권 등록 대기"에 올라온다.
	const [memberInvites, setMemberInvites] = useState([]);
	const [inviteMethod, setInviteMethod] = useState("email");
	const [inviteValue, setInviteValue] = useState("");
	const [inviting, setInviting] = useState(false);
	const [inviteError, setInviteError] = useState("");
	const [inviteNotice, setInviteNotice] = useState("");

	const blankPaymentForm = {
		guardianName: "", guardianPhone: "", programId: "", enrollStart: "", enrollEnd: "",
		paymentMethod: "CARD", cashReceiptStatus: "NOT_ISSUED", receiptNumber: "", taxType: "EXEMPT"
	};

	const [payMember, setPayMember] = useState(null);
	const [payPassId, setPayPassId] = useState("");
	const [payForm, setPayForm] = useState(blankPaymentForm);
	const [paying, setPaying] = useState(false);
	const [payError, setPayError] = useState("");

	const [guardianDraft, setGuardianDraft] = useState({ guardianName: "", guardianPhone: "" });
	const [savingGuardian, setSavingGuardian] = useState(false);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setMembers([]);
			setPasses([]);
			setPrograms([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const [memberList, passList, programList, joinList, invites] = await Promise.all([
				listMembers(platformId), listPasses(platformId), listPrograms(platformId),
				// 가입 신청·초대는 가입 신청 처리 권한이 있어야 보인다 — 없으면 빈 목록으로 두고 나머지는 그대로 보여준다
				listJoinRequests(platformId).catch(() => []),
				listStaffInvitations(platformId).catch(() => [])
			]);
			setJoinRequests(joinList);
			setMemberInvites(invites.filter((i) => !i.staffRole));
			setMembers(memberList);
			setPasses(passList);
			setPrograms(programList);
		} finally {
			setLoading(false);
		}
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function itemFromForm(passId, form) {
		return {
			passId,
			programId: form.programId || null,
			enrollStart: form.enrollStart || null,
			enrollEnd: form.enrollEnd || null,
			taxType: form.taxType
		};
	}

	function paymentFromForm(form) {
		return {
			paymentMethod: form.paymentMethod,
			cashReceiptStatus: form.cashReceiptStatus,
			receiptNumber: form.receiptNumber || null
		};
	}

	async function submitInvite() {
		setInviting(true);
		setInviteError("");
		try {
			const invitation = await createStaffInvitation(platformId, {
				staffRole: null,
				[inviteMethod]: inviteValue.trim()
			});
			setInviteValue("");
			closeModal("addMemberModal");
			await copyInviteLink(invitation.token);
			await refresh();
		} catch (err) {
			setInviteError(err.message || "초대를 만들지 못했습니다.");
		} finally {
			setInviting(false);
		}
	}

	async function copyInviteLink(token) {
		const link = `${window.location.origin}/invite/${token}`;
		try {
			await navigator.clipboard.writeText(link);
			setInviteNotice("초대 링크를 복사했습니다. 회원에게 전달해 주세요.");
		} catch {
			setInviteNotice(`초대 링크: ${link}`);
		}
	}

	async function cancelInvite(inv) {
		if (!window.confirm(`${inv.email || inv.phone} 초대를 취소할까요?`)) return;
		try {
			await cancelStaffInvitation(inv.id);
			await refresh();
		} catch (err) {
			alert(err.message || "취소에 실패했습니다.");
		}
	}

	// 가입 신청 승인 → 바로 수강권/프로그램 등록(결제 등록 창)으로 이어진다. 창을 닫아도 '수강권 등록 대기'로 남는다.
	async function approveRequest(r) {
		try {
			await approveJoinRequest(r.id, null);
			await refresh();
			setJoinNotice(`${r.userName}님의 가입을 승인했습니다. 수강권을 등록해 주세요.`);
			openPayModal({ userId: r.userId, name: r.userName });
		} catch (err) {
			alert(err.message || "승인에 실패했습니다.");
		}
	}

	async function rejectRequest(r) {
		const memo = window.prompt(`${r.userName}님의 가입을 반려합니다. 사유를 입력하세요 (선택)`, "");
		if (memo === null) return;
		try {
			await rejectJoinRequest(r.id, memo.trim() || null);
			await refresh();
			setJoinNotice(`${r.userName}님의 가입 신청을 반려했습니다.`);
		} catch (err) {
			alert(err.message || "반려에 실패했습니다.");
		}
	}

	function joinRequestsUi() {
		const memberIds = new Set(members.map((m) => m.userId));
		const pending = joinRequests.filter((r) => r.status === "PENDING");
		const waiting = joinRequests.filter((r) => r.status === "APPROVED" && !memberIds.has(r.userId));
		if (pending.length === 0 && waiting.length === 0 && !joinNotice) return null;
		const rowStyle = { display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderTop: "1px solid var(--border)", flexWrap: "wrap" };
		return (
			<div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "16px" }}>
				<div style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600, display: "flex", gap: "12px", alignItems: "center" }}>
					가입 신청 <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: 400 }}>대기 {pending.length} · 수강권 등록 대기 {waiting.length}</span>
					{joinNotice && <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--green)", fontWeight: 400 }}>{joinNotice}</span>}
				</div>
				{pending.map((r) => (
					<div key={r.id} style={rowStyle}>
						<div style={{ flex: 1, minWidth: "200px" }}>
							<div style={{ fontWeight: 600 }}>{r.userName} <span style={{ fontWeight: 400, fontSize: "12px", color: "var(--text-dim)" }}>{r.userEmail}{r.userPhone ? ` · ${r.userPhone}` : ""}</span></div>
							{r.message && <div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "2px" }}>신청 메모: {r.message}</div>}
						</div>
						<button className="btn btn-primary btn-sm" onClick={() => approveRequest(r)}>승인</button>
						<button className="btn btn-sm btn-danger" onClick={() => rejectRequest(r)}>반려</button>
					</div>
				))}
				{waiting.map((r) => (
					<div key={r.id} style={rowStyle}>
						<div style={{ flex: 1, minWidth: "200px" }}>
							<div style={{ fontWeight: 600 }}>{r.userName} <span style={{ fontWeight: 400, fontSize: "12px", color: "var(--text-dim)" }}>{r.userEmail}</span></div>
							<div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "2px" }}>승인됨 · 수강권 등록 대기</div>
						</div>
						<button className="btn btn-primary btn-sm" onClick={() => openPayModal({ userId: r.userId, name: r.userName })}>수강권 등록</button>
					</div>
				))}
			</div>
		);
	}

	function openPayModal(member) {
		setPayMember(member);
		setPayPassId(passes[0]?.id || "");
		setPayForm(blankPaymentForm);
		setPayError("");
		openModal("payMemberModal");
	}

	async function submitPay() {
		if (!payMember || !payPassId) return;
		setPaying(true);
		setPayError("");
		try {
			await registerMemberPayment(platformId, payMember.userId, itemFromForm(payPassId, payForm), paymentFromForm(payForm));
			closeModal("payMemberModal");
			await refresh();
		} catch (err) {
			setPayError(err.message || "결제 등록에 실패했습니다.");
		} finally {
			setPaying(false);
		}
	}

	async function saveGuardian() {
		if (!expandedMember) return;
		setSavingGuardian(true);
		try {
			await updateMemberGuardian(platformId, expandedMember.userId, guardianDraft.guardianName.trim() || null, guardianDraft.guardianPhone.trim() || null);
			await refresh();
		} finally {
			setSavingGuardian(false);
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
		setGuardianDraft({ guardianName: member.guardianName || "", guardianPhone: member.guardianPhone || "" });
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
			{!embedded && (
			<div className="page-header">
				<div className="page-title">회원 관리</div>
				<div className="page-subtitle">플랫폼 회원 목록</div>
			</div>
			)}

			<div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
				<input
					type="text"
					placeholder="이름, 이메일 검색"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{
						flex: "1",
						minWidth: "160px",
						padding: "8px 16px",
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
				<button className="btn btn-primary btn-sm" onClick={() => { setInviteError(""); openModal("addMemberModal"); }}>
					+ 회원 초대
				</button>
			</div>

			{inviteNotice && <div style={{ color: "var(--green)", fontSize: "13px", marginBottom: "12px" }}>{inviteNotice}</div>}
			{memberInvites.length > 0 && (
				<div className="card" style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
					<div style={{ fontSize: "13px", fontWeight: 600 }}>수락 대기 중인 회원 초대 {memberInvites.length}</div>
					{memberInvites.map((inv) => (
						<div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
							<span style={{ flex: 1, minWidth: "160px", fontSize: "13px" }}>
								{inv.email || inv.phone}
								<span style={{ fontSize: "11px", color: "var(--text-dim)" }}> · {formatDateTime(inv.expiresAt)}까지</span>
							</span>
							<button className="btn btn-ghost btn-sm" onClick={() => copyInviteLink(inv.token)}>링크 복사</button>
							<button className="btn btn-ghost btn-sm" onClick={() => cancelInvite(inv)}>취소</button>
						</div>
					))}
				</div>
			)}

			{joinRequestsUi()}

			<div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "16px" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr>
								<th>이름</th>
								<th>연락처</th>
								<th>이메일</th>
								<th>보호자</th>
								<th>수강권</th>
								<th>사용</th>
								<th>만료일</th>
								<th>D-day</th>
								<th>상태</th>
								<th></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={11} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : filtered.length === 0 ? (
								<tr><td colSpan={11} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>회원이 없습니다</td></tr>
							) : (
								filtered.map((m) => {
									const st = deriveStatus(m.expiresAt);
									const key = m.userId + "::" + m.passName;
									const isOpen = expandedKey === key;
									return (
										<>
										<tr key={key} onClick={() => toggleDetail(m)} style={{ cursor: "pointer" }}>
											<td style={{ fontWeight: 600 }}>{m.name}</td>
											<td style={{ fontFamily: "var(--mono)", fontSize: "12px" }}>{m.phone || "-"}</td>
											<td>{m.email}</td>
											<td style={{ fontSize: "12px" }}>
												{m.guardianName ? `${m.guardianName}${m.guardianPhone ? " / " + m.guardianPhone : ""}` : "-"}
											</td>
											<td>{m.passName}</td>
											<td style={{ fontFamily: "var(--mono)", fontSize: "12px" }}>
												{m.sessionsTotal != null ? `${m.sessionsUsed}/${m.sessionsTotal}` : `${m.sessionsUsed}회`}
											</td>
											<td style={{ fontFamily: "var(--mono)", fontSize: "12px" }}>{m.expiresAt}</td>
											<td>
												{st.key === "expired" ? (
													<span className="badge bs-expired" style={{ fontSize: "11px" }}>만료</span>
												) : st.days <= 7 ? (
													<span className={`badge ${st.cls}`} style={{ fontSize: "11px" }}>D-{st.days}</span>
												) : (
													<span style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--text)" }}>D-{st.days}</span>
												)}
											</td>
											<td><span className={`badge ${st.cls}`} style={{ fontSize: "11px" }}>{st.label}</span></td>
											<td>
												<button
													className="btn btn-ghost btn-sm"
													style={{ fontSize: "11px" }}
													onClick={(e) => { e.stopPropagation(); openPayModal(m); }}
												>
													결제 등록
												</button>
											</td>
											<td>{isOpen ? "▾" : "▸"}</td>
										</tr>
										{isOpen && (
											<tr>
												<td colSpan={11} style={{ padding: 0 }}>
													<div className="member-detail" style={{ margin: "8px 12px" }}>
														<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "8px", fontWeight: 600 }}>
															보호자 정보
														</div>
														<div style={{ display: "flex", gap: "8px", marginBottom: "16px" }} onClick={(e) => e.stopPropagation()}>
															<input
																type="text" placeholder="보호자 이름" value={guardianDraft.guardianName}
																onChange={(e) => setGuardianDraft((g) => ({ ...g, guardianName: e.target.value }))}
																style={{ flex: 1, padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none" }}
															/>
															<input
																type="tel" placeholder="보호자 연락처" value={guardianDraft.guardianPhone}
																onChange={(e) => setGuardianDraft((g) => ({ ...g, guardianPhone: e.target.value }))}
																style={{ flex: 1, padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", outline: "none" }}
															/>
															<button className="btn btn-primary btn-sm" disabled={savingGuardian} onClick={saveGuardian}>
																{savingGuardian ? "저장 중..." : "저장"}
															</button>
														</div>
														<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "8px", fontWeight: 600 }}>
															CONSULTATION NOTES
														</div>
														<div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px", minHeight: "40px" }}>
															{memos.length === 0 ? (
																<div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "8px 0" }}>상담 메모가 없습니다</div>
															) : (
																memos.map((n) => (
																	<div className="memo-item" key={n.id} onClick={(e) => e.stopPropagation()}>
																		<span className="memo-date">{new Date(n.createdAt).toLocaleDateString()}</span>
																		<div style={{ flex: 1, fontSize: "12px" }}>{n.content}</div>
																		<button
																			className="btn btn-ghost btn-sm"
																			style={{ padding: "2px 8px", fontSize: "11px" }}
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
															<button className="btn btn-primary btn-sm" onClick={addMemo}>
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
					<div className="modal-title">회원 초대</div>
					<button className="modal-close" onClick={() => closeModal("addMemberModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div style={{ display: "flex", gap: "8px" }}>
						{[["email", "이메일"], ["phone", "연락처"]].map(([key, label]) => (
							<button key={key} type="button" className={`filter-chip ${inviteMethod === key ? "active" : ""}`} onClick={() => { setInviteMethod(key); setInviteValue(""); }}>
								{label}
							</button>
						))}
					</div>
					<div className="form-field">
						<label>{inviteMethod === "email" ? "이메일" : "연락처"}</label>
						<input
							type={inviteMethod === "email" ? "email" : "tel"} value={inviteValue} onChange={(e) => setInviteValue(e.target.value)}
							placeholder={inviteMethod === "email" ? "member@example.com" : "010-0000-0000"}
						/>
					</div>
					<div style={{ fontSize: "12px", color: "var(--text-sub)", lineHeight: 1.6 }}>
						초대 링크를 회원에게 직접 전달하세요. 회원이 같은 이메일/연락처의 계정으로 가입·로그인해 수락하면 위의
						"수강권 등록 대기"에 나타나고, 그때 수강권을 등록합니다. (7일간 유효)
					</div>
					{inviteError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{inviteError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("addMemberModal")}>취소</button>
						<button className="btn btn-primary" disabled={inviting || !inviteValue.trim()} onClick={submitInvite}>
							{inviting ? "만드는 중..." : "초대 링크 만들기"}
						</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="payMemberModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">결제 등록{payMember ? ` - ${payMember.name}` : ""}</div>
					<button className="modal-close" onClick={() => closeModal("payMemberModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>수강권</label>
						<select value={payPassId} onChange={(e) => setPayPassId(e.target.value)}>
							{passes.length === 0 && <option value="">등록된 수강권이 없습니다</option>}
							{passes.map((p) => (
								<option key={p.id} value={p.id}>{p.name}</option>
							))}
						</select>
					</div>
					<PaymentFields form={payForm} setForm={setPayForm} programs={programs} />
					{payError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{payError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("payMemberModal")}>취소</button>
						<button className="btn btn-primary" disabled={paying} onClick={submitPay}>
							{paying ? "등록 중..." : "저장"}
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
