import styles from "./MatchCenter.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function MatchCenter() {
  const time = useDataStore((s) => s.time);
  const nav = useNavigate();
  return (
    <>
      <div className={styles.statusBar}>{time}</div>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => nav("/")}>
          ←
        </button>
        <div>매치센터</div>
      </header>
      <div className={styles.background}>
        <div className={styles.pattern} />
        <div className={styles.content}>
          <section className={styles.filters}>
            <div className={styles.filter}>
              <span className={styles.label}>시즌</span>
              <span className={styles.value}>2024</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.filter}>
              <span className={styles.label}>리그</span>
              <span className={styles.value}>K리그1</span>
            </div>
          </section>

          <section className={styles.filters}>
            <div className={`${styles.filter} ${styles.dropdown}`}>
              <span className={styles.label}>라운드</span>
              <span className={styles.value}>1 ⌄</span>
            </div>
            <div className={styles.divider} />
            <div className={`${styles.filter} ${styles.dropdown}`}>
              <span className={styles.label}>경기</span>
              <span className={styles.value}>수원FC vs 부천 ⌄</span>
            </div>
          </section>

          <section className={styles.card}>
            {/* 경기 메타 정보 */}
            <div className={styles.meta}>
              <span>관중수 4,180</span>
              <span>·</span>
              <span>경기장: 문수월드컵경기장</span>
              <span>·</span>
              <span>날씨: 맑음 · 온도: 5.2°C</span>
            </div>

            {/* 팀 & 스코어 */}
            <div className={styles.scoreRow}>
              <div className={styles.team}>
                <img src="/suwon.png" alt="수원FC" />
                <span className={styles.teamName}> 최치웅 82’ · 박병 100’</span>
              </div>

              <div className={styles.scoreBox}>
                <div className={styles.date}>2025/03/01 5:00</div>
                <div className={styles.score}>
                  <span>2</span>
                  <span className={styles.colon}>-</span>
                  <span>3</span>
                </div>
                <div className={styles.status}>경기종료</div>
              </div>

              <div className={styles.team}>
                <img src="/bucheon.png" alt="부천FC" />
                <span className={styles.teamName}>
                  바사니 14’ · 김규민 23’ · 갈레고 45’
                </span>
              </div>
            </div>

            {/* 득점 정보 */}
            <div className={styles.goalInfo}>
              <div>주심: 설태환 부심: 김지욱,김태형 대기심: 박진호</div>
              <div>VAR: 김대용, 이슬기 TSG: 이승준</div>
            </div>

            {/* AI 해설 버튼 */}
            <button className={styles.aiBtn}>AI 해설 듣기 🎧</button>
          </section>
        </div>
      </div>

      <section className={styles.video}>
        <h2>경기영상</h2>
        <div className={styles.empty}>
          <span>⚠</span>
          <p>현재 존재하는 경기영상이 없습니다</p>
        </div>
      </section>
    </>
  );
}
