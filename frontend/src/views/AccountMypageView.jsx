import { useCallback, useEffect, useRef, useState } from "react";
import { updateProfile, changePassword, loadCurrentUser, clearSession } from "../api/http.js";
import { updateMyDetails, requestContactVerification, confirmContactVerification, deactivateMyAccount } from "../api/common.js";

const inputStyle = {
	padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)",
	borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "14px", outline: "none"
};
const buttonStyle = {
	padding: "9px 16px", border: "none", borderRadius: "var(--radius-sm)", background: "var(--cta)",
	color: "white", fontWeight: 600, fontSize: "13px", cursor: "pointer"
};
const ghostButtonStyle = { ...buttonStyle, background: "transparent", color: "var(--text-sub)", border: "1px solid var(--border)" };
const dangerButtonStyle = { ...buttonStyle, background: "var(--red)" };
const smallGhost = { ...ghostButtonStyle, padding: "5px 10px", fontSize: "12px" };
const cardStyle = {
	background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
	padding: "18px", display: "flex", flexDirection: "column", gap: "14px", maxWidth: "520px", marginBottom: "16px"
};
const formStyle = { display: "flex", flexDirection: "column", gap: "14px" };

// 카드 공통 틀 — 제목은 왼쪽, "변경" 버튼은 오른쪽 위에 같은 모양으로 둔다.
function Section({ title, onOpen, openLabel, open, children }) {
	return (
		<div style={cardStyle}>
			<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
				<div style={{ flex: 1, fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{title}</div>
				{onOpen && !open && <button type="button" style={ghostButtonStyle} onClick={onOpen}>{openLabel}</button>}
			</div>
			{children}
		</div>
	);
}

function Field({ label, children }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
			<label style={{ fontSize: "12px", color: "var(--text-sub)" }}>{label}</label>
			{children}
		</div>
	);
}

function Value({ children }) {
	return <div style={{ fontSize: "14px", color: "var(--text)", minHeight: "20px" }}>{children || <span style={{ color: "var(--text-dim)" }}>-</span>}</div>;
}

// 편집 중 하단 버튼 — 모든 카드가 같은 순서(취소, 저장)와 모양을 쓴다.
function FormActions({ onCancel }) {
	return (
		<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
			<button type="button" style={ghostButtonStyle} onClick={onCancel}>취소</button>
			<button type="submit" style={buttonStyle}>저장</button>
		</div>
	);
}

// 보기 ↔ 편집을 오가는 카드. fields: { key, label, type, placeholder, required, readOnly, after(values) }.
// 취소하면 편집한 내용을 버리고, 다시 열면 저장된 값에서 시작한다. onSave가 던지면 열린 채로 둔다.
function EditCard({ title, openLabel, values, fields, onSave, notify }) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(values);

	async function submit(e) {
		e.preventDefault();
		try {
			const message = await onSave(draft);
			setOpen(false);
			notify(message);
		} catch (err) {
			notify(err.message || "저장에 실패했습니다.", true);
		}
	}

	return (
		<Section title={title} openLabel={openLabel} open={open} onOpen={() => { setDraft(values); setOpen(true); }}>
			{open ? (
				<form onSubmit={submit} style={formStyle}>
					{fields.map((f) => (
						<Field key={f.key} label={f.label}>
							<input
								type={f.type || "text"} required={f.required} readOnly={f.readOnly} placeholder={f.placeholder}
								value={f.readOnly ? values[f.key] ?? "" : draft[f.key] ?? ""}
								onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
								style={{ ...inputStyle, opacity: f.readOnly ? 0.7 : 1 }}
							/>
						</Field>
					))}
					<FormActions onCancel={() => setOpen(false)} />
				</form>
			) : (
				fields.map((f) => (
					<Field key={f.key} label={f.label}>
						<Value>{values[f.key]}</Value>
						{f.after?.(values)}
					</Field>
				))
			)}
		</Section>
	);
}

