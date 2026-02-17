// VJSCodeGenerator.js
// Gera código JavaScript a partir da AST produzida pelo VJSParser
// Traduções PT -> JS incorporadas (ex.: mostrar(), escrever() -> console.log())

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
    
    if (Array.isArray(node)) {
      return node.map(n => this._gen(n)).join(this._newline());
    }
    
    const fn = this[`_gen${node.type}`];
    if (!fn) {
      console.error("Nó inválido:", node);
      throw new Error(`Nó não suportado: ${node.type}`);
    }
    
    return fn.call(this, node);
  }
  
  _indent() { return this.indentString.repeat(this.indentLevel); }
  _newline() { return "\n"; }
  
  _withIndent(fn) {
    this.indentLevel++;
    const res = fn();
    this.indentLevel--;
    return res;
  }
  
  /* ================= Traduções ================= */
  
  _identifierMapping(name) {
    const map = {
      "mostrar": "console.log",
      "imprime": "console.log",
      "escrever": "console.log",
      "escreva": "console.log",
      "alerta": "alert",
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
    
    return map[name] || name;
  }
  
  _propertyMapping(name) {
    const map = {
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
    
    return map[name] || name;
  }
  
  /* ================= Program ================= */
  
  _genProgram(node) {
    return this._gen(node.body);
  }
  
  _genBlockStatement(node) {
    const lines = node.body.map(stmt => {
      const code = this._gen(stmt);
      return code.split("\n")
        .map(l => l ? this._indent() + l : l)
        .join("\n");
    });
    
    return "{\n" +
      this._withIndent(() => lines.join("\n")) +
      "\n" + this._indent() + "}";
  }
  
  _genExpressionStatement(node) {
    return this._gen(node.expression) + ";";
  }
  
  /* ================= Declarações ================= */
  
  _genVariableDeclaration(node) {
    const kind = node.kind || "let";
    const decls = node.declarations.map(d => {
      const id = this._gen(d.id);
      const init = d.init ? " = " + this._gen(d.init) : "";
      return id + init;
    });
    
    return `${kind} ${decls.join(", ")};`;
  }
  
  _genIdentifier(node) {
    return this._identifierMapping(node.name);
  }
  
  _genLiteral(node) {
    if (typeof node.value === "string") return JSON.stringify(node.value);
    if (node.value === null) return "null";
    return String(node.value);
  }
  
  _genAssignmentExpression(node) {
    return `${this._gen(node.left)} ${node.operator} ${this._gen(node.right)}`;
  }
  
  _genBinaryExpression(node) {
    return `${this._gen(node.left)} ${node.operator} ${this._gen(node.right)}`;
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
  
  _genFunctionDeclaration(node) {
    const name = node.id ? this._gen(node.id) : "";
    const params = node.params.map(p => this._gen(p)).join(", ");
    return `function ${name}(${params}) ${this._gen(node.body)}`;
  }
  
  _genReturnStatement(node) {
    return node.argument ?
      `return ${this._gen(node.argument)};` :
      "return;";
  }
  
  /* 🔥 CORREÇÃO DEFINITIVA AQUI */
  _genCallExpression(node) {
    const callee = this._gen(node.callee);
    const args = node.arguments.map(a => this._gen(a)).join(", ");
    return `${callee}(${args})`;
  }
  
  _genMemberExpression(node) {
    const obj = this._gen(node.object);
    
    if (node.computed) {
      return `${obj}[${this._gen(node.property)}]`;
    }
    
    const prop = this._propertyMapping(node.property.name);
    return `${obj}.${prop}`;
  }
  
  _genArrayExpression(node) {
    return `[${node.elements.map(e => this._gen(e)).join(", ")}]`;
  }
  
  _genObjectExpression(node) {
    const props = node.properties.map(p =>
      `${p.key.name}: ${this._gen(p.value)}`
    );
    return `{ ${props.join(", ")} }`;
  }
}

/* ================= Attach ================= */

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