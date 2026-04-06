//사이드바 닫기
export function closeSidebar() {
	document.getElementById("user-sidebar").classList.remove("open");
	document.getElementById("user-overlay").classList.remove("open");
}
//사이드바 토글
export function toggleCollapse() {
	document.getElementById("user-sidebar").classList.toggle("collapsed");
}

//작은 화면시 사이드바 열기
export function openSidebar() {
	document.getElementById("user-sidebar").classList.add("open");
	document.getElementById("user-overlay").classList.add("open");
}
