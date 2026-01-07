import http from "http";
import { randomUUID } from "crypto";

const PORT = 3000;
const FRONT_ORIGIN = "http://localhost:5173";

// 간단 메모리 저장소: jobId -> payload
const jobs = new Map();

function sendSSE(res, dataObj) {
  // SSE는 한 줄에 data: ...\n\n 형태여야 함
  res.write(`data: ${JSON.stringify(dataObj)}\n\n`);
}

const server = http.createServer((req, res) => {
  // --- CORS / Preflight ---
  res.setHeader("Access-Control-Allow-Origin", FRONT_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- POST /api/v1/commentary : job 생성 ---
  if (req.method === "POST" && req.url === "/api/v1/commentary") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let payload = null;
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON" }));
        return;
      }

      const gameId = payload.gameId ?? 126283;
      const clientId = payload.clientId ?? "test-client-001";

      // 테스트용 jobId
      const jobId = `job_${randomUUID().slice(0, 6)}`;

      // fillerAudioUrl은 진짜 mp3가 없어도 됨(재생 테스트는 별도)
      // 일단 프론트가 URL을 받는 것만 확인 가능하도록 더미
      const fillerAudioUrl =
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

      // 몇 초 뒤 SSE로 보낼 최종 payload를 미리 저장
      const donePayload = {
        gameId,
        jobId,
        clientId,
        mp3Url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        script: [
          {
            actionId: 0,
            timeSeconds: "1.033",
            tone: "DEFAULT",
            description: "이영준 선수가 패스합니다.",
          },
          {
            actionId: 1,
            timeSeconds: "2.433",
            tone: "DEFAULT",
            description: "원두재 선수가 받습니다.",
          },
          {
            actionId: 2,
            timeSeconds: "3.033",
            tone: "EXCITED",
            description: "원두재 선수가 전방으로 강하게 패스합니다!",
          },
        ],
        coords: [
          {
            gameId,
            actionId: 0,
            startX: 52.418205,
            startY: 33.485444,
            endX: 31.322445,
            endY: 38.274752,
            dx: -21.09576,
            dy: 4.789308,
            teamNameKoShort: "울산",
          },
          {
            gameId,
            actionId: 1,
            startX: 31.322445,
            startY: 38.274752,
            endX: 31.322445,
            endY: 38.274752,
            dx: 0.0,
            dy: 0.0,
            teamNameKoShort: "울산",
          },
          {
            gameId,
            actionId: 2,
            startX: 32.01324,
            startY: 38.100808,
            endX: 37.371285,
            endY: 30.63298,
            dx: 5.358045,
            dy: -7.467828,
            teamNameKoShort: "울산",
          },
        ],
      };

      jobs.set(jobId, donePayload);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          isSuccess: true,
          code: "COMMENTARY_200",
          message: "필러멘트가 생성되었습니다",
          result: { jobId, fillerAudioUrl },
        })
      );
    });
    return;
  }

  // --- GET /sse?jobId=... : SSE 구독 ---
  if (req.method === "GET" && req.url.startsWith("/sse")) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const jobId = url.searchParams.get("jobId");

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": FRONT_ORIGIN,
    });

    // 연결 유지용 ping (프록시/브라우저에서 끊지 않게)
    const ping = setInterval(() => {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 15000);

    // jobId가 없으면 안내만 보내고 종료
    if (!jobId) {
      sendSSE(res, { error: "jobId query param required" });
      clearInterval(ping);
      res.end();
      return;
    }

    // 2초 후 "준비중" 이벤트
    const t1 = setTimeout(() => {
      sendSSE(res, { jobId, status: "PREPARING" });
    }, 2000);

    // 6초 후 "완료 payload" 전송 (프론트는 이거 받으면 ready 전환)
    const t2 = setTimeout(() => {
      const donePayload = jobs.get(jobId);
      if (donePayload) {
        sendSSE(res, donePayload);
      } else {
        sendSSE(res, { jobId, status: "NOT_FOUND" });
      }
      // 한 번 보내고 끊기(테스트용)
      clearInterval(ping);
      res.end();
    }, 6000);

    req.on("close", () => {
      clearInterval(ping);
      clearTimeout(t1);
      clearTimeout(t2);
      console.log("client disconnected");
    });

    return;
  }

  // --- fallback ---
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`POST  http://localhost:${PORT}/api/v1/commentary`);
  console.log(`SSE   http://localhost:${PORT}/sse?jobId=job_xxxxxx`);
});
