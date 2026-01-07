import styles from "./MatchCenter.module.scss";
import { useDataStore } from "../../../stores/DataStore";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function MatchCenter() {
  const time = useDataStore((s) => s.time);
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const { state } = useLocation();
  const match = state?.match;

  // ✅ 새로고침/직접 진입 방어: state 없으면 메인으로
  useEffect(() => {
    if (!match) nav("/", { replace: true });
  }, [match, nav]);

  if (!match) return null;

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
          {/* 상단 필터(데이터 반영 가능한 것만 반영) */}
          <section className={styles.filters}>
            <div className={styles.filter1}>
              <span className={styles.label}>시즌</span>
              <span className={styles.value}>2024</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.filter1}>
              <span className={styles.label}>리그</span>
              <span className={styles.value}>K리그 1</span>
            </div>
          </section>

          <section className={styles.filters}>
            <div className={`${styles.filter2} ${styles.dropdown}`}>
              <span className={styles.label}>라운드</span>
              <span className={styles.value2}>{match.round ?? "-"}</span>
            </div>
            <div className={styles.divider} />
            <div className={`${styles.filter3} ${styles.dropdown}`}>
              <span className={styles.label1}>경기</span>
              <span className={styles.value1}>
                {match.home?.name} vs {match.away?.name}
              </span>
            </div>
          </section>

          <section className={styles.card}>
            {/* ✅ 경기 메타 정보 */}
            <div className={styles.meta}>
              <span className={styles.metaText1}>
                관중수 {match.attendance ?? "-"}명 · 경기장:{" "}
                {match.stadium ?? "-"}
              </span>
              <span className={styles.metaText}>
                날씨: {match.weather ?? "-"} · 온도: {match.temperature ?? "-"}
                °C
              </span>
            </div>

            {/* ✅ 팀 & 스코어 */}
            <div className={styles.scoreRow}>
              <div className={styles.team}>
                <img src={match.home?.logoUrl} alt="팀로고" />
                <span className={styles.teamName}>{match.home?.name}</span>
              </div>

              <div className={styles.scoreBox}>
                <div className={styles.date}>{match.gameDate ?? "-"}</div>

                <div className={styles.score}>
                  <span>{match.home?.score ?? "-"}</span>
                  <span className={styles.colon}>-</span>
                  <span>{match.away?.score ?? "-"}</span>
                </div>

                <div className={styles.status}>경기중</div>
              </div>

              <div className={styles.team}>
                <img src={match.away?.logoUrl} alt="팀로고" />
                <span className={styles.teamName}>{match.away?.name}</span>
              </div>
            </div>

            {/* ✅ 심판/VAR/TSG (mapper 필드 반영) */}
            <div className={styles.goalInfo}>
              <div className={styles.goalInfo1}>
                <div>주심: {match.referee ?? "-"}</div>
                <div>부심: {match.assistantReferees ?? "-"}</div>
                <div>대기심: {match.fourthOfficial ?? "-"}</div>
              </div>
              <div className={styles.goalInfo2}>
                <div>VAR: {match.varReferees ?? "-"}</div>
                <div>TSG: {match.tsg ?? "-"}</div>
              </div>
            </div>

            <div className={styles.matchHeader}>
              <span className={styles.teamText}>{match.home?.name}</span>
              <span className={styles.teamText}>{match.away?.name}</span>
            </div>

            {/* ✅ AI 해설 버튼: match도 같이 넘기기(Waiting에서 쓰면) */}
            <button
              className={styles.aiBox}
              onClick={() => nav("/waiting", { state: { match } })}
            >
              AI 해설 듣기 🎧
            </button>
          </section>
        </div>

        <section className={styles.video}>
          <section className={styles.wrapper}>
            {/* Header */}
            <button
              className={styles.header1}
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
            >
              <div className={styles.headerLeft}>
                <span className={styles.dot} />
                <span className={styles.headerText}>AI 해설 듣기란?</span>
              </div>

              <span className={`${styles.arrow} ${open ? styles.open : ""}`}>
                ▾
              </span>
            </button>

            {/* Content */}
            <div
              className={`${styles.contentWrapper} ${
                open ? styles.show : styles.hide
              }`}
            >
              <div className={styles.content1}>
                <p className={styles.quote}>
                  "지금 공이 어디 있지?" 답답했던 순간은 이제 안녕!
                  <br />
                  K-리그의 모든 움직임을 AI가 실시간으로 읽어드립니다.
                </p>

                <p className={styles.highlight}>
                  눈으로 보는 것보다 더 선명하게,
                </p>

                <p className={styles.description}>
                  데이터가 그려내는 ‘보이는 오디오’를 경험해 보세요.
                </p>

                <p className={styles.footer}>
                  모두가 즐길 수 있는{" "}
                  <img
                    className={styles.footer1}
                    src="/kleaguelogo.svg"
                    alt="kleague로고"
                  />{" "}
                </p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </>
  );
}
