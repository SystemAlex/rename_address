﻿function saveOptions() {
    const fullscreenEnabled = document.getElementById("fullscreenToggle").checked;
    const toastEnabled = document.getElementById("toastToggle").checked;
    //const redirectionEnabled = document.getElementById("redirectionToggle").checked;
    const redirectionConfirmation = document.getElementById("confirmToggle").checked;
    const autoRedirectSPA = document.getElementById("autoRedirectSPAToggle").checked;
    //chrome.storage.sync.set({ fullscreenEnabled, toastEnabled, redirectionEnabled, redirectionConfirmation, autoRedirectSPA }, function () {
    chrome.storage.sync.set({ fullscreenEnabled, toastEnabled, redirectionConfirmation, autoRedirectSPA }, function () {
        showToast("Opciones guardadas!");
    });
}

function restoreOptions() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    chrome.storage.sync.get(
        //["fullscreenEnabled", "toastEnabled", "redirectionEnabled", "redirectionConfirmation", "autoRedirectSPA"],
        ["fullscreenEnabled", "toastEnabled", "redirectionConfirmation", "autoRedirectSPA"],
        function (data) {
            document.getElementById("fullscreenToggle").checked = data.fullscreenEnabled;
            document.getElementById("toastToggle").checked = data.toastEnabled;
            //document.getElementById("redirectionToggle").checked = data.redirectionEnabled;
            document.getElementById("confirmToggle").checked = data.redirectionConfirmation;
            document.getElementById("autoRedirectSPAToggle").checked = data.autoRedirectSPA;
        }
    );
    //redirectionToggle.addEventListener("change", function () {
    //    if (!this.checked) {
    //        autoRedirectSPAToggle.checked = false;
    //        autoRedirectSPAToggle.disabled = true;
    //    } else {
    //        autoRedirectSPAToggle.disabled = false;
    //    }
    //});
}

document.addEventListener("DOMContentLoaded", () => {
    restoreOptions();
    loadRules();
});

document.getElementById("saveButton").addEventListener("click", saveOptions);

async function loadRules() {
    try {
        const response = await fetch("./js/redirectRules.json");
        const data = await response.json();
        const urlList = document.getElementById("urlList");

        for (const rule of data) {
            // Extraemos la URL base de la regla
            const redirectUrl = rule.regex
                .replace(/[\^\\]/g, '')
                .match(/^(https:\/\/[^/]+\/)/)[1];
            const regexFilter = redirectUrl + "*";

            // Utilizamos fetchData para obtener el favicon y título
            const { favicon, title } = await fetchData(redirectUrl);

            // Creamos el elemento de enlace
            const linkItem = document.createElement("a");
            linkItem.className = "list-group-item list-group-item-action list-group-item-success border-0 d-flex align-items-center";
            linkItem.href = redirectUrl;
            linkItem.target = "_blank";
            linkItem.rel = "noopener";

            // Agregamos el ícono
            const icon = document.createElement("i");
            icon.className = "bi bi-box-arrow-up-right ms-1";

            if (favicon) {
                const faviconImg = document.createElement("img");
                faviconImg.src = favicon;
                faviconImg.alt = "Favicon";
                faviconImg.className = "me-1";
                faviconImg.width = 24;
                faviconImg.height = 24;
                linkItem.appendChild(faviconImg);
            }

            linkItem.appendChild(document.createTextNode((title ? title + " - " : "") + regexFilter));
            linkItem.appendChild(icon);

            urlList.appendChild(linkItem);
        }
    } catch (error) {
        console.error("Error al cargar las reglas:", error);
    }
}

async function fetchData(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const faviconLink = doc.querySelector("link[rel*='icon']");
        const faviconUrl = faviconLink.href
            .replace(location.origin + "/", "")
            .replace("chrome-extension://", "https://");

        const newfaviconUrl = faviconUrl.startsWith("https://") ? faviconUrl : url + faviconUrl;

        const data = {
            favicon: faviconLink ? newfaviconUrl : null,
            title: doc.title || null,
        };

        return data;
    } catch (error) {
        console.error("Error al obtener el favicon:", error);
        const data = {
            favicon: null,
            title: null,
        };
        return data;
    }
}