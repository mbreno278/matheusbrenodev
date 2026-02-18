
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

    peek(offset = 0) { return this.tokens[this.current + offset]; }
    isAtEnd() { const t = this.peek(); return !t || t.type === "EOF"; }
    advance() { if (!this.isAtEnd()) return this.tokens[this.current++]; return this.peek(); }
    check(type) { const t = this.peek(); return t && t.type === type; }
    match(...types) {
      for (const type of types) {
        if (this.check(type)) {
          return this.advance();
        }
      }
      return null;
    }
    
    expect(types, message) {
    
      // Permitir string ou array
      if (!Array.isArray(types)) {
        types = [types];
      }
    
      const token = this.match(...types);
    
      if (!token) {
        const found = this.peek()?.type || "EOF";
        throw new Error(
          (message ? message + " — " : "") +
          `Esperado ${types.join(",")} mas encontrado ${found}`
        );
      }
    
      return token;
    }
    isKeywordValue(token, ...aliases) { if (!token || token.type !== "KEYWORD") return false; return aliases.includes(token.value); }

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
      this.advance(); // keyword
      const idTok = this.expect("IDENTIFIER","Nome da variável esperado");
      const id = { type: "Identifier", name: idTok.value };
      if (this.check("COLON") || this.check("DOIS_PONTOS")) { // support colon either token
        this.advance();
        if (this.check("TYPE") || this.check("IDENTIFIER")) id.typeAnnotation = this.advance().value;
      }
      let init = null;
      if (this.match("EQUALS","EQUAL")) { init = this.parseExpression(); }
      if (this.check("SEMICOLON")) this.advance();
      return { type:"VariableDeclaration", kind: isConst?"const":"let", declarations: [{ id, init }] };
    }

    parseFunctionDeclaration() {
      const kw = this.advance();
      let name = null;
      if (this.check("IDENTIFIER")) name = { type:"Identifier", name: this.advance().value };
      this.expect("LPAREN","Esperado '(' apos funcao");
      const params = [];
      while (!this.check("RPAREN") && !this.isAtEnd()) {
        if (this.check("IDENTIFIER")) params.push({ type:"Identifier", name: this.advance().value });
        else this.advance();
        if (this.check("COMMA")) this.advance();
      }
      this.expect("RPAREN");
      this.expect("LBRACE","Esperado '{' no corpo da funcao");
      const body = this.parseBlock();
      return { type:"FunctionDeclaration", id: name, params, body };
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
            if (this.check("IDENTIFIER")) params.push({ type:"Identifier", name: this.advance().value });
            else this.advance();
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
      this.advance();
      this.expect("LPAREN","Esperado '(' apos construtor");
      const params=[];
      while (!this.check("RPAREN") && !this.isAtEnd()) {
        if (this.check("IDENTIFIER")) params.push({ type:"Identifier", name: this.advance().value });
        else this.advance();
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
      else consequent = { type:"BlockStatement", body: [this.parseStatement()] };
      let alternate = null;
      if (this.check("KEYWORD") && (this.peek().value === "senao" || this.peek().value === "else")) {
        this.advance();
        if (this.check("LBRACE")) { this.advance(); alternate = this.parseBlock(); }
        else alternate = { type:"BlockStatement", body: [this.parseStatement()] };
      }
      return { type:"IfStatement", test, consequent, alternate };
    }

    parseForStatement() {
      this.advance();
      this.expect("LPAREN","Esperado '(' apos for");
      let init = null;
      if (!this.check("SEMICOLON")) {
        if (this.check("KEYWORD") && (this.peek().value==="variavel"||this.peek().value==="var"||this.peek().value==="let")) init = this.parseVariableDeclaration(false);
        else { init = this.parseExpression(); if (this.check("SEMICOLON")) this.advance(); }
      } else this.advance();
      let test = null; if (!this.check("SEMICOLON")) test = this.parseExpression();
      this.expect("SEMICOLON","Esperado ';' no for");
      let update = null; if (!this.check("RPAREN")) update = this.parseExpression();
      this.expect("RPAREN");
      this.expect("LBRACE","Esperado '{' no corpo do for");
      const body = this.parseBlock();
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

    parseBlock() {
      const body = [];
      while (!this.check("RBRACE") && !this.isAtEnd()) {
        if (this.peek().type === "COMMENT") { this.advance(); continue; }
        body.push(this.parseStatement());
      }
      this.expect("RBRACE","Esperado '}' ao fechar bloco");
      return { type:"BlockStatement", body };
    }

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
        
          const prop = this.expect(
            ["IDENTIFIER","BUILTIN"],
            "Esperado identificador apos '.'"
          );
        
          expr = {
            type: "MemberExpression",
            object: expr,
            property: { type: "Identifier", name: prop.value },
            computed: false
          };
        
          continue;
        }
        if (this.check("OPTIONAL_CHAIN")) {
          this.advance();
          
          if (this.check("LPAREN")) {
            this.advance();
            const args = [];
            
            while (!this.check("RPAREN") && !this.isAtEnd()) {
              args.push(this.parseExpression());
              if (this.check("COMMA")) this.advance();
            }
            
            this.expect("RPAREN");
            
            expr = {
              type: "OptionalCallExpression",
              callee: expr,
              arguments: args
            };
            
          } else {
            
            const prop = this.expect(["IDENTIFIER", "BUILTIN"], "Esperado identificador após ?.");
            
            expr = {
              type: "OptionalMemberExpression",
              object: expr,
              property: { type: "Identifier", name: prop.value }
            };
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
      if (this.check("LBRACKET")) {
        this.advance();
        const elements=[];
        while (!this.check("RBRACKET") && !this.isAtEnd()) { elements.push(this.parseExpression()); if (this.check("COMMA")) this.advance(); }
        this.expect("RBRACKET","Esperado ']' no fim do array");
        return { type:"ArrayExpression", elements };
      }
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
      if (this.check("LPAREN")) { this.advance(); const expr = this.parseExpression(); this.expect("RPAREN","Esperado ')' apos expressao agrupada"); return expr; }
      if (this.check("IDENTIFIER") || this.check("BUILTIN")) { const t=this.advance(); return { type:"Identifier", name: t.value }; }
      throw new Error("Expressao invalida: " + token.type + (token.value ? " ("+token.value+")" : ""));
    }
  }

  /* ===========================
     VJSCodeGenerator (PT -> JS mappings)
  =========================== */
  class VJSCodeGenerator {
    constructor(options={}) { this.indentLevel=0; this.indentString=options.indentString||"  "; }

    generate(ast) { if (!ast) throw new Error("AST nao fornecida"); this.indentLevel=0; return this._gen(ast); }

    _gen(node) {
      if (!node) return "";
      if (Array.isArray(node)) return node.map(n=>this._gen(n)).join(this._newline());
      const fn = this[`_gen${node.type}`];
      if (!fn) { console.error("No generator for node:", node); throw new Error("No generator for node: "+node.type); }
      return fn.call(this, node);
    }

    _indent(){ return this.indentString.repeat(this.indentLevel); }
    _newline(){ return "\n"; }
    _withIndent(fn){ this.indentLevel++; const r=fn(); this.indentLevel--; return r; }

    _identifierMapping(name){
      const idMap = {
        "mostrar":"console.log","imprime":"console.log","alerta":"alert",
        "aleatorio":"Math.random","arredondar":"Math.round","piso":"Math.floor","teto":"Math.ceil",
        "adicionar":"push","removerFim":"pop","removerInicio":"shift","adicionarInicio":"unshift",
        "mapear":"map","filtrar":"filter","reduzir":"reduce",
        "maiusculo":"toUpperCase","minusculo":"toLowerCase","tamanho":"length",
        "lista":"Array","texto":"String","matematica":"Math"
      };
      return idMap[name]||name;
    }
    _propertyMapping(name){
      const propMap={"maiusculo":"toUpperCase","minusculo":"toLowerCase","tamanho":"length","adicionar":"push","removerFim":"pop","removerInicio":"shift","adicionarInicio":"unshift","mapear":"map","filtrar":"filter","reduzir":"reduce"};
      return propMap[name]||name;
    }

    _genProgram(node){ return this._gen(node.body); }

    _genBlockStatement(node){
      const lines = node.body.map(stmt=>{ const code=this._gen(stmt); return code.split("\n").map(l=> l ? this._indent()+l : l).join("\n"); });
      return "{" + this._newline() + this._withIndent(()=> lines.join(this._newline())) + this._newline() + this._indent() + "}";
    }

    _genExpressionStatement(node){ return this._gen(node.expression) + ";"; }

    _genVariableDeclaration(node){
      const kind = node.kind || "let";
      const decls = (node.declarations || []).map(d=>{ const id=this._gen(d.id); const init = d.init ? " = "+this._gen(d.init) : ""; return id+init; });
      return `${kind} ${decls.join(", ")};`;
    }

    _genIdentifier(node){
      if (!node || !node.name) return "";
      return this._identifierMapping(node.name);
    }

    _genLiteral(node){
      if (node.raw !== undefined) return node.raw;
      if (typeof node.value === "string") return JSON.stringify(node.value);
      if (node.value === null) return "null";
      return String(node.value);
    }

    _genAssignmentExpression(node){
      const op = node.operator || "=";
      return `${this._gen(node.left)} ${op} ${this._gen(node.right)}`;
    }

    _genBinaryExpression(node){
      return `${this._maybeWrap(node.left,node)} ${node.operator} ${this._maybeWrap(node.right,node)}`;
    }

    _genLogicalExpression(node){ return this._genBinaryExpression(node); }

    _genUnaryExpression(node){ return node.prefix ? `${node.operator}${this._maybeWrap(node.argument,node)}` : `${this._maybeWrap(node.argument,node)}${node.operator}`; }

    _genIfStatement(node){
      const test=this._gen(node.test);
      const cons = node.consequent.type==="BlockStatement" ? this._gen(node.consequent) : this._withIndent(()=> this._indent()+this._gen(node.consequent));
      let code = `if (${test}) ${cons}`;
      if (node.alternate){
        const alt = node.alternate.type==="IfStatement" ? " "+this._gen(node.alternate) : " else "+(node.alternate.type==="BlockStatement" ? this._gen(node.alternate) : this._withIndent(()=> this._indent()+this._gen(node.alternate)));
        code += alt;
      }
      return code;
    }

    _genWhileStatement(node){
      const test=this._gen(node.test);
      const body = node.body.type==="BlockStatement" ? this._gen(node.body) : "{\n"+this._withIndent(()=> this._indent()+this._gen(node.body))+"\n"+this._indent()+"}";
      return `while (${test}) ${body}`;
    }

    _genForStatement(node){
      const init = node.init ? (node.init.type==="VariableDeclaration" ? this._gen(node.init).replace(/;$/,"") : this._gen(node.init)) : "";
      const test = node.test ? this._gen(node.test) : "";
      const update = node.update ? this._gen(node.update) : "";
      const body = node.body.type==="BlockStatement" ? this._gen(node.body) : "{\n"+this._withIndent(()=> this._indent()+this._gen(node.body))+"\n"+this._indent()+"}";
      return `for (${init}; ${test}; ${update}) ${body}`;
    }

    _genFunctionDeclaration(node){
      const id = node.id ? this._gen(node.id) : (node.name||"");
      const params = (node.params||[]).map(p=>this._gen(p)).join(", ");
      const body = this._gen(node.body);
      return `function ${id}(${params}) ${body}`;
    }

    _genReturnStatement(node){
      const arg = node.argument !== undefined ? node.argument : node.value;
      return arg ? `return ${this._gen(arg)};` : "return;";
    }

    _genCallExpression(node){
      const calleeCode = this._gen(node.callee);
      const direct = {"mostrar":"console.log","imprime":"console.log","alerta":"alert","aleatorio":"Math.random","arredondar":"Math.round","piso":"Math.floor","teto":"Math.ceil"};
      const mapped = direct[calleeCode] || calleeCode;
      const args = (node.arguments||[]).map(a=>this._gen(a)).join(", ");
      return `${mapped}(${args})`;
    }

    _genMemberExpression(node){
      const obj = this._gen(node.object);
      if (node.computed) return `${obj}[${this._gen(node.property)}]`;
      let propName = (node.property && node.property.name) ? node.property.name : this._gen(node.property);
      propName = this._propertyMapping(propName);
      return `${obj}.${propName}`;
    }

    _genArrayExpression(node){ const elems=(node.elements||[]).map(e=> e? this._gen(e):"").join(", "); return `[${elems}]`; }
    _genObjectExpression(node){ const props=(node.properties||[]).map(p=>{ if (p.type==="Property"){ const key=p.computed?`[${this._gen(p.key)}]`: (p.key.type==="Identifier"? p.key.name: this._gen(p.key)); return p.shorthand? key: `${key}: ${this._gen(p.value)}`; } else if (p.type==="SpreadElement"){ return `...${this._gen(p.argument)}`; } return this._gen(p); }); return `{ ${props.join(", ")} }`; }

    _genConditionalExpression(node){ return `${this._gen(node.test)} ? ${this._gen(node.consequent)} : ${this._gen(node.alternate)}`; }

    _genSwitchStatement(node){ const disc=this._gen(node.discriminant); const cases=(node.cases||[]).map(c=>{ if (c.test){ const test=this._gen(c.test); const cons=(c.consequent||[]).map(s=>this._gen(s)).join(this._newline()); return `${this._indent()}case ${test}:`+this._newline()+this._withIndent(()=> cons); } else { const cons=(c.consequent||[]).map(s=>this._gen(s)).join(this._newline()); return `${this._indent()}default:`+this._newline()+this._withIndent(()=> cons); } }).join(this._newline()); return `switch (${disc}) {`+this._newline()+cases+this._newline()+`}`; }

    _maybeWrap(child,parent){ if (!child) return ""; if ((child.type==="BinaryExpression"||child.type==="LogicalExpression") && (parent.type==="BinaryExpression"||parent.type==="LogicalExpression")) return `(${this._gen(child)})`; return this._gen(child); }
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
