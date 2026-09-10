import { useState, Fragment } from "react";

const STATUS_STYLE = {
	PENDING: { label: "대기 중", color: "var(--accent3)" },
	APPROVED: { label: "승인됨", color: "var(--green)" },
	REJECTED: { label: "반려됨", color: "var(--red)" }
};

function formatDateTime(iso) {
	if (!iso) return "-";
	return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// 승인 요청 목록을 표로 보여준다 — 요청자 이름으로 검색하고, 행을 클릭하면 그 아래에 상세 내용이 펼쳐진다.
// 유형별 상세/처리 UI는 renderDetail이 맡는다(오너/매니저 화면마다 다르므로 이 컴포넌트는 표만 책임진다).
export default function ApprovalRequestsTable({ rows, expandedId, onToggle, renderDetail }) {
	const [search, setSearch] = useState("");

	const term = search.trim().toLowerCase();
	const visible = term
		? rows.filter((r) => r.requesterName?.toLowerCase().includes(term) || r.kindLabel?.toLowerCase().includes(term))
		: rows;

	return (
		<div>
			<div className="form-field" style={{ maxWidth: "280px", marginBottom: "14px" }}>
				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="요청자 이름으로 검색"
				/>
			</div>

			<div className="card" style={{ padding: "0", overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr>
								<th>유형</th>
								<th>요청자</th>
								<th>요청일시</th>
								<th>상태</th>
								<th>처리자</th>
								<th>처리일시</th>
							</tr>
						</thead>
						<tbody>
							{visible.length === 0 ? (
								<tr><td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>해당 조건의 요청이 없습니다</td></tr>
							) : (
								visible.map((r) => {
									const st = STATUS_STYLE[r.status];
									const isOpen = expandedId === r.id;
									return (
										<Fragment key={r.id}>
											<tr
												onClick={() => onToggle(isOpen ? null : r.id)}
												style={{ cursor: "pointer", background: isOpen ? "var(--surface2)" : undefined }}
											>
												<td>{r.kindLabel}</td>
												<td style={{ fontWeight: 600 }}>{r.requesterName}</td>
												<td style={{ fontSize: "12px", color: "var(--text-sub)" }}>{formatDateTime(r.createdAt)}</td>
												<td><span className="res-status" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span></td>
												<td style={{ fontSize: "12px", color: "var(--text-sub)" }}>{r.deciderName || "-"}</td>
												<td style={{ fontSize: "12px", color: "var(--text-sub)" }}>{r.status === "PENDING" ? "-" : formatDateTime(r.decidedAt)}</td>
											</tr>
											{isOpen && (
												<tr>
													<td colSpan={6} style={{ background: "var(--surface2)", padding: "16px" }}>
														{renderDetail(r.id)}
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
	);
}
