import { useState } from "react";

export default function MonthFilter() {
  const [month, setMonth] = useState("");

  return (
    <div>
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      >
        <option value="">월 선택</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {m}월
          </option>
        ))}
      </select>

      {month && <p>선택된 월: {month}월</p>}
    </div>
  );
}
