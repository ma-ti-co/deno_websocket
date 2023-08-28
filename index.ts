import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

const connectedClients = new Map();

const wss = new WebSocketServer(8080);
wss.on("connection", function (ws: WebSocketClient) {
  //broadcast_usernames();

  ws.on("message", function (message: string) {
    let payload = JSON.parse(message);
    let user_id = payload.message.user_id;
    let game_id = payload.message.game_id;
    if(payload.event==="open"){
      if(!connectedClients.get(game_id)){
        console.log("creating new channel")
        console.log(`${user_id} added to ${game_id}`)
        let sockets = [ws];
        connectedClients.set(game_id, sockets);
      }else{
        console.log("adding socket to existing channel")
        console.log(`${user_id} added to ${game_id}`)
        let sockets = connectedClients.get(game_id)
        sockets.push(ws);
        connectedClients.set(game_id, sockets);
      }
      let group = connectedClients.get(game_id);
      group.forEach((ws) => {
        ws.send(JSON.stringify({event:"new_user", user_id:user_id}));
      })
    }else if(payload.event==="update"){
      let group = connectedClients.get(game_id);
      group.forEach((ws) => {
        ws.send(JSON.stringify({event:"update_user", user_id:user_id}));
      })
    }else if(payload.event==="close"){
      let group = connectedClients.get(game_id);
      let wsToRemove = group.indexOf(ws);
      console.log("user left, will update now");
      group.forEach((ws) => {
        ws.send(JSON.stringify({event:"user_left", user_id:user_id}));
      })
      if (wsToRemove !== -1) {
        group.splice(wsToRemove, 1);
        wsToRemove.close();
      }
    }


    //broadcast_usernames(group)
  });

  ws.on("close", function () { 
    //  when a websocket is closed, how can i
    // find it in the existing array 
  })
});








