let ruleIds = [];

// Llama a esta función en el momento de la instalación o actualización
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ redirectionEnabled: true }, () => {
        updateRedirectionRules();
    });
});

// También escucha el cambio en la configuración
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.redirectionEnabled) {
        updateRedirectionRules();
    }
});

/**
 * Función que actualiza las reglas de redirección dinámicamente
 */
function updateRedirectionRules() {
    chrome.storage.sync.get('redirectionEnabled', (data) => {
        if (data.redirectionEnabled) {
            fetch('rules.json') // Ruta del archivo JSON
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al cargar el archivo JSON');
                    }
                    return response.json(); // Convierte el contenido en un objeto JSON
                })
                .then(data => {
                    const rules = data; // Almacena las reglas en la variable
                    ruleIds = rules.map(rule => rule.id); // Obtiene los IDs

                    // Actualizar reglas: remover reglas anteriores (si existen) y agregar las nuevas
                    chrome.declarativeNetRequest.updateDynamicRules(
                        {
                            removeRuleIds: ruleIds,
                            addRules: rules
                        },
                        () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error al agregar reglas dinámincas:", chrome.runtime.lastError);
                            } else {
                                console.log("Reglas de redirección activas");
                            }
                        }
                    );
                })
                .catch(error => console.error('Error:', error));
        } else {
            // Si la redirección está desactivada, remover todas las reglas (utilizando los IDs conocidos)
            chrome.declarativeNetRequest.updateDynamicRules(
                { removeRuleIds: ruleIds },
                () => {
                    console.log("Reglas de redirección eliminadas.");
                }
            );
        }
    });
}