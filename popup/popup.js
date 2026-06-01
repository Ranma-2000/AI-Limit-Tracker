// popup.js — Main UI logic

// ── State ──────────────────────────────────────────────────────────────
let tools = [];        // saved entries from storage
let activeTab = "limited";
let editingId = null;  // entryId being edited, or null for new
let selectedPresetId = null;
let resetStrategy = "auto"; // "auto" | "manual"
let countdownInterval = null;
let selectedCustomIcon = "⚙️"; // icon for custom entries
let selectedCustomIconIsImage = false; // true if icon is a data URL (from .ico/.png file)
let customToolPresets = []; // user-saved custom tools loaded from storage
let presetUrls = {};       // { presetId: [url1, url2, ...] } — per-preset URL history

// ── Emoji map for preset icons ─────────────────────────────────────────
const PRESET_EMOJI = {
  claude_pro:       "🟠",
  claude_opus:      "🔶",
  chatgpt_plus:     "🟢",
  chatgpt_o1:       "🌿",
  gemini_advanced:  "🔵",
  perplexity_pro:   "🩵",
  grok_premium:     "⚪",
  mistral_le_chat:  "🟡",
  copilot:          "🟣",
  cursor_pro:       "🟤",
  poe_subscriber:   "💜",
  custom:           "⚙️"
};

// ── Icon palette for custom tool picker ───────────────────────────────
const ICON_PALETTE = [
  "⚙️","🤖","🧠","💡","🔮","✨","⚡","🌐",
  "🛠️","📡","🔬","🧬","💻","🖥️","📱","⌨️",
  "🎯","🎲","🃏","🎮","🕹️","👾","🐉","🦄",
  "🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪",
  "🔶","🔷","🔸","🔹","💠","🔘","🔲","🔳",
  "⭐","🌟","💫","✴️","❇️","🌀","♾️","🔁",
  "🧩","🗝️","🔑","🔓","📎","📌","🗂️","📋",
  "🚀","🛸","🌙","☀️","🌊","🔥","❄️","🌈",
];

