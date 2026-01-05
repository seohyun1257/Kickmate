import styles from "./Signin.module.scss";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../../stores/DataStore";

export default function Signin() {
  const navigate = useNavigate();
  const time = useDataStore((s) => s.time);

  return (
    <div className={styles.back}>
      <div className={styles.statusBar}>{time}</div>
      <div className={styles.container}>
        {/* 로고 */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>⚽ K LEAGUE</div>
          <div className={styles.subtitle}>회원가입이 완료되었습니다 !</div>
        </div>
        <button
          className={styles.loginButton}
          onClick={() => navigate("/login")}
        >
          로그인하러 가기
        </button>
      </div>
    </div>
  );
}
