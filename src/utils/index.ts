// Client side ONLY
export function getSafeAreaBottom() {
  return parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom'))
}
