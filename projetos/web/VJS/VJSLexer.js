/* VJSLexer — versão completa + regras VJS */
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

  // ==== Regras lexicais específicas VJS ====

  // apenas ASCII; permite controle de erro claro
  isValidASCII(char) { return /[\x00-\x7F]/.test(char); }

  // LETRAS: apenas A-Z a-z (sem '_' ou '$' como primeira letra)
  isLetter(char) { return /[A-Za-z]/.test(char); }
  isNumber(char) { return /[0-9]/.test(char); }
  isIdentifierChar(char) { return /[A-Za-z0-9_]/.test(char); }
  isWhitespace(char) { return /\s/.test(char); }

  // utilitária para achar o caractere não whitespace antes de um offset
  _prevNonWhitespaceChar(startOffset) {
    let idx = startOffset - 1;
    while (idx >= 0 && /\s/.test(this.input[idx])) idx--;
    return idx >= 0 ? this.input[idx] : null;
  }

  // ==== IDENTIFIERS / KEYWORDS / TYPES ====
  lexIdentifier() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.position;
    let value = "";

    while (this.currentChar() && this.isIdentifierChar(this.currentChar())) {
      value += this.currentChar();
      this.advance();
    }

    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(value)) {
      this.throwError(`Identificador inválido '${value}'`, { line: startLine, column: startCol, offset: startOffset });
    }

    const keywords = [
      "variavel","constante","funcao","classe","retorne",
      "se","senao","para","enquanto","faca","pare","continue",
      "tente","capture","finalmente",
      "novo","super","estende","implementa","de","como",
      "this","instanciaDe","get","set","construtor",
      "publico","privado","protegido","estatico","abstrato"
    ];

    const builtins = ["console","Math","Array","String","Object","JSON","Date","RegExp","Map","Set","Promise","Symbol","Reflect","Intl"];

    const primitiveTypes = ["Texto","Numero","Booleano","Nulo"]; // tipos primitivos

    const prevChar = this._prevNonWhitespaceChar(startOffset);
    if (prevChar === ".") {
      this.addToken("IDENTIFIER", value, startLine, startCol, startOffset);
      return;
    }

    if (keywords.includes(value)) {
      this.addToken("KEYWORD", value, startLine, startCol, startOffset);
    } else if (builtins.includes(value)) {
      this.addToken("BUILTIN", value, startLine, startCol, startOffset);
    } else if (primitiveTypes.includes(value)) {
      this.addToken("TYPE", value, startLine, startCol, startOffset); // 🔹 aqui é importante
    } else {
      this.addToken("IDENTIFIER", value, startLine, startCol, startOffset);
    }
  }

  // ==== NÚMEROS (inteiro / float / hex / bin / oct) ====
  // Colocar dentro da classe VJSLexer
