chrome.runtime.onInstalled.addListener((details) => {
    const defaultSettings = {
        fullscreenEnabled: true,
        toastEnabled: true,
        redirectionEnabled: true,
        redirectionConfirmation: true
    };

    // Si es la primera instalación, abrimos la página de opciones
    if (details.reason === "install") {
        chrome.runtime.openOptionsPage(() => {
            if (chrome.runtime.lastError) {
                console.error("Error al abrir la página de opciones:", chrome.runtime.lastError);
            } else {
                console.log("Página de opciones abierta correctamente.");
            }
        });
        chrome.storage.sync.set(defaultSettings, () => {
            if (chrome.runtime.lastError) {
                console.error('Error al establecer la configuración predeterminada:', chrome.runtime.lastError);
            } else {
                console.log('Configuración predeterminada establecida correctamente:', defaultSettings);
            }
        });
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
        for (let key in changes) {
            const { oldValue, newValue } = changes[key];
            console.log(`La opción '${key}' cambió de ${oldValue} a ${newValue}`);
        }
    }
});

function extractFixedPartFromRegex(regexStr) {
    if (regexStr.startsWith("^")) {
        regexStr = regexStr.substring(1);
    }
    const indexParen = regexStr.indexOf("(");
    let fixedPart = indexParen !== -1 ? regexStr.substring(0, indexParen) : regexStr;
    fixedPart = fixedPart.replace(/\\(.)/g, "$1");
    return fixedPart;
}

function extractFixedPartFromSubstitution(substitutionStr) {
    const indexDollar = substitutionStr.indexOf("$1");
    return indexDollar !== -1 ? substitutionStr.substring(0, indexDollar) : substitutionStr;
}

chrome.action.onClicked.addListener((tab) => {
    if (!tab.url) return;
    const currentUrl = tab.url;
    const rulesUrl = chrome.runtime.getURL("js/redirectRules.json");

    fetch(rulesUrl)
        .then(response => {
            if (!response.ok) throw new Error("Error al cargar las reglas");
            return response.json();
        })
        .then((rules) => {
            let newUrl = null;
            let toastMessage = "";

            for (let rule of rules) {
                const regex = new RegExp(rule.regex);
                if (regex.test(currentUrl)) {
                    newUrl = currentUrl.replace(regex, rule.substitution);
                    toastMessage = "Cambiando a versión embed";
                    break;
                }
            }

            if (!newUrl) {
                for (let rule of rules) {
                    const originalFixed = extractFixedPartFromRegex(rule.regex);
                    const embedFixed = extractFixedPartFromSubstitution(rule.substitution);
                    if (currentUrl.startsWith(embedFixed)) {
                        const dynamicPart = currentUrl.substring(embedFixed.length);
                        newUrl = originalFixed + dynamicPart;
                        toastMessage = "Volviendo a la versión original";
                        break;
                    }
                }
            }

            if (newUrl && newUrl !== currentUrl) {
                let urlObject = new URL(newUrl);
                urlObject.searchParams.set("manualSwitch", "true");
                newUrl = urlObject.toString();

                chrome.tabs.sendMessage(tab.id, { action: "showToast", message: toastMessage }, () => {
                    chrome.tabs.update(tab.id, { url: newUrl });
                });
            } else {
                console.log("La URL no coincide con ninguna regla para alternar.");
            }
        })
        .catch((error) => {
            console.error("Error al procesar las reglas:", error);
        });
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

            chrome.action.setIcon({ tabId, path: iconPath });
        })
        .catch(error => {
            console.error("Error al actualizar el ícono:", error);
            chrome.action.setIcon({ tabId, path: errorIconPath });
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