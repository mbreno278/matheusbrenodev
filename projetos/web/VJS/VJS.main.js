// main.js — transpiler runner atualizado (usa VJS.compile se disponível)
(async function() {
  if (typeof VJS === "undefined") { console.warn("VJS não encontrado — carregue vjs.js antes de main.js"); return; }
  
  function reportError(err, ctx = {}) {
    console.groupCollapsed("🚨 [VJS] ERRO —", ctx.stage || "unknown");
    console.error(err && err.stack ? err.stack : err);
    if (ctx.tokens) { console.log("Tokens:", ctx.tokens); }
    if (ctx.ast) { console.log("AST:", ctx.ast); }
    if (ctx.js) { console.log("JS gerado:\n", ctx.js); }
    console.groupEnd();
  }
  
  async function transpileAndRun(path = "main.vjs") {
    let source = "";
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error("Falha ao carregar " + path + " — " + resp.status);
      source = await resp.text();
    } catch (e) { reportError(e, { stage: "LOAD" }); throw e; }
    
    try {
      // use VJS.compile if present
      if (typeof VJS.compile === "function") {
        const out = VJS.compile(source);
        console.log("Tokens:", out.tokens);
        console.log("AST:", out.ast);
        console.log("JS:\n", out.js);
        // execute
        new Function(out.js)();
        return out;
      }
      
      // else manual pipeline
      const lexer = new VJS.VJSLexer(source);
      const tokens = lexer.tokenize();
      console.log("Tokens:", tokens);
      
      const parser = new VJS.VJSParser(tokens);
      const ast = parser.parse();
      console.log("AST:", ast);
      
      const generator = new VJS.VJSCodeGenerator();
      const js = generator.generate(ast);
      console.log("JS:\n", js);
      
      // execute safely (user code)
      new Function(js)();
      return { tokens, ast, js };
    } catch (err) {
      reportError(err, { stage: "COMPILE", tokens: (typeof tokens !== "undefined" ? tokens : null), ast: (typeof ast !== "undefined" ? ast : null), js: (typeof js !== "undefined" ? js : null) });
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