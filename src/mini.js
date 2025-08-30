
document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("title");
  const artistEl = document.getElementById("artist");
  const thumbEl = document.getElementById("thumbnail");

  const closeBtn = document.getElementById("closeBtn");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  
  const progressCircle = document.querySelector(".progress-ring .progress");
  const radius = progressCircle.r.baseVal.value;         
  const circumference = 2 * Math.PI * radius;            
  progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  progressCircle.style.strokeDashoffset = `${circumference}`;

  function setProgress(pct /* 0..1 */) {
    const offset = circumference - pct * circumference;
    progressCircle.style.strokeDashoffset = `${offset}`;
  }

  
  closeBtn.addEventListener("click", () => window.electronAPI.sendMiniControl("close"));
  playPauseBtn.addEventListener("click", () => window.electronAPI.sendMiniControl("toggle"));
  prevBtn.addEventListener("click", () => window.electronAPI.sendMiniControl("prev"));
  nextBtn.addEventListener("click", () => window.electronAPI.sendMiniControl("next"));

  
  window.electronAPI.onSongUpdate((data) => {
    titleEl.textContent = data?.songTitle ?? "";
    artistEl.textContent = data?.songArtist ?? "";
    if (data?.thumbnailURL) thumbEl.src = data.thumbnailURL;
    if (typeof data?.progress === "number") setProgress(Math.max(0, Math.min(1, data.progress)));
  });
});


