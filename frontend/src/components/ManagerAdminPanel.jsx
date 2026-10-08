import { useCallback, useEffect, useRef, useState } from "react";
import {
	listStaff, getUser, removeStaff, listStaffInvitations, createStaffInvitation, cancelStaffInvitation,
	listManagerGroups, createManagerGroup, updateManagerGroup, deleteManagerGroup, assignManagerGroup, MANAGER_PERMISSIONS
} from "../api/common.js";
import { formatDateTime } from "../utils/formatDateTime.js";

const PAGE_SIZE = 10;
const inviteLink = (token) => `${window.location.origin}/invite/${token}`;

const rowStyle = { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px", display: "flex", alignItems: "center", gap: "14px" };
const gridForm = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" };
const fullRow = { gridColumn: "1/-1" };
const searchStyle = { padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", color: "var(--text)", fontSize: "13px", outline: "none" };

// 매니저 관리 — 등록된 매니저(그룹 변경/삭제), 초대 중인 매니저(초대/링크/취소), 그룹 설정(이름 + 메뉴/기능 권한).
// 오너 플랫폼 화면의 매니저 탭과, 매니저 그룹에 'MANAGER_MANAGE' 권한이 있는 매니저의 메뉴가 같이 쓴다.
// 권한은 서버가 다시 검증하므로(MANAGER_MANAGE), 여기서는 실패 메시지만 보여준다.
export default function ManagerAdminPanel({ platformId }) {
	const [tab, setTab] = useState("registered"); // registered | pending | groups
	const [managers, setManagers] = useState([]);
	const [invitations, setInvitations] = useState([]);
	const [groups, setGroups] = useState([]);
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(0);
	const [notice, setNotice] = useState("");
	const noticeTimer = useRef(null);
	const [groupEdit, setGroupEdit] = useState(null); // 매니저 그룹 변경 영역: { s, groupId }
	const [groupForm, setGroupForm] = useState(null); // 그룹 추가/수정 영역: { id: 'new' | 그룹 id, name, permissions }
	const [groupError, setGroupError] = useState("");
	const [showInvite, setShowInvite] = useState(false);
	const [invite, setInvite] = useState({ method: "email", value: "" });
	const [inviteError, setInviteError] = useState("");
	const [saving, setSaving] = useState(false);

	const loadManagers = useCallback(() => {
		listStaff(platformId)
			.then((rows) => Promise.all(rows.filter((s) => s.staffRole === "MANAGER").map(async (s) => {
				const u = await getUser(s.userId).catch(() => null);
				return { ...s, email: u?.email || s.userId, name: u?.name };
			})))
			.then(setManagers)
			.catch(() => setManagers([]));
	}, [platformId]);
	const loadInvitations = useCallback(() => {
		listStaffInvitations(platformId)
			.then((rows) => setInvitations(rows.filter((i) => i.staffRole === "MANAGER")))
			.catch(() => setInvitations([]));
	}, [platformId]);
	const loadGroups = useCallback(() => {
		listManagerGroups(platformId).then(setGroups).catch(() => setGroups([]));
	}, [platformId]);

	useEffect(() => {
		loadManagers();
		loadInvitations();
		loadGroups();
	}, [loadManagers, loadInvitations, loadGroups]);
	useEffect(() => () => clearTimeout(noticeTimer.current), []);

	function notify(message) {
		setNotice(message);
		clearTimeout(noticeTimer.current);
		noticeTimer.current = setTimeout(() => setNotice(""), 2500);
	}

	function switchTab(next) {
		setTab(next);
		setQuery("");
		setPage(0);
		setGroupEdit(null);
		setGroupForm(null);
	}

	async function removeManager(s) {
		if (!window.confirm(`${s.email}을(를) 이 플랫폼에서 삭제할까요?\n겸직 중인 다른 역할도 함께 해제됩니다.`)) return;
		try {
			await removeStaff(platformId, s.userId);
			loadManagers();
			notify("삭제했습니다.");
		} catch (err) {
			alert(err.message || "삭제에 실패했습니다.");
		}
	}

	async function saveGroupEdit(e) {
		e.preventDefault();
		const { s, groupId } = groupEdit;
		try {
			if (groupId !== s.managerGroupId) await assignManagerGroup(platformId, s.userId, groupId);
			setGroupEdit(null);
			loadManagers();
			notify("그룹을 변경했습니다.");
		} catch (err) {
			alert(err.message || "그룹 변경에 실패했습니다.");
		}
	}

	async function saveGroup(e) {
		e.preventDefault();
		setGroupError("");
		const { id, name, permissions } = groupForm;
		try {
			if (id === "new") await createManagerGroup(platformId, name.trim(), permissions);
			else await updateManagerGroup(id, name.trim(), permissions);
			setGroupForm(null);
			loadGroups();
			notify("그룹을 저장했습니다.");
		} catch (err) {
			setGroupError(err.message || "그룹 저장에 실패했습니다.");
		}
	}

	async function removeGroup(g) {
		if (!window.confirm(`'${g.name}' 그룹을 삭제할까요?`)) return;
		try {
			await deleteManagerGroup(g.id);
			loadGroups();
			notify("그룹을 삭제했습니다.");
		} catch (err) {
			alert(err.message || "그룹 삭제에 실패했습니다.");
		}
	}

	async function submitInvite(e) {
		e.preventDefault();
		setInviteError("");
		setSaving(true);
		try {
			await createStaffInvitation(platformId, { staffRole: "MANAGER", [invite.method]: invite.value.trim() });
			setInvite({ method: "email", value: "" });
			setShowInvite(false);
			loadInvitations();
			notify("초대 링크를 만들었습니다.");
		} catch (err) {
			setInviteError(err.message || "초대에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	async function cancelInvite(id) {
		try {
			await cancelStaffInvitation(id);
			loadInvitations();
			notify("초대를 취소했습니다.");
		} catch (err) {
			alert(err.message || "초대 취소에 실패했습니다.");
		}
	}

	async function copyLink(token) {
		try {
			await navigator.clipboard.writeText(inviteLink(token));
			notify("초대 링크를 복사했습니다.");
		} catch {
			window.prompt("초대 링크를 복사하세요", inviteLink(token));
		}
	}

	const q = query.trim().toLowerCase();
	const filtered = managers.filter((s) => !q || [s.email, s.name].some((v) => v?.toLowerCase().includes(q)));
	const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, pages - 1);
	const visible = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

	const groupFormUi = groupForm && (
		<form onSubmit={saveGroup} className="card" style={gridForm}>
			<div className="form-field">
				<label>그룹 이름</label>
				<input required maxLength={50} value={groupForm.name} placeholder="예: 일반, 관리자, 임원" onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} />
			</div>
			{[["menu", "메뉴"], ["feature", "기능"]].map(([kind, title]) => (
				<div key={kind} className="form-field" style={fullRow}>
					<label>{title} 권한</label>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "6px 12px" }}>
						{MANAGER_PERMISSIONS.filter((perm) => perm.kind === kind).map((perm) => (
							<label key={perm.key} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text)" }}>
								<input
									type="checkbox" style={{ width: "auto" }}
									checked={groupForm.permissions.includes(perm.key)}
									onChange={(e) => setGroupForm({
										...groupForm,
										permissions: e.target.checked ? [...groupForm.permissions, perm.key] : groupForm.permissions.filter((k) => k !== perm.key)
									})}
								/>
								{perm.label}
							</label>
						))}
					</div>
				</div>
			))}
			{groupError && <div style={{ ...fullRow, color: "var(--red)", fontSize: "12px" }}>{groupError}</div>}
			<div style={{ ...fullRow, display: "flex", justifyContent: "flex-end", gap: "8px" }}>
				<button type="button" className="btn btn-ghost btn-sm" onClick={() => setGroupForm(null)}>닫기</button>
				<button type="submit" className="btn btn-primary btn-sm">저장</button>
			</div>
		</form>
	);

	const tabs = [["registered", "등록됨", managers.length], ["pending", "초대 중", invitations.length], ["groups", "그룹 설정", groups.length]];

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
			<div style={{ display: "flex", gap: "6px" }}>
				{tabs.map(([key, label, count]) => (
					<button key={key} type="button" className={`btn btn-sm ${tab === key ? "btn-primary" : "btn-ghost"}`} onClick={() => switchTab(key)}>{label} {count}</button>
				))}
				{notice && <span style={{ alignSelf: "center", marginLeft: "auto", fontSize: "12px", color: "var(--green)" }}>{notice}</span>}
			</div>

			{tab === "registered" && (
				<>
					<input type="text" placeholder="이메일/이름 검색" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} style={searchStyle} />
					{visible.map((s) => (
						<div key={s.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
							<div style={rowStyle}>
								<div className="avatar" style={{ background: "linear-gradient(135deg,var(--owner),#f7b955)", width: "38px", height: "38px", fontSize: "15px" }}>{s.email?.[0]?.toUpperCase() || "?"}</div>
								<div style={{ flex: 1 }}>
									<div style={{ fontSize: "14px", fontWeight: 700 }}>{s.email}</div>
									{s.name && <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>{s.name}</div>}
								</div>
								<div style={{ fontSize: "12px", color: "var(--text-sub)", textAlign: "right" }}>
									{groups.find((g) => g.id === s.managerGroupId)?.name || "그룹 없음"}
								</div>
								<button className="btn btn-sm" onClick={() => setGroupEdit(groupEdit?.s.id === s.id ? null : { s, groupId: s.managerGroupId || "" })}>그룹 변경</button>
								<span className="plat-status ps-active" style={{ fontSize: "10px" }}>재직</span>
								<button className="btn btn-sm btn-danger" onClick={() => removeManager(s)}>삭제</button>
							</div>
							{groupEdit?.s.id === s.id && (
								<form onSubmit={saveGroupEdit} className="card" style={gridForm}>
									<div className="form-field">
										<label>매니저 그룹</label>
										<select required value={groupEdit.groupId} onChange={(e) => setGroupEdit({ ...groupEdit, groupId: e.target.value })}>
											<option value="" disabled>그룹 선택</option>
											{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
										</select>
									</div>
									<div style={{ ...fullRow, display: "flex", justifyContent: "flex-end", gap: "8px" }}>
										<button type="button" className="btn btn-ghost btn-sm" onClick={() => setGroupEdit(null)}>닫기</button>
										<button type="submit" className="btn btn-primary btn-sm">저장</button>
									</div>
								</form>
							)}
						</div>
					))}
					{filtered.length === 0 && (
						<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>배정된 매니저가 없습니다</div>
					)}
					{pages > 1 && (
						<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "12px" }}>
							<button className="btn btn-sm btn-ghost" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>이전</button>
							<span>{safePage + 1} / {pages}</span>
							<button className="btn btn-sm btn-ghost" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>다음</button>
						</div>
					)}
				</>
			)}

			{tab === "pending" && (
				<>
					{invitations.map((i) => (
						<div key={i.id} style={{ ...rowStyle, border: "1px dashed var(--border)" }}>
							<div style={{ flex: 1, fontSize: "13px" }}>
								{[i.email, i.phone].filter(Boolean).join(" / ")}
								<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>수락 대기 · {formatDateTime(i.expiresAt)}까지</div>
							</div>
							<button className="btn btn-sm" onClick={() => copyLink(i.token)}>링크 복사</button>
							<button className="btn btn-sm btn-danger" onClick={() => cancelInvite(i.id)}>취소</button>
						</div>
					))}
					{invitations.length === 0 && (
						<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>초대 중인 매니저가 없습니다</div>
					)}
					<button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setShowInvite((v) => !v)}>+ 매니저 초대</button>
					{showInvite && (
						<form onSubmit={submitInvite} className="card" style={gridForm}>
							<div style={{ ...fullRow, display: "flex", gap: "6px" }}>
								{[["email", "이메일"], ["phone", "연락처"]].map(([m, label]) => (
									<button key={m} type="button" className={`btn btn-sm ${invite.method === m ? "btn-primary" : "btn-ghost"}`} onClick={() => setInvite({ method: m, value: "" })}>{label}</button>
								))}
							</div>
							<div className="form-field" style={fullRow}>
								<label>{invite.method === "email" ? "이메일" : "연락처"}</label>
								<input
									required type={invite.method === "email" ? "email" : "tel"}
									placeholder={invite.method === "email" ? "user@example.com" : "010-0000-0000"}
									value={invite.value} onChange={(e) => setInvite({ ...invite, value: e.target.value })}
								/>
							</div>
							<div style={{ ...fullRow, fontSize: "11px", color: "var(--text-dim)" }}>
								수락한 뒤 '그룹 설정'에서 그룹을 지정하기 전까지는 권한이 없습니다. 발급된 링크를 직접 전달하세요 — 상대가 가입/로그인한 계정의 이메일 또는 연락처가 여기 적은 값과 일치해야 수락할 수 있습니다. (7일간 유효)
							</div>
							{inviteError && <div style={{ ...fullRow, color: "var(--red)", fontSize: "12px" }}>{inviteError}</div>}
							<button className="btn btn-primary btn-sm" style={fullRow} type="submit" disabled={saving}>{saving ? "발급 중..." : "초대 링크 만들기"}</button>
						</form>
					)}
				</>
			)}

			{tab === "groups" && (
				<>
					<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
						그룹마다 이름과 사용할 수 있는 메뉴/기능을 고릅니다. 매니저는 그룹 하나에 속하고, 그 그룹의 권한을 갖습니다. 그룹이 없는 매니저는 대시보드/캘린더/내 정보만 쓸 수 있습니다.
					</div>
					{groups.map((g) => (
						<div key={g.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
							<div style={rowStyle}>
								<div style={{ flex: 1 }}>
									<div style={{ fontSize: "14px", fontWeight: 700 }}>{g.name}</div>
									<div style={{ fontSize: "11px", color: "var(--text-dim)" }}>소속 {managers.filter((s) => s.managerGroupId === g.id).length}명</div>
								</div>
								<div style={{ fontSize: "12px", color: "var(--text-sub)", textAlign: "right" }}>
									메뉴 {g.permissions.filter((k) => k.startsWith("MENU_")).length} · 기능 {g.permissions.filter((k) => !k.startsWith("MENU_")).length}
								</div>
								<button className="btn btn-sm" onClick={() => { setGroupError(""); setGroupForm(groupForm?.id === g.id ? null : { id: g.id, name: g.name, permissions: g.permissions }); }}>수정</button>
								<button className="btn btn-sm btn-danger" onClick={() => removeGroup(g)}>삭제</button>
							</div>
							{groupForm?.id === g.id && groupFormUi}
						</div>
					))}
					{groups.length === 0 && (
						<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "16px 0" }}>만든 그룹이 없습니다</div>
					)}
					<button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => { setGroupError(""); setGroupForm(groupForm?.id === "new" ? null : { id: "new", name: "", permissions: [] }); }}>
						+ 그룹 추가
					</button>
					{groupForm?.id === "new" && groupFormUi}
				</>
			)}
		</div>
	);
}
