import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { listFacilities, createFacility, updateFacility, updateFacilityPosition, deactivateFacility } from "../../api/common.js";

const EMPTY_FORM = { name: "", description: "", floor: "", capacity: 1, openTime: "", closeTime: "" };
const UNSPECIFIED_FLOOR = "미지정";

export default function OwnerFacilityView({ platformId }) {
	const [facilities, setFacilities] = useState([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState(EMPTY_FORM);
	const [editingId, setEditingId] = useState(null);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [selectedFloor, setSelectedFloor] = useState(null);

	const refresh = useCallback(async () => {
		if (!platformId) {
			setFacilities([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setFacilities(await listFacilities(platformId));
		setLoading(false);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function openCreate() {
		setEditingId(null);
		setForm(EMPTY_FORM);
		setError("");
		openModal("facilityModal");
	}

	function openEdit(facility) {
		setEditingId(facility.id);
		setForm({
			name: facility.name,
			description: facility.description || "",
			floor: facility.floor || "",
			capacity: facility.capacity || 1,
			openTime: facility.openTime ? facility.openTime.slice(0, 5) : "",
			closeTime: facility.closeTime ? facility.closeTime.slice(0, 5) : ""
		});
		setError("");
		openModal("facilityModal");
	}

	async function submit() {
		if (!form.name.trim()) return;
		setSaving(true);
		setError("");
		try {
			const payload = { ...form, capacity: Number(form.capacity) || 1, openTime: form.openTime || null, closeTime: form.closeTime || null };
			if (editingId) await updateFacility(editingId, payload);
			else await createFacility(platformId, payload);
			closeModal("facilityModal");
			await refresh();
		} catch (err) {
			setError(err.message || "시설물 저장에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	}

	async function stop(id) {
		await deactivateFacility(id);
		await refresh();
	}

	function onDragStart(e, facilityId) {
		e.dataTransfer.setData("text/plain", facilityId);
	}

	async function onCanvasDrop(e) {
		e.preventDefault();
		const id = e.dataTransfer.getData("text/plain");
		if (!id) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const posX = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
		const posY = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
		await updateFacilityPosition(id, posX, posY);
		await refresh();
	}

	const floors = [...new Set(facilities.map((f) => f.floor || UNSPECIFIED_FLOOR))];
	const activeFloor = selectedFloor && floors.includes(selectedFloor) ? selectedFloor : floors[0];
	const onFloor = facilities.filter((f) => (f.floor || UNSPECIFIED_FLOOR) === activeFloor);
	const placed = onFloor.filter((f) => f.posX != null && f.posY != null);
	const unplaced = onFloor.filter((f) => f.posX == null || f.posY == null);

	return (
		<>
		<div className="page" id="owner-facility">
			<div className="page-header">
				<div className="page-label">Facilities</div>
				<div className="page-title">시설물 관리</div>
				<div className="page-subtitle">연습실 등 예약 가능한 시설물을 등록하세요. 사용자는 등록된 시설물을 시간대별로 예약합니다.</div>
			</div>

			<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "14px" }}>
				<button className="btn btn-primary btn-sm" onClick={openCreate}>+ 시설물 추가</button>
			</div>

			{!loading && facilities.length > 0 && (
				<div style={{ marginBottom: "20px" }}>
					<div className="card-title" style={{ marginBottom: "10px" }}>배치도</div>
					{floors.length > 0 && (
						<div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
							{floors.map((fl) => (
								<button
									key={fl}
									className={`filter-chip ${fl === activeFloor ? "active" : ""}`}
									onClick={() => setSelectedFloor(fl)}
								>
									{fl}
								</button>
							))}
						</div>
					)}
					{unplaced.length > 0 && (
						<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
							{unplaced.map((f) => (
								<div
									key={f.id}
									draggable
									onDragStart={(e) => onDragStart(e, f.id)}
									className="plat-chip"
									style={{ cursor: "grab", background: "var(--surface2)", color: "var(--text-sub)", borderColor: "var(--border)" }}
								>
									{f.name}
								</div>
							))}
						</div>
					)}
					<div
						onDragOver={(e) => e.preventDefault()}
						onDrop={onCanvasDrop}
						style={{
							position: "relative",
							width: "100%",
							height: "360px",
							background: "var(--surface2)",
							border: "1px dashed var(--border)",
							borderRadius: "var(--radius)"
						}}
					>
						{placed.length === 0 && (
							<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "12px" }}>
								위 목록에서 시설물을 이 영역으로 드래그해 배치하세요
							</div>
						)}
						{placed.map((f) => (
							<div
								key={f.id}
								draggable
								onDragStart={(e) => onDragStart(e, f.id)}
								style={{
									position: "absolute",
									left: `${f.posX}%`,
									top: `${f.posY}%`,
									transform: "translate(-50%, -50%)",
									cursor: "grab",
									padding: "8px 12px",
									background: "var(--surface)",
									border: "1px solid var(--border)",
									borderRadius: "var(--radius-sm)",
									fontSize: "12px",
									fontWeight: 600,
									whiteSpace: "nowrap"
								}}
							>
								{f.name}
							</div>
						))}
					</div>
				</div>
			)}

			<div className="card" style={{ padding: "0", overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr><th>시설물명</th><th>층</th><th>정원</th><th>이용시간</th><th>설명</th><th>상태</th><th></th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : facilities.length === 0 ? (
								<tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>등록된 시설물이 없습니다</td></tr>
							) : (
								facilities.map((f) => (
									<tr key={f.id}>
										<td style={{ fontWeight: 600 }}>{f.name}</td>
										<td style={{ color: "var(--text-sub)" }}>{f.floor || "-"}</td>
										<td style={{ color: "var(--text-sub)" }}>{f.capacity}명</td>
										<td style={{ color: "var(--text-sub)", fontFamily: "'DM Mono',monospace", fontSize: "12px" }}>
											{f.openTime && f.closeTime ? `${f.openTime.slice(0, 5)}~${f.closeTime.slice(0, 5)}` : "제한 없음"}
										</td>
										<td style={{ color: "var(--text-sub)" }}>{f.description || "-"}</td>
										<td>
											<span className={`badge ${f.isActive ? "bs-active" : "bs-expired"}`} style={{ fontSize: "10px" }}>
												{f.isActive ? "사용중" : "폐쇄"}
											</span>
										</td>
										<td style={{ display: "flex", gap: "4px" }}>
											<button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}>수정</button>
											{f.isActive && (
												<button className="btn btn-ghost btn-sm" onClick={() => stop(f.id)}>폐쇄</button>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div className="modal-overlay" id="facilityModal">
			<div className="modal-box">
				<div className="modal-header">
					<div className="modal-title">{editingId ? "시설물 수정" : "시설물 추가"}</div>
					<button className="modal-close" onClick={() => closeModal("facilityModal")}>✕</button>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
					<div className="form-field">
						<label>시설물명</label>
						<input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 2층 연습실" />
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
						<div className="form-field">
							<label>층 (선택)</label>
							<input type="text" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="예: 1층, 지하1층" />
						</div>
						<div className="form-field">
							<label>정원 (동시 이용 가능 인원)</label>
							<input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
						</div>
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
						<div className="form-field">
							<label>이용 시작 시간 (선택)</label>
							<input type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
						</div>
						<div className="form-field">
							<label>이용 종료 시간 (선택)</label>
							<input type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
						</div>
					</div>
					<div className="form-field">
						<label>설명 (선택)</label>
						<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="예: 최대 10명, 거울/스피커 구비" />
					</div>
					{error && <div style={{ color: "var(--red)", fontSize: "12px" }}>{error}</div>}
					<div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
						<button className="btn btn-ghost" onClick={() => closeModal("facilityModal")}>취소</button>
						<button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
					</div>
				</div>
			</div>
		</div>
		</>
	);
}
