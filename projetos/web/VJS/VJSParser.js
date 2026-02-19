// VJSParser.js (atualizado - suporte a ++a, a++, --a, a--)
// Corrige o erro "Instrução desconhecida: INCREMENT"

class VJSParser {
  constructor(tokens) {
    this.tokens = tokens || [];
    this.current = 0;
  }

  /* ==============================
     Métodos utilitários / controle
  ============================== */
  peek(offset = 0) { return this.tokens[this.current + offset]; }
  isAtEnd() { const t = this.peek(); return !t || t.type === "EOF"; }
  advance() { if (!this.isAtEnd()) return this.tokens[this.current++]; return this.peek(); }
  check(type) { const t = this.peek(); return t && t.type === type; }
  match(...types) { for (const t of types) if (this.check(t)) return this.advance(); return null; }
  
  expect(types, message) {
    if (!Array.isArray(types)) types = [types];
    for (const type of types) {
      const token = this.match(type);
      if (token) return token;
    }
    const found = this.peek()?.type || "EOF";
    throw new Error(
      (message ? message + " — " : "") +
      `Esperado ${types.join(" ou ")} mas encontrado ${found}`
    );
  }

  isKeywordValue(token, ...aliases) {
    if (!token || token.type !== "KEYWORD") return false;
    return aliases.includes(token.value);
  }

  /* ==============================
     Entrada principal
  ============================== */
  parse() {
    const body = [];
    while (!this.isAtEnd()) {
      const t = this.peek();
      if (!t) break;
      if (t.type === "COMMENT") { this.advance(); continue; }
      body.push(this.parseStatement());
    }
    return { type: "Program", body };
  }

  /* ==============================
     Statements / Declarations
  ============================== */
  parseStatement() {
    const token = this.peek();
    if (!token) throw new Error("Fim inesperado do código");

    // Suporte especial para escreva.info / escreva.erro (se já existir no seu lexer)
    if (token.type === "ESCREVA_INFO" || token.type === "ESCREVA_ERROR") {
      return this.parseEscrevaStatement?.() || this.parseExpressionStatement();
    }

    // Início de update expression (pré e pós)
    if (["INCREMENT", "DECREMENT"].includes(token.type)) {
      return this.parseExpressionStatement();
    }

    // Início comum de expressão que pode virar statement
    if (["IDENTIFIER", "NUMBER", "STRING", "LPAREN", "LBRACKET", "LBRACE", "PLUS", "MINUS", "BANG"].includes(token.type)) {
      return this.parseExpressionStatement();
    }

    if (token.type === "KEYWORD") {
      if (this.isKeywordValue(token, "variavel", "var", "let")) return this.parseVariableDeclaration(false);
      if (this.isKeywordValue(token, "constante", "const")) return this.parseVariableDeclaration(true);
      if (this.isKeywordValue(token, "funcao", "function", "async", "assincrono")) return this.parseFunctionDeclaration();
      if (this.isKeywordValue(token, "retorne", "return")) return this.parseReturnStatement();
      if (this.isKeywordValue(token, "classe", "class")) return this.parseClassDeclaration();
      if (this.isKeywordValue(token, "construtor", "constructor")) return this.parseConstructor();
      if (this.isKeywordValue(token, "se", "if")) return this.parseIfStatement();
      if (this.isKeywordValue(token, "para", "for")) return this.parseForStatement();
      if (this.isKeywordValue(token, "enquanto", "while")) return this.parseWhileStatement();
    }

    throw new Error("Instrução desconhecida: " + (token?.type || "EOF"));
  }

  // Novo: suporte a ++a, a++, --a, a--
  parseUpdateExpression(baseExpr = null) {
    const isPrefix = this.check("INCREMENT") || this.check("DECREMENT");
    let operator;

    if (isPrefix) {
      operator = this.advance().type === "INCREMENT" ? "++" : "--";
      const argument = baseExpr || this.parseMemberExpression(); // ou parsePrimary se preferir mais restrito
      return {
        type: "UpdateExpression",
        operator,
        argument,
        prefix: true
      };
    }

    // postfix → só aceita se já temos base (ex: a++)
    if (baseExpr) {
      if (this.match("INCREMENT", "DECREMENT")) {
        operator = this.tokens[this.current - 1].type === "INCREMENT" ? "++" : "--";
        return {
          type: "UpdateExpression",
          operator,
          argument: baseExpr,
          prefix: false
        };
      }
    }

    return baseExpr;
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    if (this.check("SEMICOLON")) this.advance();
    return { type: "ExpressionStatement", expression: expr };
  }

