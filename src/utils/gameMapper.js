export function mapGameToMatch(game) {
  const homeShort = (game.homeTeamNameKoShort ?? "").trim();
  const awayShort = (game.awayTeamNameKoShort ?? "").trim();

  return {
    matchId: game.gameId,
    gameDate: game.gameDate,
    stadium: game.venue,
    attendance: game.audienceNum,

    home: {
      name: game.homeTeamNameKo,
      score: game.homeScore,
      logoUrl: `/logo/${homeShort}.png`,
      rank: game.homeRank,
    },

    away: {
      name: game.awayTeamNameKo,
      score: game.awayScore,
      logoUrl: `/logo/${awayShort}.png`,
      rank: game.awayRank,
    },
  };
}
