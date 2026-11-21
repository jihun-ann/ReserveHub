// 회원 이름·메모처럼 사용자가 적은 문자열이 =, +, -, @ (또는 탭/CR)로 시작하면 엑셀이 수식으로 실행한다(CSV 수식 주입).
// 앞에 '를 붙여 글자로만 보이게 한다. 숫자(음수 금액 등)는 숫자로 남아야 하므로 건드리지 않는다.
export function neutralizeFormula(v) {
	if (typeof v === "number") return String(v);
	const s = String(v ?? "");
	return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

// 엑셀에서 바로 열리는 CSV로 내보낸다 — 별도 라이브러리 없이 Blob + 다운로드 링크로 충분하다.
export function exportCsv(filename, headers, rows) {
	const escape = (v) => `"${neutralizeFormula(v).replace(/"/g, '""')}"`;
	const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
	// BOM(U+FEFF)을 붙여야 엑셀이 UTF-8(한글)로 올바르게 읽는다.
	const blob = new Blob([String.fromCharCode(0xfeff) + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
