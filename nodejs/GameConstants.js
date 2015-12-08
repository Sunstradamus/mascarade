exports.GameServerState = Object.freeze({
  WAITING_FOR_USERS: 0,
  STARTED_FORCE_SWAP: 1,
  STARTED_NORMAL: 2,
  STARTED_CLAIM_CHARACTER: 3,
  STARTED_CONTEST_CLAIM: 4,
  STARTED_PROCESS_CLAIM: 5,
  STARTED_PROCESS_STAGE_2: 6,
  STARTED_PROCESS_STAGE_3: 7,
});

exports.GameCard = Object.freeze({
  JUDGE: 0,
  BISHOP: 1,
  KING: 2,
  FOOL: 3,
  QUEEN: 4,
  THIEF: 5,
  WITCH: 6,
  SPY: 7,
  PEASANT: 8,
  CHEAT: 9,
  INQUISITOR: 10,
  WIDOW: 11,
});

exports.GameAction = Object.freeze({
  SWAP_CARD: 0,
  VIEW_OWN_CARD: 1,
  CLAIM_CHARACTER: 2,
});