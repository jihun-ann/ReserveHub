import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import {
	listPrograms, listStaff, getUser, listMembers,
	addProgramSlot, listProgramSlots, deactivateProgramSlot,
	addSlotMember, listSlotMembers, removeSlotMember,
	PROGRAM_TYPE_LABEL, ENROLLMENT_MODE_LABEL, DAY_OF_WEEK_LABEL
} from "../../api/common.js";

const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const EMPTY_ADD_FORM = {
	programId: "", name: "", instructorId: "", scheduleType: "RECURRING",
	dayOfWeek: "MON", date: "", validFrom: "", validUntil: "", startTime: "10:00", endTime: "11:00"
};

function pad(n) {
	return String(n).padStart(2, "0");
}
function isoDate(d) {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function mmdd(d) {
	return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}
function mondayOf(d) {
	const date = new Date(d);
	const day = date.getDay();
	date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
	date.setHours(0, 0, 0, 0);
	return date;
}
function addDays(d, n) {
	const date = new Date(d);
	date.setDate(date.getDate() + n);
	return date;
}
function dayKeyOfDate(dateIso) {
	// JS getDay(): 0=Sun..6=Sat → DAY_KEYS는 월요일 시작(0=MON)이라 보정한다.
	return DAY_KEYS[(new Date(dateIso).getDay() + 6) % 7];
}

export default function ManagerLessonManageView({ platformId }) {
	const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
	const [programs, setPrograms] = useState([]);
	const [instructors, setInstructors] = useState([]);
	const [members, setMembers] = useState([]);
	const [allSlots, setAllSlots] = useState([]);
	const [loading, setLoading] = useState(true);
	const [slotsLoading, setSlotsLoading] = useState(false);

	const [expandedSlot, setExpandedSlot] = useState(null);
	const [roster, setRoster] = useState(null);
	const [newMemberKey, setNewMemberKey] = useState("");

	const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
	const [addError, setAddError] = useState("");
	const [saving, setSaving] = useState(false);

	const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
	const todayIso = isoDate(new Date());
	const programsById = Object.fromEntries(programs.map((p) => [p.id, p]));

	const refresh = useCallback(async () => {
		if (!platformId) {
			setPrograms([]);
			setInstructors([]);
			setMembers([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const [programList, staff, memberList] = await Promise.all([
			listPrograms(platformId),
			listStaff(platformId, false),
			listMembers(platformId)
		]);
		const tutorStaff = staff.filter((s) => s.staffRole === "TUTOR");
		const tutorUsers = await Promise.all(tutorStaff.map((s) => getUser(s.userId)));
		setInstructors(tutorStaff.map((s, i) => ({ userId: s.userId, name: tutorUsers[i].name })));
		setPrograms(programList);
		setMembers(memberList);
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const refreshSlots = useCallback(async () => {
		if (programs.length === 0) {
			setAllSlots([]);
			return;
		}
		setSlotsLoading(true);
		const lists = await Promise.all(programs.map((p) => listProgramSlots(p.id)));
		setAllSlots(lists.flat());
		setSlotsLoading(false);
	}, [programs]);

	useEffect(() => {
		refreshSlots();
	}, [refreshSlots]);

	useEffect(() => {
		if (!expandedSlot) {
			setRoster(null);
			return;
		}
		const program = programsById[expandedSlot.programId];
		if (!program || !(program.type === "PRIVATE" || program.enrollmentMode === "FIXED")) {
			setRoster(null);
			return;
		}
		listSlotMembers(expandedSlot.programId, expandedSlot.id).then(setRoster);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [expandedSlot]);

	function openAddModal(dayKey, dateIso) {
		setAddForm({
			...EMPTY_ADD_FORM,
			dayOfWeek: dayKey || "MON",
			date: dateIso || todayIso,
			validFrom: dateIso || todayIso
		});
		setAddError("");
		openModal("addSlotModal");
	}

	async function submitAdd() {
		if (!addForm.programId || !addForm.instructorId) return;
		setSaving(true);
		setAddError("");
		try {
			const isInstant = addForm.scheduleType === "INSTANT";
			const dayOfWeek = isInstant ? dayKeyOfDate(addForm.date) : addForm.dayOfWeek;
			const validFrom = isInstant ? addForm.date : addForm.validFrom;
			const validUntil = isInstant ? addForm.date : (addForm.validUntil || null);
			await addProgramSlot(addForm.programId, {
				name: addForm.name.trim() || null, instructorId: addForm.instructorId, dayOfWeek,
				startTime: addForm.startTime, endTime: addForm.endTime,
				validFrom, validUntil
			});
			closeModal("addSlotModal");
			await refreshSlots();
		} catch (err) {
			setAddError(err.message || "수업 추가에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	async function removeSlot(slot) {
		await deactivateProgramSlot(slot.programId, slot.id);
		setExpandedSlot(null);
		await refreshSlots();
	}

	async function addMember() {
		if (!newMemberKey || !expandedSlot) return;
		const [userId, userPassId] = newMemberKey.split("::");
		await addSlotMember(expandedSlot.programId, expandedSlot.id, { userId, userPassId });
		setNewMemberKey("");
		setRoster(await listSlotMembers(expandedSlot.programId, expandedSlot.id));
	}

	async function removeMember(memberId) {
		if (!expandedSlot) return;
		await removeSlotMember(expandedSlot.programId, expandedSlot.id, memberId);
		setRoster(await listSlotMembers(expandedSlot.programId, expandedSlot.id));
	}

	const expandedProgram = expandedSlot ? programsById[expandedSlot.programId] : null;
	const isFixedRoster = expandedProgram && (expandedProgram.type === "PRIVATE" || expandedProgram.enrollmentMode === "FIXED");

	return (
		<div className="page" id="manager-lesson-manage">
			<div className="page-header">
				<div className="page-label">Lesson Management</div>
				<div className="page-title">수업 관리</div>
				<div className="page-subtitle">
					주 단위로 수업 일정을 관리하세요. 매주 반복되는 수업인지 1회성(인스턴트) 수업인지 정하고 강사를 배정합니다.
					개인수업, 또는 고정형 그룹반은 대상자를 등록해두면 매주 신청 없이 자동으로 수업이 잡히고,
					신청형 그룹반은 매주 학생이 직접 신청(예약)해서 채워집니다.
				</div>
			</div>

			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
				<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
					<button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, -7))}>‹ 이전 주</button>
					<div style={{ fontWeight: 700, fontSize: "13px", fontFamily: "'DM Mono',monospace" }}>
						{isoDate(weekDates[0])} ~ {isoDate(weekDates[6])}
					</div>
					<button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(addDays(weekStart, 7))}>다음 주 ›</button>
					<button className="btn btn-ghost btn-sm" onClick={() => setWeekStart(mondayOf(new Date()))}>오늘</button>
				</div>
				<button className="btn btn-primary btn-sm" onClick={() => openAddModal()} disabled={programs.length === 0}>+ 수업 추가</button>
			</div>
			{!loading && programs.length === 0 && (
				<div className="card" style={{ marginBottom: "14px", fontSize: "12px", color: "var(--text-dim)" }}>
					아직 등록된 수업 종류가 없습니다. "수강권/결제" 메뉴에서 수강권을 등록하면 수업도 함께 만들어집니다.
				</div>
			)}

			<div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: expandedSlot ? "16px" : "0" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="attend-table" style={{ tableLayout: "fixed", width: "100%" }}>
						<thead>
							<tr>
								{DAY_KEYS.map((key, i) => {
									const dateIso = isoDate(weekDates[i]);
									return (
										<th key={key} style={{ color: dateIso === todayIso ? "var(--manager)" : undefined }}>
											{DAY_OF_WEEK_LABEL[key]} {mmdd(weekDates[i])}{dateIso === todayIso ? " (오늘)" : ""}
										</th>
									);
								})}
							</tr>
						</thead>
						<tbody>
							<tr>
								{DAY_KEYS.map((key, i) => {
									const dateIso = isoDate(weekDates[i]);
									const daySlots = allSlots.filter(
										(s) => s.dayOfWeek === key && dateIso >= s.validFrom && (!s.validUntil || dateIso <= s.validUntil)
									);
									return (
										<td key={key} style={{ verticalAlign: "top", padding: "8px", background: dateIso === todayIso ? "rgba(var(--manager-rgb),.06)" : undefined }}>
											{loading || slotsLoading ? (
												<span style={{ fontSize: "11px", color: "var(--text-dim)" }}>-</span>
											) : (
												daySlots.map((s) => {
													const program = programsById[s.programId];
													const instructor = instructors.find((x) => x.userId === s.instructorId);
													const instant = s.validFrom === s.validUntil;
													const isSelected = expandedSlot?.id === s.id;
													return (
														<div
															key={s.id}
															onClick={() => setExpandedSlot(isSelected ? null : s)}
															style={{
																background: isSelected ? "rgba(124,106,247,0.12)" : "var(--surface2)",
																border: isSelected ? "1px solid var(--manager)" : "1px solid transparent",
																borderRadius: "var(--radius-sm)", padding: "8px", marginBottom: "6px", cursor: "pointer"
															}}
														>
															<div style={{ fontSize: "12px", fontWeight: 700 }}>{s.name || program?.name || "-"}</div>
															{s.name && (
																<div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{program?.name || "-"}</div>
															)}
															<div style={{ fontSize: "10px", color: "var(--text-sub)", marginTop: "2px" }}>
																{instructor?.name || "-"} · {instant ? "1회" : "매주"}
															</div>
															<div style={{ fontSize: "11px", fontFamily: "'DM Mono',monospace", color: "var(--manager)", marginTop: "4px" }}>
																{s.startTime?.slice(0, 5)}-{s.endTime?.slice(0, 5)}
															</div>
														</div>
													);
												})
											)}
											<button
												className="btn btn-ghost btn-sm"
												style={{ width: "100%", marginTop: "4px", fontSize: "11px" }}
												onClick={() => openAddModal(key, dateIso)}
											>
												+ 추가
											</button>
										</td>
									);
								})}
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{expandedSlot && expandedProgram && (
				<div className="card">
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
						<div>
							<div style={{ fontWeight: 700 }}>
								{expandedSlot.name || expandedProgram.name}
								{" "}<span style={{ fontWeight: 400, color: "var(--text-dim)", fontSize: "12px" }}>
									({expandedProgram.name} · {PROGRAM_TYPE_LABEL[expandedProgram.type] || expandedProgram.type}
									{expandedProgram.type === "GROUP" && ` · ${ENROLLMENT_MODE_LABEL[expandedProgram.enrollmentMode] || expandedProgram.enrollmentMode}`})
								</span>
							</div>
							<div style={{ fontSize: "12px", color: "var(--text-sub)", marginTop: "4px" }}>
								강사: {instructors.find((i) => i.userId === expandedSlot.instructorId)?.name || "-"} ·
								{" "}{DAY_OF_WEEK_LABEL[expandedSlot.dayOfWeek]}요일 {expandedSlot.startTime?.slice(0, 5)}-{expandedSlot.endTime?.slice(0, 5)}
								{" "}· {expandedSlot.validFrom === expandedSlot.validUntil
									? `1회성 (${expandedSlot.validFrom})`
									: `매주 반복 (${expandedSlot.validFrom} ~ ${expandedSlot.validUntil || "무기한"})`}
							</div>
						</div>
						<button className="btn btn-ghost btn-sm" onClick={() => removeSlot(expandedSlot)}>수업 삭제</button>
					</div>

					{isFixedRoster && (
						<div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
							<div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
								정원 {expandedProgram.capacity}명 중 {(roster || []).length}명 등록됨 (고정 로스터)
							</div>
							{!roster ? (
								<div style={{ fontSize: "12px", color: "var(--text-dim)" }}>불러오는 중...</div>
							) : roster.length === 0 ? (
								<div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "10px" }}>등록된 학생이 없습니다</div>
							) : (
								<div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
									{roster.map((m) => {
										const member = members.find((mm) => mm.userId === m.userId && mm.userPassId === m.userPassId);
										return (
											<div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
												<span>{member?.name || m.userId} <span style={{ color: "var(--text-dim)", fontSize: "11px" }}>({member?.passName || "-"})</span></span>
												<button className="btn btn-ghost btn-sm" onClick={() => removeMember(m.id)}>제외</button>
											</div>
										);
									})}
								</div>
							)}
							<div style={{ display: "flex", gap: "8px" }}>
								<select value={newMemberKey} onChange={(e) => setNewMemberKey(e.target.value)} style={{ flex: 1 }}>
									<option value="">학생 선택 (수강권별)</option>
									{members
										.filter((m) => !(roster || []).some((r) => r.userId === m.userId && r.userPassId === m.userPassId))
										.map((m) => (
											<option key={`${m.userId}::${m.userPassId}`} value={`${m.userId}::${m.userPassId}`}>
												{m.name} — {m.passName}
											</option>
										))}
								</select>
								<button className="btn btn-primary btn-sm" onClick={addMember} disabled={!newMemberKey}>추가</button>
							</div>
						</div>
					)}
				</div>
			)}

			<div className="modal-overlay" id="addSlotModal">
				<div className="modal-box">
					<div className="modal-header">
						<div className="modal-title">수업 추가</div>
						<button className="modal-close" onClick={() => closeModal("addSlotModal")}>✕</button>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<div className="form-field">
							<label>프로그램</label>
							<select value={addForm.programId} onChange={(e) => setAddForm({ ...addForm, programId: e.target.value })}>
								<option value="">선택하세요</option>
								{programs.map((p) => (
									<option key={p.id} value={p.id}>{p.name} ({PROGRAM_TYPE_LABEL[p.type] || p.type})</option>
								))}
							</select>
						</div>
						<div className="form-field">
							<label>수업 이름 (선택, 예: 그룹반A)</label>
							<input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="비워두면 프로그램명으로 표시됩니다" />
						</div>
						<div className="form-field">
							<label>강사</label>
							<select value={addForm.instructorId} onChange={(e) => setAddForm({ ...addForm, instructorId: e.target.value })}>
								<option value="">선택하세요</option>
								{instructors.map((i) => <option key={i.userId} value={i.userId}>{i.name}</option>)}
							</select>
						</div>
						<div className="form-field">
							<label>일정 유형</label>
							<div style={{ display: "flex", gap: "8px" }}>
								<button
									type="button"
									className={`filter-chip ${addForm.scheduleType === "RECURRING" ? "active" : ""}`}
									onClick={() => setAddForm({ ...addForm, scheduleType: "RECURRING" })}
								>
									매주 반복
								</button>
								<button
									type="button"
									className={`filter-chip ${addForm.scheduleType === "INSTANT" ? "active" : ""}`}
									onClick={() => setAddForm({ ...addForm, scheduleType: "INSTANT" })}
								>
									1회성(인스턴트)
								</button>
							</div>
						</div>

						{addForm.scheduleType === "RECURRING" ? (
							<>
								<div className="form-field">
									<label>요일</label>
									<select value={addForm.dayOfWeek} onChange={(e) => setAddForm({ ...addForm, dayOfWeek: e.target.value })}>
										{DAY_KEYS.map((key) => <option key={key} value={key}>{DAY_OF_WEEK_LABEL[key]}요일</option>)}
									</select>
								</div>
								<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
									<div className="form-field">
										<label>시작일</label>
										<input type="date" value={addForm.validFrom} onChange={(e) => setAddForm({ ...addForm, validFrom: e.target.value })} />
									</div>
									<div className="form-field">
										<label>종료일 (선택, 무기한이면 비워둠)</label>
										<input type="date" value={addForm.validUntil} onChange={(e) => setAddForm({ ...addForm, validUntil: e.target.value })} />
									</div>
								</div>
							</>
						) : (
							<div className="form-field">
								<label>날짜</label>
								<input type="date" value={addForm.date} onChange={(e) => setAddForm({ ...addForm, date: e.target.value })} />
							</div>
						)}

						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
							<div className="form-field">
								<label>시작 시간</label>
								<input type="time" value={addForm.startTime} onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })} />
							</div>
							<div className="form-field">
								<label>종료 시간</label>
								<input type="time" value={addForm.endTime} onChange={(e) => setAddForm({ ...addForm, endTime: e.target.value })} />
							</div>
						</div>
						{addError && <div style={{ color: "var(--red)", fontSize: "12px" }}>{addError}</div>}
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
							<button className="btn btn-ghost" onClick={() => closeModal("addSlotModal")}>취소</button>
							<button className="btn btn-primary" onClick={submitAdd} disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