// ── Helpers ────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function formatCountdown(ms) {
  if (ms <= 0) return "now";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,"0")}s`;
  return `${s}s`;
}

function formatResetTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today ${timeStr}`;
  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  if (d.toDateString() === tmrw.toDateString()) return `Tomorrow ${timeStr}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + timeStr;
}

// Format large numbers compactly
function fmtNum(n) {
  if (n == null) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// Truncate long account strings for display
function formatAccount(account) {
  if (!account) return "";
  if (account.length <= 26) return account;
  // For emails: show user + first few chars of domain
  if (account.includes("@")) {
    const [user, domain] = account.split("@");
    if (user.length > 14) return user.slice(0, 12) + "…@" + domain.slice(0, 6) + "…";
    return user + "@" + domain.slice(0, 10) + "…";
  }
  return account.slice(0, 24) + "…";
}

// ── Preset Grid ────────────────────────────────────────────────────────
function getCustomPresetEmoji(id) {
  const cp = customToolPresets.find(p => p.id === id);
  return cp ? (cp.icon || "⚙️") : null;
}

function getPreset(id) {
  return AI_TOOL_PRESETS.find(p => p.id === id)
    || customToolPresets.find(p => p.id === id)
    || AI_TOOL_PRESETS.find(p => p.id === "custom");
}

function renderPresetGrid() {
  const grid = document.getElementById("presetGrid");

  // User-saved custom tool presets section
  const savedHtml = customToolPresets.length > 0
    ? `<div class="preset-section-label">My saved tools</div>` +
      customToolPresets.map(p => {
        const iconHtml = p.icon && p.icon.startsWith("data:")
          ? `<img src="${p.icon}" class="preset-chip-img" alt="icon">`
          : `<span class="preset-chip-icon">${p.icon || "⚙️"}</span>`;
        return `
          <div class="preset-chip saved-custom" data-preset-id="${p.id}"
               style="--tool-color: ${p.color || "#888888"}">
            ${iconHtml}
            <span class="preset-chip-name">${p.name.split(" ").slice(0,2).join(" ")}</span>
            <button class="preset-chip-delete" data-delete-id="${p.id}" title="Remove">×</button>
          </div>`;
      }).join("") +
      `<div class="preset-section-label">Built-in tools</div>`
    : "";

  const builtInHtml = AI_TOOL_PRESETS.map(p => `
    <div class="preset-chip" data-preset-id="${p.id}"
         style="--tool-color: ${p.color}">
      <span class="preset-chip-icon">${PRESET_EMOJI[p.id] || "⚙️"}</span>
      <span class="preset-chip-name">${p.name.split(" ").slice(0,2).join(" ")}</span>
    </div>
  `).join("");

  grid.innerHTML = savedHtml + builtInHtml;

  grid.querySelectorAll(".preset-chip").forEach(chip => {
    chip.addEventListener("click", (e) => {
      if (e.target.closest(".preset-chip-delete")) return;
      selectPreset(chip.dataset.presetId);
    });
  });

  grid.querySelectorAll(".preset-chip-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const deleteId = btn.dataset.deleteId;
      deleteCustomToolPreset(deleteId);
      renderPresetGrid();
      if (selectedPresetId === deleteId) {
        selectedPresetId = null;
        document.getElementById("fieldCustomName").style.display = "none";
        document.getElementById("fieldCustomIcon").style.display = "none";
        document.getElementById("policyNote").textContent = "";
        document.getElementById("autoResetPreview").textContent = "—";
      }
    });
  });
}

function computeAutoResetAt(presetId) {
  const preset = getPreset(presetId);
  return Date.now() + preset.resetWindowMinutes * 60 * 1000;
}

// ── Storage ────────────────────────────────────────────────────────────
function loadTools(cb) {
  chrome.storage.local.get(["tools", "customToolPresets", "presetUrls"], (data) => {
    tools = data.tools || [];
    customToolPresets = data.customToolPresets || [];
    presetUrls = data.presetUrls || {};
    // Auto-mark tools as available if resetAt has passed
    let changed = false;
    tools = tools.map(t => {
      if (t.status === "limited" && t.resetAt && t.resetAt <= Date.now()) {
        changed = true;
        return { ...t, status: "available", resetAt: null };
      }
      return t;
    });
    if (changed) {
      chrome.storage.local.set({ tools });
    }
    cb && cb();
  });
}

function saveTools(cb) {
  chrome.storage.local.set({ tools }, () => {
    try {
      chrome.runtime.sendMessage({ type: "REFRESH_BADGE" }, () => {
        if (chrome.runtime.lastError) { /* swallow */ }
      });
    } catch (e) { /* background may not be ready */ }
    cb && cb();
  });
}

// ── Custom Tool Preset Storage ──────────────────────────────────────────
function saveCustomToolPresets(cb) {
  chrome.storage.local.set({ customToolPresets }, cb);
}

function addCustomToolPreset(tool) {
  // Avoid duplicates by id
  customToolPresets = customToolPresets.filter(p => p.id !== tool.id);
  customToolPresets.unshift(tool);
  saveCustomToolPresets();
}

function deleteCustomToolPreset(id) {
  customToolPresets = customToolPresets.filter(p => p.id !== id);
  saveCustomToolPresets();
}

// ── Preset URL History ────────────────────────────────────────────────
function saveUrlToPresetHistory(presetId, url) {
  if (!url || !presetId) return;
  const list = presetUrls[presetId] || [];
  // Move to front, deduplicate, cap at 10
  const filtered = list.filter(u => u !== url);
  presetUrls[presetId] = [url, ...filtered].slice(0, 10);
  chrome.storage.local.set({ presetUrls });
}

function removeUrlFromPresetHistory(presetId, url) {
  if (!presetUrls[presetId]) return;
  presetUrls[presetId] = presetUrls[presetId].filter(u => u !== url);
  chrome.storage.local.set({ presetUrls });
}

// Returns ordered URL suggestions for a preset:
// 1. Previously used URLs (from history), most recent first
// 2. If no history, fall back to preset default URL
function getUrlSuggestionsForPreset(presetId) {
  const history = presetUrls[presetId] || [];
  if (history.length > 0) return history;
  const preset = getPreset(presetId);
  return (preset && preset.url) ? [preset.url] : [];
}

// Best single URL to prefill: top of history, else preset default
function getBestUrlForPreset(presetId) {
  const history = presetUrls[presetId] || [];
  if (history.length > 0) return history[0];
  const preset = getPreset(presetId);
  return (preset && preset.url) ? preset.url : "";
}

// ── Tab filtering ──────────────────────────────────────────────────────
function getFilteredTools() {
  if (activeTab === "limited")   return tools.filter(t => t.status === "limited");
  if (activeTab === "available") return tools.filter(t => t.status === "available");
  return tools;
}

// ── Render List ────────────────────────────────────────────────────────
function renderList() {
  const filtered = getFilteredTools();
  const listEl = document.getElementById("toolList");
  const emptyEl = document.getElementById("emptyState");
  const countEl = document.getElementById("availableCount");

  // Badge
  const availableCount = tools.filter(t => t.status === "available").length;
  if (availableCount > 0) {
    countEl.textContent = `${availableCount} available`;
    countEl.classList.add("visible");
  } else {
    countEl.classList.remove("visible");
  }

  // Clear old countdown
  if (countdownInterval) clearInterval(countdownInterval);

  if (filtered.length === 0) {
    listEl.innerHTML = "";
    emptyEl.style.display = "flex";
    return;
  }
  emptyEl.style.display = "none";

  listEl.innerHTML = filtered.map(entry => {
    const preset = getPreset(entry.presetId);
    let avatarHtml;
    const icon = entry.customIcon || getCustomPresetEmoji(entry.presetId);
    if (icon && icon.startsWith("data:")) {
      avatarHtml = `<img src="${icon}" class="tool-avatar-img" alt="icon">`;
    } else {
      const emoji = entry.presetId === "custom"
        ? (icon || "⚙️")
        : (PRESET_EMOJI[entry.presetId] || icon || "⚙️");
      avatarHtml = emoji;
    }
    const isLimited = entry.status === "limited";
    const msLeft = isLimited && entry.resetAt ? entry.resetAt - Date.now() : 0;
    const accountDisplay = formatAccount(entry.account || "");

    // Token/credit display
    const hasToken = entry.tokenTotal != null && entry.tokenTotal > 0;
    const tokenPct = hasToken ? Math.min(100, Math.round((entry.tokenUsed || 0) / entry.tokenTotal * 100)) : 0;
    const tokenUnit = entry.tokenUnit || "tokens";
    const tokenBarClass = tokenPct >= 90 ? "danger" : tokenPct >= 65 ? "warn" : "";

    const tokenHtml = hasToken ? `
      <div class="token-inline" data-entry-id="${entry.entryId}">
        <div class="token-bar-wrap">
          <div class="token-bar-fill ${tokenBarClass}" style="width:${tokenPct}%"></div>
        </div>
        <div class="token-inline-row">
          <span class="token-inline-nums">
            <span class="token-used-val" data-field="used">${fmtNum(entry.tokenUsed || 0)}</span>
            <span class="token-inline-sep">/</span>
            <span class="token-total-val" data-field="total">${fmtNum(entry.tokenTotal)}</span>
            <span class="token-inline-unit">${tokenUnit}</span>
          </span>
          <span class="token-pct ${tokenBarClass}">${tokenPct}%</span>
        </div>
      </div>` : `
      <div class="token-inline token-empty" data-entry-id="${entry.entryId}" title="Click to add token/credit">
        <span class="token-add-hint">+ token</span>
      </div>`;

    return `
      <div class="tool-card${entry.toolUrl ? " has-url" : ""}" data-entry-id="${entry.entryId}"
           style="--tool-color: ${preset.color}">
        <div class="tool-avatar">${avatarHtml}</div>
        <div class="tool-info">
          <div class="tool-name">${entry.name}${entry.toolUrl ? `<span class="tool-url-badge" title="Click card to open AI tool">↗</span>` : ""}</div>
          ${accountDisplay ? `<div class="tool-account">${accountDisplay}</div>` : ""}
          <div class="tool-meta">${isLimited ? "Resets " + formatResetTime(entry.resetAt) : "No limit set"}</div>
          ${entry.note ? `<div class="tool-note">${entry.note}</div>` : ""}
          ${tokenHtml}
        </div>
        <div class="tool-right">
          <span class="status-pill ${entry.status}">${isLimited ? "Limited" : "OK"}</span>
          ${isLimited
            ? `<span class="countdown ${msLeft < 600000 ? "urgent" : ""}"
                     data-reset="${entry.resetAt}"
                     id="cd_${entry.entryId}">
                ${formatCountdown(msLeft)}
              </span>`
            : ""}
        </div>
      </div>`;
  }).join("");

  // Attach click listeners
  listEl.querySelectorAll(".tool-card").forEach(card => {
    card.addEventListener("click", (e) => {
      // Don't open edit form if clicking on token area
      if (e.target.closest(".token-inline")) return;
      const entry = tools.find(t => t.entryId === card.dataset.entryId);
      if (entry && entry.toolUrl) {
        // Long-press / right-click still opens edit; single click opens URL
        chrome.tabs.create({ url: entry.toolUrl });
      } else {
        openEdit(card.dataset.entryId);
      }
    });
    // Right-click or long-press to edit even when URL is set
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openEdit(card.dataset.entryId);
    });
  });

  // Token inline-edit: click on used/total value or the empty hint to edit
  listEl.querySelectorAll(".token-inline").forEach(widget => {
    const entryId = widget.dataset.entryId;

    // Click on used value
    const usedEl = widget.querySelector(".token-used-val");
    const totalEl = widget.querySelector(".token-total-val");
    const unitEl = widget.querySelector(".token-inline-unit");
    const emptyHint = widget.querySelector(".token-add-hint");

    const startInlineEdit = () => {
      if (widget.querySelector(".token-edit-row")) return; // already editing
      const entry = tools.find(t => t.entryId === entryId);
      if (!entry) return;

      // Replace the display row with an input row
      const displayRow = widget.querySelector(".token-inline-row");
      const barWrap = widget.querySelector(".token-bar-wrap");
      if (displayRow) displayRow.style.display = "none";
      if (emptyHint) emptyHint.style.display = "none";

      const editRow = document.createElement("div");
      editRow.className = "token-edit-row";
      editRow.innerHTML = `
        <input class="token-edit-input" id="tie_used_${entryId}" type="number"
               value="${entry.tokenUsed || ""}" placeholder="Used" min="0">
        <span class="token-edit-sep">/</span>
        <input class="token-edit-input" id="tie_total_${entryId}" type="number"
               value="${entry.tokenTotal || ""}" placeholder="Total" min="0">
        <input class="token-edit-unit" id="tie_unit_${entryId}" type="text"
               value="${entry.tokenUnit || ""}" placeholder="unit" maxlength="12">
        <button class="token-edit-ok" title="Save">✓</button>
      `;
      widget.appendChild(editRow);

      const inputUsed  = editRow.querySelector(`#tie_used_${entryId}`);
      const inputTotal = editRow.querySelector(`#tie_total_${entryId}`);
      const inputUnit  = editRow.querySelector(`#tie_unit_${entryId}`);
      const btnOk      = editRow.querySelector(".token-edit-ok");

      // Focus first empty, else used
      (entry.tokenTotal ? inputUsed : inputTotal).focus();
      inputUsed.select();

      const commitEdit = () => {
        const usedVal  = parseInt(inputUsed.value) || 0;
        const totalVal = parseInt(inputTotal.value) || 0;
        const unitVal  = inputUnit.value.trim() || "tokens";
        tools = tools.map(t => t.entryId === entryId
          ? { ...t, tokenUsed: usedVal, tokenTotal: totalVal || null, tokenUnit: unitVal }
          : t
        );
        saveTools(() => renderList());
      };

      btnOk.addEventListener("click", (e) => { e.stopPropagation(); commitEdit(); });

      // Enter to save, Escape to cancel
      editRow.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
        if (e.key === "Escape") {
          e.preventDefault();
          editRow.remove();
          if (displayRow) displayRow.style.display = "";
          if (emptyHint) emptyHint.style.display = "";
        }
      });

      // Click outside = save
      const onOutside = (e) => {
        if (!widget.contains(e.target)) {
          document.removeEventListener("mousedown", onOutside);
          commitEdit();
        }
      };
      setTimeout(() => document.addEventListener("mousedown", onOutside), 0);
    };

    if (usedEl) usedEl.addEventListener("click", (e) => { e.stopPropagation(); startInlineEdit(); });
    if (totalEl) totalEl.addEventListener("click", (e) => { e.stopPropagation(); startInlineEdit(); });
    if (unitEl) unitEl.addEventListener("click", (e) => { e.stopPropagation(); startInlineEdit(); });
    if (emptyHint) emptyHint.addEventListener("click", (e) => { e.stopPropagation(); startInlineEdit(); });
  });

  // Live countdown ticker
  countdownInterval = setInterval(() => {
    listEl.querySelectorAll("[data-reset]").forEach(el => {
      const resetAt = parseInt(el.dataset.reset);
      const msLeft = resetAt - Date.now();
      el.textContent = formatCountdown(msLeft);
      if (msLeft < 600000) el.classList.add("urgent");
      if (msLeft <= 0) {
        loadTools(renderList);
      }
    });
  }, 1000);
}

