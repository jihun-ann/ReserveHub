import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { getCurrentUser, displayName, changePassword, updateProfile, updateBankInfo } from "../../api/http.js";
import { listMembers, listStaff, businessTypeEmoji } from "../../api/common.js";

export default function ManagerMypageView({ platformId, currentPlatform }) {
	const user = getCurrentUser();
	const [memberCount, setMemberCount] = useState(0);
	const [tutorCount, setTutorCount] = useState(0);
	const [loading, setLoading] = useState(true);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [pwError, setPwError] = useState("");
	const [pwSuccess, setPwSuccess] = useState("");
	const [saving, setSaving] = useState(false);

	const [profileName, setProfileName] = useState(user?.name || "");
	const [profilePhone, setProfilePhone] = useState(user?.phone || "");
	const [profileEmail, setProfileEmail] = useState(user?.email || "");
	const [profileError, setProfileError] = useState("");
	const [profileSuccess, setProfileSuccess] = useState("");
	const [savingProfile, setSavingProfile] = useState(false);

	const [bankName, setBankName] = useState(user?.bankName || "");
	const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || "");
	const [bankAccountHolder, setBankAccountHolder] = useState(user?.bankAccountHolder || "");
	const [bankError, setBankError] = useState("");
	const [bankSuccess, setBankSuccess] = useState("");
	const [savingBank, setSavingBank] = useState(false);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setMemberCount(0);
			setTutorCount(0);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [members, staff] = await Promise.all([listMembers(platformId).catch(() => []), listStaff(platformId)]);
		setMemberCount(new Set(members.map((m) => m.userId)).size);
		setTutorCount(staff.filter((s) => s.staffRole === "TUTOR").length);
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

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

	async function submitProfile() {
		setProfileError("");
		setProfileSuccess("");
		if (!profileName.trim() || !profileEmail.trim()) return;
		setSavingProfile(true);
		try {
			await updateProfile(profileName.trim(), profilePhone.trim() || null, profileEmail.trim());
			setProfileSuccess("정보가 저장되었습니다.");
		} catch (err) {
			setProfileError(err.message || "정보 저장에 실패했습니다.");
		} finally {
			setSavingProfile(false);
		}
	}

	// 정산 계좌 — 오너가 초대한 세무사가 이 플랫폼 기준으로 조회할 수 있는 정보라, 여기서 직접 등록한다.
	async function submitBankInfo() {
		setBankError("");
		setBankSuccess("");
		setSavingBank(true);
		try {
			await updateBankInfo(bankName.trim() || null, bankAccountNumber.trim() || null, bankAccountHolder.trim() || null);
			setBankSuccess("정산 계좌가 저장되었습니다.");
		} catch (err) {
			setBankError(err.message || "정산 계좌 저장에 실패했습니다.");
		} finally {
			setSavingBank(false);
		}
	}

	return (
		<>
		<div className="page" id="manager-mypage">
			<div className="page-header">
				<div className="page-label">MY PAGE</div>
				<div className="page-title">내 정보</div>
				<div className="page-subtitle">계정 정보와 담당 플랫폼 현황을 확인하세요</div>
			</div>

			<div className="hero">
				<div className="hero-avatar">{(user?.name || displayName(user))[0]}</div>
				<div className="hero-info">
					<div className="hero-name">{user?.name || displayName(user)}</div>
					<div className="hero-email">@{user?.username}</div>
					<div className="hero-email" style={{ marginTop: "2px" }}>{user?.email}</div>
					{user?.phone && <div className="hero-email" style={{ marginTop: "2px" }}>{user.phone}</div>}
				</div>
				<div className="hero-stats">
					<div className="hstat">
						<div className="hstat-val">{platformId ? 1 : 0}</div>
						<div className="hstat-key">담당 플랫폼</div>
					</div>
					<div className="hstat">
						<div className="hstat-val" style={{ color: "var(--green)" }}>{loading ? "-" : memberCount}</div>
						<div className="hstat-key">전체 회원</div>
					</div>
					<div className="hstat">
						<div className="hstat-val" style={{ color: "var(--accent3)" }}>{loading ? "-" : tutorCount}</div>
						<div className="hstat-key">소속 강사</div>
					</div>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "auto" }}>
					<button className="btn btn-ghost btn-sm" onClick={() => openModal("managerAccountModal")}>✏️ 계정 정보</button>
					<button className="btn btn-ghost btn-sm" onClick={() => openModal("managerBankModal")}>🏦 정산 계좌</button>
					<button className="btn btn-ghost btn-sm" onClick={() => openModal("managerPasswordModal")}>🔒 비밀번호 변경</button>
				</div>
			</div>

			<div className="card">
				<div className="card-title">담당 플랫폼</div>
				{!currentPlatform ? (
					<div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "8px 0" }}>배정된 플랫폼이 없습니다</div>
				) : (
					<div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 0" }}>
						<div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(var(--manager-rgb),.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: "0" }}>
							{businessTypeEmoji(currentPlatform.businessType)}
						</div>
						<div style={{ flex: "1" }}>
							<div style={{ fontSize: "14px", fontWeight: "600" }}>{currentPlatform.name}</div>
							<div style={{ fontSize: "11px", color: "var(--text-sub)", marginTop: "3px" }}>
								회원 {loading ? "-" : memberCount}명 · 강사 {loading ? "-" : tutorCount}명
							</div>
						</div>
						<span className="badge bs-active" style={{ fontSize: "10px" }}>담당 중</span>
					</div>
				)}
			</div>
		</div>

		<div className="modal-overlay" id="managerAccountModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">계정 정보</div>
					<button className="modal-close" onClick={() => closeModal("managerAccountModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>이름</label>
						<input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="이름" />
					</div>
					<div className="form-field">
						<label>연락처</label>
						<input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} placeholder="010-0000-0000" />
					</div>
					<div className="form-field">
						<label>이메일</label>
						<input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="name@example.com" />
					</div>
					<div className="form-field">
						<label>아이디</label>
						<input type="text" value={user?.username || ""} readOnly style={{ opacity: ".7", cursor: "default" }} />
					</div>
					<div className="form-field">
						<label>역할</label>
						<input type="text" value="매니저" readOnly style={{ opacity: ".7", cursor: "default" }} />
					</div>
					{profileError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{profileError}</div>}
					{profileSuccess && <div style={{ color: "var(--green)", fontSize: "12px" }}>{profileSuccess}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("managerAccountModal")}>닫기</button>
						<button className="btn btn-primary" disabled={savingProfile} onClick={submitProfile}>
							{savingProfile ? "저장 중..." : "저장"}
						</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="managerBankModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">정산 계좌</div>
					<button className="modal-close" onClick={() => closeModal("managerBankModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
						여기 등록한 계좌는 소속 플랫폼 오너가 초대한 세무사가 정산용으로 조회합니다.
					</div>
					<div className="form-field">
						<label>은행명</label>
						<input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="예: 국민은행" />
					</div>
					<div className="form-field">
						<label>계좌번호</label>
						<input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="000-000-000000" />
					</div>
					<div className="form-field">
						<label>예금주</label>
						<input type="text" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} placeholder={user?.name || "예금주명"} />
					</div>
					{bankError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{bankError}</div>}
					{bankSuccess && <div style={{ color: "var(--green)", fontSize: "12px" }}>{bankSuccess}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("managerBankModal")}>닫기</button>
						<button className="btn btn-primary" disabled={savingBank} onClick={submitBankInfo}>
							{savingBank ? "저장 중..." : "저장"}
						</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="managerPasswordModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">비밀번호 변경</div>
					<button className="modal-close" onClick={() => closeModal("managerPasswordModal")}>✕</button>
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
						<button className="btn btn-ghost" onClick={() => closeModal("managerPasswordModal")}>닫기</button>
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
