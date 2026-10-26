const identity = document.querySelector("#identity");
const introVideo = document.querySelector("#intro-video");
const backgroundVideo = document.querySelector("#background-video");
const playGate = document.querySelector("#play-gate");
const saveButton = document.querySelector("#save-contact");
let transitioning = false;

function prepareVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
}

async function resumePlayback() {
  prepareVideo(introVideo);
  prepareVideo(backgroundVideo);
  const activeVideo = introVideo.isConnected ? introVideo : backgroundVideo;
  try {
    await activeVideo.play();
    playGate.hidden = true;
  } catch {
    playGate.hidden = false;
  }
}

function beginTransition() {
  if (transitioning) return;
  transitioning = true;
  identity.classList.add("is-transitioning");
  backgroundVideo.currentTime = 0;
  backgroundVideo.play().catch(() => { playGate.hidden = false; });
  window.setTimeout(() => {
    introVideo.remove();
    identity.classList.add("is-ready");
  }, 650);
}

function checkIntro() {
  if (Number.isFinite(introVideo.duration) && introVideo.duration - introVideo.currentTime < .42) beginTransition();
}

function fluidPress(event) {
  const wave = event.currentTarget.querySelector(".tap-wave");
  const rect = event.currentTarget.getBoundingClientRect();
  wave.style.setProperty("--tap-x", `${event.clientX - rect.left}px`);
  wave.style.setProperty("--tap-y", `${event.clientY - rect.top}px`);
  wave.classList.remove("play");
  window.requestAnimationFrame(() => wave.classList.add("play"));
  window.setTimeout(() => wave.classList.remove("play"), 650);
}

introVideo.addEventListener("canplay", resumePlayback, { once: true });
introVideo.addEventListener("timeupdate", checkIntro);
introVideo.addEventListener("ended", beginTransition, { once: true });
playGate.addEventListener("click", resumePlayback);
saveButton.addEventListener("pointerdown", fluidPress);

resumePlayback();
window.setTimeout(beginTransition, 2550);
window.setTimeout(() => {
  if (introVideo.paused && backgroundVideo.paused) playGate.hidden = false;
}, 900);