// --------------------------------------------------------
/**
 * Lê um literal numérico a partir da posição atual (this.pos).
 * Produz e retorna um objeto token:
 * { type: 'NumericLiteral', raw, value, isBig, base, kind }
 */
  lexNumber() {
    const start = this.pos;
    const src = this.source;
    const len = src.length;
  
    const isDigit = ch => ch >= '0' && ch <= '9';
    const isHexDigit = ch => (ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
    const isBinDigit = ch => ch === '0' || ch === '1';
    const isOctDigit = ch => ch >= '0' && ch <= '7';
  
    const peek = (offset = 0) => src[this.pos + offset] || '';
    const curr = () => src[this.pos] || '';
    const advance = (n = 1) => { this.pos += n; return src[this.pos - 1]; };
    
    // helpers para validar underscores
    const validateAndStripUnderscores = (s, validDigitsFn, allowTrailing=false) => {
      // s é a parte de dígitos possivelmente com underscores
      // regras: não começa/termina com '_' ; não tem '__' ; cada substring entre '_' deve conter pelo menos 1 digito válido
      if (s.length === 0) return { ok: false, cleaned: s, msg: "empty numeric part" };
      if (s[0] === '_' || s[s.length - 1] === '_') return { ok: false, cleaned: s, msg: "numeric separator no início/fim" };
      if (s.includes('__')) return { ok: false, cleaned: s, msg: "numeric separator duplicado '__'" };
      const parts = s.split('_');
      for (const p of parts) {
        if (p.length === 0) return { ok: false, cleaned: s, msg: "underscore inválido" };
        for (const ch of p) if (!validDigitsFn(ch)) return { ok: false, cleaned: s, msg: `caractere inválido '${ch}'` };
      }
      return { ok: true, cleaned: parts.join('') };
    };
    
    // 1) Detectar 0x / 0b / 0o prefixo (base fixa)
    let base = 10;
    let isBig = false;
    let kind = 'integer'; // 'integer' ou 'float'
    let raw = '';
  
    // Caso especial: começa com '.' seguido de dígito -> float
    if (curr() === '.' && isDigit(peek(1))) {
      // frac: .123 or .123e+2
      raw += advance(); // consume '.'
      let fracDigits = '';
      while (isDigit(peek())) { fracDigits += advance(); }
      // underscores not allowed immediately after '.' in many specs - we'll allow with validation:
      // but here we already read digits only so ok
      raw += fracDigits;
      kind = 'float';
      // exponent?
      if (peek() === 'e' || peek() === 'E') {
        raw += advance();
        if (peek() === '+' || peek() === '-') raw += advance();
        let expDigits = '';
        while (isDigit(peek())) expDigits += advance();
        if (expDigits.length === 0) this.error("Exponent vazio no literal numérico");
        raw += expDigits;
      }
      const cleaned = raw.replace(/_/g,''); // should be no underscores here normally
      const value = Number(cleaned);
      return { type: 'NumericLiteral', raw, value, isBig: false, base: 10, kind: 'float' };
    }
  
    // começa com dígito
    // Se começa com 0 e prefixo de base
    if (curr() === '0' && (peek(1) === 'x' || peek(1) === 'X' || peek(1) === 'b' || peek(1) === 'B' || peek(1) === 'o' || peek(1) === 'O')) {
      const prefix = peek(1);
      raw += advance(); // '0'
      raw += advance(); // prefix letter
      if (prefix === 'x' || prefix === 'X') base = 16;
      else if (prefix === 'b' || prefix === 'B') base = 2;
      else if (prefix === 'o' || prefix === 'O') base = 8;
  
      // ler dígitos da base permitindo underscores (serão validados)
      let digits = '';
      const digitFn = base === 16 ? isHexDigit : base === 2 ? isBinDigit : isOctDigit;
      while (true) {
        const p = peek();
        if (p === '_' || digitFn(p)) { digits += advance(); continue; }
        break;
      }
      if (digits.length === 0) this.error(`Literal ${raw} sem dígitos na base ${base}`);
      // se houver sufixo 'n' -> BigInt
      if (peek() === 'n') { raw += digits + advance(); isBig = true; }
      else raw += digits;
  
      // validar underscores e limpar
      const vs = validateAndStripUnderscores(digits, digitFn);
      if (!vs.ok) this.error(`Separador inválido em literal numérico ${raw}: ${vs.msg}`);
      const cleanedDigits = vs.cleaned;
  
      // converter para Number/BigInt de acordo com sufixo e tamanho
      let value;
      if (isBig) {
        try { value = BigInt((prefix === 'x' || prefix === 'X') ? '0x' + cleanedDigits : (prefix === 'b' || prefix === 'B') ? '0b' + cleanedDigits : '0o' + cleanedDigits); }
        catch (e) { this.error(`Falha ao converter BigInt ${raw}: ${e.message}`); }
      } else {
        value = Number.parseInt(cleanedDigits, base);
        // caso o número seja grande e perteça a Number, fica Number (precision loss may occur)
      }
      return { type: 'NumericLiteral', raw, value, isBig, base, kind: 'integer' };
    }
  
    // versão decimal (pode ter decimal point e exponent)
    // Parte inteira (com underscores permitidos)
    let intPart = '';
    while (true) {
      const p = peek();
      if (p === '_' || isDigit(p)) { intPart += advance(); continue; }
      break;
    }
    if (intPart.length === 0) this.error("Esperado dígito numa posição onde readNumericLiteral foi invocado");
  
    raw += intPart;
    
    // detectar ponto decimal
    if (peek() === '.' && peek(1) !== '.') { // evita '..' operador
      kind = 'float';
      raw += advance(); // consume '.'
      let frac = '';
      while (true) {
        const p = peek();
        if (p === '_' || isDigit(p)) { frac += advance(); continue; }
        break;
      }
      if (frac.length === 0) {
        // caso "123." → é permitido como float (frac vazio), tratamos como '123.'
      }
      raw += frac;
    }
  
    // expoente (e/E)
    if (peek() === 'e' || peek() === 'E') {
      kind = 'float';
      raw += advance();
      if (peek() === '+' || peek() === '-') raw += advance();
      let expDigits = '';
      while (isDigit(peek()) || peek() === '_') { expDigits += advance(); }
      if (expDigits.length === 0) this.error("Exponent vazio no literal numérico");
      // validar underscores em expoente (mesma função, com base decimal)
      const vs2 = validateAndStripUnderscores(expDigits, ch => ch >= '0' && ch <= '9');
      if (!vs2.ok) this.error(`Separador inválido no expoente: ${vs2.msg}`);
      raw += expDigits;
    }
  
    // BigInt sufix 'n' só é válido se não for float
    if (peek() === 'n') {
      if (kind === 'float') this.error("BigInt sufix 'n' não permitido em floats");
      isBig = true;
      raw += advance();
    }
  
    // Agora validar underscores nas partes inteira/frac e compor cleaned string
    // separar int/frac/exponent raw para validação mais simples:
    // Ex: raw = "1_234.56_7e+1_0"
    // vamos extrair partes usando regex simples
    const match = raw.match(/^([0-9A-Fa-f_xobXO]+?)(?:\.([0-9A-Fa-f_]+))?(?:[eE]([+\-]?[0-9_]+))?n?$/);
    // match pode falhar em casos com prefixos que já foram tratados, mas para decimal deve funcionar
    // Limpeza manual:
    let cleaned;
    if (base === 10) {
      // remover underscores globalmente e transformar em Number
      cleaned = raw.replace(/_/g, '');
      // remover trailing 'n' se existir
      const cleanedNoSuffix = cleaned.replace(/n$/, '');
      const value = isBig ? (() => { try { return BigInt(cleanedNoSuffix); } catch(e) { this.error("Falha ao parsear BigInt decimal: "+e.message); } })() : Number(cleanedNoSuffix);
      return { type: 'NumericLiteral', raw, value, isBig, base: 10, kind };
    } else {
      // já tratamos bases acima (0x/0b/0o), então não devemos chegar aqui
      cleaned = raw.replace(/_/g,'').replace(/n$/,'');
      const value = isBig ? BigInt(cleaned) : Number.parseInt(cleaned, base);
      return { type: 'NumericLiteral', raw, value, isBig, base, kind };
    }
    
    this.position = this.pos;
  }
  // --------------------------------------------------------

  // ==== STRINGS / TEMPLATES ====
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

  // ==== COMENTÁRIOS ====
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

  // ==== TOKENIZE (mantém operadores compostos) ====
  tokenize() {
    while(this.position < this.input.length) {
      let ch = this.currentChar();
      if (!ch) break;

      // whitespace
      if (this.isWhitespace(ch)) { this.advance(); continue; }

      // bloquear caracteres não ASCII (identificadores serão validados mais adiante)
      if (!this.isValidASCII(ch)) {
        this.throwError(`Caractere inválido '${ch}'`);
      }

      // comments
      if (this.lexComment()) continue;

      // identifiers / keywords / types
      if (this.isLetter(ch)) { this.lexIdentifier(); continue; }

      // numbers
      if (this.isNumber(ch) ||
        (ch === "." && this.peekChar() && this.isNumber(this.peekChar()))) {
        this.lexNumber();
        continue;
      }

      // strings / templates
      if (ch==='"'||ch==="'"||ch==="`") { this.lexString(); continue; }

      const startLine = this.line;
      const startCol = this.column;
      const startOffset = this.position;

      // três chars (===, !==, ... , >>>)
      const threeCharTokens = { "===":"STRICT_EQUAL", "!==":"STRICT_NOT_EQUAL", "...":"ELLIPSIS", ">>>":"ZERO_FILL_RIGHT_SHIFT" };
      // dois chars (== != <= >= && || ++ -- += -= *= /= %= => ?.) etc.
      const twoCharTokens = {
        "==":"EQUAL",
        "!=":"NOT_EQUAL",
        "<=":"LESS_EQUAL",
        ">=":"GREATER_EQUAL",
        "&&":"AND",
        "||":"OR",
        "++":"INCREMENT",
        "--":"DECREMENT",
        "+=":"PLUS_EQUAL",
        "-=":"MINUS_EQUAL",
        "*=":"MUL_EQUAL",
        "/=":"DIV_EQUAL",
        "%=":"MOD_EQUAL",
        "=>":"ARROW",
        "?.":"OPTIONAL_CHAIN",
        "**":"EXPONENT",
        "<<":"LEFT_SHIFT",
        ">>":"RIGHT_SHIFT",
        "??":"NULLISH_COALESCING"
      };
      // single-char tokens
      const singleCharTokens = {
        "=":"EQUALS",
        "+":"PLUS",
        "-":"MINUS",
        "*":"STAR",
        "/":"SLASH",
        "%":"PERCENT",
        "(":"LPAREN",
        ")":"RPAREN",
        "{":"LBRACE",
        "}":"RBRACE",
        "[":"LBRACKET",
        "]":"RBRACKET",
        ";":"SEMICOLON",
        ":":"COLON",
        ".":"DOT",
        ",":"COMMA",
        ">":"GT",
        "<":"LT",
        "!":"BANG",
        "&":"AMP",
        "|":"PIPE",
        "?":"QUESTION",
        "#":"HASH",
        "@":"AT"
      };

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