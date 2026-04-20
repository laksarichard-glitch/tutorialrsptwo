export function logStart(method) {
  console.log(`start : ${method}`);
}

export function logEnd(method) {
  console.log(`end   : ${method}`);
}

/**
 * Returns the list of players sorted by their turn order.
 */
export function getSortedPlayers(gamedatas) {
  let sortedplayers = [];
  Object.values(gamedatas.playerorder).forEach((playerId) => {
    sortedplayers.push(getPlayer(gamedatas, playerId));
  });
  return sortedplayers;
}
/**
 * Get a player object for a specific player id.
 */
export function getPlayer(gamedatas, playerId) {
  return Object.values(gamedatas.players).filter(
    (player) => player.id == playerId,
  )[0];
}

//    this.handStock.addCards(this.sortCards(Object.values(this.gamedatas.hand)));

export function sortCards(cards) {
  return Array.from(cards).sort(function (a, b) {
    // sort by suit then rank
    // sort by suit then rank
    if (a.type === b.type) {
      // sub sort by rank
      return parseInt(a.type_arg) - parseInt(b.type_arg);
    } else {
      // sort by suit
      return parseInt(a.type) - parseInt(b.type);
    }
  });
}
