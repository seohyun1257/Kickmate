import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Signup.module.scss";
import { useDataStore } from "../../../stores/DataStore";

export default function Signup() {
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
      <button className={styles.back1} onClick={() => navigate("/login")}>
        ←
      </button>
      <div className={styles.container}>
        {/* 로고 */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>⚽ K LEAGUE</div>
          <div className={styles.subtitle}> 회원가입 </div>
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
            ⚠️ 8자 이상으로 작성해주세요
          </span>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>비밀번호 확인</label>
          <input
            type="password"
            className={styles.input}
            placeholder="비밀번호를 재입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className={styles.warningBox}>
          <span className={styles.warningText}>
            ⚠️ 비밀번호가 일치하지 않습니다
          </span>
        </div>

        {/* 회원가입 버튼 */}
        <button
          className={styles.loginButton}
          onClick={() => navigate("/signin")}
        >
          회원가입하기
        </button>
      </div>
    </div>
  );
}