// ── Views ──────────────────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ── Icon Picker ────────────────────────────────────────────────────────
function renderIconGrid(currentIcon) {
  const grid = document.getElementById("iconGrid");
  const isImageIcon = currentIcon && currentIcon.startsWith("data:");

  grid.innerHTML = ICON_PALETTE.map(icon => `
    <button class="icon-btn-pick${(!isImageIcon && icon === currentIcon) ? " selected" : ""}"
            data-icon="${icon}" title="${icon}">${icon}</button>
  `).join("");

  grid.querySelectorAll(".icon-btn-pick").forEach(btn => {
    btn.addEventListener("click", () => {
      setCustomIcon(btn.dataset.icon, false);
    });
  });
}

function setCustomIcon(icon, isImage = false) {
  selectedCustomIcon = icon;
  selectedCustomIconIsImage = isImage;
  const preview = document.getElementById("iconPreview");
  if (isImage) {
    preview.innerHTML = `<img src="${icon}" class="icon-preview-img" alt="icon">`;
    document.getElementById("inputCustomIcon").value = "";
    // Deselect all emoji buttons
    document.querySelectorAll(".icon-btn-pick").forEach(btn => btn.classList.remove("selected"));
  } else {
    preview.textContent = icon;
    document.getElementById("inputCustomIcon").value = icon;
    document.querySelectorAll(".icon-btn-pick").forEach(btn => {
      btn.classList.toggle("selected", btn.dataset.icon === icon);
    });
  }
}

