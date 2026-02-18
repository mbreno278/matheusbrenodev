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
    if (Array.isArray(node)) return node.map(n => this._gen(n)).join(this._newline());
    const fn = this[`_gen${node.type}`];
    if (!fn) {
      console.error("No generator for node:", node);
      throw new Error("No generator for node: " + node.type);
    }
    return fn.call(this, node);
  }

  _indent() { return this.indentString.repeat(this.indentLevel); }
  _newline() { return "\n"; }
  _withIndent(fn) { this.indentLevel++; const r = fn(); this.indentLevel--; return r; }

  /* =========================
     IDENTIFIER MAPPING
  ========================== */
  _identifierMapping(name) {
    const idMap = {
      "mostrar": "console.log",
      "imprime": "console.log",
      "alerta": "alert",
      "escreva": "console.log", // 🔥 suporte direto

      "aleatorio": "Math.random",
      "arredondar": "Math.round",
      "piso": "Math.floor",
      "teto": "Math.ceil",

      "adicionar": "push",
      "removerFim": "pop",
      "removerInicio": "shift",
      "adicionarInicio": "unshift",

      "mapear": "map",
      "filtrar": "filter",
      "reduzir": "reduce",

      "maiusculo": "toUpperCase",
      "minusculo": "toLowerCase",
      "tamanho": "length",

      "lista": "Array",
      "texto": "String",
      "matematica": "Math"
    };

    return idMap[name] || name;
  }

  _propertyMapping(name) {
    const propMap = {
      "maiusculo": "toUpperCase",
      "minusculo": "toLowerCase",
      "tamanho": "length",
      "adicionar": "push",
      "removerFim": "pop",
      "removerInicio": "shift",
      "adicionarInicio": "unshift",
      "mapear": "map",
      "filtrar": "filter",
      "reduzir": "reduce"
    };
    return propMap[name] || name;
  }

  _genProgram(node) { return this._gen(node.body); }

  _genBlockStatement(node) {
    const lines = node.body.map(stmt => {
      const code = this._gen(stmt);
      return code.split("\n").map(l => l ? this._indent() + l : l).join("\n");
    });
    return "{\n" +
      this._withIndent(() => lines.join(this._newline())) +
      "\n" + this._indent() + "}";
  }

  _genExpressionStatement(node) {
    return this._gen(node.expression) + ";";
  }

  _genVariableDeclaration(node) {
    const kind = node.kind || "let";
    const decls = (node.declarations || []).map(d => {
      const id = this._gen(d.id);
      const init = d.init ? " = " + this._gen(d.init) : "";
      return id + init;
    });
    return `${kind} ${decls.join(", ")};`;
  }

  _genIdentifier(node) {
    if (!node || !node.name) return "";
    return this._identifierMapping(node.name);
  }

  _genLiteral(node) {
    if (typeof node.value === "string") return JSON.stringify(node.value);
    if (node.value === null) return "null";
    return String(node.value);
  }

  _genCallExpression(node) {
    const callee = this._gen(node.callee);
    const args = (node.arguments || []).map(a => this._gen(a)).join(", ");
    return `${callee}(${args})`;
  }

  _genMemberExpression(node) {
    const obj = this._gen(node.object);
    if (node.computed) {
      return `${obj}[${this._gen(node.property)}]`;
    }
    let propName = node.property.name || this._gen(node.property);
    propName = this._propertyMapping(propName);
    return `${obj}.${propName}`;
  }

  _genBinaryExpression(node) {
    return `${this._gen(node.left)} ${node.operator} ${this._gen(node.right)}`;
  }

  _genLogicalExpression(node) {
    return this._genBinaryExpression(node);
  }

  _genUnaryExpression(node) {
    return node.prefix
      ? `${node.operator}${this._gen(node.argument)}`
      : `${this._gen(node.argument)}${node.operator}`;
  }

  _genReturnStatement(node) {
    return node.argument
      ? `return ${this._gen(node.argument)};`
      : "return;";
  }
}