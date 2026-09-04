import { useState } from "react";
import { openModal, closeModal } from "../default.js";
import { getCurrentUser, displayName, changePassword } from "../../api/http.js";

export default function TaxAccountantMypageView() {
	const user = getCurrentUser();

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [pwError, setPwError] = useState("");
	const [pwSuccess, setPwSuccess] = useState("");
	const [saving, setSaving] = useState(false);

	async function submitPasswordChange() {
		setPwError("");
		setPwSuccess("");
		if (!currentPassword || !newPassword || !confirmPassword) return;
		if (newPassword !== confirmPassword) {
			setPwError("새 비밀번호가 일치하지 않습니다.");
			return;
		}
		setSaving(true);
		try {
			await changePassword(currentPassword, newPassword);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			setPwSuccess("비밀번호가 변경되었습니다.");
		} catch (err) {
			setPwError(err.message || "비밀번호 변경에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<>
		<div className="page" id="taxacct-mypage">
			<div className="page-header">
				<div className="page-label">Tax Accountant / My Page</div>
				<div className="page-title">내 정보</div>
				<div className="page-subtitle">계정 정보를 확인하세요</div>
			</div>

			<div className="mypage-hero">
				<div className="hero-avatar" style={{ background: "linear-gradient(135deg,var(--taxacct),#4a9d76)" }}>
					{(user?.name || displayName(user))[0]}
				</div>
				<div className="hero-identity">
					<div className="hero-name">{user?.name || displayName(user)}</div>
					<div className="hero-email">{user?.email}</div>
					{user?.phone && <div className="hero-email" style={{ marginTop: "2px" }}>{user.phone}</div>}
				</div>
				<button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => openModal("taxAcctPasswordModal")}>
					🔒 비밀번호 변경
				</button>
			</div>

			<div className="card">
				<div className="card-title">안내</div>
				<div style={{ fontSize: "13px", color: "var(--text-sub)" }}>
					사이드바의 플랫폼 전환에서, 계약을 맺은 오너가 초대한 플랫폼만 보입니다. 다른 플랫폼이
					필요하면 해당 플랫폼 오너에게 초대를 요청하세요.
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="taxAcctPasswordModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">비밀번호 변경</div>
					<button className="modal-close" onClick={() => closeModal("taxAcctPasswordModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>현재 비밀번호</label>
						<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
					</div>
					<div className="form-field">
						<label>새 비밀번호</label>
						<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="8자 이상" />
					</div>
					<div className="form-field">
						<label>새 비밀번호 확인</label>
						<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="동일하게 입력" />
					</div>
					{pwError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{pwError}</div>}
					{pwSuccess && <div style={{ color: "var(--green)", fontSize: "12px" }}>{pwSuccess}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("taxAcctPasswordModal")}>닫기</button>
						<button className="btn btn-primary" disabled={saving} onClick={submitPasswordChange}>
							{saving ? "변경 중..." : "변경하기"}
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
