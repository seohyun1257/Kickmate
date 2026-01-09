import styles from "./Commentary.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import getClientId from "../../utils/clientId";

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// actionId 기준으로 중복 없이 합치기(기존 유지 + 신규 덮어쓰기)
function mergeByActionId(prevArr, nextArr) {
  const map = new Map();
  for (const item of prevArr ?? []) map.set(item.actionId, item);
  for (const item of nextArr ?? []) map.set(item.actionId, item);
  return Array.from(map.values()).sort((a, b) => a.actionId - b.actionId);
}

export default function Commentary() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const clientId = getClientId();

  const time = useDataStore((s) => s.time);
  const API_URL = import.meta.env.VITE_API_URL;

  // ====== 프로젝트에 맞게 바꾸세요 ======
  const POST_URL = `${API_URL}/api/v1/commentary/next`; // ✅ 여기: (예) /api/v1/commentary/next 같은 실제 엔드포인트로 변경
  const SSE_URL = (jobId) => `${API_URL}/api/v1/sse/commentary/${jobId}`;
  // ====================================

  // Request에서 넘겨줄 수도 있는 값들
  const gameId = state?.match?.matchId ?? state?.gameId ?? 126283; // 없으면 테스트
  const style = state?.style ?? "CASTER"; // 사용자 설정 스타일
  const jobId = state?.jobId;

  // ===== SSE 결과 누적 상태 =====
  const [scriptRaw, setScriptRaw] = useState([]); // [{actionId,timeSeconds,tone,description}]
  const [coordsRaw, setCoordsRaw] = useState([]); // [{actionId,startX,...}]
  const [mp3Url, setMp3Url] = useState(null);

  // ===== 요청/흐름 제어 =====
  const [nextActionId, setNextActionId] = useState(0); // 다음에 요청할 actionId
  const [currentJobId, setCurrentJobId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | posting | waiting_sse | ready | error
  const [errorMsg, setErrorMsg] = useState(null);

  // ===== audio/canvas =====
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentSec, setCurrentSec] = useState(0);

  // ====== script 정규화 ======
  const script = useMemo(() => {
    return (scriptRaw ?? [])
      .map((s) => ({ ...s, t: toNum(s.timeSeconds) }))
      .sort((a, b) => a.t - b.t);
  }, [scriptRaw]);

  const coordsByAction = useMemo(() => {
    const m = new Map();
    for (const c of coordsRaw ?? []) m.set(c.actionId, c);
    return m;
  }, [coordsRaw]);

  const actionTimeMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < script.length; i++) {
      const cur = script[i];
      const next = script[i + 1];
      map.set(cur.actionId, { start: cur.t, end: next ? next.t : cur.t + 1.0 });
    }
    return map;
  }, [script]);

  const activeActionId = useMemo(() => {
    let last = null;
    for (const s of script) {
      if (s.t <= currentSec + 0.02) last = s;
      else break;
    }
    return last?.actionId ?? null;
  }, [script, currentSec]);

  // ====== 카드 클릭 → seek ======
  const seekTo = (sec, autoPlay = true) => {
    const audio = audioRef.current;
    if (!audio) return;

    const target = Math.max(0, sec - 0.05);
    audio.currentTime = target;
    setCurrentSec(target);

    if (autoPlay) audio.play().catch(() => {});
  };

  // =========================
  // 1) POST: 다음 action 요청 → jobId 받기
  // =========================
  const requestNext = async () => {
    setStatus("posting");
    setErrorMsg(null);

    try {
      const res = await fetch(POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          actionId: nextActionId,
          style,
          clientId, // 서버가 필요 없다면 빼도 됨
        }),
      });

      const text = await res.text().catch(() => "");
      console.log("[POST response]", res.status, text);

      if (!res.ok) {
        throw new Error(`POST 실패 (${res.status}) ${text}`);
      }

      const data = text ? JSON.parse(text) : null;

      // 서버 응답: result가 jobId 문자열
      const jobIdFromServer = data?.jobId ?? data?.result;

      if (!jobIdFromServer) throw new Error(`jobId 없음: ${text}`);

      setCurrentJobId(jobIdFromServer);
      setStatus("waiting_sse");
    } catch (e) {
      console.error(e);
      setErrorMsg(e?.message ?? "요청 실패");
      setStatus("error"); // ✅ 멈춤
    }
  };

  // 최초 1회 시작(원하면 버튼으로 시작하게 바꿀 수 있음)
  useEffect(() => {
    if (status !== "idle") return;
    requestNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // =========================
  // 2) SSE: jobId 생기면 연결 → done payload 받기
  // =========================
  useEffect(() => {
    if (!currentJobId) return;
    if (status !== "waiting_sse") return;

    const es = new EventSource(SSE_URL(currentJobId));

    const onDone = (e) => {
      try {
        const data = JSON.parse(e.data);

        // data: { mp3Url, script, coords, ... }
        if (data?.mp3Url) setMp3Url(data.mp3Url);

        if (Array.isArray(data?.script)) {
          setScriptRaw((prev) => mergeByActionId(prev, data.script));
        }
        if (Array.isArray(data?.coords)) {
          setCoordsRaw((prev) => mergeByActionId(prev, data.coords));
        }

        // ✅ 이 “한 세트”가 끝났으니 다음 actionId로 준비
        setNextActionId((prev) => prev + 1);

        setStatus("ready");
        es.close();
      } catch (err) {
        console.error("SSE parse error", err);
        setErrorMsg("SSE payload 파싱 실패");
        setStatus("error");
        es.close();
      }
    };

    es.addEventListener("done", onDone);

    es.onerror = () => {
      es.close();
      setTimeout(() => {
        // status를 waiting_sse로 유지한 채 다시 연결 시도하는 식
        setStatus("waiting_sse");
      }, 500);
    };

    return () => es.close();
  }, [currentJobId, status]);

  // =========================
  // 3) ready 상태가 되면 자동으로 다음 action 요청(반복)
  //    - 너무 빠르면 서버 부담 → 필요하면 setTimeout(예: 100~300ms) 넣기
  // =========================
  useEffect(() => {
    if (status !== "ready") return;

    // 다음 요청 시작
    requestNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // =========================
  // 4) mp3Url이 갱신되면 audio src 업데이트
  //    - 기존 재생 위치 유지(새 mp3가 기존 앞부분 포함한다고 가정)
  // =========================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!mp3Url) return;

    const wasPlaying = !audio.paused;
    const keepTime = audio.currentTime || 0;

    audio.src = mp3Url;
    audio.preload = "auto";

    const onLoaded = () => {
      // mp3 길이가 더 짧거나 아직 로드 전이면 예외 날 수 있음 → try
      try {
        audio.currentTime = keepTime;
      } catch (_) {}
      if (wasPlaying) audio.play().catch(() => {});
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    return () => audio.removeEventListener("loadedmetadata", onLoaded);
  }, [mp3Url]);

  // =========================
  // 5) currentTime 추적 (raf)
  // =========================
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let raf = 0;
    const tick = () => {
      setCurrentSec(audio.currentTime || 0);
      raf = requestAnimationFrame(tick);
    };

    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => cancelAnimationFrame(raf);
    const onEnded = () => cancelAnimationFrame(raf);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      cancelAnimationFrame(raf);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // =========================
  // 6) Canvas draw (currentSec 기준 공 이동)
  // =========================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (activeActionId == null) return;

    const c = coordsByAction.get(activeActionId);
    const t = actionTimeMap.get(activeActionId);
    if (!c || !t) return;

    const dur = Math.max(0.001, t.end - t.start);
    const p = clamp((currentSec - t.start) / dur, 0, 1);

    const xPctRaw = c.startX + (c.endX - c.startX) * p;
    const yPctRaw = c.startY + (c.endY - c.startY) * p;

    const xPct = clamp(xPctRaw, 0, 100);
    const yPct = clamp(yPctRaw, 0, 100);

    const x = (xPct / 100) * rect.width;
    const y = (yPct / 100) * rect.height;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
  }, [currentSec, activeActionId, coordsByAction, actionTimeMap]);

  // ====== 타임라인: 누적된 script 전체 보여주기 ======
  const timelineList = script;

  return (
    <div className={styles.app}>
      <div className={styles.statusBar}>{time}</div>

      <div className={styles.header}>
        <button className={styles.back1} onClick={() => navigate("/")}>
          ←
        </button>

        <div className={styles.score}>
          <span className={styles.home}>울산</span> 1 : 0{" "}
          <span className={styles.away}>전북</span>
        </div>
        <div className={styles.time}>후반 72:30</div>
      </div>

      {/* Pitch */}
      <div className={styles.pitch}>
        <div className={styles.midLine} />
        <div className={styles.centerCircle} />

        <div className={`${styles.penaltyArea} ${styles.left}`} />
        <div className={`${styles.goalArea} ${styles.left}`} />
        <div className={`${styles.goal} ${styles.left}`} />

        <div className={`${styles.penaltyArea} ${styles.right}`} />
        <div className={`${styles.goalArea} ${styles.right}`} />
        <div className={`${styles.goal} ${styles.right}`} />

        <canvas className={styles.canvas} ref={canvasRef} />
      </div>

      {/* Status/debug */}
      <div style={{ padding: "8px 16px", fontSize: 12, opacity: 0.85 }}>
        <div>
          status: {status} · nextActionId: {nextActionId} · jobId:{" "}
          {currentJobId ?? "-"}
        </div>
        <div>t = {currentSec.toFixed(2)}s</div>
        {errorMsg && <div style={{ opacity: 0.95 }}>에러: {errorMsg}</div>}
      </div>

      {/* Audio */}
      <div style={{ padding: "0 16px 8px" }}>
        <audio ref={audioRef} controls style={{ width: "100%" }} />
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        {timelineList.map((s) => {
          const isActive = s.actionId === activeActionId;
          return (
            <div
              key={s.actionId}
              className={`${styles.timelineCard} ${
                isActive ? styles.activeCard : ""
              }`}
              role="button"
              tabIndex={0}
              onClick={() => seekTo(s.t, true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") seekTo(s.t, true);
              }}
            >
              <span className={styles.eventMinute}>{s.t.toFixed(1)}s</span>
              <div className={styles.eventDesc}>{s.description}</div>
              <div className={styles.eventPlayer}>{s.tone}</div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.btn}>⚙️</button>

        <button
          className={styles.btn}
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = Math.max(0, (audio.currentTime || 0) - 5);
          }}
        >
          ⏮
        </button>

        <button
          className={`${styles.btn} ${styles.play}`}
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
          }}
        >
          ▶
        </button>

        <button
          className={styles.btn}
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = (audio.currentTime || 0) + 5;
          }}
        >
          ⏭
        </button>

        <button className={`${styles.btn} ${styles.magic}`}>✨</button>
      </div>
    </div>
  );
}
