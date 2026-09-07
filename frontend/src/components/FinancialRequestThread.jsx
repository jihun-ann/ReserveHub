import { useState, useEffect, useCallback, useRef } from "react";
import { listFinancialRequestComments, addFinancialRequestComment, financialRequestAttachmentUrl } from "../api/common.js";
import { formatDateTime } from "../utils/formatDateTime.js";

const ROLE_LABEL = { OWNER: "오너", MANAGER: "매니저", TUTOR: "강사", TAX_ACCOUNTANT: "세무사" };

function formatFileSize(bytes) {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// 재무 요청(FinancialRequest) 하나에 달린 댓글 스레드 — 세무사/매니저/오너가 이어서 댓글을 달거나
// 파일을 첨부할 수 있다. 세무사 화면(TaxAccountantCalendarView)과 매니저 승인 화면(ManagerApprovalView)
// 양쪽에서 같은 요청을 두고 대화해야 하므로 두 화면 모두에서 재사용한다.
export default function FinancialRequestThread({ requestId }) {
	const [comments, setComments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [text, setText] = useState("");
	const [file, setFile] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const fileInputRef = useRef(null);

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			setComments(await listFinancialRequestComments(requestId));
		} finally {
			setLoading(false);
		}
	}, [requestId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	async function handleSubmit(e) {
		e.preventDefault();
		if (!text.trim() && !file) return;
		setSubmitting(true);
		try {
			await addFinancialRequestComment(requestId, { content: text, file });
			setText("");
			setFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			await refresh();
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
			{loading ? (
				<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>댓글 불러오는 중...</div>
			) : comments.length === 0 ? (
				<div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "10px" }}>아직 댓글이 없습니다</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
					{comments.map((c) => (
						<div key={c.id} style={{ fontSize: "12px" }}>
							<div style={{ display: "flex", gap: "6px", alignItems: "baseline", color: "var(--text-dim)" }}>
								<span style={{ fontWeight: 700, color: "var(--text)" }}>{c.authorName}</span>
								<span>{ROLE_LABEL[c.authorRole] || c.authorRole}</span>
								<span>·</span>
								<span>{formatDateTime(c.createdAt)}</span>
							</div>
							{c.content && <div style={{ marginTop: "4px", color: "var(--text)", whiteSpace: "pre-wrap" }}>{c.content}</div>}
							{c.attachmentName && (
								<a
									href={financialRequestAttachmentUrl(requestId, c.id)}
									target="_blank"
									rel="noreferrer"
									style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px", color: "var(--accent)" }}
								>
									📎 {c.attachmentName} {c.attachmentSizeBytes ? `(${formatFileSize(c.attachmentSizeBytes)})` : ""}
								</a>
							)}
						</div>
					))}
				</div>
			)}

			<form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
				<textarea
					placeholder="댓글을 입력하세요..."
					value={text}
					onChange={(e) => setText(e.target.value)}
					style={{
						minHeight: "50px", padding: "8px 10px", borderRadius: "var(--rs)", border: "1px solid var(--border)",
						background: "var(--surface)", color: "var(--text)", fontFamily: "inherit", fontSize: "13px", resize: "vertical"
					}}
				/>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
					<input
						ref={fileInputRef}
						type="file"
						onChange={(e) => setFile(e.target.files?.[0] || null)}
						style={{ fontSize: "12px", color: "var(--text-dim)", maxWidth: "220px" }}
					/>
					<button type="submit" className="btn btn-sm btn-primary" disabled={submitting || (!text.trim() && !file)}>
						{submitting ? "등록 중..." : "댓글 등록"}
					</button>
				</div>
			</form>
		</div>
	);
}
