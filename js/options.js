function saveOptions() {
    const fullscreenEnabled = document.getElementById("fullscreenToggle").checked;
    const toastEnabled = document.getElementById("toastToggle").checked;
    const redirectionEnabled = document.getElementById('redirectionToggle').checked;
    const redirectionConfirmation = document.getElementById('confirmToggle').checked;
    chrome.storage.sync.set({ fullscreenEnabled, toastEnabled, redirectionEnabled, redirectionConfirmation }, function () {
        showToast("Opciones guardadas!");
    });
}

function restoreOptions() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    chrome.storage.sync.get(
        ["fullscreenEnabled", "toastEnabled", "redirectionEnabled", "redirectionConfirmation"],
        function (data) {
            document.getElementById("fullscreenToggle").checked = data.fullscreenEnabled;
            document.getElementById("toastToggle").checked = data.toastEnabled;
            document.getElementById('redirectionToggle').checked = data.redirectionEnabled;
            document.getElementById('confirmToggle').checked = data.redirectionConfirmation;
        }
    );
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("saveButton").addEventListener("click", saveOptions);

fetch('./js/redirectRules.json')
    .then(response => response.json())
    .then(data => {
        const urlList = document.getElementById('urlList');

        data.forEach(rule => {
            const redirectUrl = rule.regex.replace(/[\^\\]/g, '').match(/^(https:\/\/[^/]+\/)/)[1];
            const regexFilter = redirectUrl + "*";

            fetchData(redirectUrl).then(data => {
                const { favicon, title } = data;

                const linkItem = document.createElement('a');
                linkItem.className = 'list-group-item list-group-item-action list-group-item-success border-0 d-flex align-items-center';
                linkItem.href = redirectUrl;
                linkItem.target = '_blank';
                linkItem.rel = 'noopener';

                const icon = document.createElement('i');
                icon.className = 'bi bi-box-arrow-up-right ms-1';

                if (favicon) {
                    const faviconImg = document.createElement('img');
                    faviconImg.src = favicon;
                    faviconImg.alt = 'Favicon';
                    faviconImg.className = 'me-1';
                    faviconImg.width = 24;
                    faviconImg.height = 24;

                    linkItem.appendChild(faviconImg);
                }
                linkItem.appendChild(document.createTextNode((title ? title + " - " : "") + regexFilter));
                linkItem.appendChild(icon);

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
        const faviconUrl = faviconLink.href.replace(location.origin + "/", "").replace("chrome-extension://", "https://");

        if (faviconUrl.startsWith("https://")) {
            newfaviconUrl = faviconUrl;
        } else {
            newfaviconUrl = url + faviconUrl;
        }

        data = {
            "favicon": faviconLink ? newfaviconUrl : null,
            "title": doc.title ? doc.title : null,
        }
        return data;
    } catch (error) {
        console.error('Error al obtener el favicon:', error);

        data = {
            "favicon": null,
            "title": null,
        }
        return data;
    }
}