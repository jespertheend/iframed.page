const iframe = document.querySelector("iframe");
if (iframe) {
	iframe.addEventListener("load", () => {
		iframe.contentWindow?.focus();
	});
}