function handleIconFileUpload(file) {
  if (!file) return;
  // Accept any image type
  if (!file.type.startsWith("image/") && !file.name.toLowerCase().match(/\.(ico|png|jpg|jpeg|gif|webp|svg|bmp|tiff?)$/i)) {
    alert("Please select an image file (PNG, JPG, GIF, WEBP, SVG, ICO, BMP, etc.)");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    // Convert any image to ICO (32×32 PNG stored as data:image/x-icon)
    convertImageToIco(dataUrl, (icoDataUrl) => {
      setCustomIcon(icoDataUrl, true);
    });
  };
  reader.readAsDataURL(file);
}

function convertImageToIco(dataUrl, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    // Draw image scaled to 32×32 (standard ICO size)
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(img, 0, 0, 32, 32);
    // Export as PNG but label as x-icon (browsers treat it as icon)
    const pngData = canvas.toDataURL("image/png");
    // Replace MIME type to signal it's stored as icon
    const icoData = pngData.replace("data:image/png", "data:image/x-icon");
    callback(icoData);
  };
  img.onerror = () => {
    // Fallback: use original if conversion fails
    callback(dataUrl);
  };
  img.src = dataUrl;
}

// ── Select Preset ──────────────────────────────────────────────────────
function selectPreset(id, keepUrl = false) {
  selectedPresetId = id;
  document.querySelectorAll(".preset-chip").forEach(c => {
    c.classList.toggle("selected", c.dataset.presetId === id);
  });

  const preset = getPreset(id);
  const isCustom = id === "custom";

  document.getElementById("fieldCustomName").style.display = isCustom ? "flex" : "none";
  document.getElementById("fieldCustomIcon").style.display = isCustom ? "flex" : "none";

  if (isCustom) renderIconGrid(selectedCustomIcon);

  // Auto-fill URL: only fill if not keepUrl (i.e. fresh preset pick, not editing existing entry)
  if (!keepUrl) {
    const urlInput = document.getElementById("inputToolUrl");
    urlInput.value = getBestUrlForPreset(id);
    renderUrlDropdown(id);
  }

  document.getElementById("policyNote").textContent = preset.notes || "";
  updateAutoPreview();
}

function updateAutoPreview() {
  if (!selectedPresetId) return;
  const resetAt = computeAutoResetAt(selectedPresetId);
  document.getElementById("autoResetPreview").textContent = formatResetTime(resetAt);
}

// ── URL Dropdown ───────────────────────────────────────────────────────
function renderUrlDropdown(presetId) {
  // Remove any existing dropdown
  const existing = document.getElementById("urlDropdown");
  if (existing) existing.remove();

  const suggestions = getUrlSuggestionsForPreset(presetId);
  if (suggestions.length === 0) return;

  const fieldEl = document.getElementById("fieldToolUrl");
  const inputEl = document.getElementById("inputToolUrl");

  const dropdown = document.createElement("div");
  dropdown.id = "urlDropdown";
  dropdown.className = "url-dropdown";

  suggestions.forEach(url => {
    const item = document.createElement("div");
    item.className = "url-dropdown-item";

    const label = document.createElement("span");
    label.className = "url-dropdown-label";
    label.textContent = url;
    label.title = url;
    label.addEventListener("click", () => {
      inputEl.value = url;
      dropdown.remove();
    });

    const del = document.createElement("button");
    del.className = "url-dropdown-del";
    del.textContent = "×";
    del.title = "Remove this URL";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removeUrlFromPresetHistory(presetId, url);
      // If the input currently shows this url and it's removed, clear it only
      // if it matches the deleted one and there's a better default
      if (inputEl.value === url) {
        const remaining = getUrlSuggestionsForPreset(presetId);
        inputEl.value = remaining.length > 0 ? remaining[0] : (getPreset(presetId)?.url || "");
      }
      item.remove();
      // Remove dropdown if empty
      if (dropdown.querySelectorAll(".url-dropdown-item").length === 0) dropdown.remove();
    });

    item.appendChild(label);
    item.appendChild(del);
    dropdown.appendChild(item);
  });

  fieldEl.appendChild(dropdown);
}

