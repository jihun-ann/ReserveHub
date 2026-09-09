import { useState, useEffect, useCallback } from "react";
import { openModal, closeModal } from "../default.js";
import { listFacilities, createFacility, updateFacility, deactivateFacility } from "../../api/common.js";

const EMPTY_FORM = { name: "", description: "" };

export default function OwnerFacilityView({ platformId }) {
	const [facilities, setFacilities] = useState([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState(EMPTY_FORM);
	const [editingId, setEditingId] = useState(null);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

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
		setForm({ name: facility.name, description: facility.description || "" });
		setError("");
		openModal("facilityModal");
	}

	async function submit() {
		if (!form.name.trim()) return;
		setSaving(true);
		setError("");
		try {
			if (editingId) await updateFacility(editingId, form);
			else await createFacility(platformId, form);
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

			<div className="card" style={{ padding: "0", overflow: "hidden" }}>
				<div style={{ overflowX: "auto" }}>
					<table className="data-table">
						<thead>
							<tr><th>시설물명</th><th>설명</th><th>상태</th><th></th></tr>
						</thead>
						<tbody>
							{loading ? (
								<tr><td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>불러오는 중...</td></tr>
							) : facilities.length === 0 ? (
								<tr><td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--text-dim)" }}>등록된 시설물이 없습니다</td></tr>
							) : (
								facilities.map((f) => (
									<tr key={f.id}>
										<td style={{ fontWeight: 600 }}>{f.name}</td>
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
