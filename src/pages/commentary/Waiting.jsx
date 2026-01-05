import styles from "./Waiting.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Waiting() {
  const time = useDataStore((s) => s.time);
  const nav = useNavigate();

  useEffect(() => {
    const es = new EventSource("http://localhost:3000/sse");

    es.onmessage = (e) => {
      console.log(e.data);
    };

    return () => es.close();
  });

  return (
    <div className={styles.wrapper}>
      {/* 상단 상태 */}
      <div className={styles.statusBar}>{time}</div>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => nav("/")}>
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
          <button>캐스터</button>
          <button>분석가</button>
          <button>친구</button>
        </div>
      </section>

      {/* 하단 상태바 */}
      <button className={styles.footer}>
        <span>해설을 준비하고 있어요</span>
        <span className={styles.dot} />
      </button>
    </div>
  );
}
