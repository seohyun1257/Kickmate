import styles from "./Home.module.scss";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../../stores/DataStore";
import { useEffect } from "react";

export default function MainHome() {
  const navigate = useNavigate();
  const setTimeFromDate = useDataStore((s) => s.setTimeFromDate);
  const time = useDataStore((s) => s.time);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeFromDate(new Date());
    }, 1000);

    return () => clearInterval(id);
  }, [setTimeFromDate]);

  return (
    <div>
      {/* Header */}
      <div className={styles.statusBar}>{time}</div>
      <header className={styles.header}>
        <div className={styles.logo}>K LEAGUE</div>
      </header>

      <div className={styles.container}>
        <div className={styles.filter}>
          <div className={styles.filterText}>월</div>
          <select className={styles.month}>
            <option>09</option>
            <option>10</option>
          </select>
          <span className={styles.line}>|</span>
          <div className={styles.filterText}>라운드</div>
          <select className={styles.round}>
            <option>29</option>
            <option>30</option>
            <option>31</option>
            <option>32</option>
            <option>33</option>
          </select>
        </div>

        {/* Match Card */}
        <div className={styles.card}>
          <div className={styles.meta}>
            승강 PO 12월 05일 (수) 19:00
            <br />
            수원 월드컵 경기장 [관중수 18,715]
          </div>

          <div className={styles.matchRow}>
            <div className={styles.team}>
              <img
                className={styles.emblem}
                src="public\logo\수원fc.png"
                alt="팀 로고"
              />
              <span>수원</span>
            </div>

            <div className={styles.score}> 0 - 1</div>

            <div className={styles.team}>
              <img
                className={styles.emblem}
                src="public\logo\제주.png"
                alt="팀 로고"
              />

              <span>제주</span>
            </div>
          </div>

          <div className={styles.statusLive}>경기중</div>

          <div className={styles.actions}>
            <button
              className={styles.grayBtn}
              onClick={() => navigate("/match-center")}
            >
              매치센터 ⚽
            </button>
            <button
              className={styles.yellowBtn}
              onClick={() => navigate("/waiting")}
            >
              AI 해설 듣기
            </button>
          </div>
        </div>
      </div>
      <div className={styles.bottomNav}>
        <button className={styles.item}>
          <span className={styles.icon}>🗓️</span>
          <span className={styles.label1}>일정 / 결과</span>
        </button>

        <button className={styles.item} onClick={() => navigate("/setting")}>
          <span className={styles.icon}>⋯</span>
          <span className={styles.label}>더보기</span>
        </button>
      </div>
    </div>
  );
}
