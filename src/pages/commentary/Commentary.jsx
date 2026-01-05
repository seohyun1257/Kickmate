import styles from "./Commentary.module.scss";
import { useDataStore } from "../../../stores/DataStore";

export default function Commentary() {
  const time = useDataStore((s) => s.time);
  return (
    <div className={styles.app}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.score}>
          <span className={styles.home}>울산</span> 1 : 0{" "}
          <span className={styles.away}>전북</span>
        </div>
        <div className={styles.time}>후반 72:30</div>
      </div>

      {/* Pitch */}
      <div className={styles.pitch}>
        <div className={styles.centerLine}></div>
        <div className={styles.centerCircle}></div>
        <div className={`${styles.player} ${styles.red}`}></div>
        <div className={`${styles.player} ${styles.blue}`}></div>
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        <div className={`${styles.card} ${styles.goal}`}>
          <div className={styles.badge}>⚽ 골!</div>
          <span className={styles.minute}>3분전</span>
          <div className={styles.desc}>페널티 박스 오른쪽에서 강력한 슈팅!</div>
          <div className={styles.playerName}>주민규 (울산)</div>
        </div>

        <div className={styles.card}>
          <span className={styles.minute}>4분전</span>
          <div className={styles.desc}>페널티 박스 오른쪽에서 강력한 슈팅!</div>
          <div className={styles.playerName}>주민규 (울산)</div>
        </div>

        <div className={styles.card}>
          <div className={`${styles.badge} ${styles.blue}`}>⚽ 골!</div>
          <span className={styles.minute}>3분전</span>
          <div className={styles.desc}>페널티 박스 오른쪽에서 강력한 슈팅!</div>
          <div className={`${styles.playerName} ${styles.blue}`}>
            주민규 (전북)
          </div>
        </div>

        <div className={styles.card}>
          <span className={styles.minute}>2분전</span>
          <div className={styles.desc}>위험한 공격 기회</div>
          <div className={styles.playerName}>박준호 (울산)</div>
        </div>

        <div className={styles.card}>
          <span className={styles.minute}>1분전</span>
          <div className={styles.desc}>코너킥 찬스</div>
          <div className={`${styles.playerName} ${styles.blue}`}>
            이청용 (전북)
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.btn}>⚙️</button>
        <button className={styles.btn}>⏮</button>
        <button className={`${styles.btn} ${styles.play}`}>▶</button>
        <button className={styles.btn}>⏭</button>
        <button className={`${styles.btn} ${styles.magic}`}>✨</button>
      </div>
    </div>
  );
}
