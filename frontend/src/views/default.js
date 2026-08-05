//사이드바 닫기
export function closeSidebar() {
	document.querySelector(".sidebar")?.classList.remove("open");
	document.querySelector(".overlay")?.classList.remove("open");
}
//사이드바 토글
export function toggleCollapse() {
	document.querySelector(".sidebar")?.classList.toggle("collapsed");
}

//작은 화면시 사이드바 열기
export function openSidebar() {
	document.querySelector(".sidebar")?.classList.add("open");
	document.querySelector(".overlay")?.classList.add("open");
}

//모달 열기/닫기 (.modal-overlay + .open 조합으로 표시)
export function openModal(id) {
	document.getElementById(id).classList.add("open");
}
export function closeModal(id) {
	document.getElementById(id).classList.remove("open");
}
