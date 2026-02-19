
// VJS Updated - integrado (Lexer, Parser, CodeGenerator) - versão gerada pelo ChatGPT
// Salve este arquivo como VJS_updated.js e substitua o seu vjs.js se desejar.
// Exports: window.VJS.VJSLexer, VJSParser, VJSCodeGenerator, VJS.compile, VJS.run

(function(global) {
  const VJS = global.VJS = global.VJS || {};

  /* ===========================
     VJSLexer (robusto)
  =========================== */
  class VJSLexer {
    constructor(input) {
      this.input = input || "";
      this.position = 0;
      this.line = 1;
      this.column = 1;
      this.tokens = [];
    }

    currentChar() { return this.input[this.position]; }
    peekChar(offset = 1) { return this.input[this.position + offset]; }

    advance() {
      if (this.currentChar() === "\n") { this.line++; this.column = 1; }
      else { this.column++; }
      this.position++;
    }

    addToken(type, value = null, line = this.line, column = this.column) {
      this.tokens.push({ type, value, line, column });
    }

    isLetter(char) { return /[a-zA-Z_$]/.test(char); }
    isNumber(char) { return /[0-9]/.test(char); }
    isWhitespace(char) { return /\s/.test(char); }

    lexIdentifier() {
      const startLine = this.line;
      const startCol = this.column;
      let value = "";
      while (this.currentChar() && (this.isLetter(this.currentChar()) || this.isNumber(this.currentChar()))) {
        value += this.currentChar();
        this.advance();
      }

      const keywords = [
        // English
        "var","let","const","function","return","if","else","for","while","do","break","continue",
        "class","constructor","this","new","switch","case","default","try","catch","finally","throw",
        "import","export","from","as","extends","super","instanceof","typeof","in","of","async","await","yield",
        "true","false","null","undefined",
        // Portuguese equivalents
        "variavel","constante","funcao","retorne","se","senao","para","enquanto","faca","pare","continue",
        "classe","construtor","este","novo","escolha","caso","padrao","tente","capture","finalmente","lance",
        "importar","exportar","de","como","estende","super","instanciaDe","tipoDe","em","de","assincrono","aguardar",
        "verdadeiro","falso","nulo","indefinido"
      ];

      const types = ["number","string","boolean","object","array","any","numero","texto","booleano","objeto","lista","qualquer"];

      const builtins = ["console","Math","Array","String","Object","JSON","Date","RegExp","Map","Set","Promise","Symbol","Reflect","Intl"];

      if (keywords.includes(value)) this.addToken("KEYWORD", value, startLine, startCol);
      else if (types.includes(value)) this.addToken("TYPE", value, startLine, startCol);
      else if (builtins.includes(value)) this.addToken("BUILTIN", value, startLine, startCol);
      else this.addToken("IDENTIFIER", value, startLine, startCol);
    }

    lexNumber() {
      const startLine = this.line;
      const startCol = this.column;
      let value = "";

      // hex/bin/oct
      if (this.currentChar() === "0" && (this.peekChar() === "x" || this.peekChar() === "X")) {
        value += this.currentChar(); this.advance();
        value += this.currentChar(); this.advance();
        while (this.currentChar() && /[0-9a-fA-F]/.test(this.currentChar())) { value += this.currentChar(); this.advance(); }
        this.addToken("NUMBER", value, startLine, startCol); return;
      }
      if (this.currentChar() === "0" && (this.peekChar() === "b" || this.peekChar() === "B")) {
        value += this.currentChar(); this.advance();
        value += this.currentChar(); this.advance();
        while (this.currentChar() && /[01]/.test(this.currentChar())) { value += this.currentChar(); this.advance(); }
        this.addToken("NUMBER", value, startLine, startCol); return;
      }
      if (this.currentChar() === "0" && (this.peekChar() === "o" || this.peekChar() === "O")) {
        value += this.currentChar(); this.advance();
        value += this.currentChar(); this.advance();
        while (this.currentChar() && /[0-7]/.test(this.currentChar())) { value += this.currentChar(); this.advance(); }
        this.addToken("NUMBER", value, startLine, startCol); return;
      }

      while (this.currentChar() && this.isNumber(this.currentChar())) { value += this.currentChar(); this.advance(); }
      if (this.currentChar() === "." && this.isNumber(this.peekChar())) { value += this.currentChar(); this.advance();
        while (this.currentChar() && this.isNumber(this.currentChar())) { value += this.currentChar(); this.advance(); }
      }
      if (this.currentChar() && (this.currentChar() === "e" || this.currentChar() === "E")) {
        value += this.currentChar(); this.advance();
        if (this.currentChar() === "+" || this.currentChar() === "-") { value += this.currentChar(); this.advance(); }
        while (this.currentChar() && this.isNumber(this.currentChar())) { value += this.currentChar(); this.advance(); }
      }

      this.addToken("NUMBER", value, startLine, startCol);
    }

    lexString() {
      const startLine = this.line;
      const startCol = this.column;
      const quote = this.currentChar();
      let value = "";
      this.advance();
      if (quote === "`") {
        while (this.currentChar()) {
          if (this.currentChar() === "`") break;
          if (this.currentChar() === "\\" && this.peekChar()) { value += this.currentChar(); this.advance(); value += this.currentChar(); this.advance(); continue; }
          value += this.currentChar(); this.advance();
        }
        if (this.currentChar() === "`") this.advance();
        this.addToken("TEMPLATE", value, startLine, startCol);
        return;
      }
      while (this.currentChar() && this.currentChar() !== quote) {
        if (this.currentChar() === "\\" && this.peekChar()) { value += this.currentChar(); this.advance(); value += this.currentChar(); this.advance(); continue; }
        value += this.currentChar(); this.advance();
      }
      if (this.currentChar() === quote) this.advance();
      this.addToken("STRING", value, startLine, startCol);
    }

    lexComment() {
      if (this.currentChar() === "/" && this.peekChar() === "/") {
        this.advance(); this.advance();
        while (this.currentChar() && this.currentChar() !== "\n") this.advance();
        return true;
      }
      if (this.currentChar() === "/" && this.peekChar() === "*") {
        this.advance(); this.advance();
        while (this.currentChar() && !(this.currentChar() === "*" && this.peekChar() === "/")) this.advance();
        if (this.currentChar() === "*" && this.peekChar() === "/") { this.advance(); this.advance(); }
        return true;
      }
      return false;
    }

    tokenize() {
      while (this.position < this.input.length) {
        let ch = this.currentChar();
        if (!ch) break;
        if (this.isWhitespace(ch)) { this.advance(); continue; }
        if (this.lexComment()) { continue; }
        if (this.isLetter(ch)) { this.lexIdentifier(); continue; }
        if (this.isNumber(ch)) { this.lexNumber(); continue; }
        if (ch === '"' || ch === "'" || ch === "`") { this.lexString(); continue; }

        const threeCharTokens = { "===":"STRICT_EQUAL", "!==":"STRICT_NOT_EQUAL", "...":"ELLIPSIS", ">>>":"ZERO_FILL_RIGHT_SHIFT" };
        const twoCharTokens = { "==":"EQUAL", "!=":"NOT_EQUAL", "<=":"LESS_EQUAL", ">=":"GREATER_EQUAL", "&&":"AND", "||":"OR", "++":"INCREMENT", "--":"DECREMENT", "+=":"PLUS_EQUAL", "-=":"MINUS_EQUAL", "*=":"MUL_EQUAL", "/=":"DIV_EQUAL", "%=":"MOD_EQUAL", "=>":"ARROW", "?.":"OPTIONAL_CHAIN", "**":"EXPONENT", "<<":"LEFT_SHIFT", ">>":"RIGHT_SHIFT","??":"NULLISH_COALESCING" };
        const singleCharTokens = { "=":"EQUALS", "+":"PLUS", "-":"MINUS", "*":"STAR", "/":"SLASH", "%":"PERCENT", "(":"LPAREN", ")":"RPAREN", "{":"LBRACE", "}":"RBRACE", "[":"LBRACKET", "]":"RBRACKET", ";":"SEMICOLON", ":":"COLON", ".":"DOT", ",":"COMMA", ">":"GT", "<":"LT", "!":"BANG", "&":"AMP", "|":"PIPE", "?":"QUESTION" };

        const three = ch + (this.peekChar() || "") + (this.peekChar(2) || "");
        if (threeCharTokens[three]) { this.addToken(threeCharTokens[three], three); this.advance(); this.advance(); this.advance(); continue; }
        const two = ch + (this.peekChar() || "");
        if (twoCharTokens[two]) { this.addToken(twoCharTokens[two], two); this.advance(); this.advance(); continue; }
        if (singleCharTokens[ch]) { this.addToken(singleCharTokens[ch], ch); this.advance(); continue; }

        throw new Error(`Caractere inesperado '${ch}' na linha ${this.line}, coluna ${this.column}`);
      }

      this.addToken("EOF", null, this.line, this.column);
      return this.tokens;
    }
  }

  /* ===========================
     VJSParser (robusto, compat PT/EN)
  =========================== */
  class VJSParser {
    constructor(tokens) {
      this.tokens = tokens || [];
      this.current = 0;
    }
  
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
  
    expect(types, message) {
      if (!Array.isArray(types)) types = [types];
      const token = this.match(...types);
      if (!token) {
        const found = this.peek()?.type || "EOF";
        throw new Error(
          (message ? message + " — " : "") +
          `Esperado ${types.join(", ")} mas encontrado ${found}`
        );
      }
      return token;
    }
  
    isAssignable(node) {
      return node &&
        (node.type === "Identifier" ||
         node.type === "MemberExpression");
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
  
      if (token.type === "KEYWORD") {
        switch (token.value) {
  
          case "variavel":
          case "constante":
            return this.parseVariableDeclaration();
  
          case "funcao":
            return this.parseFunctionDeclaration();
  
          case "se":
            return this.parseIfStatement();
  
          case "enquanto":
            return this.parseWhileStatement();
  
          case "retorne":
            return this.parseReturnStatement();
        }
      }
  
      if (this.check("LBRACE")) return this.parseBlock();
  
      const expr = this.parseExpression();
      if (this.check("SEMICOLON")) this.advance();
  
      return { type: "ExpressionStatement", expression: expr };
    }
  
    parseBlock() {
      this.expect("LBRACE", "Esperado '{'");
      const body = [];
  
      while (!this.check("RBRACE") && !this.isAtEnd()) {
        body.push(this.parseStatement());
      }
  
      this.expect("RBRACE", "Esperado '}'");
  
      return { type: "BlockStatement", body };
    }
  
    parseFunctionDeclaration() {
      this.expect("KEYWORD"); // funcao
      const name = this.expect("IDENTIFIER");
  
      this.expect("LPAREN");
  
      const params = [];
  
      while (!this.check("RPAREN")) {
        const param = this.expect("IDENTIFIER");
  
        if (this.check("COLON")) {
          this.advance();
          this.expect(["IDENTIFIER", "TYPE"]);
        }
  
        params.push({ type: "Identifier", name: param.value });
  
        if (!this.check("COMMA")) break;
        this.advance();
      }
  
      this.expect("RPAREN");
  
      const body = this.parseBlock();
  
      return {
        type: "FunctionDeclaration",
        id: { type: "Identifier", name: name.value },
        params,
        body
      };
    }
  
    parseIfStatement() {
      this.expect("KEYWORD"); // se
  
      this.expect("LPAREN");
      const test = this.parseExpression();
      this.expect("RPAREN");
  
      const consequent = this.parseStatement();
  
      let alternate = null;
      if (this.check("KEYWORD") && this.peek().value === "senao") {
        this.advance();
        alternate = this.parseStatement();
      }
  
      return { type: "IfStatement", test, consequent, alternate };
    }
  
    parseWhileStatement() {
      this.expect("KEYWORD"); // enquanto
  
      this.expect("LPAREN");
      const test = this.parseExpression();
      this.expect("RPAREN");
  
      const body = this.parseStatement();
  
      return { type: "WhileStatement", test, body };
    }
  
    parseReturnStatement() {
      this.expect("KEYWORD"); // retorne
  
      let argument = null;
      if (!this.check("SEMICOLON"))
        argument = this.parseExpression();
  
      if (this.check("SEMICOLON")) this.advance();
  
      return { type: "ReturnStatement", argument };
    }
  
    parseVariableDeclaration() {
      const keyword = this.advance();
  
      const declarations = [];
  
      do {
        const id = this.expect("IDENTIFIER");
  
        let typeAnnotation = null;
  
        if (this.check("COLON")) {
          this.advance();
          const typeToken = this.expect(["IDENTIFIER", "TYPE"]);
          typeAnnotation = {
            type: "TypeAnnotation",
            typeName: typeToken.value
          };
        }
  
        let init = null;
        if (this.match("EQUALS","EQUAL"))
          init = this.parseExpression();
  
        declarations.push({
          type: "VariableDeclarator",
          id: { type: "Identifier", name: id.value },
          init,
          typeAnnotation
        });
  
        if (!this.check("COMMA")) break;
        this.advance();
  
      } while (true);
  
      if (this.check("SEMICOLON")) this.advance();
  
      return {
        type: "VariableDeclaration",
        kind: keyword.value === "constante" ? "const" : "let",
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
  
      if (this.match("EQUALS","PLUS_EQUAL","MINUS_EQUAL","MUL_EQUAL","DIV_EQUAL","MOD_EQUAL")) {
        const operator = this.tokens[this.current - 1].value;
        const right = this.parseAssignment();
  
        if (!this.isAssignable(left))
          throw new Error("Lado esquerdo inválido para atribuição.");
  
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
      while (this.match("EQUAL","NOT_EQUAL","STRICT_EQUAL","STRICT_NOT_EQUAL")) {
        const operator = this.tokens[this.current - 1].value;
        const right = this.parseComparison();
        expr = { type: "BinaryExpression", operator, left: expr, right };
      }
      return expr;
    }
  
    parseComparison() {
      let expr = this.parseTerm();
      while (this.match("GT","LT","GREATER_EQUAL","LESS_EQUAL")) {
        const operator = this.tokens[this.current - 1].value;
        const right = this.parseTerm();
        expr = { type: "BinaryExpression", operator, left: expr, right };
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
      if (this.match("INCREMENT","DECREMENT")) {
        const operator = this.tokens[this.current - 1].value;
        const argument = this.parseUnary();
        return { type: "UpdateExpression", operator, argument, prefix: true };
      }
  
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
  
        if (this.match("LPAREN")) {
          const args = [];
          while (!this.check("RPAREN")) {
            args.push(this.parseExpression());
            if (!this.check("COMMA")) break;
            this.advance();
          }
          this.expect("RPAREN");
          expr = { type: "CallExpression", callee: expr, arguments: args };
          continue;
        }
  
        if (this.match("DOT")) {
          const prop = this.expect(["IDENTIFIER","BUILTIN"]);
          expr = {
            type: "MemberExpression",
            object: expr,
            property: { type: "Identifier", name: prop.value },
            computed: false
          };
          continue;
        }
  
        if (this.match("LBRACKET")) {
          const index = this.parseExpression();
          this.expect("RBRACKET");
          expr = {
            type: "MemberExpression",
            object: expr,
            property: index,
            computed: true
          };
          continue;
        }
  
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
      if (!token) throw new Error("Expressão inesperada no final do código");
  
      if (this.match("NUMBER"))
        return { type: "Literal", value: Number(token.value) };
  
      if (this.match("STRING"))
        return { type: "Literal", value: token.value };
  
      if (this.check("KEYWORD") && token.value === "verdadeiro") {
        this.advance();
        return { type: "Literal", value: true };
      }
  
      if (this.check("KEYWORD") && token.value === "falso") {
        this.advance();
        return { type: "Literal", value: false };
      }
  
      if (this.check("KEYWORD") && token.value === "nulo") {
        this.advance();
        return { type: "Literal", value: null };
      }
  
      if (this.match("IDENTIFIER","BUILTIN"))
        return { type: "Identifier", name: token.value };
  
      if (this.match("LPAREN")) {
        const expr = this.parseExpression();
        this.expect("RPAREN");
        return expr;
      }
  
      if (this.match("LBRACKET")) {
        const elements = [];
        while (!this.check("RBRACKET")) {
          elements.push(this.parseExpression());
          if (!this.check("COMMA")) break;
          this.advance();
        }
        this.expect("RBRACKET");
        return { type: "ArrayExpression", elements };
      }
  
      if (this.match("LBRACE")) {
        const properties = [];
        while (!this.check("RBRACE")) {
          const key = this.expect("IDENTIFIER");
          this.expect("COLON");
          const value = this.parseExpression();
  
          properties.push({
            type: "Property",
            key: { type: "Identifier", name: key.value },
            value,
            kind: "init"
          });
  
          if (!this.check("COMMA")) break;
          this.advance();
        }
        this.expect("RBRACE");
        return { type: "ObjectExpression", properties };
      }
  
      throw new Error(`Expressão inválida: ${token.type} (${token.value})`);
    }
  }
  /* ===========================
     VJSCodeGenerator (PT -> JS mappings)
  =========================== */
  class VJSCodeGenerator {
    constructor(options = {}) {
      this.indentLevel = 0;
      this.indentString = options.indentString || "  ";
    }
    
    generate(ast) {
      if (!ast) throw new Error("AST nao fornecida");
      this.indentLevel = 0;
      return this._gen(ast);
    }
    
    _gen(node) {
      if (!node) return "";
      
      if (Array.isArray(node))
        return node.map(n => this._indent() + this._gen(n)).join("\n");
      
      const fn = this[`_gen${node.type}`];
      if (!fn) throw new Error("No generator for node: " + node.type);
      
      return fn.call(this, node);
    }
    
    _indent() {
      return this.indentString.repeat(this.indentLevel);
    }
    
    _withIndent(fn) {
      this.indentLevel++;
      const r = fn();
      this.indentLevel--;
      return r;
    }
    
    /* =====================================================
       IDENTIFIER / PROPERTY MAPPING
    ===================================================== */
    
    _identifierMapping(name) {
      const idMap = {
        mostrar: "console.log",
        imprime: "console.log",
        alerta: "alert",
        
        aleatorio: "Math.random",
        arredondar: "Math.round",
        piso: "Math.floor",
        teto: "Math.ceil",
        
        adicionar: "push",
        removerFim: "pop",
        removerInicio: "shift",
        adicionarInicio: "unshift",
        
        mapear: "map",
        filtrar: "filter",
        reduzir: "reduce",
        
        maiusculo: "toUpperCase",
        minusculo: "toLowerCase",
        tamanho: "length",
        
        lista: "Array",
        texto: "String",
        matematica: "Math"
      };
      
      return idMap[name] || name;
    }
    
    _propertyMapping(name) {
      return this._identifierMapping(name);
    }
    
    /* =====================================================
       PROGRAM STRUCTURE
    ===================================================== */
    
    _genProgram(node) {
      return this._gen(node.body);
    }
    
    _genBlockStatement(node) {
      return `{\n${this._withIndent(() =>
        node.body.map(n => this._indent() + this._gen(n)).join("\n")
      )}\n${this._indent()}}`;
    }
    
    _genExpressionStatement(node) {
      return `${this._gen(node.expression)};`;
    }
    
    _genVariableDeclaration(node) {
      const kind = node.kind || "let";
      
      const decls = node.declarations.map(d => {
        const id = this._gen(d.id);
        const init = d.init ? " = " + this._gen(d.init) : "";
        return id + init;
      });
      
      return `${kind} ${decls.join(", ")};`;
    }
    
    _genFunctionDeclaration(node) {
      const name = this._gen(node.id);
      const params = node.params.map(p => this._gen(p)).join(", ");
      return `function ${name}(${params}) ${this._gen(node.body)}`;
    }
    
    _genArrowFunctionExpression(node) {
      const params = node.params.map(p => this._gen(p)).join(", ");
      const body =
        node.body.type === "BlockStatement" ?
        this._gen(node.body) :
        this._gen(node.body);
      return `(${params}) => ${body}`;
    }
    
    /* =====================================================
       CONTROL FLOW
    ===================================================== */
    
    _genIfStatement(node) {
      let code = `if (${this._gen(node.test)}) ${this._gen(node.consequent)}`;
      
      if (node.alternate) {
        code += ` else ${this._gen(node.alternate)}`;
      }
      
      return code;
    }
    
    _genWhileStatement(node) {
      return `while (${this._gen(node.test)}) ${this._gen(node.body)}`;
    }
    
    _genForStatement(node) {
      const init = node.init ? this._gen(node.init).replace(/;$/, "") : "";
      const test = node.test ? this._gen(node.test) : "";
      const update = node.update ? this._gen(node.update) : "";
      
      return `for (${init}; ${test}; ${update}) ${this._gen(node.body)}`;
    }
    
    _genReturnStatement(node) {
      return node.argument ?
        `return ${this._gen(node.argument)};` :
        "return;";
    }
    
    _genBreakStatement() {
      return "break;";
    }
    
    _genContinueStatement() {
      return "continue;";
    }
    
    /* =====================================================
       EXPRESSIONS
    ===================================================== */
    
    _genIdentifier(node) {
      return this._identifierMapping(node.name);
    }
    
    _genLiteral(node) {
      if (node.raw !== undefined) return node.raw;
      if (typeof node.value === "string") return JSON.stringify(node.value);
      if (node.value === null) return "null";
      return String(node.value);
    }
    
    _genAssignmentExpression(node) {
      return `${this._gen(node.left)} ${node.operator} ${this._gen(node.right)}`;
    }
    
    _genBinaryExpression(node) {
      return `${this._maybeWrap(node.left, node)} ${node.operator} ${this._maybeWrap(node.right, node)}`;
    }
    
    _genLogicalExpression(node) {
      return this._genBinaryExpression(node);
    }
    
    _genUnaryExpression(node) {
      return node.prefix ?
        `${node.operator}${this._gen(node.argument)}` :
        `${this._gen(node.argument)}${node.operator}`;
    }
    
    _genUpdateExpression(node) {
      return node.prefix ?
        `${node.operator}${this._gen(node.argument)}` :
        `${this._gen(node.argument)}${node.operator}`;
    }
    
    _genConditionalExpression(node) {
      return `${this._gen(node.test)} ? ${this._gen(node.consequent)} : ${this._gen(node.alternate)}`;
    }
    
    /* =====================================================
       CALL / MEMBER
    ===================================================== */
    
    _genCallExpression(node) {
      const callee = this._gen(node.callee);
      const args = node.arguments.map(a => this._gen(a)).join(", ");
      return `${callee}(${args})`;
    }
    
    _genMemberExpression(node) {
      const obj = this._gen(node.object);
      
      if (node.computed)
        return `${obj}[${this._gen(node.property)}]`;
      
      let prop = node.property.name || this._gen(node.property);
      prop = this._propertyMapping(prop);
      
      return `${obj}.${prop}`;
    }
    
    /* =====================================================
       LITERALS
    ===================================================== */
    
    _genArrayExpression(node) {
      return `[${node.elements.map(e => this._gen(e)).join(", ")}]`;
    }
    
    _genObjectExpression(node) {
      const props = node.properties.map(p => {
        const key =
          p.key.type === "Identifier" ?
          p.key.name :
          this._gen(p.key);
        return `${key}: ${this._gen(p.value)}`;
      });
      
      return `{ ${props.join(", ")} }`;
    }
    
    _genTemplateLiteral(node) {
      let str = "`";
      
      node.quasis.forEach((q, i) => {
        str += q.value.raw;
        if (node.expressions[i])
          str += "${" + this._gen(node.expressions[i]) + "}";
      });
      
      str += "`";
      return str;
    }
    
    /* =====================================================
       UTIL
    ===================================================== */
    
    _maybeWrap(child, parent) {
      if (
        (child.type === "BinaryExpression" ||
          child.type === "LogicalExpression") &&
        (parent.type === "BinaryExpression" ||
          parent.type === "LogicalExpression")
      ) {
        return `(${this._gen(child)})`;
      }
      
      return this._gen(child);
    }
  }

  /* ===========================
     Helper: compile & run
  =========================== */
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

  // expose
  VJS.VJSLexer = VJSLexer;
  VJS.VJSParser = VJSParser;
  VJS.VJSCodeGenerator = VJSCodeGenerator;
  VJS.compile = compileVJS;
  VJS.run = runVJS;

})(typeof window !== "undefined" ? window : global);
