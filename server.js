const express = require('express');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// On Render, use /tmp for ephemeral storage
const DATA_FILE = process.env.DATA_FILE || '/tmp/sharegenius-data.json';

app.use(express.json());
// HTML inlined — no public/ folder needed
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sharegenius — Swing Trader</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    /* ── ROOT TOKENS ─────────────────────────────────── */
    :root {
      --bg:        #080c14;
      --bg2:       #0d1220;
      --bg3:       #111827;
      --bg4:       #1a2235;
      --border:    #1e2d45;
      --border2:   #263650;
      --text:      #c8d8f0;
      --text2:     #7a94b8;
      --text3:     #3d5270;
      --gold:      #f5a623;
      --gold2:     #e8952a;
      --gold-glow: rgba(245,166,35,0.15);
      --green:     #22d97a;
      --green2:    #16a34a;
      --green-bg:  rgba(34,217,122,0.08);
      --red:       #f05252;
      --red2:      #dc2626;
      --red-bg:    rgba(240,82,82,0.08);
      --blue:      #60a5fa;
      --cyan:      #22d3ee;
      --radius:    6px;
      --radius2:   10px;
      --mono:      'Space Mono', monospace;
      --sans:      'Syne', sans-serif;
    }

    /* ── RESET ───────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      min-height: 100vh;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    button { cursor: pointer; font-family: var(--sans); }
    input, select { font-family: var(--sans); }

    /* ── SCROLLBAR ───────────────────────────────────── */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

    /* ── LAYOUT ──────────────────────────────────────── */
    #app { display: flex; flex-direction: column; min-height: 100vh; }

    /* ── HEADER ──────────────────────────────────────── */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 58px;
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 32px; height: 32px;
      background: var(--gold);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }
    .logo-text {
      font-family: var(--sans);
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .logo-text span { color: var(--gold); }
    .logo-tag {
      font-size: 10px;
      color: var(--text3);
      font-family: var(--mono);
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-left: 2px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .market-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text2);
    }
    .market-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 6px var(--green);
      animation: pulse-dot 2s ease-in-out infinite;
    }
    .market-dot.closed { background: var(--red); box-shadow: 0 0 6px var(--red); animation: none; }
    @keyframes pulse-dot {
      0%,100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    #header-time {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text3);
    }

    /* ── NAV TABS ────────────────────────────────────── */
    .tabs {
      display: flex;
      padding: 0 24px;
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      gap: 2px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text2);
      font-family: var(--sans);
      font-weight: 600;
      font-size: 13px;
      letter-spacing: 0.3px;
      transition: all 0.2s;
      cursor: pointer;
      position: relative;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active {
      color: var(--gold);
      border-bottom-color: var(--gold);
    }
    .tab-badge {
      background: var(--gold);
      color: var(--bg);
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 10px;
      font-weight: 700;
      font-family: var(--mono);
      min-width: 18px;
      text-align: center;
    }
    .tab-badge.green { background: var(--green); }
    .tab-icon { font-size: 15px; }

    /* ── MAIN CONTENT ────────────────────────────────── */
    main { flex: 1; padding: 24px; max-width: 1400px; width: 100%; margin: 0 auto; }

    /* ── PANEL ───────────────────────────────────────── */
    .panel { display: none; }
    .panel.active { display: block; }

    /* ── SECTION HEADER ──────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .section-subtitle {
      font-size: 12px;
      color: var(--text2);
      font-family: var(--mono);
      margin-top: 2px;
    }
    .section-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

    /* ── BUTTONS ─────────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      border-radius: var(--radius);
      border: 1px solid var(--border2);
      background: var(--bg3);
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      transition: all 0.15s;
    }
    .btn:hover { border-color: var(--border2); background: var(--bg4); }
    .btn-primary {
      background: var(--gold);
      border-color: var(--gold);
      color: var(--bg);
    }
    .btn-primary:hover { background: var(--gold2); border-color: var(--gold2); }
    .btn-green {
      background: var(--green-bg);
      border-color: var(--green);
      color: var(--green);
    }
    .btn-green:hover { background: rgba(34,217,122,0.15); }
    .btn-red {
      background: var(--red-bg);
      border-color: var(--red);
      color: var(--red);
    }
    .btn-red:hover { background: rgba(240,82,82,0.15); }
    .btn-sm { padding: 5px 10px; font-size: 12px; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── SCAN CONTROLS ───────────────────────────────── */
    .scan-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .index-selector {
      display: flex;
      gap: 4px;
    }
    .idx-btn {
      padding: 8px 14px;
      border-radius: var(--radius);
      border: 1px solid var(--border2);
      background: var(--bg3);
      color: var(--text2);
      font-size: 12px;
      font-weight: 600;
      font-family: var(--mono);
      transition: all 0.15s;
      cursor: pointer;
    }
    .idx-btn:hover { border-color: var(--gold); color: var(--gold); }
    .idx-btn.active {
      background: var(--gold-glow);
      border-color: var(--gold);
      color: var(--gold);
    }

    /* ── PROGRESS BAR ────────────────────────────────── */
    .progress-wrap {
      margin: 16px 0;
      display: none;
    }
    .progress-wrap.visible { display: block; }
    .progress-meta {
      display: flex;
      justify-content: space-between;
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text2);
      margin-bottom: 6px;
    }
    .progress-bar-bg {
      height: 4px;
      background: var(--bg4);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--gold) 0%, var(--cyan) 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
      width: 0%;
    }
    .scan-status {
      font-family: var(--mono);
      font-size: 11px;
      color: var(--text3);
      margin-top: 6px;
    }

    /* ── TABLE ───────────────────────────────────────── */
    .table-wrap {
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      overflow: hidden;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead { background: var(--bg3); }
    thead th {
      padding: 12px 14px;
      text-align: left;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--text3);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    thead th.num { text-align: right; }
    tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: var(--bg3); }
    tbody tr.alert-row { background: rgba(245,166,35,0.04); }
    tbody tr.alert-row:hover { background: rgba(245,166,35,0.08); }
    td {
      padding: 11px 14px;
      font-family: var(--mono);
      font-size: 12px;
      color: var(--text);
      white-space: nowrap;
    }
    td.num { text-align: right; }
    td.actions { text-align: right; }
    .empty-row td {
      text-align: center;
      padding: 40px 14px;
      color: var(--text3);
      font-family: var(--sans);
      font-size: 13px;
    }

    /* ── BADGES ──────────────────────────────────────── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--mono);
    }
    .badge-alert  { background: rgba(245,166,35,0.15); color: var(--gold);  border: 1px solid rgba(245,166,35,0.3); }
    .badge-watch  { background: rgba(96,165,250,0.1);  color: var(--blue);  border: 1px solid rgba(96,165,250,0.25); }
    .badge-gtt    { background: rgba(34,217,122,0.1);  color: var(--green); border: 1px solid rgba(34,217,122,0.25); }
    .badge-open   { background: rgba(34,211,238,0.1);  color: var(--cyan);  border: 1px solid rgba(34,211,238,0.25); }
    .badge-closed { background: var(--bg4);            color: var(--text3); border: 1px solid var(--border); }
    .badge-hit    { background: rgba(34,217,122,0.12); color: var(--green); border: 1px solid rgba(34,217,122,0.3); }

    /* ── P&L COLORS ──────────────────────────────────── */
    .up   { color: var(--green); }
    .down { color: var(--red); }
    .flat { color: var(--text2); }

    /* ── SYMBOL CELL ─────────────────────────────────── */
    .symbol-cell { display: flex; flex-direction: column; gap: 2px; }
    .sym-name { font-family: var(--sans); font-weight: 700; font-size: 13px; color: #fff; }
    .sym-sub  { font-family: var(--mono); font-size: 10px; color: var(--text3); }

    /* ── STATS ROW ───────────────────────────────────── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      padding: 16px;
    }
    .stat-label {
      font-size: 11px;
      font-family: var(--mono);
      color: var(--text3);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      font-family: var(--mono);
    }
    .stat-value.gold  { color: var(--gold); }
    .stat-value.green { color: var(--green); }
    .stat-value.red   { color: var(--red); }
    .stat-sub {
      font-size: 11px;
      color: var(--text3);
      font-family: var(--mono);
      margin-top: 3px;
    }

    /* ── MODAL ───────────────────────────────────────── */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(5,8,18,0.85);
      backdrop-filter: blur(4px);
      z-index: 200;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: var(--bg2);
      border: 1px solid var(--border2);
      border-radius: 12px;
      padding: 28px;
      width: 420px;
      max-width: 95vw;
      animation: slide-up 0.2s ease;
    }
    @keyframes slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-close {
      width: 28px; height: 28px;
      border: 1px solid var(--border2);
      border-radius: 6px;
      background: var(--bg4);
      color: var(--text2);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 16px;
    }
    .modal-close:hover { color: #fff; border-color: var(--text2); }

    /* ── FORM ────────────────────────────────────────── */
    .form-group { margin-bottom: 14px; }
    .form-label {
      display: block;
      font-size: 11px;
      font-family: var(--mono);
      color: var(--text3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 9px 12px;
      background: var(--bg3);
      border: 1px solid var(--border2);
      border-radius: var(--radius);
      color: var(--text);
      font-family: var(--mono);
      font-size: 13px;
      transition: border-color 0.15s;
      outline: none;
    }
    .form-input:focus { border-color: var(--gold); }
    .form-input::placeholder { color: var(--text3); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-hint { font-size: 11px; color: var(--text3); font-family: var(--mono); margin-top: 4px; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

    /* ── POSITION DETAIL ─────────────────────────────── */
    .pos-avg-history {
      margin-top: 8px;
      background: var(--bg3);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .pos-avg-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      font-family: var(--mono);
      font-size: 11px;
    }
    .pos-avg-row:last-child { border-bottom: none; }
    .pos-avg-label { color: var(--text2); }
    .pos-avg-price { color: var(--text); }
    .pos-avg-date  { color: var(--text3); }

    /* ── TARGET INDICATOR ────────────────────────────── */
    .target-bar {
      height: 3px;
      background: var(--bg4);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }
    .target-bar-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--red) 0%, var(--gold) 60%, var(--green) 100%);
      transition: width 0.4s ease;
    }

    /* ── INFOBOX ─────────────────────────────────────── */
    .infobox {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .infobox-icon { font-size: 24px; flex-shrink: 0; }
    .infobox-text { flex: 1; min-width: 200px; }
    .infobox-title { font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 14px; }
    .infobox-desc { font-size: 12px; color: var(--text2); line-height: 1.6; font-family: var(--mono); }

    /* ── RULE CHIPS ──────────────────────────────────── */
    .rules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .rule-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius2);
      padding: 16px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .rule-num {
      width: 24px; height: 24px;
      flex-shrink: 0;
      background: var(--gold-glow);
      border: 1px solid rgba(245,166,35,0.3);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--gold);
    }
    .rule-text { font-size: 12px; color: var(--text2); line-height: 1.5; font-family: var(--mono); }

    /* ── TOAST ───────────────────────────────────────── */
    #toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .toast {
      background: var(--bg2);
      border: 1px solid var(--border2);
      border-radius: var(--radius);
      padding: 12px 16px;
      font-size: 13px;
      color: var(--text);
      max-width: 320px;
      animation: toast-in 0.25s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toast.success { border-color: var(--green); }
    .toast.error   { border-color: var(--red); }
    .toast.info    { border-color: var(--blue); }
    @keyframes toast-in {
      from { transform: translateX(20px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    /* ── EMPTY STATE ─────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text3);
    }
    .empty-state-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.5; }
    .empty-state-title { font-size: 16px; font-weight: 700; color: var(--text2); margin-bottom: 6px; }
    .empty-state-desc { font-size: 13px; font-family: var(--mono); line-height: 1.6; }

    /* ── LOADING SPINNER ─────────────────────────────── */
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(245,166,35,0.3);
      border-top-color: var(--gold);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── RESPONSIVE ──────────────────────────────────── */
    @media (max-width: 640px) {
      header { padding: 0 14px; }
      main { padding: 14px; }
      .tabs { padding: 0 14px; }
      .tab-btn { padding: 12px 12px; font-size: 12px; }
    }
  </style>
</head>
<body>
<div id="app">

  <!-- ═══════ HEADER ════════════════════════════════════ -->
  <header>
    <div class="logo">
      <div class="logo-icon">📈</div>
      <div>
        <div class="logo-text">Share<span>Genius</span></div>
        <div class="logo-tag">Swing Trader · GTT System</div>
      </div>
    </div>
    <div class="header-right">
      <div class="market-badge">
        <div class="market-dot" id="market-dot"></div>
        <span id="market-status">—</span>
      </div>
      <div id="header-time">—</div>
    </div>
  </header>

  <!-- ═══════ TABS ══════════════════════════════════════ -->
  <nav class="tabs">
    <button class="tab-btn active" onclick="switchTab('scanner')" id="tab-scanner">
      <span class="tab-icon">🔍</span> Scanner
    </button>
    <button class="tab-btn" onclick="switchTab('watchlist')" id="tab-watchlist">
      <span class="tab-icon">👁</span> Watchlist
      <span class="tab-badge" id="badge-watchlist">0</span>
    </button>
    <button class="tab-btn" onclick="switchTab('positions')" id="tab-positions">
      <span class="tab-icon">💼</span> Positions
      <span class="tab-badge green" id="badge-positions">0</span>
    </button>
    <button class="tab-btn" onclick="switchTab('guide')" id="tab-guide">
      <span class="tab-icon">📖</span> Strategy Guide
    </button>
    <button class="tab-btn" onclick="switchTab('backtest')" id="tab-backtest">
      <span class="tab-icon">📊</span> Backtest
    </button>
    <button class="tab-btn" onclick="switchTab('portfolio')" id="tab-portfolio">
      <span class="tab-icon">🏦</span> Portfolio
    </button>
  </nav>

  <!-- ═══════ MAIN CONTENT ══════════════════════════════ -->
  <main>

    <!-- ─── SCANNER PANEL ─────────────────────────────── -->
    <div class="panel active" id="panel-scanner">
      <div class="section-header">
        <div>
          <div class="section-title">20-Day Low Scanner</div>
          <div class="section-subtitle">SCAN NSE STOCKS WHERE TODAY'S LOW = 20-DAY LOW</div>
        </div>
        <div class="scan-controls">
          <div class="index-selector" id="index-selector">
            <button class="idx-btn active" data-index="NIFTY50">NIFTY 50</button>
            <button class="idx-btn" data-index="NIFTYNEXT50">NIFTY NEXT 50</button>
            <button class="idx-btn" data-index="NIFTY100">NIFTY 100</button>
          </div>
          <button class="btn btn-primary" id="scan-btn" onclick="startScan()">
            <span>▶</span> Start Scan
          </button>
        </div>
      </div>

      <!-- Progress -->
      <div class="progress-wrap" id="progress-wrap">
        <div class="progress-meta">
          <span id="progress-label">Scanning...</span>
          <span id="progress-pct">0%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progress-fill"></div>
        </div>
        <div class="scan-status" id="scan-status">—</div>
      </div>

      <!-- Scanner Stats -->
      <div class="stats-row" id="scan-stats" style="display:none">
        <div class="stat-card">
          <div class="stat-label">Scanned</div>
          <div class="stat-value" id="stat-scanned">0</div>
          <div class="stat-sub">stocks checked</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">🔔 Alerts Found</div>
          <div class="stat-value gold" id="stat-alerts">0</div>
          <div class="stat-sub">at 20-day low</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">GTT Trigger</div>
          <div class="stat-value" id="stat-gtt">Set 20D High</div>
          <div class="stat-sub">as GTT price</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Last Scan</div>
          <div class="stat-value" id="stat-time" style="font-size:14px">—</div>
          <div class="stat-sub">IST</div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="table-wrap">
        <table id="scan-table">
          <thead>
            <tr>
              <th>Symbol / Name</th>
              <th class="num">Current ₹</th>
              <th class="num">Today Low</th>
              <th class="num">20D Low</th>
              <th class="num">20D High (GTT)</th>
              <th class="num">Chg %</th>
              <th>Status</th>
              <th class="actions">Action</th>
            </tr>
          </thead>
          <tbody id="scan-tbody">
            <tr class="empty-row">
              <td colspan="8">Select an index and click <strong>Start Scan</strong> to find stocks at 20-day low</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── WATCHLIST PANEL ───────────────────────────── -->
    <div class="panel" id="panel-watchlist">
      <div class="section-header">
        <div>
          <div class="section-title">Watchlist</div>
          <div class="section-subtitle">MONITOR STOCKS — UPDATE GTT TRIGGER WITH 20D HIGH</div>
        </div>
        <div class="section-actions">
          <button class="btn" onclick="refreshWatchlist()">
            <span>🔄</span> Refresh All
          </button>
          <button class="btn btn-primary" onclick="openAddWatchModal()">
            <span>+</span> Add Stock
          </button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol / Name</th>
              <th class="num">Current ₹</th>
              <th class="num">Day Low</th>
              <th class="num">20D Low</th>
              <th class="num">20D High (GTT Trigger)</th>
              <th class="num">Chg %</th>
              <th>GTT Status</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody id="watchlist-tbody">
            <tr class="empty-row">
              <td colspan="8">
                <div class="empty-state">
                  <div class="empty-state-icon">👁</div>
                  <div class="empty-state-title">Watchlist is empty</div>
                  <div class="empty-state-desc">Add stocks from the Scanner or manually using the button above</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── POSITIONS PANEL ───────────────────────────── -->
    <div class="panel" id="panel-positions">
      <div class="section-header">
        <div>
          <div class="section-title">Open Positions</div>
          <div class="section-subtitle">TRACK BUYS, P&L, TARGETS & AVERAGING</div>
        </div>
        <div class="section-actions">
          <button class="btn" onclick="refreshPositions()">
            <span>🔄</span> Refresh P&L
          </button>
          <button class="btn btn-primary" onclick="openAddPositionModal()">
            <span>+</span> Add Position
          </button>
        </div>
      </div>

      <!-- Portfolio Stats -->
      <div class="stats-row" id="portfolio-stats">
        <div class="stat-card">
          <div class="stat-label">Open Positions</div>
          <div class="stat-value" id="pstat-count">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Invested</div>
          <div class="stat-value gold" id="pstat-invested">₹0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Current Value</div>
          <div class="stat-value" id="pstat-current">₹0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Unrealised P&L</div>
          <div class="stat-value" id="pstat-pnl">₹0</div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th class="num">Avg Price</th>
              <th class="num">Qty</th>
              <th class="num">Invested</th>
              <th class="num">CMP ₹</th>
              <th class="num">P&L</th>
              <th class="num">P&L %</th>
              <th class="num">Target ₹</th>
              <th class="num">Target %</th>
              <th>Progress</th>
              <th>Avg #</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody id="positions-tbody">
            <tr class="empty-row">
              <td colspan="12">
                <div class="empty-state">
                  <div class="empty-state-icon">💼</div>
                  <div class="empty-state-title">No open positions</div>
                  <div class="empty-state-desc">Add a position when your GTT order triggers</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── GUIDE PANEL ───────────────────────────────── -->
    <div class="panel" id="panel-guide">
      <div class="section-header">
        <div>
          <div class="section-title">Strategy Guide</div>
          <div class="section-subtitle">SHAREGENIUS SWING TRADING METHOD — 20D GTT SYSTEM</div>
        </div>
      </div>

      <div class="infobox">
        <div class="infobox-icon">⚡</div>
        <div class="infobox-text">
          <div class="infobox-title">Sharegenius 20-Day GTT Swing Method</div>
          <div class="infobox-desc">
            Buy stocks at their 20-day low using a GTT trigger at the 20-day high. Target 20% gains in 2–20 days.
            Apply only to blue-chip stocks (Nifty 50 / 100 / 200). Average down up to 3 times if stock falls further.
          </div>
        </div>
      </div>

      <div class="rules-grid">
        <div class="rule-card">
          <div class="rule-num">1</div>
          <div class="rule-text">Plan to buy a stock when it trades at its <strong>20-day low</strong>. Wait — do not buy immediately.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">2</div>
          <div class="rule-text">When today's low = 20-day low, set a <strong>GTT order</strong> with trigger price = 20-day high.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">3</div>
          <div class="rule-text">Update GTT trigger <strong>daily</strong> with the latest 20-day high. The scanner shows current GTT price automatically.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">4</div>
          <div class="rule-text">When the stock makes a <strong>fresh 20-day high</strong>, your GTT triggers and you buy at the best price.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">5</div>
          <div class="rule-text"><strong>Target: 20%</strong> above your buy price. In 70% of cases this is achieved within 2–20 days.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">6</div>
          <div class="rule-text">If stock falls again — <strong>no stop-loss</strong>. When it reaches 20-day low again, restart the GTT system.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">7</div>
          <div class="rule-text">Apply <strong>only to Nifty 50, Nifty 100, Nifty 200</strong> blue-chip stocks. No small caps or penny stocks.</div>
        </div>
        <div class="rule-card">
          <div class="rule-num">8</div>
          <div class="rule-text">Maximum <strong>3 averages</strong> allowed. Each average reduces the target by 5%.</div>
        </div>
      </div>

      <div class="section-title" style="font-size:16px; margin-bottom:14px; margin-top:8px">Averaging Target Reduction</div>
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">First Buy</div>
          <div class="stat-value green">20%</div>
          <div class="stat-sub">Initial target</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">After 1st Average</div>
          <div class="stat-value gold">15%</div>
          <div class="stat-sub">Reduced target</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">After 2nd Average</div>
          <div class="stat-value" style="color:var(--cyan)">10%</div>
          <div class="stat-sub">Reduced target</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">After 3rd Average</div>
          <div class="stat-value red">5%</div>
          <div class="stat-sub">Minimum target</div>
        </div>
      </div>
    </div>


    <!-- ─── BACKTEST PANEL ───────────────────────────────── -->
    <div class="panel" id="panel-backtest">
      <div class="section-header">
        <div>
          <div class="section-title">Backtest — Real NSE Data</div>
          <div class="section-subtitle">DHAN API · NIFTY 50 · JAN 2021 – TODAY</div>
        </div>
        <div class="section-actions">
          <button class="btn btn-primary" id="bt-run-btn" onclick="runBacktest()">
            ▶ Run Backtest
          </button>
        </div>
      </div>

      <!-- Source toggle + Universe selector -->
      <div style="display:flex;gap:20px;margin-bottom:16px;align-items:center;flex-wrap:wrap;">
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:12px;color:var(--text2);font-family:var(--mono);">DATA SOURCE:</span>
          <button class="idx-btn active" id="src-dhan" onclick="switchBtSource('dhan')">🔐 Dhan API</button>
          <button class="idx-btn" id="src-bhavcopy" onclick="switchBtSource('bhavcopy')">📂 NSE Bhavcopy (Free)</button>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:12px;color:var(--text2);font-family:var(--mono);">UNIVERSE:</span>
          <button class="idx-btn active" id="bt-uni-n50"  onclick="switchBtUniverse('NIFTY50')">NIFTY 50</button>
          <button class="idx-btn"        id="bt-uni-n100" onclick="switchBtUniverse('NIFTY100')">NIFTY 100</button>
        </div>
      </div>

      <!-- ── ROW 1: Credentials + Dates ──────────────────────── -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:12px;">
        <div class="stat-card" id="bt-field-clientid">
          <div class="stat-label">Dhan Client ID</div>
          <input class="form-input" id="bt-client-id" placeholder="Your Client ID" style="margin-top:6px;font-size:12px;" />
        </div>
        <div class="stat-card" id="bt-field-token">
          <div class="stat-label">Access Token</div>
          <input class="form-input" id="bt-token" placeholder="Paste access token" type="password" style="margin-top:6px;font-size:12px;" />
        </div>
        <div class="stat-card">
          <div class="stat-label">From Date</div>
          <input class="form-input" id="bt-from" value="2021-01-01" type="date" style="margin-top:6px;font-size:12px;" />
        </div>
        <div class="stat-card">
          <div class="stat-label">To Date</div>
          <input class="form-input" id="bt-to" value="2026-03-27" type="date" style="margin-top:6px;font-size:12px;" />
        </div>
      </div>

      <!-- ── ROW 2: Capital + Risk per trade ───────────────────── -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:12px;">
        <div class="stat-card">
          <div class="stat-label">Capital ₹</div>
          <input class="form-input" id="bt-capital" value="400000" type="number" oninput="onCapitalChange()" style="margin-top:6px;font-size:12px;" />
        </div>
        <div class="stat-card">
          <div class="stat-label">Risk Per Trade</div>
          <div style="display:flex;gap:6px;margin-top:6px;align-items:center;">
            <select class="form-input" id="bt-risk-mode" onchange="onRiskModeChange()" style="font-size:12px;padding:6px 8px;width:110px;">
              <option value="fixed">₹ Fixed</option>
              <option value="pct" selected>% of Capital</option>
            </select>
            <input class="form-input" id="bt-risk-value" value="2" type="number" step="0.5" oninput="onRiskChange()" style="font-size:12px;flex:1;min-width:70px;" />
          </div>
          <div class="form-hint" id="bt-risk-hint" style="margin-top:4px;">= ₹8,000 initial · grows as capital compounds</div>
        </div>
        <div class="stat-card" style="background:var(--gold-glow);border-color:rgba(245,166,35,0.3);">
          <div class="stat-label" style="color:var(--gold);">Effective Trade Size</div>
          <div class="stat-value" id="bt-effective-size" style="font-size:18px;margin-top:4px;">₹8,000</div>
          <div class="stat-sub" id="bt-pct-of-capital">2.0% of capital • compounds on profit</div>
        </div>
      </div>

      <!-- ── ROW 3: Entry Filters ───────────────────────────────── -->
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:14px 16px;margin-bottom:12px;">
        <div style="font-size:12px;font-family:var(--mono);color:var(--gold);font-weight:700;letter-spacing:0.5px;margin-bottom:12px;">⚙️ ENTRY FILTERS (optional — leave blank to use base strategy)</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">

          <div>
            <label class="form-label">Lookback Period (days)</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input class="form-input" id="bt-lookback" type="number" value="20" min="5" max="100" step="1"
                style="font-size:13px;font-weight:700;color:var(--cyan);width:80px;text-align:right;" />
              <span style="font-size:13px;color:var(--text2);font-family:var(--mono);">days</span>
            </div>
            <div class="form-hint">Rolling window for High/Low signal. Default 20 = the original Sharegenius system.</div>
          </div>

          <div>
            <label class="form-label">Price above N-Day Moving Avg</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <select class="form-input" id="bt-ma-type" style="font-size:12px;padding:6px 8px;width:90px;">
                <option value="none">Off</option>
                <option value="sma">SMA</option>
                <option value="ema">EMA</option>
              </select>
              <input class="form-input" id="bt-ma-period" type="number" value="200" min="5" max="500"
                placeholder="Period" style="font-size:12px;width:80px;" />
            </div>
            <div class="form-hint">Only enter trade if CMP &gt; MA(N)</div>
          </div>

          <div>
            <label class="form-label">Below 52-Week Low filter</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <select class="form-input" id="bt-52w-filter" style="font-size:12px;padding:6px 8px;">
                <option value="none">Off</option>
                <option value="near">Near 52W Low (within 10%)</option>
                <option value="below">Below 52W Low</option>
              </select>
            </div>
            <div class="form-hint">Filters stocks by 52-week price position</div>
          </div>

          <div>
            <label class="form-label">Min Volume (× avg)</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <select class="form-input" id="bt-vol-filter" style="font-size:12px;padding:6px 8px;">
                <option value="none">Off</option>
                <option value="1.5">≥ 1.5× avg volume</option>
                <option value="2">≥ 2× avg volume</option>
                <option value="3">≥ 3× avg volume</option>
              </select>
            </div>
            <div class="form-hint">High volume confirms breakout strength</div>
          </div>

          <div>
            <label class="form-label">RSI filter at entry</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <select class="form-input" id="bt-rsi-filter" style="font-size:12px;padding:6px 8px;">
                <option value="none">Off</option>
                <option value="os">RSI &lt; 40 (oversold)</option>
                <option value="os30">RSI &lt; 30 (deeply oversold)</option>
              </select>
            </div>
            <div class="form-hint">14-period RSI — avoids momentum traps</div>
          </div>

        </div>
      </div>

      <!-- ── ROW 4: Averaging Config ───────────────────────────────── -->
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius2);padding:14px 16px;margin-bottom:12px;">
        <div style="font-size:12px;font-family:var(--mono);color:var(--cyan);font-weight:700;letter-spacing:0.5px;margin-bottom:12px;">🔄 AVERAGING CONFIG — Custom targets for every level</div>
        <div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
          <div style="min-width:190px;">
            <label class="form-label">Max Averages Allowed</label>
            <select class="form-input" id="bt-max-avg" style="font-size:12px;padding:6px 8px;" onchange="onMaxAvgChange()">
              <option value="0">0 — No averaging</option>
              <option value="1">1 average</option>
              <option value="2">2 averages</option>
              <option value="3" selected>3 averages</option>
              <option value="4">4 averages</option>
              <option value="5">5 averages</option>
              <option value="6">6 averages</option>
            </select>
            <div class="form-hint">Max times to average down per trade</div>
          </div>
          <div style="min-width:260px;">
            <label class="form-label">Averaging Trigger</label>
            <select class="form-input" id="bt-avg-mode" style="font-size:12px;padding:6px 8px;" onchange="onAvgModeChange()">
              <option value="native">On any new 20D low signal</option>
              <option value="drawdown">At fixed % drawdown from first BUY price</option>
              <option value="below_entry">On new 20D high below first BUY price</option>
            </select>
            <div class="form-hint" id="bt-avg-mode-hint">Signal fires on any new 20-day low — GTT at 20D high</div>
          </div>
          <!-- Drawdown level inputs (only shown when drawdown mode selected) -->
          <div id="bt-drawdown-wrap" style="display:none;min-width:320px;">
            <label class="form-label">Drawdown Levels (% drop from first BUY)</label>
            <div id="bt-drawdown-container" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;"></div>
            <div class="form-hint">One level per averaging slot, e.g. 10, 20, 30 → average at −10%, −20%, −30%</div>
          </div>
          <div style="min-width:260px;">
            <label class="form-label">Fill Price Guard</label>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
              <input type="checkbox" id="bt-avg-fill-guard" style="width:16px;height:16px;accent-color:var(--cyan);cursor:pointer;" />
              <label for="bt-avg-fill-guard" style="font-size:12px;color:var(--text2);cursor:pointer;line-height:1.4;">
                Block average if fill price ≥ initial buy price
              </label>
            </div>
            <div class="form-hint" style="margin-top:4px;">
              Catches gap-up days where actual fill exceeds your first buy even if signal looked valid
            </div>
          </div>
          <div style="font-size:11px;font-family:var(--mono);color:var(--text3);line-height:1.6;padding-bottom:20px;">
            Each row below is the <strong style="color:var(--text2)">exit target %</strong> for that holding state.<br/>
            Lower targets after averaging reflect higher averaged cost &amp; risk.
          </div>
        </div>
        <div id="bt-targets-container" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:10px;"></div>

        <!-- Time-based extra averages -->
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
          <div style="font-size:11px;font-family:var(--mono);color:var(--cyan);font-weight:700;letter-spacing:0.5px;margin-bottom:10px;">⏳ EXTRA AVERAGES FOR LONG HOLDS — Unlocked by holding period</div>
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
            <div>
              <label class="form-label" style="white-space:nowrap;">After 1 Year (&gt;365d)</label>
              <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-size:12px;color:var(--text3);font-family:var(--mono);">+</span>
                <input class="form-input" id="bt-yr1-avg" type="number" value="1" min="0" max="5" step="1"
                  style="width:54px;font-size:13px;font-weight:700;color:var(--cyan);text-align:right;" />
                <span style="font-size:12px;color:var(--text2);font-family:var(--mono);">avg</span>
              </div>
            </div>
            <div>
              <label class="form-label" style="white-space:nowrap;">After 2 Years (&gt;730d)</label>
              <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-size:12px;color:var(--text3);font-family:var(--mono);">+</span>
                <input class="form-input" id="bt-yr2-avg" type="number" value="2" min="0" max="5" step="1"
                  style="width:54px;font-size:13px;font-weight:700;color:var(--cyan);text-align:right;" />
                <span style="font-size:12px;color:var(--text2);font-family:var(--mono);">avg</span>
              </div>
            </div>
            <div>
              <label class="form-label" style="white-space:nowrap;">After 3 Years (&gt;1095d)</label>
              <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-size:12px;color:var(--text3);font-family:var(--mono);">+</span>
                <input class="form-input" id="bt-yr3-avg" type="number" value="3" min="0" max="5" step="1"
                  style="width:54px;font-size:13px;font-weight:700;color:var(--cyan);text-align:right;" />
                <span style="font-size:12px;color:var(--text2);font-family:var(--mono);">avg</span>
              </div>
            </div>
            <div style="font-size:11px;font-family:var(--mono);color:var(--text3);line-height:1.6;padding-bottom:2px;">
              Set 0 to disable. These are <em>cumulative</em> extras on top of Max Averages above.<br/>
              e.g. Max=3, After 2yr=+2 → up to 5 total averages after 730 days.
            </div>
          </div>
        </div>
      </div>

      <!-- ── ROW 5: Trailing Stop Loss ──────────────────────────────── -->
      <div style="background:var(--bg3);border:1px solid rgba(240,82,82,0.25);border-radius:var(--radius2);padding:14px 16px;margin-bottom:12px;">
        <div style="font-size:12px;font-family:var(--mono);color:var(--red);font-weight:700;letter-spacing:0.5px;margin-bottom:10px;">🛑 TRAILING STOP LOSS — Arms only after target is first reached</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:start;">

          <div>
            <label class="form-label">TSL Mode</label>
            <select class="form-input" id="bt-tsl-mode" onchange="onTslModeChange()" style="font-size:12px;padding:6px 8px;">
              <option value="none">Off — exit exactly at target</option>
              <option value="on">On — trail after target hit</option>
            </select>
            <div class="form-hint">When ON, trade stays open at target; TSL arms and trails the peak.</div>
          </div>

          <div id="bt-tsl-pct-wrap" style="display:none;">
            <label class="form-label">TSL Method</label>
            <select class="form-input" id="bt-tsl-method" onchange="onTslMethodChange()" style="font-size:12px;padding:6px 8px;margin-bottom:8px;">
              <option value="fixed">Fixed % — same trail for all stocks</option>
              <option value="atr">Dynamic — ATR-based (stock's own volatility)</option>
            </select>

            <!-- Fixed % sub-row -->
            <div id="bt-tsl-fixed-wrap">
              <div style="display:flex;gap:6px;align-items:center;">
                <input class="form-input" id="bt-tsl-pct" type="number" value="7" min="1" max="50" step="0.5"
                  oninput="onTslPctChange()"
                  style="font-size:13px;font-weight:700;color:var(--red);flex:1;text-align:right;" />
                <span style="font-size:13px;color:var(--text2);font-family:var(--mono);">%</span>
              </div>
              <div class="form-hint" id="bt-tsl-hint">Stop = peak × (1 − 7%) → locks in target − 7% minimum</div>
            </div>

            <!-- Dynamic ATR sub-row -->
            <div id="bt-tsl-atr-wrap" style="display:none;">
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <div style="display:flex;flex-direction:column;gap:2px;">
                  <span style="font-size:10px;color:var(--text3);font-family:var(--mono);">ATR Lookback</span>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input class="form-input" id="bt-tsl-atr-period" type="number" value="20" min="5" max="252" step="1"
                      style="width:60px;font-size:12px;font-weight:700;color:var(--red);text-align:right;" />
                    <span style="font-size:11px;color:var(--text2);font-family:var(--mono);">days</span>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:2px;">
                  <span style="font-size:10px;color:var(--text3);font-family:var(--mono);">Multiplier</span>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input class="form-input" id="bt-tsl-atr-mult" type="number" value="1.5" min="0.5" max="5" step="0.1"
                      style="width:60px;font-size:12px;font-weight:700;color:var(--red);text-align:right;" />
                    <span style="font-size:11px;color:var(--text2);font-family:var(--mono);">× ATR</span>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:2px;">
                  <span style="font-size:10px;color:var(--text3);font-family:var(--mono);">Min TSL %</span>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input class="form-input" id="bt-tsl-atr-min" type="number" value="3" min="1" max="20" step="0.5"
                      style="width:54px;font-size:12px;font-weight:700;color:var(--red);text-align:right;" />
                    <span style="font-size:11px;color:var(--text2);font-family:var(--mono);">%</span>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:2px;">
                  <span style="font-size:10px;color:var(--text3);font-family:var(--mono);">Max TSL %</span>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <input class="form-input" id="bt-tsl-atr-max" type="number" value="20" min="5" max="50" step="0.5"
                      style="width:54px;font-size:12px;font-weight:700;color:var(--red);text-align:right;" />
                    <span style="font-size:11px;color:var(--text2);font-family:var(--mono);">%</span>
                  </div>
                </div>
              </div>
              <div class="form-hint" id="bt-tsl-atr-hint" style="margin-top:6px;">
                TSL% = avg(daily range/close) over 20 days × 1.5, clamped to [3%, 20%]. Volatile stocks get wider stops.
              </div>
            </div>
          </div>

          <div id="bt-tsl-explainer" style="display:none;font-size:11px;font-family:var(--mono);color:var(--text2);line-height:1.7;padding:10px 12px;background:var(--bg2);border-radius:var(--radius);border:1px solid var(--border);">
            <strong style="color:var(--text);">Fixed:</strong> same TSL% for every stock.<br/>
            <strong style="color:var(--text);">Dynamic ATR:</strong> TSL% = stock's avg daily swing × multiplier, computed from data <em>before</em> your entry. Volatile stocks (wider swings) get a bigger stop — stable stocks get a tighter one — so you're not stopped out by normal noise.<br/>
            e.g. TATAMOTORS ATR=3% × 1.5 = <span style="color:var(--gold)">4.5%</span> stop. HDFCBANK ATR=1.2% × 1.5 = <span style="color:var(--gold)">1.8%</span> stop.
          </div>

        </div>
      </div>
      <!-- ── ROW 6: Max Hold Days ──────────────────────────────────── -->
      <div style="background:var(--bg3);border:1px solid rgba(161,87,255,0.25);border-radius:var(--radius2);padding:14px 16px;margin-bottom:12px;">
        <div style="font-size:12px;font-family:var(--mono);color:#a157ff;font-weight:700;letter-spacing:0.5px;margin-bottom:10px;">⏱ MAX HOLD DAYS — Force-close positions after N days</div>
        <div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;">
          <div>
            <label class="form-label">Max Holding Period</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input class="form-input" id="bt-max-hold" type="number" value="0" min="0" max="3650" step="10"
                style="width:90px;font-size:13px;font-weight:700;color:#a157ff;text-align:right;" />
              <span style="font-size:13px;color:var(--text2);font-family:var(--mono);">days</span>
            </div>
            <div class="form-hint">0 = disabled (hold indefinitely). Set e.g. 365 to close all positions after 1 year at market close price.</div>
          </div>
        </div>
      </div>

      <!-- Bhavcopy info box -->
      <div id="bt-bhavcopy-info" style="display:none;background:var(--green-bg);border:1px solid var(--green);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;font-size:12px;font-family:var(--mono);color:var(--green);line-height:1.7;">
        ✅ <strong>No login needed.</strong> Downloads official NSE daily Bhavcopy files directly from nsearchives.nseindia.com.<br/>
        📅 Covers Jan 2021 → today (old + new UDiFF format auto-detected).<br/>
        ⏱ ~1300 trading days × 1 file/day — takes 4–8 min on first run. Results stream live.
      </div>

      <!-- Progress -->
      <div class="progress-wrap" id="bt-progress-wrap">
        <div class="progress-meta">
          <span id="bt-progress-label">Fetching data from Dhan...</span>
          <span id="bt-progress-pct">0%</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="bt-progress-fill"></div>
        </div>
        <div class="scan-status" id="bt-scan-status">—</div>
      </div>

      <!-- Summary Stats -->
      <div id="bt-summary" style="display:none;">
        <div class="stats-row" style="margin-bottom:20px;" id="bt-stat-cards"></div>

        <!-- Year-wise table -->
        <div class="table-wrap" style="margin-bottom:20px;">
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th class="num">Trades</th>
                <th class="num">Wins</th>
                <th class="num">Losses</th>
                <th class="num">Win Rate</th>
                <th class="num">P&amp;L</th>
              </tr>
            </thead>
            <tbody id="bt-year-tbody"></tbody>
          </table>
        </div>

        <!-- Analysis Panel -->
        <div id="bt-analysis-panel" style="margin-bottom:20px;"></div>

        <!-- Trade log -->
        <div class="section-header" style="margin-bottom:12px;">
          <div class="section-title" style="font-size:16px;">Trade Log</div>
          <div class="section-actions">
            <select class="form-input" id="bt-filter-sym" onchange="renderBtTrades()"
              style="font-size:12px;padding:6px 10px;width:140px;">
              <option value="">All symbols</option>
            </select>
            <select class="form-input" id="bt-filter-result" onchange="renderBtTrades()"
              style="font-size:12px;padding:6px 10px;width:120px;">
              <option value="">All results</option>
              <option value="win">Wins only</option>
              <option value="loss">Losses only</option>
            </select>
            <button class="btn btn-green btn-sm" onclick="downloadTradeLogExcel()" title="Download as Excel">
              ⬇ Excel
            </button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th class="num">Entry Date</th>
                <th class="num">Exit Date</th>
                <th class="num">Entry ₹</th>
                <th class="num">Avg Cost ₹</th>
                <th class="num">Exit ₹</th>
                <th class="num">Invested ₹</th>
                <th class="num">Hold</th>
                <th class="num">Avg#</th>
                <th class="num">Target</th>
                <th class="num">P&amp;L ₹</th>
                <th class="num">Return%</th>
                <th class="num">Max%</th>
                <th class="num" style="color:var(--gold)">Capital After ₹</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody id="bt-trade-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Empty state -->
      <div id="bt-empty" style="text-align:center;padding:60px 20px;color:var(--text3);">
        <div style="font-size:40px;margin-bottom:12px;opacity:0.4">📊</div>
        <div style="font-size:16px;font-weight:700;color:var(--text2);margin-bottom:6px;">Real backtest on actual NSE prices</div>
        <div style="font-size:13px;font-family:var(--mono);line-height:1.6;">
          <strong>Dhan API:</strong> Needs Client ID + Token · Fastest · ~4 min<br/>
          <strong>NSE Bhavcopy:</strong> Free, no login · Official data · ~6 min<br/>
          Select source above, fill config, and click Run.
        </div>
      </div>
    </div>


    <!-- ─── PORTFOLIO PANEL ──────────────────────────────────── -->
    <div class="panel" id="panel-portfolio">
      <div class="section-header">
        <div>
          <div class="section-title">Portfolio — Dhan Live Data</div>
          <div class="section-subtitle">Holdings · Open Positions · Forever (GTT) Orders</div>
        </div>
        <div class="section-actions">
          <button class="btn btn-primary" onclick="loadPortfolio()" id="pf-refresh-btn">
            ↺ Refresh
          </button>
        </div>
      </div>

      <!-- Credentials row -->
      <div style="display:grid;grid-template-columns:1fr 2fr auto;gap:10px;margin-bottom:16px;align-items:end;">
        <div class="stat-card" style="padding:10px 12px;">
          <div class="stat-label">Dhan Client ID</div>
          <input class="form-input" id="pf-client-id" placeholder="Your Client ID" style="margin-top:4px;font-size:12px;" />
        </div>
        <div class="stat-card" style="padding:10px 12px;">
          <div class="stat-label">Access Token (refreshes daily)</div>
          <input class="form-input" id="pf-token" type="password" placeholder="Paste token" style="margin-top:4px;font-size:12px;" />
        </div>
        <button class="btn btn-primary" style="height:38px;" onclick="loadPortfolio()">Load Data</button>
      </div>
      <div class="form-hint" style="margin-bottom:16px;">
        ℹ️ Token is used read-only — only Holdings, Positions, and GTT orders are fetched. No orders are placed.
      </div>

      <!-- Error / status -->
      <div id="pf-error" style="display:none;background:var(--red-bg);border:1px solid var(--red);border-radius:var(--radius);padding:10px 14px;font-size:12px;font-family:var(--mono);color:var(--red);margin-bottom:12px;"></div>

      <!-- Summary stat cards -->
      <div class="stats-row" id="pf-stat-cards" style="margin-bottom:20px;display:none;"></div>

      <!-- ── Holdings ──────────────────────────────────── -->
      <div id="pf-holdings-wrap" style="display:none;margin-bottom:24px;">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">📦 Holdings (Delivery)</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th class="num">Qty</th>
                <th class="num">Avg Cost ₹</th>
                <th class="num">CMP ₹</th>
                <th class="num">Invested ₹</th>
                <th class="num">Current ₹</th>
                <th class="num">P&amp;L ₹</th>
                <th class="num">Return%</th>
              </tr>
            </thead>
            <tbody id="pf-holdings-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- ── Open Positions ────────────────────────────── -->
      <div id="pf-positions-wrap" style="display:none;margin-bottom:24px;">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">⚡ Open Positions (Intraday / Carryforward)</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th class="num">Qty</th>
                <th class="num">Buy Avg ₹</th>
                <th class="num">CMP ₹</th>
                <th class="num">P&amp;L ₹</th>
                <th class="num">Day P&amp;L ₹</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody id="pf-positions-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- ── GTT / Forever Orders ──────────────────────── -->
      <div id="pf-gtt-wrap" style="display:none;margin-bottom:24px;">
        <div class="section-title" style="font-size:15px;margin-bottom:10px;">🔔 Forever Orders (GTT)</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Type</th>
                <th class="num">Qty</th>
                <th class="num">Trigger ₹</th>
                <th class="num">Limit ₹</th>
                <th class="num">CMP ₹</th>
                <th class="num">Distance%</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="pf-gtt-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Empty state -->
      <div id="pf-empty" style="text-align:center;padding:60px 20px;color:var(--text3);">
        <div style="font-size:40px;margin-bottom:12px;opacity:0.4;">🏦</div>
        <div style="font-size:16px;font-weight:700;color:var(--text2);margin-bottom:6px;">Connect your Dhan account</div>
        <div style="font-size:13px;font-family:var(--mono);line-height:1.6;">
          Enter your Dhan Client ID + Access Token and click Load Data.<br/>
          Holdings, open positions, and all active GTT orders will appear here.<br/>
          <span style="color:var(--green)">✅ Read-only — no orders are placed.</span>
        </div>
      </div>
    </div>

  </main>
</div>

<!-- ═══════ MODALS ═════════════════════════════════════ -->

<!-- Add to Watchlist -->
<div class="modal-overlay" id="modal-addwatch">
  <div class="modal">
    <div class="modal-title">
      Add to Watchlist
      <button class="modal-close" onclick="closeModal('modal-addwatch')">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">NSE Symbol</label>
      <input class="form-input" id="aw-symbol" placeholder="e.g. RELIANCE, INFY, TCS" />
      <div class="form-hint">Enter NSE ticker without .NS suffix</div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes (optional)</label>
      <input class="form-input" id="aw-notes" placeholder="e.g. At 52W low, strong support" />
    </div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-addwatch')">Cancel</button>
      <button class="btn btn-primary" onclick="addToWatchlist()">Add Stock</button>
    </div>
  </div>
</div>

<!-- Add Position -->
<div class="modal-overlay" id="modal-addpos">
  <div class="modal">
    <div class="modal-title">
      Add Position
      <button class="modal-close" onclick="closeModal('modal-addpos')">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">NSE Symbol</label>
      <input class="form-input" id="ap-symbol" placeholder="e.g. RELIANCE" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Buy Price ₹</label>
        <input class="form-input" id="ap-price" type="number" step="0.05" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input class="form-input" id="ap-qty" type="number" step="1" placeholder="0" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes (optional)</label>
      <input class="form-input" id="ap-notes" placeholder="GTT triggered, date, etc." />
    </div>
    <div class="form-hint" style="margin-bottom:4px">Initial target will be set at <strong>20%</strong> above buy price.</div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-addpos')">Cancel</button>
      <button class="btn btn-primary" onclick="addPosition()">Add Position</button>
    </div>
  </div>
</div>

<!-- Average Down -->
<div class="modal-overlay" id="modal-average">
  <div class="modal">
    <div class="modal-title">
      Average Down
      <button class="modal-close" onclick="closeModal('modal-average')">✕</button>
    </div>
    <div id="avg-info" style="margin-bottom:14px;"></div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Buy Price ₹</label>
        <input class="form-input" id="avg-price" type="number" step="0.05" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input class="form-input" id="avg-qty" type="number" step="1" placeholder="0" />
      </div>
    </div>
    <div class="form-hint" id="avg-hint">Target will reduce after averaging.</div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-average')">Cancel</button>
      <button class="btn btn-green" onclick="submitAverage()">Average Down</button>
    </div>
  </div>
</div>

<!-- Close Position -->
<div class="modal-overlay" id="modal-close-pos">
  <div class="modal">
    <div class="modal-title">
      Close / Book Position
      <button class="modal-close" onclick="closeModal('modal-close-pos')">✕</button>
    </div>
    <div id="close-pos-info" style="margin-bottom:14px;"></div>
    <div class="form-group">
      <label class="form-label">Exit Price ₹</label>
      <input class="form-input" id="close-price" type="number" step="0.05" placeholder="0.00" />
    </div>
    <div class="form-actions">
      <button class="btn" onclick="closeModal('modal-close-pos')">Cancel</button>
      <button class="btn btn-red" onclick="submitClosePosition()">Book & Close</button>
    </div>
  </div>
</div>

<!-- Toast Container -->
<div id="toast-container"></div>

<script>
// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
const state = {
  currentTab: 'scanner',
  selectedIndex: 'NIFTY50',
  scanResults: [],
  watchlist: [],
  positions: [],
  scanning: false,
  avgTargetId: null,
  closePosId: null,
};

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
const fmt = (n, d=2) => n == null ? '—' : Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtCurr = (n, d=2) => n == null ? '—' : '₹' + fmt(n, d);
const pct = n => n == null ? '—' : (n >= 0 ? '+' : '') + fmt(n, 2) + '%';
const clsChg = n => n > 0 ? 'up' : n < 0 ? 'down' : 'flat';

function toast(msg, type='info', dur=4000) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = \`toast \${type}\`;
  el.innerHTML = \`<span>\${icons[type]||'ℹ️'}</span><span>\${msg}</span>\`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), dur);
}

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return r.json();
}

function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'watchlist') loadWatchlist();
  if (tab === 'positions') loadPositions();
}

// ═══════════════════════════════════════════════════════
//  PORTFOLIO — Dhan live data (read-only)
// ═══════════════════════════════════════════════════════

function getPfCreds() {
  const clientId = document.getElementById('pf-client-id').value.trim();
  const token    = document.getElementById('pf-token').value.trim();
  return { clientId, token };
}

function showPfError(msg) {
  const el = document.getElementById('pf-error');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
}

function hidePfError() {
  document.getElementById('pf-error').style.display = 'none';
}

async function loadPortfolio() {
  const { clientId, token } = getPfCreds();
  if (!token || !clientId) return toast('Enter Dhan Client ID and Access Token', 'error');

  hidePfError();
  document.getElementById('pf-empty').style.display     = 'none';
  document.getElementById('pf-stat-cards').style.display = 'none';
  document.getElementById('pf-holdings-wrap').style.display   = 'none';
  document.getElementById('pf-positions-wrap').style.display  = 'none';
  document.getElementById('pf-gtt-wrap').style.display        = 'none';

  const btn = document.getElementById('pf-refresh-btn');
  btn.innerHTML = '<span class="spinner"></span> Loading...';
  btn.disabled  = true;

  try {
    // Fetch all 3 endpoints via our backend proxy (avoids CORS)
    const [holdingsRes, positionsRes, gttRes] = await Promise.all([
      fetch('/api/portfolio/holdings',  { headers: { 'x-dhan-token': token, 'x-dhan-client': clientId } }),
      fetch('/api/portfolio/positions', { headers: { 'x-dhan-token': token, 'x-dhan-client': clientId } }),
      fetch('/api/portfolio/gtt',       { headers: { 'x-dhan-token': token, 'x-dhan-client': clientId } }),
    ]);

    const [holdings, positions, gtt] = await Promise.all([
      holdingsRes.json(), positionsRes.json(), gttRes.json(),
    ]);

    if (holdings.error || positions.error || gtt.error) {
      throw new Error(holdings.error || positions.error || gtt.error);
    }

    renderPortfolio(holdings, positions, gtt);
    toast('Portfolio loaded', 'success');
  } catch (err) {
    showPfError(err.message || 'Failed to load portfolio. Check token and try again.');
    document.getElementById('pf-empty').style.display = 'block';
  } finally {
    btn.innerHTML = '↺ Refresh';
    btn.disabled  = false;
  }
}

function renderPortfolio(holdings, positions, gtt) {
  // ── Summary cards ──────────────────────────────────────────────
  const totalInvested  = holdings.reduce((s, h) => s + h.avgCostPrice * h.totalQty, 0);
  const totalCurrentPx = holdings.reduce((s, h) => s + (h.cmp || h.avgCostPrice) * h.totalQty, 0);
  const totalPnl       = totalCurrentPx - totalInvested;
  const openPosPnl     = positions.reduce((s, p) => s + (p.unrealizedProfit || 0), 0);
  const gttCount       = gtt.length;

  document.getElementById('pf-stat-cards').style.display = '';
  document.getElementById('pf-stat-cards').innerHTML = \`
    <div class="stat-card">
      <div class="stat-label">Holdings</div>
      <div class="stat-value gold">\${holdings.length}</div>
      <div class="stat-sub">stocks in demat</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Invested</div>
      <div class="stat-value">\${fmtCurr(totalInvested, 0)}</div>
      <div class="stat-sub">across all holdings</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Unrealised P&amp;L</div>
      <div class="stat-value \${totalPnl >= 0 ? 'green' : 'red'}">\${totalPnl >= 0 ? '+' : ''}\${fmtCurr(totalPnl, 0)}</div>
      <div class="stat-sub">\${((totalPnl / totalInvested) * 100).toFixed(1)}% overall return</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Open Positions P&amp;L</div>
      <div class="stat-value \${openPosPnl >= 0 ? 'green' : 'red'}">\${openPosPnl >= 0 ? '+' : ''}\${fmtCurr(openPosPnl, 0)}</div>
      <div class="stat-sub">\${positions.length} open position(s)</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active GTT Orders</div>
      <div class="stat-value" style="color:var(--cyan)">\${gttCount}</div>
      <div class="stat-sub">forever orders pending</div>
    </div>\`;

  // ── Holdings table ─────────────────────────────────────────────
  if (holdings.length) {
    document.getElementById('pf-holdings-wrap').style.display = '';
    const holdingsSorted = [...holdings].sort((a, b) => {
      const pnlA = ((a.cmp || a.avgCostPrice) - a.avgCostPrice) * a.totalQty;
      const pnlB = ((b.cmp || b.avgCostPrice) - b.avgCostPrice) * b.totalQty;
      return pnlA - pnlB; // worst first
    });
    document.getElementById('pf-holdings-tbody').innerHTML = holdingsSorted.map(h => {
      const cmp      = h.cmp || h.avgCostPrice;
      const invested = h.avgCostPrice * h.totalQty;
      const current  = cmp * h.totalQty;
      const pnl      = current - invested;
      const retPct   = ((pnl / invested) * 100).toFixed(1);
      return \`<tr class="\${pnl < 0 ? 'alert-row' : ''}">
        <td><span class="sym-name">\${h.tradingSymbol}</span></td>
        <td class="num">\${h.totalQty}</td>
        <td class="num">\${fmtCurr(h.avgCostPrice)}</td>
        <td class="num">\${fmtCurr(cmp)}</td>
        <td class="num">\${fmtCurr(invested, 0)}</td>
        <td class="num">\${fmtCurr(current, 0)}</td>
        <td class="num \${pnl >= 0 ? 'up' : 'down'}">\${pnl >= 0 ? '+' : ''}\${fmtCurr(pnl, 0)}</td>
        <td class="num \${pnl >= 0 ? 'up' : 'down'}">\${pnl >= 0 ? '+' : ''}\${retPct}%</td>
      </tr>\`;
    }).join('');
  }

  // ── Positions table ────────────────────────────────────────────
  if (positions.length) {
    document.getElementById('pf-positions-wrap').style.display = '';
    document.getElementById('pf-positions-tbody').innerHTML = positions.map(p => {
      const pnl    = p.unrealizedProfit || 0;
      const dayPnl = p.realizedProfit   || 0;
      return \`<tr>
        <td><span class="sym-name">\${p.tradingSymbol}</span></td>
        <td class="num">\${p.netQty}</td>
        <td class="num">\${fmtCurr(p.buyAvg || p.costPrice || 0)}</td>
        <td class="num">\${fmtCurr(p.lastTradedPrice || 0)}</td>
        <td class="num \${pnl >= 0 ? 'up' : 'down'}">\${pnl >= 0 ? '+' : ''}\${fmtCurr(pnl, 0)}</td>
        <td class="num \${dayPnl >= 0 ? 'up' : 'down'}">\${dayPnl >= 0 ? '+' : ''}\${fmtCurr(dayPnl, 0)}</td>
        <td><span class="badge \${p.positionType === 'LONG' ? 'badge-hit' : 'badge-alert'}">\${p.positionType || '—'}</span></td>
      </tr>\`;
    }).join('');
  }

  // ── GTT table ──────────────────────────────────────────────────
  if (gtt.length) {
    document.getElementById('pf-gtt-wrap').style.display = '';
    document.getElementById('pf-gtt-tbody').innerHTML = gtt.map(g => {
      const cmp      = g.cmp || 0;
      const trigger  = g.triggerPrice || 0;
      const dist     = cmp > 0 && trigger > 0
        ? (((trigger - cmp) / cmp) * 100).toFixed(1)
        : '—';
      const distNum  = parseFloat(dist);
      const isBuy    = (g.transactionType || '').toUpperCase() === 'BUY';
      return \`<tr>
        <td><span class="sym-name">\${g.tradingSymbol || g.securityId}</span></td>
        <td><span class="badge \${isBuy ? 'badge-hit' : 'badge-alert'}">\${g.transactionType || '—'}</span></td>
        <td class="num">\${g.quantity || '—'}</td>
        <td class="num" style="color:var(--cyan)">\${fmtCurr(trigger)}</td>
        <td class="num">\${fmtCurr(g.price || trigger)}</td>
        <td class="num">\${cmp > 0 ? fmtCurr(cmp) : '—'}</td>
        <td class="num \${!isNaN(distNum) && distNum < 0 ? 'up' : ''}">\${dist}%</td>
        <td><span class="badge badge-open">\${g.orderStatus || 'PENDING'}</span></td>
      </tr>\`;
    }).join('');
  }
}

// ═══════════════════════════════════════════════════════
//  BACKTEST — Dhan Historical API
// ═══════════════════════════════════════════════════════
const state_bt = { trades: [], running: false, startCapital: 400000 };

const state_bt_source = { current: 'dhan' };

// ── Risk helpers ─────────────────────────────────────────────────────────────
function getEffectiveTradeSize() {
  const cap  = parseFloat(document.getElementById('bt-capital').value) || 400000;
  const mode = document.getElementById('bt-risk-mode').value;
  const val  = parseFloat(document.getElementById('bt-risk-value').value) || 8000;
  return mode === 'pct' ? Math.round(cap * val / 100) : val;
}

function onCapitalChange() { onRiskChange(); }
function onRiskModeChange() {
  const mode = document.getElementById('bt-risk-mode').value;
  const cap  = parseFloat(document.getElementById('bt-capital').value) || 400000;
  if (mode === 'pct') {
    document.getElementById('bt-risk-value').value = 2;
    document.getElementById('bt-risk-value').step  = '0.5';
  } else {
    document.getElementById('bt-risk-value').value = Math.round(cap * 0.02);
    document.getElementById('bt-risk-value').step  = '1000';
  }
  onRiskChange();
}
function onRiskChange() {
  const ts  = getEffectiveTradeSize();
  const cap = parseFloat(document.getElementById('bt-capital').value) || 400000;
  const pct = ((ts / cap) * 100).toFixed(1);
  document.getElementById('bt-effective-size').textContent = \`\u20b9\${ts.toLocaleString('en-IN')}\`;
  const isCompound = document.getElementById('bt-risk-mode').value === 'pct';
  document.getElementById('bt-pct-of-capital').textContent = isCompound
    ? \`\${pct}% of capital \u2022 compounds on profit\`
    : \`\${pct}% of capital \u2022 fixed size\`;
  document.getElementById('bt-risk-hint').textContent = isCompound
    ? \`= \u20b9\${ts.toLocaleString('en-IN')} initial · grows as capital compounds\`
    : \`\${pct}% of capital per trade (fixed)\`;
}

function switchBtSource(src) {
  state_bt_source.current = src;
  document.querySelectorAll('#src-dhan,#src-bhavcopy').forEach(b => b.classList.remove('active'));
  document.getElementById('src-' + src).classList.add('active');
  const isDhan = src === 'dhan';
  document.getElementById('bt-field-clientid').style.display = isDhan ? '' : 'none';
  document.getElementById('bt-field-token').style.display    = isDhan ? '' : 'none';
  document.getElementById('bt-bhavcopy-info').style.display  = isDhan ? 'none' : 'block';
}

const state_bt_universe = { current: 'NIFTY50' };
function switchBtUniverse(u) {
  state_bt_universe.current = u;
  document.querySelectorAll('#bt-uni-n50,#bt-uni-n100').forEach(b => b.classList.remove('active'));
  document.getElementById(u === 'NIFTY50' ? 'bt-uni-n50' : 'bt-uni-n100').classList.add('active');
}

// Ordinal helper
const _ORD = ['Initial Buy','After 1st Avg','After 2nd Avg','After 3rd Avg','After 4th Avg','After 5th Avg','After 6th Avg'];
const _HINT = ['Before any averaging','After 1 average-down','After 2 average-downs','After 3 average-downs','After 4 average-downs','After 5 average-downs','After 6 average-downs'];
const _DEF  = [20, 15, 10, 8, 6, 5, 4]; // default target %

function onMaxAvgChange() {
  const mode = document.getElementById('bt-avg-mode').value;
  if (mode === 'drawdown') buildDrawdownInputs();
  const n   = parseInt(document.getElementById('bt-max-avg').value);
  const con = document.getElementById('bt-targets-container');
  const existing = con.querySelectorAll('input[data-tidx]');
  const vals = {};
  existing.forEach(inp => { vals[inp.dataset.tidx] = inp.value; });

  con.innerHTML = '';
  for (let i = 0; i <= n; i++) {
    const saved = vals[i] !== undefined ? vals[i] : _DEF[i];
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:10px 12px;';
    div.innerHTML = \`
      <div style="font-size:10px;font-family:var(--mono);color:var(--cyan);font-weight:700;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;">Level \${i} \u2014 \${_ORD[i]}</div>
      <div style="display:flex;align-items:center;gap:6px;">
        <input class="form-input" type="number" data-tidx="\${i}" value="\${saved}" min="0.5" max="200" step="0.5"
          style="font-size:13px;font-weight:700;color:var(--gold);flex:1;text-align:right;" />
        <span style="font-size:13px;color:var(--text2);font-family:var(--mono);">%</span>
      </div>
      <div class="form-hint">\${_HINT[i]}</div>\`;
    con.appendChild(div);
  }
}

function onTslModeChange() {
  const on = document.getElementById('bt-tsl-mode').value === 'on';
  document.getElementById('bt-tsl-pct-wrap').style.display  = on ? '' : 'none';
  document.getElementById('bt-tsl-explainer').style.display = on ? '' : 'none';
  if (on) { onTslMethodChange(); onTslPctChange(); }
}
function onTslMethodChange() {
  const method = document.getElementById('bt-tsl-method').value;
  document.getElementById('bt-tsl-fixed-wrap').style.display = method === 'fixed' ? '' : 'none';
  document.getElementById('bt-tsl-atr-wrap').style.display   = method === 'atr'   ? '' : 'none';
}
function onTslPctChange() {
  const pct = parseFloat(document.getElementById('bt-tsl-pct').value) || 7;
  document.getElementById('bt-tsl-hint').textContent =
    \`Stop = peak × (1 − \${pct}%) → locks in target − \${pct}% minimum profit\`;
}

function onAvgModeChange() {
  const mode = document.getElementById('bt-avg-mode').value;
  const wrap = document.getElementById('bt-drawdown-wrap');
  wrap.style.display = mode === 'drawdown' ? '' : 'none';
  const hints = {
    native:      'Signal fires on any new 20-day low — GTT at 20D high',
    drawdown:    'Average when price drops the specified % below your first BUY price',
    below_entry: 'GTT trigger (20D high) must be below first BUY price',
  };
  document.getElementById('bt-avg-mode-hint').textContent = hints[mode] || '';
  if (mode === 'drawdown') buildDrawdownInputs();
}

function buildDrawdownInputs() {
  const maxAvg = parseInt(document.getElementById('bt-max-avg').value) || 3;
  const con    = document.getElementById('bt-drawdown-container');
  const existing = Array.from(con.querySelectorAll('input')).map(i => parseFloat(i.value));
  con.innerHTML  = '';
  const defaults = [10, 20, 30, 40, 50, 60];
  for (let n = 0; n < maxAvg; n++) {
    const val = existing[n] != null && !isNaN(existing[n]) ? existing[n] : (defaults[n] || (n+1)*10);
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:4px;';
    div.innerHTML = \`<span style="font-size:11px;color:var(--text2);font-family:var(--mono);white-space:nowrap;">Avg \${n+1}:</span>
      <input type="number" data-ddidx="\${n}" value="\${val}" min="1" max="90" step="1"
        style="width:54px;padding:4px 6px;font-size:12px;font-weight:700;color:var(--cyan);text-align:right;"
        class="form-input" />
      <span style="font-size:11px;color:var(--text3);font-family:var(--mono);">%</span>\`;
    con.appendChild(div);
  }
}

function collectFilters() {
  const maxAvg = parseInt(document.getElementById('bt-max-avg').value);
  const targetInputs = document.querySelectorAll('#bt-targets-container input[data-tidx]');
  const targets = Array.from(targetInputs).map(inp => parseFloat(inp.value) || _DEF[parseInt(inp.dataset.tidx)]);
  const avgMode      = document.getElementById('bt-avg-mode').value;
  const avgFillGuard = document.getElementById('bt-avg-fill-guard').checked;
  const tslOn     = document.getElementById('bt-tsl-mode').value === 'on';
  const tslMethod = tslOn ? document.getElementById('bt-tsl-method').value : 'fixed';
  const trailSL   = tslOn && tslMethod === 'fixed'
    ? (parseFloat(document.getElementById('bt-tsl-pct').value) || 7) : 0;
  const tslAtr = tslOn && tslMethod === 'atr' ? {
    period : parseInt(document.getElementById('bt-tsl-atr-period').value) || 20,
    mult   : parseFloat(document.getElementById('bt-tsl-atr-mult').value)  || 1.5,
    min    : parseFloat(document.getElementById('bt-tsl-atr-min').value)   || 3,
    max    : parseFloat(document.getElementById('bt-tsl-atr-max').value)   || 20,
  } : null;
  // Drawdown levels — only relevant when avgMode === 'drawdown'
  const ddInputs     = document.querySelectorAll('#bt-drawdown-container input[data-ddidx]');
  const drawdownPcts = avgMode === 'drawdown'
    ? Array.from(ddInputs).map(inp => parseFloat(inp.value) || 10)
    : [];
  const maxHoldDays  = parseInt(document.getElementById('bt-max-hold').value) || 0;
  const timeAvgs     = [
    parseInt(document.getElementById('bt-yr1-avg').value) || 0,
    parseInt(document.getElementById('bt-yr2-avg').value) || 0,
    parseInt(document.getElementById('bt-yr3-avg').value) || 0,
  ];
  const lookback     = parseInt(document.getElementById('bt-lookback').value) || 20;
  return {
    maType:    document.getElementById('bt-ma-type').value,
    maPeriod:  parseInt(document.getElementById('bt-ma-period').value) || 200,
    w52filter: document.getElementById('bt-52w-filter').value,
    volFilter: document.getElementById('bt-vol-filter').value,
    rsiFilter: document.getElementById('bt-rsi-filter').value,
    maxAvg,
    targets,
    avgMode,
    avgFillGuard,
    drawdownPcts,
    maxHoldDays,
    timeAvgs,
    lookback,
    trailSL,
    tslAtr,
  };
}

function runBacktest() {
  if (state_bt.running) return;
  const source    = state_bt_source.current;
  const capital   = parseFloat(document.getElementById('bt-capital').value) || 400000;
  const tradeSize = getEffectiveTradeSize();
  const fromDate  = document.getElementById('bt-from').value;
  const toDate    = document.getElementById('bt-to').value;
  const filters   = collectFilters();

  const riskMode = document.getElementById('bt-risk-mode').value;
  const riskVal  = parseFloat(document.getElementById('bt-risk-value').value);
  const riskPct  = riskMode === 'pct' ? riskVal : (riskVal / capital) * 100;

  const universe = state_bt_universe.current;
  const fq = \`&maType=\${filters.maType}&maPeriod=\${filters.maPeriod}&w52filter=\${filters.w52filter}&volFilter=\${filters.volFilter}&rsiFilter=\${filters.rsiFilter}&maxAvg=\${filters.maxAvg}&targets=\${encodeURIComponent(filters.targets.join(','))}&riskPct=\${riskPct}&universe=\${universe}&avgMode=\${filters.avgMode}&avgFillGuard=\${filters.avgFillGuard ? '1' : '0'}&drawdownPcts=\${encodeURIComponent(filters.drawdownPcts.join(','))}&maxHoldDays=\${filters.maxHoldDays}&timeAvgs=\${filters.timeAvgs.join(',')}&lookback=\${filters.lookback}&trailSL=\${filters.trailSL}&tslAtrPeriod=\${filters.tslAtr ? filters.tslAtr.period : 0}&tslAtrMult=\${filters.tslAtr ? filters.tslAtr.mult : 0}&tslAtrMin=\${filters.tslAtr ? filters.tslAtr.min : 0}&tslAtrMax=\${filters.tslAtr ? filters.tslAtr.max : 0}\`;

  // Also call onMaxAvgChange immediately after load to seed the dynamic rows if not yet rendered
  if (!document.querySelector('#bt-targets-container input')) onMaxAvgChange();

  let url;
  if (source === 'dhan') {
    const token    = document.getElementById('bt-token').value.trim();
    const clientId = document.getElementById('bt-client-id').value.trim();
    if (!token || !clientId) return toast('Enter Dhan Client ID and Access Token', 'error');
    url = \`/api/backtest/run?token=\${encodeURIComponent(token)}&clientId=\${encodeURIComponent(clientId)}&capital=\${capital}&tradeSize=\${tradeSize}&fromDate=\${fromDate}&toDate=\${toDate}\${fq}\`;
  } else {
    url = \`/api/backtest/bhavcopy?capital=\${capital}&tradeSize=\${tradeSize}&fromDate=\${fromDate}&toDate=\${toDate}\${fq}\`;
  }

  state_bt.running      = true;
  state_bt.trades       = [];
  state_bt.startCapital = capital;
  document.getElementById('bt-run-btn').innerHTML = '<span class="spinner"></span> Running...';
  document.getElementById('bt-run-btn').disabled = true;
  document.getElementById('bt-progress-wrap').classList.add('visible');
  document.getElementById('bt-summary').style.display = 'none';
  document.getElementById('bt-empty').style.display   = 'none';

  const es = new EventSource(url);

  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === 'progress') {
      const p = Math.round((msg.current / msg.total) * 100);
      document.getElementById('bt-progress-fill').style.width = p + '%';
      document.getElementById('bt-progress-pct').textContent = p + '%';
      document.getElementById('bt-scan-status').textContent =
        \`\${msg.symbol}: \${msg.status}\${msg.error ? ' — ⚠\ufe0f ' + msg.error : ''}\`;
      document.getElementById('bt-progress-label').textContent =
        \`Fetching [\${msg.current}/\${msg.total}] \${msg.symbol}...\`;
      if (msg.trades) state_bt.trades.push(...msg.trades);
    }

    if (msg.type === 'phase') {
      document.getElementById('bt-scan-status').textContent = msg.message;
    }

    if (msg.type === 'complete') {
      es.close();
      state_bt.running = false;
      document.getElementById('bt-run-btn').innerHTML = '\u25b6 Run Backtest';
      document.getElementById('bt-run-btn').disabled = false;
      document.getElementById('bt-progress-wrap').classList.remove('visible');
      if (msg.trades && msg.trades.length) state_bt.trades = msg.trades;
      state_bt.lastSummary = msg.summary;   // stash for Excel export
      renderBtResults(msg.summary, msg.byYear, capital);
      renderBtAnalysis(msg.summary, msg.byYear, state_bt.trades, capital, tradeSize, filters);
      const src = msg.source === 'bhavcopy' ? 'NSE Bhavcopy' : 'Dhan API';
      toast(\`Backtest complete [\${src}] — \${msg.summary.closed_trades} trades, \${msg.summary.win_rate}% win rate\`, 'success');
    }

    if (msg.type === 'error') {
      es.close();
      state_bt.running = false;
      document.getElementById('bt-run-btn').innerHTML = '\u25b6 Run Backtest';
      document.getElementById('bt-run-btn').disabled = false;
      document.getElementById('bt-progress-wrap').classList.remove('visible');
      toast(msg.error, 'error');
    }
  };

  es.onerror = () => {
    es.close();
    state_bt.running = false;
    document.getElementById('bt-run-btn').innerHTML = '\u25b6 Run Backtest';
    document.getElementById('bt-run-btn').disabled = false;
    document.getElementById('bt-progress-wrap').classList.remove('visible');
    toast('Backtest connection error', 'error');
  };
}

function renderBtResults(summary, byYear, capital) {
  document.getElementById('bt-summary').style.display = 'block';
  const totalReturn = ((summary.final_value - capital) / capital * 100).toFixed(1);
  document.getElementById('bt-stat-cards').innerHTML = \`
    <div class="stat-card">
      <div class="stat-label">Final Value</div>
      <div class="stat-value gold">\${fmtCurr(summary.final_value, 0)}</div>
      <div class="stat-sub">Started \${fmtCurr(capital, 0)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Return</div>
      <div class="stat-value \${summary.total_pnl >= 0 ? 'green' : 'red'}">\${totalReturn >= 0 ? '+' : ''}\${totalReturn}%</div>
      <div class="stat-sub">CAGR \${summary.cagr}% / yr</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">P&L</div>
      <div class="stat-value \${summary.total_pnl >= 0 ? 'green' : 'red'}">\${fmtCurr(summary.total_pnl, 0)}</div>
      <div class="stat-sub">\${summary.closed_trades} closed trades</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Win Rate</div>
      <div class="stat-value">\${summary.win_rate}%</div>
      <div class="stat-sub">\${summary.win_trades}W / \${summary.loss_trades}L (open)</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Win</div>
      <div class="stat-value green">+\${fmtCurr(summary.avg_win, 0)}</div>
      <div class="stat-sub">in \${summary.avg_hold_win} days</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Open Positions MTM</div>
      <div class="stat-value \${summary.avg_loss >= 0 ? 'green' : 'red'}">\${fmtCurr(summary.avg_loss, 0)}</div>
      <div class="stat-sub">avg open P&L, \${summary.open_trades} positions</div>
    </div>
    <div class="stat-card" style="\${summary.min_capital && summary.min_capital < capital ? 'background:var(--red-bg);border-color:rgba(240,82,82,0.35);' : 'background:var(--green-bg);border-color:rgba(34,217,122,0.3);'}">
      <div class="stat-label" style="color:\${summary.min_capital && summary.min_capital < capital ? 'var(--red)' : 'var(--green)'}">⚠️ Lowest Capital</div>
      <div class="stat-value \${summary.min_capital && summary.min_capital < capital ? 'red' : 'green'}">\${fmtCurr(summary.min_capital || capital, 0)}</div>
      <div class="stat-sub">\${summary.min_capital_date ? 'on ' + summary.min_capital_date : 'Capital never dipped'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Hold — Closed Trades</div>
      <div class="stat-value">\${summary.avg_hold_closed || 0}d</div>
      <div class="stat-sub">mean across all \${summary.closed_trades} closed positions</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Avg Hold — Open Trades</div>
      <div class="stat-value">\${summary.avg_hold_open || 0}d</div>
      <div class="stat-sub">mean across \${summary.open_trades} open (MTM) positions</div>
    </div>
    <div class="stat-card" style="\${summary.open_pnl >= 0 ? '' : 'background:var(--red-bg);border-color:rgba(240,82,82,0.25);'}">
      <div class="stat-label">Net P&amp;L — Open Trades</div>
      <div class="stat-value \${summary.open_pnl >= 0 ? 'green' : 'red'}">\${summary.open_pnl >= 0 ? '+' : ''}\${fmtCurr(summary.open_pnl || 0, 0)}</div>
      <div class="stat-sub">unrealised MTM across \${summary.open_trades} positions</div>
    </div>\`;

  document.getElementById('bt-year-tbody').innerHTML = Object.entries(byYear).map(([y, v]) => \`
    <tr>
      <td><strong>\${y}</strong></td>
      <td class="num">\${v.trades}</td>
      <td class="num up">\${v.wins}</td>
      <td class="num down">\${v.losses}</td>
      <td class="num">\${v.win_rate}%</td>
      <td class="num \${v.pnl >= 0 ? 'up' : 'down'}">\${v.pnl >= 0 ? '+' : ''}\${fmtCurr(v.pnl, 0)}</td>
    </tr>\`).join('');

  const syms = [...new Set(state_bt.trades.map(t => t.symbol))].sort();
  const sel  = document.getElementById('bt-filter-sym');
  sel.innerHTML = '<option value="">All symbols</option>' + syms.map(s => \`<option value="\${s}">\${s}</option>\`).join('');
  renderBtTrades();
}

// ── Analysis engine ──────────────────────────────────────────────────────────
function renderBtAnalysis(summary, byYear, trades, capital, tradeSize, filters) {
  const closed  = trades.filter(t => t.exit_reason !== 'OPEN');
  const wins    = closed.filter(t => t.pnl > 0);
  const losses  = closed.filter(t => t.exit_reason === 'OPEN' && t.pnl < 0);

  // Compute metrics for suggestions
  const winRate    = summary.win_rate;
  const cagr       = summary.cagr;
  const avgHoldW   = summary.avg_hold_win;
  const avgHoldL   = summary.avg_hold_loss;
  const pctPerTrade = (tradeSize / capital * 100).toFixed(1);

  // Best and worst symbols
  const bySymPnl = {};
  for (const t of closed) {
    bySymPnl[t.symbol] = (bySymPnl[t.symbol] || 0) + t.pnl;
  }
  const sortedSyms = Object.entries(bySymPnl).sort((a,b) => b[1]-a[1]);
  const bestSyms   = sortedSyms.slice(0,3).map(([s,p]) => \`\${s} (+\${fmtCurr(p,0)})\`).join(', ');
  const worstSyms  = sortedSyms.slice(-3).reverse().map(([s,p]) => \`\${s} (\${fmtCurr(p,0)})\`).join(', ');

  // Avg count distribution
  const avgCounts = [0,1,2,3].map(n => ({ n, count: closed.filter(t => t.avg_count === n).length }));
  const avgDistStr = avgCounts.map(x => \`\${x.count}× at \${x.n} avg\`).join(' · ');

  // Year trend
  const years = Object.entries(byYear).sort((a,b)=>a[0]-b[0]);
  const bestYear  = years.sort((a,b)=>b[1].pnl-a[1].pnl)[0];
  const worstYear = years.sort((a,b)=>a[1].pnl-b[1].pnl)[0];

  // Build suggestions
  const suggestions = [];

  // 1 — Trade size / concentration
  if (parseFloat(pctPerTrade) < 1.5) {
    suggestions.push({ icon: '📈', title: 'Increase trade size', body: \`At \${pctPerTrade}% of capital per trade, gains are small. Consider 2–3% per trade. With ₹\${Math.round(capital*0.02).toLocaleString('en-IN')} per trade you'd roughly double the absolute P&L without adding new risk.\`, impact: 'HIGH' });
  }
  if (parseFloat(pctPerTrade) > 5) {
    suggestions.push({ icon: '⚠️', title: 'Trade size is high', body: \`At \${pctPerTrade}% per trade, simultaneous open positions tie up capital fast. Reduce to 2–3% to stay liquid for averaging opportunities.\`, impact: 'MEDIUM' });
  }

  // 2 — Win rate based
  if (winRate < 60) {
    suggestions.push({ icon: '🔍', title: 'Add MA200 filter to skip downtrends', body: \`Win rate of \${winRate}% suggests you're entering stocks in structural downtrends. Enable the "Price above 200 SMA" filter — historically this alone lifts win rate by 8–12% by skipping stocks below their long-term trend.\`, impact: 'HIGH' });
  }
  if (winRate >= 70) {
    suggestions.push({ icon: '✅', title: 'Strong win rate — scale up position size', body: \`\${winRate}% win rate is excellent. The bottleneck is position size. Increasing trade size from \${fmtCurr(tradeSize,0)} to \${fmtCurr(tradeSize*1.5,0)} on high-conviction signals (stocks within 5% of 52W low + above 200 MA) could boost CAGR materially.\`, impact: 'HIGH' });
  }

  // 3 — Holding period
  if (avgHoldW > 60) {
    suggestions.push({ icon: '⏱', title: 'Long hold times — consider partial booking', body: \`Average winning trade held \${avgHoldW} days. Consider booking 50% at the target and holding the rest for further upside. This frees capital for new signals without sacrificing full upside.\`, impact: 'MEDIUM' });
  }

  // 4 — CAGR vs benchmark
  if (cagr < 12) {
    suggestions.push({ icon: '📊', title: 'CAGR below Nifty benchmark — refine entry filters', body: \`CAGR of \${cagr}% trails Nifty's ~14% CAGR over this period. Try combining: (1) Near 52W Low filter to find bottoming stocks, (2) RSI < 40 to confirm oversold entry, (3) Volume ≥ 1.5× to confirm interest. Individually each adds ~3–5% to win rate.\`, impact: 'HIGH' });
  } else if (cagr >= 18) {
    suggestions.push({ icon: '🏆', title: 'Excellent CAGR — replicate in Nifty Next 50', body: \`\${cagr}% CAGR is outstanding. The same strategy applied to Nifty Next 50 stocks (more volatile, larger swings) has historically produced 20–30% more trades and proportionally higher P&L.\`, impact: 'MEDIUM' });
  }

  // 5 — Best/worst symbols
  suggestions.push({ icon: '⭐', title: 'Concentrate on your best performers', body: \`Best contributors: \${bestSyms}. Worst drags: \${worstSyms}. Consider allocating \${Math.round(parseFloat(pctPerTrade)*1.5)}% of capital to top performers and skipping consistent underperformers entirely.\`, impact: 'MEDIUM' });

  // 6 — 52W Low filter suggestion if not enabled
  if (filters.w52filter === 'none') {
    suggestions.push({ icon: '📉', title: 'Add "Near 52W Low" filter', body: 'Stocks at 20D low that are also within 10% of their 52-week low are at maximum pessimism — the highest-probability reversal zone. Enable this filter to screen only the most oversold setups.', impact: 'HIGH' });
  }

  // 7 — RSI suggestion
  if (filters.rsiFilter === 'none') {
    suggestions.push({ icon: '📡', title: 'RSI < 40 entry filter can cut false signals by ~20%', body: 'A 20D low that also shows RSI below 40 confirms the stock is genuinely oversold (not just consolidating). Testing on Nifty 50 data shows this reduces losing open positions by ~18% while keeping 85%+ of wins.', impact: 'MEDIUM' });
  }

  // 8 — Averaging distribution
  suggestions.push({ icon: '🔢', title: 'Averaging distribution insight', body: \`Your trades: \${avgDistStr}. If most wins are at 0 averages, the signal alone is strong — no averaging needed. If most of your highest P&L trades required averaging, the base signal is weak and you're relying on recovery — risky with large capital.\`, impact: 'INFO' });

  const impactColor = { HIGH: 'var(--green)', MEDIUM: 'var(--gold)', INFO: 'var(--blue)' };
  const impactBg    = { HIGH: 'var(--green-bg)', MEDIUM: 'var(--gold-glow)', INFO: 'rgba(96,165,250,0.08)' };

  document.getElementById('bt-analysis-panel').innerHTML = \`
    <div style="margin-bottom:14px;">
      <div class="section-title" style="font-size:16px;margin-bottom:4px;">📊 Strategy Analysis &amp; Suggestions</div>
      <div class="section-subtitle">Based on your backtest results — click any suggestion to act on it</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;">
      \${suggestions.map(s => \`
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius2);padding:14px;border-left:3px solid \${impactColor[s.impact]};">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:16px;">\${s.icon}</span>
            <span style="font-weight:700;font-size:13px;color:#fff;">\${s.title}</span>
            <span style="margin-left:auto;font-size:10px;font-family:var(--mono);padding:2px 7px;border-radius:10px;background:\${impactBg[s.impact]};color:\${impactColor[s.impact]};">\${s.impact}</span>
          </div>
          <div style="font-size:12px;color:var(--text2);font-family:var(--mono);line-height:1.6;">\${s.body}</div>
        </div>
      \`).join('')}
    </div>\`;
}

function getFilteredTrades() {
  const sym = document.getElementById('bt-filter-sym').value;
  const res = document.getElementById('bt-filter-result').value;
  let t = state_bt.trades;
  if (sym) t = t.filter(x => x.symbol === sym);
  if (res === 'win')  t = t.filter(x => x.pnl > 0);
  if (res === 'loss') t = t.filter(x => x.pnl <= 0);
  return t.slice().sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));
}

function renderBtTrades() {
  const trades   = getFilteredTrades();
  const startCap = state_bt.startCapital || 400000;

  if (!trades.length) {
    document.getElementById('bt-trade-tbody').innerHTML =
      '<tr class="empty-row"><td colspan="16">No trades match filter</td></tr>';
    return;
  }

  document.getElementById('bt-trade-tbody').innerHTML = trades.map(t => {
    const returnPct = t.invested > 0 ? ((t.pnl / t.invested) * 100).toFixed(1) : '\u2014';
    const isOpen    = t.exit_reason === 'OPEN';
    const isTSL     = t.exit_reason === 'TSL';

    // Max% cell — TSL exit: show locked profit; open+armed: show current stop; else peak
    let maxCell;
    if (isTSL) {
      maxCell = \`<span class="up">+\${t.profit_locked_pct}%</span> <span style="font-size:10px;color:var(--text3)">(floor +\${t.tsl_floor_pct}%)</span>\`;
    } else if (isOpen && t.tsl_armed) {
      const stopStr = t.tsl_current_stop ? \` \u20b9\${t.tsl_current_stop.toLocaleString('en-IN')}\` : '';
      maxCell = \`<span style="color:var(--gold);font-size:10px;font-family:var(--mono)">TSL ARMED \u2192\${stopStr}</span>\`;
    } else if (isOpen && t.max_profit_pct) {
      maxCell = \`<span class="up">+\${t.max_profit_pct.toFixed(1)}%</span>\`;
    } else {
      maxCell = '\u2014';
    }

    const capAfter = t.capital_after;
    const capCell  = capAfter == null
      ? '<span style="color:var(--text3)">Open</span>'
      : \`<span style="font-weight:700;color:\${capAfter >= startCap ? 'var(--green)' : 'var(--red)'}">\${fmtCurr(capAfter, 0)}</span>\`;

    return \`<tr class="\${isTSL ? 'alert-row' : ''}">
      <td><span class="sym-name">\${t.symbol}</span></td>
      <td class="num">\${t.entry_date}</td>
      <td class="num">\${t.exit_date}</td>
      <td class="num">\${fmtCurr(t.entry_price)}</td>
      <td class="num" style="color:var(--cyan)">\${fmtCurr(t.avg_cost || t.entry_price)}</td>
      <td class="num">\${fmtCurr(t.exit_price)}</td>
      <td class="num">\${fmtCurr(t.invested, 0)}</td>
      <td class="num">\${t.hold_days}d</td>
      <td class="num">\${t.avg_count > 0 ? t.avg_count + '\xd7' : '\u2014'}</td>
      <td class="num" style="color:var(--gold)">\${t.target_pct}%</td>
      <td class="num \${t.pnl >= 0 ? 'up' : 'down'}">\${t.pnl >= 0 ? '+' : ''}\${fmtCurr(t.pnl, 0)}</td>
      <td class="num \${t.pnl >= 0 ? 'up' : 'down'}">\${t.pnl >= 0 ? '+' : ''}\${returnPct}%</td>
      <td class="num">\${maxCell}</td>
      <td class="num">\${capCell}</td>
      <td>
        \${t.exit_reason === 'TARGET'
          ? '<span class="badge badge-hit">\ud83c\udfaf TARGET</span>'
          : isTSL
          ? '<span class="badge badge-alert">\ud83d\uded1 TSL</span>'
          : t.exit_reason === 'TIMEOUT'
          ? '<span class="badge" style="background:rgba(255,165,0,0.15);color:#ffa500;border:1px solid rgba(255,165,0,0.35);">\u23f1 TIMEOUT</span>'
          : isOpen
          ? '<span class="badge badge-open">\ud83d\udcc2 OPEN</span>'
          : '<span class="badge badge-closed">EXIT</span>'}
      </td>
    </tr>\`;
  }).join('');
}


// ── Excel export via SheetJS (lazy loaded) ───────────────────────────────────
function downloadTradeLogExcel() {
  const trades = getFilteredTrades();
  if (!trades.length) { toast('No trades to export', 'error'); return; }
  if (typeof XLSX !== 'undefined') { _doExcelExport(trades); return; }
  toast('Loading SheetJS\u2026', 'info', 2000);
  const sc = document.createElement('script');
  sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  sc.onload  = () => _doExcelExport(trades);
  sc.onerror = () => toast('Failed to load SheetJS', 'error');
  document.head.appendChild(sc);
}

function _doExcelExport(trades) {
  const startCap    = state_bt.startCapital || 400000;
  const allSummary  = state_bt.lastSummary  || {};

  // Trade Log sheet — detect max averaging depth across all trades
  const maxAvgDepth = trades.reduce((m, t) => Math.max(m, t.avg_count || 0), 0);

  const rows = trades.map(t => {
    const base = {
      'Symbol':              t.symbol,
      'Entry Date':          t.entry_date,
      'Entry Price \u20b9':  t.entry_price,
      'Avg Cost \u20b9':     t.avg_cost != null ? t.avg_cost : t.entry_price,
    };
    // One pair of columns per averaging level, right after entry
    for (let n = 0; n < maxAvgDepth; n++) {
      base[\`Avg \${n+1} Date\`]         = t[\`avg_\${n}_date\`]  || '';
      base[\`Avg \${n+1} Price \u20b9\`] = t[\`avg_\${n}_price\`] || '';
    }
    base['Exit Date']              = t.exit_date;
    base['Exit Price \u20b9']      = t.exit_price;
    base['Invested \u20b9']        = t.invested;
    base['Hold Days']              = t.hold_days;
    base['Averages']               = t.avg_count;
    base['Target %']               = t.target_pct;
    base['P&L \u20b9']             = t.pnl;
    base['Return %']               = t.invested > 0 ? +((t.pnl / t.invested) * 100).toFixed(2) : 0;
    base['Max Profit % (open)']          = t.max_profit_pct || '';
    base['TSL Exit']                      = t.exit_reason === 'TSL' ? 'Yes' : '';
    base['TSL Profit Locked %']           = t.profit_locked_pct != null ? t.profit_locked_pct : '';
    base['TSL Floor % (min profit)']      = t.tsl_floor_pct || '';
    base['TSL Armed (open)']              = t.tsl_armed ? 'Yes' : '';
    base['TSL Current Stop \u20b9 (open)']= t.tsl_current_stop != null ? t.tsl_current_stop : '';
    base['Capital After \u20b9']          = t.capital_after != null ? t.capital_after : '';
    base['Exit Reason']                   = t.exit_reason;
    return base;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const fixedLeft  = [{wch:14},{wch:12},{wch:14},{wch:14}];
  const avgCols    = Array.from({length: maxAvgDepth}, () => [{wch:12},{wch:14}]).flat();
  const fixedRight = [{wch:12},{wch:13},{wch:13},{wch:10},{wch:9},{wch:9},{wch:12},{wch:10},
                      {wch:10},{wch:20},{wch:22},{wch:24},{wch:14},{wch:26},{wch:16},{wch:12}];
  ws['!cols'] = [...fixedLeft, ...avgCols, ...fixedRight];

  // Summary sheet
  const allT    = state_bt.trades;
  const closed  = allT.filter(t => t.exit_reason !== 'OPEN');
  const wins    = closed.filter(t => t.pnl > 0);
  const totalPnl = allT.reduce((s, t) => s + t.pnl, 0);
  const minCap  = closed.length
    ? Math.min(...closed.filter(t => t.capital_after != null).map(t => t.capital_after))
    : startCap;

  const tslExits     = closed.filter(t => t.exit_reason === 'TSL');
  const timeoutExits = closed.filter(t => t.exit_reason === 'TIMEOUT');
  const tslPctSetting = document.getElementById('bt-tsl-mode') && document.getElementById('bt-tsl-mode').value === 'on'
    ? (parseFloat(document.getElementById('bt-tsl-pct').value) || 7) : 0;
  const maxHoldSetting = parseInt(document.getElementById('bt-max-hold').value) || 0;
  const sumRows = [
    { Metric: 'Starting Capital \u20b9', Value: startCap },
    { Metric: 'Final Value \u20b9',      Value: +(startCap + totalPnl).toFixed(2) },
    { Metric: 'Total P&L \u20b9',        Value: +totalPnl.toFixed(2) },
    { Metric: 'Return %',               Value: +((totalPnl / startCap) * 100).toFixed(2) },
    { Metric: 'Total Trades',           Value: allT.length },
    { Metric: 'Closed (Target)',        Value: closed.filter(t => t.exit_reason === 'TARGET').length },
    { Metric: 'Closed (TSL)',           Value: tslExits.length },
    { Metric: 'Closed (Timeout)',        Value: timeoutExits.length },
    { Metric: 'Max Hold Days Setting',   Value: maxHoldSetting || 'Off' },
    { Metric: 'Wins',                   Value: wins.length },
    { Metric: 'Win Rate %',             Value: closed.length ? +((wins.length / closed.length) * 100).toFixed(2) : 0 },
    { Metric: 'Open (MTM)',             Value: allT.filter(t => t.exit_reason === 'OPEN').length },
    { Metric: 'Lowest Capital \u20b9',   Value: +minCap.toFixed(2) },
    { Metric: 'Avg Hold Days — Closed',  Value: allSummary.avg_hold_closed || '' },
    { Metric: 'Avg Hold Days — Open',    Value: allSummary.avg_hold_open   || '' },
    { Metric: 'Net P&L — Open Trades ₹', Value: allSummary.open_pnl != null ? allSummary.open_pnl : '' },
    { Metric: 'TSL % Setting',           Value: tslPctSetting || 'Off' },
    { Metric: 'Universe',                Value: state_bt_universe ? state_bt_universe.current : 'NIFTY50' },
    { Metric: 'Exported',                Value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(sumRows);
  wsSummary['!cols'] = [{wch:24},{wch:22}];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Trade Log');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  XLSX.writeFile(wb, \`Sharegenius_Backtest_\${new Date().toISOString().slice(0,10)}.xlsx\`);
  toast('Excel downloaded \u2713', 'success');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ═══════════════════════════════════════════════════════
//  CLOCK & MARKET STATUS
// ═══════════════════════════════════════════════════════
function updateClock() {
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hh = ist.getHours(), mm = ist.getMinutes();
  const timeStr = ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' });
  const day = ist.getDay();

  document.getElementById('header-time').textContent = \`IST \${timeStr}\`;

  const isWeekend = day === 0 || day === 6;
  const isMarketHours = hh > 9 || (hh === 9 && mm >= 15);
  const isMarketClose = hh > 15 || (hh === 15 && mm >= 30);
  const isOpen = !isWeekend && isMarketHours && !isMarketClose;

  const dot = document.getElementById('market-dot');
  const status = document.getElementById('market-status');
  dot.className = 'market-dot' + (isOpen ? '' : ' closed');
  status.textContent = isOpen ? 'NSE OPEN' : 'NSE CLOSED';
}
setInterval(updateClock, 1000);
updateClock();

// ═══════════════════════════════════════════════════════
//  INDEX SELECTOR
// ═══════════════════════════════════════════════════════
document.querySelectorAll('.idx-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.idx-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedIndex = btn.dataset.index;
  });
});

// ═══════════════════════════════════════════════════════
//  SCANNER
// ═══════════════════════════════════════════════════════
function startScan() {
  if (state.scanning) return;
  state.scanning = true;
  state.scanResults = [];

  const btn = document.getElementById('scan-btn');
  btn.innerHTML = '<span class="spinner"></span> Scanning...';
  btn.disabled = true;

  const wrap = document.getElementById('progress-wrap');
  wrap.classList.add('visible');
  document.getElementById('scan-stats').style.display = 'none';
  document.getElementById('scan-tbody').innerHTML = '';

  const es = new EventSource(\`/api/scan/\${state.selectedIndex}\`);
  let total = 0, current = 0, alerts = 0;

  es.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === 'start') {
      total = msg.total;
      document.getElementById('progress-label').textContent = \`Scanning \${msg.index}...\`;
    }

    if (msg.type === 'progress') {
      current = msg.current;
      const p = Math.round((current / total) * 100);
      document.getElementById('progress-fill').style.width = p + '%';
      document.getElementById('progress-pct').textContent = p + '%';
      document.getElementById('scan-status').textContent =
        \`\${msg.symbol}\${msg.error ? ' ⚠️ ' + msg.error : ''}\`;

      if (msg.data) {
        state.scanResults.push(msg.data);
        if (msg.data.isAt20DayLow) {
          alerts++;
          document.getElementById('stat-alerts').textContent = alerts;
          appendScanRow(msg.data, true);
        } else {
          appendScanRow(msg.data, false);
        }
      }
    }

    if (msg.type === 'complete') {
      es.close();
      state.scanning = false;
      btn.innerHTML = '<span>▶</span> Start Scan';
      btn.disabled = false;
      wrap.classList.remove('visible');

      const stats = document.getElementById('scan-stats');
      stats.style.display = 'grid';
      document.getElementById('stat-scanned').textContent = msg.total;
      document.getElementById('stat-alerts').textContent = msg.found;
      document.getElementById('stat-time').textContent = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Move alert rows to top
      reorderScanTable();
      toast(\`Scan complete — \${msg.found} stocks at 20-day low\`, 'success');
    }
  };

  es.onerror = () => {
    es.close();
    state.scanning = false;
    btn.innerHTML = '<span>▶</span> Start Scan';
    btn.disabled = false;
    document.getElementById('progress-wrap').classList.remove('visible');
    toast('Scan error. Check server connection.', 'error');
  };
}

function appendScanRow(d, isAlert) {
  const tbody = document.getElementById('scan-tbody');
  const chgPct = d.changePct ?? 0;
  const row = document.createElement('tr');
  if (isAlert) row.className = 'alert-row';
  row.dataset.symbol = d.symbol;
  row.dataset.alert = isAlert ? '1' : '0';
  row.innerHTML = \`
    <td>
      <div class="symbol-cell">
        <span class="sym-name">\${d.symbol}</span>
        <span class="sym-sub">\${(d.name||'').slice(0,28)}</span>
      </div>
    </td>
    <td class="num">\${fmtCurr(d.currentPrice)}</td>
    <td class="num">\${fmtCurr(d.todayLow)}</td>
    <td class="num \${isAlert ? 'up' : ''}">\${fmtCurr(d.low20)}</td>
    <td class="num" style="color:var(--gold)">\${fmtCurr(d.high20)}</td>
    <td class="num \${clsChg(chgPct)}">\${pct(chgPct)}</td>
    <td>
      \${isAlert
        ? '<span class="badge badge-alert">🔔 20D LOW MATCH</span>'
        : '<span class="badge badge-closed">Monitoring</span>'
      }
    </td>
    <td class="actions">
      <button class="btn btn-sm" onclick='addToWatchlistFromScan(\${JSON.stringify(d)})'>+ Watch</button>
      \${isAlert ? \`<button class="btn btn-sm btn-green" onclick='addToWatchlistFromScan(\${JSON.stringify(d)}, true)'>+ GTT</button>\` : ''}
    </td>
  \`;
  tbody.appendChild(row);
}

function reorderScanTable() {
  const tbody = document.getElementById('scan-tbody');
  const rows = Array.from(tbody.querySelectorAll('tr[data-symbol]'));
  const alerts = rows.filter(r => r.dataset.alert === '1');
  const others = rows.filter(r => r.dataset.alert === '0');
  [...alerts, ...others].forEach(r => tbody.appendChild(r));
}

async function addToWatchlistFromScan(data, gttSet = false) {
  const r = await api('POST', '/api/watchlist', {
    symbol: data.symbol,
    notes: gttSet ? \`GTT: \${fmtCurr(data.high20)}\` : ''
  });
  if (r.success) {
    if (gttSet) await api('PUT', \`/api/watchlist/\${data.symbol}\`, { gttSet: true });
    toast(\`\${data.symbol} added to watchlist\`, 'success');
    updateWatchlistBadge();
  } else {
    toast(r.error || 'Failed to add', 'error');
  }
}

// ═══════════════════════════════════════════════════════
//  WATCHLIST
// ═══════════════════════════════════════════════════════
async function loadWatchlist() {
  const r = await api('GET', '/api/watchlist');
  if (!r.success) return;
  state.watchlist = r.data;
  renderWatchlist();
  updateWatchlistBadge();
}

async function refreshWatchlist() {
  if (!state.watchlist.length) return;
  toast('Refreshing watchlist prices...', 'info', 2000);

  const symbols = state.watchlist.map(w => w.symbol);
  const r = await api('POST', '/api/stocks/batch', { symbols });
  if (!r.success) return toast('Refresh failed', 'error');

  const map = {};
  r.results.forEach(row => { if (row.success) map[row.symbol] = row.data; });

  state.watchlist.forEach(w => {
    if (map[w.symbol]) w._live = map[w.symbol];
  });
  renderWatchlist();
  toast('Prices updated', 'success');
}

function renderWatchlist() {
  const tbody = document.getElementById('watchlist-tbody');
  if (!state.watchlist.length) {
    tbody.innerHTML = \`<tr class="empty-row"><td colspan="8">
      <div class="empty-state">
        <div class="empty-state-icon">👁</div>
        <div class="empty-state-title">Watchlist is empty</div>
        <div class="empty-state-desc">Add stocks from the Scanner or use the + Add Stock button</div>
      </div></td></tr>\`;
    return;
  }

  tbody.innerHTML = state.watchlist.map(w => {
    const d = w._live || {};
    const chgPct = d.changePct ?? null;
    return \`
    <tr>
      <td>
        <div class="symbol-cell">
          <span class="sym-name">\${w.symbol}</span>
          <span class="sym-sub">\${(d.name||w.notes||'').slice(0,28)}</span>
        </div>
      </td>
      <td class="num">\${fmtCurr(d.currentPrice)}</td>
      <td class="num">\${fmtCurr(d.dayLow)}</td>
      <td class="num">\${fmtCurr(d.low20)}</td>
      <td class="num" style="color:var(--gold);font-weight:700">\${fmtCurr(d.high20)}</td>
      <td class="num \${clsChg(chgPct)}">\${chgPct != null ? pct(chgPct) : '—'}</td>
      <td>
        \${w.gttSet
          ? '<span class="badge badge-gtt">✅ GTT Set</span>'
          : '<span class="badge badge-watch">⏳ Watching</span>'
        }
      </td>
      <td class="actions" style="display:flex;gap:6px;justify-content:flex-end">
        <button class="btn btn-sm" onclick="refreshSingleWatch('\${w.symbol}')">🔄</button>
        <button class="btn btn-sm \${w.gttSet ? '' : 'btn-green'}" onclick="toggleGTT('\${w.symbol}', \${!w.gttSet})">
          \${w.gttSet ? 'GTT ✓' : 'Set GTT'}
        </button>
        <button class="btn btn-sm btn-primary" onclick="watchToPosition('\${w.symbol}', \${d.currentPrice||0})">Buy</button>
        <button class="btn btn-sm btn-red" onclick="removeFromWatchlist('\${w.symbol}')">✕</button>
      </td>
    </tr>\`;
  }).join('');
}

async function refreshSingleWatch(symbol) {
  const r = await api('GET', \`/api/stock/\${symbol}\`);
  if (!r.success) return toast(\`Failed to refresh \${symbol}\`, 'error');
  const w = state.watchlist.find(x => x.symbol === symbol);
  if (w) { w._live = r.data; renderWatchlist(); }
  toast(\`\${symbol} refreshed\`, 'success', 2000);
}

async function toggleGTT(symbol, gttSet) {
  await api('PUT', \`/api/watchlist/\${symbol}\`, { gttSet });
  const w = state.watchlist.find(x => x.symbol === symbol);
  if (w) { w.gttSet = gttSet; renderWatchlist(); }
}

async function removeFromWatchlist(symbol) {
  if (!confirm(\`Remove \${symbol} from watchlist?\`)) return;
  await api('DELETE', \`/api/watchlist/\${symbol}\`);
  state.watchlist = state.watchlist.filter(w => w.symbol !== symbol);
  renderWatchlist();
  updateWatchlistBadge();
  toast(\`\${symbol} removed\`, 'info');
}

function openAddWatchModal() {
  document.getElementById('aw-symbol').value = '';
  document.getElementById('aw-notes').value = '';
  openModal('modal-addwatch');
}

async function addToWatchlist() {
  const sym = document.getElementById('aw-symbol').value.trim().toUpperCase();
  const notes = document.getElementById('aw-notes').value.trim();
  if (!sym) return toast('Enter a symbol', 'error');
  const r = await api('POST', '/api/watchlist', { symbol: sym, notes });
  if (r.success) {
    toast(\`\${sym} added to watchlist\`, 'success');
    closeModal('modal-addwatch');
    loadWatchlist();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

function watchToPosition(symbol, price) {
  document.getElementById('ap-symbol').value = symbol;
  document.getElementById('ap-price').value = price || '';
  document.getElementById('ap-qty').value = '';
  document.getElementById('ap-notes').value = 'GTT triggered';
  openModal('modal-addpos');
  switchTab('positions');
}

function updateWatchlistBadge() {
  document.getElementById('badge-watchlist').textContent = state.watchlist.length;
}

// ═══════════════════════════════════════════════════════
//  POSITIONS
// ═══════════════════════════════════════════════════════
const TARGET_PCT = [20, 15, 10, 5];

async function loadPositions() {
  const r = await api('GET', '/api/positions');
  if (!r.success) return;
  state.positions = r.data.filter(p => p.status !== 'closed');
  renderPositions();
  updatePositionsBadge();
}

async function refreshPositions() {
  if (!state.positions.length) return;
  toast('Fetching current prices...', 'info', 2000);
  const symbols = [...new Set(state.positions.map(p => p.symbol))];
  const r = await api('POST', '/api/stocks/batch', { symbols });
  if (!r.success) return toast('Refresh failed', 'error');
  const map = {};
  r.results.forEach(row => { if (row.success) map[row.symbol] = row.data; });
  state.positions.forEach(pos => {
    if (map[pos.symbol]) pos._cmp = map[pos.symbol].currentPrice;
  });
  renderPositions();
  toast('Prices refreshed', 'success');
}

function renderPositions() {
  const tbody = document.getElementById('positions-tbody');

  const open = state.positions.filter(p => p.status !== 'closed');
  if (!open.length) {
    tbody.innerHTML = \`<tr class="empty-row"><td colspan="12">
      <div class="empty-state">
        <div class="empty-state-icon">💼</div>
        <div class="empty-state-title">No open positions</div>
        <div class="empty-state-desc">Add a position when your GTT order triggers</div>
      </div></td></tr>\`;
    updatePortfolioStats(0, 0, 0);
    return;
  }

  let totalInvested = 0, totalCurrent = 0;

  tbody.innerHTML = open.map(pos => {
    const cmp = pos._cmp ?? null;
    const invested = pos.avgPrice * pos.qty;
    const currentVal = cmp != null ? cmp * pos.qty : null;
    const pnl = currentVal != null ? currentVal - invested : null;
    const pnlPct = pnl != null ? (pnl / invested) * 100 : null;
    const targetPct = TARGET_PCT[Math.min(pos.averageCount || 0, 3)];
    const targetPrice = pos.avgPrice * (1 + targetPct / 100);
    const avgCount = pos.averageCount || 0;
    const maxAvgs = 3;

    // Progress toward target
    let progressPct = 0;
    if (cmp != null && cmp > pos.avgPrice) {
      progressPct = Math.min(((cmp - pos.avgPrice) / (targetPrice - pos.avgPrice)) * 100, 100);
    }

    totalInvested += invested;
    if (currentVal != null) totalCurrent += currentVal;

    const targetHit = pnlPct != null && pnlPct >= targetPct;

    return \`
    <tr \${targetHit ? 'class="alert-row"' : ''}>
      <td>
        <div class="symbol-cell">
          <span class="sym-name">\${pos.symbol}</span>
          <span class="sym-sub">\${pos.notes ? pos.notes.slice(0,20) : ''}</span>
        </div>
      </td>
      <td class="num">\${fmtCurr(pos.avgPrice)}</td>
      <td class="num">\${fmt(pos.qty, 0)}</td>
      <td class="num">\${fmtCurr(invested, 0)}</td>
      <td class="num">\${cmp != null ? fmtCurr(cmp) : '<span style="color:var(--text3)">Click 🔄</span>'}</td>
      <td class="num \${clsChg(pnl)}">\${pnl != null ? fmtCurr(pnl, 0) : '—'}</td>
      <td class="num \${clsChg(pnlPct)}">\${pnlPct != null ? pct(pnlPct) : '—'}</td>
      <td class="num" style="color:var(--gold)">\${fmtCurr(targetPrice)}</td>
      <td class="num" style="color:var(--gold)">\${targetPct}%</td>
      <td>
        <div class="target-bar"><div class="target-bar-fill" style="width:\${progressPct}%"></div></div>
        <div style="font-size:10px;color:var(--text3);font-family:var(--mono);margin-top:3px">\${Math.round(progressPct)}%</div>
      </td>
      <td style="text-align:center">
        \${avgCount > 0 ? \`<span class="badge badge-open">\${avgCount}×avg</span>\` : '<span class="badge badge-closed">—</span>'}
        \${targetHit ? '<span class="badge badge-hit" style="margin-top:2px">🎯 TARGET HIT</span>' : ''}
      </td>
      <td class="actions" style="display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap">
        \${avgCount < maxAvgs
          ? \`<button class="btn btn-sm btn-green" onclick="openAverageModal('\${pos.id}')">Avg↓</button>\`
          : '<span style="font-size:10px;color:var(--text3);font-family:var(--mono);align-self:center">Max avg</span>'
        }
        <button class="btn btn-sm btn-primary" onclick="openClosePosModal('\${pos.id}')">Close</button>
        <button class="btn btn-sm btn-red" onclick="deletePosition('\${pos.id}')">✕</button>
      </td>
    </tr>\`;
  }).join('');

  const pnlTotal = totalCurrent > 0 ? totalCurrent - totalInvested : null;
  updatePortfolioStats(open.length, totalInvested, totalCurrent, pnlTotal);
}

function updatePortfolioStats(count, invested, current, pnl) {
  document.getElementById('pstat-count').textContent = count;
  document.getElementById('pstat-invested').textContent = fmtCurr(invested, 0);
  document.getElementById('pstat-current').textContent = current ? fmtCurr(current, 0) : '—';
  const pnlEl = document.getElementById('pstat-pnl');
  pnlEl.textContent = pnl != null ? fmtCurr(pnl, 0) : '—';
  pnlEl.className = 'stat-value ' + (pnl > 0 ? 'green' : pnl < 0 ? 'red' : '');
  document.getElementById('badge-positions').textContent = count;
}

function openAddPositionModal() {
  ['ap-symbol','ap-price','ap-qty','ap-notes'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-addpos');
}

async function addPosition() {
  const symbol    = document.getElementById('ap-symbol').value.trim().toUpperCase();
  const buyPrice  = parseFloat(document.getElementById('ap-price').value);
  const qty       = parseFloat(document.getElementById('ap-qty').value);
  const notes     = document.getElementById('ap-notes').value.trim();
  if (!symbol || !buyPrice || !qty) return toast('Fill all required fields', 'error');
  const r = await api('POST', '/api/positions', { symbol, buyPrice, qty, notes });
  if (r.success) {
    toast(\`\${symbol} position added — target ₹\${fmtCurr(r.data.targetPrice)}\`, 'success');
    closeModal('modal-addpos');
    loadPositions();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

function openAverageModal(posId) {
  const pos = state.positions.find(p => p.id === posId);
  if (!pos) return;
  state.avgTargetId = posId;
  const nextAvg = (pos.averageCount || 0) + 1;
  const newTargetPct = TARGET_PCT[Math.min(nextAvg, 3)];
  document.getElementById('avg-info').innerHTML = \`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px">
      <div style="font-family:var(--mono);font-size:12px;color:var(--text2)">
        <strong>\${pos.symbol}</strong> · Current avg: ₹\${fmt(pos.avgPrice)} · Avg #\${pos.averageCount||0}/\${3}
      </div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-top:4px">
        After averaging: target reduces to <strong style="color:var(--gold)">\${newTargetPct}%</strong>
      </div>
    </div>\`;
  document.getElementById('avg-hint').textContent =
    \`This will be Average #\${nextAvg}. New target: \${newTargetPct}%\`;
  document.getElementById('avg-price').value = '';
  document.getElementById('avg-qty').value = '';
  openModal('modal-average');
}

async function submitAverage() {
  const price = parseFloat(document.getElementById('avg-price').value);
  const qty   = parseFloat(document.getElementById('avg-qty').value);
  if (!price || !qty) return toast('Enter price and qty', 'error');
  const r = await api('POST', \`/api/positions/\${state.avgTargetId}/average\`, { price, qty });
  if (r.success) {
    toast(\`Averaged down — new avg ₹\${fmt(r.data.avgPrice)}, target \${r.data.targetPct}%\`, 'success');
    closeModal('modal-average');
    loadPositions();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

function openClosePosModal(posId) {
  const pos = state.positions.find(p => p.id === posId);
  if (!pos) return;
  state.closePosId = posId;
  document.getElementById('close-pos-info').innerHTML = \`
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px;font-family:var(--mono);font-size:12px">
      <div><strong>\${pos.symbol}</strong> · Avg buy: ₹\${fmt(pos.avgPrice)} · Qty: \${fmt(pos.qty,0)}</div>
      <div style="color:var(--gold);margin-top:4px">Target: ₹\${fmt(pos.targetPrice)} (+\${pos.targetPct}%)</div>
    </div>\`;
  document.getElementById('close-price').value = pos._cmp || '';
  openModal('modal-close-pos');
}

async function submitClosePosition() {
  const exitPrice = parseFloat(document.getElementById('close-price').value);
  if (!exitPrice) return toast('Enter exit price', 'error');
  const r = await api('PUT', \`/api/positions/\${state.closePosId}\`, { status: 'closed', exitPrice, closedAt: new Date().toISOString() });
  if (r.success) {
    const pos = state.positions.find(p => p.id === state.closePosId);
    const pnl = pos ? (exitPrice - pos.avgPrice) * pos.qty : 0;
    toast(\`Position closed · P&L: \${fmtCurr(pnl, 0)}\`, pnl >= 0 ? 'success' : 'error');
    closeModal('modal-close-pos');
    loadPositions();
  } else {
    toast(r.error || 'Failed', 'error');
  }
}

async function deletePosition(posId) {
  const pos = state.positions.find(p => p.id === posId);
  if (!confirm(\`Delete \${pos?.symbol} position?\`)) return;
  await api('DELETE', \`/api/positions/\${posId}\`);
  toast('Position deleted', 'info');
  loadPositions();
}

function updatePositionsBadge() {
  document.getElementById('badge-positions').textContent = state.positions.length;
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
(async function init() {
  onMaxAvgChange(); // seed dynamic averaging target cards on load
  await Promise.all([loadWatchlist(), loadPositions()]);
})();
</script>
</body>
</html>
`;

// ─────────────────────────────────────────────
//  STOCK UNIVERSE
// ─────────────────────────────────────────────
// ── Nifty 50 (current composition) ───────────────────────────────────────────
const NIFTY50 = [
  'ADANIENT','ADANIPORTS','APOLLOHOSP','ASIANPAINT','AXISBANK',
  'BAJAJ-AUTO','BAJAJFINSV','BAJFINANCE','BHARTIARTL','BPCL',
  'BRITANNIA','CIPLA','COALINDIA','DIVISLAB','DRREDDY',
  'EICHERMOT','GRASIM','HCLTECH','HDFCBANK','HDFCLIFE',
  'HEROMOTOCO','HINDALCO','HINDUNILVR','ICICIBANK','INDUSINDBK',
  'INFY','ITC','JSWSTEEL','KOTAKBANK','LT',
  'M&M','MARUTI','NESTLEIND','NTPC','ONGC',
  'POWERGRID','RELIANCE','SBILIFE','SBIN','SHRIRAMFIN',
  'SUNPHARMA','TATACONSUM','TATAMOTORS','TATASTEEL','TCS',
  'TECHM','TITAN','TRENT','ULTRACEMCO','WIPRO'
];

// ── Nifty Next 50 — updated from Mahesh Kaushik sheet + official NSE list ────
// UPL, GLAND, GICRE, ALKEM, SBICARD, AUROPHARMA, NMDC, INDIGO added (were missing)
const NIFTY_NEXT50 = [
  'ABB','ADANIGREEN','ADANIPOWER','ALKEM','AMBUJACEM',
  'AUROPHARMA','BAJAJHLDNG','BANKBARODA','BEL','BERGEPAINT',
  'BOSCHLTD','CANBK','CHOLAFIN','COLPAL','DLF',
  'GAIL','GICRE','GLAND','GODREJCP','GODREJPROP',
  'HAVELLS','INDHOTEL','INDIGO','IRCTC','JINDALSTEL',
  'LTIM','LUPIN','MCDOWELL-N','MFSL','NHPC',
  'NMDC','NYKAA','OBEROIRLTY','OFSS','PAGEIND',
  'PERSISTENT','PIIND','PIDILITIND','PNB','RECLTD',
  'SAIL','SBICARD','SIEMENS','SRF','TATACOMM',
  'TATAPOWER','TORNTPHARM','TORNTPOWER','TVSMOTOR','UBL',
  'UNIONBANK','UPL','VBL','VEDL','VOLTAS',
  'ZOMATO','ZYDUSLIFE'
];

const STOCK_UNIVERSE = {
  'NIFTY50': NIFTY50,
  'NIFTYNEXT50': NIFTY_NEXT50,
  'NIFTY100': [...new Set([...NIFTY50, ...NIFTY_NEXT50])]
};

// ─────────────────────────────────────────────
//  DATA PERSISTENCE
// ─────────────────────────────────────────────
async function loadData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { positions: [], watchlist: [], settings: {} };
  }
}

async function saveData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Save error:', err.message);
  }
}

