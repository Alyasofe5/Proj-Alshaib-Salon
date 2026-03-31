const MEDIA_DB_NAME = "alhason_media";
const MEDIA_DB_VERSION = 1;
const MEDIA_STORE = "videos";

function openMediaDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);
    req.onupgradeneeded = (event) => {
      event.target.result.createObjectStore(MEDIA_STORE, { keyPath: "key" });
    };
    req.onsuccess = (event) => resolve(event.target.result);
    req.onerror = (event) => reject(event.target.error);
  });
}

export async function saveMediaBlob(key, dataUrl) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    tx.objectStore(MEDIA_STORE).put({ key, dataUrl });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (event) => reject(event.target.error);
  });
}

export async function getMediaBlob(key) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readonly");
    const req = tx.objectStore(MEDIA_STORE).get(key);
    req.onsuccess = (event) => resolve(event.target.result?.dataUrl || null);
    req.onerror = (event) => reject(event.target.error);
  });
}

export function saveMediaUrl(key, url) {
  const settings = JSON.parse(localStorage.getItem("alhason_video_urls") || "{}");
  settings[key] = url;
  localStorage.setItem("alhason_video_urls", JSON.stringify(settings));
}

export function getMediaUrl(key) {
  const settings = JSON.parse(localStorage.getItem("alhason_video_urls") || "{}");
  return settings[key] || null;
}

export async function resolveMedia(key) {
  const blob = await getMediaBlob(key);
  if (blob) return blob;
  return getMediaUrl(key);
}
