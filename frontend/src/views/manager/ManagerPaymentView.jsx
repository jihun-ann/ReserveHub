import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listPasses, createPass, updatePass, deactivatePass,
	DISCOUNT_TYPES, listDiscountPolicies, createDiscountPolicy, updateDiscountPolicy, deactivateDiscountPolicy,
	listMembers, createProgram, updateProgram, listPrograms, PROGRAM_TYPE_LABEL, ENROLLMENT_MODE_LABEL
} from "../../api/common.js";

const PASS_TYPES = [
	{ value: "MONTHLY", label: "월 정액" },
	{ value: "SESSION", label: "횟수권" },
	{ value: "DAILY", label: "일일권" },
	{ value: "CUSTOM", label: "기타" }
];

const STATUS_CLS = { PENDING: "bs-pending", PARTIAL: "bs-soon", PAID: "bs-active", CANCELLED: "bs-expired", REFUNDED: "bs-expired" };

const EMPTY_PASS_FORM = {
	name: "", type: "MONTHLY", price: "", sessionCount: "", validDays: "",
	programType: "GROUP", enrollmentMode: "FIXED", capacity: "8", durationMin: "60"
};
const EMPTY_DISCOUNT_FORM = { name: "", type: "LONG_TERM", rate: "", conditionValue: "" };

