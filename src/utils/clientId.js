// clientId.js
export default function getClientId() {
  const KEY = "clientId";

  let id = localStorage.getItem(KEY);
  if (id) return id;

  // 1) 표준 UUID 사용 가능하면
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    id = crypto.randomUUID();
  } else {
    // 2) fallback (충분히 유니크)
    id = `cid_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  localStorage.setItem(KEY, id);
  return id;
}
