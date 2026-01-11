import styles from "./Commentary.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import getClientId from "../../utils/clientId";

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function formatTimeHHMM(sec) {
  const safe = Math.max(0, Math.floor(toNum(sec)));
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function isOwnGoalType(typeName) {
  if (!typeName) return false;
  const t = String(typeName).toLowerCase();
  return t.includes("own") || t.includes("자책");
}

function isGoalType(typeName) {
  if (!typeName) return false;
  const t = String(typeName).toLowerCase();
  return t.includes("goal") || t.includes("골");
}

function normTeam(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, ""); // 한글/영문/숫자만 남기기
}

// ✅ 다양한 payload에서 팀 필드 후보를 최대한 흡수
function pickTeamShort(obj) {
  if (!obj || typeof obj !== "object") return null;
  return (
    obj.teamNameKoShort ??
    obj.teamNameShort ??
    obj.teamShort ??
    obj.teamNameKo ??
    obj.teamName ??
    obj.team ??
    null
  );
}

/**
 * score/goal 이벤트 payload가 프로젝트마다 필드명이 다를 수 있어서,
 * 아래처럼 최대한 유연하게 "홈/원정 점수"를 추출합니다.
 */
function normalizeScoreItem(item) {
  if (!item || typeof item !== "object") return null;

  const actionId =
    item.actionId ??
    item.actionID ??
    item.action ??
    item.action_id ??
    item.actionNo ??
    null;

  const home =
    item.homeScore ??
    item.home ??
    item.scoreHome ??
    item.home_team_score ??
    item.home_team ??
    item.homeGoals ??
    item.home_goal ??
    null;

  const away =
    item.awayScore ??
    item.away ??
    item.scoreAway ??
    item.away_team_score ??
    item.away_team ??
    item.awayGoals ??
    item.away_goal ??
    null;

  const teamNameKoShort = pickTeamShort(item);
  const typeName = item.typeName ?? item.type ?? item.eventType ?? null;

  const homeN = toNum(home);
  const awayN = toNum(away);

  if (actionId == null) return null;

  const hasScore = Number.isFinite(homeN) && Number.isFinite(awayN);

  return {
    actionId: toNum(actionId),
    hasScore,
    homeScore: hasScore ? homeN : null,
    awayScore: hasScore ? awayN : null,
    teamNameKoShort: teamNameKoShort ?? null,
    typeName,
    isOwnGoal: isOwnGoalType(typeName),
    isGoal: isGoalType(typeName),
  };
}

