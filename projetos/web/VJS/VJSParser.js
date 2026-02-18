// VJSParser.js (atualizado para suportar escreva.info / escreva.erro)
// Baseado no arquivo fornecido pelo usuário. (Adicionada função parseEscrevaStatement)
// Referência: VJSParser.js original. 1

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

    // Permitir string ou array
    if (!Array.isArray(types)) {
      types = [types];
    }
  
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
    
    // Suporte especial para tokens do 'escreva' gerados pelo lexer
    if (token.type === "ESCREVA_INFO" || token.type === "ESCREVA_ERROR") {
      return this.parseEscrevaStatement();
    }
  
    // DETECTAR TYPE logo no início e lançar erro claro (ajuda a identificar onde escapou)
    if (token.type === "TYPE") {
      const prev = this.tokens[this.current - 1];
      const next = this.peek(1);
      throw new Error(
        `Tipo fora de contexto: '${token.value}'. ` +
        `Provavelmente esqueceu ':' antes do tipo ou não consumiu a anotação de tipo em declaração/parametro. ` +
        `Contexto: prev=${prev ? prev.type+ (prev.value?("("+prev.value+")"):"") : "null"}, next=${next ? next.type+ (next.value?("("+next.value+")"):"") : "null"}`
      );
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
      if (this.isKeywordValue(token, "verdadeiro", "true", "falso", "false", "nulo", "null", "isso", "this")) return this.parseExpressionStatement();
    }
  
    if (["IDENTIFIER", "NUMBER", "STRING", "TEMPLATE", "LPAREN", "LBRACKET", "LBRACE"].includes(token.type)) return this.parseExpressionStatement();
    if (["PLUS", "MINUS", "STAR", "SLASH", "BANG", "INCREMENT", "DECREMENT"].includes(token.type)) return this.parseExpressionStatement();
    
    throw new Error("Instrução desconhecida: " + token.type);
  }

  // novo: parse para chamadas escreva.info(...) e escreva.erro(...)
  parseEscrevaStatement() {
    const tok = this.advance(); // consome ESCREVA_INFO ou ESCREVA_ERROR
    const method = tok.type === "ESCREVA_INFO" ? "info" : "error";

    // opcionalmente aceitar LPAREN imediatamente
    if (this.check("LPAREN")) {
      this.advance();
      const args = [];
      while (!this.check("RPAREN") && !this.isAtEnd()) {
        args.push(this.parseExpression());
        if (this.check("COMMA")) this.advance();
      }
      this.expect("RPAREN","Esperado ')' apos argumentos de escreva");
      if (this.check("SEMICOLON")) this.advance();
      // construir CallExpression para console.method(...)
      const callExpr = {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: { type: "Identifier", name: "console" },
          property: { type: "Identifier", name: method },
          computed: false
        },
        arguments: args
      };
      return { type: "ExpressionStatement", expression: callExpr };
    } else {
      // Se não houver parênteses, interpretar como erro ou expressão vazia.
      throw new Error(`Esperado '(' apos ${tok.type}`);
    }
  }

  parseVariableDeclaration(isConst = false) {
    // consome keyword variavel / var / let / constante / const
    const kw = this.advance();

    const idTok = this.expect("IDENTIFIER","Nome da variável esperado");
    const id = { type: "Identifier", name: idTok.value };

    // permitir anotações de tipo: ':' TYPE
    if (this.check("COLON") || this.check("DOIS_PONTOS")) {
      this.advance(); // consome ':'
      if (this.check("TYPE") || this.check("IDENTIFIER")) {
        const t = this.advance();
        // guardar tipo de forma consistente
        id.typeAnnotation = { type: "TypeAnnotation", name: t.value };
      } else {
        throw new Error("Tipo esperado após ':' na declaração de variável");
      }
    }

    // inicialização opcional
    let init = null;
    if (this.match("EQUALS","EQUAL")) { init = this.parseExpression(); }

    // terminar com ; opcionalmente
    if (this.check("SEMICOLON")) this.advance();

    return { type: "VariableDeclaration", kind: isConst ? "const" : "let", declarations: [{ id, init }] };
  }

  // ---------- FUNÇÃO (corrigida para consumir anotações de tipo em parâmetros) ----------
  parseFunctionDeclaration() {
    const kw = this.advance(); // 'funcao' / 'function' / 'async' ...
    let name = null;
    if (this.check("IDENTIFIER")) name = { type: "Identifier", name: this.advance().value };

    this.expect("LPAREN","Esperado '(' apos declaracao de funcao");

    const params = [];
    while (!this.check("RPAREN") && !this.isAtEnd()) {
      // Esperamos um IDENTIFIER como nome do parâmetro.
      if (this.check("IDENTIFIER")) {
        const pTok = this.advance();
        const param = { type: "Identifier", name: pTok.value };
        // consumir anotation opcional ': TYPE'
        const ann = this.parseOptionalTypeAnnotation();
        if (ann) param.typeAnnotation = ann;
        params.push(param);
      } else {
        // se houver tokens inesperados, tente consumir de forma segura até vírgula/fecho
        // mas priorize detectar um ':' seguido de TYPE (caso alguém use ': tipo' sem identificador)
        if (this.check("COLON") || this.check("DOIS_PONTOS")) {
          // caso encontremos ':' sem identificador antes, isso é erro de sintaxe
          throw new Error("Esperado nome do parâmetro antes de ':'");
        }
        // caso contrário, apenas avance para evitar loop infinito
        this.advance();
      }
      if (this.check("COMMA")) this.advance();
    }

    this.expect("RPAREN");

    // suporte simples para anotação de tipo de retorno (opcional): ':' TYPE
    let returnType = null;
    if (this.check("COLON") || this.check("DOIS_PONTOS")) {
      const ann = this.parseOptionalTypeAnnotation();
      if (ann) returnType = ann;
    }

    this.expect("LBRACE","Esperado '{' no corpo da funcao");
    const body = this.parseBlock();

    const node = { type:"FunctionDeclaration", id: name, params, body };
    if (returnType) node.returnType = returnType;
    return node;
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

      // construtor
      if (t.type === "KEYWORD" && (t.value === "construtor" || t.value === "constructor")) {
        body.push(this.parseConstructor());
        continue;
      }

      // métodos nomeados
      if (t.type === "IDENTIFIER") {
        const methodName = this.advance().value;
        this.expect("LPAREN","Esperado '(' apos nome do metodo");
        const params = [];

        while (!this.check("RPAREN") && !this.isAtEnd()) {
          if (this.check("IDENTIFIER")) {
            const pTok = this.advance();
            const param = { type: "Identifier", name: pTok.value };
            const ann = this.parseOptionalTypeAnnotation();
            if (ann) param.typeAnnotation = ann;
            params.push(param);
          } else {
            if (this.check("COLON") || this.check("DOIS_PONTOS")) {
              throw new Error("Esperado identificador do parâmetro antes de ':' no método");
            }
            this.advance();
          }
          if (this.check("COMMA")) this.advance();
        }

        this.expect("RPAREN");
        this.expect("LBRACE","Esperado '{' no corpo do metodo");
        const methodBody = this.parseBlock();
        body.push({ type:"MethodDefinition", key:{type:"Identifier", name:methodName}, params, body: methodBody });
        continue;
      }

      // pular tokens possíveis (robustez)
      this.advance();
    }

    this.expect("RBRACE");
    return { type:"ClassDeclaration", id, superClass, body };
  }

  parseConstructor() {
    this.advance(); // 'construtor' / 'constructor'
    this.expect("LPAREN","Esperado '(' apos construtor");
    const params = [];

    while (!this.check("RPAREN") && !this.isAtEnd()) {
      if (this.check("IDENTIFIER")) {
        const pTok = this.advance();
        const param = { type: "Identifier", name: pTok.value };
        const ann = this.parseOptionalTypeAnnotation();
        if (ann) param.typeAnnotation = ann;
        params.push(param);
      } else {
        if (this.check("COLON") || this.check("DOIS_PONTOS")) {
          throw new Error("Esperado identificador do parâmetro antes de ':' no construtor");
        }
        this.advance();
      }
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
    this.expect("LPAREN", "Esperado '(' apos for");
    
    // INIT
    let init = null;
    
    if (!this.check("SEMICOLON")) {
      if (this.check("KEYWORD") &&
        (this.peek().value === "variavel" ||
          this.peek().value === "var" ||
          this.peek().value === "let")) {
        
        init = this.parseVariableDeclaration(false);
        
        // ⚠ IMPORTANTE: parseVariableDeclaration já consome ;
      } else {
        init = this.parseExpression();
        this.expect("SEMICOLON", "Esperado ';' apos init do for");
      }
    } else {
      this.advance();
    }
    
    // TEST
    let test = null;
    if (!this.check("SEMICOLON")) {
      test = this.parseExpression();
    }
    this.expect("SEMICOLON", "Esperado ';' apos condicao do for");
    
    // UPDATE
    let update = null;
    if (!this.check("RPAREN")) {
      update = this.parseExpression();
    }
    
    this.expect("RPAREN", "Esperado ')' apos for");
    this.expect("LBRACE", "Esperado '{' no corpo do for");
    
    const body = this.parseBlock();
    
    return { type: "ForStatement", init, test, update, body };
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

  /* ==============================
     Expressões (precedência)
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
    // PREFIX (++i, --i, !x, -x, +x)
    if (this.check("BANG") ||
      this.check("MINUS") ||
      this.check("PLUS") ||
      this.check("INCREMENT") ||
      this.check("DECREMENT")) {
      
      const op = this.advance();
      const argument = this.parseUnary();
      
      return {
        type: "UnaryExpression",
        operator: op.value || op.type,
        argument,
        prefix: true
      };
    }
    
    // EXPRESSÃO BASE
    let expr = this.parseCallAndMember();
    
    // POSTFIX (i++ / i--)
    while (this.check("INCREMENT") || this.check("DECREMENT")) {
      const op = this.advance();
      expr = {
        type: "UnaryExpression",
        operator: op.value || op.type,
        argument: expr,
        prefix: false
      };
    }
    
    if (op.type === "INCREMENT" || op.type === "DECREMENT") {
      if (argument.type !== "Identifier") {
        throw new Error("Incremento só pode ser aplicado a variáveis.");
      }
    }
    
    return expr;
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
        expr = { type: "CallExpression", callee: expr, arguments: args };
        continue;
      }
      
      if (this.check("LBRACKET")) {
        this.advance();
        const indexExpr = this.parseExpression();
        this.expect("RBRACKET");
        expr = { type: "MemberExpression", object: expr, property: indexExpr, computed: true };
        continue;
      }
      
      if (this.check("DOT")) {
        this.advance();
        const prop = this.expect(["IDENTIFIER", "BUILTIN"], "Esperado identificador apos '.'");
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
          expr = { type: "OptionalCallExpression", callee: expr, arguments: args };
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
  
    // CASO ESPECIAL: TYPE chegou aqui (ainda escapou)
    if (this.check("TYPE")) {
      const t = this.peek();
      const prev = this.tokens[this.current - 1];
      const next = this.peek(1);
      // mensagem detalhada para ajudar a localizar a origem
      throw new Error(
        `Expressao invalida: TYPE (${t.value}). ` +
        `Isso indica que uma anotação de tipo ficou fora de lugar e não foi consumida. ` +
        `Verifique a declaração/parametro anterior (procure por ':' ausente ou parseOptionalTypeAnnotation nao usado). ` +
        `Contexto: prev=${prev ? prev.type + (prev.value?("("+prev.value+")"):"") : "null"}, next=${next ? next.type + (next.value?("("+next.value+")"):"") : "null"}`
      );
    }
  
    throw new Error("Expressao invalida: " + token.type + (token.value ? " ("+token.value+")" : ""));
  }

  // helper: consome anotações de tipo formais ": TYPE" e retorna TypeAnnotation ou null
  parseOptionalTypeAnnotation() {
    if (this.check("COLON") || this.check("DOIS_PONTOS")) {
      this.advance();
      if (this.check("TYPE") || this.check("IDENTIFIER")) {
        return { type: "TypeAnnotation", name: this.advance().value };
      }
      throw new Error("Esperado tipo apos ':'");
    }
    return null;
  }
}

/* ===========================
   VJSCodeGenerator (PT -> JS mappings)
   (mantive intacto, sem alterações relevantes aqui)
=========================== */

class VJSCodeGenerator {
  constructor(options={}) { this.indentLevel=0; this.indentString=options.indentString||" "; }

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

  _genWhileStatement(node){ const test=this._gen(node.test); const body = node.body.type==="BlockStatement" ? this._gen(node.body) : "{\n"+this._withIndent(()=> this._indent()+this._gen(node.body))+"\n"+this._indent()+"}"; return `while (${test}) ${body}`; }

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

  _genReturnStatement(node){ const arg = node.argument !== undefined ? node.argument : node.value; return arg ? `return ${this._gen(arg)};` : "return;"; }

  _genCallExpression(node){
    const calleeCode = this._gen(node.callee);
    const direct = {"mostrar":"console.log","imprime":"console.log","alerta":"alert","aleatorio":"Math.random","arredondar":"Math.round","arredondar":"Math.round","piso":"Math.floor","teto":"Math.ceil"};
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