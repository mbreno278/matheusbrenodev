// VJS.main.js — transpiler runner (robusto, pronto para produção dev)
(async function() {
  const MAX_WAIT_MS = 5000;
  const POLL_MS = 50;
  
  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
  
  function reportError(err, ctx = {}) {
    try {
      console.groupCollapsed("🚨 [VJS] ERRO —", ctx.stage || "unknown");
      console.error(err && err.stack ? err.stack : err);
      if (ctx.tokens) console.log("Tokens:", ctx.tokens);
      if (ctx.ast) console.log("AST:", ctx.ast);
      if (ctx.js) console.log("JS gerado:\n", ctx.js);
      console.groupEnd();
    } catch (e) {
      console.error("Erro ao reportar erro:", e);
    }
  }
  
  async function waitForVJSReady(timeout = MAX_WAIT_MS) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (typeof window !== "undefined" && typeof window.VJS !== "undefined" &&
        typeof VJS.VJSLexer === "function" &&
        typeof VJS.VJSParser === "function" &&
        typeof VJS.VJSCodeGenerator === "function") {
        return;
      }
      await sleep(POLL_MS);
    }
    throw new Error("VJS classes não carregaram no tempo esperado. Verifique ordem dos scripts (VJSLexer, VJSParser, VJSCodeGenerator, VJS.compile.patch) antes de main.js.");
  }
  
  // cria VJS.compile (pipeline) se não existir
  function ensureCompileFn() {
    if (typeof VJS.compile === "function") return;
    
    VJS.compile = function(source) {
      if (typeof source !== "string") throw new Error("VJS.compile: source precisa ser string");
      if (!VJS.VJSLexer) throw new Error("VJSLexer não encontrado");
      if (!VJS.VJSParser) throw new Error("VJSParser não encontrado");
      if (!VJS.VJSCodeGenerator) throw new Error("VJSCodeGenerator não encontrado");
      
      const lexer = new VJS.VJSLexer(source);
      const tokens = lexer.tokenize();
      const parser = new VJS.VJSParser(tokens);
      const ast = parser.parse();
      const generator = new VJS.VJSCodeGenerator();
      const js = generator.generate(ast);
      return { tokens, ast, js };
    };
  }
  
  // fallback runtime para evitar ReferenceError caso algo escape da transpiração
  function ensureRuntimeFallbacks() {
    if (typeof globalThis.escreva === "undefined") {
      const logFn = (...args) => console.log(...args);
      // escreva como função que possui propriedades info/erro para compatibilidade
      const escreva = function(...args) { logFn(...args); };
      escreva.info = (...a) => console.info(...a);
      escreva.erro = (...a) => console.error(...a);
      escreva.warn = (...a) => console.warn(...a);
      escreva.debug = (...a) => console.debug(...a);
      globalThis.escreva = escreva;
    } else {
      // se existe, assegura que tenha info/erro
      if (typeof globalThis.escreva.info !== "function") globalThis.escreva.info = (...a) => console.info(...a);
      if (typeof globalThis.escreva.erro !== "function") globalThis.escreva.erro = (...a) => console.error(...a);
    }
    
    // fornece um runtime VJS.runtime.console (se algum código usar)
    if (!VJS.runtime) VJS.runtime = {};
    if (!VJS.runtime.console) {
      VJS.runtime.console = {
        log: (...a) => console.log(...a),
        info: (...a) => console.info(...a),
        error: (...a) => console.error(...a),
        warn: (...a) => console.warn(...a),
        debug: (...a) => console.debug(...a)
      };
    }
  }
  
  // executa o JS gerado com new Function (context limpo)
  function executeGeneratedJS(js) {
    // garantir fallbacks antes da execução
    ensureRuntimeFallbacks();
    
    // executar; new Function executa no escopo global, mas sem variáveis locais do main
    return new Function(js)();
  }
  
  async function transpileAndRun(path = "main.vjs") {
    let source = "";
    let out = null;
    
    try {
      // espera VJS completo
      await waitForVJSReady();
      
      // carrega fonte
      const resp = await fetch(path);
      if (!resp.ok) throw new Error("Falha ao carregar " + path + " — " + resp.status);
      source = await resp.text();
    } catch (e) {
      reportError(e, { stage: "LOAD" });
      throw e;
    }
    
    try {
      // garante pipeline
      ensureCompileFn();
      
      // compila (VJS.compile sempre existe agora)
      out = VJS.compile(source);
      
      // logs de debug (tokens/ast/js)
      if (out.tokens) console.log("Tokens:", out.tokens);
      if (out.ast) console.log("AST:", out.ast);
      console.log("JS gerado:\n", out.js);
      
      // executa
      executeGeneratedJS(out.js);
      
      return out;
    } catch (err) {
      reportError(err, { stage: "COMPILE", tokens: out ? out.tokens : null, ast: out ? out.ast : null, js: out ? out.js : null });
      throw err;
    }
  }
  
  try {
    await transpileAndRun("main.vjs");
    console.log("✅ Execução finalizada.");
  } catch (e) {
    console.error("Erro:", e);
  }
})();