// 이메일/연락처 한 줄의 인증 상태와 인증 절차 — 코드를 요청하고, 받은 코드를 입력해 확인한다.
function VerifyRow({ channel, verified, hasValue, onVerified, notify }) {
	const [step, setStep] = useState("idle"); // idle | code
	const [code, setCode] = useState("");
	const label = channel === "EMAIL" ? "이메일" : "연락처";

	async function request() {
		try {
			await requestContactVerification(channel);
			setStep("code");
			setCode("");
			notify(`${label}로 인증 코드를 보냈습니다. (메일/문자 발송이 연결되기 전에는 서버 로그로만 전달됩니다)`);
		} catch (err) {
			notify(err.message || "인증 코드 요청에 실패했습니다.", true);
		}
	}

	async function confirm(e) {
		e.preventDefault();
		try {
			await confirmContactVerification(channel, code.trim());
			setStep("idle");
			await onVerified();
			notify(`${label} 인증을 완료했습니다.`);
		} catch (err) {
			notify(err.message || "인증에 실패했습니다.", true);
		}
	}

	if (!hasValue) return null;
	return (
		<div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
			<span style={{ fontSize: "12px", fontWeight: 600, color: verified ? "var(--green)" : "var(--text-dim)" }}>{verified ? "인증됨" : "미인증"}</span>
			{!verified && step === "idle" && <button type="button" style={smallGhost} onClick={request}>인증하기</button>}
			{!verified && step === "code" && (
				<form onSubmit={confirm} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
					<input
						inputMode="numeric" maxLength={6} required placeholder="인증 코드 6자리" value={code}
						onChange={(e) => setCode(e.target.value)} style={{ ...inputStyle, width: "140px", padding: "6px 10px", fontSize: "13px" }}
					/>
					<button type="submit" style={smallGhost}>확인</button>
					<button type="button" style={smallGhost} onClick={request}>코드 다시 받기</button>
				</form>
			)}
		</div>
	);
}

