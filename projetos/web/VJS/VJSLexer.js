export class VJSLexerError extends Error {
  constructor(message, { line = 1, column = 1, offset = 0 } = {}) {
    super(message);
    this.name = "VJSLexerError";
    this.line = line;
    this.column = column;
    this.offset = offset;
  }
}

export class VJSLexer {
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

  addToken(type, value = null, startLine = this.line, startCol = this.column, startOffset = this.position) {
    const token = {
      type,
      value,
      start: { offset: startOffset, line: startLine, column: startCol },
      end:   { offset: this.position, line: this.line, column: this.column }
    };
    this.tokens.push(token);
    return token;
  }

  throwError(message, { line = this.line, column = this.column, offset = this.position } = {}) {
    throw new VJSLexerError(message, { line, column, offset });
  }

  isLetter(char) { return /[a-zA-Z_$]/.test(char); }
  isNumber(char) { return /[0-9]/.test(char); }
  isWhitespace(char) { return /\s/.test(char); }

  // --- utilitária para achar o caractere não whitespace antes de um offset
  _prevNonWhitespaceChar(startOffset) {
    let idx = startOffset - 1;
    while (idx >= 0 && /\s/.test(this.input[idx])) idx--;
    return idx >= 0 ? this.input[idx] : null;
  }

  lexIdentifier() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.position;
    let value = "";

    while (this.currentChar() && (this.isLetter(this.currentChar()) || this.isNumber(this.currentChar()))) {
      value += this.currentChar();
      this.advance();
    }

    // --- keywords em português (ampliada com as traduções do JS)
    const keywords = [
      // controle / declarações
      "se", "senao", "para", "enquanto", "faca", "pare", "continue",
      "tente", "capture", "capturar", "finalmente",
      "funcao", "classe", "construtor", "retorne",
      "importar", "exportar", "de", "como",

      // variáveis / escopo
      "variavel", "var", "constante", "let",

      // classes / herança / instancia
      "novo", "super", "estende", "estender", "instanciaDe", "instancia",

      // switch / case
      "escolha", "caso", "padrao", "padrão",

      // operadores / typeof / in / instanceof / void
      "em",            // equiv. de 'in'
      "tipoDe",        // equiv. de 'typeof'
      "vazio",         // equiv. de 'void'

      // throw / debugger / with / yield / async-await
      "lance", "lancar", "lançar", // throw variantes
      "depurador",     // debugger
      "com",           // with
      "produzir", "yield", // generators
      "assincrono", "assincrónica", "aguardar", "await", // async/await

      // literais
      "verdadeiro", "falso", "nulo", "indefinido",

      // operador delete
      "deletar", "delete",

      // outros (adicionais que já estavam no lexer original)
      "este", "como", "de", "exportar", "importar"
    ];

    // tipos primitivos / annotations de tipo da sua linguagem VJS
    const types = ["numero","texto","booleano","objeto","lista","qualquer"];

    // builtins conhecidos
    const builtins = ["console","Math","Array","String","Object","JSON","Date","RegExp","Map","Set","Promise","Symbol","Reflect","Intl"];

    // Se identificador aparece imediatamente após um '.', tratá-lo como IDENTIFIER
    // Isso permite chamadas como: teste.em(2) mesmo quando 'em' é keyword.
    const prevChar = this._prevNonWhitespaceChar(startOffset);
    if (prevChar === ".") {
      this.addToken("IDENTIFIER", value, startLine, startCol, startOffset);
      return;
    }

    // Também, se vier após '?.' (optional chaining), o prev non-whitespace geralmente será '.'
    // portanto já coberto.

