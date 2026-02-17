
// VJSParser.js (atualizado) — Parser do VJS com suporte a:
// - anotações de tipo em variáveis e parâmetros (ex.: variavel x: numero = 1; funcao f(a: numero) {...})
// - for completo com init/test/update (inclui init declarando 'variavel' com tipo)
// - compatibilidade PT/EN para keywords
//
// Salve este arquivo como VJSParser.js e substitua o parser atual no seu projeto.
//
// Autor: ChatGPT — atualizado conforme pedido do usuário.

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
  expect(type, message) { const token = this.match(type); if (!token) { const found = this.peek()?.type || "EOF"; throw new Error((message?message+" — ":"") + `Esperado ${type} mas encontrado ${found}`); } return token; }
  isKeywordValue(token, ...aliases) { if (!token || token.type !== "KEYWORD") return false; return aliases.includes(token.value); }

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

    if (token.type === "KEYWORD") {
      if (this.isKeywordValue(token, "variavel","var","let")) return this.parseVariableDeclaration(false);
      if (this.isKeywordValue(token, "constante","const")) return this.parseVariableDeclaration(true);
      if (this.isKeywordValue(token, "funcao","function","async","assincrono")) return this.parseFunctionDeclaration();
      if (this.isKeywordValue(token, "retorne","return")) return this.parseReturnStatement();
      if (this.isKeywordValue(token, "classe","class")) return this.parseClassDeclaration();
      if (this.isKeywordValue(token, "construtor","constructor")) return this.parseConstructor();
      if (this.isKeywordValue(token, "se","if")) return this.parseIfStatement();
      if (this.isKeywordValue(token, "para","for")) return this.parseForStatement();
      if (this.isKeywordValue(token, "enquanto","while")) return this.parseWhileStatement();
      if (this.isKeywordValue(token, "verdadeiro","true","falso","false","nulo","null","isso","this")) return this.parseExpressionStatement();
    }

    if (["IDENTIFIER","NUMBER","STRING","TEMPLATE","LPAREN","LBRACKET","LBRACE"].includes(token.type)) return this.parseExpressionStatement();
    if (["PLUS","MINUS","STAR","SLASH","BANG"].includes(token.type)) return this.parseExpressionStatement();

    throw new Error("Instrução desconhecida: " + token.type);
  }

  parseVariableDeclaration(isConst=false) {
    // consome keyword variavel / var / let / constante / const
    const kw = this.advance();
    const idTok = this.expect("IDENTIFIER","Nome da variável esperado");
    const id = { type: "Identifier", name: idTok.value };

    // permitir anotações de tipo: ':' TYPE
    if (this.check("COLON") || this.check("DOIS_PONTOS")) {
      this.advance(); // :
      if (this.check("TYPE") || this.check("IDENTIFIER")) {
        const t = this.advance();
        id.typeAnnotation = t.value;
      } else {
        // tolerância: aceitar IDENTIFIER como tipo também
        throw new Error("Tipo esperado após ':' na declaração de variável");
      }
    }

    // inicialização opcional
    let init = null;
    if (this.match("EQUALS","EQUAL")) {
      init = this.parseExpression();
    }

    // terminar com ; opcionalmente
    if (this.check("SEMICOLON")) this.advance();

    return {
      type: "VariableDeclaration",
      kind: isConst ? "const" : "let",
      declarations: [{ id, init }]
    };
  }

  parseFunctionDeclaration() {
    const kw = this.advance(); // funcao / function
    let name = null;
    if (this.check("IDENTIFIER")) name = { type: "Identifier", name: this.advance().value };

    this.expect("LPAREN","Esperado '(' apos declaracao de funcao");

    const params = [];
    while (!this.check("RPAREN") && !this.isAtEnd()) {
      if (this.check("IDENTIFIER")) {
        const pTok = this.advance();
        const param = { type: "Identifier", name: pTok.value };
        // suporte a anotacao de tipo: : TYPE
        if (this.check("COLON") || this.check("DOIS_PONTOS")) {
          this.advance();
          if (this.check("TYPE") || this.check("IDENTIFIER")) {
            param.typeAnnotation = this.advance().value;
          } else {
            throw new Error("Tipo esperado após ':' no parâmetro da função");
          }
        }
        params.push(param);
      } else {
        // pular token inesperado para manter robustez
        this.advance();
      }
      if (this.check("COMMA")) this.advance();
    }
    this.expect("RPAREN");

    // corpo: bloco { ... }
    this.expect("LBRACE","Esperado '{' no corpo da função");
    const body = this.parseBlock();
    return { type: "FunctionDeclaration", id: name, params, body };
  }

  parseClassDeclaration() {
    this.advance();
    const nameTok = this.expect("IDENTIFIER","Nome da classe esperado");
    const id = { type:"Identifier", name: nameTok.value };

    let superClass = null;
    if (this.check("KEYWORD") && (this.peek().value === "extends" || this.peek().value === "estende")) {
      this.advance();
      if (this.check("IDENTIFIER")) superClass = { type:"Identifier", name: this.advance().value };
    }

    this.expect("LBRACE","Esperado '{' no corpo da classe");
    const body = [];
    while (!this.check("RBRACE") && !this.isAtEnd()) {
      const t = this.peek();
      if (t.type === "KEYWORD" && (t.value === "construtor" || t.value === "constructor")) body.push(this.parseConstructor());
      else if (t.type === "IDENTIFIER") {
        const methodName = this.advance().value;
        this.expect("LPAREN");
        const params = [];
        while (!this.check("RPAREN") && !this.isAtEnd()) {
          if (this.check("IDENTIFIER")) {
            const pTok = this.advance();
            const param = { type:"Identifier", name: pTok.value };
            if (this.check("COLON") || this.check("DOIS_PONTOS")) { this.advance(); if (this.check("TYPE")||this.check("IDENTIFIER")) param.typeAnnotation = this.advance().value; else throw new Error("Tipo esperado em parametro de metodo"); }
            params.push(param);
          } else this.advance();
          if (this.check("COMMA")) this.advance();
        }
        this.expect("RPAREN");
        this.expect("LBRACE");
        const methodBody = this.parseBlock();
        body.push({ type:"MethodDefinition", key:{type:"Identifier", name:methodName}, params, body: methodBody });
      } else { this.advance(); }
    }
    this.expect("RBRACE");
    return { type:"ClassDeclaration", id, superClass, body };
  }

  parseConstructor() {
    this.advance(); // consome keyword
    this.expect("LPAREN","Esperado '(' apos construtor");
    const params=[];
    while (!this.check("RPAREN") && !this.isAtEnd()) {
      if (this.check("IDENTIFIER")) {
        const pTok = this.advance();
        const param = { type:"Identifier", name: pTok.value };
        if (this.check("COLON") || this.check("DOIS_PONTOS")) { this.advance(); if (this.check("TYPE")||this.check("IDENTIFIER")) param.typeAnnotation=this.advance().value; else throw new Error("Tipo esperado em parametro do construtor"); }
        params.push(param);
      } else this.advance();
      if (this.check("COMMA")) this.advance();
    }
    this.expect("RPAREN");
    this.expect("LBRACE");
    const body = this.parseBlock();
    return { type:"Constructor", params, body };
  }

  parseReturnStatement() {
    this.advance();
    const arg = this.check("SEMICOLON") ? null : this.parseExpression();
    if (this.check("SEMICOLON")) this.advance();
    return { type:"ReturnStatement", argument: arg };
  }

  parseIfStatement() {
    this.advance();
    let test;
    if (this.check("LPAREN")) { this.advance(); test = this.parseExpression(); this.expect("RPAREN"); }
    else test = this.parseExpression();

    let consequent;
    if (this.check("LBRACE")) { this.advance(); consequent = this.parseBlock(); }
    else consequent = { type: "BlockStatement", body: [this.parseStatement()] };

    let alternate = null;
    if (this.check("KEYWORD") && (this.peek().value === "senao" || this.peek().value === "else")) {
      this.advance();
      if (this.check("LBRACE")) { this.advance(); alternate = this.parseBlock(); }
      else alternate = { type: "BlockStatement", body: [this.parseStatement()] };
    }

    return { type:"IfStatement", test, consequent, alternate };
  }

  parseForStatement() {
    this.advance(); // consome 'para' / 'for'
    this.expect("LPAREN","Esperado '(' apos for");

    // init: pode ser 'variavel ...' (declaration) ou expressão / vazio
    let init = null;
    if (this.check("KEYWORD") && (this.peek().value==="variavel"||this.peek().value==="var"||this.peek().value==="let"||this.peek().value==="constante"||this.peek().value==="const")) {
      init = this.parseVariableDeclaration(this.peek().value === "constante" || this.peek().value === "const");
    } else if (!this.check("SEMICOLON")) {
      init = this.parseExpression();
      // se houver ';' após expressão, será consumido mais abaixo
    } else {
      // vazio
    }

    // consumir ';' separador entre init e test se estiver presente
    if (this.check("SEMICOLON")) this.advance();

    // test (condição)
    let test = null;
    if (!this.check("SEMICOLON") && !this.check("RPAREN")) {
      test = this.parseExpression();
    }

    this.expect("SEMICOLON","Esperado ';' no for apos teste");

    // update (expressão de incremento)
    let update = null;
    if (!this.check("RPAREN")) {
      update = this.parseExpression();
    }

    this.expect("RPAREN","Esperado ')' apos for");

    // corpo do for
    let body = null;
    if (this.check("LBRACE")) { this.advance(); body = this.parseBlock(); }
    else body = { type: "BlockStatement", body: [this.parseStatement()] };

    return { type:"ForStatement", init, test, update, body };
  }

  parseWhileStatement() {
    this.advance();
    let test = null;
    if (this.check("LPAREN")) { this.advance(); test = this.parseExpression(); this.expect("RPAREN"); }
    else test = this.parseExpression();
    if (this.check("LBRACE")) { this.advance(); const body = this.parseBlock(); return { type:"WhileStatement", test, body }; }
    else { const body = { type:"BlockStatement", body: [this.parseStatement()] }; return { type:"WhileStatement", test, body }; }
  }

  parseExpressionStatement() {
    const expr = this.parseExpression();
    if (this.check("SEMICOLON")) this.advance();
    return { type:"ExpressionStatement", expression: expr };
  }

  /* ==============================
     Blocos
  ============================== */
  parseBlock() {
    const body = [];
    while (!this.check("RBRACE") && !this.isAtEnd()) {
      if (this.peek().type === "COMMENT") { this.advance(); continue; }
      body.push(this.parseStatement());
    }
    this.expect("RBRACE","Esperado '}' ao fechar bloco");
    return { type:"BlockStatement", body };
  }

  /* ==============================
     Expressions (precedência)
  ============================== */
  parseExpression() { return this.parseAssignment(); }

  parseAssignment() {
    const left = this.parseLogicalOR();
    if (this.check("EQUALS") || this.check("EQUAL") || this.check("PLUS_EQUAL") || this.check("MINUS_EQUAL") || this.check("MUL_EQUAL") || this.check("DIV_EQUAL") || this.check("MOD_EQUAL")) {
      const op = this.advance();
      const right = this.parseAssignment();
      return { type:"AssignmentExpression", operator: op.value || op.type, left, right };
    }
    return left;
  }

  parseLogicalOR() {
    let expr = this.parseLogicalAND();
    while (this.check("OR") || this.check("PIPE") || this.check("NULLISH_COALESCING") || (this.check("KEYWORD") && this.peek().value==="ou")) {
      const op = this.advance();
      const right = this.parseLogicalAND();
      expr = { type:"LogicalExpression", operator: op.value || op.type, left: expr, right };
    }
    return expr;
  }

  parseLogicalAND() {
    let expr = this.parseEquality();
    while (this.check("AND") || this.check("AMP") || (this.check("KEYWORD") && this.peek().value==="e")) {
      const op = this.advance();
      const right = this.parseEquality();
      expr = { type:"LogicalExpression", operator: op.value || op.type, left: expr, right };
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseComparison();
    while (this.check("EQUAL") || this.check("NOT_EQUAL") || this.check("STRICT_EQUAL") || this.check("STRICT_NOT_EQUAL")) {
      const op = this.advance();
      const right = this.parseComparison();
      expr = { type:"BinaryExpression", operator: op.value || op.type, left: expr, right };
    }
    return expr;
  }

  parseComparison() {
    let expr = this.parseTerm();
    while (this.check("GT") || this.check("LT") || this.check("GREATER_EQUAL") || this.check("LESS_EQUAL")) {
      const op = this.advance();
      const right = this.parseTerm();
      expr = { type:"BinaryExpression", operator: op.value || op.type, left: expr, right };
    }
    return expr;
  }

  parseTerm() {
    let expr = this.parseFactor();
    while (this.check("PLUS") || this.check("MINUS")) {
      const op = this.advance();
      const right = this.parseFactor();
      expr = { type:"BinaryExpression", operator: op.value || op.type, left: expr, right };
    }
    return expr;
  }

  parseFactor() {
    let expr = this.parseUnary();
    while (this.check("STAR") || this.check("SLASH") || this.check("PERCENT") || this.check("EXPONENT")) {
      const op = this.advance();
      const right = this.parseUnary();
      expr = { type:"BinaryExpression", operator: op.value || op.type, left: expr, right };
    }
    return expr;
  }

  parseUnary() {
    if (this.check("BANG") || this.check("MINUS") || this.check("PLUS") || this.check("INCREMENT") || this.check("DECREMENT")) {
      const op = this.advance();
      const right = this.parseUnary();
      return { type:"UnaryExpression", operator: op.value || op.type, argument: right, prefix: true };
    }
    return this.parseCallAndMember();
  }

  parseCallAndMember() {
    let expr = this.parsePrimary();
    while (true) {
      if (this.check("LPAREN")) {
        this.advance();
        const args = [];
        while (!this.check("RPAREN") && !this.isAtEnd()) {
          args.push(this.parseExpression());
          if (this.check("COMMA")) this.advance();
        }
        this.expect("RPAREN");
        expr = { type:"CallExpression", callee: expr, arguments: args };
        continue;
      }
      if (this.check("LBRACKET")) {
        this.advance();
        const indexExpr = this.parseExpression();
        this.expect("RBRACKET");
        expr = { type:"MemberExpression", object: expr, property: indexExpr, computed: true };
        continue;
      }
      if (this.check("DOT")) {
        this.advance();
        const prop = this.expect("IDENTIFIER","Esperado identificador apos '.'");
        expr = { type:"MemberExpression", object: expr, property: { type:"Identifier", name: prop.value }, computed: false };
        continue;
      }
      if (this.check("OPTIONAL_CHAIN")) {
        this.advance();
        if (this.check("IDENTIFIER")) {
          const prop = this.advance();
          expr = { type:"OptionalMemberExpression", object: expr, property: { type:"Identifier", name: prop.value } };
        } else if (this.check("LPAREN")) {
          this.advance();
          const args = [];
          while (!this.check("RPAREN") && !this.isAtEnd()) {
            args.push(this.parseExpression());
            if (this.check("COMMA")) this.advance();
          }
          this.expect("RPAREN");
          expr = { type:"OptionalCallExpression", callee: expr, arguments: args };
        }
        continue;
      }
      break;
    }
    return expr;
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) throw new Error("Expressao inesperada no final do codigo");
    if (this.check("NUMBER")) { const t=this.advance(); return { type:"Literal", value: Number(t.value) }; }
    if (this.check("STRING") || this.check("TEMPLATE")) { const t=this.advance(); return { type:"Literal", value: t.value }; }
    if (this.check("KEYWORD") && (token.value==="verdadeiro"||token.value==="true")) { this.advance(); return { type:"Literal", value:true }; }
    if (this.check("KEYWORD") && (token.value==="falso"||token.value==="false")) { this.advance(); return { type:"Literal", value:false }; }
    if (this.check("KEYWORD") && (token.value==="nulo"||token.value==="null")) { this.advance(); return { type:"Literal", value:null }; }
    if ((this.check("KEYWORD") && (token.value==="isso"||token.value==="this")) || (this.check("IDENTIFIER") && token.value==="isso")) { this.advance(); return { type:"ThisExpression" }; }

    // array literal
    if (this.check("LBRACKET")) {
      this.advance();
      const elements=[];
      while (!this.check("RBRACKET") && !this.isAtEnd()) { elements.push(this.parseExpression()); if (this.check("COMMA")) this.advance(); }
      this.expect("RBRACKET","Esperado ']' no fim do array");
      return { type:"ArrayExpression", elements };
    }

    // object literal
    if (this.check("LBRACE")) {
      this.advance();
      const props=[];
      while (!this.check("RBRACE") && !this.isAtEnd()) {
        let key=null;
        if (this.check("IDENTIFIER")) key={type:"Identifier", name: this.advance().value};
        else if (this.check("STRING")) key={type:"Literal", value: this.advance().value};
        else this.advance();
        this.expect("COLON","Esperado ':' em objeto literal");
        const val = this.parseExpression();
        props.push({ key, value: val });
        if (this.check("COMMA")) this.advance();
      }
      this.expect("RBRACE","Esperado '}' no fim do objeto");
      return { type:"ObjectExpression", properties: props };
    }

    // grouping
    if (this.check("LPAREN")) { this.advance(); const expr = this.parseExpression(); this.expect("RPAREN","Esperado ')' apos expressao agrupada"); return expr; }

    // identifier / builtin
    if (this.check("IDENTIFIER") || this.check("BUILTIN")) {
      const t = this.advance();
      return { type:"Identifier", name: t.value };
    }

    throw new Error("Expressao invalida: " + token.type + (token.value ? " ("+token.value+")" : ""));
  }
}

// registrar
try {
  if (typeof window !== "undefined") {
    window.VJS = window.VJS || {};
    window.VJS.VJSParser = VJSParser;
  }
} catch(e){}

try {
  if (typeof module !== "undefined") {
    module.exports = VJSParser;
  }
} catch(e){}

// Registrar globalmente
window.VJS = window.VJS || {};
window.VJS.VJSParser = VJSParser;