// 내 정보 화면 — 계정 정보를 보여주고, 카드마다 [변경]을 눌러 수정한다. 소속 플랫폼이 없어도 볼 수 있다.
// 계정 탈퇴는 삭제가 아니라 비활성화다(로그인만 막히고 기록은 남는다).
export default function AccountMypageView({ user, onDeactivated }) {
	const [me, setMe] = useState(user);
	const [pwOpen, setPwOpen] = useState(false);
	const [pw, setPw] = useState({ current: "", next: "" });
	const [leaveOpen, setLeaveOpen] = useState(false);
	const [leavePw, setLeavePw] = useState("");
	const [message, setMessage] = useState({ text: "", error: false });
	const timer = useRef(null);

	const reload = useCallback(async () => {
		const fresh = await loadCurrentUser();
		if (fresh) setMe({ ...fresh });
	}, []);

	useEffect(() => {
		loadCurrentUser().then((fresh) => fresh && setMe({ ...fresh }));
		return () => clearTimeout(timer.current);
	}, []);

	function notify(text, error = false) {
		setMessage({ text, error });
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setMessage({ text: "", error: false }), 4000);
	}

	async function saveProfile(d) {
		await updateProfile(d.name.trim(), (d.phone || "").trim(), d.email.trim());
		await reload();
		return "내 정보를 저장했습니다.";
	}

	async function saveDetails(d) {
		await updateMyDetails({
			birthDate: d.birthDate || null, guardianName: (d.guardianName || "").trim() || null, guardianPhone: (d.guardianPhone || "").trim() || null
		});
		await reload();
		return "추가 정보를 저장했습니다.";
	}

	async function savePassword(e) {
		e.preventDefault();
		try {
			await changePassword(pw.current, pw.next);
			setPw({ current: "", next: "" });
			setPwOpen(false);
			notify("비밀번호를 변경했습니다.");
		} catch (err) {
			notify(err.message || "비밀번호 변경에 실패했습니다.", true);
		}
	}

	async function leave(e) {
		e.preventDefault();
		try {
			await deactivateMyAccount(leavePw);
			clearSession();
			await onDeactivated?.();
		} catch (err) {
			notify(err.message || "탈퇴 처리에 실패했습니다.", true);
		}
	}

	const profileValues = { username: me?.username || "", name: me?.name || "", phone: me?.phone || "", email: me?.email || "" };
	const detailsValues = { birthDate: me?.birthDate || "", guardianName: me?.guardianName || "", guardianPhone: me?.guardianPhone || "" };

	return (
		<div className="page" id="page-account">
			<div className="page-header">
				<div className="page-label">MY PAGE</div>
				<div className="page-title">내 정보</div>
				<div className="page-subtitle">계정 정보를 확인하고 수정하세요</div>
			</div>

			{message.text && (
				<div style={{ color: message.error ? "var(--red)" : "var(--green)", fontSize: "13px", marginBottom: "12px", maxWidth: "520px" }}>{message.text}</div>
			)}

			<EditCard
				key={`profile-${profileValues.name}-${profileValues.phone}-${profileValues.email}`}
				title="내 정보" openLabel="내 정보 변경" values={profileValues} onSave={saveProfile} notify={notify}
				fields={[
					{ key: "username", label: "아이디", readOnly: true },
					{ key: "name", label: "이름", required: true },
					{
						key: "phone", label: "연락처", type: "tel", placeholder: "010-0000-0000",
						after: (v) => <VerifyRow channel="PHONE" hasValue={!!v.phone} verified={!!me?.phoneVerified} onVerified={reload} notify={notify} />
					},
					{
						key: "email", label: "이메일", type: "email", required: true,
						after: (v) => <VerifyRow channel="EMAIL" hasValue={!!v.email} verified={!!me?.emailVerified} onVerified={reload} notify={notify} />
					}
				]}
			/>

			<EditCard
				key={`details-${detailsValues.birthDate}-${detailsValues.guardianName}-${detailsValues.guardianPhone}`}
				title="추가 정보" openLabel="추가 정보 변경" values={detailsValues} onSave={saveDetails} notify={notify}
				fields={[
					{ key: "birthDate", label: "생년월일", type: "date" },
					{ key: "guardianName", label: "보호자 이름 (미성년인 경우)" },
					{ key: "guardianPhone", label: "보호자 연락처", type: "tel", placeholder: "010-0000-0000" }
				]}
			/>

			<Section title="비밀번호" openLabel="비밀번호 변경" open={pwOpen} onOpen={() => setPwOpen(true)}>
				{pwOpen ? (
					<form onSubmit={savePassword} style={formStyle}>
						<Field label="현재 비밀번호"><input type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} style={inputStyle} /></Field>
						<Field label="새 비밀번호"><input type="password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} style={inputStyle} /></Field>
						<FormActions onCancel={() => { setPw({ current: "", next: "" }); setPwOpen(false); }} />
					</form>
				) : (
					<Value>••••••••</Value>
				)}
			</Section>

			<Section title="계정 탈퇴" openLabel="계정 탈퇴" open={leaveOpen} onOpen={() => setLeaveOpen(true)}>
				{leaveOpen ? (
					<form onSubmit={leave} style={formStyle}>
						<div style={{ fontSize: "13px", color: "var(--text-sub)", lineHeight: 1.6 }}>
							계정을 삭제하지 않고 <b>비활성화</b>합니다. 비활성화하면 로그인할 수 없고, 수강권/결제/활동 이력은 그대로 남습니다.
							탈퇴한 아이디는 다시 사용할 수 없으며, 같은 이메일/연락처로는 새 아이디로 다시 가입할 수 있습니다.
							운영 중인 플랫폼이 있거나 강사/매니저로 소속돼 있으면 먼저 정리해야 합니다.
						</div>
						<Field label="비밀번호 확인"><input type="password" required value={leavePw} onChange={(e) => setLeavePw(e.target.value)} style={inputStyle} /></Field>
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
							<button type="button" style={ghostButtonStyle} onClick={() => { setLeavePw(""); setLeaveOpen(false); }}>취소</button>
							<button type="submit" style={dangerButtonStyle}>탈퇴하기</button>
						</div>
					</form>
				) : null}
			</Section>
		</div>
	);
}
