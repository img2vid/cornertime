export function readLocal<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem('ct.' + key) || 'null') || fallback; }
    catch { return fallback; }
}
export function saveLocal(key: string, value: any) {
    try { localStorage.setItem('ct.' + key, JSON.stringify(value)); } catch { /* Session still works in private mode. */ }
}
