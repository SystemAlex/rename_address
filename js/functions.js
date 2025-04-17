chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showToast" && typeof showToast === "function") {
        showToast(request.message);
    } else if (request.action === "toggleRedirect") {
        toggleRedirect();
    }
});

function showToast(message) {
    chrome.storage.sync.get("toastEnabled", function (data) {
        if (!data.toastEnabled) {
            return;
        }

        const appendToast = (toast) => {
            if (document.body) {
                document.body.appendChild(toast);
            } else {
                setTimeout(() => appendToast(toast), 100);
            }
        };

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
        toast.style.fontFamily =
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
        toast.style.fontSize = "16px";
        toast.style.fontWeight = "400";
        toast.style.lineHeight = "1.5";
        toast.style.marginBottom = "1rem";
        toast.style.marginTop = "1rem";
        toast.style.padding = "1rem 1.5rem";

        appendToast(toast);

        setTimeout(() => {
            toast.style.transition = "opacity 0.5s ease-out";
            toast.style.opacity = "0";
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 5000);
    });
}

function toggleRedirect() {
    const currentUrl = window.location.href;
    const rulesUrl = chrome.runtime.getURL("js/redirectRules.json");

    fetch(rulesUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al cargar las reglas");
            }
            return response.json();
        })
        .then(rules => {
            let matchedRule = null;
            let isOriginal = false;

            for (let rule of rules) {
                const regex = new RegExp(rule.regex);
                if (regex.test(currentUrl)) {
                    matchedRule = rule;
                    isOriginal = true;
                    break;
                }
            }

            if (!matchedRule) {
                for (let rule of rules) {
                    const indexDollar = rule.substitution.indexOf("$1");
                    const embedFixed = indexDollar !== -1 ? rule.substitution.substring(0, indexDollar) : rule.substitution;
                    if (currentUrl.startsWith(embedFixed)) {
                        matchedRule = rule;
                        isOriginal = false;
                        break;
                    }
                }
            }

            if (!matchedRule) {
                return;
            }

            let newUrl;
            if (isOriginal) {
                const regex = new RegExp(matchedRule.regex);
                newUrl = currentUrl.replace(regex, matchedRule.substitution);
                showToast("Cambiando a vista incrustada.");
            } else {
                const indexDollar = matchedRule.substitution.indexOf("$1");
                const embedFixed = indexDollar !== -1 ? matchedRule.substitution.substring(0, indexDollar) : matchedRule.substitution;
                const param = currentUrl.substring(embedFixed.length);

                let originalPrefix = matchedRule.regex
                    .replace(/^\^/, '')
                    .replace(/\(.*$/, '');
                originalPrefix = originalPrefix.replace(/\\\//g, '/').replace(/\\\./g, '.');

                newUrl = originalPrefix + param;
                showToast("Cambiando a vista original.");
            }
            console.log("Redirigiendo a: " + newUrl);

            sessionStorage.setItem("manualToggle", "true");
            window.location.href = newUrl;
        })
        .catch(error => {
            console.error("Error en toggleRedirect:", error);
        });
}

function autoRedirect() {
    if (sessionStorage.getItem("manualToggle")) {
        return;
    }

    chrome.storage.sync.get(["redirectionEnabled", "autoRedirectSPA", "redirectionConfirmation"], function (config) {
        if (!config.autoRedirectSPA || !config.redirectionEnabled) {
            return;
        }

        const currentUrl = window.location.href;
        const rulesUrl = chrome.runtime.getURL("js/redirectRules.json");

        fetch(rulesUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al cargar las reglas");
                }
                return response.json();
            })
            .then(rules => {
                for (let rule of rules) {
                    const regex = new RegExp(rule.regex);
                    if (regex.test(currentUrl)) {
                        if (config.redirectionConfirmation) {
                            const confirmed = window.confirm("¿Desea redirigir a la versión embed del video?");
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
            })
            .catch(error => {
                console.error("Error en autoRedirect:", error);
            });
    });
}

(function (history) {
    const pushState = history.pushState;
    const replaceState = history.replaceState;
    history.pushState = function () {
        const ret = pushState.apply(history, arguments);
        window.dispatchEvent(new Event('location-changed'));
        return ret;
    };
    history.replaceState = function () {
        const ret = replaceState.apply(history, arguments);
        window.dispatchEvent(new Event('location-changed'));
        return ret;
    };
})(window.history);

window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('location-changed'));
});

window.addEventListener('location-changed', () => {
    setTimeout(autoRedirect, 500);
});

window.dispatchEvent(new Event('location-changed'));

(function detectHrefChanges() {
    let lastHref = window.location.href;

    const observer = new MutationObserver(() => {
        const currentHref = window.location.href;
        if (currentHref !== lastHref) {
            lastHref = currentHref;
            window.dispatchEvent(new Event('location-changed'));
        }
    });

    const config = { subtree: true, childList: true, characterData: true };
    observer.observe(document.documentElement, config);
})();

document.addEventListener("pointerdown", function (event) {
    if (sessionStorage.getItem("manualToggle")) {
        sessionStorage.removeItem("manualToggle");
    }
}, { capture: true });
