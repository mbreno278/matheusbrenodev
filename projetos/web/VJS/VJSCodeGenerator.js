// VJSCodeGenerator.js
// Gera código JavaScript a partir da AST produzida pelo VJSParser
// Traduções PT -> JS incorporadas (ex.: mostrar() -> console.log())

class VJSCodeGenerator {
  constructor(options = {}) {
    this.indentLevel = 0;
    this.indentString = options.indentString || "  ";
  }
  
  generate(ast) {
    if (!ast) throw new Error("AST não fornecida para VJSCodeGenerator.generate(ast)");
    this.indentLevel = 0;
    return this._gen(ast);
  }
  
  _gen(node) {
    if (!node) return "";
    
    // Se node for um array, percorre e concatena com quebras de linha
    if (Array.isArray(node)) {
      return node.map(n => this._gen(n)).join(this._newline());
    }
    
    const fn = this[`_gen${node.type}`];
    if (!fn) {
      console.error("Nó recebido inválido:", node);
      throw new Error(`VJSCodeGenerator: nó não suportado: ${node.type}`);
    }
    
    return fn.call(this, node);
  }
  
  _indent() {
    return this.indentString.repeat(this.indentLevel);
  }
  
  _newline() {
    return "\n";
  }
  
  _withIndent(fn) {
    this.indentLevel++;
    const res = fn();
    this.indentLevel--;
    return res;
  }

  /* ================= Traduções / Mapeamentos PT -> JS ================= */
  _identifierMapping(name) {
    // mapeamentos para substituir funções/identificadores PT por JS
    const idMap = {
      // funções utilitárias
      "mostrar": "console.log",
      "imprime": "console.log",
      "alerta": "alert",
      // Math
      "aleatorio": "Math.random",
      "arredondar": "Math.round",
      "piso": "Math.floor",
      "teto": "Math.ceil",
      // arrays / string helpers (mapeamos propriedades/métodos)
      "adicionar": "push",
      "removerFim": "pop",
      "removerInicio": "shift",
      "adicionarInicio": "unshift",
      "mapear": "map",
      "filtrar": "filter",
      "reduzir": "reduce",
      // string
      "maiusculo": "toUpperCase",
      "minusculo": "toLowerCase",
      "tamanho": "length",
      // classes/objetos
      "lista": "Array",
      "texto": "String",
      "matematica": "Math"
    };
    return idMap[name] || name;
  }

  _propertyMapping(name) {
    // mapeia nomes de propriedade/metodo (usado em MemberExpression)
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

  /* ================= Program e Blocks ================= */
  _genProgram(node) {
    // body é array de statements
    return this._gen(node.body);
  }
  
  _genBlockStatement(node) {
    const lines = node.body.map(stmt => {
      const code = this._gen(stmt);
      return code.split("\n").map(l => l ? this._indent() + l : l).join("\n");
    });
    return "{" + this._newline() + this._withIndent(() => lines.join(this._newline())) + this._newline() + this._indent() + "}";
  }
  
  _genExpressionStatement(node) {
    return this._gen(node.expression) + ";";
  }
  
  /* ================= Declarations ================= */
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
    // node.name pode ser nome em PT; aplicar mapeamento apenas a builtins conhecidos
    if (!node || !node.name) return "";
    const mapped = this._identifierMapping(node.name);
    return mapped;
  }
  
  _genLiteral(node) {
    if (node.raw !== undefined) return node.raw;
    if (typeof node.value === "string") return JSON.stringify(node.value);
    if (node.value === null) return "null";
    return String(node.value);
  }
  
  _genAssignmentExpression(node) {
    const op = node.operator || "=";
    return `${this._gen(node.left)} ${op} ${this._gen(node.right)}`;
  }
  
  _genBinaryExpression(node) {
    return `${this._maybeWrap(node.left, node)} ${node.operator} ${this._maybeWrap(node.right, node)}`;
  }
  
  _genLogicalExpression(node) {
    return this._genBinaryExpression(node);
  }
  
  _genUnaryExpression(node) {
    return node.prefix ?
      `${node.operator}${this._maybeWrap(node.argument, node)}` :
      `${this._maybeWrap(node.argument, node)}${node.operator}`;
  }
  
  _genUpdateExpression(node) {
    return node.prefix ?
      `${node.operator}${this._gen(node.argument)}` :
      `${this._gen(node.argument)}${node.operator}`;
  }
  
  _genIfStatement(node) {
    const test = this._gen(node.test);
    const cons = node.consequent.type === "BlockStatement" ?
      this._gen(node.consequent) :
      this._withIndent(() => this._indent() + this._gen(node.consequent));
    let code = `if (${test}) ${cons}`;
    if (node.alternate) {
      const alt = node.alternate.type === "IfStatement" ?
        " " + this._gen(node.alternate) :
        " else " + (node.alternate.type === "BlockStatement" ?
          this._gen(node.alternate) :
          this._withIndent(() => this._indent() + this._gen(node.alternate)));
      code += alt;
    }
    return code;
  }
  
