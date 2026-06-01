// AI Tool presets — reset windows based on published policies (as of 2025)
// resetWindowMinutes: how long until the limit resets after hitting it
// source: each platform's published rate limit documentation

const AI_TOOL_PRESETS = [
  {
    id: "claude_pro",
    name: "Claude Pro",
    provider: "Anthropic",
    resetWindowMinutes: 480, // ~8 hours rolling window
    color: "#CC785C",
    url: "https://claude.ai",
    notes: "Usage-based, resets every ~8h depending on model"
  },
  {
    id: "claude_opus",
    name: "Claude Opus",
    provider: "Anthropic",
    resetWindowMinutes: 480,
    color: "#B5651D",
    url: "https://claude.ai",
    notes: "Stricter than Sonnet — often resets in 8h"
  },
  {
    id: "chatgpt_plus",
    name: "ChatGPT Plus (GPT-4o)",
    provider: "OpenAI",
    resetWindowMinutes: 180, // 3-hour window, ~80 msgs
    color: "#10A37F",
    url: "https://chatgpt.com",
    notes: "~80 messages per 3 hours for GPT-4o"
  },
  {
    id: "chatgpt_o1",
    name: "ChatGPT o1/o3",
    provider: "OpenAI",
    resetWindowMinutes: 1440, // daily cap
    color: "#1DB954",
    url: "https://chatgpt.com",
    notes: "o1/o3 models have daily message cap"
  },
  {
    id: "gemini_advanced",
    name: "Gemini Advanced",
    provider: "Google",
    resetWindowMinutes: 1440, // daily reset
    color: "#4285F4",
    url: "https://gemini.google.com",
    notes: "Daily usage cap, resets at midnight UTC"
  },
  {
    id: "perplexity_pro",
    name: "Perplexity Pro",
    provider: "Perplexity AI",
    resetWindowMinutes: 240, // 4h for Pro Search
    color: "#20B2AA",
    url: "https://perplexity.ai",
    notes: "Pro Search: ~300/day, spaced ~4h windows"
  },
  {
    id: "grok_premium",
    name: "Grok (Premium+)",
    provider: "xAI",
    resetWindowMinutes: 120, // 2h rolling
    color: "#E7E9EA",
    url: "https://x.com/i/grok",
    notes: "~25 messages per 2 hours for Grok 3"
  },
  {
    id: "mistral_le_chat",
    name: "Mistral Le Chat Pro",
    provider: "Mistral AI",
    resetWindowMinutes: 1440,
    color: "#FF7000",
    url: "https://chat.mistral.ai",
    notes: "Daily generation limits on Pro plan"
  },
  {
    id: "copilot",
    name: "GitHub Copilot Chat",
    provider: "GitHub / Microsoft",
    resetWindowMinutes: 60, // hourly rolling
    color: "#6E40C9",
    url: "https://github.com/copilot",
    notes: "Hourly request limits for chat completions"
  },
  {
    id: "cursor_pro",
    name: "Cursor Pro (fast)",
    provider: "Cursor",
    resetWindowMinutes: 43200, // monthly cap
    color: "#F5A623",
    url: "https://cursor.com",
    notes: "500 fast requests/month, then slow mode"
  },
  {
    id: "poe_subscriber",
    name: "Poe Subscriber",
    provider: "Quora",
    resetWindowMinutes: 1440, // daily points
    color: "#9B59B6",
    url: "https://poe.com",
    notes: "Daily point allowance, resets each day"
  },
  {
    id: "custom",
    name: "Custom Tool",
    provider: "Custom",
    resetWindowMinutes: 60,
    color: "#888888",
    url: "",
    notes: ""
  }
];