// ── Form: open new ─────────────────────────────────────────────────────
function openNew() {
  editingId = null;
  selectedPresetId = null;
  resetStrategy = "auto";
  selectedCustomIcon = "⚙️";

  document.getElementById("formTitle").textContent = "Track New Limit";
  document.getElementById("inputNote").value = "";
  document.getElementById("inputAccount").value = "";
  document.getElementById("inputToolUrl").value = "";
  document.getElementById("inputCustomName").value = "";
  document.getElementById("inputCustomIcon").value = "";
  document.getElementById("iconPreview").textContent = "⚙️";
  document.getElementById("btnSaveLabel").textContent = "Start Tracking";
  document.getElementById("btnMarkAvailable").style.display = "none";
  document.getElementById("btnDelete").style.display = "none";
  document.getElementById("inputTokenUsed").value = "";
  document.getElementById("inputTokenTotal").value = "";
  document.getElementById("inputTokenUnit").value = "";

  setStrategy("auto");

  document.querySelectorAll(".preset-chip").forEach(c => c.classList.remove("selected"));
  document.getElementById("fieldCustomName").style.display = "none";
  document.getElementById("fieldCustomIcon").style.display = "none";
  document.getElementById("policyNote").textContent = "";
  document.getElementById("autoResetPreview").textContent = "—";
  document.getElementById("inputResetHHMM").value = "";
  document.getElementById("btnAmPm").style.display = "none";
  document.getElementById("inputOffsetHours").value = "";
  document.getElementById("inputOffsetMinutes").value = "";

  renderPresetGrid();
  showView("viewForm");
}

// ── Form: open edit ─────────────────────────────────────────────────────
function openEdit(entryId) {
  const entry = tools.find(t => t.entryId === entryId);
  if (!entry) return;
  editingId = entryId;

  selectedCustomIcon = entry.presetId === "custom"
    ? (entry.customIcon || "⚙️")
    : "⚙️";

  document.getElementById("formTitle").textContent = "Edit Entry";
  document.getElementById("inputNote").value = entry.note || "";
  document.getElementById("inputAccount").value = entry.account || "";
  document.getElementById("inputToolUrl").value = entry.toolUrl || "";
  document.getElementById("inputCustomName").value =
    entry.presetId === "custom" ? entry.name : "";

  // Fix: use setCustomIcon so image data URLs render as <img>, not raw text
  const isImageIcon = selectedCustomIcon && selectedCustomIcon.startsWith("data:");
  setCustomIcon(selectedCustomIcon, isImageIcon);
  if (!isImageIcon) {
    document.getElementById("inputCustomIcon").value =
      entry.presetId === "custom" ? (entry.customIcon || "") : "";
  }
  document.getElementById("btnSaveLabel").textContent = "Save Changes";

  document.getElementById("btnMarkAvailable").style.display =
    entry.status === "limited" ? "block" : "none";
  document.getElementById("btnDelete").style.display = "block";
  document.getElementById("inputTokenUsed").value  = entry.tokenUsed  != null ? entry.tokenUsed  : "";
  document.getElementById("inputTokenTotal").value = entry.tokenTotal != null ? entry.tokenTotal : "";
  document.getElementById("inputTokenUnit").value  = entry.tokenUnit  || "";

  renderPresetGrid();
  selectPreset(entry.presetId, true); // keepUrl=true: don't override entry's saved URL

  // After selectPreset (which would reset the URL), restore entry's toolUrl and show its dropdown
  document.getElementById("inputToolUrl").value = entry.toolUrl || "";
  renderUrlDropdown(entry.presetId);

  if (entry.resetAt) {
    const dt = new Date(entry.resetAt);
    let h = dt.getHours();
    const m = dt.getMinutes();
    const mm = String(m).padStart(2, "0");
    // Always show as HH:MM (24h) in the field
    document.getElementById("inputResetHHMM").value = `${String(h).padStart(2,"0")}:${mm}`;
    document.getElementById("btnAmPm").style.display = "none";
    setStrategy("manual");
  } else {
    document.getElementById("inputResetHHMM").value = "";
    document.getElementById("btnAmPm").style.display = "none";
    setStrategy("auto");
  }

  showView("viewForm");
}

// ── Strategy toggle ─────────────────────────────────────────────────────
// ── HH:MM time input logic ──────────────────────────────────────────────
// Returns a timestamp (ms) for today at the given time, or tomorrow if time has passed.
// If input is HH:MM (hour 0-23, e.g. "14:30") → treated as 24h, AM/PM button hidden.
// If input is H:MM or h:mm (hour 1-12) → AM/PM button shown, user can toggle.
let ampmState = "PM"; // default assumption

