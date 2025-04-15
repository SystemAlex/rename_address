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
