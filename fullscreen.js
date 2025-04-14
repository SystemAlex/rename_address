function showToast(message) {
    const existingToast = document.getElementById("extension-toast");
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.id = "extension-toast";
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.zIndex = "9999";
    toast.style.backgroundColor = "#d1e7dd";
    toast.style.borderRadius = "0.375rem";
    toast.style.border = "1px solid #a3cfbb";
    toast.style.boxSizing = "border-box";
    toast.style.color = "#0a3622";
    toast.style.fontFamily =
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
    toast.style.fontSize = "16px";
    toast.style.fontWeight = "400";
    toast.style.lineHeight = "1.5";
    toast.style.marginBottom = "1rem";
    toast.style.marginTop = "1rem";
    toast.style.padding = "1rem 1.5rem";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "opacity 0.5s ease-out";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 5000);
}

function enterFullscreen() {
    let hasToShowToast = false;
    chrome.storage.sync.get("toastEnabled", function (data) {
        hasToShowToast = data.toastEnabled;
    });

    chrome.storage.sync.get("fullscreenEnabled", function (data) {
        if (data.fullscreenEnabled) {
            const body = document.body;
            if (body.requestFullscreen) {
                try {
                    body.requestFullscreen();
                    if (hasToShowToast)
                        showToast("Redirección completada y pantalla completa activada.");
                } catch (err) {
                    console.error(err);
                    if (hasToShowToast)
                        showToast(
                            "Redirección completada, y la pantalla completa no se pudo activar."
                        );
                }
            } else if (body.webkitRequestFullscreen) {
                body.webkitRequestFullscreen();
                if (hasToShowToast)
                    showToast("Redirección completada y pantalla completa activada.");
            } else if (body.msRequestFullscreen) {
                body.msRequestFullscreen();
                if (hasToShowToast)
                    showToast("Redirección completada y pantalla completa activada.");
            } else {
                console.error(
                    "El modo de pantalla completa no es compatible en este navegador."
                );
                if (hasToShowToast)
                    showToast(
                        "Redirección completada, y la pantalla completa no se pudo activar."
                    );
            }
        } else {
            if (hasToShowToast) showToast("Redirección completada.");
        }
    });
}

window.onload = function () {
    enterFullscreen();
};