(function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("manualSwitch")) {
        console.log("Se detectó 'manualSwitch'. Se omite la redirección automática y se remueve el parámetro.");
        history.replaceState(null, "", window.location.pathname + window.location.hash);
        return;
    }

    chrome.storage.sync.get(
        ["redirectionEnabled", "redirectionConfirmation"],
        function (config) {
            if (!config.redirectionEnabled) {
                console.log("Redirección deshabilitada.");
                return;
            }

            const currentUrl = window.location.href;
            const rulesUrl = chrome.runtime.getURL("js/redirectRules.json");

            fetch(rulesUrl)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Error al cargar el archivo JSON de reglas");
                    }
                    return response.json();
                })
                .then((rules) => {
                    for (let i = 0; i < rules.length; i++) {
                        const rule = rules[i];
                        const regex = new RegExp(rule.regex);
                        const match = currentUrl.match(regex);
                        if (match) {
                            if (config.redirectionConfirmation) {
                                const confirmed = window.confirm(
                                    "¿Desea redirigir a la versión embed del video?"
                                );
                                if (!confirmed) {
                                    showToast("Redirección cancelada por el usuario.");
                                    console.log("Redirección cancelada por el usuario.");
                                    break;
                                }
                            } else {
                                showToast("Redirigiendo sin confirmación.");
                            }
                            const newUrl = currentUrl.replace(regex, rule.substitution);
                            console.log("Redirigiendo a: " + newUrl);
                            window.location.href = newUrl;
                            break;
                        }
                    }
                })
                .catch((error) => {
                    console.error("Error en la redirección:", error);
                });
        }
    );
})();
