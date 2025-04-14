function enterFullscreen() {
    const body = document.body;
    if (body.requestFullscreen) {
        body.requestFullscreen();
    } else if (body.webkitRequestFullscreen) { // Para navegadores basados en WebKit.
        body.webkitRequestFullscreen();
    } else if (body.msRequestFullscreen) { // Para Internet Explorer.
        body.msRequestFullscreen();
    } else {
        console.log("El modo de pantalla completa no es compatible en este navegador.");
    }
}

// Ejecuta la función al cargar la página.
window.onload = function() {
    enterFullscreen();
};
