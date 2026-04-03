import { useState, useEffect, useRef, useCallback } from "react";

// ── Palette ──
const T = {
  bg:"#0a0a0a", bgPanel:"#111111", bgRow:"#161616", bgHover:"#1c1c1c",
  border:"#2a2a2a", borderBright:"#3a3a3a",
  amber:"#ff8c00", amberDim:"#cc7000", amberBg:"rgba(255,140,0,0.08)", amberFaint:"rgba(255,140,0,0.04)",
  white:"#e8e8e8", whiteHi:"#ffffff", muted:"#666666", faint:"#3a3a3a",
  green:"#00cc44", greenDim:"#009933", greenBg:"rgba(0,204,68,0.08)",
  red:"#ff3333", redDim:"#cc2222", redBg:"rgba(255,51,51,0.08)",
  cyan:"#00aacc", cyanBg:"rgba(0,170,204,0.08)", yellow:"#ffdd00",
};

// ── Auth helpers (localStorage-based, no backend) ──
const AUTH_KEY   = "punted_users";
const SESSION_KEY = "punted_session";

function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "{}"); } catch { return {}; }
}

function saveUsers(u) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(u));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

function saveSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function registerUser(email, password, plan) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  if (!key || !password) return { ok: false, err: "EMAIL AND PASSWORD REQUIRED" };
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(key)) return { ok: false, err: "INVALID EMAIL FORMAT" };
  if (password.length < 6) return { ok: false, err: "PASSWORD MIN 6 CHARACTERS" };
  if (users[key]) return { ok: false, err: "ACCOUNT ALREADY EXISTS — LOGIN INSTEAD" };
  users[key] = { email: key, password, plan, created: Date.now() };
  saveUsers(users);
  const session = { email: key, plan, loginTime: Date.now() };
  saveSession(session);
  return { ok: true, session };
}

function loginUser(email, password) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return { ok: false, err: "NO ACCOUNT FOUND — REGISTER FIRST" };
  if (user.password !== password) return { ok: false, err: "INCORRECT PASSWORD" };
  const session = { email: key, plan: user.plan, loginTime: Date.now() };
  saveSession(session);
  return { ok: true, session };
}

function upgradePlan(email) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  if (users[key]) users[key].plan = "pro";
  saveUsers(users);
  const session = getSession();
  if (session) { session.plan = "pro"; saveSession(session); }
}

// ── CSS ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Mono',monospace;background:${T.bg};color:${T.white};min-height:100vh;font-size:12px;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:${T.bg}}
::-webkit-scrollbar-thumb{background:${T.border}}

/* ── AUTH SCREENS ── */
.auth-shell{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:${T.bg}}
.auth-brand{font-size:28px;font-weight:700;color:${T.amber};letter-spacing:0.14em;text-transform:uppercase;margin-bottom:4px}
.auth-tag{font-size:9px;color:${T.muted};letter-spacing:0.2em;text-transform:uppercase;margin-bottom:32px}
.auth-box{width:100%;max-width:420px;border:1px solid ${T.border};background:${T.bgPanel};padding:28px}
.auth-title{font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${T.amber};margin-bottom:20px;display:flex;align-items:center;gap:8px}
.auth-title::before{content:'>';color:${T.amberDim}}
.field{margin-bottom:14px}
.field-label{font-size:9px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${T.muted};margin-bottom:5px}
.field-input{width:100%;padding:8px 10px;background:${T.bg};border:1px solid ${T.border};color:${T.white};font-family:'IBM Plex Mono',monospace;font-size:12px;outline:none;transition:border-color .1s;letter-spacing:0.03em}
.field-input:focus{border-color:${T.amber}}
.field-input::placeholder{color:${T.faint}}
.auth-err{font-size:10px;color:${T.red};letter-spacing:0.06em;margin-bottom:12px;padding:7px 10px;border:1px solid ${T.redDim};background:${T.redBg}}
.auth-btn{width:100%;padding:10px;background:${T.amber};border:none;color:${T.bg};font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:background .1s;margin-top:4px}
.auth-btn:hover{background:${T.amberDim}}
.auth-btn:disabled{opacity:0.4;cursor:not-allowed}
.auth-switch{margin-top:16px;font-size:10px;color:${T.muted};text-align:center;letter-spacing:0.04em}
.auth-link{color:${T.amber};cursor:pointer;text-decoration:underline}
.auth-link:hover{color:${T.amberDim}}

/* ── PLAN PICKER ── */
.plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.plan-card{padding:14px;border:1px solid ${T.border};cursor:pointer;transition:all .1s;position:relative}
.plan-card:hover{border-color:${T.borderBright};background:${T.bgRow}}
.plan-card.selected{border-color:${T.amber};background:${T.amberBg}}
.plan-name{font-size:12px;font-weight:700;letter-spacing:0.1em;color:${T.white};margin-bottom:6px}
.plan-price{font-size:20px;font-weight:700;color:${T.amber};line-height:1}
.plan-price-sub{font-size:9px;color:${T.muted};margin-top:2px;letter-spacing:0.06em}
.plan-features{margin-top:10px;display:flex;flex-direction:column;gap:4px}
.plan-feat{font-size:9px;color:${T.muted};letter-spacing:0.04em;display:flex;gap:5px}
.plan-feat-on{color:${T.green}}
.plan-feat-off{color:${T.faint}}
.plan-badge{position:absolute;top:-1px;right:-1px;font-size:8px;font-weight:700;padding:2px 6px;background:${T.amber};color:${T.bg};letter-spacing:0.1em}

