
/* =========================================================
   SHOPY FONT — CENTRAL ADMIN CONTROL & VOICE ALARMS
   File: admin-controls.js

   Alarm 1: New membership request
   Alarm 2: New FBK received

   Uses admin_notifications.is_read for acknowledgement.
   ========================================================= */

window.SF = window.SF || {};

(function () {
  "use strict";

  const SF = window.SF;

  const CONFIG = {
    pollInterval: 8000,
    repeatDelay: 1800,
    maxNotifications: 100
  };

  const PRICES = {
    1: 580,
    2: 1000,
    3: 2000,
    4: 4500
  };

  const RATES = {
    Kenya: 1,
    Nigeria: 10.3734,
    Ghana: 0.0900059
  };

  const state = {
    enabled: false,
    polling: false,
    timer: null,
    repeatTimer: null,
    current: null,
    queue: [],
    knownIds: new Set(),
    audio: null
  };

  const MEMBERSHIP_EVENTS = [
    "activation_requested",
    "membership_requested",
    "community_requested",
    "community_request_submitted",
    "community_membership_requested"
  ];

  function getDb() {
    return typeof SF.getClient === "function"
      ? SF.getClient()
      : null;
  }

  function clean(value) {
    return String(value ?? "").trim();
  }

  function formatPhone(notification, profile) {
    return clean(profile.phone || notification.phone) || "Not provided";
  }

  function isFBK(notification) {
    const event = clean(notification.event_type).toLowerCase();

    return event.includes("fbk") &&
      (event.includes("submitted") || event.includes("received")) ||
      Boolean(clean(notification.submitted_fbk_code));
  }

  function isMembership(notification) {
    const event = clean(notification.event_type).toLowerCase();

    return MEMBERSHIP_EVENTS.includes(event);
  }

  function isCommunity(notification, profile) {
    const event = clean(notification.event_type).toLowerCase();

    return event.includes("community") ||
      clean(profile.membership_type).toLowerCase() === "community";
  }

  function priceText(notification, profile) {
    if (isCommunity(notification, profile)) {
      return "200 Kenya shillings";
    }

    const level = Number(notification.membership_level);
    const kes = PRICES[level];

    if (!kes) return "Price not available";

    const country = clean(profile.country) || "Kenya";
    const amount = kes * (RATES[country] || 1);

    if (country === "Nigeria") {
      return Math.round(amount).toLocaleString("en-NG") +
        " Nigerian naira";
    }

    if (country === "Ghana") {
      return amount.toFixed(2) + " Ghana cedis";
    }

    return kes.toLocaleString("en-KE") + " Kenya shillings";
  }

  function getAnnouncement(notification, profile) {
    const name = clean(profile.full_name) || "A new member";
    const phone = formatPhone(notification, profile);
    const level = clean(notification.membership_level);

    if (isFBK(notification)) {
      const code = clean(notification.submitted_fbk_code);

      const spokenCode = code
        ? Array.from(code).join(", ")
        : "The code is not available";

      return {
        type: "FBK",
        text:
          "Attention! New F B K received. " +
          "Member name: " + name + ". " +
          "Phone number: " + phone + ". " +
          "The F B K number is: " + spokenCode + ". " +
          "Attention! New F B K received."
      };
    }

    if (isMembership(notification)) {
      const community = isCommunity(notification, profile);

      const membership = community
        ? "Build Community membership."
        : "Level " + (level || "not selected") + ".";

      return {
        type: "MEMBERSHIP",
        text:
          "Attention! New member request received. " +
          "Member name: " + name + ". " +
          "Phone number: " + phone + ". " +
          membership + " " +
          "Package price: " + priceText(notification, profile) + ". " +
          "Attention! New member request received."
      };
    }

    return null;
  }

  function createPanel() {
    if (document.getElementById("sfAdminAlarmPanel")) return;

    const panel = document.createElement("section");
    panel.id = "sfAdminAlarmPanel";

    panel.style.cssText = [
      "position:fixed",
      "right:12px",
      "bottom:12px",
      "width:min(370px,calc(100vw - 24px))",
      "z-index:999999",
      "padding:16px",
      "border:2px solid #d6a83e",
      "border-radius:15px",
      "background:#10251e",
      "color:white",
      "box-shadow:0 8px 35px rgba(0,0,0,.5)",
      "font-family:Arial,sans-serif"
    ].join(";");

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:8px">
        <strong>SHOPY FONT ADMIN ALARMS</strong>
        <strong id="sfAlarmCount">0</strong>
      </div>

      <p id="sfAlarmStatus" style="font-size:13px;line-height:1.5">
        Sound is disabled. Enable alarms to hear announcements.
      </p>

      <div id="sfAlarmCurrent"
        style="padding:10px;background:#1b392e;border-radius:9px;
        font-size:13px;line-height:1.6;margin-bottom:12px">
        No active alarm.
      </div>

      <button type="button" id="sfEnableAlarms"
        style="width:100%;padding:12px;background:#d6a83e;
        color:#17251d;border:0;border-radius:8px;
        font-weight:bold;margin-bottom:8px">
        ENABLE LOUD ALARMS
      </button>

      <button type="button" id="sfAcknowledgeAlarm"
        style="width:100%;padding:12px;background:#294c3c;
        color:white;border:1px solid #91aa9b;border-radius:8px;
        font-weight:bold">
        ACKNOWLEDGE CURRENT ALARM
      </button>
    `;

    document.body.appendChild(panel);

    document.getElementById("sfEnableAlarms")
      .addEventListener("click", enableAlarms);

    document.getElementById("sfAcknowledgeAlarm")
      .addEventListener("click", acknowledgeCurrent);
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function stopSpeech() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (state.repeatTimer) {
      clearTimeout(state.repeatTimer);
      state.repeatTimer = null;
    }
  }

  function playTone(type) {
    try {
      const AudioClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioClass) return;

      if (!state.audio) state.audio = new AudioClass();

      if (state.audio.state === "suspended") {
        state.audio.resume();
      }

      const frequencies = type === "FBK"
        ? [1046, 784, 1046]
        : [784, 784, 988];

      frequencies.forEach((frequency, index) => {
        window.setTimeout(() => {
          if (!state.enabled || !state.audio) return;

          const oscillator = state.audio.createOscillator();
          const gain = state.audio.createGain();

          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          gain.gain.value = 0.25;

          oscillator.connect(gain);
          gain.connect(state.audio.destination);

          oscillator.start();
          oscillator.stop(state.audio.currentTime + 0.22);
        }, index * 280);
      });
    } catch (error) {
      console.warn("Alarm tone unavailable:", error);
    }
  }

  function speakCurrent() {
    if (!state.enabled || !state.current) return;

    if (!("speechSynthesis" in window)) {
      setText("sfAlarmStatus",
        "Voice announcements are not supported by this browser.");
      return;
    }

    stopSpeech();

    const activeId = state.current.notification.id;
    const announcement = state.current.announcement;

    const utterance = new SpeechSynthesisUtterance(
      announcement.text
    );

    utterance.lang = "en-GB";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(item =>
      /^en(-|_)/i.test(item.lang)
    );

    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (
        !state.enabled ||
        !state.current ||
        state.current.notification.id !== activeId
      ) return;

      state.repeatTimer = window.setTimeout(() => {
        if (
          state.enabled &&
          state.current &&
          state.current.notification.id === activeId
        ) {
          speakCurrent();
        }
      }, CONFIG.repeatDelay);
    };

    utterance.onerror = error => {
      console.warn("Voice announcement failed:", error);
      setText("sfAlarmStatus",
        "Voice playback failed. Check device sound settings.");
    };

    window.speechSynthesis.speak(utterance);
  }

  function updatePanel() {
    setText("sfAlarmCount", state.queue.length +
      (state.current ? 1 : 0) + " waiting");

    if (!state.current) {
      setText("sfAlarmCurrent", "No active alarm.");
      return;
    }

    const item = state.current;
    const notification = item.notification;

    const heading = item.announcement.type === "FBK"
      ? "NEW FBK RECEIVED"
      : "NEW MEMBERSHIP REQUEST";

    const detail = notification.submitted_fbk_code
      ? "FBK: " + notification.submitted_fbk_code
      : "Member: " + (item.profile.full_name || "Name unavailable");

    setText("sfAlarmCurrent",
      heading + " — " + detail + " — " +
      new Date(notification.created_at).toLocaleString());

    setText("sfAlarmStatus",
      state.enabled
        ? "VOICE ALARMS ENABLED — repeating until acknowledged."
        : "Alert waiting. Enable alarms to hear it.");
  }

  async function loadNotifications() {
    if (state.polling || !SF.currentUser || !SF.adminAuthorized) {
      return;
    }

    state.polling = true;

    try {
      const db = getDb();
      if (!db) throw new Error("Supabase client is unavailable.");

      const { data, error } = await db
        .from("admin_notifications")
        .select(
          "id,user_id,event_type,membership_level,phone,message,is_read,created_at,submitted_fbk_code"
        )
        .eq("is_read", false)
        .order("created_at", { ascending: true })
        .limit(CONFIG.maxNotifications);

      if (error) throw error;

      const notifications = (data || []).filter(item =>
        isFBK(item) || isMembership(item)
      );

      const userIds = [...new Set(
        notifications.map(item => item.user_id).filter(Boolean)
      )];

      let profiles = [];

      if (userIds.length) {
        const result = await db
          .from("profiles")
          .select("id,full_name,phone,country,membership_type")
          .in("id", userIds);

        if (result.error) throw result.error;
        profiles = result.data || [];
      }

      const profileMap = new Map(
        profiles.map(profile => [profile.id, profile])
      );

      const fresh = [];

      notifications.forEach(notification => {
        if (state.knownIds.has(notification.id)) return;

        const profile = profileMap.get(notification.user_id) || {};
        const announcement = getAnnouncement(notification, profile);

        if (!announcement) return;

        state.knownIds.add(notification.id);

        fresh.push({
          notification,
          profile,
          announcement
        });
      });

      fresh.forEach(item => {
        if (
          !state.current ||
          state.current.notification.id !== item.notification.id
        ) {
          state.queue.push(item);
        }
      });

      if (
        state.current &&
        !notifications.some(item =>
          item.id === state.current.notification.id
        )
      ) {
        stopSpeech();
        state.current = null;
      }

      startNextAlarm();
      updatePanel();

    } catch (error) {
      console.error("SHOPY admin alarm error:", error);
      setText("sfAlarmStatus",
        "Could not check notifications: " + error.message);
    } finally {
      state.polling = false;
    }
  }

  function startNextAlarm() {
    if (state.current || !state.queue.length) return;

    state.current = state.queue.shift();

    updatePanel();

    if (state.enabled) {
      playTone(state.current.announcement.type);
      speakCurrent();
    }
  }

  async function enableAlarms() {
    try {
      const AudioClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioClass && !state.audio) {
        state.audio = new AudioClass();
      }

      if (state.audio?.state === "suspended") {
        await state.audio.resume();
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      state.enabled = true;

      setText("sfAlarmStatus", "Alarms enabled. Checking notifications.");

      await loadNotifications();

      if (state.current) {
        playTone(state.current.announcement.type);
        speakCurrent();
      } else {
        setText("sfAlarmStatus",
          "Alarms enabled. Waiting for new member requests and FBK submissions.");
      }

    } catch (error) {
      console.error("Could not enable alarms:", error);
      setText("sfAlarmStatus",
        "Could not enable sound. Check browser and device settings.");
    }
  }

  async function acknowledgeCurrent() {
    if (!state.current) {
      setText("sfAlarmStatus", "There is no active alarm.");
      return;
    }

    const id = state.current.notification.id;

    try {
      const { error } = await getDb()
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      stopSpeech();
      state.knownIds.delete(id);
      state.current = null;

      updatePanel();
      await loadNotifications();
      startNextAlarm();

    } catch (error) {
      console.error("Acknowledgement failed:", error);
      setText("sfAlarmStatus",
        "Could not acknowledge this alert: " + error.message);
    }
  }

  SF.startAdminAlarmMonitor = function () {
    if (!SF.currentUser || !SF.adminAuthorized) return;

    createPanel();

    if (state.timer) return;

    loadNotifications();

    state.timer = window.setInterval(
      loadNotifications,
      CONFIG.pollInterval
    );
  };

  SF.stopAdminAlarmMonitor = function () {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }

    stopSpeech();

    state.current = null;
    state.queue = [];
    state.knownIds.clear();
    state.enabled = false;
  };

  /*
   * Automatically connect to the existing admin loader.
   * No manual change to admin.js is required.
   */
  function connectAdminLoader() {
    if (typeof SF.loadAdmin !== "function") return;

    if (SF.loadAdmin.__alarmConnected) return;

    const originalLoadAdmin = SF.loadAdmin;

    const wrappedLoadAdmin = async function (...args) {
      const result = await originalLoadAdmin.apply(this, args);

      if (SF.adminAuthorized) {
        SF.startAdminAlarmMonitor();
      }

      return result;
    };

    wrappedLoadAdmin.__alarmConnected = true;
    SF.loadAdmin = wrappedLoadAdmin;
  }

  connectAdminLoader();

  document.addEventListener("DOMContentLoaded", () => {
    connectAdminLoader();

    if (SF.adminAuthorized) {
      SF.startAdminAlarmMonitor();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && SF.adminAuthorized) {
      loadNotifications();
    }
  });

  window.addEventListener("beforeunload", stopSpeech);

})();
         
