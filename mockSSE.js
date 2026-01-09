import express from "express";
import cors from "cors";

const app = express();
app.use(cors()); // 개발 중 CORS 허용
app.use(express.json()); // JSON body 파싱

// ✅ 여기 done으로 보낼 "당신 스크립트"를 넣으면 됨
const DONE_PAYLOAD = {
  gameId: 126283,
  jobId: "job_mock_001",
  mp3Url: "https://example.com/fake.mp3", // 일단 아무 URL. (오디오는 재생 안 될 수 있음)
  script: [
    {
      actionId: 0,
      timeSeconds: "1.033",
      tone: "DEFAULT",
      description: "A가 패스합니다.",
    },
    {
      actionId: 1,
      timeSeconds: "2.433",
      tone: "DEFAULT",
      description: "B가 받습니다.",
    },
    {
      actionId: 2,
      timeSeconds: "3.033",
      tone: "EXCITED",
      description: "전방으로 강하게 패스!",
    },
  ],
  coords: [
    { actionId: 0, startX: 52.4, startY: 33.4, endX: 31.3, endY: 38.2 },
    { actionId: 1, startX: 31.3, startY: 38.2, endX: 44.0, endY: 55.0 },
    { actionId: 2, startX: 44.0, startY: 55.0, endX: 70.0, endY: 30.0 },
  ],
};

// 1) POST: next → jobId 반환
app.post("/api/v1/commentary/next", (req, res) => {
  const { gameId, actionId, clientId, style } = req.body ?? {};
  console.log("[POST /next]", { gameId, actionId, clientId, style });

  // 간단 검증(원하면 제거)
  if (!Number.isFinite(Number(gameId)) || Number(gameId) <= 0) {
    return res.status(400).send("invalid gameId");
  }
  if (!Number.isFinite(Number(actionId)) || Number(actionId) < 0) {
    return res.status(400).send("invalid actionId");
  }

  // actionId마다 jobId 바꿔도 됨
  const jobId = `job_mock_${String(actionId).padStart(3, "0")}`;
  res.json({ jobId });
});

// 2) SSE: jobId → event: done 보내기
app.get("/api/v1/sse/commentary/:jobId", (req, res) => {
  const { jobId } = req.params;
  console.log("[SSE open]", jobId);

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  // 연결 이벤트(선택)
  res.write(`event: connected\ndata: ok\n\n`);

  // 200~500ms 후 done 보내기 (네 코드의 waiting_sse 테스트)
  const t = setTimeout(() => {
    const payload = { ...DONE_PAYLOAD, jobId };

    // ✅ 여기서 일부러 JSON을 깨뜨리면 "파싱 실패 재시도"도 테스트 가능
    // const bad = `{"oops":`;
    // res.write(`event: done\ndata: ${bad}\n\n`);

    res.write(`event: done\ndata: ${JSON.stringify(payload)}\n\n`);
  }, 300);

  req.on("close", () => {
    clearTimeout(t);
    console.log("[SSE close]", jobId);
  });
});

app.listen(8080, () => {
  console.log("Mock server running: http://localhost:8080");
});
