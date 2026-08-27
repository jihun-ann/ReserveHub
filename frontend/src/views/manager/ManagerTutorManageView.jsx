import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { listStaff, removeStaff, getUser, enrollTutor } from "../../api/common.js";

export default function ManagerTutorManageView({ platformId }) {
	const [tutors, setTutors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [newName, setNewName] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [enrolling, setEnrolling] = useState(false);
	const [enrollError, setEnrollError] = useState("");
	const [expandedId, setExpandedId] = useState(null);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setTutors([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const staff = (await listStaff(platformId, true)).filter((s) => s.staffRole === "ADMIN");
		const withDetail = await Promise.all(
			staff.map(async (s) => {
				const u = await getUser(s.userId);
				return { ...s, email: u.email, name: u.name, phone: u.phone };
			})
		);
		setTutors(withDetail);
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function submitEnroll() {
		if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
		setEnrolling(true);
		setEnrollError("");
		try {
			await enrollTutor(platformId, newEmail.trim(), newPassword.trim(), newName.trim(), newPhone.trim() || null);
			setNewName("");
			setNewPhone("");
			setNewEmail("");
			setNewPassword("");
			closeModal("addInstructorModal");
			await refresh();
		} catch (err) {
			setEnrollError(err.message || "강사 등록에 실패했습니다.");
		} finally {
			setEnrolling(false);
		}
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
				<div className="page-subtitle">소속 강사를 등록하고 관리하세요</div>
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
				<button className="btn btn-primary btn-sm" onClick={() => openModal("addInstructorModal")}>
					+ 강사 등록
				</button>
			</div>

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
														{t.isActive && (
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

		<div className="modal-overlay" id="addInstructorModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">강사 등록</div>
					<button className="modal-close" onClick={() => closeModal("addInstructorModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>이름</label>
						<input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="강사 이름" />
					</div>
					<div className="form-field">
						<label>연락처</label>
						<input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="010-0000-0000" />
					</div>
					<div className="form-field">
						<label>이메일</label>
						<input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="tutor@example.com" />
					</div>
					<div className="form-field">
						<label>초기 비밀번호</label>
						<input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="강사에게 안내할 비밀번호" />
					</div>
					{enrollError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{enrollError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("addInstructorModal")}>취소</button>
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
