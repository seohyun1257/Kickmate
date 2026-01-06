export default function getClientId() {
  let clientId = localStorage.getItem("clientId");

  if (!clientId) {
    clientId = crypto.randomUUID(); // 브라우저 내장
    localStorage.setItem("clientId", clientId);
  }

  return clientId;
}