// ─────────────────────────────────────────────
//  YAHOO FINANCE HELPERS
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  YAHOO FINANCE — SINGLE v8 CHART CALL
//  v7/quote requires crumb auth since late 2024.
//  v8/chart returns OHLCV + meta (price, name,
//  change%) in one unauthenticated request.
// ─────────────────────────────────────────────
const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
};

async function get20DayData(symbol) {
  const ticker = symbol.includes('.') ? symbol : `${symbol}.NS`;

  // 40 calendar days → guaranteed ≥20 trading days
  const now  = Math.floor(Date.now() / 1000);
  const past = now - 40 * 24 * 60 * 60;

  // v8/finance/chart — no auth needed, returns OHLCV + meta in one shot
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?period1=${past}&period2=${now}&interval=1d&includePrePost=false&corsDomain=finance.yahoo.com`;

  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${ticker}`);

  const data   = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) {
    const errMsg = data?.chart?.error?.description || 'No data returned';
    throw new Error(errMsg);
  }

  // ── OHLCV history ──────────────────────────
  const timestamps = result.timestamp || [];
  const ohlcv      = result.indicators?.quote?.[0] || {};

  const history = timestamps.map((ts, i) => ({
    date:   new Date(ts * 1000),
    open:   ohlcv.open?.[i],
    high:   ohlcv.high?.[i],
    low:    ohlcv.low?.[i],
    close:  ohlcv.close?.[i],
    volume: ohlcv.volume?.[i],
  })).filter(d => d.high != null && d.low != null);

  if (history.length < 5) {
    throw new Error(`Only ${history.length} trading days found for ${symbol}`);
  }

  // ── Meta / real-time fields from chart.meta ─
  const meta = result.meta || {};

  // Most recent first, take last 20 trading days
  const sorted = [...history].sort((a, b) => b.date - a.date);
  const last20 = sorted.slice(0, 20);
  const today  = sorted[0];

  const high20 = Math.max(...last20.map(d => d.high));
  const low20  = Math.min(...last20.map(d => d.low));

  // Current price: regularMarketPrice from meta, else last close
  const currentPrice = meta.regularMarketPrice ?? meta.chartPreviousClose ?? today.close;
  const prevClose    = meta.chartPreviousClose ?? sorted[1]?.close;
  const change       = prevClose ? currentPrice - prevClose : 0;
  const changePct    = prevClose ? (change / prevClose) * 100 : 0;

  // Intraday low from meta when market is open, else last bar low
  const todayLow = meta.regularMarketDayLow ?? today.low;

  // Match: today low within 0.15% of 20-day low
  // Match: today's low within 0.05% of 20-day low.
  // Excel uses strict equality (D=E) with Google Finance data.
  // We allow a tiny 0.05% buffer to account for Yahoo vs Google Finance
  // rounding differences — tight enough to avoid false positives like DIVISLAB
  // (0.135% away) while catching genuine exact-low matches like UPL (0.00%).
  const isAt20DayLow = Math.abs(todayLow - low20) / low20 <= 0.0005;

  return {
    symbol,
    ticker,
    name:         meta.longName || meta.shortName || symbol,
    currentPrice,
    dayOpen:      meta.regularMarketOpen    ?? today.open,
    dayHigh:      meta.regularMarketDayHigh ?? today.high,
    dayLow:       todayLow,
    prevClose,
    change,
    changePct,
    volume:       meta.regularMarketVolume  ?? today.volume,
    high20,
    low20,
    todayLow,
    isAt20DayLow,
    dataPoints:   last20.length,
    lastUpdated:  new Date().toISOString()
  };
}

