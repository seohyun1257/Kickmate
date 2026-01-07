import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Login.module.scss";
import { useDataStore } from "../../../stores/DataStore";

export default function Login() {
  const navigate = useNavigate();
  const time = useDataStore((s) => s.time);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    console.log("로그인:", { email, password, rememberMe });
  };

  return (
    <div className={styles.back}>
      <div className={styles.statusBar}>{time}</div>
      <button className={styles.back1} onClick={() => navigate("/")}>
        ←
      </button>
      <div className={styles.container}>
        {/* 로고 */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>⚽ K LEAGUE</div>
        </div>

        {/* 이메일 입력 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>아이디</label>
          <input
            type="email"
            className={styles.input}
            placeholder="아이디를 입력해주세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>비밀번호</label>
          <input
            type="password"
            className={styles.input}
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* 경고 메시지 */}
        <div className={styles.warningBox}>
          <span className={styles.warningText}>
            ⚠️ 아이디 또는 비밀번호가 잘못되었습니다.
          </span>
          {/* <div>아이디 또는 비밀번호 찾기</div> */}
        </div>

        {/* 로그인 버튼 */}
        <button className={styles.loginButton} onClick={() => navigate("/")}>
          로그인
        </button>

        {/* 체크박스 & 링크 */}
        <div className={styles.bottomSection}>
          <Link to="/signup" className={styles.link}>
            회원가입
          </Link>
        </div>

        {/* SNS 로그인 */}
        <div className={styles.snsSection}>
          <p className={styles.snsText}>SNS계정으로 간편로그인</p>
          <button className={styles.kakaoButton}>💬</button>
        </div>
      </div>
    </div>
  );
}
