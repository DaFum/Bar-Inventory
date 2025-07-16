/**
 * Maskiert spezielle HTML-Zeichen in einer Zeichenkette durch ihre entsprechenden HTML-Entitäten, um Cross-Site-Scripting (XSS) zu verhindern.
 *
 * Gibt eine leere Zeichenkette zurück, wenn der Eingabewert `undefined` oder `null` ist.
 *
 * @param str - Die zu maskierende Zeichenkette, kann auch `undefined` oder `null` sein
 * @returns Die maskierte Zeichenkette mit ersetzten HTML-Sonderzeichen
 */
export function escapeHtml(str: string | undefined | null): string {
  if (str === undefined || str === null) {
    return '';
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SECRET_KEY = 'your-super-secret-key'; // Warning: Hardcoded secret key

async function getKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(SECRET_KEY);
  const hash = await crypto.subtle.digest('SHA-256', keyData);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptData(data: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);
  const encryptedData = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);
  const encryptedArray = new Uint8Array(encryptedData);
  const ivAndEncrypted = new Uint8Array(iv.length + encryptedArray.length);
  ivAndEncrypted.set(iv);
  ivAndEncrypted.set(encryptedArray, iv.length);
  return btoa(String.fromCharCode.apply(null, Array.from(ivAndEncrypted)));
}

export async function decryptData(encryptedData: string): Promise<string> {
  const key = await getKey();
  const ivAndEncrypted = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
  const iv = ivAndEncrypted.slice(0, 12);
  const encrypted = ivAndEncrypted.slice(12);
  const decryptedData = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decryptedData);
}