export default function ManagerPaymentView({ platformId }) {
	const [activeTab, setActiveTab] = useState("pass");
	const [loading, setLoading] = useState(true);

	const [passes, setPasses] = useState([]);
	const [programs, setPrograms] = useState([]);
	const [subscriberCounts, setSubscriberCounts] = useState({});
	const [discounts, setDiscounts] = useState([]);

	const [passForm, setPassForm] = useState(EMPTY_PASS_FORM);
	const [editingPassId, setEditingPassId] = useState(null);
	const [passError, setPassError] = useState("");
	const [discountForm, setDiscountForm] = useState(EMPTY_DISCOUNT_FORM);
	const [editingDiscountId, setEditingDiscountId] = useState(null);
	const [discountError, setDiscountError] = useState("");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setPasses([]);
			setDiscounts([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [passList, discountList, members, programList] = await Promise.all([
			listPasses(platformId),
			listDiscountPolicies(platformId),
			listMembers(platformId),
			listPrograms(platformId)
		]);
		setPasses(passList);
		setDiscounts(discountList);
		setPrograms(programList);

		const counts = {};
		members.forEach((m) => { counts[m.passName] = (counts[m.passName] || 0) + 1; });
		setSubscriberCounts(counts);

		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function openCreatePassModal() {
		setEditingPassId(null);
		setPassForm(EMPTY_PASS_FORM);
		setPassError("");
		openModal("passModal");
	}

	function openEditPassModal(pass) {
		const program = programs.find((pr) => pr.passId === pass.id);
		setEditingPassId(pass.id);
		setPassForm({
			name: pass.name, type: pass.type, price: String(pass.price),
			sessionCount: pass.sessionCount != null ? String(pass.sessionCount) : "", validDays: String(pass.validDays),
			programType: program?.type || "GROUP", enrollmentMode: program?.enrollmentMode || "FIXED",
			capacity: program ? String(program.capacity) : "8", durationMin: program ? String(program.durationMin) : "60"
		});
		setPassError("");
		openModal("passModal");
	}

	async function submitPass() {
		if (!passForm.name.trim() || !passForm.price || !passForm.validDays || !passForm.capacity || !passForm.durationMin) return;
		setPassError("");
		try {
			const passPayload = {
				name: passForm.name.trim(),
				type: passForm.type,
				price: Number(passForm.price),
				sessionCount: passForm.type === "SESSION" && passForm.sessionCount ? Number(passForm.sessionCount) : null,
				validDays: Number(passForm.validDays)
			};
			const programPayload = {
				type: passForm.programType,
				enrollmentMode: passForm.programType === "GROUP" ? passForm.enrollmentMode : null,
				capacity: Number(passForm.capacity),
				durationMin: Number(passForm.durationMin)
			};
			if (editingPassId) {
				await updatePass(editingPassId, passPayload);
				const program = programs.find((pr) => pr.passId === editingPassId);
				if (program) await updateProgram(program.id, programPayload);
				else await createProgram(platformId, { ...programPayload, passId: editingPassId });
			} else {
				// 수강권과 이 수강권으로 듣는 수업(프로그램)을 한 번에 만든다 — 프로그램명은 항상 수강권명을 따른다.
				const pass = await createPass(platformId, passPayload);
				await createProgram(platformId, { ...programPayload, passId: pass.id });
			}
			setPassForm(EMPTY_PASS_FORM);
			setEditingPassId(null);
			closeModal("passModal");
			await refresh();
		} catch (err) {
			setPassError(err.message || "수강권 저장에 실패했습니다.");
		}
	}

	async function stopPass(id) {
		await deactivatePass(id);
		await refresh();
	}

	function openCreateDiscountModal() {
		setEditingDiscountId(null);
		setDiscountForm(EMPTY_DISCOUNT_FORM);
		setDiscountError("");
		openModal("discountModal");
	}

	function openEditDiscountModal(d) {
		setEditingDiscountId(d.id);
		setDiscountForm({
			name: d.name, type: d.type, rate: String(d.rate), conditionValue: d.conditionValue != null ? String(d.conditionValue) : ""
		});
		setDiscountError("");
		openModal("discountModal");
	}

	async function submitDiscount() {
		if (!discountForm.name.trim() || !discountForm.rate) return;
		setDiscountError("");
		try {
			const payload = {
				name: discountForm.name.trim(),
				type: discountForm.type,
				rate: Number(discountForm.rate),
				conditionValue: discountForm.conditionValue ? Number(discountForm.conditionValue) : null
			};
			if (editingDiscountId) await updateDiscountPolicy(editingDiscountId, payload);
			else await createDiscountPolicy(platformId, payload);
			setDiscountForm(EMPTY_DISCOUNT_FORM);
			setEditingDiscountId(null);
			closeModal("discountModal");
			await refresh();
		} catch (err) {
			setDiscountError(err.message || "할인 정책 저장에 실패했습니다.");
		}
	}

	async function stopDiscount(id) {
		await deactivateDiscountPolicy(id);
		await refresh();
	}

	return (
		<>
		<div className="page" id="manager-payment">
			<div className="page-header">
				<div className="page-label">Payment</div>
				<div className="page-title">수강권 / 결제 정책</div>
				<div className="page-subtitle">수강권과 할인 정책을 관리하세요</div>
			</div>
			<div className="tab-row">
				<button className={`tab-btn ${activeTab === "pass" ? "active" : ""}`} onClick={() => setActiveTab("pass")}>수강권 목록</button>
				<button className={`tab-btn ${activeTab === "discount" ? "active" : ""}`} onClick={() => setActiveTab("discount")}>할인 정책</button>
			</div>

			{/* 수강권 목록 */}
			<div className={`tab-pane ${activeTab === "pass" ? "active" : ""}`}>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
					<button className="btn btn-primary btn-sm" onClick={openCreatePassModal}>+ 수강권 추가</button>
				</div>
				<div className="card" style={{ padding: "0", overflow: "hidden" }}>
					<div style={{ overflowX: "auto" }}>
						<table className="data-table">
							<thead>
								<tr><th>수강권명</th><th>금액</th><th>기간</th><th>수업 유형</th><th>가입자</th><th>상태</th><th></th></tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
								) : passes.length === 0 ? (
									<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>등록된 수강권이 없습니다</td></tr>
								) : (
									passes.map((p) => {
										const program = programs.find((pr) => pr.passId === p.id);
										return (
										<tr key={p.id}>
											<td style={{ fontWeight: 600 }}>{p.name}</td>
											<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--manager)" }}>{p.price.toLocaleString()}원</td>
											<td>{p.validDays}일{p.sessionCount ? ` / ${p.sessionCount}회` : ""}</td>
											<td style={{ fontSize: "12px" }}>
												{program ? (
													<>
														{PROGRAM_TYPE_LABEL[program.type] || program.type}
														{program.type === "GROUP" && ` · ${ENROLLMENT_MODE_LABEL[program.enrollmentMode] || program.enrollmentMode}`}
														{` · 최대 ${program.capacity}명`}
													</>
												) : (
													<span style={{ color: "var(--text-dim)" }}>-</span>
												)}
											</td>
											<td>{subscriberCounts[p.name] || 0}명</td>
											<td>
												<span className={`badge ${p.isActive ? "bs-active" : "bs-expired"}`} style={{ fontSize: "10px" }}>
													{p.isActive ? "판매중" : "중단"}
												</span>
											</td>
											<td style={{ display: "flex", gap: "4px" }}>
												<button className="btn btn-ghost btn-sm" onClick={() => openEditPassModal(p)}>수정</button>
												{p.isActive && (
													<button className="btn btn-ghost btn-sm" onClick={() => stopPass(p.id)}>판매 중단</button>
												)}
											</td>
										</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* 할인 정책 */}
			<div className={`tab-pane ${activeTab === "discount" ? "active" : ""}`}>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
					<button className="btn btn-primary btn-sm" onClick={openCreateDiscountModal}>+ 할인 정책 추가</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					{loading ? (
						<div style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>불러오는 중...</div>
					) : discounts.length === 0 ? (
						<div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--text-dim)" }}>등록된 할인 정책이 없습니다</div>
					) : (
						discounts.map((d) => (
							<div className="card" key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
								<div>
									<div style={{ fontWeight: 600 }}>{d.name}</div>
									<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
										{DISCOUNT_TYPES.find((t) => t.value === d.type)?.label || d.type} · {d.rate}% 할인
										{d.conditionValue != null ? ` · 조건값 ${d.conditionValue}` : ""}
									</div>
								</div>
								<div style={{ display: "flex", gap: "4px" }}>
									<button className="btn btn-ghost btn-sm" onClick={() => openEditDiscountModal(d)}>수정</button>
									<button className="btn btn-ghost btn-sm" onClick={() => stopDiscount(d.id)}>비활성화</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="passModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">{editingPassId ? "수강권 수정" : "수강권 추가"}</div>
					<button className="modal-close" onClick={() => closeModal("passModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>수강권명</label>
						<input type="text" value={passForm.name} onChange={(e) => setPassForm({ ...passForm, name: e.target.value })} placeholder="예: 그룹 월정액" />
					</div>
					<div className="form-field">
						<label>유형</label>
						<select value={passForm.type} onChange={(e) => setPassForm({ ...passForm, type: e.target.value })}>
							{PASS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</div>
					<div className="form-field">
						<label>금액</label>
						<input type="number" value={passForm.price} onChange={(e) => setPassForm({ ...passForm, price: e.target.value })} placeholder="95000" />
					</div>
					{passForm.type === "SESSION" && (
						<div className="form-field">
							<label>횟수</label>
							<input type="number" value={passForm.sessionCount} onChange={(e) => setPassForm({ ...passForm, sessionCount: e.target.value })} placeholder="10" />
						</div>
					)}
					<div className="form-field">
						<label>기간 (일)</label>
						<input type="number" value={passForm.validDays} onChange={(e) => setPassForm({ ...passForm, validDays: e.target.value })} placeholder="30" />
					</div>
					<div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
						<div style={{ fontSize: "11px", color: "var(--text-dim)", marginBottom: "10px" }}>
							이 수강권으로 듣는 수업 — "수업 관리" 메뉴에서 강사 배정에 사용됩니다.
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
							<div className="form-field">
								<label>수업 유형</label>
								<select value={passForm.programType} onChange={(e) => setPassForm({ ...passForm, programType: e.target.value })}>
									<option value="GROUP">그룹반</option>
									<option value="PRIVATE">개인수업</option>
								</select>
							</div>
							{passForm.programType === "GROUP" && (
								<div className="form-field">
									<label>운영 방식</label>
									<select value={passForm.enrollmentMode} onChange={(e) => setPassForm({ ...passForm, enrollmentMode: e.target.value })}>
										<option value="FIXED">고정형 (수업 관리에서 대상자 지정)</option>
										<option value="APPLICATION">신청형 (매주 학생이 직접 신청)</option>
									</select>
								</div>
							)}
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
								<div className="form-field">
									<label>최대 인원</label>
									<input type="number" min="1" value={passForm.capacity} onChange={(e) => setPassForm({ ...passForm, capacity: e.target.value })} />
								</div>
								<div className="form-field">
									<label>수업 시간 (분)</label>
									<input type="number" min="1" value={passForm.durationMin} onChange={(e) => setPassForm({ ...passForm, durationMin: e.target.value })} />
								</div>
							</div>
						</div>
					</div>
					{passError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{passError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("passModal")}>취소</button>
						<button className="btn btn-primary" onClick={submitPass}>저장</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="discountModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">{editingDiscountId ? "할인 정책 수정" : "할인 정책 추가"}</div>
					<button className="modal-close" onClick={() => closeModal("discountModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>정책명</label>
						<input type="text" value={discountForm.name} onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })} placeholder="예: 장기 등록 할인" />
					</div>
					<div className="form-field">
						<label>적용 조건</label>
						<select value={discountForm.type} onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value })}>
							{DISCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</div>
					<div className="form-field">
						<label>할인율 (%)</label>
						<input type="number" value={discountForm.rate} onChange={(e) => setDiscountForm({ ...discountForm, rate: e.target.value })} placeholder="10" />
					</div>
					<div className="form-field">
						<label>조건값 (장기: 개월수 / 가족: 인원수, 선택)</label>
						<input type="number" value={discountForm.conditionValue} onChange={(e) => setDiscountForm({ ...discountForm, conditionValue: e.target.value })} placeholder="3" />
					</div>
					{discountError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{discountError}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("discountModal")}>취소</button>
						<button className="btn btn-primary" onClick={submitDiscount}>저장</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