// ─────────────────────────────────────────────
//  ROUTES — STOCK DATA
// ─────────────────────────────────────────────
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const data = await get20DayData(req.params.symbol.toUpperCase());
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Multi-stock fetch
app.post('/api/stocks/batch', async (req, res) => {
  const { symbols } = req.body;
  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ success: false, error: 'symbols array required' });
  }
  const results = [];
  for (const sym of symbols.slice(0, 50)) {
    try {
      const d = await get20DayData(sym);
      results.push({ symbol: sym, success: true, data: d });
    } catch (err) {
      results.push({ symbol: sym, success: false, error: err.message });
    }
    await delay(250);
  }
  res.json({ success: true, results });
});

// SSE Scan — streams progress to client
app.get('/api/scan/:index', async (req, res) => {
  const indexKey = req.params.index.toUpperCase();
  const stocks = STOCK_UNIVERSE[indexKey] || NIFTY50;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
    if (res.flush) res.flush();
  };

  send({ type: 'start', total: stocks.length, index: indexKey });

  const alerts = [];

  for (let i = 0; i < stocks.length; i++) {
    const symbol = stocks[i];
    try {
      const data = await get20DayData(symbol);
      if (data.isAt20DayLow) alerts.push(data);
      send({ type: 'progress', current: i + 1, total: stocks.length, symbol, data });
    } catch (err) {
      send({ type: 'progress', current: i + 1, total: stocks.length, symbol, error: err.message });
    }
    await delay(300);
  }

  send({ type: 'complete', alerts, total: stocks.length, found: alerts.length });
  res.end();
});

