import { Deno } from 'https://deno.land/std/node/module.ts';
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { config } from "https://deno.land/x/dotenv/mod.ts";



const env = config()
const connectedClients = new Map();


const app = new Application();
const port = 8000;
const router = new Router();
const supabase = createClient(env['SUPABASE_URL'], env['SUPABASE_KEY'])


const fetchCurrentGame = async (game_id:string) => {
  const {data, error} = await supabase
    .from('games')
    .select('id, player_1, player_2')
    .eq('id', game_id)
  if(error) return error;
  return data;
}




// send a message to all connected clients
function broadcast(message) {
  for (const client of connectedClients.values()) {
    client.send(message);
  }
}

// send updated users list to all connected clients
function broadcast_usernames() {
  const user_ids = [...connectedClients.keys()];
  console.log(
    "Sending updated username list to all clients: " +
      JSON.stringify(user_ids),
  );
  broadcast(
    JSON.stringify({
      event: "update-users",
      user_ids: user_ids,
    }),
  );
}

function subscribeToChannel(){
  const channel = supabase
  .channel('any')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'games'}, (payload:any) => {
    console.log("update", payload)
  })
  .subscribe()
}


router.get("/", async (ctx) => {
  const socket = await ctx.upgrade();
  const user_id = ctx.request.url.searchParams.get('id');
  const game_id = ctx.request.url.searchParams.get('game');
  // get game based on game_id
  const gameData = await fetchCurrentGame(game_id);
  subscribeToChannel();
  socket.user_id = user_id;
  connectedClients.set(user_id, socket);
  broadcast_usernames();
  await Deno.writeTextFile("./hello.txt", `${socket.user_id ? socket.user_id:'someone' } connected.`, {
    append: true,
  });



  // // broadcast the active users list when a new user logs in
  // socket.onopen = () => {
  //   console.log("new user");
  //   broadcast_usernames();
  // };

  // when a client disconnects, remove them from the connected clients list
  // and broadcast the active users list
  socket.onclose = () => {
    console.log(`Client ${socket.user_id} disconnected`);
    connectedClients.delete(socket.user_id);
    broadcast_usernames();
  };

  // broadcast new message if someone sent one
  // socket.onmessage = (m:any) => {
  //   const data = JSON.parse(m.data);
  //   broadcast(
  //     JSON.stringify({
  //       event: "send-message",
  //       message: data,
  //     }),
  //   );
  //   // const data = JSON.parse(m.data);
  //   // switch (data.event) {
  //   //   case "send-message":
  //   //     broadcast(
  //   //       JSON.stringify({
  //   //         event: "send-message",
  //   //         username: socket.username,
  //   //         message: data.message,
  //   //       }),
  //   //     );
  //   //     break;
  //   // }
  // };
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await context.send({
    root: `${Deno.cwd()}/`,
    index: "public/index.html",
  });
});


console.log("Listening at http://localhost:" + port);
await app.listen({ port });