/* ── GATE OVERLAY ── */
.gate{position:absolute;inset:0;background:rgba(10,10,10,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:10;border:1px solid ${T.border}}
.gate-lock{font-size:32px;color:${T.amber}}
.gate-title{font-size:13px;font-weight:700;letter-spacing:0.12em;color:${T.amber};text-transform:uppercase}
.gate-sub{font-size:10px;color:${T.muted};letter-spacing:0.06em;text-align:center;max-width:240px;line-height:1.6}
.gate-btn{padding:8px 20px;background:${T.amber};border:none;color:${T.bg};font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.12em;cursor:pointer;text-transform:uppercase;transition:background .1s}
.gate-btn:hover{background:${T.amberDim}}

/* ── APP SHELL ── */
.app{display:flex;height:100vh;overflow:hidden}
.sidebar{width:200px;min-width:200px;background:${T.bgPanel};border-right:1px solid ${T.border};display:flex;flex-direction:column}
.brand-bar{padding:0 12px;height:36px;background:${T.amber};display:flex;align-items:center;gap:8px;flex-shrink:0}
.brand-name{font-size:14px;font-weight:700;color:${T.bg};letter-spacing:0.12em;text-transform:uppercase}
.brand-ver{font-size:9px;color:rgba(0,0,0,0.5);letter-spacing:0.06em;margin-left:auto}
.nav-group{padding:10px 0 4px}
.nav-group-label{padding:0 12px 4px;font-size:9px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${T.faint}}
.nav-item{display:flex;align-items:center;gap:0;padding:5px 12px;font-size:11px;color:${T.muted};cursor:pointer;transition:all .1s;letter-spacing:0.02em;border-left:2px solid transparent;white-space:nowrap}
.nav-item:hover{color:${T.white};background:${T.bgRow}}
.nav-item.active{color:${T.amber};background:${T.amberBg};border-left-color:${T.amber};font-weight:500}
.nav-item.locked{color:${T.faint};cursor:default}
.nav-item.locked:hover{background:transparent;color:${T.faint}}
.nav-prefix{color:${T.faint};margin-right:6px;font-size:10px}
.nav-item.active .nav-prefix{color:${T.amberDim}}
.nav-badge{margin-left:auto;font-size:9px;font-weight:700;padding:1px 5px;border:1px solid}
.badge-amber{border-color:${T.amberDim};color:${T.amber}}
.badge-green{border-color:${T.greenDim};color:${T.green}}
.badge-lock{border-color:${T.faint};color:${T.faint}}
.sidebar-footer{margin-top:auto;border-top:1px solid ${T.border};padding:10px 12px}
.footer-label{font-size:9px;color:${T.faint};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:5px}
.term-input{width:100%;padding:5px 7px;background:${T.bg};border:1px solid ${T.border};color:${T.amber};font-family:'IBM Plex Mono',monospace;font-size:10px;outline:none;letter-spacing:0.04em}
.term-input:focus{border-color:${T.amber}}
.term-input::placeholder{color:${T.faint}}
.status-row{display:flex;align-items:center;gap:5px;margin-top:5px;font-size:9px;color:${T.muted};letter-spacing:0.06em}
.status-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
.user-row{padding:8px 12px;border-bottom:1px solid ${T.border};margin-bottom:4px}
.user-email{font-size:9px;color:${T.muted};letter-spacing:0.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.user-plan{font-size:9px;font-weight:700;letter-spacing:0.1em;margin-top:2px}
.plan-free{color:${T.muted}}
.plan-pro{color:${T.amber}}
.logout-btn{font-size:9px;color:${T.faint};cursor:pointer;letter-spacing:0.06em;text-decoration:underline;margin-top:4px;display:inline-block}
.logout-btn:hover{color:${T.muted}}

/* ── TOPBAR ── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:36px;background:${T.bgPanel};border-bottom:1px solid ${T.border};display:flex;align-items:stretch;flex-shrink:0;font-size:11px}
.topbar-title{display:flex;align-items:center;padding:0 16px;border-right:1px solid ${T.border};color:${T.amber};font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:11px;white-space:nowrap}
.topbar-meta{display:flex;align-items:center;padding:0 14px;color:${T.muted};font-size:10px;letter-spacing:0.04em;border-right:1px solid ${T.border}}
.topbar-right{display:flex;align-items:center;margin-left:auto}
.sport-btn{height:100%;padding:0 12px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:0.08em;background:transparent;border:none;border-left:1px solid ${T.border};color:${T.muted};cursor:pointer;transition:all .1s}
.sport-btn:hover{background:${T.bgRow};color:${T.white}}
.sport-btn.active{background:${T.amberBg};color:${T.amber};font-weight:600}
.content{flex:1;overflow-y:auto;padding:0;display:flex;flex-direction:column}

/* ── STAT BAR ── */
.stat-bar{display:flex;border-bottom:1px solid ${T.border};flex-shrink:0}
.stat-cell{flex:1;padding:8px 14px;border-right:1px solid ${T.border};display:flex;flex-direction:column;gap:2px}
.stat-cell:last-child{border-right:none}
.stat-label{font-size:9px;color:${T.muted};letter-spacing:0.12em;text-transform:uppercase}
.stat-val{font-size:18px;font-weight:600;line-height:1;letter-spacing:-0.01em}
.stat-sub{font-size:9px;color:${T.muted};letter-spacing:0.04em}
.col-amber{color:${T.amber}}.col-green{color:${T.green}}.col-red{color:${T.red}}
.col-cyan{color:${T.cyan}}.col-white{color:${T.white}}.col-muted{color:${T.muted}}.col-yellow{color:${T.yellow}}

/* ── GRID ── */
.grid-2{display:grid;grid-template-columns:1fr 260px;flex:1;min-height:0}
.grid-2-left{overflow-y:auto;border-right:1px solid ${T.border};position:relative}
.grid-2-right{overflow-y:auto;display:flex;flex-direction:column}
.panel-header{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:${T.bgPanel};border-bottom:1px solid ${T.border};position:sticky;top:0;z-index:1}
.panel-title{font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${T.amber}}
.panel-meta{font-size:9px;color:${T.muted};letter-spacing:0.06em}

/* ── ODDS TABLE ── */
.odds-tbl{width:100%;border-collapse:collapse}
.odds-tbl th{padding:5px 10px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};border-bottom:1px solid ${T.border};background:${T.bgPanel};text-align:left;white-space:nowrap;position:sticky;top:33px}
.odds-tbl td{padding:6px 10px;border-bottom:1px solid ${T.border};vertical-align:middle}
.match-row td{background:${T.bgRow}}
.sub-row td{background:${T.bg}}
.odds-tbl tr:hover td{background:${T.bgHover}}
.match-label{font-size:11px;font-weight:500;color:${T.white}}
.time-label{font-size:9px;color:${T.muted};letter-spacing:0.04em}
.team-label{font-size:10px;color:${T.muted};letter-spacing:0.02em}
.price-cell{font-size:11px;font-weight:500;padding:2px 6px;display:inline-block;min-width:40px;text-align:right;letter-spacing:0.02em}
.price-best{color:${T.amber};background:${T.amberBg};border-left:2px solid ${T.amber}}
.price-up{color:${T.green}}.price-dn{color:${T.red}}.price-norm{color:${T.muted}}
.ev-tag{font-size:9px;font-weight:700;padding:1px 5px;letter-spacing:0.08em;border:1px solid}
.ev-tag-pos{color:${T.green};border-color:${T.greenDim};background:${T.greenBg}}
.ev-tag-watch{color:${T.yellow};border-color:rgba(255,221,0,0.3);background:rgba(255,221,0,0.06)}

/* ── RIGHT PANELS ── */
.rpanel{border-bottom:1px solid ${T.border}}
.sharp-row{display:flex;align-items:center;gap:8px;padding:7px 12px;border-bottom:1px solid ${T.border};font-size:10px}
.sharp-row:last-child{border-bottom:none}
.sharp-name{flex:1;color:${T.white}}
.sharp-sub{font-size:9px;color:${T.muted};margin-top:1px}
.bar-track{width:60px;height:3px;background:${T.border};flex-shrink:0}
.bar-fill{height:100%}
.sharp-pct{font-size:10px;font-weight:600;width:30px;text-align:right}
.or-row{display:flex;align-items:center;gap:8px;padding:5px 12px;border-bottom:1px solid ${T.border};font-size:10px}
.or-row:last-child{border-bottom:none}
.or-book{width:62px;color:${T.muted};font-size:9px}
.or-track{flex:1;height:2px;background:${T.border}}
.or-fill{height:100%}
.or-val{width:40px;text-align:right;font-size:10px;font-weight:600}

/* ── VALUE ── */
.value-row{display:flex;align-items:flex-start;gap:12px;padding:8px 12px;border-bottom:1px solid ${T.border};transition:background .1s}
.value-row:hover{background:${T.bgHover}}
.value-row:last-child{border-bottom:none}
.edge-num{font-size:16px;font-weight:700;width:48px;flex-shrink:0;line-height:1;padding-top:1px;letter-spacing:-0.02em}
.value-mid{flex:1}
.value-match{font-size:11px;font-weight:500;color:${T.white}}
.value-detail{font-size:9px;color:${T.muted};margin-top:3px;letter-spacing:0.04em}
.value-right{text-align:right;flex-shrink:0}
.value-price{font-size:14px;font-weight:700}
.value-book{font-size:9px;color:${T.muted};margin-top:2px;letter-spacing:0.04em}

/* ── P&L ── */
.pl-grid{display:grid;grid-template-columns:1fr 240px;flex:1;min-height:0}
.pl-left{overflow-y:auto;border-right:1px solid ${T.border};position:relative}
.pl-right{overflow-y:auto}
.pl-chart-wrap{position:relative;height:160px;width:100%}
.bet-tbl{width:100%;border-collapse:collapse}
.bet-tbl th{padding:5px 10px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};border-bottom:1px solid ${T.border};background:${T.bgPanel};text-align:left;white-space:nowrap;position:sticky;top:33px}
.bet-tbl td{padding:6px 10px;border-bottom:1px solid ${T.border};font-size:11px}
.bet-tbl tr:hover td{background:${T.bgHover}}
.bet-tbl tr:last-child td{border-bottom:none}
.result-win{color:${T.green};font-weight:600}.result-loss{color:${T.red};font-weight:600}.result-pend{color:${T.muted}}
.chip{font-size:8px;font-weight:700;padding:1px 4px;border:1px solid;letter-spacing:0.08em;white-space:nowrap}
.chip-afl{color:${T.amber};border-color:${T.amberDim}}
.chip-nrl{color:${T.green};border-color:${T.greenDim}}
.chip-racing{color:${T.yellow};border-color:rgba(255,221,0,0.3)}
.chip-cricket{color:${T.red};border-color:${T.redDim}}
.chip-other{color:${T.muted};border-color:${T.border}}
.roi-row{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid ${T.border};font-size:10px}
.roi-row:last-child{border-bottom:none}
.roi-sport{width:52px;color:${T.muted};font-size:9px}
.roi-track{flex:1;height:2px;background:${T.border}}
.roi-fill{height:100%}
.roi-val{width:44px;text-align:right;font-weight:600;font-size:10px}

