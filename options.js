function saveOptions() {
  const fullscreenEnabled = document.getElementById("fullscreenToggle").checked;
  const toastEnabled = document.getElementById("toastToggle").checked;
  chrome.storage.sync.set({ fullscreenEnabled, toastEnabled }, function () {
    showToast("Opciones guardadas!");
  });
}

// Función para restaurar opciones al cargar la página
function restoreOptions() {
  chrome.storage.sync.get(
    ["fullscreenEnabled", "toastEnabled"],
    function (data) {
      document.getElementById("fullscreenToggle").checked =
        data.fullscreenEnabled || false;
      document.getElementById("toastToggle").checked =
        data.toastEnabled || false;
    }
  );
}

// Cargar las opciones al iniciar la página
document.addEventListener("DOMContentLoaded", restoreOptions);
// Guardar las opciones cuando se haga clic en el botón
document.getElementById("saveButton").addEventListener("click", saveOptions);
