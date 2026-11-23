import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const script = readFileSync(new URL("../script.js", import.meta.url), "utf8");

function createCountdown({ audioAvailable = true } = {}) {
  let onClick;
  let onTick;
  let assignedUrl;
  let clearedInterval;
  let intervalCount = 0;
  let soundCount = 0;
  const warnings = [];
  class AudioContext {
    state = "running";
    currentTime = 0;
    destination = {};
    createOscillator() {
      return {
        frequency: { setValueAtTime() {} },
        connect() {},
        start() { soundCount += 1; },
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
      };
    }
  }
  const startButton = {
    disabled: false,
    innerHTML: "LAUNCH",
    addEventListener: (event, handler) => {
      assert.equal(event, "click");
      onClick = handler;
    },
  };
  const countdown = {
    classList: { add: (value) => assert.equal(value, "is-counting") },
  };
  const countdownNumber = { textContent: "10" };
  const launchNote = { textContent: "ज्या क्षणाची आपण वाट पाहत होतो." };

  runInNewContext(script, {
    document: {
      querySelector: (selector) =>
        ({
          "#start-button": startButton,
          ".countdown": countdown,
          "#countdown-number": countdownNumber,
          "#launch-note": launchNote,
        })[selector],
    },
    window: {
      AudioContext: audioAvailable ? AudioContext : undefined,
      setInterval: (callback, delay) => {
        assert.equal(delay, 1000);
        onTick = callback;
        intervalCount += 1;
        return intervalCount;
      },
      clearInterval: (id) => {
        clearedInterval = id;
      },
      location: {
        assign: (url) => {
          assignedUrl = url;
        },
      },
    },
    console: { warn: (...args) => warnings.push(args) },
  });

  return {
    start: () => onClick(),
    tick: () => onTick(),
    startButton,
    countdownNumber,
    launchNote,
    getAssignedUrl: () => assignedUrl,
    getClearedInterval: () => clearedInterval,
    getIntervalCount: () => intervalCount,
    getSoundCount: () => soundCount,
    warnings,
  };
}

test("starts once, counts down from ten, and opens OmRaje.in at zero", () => {
  const page = createCountdown();

  page.start();
  page.start();
  assert.equal(page.startButton.disabled, true);
  assert.equal(page.startButton.innerHTML, "LAUNCH");
  assert.equal(page.launchNote.textContent, "तयार व्हा — आता शुभारंभ होणार आहे.");
  assert.equal(page.getIntervalCount(), 1);
  assert.equal(page.getSoundCount(), 1);

  for (let seconds = 9; seconds >= 0; seconds -= 1) {
    page.tick();
    assert.equal(page.countdownNumber.textContent, String(seconds).padStart(2, "0"));
  }

  assert.equal(page.getAssignedUrl(), "https://omraje.in/");
  assert.equal(page.getClearedInterval(), 1);
  assert.equal(page.launchNote.textContent, "ओम राजे.in वर आपले स्वागत आहे.");
  assert.equal(page.getSoundCount(), 10);
});

test("still completes the countdown when audio is unavailable", () => {
  const page = createCountdown({ audioAvailable: false });
  page.start();
  for (let i = 0; i < 10; i += 1) page.tick();
  assert.equal(page.getAssignedUrl(), "https://omraje.in/");
  assert.equal(page.getSoundCount(), 0);
  assert.equal(page.warnings.length, 1);
});
