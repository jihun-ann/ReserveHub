import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listMembers, listMemberMemos, createMemberMemo, deleteMemberMemo, listPasses, enrollMember,
	listPrograms, registerMemberPayment, updateMemberGuardian,
	PAYMENT_METHOD_LABEL, CASH_RECEIPT_STATUS_LABEL, TAX_TYPE_LABEL
} from "../../api/common.js";

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
	const [programs, setPrograms] = useState([]);
	const [newName, setNewName] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [newPassId, setNewPassId] = useState("");
	const [enrolling, setEnrolling] = useState(false);
	const [enrollError, setEnrollError] = useState("");

	const blankPaymentForm = {
		guardianName: "", guardianPhone: "", programId: "", enrollStart: "", enrollEnd: "",
		paymentMethod: "CARD", cashReceiptStatus: "NOT_ISSUED", receiptNumber: "", taxType: "EXEMPT"
	};
	const [paymentForm, setPaymentForm] = useState(blankPaymentForm);

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
		const [memberList, passList, programList] = await Promise.all([
			listMembers(platformId), listPasses(platformId), listPrograms(platformId)
		]);
		setMembers(memberList);
		setPasses(passList);
		setPrograms(programList);
		setNewPassId((prev) => prev || passList[0]?.id || "");
		setLoading(false);
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

	async function submitEnroll() {
		if (!newName.trim() || !newEmail.trim() || !newPassword.trim() || !newPassId) return;
		setEnrolling(true);
		setEnrollError("");
		try {
			await enrollMember(
				platformId, newEmail.trim(), newPassword.trim(), newName.trim(), newPhone.trim() || null,
				itemFromForm(newPassId, paymentForm), paymentFromForm(paymentForm),
				{ guardianName: paymentForm.guardianName.trim() || null, guardianPhone: paymentForm.guardianPhone.trim() || null }
			);
			setNewName("");
			setNewPhone("");
			setNewEmail("");
			setNewPassword("");
			setPaymentForm(blankPaymentForm);
			closeModal("addMemberModal");
			await refresh();
		} catch (err) {
			setEnrollError(err.message || "회원 등록에 실패했습니다.");
		} finally {
			setEnrolling(false);
		}
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
											<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{m.phone || "-"}</td>
											<td>{m.email}</td>
											<td style={{ fontSize: "12px" }}>
												{m.guardianName ? `${m.guardianName}${m.guardianPhone ? " / " + m.guardianPhone : ""}` : "-"}
											</td>
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
														<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "8px", fontWeight: 600, letterSpacing: ".5px" }}>
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
					<div style={{ display: "flex", gap: "8px" }}>
						<div className="form-field" style={{ flex: 1 }}>
							<label>보호자 이름</label>
							<input type="text" value={paymentForm.guardianName} onChange={(e) => setPaymentForm((f) => ({ ...f, guardianName: e.target.value }))} />
						</div>
						<div className="form-field" style={{ flex: 1 }}>
							<label>보호자 연락처</label>
							<input type="tel" value={paymentForm.guardianPhone} onChange={(e) => setPaymentForm((f) => ({ ...f, guardianPhone: e.target.value }))} />
						</div>
					</div>
					<PaymentFields form={paymentForm} setForm={setPaymentForm} programs={programs} />
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
