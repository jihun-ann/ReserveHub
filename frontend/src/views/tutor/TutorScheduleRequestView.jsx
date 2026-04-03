export default function TutorScheduleRequestView() {
	return (
		<div id="tutor-request" className="page">
			<div className="page-header">
				<div className="page-label">Tutor / Schedule Request</div>
				<div className="page-title">일정 변경 요청</div>
				<div className="page-subtitle">슈퍼관리자에게 일정 변경을 요청하세요</div>
			</div>

			<div className="card" style={{ marginBottom: "24px" }}>
				<div className="card-title">📝 새 변경 요청 작성</div>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
						gap: "14px",
						marginBottom: "14px"
					}}
				>
					<div className="form-field">
						<label>수강생</label>
						<select>
							<option>홍길동</option>
							<option>김민지</option>
							<option>박서준</option>
						</select>
					</div>
					<div className="form-field">
						<label>프로그램</label>
						<select>
							<option>1:1 개인 레슨</option>
							<option>그룹반 A</option>
							<option>그룹반 B</option>
						</select>
					</div>
					<div className="form-field">
						<label>기존 일정</label>
						<input type="datetime-local" value="2026-02-26T10:00" />
					</div>
					<div className="form-field">
						<label>변경 희망 일정</label>
						<input type="datetime-local" value="2026-02-28T14:00" />
					</div>
				</div>
				<div className="form-field" style={{ marginBottom: "14px" }}>
					<label>변경 사유</label>
					<textarea placeholder="변경이 필요한 이유를 상세히 작성해주세요..."></textarea>
				</div>
				<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
					<button className="btn btn-ghost">취소</button>
					<button
						className="btn btn-primary"
						style={{ background: "var(--accent2)", color: "#0f0f13" }}
					>
						요청 제출
					</button>
				</div>
			</div>

			<div className="card-title" style={{ marginBottom: "14px" }}>
				요청 이력
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				<div className="card">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: "12px"
						}}
					>
						<div style={{ fontSize: "14px", fontWeight: 700 }}>
							홍길동 — 1:1 개인 레슨 일정 변경
						</div>
						<span
							className="res-status"
							style={{ background: "rgba(246,173,85,0.12)", color: "var(--accent3)" }}
						>
							검토 중
						</span>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "10px",
							marginBottom: "12px"
						}}
					>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "10px 12px"
							}}
						>
							<div
								style={{
									fontSize: "10px",
									color: "var(--text-dim)",
									marginBottom: "4px",
									letterSpacing: "1px"
								}}
							>
								기존 일정
							</div>
							<div style={{ fontSize: "13px", fontWeight: 600 }}>2026.02.26 10:00</div>
						</div>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "10px 12px"
							}}
						>
							<div
								style={{
									fontSize: "10px",
									color: "var(--text-dim)",
									marginBottom: "4px",
									letterSpacing: "1px"
								}}
							>
								변경 희망
							</div>
							<div style={{ fontSize: "13px", fontWeight: 600 }}>2026.02.28 14:00</div>
						</div>
					</div>
					<div
						style={{
							background: "var(--surface2)",
							borderRadius: "var(--radius-sm)",
							padding: "10px 12px",
							marginBottom: "10px",
							fontSize: "13px",
							color: "var(--text-sub)",
							lineHeight: 1.5
						}}
					>
						수강생 개인 사정으로 인한 일정 조정 요청입니다.
					</div>
					<div
						style={{
							fontSize: "11px",
							color: "var(--text-dim)",
							fontFamily: "'DM Mono',monospace"
						}}
					>
						요청일: 2026.02.25 · 스튜디오 필라테스 강남
					</div>
				</div>

				<div className="card">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: "12px"
						}}
					>
						<div style={{ fontSize: "14px", fontWeight: 700 }}>김민지 — 그룹반 A 일정 변경</div>
						<span className="res-status rs-completed">승인됨</span>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "10px",
							marginBottom: "12px"
						}}
					>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "10px 12px"
							}}
						>
							<div
								style={{
									fontSize: "10px",
									color: "var(--text-dim)",
									marginBottom: "4px",
									letterSpacing: "1px"
								}}
							>
								기존 일정
							</div>
							<div style={{ fontSize: "13px", fontWeight: 600 }}>2026.02.20 09:00</div>
						</div>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "10px 12px"
							}}
						>
							<div
								style={{
									fontSize: "10px",
									color: "var(--text-dim)",
									marginBottom: "4px",
									letterSpacing: "1px"
								}}
							>
								변경 일정
							</div>
							<div style={{ fontSize: "13px", fontWeight: 600 }}>2026.02.22 09:00</div>
						</div>
					</div>
					<div
						style={{
							background: "var(--surface2)",
							borderRadius: "var(--radius-sm)",
							padding: "10px 12px",
							marginBottom: "10px",
							fontSize: "13px",
							color: "var(--text-sub)",
							lineHeight: 1.5
						}}
					>
						수강생 해외 출장으로 인한 보강 처리 요청.
					</div>
					<div
						style={{
							fontSize: "11px",
							color: "var(--text-dim)",
							fontFamily: "'DM Mono',monospace"
						}}
					>
						요청일: 2026.02.18 · 승인일: 2026.02.19
					</div>
				</div>

				<div className="card">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							marginBottom: "12px"
						}}
					>
						<div style={{ fontSize: "14px", fontWeight: 700 }}>박서준 — 1:1 개인 레슨 취소</div>
						<span className="res-status rs-canceled">반려됨</span>
					</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "10px",
							marginBottom: "12px"
						}}
					>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "10px 12px"
							}}
						>
							<div
								style={{
									fontSize: "10px",
									color: "var(--text-dim)",
									marginBottom: "4px",
									letterSpacing: "1px"
								}}
							>
								기존 일정
							</div>
							<div style={{ fontSize: "13px", fontWeight: 600 }}>2026.02.15 10:00</div>
						</div>
						<div
							style={{
								background: "var(--surface2)",
								borderRadius: "var(--radius-sm)",
								padding: "10px 12px"
							}}
						>
							<div
								style={{
									fontSize: "10px",
									color: "var(--text-dim)",
									marginBottom: "4px",
									letterSpacing: "1px"
								}}
							>
								요청 유형
							</div>
							<div style={{ fontSize: "13px", fontWeight: 600, color: "var(--red)" }}>취소</div>
						</div>
					</div>
					<div
						style={{
							background: "var(--surface2)",
							borderRadius: "var(--radius-sm)",
							padding: "10px 12px",
							marginBottom: "10px",
							fontSize: "13px",
							color: "var(--text-sub)",
							lineHeight: 1.5
						}}
					>
						반려 사유: 취소 정책상 24시간 이전 요청만 가능합니다.
					</div>
					<div
						style={{
							fontSize: "11px",
							color: "var(--text-dim)",
							fontFamily: "'DM Mono',monospace"
						}}
					>
						요청일: 2026.02.15 · 반려일: 2026.02.15
					</div>
				</div>
			</div>
		</div>
	);
}
