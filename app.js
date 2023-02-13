const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3009, () => {
      console.log("Server Running at http://localhost:3009/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    year: dbObject.year,
    playerMatchId: dbObject.player_match_id,
    matchId: dbObject.match_id,
    match: dbObject.match,

    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
//get all states
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
   *
    FROM
      player_details
    ORDER BY
      player_id;`;
  const responseArray = await db.all(getPlayerQuery);
  response.send(
    responseArray.map((eachItem) => convertDbObjectToResponseObject(eachItem))
  );
});
//get one player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      *
    FROM
player_details
    WHERE
      player_id = ${playerId};`;
  const resDetails = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(resDetails));
});
//put a player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET
     player_name='${playerName}'
     
 WHERE
      player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
//get specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      *
    FROM
match_details
    WHERE
      match_id = ${matchId};`;
  const respDetails = await db.get(getMatchQuery);
  response.send(convertDbObjectToResponseObject(respDetails));
});
//all matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerIdQuerys = `SELECT match,match_id,year 
  FROM player_match_score
   NATURAL JOIN match_details
where player_id=${playerId};`;
  const responseDetails = await db.all(getPlayerIdQuerys);

  response.send(
    responseDetails.map((eachItem) => convertDbObjectToResponseObject(eachItem))
  );
});
//players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchIdQuerys = `SELECT player_id,player_name 
  FROM player_match_score
   NATURAL JOIN player_details
where match_id=${matchId};`;
  const respDetails = await db.all(getMatchIdQuerys);

  response.send(
    respDetails.map((eachItem) => convertDbObjectToResponseObject(eachItem))
  );
});
//all score,fours,sixes of player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const respoDetails = await db.get(getPlayerScored);

  response.send(respoDetails);
});
module.exports = app;
