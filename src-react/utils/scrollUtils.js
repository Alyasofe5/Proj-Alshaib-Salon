export function rememberScrollTarget(sectionId) {
  try {
    sessionStorage.setItem("react_scroll_target", sectionId);
  } catch {}
}

export function consumeScrollTarget() {
  try {
    const value = sessionStorage.getItem("react_scroll_target");
    if (value) sessionStorage.removeItem("react_scroll_target");
    return value;
  } catch {
    return null;
  }
}
