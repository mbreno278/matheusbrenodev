// VJS.compile.patch.js
// Força o VJS.compile a usar o VJSCodeGenerator atualizado

(function () {

  function overrideCompile() {
    if (typeof VJS === "undefined") {
      return setTimeout(overrideCompile, 50);
    }

    VJS.compile = function (source) {
      const lexer = new VJS.VJSLexer(source);
      const tokens = lexer.tokenize();

      const parser = new VJS.VJSParser(tokens);
      const ast = parser.parse();

      const generator = new VJS.VJSCodeGenerator();
      const js = generator.generate(ast);

      return { tokens, ast, js };
    };

    console.log("✅ VJS.compile sobrescrito com novo CodeGenerator");
  }

  overrideCompile();

})();