export default function Commentary() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const clientId = getClientId();
  const time = useDataStore((s) => s.time);

  const API_URL = import.meta.env.VITE_API_URL;
  const POST_URL = `${API_URL}/api/v1/commentary/next`;
  const SSE_URL = (jobId) => `${API_URL}/api/v1/sse/commentary/${jobId}`;

  // ---- match/state ----
  const gameId = state?.match?.matchId ?? state?.gameId ?? 126283;
  const style = state?.style ?? "CASTER";
  const MATCH_CACHE_KEY = `match:${gameId}`;
  const [matchInfo, setMatchInfo] = useState(state?.match ?? null);

  useEffect(() => {
    if (state?.match) {
      setMatchInfo(state.match);
      try {
        sessionStorage.setItem(MATCH_CACHE_KEY, JSON.stringify(state.match));
      } catch {}
    }
  }, [state?.match, MATCH_CACHE_KEY]);

  useEffect(() => {
    if (matchInfo) return;
    try {
      const cached = sessionStorage.getItem(MATCH_CACHE_KEY);
      if (cached) setMatchInfo(JSON.parse(cached));
    } catch {}
  }, [matchInfo, MATCH_CACHE_KEY]);

  const homeTeamLabel =
    matchInfo?.home?.teamNameKoShort ??
    matchInfo?.home?.teamNameKo ??
    matchInfo?.homeTeam?.teamNameKoShort ??
    matchInfo?.homeTeam ??
    "HOME";

  const awayTeamLabel =
    matchInfo?.away?.teamNameKoShort ??
    matchInfo?.away?.teamNameKo ??
    matchInfo?.awayTeam?.teamNameKoShort ??
    matchInfo?.awayTeam ??
    "AWAY";

  // “홈 팀 short” (색 비교 기준)
  const homeTeamShortRaw =
    matchInfo?.home?.teamNameKoShort ??
    matchInfo?.homeTeam?.teamNameKoShort ??
    matchInfo?.home?.teamNameShort ??
    matchInfo?.homeTeamShort ??
    matchInfo?.homeTeam ??
    "HOME";
  // ✅ 비교는 정규화된 값으로
  const homeTeamKey = useMemo(
    () => normTeam(homeTeamShortRaw),
    [homeTeamShortRaw]
  );

  const awayTeamShortRaw =
    matchInfo?.away?.teamNameKoShort ??
    matchInfo?.awayTeam?.teamNameKoShort ??
    matchInfo?.away?.teamNameShort ??
    matchInfo?.awayTeamShort ??
    matchInfo?.awayTeam ??
    "AWAY";
  const awayTeamKey = useMemo(
    () => normTeam(awayTeamShortRaw),
    [awayTeamShortRaw]
  );

  // ===== SSE 결과 상태(새 done 오면 통째로 교체) =====
  const [scriptRaw, setScriptRaw] = useState([]);
  const [coordsRaw, setCoordsRaw] = useState([]);
  const [scoreRaw, setScoreRaw] = useState([]);
  const [mp3Url, setMp3Url] = useState(null);

  // ===== 시간축(절대시간 + 로컬오디오시간) =====
  const [localSec, setLocalSec] = useState(0);
  const [chunkBaseAbsSec, setChunkBaseAbsSec] = useState(0);

  const absSec = useMemo(
    () => chunkBaseAbsSec + localSec,
    [chunkBaseAbsSec, localSec]
  );

  // ===== 요청/흐름 제어 =====
  const [lastActionId, setLastActionId] = useState(0);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ===== audio/canvas =====
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const timelineRef = useRef(null);
  const sentinelRef = useRef(null);
  const activeJobIdRef = useRef(null);
  const lastBallColorRef = useRef(null);
  const activeActionIdRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // ====== script 정규화: timeSeconds는 "경기 절대시간" ======
  const script = useMemo(() => {
    return (scriptRaw ?? [])
      .map((s) => ({
        ...s,
        actionId: toNum(s.actionId),
        t: toNum(s.timeSeconds),
      }))
      .sort((a, b) => a.t - b.t || a.actionId - b.actionId);
  }, [scriptRaw]);

  const coordsByAction = useMemo(() => {
    const m = new Map();
    for (const c of coordsRaw ?? []) m.set(c.actionId, c);
    return m;
  }, [coordsRaw]);

  const scoreByAction = useMemo(() => {
    const m = new Map();
    for (const it of scoreRaw ?? []) {
      const norm = normalizeScoreItem(it);
      if (!norm) continue;
      if (norm.hasScore) m.set(norm.actionId, norm);
    }
    return m;
  }, [scoreRaw]);

  const scoreMetaByAction = useMemo(() => {
    const m = new Map();
    for (const it of scoreRaw ?? []) {
      const norm = normalizeScoreItem(it);
      if (!norm) continue;
      if (norm.isGoal || norm.isOwnGoal) m.set(norm.actionId, norm);
    }
    return m;
  }, [scoreRaw]);

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
      if (s.t <= absSec + 0.02) last = s;
      else break;
    }
    return last?.actionId ?? null;
  }, [script, absSec]);

  const playedTimeline = useMemo(() => {
    return script.filter((s) => s.t <= absSec + 0.02);
  }, [script, absSec]);

  const timelineList = script;

  const displayedScore = useMemo(() => {
    let hs = 0;
    let as = 0;
    for (let i = playedTimeline.length - 1; i >= 0; i--) {
      const aId = playedTimeline[i]?.actionId;
      if (aId == null) continue;
      const sc = scoreByAction.get(aId);
      if (sc) {
        hs = sc.homeScore ?? hs;
        as = sc.awayScore ?? as;
        break;
      }
    }
    return { home: hs, away: as };
  }, [playedTimeline, scoreByAction]);

  const seekToAbs = useCallback(
    (absTargetSec, autoPlay = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      const localTarget = Math.max(0, absTargetSec - chunkBaseAbsSec - 0.05);
      audio.currentTime = localTarget;
      setLocalSec(localTarget);

      if (autoPlay) audio.play().catch(() => {});
    },
    [chunkBaseAbsSec]
  );

  const requestNext = useCallback(async () => {
    if (isFetchingNext || !hasMore) return;
    setIsFetchingNext(true);
    setStatus("posting");
    setErrorMsg(null);

    const requestBody = {
      gameId,
      actionId: lastActionId,
      style,
      clientId,
    };

    try {
      const res = await fetch(POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) throw new Error(`POST 실패 (${res.status}) ${text}`);

      const data = text ? JSON.parse(text) : null;
      const jobIdFromServer = data?.jobId ?? data?.result;
      if (!jobIdFromServer) throw new Error(`jobId 없음: ${text}`);

      setCurrentJobId(jobIdFromServer);
      activeJobIdRef.current = jobIdFromServer;
      setStatus("waiting_sse");
    } catch (e) {
      setErrorMsg(e?.message ?? "요청 실패");
      setStatus("error");
      setIsFetchingNext(false);
    }
  }, [
    POST_URL,
    clientId,
    gameId,
    hasMore,
    isFetchingNext,
    lastActionId,
    style,
  ]);

  useEffect(() => {
    if (status !== "idle") return;
    requestNext();
  }, [status, requestNext]);

  useEffect(() => {
    if (!currentJobId) return;
    if (status !== "waiting_sse") return;

    const es = new EventSource(SSE_URL(currentJobId));

    const onDone = (e) => {
      try {
        const data = JSON.parse(e.data);
        const jobIdFromServer = data?.jobId ?? null;
        if (jobIdFromServer && jobIdFromServer !== activeJobIdRef.current) {
          return;
        }

        const incomingScript = Array.isArray(data?.script) ? data.script : [];
        const incomingCoords = Array.isArray(data?.coords) ? data.coords : [];

        const incomingScore =
          (Array.isArray(data?.goal) && data.goal) ||
          (Array.isArray(data?.goals) && data.goals) ||
          (Array.isArray(data?.score) && data.score) ||
          [];

        const computedBase =
          incomingScript.length > 0
            ? Math.min(...incomingScript.map((s) => toNum(s.timeSeconds)))
            : 0;

        // ✅ (5) 새 SSE 오면 교체(=초기화 효과)
        setScriptRaw((prev) => {
          const map = new Map();
          for (const item of prev ?? []) {
            const id = toNum(item?.actionId);
            if (!Number.isFinite(id)) continue;
            map.set(id, item);
          }
          for (const item of incomingScript ?? []) {
            const id = toNum(item?.actionId);
            if (!Number.isFinite(id)) continue;
            map.set(id, { ...map.get(id), ...item, actionId: id });
          }
          const merged = Array.from(map.values());
          const sorted = merged.sort((a, b) => {
            const ta = toNum(a.timeSeconds);
            const tb = toNum(b.timeSeconds);
            if (ta !== tb) return ta - tb;
            return toNum(a.actionId) - toNum(b.actionId);
          });
          if (sorted.length <= 100) return sorted;
          const activeId = activeActionIdRef.current;
          const idx = sorted.findIndex(
            (s) => toNum(s.actionId) === toNum(activeId)
          );
          if (idx < 0) return sorted.slice(-100);
          const windowStart = Math.max(0, idx - Math.floor(100 * 0.4));
          const windowEnd = Math.min(sorted.length, windowStart + 100);
          return sorted.slice(windowEnd - 100, windowEnd);
        });
        setCoordsRaw((prev) => {
          const map = new Map();
          for (const item of prev ?? []) {
            const id = toNum(item?.actionId);
            if (!Number.isFinite(id)) continue;
            map.set(id, item);
          }
          for (const item of incomingCoords ?? []) {
            const id = toNum(item?.actionId);
            if (!Number.isFinite(id)) continue;
            map.set(id, { ...map.get(id), ...item, actionId: id });
          }
          return Array.from(map.values());
        });
        setScoreRaw((prev) => {
          const map = new Map();
          for (const item of prev ?? []) {
            const id = toNum(item?.actionId);
            if (!Number.isFinite(id)) continue;
            map.set(id, item);
          }
          for (const item of incomingScore ?? []) {
            const id = toNum(item?.actionId);
            if (!Number.isFinite(id)) continue;
            map.set(id, { ...map.get(id), ...item, actionId: id });
          }
          return Array.from(map.values());
        });

        if (typeof data?.mp3Url === "string" && data.mp3Url.length > 0) {
          setMp3Url(data.mp3Url);
          setChunkBaseAbsSec(computedBase);
          setLocalSec(0);
        }

        if (incomingScript.length === 0) setHasMore(false);
        setLastActionId((prev) => {
          let maxId = prev;
          for (const s of incomingScript) {
            const id = toNum(s?.actionId);
            if (id > maxId) maxId = id;
          }
          return maxId;
        });

        setStatus("ready");
        setIsFetchingNext(false);
        es.close();
      } catch (err) {
        setErrorMsg("SSE payload 파싱 실패");
        setStatus("error");
        setIsFetchingNext(false);
        es.close();
      }
    };

    es.addEventListener("done", onDone);

    es.onerror = () => {
      es.close();
      setIsFetchingNext(false);
      setTimeout(() => setStatus("waiting_sse"), 500);
    };

    return () => es.close();
  }, [currentJobId, status, API_URL]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const node = sentinelRef.current;
    const root = timelineRef.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) requestNext();
        }
      },
      { root, rootMargin: "0px 0px 50% 0px", threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [requestNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!mp3Url) {
      audio.removeAttribute("src");
      audio.load();
      setIsPlaying(false);
      return;
    }

    audio.src = mp3Url;
    audio.preload = "auto";

    const onLoaded = () => {
      try {
        audio.currentTime = 0;
      } catch (_) {}
      setLocalSec(0);
      setIsPlaying(false);
      if (autoPlayEnabled) audio.play().catch(() => {});
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    return () => audio.removeEventListener("loadedmetadata", onLoaded);
  }, [mp3Url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let raf = 0;

    const tick = () => {
      setLocalSec(audio.currentTime || 0);
      raf = requestAnimationFrame(tick);
    };

    const onPlay = () => {
      setIsPlaying(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setIsPlaying(false);
      cancelAnimationFrame(raf);
    };
    const onEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(raf);
    };

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

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setAutoPlayEnabled(true);
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const jumpLocal = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.max(0, (audio.currentTime || 0) + delta);
    audio.currentTime = next;
    setLocalSec(next);
  };

  // ✅ 팀 추출 + 정규화 + 비교를 한곳에서
  const getActionTeamKey = useCallback(
    (actionId) => {
      if (actionId == null) return null;

      const c = coordsByAction.get(actionId);
      const fromCoords = pickTeamShort(c);
      if (fromCoords) return normTeam(fromCoords);

      return null;
    },
    [coordsByAction]
  );

  useEffect(() => {
    activeActionIdRef.current = activeActionId;
  }, [activeActionId]);

  // Canvas draw
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

    let x = rect.width / 2;
    let y = rect.height / 2;

    // ✅ 팀 키(정규화된 값)로 색 결정
    const teamKey = getActionTeamKey(activeActionId);

    // 디버그: 팀이 안 들어오는지 바로 확인 가능
    // (색이 안 바뀌면 여기 로그가 계속 null일 확률 높음)
    // console.log("activeActionId", activeActionId, "teamKey", teamKey, "homeTeamKey", homeTeamKey);

    const resolvedColor =
      teamKey == null
        ? null
        : teamKey === homeTeamKey
        ? "rgba(255,120,120,0.95)"
        : teamKey === awayTeamKey
        ? "rgba(120,170,255,0.95)"
        : null;
    const ballColor =
      resolvedColor ?? lastBallColorRef.current ?? "rgba(255,255,255,0.95)";

    if (resolvedColor) lastBallColorRef.current = resolvedColor;

    if (activeActionId != null) {
      const c = coordsByAction.get(activeActionId);
      const t = actionTimeMap.get(activeActionId);

      if (c && t) {
        const dur = Math.max(0.001, t.end - t.start);
        const p = clamp((absSec - t.start) / dur, 0, 1);

        const xPctRaw = c.startX + (c.endX - c.startX) * p;
        const yPctRaw = c.startY + (c.endY - c.startY) * p;

        const xPct = clamp(xPctRaw, 0, 100);
        const yPct = clamp(yPctRaw, 0, 100);

        x = (xPct / 100) * rect.width;
        y = (yPct / 100) * rect.height;
      }
    }

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();

    const goalMeta = scoreMetaByAction.get(activeActionId);
    if (goalMeta?.isGoal || goalMeta?.isOwnGoal) {
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.strokeStyle = goalMeta?.isOwnGoal
        ? "rgba(255,200,0,0.8)"
        : "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [
    absSec,
    activeActionId,
    coordsByAction,
    actionTimeMap,
    homeTeamKey,
    awayTeamKey,
    getActionTeamKey,
    scoreMetaByAction,
  ]);

  return (
    <div className={styles.app}>
      <div className={styles.statusBar}>{time}</div>

      <div className={styles.header}>
        <button className={styles.back1} onClick={() => navigate("/")}>
          ←
        </button>

        <div className={styles.centerAnchor}>
          <div className={styles.headerCenter}>
            <div className={styles.score}>
              <span className={styles.home}>{homeTeamLabel}</span>

              <span className={styles.scoreText}>
                {displayedScore.home} : {displayedScore.away}
              </span>

              <span className={styles.away}>{awayTeamLabel}</span>
            </div>

            <div className={styles.time}>{formatTimeHHMM(absSec)}</div>
          </div>
        </div>
      </div>

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

      <div className={styles.audioRow}>
        <audio ref={audioRef} />
        <button
          className={styles.audioBtn}
          onClick={togglePlay}
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>

      <div className={styles.timeline} ref={timelineRef}>
        {timelineList.map((s) => {
          const isActive = s.actionId === activeActionId;
          const scoreMeta = scoreMetaByAction.get(s.actionId);
          return (
            <div
              key={s.actionId}
              className={`${styles.timelineCard} ${
                isActive ? styles.activeCard : ""
              }`}
              role="button"
              tabIndex={0}
              onClick={() => seekToAbs(s.t, true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") seekToAbs(s.t, true);
              }}
            >
              <span className={styles.eventMinute}>{formatTimeHHMM(s.t)}</span>
              {scoreMeta?.isGoal || scoreMeta?.isOwnGoal ? (
                <span
                  className={`${styles.eventBadge} ${
                    scoreMeta?.isOwnGoal ? styles.ownGoal : styles.goal
                  }`}
                >
                  {scoreMeta?.isOwnGoal ? "OG" : "GOAL"}
                </span>
              ) : null}
              <div className={styles.eventDesc}>{s.description}</div>
              <div
                className={`${styles.eventPlayer} ${
                  normTeam(
                    coordsByAction.get(s.actionId)?.teamNameKoShort ?? ""
                  ) === homeTeamKey
                    ? styles.playerHome
                    : normTeam(
                        coordsByAction.get(s.actionId)?.teamNameKoShort ?? ""
                      ) === awayTeamKey
                    ? styles.playerAway
                    : ""
                }`}
              >
                {coordsByAction.get(s.actionId)?.teamNameKoShort ?? s.tone}
              </div>
            </div>
          );
        })}
        <div
          ref={sentinelRef}
          className={styles.timelineSentinel}
          aria-hidden="true"
        />
      </div>

      <div className={styles.controls}>
        {/* <button className={styles.btn} aria-label="설정">
          ⚙️
        </button>
        <button
          className={styles.btn}
          onClick={() => jumpLocal(-5)}
          aria-label="5초 뒤로"
        >
          ⏮
        </button> */}
        <div className={styles.controlsText}>
          재생이 안된다면 실시간을 한 번 눌러주세요
        </div>
        <button
          className={`${styles.btn} ${styles.play}`}
          onClick={togglePlay}
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          <span className={styles.dot} />
          실시간
        </button>
        {/* <button
          className={styles.btn}
          onClick={() => jumpLocal(5)}
          aria-label="5초 앞으로"
        >
          ⏭
        </button>
        <button className={`${styles.btn} ${styles.magic}`} aria-label="매직">
          ✨
        </button> */}
      </div>
    </div>
  );
}
