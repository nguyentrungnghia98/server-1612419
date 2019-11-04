const socketIo = require("socket.io");

var players = {},
  unmatched = [];

function joinGame(socket, user) {
  const playerEmail = user.email;
  const player = players[playerEmail]
  if(player){
    player.socket = socket;
    // if player has opponent -> continute, else finc match
    if(player.opponent){
      player.isContinute = true;
      return
    } 
  }else{
    // Add the player to our object of players
    players[playerEmail] = {
      // This will be an email
      opponent: "",

      caro: {
        history: []
      },

      // The symbol will become 'O' if the player is unmatched
      symbol: "X",

      // The socket that is associated with this player
      socket: socket,

      user,

      isContinute: false
    };
  }
    // Every other player is marked as 'unmatched', which means
    // there is no another player to pair them with yet. As soon
    // as the next socket joins, the unmatched player is paired with
    // the new socket and the unmatched variable is set back to null
    console.log("unmatched before", unmatched, 'players', Object.keys(players));
    if (unmatched.length) {
      const index = unmatched.findIndex(el => el !== playerEmail);
      if(index > -1){
        players[playerEmail].symbol = "O";
        const lastUnmatched = unmatched[index];
        unmatched.splice(index,1);
        players[lastUnmatched].opponent = playerEmail;
        players[playerEmail].opponent = lastUnmatched;
      }
    } else {
      unmatched.push(playerEmail);
    }
    console.log("unmatched after", unmatched);
}

// Returns the opponent socket
function getOpponent(email) {
  if (!players[email] || !players[email].opponent) {
    return;
  }
  return players[players[email].opponent].socket;
}

function genarateRoom(email1, email2){
  const tmp = [email1, email2];
  return tmp.sort().join("")
}
module.exports = function(server) {
  const io = socketIo(server).listen(server);

  io.on("connection", function(socket) {
    const socketId = socket.id;
    let playerEmail;
    let opponentEmail;
    let room;
    console.log("Connection established...", socket.id);

    socket.on("game.init", user => {
      playerEmail = user.email;
      joinGame(socket, user);

      const tmp = {};
      for (let player in players) {
        tmp[player] = {
          opponent: players[player].opponent,
          symbol: players[player].symbol,
          user: players[player].user,
          lastTurn: players[player].lastTurn,
        };
      }

      const { caro } = players[playerEmail];
      opponentEmail = players[playerEmail].opponent;
      console.log('opponentEmail',opponentEmail)
      if(opponentEmail){
        room = genarateRoom(playerEmail, opponentEmail);
        socket.join(room);
        console.log('room',room);
        
        socket.emit("game.begin", {
          symbol: players[playerEmail].symbol,
          caro,
          players: tmp,
          room
        });
        // trigger opponent start game
        getOpponent(playerEmail).join(room);
        getOpponent(playerEmail).emit("game.begin", {
          symbol: players[opponentEmail].symbol,
          caro,
          players: tmp,
          room
        });
      }
    });

    socket.on("set.room", function(data) {
      room = data;
    });


    // On user win game, emit to both user to open modal

    socket.on("game.win", function(data) {
      console.log("game.win")
      if (!getOpponent(playerEmail)) {
        return;
      }
      opponentEmail = players[playerEmail].opponent;
      players[playerEmail].caro.status = 'win';
      
      players[opponentEmail].caro.status = 'win';
      players[opponentEmail].caro.winnerSquares = data.winnerSquares;
      players[opponentEmail].caro.winner = data.symbol;
      console.log("game.win: ", data);
      socket.emit("game.winner", data);
      getOpponent(playerEmail).emit("game.winner", data);
    });

    // Listens for a move to be made and emits an event to both
    // players after the move is completed
    socket.on("make.move", function(data) {
      if (!getOpponent(playerEmail)) {
        return;
      }
      const { history, position, symbol, moveStep, moveStepLocation } = data;
      const caro = {history, lastPosition: position, lastTurn: symbol, moveStep, moveStepLocation};
      opponentEmail = players[playerEmail].opponent;
      players[playerEmail].caro = caro;
      players[opponentEmail].caro = caro;

      console.log("Move made");

      io.to(room).emit("move.made", data);
    });
    //request undo
    socket.on("request.undo", function(step) {
      if (!getOpponent(playerEmail)) {
        return;
      }
      console.log("request.undo", step);
      getOpponent(playerEmail).emit("question.undo", step);
    });
    //process undo
    socket.on("accept.undo", function(step) {
      if (!getOpponent(playerEmail)) {
        return;
      }
      console.log("game.undo");
      io.to(room).emit("game.undo", step);
    });

    //request draw
    socket.on("request.draw", function() {
      if (!getOpponent(playerEmail)) {
        return;
      }
      console.log("request.draw");
      getOpponent(playerEmail).emit("question.draw");
    });
    //process draw
    socket.on("accept.draw", function() {
      if (!getOpponent(playerEmail)) {
        return;
      }
      players[playerEmail].caro.status = 'draw';
      players[opponentEmail].caro.status = 'draw';
      console.log("game.draw");
      io.to(room).emit("game.draw");
    });

    //request restart
    socket.on("request.restart", function() {
      if (!getOpponent(playerEmail)) {
        return;
      }
      console.log("request.restart");
      getOpponent(playerEmail).emit("question.restart");
    });
    //process restart
    socket.on("accept.restart", function() {
      if (!getOpponent(playerEmail)) {
        return;
      }
      console.log("game.restart");
      io.to(room).emit("game.restart");
    });

    // on deny request
    socket.on("deny", type => {
      if (!getOpponent(playerEmail)) {
        return;
      }
      console.log("deny");
      getOpponent(playerEmail).emit("denied", type);
    });

    // on receive message
    socket.on("message.send", function(data) {
      if (!getOpponent(playerEmail)) {
        return;
      }
      console.log("message.receive");
      io.to(room).emit("message.receive", data);
    });
    
    //quit game
    socket.on("game.end", function() {
      if(players[playerEmail].opponent) delete players[players[playerEmail].opponent];
      delete players[playerEmail]
    });

    socket.on("disconnect", function() {
      console.log("disconnect", socketId);
      if (getOpponent(playerEmail)) {
        console.log("getOpponent");
        getOpponent(playerEmail).emit("opponent.left");
        //delete players[getOpponent(socketId).id];
      }
      //delete players[socketId];
      if(playerEmail) unmatched = unmatched.filter(id => id !== playerEmail);
    });
  });
};
