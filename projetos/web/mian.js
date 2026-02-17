// main.js — Transpilador VJS → JavaScript (VERSÃO COM PARSER REAL + CODE GENERATOR)
// Atualizado: pipeline com debug melhorado, tempos e tratamento por estágio.

(async function() {
  
  if (typeof VJS === "undefined") {
    console.warn("VJS não encontrado — carregue VJS.js antes de main.js");
    return;
  }
  
  /* =========================================================
     🚨 DEBUG DE ERRO MELHORADO (reportError)
     Recebe um objeto 'context' com tokens/ast/jsCode/stage para facilitar diagnóstico.
  ========================================================== */
  function reportError(error, context = {}) {
    const { stage = "unknown", tokens, ast, jsCode, sourcePath } = context;
    
    console.groupCollapsed(`🚨 [VJS] ERRO — estágio: ${stage} — ${error && error.message ? error.message : error}`);
    try {
      console.error("Mensagem de erro:", error && error.stack ? error.stack : error);
      
      if (sourcePath) {
        console.log("Fonte:", sourcePath);
      }
      
      if (tokens) {
        console.group("🟦 Tokens");
        console.log(tokens);
        console.groupEnd();
      }
      
      if (ast) {
        console.group("🟩 AST");
        console.dir(ast, { depth: null });
        console.groupEnd();
      }
      
      if (jsCode) {
        console.group("🟨 JS Gerado");
        console.log(jsCode);
        console.groupEnd();
      }
    } finally {
      console.groupEnd();
    }
  }
  
  /* =========================================================
     🚀 Pipeline completo: transpileAndRun
     - vjsPath: caminho para o arquivo .vjs (padrão: "main.vjs")
     - options: { execute: true/false } (se false, apenas gera e retorna)
  ========================================================== */
  async function transpileAndRun(vjsPath = "main.vjs", options = { execute: true }) {
    let source = "";
    try {
      const resp = await fetch(vjsPath);
      if (!resp.ok) throw new Error(`Falha ao carregar ${vjsPath} — status ${resp.status}`);
      source = await resp.text();
    } catch (err) {
      reportError(err, { stage: "LOAD", sourcePath: vjsPath });
      throw err;
    }
    
    // Se VJS.compile existir, use-o (ele já encapsula lexer/parser/generator).
    if (typeof VJS.compile === "function") {
      try {
        console.group("🔁 VJS.compile pipeline");
        console.time("VJS.compile total");
        const compiled = VJS.compile(source);
        console.timeEnd("VJS.compile total");
        
        console.log("🟢 Tokens:", compiled.tokens);
        console.log("🟢 AST:", compiled.ast);
        console.log("🟢 JS Gerado:\n", compiled.js);
        
        if (options.execute) {
          try {
            console.group("▶️ Execução do JS gerado (VJS.compile)");
            console.time("Execução");
            new Function(compiled.js)();
            console.timeEnd("Execução");
            console.groupEnd();
          } catch (execErr) {
            reportError(execErr, { stage: "EXECUTION", jsCode: compiled.js, ast: compiled.ast, tokens: compiled.tokens, sourcePath: vjsPath });
            throw execErr;
          }
        }
        
        console.groupEnd();
        return compiled; // { tokens, ast, js }
      } catch (err) {
        reportError(err, { stage: "COMPILE", sourcePath: vjsPath });
        throw err;
      }
    }
    
    // Se não existir VJS.compile, rodar pipeline manual (lexer -> parser -> generator)
    let tokens = null;
    let ast = null;
    let jsCode = null;
    
    try {
      console.group("🔁 Pipeline manual: Lexer → Parser → Generator");
      console.time("Pipeline total");
      
      // 1) LEXER
      try {
        console.group("1️⃣ Lexer");
        console.time("Lexer");
        const lexer = new VJS.VJSLexer(source);
        tokens = lexer.tokenize();
        console.timeEnd("Lexer");
        console.log("🟢 Tokens gerados:", tokens);
        console.groupEnd();
      } catch (lexErr) {
        reportError(lexErr, { stage: "LEXER", sourcePath: vjsPath });
        throw lexErr;
      }
      
      // 2) PARSER
      try {
        console.group("2️⃣ Parser");
        console.time("Parser");
        const parser = new VJS.VJSParser(tokens);
        ast = parser.parse();
        console.timeEnd("Parser");
        console.log("🟢 AST gerada:", ast);
        console.groupEnd();
      } catch (parseErr) {
        reportError(parseErr, { stage: "PARSER", tokens, sourcePath: vjsPath });
        throw parseErr;
      }
      
      // 3) CODE GENERATOR
      try {
        console.group("3️⃣ Code Generator");
        console.time("Generator");
        const generator = new VJS.VJSCodeGenerator();
        jsCode = generator.generate(ast);
        console.timeEnd("Generator");
        console.log("🟢 JS gerado:\n", jsCode);
        console.groupEnd();
      } catch (genErr) {
        reportError(genErr, { stage: "CODEGEN", ast, tokens, sourcePath: vjsPath });
        throw genErr;
      }
      
      console.timeEnd("Pipeline total");
      console.groupEnd();
      
      // 4) EXECUÇÃO (opcional)
      if (options.execute) {
        try {
          console.group("▶️ Execução do JS gerado (manual)");
          console.time("Execução");
          new Function(jsCode)();
          console.timeEnd("Execução");
          console.groupEnd();
        } catch (execErr) {
          reportError(execErr, { stage: "EXECUTION", jsCode, ast, tokens, sourcePath: vjsPath });
          throw execErr;
        }
      }
      
      // Retornar resultado útil
      return { tokens, ast, js: jsCode };
    } catch (err) {
      // já reportado nos blocos específicos, mas retrorna um relatório mais geral
      reportError(err, { stage: "PIPELINE", tokens, ast, jsCode, sourcePath: vjsPath });
      throw err;
    }
  }
  
  /* =========================================================
     Execução principal
  ========================================================== */
  try {
    // Você pode trocar o nome do arquivo .vjs aqui
    const result = await transpileAndRun("main.vjs", { execute: true });
    console.log("✅ Execução VJS finalizada.");
    // Se quiser inspecionar programaticamente:
    // console.log(result.tokens, result.ast, result.js);
  } catch (e) {
    console.error("Erro geral na execução VJS:", e);
  }
  
})();