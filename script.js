const startButton = document.querySelector("#start-button");
const countdown = document.querySelector(".countdown");
const countdownNumber = document.querySelector("#countdown-number");
const launchNote = document.querySelector("#launch-note");
const destination = "https://omraje.in/";

let started = false;

function createCountdownSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.warn("Countdown sound is unavailable in this browser.");
    return null;
  }

  try {
    const audio = new AudioContext();
    if (audio.state === "suspended") {
      audio.resume().catch((error) => console.warn("Countdown sound could not start:", error));
    }
    return audio;
  } catch (error) {
    console.warn("Countdown sound could not start:", error);
    return null;
  }
}

function playCountdownTick(audio) {
  if (!audio) return;

  try {
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, now);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    oscillator.connect(volume);
    volume.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  } catch (error) {
    console.warn("Countdown sound could not play:", error);
  }
}

startButton.addEventListener("click", () => {
  if (started) return;

  started = true;
  let seconds = 10;
  startButton.disabled = true;
  launchNote.textContent = "तयार व्हा — आता शुभारंभ होणार आहे.";
  countdown.classList.add("is-counting");
  const audio = createCountdownSound();
  playCountdownTick(audio);

  const interval = window.setInterval(() => {
    seconds -= 1;
    countdownNumber.textContent = String(seconds).padStart(2, "0");

    if (seconds === 0) {
      window.clearInterval(interval);
      launchNote.textContent = "ओम राजे.in वर आपले स्वागत आहे.";
      window.location.assign(destination);
    } else {
      playCountdownTick(audio);
    }
  }, 1000);
});