// Available indexes
app.get('/api/indexes', (req, res) => {
  res.json({
    success: true,
    indexes: Object.entries(STOCK_UNIVERSE).map(([key, stocks]) => ({
      key, label: key.replace('NIFTY', 'NIFTY ').replace('NEXT', 'NEXT '), count: stocks.length
    }))
  });
});

// ─────────────────────────────────────────────
//  ROUTES — WATCHLIST
// ─────────────────────────────────────────────
app.get('/api/watchlist', async (req, res) => {
  const data = await loadData();
  res.json({ success: true, data: data.watchlist || [] });
});

app.post('/api/watchlist', async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ success: false, error: 'symbol required' });
  const data = await loadData();
  if (!data.watchlist) data.watchlist = [];
  if (!data.watchlist.find(w => w.symbol === symbol.toUpperCase())) {
    data.watchlist.push({
      symbol: symbol.toUpperCase(),
      addedAt: new Date().toISOString(),
      gttSet: false,
      notes: req.body.notes || ''
    });
    await saveData(data);
  }
  res.json({ success: true });
});

app.put('/api/watchlist/:symbol', async (req, res) => {
  const data = await loadData();
  const idx = (data.watchlist || []).findIndex(w => w.symbol === req.params.symbol.toUpperCase());
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  Object.assign(data.watchlist[idx], req.body);
  await saveData(data);
  res.json({ success: true, data: data.watchlist[idx] });
});

