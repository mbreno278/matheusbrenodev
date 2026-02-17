class VJSLexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }
  
  currentChar() {
    return this.input[this.position];
  }
  
  peekChar(offset = 1) {
    return this.input[this.position + offset];
  }
  
  advance() {
    if (this.currentChar() === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }
  
  // agora com parâmetros de linha/coluna opcionais (úteis para marcar início do token)
  addToken(type, value = null, line = this.line, column = this.column) {
    this.tokens.push({
      type,
      value,
      line,
      column
    });
  }
  
  isLetter(char) {
    return /[a-zA-Z_$]/.test(char);
  }
  
  isNumber(char) {
    return /[0-9]/.test(char);
  }
  
  isWhitespace(char) {
    return /\s/.test(char);
  }

  // identifica identificadores/reservadas (aceita $ e _)
  lexIdentifier() {
    let startLine = this.line;
    let startCol = this.column;
    let value = "";
    
    while (this.currentChar() && (this.isLetter(this.currentChar()) || this.isNumber(this.currentChar()))) {
      value += this.currentChar();
      this.advance();
    }
    
    // palavras-chave: inglês + português (mapeadas para o mesmo token)
    const keywords = [
      // ingles
      "var","let","const","function","return",
      "if","else","for","while","do","break","continue",
      "class","constructor","this","new","switch","case","default",
      "try","catch","finally","throw","import","export","from","as",
      "extends","super","instanceof","typeof","in","of",
      "async","await","yield","true","false","null","undefined","NaN","Infinity",
      // portugues
      "variavel","constante","funcao","retorne",
      "se","senao","para","enquanto","faca","pare","continue",
      "classe","construtor","este","novo","escolha","caso","padrao",
      "tente","capture","finalmente","lance","importar","exportar","de","como",
      "estende","super","instanciaDe","tipoDe","em","de","assincrono","aguardar",
      "verdadeiro","falso","nulo","indefinido"
    ];
    
    // tipos (ingles + pt)
    const types = [
      "number","string","boolean","object","array","any",
      "numero","texto","booleano","objeto","lista","qualquer"
    ];
    
    // builtins (opcionais: tratados como IDENTIFIER, mas marcados se desejar)
    const builtins = [
      "console","Math","Array","String","Object","JSON","Date","RegExp",
      "Map","Set","Promise","Symbol","Reflect","Intl"
    ];
    
    if (keywords.includes(value)) {
      this.addToken("KEYWORD", value, startLine, startCol);
    } else if (types.includes(value)) {
      this.addToken("TYPE", value, startLine, startCol);
    } else if (builtins.includes(value)) {
      this.addToken("BUILTIN", value, startLine, startCol);
    } else {
      this.addToken("IDENTIFIER", value, startLine, startCol);
    }
  }
  
  // números: suporte a inteiros, ponto decimal, exponencial, hex/bin/octal simples
  lexNumber() {
    let startLine = this.line;
    let startCol = this.column;
    let value = "";
    
    // suporte a 0x, 0b, 0o
    if (this.currentChar() === "0" && (this.peekChar() === "x" || this.peekChar() === "X")) {
      // hex
      value += this.currentChar(); this.advance();
      value += this.currentChar(); this.advance();
      while (this.currentChar() && /[0-9a-fA-F]/.test(this.currentChar())) {
        value += this.currentChar(); this.advance();
      }
      this.addToken("NUMBER", value, startLine, startCol);
      return;
    }
    if (this.currentChar() === "0" && (this.peekChar() === "b" || this.peekChar() === "B")) {
      // bin
      value += this.currentChar(); this.advance();
      value += this.currentChar(); this.advance();
      while (this.currentChar() && /[01]/.test(this.currentChar())) {
        value += this.currentChar(); this.advance();
      }
      this.addToken("NUMBER", value, startLine, startCol);
      return;
    }
    if (this.currentChar() === "0" && (this.peekChar() === "o" || this.peekChar() === "O")) {
      // oct
      value += this.currentChar(); this.advance();
      value += this.currentChar(); this.advance();
      while (this.currentChar() && /[0-7]/.test(this.currentChar())) {
        value += this.currentChar(); this.advance();
      }
      this.addToken("NUMBER", value, startLine, startCol);
      return;
    }

    // decimal / float / expo
    while (this.currentChar() && this.isNumber(this.currentChar())) {
      value += this.currentChar();
      this.advance();
    }
    if (this.currentChar() === "." && this.isNumber(this.peekChar())) {
      value += this.currentChar(); // .
      this.advance();
      while (this.currentChar() && this.isNumber(this.currentChar())) {
        value += this.currentChar();
        this.advance();
      }
    }
    // expo e/E
    if (this.currentChar() && (this.currentChar() === "e" || this.currentChar() === "E")) {
      value += this.currentChar();
      this.advance();
      if (this.currentChar() === "+" || this.currentChar() === "-") {
        value += this.currentChar();
        this.advance();
      }
      while (this.currentChar() && this.isNumber(this.currentChar())) {
        value += this.currentChar();
        this.advance();
      }
    }
    
    this.addToken("NUMBER", value, startLine, startCol);
  }
  
  // strings simples e template literals (backticks)
  lexString() {
    let startLine = this.line;
    let startCol = this.column;
    let quote = this.currentChar(); // ' " or `
    let value = "";
    this.advance(); // consome a aspa inicial
    
    // template literal com backticks: ler até o próximo backtick (não expandimos ${} aqui)
    if (quote === "`") {
      while (this.currentChar()) {
        if (this.currentChar() === "`") break;
        // suportar escapes
        if (this.currentChar() === "\\" && this.peekChar()) {
          value += this.currentChar();
          this.advance();
          value += this.currentChar();
          this.advance();
          continue;
        }
        // se encontrar ${, podemos opcionalmente parar e emitir token TEMPLATE_START,
        // mas para simplicidade tratamos todo conteúdo como TEMPLATE_RAW
        value += this.currentChar();
        this.advance();
      }
      if (this.currentChar() === "`") this.advance(); // fecha
      this.addToken("TEMPLATE", value, startLine, startCol);
      return;
    }
    
    // aspas simples/duplas
    while (this.currentChar() && this.currentChar() !== quote) {
      // suporte a escape de aspas e outros escapes
      if (this.currentChar() === "\\" && this.peekChar()) {
        value += this.currentChar(); // \
        this.advance();
        value += this.currentChar(); // caractere escapado
        this.advance();
        continue;
      }
      value += this.currentChar();
      this.advance();
    }
    // consumir a aspa de fechamento
    if (this.currentChar() === quote) {
      this.advance();
    } else {
      // fim inesperado de arquivo — manter valor parcial
    }
    this.addToken("STRING", value, startLine, startCol);
  }
  
  // comentários: // ... e /* ... */
  lexComment() {
    // comentário de linha //
    if (this.currentChar() === "/" && this.peekChar() === "/") {
      this.advance(); // /
      this.advance(); // /
      while (this.currentChar() && this.currentChar() !== "\n") {
        this.advance();
      }
      return true; // comentário consumido
    }
    
    // comentário de bloco /* ... */
    if (this.currentChar() === "/" && this.peekChar() === "*") {
      this.advance(); // /
      this.advance(); // *
      while (this.currentChar() && !(this.currentChar() === "*" && this.peekChar() === "/")) {
        this.advance();
      }
      if (this.currentChar() === "*" && this.peekChar() === "/") {
        this.advance(); // *
        this.advance(); // /
      }
      return true; // comentário consumido
    }
    
    return false; // não era comentário
  }
  
  tokenize() {
    while (this.position < this.input.length) {
      let char = this.currentChar();
      
      if (!char) break;
      
      if (this.isWhitespace(char)) {
        // contar novas linhas e avançar
        this.advance();
        continue;
      }
      
      if (this.lexComment()) {
        continue; // ignora comentário
      }
      
      // identificador / palavra-chave / tipo / builtin
      if (this.isLetter(char)) {
        this.lexIdentifier();
        continue;
      }
      
      // número
      if (this.isNumber(char)) {
        this.lexNumber();
        continue;
      }
      
      // string / template
      if (char === '"' || char === "'" || char === "`") {
        this.lexString();
        continue;
      }
      
      // operadores e tokens multi-caractere: verificar 3, depois 2, depois 1
      const threeCharTokens = {
        "===": "STRICT_EQUAL",
        "!==": "STRICT_NOT_EQUAL",
        "...": "ELLIPSIS",
        ">>>": "ZERO_FILL_RIGHT_SHIFT"
      };
      const twoCharTokens = {
        "==": "EQUAL",
        "!=": "NOT_EQUAL",
        "<=": "LESS_EQUAL",
        ">=": "GREATER_EQUAL",
        "&&": "AND",
        "||": "OR",
        "++": "INCREMENT",
        "--": "DECREMENT",
        "+=": "PLUS_EQUAL",
        "-=": "MINUS_EQUAL",
        "*=": "MUL_EQUAL",
        "/=": "DIV_EQUAL",
        "%=": "MOD_EQUAL",
        "=>": "ARROW",
        "?.": "OPTIONAL_CHAIN",
        "**": "EXPONENT",
        "<<": "LEFT_SHIFT",
        ">>": "RIGHT_SHIFT",
        "??": "NULLISH_COALESCING"
      };
      const singleCharTokens = {
        "=": "EQUALS",
        "+": "PLUS",
        "-": "MINUS",
        "*": "STAR",
        "/": "SLASH",
        "%": "PERCENT",
        "(": "LPAREN",
        ")": "RPAREN",
        "{": "LBRACE",
        "}": "RBRACE",
        "[": "LBRACKET",
        "]": "RBRACKET",
        ";": "SEMICOLON",
        ":": "COLON",
        ".": "DOT",
        ",": "COMMA",
        ">": "GT",
        "<": "LT",
        "!": "BANG",
        "&": "AMP",
        "|": "PIPE",
        "?": "QUESTION"
      };
      
      // checar 3-char
      const three = char + (this.peekChar() || "") + (this.peekChar(2) || "");
      if (threeCharTokens[three]) {
        this.addToken(threeCharTokens[three], three);
        this.advance(); this.advance(); this.advance();
        continue;
      }
      
      // checar 2-char
      const two = char + (this.peekChar() || "");
      if (twoCharTokens[two]) {
        this.addToken(twoCharTokens[two], two);
        this.advance(); this.advance();
        continue;
      }
      
      // checar 1-char
      if (singleCharTokens[char]) {
        this.addToken(singleCharTokens[char], char);
        this.advance();
        continue;
      }
      
      // se chegou aqui, caractere desconhecido
      throw new Error(
        `Caractere inesperado '${char}' na linha ${this.line}, coluna ${this.column}`
      );
    }
    
    // token EOF opcional
    this.addToken("EOF", null, this.line, this.column);
    return this.tokens;
  }
}

window.VJS = window.VJS || {};
window.VJS.VJSLexer = VJSLexer;