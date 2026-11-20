//사이드바 닫기
export function closeSidebar() {
	document.querySelector(".sidebar")?.classList.remove("open");
	document.querySelector(".overlay")?.classList.remove("open");
}
//사이드바 토글 — 휴대폰 폭(햄버거로 여는 메뉴)에서는 접는 대신 메뉴를 닫는다.
//768px은 각 역할 CSS가 사이드바를 서랍 메뉴로 바꾸는 기준과 같다.
export function toggleCollapse() {
	if (window.matchMedia("(max-width: 768px)").matches) {
		closeSidebar();
		return;
	}
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
