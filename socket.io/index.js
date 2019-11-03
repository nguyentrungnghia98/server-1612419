const socketIo = require("socket.io");

var players = {},
  unmatched = [];

function joinGame(socket) {
  // Add the player to our object of players
  players[socket.id] = {
    // The opponent will either be the socket that is
    // currently unmatched, or it will be null if no
    // players are unmatched
    opponent: "",

    // The symbol will become 'O' if the player is unmatched
    symbol: "X",

    // The socket that is associated with this player
    socket: socket
  };

  // Every other player is marked as 'unmatched', which means
  // there is no another player to pair them with yet. As soon
  // as the next socket joins, the unmatched player is paired with
  // the new socket and the unmatched variable is set back to null
  console.log("unmatched", unmatched);
  if (unmatched.length) {
    players[socket.id].symbol = "O";
    const lastUnmatched = unmatched.shift();
    players[lastUnmatched].opponent = socket.id;
    players[socket.id].opponent = lastUnmatched;
  } else {
    unmatched.push(socket.id);
  }
}

// Returns the opponent socket
function getOpponent(socketId) {
  if (!players[socketId] || !players[socketId].opponent) {
    return;
  }
  return players[players[socketId].opponent].socket;
}

module.exports = function(server) {
  const io = socketIo(server).listen(server);

  io.on("connection", function(socket) {
    const socketId = socket.id;
    console.log("Connection established...", socket.id);
    joinGame(socket);

    const tmp = {};
    for (let player in players) {
      tmp[player] = {
        opponent: players[player].opponent,
        symbol: players[player].symbol
      };
    }
    // Once the socket has an opponent, we can begin the game
    if (getOpponent(socketId)) {
      socket.emit("game.begin", {
        symbol: players[socketId].symbol,
        players: tmp
      });
      getOpponent(socketId).emit("game.begin", {
        symbol: players[getOpponent(socketId).id].symbol,
        players: tmp
      });
    }

    // On user win game, emit to both user to open modal
    
    socket.on("game.win", function(data) {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("game.win: ", data);
      socket.emit("game.winner", data);
      getOpponent(socketId).emit("game.winner", data);
    });
    

    // Listens for a move to be made and emits an event to both
    // players after the move is completed
    socket.on("make.move", function(data) {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("Move made by : ", data);
      socket.emit("move.made", data);
      getOpponent(socketId).emit("move.made", data);
    });
    //request undo
    socket.on("request.undo", function(step) {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("request.undo", step);
      getOpponent(socketId).emit("question.undo", step);
    });
    //process undo
    socket.on("accept.undo", function(step) {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("game.undo");
      socket.emit("game.undo", step);
      getOpponent(socketId).emit("game.undo", step);
    });

    //request draw
    socket.on("request.draw", function() {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("request.draw");
      getOpponent(socketId).emit("question.draw");
    });
    //process draw
    socket.on("accept.draw", function() {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("game.draw");
      socket.emit("game.draw");
      getOpponent(socketId).emit("game.draw");
    });

    //request restart
    socket.on("request.restart", function() {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("request.restart");
      getOpponent(socketId).emit("question.restart");
    });
    //process restart
    socket.on("accept.restart", function() {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("game.restart");
      socket.emit("game.restart");
      getOpponent(socketId).emit("game.restart");
    });

    // on receive message
    socket.on("message.send", function(data) {
      if (!getOpponent(socketId)) {
        return;
      }
      console.log("message.receive");
      socket.emit("message.receive", data);
      getOpponent(socketId).emit("message.receive", data);
    });


    //quit game
    socket.on("disconnect", function() {
      console.log("disconnect", socketId);
      if (getOpponent(socketId)) {
        console.log("getOpponent");
        getOpponent(socketId).emit("opponent.left");
        delete players[getOpponent(socketId).id];
      }
      delete players[socketId];
      unmatched = unmatched.filter(id => id !== socketId);
    });
  });
};
