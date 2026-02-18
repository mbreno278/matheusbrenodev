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
      // Apenas palavras-chave em português
      "variavel","constante","funcao","retorne","se","senao","para","enquanto","faca","pare","continue",
      "classe","construtor","este","novo","escolha","caso","padrao","tente","capture","finalmente","lance",
      "importar","exportar","de","como","estende","super","instanciaDe","tipoDe","em","assincrono","aguardar",
      "verdadeiro","falso","nulo","indefinido",
      // adicionada
      "escreva"
    ];

    const types = [
      // Tipos em português
      "numero","texto","booleano","objeto","lista","qualquer"
    ];

    const builtins = ["console","Math","Array","String","Object","JSON","Date","RegExp","Map","Set","Promise","Symbol","Reflect","Intl"];

    // Tratamento especial: detectar escreva.info e escreva.erro como tokens únicos
    if (value === "escreva" && this.currentChar() === ".") {
      const dotLine = this.line;
      const dotCol = this.column;
      this.advance(); // consome '.'
      const suffixStartLine = this.line;
      const suffixStartCol = this.column;
      let suffix = "";
      while (this.currentChar() && (this.isLetter(this.currentChar()) || this.isNumber(this.currentChar()))) {
        suffix += this.currentChar();
        this.advance();
      }

      if (suffix === "info") {
        this.addToken("ESCREVA_INFO", "escreva.info", startLine, startCol);
        return;
      }
      if (suffix === "erro" || suffix === "error") {
        // aceita 'erro' (pt) e 'error' (en) como segurança
        this.addToken("ESCREVA_ERROR", "escreva.erro", startLine, startCol);
        return;
      }

      // fallback: se não for info/erro, emite KEYWORD('escreva'), DOT e IDENTIFIER(suffix) normalmente
      this.addToken("KEYWORD", "escreva", startLine, startCol);
      this.addToken("DOT", ".", dotLine, dotCol);
      if (suffix.length > 0) {
        this.addToken("IDENTIFIER", suffix, suffixStartLine, suffixStartCol);
      }
      return;
    }

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