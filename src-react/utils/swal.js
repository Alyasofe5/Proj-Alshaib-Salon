/**
 * Lazy-load SweetAlert2 on first use — zero impact on initial page load.
 * Usage: const Swal = await loadSwal(); Swal.fire(...)
 */
let swalPromise = null;

export function loadSwal() {
  if (window.Swal) return Promise.resolve(window.Swal);
  if (swalPromise) return swalPromise;

  swalPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js";
    script.onload = () => resolve(window.Swal);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return swalPromise;
}
