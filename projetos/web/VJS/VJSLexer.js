// VJSParser.js — Parser atualizado e corrigido (blocos padronizados)

class VJSParser {
  constructor(tokens) {
    this.tokens = tokens || [];
    this.current = 0;
  }

  peek(offset = 0) { return this.tokens[this.current + offset]; }
  isAtEnd() { const t = this.peek(); return !t || t.type === "EOF"; }
  advance() { if (!this.isAtEnd()) return this.tokens[this.current++]; return this.peek(); }
  check(type) { const t = this.peek(); return t && t.type === type; }
  match(...types) { for (const t of types) if (this.check(t)) return this.advance(); return null; }
  expect(type, message) {
    const token = this.match(type);
    if (!token) {
      const found = this.peek()?.type || "EOF";
      throw new Error((message ? message + " — " : "") + `Esperado ${type} mas encontrado ${found}`);
    }
    return token;
  }

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

  parseStatement() {
    const token = this.peek();
    if (!token) throw new Error("Fim inesperado do código");

    if (token.type === "KEYWORD") {
      const v = token.value;
      if (["variavel","var","let","constante","const"].includes(v)) return this.parseVariableDeclaration();
      if (["funcao","function","async","assincrono"].includes(v)) return this.parseFunctionDeclaration();
      if (["retornar","return"].includes(v)) return this.parseReturnStatement();
      if (["se","if"].includes(v)) return this.parseIfStatement();
      if (["para","for"].includes(v)) return this.parseForStatement();
      if (["enquanto","while"].includes(v)) return this.parseWhileStatement();
    }

    if (["IDENTIFIER","NUMBER","STRING","TEMPLATE","LPAREN","LBRACKET","LBRACE"].includes(token.type))
      return this.parseExpressionStatement();

    if (["PLUS","MINUS","STAR","SLASH","BANG"].includes(token.type))
      return this.parseExpressionStatement();

    throw new Error("Instrução desconhecida: " + token.type);
  }

  // =========================
  // DECLARAÇÕES
  // =========================

  parseVariableDeclaration() {
    const kw = this.advance();
    const idTok = this.expect("IDENTIFIER", "Nome da variável esperado");

    let varType = null;
    if (this.check("COLON")) {
      this.advance();
      varType = this.expect("IDENTIFIER", "Tipo esperado").value;
    }

    let init = null;
    if (this.check("EQUALS") || this.check("EQUAL")) {
      this.advance();
      init = this.parseExpression();
    }

    if (this.check("SEMICOLON")) this.advance();

    return {
      type: "VariableDeclaration",
      kind: (["constante","const"].includes(kw.value) ? "const":"let"),
      varType,
      declarations: [{ id: { type:"Identifier", name:idTok.value }, init }]
    };
  }

  parseFunctionDeclaration() {
    this.advance(); // funcao

    let name = null;
    if (this.check("IDENTIFIER"))
      name = { type:"Identifier", name:this.advance().value };

    this.expect("LPAREN");

    const params = [];
    while (!this.check("RPAREN") && !this.isAtEnd()) {
      const paramName = this.expect("IDENTIFIER","Nome de parametro esperado").value;
      let paramType = null;

      if (this.check("COLON")) {
        this.advance();
        paramType = this.expect("IDENTIFIER","Tipo esperado apos ':'").value;
      }

      params.push({ type:"Identifier", name:paramName, paramType });

      if (this.check("COMMA")) this.advance();
    }

    this.expect("RPAREN");

    let returnType = null;
    if (this.check("COLON")) {
      this.advance();
      returnType = this.expect("IDENTIFIER","Tipo de retorno esperado").value;
    }

    const body = this.parseBlock();

    return {
      type:"FunctionDeclaration",
      id:name,
      params,
      returnType,
      body
    };
  }

  parseReturnStatement() {
    this.advance();
    const arg = this.check("SEMICOLON") ? null : this.parseExpression();
    if (this.check("SEMICOLON")) this.advance();
    return { type:"ReturnStatement", argument:arg };
  }

  parseIfStatement() {
    this.advance();

    let test;
    if (this.check("LPAREN")) {
      this.advance();
      test = this.parseExpression();
      this.expect("RPAREN");
    } else {
      test = this.parseExpression();
    }

    const consequent = this.parseBlock();

    let alternate = null;
    if (this.check("KEYWORD") && ["senao","else"].includes(this.peek().value)) {
      this.advance();
      alternate = this.parseBlock();
    }

    return { type:"IfStatement", test, consequent, alternate };
  }

