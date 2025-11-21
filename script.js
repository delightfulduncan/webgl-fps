// Load Supabase via CDN
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/supabase.min.js";
script.onload = init;
document.head.appendChild(script);

let user = null;
let playingThisRound = false;
let currentState = null;
let timerHandle = null;

function init() {
  const SUPABASE_URL = "https://cdjgwdqvcbptdohjczww.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkamd3ZHF2Y2JwdGRvaGpjend3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Mzk2OTEsImV4cCI6MjA3ODUxNTY5MX0.SUIVOLFjXLDR8pAtQJUrpLKWWTKVkYs9Qw7xEl5EreM";

  const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

  // LOGIN
  document.getElementById("enter").onclick = async () => {
    const name = document.getElementById("username").value.trim();
    const emoji = document.getElementById("emoji").value;
    if (!name) return alert("Enter username");

    user = { name, emoji };

    const presence = supabase.channel("online-players", {
      config: { presence: { key: name } }
    });

    presence.on("presence", { event: "sync" }, () => {
      const present = presence.presenceState();
      document.getElementById("online-count").innerText =
        Object.keys(present).length;
    });

    await presence.subscribe();

    document.getElementById("welcome").innerText = `${emoji} ${name}`;
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";

    initGame();
  };

  // INIT GAME
  async function initGame() {
    // Create table if not exists (for simulation)
    try {
      await supabase.from("game_state").select("*").eq("id", 1).single();
    } catch (e) {
      await supabase.from("game_state").insert([{ id: 1, phase: "idle", end_time: new Date().toISOString() }]);
    }

    updateUI();
    gameLoop();
  }

  function updateUI() {
    const phase = currentState?.phase || "idle";
    const end_time = currentState?.end_time || new Date().toISOString();

    if (phase === "idle") {
      document.getElementById("game-status").innerText = "Waiting...";
      document.getElementById("timer").innerText = "";
      document.getElementById("join-btn").style.display = "none";
      document.getElementById("spectating").style.display = "none";
    }

    if (phase === "pregame") {
      document.getElementById("game-status").innerText = "Round Starting!";
      countdownTo(end_time);
      document.getElementById("join-btn").style.display = "block";
      document.getElementById("spectating").style.display = "none";
    }

    if (phase === "game") {
      document.getElementById("game-status").innerText = "GAME IN PROGRESS!";
      countdownTo(end_time);
      if (!playingThisRound) {
        document.getElementById("join-btn").style.display = "none";
        document.getElementById("spectating").style.display = "block";
      }
    }
  }

  function countdownTo(endTime) {
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      const diff = (new Date(endTime) - new Date()) / 1000;
      document.getElementById("timer").innerText = diff > 0 ? Math.ceil(diff) : "0";
    }, 200);
  }

  async function gameLoop() {
    // Simulation loop
    while (true) {
      currentState = { phase: "pregame", end_time: new Date(Date.now() + 10000).toISOString() };
      updateUI();
      await new Promise(r => setTimeout(r, 10000));

      currentState = { phase: "game", end_time: new Date(Date.now() + 10000).toISOString() };
      playingThisRound = false;
      updateUI();
      await new Promise(r => setTimeout(r, 10000));

      currentState = { phase: "idle", end_time: new Date().toISOString() };
      updateUI();
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  document.getElementById("join-btn").onclick = () => {
    playingThisRound = true;
    document.getElementById("join-btn").style.display = "none";
    document.getElementById("spectating").style.display = "none";
  };
}
