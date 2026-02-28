// VJSParser.js — versão atualizada (com correções para atribuições em métodos e suporte a `this`)
export class VJSSyntaxError extends Error {
  constructor(message, { file = "<input>", line = 1, column = 1, offset = 0, source = "" } = {}) {
    super(message);
    this.name = "VJSSyntaxError";
    this.file = file;
    this.line = line;
    this.column = column;
    this.offset = offset;
    this.source = source;
  }
}

export class VJSParser {
  constructor(tokens, options = {}) {
    this.tokens = tokens || [];
    this.current = 0;
    this.filename = options.filename || "<input>";
    this.source = options.source || "";
  }

  /* ===============================
     HELPERS / UTILITIES
  =============================== */

  peek(offset = 0) {
    return this.tokens[this.current + offset];
  }

  isAtEnd() {
    const t = this.peek();
    return !t || t.type === "EOF";
  }

  advance() {
    if (!this.isAtEnd()) return this.tokens[this.current++];
    return this.peek();
  }

  check(type) {
    const t = this.peek();
    return t && t.type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) return this.advance();
    }
    return null;
  }

  _tokenStart(token) {
    return token && token.start ? token.start : { line: 1, column: 1, offset: 0 };
  }

  _throwSyntax(message, token = this.peek()) {
    const pos = this._tokenStart(token);
    throw new VJSSyntaxError(message, {
      file: this.filename,
      line: pos.line,
      column: pos.column,
      offset: pos.offset,
      source: this.source
    });
  }

  expect(types, message) {
    if (!Array.isArray(types)) types = [types];
    const token = this.peek();
    for (const ttype of types) {
      if (token && token.type === ttype) return this.advance();
    }
    const found = token ? `${token.type}${token.value ? "("+token.value+")" : ""}` : "EOF";
    this._throwSyntax(
      (message ? message + " — " : "") + `Esperado ${types.join(" ou ")} mas encontrado ${found}`,
      token
    );
  }

  isKeywordValue(token, value) {
    if (!token) return false;
    if (token.type === "KEYWORD" && token.value === value) return true;
    if (token.type === "IDENTIFIER" && token.value === value) return true;
    return false;
  }

  consumeKeyword(value, message) {
    const token = this.peek();
    if (this.isKeywordValue(token, value)) return this.advance();
    this._throwSyntax(message || `Esperado '${value}'`, token);
  }

  matchKeyword(value) {
    const token = this.peek();
    if (this.isKeywordValue(token, value)) return this.advance();
    return null;
  }

  isAssignable(node) {
    return node &&
      (node.type === "Identifier" ||
       node.type === "MemberExpression" ||
       node.type === "PrivateIdentifier");
  }

  /* ===============================
     PROGRAMA
  =============================== */

  parse() {
    const body = [];
    while (!this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    return { type: "Program", body };
  }

  /* ===============================
     STATEMENTS
  =============================== */

  parseStatement() {
    const token = this.peek();
    if (!token) return null;

    // keywords by textual value
    if (this.matchKeyword("variavel") || this.matchKeyword("constante")) {
      this.current--;
      return this.parseVariableDeclaration();
    }

    if (this.matchKeyword("funcao")) { this.current--; return this.parseFunctionDeclaration(); }
    if (this.matchKeyword("classe")) { this.current--; return this.parseClassDeclaration(); }

    // ADICIONADO: suporte a 'para' (for)
    if (this.matchKeyword("para")) { this.current--; return this.parseForStatement(); }

    if (this.matchKeyword("se")) { this.current--; return this.parseIfStatement(); }
    if (this.matchKeyword("enquanto")) { this.current--; return this.parseWhileStatement(); }
    if (this.matchKeyword("retorne")) { this.current--; return this.parseReturnStatement(); }

    if (this.check("LBRACE")) return this.parseBlock();

    const expr = this.parseExpression();

    if (this.check("SEMICOLON")) this.advance();

    return { type: "ExpressionStatement", expression: expr };
  }

  parseBlock() {
    this.expect("LBRACE", "Esperado '{' para iniciar bloco");
    const body = [];

    while (!this.check("RBRACE") && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }

    this.expect("RBRACE", "Esperado '}' para fechar bloco");
    return { type: "BlockStatement", body };
  }

  /* ===============================
     CLASSE
  =============================== */

  parseClassDeclaration() {
    this.consumeKeyword("classe", "Esperado 'classe' para declaração de classe");

    const idToken = this.expect("IDENTIFIER", "Esperado nome da classe");
    let superClass = null;
    let implementsList = null;

    if (this.isKeywordValue(this.peek(), "estende")) {
      this.consumeKeyword("estende");
      // superclass can be an identifier or a MemberExpression (A.B)
      superClass = this.parsePrimaryName();
    }

    if (this.isKeywordValue(this.peek(), "implementa")) {
      this.consumeKeyword("implementa");
      implementsList = [];
      do {
        const implTok = this.expect("IDENTIFIER", "Esperado nome de interface em 'implementa'");
        implementsList.push({ type: "Identifier", name: implTok.value });
        if (!this.check("COMMA")) break;
        this.advance();
      } while (true);
    }

    // class body
    this.expect("LBRACE", "Esperado '{' para iniciar corpo da classe");
    const body = [];
    while (!this.check("RBRACE") && !this.isAtEnd()) {
      const elem = this.parseClassElement();
      if (elem) body.push(elem);
    }
    this.expect("RBRACE", "Esperado '}' para fechar corpo da classe");

    return {
      type: "ClassDeclaration",
      id: { type: "Identifier", name: idToken.value },
      superClass,
      implements: implementsList,
      body: { type: "ClassBody", body }
    };
  }

  // parse a simple name as possible MemberExpression: e.g. A.B.C
  parsePrimaryName() {
    let base = null;
    const first = this.expect(["IDENTIFIER","BUILTIN"], "Esperado identificador");
    base = { type: "Identifier", name: first.value };
    while (this.match("DOT")) {
      // Allow property tokens to be IDENTIFIER, BUILTIN or KEYWORD (robust for lexer variations)
      const prop = this.expect(["IDENTIFIER","BUILTIN","KEYWORD"], "Esperado propriedade após '.'");
      base = {
        type: "MemberExpression",
        object: base,
        property: { type: "Identifier", name: prop.value },
        computed: false
      };
    }
    return base;
  }

  parseClassElement() {
    // decorators (zero ou mais) — @decorator (apenas simples expressions aceitas por enquanto)
    const decorators = [];
    while (this.check("AT")) {
      this.advance();
      // decorator simples: IDENTIFIER ou CallExpression
      const decoTarget = this.parsePrimary();
      decorators.push(decoTarget);
    }

    // modifiers (publico/privado/protegido/estatico/abstrato)
    const modifiers = { publico:false, privado:false, protegido:false, estatico:false, abstrato:false };
    let foundModifier = true;
    while (foundModifier) {
      const t = this.peek();
      foundModifier = false;
      if (this.isKeywordValue(t,"publico")) { this.advance(); modifiers.publico = true; foundModifier = true; }
      if (this.isKeywordValue(t,"privado"))  { if (!foundModifier) this.advance(); modifiers.privado = true; foundModifier = true; }
      if (this.isKeywordValue(t,"protegido")){ if (!foundModifier) this.advance(); modifiers.protegido = true; foundModifier = true; }
      if (this.isKeywordValue(t,"estatico")) { if (!foundModifier) this.advance(); modifiers.estatico = true; foundModifier = true; }
      if (this.isKeywordValue(t,"abstrato")) { if (!foundModifier) this.advance(); modifiers.abstrato = true; foundModifier = true; }
    }

    // private field (#name) or identifier/name (could be constructor/get/set/method/field)
    let isPrivate = false;
    let keyToken = null;

    if (this.check("HASH")) {
      // #identifier
      this.advance();
      const ident = this.expect("IDENTIFIER", "Esperado identificador após '#'");
      isPrivate = true;
      keyToken = { type: "PrivateIdentifier", name: ident.value };
    } else if (this.check("IDENTIFIER") || this.check("BUILTIN") || this.check("STRING") || this.check("NUMBER")) {
      keyToken = this.advance();
    } else if (this.isKeywordValue(this.peek(), "construtor")) {
      keyToken = this.advance(); // constructor keyword token
    } else {
      this._throwSyntax("Esperado membro da classe (identificador, '#nome' ou 'construtor')", this.peek());
    }

    // if keyToken is string/number/builtin wrap to Identifier/ Literal as appropriate
    let keyNode;
    if (keyToken.type === "PrivateIdentifier") {
      keyNode = { type: "PrivateIdentifier", name: keyToken.name };
    } else if (keyToken.type === "IDENTIFIER" || keyToken.type === "BUILTIN") {
      keyNode = { type: "Identifier", name: keyToken.value };
    } else if (keyToken.type === "STRING") {
      keyNode = { type: "Literal", value: keyToken.value };
    } else if (keyToken.type === "NUMBER") {
      keyNode = { type: "Literal", value: Number(keyToken.value) };
    } else if (this.isKeywordValue(keyToken, "construtor")) {
      keyNode = { type: "Identifier", name: "construtor" };
    } else {
      keyNode = { type: "Identifier", name: (keyToken.value || "") };
    }

    // detect accessor: get / set
    let kind = "method";
    if (this.isKeywordValue(keyToken, "get")) kind = "get";
    if (this.isKeywordValue(keyToken, "set")) kind = "set";

    // if accessor keyword (get/set), then next token must be IDENTIFIER for the property name
    if (kind === "get" || kind === "set") {
      const propTok = this.expect("IDENTIFIER", `Esperado nome da propriedade após '${keyToken.value}'`);
      keyNode = { type: "Identifier", name: propTok.value };
    }

    // method? field? constructor?
    // method if next token is LPAREN
    if (this.check("LPAREN")) {
      // method definition
      const method = this.parseMethodDefinition(keyNode, { isPrivate, modifiers, decorators, kind });
      return method;
    }

    // field: optional initializer and semicolon
    // constructor special-case: if key is 'construtor' and next is LPAREN -> treated above as method
    // otherwise it's a field declaration
    let init = null;
    if (this.match("EQUALS")) {
      init = this.parseExpression();
    }
    // optional terminating semicolon
    if (this.check("SEMICOLON")) this.advance();

    return {
      type: "FieldDefinition",
      key: keyNode,
      value: init,
      static: !!modifiers.estatico,
      access: modifiers.privado ? "private" : modifiers.protegido ? "protected" : modifiers.publico ? "public" : "public",
      decorators,
      isPrivate
    };
  }

  parseMethodDefinition(keyNode, meta = {}) {
    // keyNode: Identifier | PrivateIdentifier | Literal
    // meta: { isPrivate, modifiers, decorators, kind }
    const modifiers = meta.modifiers || {};
    const decorators = meta.decorators || [];
    const isPrivate = !!meta.isPrivate;
    const kind = meta.kind || "method"; // method|get|set|constructor

    // parse parameters
    this.expect("LPAREN", "Esperado '(' em definição de método");

    const params = [];
    
    while (!this.check("RPAREN") && !this.isAtEnd()) {
      
      const paramTok = this.expect("IDENTIFIER", "Esperado nome do parâmetro");
      
      let typeAnnotation = null;
      let defaultValue = null;
      
      // 🔵 Tipo opcional
      if (this.match("COLON")) {
        const typeTok = this.expect("IDENTIFIER", "Esperado tipo após ':'");
        typeAnnotation = {
          type: "TypeAnnotation",
          typeName: typeTok.value
        };
      }
      
      // 🔥 Valor padrão opcional
      if (this.match("EQUALS")) {
        defaultValue = this.parseExpression();
      }
      
      params.push({
        type: "Identifier",
        name: paramTok.value,
        typeAnnotation,
        defaultValue
      });
      
      if (!this.match("COMMA")) break;
    }
    
    this.expect("RPAREN", "Esperado ')' após parâmetros");
    
    // return type (optional)
    let returnType = null;
    if (this.check("COLON")) {
      this.advance();
      const typeTok = this.expect(["IDENTIFIER","TYPE"], "Esperado tipo de retorno após ':'");
      returnType = { type: "TypeAnnotation", typeName: typeTok.value };
    }

    // body (method or abstract without body)
    let body = null;
    if (this.check("LBRACE")) {
      body = this.parseBlock();
    } else {
      // sem corpo: se abstrato, podemos permitir ; ou nada
      if (this.check("SEMICOLON")) this.advance();
      if (!modifiers.abstrato) {
        this._throwSyntax("Esperado corpo de método '{ ... }' ou 'abstrato' para métodos sem corpo", this.peek());
      }
    }

    // construct node
    const node = {
      type: kind === "constructor" || (keyNode.type === "Identifier" && keyNode.name === "construtor") ? "Constructor" : "MethodDefinition",
      key: keyNode,
      params,
      returnType,
      body,
      static: !!modifiers.estatico,
      access: modifiers.privado ? "private" : modifiers.protegido ? "protected" : modifiers.publico ? "public" : "public",
      decorators,
      isPrivate,
      kind: kind === "get" ? "get" : kind === "set" ? "set" : (keyNode.type === "Identifier" && keyNode.name === "construtor") ? "constructor" : "method",
      abstract: !!modifiers.abstrato
    };

    return node;
  }

  /* ===============================
     FUNÇÃO
  =============================== */

  parseFunctionDeclaration() {
    this.consumeKeyword("funcao", "Esperado 'funcao' para declaração de função");
    const nameToken = this.expect("IDENTIFIER", "Esperado nome da função");

    this.expect("LPAREN", "Esperado '(' após nome da função");

    const params = [];

    while (!this.check("RPAREN") && !this.isAtEnd()) {

      const param = this.expect("IDENTIFIER", "Esperado nome do parâmetro");
    
      let typeAnnotation = null;
      let defaultValue = null;
    
      // 🔵 Tipo opcional
      if (this.match("COLON")) {
        const typeToken = this.expect("IDENTIFIER", "Esperado tipo após ':'");
    
        typeAnnotation = {
          type: "TypeAnnotation",
          typeName: typeToken.value
        };
      }
    
      // 🔥 Valor padrão opcional
      if (this.match("EQUALS")) {
        defaultValue = this.parseExpression();
      }
    
      params.push({
        type: "Identifier",
        name: param.value,
        typeAnnotation,
        defaultValue
      });
    
      if (!this.match("COMMA")) break;
    }

    this.expect("RPAREN", "Esperado ')' após lista de parâmetros");

    // retorno
    let returnType = null;
    if (this.check("COLON")) {
      this.advance();
      const typeToken = this.expect(["IDENTIFIER", "TYPE"], "Esperado tipo de retorno após ':'");
      returnType = {
        type: "TypeAnnotation",
        typeName: typeToken.value
      };
    }

    const body = this.parseBlock();

    return {
      type: "FunctionDeclaration",
      id: { type: "Identifier", name: nameToken.value },
      params,
      returnType,
      body
    };
  }

  parseIfStatement() {
    this.consumeKeyword("se", "Esperado 'se' para if statement");

    this.expect("LPAREN", "Esperado '(' após 'se'");
    const test = this.parseExpression();
    this.expect("RPAREN", "Esperado ')' após condição");

    const consequent = this.parseStatement();

    let alternate = null;
    if (this.isKeywordValue(this.peek(), "senao")) {
      this.advance();
      alternate = this.parseStatement();
    }

    return { type: "IfStatement", test, consequent, alternate };
  }

  parseWhileStatement() {
    this.consumeKeyword("enquanto", "Esperado 'enquanto' para while");
    this.expect("LPAREN", "Esperado '(' após 'enquanto'");
    const test = this.parseExpression();
    this.expect("RPAREN", "Esperado ')' após condição");
    const body = this.parseStatement();
    return { type: "WhileStatement", test, body };
  }

  // ADICIONADO: parseForStatement — implementa 'para (init; cond; update) body'
  parseForStatement() {
    this.consumeKeyword("para", "Esperado 'para' para for statement");
    this.expect("LPAREN", "Esperado '(' após 'para'");
  
    let init = null;
  
    // ============================
    // 🔥 1️⃣ Verifica se começa com variável
    // ============================
    if (this.isKeywordValue(this.peek(), "variavel") || 
        this.isKeywordValue(this.peek(), "constante")) {
  
      init = this.parseVariableDeclaration(true); // sem consumir ;
  
      // ============================
      // 🔥 2️⃣ Se vier "de" → é ForOf
      // ============================
      if (this.isKeywordValue(this.peek(), "de")) {
        this.consumeKeyword("de", "Esperado 'de' no para...de");
  
        const right = this.parseExpression();
  
        this.expect("RPAREN", "Esperado ')' após para...de");
  
        const body = this.parseStatement();
  
        return {
          type: "ForOfStatement",
          left: init,
          right,
          body
        };
      }
    }
  
    // ============================
    // 🔁 FOR TRADICIONAL (mantém igual)
    // ============================
  
    if (!this.check("SEMICOLON")) {
      if (!init) {
        init = this.parseExpression();
      }
    }
  
    this.expect("SEMICOLON", "Esperado ';' após inicialização do para");
  
    let test = null;
    if (!this.check("SEMICOLON")) {
      test = this.parseExpression();
    }
  
    this.expect("SEMICOLON", "Esperado ';' após condição do para");
  
    let update = null;
    if (!this.check("RPAREN")) {
      update = this.parseExpression();
    }
  
    this.expect("RPAREN", "Esperado ')' após cláusulas do para");
  
    const body = this.parseStatement();
  
    return { type: "ForStatement", init, test, update, body };
  }

  parseReturnStatement() {
    this.consumeKeyword("retorne", "Esperado 'retorne' para return");

    let argument = null;
    if (!this.check("SEMICOLON") && !this.isAtEnd()) {
      argument = this.parseExpression();
    }

    if (this.check("SEMICOLON")) this.advance();

    return { type: "ReturnStatement", argument };
  }

  // Ajustado: parseVariableDeclaration agora aceita um parâmetro 'inFor' para
  // evitar consumir o ';' quando for chamada a partir do for(...)
  parseVariableDeclaration(inFor = false) {
    const keyword = this.advance(); // consumiu 'variavel' ou 'constante'
    const declarations = [];

    do {
      const id = this.expect("IDENTIFIER", "Esperado nome da variável");

      let typeAnnotation = null;
      if (this.check("COLON")) {
        this.advance();
        const typeToken = this.expect(["IDENTIFIER", "TYPE"], "Esperado tipo após ':'");
        typeAnnotation = {
          type: "TypeAnnotation",
          typeName: typeToken.value
        };
      }

      let init = null;
      if (this.match("EQUALS")) init = this.parseExpression();

      declarations.push({
        type: "VariableDeclarator",
        id: { type: "Identifier", name: id.value },
        init,
        typeAnnotation
      });

      if (!this.check("COMMA")) break;
      this.advance();
    } while (true);

    // se não for parte de um for(...), consumir semicolon opcional como antes
    if (this.check("SEMICOLON") && !inFor) this.advance();

    return {
      type: "VariableDeclaration",
      kind: (keyword.value === "constante") ? "const" : "let",
      declarations
    };
  }

  /* ===============================
     EXPRESSÕES
  =============================== */

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const left = this.parseLogicalOR();

    // capture token types and provide fallback operator strings when .value is missing
    if (this.match("EQUALS","PLUS_EQUAL","MINUS_EQUAL","MUL_EQUAL","DIV_EQUAL","MOD_EQUAL")) {
      const operatorToken = this.tokens[this.current - 1];

      // fallback map in case token.value is undefined
      const opFallback = {
        EQUALS: "=",
        PLUS_EQUAL: "+=",
        MINUS_EQUAL: "-=",
        MUL_EQUAL: "*=",
        DIV_EQUAL: "/=",
        MOD_EQUAL: "%="
      };
      const operator = operatorToken && (operatorToken.value || opFallback[operatorToken.type] || operatorToken.type);

      const right = this.parseAssignment();

      if (!this.isAssignable(left)) {
        this._throwSyntax("Lado esquerdo inválido para atribuição.", operatorToken);
      }

      return { type: "AssignmentExpression", operator, left, right };
    }

    return left;
  }

  parseLogicalOR() {
    let expr = this.parseLogicalAND();
    while (this.match("OR")) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parseLogicalAND();
      expr = { type: "LogicalExpression", operator, left: expr, right };
    }
    return expr;
  }

  parseLogicalAND() {
    let expr = this.parseEquality();
    while (this.match("AND")) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parseEquality();
      expr = { type: "LogicalExpression", operator, left: expr, right };
    }
    return expr;
  }

  parseEquality() {
    let expr = this.parseComparison();
  
    while (true) {
      const token = this.peek();
      if (!token) break;
  
      if (
        token.type === "STRICT_EQUAL" ||
        token.type === "STRICT_NOT_EQUAL" ||
        token.type === "EQUAL" ||
        token.type === "NOT_EQUAL"
      ) {
        const operator =
          token.type === "STRICT_EQUAL" ? "===" :
          token.type === "STRICT_NOT_EQUAL" ? "!==" :
          token.type === "EQUAL" ? "==" :
          token.type === "NOT_EQUAL" ? "!=" :
          null;
  
        this.advance();
  
        const right = this.parseComparison();
  
        expr = {
          type: "BinaryExpression",
          operator,
          left: expr,
          right
        };
  
        continue;
      }
  
      break;
    }
  
    return expr;
  }

  parseComparison() {
    let expr = this.parseTerm();
    // numeric comparisons
    while (this.match("GT","LT","GREATER_EQUAL","LESS_EQUAL")) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parseTerm();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    // instanciaDe (instanceof) textual keyword
    while (this.isKeywordValue(this.peek(), "instanciaDe")) {
      this.advance();
      const right = this.parseTerm();
      expr = { type: "BinaryExpression", operator: "instanciaDe", left: expr, right };
    }
    return expr;
  }

  parseTerm() {
    let expr = this.parseFactor();
    while (this.match("PLUS","MINUS")) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parseFactor();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    return expr;
  }

  parseFactor() {
    let expr = this.parseUnary();
    while (this.match("STAR","SLASH","PERCENT")) {
      const operator = this.tokens[this.current - 1].value;
      const right = this.parseUnary();
      expr = { type: "BinaryExpression", operator, left: expr, right };
    }
    return expr;
  }

  parseUnary() {
    // prefix ++/--
    if (this.match("INCREMENT","DECREMENT")) {
      const operator = this.tokens[this.current - 1].value;
      const argument = this.parseUnary();
      return { type: "UpdateExpression", operator, argument, prefix: true };
    }

    // unary word operators: tipoDe (typeof)
    if (this.isKeywordValue(this.peek(), "tipoDe")) {
      const tok = this.advance();
      const arg = this.parseUnary();
      return { type: "UnaryExpression", operator: "tipoDe", argument: arg, prefix: true };
    }

    // standard unary operators
    if (this.match("BANG","MINUS","PLUS")) {
      const operator = this.tokens[this.current - 1].value;
      const argument = this.parseUnary();
      return { type: "UnaryExpression", operator, argument, prefix: true };
    }

    return this.parseCallAndMember();
  }

  parseCallAndMember() {
    let expr = this.parsePrimary();

    while (true) {
      // call
      if (this.match("LPAREN")) {
        const args = [];
        while (!this.check("RPAREN") && !this.isAtEnd()) {
          args.push(this.parseExpression());
          if (!this.check("COMMA")) break;
          this.advance();
        }
        this.expect("RPAREN", "Esperado ')' após argumentos");
        expr = { type: "CallExpression", callee: expr, arguments: args };
        continue;
      }

      // optional chaining ?. (lexer emits OPTIONAL_CHAIN)
      if (this.match("OPTIONAL_CHAIN")) {
        // aceitar KEYWORD também como propriedade após '?.' (robusto)
        const prop = this.expect(["IDENTIFIER","BUILTIN","KEYWORD"], "Esperado propriedade após '?.'");
        expr = {
          type: "MemberExpression",
          object: expr,
          property: { type: "Identifier", name: prop.value },
          computed: false,
          optional: true
        };
        continue;
      }

      // dot member
      if (this.match("DOT")) {
        // aceitar KEYWORD também como propriedade após '.'
        const prop = this.expect(["IDENTIFIER","BUILTIN","KEYWORD"], "Esperado propriedade após '.'");
        expr = {
          type: "MemberExpression",
          object: expr,
          property: { type: "Identifier", name: prop.value },
          computed: false
        };
        continue;
      }

      // bracket member
      if (this.match("LBRACKET")) {
        const index = this.parseExpression();
        this.expect("RBRACKET", "Esperado ']'");
        expr = {
          type: "MemberExpression",
          object: expr,
          property: index,
          computed: true
        };
        continue;
      }

      // postfix ++/--
      if (this.match("INCREMENT","DECREMENT")) {
        const operator = this.tokens[this.current - 1].value;
        expr = { type: "UpdateExpression", operator, argument: expr, prefix: false };
        continue;
      }

      break;
    }

    return expr;
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) this._throwSyntax("Expressão inesperada no final do código", token);

    // numero / string
    
    // Tratamento do tipo Numero em VJS
    if (this.match("NumericLiteral")) {
      this.advance(); // consome o token
      return {
        type: "NumericLiteral",
        value: token.value,   // Number ou BigInt
        raw: token.raw,
        isBig: token.isBig,
        kind: token.kind,
        base: token.base
      };
    }

    if (this.match("STRING")) return { type: "Literal", value: token.value };
    if (this.match("TEMPLATE")) return { type: "TemplateLiteral", value: token.value };

    // boolean and null keywords
    if ((token.type === "KEYWORD" || token.type === "IDENTIFIER") && token.value === "verdadeiro") {
      this.advance();
      return { type: "Literal", value: true };
    }
    if ((token.type === "KEYWORD" || token.type === "IDENTIFIER") && token.value === "falso") {
      this.advance();
      return { type: "Literal", value: false };
    }
    if ((token.type === "KEYWORD" || token.type === "IDENTIFIER") && token.value === "nulo") {
      this.advance();
      return { type: "Literal", value: null };
    }

    // 'this' support (aceita token.type === 'THIS' ou keyword/identifier 'this')
    if (this.isKeywordValue(token, "this") || token.type === "THIS") {
      this.advance();
      return { type: "ThisExpression" };
    }

    // 'novo' new expression
    if (this.isKeywordValue(token, "novo")) {
      this.advance();
      const callee = this.parsePrimary(); // allow new Foo() or new Foo.bar()
      this.expect("LPAREN", "Esperado '(' após 'novo' construção");
      const args = [];
      while (!this.check("RPAREN") && !this.isAtEnd()) {
        args.push(this.parseExpression());
        if (!this.check("COMMA")) break;
        this.advance();
      }
      this.expect("RPAREN", "Esperado ')' após argumentos de novo");
      return { type: "NewExpression", callee, arguments: args };
    }

    // 'super' keyword as Super node (or Identifier fallback)
    if (this.isKeywordValue(token, "super") || token.type === "SUPER") {
      this.advance();
      return { type: "Super" };
    }

    // identifier or builtin
    if (this.match("IDENTIFIER","BUILTIN")) return { type: "Identifier", name: token.value };

    // parenthesis
    if (this.match("LPAREN")) {
      const expr = this.parseExpression();
      this.expect("RPAREN", "Esperado ')'");
      return expr;
    }

    // array literal
    if (this.match("LBRACKET")) {
      const elements = [];
      while (!this.check("RBRACKET") && !this.isAtEnd()) {
        elements.push(this.parseExpression());
        if (!this.check("COMMA")) break;
        this.advance();
      }
      this.expect("RBRACKET", "Esperado ']'");
      return { type: "ArrayExpression", elements };
    }

    // object literal
    if (this.match("LBRACE")) {
      const properties = [];
      while (!this.check("RBRACE") && !this.isAtEnd()) {
        // aceitar KEYWORD como chave de objeto também (ex.: { em: 1 })
        const keyToken = this.expect(["IDENTIFIER","KEYWORD","STRING","NUMBER"], "Esperado chave do objeto");
        this.expect("COLON", "Esperado ':' entre chave e valor");
        const value = this.parseExpression();

        properties.push({
          type: "Property",
          key: { type: "Identifier", name: keyToken.value },
          value,
          kind: "init"
        });

        if (!this.check("COMMA")) break;
        this.advance();
      }
      this.expect("RBRACE", "Esperado '}'");
      return { type: "ObjectExpression", properties };
    }

    // fallback error
    this._throwSyntax(`Expressão inválida: ${token.type}${token.value ? " ("+token.value+")" : ""}`, token);
  }
}