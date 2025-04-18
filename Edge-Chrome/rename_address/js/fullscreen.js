function enterFullscreen() {
    chrome.storage.sync.get("fullscreenEnabled", function (data) {
        if (data.fullscreenEnabled) {
            const body = document.body;
            if (body.requestFullscreen) {
                try {
                    body.requestFullscreen();
                    showToast("Redirección completada y pantalla completa activada.");
                } catch (err) {
                    console.error(err);
                    showToast("Redirección completada, y la pantalla completa no se pudo activar.");
                }
            } else if (body.webkitRequestFullscreen) {
                body.webkitRequestFullscreen();
                showToast("Redirección completada y pantalla completa activada.");
            } else if (body.msRequestFullscreen) {
                body.msRequestFullscreen();
                showToast("Redirección completada y pantalla completa activada.");
            } else {
                console.error(
                    "El modo de pantalla completa no es compatible en este navegador."
                );
                showToast("Redirección completada, y la pantalla completa no se pudo activar.");
            }
        } else {
            showToast("Redirección completada.");
        }
    });
}

window.onload = function () {
    enterFullscreen();
};