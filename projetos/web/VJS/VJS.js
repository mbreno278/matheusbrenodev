// VJs.js
// Pipeline VJS (Lexer -> Parser -> SemanticAnalyzer -> CodeGenerator)
// ES Module

import { VJSLexer } from './VJSLexer.js';
import { VJSParser } from './VJSParser.js';
import { VJSCodeGenerator } from './VJSCodeGenerator.js';
import { VJSSemanticAnalyzer } from './VJSSemanticAnalyzer.js';

/**
 * normalizeTokens
 * Garante que tokens seja um array plano (evita retornos acidentais do tipo ["Tokens:", tokens]).
 */
function normalizeTokens(maybeTokens) {
  if (Array.isArray(maybeTokens)) return maybeTokens;
  // se for objeto com .tokens
  if (maybeTokens && Array.isArray(maybeTokens.tokens)) return maybeTokens.tokens;
  // valor inesperado -> retorne array vazio (defensivo)
  return [];
}

/**
 * compileVJS
 */
export function compileVJS(source, options = {}) {
  if (!source || typeof source !== "string") {
    throw new Error("Código fonte inválido.");
  }
  
  const debug = !!options.debug;
  
  let tokens = null;
  let ast = null;
  let js = null;
  
  /* =====================
     1️⃣ LEXER
  ===================== */
  try {
    const lexer = new VJSLexer(source);
    const t = lexer.tokenize();
    tokens = normalizeTokens(t);
    if (!Array.isArray(tokens)) tokens = [];
    if (debug) console.log("[VJS][debug] tokens:", tokens);
  } catch (err) {
    const e = new Error("Erro no Lexer: " + (err && err.message));
    e.stage = "LEXER";
    e.cause = err;
    throw e;
  }
  
  /* =====================
     2️⃣ PARSER
  ===================== */
  try {
    const parser = new VJSParser(tokens, { source });
    ast = parser.parse();
    if (!ast || typeof ast !== "object") {
      const e = new Error("Parser retornou AST inválida.");
      e.stage = "PARSER";
      e.tokens = tokens;
      throw e;
    }
    if (debug) console.log("[VJS][debug] ast:", ast);
  } catch (err) {
    const e = new Error("Erro no Parser: " + (err && err.message));
    e.stage = "PARSER";
    e.tokens = tokens;
    e.cause = err;
    throw e;
  }
  
  /* =====================
     3️⃣ SEMANTIC ANALYZER
  ===================== */
  if (!options.skipSemantic) {
    try {
      if (typeof VJSSemanticAnalyzer === "function") {
        const semantic = new VJSSemanticAnalyzer(ast);
        // analyze pode lançar; capturamos e enriquecemos a exceção
        semantic.analyze();
      } else {
        // se não existe um analisador, apenas loga (sem quebrar)
        if (debug) console.warn("[VJS] VJSSemanticAnalyzer ausente ou inválido — pulando análise semântica.");
      }
    } catch (err) {
      const e = new Error("Erro no Semantic Analyzer: " + (err && err.message));
      e.stage = "SEMANTIC";
      e.tokens = tokens;
      e.ast = ast;
      e.cause = err;
      throw e;
    }
  }
  
  /* =====================
     4️⃣ CODE GENERATOR
  ===================== */
  try {
    const generator = new VJSCodeGenerator();
    js = generator.generate(ast);
    if (typeof js !== "string") {
      const e = new Error("CodeGenerator não retornou string de JS.");
      e.stage = "CODEGEN";
      e.ast = ast;
      throw e;
    }
    if (debug) console.log("[VJS][debug] js:\n", js);
  } catch (err) {
    const e = new Error("Erro no CodeGenerator: " + (err && err.message));
    e.stage = "CODEGEN";
    e.tokens = tokens;
    e.ast = ast;
    e.cause = err;
    throw e;
  }
  
  // retorno consistente e simples
  return { tokens, ast, js };
}

/**
 * runVJS
 * Compila e executa o JS resultante dentro de uma Function isolada.
 * Retorna o valor retornado pela função (se houver).
 */
export function runVJS(source, options = {}) {
  const out = compileVJS(source, options);
  
  try {
    // executa num contexto limpo
    const fn = new Function(out.js);
    return fn();
  } catch (err) {
    const e = new Error("Erro durante execução do código gerado: " + (err && err.message));
    e.stage = "EXECUTION";
    e.tokens = out.tokens;
    e.ast = out.ast;
    e.js = out.js;
    e.cause = err;
    throw e;
  }
}

/* =====================
   EXPORTS
===================== */
export {
  VJSLexer,
  VJSParser,
  VJSCodeGenerator,
  VJSSemanticAnalyzer
};

/* =====================
   Namespace Browser
===================== */
if (typeof window !== "undefined") {
  window.VJS = {
    VJSLexer,
    VJSParser,
    VJSCodeGenerator,
    VJSSemanticAnalyzer,
    compile: compileVJS,
    run: runVJS
  };
}