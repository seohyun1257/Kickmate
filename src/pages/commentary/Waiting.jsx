import styles from "./Waiting.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { post } from "../../utils/post";
import getClientId from "../../utils/clientId";

export default function Waiting() {
  const navigate = useNavigate();
  const time = useDataStore((s) => s.time);
  const style = useDataStore((s) => s.style);
  const setStyle = useDataStore((s) => s.setStyle);
  const clientId = getClientId();

  const commentaryReq = async () => {
    try {
      await post("/api/v1/commentary", {
        gameId: 123456789,
        actionId: 101,
        clientId: clientId,
        style: style,
      });

      navigate("/request");
    } catch (e) {
      alert(e.message);
      navigate("/request");
    }
  };

  // useEffect(() => {
  //   const es = new EventSource("http://localhost:3000/sse");

  //   es.onmessage = (e) => {
  //     console.log(e.data);
  //   };

  //   return () => es.close();
  // }, []);

  useEffect(() => {
    console.log(style);
  }, [style]);

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
        <span className={styles.league}>K리그 1</span>

        <div className={styles.round}>ROUND 32</div>
        <div className={styles.stadium}>수원종합운동장</div>

        {/* 팀 정보 */}
        <div className={styles.match}>
          <div className={styles.team}>
            <img src="/teams/suwon.png" alt="수원FC" />
            <span className={styles.teamName}>수원FC</span>
            <span className={styles.homeAway}>홈</span>
          </div>

          <div className={styles.team}>
            <img src="/teams/bucheon.png" alt="부천" />
            <span className={styles.teamName}>부천</span>
            <span className={styles.homeAway}>원정</span>
          </div>
        </div>

        <div className={styles.score}>
          <span>2</span>
          <span className={styles.colon}>:</span>
          <span>3</span>
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
      <button className={styles.footer} onClick={() => commentaryReq()}>
        <span>해설 준비 요청하기</span>
      </button>
    </div>
  );
}
