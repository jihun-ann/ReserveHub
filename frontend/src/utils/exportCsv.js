// 엑셀에서 바로 열리는 CSV로 내보낸다 — 별도 라이브러리 없이 Blob + 다운로드 링크로 충분하다.
export function exportCsv(filename, headers, rows) {
	const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
	const lines = [headers, ...rows].map((row) => row.map(escape).join(","));
	// BOM(﻿)을 붙여야 엑셀이 UTF-8(한글)로 올바르게 읽는다.
	const blob = new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
