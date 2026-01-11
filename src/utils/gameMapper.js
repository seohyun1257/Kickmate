function formatGameDate(isoString) {
  const date = new Date(isoString);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[date.getDay()];

  return `${month}월 ${day}일 (${weekday}) ${hours}:${minutes}`;
}

export function mapGameToMatch(game) {
  const homeShort = (game.homeTeamNameKoShort ?? "").trim();
  const awayShort = (game.awayTeamNameKoShort ?? "").trim();

  return {
    matchId: game.gameId,
    gameDate: formatGameDate(game.gameDate),
    stadium: game.venue,
    attendance: game.audienceNum,
    round: game.gameDay,
    weather: game.weather,
    temperature: game.temperature,
    referee: game.referee,
    assistantReferees: game.assistantReferees,
    fourthOfficial: game.fourthOfficial,
    varReferees: game.varReferees,
    tsg: game.tsg,

    home: {
      name: game.homeTeamNameKo,
      teamNameKoShort: homeShort,
      score: game.homeScore,
      logoUrl: `/logo/${homeShort}.png`,
      rank: game.homeRank,
    },

    away: {
      name: game.awayTeamNameKo,
      teamNameKoShort: awayShort,
      score: game.awayScore,
      logoUrl: `/logo/${awayShort}.png`,
      rank: game.awayRank,
    },
  };
}
