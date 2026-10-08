import { Fragment, useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listPasses, listPrograms, listOrders, refundOrder, partialPayOrder, getUser,
	ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, CASH_RECEIPT_STATUS_LABEL
} from "../../api/common.js";

const STATUS_CLS = { PENDING: "bs-pending", PARTIAL: "bs-soon", PAID: "bs-active", CANCELLED: "bs-expired", REFUNDED: "bs-expired" };

export default function ManagerPaymentHistoryView({ platformId }) {
	const [loading, setLoading] = useState(true);
	const [orders, setOrders] = useState([]);
	const [passes, setPasses] = useState([]);
	const [programs, setPrograms] = useState([]);
	const [usersById, setUsersById] = useState({});
	const [expandedId, setExpandedId] = useState(null);

	const [refundTarget, setRefundTarget] = useState(null);
	const [refundAmount, setRefundAmount] = useState("");
	const [payMoreTarget, setPayMoreTarget] = useState(null);
	const [payMoreAmount, setPayMoreAmount] = useState("");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setOrders([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [orderList, passList, programList] = await Promise.all([
			listOrders(platformId),
			listPasses(platformId),
			listPrograms(platformId)
		]);
		setOrders(orderList);
		setPasses(passList);
		setPrograms(programList);

		// 구매자(userId)와 결제 처리자(processedBy) 둘 다 같은 사용자 조회 API로 이름을 가져온다.
		const userIds = [...new Set(orderList.flatMap((o) => [o.userId, o.processedBy]).filter(Boolean))];
		const users = await Promise.all(userIds.map((id) => getUser(id).catch(() => null)));
		setUsersById(Object.fromEntries(userIds.map((id, i) => [id, users[i]])));

		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function openRefundModal(order) {
		setRefundTarget(order);
		setRefundAmount("");
		openModal("historyRefundModal");
	}

	async function doRefund() {
		if (!refundTarget) return;
		await refundOrder(refundTarget.id, null, refundAmount ? Number(refundAmount) : null);
		closeModal("historyRefundModal");
		await refresh();
	}

	function openPayMoreModal(order) {
		setPayMoreTarget(order);
		setPayMoreAmount("");
		openModal("historyPayMoreModal");
	}

	async function doPayMore() {
		if (!payMoreTarget || !payMoreAmount) return;
		await partialPayOrder(payMoreTarget.id, {
			amount: Number(payMoreAmount),
			paymentMethod: payMoreTarget.paymentMethod || "CARD",
			cashReceiptStatus: payMoreTarget.cashReceiptStatus || "NOT_ISSUED",
			receiptNumber: payMoreTarget.receiptNumber || null
		});
		closeModal("historyPayMoreModal");
		await refresh();
	}

	return (
		<>
		<div className="page" id="manager-payment-history">
			<div className="page-header">
				<div className="page-label">Payment History</div>
				<div className="page-title">결제 이력</div>
				<div className="page-subtitle">행을 클릭하면 상세 내역을 볼 수 있습니다</div>
			</div>
			<div className="card" style={{ padding: "0", overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr>
								<th>결제일</th><th>회원</th><th>금액</th><th>결제수단</th><th>처리자</th><th>상태</th>
							</tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : orders.length === 0 ? (
								<tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>결제 내역이 없습니다</td></tr>
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
									const buyer = usersById[o.userId];
									const processor = usersById[o.processedBy];
									const expanded = expandedId === o.id;
									return (
										<Fragment key={o.id}>
										<tr
											onClick={() => setExpandedId(expanded ? null : o.id)}
											style={{ cursor: "pointer", background: expanded ? "var(--surface-alt, rgba(var(--manager-rgb),0.06))" : undefined }}
										>
											<td style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
												{o.paidAt ? new Date(o.paidAt).toLocaleDateString() : "-"}
											</td>
											<td style={{ fontWeight: 600 }}>{buyer?.name || buyer?.email || "-"}</td>
											<td style={{ fontFamily: "'DM Mono',monospace", color: "var(--manager)" }}>{o.paidAmount.toLocaleString()}원</td>
											<td>{o.paymentMethod ? PAYMENT_METHOD_LABEL[o.paymentMethod] : "-"}</td>
											<td>{processor?.name || processor?.email || "-"}</td>
											<td><span className={`badge ${cls}`} style={{ fontSize: "10px" }}>{statusLabel}</span></td>
										</tr>
										{expanded && (
											<tr>
												<td colSpan={6} style={{ padding: "16px 20px", background: "var(--bg)" }}>
													<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px 24px", marginBottom: "16px" }}>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>연락처</span><div>{buyer?.phone || "-"}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>보호자</span><div>{buyer?.guardianName ? `${buyer.guardianName}${buyer.guardianPhone ? " / " + buyer.guardianPhone : ""}` : "-"}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>수강권</span><div>{passNames}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>과목/반</span><div>{programNames}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>수강기간</span><div>{period}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>원금</span><div style={{ fontFamily: "'DM Mono',monospace" }}>{o.originalAmount.toLocaleString()}원</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>할인</span><div style={{ fontFamily: "'DM Mono',monospace", color: "var(--accent3)" }}>-{o.discountAmount.toLocaleString()}원</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>현금영수증</span><div>{CASH_RECEIPT_STATUS_LABEL[o.cashReceiptStatus] || "-"}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>증빙번호</span><div style={{ fontFamily: "'DM Mono',monospace" }}>{o.receiptNumber || "-"}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>환불금액</span><div style={{ fontFamily: "'DM Mono',monospace" }}>{o.refundAmount ? o.refundAmount.toLocaleString() + "원" : "-"}</div></div>
														<div><span style={{ color: "var(--text-dim)", fontSize: "12px" }}>환불일</span><div>{o.refundedAt ? new Date(o.refundedAt).toLocaleDateString() : "-"}</div></div>
													</div>
													<div style={{ display: "flex", gap: "8px" }}>
														{o.status === "PARTIAL" && (
															<button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openPayMoreModal(o); }}>추가 납부</button>
														)}
														{(o.status === "PAID" || o.status === "PARTIAL") && (
															<button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openRefundModal(o); }}>환불</button>
														)}
													</div>
												</td>
											</tr>
										)}
										</Fragment>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="historyRefundModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">환불 처리</div>
					<button className="modal-close" onClick={() => closeModal("historyRefundModal")}>✕</button>
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
						<button className="btn btn-ghost" onClick={() => closeModal("historyRefundModal")}>취소</button>
						<button className="btn btn-primary" onClick={doRefund}>환불 확정</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="historyPayMoreModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">추가 납부</div>
					<button className="modal-close" onClick={() => closeModal("historyPayMoreModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>납부 금액 (잔액 {payMoreTarget ? (payMoreTarget.finalAmount - payMoreTarget.paidAmount).toLocaleString() : 0}원)</label>
						<input type="number" value={payMoreAmount} onChange={(e) => setPayMoreAmount(e.target.value)} />
					</div>
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("historyPayMoreModal")}>취소</button>
						<button className="btn btn-primary" onClick={doPayMore}>납부 확정</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
