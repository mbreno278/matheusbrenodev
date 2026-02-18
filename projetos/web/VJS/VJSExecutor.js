
// VJSExecutor.js - exposes compile and run using VJSLexer, VJSParser, VJSCodeGenerator
(function(global){
  const VJS = global.VJS = global.VJS || {};

  function compileVJS(source) {
    const lexer = new VJSLexer(source);
    const tokens = lexer.tokenize();
    const parser = new VJSParser(tokens);
    const ast = parser.parse();
    const generator = new VJSCodeGenerator();
    const js = generator.generate(ast);
    return { tokens, ast, js };
  }

  function runVJS(source) {
    const { js } = compileVJS(source);
    // eslint-disable-next-line no-eval
    return eval(js);
  }

  VJS.compile = compileVJS;
  VJS.run = runVJS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { compileVJS, runVJS };
  }
})(typeof window !== "undefined" ? window : global);
