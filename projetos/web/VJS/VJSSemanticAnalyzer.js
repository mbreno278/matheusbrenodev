// VJSSemanticAnalyzer.js

export class VJSSemanticAnalyzer {
  constructor(ast) {
    this.ast = ast;

    // Tipos primitivos da linguagem
    this.builtinTypes = new Set([
      "vazio",
      "texto",
      "numero",
      "inteiro",
      "booleano",
      "decimal",
      "lista",
      "qualquer"
    ]);

    // Classes declaradas pelo usuário
    this.userTypes = new Set();

    // Identificadores built-in (não precisam ser declarados)
    this.builtinIdentifiers = new Set([
      // I/O e utilitários VJS
      "escreva", "mostrar", "imprime", "alerta",
      // math / random
      "aleatorio", "arredondar", "piso", "teto",
      // literais / helpers
      "verdadeiro", "falso", "nulo",
      // nomes que podem aparecer como builtins (console/Math/Array mapeados no CodeGenerator)
      "console", "Math", "Array", "String", "Object", "JSON"
    ]);

    // Armazena erros encontrados
    this.errors = [];

    // Escopos de variáveis (pilha) — cada escopo é um map name -> token
    this.scopes = [{}]; // escopo global
  }

  /* ======================================
     PONTO DE ENTRADA
  ====================================== */
  analyze() {
    // 1) coleta classes
    this.collectUserTypes();

    // 2) hoist funções para o escopo global (funções são "declaradas" antes de usar)
    this.collectFunctionDeclarations();

    // 3) valida os nós com escopos
    this.validateNodes();

    if (this.errors.length > 0) {
      const message = this.errors.map(e => e.message).join("\n");
      throw new Error(message);
    }

    return true;
  }

  /* ======================================
     1️⃣ COLETAR CLASSES DECLARADAS
  ====================================== */
  collectUserTypes() {
    if (!this.ast || !Array.isArray(this.ast.body)) return;

    for (const node of this.ast.body) {
      if (node.type === "ClassDeclaration") {
        const name = node.id?.name;
        if (!name) continue;

        if (this.userTypes.has(name)) {
          this.errors.push(new Error(`Classe duplicada: ${name}`));
        } else {
          this.userTypes.add(name);
        }
      }
    }
  }

  /* ======================================
     1.5️⃣ COLETAR (HOIST) FUNÇÕES NO ESCOPO GLOBAL
     Para evitar erro quando função é chamada antes de sua declaração.
  ====================================== */
  collectFunctionDeclarations() {
    if (!this.ast || !Array.isArray(this.ast.body)) return;
    for (const node of this.ast.body) {
      if (node.type === "FunctionDeclaration" && node.id && node.id.name) {
        // declara no escopo global (this.scopes[0])
        const globalScope = this.scopes[0];
        if (globalScope[node.id.name]) {
          // já existe algo com esse nome — reporta se quiser (optativo)
        } else {
          globalScope[node.id.name] = node.id;
        }
      }
    }
  }

  /* ======================================
     2️⃣ VALIDAR NÓS PRINCIPAIS
  ====================================== */
  validateNodes() {
    if (!this.ast || !Array.isArray(this.ast.body)) return;
    for (const node of this.ast.body) {
      this.validateNode(node);
    }
  }

  validateNode(node) {
    if (!node) return;

    switch (node.type) {
      case "FunctionDeclaration":
        // Entrar em escopo da função (os parâmetros e variáveis locais ficam aqui)
        this.enterScope();

        // parâmetros -> declarar no escopo da função e validar tipos
        if (Array.isArray(node.params)) {
          for (const param of node.params) {
            if (param.typeAnnotation?.typeName) {
              this.validateType(
                param.typeAnnotation.typeName,
                `Parâmetro '${param.name}' da função '${node.id?.name || "<anon>"}' tem tipo inválido`
              );
            }
            if (param.name) this.declareVariable(param.name, param);
          }
        }

        // tipo de retorno
        if (node.returnType?.typeName) {
          this.validateType(
            node.returnType.typeName,
            `Função '${node.id?.name || "<anon>"}' tem tipo de retorno inválido`
          );
        }

        // corpo
        if (node.body) this.validateNode(node.body);

        this.exitScope();
        break;

      case "VariableDeclaration":
        this.validateVariableDeclaration(node);
        break;

      case "BlockStatement":
        this.enterScope();
        for (const stmt of node.body) {
          this.validateNode(stmt);
        }
        this.exitScope();
        break;

      case "ClassDeclaration":
        // Validar membros depois se necessário (não implementado)
        break;

      case "ExpressionStatement":
        this.validateExpression(node.expression);
        break;

      case "IfStatement":
        this.validateExpression(node.test);
        this.validateNode(node.consequent);
        if (node.alternate) this.validateNode(node.alternate);
        break;

      case "WhileStatement":
        this.validateExpression(node.test);
        this.validateNode(node.body);
        break;

      case "ReturnStatement":
        if (node.argument) this.validateExpression(node.argument);
        break;

      default:
        // ignorar outros tipos por enquanto
        break;
    }
  }

