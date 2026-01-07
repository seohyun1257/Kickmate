import styles from "./Waiting.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import getClientId from "../../utils/clientId";
import { useQuery } from "@tanstack/react-query";

export default function Waiting() {
  const navigate = useNavigate();
  const time = useDataStore((s) => s.time);
  const style = useDataStore((s) => s.style);
  const setStyle = useDataStore((s) => s.setStyle);
  const clientId = getClientId();

  const { state } = useLocation();
  const match = state?.match;

  useEffect(() => {
    console.log(style);
  }, [style]);

  // ✅ 새로고침/직접 진입 방어: state 없으면 메인으로
  useEffect(() => {
    if (!match) navigate("/", { replace: true });
  }, [match, navigate]);

  if (!match) return null;

  function goLoading() {
    navigate("/request", {
      state: {
        match,
        payload: {
          gameId: match.matchId,
          style,
        },
      },
    });
  }

  // useEffect(() => {
  //   const es = new EventSource("http://localhost:3000/sse");

  //   es.onmessage = (e) => {
  //     console.log(e.data);
  //   };

  //   return () => es.close();
  // }, []);

  return (
    <div className={styles.wrapper}>
      {/* 상단 상태 */}
      <div className={styles.statusBar}>{time}</div>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/")}>
          ←
        </button>
      </header>

      {/* 메인 카드 */}
      <section className={styles.card}>
        {/* 리그 */}
        <span className={styles.league}>K리그 1</span>

        {/* 라운드 */}
        <div className={styles.round}>ROUND {match.round}</div>

        {/* 경기장 */}
        <div className={styles.stadium}>{match.stadium}</div>

        {/* 팀 정보 */}
        <div className={styles.match}>
          {/* 홈 팀 */}
          <div className={styles.team}>
            <img src={match.home.logoUrl} alt={match.home.name} />
            <span className={styles.teamName}>{match.home.name}</span>
            <span className={styles.homeAway}>홈</span>
          </div>

          {/* 원정 팀 */}
          <div className={styles.team}>
            <img src={match.away.logoUrl} alt={match.away.name} />
            <span className={styles.teamName}>{match.away.name}</span>
            <span className={styles.homeAway}>원정</span>
          </div>
        </div>

        {/* 스코어 */}
        <div className={styles.score}>
          <span>{match.home.score}</span>
          <span className={styles.colon}>:</span>
          <span>{match.away.score}</span>
        </div>

        {/* 해설 선택 */}
        <p className={styles.selectText}>
          듣고 싶은 해설의 말투를 설정해주세요
        </p>

        <div className={styles.options}>
          <button
            className={`${styles.button} ${
              style === "CASTER" ? styles.active : ""
            }`}
            onClick={() => {
              setStyle("CASTER");
            }}
            aria-pressed={style === "CASTER"}
          >
            캐스터
          </button>
          <button
            className={`${styles.button} ${
              style === "ANALYST" ? styles.active : ""
            }`}
            onClick={() => {
              setStyle("ANALYST");
            }}
            aria-pressed={style === "ANALYST"}
          >
            분석가
          </button>
          <button
            className={`${styles.button} ${
              style === "FRIEND" ? styles.active : ""
            }`}
            onClick={() => {
              setStyle("FRIEND");
            }}
            aria-pressed={style === "FRIEND"}
          >
            친구
          </button>
        </div>
      </section>

      {/* 하단 상태바 */}
      <button className={styles.footer} onClick={goLoading}>
        <span>해설 준비 요청하기</span>
      </button>
    </div>
  );
}
