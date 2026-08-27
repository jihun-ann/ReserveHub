const KEY = "reservehub-theme";

export function getTheme() {
	return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
}

export function applyTheme(theme) {
	document.documentElement.setAttribute("data-theme", theme);
	localStorage.setItem(KEY, theme);
}

export function toggleTheme() {
	const next = getTheme() === "dark" ? "light" : "dark";
	applyTheme(next);
	return next;
}
