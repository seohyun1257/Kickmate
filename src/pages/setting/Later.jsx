import styles from "./Setting.module.scss";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../../stores/DataStore";

export default function Setting() {
  const time = useDataStore((s) => s.time);
  const navigate = useNavigate();
  return (
    <div>
      {/* Header */}
      <div className={styles.statusBar}>{time}</div>
      <header className={styles.header}>
        <div className={styles.logo}>K LEAGUE</div>
      </header>

      <div className={styles.container}>
        <div className={styles.title}> 로그인이 필요합니다 </div>
        <div className={styles.subtitle}> 로그인하고 설정을 저장하세요!</div>
        <button
          className={styles.loginButton}
          onClick={() => navigate("/login")}
        >
          {" "}
          로그인하기{" "}
        </button>
      </div>
      <div className={styles.bottomNav}>
        <button className={styles.item} onClick={() => navigate("/")}>
          <span className={styles.icon}>🗓️</span>
          <span className={styles.label}>일정 / 결과</span>
        </button>

        <button className={styles.item}>
          <span className={styles.icon}>⋯</span>
          <span className={styles.label1}>더보기</span>
        </button>
      </div>
    </div>
  );
}
