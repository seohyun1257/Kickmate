import { useEffect, useRef } from "react";

export default function SoccerFieldCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const W = canvas.width;
    const H = canvas.height;

    // 배경
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    // 외곽선
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // 중앙선
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();

    // 센터 서클
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // 왼쪽 페널티 박스
    ctx.strokeRect(20, H / 2 - 80, 80, 160);

    // 오른쪽 페널티 박스
    ctx.strokeRect(W - 100, H / 2 - 80, 80, 160);

    // 공 위치
    const ballX = 150;
    const ballY = H / 2;

    ctx.fillStyle = "#d6ff00";
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();

    // 화살표
    ctx.strokeStyle = "#aaff00";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(ballX, ballY);
    ctx.lineTo(ballX + 40, ballY - 30);
    ctx.stroke();

    // 화살촉
    ctx.beginPath();
    ctx.moveTo(ballX + 40, ballY - 30);
    ctx.lineTo(ballX + 30, ballY - 28);
    ctx.lineTo(ballX + 34, ballY - 18);
    ctx.closePath();
    ctx.fill();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={450}
      style={{ display: "block", margin: "0 auto" }}
    />
  );
}
