// VJS.compile.patch.js
// Força VJS.compile a usar o pipeline atualizado de forma segura e definitiva

(function() {
  
  function ready() {
    return (
      typeof window !== "undefined" &&
      typeof window.VJS !== "undefined" &&
      typeof VJS.VJSLexer === "function" &&
      typeof VJS.VJSParser === "function" &&
      typeof VJS.VJSCodeGenerator === "function"
    );
  }
  
  function overrideCompile() {
    if (!ready()) {
      return setTimeout(overrideCompile, 50);
    }
    
    // Evita sobrescrever múltiplas vezes
    if (VJS.__compilePatched) {
      return;
    }
    
    VJS.compile = function(source) {
      
      if (typeof source !== "string") {
        throw new Error("VJS.compile: source precisa ser string");
      }
      
      // 1️⃣ Lexer
      const lexer = new VJS.VJSLexer(source);
      const tokens = lexer.tokenize();
      
      // 2️⃣ Parser
      const parser = new VJS.VJSParser(tokens);
      const ast = parser.parse();
      
      // 3️⃣ Generator
      const generator = new VJS.VJSCodeGenerator();
      const js = generator.generate(ast);
      
      return { tokens, ast, js };
    };
    
    VJS.__compilePatched = true;
    
    console.log("✅ VJS.compile atualizado e usando CodeGenerator correto");
    
  }
  
  overrideCompile();
  
})();