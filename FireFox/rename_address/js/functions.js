browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) => {
        if (msg.action === "getMatchedRule" && typeof getMatchedRule === "function") {
            const match = getMatchedRule(msg.rules, msg.currentUrl);
            port.postMessage({ match });
        }
        if (msg.action === "toggleRedirect") {
            const currentUrl = window.location.href;
            try {
                const status = await toggleRedirect(currentUrl);
                port.postMessage({ status });
            } catch (error) {
                port.postMessage({ status: `Error: ${error.message}` });
            }
        }
        if (msg.action === "showToast") {
            showToast(msg.message);
            port.postMessage({ result: "Toast mostrado" });
        }
    });
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
        for (let key in changes) {
            const { oldValue, newValue } = changes[key];
        }
    }
});

function customConfirmDialog(message) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = browser.runtime.getURL("css/bootstrap.min.css");

    const style = document.createElement("style");
    style.textContent = `
        html {
            font-size: 16px !important;
        }

        .btn:focus-visible {
            color: var(--bs-btn-hover-color) !important;
            background-color: var(--bs-btn-hover-bg) !important;
            border-color: var(--bs-btn-hover-border-color) !important;
            outline: 0 !important;
            box-shadow: var(--bs-btn-focus-box-shadow) !important;
        }

        #custom-confirm-dialog::backdrop {
            backdrop-filter: blur(14px) !important;
            background-color: rgba(var(--bs-primary-rgb), 0.2) !important;
        }`;

    const dialog = document.createElement("dialog");
    dialog.id = "custom-confirm-dialog";
    dialog.className = "border border-1 border-dark shadow rounded-3 p-0 user-select-none bg-primary-subtle m-auto";

    dialog.appendChild(link);
    dialog.appendChild(style);

    const form = document.createElement("form");
    form.method = "dialog";

    const header = document.createElement("span");
    header.className = "d-flex align-items-center p-2 bg-primary bg-opacity-10";

    const logo = document.createElement("img");
    logo.src = browser.runtime.getURL("assets/icon128.png");
    logo.alt = "Logo";
    logo.width = 16;
    logo.height = 16;
    logo.className = "me-1";
    header.appendChild(logo);

    const title = document.createElement("h6");
    title.textContent = browser.runtime.getManifest().name;
    title.className = "text-dark m-0 fw-bold";
    header.appendChild(title);

    form.appendChild(header);

    const line = document.createElement("hr");
    line.className = "mt-0";
    form.appendChild(line);

    const text = document.createElement("p");
    text.id = "custom-confirm-message";
    text.className = "fs-5 mb-3 px-3";
    text.textContent = message;
    form.appendChild(text);

    const menu = document.createElement("menu");
    menu.className = "d-flex justify-content-center align-items-center gap-2 p-0 m-3";
    form.appendChild(menu);

    const cancelButton = document.createElement("button");
    cancelButton.value = "cancel";
    cancelButton.className = "btn btn-danger m-0";
    cancelButton.textContent = "Cancelar";
    menu.appendChild(cancelButton);

    const confirmButton = document.createElement("button");
    confirmButton.value = "confirm";
    confirmButton.className = "btn btn-success m-0";
    confirmButton.textContent = "Confirmar";
    menu.appendChild(confirmButton);

    dialog.appendChild(form);

    const brand = document.createElement("small");
    brand.className = "position-fixed bottom-0 end-0 alert alert-primary m-3 text-muted py-1 px-2 shadow-sm z-3";
    brand.textContent = "by SystemAlex";
    dialog.appendChild(brand);

    if (document.body) {
        document.body.appendChild(dialog);
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            document.body.appendChild(dialog);
        });
    }

    return new Promise((resolve) => {
        const dlg = document.getElementById("custom-confirm-dialog");
        const messageElement = document.getElementById("custom-confirm-message");
        messageElement.textContent = message;
        const onClose = () => {
            resolve(dlg.returnValue === "confirm");
            dlg.removeEventListener("close", onClose);
            dlg.remove();
        };
        dlg.addEventListener("close", onClose);
        dlg.showModal();
    });
}

function showToast(message) {
    browser.storage.sync.get("toastEnabled")
        .then((data) => {
            if (!data.toastEnabled) return;
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
            toast.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", sans-serif';
            toast.style.fontSize = "16px";
            toast.style.fontWeight = "400";
            toast.style.lineHeight = "1.5";
            toast.style.padding = "1rem 1.5rem";

            const appendToast = (toastElement) => {
                if (document.body) {
                    document.body.appendChild(toastElement);
                } else {
                    setTimeout(() => appendToast(toastElement), 100);
                }
            };
            appendToast(toast);

            setTimeout(() => {
                toast.style.transition = "opacity 0.5s ease-out";
                toast.style.opacity = "0";
                setTimeout(() => {
                    toast.remove();
                }, 500);
            }, 5000);
        })
        .catch((error) => {
            console.error("Error al obtener toastEnabled:", error);
        });
}