function parseHHMMInput() {
  const val = document.getElementById("inputResetHHMM").value.trim();
  const match = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (m < 0 || m > 59) return null;

  const isUnambiguous24h = (h >= 0 && h <= 23) && val.length === 5; // HH:MM padded
  const isExplicit24h = h >= 13 && h <= 23; // definitely PM in 24h

  if (isExplicit24h || (val.length === 5 && h === 0)) {
    // 24h unambiguous: use as-is, hide AM/PM
    document.getElementById("btnAmPm").style.display = "none";
  } else if (h >= 1 && h <= 12) {
    // Ambiguous 12h format: show AM/PM button
    document.getElementById("btnAmPm").style.display = "";
    document.getElementById("btnAmPm").textContent = ampmState;
    // Convert to 24h based on ampmState
    if (ampmState === "PM" && h !== 12) h += 12;
    if (ampmState === "AM" && h === 12) h = 0;
  } else {
    return null;
  }

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  // If time has passed today, schedule for tomorrow
  if (target.getTime() <= Date.now()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

function onHHMMKeydown(e) {
  const input = document.getElementById("inputResetHHMM");
  const val = input.value;
  const pos = input.selectionStart;
  // Backspace at position 3 (right after colon, MM is empty) or position 2 → clear entire field
  if (e.key === "Backspace") {
    const colonIdx = val.indexOf(":");
    if (colonIdx !== -1 && pos <= colonIdx + 1 && val.slice(colonIdx + 1) === "") {
      // MM side is empty, backspace clears everything
      e.preventDefault();
      input.value = "";
      document.getElementById("btnAmPm").style.display = "none";
    }
  }
}

function onHHMMInput() {
  const input = document.getElementById("inputResetHHMM");
  const val = input.value;

  // Auto-insert colon after 2 digits
  if (/^\d{2}$/.test(val)) {
    input.value = val + ":";
    // Move cursor to end
    input.setSelectionRange(3, 3);
    document.getElementById("btnAmPm").style.display = "none";
    return;
  }

  const match = val.match(/^(\d{1,2}):(\d{0,2})$/);
  if (!match) {
    document.getElementById("btnAmPm").style.display = "none";
    return;
  }

  // Only update AM/PM visibility when MM is fully entered
  if (match[2].length === 2) {
    const h = parseInt(match[1], 10);
    if (h >= 13 && h <= 23) {
      document.getElementById("btnAmPm").style.display = "none";
    } else if (h >= 0 && h <= 12) {
      document.getElementById("btnAmPm").style.display = "";
      document.getElementById("btnAmPm").textContent = ampmState;
    }
  } else {
    document.getElementById("btnAmPm").style.display = "none";
  }
}

function setStrategy(s) {
  resetStrategy = s;
  document.getElementById("stratAuto").classList.toggle("active", s === "auto");
  document.getElementById("stratManual").classList.toggle("active", s === "manual");
  document.getElementById("fieldAutoPreview").style.display  = s === "auto" ? "flex" : "none";
  document.getElementById("fieldManualTime").style.display   = s === "manual" ? "flex" : "none";
  if (s === "auto") updateAutoPreview();
}

// ── Save entry ──────────────────────────────────────────────────────────
function saveEntry() {
  if (!selectedPresetId) {
    const grid = document.getElementById("presetGrid");
    grid.style.outline = "1px solid rgba(226,75,74,0.6)";
    setTimeout(() => { grid.style.outline = "none"; }, 800);
    return;
  }

  const preset = getPreset(selectedPresetId);
  const name = selectedPresetId === "custom"
    ? (document.getElementById("inputCustomName").value.trim() || "Custom Tool")
    : preset.name;
  const note    = document.getElementById("inputNote").value.trim();
  const account = document.getElementById("inputAccount").value.trim();
  const toolUrl = document.getElementById("inputToolUrl").value.trim();
  const customIcon = selectedPresetId === "custom" ? selectedCustomIcon : undefined;
  const tokenUsed  = parseInt(document.getElementById("inputTokenUsed").value)  || 0;
  const tokenTotal = parseInt(document.getElementById("inputTokenTotal").value) || null;
  const tokenUnit  = document.getElementById("inputTokenUnit").value.trim() || "tokens";

  // If it's a new custom tool with a real name, save it to the preset library
  if (selectedPresetId === "custom" && name !== "Custom Tool") {
    const savedId = "saved_" + name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    addCustomToolPreset({
      id: savedId,
      name: name,
      icon: customIcon || "⚙️",
      color: "#888888",
      resetWindowMinutes: 60,
      notes: ""
    });
  }

  let resetAt;
  if (resetStrategy === "auto") {
    resetAt = computeAutoResetAt(selectedPresetId);
  } else {
    // Support both relative offset fields and HH:MM time input
    const hoursVal = parseInt(document.getElementById("inputOffsetHours").value) || 0;
    const minutesVal = parseInt(document.getElementById("inputOffsetMinutes").value) || 0;

    if (hoursVal > 0 || minutesVal > 0) {
      resetAt = Date.now() + (hoursVal * 60 + minutesVal) * 60 * 1000;
    } else {
      // Parse HH:MM input
      resetAt = parseHHMMInput();
      if (!resetAt) {
        document.getElementById("inputResetHHMM").focus();
        return;
      }
    }
    if (resetAt <= Date.now()) resetAt = null;
  }

  if (editingId) {
    try { chrome.runtime.sendMessage({ type: "CANCEL_ALARM", entryId: editingId }, () => { if (chrome.runtime.lastError) {} }); } catch(e) {}
    tools = tools.map(t => {
      if (t.entryId === editingId) {
        return { ...t, presetId: selectedPresetId, name, note, account, toolUrl, customIcon,
                 tokenUsed, tokenTotal, tokenUnit,
                 status: resetAt ? "limited" : "available", resetAt: resetAt || null };
      }
      return t;
    });
  } else {
    tools.unshift({
      entryId: genId(),
      presetId: selectedPresetId,
      name, note, account, toolUrl, customIcon,
      tokenUsed, tokenTotal, tokenUnit,
      status: resetAt ? "limited" : "available",
      resetAt: resetAt || null,
      createdAt: Date.now()
    });
  }

  // Save URL to per-preset history before saving tools
  if (toolUrl) {
    saveUrlToPresetHistory(selectedPresetId, toolUrl);
  }

  saveTools(() => {
    if (resetAt) {
      const entry = tools.find(t => editingId ? t.entryId === editingId : t.name === name);
      if (entry) {
        try {
          chrome.runtime.sendMessage({
            type: "SET_LIMIT",
            entry: { entryId: entry.entryId, name: entry.name, resetAt: entry.resetAt }
          }, () => { if (chrome.runtime.lastError) {} });
        } catch(e) {}
      }
    }
    activeTab = "all";
    document.querySelectorAll(".tab").forEach(t => {
      t.classList.toggle("active", t.dataset.tab === "all");
    });
    showView("viewList");
    renderList();
  });
}

// ── Mark available ──────────────────────────────────────────────────────
function markAvailable() {
  if (!editingId) return;
  try { chrome.runtime.sendMessage({ type: "CANCEL_ALARM", entryId: editingId }, () => { if (chrome.runtime.lastError) {} }); } catch(e) {}
  tools = tools.map(t =>
    t.entryId === editingId ? { ...t, status: "available", resetAt: null } : t
  );
  saveTools(() => { showView("viewList"); renderList(); });
}

// ── Delete entry ────────────────────────────────────────────────────────
function deleteEntry() {
  if (!editingId) return;
  try { chrome.runtime.sendMessage({ type: "CANCEL_ALARM", entryId: editingId }, () => { if (chrome.runtime.lastError) {} }); } catch(e) {}
  tools = tools.filter(t => t.entryId !== editingId);
  saveTools(() => { showView("viewList"); renderList(); });
}

// ── CSV helpers ─────────────────────────────────────────────────────────
// Columns exported to CSV (icon data URLs go into separate files in zip)
const CSV_COLS = [
  "entryId","presetId","name","account","note","status",
  "resetAt","createdAt","tokenUsed","tokenTotal","tokenUnit","customIcon","toolUrl"
];

function escCsv(v) {
  if (v == null) return "";
  const s = String(v);
  // Quote if contains comma, newline, or double-quote
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function rowToCsv(entry) {
  return CSV_COLS.map(col => {
    // Don't inline data URLs in CSV — they're stored as separate icon files
    if (col === "customIcon" && entry.customIcon && entry.customIcon.startsWith("data:")) {
      return escCsv("__iconfile__:" + entry.entryId);
    }
    return escCsv(entry[col]);
  }).join(",");
}

function parseCsvLine(line) {
  // Handles quoted fields, escaped quotes ("")
  const result = [];
  let inQuote = false, cur = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ",") { result.push(cur); cur = ""; }
      else { cur += ch; }
    }
  }
  result.push(cur);
  return result;
}

