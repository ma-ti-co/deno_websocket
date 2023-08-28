import { WebSocketClient, WebSocketServer } from "https://deno.land/x/websocket@v0.1.4/mod.ts";

const connectedClients = new Map();

const wss = new WebSocketServer(8080);
wss.on("connection", function (ws: WebSocketClient) {
  //broadcast_usernames();
  ws.on("message", function (message: string) {
    console.log(message);
    ws.send(message);
  });
});

wss.on('close', function (ws: WebSocketClient) {
  console.log("user left");
})

// // send a message to all connected clients
// function broadcast(message) {
//   for (const client of connectedClients.values()) {
//     client.send(message);
//   }
// }

// // send updated users list to all connected clients
// function broadcast_usernames() {
//   const user_ids = [...connectedClients.keys()];
//   console.log(
//     "Sending updated username list to all clients: " +
//       JSON.stringify(user_ids),
//   );
//   broadcast(
//     JSON.stringify({
//       event: "update-users",
//       user_ids: user_ids,
//     }),
//   );
// }

