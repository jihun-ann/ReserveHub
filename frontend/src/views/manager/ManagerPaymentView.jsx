import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listPasses, createPass, deactivatePass,
	DISCOUNT_TYPES, listDiscountPolicies, createDiscountPolicy, deactivateDiscountPolicy,
	listOrders, refundOrder, partialPayOrder, getUser, listMembers, listPrograms,
	ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, CASH_RECEIPT_STATUS_LABEL
} from "../../api/common.js";

const PASS_TYPES = [
	{ value: "MONTHLY", label: "월 정액" },
	{ value: "SESSION", label: "횟수권" },
	{ value: "DAILY", label: "일일권" },
	{ value: "CUSTOM", label: "기타" }
];

const STATUS_CLS = { PENDING: "bs-pending", PARTIAL: "bs-soon", PAID: "bs-active", CANCELLED: "bs-expired", REFUNDED: "bs-expired" };

export default function ManagerPaymentView({ platformId }) {
	const [activeTab, setActiveTab] = useState("pass");
	const [loading, setLoading] = useState(true);

	const [passes, setPasses] = useState([]);
	const [programs, setPrograms] = useState([]);
	const [subscriberCounts, setSubscriberCounts] = useState({});
	const [discounts, setDiscounts] = useState([]);
	const [orders, setOrders] = useState([]);
	const [buyers, setBuyers] = useState({});

	const [passForm, setPassForm] = useState({ name: "", type: "MONTHLY", price: "", sessionCount: "", validDays: "" });
	const [passError, setPassError] = useState("");
	const [discountForm, setDiscountForm] = useState({ name: "", type: "LONG_TERM", rate: "", conditionValue: "" });
	const [discountError, setDiscountError] = useState("");

	const [refundTarget, setRefundTarget] = useState(null);
	const [refundAmount, setRefundAmount] = useState("");
	const [payMoreTarget, setPayMoreTarget] = useState(null);
	const [payMoreAmount, setPayMoreAmount] = useState("");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setPasses([]);
			setDiscounts([]);
			setOrders([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [passList, discountList, orderList, members, programList] = await Promise.all([
			listPasses(platformId),
			listDiscountPolicies(platformId),
			listOrders(platformId),
			listMembers(platformId),
			listPrograms(platformId)
		]);
		setPasses(passList);
		setDiscounts(discountList);
		setOrders(orderList);
		setPrograms(programList);

		const counts = {};
		members.forEach((m) => { counts[m.passName] = (counts[m.passName] || 0) + 1; });
		setSubscriberCounts(counts);

		const buyerIds = [...new Set(orderList.map((o) => o.userId))];
		const buyerUsers = await Promise.all(buyerIds.map((id) => getUser(id)));
		setBuyers(Object.fromEntries(buyerIds.map((id, i) => [id, buyerUsers[i]])));

		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function submitPass() {
		if (!passForm.name.trim() || !passForm.price || !passForm.validDays) return;
		setPassError("");
		try {
			await createPass(platformId, {
				name: passForm.name.trim(),
				type: passForm.type,
				price: Number(passForm.price),
				sessionCount: passForm.type === "SESSION" && passForm.sessionCount ? Number(passForm.sessionCount) : null,
				validDays: Number(passForm.validDays)
			});
			setPassForm({ name: "", type: "MONTHLY", price: "", sessionCount: "", validDays: "" });
			closeModal("passModal");
			await refresh();
		} catch (err) {
			setPassError(err.message || "수강권 추가에 실패했습니다.");
		}
	}

	async function stopPass(id) {
		await deactivatePass(id);
		await refresh();
	}

	async function submitDiscount() {
		if (!discountForm.name.trim() || !discountForm.rate) return;
		setDiscountError("");
		try {
			await createDiscountPolicy(platformId, {
				name: discountForm.name.trim(),
				type: discountForm.type,
				rate: Number(discountForm.rate),
				conditionValue: discountForm.conditionValue ? Number(discountForm.conditionValue) : null
			});
			setDiscountForm({ name: "", type: "LONG_TERM", rate: "", conditionValue: "" });
			closeModal("discountModal");
			await refresh();
		} catch (err) {
			setDiscountError(err.message || "할인 정책 추가에 실패했습니다.");
		}
	}

	async function stopDiscount(id) {
		await deactivateDiscountPolicy(id);
		await refresh();
	}

	function openRefundModal(order) {
		setRefundTarget(order);
		setRefundAmount("");
		openModal("refundModal");
	}

	async function doRefund() {
		if (!refundTarget) return;
		await refundOrder(refundTarget.id, null, refundAmount ? Number(refundAmount) : null);
		closeModal("refundModal");
		await refresh();
	}

	function openPayMoreModal(order) {
		setPayMoreTarget(order);
		setPayMoreAmount("");
		openModal("payMoreModal");
	}

	async function doPayMore() {
		if (!payMoreTarget || !payMoreAmount) return;
		await partialPayOrder(payMoreTarget.id, {
			amount: Number(payMoreAmount),
			paymentMethod: payMoreTarget.paymentMethod || "CARD",
			cashReceiptStatus: payMoreTarget.cashReceiptStatus || "NOT_ISSUED",
			receiptNumber: payMoreTarget.receiptNumber || null
		});
		closeModal("payMoreModal");
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
				<button className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>결제 현황</button>
			</div>

			{/* 수강권 목록 */}
			<div className={`tab-pane ${activeTab === "pass" ? "active" : ""}`}>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
					<button className="btn btn-primary btn-sm" onClick={() => openModal("passModal")}>+ 수강권 추가</button>
				</div>
				<div className="card" style={{ padding: "0", overflow: "hidden" }}>
					<div style={{ overflowX: "auto" }}>
						<table className="data-table">
							<thead>
								<tr><th>수강권명</th><th>금액</th><th>기간</th><th>가입자</th><th>상태</th><th></th></tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
								) : passes.length === 0 ? (
									<tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>등록된 수강권이 없습니다</td></tr>
								) : (
									passes.map((p) => (
										<tr key={p.id}>
											<td style={{ fontWeight: 600 }}>{p.name}</td>
											<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--manager)" }}>{p.price.toLocaleString()}원</td>
											<td>{p.validDays}일{p.sessionCount ? ` / ${p.sessionCount}회` : ""}</td>
											<td>{subscriberCounts[p.name] || 0}명</td>
											<td>
												<span className={`badge ${p.isActive ? "bs-active" : "bs-expired"}`} style={{ fontSize: "10px" }}>
													{p.isActive ? "판매중" : "중단"}
												</span>
											</td>
											<td>
												{p.isActive && (
													<button className="btn btn-ghost btn-sm" onClick={() => stopPass(p.id)}>판매 중단</button>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* 할인 정책 */}
			<div className={`tab-pane ${activeTab === "discount" ? "active" : ""}`}>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
					<button className="btn btn-primary btn-sm" onClick={() => openModal("discountModal")}>+ 할인 정책 추가</button>
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
								<button className="btn btn-ghost btn-sm" onClick={() => stopDiscount(d.id)}>비활성화</button>
							</div>
						))
					)}
				</div>
			</div>

			{/* 결제 현황 */}
			<div className={`tab-pane ${activeTab === "history" ? "active" : ""}`}>
				<div className="card" style={{ padding: "0", overflow: "hidden" }}>
					<div style={{ overflowX: "auto" }}>
						<table className="data-table">
							<thead>
								<tr>
									<th>결제일</th><th>회원</th><th>보호자</th><th>수강권</th><th>과목/반</th><th>수강기간</th>
									<th>금액</th><th>할인</th><th>실수납</th><th>결제수단</th><th>현금영수증</th><th>증빙번호</th>
									<th>상태</th><th>환불금액</th><th>환불일</th><th></th>
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr><td colSpan={16} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
								) : orders.length === 0 ? (
									<tr><td colSpan={16} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>결제 내역이 없습니다</td></tr>
								) : (
									orders.map((o) => {
										const statusLabel = ORDER_STATUS_LABEL[o.status] || o.status;
										const cls = STATUS_CLS[o.status] || "";
										const passNames = o.items.map((i) => passes.find((p) => p.id === i.passId)?.name || "-").join(", ");
										const programNames = [...new Set(
											o.items.map((i) => (i.programId && programs.find((p) => p.id === i.programId)?.name) || null).filter(Boolean)
										)].join(", ") || "-";
										const period = o.items[0]?.enrollStart
											? `${o.items[0].enrollStart} ~ ${o.items[0].enrollEnd || ""}`
											: "-";
										const buyer = buyers[o.userId];
										return (
											<tr key={o.id}>
												<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
													{o.paidAt ? new Date(o.paidAt).toLocaleDateString() : "-"}
												</td>
												<td style={{ fontWeight: 600 }}>{buyer?.name || buyer?.email || "-"}</td>
												<td style={{ fontSize: "12px" }}>
													{buyer?.guardianName ? `${buyer.guardianName}${buyer.guardianPhone ? " / " + buyer.guardianPhone : ""}` : "-"}
												</td>
												<td>{passNames}</td>
												<td>{programNames}</td>
												<td style={{ fontSize: "12px" }}>{period}</td>
												<td style={{ fontFamily: "'DM Mono',monospace" }}>{o.originalAmount.toLocaleString()}</td>
												<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--accent3)" }}>-{o.discountAmount.toLocaleString()}</td>
												<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--manager)" }}>{o.paidAmount.toLocaleString()}</td>
												<td>{o.paymentMethod ? PAYMENT_METHOD_LABEL[o.paymentMethod] : "-"}</td>
												<td>{CASH_RECEIPT_STATUS_LABEL[o.cashReceiptStatus] || "-"}</td>
												<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>{o.receiptNumber || "-"}</td>
												<td><span className={`badge ${cls}`} style={{ fontSize: "10px" }}>{statusLabel}</span></td>
												<td style={{ fontFamily: "'DM Mono',monospace" }}>{o.refundAmount ? o.refundAmount.toLocaleString() : "-"}</td>
												<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
													{o.refundedAt ? new Date(o.refundedAt).toLocaleDateString() : "-"}
												</td>
												<td style={{ display: "flex", gap: "4px" }}>
													{o.status === "PARTIAL" && (
														<button className="btn btn-ghost btn-sm" onClick={() => openPayMoreModal(o)}>추가 납부</button>
													)}
													{(o.status === "PAID" || o.status === "PARTIAL") && (
														<button className="btn btn-ghost btn-sm" onClick={() => openRefundModal(o)}>환불</button>
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
		</div>

		<div className="modal-overlay" id="passModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">수강권 추가</div>
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
					<div className="modal-title">할인 정책 추가</div>
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

		<div className="modal-overlay" id="refundModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">환불 처리</div>
					<button className="modal-close" onClick={() => closeModal("refundModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>환불 금액 (비워두면 잔여 전액 환불)</label>
						<input
							type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
							placeholder={refundTarget ? `최대 ${(refundTarget.paidAmount - refundTarget.refundAmount).toLocaleString()}` : ""}
						/>
					</div>
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("refundModal")}>취소</button>
						<button className="btn btn-primary" onClick={doRefund}>환불 확정</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="payMoreModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">추가 납부</div>
					<button className="modal-close" onClick={() => closeModal("payMoreModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>납부 금액 (잔액 {payMoreTarget ? (payMoreTarget.finalAmount - payMoreTarget.paidAmount).toLocaleString() : 0}원)</label>
						<input type="number" value={payMoreAmount} onChange={(e) => setPayMoreAmount(e.target.value)} />
					</div>
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("payMoreModal")}>취소</button>
						<button className="btn btn-primary" onClick={doPayMore}>납부 확정</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