  _genWhileStatement(node) {
    const test = this._gen(node.test);
    const body = node.body.type === "BlockStatement" ?
      this._gen(node.body) :
      "{\n" + this._withIndent(() => this._indent() + this._gen(node.body)) + "\n" + this._indent() + "}";
    return `while (${test}) ${body}`;
  }
  
  _genForStatement(node) {
    const init = node.init ? (node.init.type === "VariableDeclaration" ? this._gen(node.init).replace(/;$/, "") : this._gen(node.init)) : "";
    const test = node.test ? this._gen(node.test) : "";
    const update = node.update ? this._gen(node.update) : "";
    const body = node.body.type === "BlockStatement" ?
      this._gen(node.body) :
      "{\n" + this._withIndent(() => this._indent() + this._gen(node.body)) + "\n" + this._indent() + "}";
    return `for (${init}; ${test}; ${update}) ${body}`;
  }
  
  _genFunctionDeclaration(node) {
    const id = node.id ? this._gen(node.id) : (node.name || "");
    const params = (node.params || []).map(p => this._gen(p)).join(", ");
    const body = this._gen(node.body);
    return `function ${id}(${params}) ${body}`;
  }
  
  _genReturnStatement(node) {
    // aceitamos node.argument (parser) ou node.value (algumas versões)
    const arg = node.argument !== undefined ? node.argument : node.value;
    return arg ? `return ${this._gen(arg)};` : "return;";
  }
  
  _genCallExpression(node) {
    // callee pode ser Identifier ou MemberExpression. Gerar seu código e aplicar mapeamentos simples.
    const calleeCode = this._gen(node.callee);
    // se calleeCode for um mapeamento tipo "console.log" ou "Math.random" já veio transformado no _genIdentifier/_genMemberExpression
    const mappedCallee = (() => {
      // substituições diretas de identif. simples (ex.: mostrar -> console.log)
      const direct = {
        "mostrar": "console.log",
        "imprime": "console.log",
        "alerta": "alert",
        "aleatorio": "Math.random",
        "arredondar": "Math.round",
        "piso": "Math.floor",
        "teto": "Math.ceil"
      };
      if (direct[calleeCode]) return direct[calleeCode];
      return calleeCode;
    })();

    const args = (node.arguments || []).map(a => this._gen(a)).join(", ");
    return `${mappedCallee}(${args})`;
  }
  
  _genMemberExpression(node) {
    const obj = this._gen(node.object);
    // propriedade pode ser expressão (computed) ou identifier
    if (node.computed) {
      return `${obj}[${this._gen(node.property)}]`;
    } else {
      // propriedade identificador (p.ex.: nome.maiusculo())
      let propName = (node.property && node.property.name) ? node.property.name : this._gen(node.property);
      propName = this._propertyMapping(propName);
      return `${obj}.${propName}`;
    }
  }
  
  _genArrayExpression(node) {
    const elems = (node.elements || []).map(e => e ? this._gen(e) : "").join(", ");
    return `[${elems}]`;
  }
  
  _genObjectExpression(node) {
    const props = (node.properties || []).map(p => {
      if (p.type === "Property") {
        const key = p.computed ? `[${this._gen(p.key)}]` : (p.key.type === "Identifier" ? p.key.name : this._gen(p.key));
        return p.shorthand ? key : `${key}: ${this._gen(p.value)}`;
      } else if (p.type === "SpreadElement") {
        return `...${this._gen(p.argument)}`;
      }
      // fallback
      return this._gen(p);
    });
    return `{ ${props.join(", ")} }`;
  }
  
  _genConditionalExpression(node) {
    return `${this._gen(node.test)} ? ${this._gen(node.consequent)} : ${this._gen(node.alternate)}`;
  }
  
  _genSwitchStatement(node) {
    const disc = this._gen(node.discriminant);
    const cases = (node.cases || []).map(c => {
      if (c.test) {
        const test = this._gen(c.test);
        const cons = (c.consequent || []).map(s => this._gen(s)).join(this._newline());
        return `${this._indent()}case ${test}:` + this._newline() + this._withIndent(() => cons);
      } else {
        const cons = (c.consequent || []).map(s => this._gen(s)).join(this._newline());
        return `${this._indent()}default:` + this._newline() + this._withIndent(() => cons);
      }
    }).join(this._newline());
    return `switch (${disc}) {` + this._newline() + cases + this._newline() + `}`;
  }
  
  _maybeWrap(child, parent) {
    if (!child) return "";
    if ((child.type === "BinaryExpression" || child.type === "LogicalExpression") &&
      (parent.type === "BinaryExpression" || parent.type === "LogicalExpression")) {
      return `(${this._gen(child)})`;
    }
    return this._gen(child);
  }
}

// Anexa ao VJS global
(function attachToVJS() {
  function tryAttach() {
    if (typeof VJS !== "undefined") {
      VJS.VJSCodeGenerator = VJSCodeGenerator;
    } else {
      setTimeout(tryAttach, 50);
    }
  }
  tryAttach();
})();