  /* ======================================
     ESCOPOS DE VARIÁVEIS
  ====================================== */
  enterScope() { this.scopes.push({}); }
  exitScope() { this.scopes.pop(); }

  declareVariable(name, token) {
    if (!name) return;
    const scope = this.scopes[this.scopes.length - 1];
    scope[name] = token || true;
  }

  // tenta obter linha/col em forma robusta
  _posFromToken(token) {
    if (!token) return { line: "?", column: "?" };
    // suportar token.start.{line,column} vindo do lexer, ou node com linha direta
    if (token.start && (token.start.line || token.start.column)) {
      return { line: token.start.line || "?", column: token.start.column || "?" };
    }
    if (token.line || token.column) {
      return { line: token.line || "?", column: token.column || "?" };
    }
    // node Identifier pode não ter posição — fallback
    return { line: "?", column: "?" };
  }

  resolveVariable(name, token) {
    if (!name) return true;

    // se for builtin, não precisa estar declarado
    if (this.builtinIdentifiers.has(name)) return true;

    // procura nos escopos de dentro pra fora
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i][name]) return true;
    }

    const pos = this._posFromToken(token);
    this.errors.push(new Error(`Erro semântico: Variável não declarada '${name}' na linha ${pos.line}, coluna ${pos.column}`));
    return false;
  }

  /* ======================================
     3️⃣ VALIDAR VARIÁVEIS
  ====================================== */
  validateVariableDeclaration(node) {
    for (const decl of node.declarations) {
      const name = decl.id?.name;
      const typeName = decl.typeAnnotation?.typeName;

      if (name) this.declareVariable(name, decl.id);
      if (typeName) this.validateType(typeName, `Variável '${name}' tem tipo inválido`);
      if (decl.init) this.validateExpression(decl.init);
    }
  }

  /* ======================================
     4️⃣ VALIDAR EXPRESSÕES
  ====================================== */
  validateExpression(expr) {
    if (!expr) return;

    switch (expr.type) {
      case "Identifier":
        this.resolveVariable(expr.name, expr);
        break;

      case "AssignmentExpression":
      case "BinaryExpression":
      case "LogicalExpression":
        // podem ter left/right como nodes
        if (expr.left) this.validateExpression(expr.left);
        if (expr.right) this.validateExpression(expr.right);
        break;

      case "UnaryExpression":
      case "UpdateExpression":
        if (expr.argument) this.validateExpression(expr.argument);
        break;

      case "CallExpression":
        // callee pode ser Identifier (função) ou MemberExpression (obj.metodo)
        if (expr.callee) this.validateExpression(expr.callee);
        if (expr.arguments) for (const arg of expr.arguments) this.validateExpression(arg);
        break;

      case "MemberExpression":
        if (expr.object) this.validateExpression(expr.object);
        if (expr.computed && expr.property) this.validateExpression(expr.property);
        break;

      case "ArrayExpression":
        if (expr.elements) for (const el of expr.elements) this.validateExpression(el);
        break;

      case "ObjectExpression":
        if (expr.properties) for (const p of expr.properties) this.validateExpression(p.value);
        break;

      case "Property":
        this.validateExpression(expr.value);
        break;

      case "Literal":
        // nada a validar
        break;

      default:
        // nodes desconhecidos — ignorar ou estender
        break;
    }
  }

  /* ======================================
     5️⃣ VALIDAÇÃO CENTRAL DE TIPO
  ====================================== */
  validateType(typeName, contextMessage) {
    if (typeName === "qualquer") return;

    if (!this.builtinTypes.has(typeName) && !this.userTypes.has(typeName)) {
      this.errors.push(new Error(`${contextMessage}: ${typeName}`));
    }
  }
}