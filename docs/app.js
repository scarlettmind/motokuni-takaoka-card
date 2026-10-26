const profile = {
  name: "Motokuni Takaoka",
  familyName: "Takaoka",
  givenName: "Motokuni",
  title: "Chairman of the Board; President and Chief Executive Officer",
  company: "airweave inc.",
  mobile: "+81-90-3386-0705",
  phone: "+81-3-6214-2472",
  email: "motokuni_takaoka@airweave.jp",
  website: "https://airweave.com/",
  address: "8F Shin-Otemachi Building, 2-2-1 Otemachi, Chiyoda-ku, Tokyo, 100-0004 Japan",
};

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

function foldBase64(prefix, encoded) {
  const firstLength = 75 - prefix.length;
  const lines = [prefix + encoded.slice(0, firstLength)];
  for (let index = firstLength; index < encoded.length; index += 74) lines.push(` ${encoded.slice(index, index + 74)}`);
  return lines;
}

function escapeVCard(value) {
  return value.replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

async function saveContact() {
  let photoLines = [];
  try {
    const response = await fetch("assets/motokuni-takaoka.jpg", { cache: "no-store" });
    if (!response.ok) throw new Error("Portrait unavailable");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
    photoLines = foldBase64("PHOTO;ENCODING=b;TYPE=JPEG:", btoa(binary));
  } catch {
    // The contact remains usable if the portrait cannot be loaded.
  }

  const card = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${profile.name}`,
    `N:${profile.familyName};${profile.givenName};;;`,
    `ORG:${profile.company}`,
    `TITLE:${escapeVCard(profile.title)}`,
    `TEL;TYPE=CELL:${profile.mobile}`,
    `TEL;TYPE=WORK,VOICE:${profile.phone}`,
    `EMAIL;TYPE=INTERNET,WORK:${profile.email}`,
    `URL;TYPE=WORK:${profile.website}`,
    "ADR;TYPE=WORK:;;8F Shin-Otemachi Building\\, 2-2-1 Otemachi;Chiyoda-ku;Tokyo;100-0004;Japan",
    ...photoLines,
    "END:VCARD",
    "",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([card], { type: "text/vcard;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Motokuni-Takaoka.vcf";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
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
saveButton.addEventListener("click", saveContact);

resumePlayback();
window.setTimeout(beginTransition, 2550);
window.setTimeout(() => {
  if (introVideo.paused && backgroundVideo.paused) playGate.hidden = false;
}, 900);
