import styles from "./Request.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import getClientId from "../../utils/clientId";
import { post } from "../../utils/post";
import { useQuery } from "@tanstack/react-query";

export default function Request() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { state } = useLocation();

  const time = useDataStore((s) => s.time);
  const style = useDataStore((s) => s.style);

  const clientId = getClientId();

  // ✅ 먼저 선언 (순서 중요)
  const [status, setStatus] = useState("preparing"); // preparing | ready | error
  const [match, setMatch] = useState(null);

  // ✅ 오디오 토글
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ✅ SSE로 받은 최종 payload 저장 (다음 페이지에 그대로 넘길 것)
  const [finalPayload, setFinalPayload] = useState(null);

  // ✅ 최초 match 고정 (직접진입 방어)
  useEffect(() => {
    const m = state?.match ?? null;
    if (!m) {
      navigate("/", { replace: true });
      return;
    }
    setMatch(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gameId = match?.matchId ?? null;

  const payload = useMemo(() => {
    if (!gameId || !clientId || !style) return null;
    return {
      gameId,
      actionId: 0,
      clientId,
      style,
    };
  }, [gameId, clientId, style]);

  // ✅ 1) 생성 요청: jobId + fillerAudioUrl(JSON) 받기
  const {
    data: result,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["commentaryRequest", gameId, style, clientId],
    queryFn: () => post("/api/v1/commentary", payload),
    enabled: Boolean(payload),
    retry: false,
    select: (res) => res.result, // { jobId, fillerAudioUrl }
    onSuccess: () => setStatus("preparing"),
    onError: () => setStatus("error"),
  });

  const jobId = result?.jobId ?? null;
  const audioUrl = result?.fillerAudioUrl ?? null; // ✅ filler mp3 url

  // ✅ 2) filler 오디오 준비 + 재생 토글 (자동재생은 시도만)
  useEffect(() => {
    // url 바뀌면 기존 오디오 정리
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);

    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);

    // 자동재생 "시도" (막히면 그냥 버튼 눌러서 재생)
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));

    return () => {
      audio.pause();
      audioRef.current = null;
      setIsPlaying(false);
    };
  }, [audioUrl]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.log("play failed:", e);
      setIsPlaying(false);
    }
  }

  // ✅ 3) SSE: jobId 생기면 구독 → 최종 payload 받으면 ready + 저장
  // ✅ 3) SSE: jobId 생기면 구독 → 최종 payload 받으면 ready + 저장
  useEffect(() => {
    if (!jobId) return;

    setStatus("preparing");

    // ✅ 서버가 /api/v1/sse/commentary/{jobId} 로 받는 게 정석
    const url = `${API_URL}/api/v1/sse/commentary/${jobId}`;
    const es = new EventSource(url);

    const onConnected = (e) => {
      // "ok" 같은 문자열
      console.log("SSE connected:", e.data);
    };

    const onDone = (e) => {
      console.log("SSE done raw:", e.data);

      let data;
      try {
        data = JSON.parse(e.data);
      } catch (err) {
        console.log("SSE done JSON parse failed:", err);
        return;
      }

      // ✅ 최종 payload 검증
      if (!data?.jobId) return;
      if (data.jobId !== jobId) return;

      setFinalPayload(data);
      setStatus("ready");
      es.close();
    };

    es.addEventListener("connected", onConnected);
    es.addEventListener("done", onDone);

    es.onerror = (err) => {
      // EventSource는 에러 원인을 자세히 안 줍니다.
      console.log("SSE error:", err, "readyState:", es.readyState);
      // readyState: 0 CONNECTING, 1 OPEN, 2 CLOSED
    };

    return () => {
      es.removeEventListener("connected", onConnected);
      es.removeEventListener("done", onDone);
      es.close();
    };
  }, [jobId, API_URL]);

  const isAvailable = status === "ready";

  if (!match) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.statusBar}>{time}</div>

      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/")}>
          ←
        </button>
      </header>

      <section className={styles.card}>
        <span className={styles.league}>K리그 1</span>

        <div className={styles.round}>ROUND {match.round}</div>
        <div className={styles.stadium}>{match.stadium}</div>

        <div className={styles.match}>
          {/* 홈 팀 */}
          <div className={styles.team}>
            <img src={match.home.logoUrl} alt={match.home.name} />
            <span className={styles.teamName}>{match.home.name}</span>
            <span className={styles.homeAway}>홈</span>
            <span className={styles.teamScore}>{match.home.score}</span>
          </div>

          {/* 중앙 콜론 */}
          <div className={styles.divider}>:</div>

          {/* 원정 팀 */}
          <div className={styles.team}>
            <img src={match.away.logoUrl} alt={match.away.name} />
            <span className={styles.teamName}>{match.away.name}</span>
            <span className={styles.homeAway}>원정</span>
            <span className={styles.teamScore}>{match.away.score}</span>
          </div>
        </div>

        <p className={styles.selectText}>
          선택하신 옵션으로 해설을 생성하고 있습니다
          <img className={styles.loading} src="/loading.svg" alt="로딩" />
        </p>

        <div className={styles.options}>
          <button
            className={`${styles.button} ${style === "CASTER" ? styles.active : ""
              }`}
            aria-pressed={style === "CASTER"}
            disabled
          >
            캐스터
          </button>
          <button
            className={`${styles.button} ${style === "ANALYST" ? styles.active : ""
              }`}
            aria-pressed={style === "ANALYST"}
            disabled
          >
            분석가
          </button>
          <button
            className={`${styles.button} ${style === "FRIEND" ? styles.active : ""
              }`}
            aria-pressed={style === "FRIEND"}
            disabled
          >
            친구
          </button>
        </div>

        {error && (
          <p className={styles.errorText}>
            요청 실패: {String(error.message || error)}
          </p>
        )}

        {audioUrl && (
          <button className={styles.playBtn} onClick={togglePlay}>
            {isPlaying ? "일시정지" : "재생하기"}
          </button>
        )}
      </section>

      <button
        className={styles.footer}
        disabled={!isAvailable}
        onClick={() => {
          if (!isAvailable) return;

          // ✅ 다음 페이지(/commentary)에서 payload 전체를 써야 함
          navigate("/commentary", {
            state: {
              match,
              payload: finalPayload, // { gameId, jobId, clientId, mp3Url, script, coords }
              fillerAudioUrl: audioUrl,
              jobId, // 필요하면 같이
            },
          });
        }}
      >
        <span>{isAvailable ? "해설 준비 완료" : "해설 준비 중"}</span>
        <span className={styles.dot} />
      </button>
    </div>
  );
}