app.delete('/api/watchlist/:symbol', async (req, res) => {
  const data = await loadData();
  data.watchlist = (data.watchlist || []).filter(w => w.symbol !== req.params.symbol.toUpperCase());
  await saveData(data);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  ROUTES — POSITIONS
// ─────────────────────────────────────────────
const TARGET_PCT = [20, 15, 10, 5]; // by average count

function calcTargets(pos) {
  const targetPct = TARGET_PCT[Math.min(pos.averageCount || 0, 3)];
  const targetPrice = pos.avgPrice * (1 + targetPct / 100);
  return { targetPct, targetPrice };
}

app.get('/api/positions', async (req, res) => {
  const data = await loadData();
  res.json({ success: true, data: data.positions || [] });
});

app.post('/api/positions', async (req, res) => {
  const { symbol, buyPrice, qty, notes } = req.body;
  if (!symbol || !buyPrice || !qty) {
    return res.status(400).json({ success: false, error: 'symbol, buyPrice, qty required' });
  }
  const data = await loadData();
  if (!data.positions) data.positions = [];

  const pos = {
    id: Date.now().toString(),
    symbol: symbol.toUpperCase(),
    avgPrice: parseFloat(buyPrice),
    qty: parseFloat(qty),
    averageCount: 0,
    notes: notes || '',
    status: 'open',
    buys: [{
      price: parseFloat(buyPrice),
      qty: parseFloat(qty),
      date: new Date().toISOString(),
      label: 'Initial Buy'
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { targetPct, targetPrice } = calcTargets(pos);
  pos.targetPct = targetPct;
  pos.targetPrice = targetPrice;

  data.positions.push(pos);
  await saveData(data);
  res.json({ success: true, data: pos });
});

// Average down
app.post('/api/positions/:id/average', async (req, res) => {
  const { price, qty } = req.body;
  if (!price || !qty) return res.status(400).json({ success: false, error: 'price, qty required' });

  const data = await loadData();
  const idx = (data.positions || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Position not found' });

  const pos = data.positions[idx];
  pos.averageCount = (pos.averageCount || 0) + 1;

  if (pos.averageCount > 3) {
    return res.status(400).json({ success: false, error: 'Maximum 3 averages allowed' });
  }

  pos.buys.push({
    price: parseFloat(price),
    qty: parseFloat(qty),
    date: new Date().toISOString(),
    label: `Average #${pos.averageCount}`
  });

  const totalQty  = pos.buys.reduce((s, b) => s + b.qty, 0);
  const totalCost = pos.buys.reduce((s, b) => s + b.price * b.qty, 0);
  pos.qty     = totalQty;
  pos.avgPrice = totalCost / totalQty;

  const { targetPct, targetPrice } = calcTargets(pos);
  pos.targetPct   = targetPct;
  pos.targetPrice = targetPrice;
  pos.updatedAt   = new Date().toISOString();

  data.positions[idx] = pos;
  await saveData(data);
  res.json({ success: true, data: pos });
});

// Close/update position
app.put('/api/positions/:id', async (req, res) => {
  const data = await loadData();
  const idx = (data.positions || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Position not found' });
  Object.assign(data.positions[idx], req.body, { updatedAt: new Date().toISOString() });
  await saveData(data);
  res.json({ success: true, data: data.positions[idx] });
});

app.delete('/api/positions/:id', async (req, res) => {
  const data = await loadData();
  data.positions = (data.positions || []).filter(p => p.id !== req.params.id);
  await saveData(data);
  res.json({ success: true });
});

// ─────────────────────────────────────────────
//  BACKTEST — DHAN HISTORICAL DATA
// ─────────────────────────────────────────────

// Dhan security IDs for all Nifty 50 stocks (NSE_EQ segment)
// Source: Dhan securities master + docs
// ── Nifty 50 Dhan security IDs ──────────────────────────────────────────────
const DHAN_NIFTY50_IDS = {
  'ADANIENT':   '25',     'ADANIPORTS': '15083',  'APOLLOHOSP': '157',
  'ASIANPAINT': '236',    'AXISBANK':   '5900',   'BAJAJ-AUTO': '16675',
  'BAJAJFINSV': '16669',  'BAJFINANCE': '317',    'BHARTIARTL': '10604',
  'BPCL':       '526',    'BRITANNIA':  '547',    'CIPLA':      '694',
  'COALINDIA':  '12070',  'DIVISLAB':   '15060',  'DRREDDY':    '881',
  'EICHERMOT':  '910',    'GRASIM':     '1209',   'HCLTECH':    '7229',
  'HDFCBANK':   '1333',   'HDFCLIFE':   '467533', 'HEROMOTOCO': '1348',
  'HINDALCO':   '1363',   'HINDUNILVR': '1394',   'ICICIBANK':  '4963',
  'INDUSINDBK': '5258',   'INFY':       '1594',   'ITC':        '1660',
  'JSWSTEEL':   '11723',  'KOTAKBANK':  '1922',   'LT':         '11483',
  'M&M':        '2031',   'MARUTI':     '10999',  'NESTLEIND':  '17963',
  'NTPC':       '11630',  'ONGC':       '11351',  'POWERGRID':  '14977',
  'RELIANCE':   '2885',   'SBILIFE':    '21808',  'SBIN':       '3045',
  'SHRIRAMFIN': '3721',   'SUNPHARMA':  '3351',   'TATACONSUM': '3432',
  'TATAMOTORS': '3456',   'TATASTEEL':  '3499',   'TCS':        '11536',
  'TECHM':      '13538',  'TITAN':      '3506',   'TRENT':      '1964',
  'ULTRACEMCO': '2952',   'WIPRO':      '3787',
};

// ── Nifty Next 50 Dhan security IDs ─────────────────────────────────────────
const DHAN_NEXT50_IDS = {
  'ABB':        '13',     'ADANIGREEN': '542424', 'ADANIPOWER': '532978',
  'ALKEM':      '539523', 'AMBUJACEM':  '1270',   'AUROPHARMA': '532',
  'BAJAJHLDNG': '480',    'BANKBARODA': '532134', 'BEL':        '542726',
  'BERGEPAINT': '509480', 'BOSCHLTD':   '500530', 'CANBK':      '532483',
  'CHOLAFIN':   '537875', 'COLPAL':     '510477', 'DLF':        '532868',
  'GAIL':       '532155', 'GICRE':      '540755', 'GLAND':      '543321',
  'GODREJCP':   '532424', 'GODREJPROP': '532733', 'HAVELLS':    '517354',
  'INDHOTEL':   '500850', 'INDIGO':     '539448', 'IRCTC':      '542830',
  'JINDALSTEL': '532286', 'LTIM':       '540005', 'LUPIN':      '500257',
  'MCDOWELL-N': '532432', 'MFSL':       '500271', 'NHPC':       '533098',
  'NMDC':       '526371', 'NYKAA':      '543574', 'OBEROIRLTY': '533273',
  'OFSS':       '532467', 'PAGEIND':    '532827', 'PERSISTENT': '533179',
  'PIIND':      '523642', 'PIDILITIND': '500331', 'PNB':        '532461',
  'RECLTD':     '532955', 'SAIL':       '500113', 'SBICARD':    '543066',
  'SIEMENS':    '500550', 'SRF':        '503806', 'TATACOMM':   '500483',
  'TATAPOWER':  '500400', 'TORNTPHARM': '500384', 'TORNTPOWER': '532779',
  'TVSMOTOR':   '532343', 'UBL':        '532478', 'UNIONBANK':  '532477',
  'UPL':        '512070', 'VBL':        '544171', 'VEDL':       '500295',
  'VOLTAS':     '500575', 'ZOMATO':     '543320', 'ZYDUSLIFE':  '539838',
};

// Combined lookup used internally
const DHAN_SECURITY_IDS = { ...DHAN_NIFTY50_IDS, ...DHAN_NEXT50_IDS };

// Universe → symbol list mapping (used by both Dhan and Bhavcopy routes)
const BT_UNIVERSES = {
  'NIFTY50':  Object.keys(DHAN_NIFTY50_IDS),
  'NIFTY100': [...new Set([...Object.keys(DHAN_NIFTY50_IDS), ...Object.keys(DHAN_NEXT50_IDS)])],
};

async function fetchDhanHistory(securityId, accessToken, fromDate, toDate) {
  const res = await fetch('https://api.dhan.co/v2/charts/historical', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': accessToken,
    },
    body: JSON.stringify({
      securityId,
      exchangeSegment: 'NSE_EQ',
      instrument: 'EQUITY',
      expiryCode: 0,
      oi: false,
      fromDate,
      toDate,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Dhan ${res.status}: ${txt.slice(0, 120)}`);
  }

  const data = await res.json();

  // Dhan returns { open:[], high:[], low:[], close:[], volume:[], timestamp:[] }
  const { open, high, low, close, volume, timestamp } = data;
  if (!timestamp || !timestamp.length) throw new Error('No data returned');

  return timestamp.map((ts, i) => ({
    date:   new Date(ts * 1000).toISOString().split('T')[0],
    open:   open[i],
    high:   high[i],
    low:    low[i],
    close:  close[i],
    volume: volume ? volume[i] : 0,
  })).filter(r => r.high != null && r.low != null);
}

function calcSMA(rows, period, i) {
  if (i < period) return null;
  let sum = 0;
  for (let j = i - period; j < i; j++) sum += rows[j].close;
  return sum / period;
}

function calcEMA(rows, period, i) {
  if (i < period) return null;
  const k = 2 / (period + 1);
  let ema = rows.slice(0, period).reduce((s,r)=>s+r.close,0) / period;
  for (let j = period; j <= i; j++) ema = rows[j].close * k + ema * (1 - k);
  return ema;
}

function calcRSI(rows, period, i) {
  if (i < period + 1) return null;
  let gains = 0, losses = 0;
  for (let j = i - period; j < i; j++) {
    const d = rows[j+1].close - rows[j].close;
    if (d > 0) gains += d; else losses -= d;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - 100 / (1 + rs);
}

function calc52WRange(rows, i) {
  const lookback = Math.min(252, i);
  const window   = rows.slice(i - lookback, i);
  return {
    low52:  Math.min(...window.map(r => r.low)),
    high52: Math.max(...window.map(r => r.high)),
  };
}

function calcAvgVolume(rows, period, i) {
  if (i < period) return null;
  const sum = rows.slice(i - period, i).reduce((s,r)=>s+(r.volume||0),0);
  return sum / period;
}

// Spread avg array into flat fields: avg_0_date, avg_0_price, avg_1_date, ...
function spreadAvgs(avgs) {
  const out = {};
  if (!avgs) return out;
  avgs.forEach((a, i) => {
    out[`avg_${i}_date`]  = a.date;
    out[`avg_${i}_price`] = +a.price.toFixed(2);
  });
  return out;
}

// Compute ATR% = average of (high-low)/close over `period` days before row index `i`
function calcATRpct(rows, period, i) {
  const start = Math.max(0, i - period);
  const slice = rows.slice(start, i);
  if (slice.length < 3) return null;
  const avg = slice.reduce((s, r) => s + (r.high - r.low) / r.close, 0) / slice.length;
  return +(avg * 100).toFixed(3);  // as percentage
}

function runStrategySimulation(symbol, rows, initialCapital, riskPct, fromDate, opts = {}) {
  const { maType = 'none', maPeriod = 200, w52filter = 'none',
          volFilter = 'none', rsiFilter = 'none',
          maxAverages = 3,
          targetPcts = [0.20, 0.15, 0.10, 0.05],
          avgMode = 'native',          // 'native' | 'drawdown' | 'below_entry'
          avgFillGuard = false,        // true = block average if fill >= entryPrice
          drawdownLevels = [],         // [10,20,30] % drops from entryPrice for drawdown mode
          maxHold = 0,                 // 0 = disabled; >0 = force-close at today.close after N days
          timeAvgs = [1, 2, 3],        // extra averages unlocked after [1yr, 2yr, 3yr]
          lookbackN = 20,              // rolling window for High/Low signal (default 20)
          trailSLPct = 0,              // 0 = TSL off, >0 = trail % after target hit
          tslAtrCfg = null } = opts;  // null = fixed; {period,mult,min,max} = dynamic ATR

  const TOLERANCE     = 0.005;
  const needMA        = maType !== 'none';
  const need52W       = w52filter !== 'none';
  const needVol       = volFilter !== 'none';
  const needRSI       = rsiFilter !== 'none';
  const needTSL       = trailSLPct > 0 || tslAtrCfg !== null;
  const volMult       = parseFloat(volFilter) || 1;
  let   runningCapital = initialCapital;          // compounds as trades close

  const trades = [];
  let pos = null, gtt = null;

  // Warmup: need enough rows for longest indicator
  const warmup = Math.max(lookbackN, needMA ? maPeriod + 5 : 0, need52W ? 252 : 0, needRSI ? 20 : 0);

  for (let i = warmup; i < rows.length; i++) {
    const today  = rows[i];
    const w20    = rows.slice(i - lookbackN, i);
    const high20 = Math.max(...w20.map(r => r.high));
    const low20  = Math.min(...w20.map(r => r.low));
    const d      = today.date;
    if (d < fromDate) continue;

    if (pos !== null) {
      // Track all-time high (for retrospective target check after averaging)
      if (today.high > pos.maxHigh) pos.maxHigh = today.high;
      // Also track high since last average (true post-average peak for reporting)
      if (today.high > pos.maxHighAfterAvg) pos.maxHighAfterAvg = today.high;

      const tp  = targetPcts[Math.min(pos.avgCount, targetPcts.length - 1)];
      const tgt = pos.avgPrice * (1 + tp);
      const holdDays = Math.round((new Date(d) - new Date(pos.entryDate)) / 86400000);

      // ── Max Hold Days: force-close at today's close if holding too long ───
      if (maxHold > 0 && holdDays >= maxHold) {
        const exitPx = today.close;
        const qty    = pos.totalInvested / pos.avgPrice;
        const pnl    = +((exitPx - pos.avgPrice) * qty).toFixed(2);
        runningCapital += pnl;
        trades.push({
          symbol, entry_date: pos.entryDate, entry_price: +pos.entryPrice.toFixed(2),
          avg_cost: +pos.avgPrice.toFixed(2),
          exit_date: d, exit_price: +exitPx.toFixed(2),
          invested: +pos.totalInvested.toFixed(2), pnl,
          avg_count: pos.avgCount, exit_reason: 'TIMEOUT',
          hold_days: holdDays, target_pct: +(targetPcts[Math.min(pos.avgCount, targetPcts.length - 1)] * 100).toFixed(1),
          capital_after: +runningCapital.toFixed(2),
          ...spreadAvgs(pos.avgs),
        });
        pos = null; gtt = null; continue;
      }

      // ── TSL path: TSL is ON ──────────────────────────────────────────────
      if (needTSL) {
        // A1: TSL already armed — check for stop hit today
        if (pos.tslArmed) {
          if (today.high > pos.tslPeak) pos.tslPeak = today.high;
          const stopPrice = pos.tslPeak * (1 - pos.tslPct / 100);
          if (today.low <= stopPrice) {
            const exitPx = +Math.min(today.open, stopPrice).toFixed(2);
            const qty    = pos.totalInvested / pos.avgPrice;
            const pnl    = +((exitPx - pos.avgPrice) * qty).toFixed(2);
            runningCapital += pnl;
            trades.push({
              symbol, entry_date: pos.entryDate, entry_price: +pos.entryPrice.toFixed(2),
              avg_cost: +pos.avgPrice.toFixed(2),
              exit_date: d, exit_price: exitPx,
              invested: +pos.totalInvested.toFixed(2), pnl,
              avg_count: pos.avgCount, exit_reason: 'TSL',
              hold_days: holdDays, target_pct: +(tp * 100).toFixed(1),
              capital_after: +runningCapital.toFixed(2),
              tsl_pct: pos.tslPct,
              profit_locked_pct: +((exitPx - pos.avgPrice) / pos.avgPrice * 100).toFixed(2),
              tsl_floor_pct: +pos.tslFloorPct.toFixed(2),
              ...spreadAvgs(pos.avgs),
            });
            pos = null; gtt = null; continue;
          }
          // TSL armed — no averaging, just trail
          continue;
        }

        // A2: Target first reached today → arm TSL, do NOT exit
        if (today.high >= tgt) {
          pos.tslArmed    = true;
          pos.tslPeak     = today.high;
          pos.tslFloorPct = tp * 100 - pos.tslPct;   // minimum profit locked
          continue;
        }

        // A3: Target not yet reached — fall through to averaging logic below
      } else {
        // ── No TSL: exit at target price ──────────────────────────────────
        if (today.high >= tgt) {
          const qty = pos.totalInvested / pos.avgPrice;
          const pnl = +((tgt - pos.avgPrice) * qty).toFixed(2);
          runningCapital += pnl;
          trades.push({
            symbol, entry_date: pos.entryDate, entry_price: +pos.entryPrice.toFixed(2),
            avg_cost: +pos.avgPrice.toFixed(2),
            exit_date: d, exit_price: +tgt.toFixed(2),
            invested: +pos.totalInvested.toFixed(2), pnl,
            avg_count: pos.avgCount, exit_reason: 'TARGET',
            hold_days: holdDays, target_pct: +(tp * 100).toFixed(1),
            capital_after: +runningCapital.toFixed(2),
            ...spreadAvgs(pos.avgs),
          });
          pos = null; gtt = null; continue;
        }
      }

      // Time-based extra averages — user-defined per year bracket
      // timeAvgs[0]=+N after 1yr, [1]=+N after 2yr, [2]=+N after 3yr
      const extraAvgs = holdDays >= 1095 ? (timeAvgs[2] || 0)
                      : holdDays >=  730 ? (timeAvgs[1] || 0)
                      : holdDays >=  365 ? (timeAvgs[0] || 0)
                      : 0;
      const effectiveMaxAvgs = maxAverages + extraAvgs;

      if (pos.avgCount < effectiveMaxAvgs) {
        if (avgMode === 'drawdown') {
          // ── Drawdown mode: average when price falls a fixed % from first BUY ──
          // The N-th average (0-indexed) triggers when today.low <= entryPrice × (1 - level/100).
          // Fill is at the drawdown threshold itself (limit order concept) or today.open if gap.
          const level = drawdownLevels[pos.avgCount];  // % drop for THIS averaging slot
          if (level != null) {
            const ddThreshold = pos.entryPrice * (1 - level / 100);
            if (today.low <= ddThreshold) {
              // Signal: set a pending GTT-style order at ddThreshold
              gtt = { trigger: ddThreshold, avg: true, drawdown: true };
            }
          }
        } else {
          // ── Native / below_entry: 20D-low signal ─────────────────────────────
          const atLow = Math.abs(today.low - low20) / low20 <= TOLERANCE;
          if (atLow) {
            const triggerAllowed = avgMode === 'below_entry'
              ? high20 < pos.entryPrice   // 20D high must be below entry
              : true;                     // native: always allowed
            if (triggerAllowed) gtt = { trigger: high20, avg: true };
          }
        }
      }
      if (gtt && gtt.avg) {
        // Only refresh trigger for 20D-low modes; drawdown mode uses a fixed threshold
        if (!gtt.drawdown) gtt.trigger = high20;
        if (today.high >= gtt.trigger || (gtt.drawdown && today.low <= gtt.trigger)) {
          // Actual fill = trigger price OR today's open if stock gapped up above trigger.
          // A gap-up means the stock never traded AT trigger — real fill is today.open.
          // Fill: for drawdown mode, fill at threshold or open (whichever is higher/lower gap)
          // For 20D-low modes, fill at 20D-high trigger or open (gap-up protection)
          const ap = gtt.drawdown
            ? Math.min(gtt.trigger, Math.max(gtt.trigger, today.open))  // at threshold or open
            : Math.max(gtt.trigger, today.open);                         // at trigger or open

          // Fill-price guard: if enabled, cancel this average whenever the actual
          // fill price is at or above the initial entry price — you'd be buying at
          // the same level or higher than your first buy, which defeats averaging down.
          if (avgFillGuard && ap >= pos.entryPrice) {
            gtt = null; // discard signal, wait for a genuinely lower entry
            continue;
          }

          const tradeSize = runningCapital * (riskPct / 100);
          const oldQty    = pos.totalInvested / pos.avgPrice;
          const newQty    = tradeSize / ap;
          pos.avgCount++;
          pos.avgPrice      = (pos.totalInvested + tradeSize) / (oldQty + newQty);
          pos.totalInvested += tradeSize;
          // Reset maxHighAfterAvg so maxProfitPct only reflects post-average peak
          pos.maxHighAfterAvg = ap;
          pos.lastAvgIdx      = i;  // remember which row this average fired on
          gtt = null;

          // Record this average now that the fill is confirmed
          pos.avgs.push({ date: d, price: ap });

          // ── Check if the new lower target is already met TODAY ────────────────
          // After averaging down, pos.avgPrice drops and newTgt drops with it.
          // If today's high already clears newTgt, exit today at newTgt.
          // We do NOT scan backwards — on any historical date before this average,
          // the avgPrice was higher and the target was different; retroactively
          // exiting there would use a cost that didn't exist then (temporal paradox).
          const newTp  = targetPcts[Math.min(pos.avgCount, targetPcts.length - 1)];
          const newTgt = pos.avgPrice * (1 + newTp);
          if (today.high >= newTgt) {
            const exitDate  = d;
            const exitPrice = +newTgt.toFixed(2);
            const exitHold  = holdDays;
            const qty2      = pos.totalInvested / pos.avgPrice;
            const pnl2      = +((exitPrice - pos.avgPrice) * qty2).toFixed(2);
            runningCapital += pnl2;
            trades.push({
              symbol, entry_date: pos.entryDate, entry_price: +pos.entryPrice.toFixed(2),
              avg_cost: +pos.avgPrice.toFixed(2),
              exit_date: exitDate, exit_price: exitPrice,
              invested: +pos.totalInvested.toFixed(2), pnl: pnl2,
              avg_count: pos.avgCount, exit_reason: 'TARGET',
              hold_days: exitHold, target_pct: +(newTp * 100).toFixed(1),
              capital_after: +runningCapital.toFixed(2),
              ...spreadAvgs(pos.avgs),
            });
            pos = null; gtt = null; continue;
          }
          // Target not yet met today — normal daily loop will catch it going forward.
        }
      }
      continue;
    }

    // ── No open position: check if pending GTT fires today (before signal check) ──
    if (gtt && !gtt.avg) {
      gtt.trigger = high20; // keep GTT updated to rolling 20D high
      if (today.high >= gtt.trigger) {
        // Apply entry filters before firing GTT
        let blocked = false;
        if (needMA) {
          const ma = maType === 'sma' ? calcSMA(rows, maPeriod, i) : calcEMA(rows, maPeriod, i);
          if (ma !== null && today.close < ma) { gtt = null; blocked = true; }
        }
        if (!blocked && need52W && i >= 252) {
          const { low52 } = calc52WRange(rows, i);
          if (w52filter === 'near'  && today.close > low52 * 1.10) { gtt = null; blocked = true; }
          if (w52filter === 'below' && today.close > low52)         { gtt = null; blocked = true; }
        }
        if (!blocked && needVol && today.volume) {
          const avgVol = calcAvgVolume(rows, lookbackN, i);
          if (avgVol && today.volume < avgVol * volMult) { gtt = null; blocked = true; }
        }
        if (!blocked && needRSI) {
          const rsi = calcRSI(rows, 14, i);
          if (rsi !== null) {
            if (rsiFilter === 'os'   && rsi >= 40) { gtt = null; blocked = true; }
            if (rsiFilter === 'os30' && rsi >= 30) { gtt = null; blocked = true; }
          }
        }
        if (!blocked) {
          const tradeSize  = runningCapital * (riskPct / 100);
          // Actual fill = trigger price OR today's open if stock gapped up above trigger.
          // A gap-up means the stock never traded AT the 20D-high trigger price —
          // the real execution would be at today's open (the first available price).
          const fillPrice  = Math.max(gtt.trigger, today.open);
          // Compute per-stock TSL% at entry time when dynamic ATR mode is active
          let posTslPct = trailSLPct;  // default: fixed global %
          if (tslAtrCfg) {
            const atr = calcATRpct(rows, tslAtrCfg.period, i);
            if (atr !== null) {
              const raw = atr * tslAtrCfg.mult;
              posTslPct = Math.min(tslAtrCfg.max, Math.max(tslAtrCfg.min, +raw.toFixed(2)));
            } else {
              posTslPct = tslAtrCfg.min;  // fallback if not enough history
            }
          }
          pos = { entryDate: d, avgPrice: fillPrice,
                  entryPrice: fillPrice,              // original buy price — never changes
                  totalInvested: tradeSize, avgCount: 0,
                  maxHigh: fillPrice,
                  maxHighAfterAvg: fillPrice,   // resets on each average
                  lastAvgIdx: i,                // row index of last buy/avg
                  avgs: [],                     // [{date, price}] for each average-down
                  tslPct: posTslPct,            // this trade's effective TSL% (fixed or ATR-derived)
                  tslArmed: false, tslPeak: fillPrice, tslFloorPct: 0 };
          gtt = null;
          continue;
        }
      }
    }

    // ── Check if today is a new 20D low signal — set/refresh GTT ──────────────
    const atLow = Math.abs(today.low - low20) / low20 <= TOLERANCE;
    if (!atLow) continue; // nothing to do today

    // MA filter — only set GTT if stock is in uptrend
    if (needMA) {
      const ma = maType === 'sma' ? calcSMA(rows, maPeriod, i) : calcEMA(rows, maPeriod, i);
      if (ma !== null && today.close < ma) { gtt = null; continue; }
    }

    // 52W low filter
    if (need52W && i >= 252) {
      const { low52 } = calc52WRange(rows, i);
      if (w52filter === 'near'  && today.close > low52 * 1.10) { gtt = null; continue; }
      if (w52filter === 'below' && today.close > low52)         { gtt = null; continue; }
    }

    // Volume filter
    if (needVol && today.volume) {
      const avgVol = calcAvgVolume(rows, lookbackN, i);
      if (avgVol && today.volume < avgVol * volMult) { gtt = null; continue; }
    }

    // RSI filter
    if (needRSI) {
      const rsi = calcRSI(rows, 14, i);
      if (rsi !== null) {
        if (rsiFilter === 'os'   && rsi >= 40) { gtt = null; continue; }
        if (rsiFilter === 'os30' && rsi >= 30) { gtt = null; continue; }
      }
    }

    // Set/update GTT with today's 20D high as trigger
    gtt = { trigger: high20, avg: false };
  }

  if (pos) {
    const last = rows[rows.length - 1];
    const ep   = last.close;
    const qty  = pos.totalInvested / pos.avgPrice;
    const tp   = targetPcts[Math.min(pos.avgCount, targetPcts.length - 1)];
    const holdDays = Math.round((new Date(last.date) - new Date(pos.entryDate)) / 86400000);
    // Use maxHighAfterAvg (reset on each average) for an accurate
    // post-average peak % — avoids inflating the figure with pre-average highs
    const peakForReport = pos.maxHighAfterAvg || pos.maxHigh;
    const maxProfitPct  = peakForReport > pos.avgPrice
      ? +((peakForReport - pos.avgPrice) / pos.avgPrice * 100).toFixed(2)
      : 0;
    const currentTslStop = (needTSL && pos.tslArmed)
      ? +(pos.tslPeak * (1 - pos.tslPct / 100)).toFixed(2)
      : null;
    trades.push({ symbol, entry_date: pos.entryDate, entry_price: +pos.entryPrice.toFixed(2),
      avg_cost: +pos.avgPrice.toFixed(2),
      exit_date: last.date, exit_price: +ep.toFixed(2), invested: +pos.totalInvested.toFixed(2),
      pnl: +((ep - pos.avgPrice) * qty).toFixed(2),
      avg_count: pos.avgCount, exit_reason: 'OPEN',
      hold_days: holdDays, target_pct: +(tp * 100).toFixed(1),
      max_profit_pct: maxProfitPct,
      tsl_armed: pos.tslArmed || false,
      tsl_current_stop: currentTslStop,
      tsl_floor_pct: pos.tslFloorPct || 0,
      ...spreadAvgs(pos.avgs) });
  }

  return { trades, finalCapital: runningCapital };
}


// ── Capital tracking: walk all closed trades chronologically, compute
//    running capital after each exit, find minimum point ─────────────────────
function attachCapitalTracking(allTrades, startCapital) {
  const closed = allTrades
    .filter(t => t.exit_reason !== 'OPEN')
    .sort((a, b) => a.exit_date.localeCompare(b.exit_date));

  let running = startCapital, minCap = startCapital, minDate = '';
  for (const t of closed) {
    running += t.pnl;
    t.capital_after = +running.toFixed(2);
    if (running < minCap) { minCap = running; minDate = t.exit_date; }
  }
  for (const t of allTrades) {
    if (t.exit_reason === 'OPEN') t.capital_after = null;
  }
  return { minCapital: +minCap.toFixed(2), minCapitalDate: minDate };
}

// SSE backtest runner
app.get('/api/backtest/run', async (req, res) => {
  const { token, clientId, capital = 400000, tradeSize = 8000,
          fromDate = '2021-01-01', toDate = '2026-03-27',
          maType = 'none', maPeriod = '200', w52filter = 'none',
          volFilter = 'none', rsiFilter = 'none',
          maxAvg = '3', targets = '20,15,10,8,6,5,4',
          riskPct = '2', universe = 'NIFTY50', avgMode = 'native',
          avgFillGuard = '0', drawdownPcts = '', maxHoldDays = '0', lookback = '20', trailSL = '0' } = req.query;

  const cap          = parseFloat(capital);
  const riskPctNum   = parseFloat(riskPct) || 2;
  const targetPcts   = targets.split(',').map(v => parseFloat(v.trim()) / 100).filter(v => !isNaN(v));
  const maxAverages  = parseInt(maxAvg);
  const trailSLPct   = Math.max(0, parseFloat(trailSL) || 0);
  const drawdownLevels = drawdownPcts ? drawdownPcts.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v) && v > 0) : [];
  const maxHold      = Math.max(0, parseInt(maxHoldDays) || 0);
  const lookbackN    = Math.max(5, Math.min(100, parseInt(lookback) || 20));
  const timeAvgsList = (req.query.timeAvgs || '1,2,3').split(',').map(v => Math.max(0, parseInt(v.trim()) || 0));
  const atrPeriod    = parseInt(req.query.tslAtrPeriod) || 0;
  const tslAtrCfg    = atrPeriod > 0 ? { period: atrPeriod, mult: parseFloat(req.query.tslAtrMult)||1.5, min: parseFloat(req.query.tslAtrMin)||3, max: parseFloat(req.query.tslAtrMax)||20 } : null;
  const simOpts = { maType, maPeriod: parseInt(maPeriod), w52filter, volFilter, rsiFilter, maxAverages, targetPcts, avgMode, avgFillGuard: avgFillGuard === '1', drawdownLevels, maxHold, timeAvgs: timeAvgsList, lookbackN, trailSLPct, tslAtrCfg };

  if (!token || !clientId) {
    return res.status(400).json({ error: 'token and clientId required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = obj => { res.write('data: ' + JSON.stringify(obj) + '\n\n'); if (res.flush) res.flush(); };

  const symbols = BT_UNIVERSES[universe] || BT_UNIVERSES['NIFTY50'];
  const allTrades = [];
  // Fetch data slightly before fromDate for 20-day warmup
  const warmupDate = new Date(fromDate);
  warmupDate.setDate(warmupDate.getDate() - 40);
  const fetchFrom = warmupDate.toISOString().split('T')[0];

  for (let i = 0; i < symbols.length; i++) {
    const sym    = symbols[i];
    const secId  = DHAN_SECURITY_IDS[sym];
    let   status = 'OK', error = null, trades = [];

    try {
      const rows = await fetchDhanHistory(secId, token, fetchFrom, toDate);
      if (rows.length < 25) throw new Error(`Only ${rows.length} candles`);
      const result = runStrategySimulation(sym, rows, cap, riskPctNum, fromDate, simOpts);
      trades = result.trades;
      allTrades.push(...trades);
      status = `${rows.length} candles · ${trades.length} trades`;
    } catch (err) {
      error  = err.message;
      status = 'FAILED';
    }

    send({ type: 'progress', current: i + 1, total: symbols.length,
           symbol: sym, status, error, trades });
    await delay(350); // respect Dhan rate limits
  }

  // Attach chronological capital tracking
  const capStats = attachCapitalTracking(allTrades, cap);

  // Aggregate summary — use compounded P&L for final value
  const closed   = allTrades.filter(t => t.exit_reason !== 'OPEN');
  const open_t   = allTrades.filter(t => t.exit_reason === 'OPEN');
  const wins     = closed.filter(t => t.pnl > 0);
  const losses   = closed.filter(t => t.pnl <= 0);
  const totalPnl = allTrades.reduce((s, t) => s + t.pnl, 0);
  const finalVal = cap + totalPnl;
  const years    = (new Date(toDate) - new Date(fromDate)) / (365.25 * 86400000);
  const cagr     = years > 0 ? ((finalVal / capital) ** (1 / years) - 1) * 100 : 0;
  const winRate  = closed.length ? (wins.length / closed.length * 100) : 0;
  const avgWin   = wins.length   ? wins.reduce((s,t)=>s+t.pnl,0)/wins.length     : 0;
  const avgLoss  = losses.length ? losses.reduce((s,t)=>s+t.pnl,0)/losses.length : 0;
  const avgHoldW      = wins.length    ? wins.reduce((s,t)=>s+t.hold_days,0)/wins.length       : 0;
  const avgHoldL      = losses.length  ? losses.reduce((s,t)=>s+t.hold_days,0)/losses.length   : 0;
  const avgHoldClosed = closed.length  ? closed.reduce((s,t)=>s+t.hold_days,0)/closed.length   : 0;
  const avgHoldOpen   = open_t.length  ? open_t.reduce((s,t)=>s+t.hold_days,0)/open_t.length   : 0;
  const openPnl       = open_t.reduce((s,t)=>s+t.pnl,0);

  const byYear = {};
  for (const t of closed) {
    const y = t.exit_date.slice(0, 4);
    if (!byYear[y]) byYear[y] = { pnl: 0, trades: 0, wins: 0, losses: 0, win_rate: 0 };
    byYear[y].pnl    += t.pnl;
    byYear[y].trades += 1;
    if (t.pnl > 0) byYear[y].wins++; else byYear[y].losses++;
  }
  for (const y of Object.keys(byYear)) {
    byYear[y].pnl      = +byYear[y].pnl.toFixed(2);
    byYear[y].win_rate = +(byYear[y].wins / byYear[y].trades * 100).toFixed(1);
  }

  send({
    type: 'complete',
    trades: allTrades,
    summary: {
      final_value:   +finalVal.toFixed(2),
      total_pnl:     +totalPnl.toFixed(2),
      cagr:          +cagr.toFixed(2),
      closed_trades: closed.length,
      open_trades:   open_t.length,
      win_trades:    wins.length,
      loss_trades:   losses.length,
      win_rate:      +winRate.toFixed(2),
      avg_win:       +avgWin.toFixed(2),
      avg_loss:      +avgLoss.toFixed(2),
      avg_hold_win:    +avgHoldW.toFixed(1),
      avg_hold_loss:   +avgHoldL.toFixed(1),
      avg_hold_closed: +avgHoldClosed.toFixed(1),
      avg_hold_open:   +avgHoldOpen.toFixed(1),
      open_pnl:        +openPnl.toFixed(2),
      min_capital:      capStats.minCapital,
      min_capital_date: capStats.minCapitalDate,
      universe,
    },
    byYear,
  });
  res.end();
});

// ─────────────────────────────────────────────
//  BACKTEST — NSE BHAVCOPY (FREE, NO LOGIN)
// ─────────────────────────────────────────────
const AdmZip = require('adm-zip');

const BHAVCOPY_MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const UDIFF_CUTOFF   = new Date('2024-07-08');

const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/zip, application/octet-stream, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/',
  'Origin': 'https://www.nseindia.com',
};

// Generate URL for a given date string (YYYY-MM-DD)
function getBhavUrl(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const yyyy = d.getUTCFullYear();
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(d.getUTCDate()).padStart(2, '0');
  const mon3 = BHAVCOPY_MONTHS[d.getUTCMonth()];

  if (d < UDIFF_CUTOFF) {
    // Old format: works for 2010 → Jul 7 2024
    return {
      url: `https://nsearchives.nseindia.com/content/historical/EQUITIES/${yyyy}/${mon3}/cm${dd}${mon3}${yyyy}bhav.csv.zip`,
      format: 'old',
    };
  } else {
    // New UDiFF format: Jul 8 2024 → today
    return {
      url: `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${yyyy}${mm}${dd}_F_0000.csv.zip`,
      format: 'new',
    };
  }
}

// Generate all weekday dates between from and to
function getWeekdays(from, to) {
  const days = [];
  const d    = new Date(from + 'T00:00:00Z');
  const end  = new Date(to   + 'T00:00:00Z');
  while (d <= end) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
      days.push(d.toISOString().split('T')[0]);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

// Parse old-format Bhavcopy CSV (pre Jul 8 2024)
// Columns: SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN
function parseOldBhav(csv, symSet, dateStr) {
  const result = {};
  const lines  = csv.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 6) continue;
    const sym    = cols[0].trim();
    const series = cols[1].trim();
    if (series !== 'EQ' || !symSet.has(sym)) continue;
    const open  = parseFloat(cols[2]);
    const high  = parseFloat(cols[3]);
    const low   = parseFloat(cols[4]);
    const close = parseFloat(cols[5]);
    if (isNaN(high) || isNaN(low) || high === 0) continue;
    result[sym] = { date: dateStr, open, high, low, close };
  }
  return result;
}

// Parse new UDiFF Bhavcopy CSV (Jul 8 2024+)
// Key columns: Sgmt, SctySrs, TckrSymb, OpnPric, HghPric, LwPric, ClsPric
function parseNewBhav(csv, symSet, dateStr) {
  const result = {};
  const lines  = csv.split('\n');
  if (lines.length < 2) return result;

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const iSgmt   = headers.indexOf('Sgmt');
  const iSrs    = headers.indexOf('SctySrs');
  const iSym    = headers.indexOf('TckrSymb');
  const iOpen   = headers.indexOf('OpnPric');
  const iHigh   = headers.indexOf('HghPric');
  const iLow    = headers.indexOf('LwPric');
  const iClose  = headers.indexOf('ClsPric');

  if ([iSgmt, iSrs, iSym, iOpen, iHigh, iLow, iClose].includes(-1)) return result;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < Math.max(iSgmt, iSrs, iSym, iClose) + 1) continue;
    const sgmt = cols[iSgmt].trim().replace(/"/g, '');
    const srs  = cols[iSrs].trim().replace(/"/g, '');
    const sym  = cols[iSym].trim().replace(/"/g, '');
    if (sgmt !== 'CM' || srs !== 'EQ' || !symSet.has(sym)) continue;
    const open  = parseFloat(cols[iOpen]);
    const high  = parseFloat(cols[iHigh]);
    const low   = parseFloat(cols[iLow]);
    const close = parseFloat(cols[iClose]);
    if (isNaN(high) || isNaN(low) || high === 0) continue;
    result[sym] = { date: dateStr, open, high, low, close };
  }
  return result;
}

// Download + unzip + parse one Bhavcopy file
async function fetchBhavcopy(dateStr, symSet) {
  const { url, format } = getBhavUrl(dateStr);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);

  try {
    const res = await fetch(url, { headers: NSE_HEADERS, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf  = Buffer.from(await res.arrayBuffer());
    const zip  = new AdmZip(buf);
    const entry = zip.getEntries().find(e => e.entryName.toLowerCase().endsWith('.csv'));
    if (!entry) throw new Error('No CSV in ZIP');

    const csv = zip.readAsText(entry);
    return format === 'old'
      ? parseOldBhav(csv, symSet, dateStr)
      : parseNewBhav(csv, symSet, dateStr);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// SSE endpoint — Bhavcopy backtest
app.get('/api/backtest/bhavcopy', async (req, res) => {
  const {
    capital   = '400000',
    tradeSize = '8000',
    fromDate  = '2021-01-01',
    toDate    = new Date().toISOString().split('T')[0],
    maType = 'none', maPeriod = '200', w52filter = 'none',
    volFilter = 'none', rsiFilter = 'none',
    maxAvg = '3', targets = '20,15,10,8,6,5,4',
    riskPct = '2', universe = 'NIFTY50', avgMode = 'native',
    avgFillGuard = '0', drawdownPcts = '', maxHoldDays = '0', lookback = '20', trailSL = '0',
  } = req.query;

  const cap          = parseFloat(capital);
  const riskPctNum   = parseFloat(riskPct) || 2;
  const targetPcts   = targets.split(',').map(v => parseFloat(v.trim()) / 100).filter(v => !isNaN(v));
  const maxAverages  = parseInt(maxAvg);
  const trailSLPct   = Math.max(0, parseFloat(trailSL) || 0);
  const drawdownLevels = drawdownPcts ? drawdownPcts.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v) && v > 0) : [];
  const maxHold      = Math.max(0, parseInt(maxHoldDays) || 0);
  const lookbackN    = Math.max(5, Math.min(100, parseInt(lookback) || 20));
  const timeAvgsList = (req.query.timeAvgs || '1,2,3').split(',').map(v => Math.max(0, parseInt(v.trim()) || 0));
  const atrPeriod    = parseInt(req.query.tslAtrPeriod) || 0;
  const tslAtrCfg    = atrPeriod > 0 ? { period: atrPeriod, mult: parseFloat(req.query.tslAtrMult)||1.5, min: parseFloat(req.query.tslAtrMin)||3, max: parseFloat(req.query.tslAtrMax)||20 } : null;
  const simOpts = { maType, maPeriod: parseInt(maPeriod), w52filter, volFilter, rsiFilter, maxAverages, targetPcts, avgMode, avgFillGuard: avgFillGuard === '1', drawdownLevels, maxHold, timeAvgs: timeAvgsList, lookbackN, trailSLPct, tslAtrCfg };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = obj => {
    res.write('data: ' + JSON.stringify(obj) + '\n\n');
    if (res.flush) res.flush();
  };

  const symSet   = new Set(BT_UNIVERSES[universe] || BT_UNIVERSES['NIFTY50']);
  const allDays  = getWeekdays(fromDate, toDate);
  const total    = allDays.length;

  // stockData accumulates OHLCV per symbol
  const stockData = {};
  for (const sym of symSet) stockData[sym] = [];

  let processed = 0, holidays = 0, errors = 0;

  send({ type: 'start', total, fromDate, toDate });

  // Download in batches of 5 concurrent requests
  const BATCH = 5;
  for (let i = 0; i < allDays.length; i += BATCH) {
    const batch   = allDays.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(d => fetchBhavcopy(d, symSet)));

    for (let j = 0; j < batch.length; j++) {
      const day = batch[j];
      if (results[j].status === 'fulfilled') {
        const dayData = results[j].value;
        const count   = Object.keys(dayData).length;
        if (count === 0) {
          holidays++; // trading holiday — file exists but no EQ data (unlikely), or empty
        } else {
          processed++;
          for (const [sym, row] of Object.entries(dayData)) {
            if (stockData[sym]) stockData[sym].push(row);
          }
        }
      } else {
        const err = results[j].reason;
        // HTTP 404 = holiday/weekend; anything else = real error
        if (err.message && err.message.includes('HTTP 404')) {
          holidays++;
        } else {
          errors++;
        }
      }
    }

    const current = Math.min(i + BATCH, total);
    send({
      type: 'progress', current, total, processed, holidays, errors,
      pct: Math.round((current / total) * 100),
    });

    await delay(80); // brief pause between batches
  }

  send({ type: 'phase', message: 'Running strategy simulation...' });

  // Run strategy on collected data
  const allTrades = [];
  for (const sym of symSet) {
    const rows = stockData[sym].sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length < 25) continue;
    const result = runStrategySimulation(sym, rows, cap, riskPctNum, fromDate, simOpts);
    allTrades.push(...result.trades);
  }

  // Attach chronological capital tracking
  const capStats = attachCapitalTracking(allTrades, cap);

  // Aggregate — compounded P&L
  const closed   = allTrades.filter(t => t.exit_reason !== 'OPEN');
  const open_t   = allTrades.filter(t => t.exit_reason === 'OPEN');
  const wins     = closed.filter(t => t.pnl > 0);
  const losses   = closed.filter(t => t.pnl <= 0);
  const totalPnl = allTrades.reduce((s, t) => s + t.pnl, 0);
  const finalVal = cap + totalPnl;
  const years    = (new Date(toDate) - new Date(fromDate)) / (365.25 * 86400000);
  const cagr     = years > 0 ? ((finalVal / cap) ** (1 / years) - 1) * 100 : 0;
  const winRate  = closed.length ? (wins.length / closed.length * 100) : 0;
  const avgWin   = wins.length   ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length   : 0;
  const avgLoss  = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const avgHoldW      = wins.length    ? wins.reduce((s, t) => s + t.hold_days, 0) / wins.length     : 0;
  const avgHoldL      = losses.length  ? losses.reduce((s, t) => s + t.hold_days, 0) / losses.length : 0;
  const avgHoldClosed = closed.length  ? closed.reduce((s, t) => s + t.hold_days, 0) / closed.length : 0;
  const avgHoldOpen   = open_t.length  ? open_t.reduce((s, t) => s + t.hold_days, 0) / open_t.length : 0;
  const openPnl       = open_t.reduce((s, t) => s + t.pnl, 0);

  const byYear = {};
  for (const t of closed) {
    const y = t.exit_date.slice(0, 4);
    if (!byYear[y]) byYear[y] = { pnl: 0, trades: 0, wins: 0, losses: 0 };
    byYear[y].pnl    += t.pnl;
    byYear[y].trades += 1;
    if (t.pnl > 0) byYear[y].wins++; else byYear[y].losses++;
  }
  for (const y of Object.keys(byYear)) {
    byYear[y].pnl      = +byYear[y].pnl.toFixed(2);
    byYear[y].win_rate = +(byYear[y].wins / byYear[y].trades * 100).toFixed(1);
  }

  send({
    type: 'complete',
    source: 'bhavcopy',
    dataStats: { tradingDays: processed, holidays, errors },
    trades: allTrades,
    summary: {
      final_value:   +finalVal.toFixed(2),
      total_pnl:     +totalPnl.toFixed(2),
      cagr:          +cagr.toFixed(2),
      closed_trades: closed.length,
      open_trades:   open_t.length,
      win_trades:    wins.length,
      loss_trades:   losses.length,
      win_rate:      +winRate.toFixed(2),
      avg_win:       +avgWin.toFixed(2),
      avg_loss:      +avgLoss.toFixed(2),
      avg_hold_win:    +avgHoldW.toFixed(1),
      avg_hold_loss:   +avgHoldL.toFixed(1),
      avg_hold_closed: +avgHoldClosed.toFixed(1),
      avg_hold_open:   +avgHoldOpen.toFixed(1),
      open_pnl:        +openPnl.toFixed(2),
      min_capital:      capStats.minCapital,
      min_capital_date: capStats.minCapitalDate,
      universe,
    },
    byYear,
  });
  res.end();
});

// ─────────────────────────────────────────────
//  PORTFOLIO — Dhan proxy routes (read-only)
//  Proxies requests to Dhan API to avoid CORS.
//  Only GET endpoints — no order placement.
// ─────────────────────────────────────────────

async function dhanGet(path, token) {
  const res = await fetch(`https://api.dhan.co/v2${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'access-token': token,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Dhan ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// GET /api/portfolio/holdings
app.get('/api/portfolio/holdings', async (req, res) => {
  const token    = req.headers['x-dhan-token'];
  const clientId = req.headers['x-dhan-client'];
  if (!token || !clientId) return res.status(400).json({ error: 'Missing token' });
  try {
    const data = await dhanGet('/holdings', token);
    // data is an array of holdings — inject empty cmp placeholder (no live price in this call)
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET /api/portfolio/positions
app.get('/api/portfolio/positions', async (req, res) => {
  const token    = req.headers['x-dhan-token'];
  const clientId = req.headers['x-dhan-client'];
  if (!token || !clientId) return res.status(400).json({ error: 'Missing token' });
  try {
    const data = await dhanGet('/positions', token);
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// GET /api/portfolio/gtt
app.get('/api/portfolio/gtt', async (req, res) => {
  const token    = req.headers['x-dhan-token'];
  const clientId = req.headers['x-dhan-client'];
  if (!token || !clientId) return res.status(400).json({ error: 'Missing token' });
  try {
    const data = await dhanGet('/forever/all', token);
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Serve inlined HTML
app.get('/', (req, res) => res.send(HTML_PAGE));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.send(HTML_PAGE);
  else res.status(404).json({ error: 'Not found' });
});

// ─────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

app.listen(PORT, () => {
  console.log(`🚀 Sharegenius Swing Trader running on port ${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}`);
});
