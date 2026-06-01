// background.js — Service Worker
// Handles: alarms, badge updates, push notifications

// ─── Badge helpers ──────────────────────────────────────────────────────────

function updateBadge(tools) {
  const available = (tools || []).filter(t => t.status === "available");
  if (available.length === 0) {
    chrome.action.setBadgeText({ text: "" });
  } else {
    chrome.action.setBadgeText({ text: String(available.length) });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF82" });
  }
}

// ─── On install: init storage ────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["tools"], (data) => {
    if (!data.tools) {
      chrome.storage.local.set({ tools: [] });
    }
  });
});

// ─── Alarm fires: tool reset ─────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith("reset_")) return;
  const toolEntryId = alarm.name.replace("reset_", "");

  chrome.storage.local.get(["tools"], (data) => {
    const tools = data.tools || [];
    const entry = tools.find(t => t.entryId === toolEntryId);
    if (!entry) return;

    // Mark as available
    const updated = tools.map(t => {
      if (t.entryId === toolEntryId) {
        return { ...t, status: "available", resetAt: null };
      }
      return t;
    });

    chrome.storage.local.set({ tools: updated }, () => {
      updateBadge(updated);

      // Fire browser notification
      chrome.notifications.create(`notif_${toolEntryId}`, {
        type: "basic",
        iconUrl: "../icons/icon128.png",
        title: "✅ AI Tool Ready",
        message: `${entry.name} limit has reset — you're good to go!`,
        priority: 2,
        requireInteraction: false
      });
    });
  });
});

// ─── Message handlers ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Set a new limit entry — schedule alarm
  if (msg.type === "SET_LIMIT") {
    const { entry } = msg; // { entryId, name, resetAt }
    const msLeft = entry.resetAt - Date.now();
    const minutesLeft = Math.max(0.5, msLeft / 60000);

    chrome.alarms.create(`reset_${entry.entryId}`, {
      delayInMinutes: minutesLeft
    });
    sendResponse({ ok: true });
  }

  // Cancel an alarm (tool marked available manually)
  if (msg.type === "CANCEL_ALARM") {
    chrome.alarms.clear(`reset_${msg.entryId}`, (cleared) => {
      sendResponse({ cleared });
    });
    return true; // async
  }

  // Force badge refresh
  if (msg.type === "REFRESH_BADGE") {
    chrome.storage.local.get(["tools"], (data) => {
      updateBadge(data.tools || []);
      sendResponse({ ok: true });
    });
    return true;
  }

  return true;
});

// ─── Storage change → keep badge in sync ────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.tools) {
    updateBadge(changes.tools.newValue || []);
  }
});
