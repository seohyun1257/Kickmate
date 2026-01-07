import styles from "./Home.module.scss";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "../../../stores/DataStore";
import { useState, useEffect } from "react";
import { post } from "../../utils/post";
import { useQuery } from "@tanstack/react-query";
import { mapGameToMatch } from "../../utils/gameMapper";

export default function MainHome() {
  const navigate = useNavigate();
  const time = useDataStore((s) => s.time);

  const [month, setMonth] = useState("9");
  const [round, setRound] = useState("29");

  const payload = { month: Number(month), round: Number(round) };

  const {
    data: matches = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["games", payload.month, payload.round],
    queryFn: () => post("/api/v1/match", payload),
    select: (res) => res.result.map(mapGameToMatch),
  });

  useEffect(() => {
    console.log(month, round);
  }, [month, round]);

  if (isLoading) return <div className="loading">로딩중...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.statusBar}>{time}</div>

      <header className={styles.header}>
        <div className={styles.logo}>K LEAGUE</div>
      </header>

      {/* ✅ 스크롤 영역을 만들기 위한 main 래퍼 */}
      <main className={styles.main}>
        {/* ✅ container 중괄호 범위 확실하게 닫힘 */}
        <div className={styles.container}>
          <div className={styles.filter}>
            <div className={styles.filterText}>월</div>
            <select
              className={styles.month}
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="9">09</option>
              <option value="10">10</option>
            </select>

            <span className={styles.line}>|</span>

            <div className={styles.filterText}>라운드</div>
            <select
              className={styles.round}
              value={round}
              onChange={(e) => setRound(e.target.value)}
            >
              <option value="29">29</option>
              <option value="30">30</option>
              <option value="31">31</option>
              <option value="32">32</option>
              <option value="33">33</option>
            </select>
          </div>

          {matches.map((match) => (
            <div key={match.matchId} className={styles.card}>
              <div className={styles.meta}>
                <div className={styles.gameTitle}>
                  <span className={styles.kleague}>K리그1</span>

                  <span className={styles.first}>
                    {match.competition} {match.gameDate}
                  </span>
                </div>
                <span className={styles.first}>
                  {match.stadium} [관중수 {match.attendance}명]
                </span>
              </div>

              <div className={styles.matchRow}>
                <div className={styles.team}>
                  <img
                    className={styles.emblem}
                    src={match.home.logoUrl}
                    alt="팀 로고"
                  />
                  <span className={styles.teamName}>{match.home.name}</span>
                </div>

                <div className="scoreCon">
                  <div className={styles.score}>
                    {match.home.score} - {match.away.score}
                  </div>
                  <div className={styles.statusLive}>경기중</div>
                </div>
                <div className={styles.team}>
                  <img
                    className={styles.emblem}
                    src={match.away.logoUrl}
                    alt="팀 로고"
                  />
                  <span className={styles.teamName}>{match.away.name}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.grayBtn}
                  onClick={() =>
                    navigate("/match-center", { state: { match } })
                  }
                >
                  매치센터 ⚽
                </button>
                <button
                  className={styles.yellowBtn}
                  onClick={() => navigate("/waiting", { state: { match } })}
                >
                  AI 해설 듣기 🎧
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <nav className={styles.bottomNav}>
        <button className={styles.item}>
          <span className={styles.icon}>🗓️</span>
          <span className={styles.label1}>일정 / 결과</span>
        </button>

        <button className={styles.item} onClick={() => navigate("/setting")}>
          <span className={styles.icon}>⋯</span>
          <span className={styles.label}>더보기</span>
        </button>
      </nav>
    </div>
  );
}
