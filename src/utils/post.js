const API_URL = import.meta.env.VITE_API_URL;

async function request(url, options) {
  const res = await fetch(`${API_URL}${url}`, options);

  // 성공이면 바로 파싱해서 리턴
  if (res.ok) {
    // 응답이 json이 아닐 수도 있으면 분기해야 함 (보통은 json)
    return res.json();
  }

  // 실패면 에러 메시지 만들기 (서버가 JSON 에러를 줄 때가 많음)
  let errorBody = null;
  try {
    errorBody = await res.json();
  } catch {} //실패 시 무시

  const message =
    errorBody?.message || errorBody?.error || `HTTP Error ${res.status}`;

  const err = new Error(message);
  err.status = res.status;
  err.body = errorBody;
  throw err;
}

export async function post(url, payload) {
  console.log("[POST]", { url, payload });
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
