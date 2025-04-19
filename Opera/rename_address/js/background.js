chrome.runtime.onInstalled.addListener((details) => {
    const defaultSettings = {
        fullscreenEnabled: true,
        toastEnabled: true,
        redirectionEnabled: true,
        redirectionConfirmation: true,
        autoRedirectSPA: true
    };

    if (details.reason === "install") {
        chrome.storage.sync.set(defaultSettings, () => {
            if (chrome.runtime.lastError) {
                console.error("Error al establecer la configuración predeterminada:", chrome.runtime.lastError);
            } else {
                console.log("Configuración predeterminada establecida correctamente:", defaultSettings);
            }
        });
        chrome.runtime.openOptionsPage(() => {
            if (chrome.runtime.lastError) {
                console.error("Error al abrir la página de opciones:", chrome.runtime.lastError);
            } else {
                console.log("Página de opciones abierta correctamente.");
            }
        });
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
        for (let key in changes) {
            const { oldValue, newValue } = changes[key];
            console.log(`La opción '${key}' cambió de ${oldValue} a ${newValue}`);
        }
    }
});

function updateIconForTab(tabId, currentUrl) {
    const rulesUrl = chrome.runtime.getURL("js/redirectRules.json");

    const originalIconPath = chrome.runtime.getURL("assets/icon128_off.png");
    const embedIconPath = chrome.runtime.getURL("assets/icon128_on.png");
    const errorIconPath = chrome.runtime.getURL("assets/icon128_error.png");

    fetch(rulesUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar las reglas");
            }
            return response.json();
        })
        .then(rules => {
            let state = "error";

            for (let rule of rules) {
                const originalRegex = new RegExp(rule.regex);
                if (originalRegex.test(currentUrl)) {
                    state = "original";
                    break;
                }
            }

            if (state === "error") {
                for (let rule of rules) {
                    const indexDollar = rule.substitution.indexOf("$1");
                    const embedFixed = indexDollar !== -1 ? rule.substitution.substring(0, indexDollar) : rule.substitution;
                    if (currentUrl.startsWith(embedFixed)) {
                        state = "embed";
                        break;
                    }
                }
            }

            let iconPath;
            if (state === "original") {
                iconPath = originalIconPath;
            } else if (state === "embed") {
                iconPath = embedIconPath;
            } else {
                iconPath = errorIconPath;
            }

            const actionAPI = chrome.action || chrome.browserAction;
            if (actionAPI && typeof actionAPI.setIcon === "function") {
                actionAPI.setIcon({ tabId: tabId, path: iconPath });
            } else {
                console.error("No se pudo actualizar el icono, API no encontrada.");
            }
        })
        .catch(error => {
            console.error("Error al actualizar el ícono:", error);
            const actionAPI = chrome.action || chrome.browserAction;
            if (actionAPI && typeof actionAPI.setIcon === "function") {
                actionAPI.setIcon({ tabId: tabId, path: errorIconPath });
            }
        });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        updateIconForTab(tabId, tab.url);
    }
});

chrome.tabs.onActivated.addListener(activeInfo => {
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab && tab.url) {
            updateIconForTab(tab.id, tab.url);
        }
    });
});

const actionAPI = chrome.action || chrome.browserAction;
if (actionAPI && typeof actionAPI.onClicked === "object") {
    actionAPI.onClicked.addListener((tab) => {
        if (tab && tab.id && tab.url) {
            chrome.tabs.sendMessage(tab.id, { action: "toggleRedirect" });
        }
    });
} else {
    console.error("No se encontró API para manejar el click en el ícono.");
}
