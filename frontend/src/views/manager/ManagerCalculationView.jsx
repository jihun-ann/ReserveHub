import { useState, useEffect, useCallback } from "react";
import { Copy, Wallet } from "lucide-react";
import { listPasses, listDiscountPolicies } from "../../api/common.js";

function fmt(n) {
	return Math.round(n).toLocaleString() + "원";
}
function timestamp() {
	const now = new Date();
	return `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${now.toTimeString().slice(0, 5)}`;
}

export default function ManagerCalculationView({ platformId, platformName }) {
	const [passes, setPasses] = useState([]);
	const [discounts, setDiscounts] = useState([]);
	const [selectedPasses, setSelectedPasses] = useState({}); // passId -> qty
	const [selectedDiscounts, setSelectedDiscounts] = useState({}); // discountId -> bool
	const [customDiscOn, setCustomDiscOn] = useState(false);
	const [customDiscVal, setCustomDiscVal] = useState(0);
	const [memo, setMemo] = useState("");
	const [history, setHistory] = useState([]);
	const [toast, setToast] = useState("");

	const refresh = useCallback(async () => {
		if (!platformId) {
			setPasses([]);
			setDiscounts([]);
			return;
		}
		const [passList, discountList] = await Promise.all([listPasses(platformId), listDiscountPolicies(platformId)]);
		setPasses(passList);
		setDiscounts(discountList);
	}, [platformId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	function togglePass(id) {
		setSelectedPasses((prev) => {
			const next = { ...prev };
			if (next[id]) delete next[id];
			else next[id] = 1;
			return next;
		});
	}
	function setQty(id, qty) {
		setSelectedPasses((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
	}
	function toggleDiscount(id) {
		setSelectedDiscounts((prev) => ({ ...prev, [id]: !prev[id] }));
	}

	const chosenPasses = passes
		.filter((p) => selectedPasses[p.id])
		.map((p) => ({ ...p, qty: selectedPasses[p.id], lineTotal: p.price * selectedPasses[p.id] }));
	const subtotal = chosenPasses.reduce((sum, p) => sum + p.lineTotal, 0);

	const chosenDiscounts = discounts.filter((d) => selectedDiscounts[d.id]);
	let running = subtotal;
	const steps = [];
	chosenDiscounts.forEach((d) => {
		const amt = (running * Number(d.rate)) / 100;
		steps.push({ name: d.name, rate: Number(d.rate), amt, before: running, after: running - amt });
		running -= amt;
	});
	if (customDiscOn && customDiscVal > 0) {
		const amt = (running * customDiscVal) / 100;
		steps.push({ name: "직접 할인", rate: customDiscVal, amt, before: running, after: running - amt });
		running -= amt;
	}
	const totalSaved = subtotal - running;
	const final = running;

	function reset() {
		setSelectedPasses({});
		setSelectedDiscounts({});
		setCustomDiscOn(false);
		setCustomDiscVal(0);
		setMemo("");
	}

	function previewText() {
		const lines = [`[${platformName || "플랫폼"} 수강권 안내]`, ""];
		if (chosenPasses.length) {
			lines.push("■ 수강권");
			chosenPasses.forEach((p) => lines.push(`  · ${p.name} × ${p.qty}  ${fmt(p.lineTotal)}`));
			lines.push(`  소계: ${fmt(subtotal)}`);
			lines.push("");
		}
		if (steps.length) {
			lines.push("■ 할인 내역");
			steps.forEach((d, i) => lines.push(`  ${i + 1}. ${d.name} ${d.rate}%  — ${fmt(d.amt)}`));
			lines.push(`  총 절약: ${fmt(totalSaved)}`);
			lines.push("");
		}
		lines.push(`■ 최종 금액: ${fmt(final)}`);
		if (memo) {
			lines.push("");
			lines.push(`메모: ${memo}`);
		}
		return lines.join("\n");
	}

	async function copyQuote() {
		const text = previewText();
		try {
			await navigator.clipboard.writeText(text);
			setToast("📋 클립보드에 복사되었습니다!");
		} catch {
			setToast("📋 복사 완료!");
		}
		setHistory((prev) => [
			{ id: crypto.randomUUID(), passesLabel: chosenPasses.map((p) => `${p.name}×${p.qty}`).join(", ") || "—", final: fmt(final), ts: timestamp() },
			...prev
		]);
		setTimeout(() => setToast(""), 2000);
	}

	return (
		<div className="page" id="manager-calc">
			<div className="page-header">
				<div className="page-label">CALCULATOR</div>
				<div className="page-title">상담 계산툴</div>
				<div className="page-subtitle">수강권을 선택하고 할인을 적용해 최종 견적을 계산하세요</div>
			</div>

			<div className="grid-2col-even" style={{ gap: "20px" }}>
				<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
					<div className="card">
						<div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<span>① 수강권 선택</span>
							<span style={{ fontSize: "11px", color: "var(--text-sub)", fontWeight: "400" }}>복수 선택 가능</span>
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
							{passes.length === 0 && (
								<div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "8px 0" }}>등록된 수강권이 없습니다</div>
							)}
							{passes.map((p) => (
								<div key={p.id} className={`calc-pass-row ${selectedPasses[p.id] ? "checked" : ""}`} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
									<input type="checkbox" checked={!!selectedPasses[p.id]} onChange={() => togglePass(p.id)} style={{ width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }} />
									<div style={{ flex: 1 }} onClick={() => togglePass(p.id)}>
										<div style={{ fontSize: "13px", fontWeight: 600 }}>{p.name}</div>
										<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>{p.price.toLocaleString()}원 · {p.validDays}일</div>
									</div>
									{selectedPasses[p.id] && (
										<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
											<button className="btn btn-ghost btn-sm" onClick={() => setQty(p.id, selectedPasses[p.id] - 1)}>-</button>
											<span className="qty-val" style={{ minWidth: "16px", textAlign: "center" }}>{selectedPasses[p.id]}</span>
											<button className="btn btn-ghost btn-sm" onClick={() => setQty(p.id, selectedPasses[p.id] + 1)}>+</button>
										</div>
									)}
								</div>
							))}
						</div>
					</div>

					<div className="card">
						<div className="card-title">② 할인 적용</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
							{discounts.length === 0 && (
								<div style={{ fontSize: "12px", color: "var(--text-dim)", padding: "8px 0" }}>등록된 할인 정책이 없습니다</div>
							)}
							{discounts.map((d) => (
								<div key={d.id} className="calc-disc-row" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
									<input type="checkbox" checked={!!selectedDiscounts[d.id]} onChange={() => toggleDiscount(d.id)} style={{ width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }} />
									<div style={{ flex: 1 }} onClick={() => toggleDiscount(d.id)}>
										<div style={{ fontSize: "13px", fontWeight: 600 }}>{d.name}</div>
										<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>{d.rate}% 할인</div>
									</div>
								</div>
							))}
							<div className="calc-disc-row" style={{ marginTop: "6px", gap: "10px", display: "flex", alignItems: "center" }}>
								<input type="checkbox" checked={customDiscOn} onChange={(e) => setCustomDiscOn(e.target.checked)} style={{ width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }} />
								<div style={{ flex: 1 }}>
									<div style={{ fontSize: "13px", fontWeight: 600 }}>직접 할인 입력</div>
									<div style={{ fontSize: "11px", color: "var(--text-sub)" }}>임의 할인율 적용</div>
								</div>
								<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
									<input
										type="number" min="0" max="100" value={customDiscVal}
										onChange={(e) => setCustomDiscVal(Number(e.target.value) || 0)}
										style={{ width: "60px", padding: "4px 8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", fontFamily: "'DM Mono',monospace", outline: "none", textAlign: "center" }}
									/>
									<span style={{ fontSize: "13px", color: "var(--text-sub)" }}>%</span>
								</div>
							</div>
						</div>
					</div>

					<div className="card">
						<div className="card-title">③ 상담 메모</div>
						<textarea
							value={memo} onChange={(e) => setMemo(e.target.value)}
							placeholder="고객 특이사항이나 메모를 입력하세요..."
							style={{ width: "100%", minHeight: "72px", padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--rs)", color: "var(--text)", fontSize: "13px", fontFamily: "'Pretendard',sans-serif", outline: "none", resize: "vertical" }}
						></textarea>
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
					<div className="card">
						<div className="card-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
							<span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Wallet size={15} strokeWidth={1.75} /> 견적서</span>
							<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "var(--text-dim)" }}>{timestamp()}</span>
						</div>
						<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "6px", letterSpacing: ".5px" }}>수강권</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
							{chosenPasses.length === 0 ? (
								<div className="quote-row"><span style={{ fontSize: "12px", color: "var(--text-sub)" }}>수강권을 선택하세요</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "var(--text-dim)" }}>0원</span></div>
							) : (
								chosenPasses.map((p) => (
									<div className="quote-row" key={p.id}>
										<span style={{ fontSize: "12px" }}>{p.name} × {p.qty}</span>
										<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "var(--manager)" }}>{fmt(p.lineTotal)}</span>
									</div>
								))
							)}
						</div>
						<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", padding: "8px 10px", background: "var(--surface2)", borderRadius: "var(--rs)" }}>
							<span style={{ fontSize: "12px", color: "var(--text-sub)" }}>소계</span>
							<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", fontWeight: "600" }}>{fmt(subtotal)}</span>
						</div>
						<div style={{ fontSize: "11px", color: "var(--text-sub)", marginBottom: "6px", letterSpacing: ".5px" }}>할인 내역 (순차 적용)</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
							{steps.length === 0 ? (
								<div className="quote-row"><span style={{ fontSize: "12px", color: "var(--text-sub)" }}>할인 없음</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "var(--text-dim)" }}>0원</span></div>
							) : (
								steps.map((d, i) => (
									<div className="quote-disc-row" key={i}>
										<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
											<span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent2)" }}>{i + 1}. {d.name} ({d.rate}%)</span>
											<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", color: "var(--red)" }}>— {fmt(d.amt)}</span>
										</div>
										<div style={{ fontSize: "10px", color: "var(--text-dim)" }}>{fmt(d.before)} × {d.rate}% → {fmt(d.after)}</div>
									</div>
								))
							)}
						</div>
						<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
							<span style={{ fontSize: "12px", color: "var(--text-sub)" }}>총 절약</span>
							<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", color: "var(--red)" }}>— {fmt(totalSaved)}</span>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "rgba(79,209,197,.08)", border: "1px solid rgba(79,209,197,.3)", borderRadius: "var(--rs)", marginBottom: "14px" }}>
							<span style={{ fontSize: "14px", fontWeight: "700" }}>최종 금액</span>
							<span style={{ fontFamily: "'DM Mono',monospace", fontSize: "22px", fontWeight: "700", color: "var(--manager)" }}>{fmt(final)}</span>
						</div>
						<textarea
							readOnly value={previewText()}
							style={{ width: "100%", minHeight: "120px", padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--rs)", color: "var(--text-sub)", fontSize: "11px", fontFamily: "'DM Mono',monospace", resize: "none", outline: "none", lineHeight: "1.6" }}
						></textarea>
						{toast && <div style={{ fontSize: "12px", color: "var(--green)", marginTop: "6px" }}>{toast}</div>}
						<div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
							<button className="btn btn-primary" style={{ flex: "1", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={copyQuote}><Copy size={15} strokeWidth={1.75} /> 복사해서 전송</button>
							<button className="btn btn-ghost" onClick={reset}>초기화</button>
						</div>
					</div>

					<div className="card">
						<div className="card-title">상담 이력</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
							{history.length === 0 ? (
								<div style={{ fontSize: "12px", color: "var(--text-dim)", textAlign: "center", padding: "12px 0" }}>복사 시 자동 기록됩니다</div>
							) : (
								history.map((h) => (
									<div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: "rgba(79,209,197,.06)", border: "1px solid rgba(79,209,197,.2)", borderRadius: "var(--rs)" }}>
										<div style={{ fontSize: "12px", fontWeight: 600 }}>{h.passesLabel}</div>
										<div style={{ textAlign: "right" }}>
											<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", color: "var(--manager)" }}>{h.final}</div>
											<div style={{ fontFamily: "'DM Mono',monospace", fontSize: "10px", color: "var(--text-dim)" }}>{h.ts}</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
