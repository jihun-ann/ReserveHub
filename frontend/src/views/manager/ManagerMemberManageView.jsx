import { useEffect, useState } from "react";
import { openModal, closeModal } from "../default.js";

export default function ManagerMemberManageView() {
	let MEMBERS = [
		{
			name: "박서준",
			phone: "010-5555-4444",
			pass: "개인 10회권",
			exp: "2026.03.12",
			dday: 1,
			status: "soon",
			notes: []
		},
		{
			name: "홍길동",
			phone: "010-1234-5678",
			pass: "그룹 월정액",
			exp: "2026.03.14",
			dday: 3,
			status: "soon",
			notes: []
		},
		{
			name: "김민지",
			phone: "010-9876-5432",
			pass: "그룹 월정액",
			exp: "2026.04.10",
			dday: 30,
			status: "active",
			notes: []
		},
		{
			name: "이나은",
			phone: "010-3333-2222",
			pass: "개인 5회권",
			exp: "2026.03.16",
			dday: 5,
			status: "soon",
			notes: []
		},
		{
			name: "정하준",
			phone: "010-7777-8888",
			pass: "그룹 월정액",
			exp: "2026.04.20",
			dday: 40,
			status: "active",
			notes: []
		},
		{
			name: "오지현",
			phone: "010-1111-9999",
			pass: "그룹 월정액",
			exp: "2026.04.01",
			dday: 21,
			status: "active",
			notes: []
		},
		{
			name: "최유나",
			phone: "010-2020-3030",
			pass: "그룹 월정액",
			exp: "2026.04.15",
			dday: 35,
			status: "active",
			notes: []
		},
		{
			name: "이지은",
			phone: "010-2222-3333",
			pass: "—",
			exp: "만료",
			dday: null,
			status: "expired",
			notes: []
		}
	];

	useEffect(() => {
		window.showMemberDetail = showMemberDetail;
		window.addMemo = addMemo;
		renderMembers();
	});

	const [currentMemberStatusFilter, setCurrentMemberStatusFilter] = useState("all");

	return (
		<>
		<div className="page" id="super-members">
			{/* ══════════════ 회원 관리 ══════════════ */}
			<div className="page-header">
				<div className="page-label">MEMBERS</div>
				<div className="page-title">회원 관리</div>
				<div className="page-subtitle">플랫폼 회원을 조회하고 관리하세요</div>
			</div>
			<div
				style={{
					display: "flex",
					gap: "8px",
					marginBottom: "16px",
					flexWrap: "wrap",
					alignItems: "center"
				}}
			>
				<input
					type="text"
					id="memberSearch"
					placeholder="이름 / 연락처 검색..."
					onInput={renderMembers}
					style={{
						flex: "1",
						minWidth: "160px",
						padding: "8px 14px",
						background: "var(--surface)",
						border: "1px solid var(--border)",
						borderRadius: "20px",
						color: "var(--text)",
						fontSize: "13px",
						outline: "none"
					}}
				/>
				<button
					className={`filter-chip ${currentMemberStatusFilter === "all" ? "active" : ""}`}
					onClick={() => memberFilter("all")}
				>
					전체
				</button>
				<button
					className={`filter-chip ${currentMemberStatusFilter === "active" ? "active" : ""}`}
					onClick={() => memberFilter("active")}
				>
					활성
				</button>
				<button
					className={`filter-chip ${currentMemberStatusFilter === "soon" ? "active" : ""}`}
					onClick={() => memberFilter("soon")}
				>
					만료 임박
				</button>
				<button
					className={`filter-chip ${currentMemberStatusFilter === "expired" ? "active" : ""}`}
					onClick={() => memberFilter("expired")}
				>
					만료
				</button>
				<button className="btn btn-primary btn-sm" onClick={() => openModal("addMemberModal")}>
					+ 회원 등록
				</button>
			</div>
			<div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "16px" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table" id="memberTable">
						<thead>
							<tr>
								<th>이름</th>
								<th>연락처</th>
								<th>수강권</th>
								<th>만료일</th>
								<th>D-day</th>
								<th>상태</th>
								<th></th>
							</tr>
						</thead>
						<tbody id="memberTbody">{/* JS 렌더 */}</tbody>
					</table>
				</div>
			</div>
			<div id="memberDetailPanel" style={{ display: "none" }}>
				{/* JS 렌더 */}
			</div>
		</div>

		{/* 회원 등록 모달 */}
		<div className="modal-overlay" id="addMemberModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">회원 등록</div>
					<button className="modal-close" onClick={() => closeModal("addMemberModal")}>
						✕
					</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>이름</label>
						<input type="text" id="newMemberName" placeholder="회원 이름" />
					</div>
					<div className="form-field">
						<label>연락처</label>
						<input type="tel" id="newMemberPhone" placeholder="010-0000-0000" />
					</div>
					<div className="form-field">
						<label>수강권</label>
						<input type="text" id="newMemberPass" placeholder="예: 그룹 월정액" />
					</div>
					<div className="form-field">
						<label>만료일</label>
						<input type="date" id="newMemberExp" />
					</div>
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("addMemberModal")}>
							취소
						</button>
						<button className="btn btn-primary" onClick={addMember}>
							저장
						</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);

	function memberFilter(status) {
		setCurrentMemberStatusFilter(status);
	}

	function addMember() {
		const name = document.getElementById("newMemberName").value.trim();
		const phone = document.getElementById("newMemberPhone").value.trim();
		const pass = document.getElementById("newMemberPass").value.trim();
		const exp = document.getElementById("newMemberExp").value;
		if (!name) return;
		MEMBERS.push({ name, phone, pass: pass || "—", exp: exp || "—", dday: null, status: "active", notes: [] });
		document.getElementById("newMemberName").value = "";
		document.getElementById("newMemberPhone").value = "";
		document.getElementById("newMemberPass").value = "";
		document.getElementById("newMemberExp").value = "";
		renderMembers();
		closeModal("addMemberModal");
	}

	function renderMembers() {
		const search = (document.getElementById("memberSearch")?.value || "").trim().toLowerCase();
		const tbody = document.getElementById("memberTbody");
		if (!tbody) return;
		const filtered = MEMBERS.filter((m) => {
			const matchFilter =
				currentMemberStatusFilter === "all" || m.status === currentMemberStatusFilter;
			const matchSearch = !search || m.name.includes(search) || m.phone.includes(search);
			return matchFilter && matchSearch;
		});
		tbody.innerHTML = filtered
			.map((m, i) => {
				const realIdx = MEMBERS.indexOf(m);
				const ddayEl =
					m.dday === null
						? "—"
						: m.status === "expired"
							? `<span class="badge bs-expired" style="font-size:10px">만료</span>`
							: m.dday <= 3
								? `<span class="badge bs-expired" style="font-size:10px">D-${m.dday}</span>`
								: m.dday <= 7
									? `<span class="badge bs-soon" style="font-size:10px">D-${m.dday}</span>`
									: `<span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--accent2)">D-${m.dday}</span>`;
				const stMap = { active: "bs-active", soon: "bs-soon", expired: "bs-expired" };
				const stLbl = { active: "활성", soon: "임박", expired: "만료" };
				return `<tr>
      <td style="font-weight:600">${m.name}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px">${m.phone}</td>
      <td>${m.pass}</td>
      <td style="font-family:'DM Mono',monospace;font-size:12px">${m.exp}</td>
      <td>${ddayEl}</td>
      <td><span class="badge ${stMap[m.status]}" style="font-size:10px">${stLbl[m.status]}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="showMemberDetail(${realIdx})">상세</button></td>
    </tr>`;
			})
			.join("");
	}

	function showMemberDetail(idx) {
		let memberDetailIdx = idx;
		const m = MEMBERS[idx];
		const panel = document.getElementById("memberDetailPanel");
		if (!panel) return;
		panel.style.display = "block";
		panel.innerHTML = `
    <div class="member-detail">
      <div class="member-detail-header">
        <div style="font-size:16px;font-weight:700">${m.name} 상세 정보</div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('memberDetailPanel').style.display='none'">닫기</button>
      </div>
      <div class="member-detail-grid" style="margin-bottom:16px">
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--accent2)">${m.pass}</div><div class="detail-stat-key">현재 수강권</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:${m.status === "expired" ? "var(--red)" : "var(--accent3)"}">${m.exp}</div><div class="detail-stat-key">만료일</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--green)">18회</div><div class="detail-stat-key">이번달 출석</div></div>
        <div class="detail-stat"><div class="detail-stat-val" style="color:var(--accent)">92%</div><div class="detail-stat-key">출결률</div></div>
      </div>
      <!-- 메모 -->
      <div style="font-size:11px;color:var(--text-sub);margin-bottom:8px;font-weight:600;letter-spacing:.5px">CONSULTATION NOTES</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;min-height:40px" id="memoList-${idx}">
        ${
					m.notes.length === 0
						? '<div style="font-size:12px;color:var(--text-dim);padding:8px 0">상담 메모가 없습니다</div>'
						: m.notes
								.map(
									(n) =>
										`<div class="memo-item"><span class="memo-date">${n.date}</span><div style="flex:1;font-size:12px">${n.text}</div><span class="memo-author">${n.author}</span></div>`
								)
								.join("")
				}
      </div>
      <div style="display:flex;gap:8px">
        <input type="text" id="memoInput-${idx}" placeholder="상담 메모 입력..." style="flex:1;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;outline:none;font-family:'Pretendard',sans-serif;">
        <button class="btn btn-primary btn-sm" style="background:var(--accent);color:#0f0f13" onclick="addMemo(${idx})">추가</button>
      </div>
    </div>`;
		panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}

	function addMemo(idx) {
		const input = document.getElementById(`memoInput-${idx}`);
		const text = input.value.trim();
		if (!text) return;
		const now = new Date();
		const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
		MEMBERS[idx].notes.push({ date, text, author: "정미래 점장" });
		showMemberDetail(idx);
	}
}
