browser.runtime.onInstalled.addListener((details) => {
    const defaultSettings = {
        fullscreenEnabled: true,
        toastEnabled: true,
        redirectionEnabled: true,
        redirectionConfirmation: true,
        autoRedirectSPA: true
    };

    if (details.reason === "install") {
        browser.storage.sync.set(defaultSettings).catch((error) => {
            console.error("Error al establecer la configuración predeterminada:", error);
        });
        browser.runtime.openOptionsPage().catch((error) => {
            console.error("Error al abrir la página de opciones:", error);
        });
    }

    browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            if (tabs.length > 0) {
                const currentTab = tabs[0];
                updateIconForTab(currentTab.id, currentTab.url);
            }
        })
        .catch((error) => {
            console.error("Error al consultar las pestañas:", error);
        });
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
        for (let key in changes) {
            const { newValue } = changes[key];
            // Actualiza configuraciones dinámicas si es necesario
        }
    }
});

browser.runtime.onStartup.addListener(() => {
    browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            if (tabs.length > 0) {
                const currentTab = tabs[0];
                updateIconForTab(currentTab.id, currentTab.url);
            }
        })
        .catch((error) => {
            console.error("Error al actualizar el ícono después del inicio:", error);
        });
});

function updateIconForTab(tabId, currentUrl) {
    const rulesUrl = browser.runtime.getURL("js/redirectRules.json");
    const originalIconPath = browser.runtime.getURL("assets/icon128.png");
    const embedIconPath = browser.runtime.getURL("assets/icon128_on.png");
    const errorIconPath = browser.runtime.getURL("assets/icon128_error.png");

    fetch(rulesUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar las reglas");
            }
            return response.json();
        })
        .then(rules => {
            return getMatch(tabId, rules, currentUrl).then(match => {
                const iconPath = match
                    ? (match.isOriginal ? originalIconPath : embedIconPath)
                    : errorIconPath;

                const actionAPI = browser.action || browser.browserAction;
                if (actionAPI && typeof actionAPI.setIcon === "function") {
                    actionAPI.setIcon({ tabId: tabId, path: iconPath });
                }
            });
        })
        .catch((error) => {
            console.error("Error al actualizar el ícono:", error);
            const actionAPI = browser.action || browser.browserAction;
            if (actionAPI && typeof actionAPI.setIcon === "function") {
                actionAPI.setIcon({ tabId: tabId, path: errorIconPath });
            }
        });
}

function getMatch(tabId, rules, currentUrl) {
    const port = browser.tabs.connect(tabId, { name: "content-connection" });
    return new Promise((resolve) => {
        port.postMessage({ action: "getMatchedRule", rules, currentUrl });

        port.onMessage.addListener((response) => {
            resolve(response.match);
        });

        port.onDisconnect.addListener(() => {
            resolve(null);
        });
    });
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        updateIconForTab(tabId, tab.url);
    }
});

browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await browser.tabs.get(activeInfo.tabId);
        if (tab && tab.url) {
            updateIconForTab(tab.id, tab.url);
        }
    } catch (error) {
        console.error("Error al obtener los detalles de la pestaña al activarse:", error);
    }
});

const actionAPI = browser.action || browser.browserAction;
if (actionAPI && actionAPI.onClicked) {
    actionAPI.onClicked.addListener((tab) => {
        if (tab && tab.id && tab.url) {
            const port = browser.tabs.connect(tab.id, { name: "content-connection" });
            port.postMessage({ action: "toggleRedirect", currentUrl: tab.url });

            port.onMessage.addListener((response) => { });

            port.onDisconnect.addListener(() => { });
        }
    });
} else {
    console.error("No se encontró API para manejar el clic en el ícono.");
}

setTimeout(() => {
    browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            if (tabs.length > 0) {
                const currentTab = tabs[0];
                updateIconForTab(currentTab.id, currentTab.url);
            } else {
                console.warn("No se encontró ninguna pestaña activa.");
            }
        })
        .catch((error) => {
            console.error("Error al actualizar el ícono tras reactivación:", error);
        });
}, 0);