// vjs-loader.js
// Loader automático para <script type="text/bjs">

import { compileVJS } from "./VJS.js";

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
   Executa JS gerado
=========================== */

function execute(js) {
  ensureRuntimeFallbacks();
  return new Function(js)();
}

/* ===========================
   Processa uma tag <script>
=========================== */

async function processScriptTag(script) {
  let source = "";

  if (script.src) {
    const resp = await fetch(script.src);
    if (!resp.ok) {
      throw new Error("Erro ao carregar " + script.src);
    }
    source = await resp.text();
  } else {
    source = script.textContent;
  }

  const { js } = compileVJS(source);
  execute(js);
}

/* ===========================
   Inicialização automática
=========================== */

async function init() {
  const scripts = document.querySelectorAll('script[type="text/vjs"]');

  for (const script of scripts) {
    await processScriptTag(script);
  }
}

// Espera DOM pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}