function saveOptions() {
    const fullscreenEnabled = document.getElementById("fullscreenToggle").checked;
    const toastEnabled = document.getElementById("toastToggle").checked;
    const redirectionEnabled = document.getElementById('redirectionToggle').checked;
    chrome.storage.sync.set({ fullscreenEnabled, toastEnabled, redirectionEnabled }, function () {
        showToast("Opciones guardadas!");
    });
}

// Función para restaurar opciones al cargar la página
function restoreOptions() {
    chrome.storage.sync.get(
        ["fullscreenEnabled", "toastEnabled", "redirectionEnabled"],
        function (data) {
            document.getElementById("fullscreenToggle").checked = data.fullscreenEnabled || false;
            document.getElementById("toastToggle").checked = data.toastEnabled || false;
            document.getElementById('redirectionToggle').checked = data.redirectionEnabled || true;
        }
    );
}

// Cargar las opciones al iniciar la página
document.addEventListener("DOMContentLoaded", restoreOptions);
// Guardar las opciones cuando se haga clic en el botón
document.getElementById("saveButton").addEventListener("click", saveOptions);

fetch('./js/rules.json') // Cargar el archivo JSON
    .then(response => response.json())
    .then(data => {
        const urlList = document.getElementById('urlList'); // Obtén el div por su id

        data.forEach(rule => {
            // Extraer el URL base y formato del regexSubstitution
            const redirectUrl = rule.condition.regexFilter.split("\\")[0].split("^")[1] + rule.condition.regexFilter.split("\\")[1].split("/")[0] + "/";
            const regexFilter = redirectUrl + "*";


            fetchData(redirectUrl).then(data => {
                const { favicon, title } = data;

                // Crear el elemento `a`
                const linkItem = document.createElement('a');
                linkItem.className = 'list-group-item list-group-item-action list-group-item-success border-0 d-flex align-items-center';
                linkItem.href = redirectUrl; // URL del enlace
                linkItem.target = '_blank';
                linkItem.rel = 'noopener';

                //Crear Favicon
                const faviconImg = document.createElement('img');
                faviconImg.src = favicon;
                faviconImg.alt = 'Favicon';
                faviconImg.className = 'me-1';
                faviconImg.width = 24; // Ajustar el tamaño del favicon
                faviconImg.height = 24; // Ajustar el tamaño del favicon

                // Crear el ícono
                const icon = document.createElement('i');
                icon.className = 'bi bi-box-arrow-up-right ms-1';

                // Añadir el ícono y el texto
                linkItem.appendChild(faviconImg);
                linkItem.appendChild(document.createTextNode(title + " - " + regexFilter));
                linkItem.appendChild(icon);

                // Agregar el elemento al div
                urlList.appendChild(linkItem);
            });
        });
    })
    .catch(error => console.error('Error al cargar las reglas:', error));

async function fetchData(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const faviconLink = doc.querySelector("link[rel*='icon']");
        const faviconUrl = faviconLink.href.replace(location.origin + "/", "");

        data = {
            "favicon": faviconLink ? url + faviconUrl : null,
            "title": doc.title ? doc.title : null,
        }
        return data;
    } catch (error) {
        console.error('Error al obtener el favicon:', error);
        return null;
    }
}