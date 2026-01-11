import styles from "./CloseTime.module.scss";

export default function CloseTime({
  open,
  onClose,
  title = "현재는 운영시간이 아닙니다",
  timeLine = "19:00 ~ 01:00 동안 운영됩니다",
  desc = "그 외 시간에는 시연영상을 시청해주시면\n감사드리겠습니다",
  buttonText = "닫기",
}) {
  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.body}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.time}>{timeLine}</p>
          <p className={styles.desc}>
            {desc.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </p>
        </div>

        <button className={styles.btn} onClick={onClose} type="button">
          {buttonText}
        </button>
      </div>
    </div>
  );
}
