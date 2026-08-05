import { openModal, closeModal } from "../default.js";

export default function ManagerTutorManageView() {
	return (
		<>
		<div className="page" id="super-instructors">
			{/* ══════════════ 강사 관리 ══════════════ */}
			<div className="page-header">
				<div className="page-label">INSTRUCTORS</div>
				<div className="page-title">강사 관리</div>
				<div className="page-subtitle">소속 강사를 등록하고 KPI를 확인하세요</div>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
				<button className="btn btn-primary btn-sm" onClick={() => openModal("addInstructorModal")}>
					+ 강사 등록
				</button>
			</div>
			<div id="instructor-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				{/* JS 렌더 */}
			</div>
		</div>

		{/* 강사 등록 모달 */}
		<div className="modal-overlay" id="addInstructorModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">강사 등록</div>
					<button className="modal-close" onClick={() => closeModal("addInstructorModal")}>
						✕
					</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>이름</label>
						<input type="text" placeholder="강사 이름" />
					</div>
					<div className="form-field">
						<label>연락처</label>
						<input type="tel" placeholder="010-0000-0000" />
					</div>
					<div className="form-field">
						<label>전문 분야</label>
						<input type="text" placeholder="예: 필라테스, 요가" />
					</div>
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("addInstructorModal")}>
							취소
						</button>
						<button className="btn btn-primary" onClick={() => closeModal("addInstructorModal")}>
							저장
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