/* ── INSIGHTS ── */
.insight{padding:8px 12px;border-bottom:1px solid ${T.border};border-left:3px solid;font-size:10px;line-height:1.6}
.insight:last-child{border-bottom:none}
.insight-green{border-left-color:${T.green};background:${T.greenBg}}
.insight-amber{border-left-color:${T.amber};background:${T.amberBg}}
.insight-cyan{border-left-color:${T.cyan};background:${T.cyanBg}}
.insight-title{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px}
.insight-green .insight-title{color:${T.green}}
.insight-amber .insight-title{color:${T.amber}}
.insight-cyan .insight-title{color:${T.cyan}}
.insight-body{color:${T.white};opacity:.85}

/* ── AI / CHAT ── */
.ai-grid{display:grid;grid-template-columns:1fr 280px;flex:1;min-height:0}
.ai-left{overflow-y:auto;border-right:1px solid ${T.border};display:flex;flex-direction:column;position:relative}
.ai-right{display:flex;flex-direction:column}
.chat-msgs{flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.msg-user{align-self:flex-end;max-width:80%;padding:6px 10px;border:1px solid ${T.border};background:${T.bgRow};color:${T.white};font-size:11px;line-height:1.5}
.msg-bot{align-self:flex-start;max-width:85%;padding:6px 10px;border:1px solid ${T.amberDim};background:${T.amberFaint};color:${T.white};font-size:11px;line-height:1.5}
.msg-label{font-size:8px;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:3px}
.msg-user .msg-label{color:${T.muted}}
.msg-bot .msg-label{color:${T.amber}}
.chat-bar{display:flex;border-top:1px solid ${T.border};flex-shrink:0}
.chat-in{flex:1;padding:8px 10px;background:${T.bg};border:none;border-right:1px solid ${T.border};color:${T.amber};font-family:'IBM Plex Mono',monospace;font-size:11px;outline:none}
.chat-in::placeholder{color:${T.faint}}
.chat-send{padding:8px 14px;background:${T.amber};border:none;color:${T.bg};font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;letter-spacing:0.08em;cursor:pointer;transition:background .1s}
.chat-send:hover{background:${T.amberDim}}
.chat-send:disabled{opacity:.3;cursor:not-allowed}
.suggest-item{padding:6px 12px;border-bottom:1px solid ${T.border};font-size:10px;color:${T.muted};cursor:pointer;transition:all .1s;display:flex;gap:6px;align-items:flex-start}
.suggest-item:hover{background:${T.bgRow};color:${T.white}}
.suggest-item:last-child{border-bottom:none}
.suggest-arrow{color:${T.amber};flex-shrink:0}

/* ── BTN ── */
.btn-term{padding:4px 10px;background:transparent;border:1px solid ${T.amber};color:${T.amber};font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:0.1em;cursor:pointer;transition:all .1s;text-transform:uppercase}
.btn-term:hover{background:${T.amber};color:${T.bg}}
.btn-term:disabled{opacity:.3;cursor:not-allowed}

/* ── TICKER ── */
.ticker{height:24px;background:${T.bgPanel};border-top:1px solid ${T.border};display:flex;align-items:center;overflow:hidden;flex-shrink:0}
.ticker-item{display:flex;align-items:center;gap:5px;padding:0 14px;border-right:1px solid ${T.border};height:100%;font-size:9px;white-space:nowrap;letter-spacing:0.06em}
.ticker-label{color:${T.faint};font-weight:600}
.ticker-val-up{color:${T.green};font-weight:600}
.ticker-val-dn{color:${T.red};font-weight:600}
.ticker-val{color:${T.amber};font-weight:600}

/* ── UPGRADE MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
.modal-box{background:${T.bgPanel};border:1px solid ${T.border};width:100%;max-width:460px;padding:28px}
.modal-title{font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.amber};margin-bottom:6px}
.modal-sub{font-size:10px;color:${T.muted};letter-spacing:0.06em;margin-bottom:20px;line-height:1.6}
.modal-close{float:right;cursor:pointer;color:${T.muted};font-size:10px;letter-spacing:0.06em}
.modal-close:hover{color:${T.white}}
.mock-cc{background:${T.bg};border:1px solid ${T.border};padding:16px;margin-bottom:16px}
.mock-cc-label{font-size:9px;color:${T.muted};letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px}
.mock-cc-row{display:flex;gap:10px;margin-bottom:10px}
.mock-cc-row:last-child{margin-bottom:0}

/* ── UTILS ── */
.blink{animation:blink 1s step-end infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.spin-term{width:16px;height:16px;border:2px solid ${T.border};border-top-color:${T.amber};border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.empty-term{padding:30px;text-align:center;color:${T.muted};font-size:10px;letter-spacing:0.08em}
.cursor-line::after{content:'_';animation:blink 1s step-end infinite;color:${T.amber}}
`;

// ── Mock data ──
const AFL_MATCHES = [
  { id:1, home:"Collingwood", away:"Carlton",   time:"SAT 19:25", odds:{ home:{sb:1.75,tab:1.82,lad:1.71,b365:1.78}, away:{sb:2.18,tab:2.10,lad:2.14,b365:2.20} }, mv:{home:"up_tab",away:"up_b365"}, ev:"home" },
  { id:2, home:"GWS",         away:"Brisbane",  time:"SAT 16:35", odds:{ home:{sb:2.05,tab:2.08,lad:2.10,b365:2.10}, away:{sb:1.85,tab:1.82,lad:1.78,b365:1.80} }, mv:{home:"up_lad",away:"dn_lad"}, ev:"watch" },
  { id:3, home:"Melbourne",   away:"Hawthorn",  time:"SUN 13:10", odds:{ home:{sb:1.55,tab:1.58,lad:1.61,b365:1.57}, away:{sb:2.50,tab:2.60,lad:2.48,b365:2.55} }, mv:{home:"up_lad",away:"up_tab"}, ev:"home" },
  { id:4, home:"Geelong",     away:"Richmond",  time:"SUN 15:20", odds:{ home:{sb:1.38,tab:1.40,lad:1.37,b365:1.42}, away:{sb:3.10,tab:3.05,lad:3.15,b365:3.00} }, mv:{home:"dn_sb", away:"up_lad"}, ev:null },
  { id:5, home:"Sydney",      away:"Port Adel", time:"FRI 19:50", odds:{ home:{sb:1.90,tab:1.92,lad:1.88,b365:1.95}, away:{sb:1.95,tab:1.93,lad:1.96,b365:1.90} }, mv:{home:"up_b365",away:"dn_b365"}, ev:"away" },
];

const VALUE_BETS = [
  { match:"Collingwood v Carlton", sel:"Collingwood ML", sport:"AFL",    book:"TAB",       odds:1.82, fair:1.68, edge:8.3  },
  { match:"Flemington R4",         sel:"Windstorm",      sport:"Racing", book:"Ladbrokes", odds:3.80, fair:3.41, edge:11.4 },
  { match:"Melbourne v Hawthorn",  sel:"Melbourne ML",   sport:"AFL",    book:"Ladbrokes", odds:1.61, fair:1.51, edge:6.6  },
  { match:"Flemington R6",         sel:"Bayfield",       sport:"Racing", book:"Bet365",    odds:7.50, fair:6.90, edge:8.7  },
  { match:"Sydney v Port Adel",    sel:"Port Adel ML",   sport:"AFL",    book:"Bet365",    odds:1.95, fair:1.84, edge:5.9  },
  { match:"Storm v Warriors",      sel:"Storm -6.5",     sport:"NRL",    book:"Sportsbet", odds:1.90, fair:1.79, edge:6.1  },
  { match:"Rabbitohs v Dragons",   sel:"Rabbitohs ML",   sport:"NRL",    book:"TAB",       odds:1.72, fair:1.64, edge:4.8  },
];

const BETS = [
  { sel:"Collingwood ML", sport:"AFL",     book:"TAB",       stake:50, odds:1.82, result:"win",  pl:41    },
  { sel:"Storm -6.5",     sport:"NRL",     book:"Sportsbet", stake:40, odds:1.90, result:"loss", pl:-40   },
  { sel:"Windstorm R3",   sport:"Racing",  book:"Ladbrokes", stake:30, odds:4.40, result:"win",  pl:102   },
  { sel:"AUS innings+",   sport:"Cricket", book:"Bet365",    stake:25, odds:1.95, result:"loss", pl:-25   },
  { sel:"Brisbane +5.5",  sport:"AFL",     book:"Bet365",    stake:60, odds:1.88, result:"pend", pl:null  },
  { sel:"Melbourne ML",   sport:"AFL",     book:"Ladbrokes", stake:45, odds:1.61, result:"win",  pl:27.45 },
  { sel:"Rabbitohs ML",   sport:"NRL",     book:"TAB",       stake:35, odds:1.72, result:"loss", pl:-35   },
];

const PL_D = [0,-22,-18,15,42,38,60,55,90,78,110,140,125,165,184.5];
const PL_L = ["Apr 1","3","5","7","9","11","13","15","17","19","21","23","25","27","29"];
const BOOKS = ["sb","tab","lad","b365"];
const BOOK_L = { sb:"SBet", tab:"TAB", lad:"Lad", b365:"B365" };

// ── Small components ──
function Chip({ sport }) {
  const m = { AFL:"chip-afl", NRL:"chip-nrl", Racing:"chip-racing", Cricket:"chip-cricket" };
  return <span className={`chip ${m[sport]||"chip-other"}`}>{sport}</span>;
}

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(()=>setT(new Date()),1000); return ()=>clearInterval(id); }, []);
  return <span>{t.toLocaleTimeString("en-AU",{hour:"2-digit",minute:"2-digit",second:"2-digit",timeZone:"Australia/Sydney"})} AEST</span>;
}

// ── AUTH SCREENS ──
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register | plans
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [plan, setPlan]   = useState("free");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setErr(""); setLoading(true);
    setTimeout(() => {
      const res = loginUser(email, pass);
      if (res.ok) onAuth(res.session);
      else setErr(res.err);
      setLoading(false);
    }, 400);
  };

  const handleRegister = () => {
    setErr(""); setLoading(true);
    setTimeout(() => {
      const res = registerUser(email, pass, plan);
      if (res.ok) onAuth(res.session);
      else setErr(res.err);
      setLoading(false);
    }, 400);
  };

  const planFeats = {
    free: ["Odds comparison (AFL only)", "Top 3 value bets", "Basic P&L tracker", "×  AI analyst", "×  Sharp money data", "×  All sports access"],
    pro:  ["Odds comparison — all sports", "All value bets + edge scores", "Full P&L tracker + insights", "AI analyst + chat", "Sharp money indicators", "Overround by book"],
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">PUNTED</div>
      <div className="auth-tag">Australian Betting Analytics Terminal</div>

      {mode === "login" && (
        <div className="auth-box">
          <div className="auth-title">LOGIN</div>
          {err && <div className="auth-err">{err}</div>}
          <div className="field">
            <div className="field-label">Email</div>
            <input className="field-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          <div className="field">
            <div className="field-label">Password</div>
            <input className="field-input" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </div>
          <button className="auth-btn" onClick={handleLogin} disabled={loading}>{loading?"AUTHENTICATING...":"LOGIN ▶"}</button>
          <div className="auth-switch">No account? <span className="auth-link" onClick={()=>{setMode("register");setErr("");}}>REGISTER HERE</span></div>
          <div style={{marginTop:10,fontSize:9,color:T.faint,textAlign:"center",letterSpacing:"0.06em"}}>
            DEMO: register any email/password to try
          </div>
        </div>
      )}

      {mode === "register" && (
        <div className="auth-box">
          <div className="auth-title">CREATE ACCOUNT</div>
          {err && <div className="auth-err">{err}</div>}
          <div className="field">
            <div className="field-label">Email</div>
            <input className="field-input" type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
          </div>
          <div className="field">
            <div className="field-label">Password</div>
            <input className="field-input" type="password" placeholder="min 6 characters" value={pass} onChange={e=>setPass(e.target.value)}/>
          </div>
          <div style={{marginBottom:14}}>
            <div className="field-label" style={{marginBottom:10}}>Select plan</div>
            <div className="plan-grid">
              {["free","pro"].map(p => (
                <div key={p} className={`plan-card ${plan===p?"selected":""}`} onClick={()=>setPlan(p)}>
                  {p==="pro" && <div className="plan-badge">POPULAR</div>}
                  <div className="plan-name">{p==="free"?"FREE":"PRO"}</div>
                  <div className="plan-price">{p==="free"?"$0":"$19"}</div>
                  <div className="plan-price-sub">{p==="free"?"FOREVER":"/MONTH AUD"}</div>
                  <div className="plan-features">
                    {planFeats[p].map((f,i) => (
                      <div key={i} className={`plan-feat ${f.startsWith("×")?"plan-feat-off":"plan-feat-on"}`}>
                        <span>{f.startsWith("×")?"×":"✓"}</span>
                        <span>{f.replace("× ","")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="auth-btn" onClick={handleRegister} disabled={loading}>{loading?"CREATING ACCOUNT...":"CREATE ACCOUNT ▶"}</button>
          <div className="auth-switch">Already registered? <span className="auth-link" onClick={()=>{setMode("login");setErr("");}}>LOGIN HERE</span></div>
        </div>
      )}
    </div>
  );
}

// ── UPGRADE MODAL ──
function UpgradeModal({ onClose, onUpgrade }) {
  const [step, setStep] = useState("plans"); // plans | payment | done
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setStep("done"); }, 1800);
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box">
        <span className="modal-close" onClick={onClose}>[CLOSE ×]</span>
        {step==="plans" && <>
          <div className="modal-title">UPGRADE TO PRO</div>
          <div className="modal-sub">Unlock AI analysis, sharp money signals, all sports access, and full value bet rankings. $19/month AUD. Cancel anytime.</div>
          <div style={{marginBottom:16}}>
            {["All sports access (AFL, NRL, Racing, Cricket)","All value bets + full edge scores","AI market analyst + chat terminal","Sharp money indicators","Overround comparison by book","Full P&L insights + leak detection"].map((f,i)=>(
              <div key={i} style={{padding:"5px 0",borderBottom:`1px solid ${T.border}`,fontSize:10,color:T.white,display:"flex",gap:8}}>
                <span style={{color:T.green}}>✓</span>{f}
              </div>
            ))}
          </div>
          <button className="auth-btn" onClick={()=>setStep("payment")}>CONTINUE TO PAYMENT ▶</button>
        </>}

        {step==="payment" && <>
          <div className="modal-title">PAYMENT DETAILS</div>
          <div className="modal-sub">$19.00 AUD/month · Secure checkout · Cancel anytime</div>
          <div className="mock-cc">
            <div className="mock-cc-label">Card details</div>
            <div className="field" style={{marginBottom:10}}>
              <div className="field-label">Card number</div>
              <input className="field-input" placeholder="1234 5678 9012 3456" value={card} onChange={e=>setCard(e.target.value)} maxLength={19}/>
            </div>
            <div className="mock-cc-row">
              <div className="field" style={{flex:1,marginBottom:0}}>
                <div className="field-label">Expiry</div>
                <input className="field-input" placeholder="MM/YY" value={expiry} onChange={e=>setExpiry(e.target.value)} maxLength={5}/>
              </div>
              <div className="field" style={{flex:1,marginBottom:0}}>
                <div className="field-label">CVV</div>
                <input className="field-input" placeholder="123" value={cvv} onChange={e=>setCvv(e.target.value)} maxLength={3}/>
              </div>
            </div>
          </div>
          <div style={{fontSize:9,color:T.faint,marginBottom:12,letterSpacing:"0.06em"}}>⚠ DEMO MODE — no real payment will be charged</div>
          <button className="auth-btn" onClick={handlePay} disabled={processing}>{processing?"PROCESSING...":"PAY $19.00 AUD ▶"}</button>
        </>}

        {step==="done" && <>
          <div className="modal-title">UPGRADE COMPLETE</div>
          <div style={{fontSize:32,color:T.green,margin:"16px 0",letterSpacing:0}}>✓</div>
          <div className="modal-sub" style={{marginBottom:20}}>Welcome to Punted Pro. All features are now unlocked. Your subscription will renew automatically.</div>
          <button className="auth-btn" onClick={onUpgrade}>ENTER TERMINAL ▶</button>
        </>}
      </div>
    </div>
  );
}

// ── PRO GATE OVERLAY ──
function ProGate({ onUpgrade }) {
  return (
    <div className="gate">
      <div className="gate-lock">🔒</div>
      <div className="gate-title">PRO FEATURE</div>
      <div className="gate-sub">This feature requires a Punted Pro subscription. Upgrade to unlock AI analysis, sharp money signals, and all sports access.</div>
      <button className="gate-btn" onClick={onUpgrade}>UPGRADE TO PRO — $19/MO ▶</button>
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [session, setSession]   = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage]         = useState("odds");
  const [sport, setSport]       = useState("AFL");
  const [apiKey, setApiKey]     = useState("");
  const [apiStatus, setApiStatus] = useState("idle");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([
    { role:"bot", text:"PUNTED/AI TERMINAL READY. Query: value bets, line movements, or your P&L analysis." }
  ]);
  const [chatIn, setChatIn]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chartRef  = useRef(null);
  const chartInst = useRef(null);
  const chatEnd   = useRef(null);

  // Inject CSS
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // Restore session
  useEffect(() => {
    const s = getSession();
    if (s) setSession(s);
    setAuthReady(true);
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMsgs]);

  const isPro = session?.plan === "pro";

  const handleUpgradeDone = () => {
    upgradePlan(session.email);
    const updated = { ...session, plan:"pro" };
    setSession(updated);
    setShowUpgrade(false);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setPage("odds");
    setInsights(null);
  };

  // P&L chart
  useEffect(() => {
    if (page !== "pl") return;
    const load = () => {
      if (!window.Chart || !chartRef.current) return;
      if (chartInst.current) chartInst.current.destroy();
      chartInst.current = new window.Chart(chartRef.current, {
        type: "line",
        data: { labels:PL_L, datasets:[{ data:PL_D, borderColor:"#ff8c00", backgroundColor:"rgba(255,140,0,0.05)", fill:true, tension:.3, pointRadius:2, pointHoverRadius:4, borderWidth:1.5, pointBackgroundColor:"#ff8c00" }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>" $"+c.parsed.y.toFixed(2)}} }, scales:{ x:{ticks:{font:{size:8,family:"IBM Plex Mono"},color:"#666"},grid:{color:"rgba(42,42,42,0.8)"}}, y:{ticks:{font:{size:8,family:"IBM Plex Mono"},color:"#666",callback:v=>"$"+v},grid:{color:"rgba(42,42,42,0.8)"}} } }
      });
    };
    if (window.Chart) { load(); return; }
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    sc.onload = load;
    document.head.appendChild(sc);
  }, [page]);

  // Claude
  const callClaude = useCallback(async (messages, system) => {
    const key = apiKey.trim();
    if (!key) throw new Error("NO_KEY");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "x-api-key":key, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages })
    });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    const d = await res.json();
    return d.content[0].text;
  }, [apiKey]);

  const topValue = [...VALUE_BETS].sort((a,b)=>b.edge-a.edge);
  const mktCtx = () => {
    const top = topValue.slice(0,5).map(v=>`${v.sel} (${v.match}) — $${v.odds.toFixed(2)} @ ${v.book}, edge +${v.edge.toFixed(1)}%`).join("\n");
    return `LIVE AU DATA:\nTop value bets:\n${top}\nUser: ${session?.email}, Plan: ${session?.plan}, P&L: +$184.50 (30d), ROI +8.2%, AFL ROI +12.4%, NRL ROI -5.8%`;
  };

  const genInsights = useCallback(async () => {
    if (!apiKey.trim()) { setApiStatus("missing"); return; }
    setInsightsLoading(true); setApiStatus("loading");
    try {
      const system = `You are a sharp AU betting analyst. Be concise and terse. Return ONLY valid JSON: {"insights":[{"type":"green","title":"TITLE","body":"..."},{"type":"amber","title":"TITLE","body":"..."},{"type":"cyan","title":"TITLE","body":"..."}]}`;
      const txt = await callClaude([{ role:"user", content:`Generate 3 sharp insights:\n\n${mktCtx()}` }], system);
      setInsights(JSON.parse(txt.replace(/```json|```/g,"").trim()).insights);
      setApiStatus("ok");
    } catch(e) {
      setApiStatus("error");
      setInsights([{ type:"amber", title:"ERROR", body: e.message==="NO_KEY"?"API KEY REQUIRED — enter key in sidebar.":`ERR: ${e.message}` }]);
    }
    setInsightsLoading(false);
  }, [apiKey, callClaude]);

  const sendChat = useCallback(async () => {
    const msg = chatIn.trim();
    if (!msg || chatLoading) return;
    setChatIn(""); setChatLoading(true);
    const updated = [...chatMsgs, { role:"user", text:msg }];
    setChatMsgs(updated);
    if (!apiKey.trim()) {
      setChatMsgs(p=>[...p,{role:"bot",text:"ERROR: NO API KEY — enter key in sidebar."}]);
      setChatLoading(false); return;
    }
    try {
      const system = `You are PUNTED/AI, a sharp AU betting analyst. Brief, direct, max 120 words.\n\n${mktCtx()}`;
      const reply = await callClaude(updated.map(m=>({role:m.role==="user"?"user":"assistant",content:m.text})), system);
      setChatMsgs(p=>[...p,{role:"bot",text:reply}]);
    } catch(e) {
      setChatMsgs(p=>[...p,{role:"bot",text:`ERR: ${e.message}`}]);
    }
    setChatLoading(false);
  }, [chatIn, chatLoading, chatMsgs, apiKey, callClaude]);

  // ── Page renderers ──

  const renderOdds = () => {
    const freeLimit = !isPro; // Free: AFL only, no sharp money
    return (
      <>
        <div className="stat-bar">
          <div className="stat-cell"><div className="stat-label">Value bets</div><div className="stat-val col-green">{isPro?VALUE_BETS.length:3}</div><div className="stat-sub">{isPro?"all sports · +EV identified":"AFL only · upgrade for more"}</div></div>
          <div className="stat-cell"><div className="stat-label">Avg overround</div><div className="stat-val col-amber">104.8%</div><div className="stat-sub">▲ 0.3% vs yesterday</div></div>
          <div className="stat-cell"><div className="stat-label">Biggest move</div><div className="stat-val col-white" style={{fontSize:14,paddingTop:3}}>1.95→2.10</div><div className="stat-sub">GWS lifted 2h ago</div></div>
          <div className="stat-cell"><div className="stat-label">Your plan</div><div className={`stat-val ${isPro?"col-amber":"col-muted"}`} style={{fontSize:14,paddingTop:3}}>{isPro?"PRO":"FREE"}</div><div className="stat-sub">{isPro?"all features unlocked":<span style={{color:T.amber,cursor:"pointer"}} onClick={()=>setShowUpgrade(true)}>upgrade to unlock all ↗</span>}</div></div>
        </div>
        <div className="grid-2" style={{flex:1,minHeight:0}}>
          <div className="grid-2-left">
            <div className="panel-header">
              <span className="panel-title">AFL R5 — H2H MARKETS {!isPro&&<span style={{fontSize:8,color:T.muted,marginLeft:8}}>FREE TIER</span>}</span>
              <span className="panel-meta">SB / TAB / LAD / B365</span>
            </div>
            <table className="odds-tbl">
              <thead><tr><th style={{width:130}}>MATCH</th><th>TEAM</th>{BOOKS.map(b=><th key={b}>{BOOK_L[b]}</th>)}<th>SIG</th></tr></thead>
              <tbody>
                {AFL_MATCHES.map(m => {
                  const hMax = Math.max(...BOOKS.map(b=>m.odds.home[b]));
                  const aMax = Math.max(...BOOKS.map(b=>m.odds.away[b]));
                  return [
                    <tr key={`${m.id}h`} className="match-row">
                      <td rowSpan={2} style={{borderRight:`1px solid ${T.border}`,verticalAlign:"top",paddingTop:7}}>
                        <div className="match-label">{m.home}</div>
                        <div className="match-label" style={{color:T.muted}}>v {m.away}</div>
                        <div className="time-label" style={{marginTop:3}}>{m.time} AEST</div>
                      </td>
                      <td><span className="team-label">{m.home.slice(0,7).toUpperCase()}</span></td>
                      {BOOKS.map(b => {
                        const v = m.odds.home[b], isBest=v===hMax, isUp=m.mv.home===`up_${b}`, isDn=m.mv.home===`dn_${b}`;
                        return <td key={b}><span className={`price-cell ${isBest?"price-best":isUp?"price-up":isDn?"price-dn":"price-norm"}`}>{isUp?"▲ ":isDn?"▼ ":""}{v.toFixed(2)}</span></td>;
                      })}
                      <td>{m.ev==="home"&&<span className="ev-tag ev-tag-pos">+EV</span>}{m.ev==="watch"&&<span className="ev-tag ev-tag-watch">WATCH</span>}</td>
                    </tr>,
                    <tr key={`${m.id}a`} className="sub-row">
                      <td><span className="team-label">{m.away.slice(0,7).toUpperCase()}</span></td>
                      {BOOKS.map(b => {
                        const v = m.odds.away[b], isBest=v===aMax, isUp=m.mv.away===`up_${b}`, isDn=m.mv.away===`dn_${b}`;
                        return <td key={b}><span className={`price-cell ${isBest?"price-best":isUp?"price-up":isDn?"price-dn":"price-norm"}`}>{isUp?"▲ ":isDn?"▼ ":""}{v.toFixed(2)}</span></td>;
                      })}
                      <td>{m.ev==="away"&&<span className="ev-tag ev-tag-pos">+EV</span>}</td>
                    </tr>
                  ];
                })}
              </tbody>
            </table>
          </div>
          <div className="grid-2-right">
            <div className="rpanel" style={{position:"relative"}}>
              <div className="panel-header"><span className="panel-title">SHARP MONEY</span><span className="panel-meta">{isPro?"":"PRO"}</span></div>
              {[
                { label:"Collingwood ML", sub:"AFL R5", pct:68, col:T.amber },
                { label:"Storm -6.5",    sub:"NRL R6", pct:72, col:T.green },
                { label:"Brisbane +5.5", sub:"AFL R5", pct:61, col:T.cyan  },
              ].map((s,i)=>(
                <div className="sharp-row" key={i}>
                  <div style={{flex:1}}><div className="sharp-name">{s.label}</div><div className="sharp-sub">{s.sub} · {s.pct}% sharp</div></div>
                  <div className="bar-track"><div className="bar-fill" style={{width:`${s.pct}%`,background:s.col}}/></div>
                  <div className="sharp-pct" style={{color:s.col}}>{s.pct}%</div>
                </div>
              ))}
              {!isPro && <ProGate onUpgrade={()=>setShowUpgrade(true)}/>}
            </div>
            <div className="rpanel">
              <div className="panel-header"><span className="panel-title">OVERROUND / BOOK</span></div>
              {[
                {book:"Bet365",    val:103.2, w:28, col:T.green},
                {book:"Sportsbet", val:104.5, w:44, col:T.amber},
                {book:"Ladbrokes", val:105.1, w:56, col:T.yellow},
                {book:"TAB",       val:106.4, w:72, col:T.red},
              ].map(r=>(
                <div className="or-row" key={r.book}>
                  <span className="or-book">{r.book}</span>
                  <div className="or-track"><div className="or-fill" style={{width:`${r.w}%`,background:r.col}}/></div>
                  <span className="or-val" style={{color:r.col}}>{r.val.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderValue = () => {
    const shown = isPro ? topValue : topValue.filter(v=>v.sport==="AFL").slice(0,3);
    return (
      <>
        <div className="stat-bar">
          <div className="stat-cell"><div className="stat-label">High edge (&gt;8%)</div><div className="stat-val col-green">{isPro?topValue.filter(v=>v.edge>=8).length:"?"}</div><div className="stat-sub">{isPro?"strong +EV bets":"pro only"}</div></div>
          <div className="stat-cell"><div className="stat-label">Mid edge (5–8%)</div><div className="stat-val col-amber">{isPro?topValue.filter(v=>v.edge>=5&&v.edge<8).length:"?"}</div><div className="stat-sub">{isPro?"solid value plays":"pro only"}</div></div>
          <div className="stat-cell"><div className="stat-label">Showing</div><div className="stat-val col-white">{shown.length}</div><div className="stat-sub">{isPro?"all sports · all edge":"AFL only · 3 max"}</div></div>
          <div className="stat-cell"><div className="stat-label">Best book</div><div className="stat-val col-white" style={{fontSize:14,paddingTop:3}}>Ladbrokes</div><div className="stat-sub">lowest overround</div></div>
        </div>
        <div style={{flex:1,overflowY:"auto",position:"relative"}}>
          <div className="panel-header">
            <span className="panel-title">VALUE BETS — RANKED BY EDGE {!isPro&&<span style={{fontSize:8,color:T.muted,marginLeft:8}}>FREE: AFL ONLY · 3 MAX</span>}</span>
            <span className="panel-meta">devigged fair odds · {shown.length} shown</span>
          </div>
          {shown.map((v,i)=>(
            <div className="value-row" key={i}>
              <div className={`edge-num ${v.edge>=8?"col-green":v.edge>=5?"col-amber":"col-yellow"}`}>+{v.edge.toFixed(1)}</div>
              <div className="value-mid">
                <div className="value-match">{v.sel} — {v.match}</div>
                <div className="value-detail"><Chip sport={v.sport}/>&nbsp; FAIR ${v.fair.toFixed(2)} &nbsp;·&nbsp; VALUE +${(v.odds-v.fair).toFixed(2)}</div>
              </div>
              <div className="value-right">
                <div className={`value-price ${v.edge>=8?"col-green":"col-amber"}`}>${v.odds.toFixed(2)}</div>
                <div className="value-book">{v.book}</div>
              </div>
            </div>
          ))}
          {!isPro && (
            <div style={{padding:"20px",textAlign:"center",borderTop:`1px solid ${T.border}`}}>
              <div style={{color:T.muted,fontSize:10,letterSpacing:"0.08em",marginBottom:12}}>{topValue.length - shown.length} MORE VALUE BETS HIDDEN — PRO ONLY</div>
              <button className="gate-btn" onClick={()=>setShowUpgrade(true)}>UPGRADE TO PRO — $19/MO ▶</button>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderPL = () => (
    <>
      <div className="stat-bar">
        {[
          {label:"Net P&L (30d)", val:"+$184.50", cls:"col-green"},
          {label:"ROI",           val:"+8.2%",    cls:"col-green"},
          {label:"Win rate",      val:"54%",       cls:"col-amber"},
          {label:"Avg odds",      val:"$2.14",     cls:"col-white"},
          {label:"Best book",     val:"Bet365",    cls:"col-white", small:true},
        ].map(s=>(
          <div className="stat-cell" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-val ${s.cls}`} style={s.small?{fontSize:14,paddingTop:3}:{}}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="pl-grid" style={{flex:1}}>
        <div className="pl-left">
          <div className="panel-header"><span className="panel-title">P&L CURVE — APRIL 2026</span></div>
          <div style={{padding:"12px 12px 8px"}}><div className="pl-chart-wrap"><canvas ref={chartRef}/></div></div>
          <div className="panel-header" style={{position:"relative"}}><span className="panel-title">BET HISTORY</span></div>
          <table className="bet-tbl">
            <thead><tr><th>SELECTION</th><th>BOOK</th><th>STAKE</th><th>ODDS</th><th>RESULT</th><th style={{textAlign:"right"}}>P&L</th></tr></thead>
            <tbody>
              {BETS.map((b,i)=>(
                <tr key={i}>
                  <td><div style={{color:T.white,fontWeight:500}}>{b.sel}</div><Chip sport={b.sport}/></td>
                  <td style={{color:T.muted}}>{b.book}</td>
                  <td style={{color:T.muted}}>${b.stake}</td>
                  <td style={{color:T.white}}>${b.odds.toFixed(2)}</td>
                  <td className={b.result==="win"?"result-win":b.result==="loss"?"result-loss":"result-pend"}>{b.result.toUpperCase()}</td>
                  <td style={{textAlign:"right",fontWeight:600,color:b.pl===null?T.muted:b.pl>0?T.green:T.red}}>
                    {b.pl===null?"—":b.pl>0?`+$${b.pl.toFixed(2)}`:`-$${Math.abs(b.pl).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pl-right">
          <div className="panel-header"><span className="panel-title">ROI / SPORT</span></div>
          {[{sport:"AFL",roi:12.4,w:72,col:T.green},{sport:"Racing",roi:8.1,w:55,col:T.amber},{sport:"Cricket",roi:1.2,w:18,col:T.yellow},{sport:"NRL",roi:-5.8,w:35,col:T.red}].map(r=>(
            <div className="roi-row" key={r.sport}>
              <span className="roi-sport">{r.sport}</span>
              <div className="roi-track"><div className="roi-fill" style={{width:`${r.w}%`,background:r.col}}/></div>
              <span className="roi-val" style={{color:r.col}}>{r.roi>0?"+":""}{r.roi.toFixed(1)}%</span>
            </div>
          ))}
          <div className="panel-header" style={{position:"relative"}}>
            <span className="panel-title">SYSTEM INSIGHTS</span>
            {!isPro&&<span className="panel-meta">PRO</span>}
          </div>
          <div style={{position:"relative"}}>
            {[
              {type:"insight-green",title:"LINE SHOPPING EDGE",body:"Capturing best-price 61% of bets. Adding ~3.2% ROI vs single-book punters."},
              {type:"insight-amber",title:"NRL LEAK DETECTED", body:"NRL ROI -5.8%. Fading sharp moves 70% of time. Recommend pausing NRL bets."},
            ].map((ins,i)=>(
              <div className={`insight ${ins.type}`} key={i}>
                <div className="insight-title">{ins.title}</div>
                <div className="insight-body">{ins.body}</div>
              </div>
            ))}
            {!isPro&&<ProGate onUpgrade={()=>setShowUpgrade(true)}/>}
          </div>
        </div>
      </div>
    </>
  );

  const renderAI = () => {
    if (!isPro) return (
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:40}}>
        <div style={{fontSize:40}}>🔒</div>
        <div style={{fontSize:14,fontWeight:700,letterSpacing:"0.12em",color:T.amber,textTransform:"uppercase"}}>Pro Feature</div>
        <div style={{fontSize:10,color:T.muted,letterSpacing:"0.06em",textAlign:"center",maxWidth:300,lineHeight:1.8}}>
          The AI analyst terminal is available on Punted Pro.<br/>Includes real-time market analysis, the Claude-powered chat interface, and personalised betting insights.
        </div>
        <button className="gate-btn" onClick={()=>setShowUpgrade(true)}>UPGRADE TO PRO — $19/MO ▶</button>
      </div>
    );
    return (
      <div className="ai-grid" style={{flex:1}}>
        <div className="ai-left">
          <div className="panel-header">
            <span className="panel-title">AI MARKET ANALYSIS</span>
            <button className="btn-term" onClick={genInsights} disabled={insightsLoading}>{insightsLoading?"PROCESSING...":"RUN ANALYSIS ▶"}</button>
          </div>
          {!insights&&!insightsLoading&&<div className="empty-term"><div style={{color:T.amber,marginBottom:8}}>PUNTED/AI v1.0</div><div>ENTER ANTHROPIC KEY IN SIDEBAR THEN RUN ANALYSIS</div><div style={{marginTop:12,color:T.faint}} className="cursor-line">AWAITING INPUT</div></div>}
          {insightsLoading&&<div className="empty-term"><div className="spin-term"/><div style={{color:T.amber,marginTop:8}}>ANALYSING AU MARKETS<span className="blink">_</span></div></div>}
          {insights&&insights.map((ins,i)=>(
            <div className={`insight insight-${ins.type}`} key={i}>
              <div className="insight-title">{ins.title}</div>
              <div className="insight-body">{ins.body}</div>
            </div>
          ))}
          <div style={{marginTop:"auto",borderTop:`1px solid ${T.border}`}}>
            <div className="panel-header"><span className="panel-title">LIVE VALUE SUMMARY</span></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,borderBottom:`1px solid ${T.border}`}}>
              {topValue.slice(0,4).map((v,i)=>(
                <div key={i} style={{padding:"8px 12px",borderRight:i%2===0?`1px solid ${T.border}`:"none",borderBottom:i<2?`1px solid ${T.border}`:"none"}}>
                  <div style={{fontSize:9,color:T.muted,letterSpacing:"0.08em",marginBottom:2}}>{v.sport} / {v.book}</div>
                  <div style={{fontSize:11,fontWeight:500,color:T.white}}>{v.sel}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                    <span style={{fontSize:13,fontWeight:700,color:T.amber}}>${v.odds.toFixed(2)}</span>
                    <span className="ev-tag ev-tag-pos">+{v.edge.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="ai-right">
          <div className="panel-header">
            <span className="panel-title">PUNTED/AI TERMINAL</span>
            <span style={{fontSize:9,color:T.amber,letterSpacing:"0.06em"}}>claude-sonnet</span>
          </div>
          <div className="chat-msgs">
            {chatMsgs.map((m,i)=>(
              <div key={i} className={m.role==="user"?"msg-user":"msg-bot"}>
                <div className="msg-label">{m.role==="user"?"YOU >":"PUNTED/AI >"}</div>
                {m.text}
              </div>
            ))}
            {chatLoading&&<div className="msg-bot"><div className="msg-label">PUNTED/AI &gt;</div><span className="blink">PROCESSING_</span></div>}
            <div ref={chatEnd}/>
          </div>
          <div style={{borderTop:`1px solid ${T.border}`,padding:"8px 12px",flexShrink:0}}>
            <div style={{fontSize:9,color:T.faint,letterSpacing:"0.1em",marginBottom:6}}>QUICK QUERIES</div>
            {["Best value bet today?","Should I bet NRL?","Which book is cheapest?","Explain my NRL leak"].map((q,i)=>(
              <div key={i} className="suggest-item" onClick={()=>setChatIn(q)}>
                <span className="suggest-arrow">&gt;</span>{q}
              </div>
            ))}
          </div>
          <div className="chat-bar">
            <input className="chat-in" placeholder="> ENTER QUERY..." value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
            <button className="chat-send" onClick={sendChat} disabled={chatLoading||!chatIn.trim()}>SEND</button>
          </div>
        </div>
      </div>
    );
  };

  // Not ready yet
  if (!authReady) return null;

  // Show auth if not logged in
  if (!session) return <AuthScreen onAuth={s=>{setSession(s);}} />;

  const navItems = [
    { id:"odds",  label:"ODDS.COMPARE",  badge:"LIVE", bc:"badge-amber" },
    { id:"value", label:"VALUE.FINDER",  badge:`${isPro?VALUE_BETS.length:3}/${VALUE_BETS.length}`, bc:isPro?"badge-green":"badge-lock" },
    { id:"ai",    label:"AI.ANALYST",    badge:isPro?null:"PRO", bc:"badge-lock", locked:!isPro },
    { id:"pl",    label:"PL.TRACKER",    badge:null },
  ];

  const pageTitle = { odds:"ODDS.COMPARISON", value:"VALUE.FINDER", ai:"AI.ANALYST", pl:"PL.TRACKER" };

  return (
    <div className="app">
      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} onUpgrade={handleUpgradeDone}/>}

      <div className="sidebar">
        <div className="brand-bar">
          <div className="brand-name">PUNTED</div>
          <div className="brand-ver">v2.0</div>
        </div>

        <div className="user-row">
          <div className="user-email">{session.email}</div>
          <div className={`user-plan ${isPro?"plan-pro":"plan-free"}`}>{isPro?"● PRO":"○ FREE"}</div>
          {!isPro && <div style={{marginTop:4}}><span style={{fontSize:9,color:T.amber,cursor:"pointer",letterSpacing:"0.06em",textDecoration:"underline"}} onClick={()=>setShowUpgrade(true)}>UPGRADE TO PRO ↗</span></div>}
          <div className="logout-btn" onClick={handleLogout}>[LOGOUT]</div>
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Markets</div>
          {navItems.map((n,i)=>(
            <div key={n.id} className={`nav-item ${page===n.id?"active":""} ${n.locked?"locked":""}`}
              onClick={()=>{ if(n.locked){ setShowUpgrade(true); return; } setPage(n.id); }}>
              <span className="nav-prefix">{String(i+1).padStart(2,"0")}.</span>
              {n.label}
              {n.badge&&<span className={`nav-badge ${n.bc}`}>{n.badge}</span>}
            </div>
          ))}
        </div>

        <div className="nav-group">
          <div className="nav-group-label">Tools</div>
          {["LINE.MOVEMENT","KELLY.CALC","ODDS.CONVERT","ALERTS"].map((t,i)=>(
            <div key={t} className="nav-item locked">
              <span className="nav-prefix">{String(i+5).padStart(2,"0")}.</span>{t}
              <span className="nav-badge badge-lock" style={{marginLeft:"auto"}}>PRO</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="footer-label">Anthropic API Key</div>
          <input className="term-input" type="password" placeholder="sk-ant-..." value={apiKey} onChange={e=>{setApiKey(e.target.value);setApiStatus("idle");}}/>
          <div className="status-row">
            <div className="status-dot" style={{background:apiStatus==="ok"?T.green:apiStatus==="error"||apiStatus==="missing"?T.red:apiStatus==="loading"?T.yellow:T.faint}}/>
            {apiStatus==="ok"?"CONNECTED":apiStatus==="error"?"API ERROR":apiStatus==="missing"?"KEY REQUIRED":apiStatus==="loading"?"CONNECTING...":"DISCONNECTED"}
          </div>
        </div>
      </div>

      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{pageTitle[page]}</div>
          <div className="topbar-meta"><Clock/></div>
          <div className="topbar-meta">AU MARKETS · AFL R5 · NRL R6 · RACING</div>
          {(page==="odds"||page==="value") && (
            <div className="topbar-right">
              {(isPro?["AFL","NRL","Cricket","Racing"]:["AFL"]).map(s=>(
                <button key={s} className={`sport-btn ${sport===s?"active":""}`} onClick={()=>setSport(s)}>{s}</button>
              ))}
              {!isPro&&["NRL","Cricket","Racing"].map(s=>(
                <button key={s} className="sport-btn" style={{color:T.faint}} onClick={()=>setShowUpgrade(true)}>{s} 🔒</button>
              ))}
            </div>
          )}
        </div>

        <div className="content">
          {page==="odds"  && renderOdds()}
          {page==="value" && renderValue()}
          {page==="pl"    && renderPL()}
          {page==="ai"    && renderAI()}
        </div>

        <div className="ticker">
          {[
            {label:"COL ML",   val:"$1.82",dir:"up"},{label:"GWS ML",   val:"$2.10",dir:"up"},
            {label:"STM -6.5", val:"$1.90",dir:""},  {label:"MEL ML",   val:"$1.61",dir:"up"},
            {label:"PORT ML",  val:"$1.95",dir:"dn"},{label:"WINDSTORM",val:"$3.80",dir:"up"},
            {label:"BAYFIELD", val:"$7.50",dir:""},  {label:"OR AVG",   val:"104.8%",dir:"dn"},
          ].map((t,i)=>(
            <div key={i} className="ticker-item">
              <span className="ticker-label">{t.label}</span>
              <span className={t.dir==="up"?"ticker-val-up":t.dir==="dn"?"ticker-val-dn":"ticker-val"}>{t.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
