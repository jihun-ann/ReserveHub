import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { getCurrentUser, displayName, changePassword, updateProfile, updateBankInfo } from "../../api/http.js";
import { listPlatforms, listMyLessons, listMyScheduleRequests } from "../../api/common.js";

function pad(n) {
	return String(n).padStart(2, "0");
}
function isoDate(d) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TutorMypageView() {
	const user = getCurrentUser();
	const [platforms, setPlatforms] = useState([]);
	const [lessons, setLessons] = useState([]);
	const [requestCount, setRequestCount] = useState(0);
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
		setLoading(true);
		const today = new Date();
		const monthStart = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
		const monthEnd = isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
		const [platformList, lessonList, requests] = await Promise.all([
			listPlatforms(),
			listMyLessons(monthStart, monthEnd),
			listMyScheduleRequests()
		]);
		setPlatforms(platformList.filter((p) => p.roles.includes("TUTOR")));
		setLessons(lessonList);
		setRequestCount(requests.length);
		setLoading(false);
	}, []);

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

	const totalAttendance = lessons.reduce((sum, l) => sum + l.totalAttendance, 0);
	const totalPresent = lessons.reduce((sum, l) => sum + l.presentCount, 0);
	const attendRate = totalAttendance === 0 ? 0 : Math.round((totalPresent / totalAttendance) * 100);

	return (
		<>
		<div id="tutor-mypage" className="page">
			<div className="page-header">
				<div className="page-label">Tutor / My Page</div>
				<div className="page-title">내 정보</div>
				<div className="page-subtitle">내 계정 정보와 소속 플랫폼 현황을 확인하세요</div>
			</div>

			<div className="mypage-hero" style={{ marginBottom: "24px" }}>
				<div className="hero-avatar" style={{ background: "linear-gradient(135deg,var(--accent2),#667eea)" }}>
					{(user?.name || displayName(user))[0]}
				</div>
				<div className="hero-identity">
					<div className="hero-name">{user?.name || displayName(user)}</div>
					<div className="hero-email">@{user?.username}</div>
					<div className="hero-email" style={{ marginTop: "2px" }}>{user?.email}</div>
					{user?.phone && <div className="hero-email" style={{ marginTop: "2px" }}>{user.phone}</div>}
				</div>
				<div className="hero-divider"></div>
				<div className="hero-stats">
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--accent2)" }}>{loading ? "-" : platforms.length}</div>
						<div className="hstat-key">소속 플랫폼</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--accent2)" }}>{loading ? "-" : lessons.length}</div>
						<div className="hstat-key">이번 달 레슨</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--green)" }}>{loading ? "-" : `${attendRate}%`}</div>
						<div className="hstat-key">출결률</div>
					</div>
					<div className="hero-stat">
						<div className="hstat-val" style={{ color: "var(--accent3)" }}>{loading ? "-" : requestCount}</div>
						<div className="hstat-key">변경 요청</div>
					</div>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "6px", marginLeft: "auto" }}>
					<button className="btn btn-ghost btn-sm" onClick={() => openModal("tutorAccountModal")}>✏️ 내 정보 변경</button>
					<button className="btn btn-ghost btn-sm" onClick={() => openModal("tutorBankModal")}>🏦 정산 계좌</button>
					<button className="btn btn-ghost btn-sm" onClick={() => openModal("tutorPasswordModal")}>🔒 비밀번호 변경</button>
				</div>
			</div>

			<div className="card">
				<div className="card-title">소속 플랫폼</div>
				{platforms.length === 0 ? (
					<div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "8px 0" }}>소속된 플랫폼이 없습니다</div>
				) : (
					platforms.map((p) => (
						<div className="platform-item" key={p.id}>
							<div className="plat-emoji" style={{ background: "rgba(124,106,247,0.1)" }}>{p.emoji}</div>
							<div className="plat-detail">
								<div className="plat-name">{p.name}</div>
								<span className="plat-tag" style={{ background: "rgba(124,106,247,0.15)", color: "#7c6af7" }}>
									{p.businessType}
								</span>
							</div>
							<span className="plat-status ps-active">재직 중</span>
						</div>
					))
				)}
			</div>
		</div>

		<div className="modal-overlay" id="tutorAccountModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">계정 정보</div>
					<button className="modal-close" onClick={() => closeModal("tutorAccountModal")}>✕</button>
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
					{profileError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{profileError}</div>}
					{profileSuccess && <div style={{ color: "var(--green)", fontSize: "12px" }}>{profileSuccess}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("tutorAccountModal")}>닫기</button>
						<button className="btn btn-primary" disabled={savingProfile} onClick={submitProfile}>
							{savingProfile ? "저장 중..." : "저장"}
						</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="tutorBankModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">정산 계좌</div>
					<button className="modal-close" onClick={() => closeModal("tutorBankModal")}>✕</button>
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
						<button className="btn btn-ghost" onClick={() => closeModal("tutorBankModal")}>닫기</button>
						<button className="btn btn-primary" disabled={savingBank} onClick={submitBankInfo}>
							{savingBank ? "저장 중..." : "저장"}
						</button>
					</div>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="tutorPasswordModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">비밀번호 변경</div>
					<button className="modal-close" onClick={() => closeModal("tutorPasswordModal")}>✕</button>
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
						<button className="btn btn-ghost" onClick={() => closeModal("tutorPasswordModal")}>닫기</button>
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
