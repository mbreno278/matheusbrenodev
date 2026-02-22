// VJS.main.js
// Loader + Runner integrado para <script type="text/vjs">

import { compileVJS } from './VJs.js';

/* ===========================
   Utils
=========================== */

function reportError(err, ctx = {}) {
  console.groupCollapsed("🚨 [VJS] ERRO —", ctx.stage || "unknown");
  console.error(err?.stack || err);
  
  if (ctx.tokens) console.log("Tokens:", ctx.tokens);
  if (ctx.ast) console.log("AST:", ctx.ast);
  if (ctx.js) console.log("JS gerado:\n", ctx.js);
  
  console.groupEnd();
}

/* ===========================
   Runtime Fallbacks
=========================== */

function ensureRuntimeFallbacks() {
  if (typeof globalThis.escreva === "undefined") {
    const escreva = (...args) => console.log(...args);
    escreva.info = (...a) => console.info(...a);
    escreva.erro = (...a) => console.error(...a);
    escreva.warn = (...a) => console.warn(...a);
    escreva.debug = (...a) => console.debug(...a);
    globalThis.escreva = escreva;
  }
  
  if (typeof globalThis.alerta === "undefined") {
    globalThis.alerta = (...args) => alert(...args);
  }
}

/* ===========================
   Execute JS gerado
=========================== */

function executeGeneratedJS(js) {
  ensureRuntimeFallbacks();
  return new Function(js)();
}

/* ===========================
   Processa um script VJS
=========================== */

async function processVJSScript(script) {
  let source = "";
  
  try {
    if (script.src) {
      const resp = await fetch(script.src);
      if (!resp.ok) {
        throw new Error(`Erro ao carregar ${script.src}`);
      }
      source = await resp.text();
    } else {
      source = script.textContent;
    }
    
    const out = compileVJS(source);
    
    console.log("Tokens:", out.tokens);
    console.log("AST:", out.ast);
    console.log("JS gerado:\n", out.js);
    
    executeGeneratedJS(out.js);
    
  } catch (err) {
    reportError(err, { stage: "VJS_SCRIPT" });
  }
}

/* ===========================
   Loader automático
=========================== */

async function init() {
  const scripts = document.querySelectorAll('script[type="text/vjs"]');
  
  for (const script of scripts) {
    await processVJSScript(script);
  }
}

/* ===========================
   Auto-start
=========================== */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}