  parseForStatement() {
    this.advance();
    this.expect("LPAREN");

    let init = null;
    if (!this.check("SEMICOLON"))
      init = this.parseExpression();
    this.expect("SEMICOLON");

    let test = null;
    if (!this.check("SEMICOLON"))
      test = this.parseExpression();
    this.expect("SEMICOLON");

    let update = null;
    if (!this.check("RPAREN"))
      update = this.parseExpression();

    this.expect("RPAREN");

    const body = this.parseBlock();

    return { type:"ForStatement", init, test, update, body };
  }

  parseWhileStatement() {
    this.advance();

    let test;
    if (this.check("LPAREN")) {
      this.advance();
      test = this.parseExpression();
      this.expect("RPAREN");
    } else {
      test = this.parseExpression();
    }

    const body = this.parseBlock();

    return { type:"WhileStatement", test, body };
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    if (this.check("SEMICOLON")) this.advance();
    return { type:"ExpressionStatement", expression:expr };
  }

  // =========================
  // BLOCO PADRONIZADO
  // =========================

  parseBlock() {
    this.expect("LBRACE","Esperado '{' para iniciar bloco");

    const body = [];
    while (!this.check("RBRACE") && !this.isAtEnd()) {
      if (this.peek().type === "COMMENT") { this.advance(); continue; }
      body.push(this.parseStatement());
    }

    this.expect("RBRACE","Esperado '}' ao fechar bloco");
    return { type:"BlockStatement", body };
  }

  // =========================
  // EXPRESSÕES
  // =========================

  parseExpression() { return this.parseAssignment(); }

  parseAssignment() {
    const left = this.parseEquality();
    if (this.check("EQUAL") || this.check("EQUALS")) {
      const op = this.advance();
      const right = this.parseAssignment();
      return { type:"AssignmentExpression", operator:op.value||op.type, left, right };
    }
    return left;
  }

  parseEquality() {
    let expr = this.parseComparison();
    while (this.check("EQUAL") || this.check("NOT_EQUAL")) {
      const op = this.advance();
      const right = this.parseComparison();
      expr = { type:"BinaryExpression", operator:op.value||op.type, left:expr, right };
    }
    return expr;
  }

  parseComparison() {
    let expr = this.parseTerm();
    while (this.check("GT") || this.check("LT")) {
      const op = this.advance();
      const right = this.parseTerm();
      expr = { type:"BinaryExpression", operator:op.value||op.type, left:expr, right };
    }
    return expr;
  }

  parseTerm() {
    let expr = this.parseFactor();
    while (this.check("PLUS") || this.check("MINUS")) {
      const op = this.advance();
      const right = this.parseFactor();
      expr = { type:"BinaryExpression", operator:op.value||op.type, left:expr, right };
    }
    return expr;
  }

  parseFactor() {
    let expr = this.parseUnary();
    while (this.check("STAR") || this.check("SLASH")) {
      const op = this.advance();
      const right = this.parseUnary();
      expr = { type:"BinaryExpression", operator:op.value||op.type, left:expr, right };
    }
    return expr;
  }

  parseUnary() {
    if (this.check("BANG") || this.check("MINUS")) {
      const op = this.advance();
      const right = this.parseUnary();
      return { type:"UnaryExpression", operator:op.value||op.type, argument:right };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) throw new Error("Expressão inesperada");

    if (this.check("NUMBER")) return { type:"Literal", value:Number(this.advance().value) };
    if (this.check("STRING")) return { type:"Literal", value:this.advance().value };

    if (this.check("IDENTIFIER"))
      return { type:"Identifier", name:this.advance().value };

    if (this.check("LPAREN")) {
      this.advance();
      const expr = this.parseExpression();
      this.expect("RPAREN");
      return expr;
    }

    // OBJETO
    if (this.check("LBRACE")) {
      this.advance();
      const props=[];
      while (!this.check("RBRACE")) {
        const key=this.expect("IDENTIFIER").value;
        this.expect("COLON","Esperado ':' em objeto literal");
        const value=this.parseExpression();
        props.push({ key:{type:"Identifier",name:key}, value });
        if (this.check("COMMA")) this.advance();
      }
      this.expect("RBRACE");
      return { type:"ObjectExpression", properties:props };
    }

    throw new Error("Expressão inválida: "+token.type);
  }
}

if (typeof window !== "undefined") { window.VJS = window.VJS || {}; window.VJS.VJSParser = VJSParser; }
if (typeof module !== "undefined") { module.exports = VJSParser; }