  parseExpression() {
    // Aqui entra a precedência correta
    // Update tem precedência muito alta (só perde pra new, call, member, primary)
    let expr = this.parseAssignmentExpression();
    expr = this.parseUpdateExpression(expr); // tenta postfix
    return expr;
  }

  // Ajuste aqui para permitir update como parte da expressão
  parseAssignmentExpression() {
    let left = this.parseConditionalExpression?.() || this.parseBinaryExpression?.() || this.parseUpdateExpression();

    if (this.match("EQUALS", "EQUAL", "PLUS_EQUALS", "MINUS_EQUALS", "STAR_EQUALS", "SLASH_EQUALS")) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parseAssignmentExpression();
      left = {
        type: "AssignmentExpression",
        operator,
        left,
        right
      };
    }

    return left;
  }

  // Você deve implementar / adaptar esses métodos abaixo conforme sua precedência atual
  // (só mostrei o essencial para o update funcionar)

  parseConditionalExpression() {
    // ternário ? :   (se já tiver implementado)
    return this.parseBinaryExpression?.() || this.parseUnaryExpression?.() || this.parseMemberExpression();
  }

  parseBinaryExpression() {
    // + - * / == etc...
    return this.parseUnaryExpression?.() || this.parseMemberExpression();
  }

  parseUnaryExpression() {
    // ! - + typeof etc...
    if (this.match("BANG", "MINUS", "PLUS", "TILDE")) {
      const operator = this.tokens[this.current - 1].type;
      const argument = this.parseUnaryExpression();
      return { type: "UnaryExpression", operator, argument, prefix: true };
    }
    return this.parseUpdateExpression(this.parseMemberExpression());
  }

  parseMemberExpression() {
    let expr = this.parsePrimary();

    while (this.match("DOT", "LBRACKET", "LPAREN")) {
      const prev = this.tokens[this.current - 1];
      if (prev.type === "DOT") {
        const prop = this.expect("IDENTIFIER");
        expr = { type: "MemberExpression", object: expr, property: {type:"Identifier", name: prop.value}, computed: false };
      } else if (prev.type === "LBRACKET") {
        const prop = this.parseExpression();
        this.expect("RBRACKET");
        expr = { type: "MemberExpression", object: expr, property: prop, computed: true };
      } else if (prev.type === "LPAREN") {
        const args = [];
        while (!this.check("RPAREN") && !this.isAtEnd()) {
          args.push(this.parseExpression());
          if (this.check("COMMA")) this.advance();
        }
        this.expect("RPAREN");
        expr = { type: "CallExpression", callee: expr, arguments: args };
      }
    }

    return expr;
  }

  parsePrimary() {
    const token = this.advance();

    switch (token.type) {
      case "NUMBER":   return { type: "Literal", value: Number(token.value), raw: token.value };
      case "STRING":   return { type: "Literal", value: token.value, raw: token.value };
      case "IDENTIFIER": return { type: "Identifier", name: token.value };
      case "LPAREN":
        const expr = this.parseExpression();
        this.expect("RPAREN");
        return expr;
      // adicione true/false/null/etc conforme seu lexer
      default:
        throw new Error("Expressão primária inválida: " + token.type);
    }
  }

  // Mantenha seus outros métodos (variável, função, if, for, etc.)
  // Apenas cole aqui os que você já tem (parseVariableDeclaration, parseFunctionDeclaration, etc.)

  // Exemplo mínimo de parseVariableDeclaration (ajuste conforme o seu):
  parseVariableDeclaration(isConst = false) {
    this.advance(); // variavel / let / const
    const idTok = this.expect("IDENTIFIER");
    const id = { type: "Identifier", name: idTok.value };

    let init = null;
    if (this.match("EQUALS", "EQUAL")) {
      init = this.parseExpression();
    }

    if (this.check("SEMICOLON")) this.advance();

    return {
      type: "VariableDeclaration",
      kind: isConst ? "const" : "let",
      declarations: [{ id, init }]
    };
  }

  // ... seus outros métodos ...
}

// Exporte se estiver usando modules
// export default VJSParser;