# AI Limit Tracker

> Track your AI tool rate limits — get notified the moment they reset.

![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-Compatible-0078D4?style=flat-square&logo=microsoftedge&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Overview

If you use multiple AI tools daily (Claude, ChatGPT, Gemini, Cursor…), you've probably hit a rate limit mid-conversation — then lost track of when it resets. **AI Limit Tracker** sits in your browser toolbar and gives you a live countdown for every tool, with a desktop notification the moment you can use it again.

---

## Features

**🔔 Smart reset countdown**  
Each entry shows a live countdown to when the limit resets. When the timer hits zero, a browser notification fires automatically.

**⚡ Preset library**  
Built-in presets for 11 popular AI tools with accurate reset windows based on each platform's published rate limit policy:

| Tool | Provider | Reset Window |
|------|----------|-------------|
| Claude Pro | Anthropic | ~8 hours |
| Claude Opus | Anthropic | ~8 hours |
| ChatGPT Plus (GPT-4o) | OpenAI | 3 hours |
| ChatGPT o1/o3 | OpenAI | Daily |
| Gemini Advanced | Google | Daily |
| Perplexity Pro | Perplexity AI | ~4 hours |
| Grok Premium+ | xAI | 2 hours |
| Mistral Le Chat Pro | Mistral AI | Daily |
| GitHub Copilot Chat | GitHub / Microsoft | Hourly |
| Cursor Pro | Cursor | Monthly |
| Poe Subscriber | Quora | Daily |
| Custom Tool | — | Configurable |

**🔗 Quick-open links**  
Attach a URL to any entry. Click the card to open the AI tool in a new tab instantly. Right-click to edit.

**📋 Per-preset URL history**  
URLs you've entered are remembered per preset. A dropdown appears when editing, so you can switch between accounts in one click — with an × button to remove old entries.

**🖼️ Custom tool support**  
Add any AI tool not in the preset list. Choose an emoji or upload a icon.

**📊 Token usage tracking**  
Log token consumption per entry (supports tokens, K, M units) to track usage alongside rate limits.

**💾 Export / Import**  
Back up and restore all your entries as a ZIP file containing a CSV and `preset_urls.json`. Useful for syncing between machines.

**🟢 Live badge**  
The toolbar icon shows how many tools are currently available — at a glance, without opening the popup.

---

## Installation

This extension is not on the Chrome Web Store. Install it manually in developer mode:

1. Download the latest ZIP from [Releases](../../releases) and unzip it
2. Open `chrome://extensions` (or `edge://extensions` for Edge)
3. Enable **Developer mode** (toggle, top-right)
4. Click **Load unpacked** → select the `ai-limit-tracker` folder
5. The extension icon appears in your toolbar

---

## How to use

1. Click the toolbar icon to open the tracker
2. Hit **＋ New** to add an AI tool — pick a preset or create a custom one
3. When you hit a rate limit, open the tracker and tap the entry → **Set Limited**
4. A countdown starts. You'll get a desktop notification when the limit resets
5. Click any card to open that AI tool directly in a new tab

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Microsoft Edge | ✅ Full support |
| Brave / Opera / Vivaldi | ✅ Full support (Chromium-based) |
| Firefox | ❌ Not supported |
| Safari | ❌ Not supported |

---

## Tech Stack

- **Vanilla JS** — no frameworks, no build step
- **Chrome Extension Manifest V3** — service worker, alarms API, storage API
- **JSZip** — client-side ZIP export/import

---

## License

MIT
