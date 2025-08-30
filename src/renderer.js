
const API_KEY = "AIzaSyB5e69TE5oK8ZZg2XMEzm7XpQFTLOfPrpQ";

let player = null;
let queue = [];
let currentIndex = -1;
let currentVideoTitle = "";


const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const playerDiv = document.getElementById("player");
const nowTitleEl = document.getElementById("nowTitle");
const openMiniBtn = document.getElementById("openMiniBtn");

document.getElementById("nextBtn").addEventListener("click", nextSong);
document.getElementById("prevBtn").addEventListener("click", prevSong);
searchBtn.addEventListener("click", search);
searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") search(); });

openMiniBtn.addEventListener("click", () => {
  window.electronAPI.openMini();

  if (currentIndex >= 0 && queue[currentIndex]) {
    sendSongToMini(queue[currentIndex]);
  }
});


window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player", {
    height: "300",
    width: "520",
    videoId: "",
    playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
    events: {
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          nextSong();
        }
        if (e.data === YT.PlayerState.PLAYING) {
          nowTitleEl.textContent = currentVideoTitle || "";
        }
      },
    },
  });
};


async function search() {
  const q = searchInput.value.trim();
  if (!q) return;
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "15",
    q,
    key: API_KEY,
    videoCategoryId: "10",
  });
  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      resultsDiv.innerHTML = `<div style="color:#ff8080">API error: ${data.error.message}</div>`;
      return;
    }
    renderResults(data.items || []);
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = `<div style="color:#ff8080">Network error</div>`;
  }
}

function renderResults(items) {
  resultsDiv.innerHTML = "";
  if (!items.length) { resultsDiv.textContent = "No results."; return; }
  items.forEach(item => {
    const videoId = item.id.videoId;
    const title = item.snippet.title;
    const channel = item.snippet.channelTitle;
    const thumb = item.snippet.thumbnails?.medium?.url || "";

    const row = document.createElement("div");
    row.className = "result";
    row.onclick = () => addToQueue(videoId, title);

    const img = document.createElement("img");
    img.className = "thumb"; img.src = thumb;

    const meta = document.createElement("div"); meta.className = "meta";
    const t = document.createElement("div"); t.className = "title"; t.textContent = title;
    const c = document.createElement("div"); c.className = "channel"; c.textContent = channel;

    meta.appendChild(t); meta.appendChild(c);
    row.appendChild(img); row.appendChild(meta);
    resultsDiv.appendChild(row);
  });
}


function addToQueue(videoId, title) {
  queue.push({ videoId, title });
  if (currentIndex === -1) {
    currentIndex = 0;
    playCurrent();
  } else {
    renderQueue();
  }
}

function playCurrent() {
  if (currentIndex < 0 || currentIndex >= queue.length) return;
  const item = queue[currentIndex];
  currentVideoTitle = item.title;
  nowTitleEl.textContent = currentVideoTitle;
  if (player && player.loadVideoById) player.loadVideoById(item.videoId);

  sendSongToMini(item);
  renderQueue();
}

function nextSong() {
  if (currentIndex < queue.length - 1) {
    currentIndex++;
    playCurrent();
  }
}

function prevSong() {
  if (currentIndex > 0) {
    currentIndex--;
    playCurrent();
  }
}

function removeFromQueue(index) {
  if (index < 0 || index >= queue.length) return;
  if (index === currentIndex) {
    if (index < queue.length - 1) {
      queue.splice(index, 1);

      playCurrent();
    } else {

      queue.splice(index, 1);
      currentIndex--;
      if (currentIndex >= 0) playCurrent();
      else {

        currentVideoTitle = "";
        nowTitleEl.textContent = "";
        if (player && player.stopVideo) player.stopVideo();

        window.electronAPI.updateSong({
          thumbnailURL: null,
          songTitle: "",
          songArtist: "",
          trackRequester: "",
        });
      }
    }
  } else {
    queue.splice(index, 1);
    if (index < currentIndex) currentIndex--;
    renderQueue();
  }
}

function renderQueue() {
  const qDiv = document.getElementById("queueList");
  qDiv.innerHTML = "";
  queue.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "queue-item";

    const titleEl = document.createElement("span");
    titleEl.textContent = (i === currentIndex ? "▶ " : "") + item.title;
    if (i === currentIndex) titleEl.classList.add("active");
    titleEl.onclick = () => { currentIndex = i; playCurrent(); };

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.className = "removeBtn";
    removeBtn.onclick = (e) => { e.stopPropagation(); removeFromQueue(i); };

    row.appendChild(titleEl); row.appendChild(removeBtn);
    qDiv.appendChild(row);
  });
}


function sendSongToMini(item) {
  const thumbnailURL = item.videoId ? `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` : null;
  window.electronAPI.updateSong({
    thumbnailURL,
    songTitle: item.title,
    songArtist: "Unknown Artist",
    trackRequester: "You",
    fontPath: null,
  });
}


window.electronAPI.onMiniControlFromMini((action) => {
  if (action === "next") {
    nextSong();
  } else if (action === "prev") {
    prevSong();
  } else if (action === "toggle") {
    if (player && player.getPlayerState) {
      if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  }
});


setInterval(() => {
  if (currentIndex >= 0 && queue[currentIndex] && player && player.getDuration) {
    const duration = player.getDuration();
    const current = player.getCurrentTime();
    if (duration > 0) {
      window.electronAPI.updateSong({
        thumbnailURL: `https://img.youtube.com/vi/${queue[currentIndex].videoId}/hqdefault.jpg`,
        songTitle: queue[currentIndex].title,
        songArtist: "Unknown Artist",
        trackRequester: "You",
        progress: current / duration,
        fontPath: null,
      });
    }
  }
}, 5000);
