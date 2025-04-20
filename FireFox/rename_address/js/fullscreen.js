function sendToast(message) {
    if (typeof message !== "string" || !message.trim()) {
        console.error("Mensaje inválido para showToast.");
        return;
    }
    try {
        const port = browser.runtime.connect();
        port.postMessage({ action: "showToast", message });
        port.disconnect();
    } catch (error) {
        console.error("Error enviando toast:", error);
    }
}

function enterFullscreen() {
    browser.storage.sync.get("fullscreenEnabled")
        .then((data) => {
            if (data.fullscreenEnabled) {
                const body = document.body;
                if (document.fullscreenEnabled || body.webkitRequestFullscreen || body.msRequestFullscreen) {
                    if (body.requestFullscreen) {
                        try {
                            body.requestFullscreen();
                            sendToast("Redirección completada y pantalla completa activada.");
                        } catch (err) {
                            console.error(err);
                            sendToast("Redirección completada, pero no se pudo activar la pantalla completa.");
                        }
                    } else if (body.webkitRequestFullscreen) {
                        body.webkitRequestFullscreen();
                        sendToast("Redirección completada y pantalla completa activada.");
                    } else if (body.msRequestFullscreen) {
                        body.msRequestFullscreen();
                        sendToast("Redirección completada y pantalla completa activada.");
                    }
                } else {
                    console.error("El modo de pantalla completa no es compatible en este navegador.");
                    sendToast("Redirección completada, pero la pantalla completa no es compatible.");
                }
            } else {
                sendToast("Redirección completada.");
            }
        })
        .catch((error) => {
            console.error("Error al obtener fullscreenEnabled del storage:", error);
        });
}

window.onload = function () {
    // enterFullscreen();
    sendToast("Redirección completada.");
};