function csvToEntry(values) {
  const entry = {};
  CSV_COLS.forEach((col, i) => {
    const raw = values[i] !== undefined ? values[i] : "";
    // Numerics
    if (["resetAt","createdAt","tokenUsed","tokenTotal"].includes(col)) {
      entry[col] = raw === "" ? null : Number(raw);
    } else {
      entry[col] = raw === "" ? null : raw;
    }
  });
  // Ensure required fields
  if (!entry.entryId) entry.entryId = genId();
  if (!entry.status) entry.status = "available";
  // Don't restore __iconfile__ placeholder — will be replaced by actual icon data
  if (entry.customIcon && entry.customIcon.startsWith("__iconfile__:")) {
    entry.customIcon = null; // will be filled from zip icons/ folder
  }
  return entry;
}

// ── Export (ZIP: data.csv + icons/) ────────────────────────────────────
async function exportZip() {
  const btn = document.getElementById("btnExport");
  btn.textContent = "Packing…";
  btn.disabled = true;

  try {
    const zip = new JSZip();

    // 1. Build CSV
    const csvLines = [CSV_COLS.join(",")];
    tools.forEach(entry => csvLines.push(rowToCsv(entry)));
    zip.file("data.csv", csvLines.join("\n"));

    // 2. Pack icon files for entries with image icons
    const iconsFolder = zip.folder("icons");
    tools.forEach(entry => {
      if (entry.customIcon && entry.customIcon.startsWith("data:")) {
        // data URL → binary
        const [header, b64] = entry.customIcon.split(",");
        const mimeMatch = header.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : "image/png";
        const ext = mime.split("/")[1].replace("x-icon","ico").replace("vnd.microsoft.icon","ico").replace("svg+xml","svg") || "png";
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        iconsFolder.file(`${entry.entryId}.${ext}`, bytes, { binary: true });
      }
    });

    // 3. Also export customToolPresets with their icons
    const presetsJson = JSON.stringify(customToolPresets, null, 2);
    zip.file("custom_presets.json", presetsJson);
    customToolPresets.forEach(p => {
      if (p.icon && p.icon.startsWith("data:")) {
        const [header, b64] = p.icon.split(",");
        const mime = (header.match(/data:([^;]+)/) || [])[1] || "image/png";
        const ext = mime.split("/")[1].replace("x-icon","ico").replace("vnd.microsoft.icon","ico").replace("svg+xml","svg") || "png";
        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        iconsFolder.file(`preset_${p.id}.${ext}`, bytes, { binary: true });
      }
    });

    // 4. Export presetUrls (URL history per preset)
    zip.file("preset_urls.json", JSON.stringify(presetUrls, null, 2));

    // 5. Generate and download
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `ai-limit-tracker-${ts}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("Exported successfully ✓");
  } catch(err) {
    console.error("Export error:", err);
    showToast("Export failed: " + err.message, true);
  } finally {
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 11V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M4 6l4-5 4 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 14h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg> Export`;
    btn.disabled = false;
  }
}