    // Classificação normal
    if (keywords.includes(value)) this.addToken("KEYWORD", value, startLine, startCol, startOffset);
    else if (types.includes(value)) this.addToken("TYPE", value, startLine, startCol, startOffset);
    else if (builtins.includes(value)) this.addToken("BUILTIN", value, startLine, startCol, startOffset);
    else this.addToken("IDENTIFIER", value, startLine, startCol, startOffset);
  }

  lexNumber() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.position;
    let value = "";

    if (this.currentChar() === "0" && (this.peekChar() === "x" || this.peekChar() === "X")) {
      value += this.currentChar(); this.advance();
      value += this.currentChar(); this.advance();
      while (this.currentChar() && /[0-9a-fA-F]/.test(this.currentChar())) { value += this.currentChar(); this.advance(); }
      this.addToken("NUMBER", value, startLine, startCol, startOffset); return;
    }
    if (this.currentChar() === "0" && (this.peekChar() === "b" || this.peekChar() === "B")) {
      value += this.currentChar(); this.advance();
      value += this.currentChar(); this.advance();
      while (this.currentChar() && /[01]/.test(this.currentChar())) { value += this.currentChar(); this.advance(); }
      this.addToken("NUMBER", value, startLine, startCol, startOffset); return;
    }
    if (this.currentChar() === "0" && (this.peekChar() === "o" || this.peekChar() === "O")) {
      value += this.currentChar(); this.advance();
      value += this.currentChar(); this.advance();
      while (this.currentChar() && /[0-7]/.test(this.currentChar())) { value += this.currentChar(); this.advance(); }
      this.addToken("NUMBER", value, startLine, startCol, startOffset); return;
    }

    while (this.currentChar() && this.isNumber(this.currentChar())) { value += this.currentChar(); this.advance(); }
    if (this.currentChar() === "." && this.isNumber(this.peekChar())) {
      value += this.currentChar(); this.advance();
      while (this.currentChar() && this.isNumber(this.currentChar())) { value += this.currentChar(); this.advance(); }
    }
    if (this.currentChar() && (this.currentChar() === "e" || this.currentChar() === "E")) {
      value += this.currentChar(); this.advance();
      if (this.currentChar() === "+" || this.currentChar() === "-") { value += this.currentChar(); this.advance(); }
      while (this.currentChar() && this.isNumber(this.currentChar())) { value += this.currentChar(); this.advance(); }
    }

    this.addToken("NUMBER", value, startLine, startCol, startOffset);
  }

  lexString() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.position;
    const quote = this.currentChar();
    let value = "";
    this.advance();

    if (quote === "`") {
      while (this.currentChar()) {
        if (this.currentChar() === "`") break;
        if (this.currentChar() === "\\" && this.peekChar()) {
          value += this.currentChar(); this.advance();
          value += this.currentChar(); this.advance();
          continue;
        }
        value += this.currentChar(); this.advance();
      }
      if (!this.currentChar()) this.throwError("Template string não terminada", { line: startLine, column: startCol, offset: startOffset });
      this.advance();
      this.addToken("TEMPLATE", value, startLine, startCol, startOffset);
      return;
    }

    while (this.currentChar() && this.currentChar() !== quote) {
      if (this.currentChar() === "\\" && this.peekChar()) { value += this.currentChar(); this.advance(); value += this.currentChar(); this.advance(); continue; }
      value += this.currentChar(); this.advance();
    }

    if (!this.currentChar()) this.throwError("String não terminada", { line: startLine, column: startCol, offset: startOffset });

    this.advance();
    this.addToken("STRING", value, startLine, startCol, startOffset);
  }

  lexComment() {
    if (this.currentChar() === "/" && this.peekChar() === "/") { this.advance(); this.advance(); while(this.currentChar() && this.currentChar()!=="\n") this.advance(); return true; }
    if (this.currentChar() === "/" && this.peekChar() === "*") {
      const startLine = this.line; const startCol = this.column; const startOffset = this.position;
      this.advance(); this.advance();
      while (this.currentChar() && !(this.currentChar()==="*" && this.peekChar()==="/")) this.advance();
      if (!this.currentChar()) this.throwError("Comentário em bloco não fechado", { line: startLine, column: startCol, offset: startOffset });
      this.advance(); this.advance();
      return true;
    }
    return false;
  }

  tokenize() {
    while(this.position < this.input.length) {
      let ch = this.currentChar();
      if (!ch) break;

      if (this.isWhitespace(ch)) { this.advance(); continue; }
      if (this.lexComment()) continue;
      if (this.isLetter(ch)) { this.lexIdentifier(); continue; }
      if (this.isNumber(ch)) { this.lexNumber(); continue; }
      if (ch==='"'||ch==="'"||ch==="`") { this.lexString(); continue; }

      const startLine = this.line;
      const startCol = this.column;
      const startOffset = this.position;

      const threeCharTokens = { "===":"STRICT_EQUAL", "!==":"STRICT_NOT_EQUAL", "...":"ELLIPSIS", ">>>":"ZERO_FILL_RIGHT_SHIFT" };
      const twoCharTokens = { "==":"EQUAL", "!=":"NOT_EQUAL", "<=":"LESS_EQUAL", ">=":"GREATER_EQUAL", "&&":"AND", "||":"OR", "++":"INCREMENT", "--":"DECREMENT", "+=":"PLUS_EQUAL", "-=":"MINUS_EQUAL", "*=":"MUL_EQUAL", "/=":"DIV_EQUAL", "%=":"MOD_EQUAL", "=>":"ARROW", "?.":"OPTIONAL_CHAIN", "**":"EXPONENT", "<<":"LEFT_SHIFT", ">>":"RIGHT_SHIFT","??":"NULLISH_COALESCING" };
      const singleCharTokens = { "=":"EQUALS", "+":"PLUS", "-":"MINUS", "*":"STAR", "/":"SLASH", "%":"PERCENT", "(":"LPAREN", ")":"RPAREN", "{":"LBRACE", "}":"RBRACE", "[":"LBRACKET", "]":"RBRACKET", ";":"SEMICOLON", ":":"COLON", ".":"DOT", ",":"COMMA", ">":"GT", "<":"LT", "!":"BANG", "&":"AMP", "|":"PIPE", "?":"QUESTION" };

      // 🔥 ALTERAÇÃO SEGURA AQUI
      const next1 = this.peekChar(1) || "";
      const next2 = this.peekChar(2) || "";
      const three = ch + next1 + next2;

      if (threeCharTokens[three]) {
        this.addToken(threeCharTokens[three], three, startLine, startCol, startOffset);
        this.advance(); this.advance(); this.advance();
        continue;
      }

      const two = ch + (this.peekChar(1) || "");

      if (twoCharTokens[two]) {
        this.addToken(twoCharTokens[two], two, startLine, startCol, startOffset);
        this.advance(); this.advance();
        continue;
      }

      if (singleCharTokens[ch]) {
        this.addToken(singleCharTokens[ch], ch, startLine, startCol, startOffset);
        this.advance();
        continue;
      }

      this.throwError(`Caractere inesperado '${ch}'`, { line: startLine, column: startCol, offset: startOffset });
    }

    this.addToken("EOF", null, this.line, this.column, this.position);
    return this.tokens;
  }
}