async function toggleRedirect(currentUrl) {
    const rulesUrl = browser.runtime.getURL("js/redirectRules.json");
    try {
        const response = await fetch(rulesUrl);
        if (!response.ok) throw new Error("Error al cargar las reglas");
        const rules = await response.json();
        const match = getMatchedRule(rules, currentUrl);
        if (!match) return "Sin coincidencias para redirección";
        const { rule: matchedRule, isOriginal } = match;
        const { newUrl, message } = generateNewUrl(matchedRule, currentUrl, isOriginal);
        showToast(message);
        sessionStorage.setItem("manualToggle", "true");
        window.location.href = newUrl;
        return `Redirigido exitosamente a: ${newUrl}`;
    } catch (error) {
        return `Error en toggleRedirect: ${error.message}`;
    }
}

async function autoRedirect() {
    if (!document.body) {
        document.addEventListener("DOMContentLoaded", autoRedirect);
        return;
    }
    if (sessionStorage.getItem("manualToggle")) return;
    try {
        const config = await browser.storage.sync.get([
            "redirectionEnabled",
            "autoRedirectSPA",
            "redirectionConfirmation"
        ]);
        if (!config.autoRedirectSPA || !config.redirectionEnabled) return;
        const currentUrl = window.location.href;
        const rulesUrl = browser.runtime.getURL("js/redirectRules.json");
        const response = await fetch(rulesUrl);
        if (!response.ok) throw new Error("Error al cargar las reglas");
        const rules = await response.json();
        for (let rule of rules) {
            const regex = new RegExp(rule.regex);
            if (regex.test(currentUrl)) {
                if (config.redirectionConfirmation) {
                    const confirmed = await customConfirmDialog(
                        "¿Desea redirigir a la versión de video incrustado?"
                    );
                    if (!confirmed) {
                        showToast("Redirección cancelada.");
                        return;
                    } else {
                        showToast("Redirección confirmada.");
                    }
                } else {
                    showToast("Redirección automática.");
                }
                const newUrl = currentUrl.replace(regex, rule.substitution);
                window.location.href = newUrl;
                break;
            }
        }
    } catch (error) {
        console.error("Error en autoRedirect:", error);
    }
}

function findRuleForOriginal(rules, currentUrl) {
    for (const rule of rules) {
        const regex = new RegExp(rule.regex);
        if (regex.test(currentUrl)) {
            return { rule, isOriginal: true };
        }
    }
    return null;
}

function findRuleForEmbed(rules, currentUrl) {
    for (const rule of rules) {
        const indexDollar = rule.substitution.indexOf("$1");
        const embedFixed = indexDollar !== -1 ? rule.substitution.substring(0, indexDollar) : rule.substitution;
        if (currentUrl.startsWith(embedFixed)) {
            return { rule, isOriginal: false };
        }
    }
    return null;
}

function getMatchedRule(rules, currentUrl) {
    let match = findRuleForOriginal(rules, currentUrl);
    if (!match) {
        match = findRuleForEmbed(rules, currentUrl);
    }
    return match;
}

function generateNewUrl(matchedRule, currentUrl, isOriginal) {
    if (isOriginal) {
        const regex = new RegExp(matchedRule.regex);
        return {
            newUrl: currentUrl.replace(regex, matchedRule.substitution),
            message: "Cambiando a vista incrustada."
        };
    } else {
        const indexDollar = matchedRule.substitution.indexOf("$1");
        const embedFixed = indexDollar !== -1 ? matchedRule.substitution.substring(0, indexDollar) : matchedRule.substitution;
        const param = currentUrl.substring(embedFixed.length);
        let originalPrefix = matchedRule.regex.replace(/^\^/, '').replace(/\(.*$/, '');
        originalPrefix = originalPrefix.replace(/\\\//g, '/').replace(/\\\./g, '.');
        return {
            newUrl: originalPrefix + param,
            message: "Cambiando a vista original."
        };
    }
}

(function (history) {
    const pushState = history.pushState;
    const replaceState = history.replaceState;
    history.pushState = function () {
        const ret = pushState.apply(history, arguments);
        window.dispatchEvent(new Event("location-changed"));
        return ret;
    };
    history.replaceState = function () {
        const ret = replaceState.apply(history, arguments);
        window.dispatchEvent(new Event("location-changed"));
        return ret;
    };
})(window.history);

window.addEventListener("popstate", () => {
    window.dispatchEvent(new Event("location-changed"));
});

window.addEventListener("location-changed", () => {
    setTimeout(autoRedirect, 500);
});
window.dispatchEvent(new Event("location-changed"));

(function detectHrefChanges() {
    let lastHref = window.location.href;
    const observer = new MutationObserver(() => {
        const currentHref = window.location.href;
        if (currentHref !== lastHref) {
            lastHref = currentHref;
            window.dispatchEvent(new Event("location-changed"));
        }
    });
    const config = { subtree: true, childList: true, characterData: true };
    observer.observe(document.documentElement, config);
})();

document.addEventListener(
    "pointerdown",
    function () {
        if (sessionStorage.getItem("manualToggle")) {
            sessionStorage.removeItem("manualToggle");
        }
    },
    { capture: true }
);