// ── Import (ZIP: data.csv + icons/) ────────────────────────────────────
async function importZip(file) {
  const label = document.getElementById("btnImportLabel");
  label.style.opacity = "0.5";
  label.style.pointerEvents = "none";

  try {
    const zip = await JSZip.loadAsync(file);

    // 1. Read CSV
    const csvFile = zip.file("data.csv");
    if (!csvFile) throw new Error("data.csv not found in ZIP");
    const csvText = await csvFile.async("string");

    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new Error("CSV is empty");

    // Parse header to build column index map (forward-compatible)
    const header = parseCsvLine(lines[0]);
    const colIdx = {};
    header.forEach((col, i) => { colIdx[col.trim()] = i; });

    // Build entries using column map
    const imported = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine(lines[i]);
      if (vals.length < 2) continue;
      const entry = {};
      CSV_COLS.forEach(col => {
        const idx = colIdx[col];
        const raw = idx !== undefined && vals[idx] !== undefined ? vals[idx] : "";
        if (["resetAt","createdAt","tokenUsed","tokenTotal"].includes(col)) {
          entry[col] = raw === "" ? null : Number(raw);
        } else {
          entry[col] = raw === "" ? null : raw;
        }
      });
      if (!entry.entryId) entry.entryId = genId();
      if (!entry.status) entry.status = "available";
      imported.push(entry);
    }

    // 2. Restore icons from icons/ folder
    const iconFiles = [];
    zip.folder("icons").forEach((relPath, zipEntry) => {
      iconFiles.push({ relPath, zipEntry });
    });

    for (const { relPath, zipEntry } of iconFiles) {
      const b64 = await zipEntry.async("base64");
      const ext = relPath.split(".").pop().toLowerCase();
      const mimeMap = { ico:"image/x-icon", png:"image/png", jpg:"image/jpeg",
                        jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp", svg:"image/svg+xml" };
      const mime = mimeMap[ext] || "image/png";
      const dataUrl = `data:${mime};base64,${b64}`;

      if (relPath.startsWith("preset_")) {
        // Will be handled by custom_presets.json below
        continue;
      }
      // Match entryId from filename (e.g. "abc123.png")
      const entryId = relPath.replace(/\.[^.]+$/, "");
      const entry = imported.find(e => e.entryId === entryId);
      if (entry) {
        entry.customIcon = dataUrl;
      }
    }

    // 3. Restore custom presets + their icons
    const presetsFile = zip.file("custom_presets.json");
    if (presetsFile) {
      const presetsJson = await presetsFile.async("string");
      const importedPresets = JSON.parse(presetsJson);

      // Re-attach icons for presets
      for (const { relPath, zipEntry } of iconFiles) {
        if (!relPath.startsWith("preset_")) continue;
        const presetId = relPath.replace(/^preset_/, "").replace(/\.[^.]+$/, "");
        const ext = relPath.split(".").pop().toLowerCase();
        const mimeMap = { ico:"image/x-icon", png:"image/png", jpg:"image/jpeg",
                          jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp", svg:"image/svg+xml" };
        const mime = mimeMap[ext] || "image/png";
        const b64 = await zipEntry.async("base64");
        const preset = importedPresets.find(p => p.id === presetId);
        if (preset) preset.icon = `data:${mime};base64,${b64}`;
      }

      // Merge: imported presets override existing ones with same id
      const merged = [...customToolPresets];
      importedPresets.forEach(p => {
        const idx = merged.findIndex(x => x.id === p.id);
        if (idx >= 0) merged[idx] = p; else merged.unshift(p);
      });
      customToolPresets = merged;
      await saveCustomToolPresets();
    }

    // 4. Restore presetUrls (URL history) — merge, imported wins per presetId
    const presetUrlsFile = zip.file("preset_urls.json");
    if (presetUrlsFile) {
      const importedPresetUrls = JSON.parse(await presetUrlsFile.async("string"));
      // Merge: for each presetId, combine lists, deduplicate, keep most recent first, cap 10
      Object.entries(importedPresetUrls).forEach(([pid, urls]) => {
        const existing = presetUrls[pid] || [];
        const merged = [...urls, ...existing.filter(u => !urls.includes(u))].slice(0, 10);
        presetUrls[pid] = merged;
      });
      chrome.storage.local.set({ presetUrls });
    }

    // 5. Merge with existing tools (imported entries override by entryId)
    const merged = [...tools];
    imported.forEach(imp => {
      const idx = merged.findIndex(t => t.entryId === imp.entryId);
      if (idx >= 0) merged[idx] = imp; else merged.unshift(imp);
    });
    tools = merged;

    await new Promise(resolve => saveTools(resolve));
    renderList();
    showToast(`Imported ${imported.length} entries ✓`);

  } catch(err) {
    console.error("Import error:", err);
    showToast("Import failed: " + err.message, true);
  } finally {
    label.style.opacity = "";
    label.style.pointerEvents = "";
  }
}

// ── Toast notification ──────────────────────────────────────────────────
function showToast(msg, isError = false) {
  let toast = document.getElementById("importExportToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "importExportToast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = "ie-toast" + (isError ? " error" : "");
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 3000);
}

// ── Init ────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadTools(() => {
    renderPresetGrid();
    renderList();
    showView("viewList");
  });

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      renderList();
    });
  });

  document.getElementById("btnAdd").addEventListener("click", openNew);
  document.getElementById("btnAddFirst").addEventListener("click", openNew);
  document.getElementById("btnBack").addEventListener("click", () => {
    showView("viewList"); renderList();
  });

  document.getElementById("stratAuto").addEventListener("click", () => setStrategy("auto"));
  document.getElementById("stratManual").addEventListener("click", () => setStrategy("manual"));
  document.getElementById("btnSave").addEventListener("click", saveEntry);

  document.getElementById("inputCustomIcon").addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (val) setCustomIcon(val);
  });

  // .ico / image file upload for custom icon
  document.getElementById("iconFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleIconFileUpload(file);
    e.target.value = ""; // reset so same file can be picked again
  });

  // HH:MM time input
  document.getElementById("inputResetHHMM").addEventListener("input", onHHMMInput);
  document.getElementById("inputResetHHMM").addEventListener("keydown", onHHMMKeydown);
  document.getElementById("btnAmPm").addEventListener("click", () => {
    ampmState = ampmState === "PM" ? "AM" : "PM";
    document.getElementById("btnAmPm").textContent = ampmState;
  });

  document.getElementById("btnMarkAvailable").addEventListener("click", markAvailable);
  document.getElementById("btnDelete").addEventListener("click", deleteEntry);

  // Tool URL input: show dropdown on focus/click
  const urlInput = document.getElementById("inputToolUrl");
  urlInput.addEventListener("focus", () => {
    if (selectedPresetId) renderUrlDropdown(selectedPresetId);
  });
  urlInput.addEventListener("click", () => {
    if (selectedPresetId) renderUrlDropdown(selectedPresetId);
  });
  // Close dropdown when clicking outside
  document.addEventListener("mousedown", (e) => {
    const dropdown = document.getElementById("urlDropdown");
    if (dropdown && !dropdown.contains(e.target) && e.target !== urlInput) {
      dropdown.remove();
    }
  });

  // Export / Import
  document.getElementById("btnExport").addEventListener("click", exportZip);
  document.getElementById("csvImportInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) importZip(file);
    e.target.value = "";
  });
});
