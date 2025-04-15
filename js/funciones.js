function showToast(message) {
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

    toast.className = "alert alert-success";
    toast.setAttribute("role", "alert");

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "opacity 0.5s ease-out";
        toast.style.opacity = "0";
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 5000);
}