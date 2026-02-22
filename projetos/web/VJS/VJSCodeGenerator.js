// VJSCodeGenerator.js
export class VJSCodeGenerator {
  constructor(options = {}) {
    this.indentLevel = 0;
    this.indentString = options.indentString || "  ";
  }

  generate(ast) {
    if (!ast) throw new Error("AST nao fornecida");
    this.indentLevel = 0;
    // trim final whitespace but keep a trailing newline
    return this._gen(ast).trim() + this._newline();
  }

  _gen(node) {
    if (node == null) return "";
    if (Array.isArray(node)) return node.map(n => this._gen(n)).filter(Boolean).join(this._newline());

    const type = node.type && String(node.type);
    const fn = this[`_gen${type}`] || this._genUnknown.bind(this);
    return fn.call(this, node);
  }

  _indent() { return this.indentString.repeat(this.indentLevel); }
  _newline() { return "\n"; }

  _withIndent(fn) {
    this.indentLevel++;
    try {
      return fn();
    } finally {
      this.indentLevel--;
    }
  }

  /* =========================
     HELPERS
  ========================== */

  _identifierMapping(name) {
    if (!name) return "";
    const idMap = {
      "mostrar": "console.log",
      "imprime": "console.log",
      "alerta": "alert",
      "escreva": "console.log",
      "aleatorio": "Math.random",
      "arredondar": "Math.round",
      "piso": "Math.floor",
      "teto": "Math.ceil",
      "lista": "Array",
      "texto": "String",
      "matematica": "Math",
      "verdadeiro": "true",
      "falso": "false",
      "nulo": "null",
      // normalize common Portuguese keywords that must map to JS keywords/names
      "construtor": "constructor",
      "retorno": "return"
    };
    return idMap[name] || name;
  }

  _propertyMapping(name) {
    if (name == null) return name;
    const propMap = {
      "adicionar": "push",
      "removerFim": "pop",
      "removerInicio": "shift",
      "adicionarInicio": "unshift",
      "mapear": "map",
      "filtrar": "filter",
      "reduzir": "reduce",
      "maiusculo": "toUpperCase",
      "minusculo": "toLowerCase",
      "tamanho": "length"
    };
    return propMap[name] || name;
  }

  _operatorMapping(op) {
    if (!op) return op;
    if (op === "instanciaDe") return "instanceof";
    if (op === "tipoDe") return "typeof";
    const opMap = {
      "e": "&&",
      "ou": "||",
      "nao": "!",
      "===": "===",
      "==": "==",
      "!=": "!=",
      "!==": "!==",
      "+": "+",
      "-": "-",
      "*": "*",
      "/": "/",
      "%": "%",
      "<": "<",
      ">": ">",
      "<=": "<=",
      ">=": ">="
    };
    return opMap[op] || op;
  }

  _stripType(node) {
    if (!node || typeof node !== "object") return node;
    const clone = { ...node };
    delete clone.typeAnnotation;
    delete clone.returnType;
    delete clone.typeParameters;
    delete clone.tsType;
    // do NOT delete clone.type broadly here — some flows rely on node.type — kept minimal
    return clone;
  }

  /* =========================
     TOP-LEVEL NODES
  ========================== */

  _genProgram(node) {
    return this._gen(node.body || node.statements || node.moduleBody || []);
  }

  _genBlockStatement(node) {
    const stmts = node.body || node.statements || [];
    const lines = stmts.map(stmt => {
      const code = this._gen(stmt);
      return code
        .split("\n")
        .map(l => l ? this._indent() + this.indentString + l : l)
        .join("\n");
    }).join(this._newline());
    return "{\n" + this._withIndent(() => lines) + "\n" + this._indent() + "}";
  }

  _genExpressionStatement(node) {
    // keep expression statements unindented here; class body mapper will indent members
    const expr = node.expression || node;
    return this._gen(expr) + ";";
  }

  _genVariableDeclaration(node) {
    const kind = node.kind || "let";
    const decls = (node.declarations || []).map(d => {
      const idCode = this._gen(d.id);
      const init = d.init ? " = " + this._gen(d.init) : "";
      return idCode + init;
    });
    return `${kind} ${decls.join(", ")};`;
  }

  _genVariableDeclarationInline(node) {
    const kind = node.kind || "let";
    const decls = (node.declarations || []).map(d => {
      const idCode = this._gen(d.id);
      const init = d.init ? " = " + this._gen(d.init) : "";
      return idCode + init;
    });
    return `${kind} ${decls.join(", ")}`;
  }

  _genFunctionDeclaration(node) {
    const name = node.id ? this._gen(node.id) : "";
    const params = (node.params || []).map(p => this._gen(p)).join(", ");
    const body = this._gen(node.body || node.block || { type: "BlockStatement", body: [] });
    return `function ${name}(${params}) ${body}`;
  }

  _genArrowFunctionExpression(node) {
    const params = (node.params || []).map(p => this._gen(p)).join(", ");
    const body = node.body ? (node.body.type === "BlockStatement" ? this._gen(node.body) : this._gen(node.body)) : "{}";
    return `(${params}) => ${body}`;
  }

  _genReturnStatement(node) {
    const arg = node.argument || node.expression || node.value;
    return arg ? `return ${this._gen(arg)};` : `return;`;
  }

  /* =========================
     CONTROL FLOW
  ========================== */
  
  _genIfStatement(node) {
    const test = this._gen(node.test || node.condition || node.testExpression);
    const consequent = this._gen(node.consequent || node.then || node.body);
    let code = `if (${test}) ${consequent}`;
    if (node.alternate) code += ` else ${this._gen(node.alternate)}`;
    return code;
  }
  
  _genWhileStatement(node) {
    const test = this._gen(node.test || node.condition);
    const body = this._gen(node.body || node.consequent);
    return `while (${test}) ${body}`;
  }
  
  _genForStatement(node) {
    let initCode = "";
  
    if (node.init) {
      if (node.init.type === "VariableDeclaration") {
        initCode = this._genVariableDeclarationInline(node.init);
      } else {
        initCode = this._gen(node.init);
      }
    }
  
    const testCode = node.test ? this._gen(node.test) : "";
    const updateCode = node.update ? this._gen(node.update) : "";
    const bodyCode = this._gen(node.body || node.consequent || { type: "BlockStatement", body: [] });
  
    return `for (${initCode}; ${testCode}; ${updateCode}) ${bodyCode}`;
  }
  
  /* =========================
     🔥 FOR-IN CORRIGIDO
  ========================== */
  
  _genForInStatement(node) {
    let leftCode;
  
    if (node.left && node.left.type === "VariableDeclaration") {
      leftCode = this._genVariableDeclarationInline(node.left);
    } else {
      leftCode = this._gen(node.left);
    }
  
    return `for (${leftCode} in ${this._gen(node.right)}) ${this._gen(node.body)}`;
  }
  
  /* =========================
     🔥 FOR-OF CORRIGIDO
  ========================== */
  
  _genForOfStatement(node) {
    let leftCode;
  
    if (node.left && node.left.type === "VariableDeclaration") {
      // 🔥 impede gerar ponto e vírgula dentro do for-of
      leftCode = this._genVariableDeclarationInline(node.left);
    } else {
      leftCode = this._gen(node.left);
    }
  
    const rightCode = this._gen(node.right);
    const bodyCode = this._gen(node.body);
  
    return `for (${leftCode} of ${rightCode}) ${bodyCode}`;
  }
  
  _genBreakStatement() { return "break;"; }
  _genContinueStatement() { return "continue;"; }
  _genThrowStatement(node) { return `throw ${this._gen(node.argument)};`; }
  _genTryStatement(node) {
    const block = this._gen(node.block || node.tryBlock);
    const handler = node.handler ? this._gen(node.handler) : "";
    const finalizer = node.finalizer ? ` finally ${this._gen(node.finalizer)}` : "";
    return `try ${block}${handler}${finalizer}`;
  }
  _genCatchClause(node) {
    const param = node.param ? this._gen(node.param) : "";
    const body = this._gen(node.body);
    return ` catch (${param}) ${body}`;
  }

  /* =========================
     CLASS SUPPORT
  ========================== */

  _genClassDeclaration(node) {
    const className = node.id ? this._gen(node.id) : "";
    const extendsCode = node.superClass ? ` extends ${this._gen(node.superClass)}` : "";
    const implementsComment = (node.implements && node.implements.length)
      ? ` // implements ${node.implements.map(i => this._gen(i)).join(", ")}`
      : "";
    const body = this._gen(node.body || node.classBody || { type: "ClassBody", body: [] });
    return `class ${className}${extendsCode} ${body}${implementsComment}`;
  }

  _genClassBody(node) {
    const members = (node.body || node.bodyElements || []).map(elem => {
      const code = this._gen(elem);
      // indent each member one extra level inside class
      return code
        .split("\n")
        .map(l => l ? this._indent() + this.indentString + l : l)
        .join("\n");
    }).join(this._newline() + this._newline());

    return "{\n" + this._withIndent(() => members) + "\n" + this._indent() + "}";
  }

  _genFieldDefinition(node) {
    const deco = (node.decorators || []).map(d => "@" + this._gen(d)).join(this._newline());
    const parts = [];
    if (deco) parts.push(deco);
    const prefix = node.static ? "static " : "";

    let keyCode = "";
    if (node.key) {
      if (node.key.type === "PrivateIdentifier") keyCode = `#${node.key.name}`;
      else if (node.key.type === "Identifier") keyCode = this._identifierMapping(node.key.name);
      else if (node.key.type === "Literal") keyCode = (typeof node.key.value === "string") ? JSON.stringify(node.key.value) : String(node.key.value);
      else keyCode = this._gen(node.key);
    }

    const init = node.value || node.initializer || node.init ? " = " + this._gen(node.value || node.initializer || node.init) : "";
    const accessComment = node.access && node.access !== "public" ? ` /* ${node.access} */` : "";
    parts.push(`${prefix}${keyCode}${init};${accessComment}`);
    return parts.join(this._newline());
  }

  _genConstructor(node) {
    // node might be MethodDefinition with kind 'constructor' or Constructor type
    const params = (node.params || []).map(p => this._gen(p)).join(", ");
    const body = node.body ? this._gen(node.body) : "{}";
    return `constructor(${params}) ${body}`;
  }

  _genMethodDefinition(node) {
    // normalized name resolution (use identifier mapping to translate PT names)
    const deco = (node.decorators || []).map(d => "@" + this._gen(d)).join(this._newline());
    const parts = [];
    if (deco) parts.push(deco);

    const prefix = node.static ? "static " : "";
    const accessComment = node.access && node.access !== "public" ? ` /* ${node.access} */` : "";
    const kind = node.kind || node.method || (node.key && (node.key.name === "construtor" || node.key.value === "construtor") ? "constructor" : "method");

    // name resolution (robust)
    let nameCode = "";
    if (node.key) {
      if (node.key.type === "Identifier") {
        // use identifier mapping for translations (ex: 'construtor' -> 'constructor')
        nameCode = this._identifierMapping(node.key.name);
      } else if (node.key.type === "PrivateIdentifier") {
        nameCode = `#${node.key.name}`;
      } else if (node.key.type === "Literal") {
        nameCode = (typeof node.key.value === "string") ? JSON.stringify(node.key.value) : String(node.key.value);
      } else {
        // fall back to generic gen (safe)
        nameCode = this._gen(node.key);
      }
    }

    // ensure constructor normalization: either by kind or by name
    if (kind === "constructor" || node.type === "Constructor" || nameCode === "construtor" || nameCode === "constructor") {
      nameCode = "constructor";
    }

    const params = (node.params || []).map(p => this._gen(p)).join(", ");

    let bodyCode = "{}";
    if (node.abstract) {
      bodyCode = `{ throw new Error("Método abstrato não implementado: ${nameCode}"); }`;
    } else if (node.body) {
      bodyCode = this._gen(node.body);
    } else {
      bodyCode = "{}";
    }

    if (kind === "get" || kind === "set") {
      return parts.concat(`${prefix}${kind} ${nameCode}(${params}) ${bodyCode}${accessComment}`).join(this._newline());
    }

    return parts.concat(`${prefix}${nameCode}(${params}) ${bodyCode}${accessComment}`).join(this._newline());
  }

  /* =========================
     EXPRESSIONS & LITERALS
  ========================== */

  _genIdentifier(node) {
    if (!node) return "";
    const name = node.name || node.value || "";
    return this._identifierMapping(name);
  }

  _genPrivateIdentifier(node) {
    return `#${node.name}`;
  }

  _genLiteral(node) {
    if (node == null) return "undefined";
    if (typeof node.value === "string") return JSON.stringify(node.value);
    if (node.raw != null) return node.raw;
    if (node.value === null) return "null";
    if (typeof node.value !== "undefined") return String(node.value);
    if (typeof node.boolean !== "undefined") return node.boolean ? "true" : "false";
    return String(node);
  }

  _genTemplateLiteral(node) {
    const quasis = node.quasis || [];
    const exprs = node.expressions || [];
    let out = "`";
    for (let i = 0; i < quasis.length; i++) {
      const q = quasis[i];
      out += (q && q.value && q.value.cooked) ? q.value.cooked : (q && q.value && q.value.raw ? q.value.raw : "");
      if (i < exprs.length) {
        out += "${" + this._gen(exprs[i]) + "}";
      }
    }
    out += "`";
    return out;
  }

  _genTaggedTemplateExpression(node) {
    return `${this._gen(node.tag)}${this._gen(node.quasi)}`;
  }

  _genCallExpression(node) {
    if (node && node.callee && node.callee.type === "MemberExpression") {
      const propNode = node.callee.property;
      let propName = null;
  
      if (propNode) {
        if (propNode.type === "Identifier") propName = propNode.name;
        else if (propNode.type === "Literal") propName = propNode.value;
      }
  
      const objCode = this._gen(node.callee.object);
      const argsArr = node.arguments || node.args || [];
      const args = argsArr.map(a => this._gen(a)).join(", ");
  
      // ================================
      // 🔥 MAPEAMENTO ESPECIAL: em()
      // ================================
      if (propName === "em") {
        if (
          argsArr.length === 1 &&
          argsArr[0] &&
          argsArr[0].type === "Literal" &&
          typeof argsArr[0].value === "number"
        ) {
          const indexCode = this._gen(argsArr[0]);
          return `${objCode}[${indexCode}]`;
        }
  
        return `${objCode}.at(${args})`;
      }
  
      // ================================
      // 🔥 MAPEAMENTO ESPECIAL: concatenar()
      // ================================
      if (propName === "concatenar") {
        return `${objCode}.concat(${args})`;
      }
  
      // ================================
      // 🔥 NOVO: copiarDentro()
      // ================================
      if (propName === "copiarDentro") {
        return `${objCode}.copyWithin(${args})`;
      }
      
      // ================================
      // 🔥NOVO entrada()
      // ================================
      if (propName === "entradas") {
        return `${objCode}.entries(${args})`;
      }
  
      // ================================
      // 🔥 FUTURO (opcional): adicionar()
      // ================================
      if (propName === "adicionar") {
        return `${objCode}.push(${args})`;
      }
      
      // ================================
      // 🔥 FUTURO (opcional):todos ()
      // ================================
      if (propName === "todos") {
        return `${objCode}.every(${args})`;
      }
      
      // ================================
      // 🔥 FUTURO (): preencher()
      // ================================
      if (propName === "preencher") {
        return `${objCode}.fill(${args})`;
      }
      
      // ================================
      // 🔥 FUTURO (): filtrar()
      // ================================
      if (propName === "filtrar") {
        return `${objCode}.filter(${args})`;
      }
      
      if (propName == "encontrar") {
        return `${objCode}.find(${args})`;
      }
      
      if (propName == "encontrarIndice") {
        return `${objCode}.findIndex(${args})`;
      }
      
      if (propName == "encontrarUltimo") {
        return `${objCode}.findLast(${args})`;
      }
      
      if (propName == "encontrarUltimoIndice") {
        return `${objCode}.findLastIndex(${args})`;
      }
      
      if (propName == "achatar") {
        return `${objCode}.flat(${args})`;
      }
      
      if (propName == "mapearAchatar") {
        return `${objCode}.flatMap(${args})`;
      }
      
      if (propName == "paraCada") {
        return `${objCode}.forEach(${args})`;
      }
      
      if (propName == "inclui") {
        return `${objCode}.includes(${args})`;
      }
      
      if (propName == "indiceDe") {
        return `${objCode}.indexOf(${args})`;
      }
      
      if (propName == "juntar") {
        return `${objCode}.join(${args})`;
      }
      
      if (propName == "ehArray") {
        return `Array.isArray(${args})`;
      }
      
      if (propName == "chaves") {
        return `${objCode}.keys(${args})`;
      }
      
      if (propName == "ultimoIndiceDe") {
        return `${objCode}.lastIndexOf(${args})`;
      }
      
      if (propName == "mapear") {
        return `${objCode}.map(${args})`;
      }
      
      if (propName == "deArgumentos") {
        return `Array.from(${args})`;
      }
      
      if (propName == "removerUltimo") {
        return `${objCode}.pop()`;
      }
      
      if (propName == "adicionarFinal") {
        return `${objCode}.push(${args})`;
      }
      
      if (propName == "reduzir") {
        return `${objCode}.reduce(${args})`;
      }
      
      if (propName == "reduzirDireita") {
        return `${objCode}.reduceRight(${args})`;
      }
      
      if (propName == "inverter") {
        return `${objCode}.reverse(${args})`;
      }
      
      if (propName == "removerPrimeiro") {
        return `${objCode}.shift(${args})`;
      }
      
      if (propName == "removerPrimeiro") {
        return `${objCode}.shift(${args})`;
      }
      
      if (propName == "fatiar") {
        return `${objCode}.slice(${args})`;
      }
      
      if (propName == "algum") {
        return `${objCode}.some(${args})`;
      }
      
      if (propName == "ordenar") {
        return `${objCode}.sort(${args})`;
      }
      
      if (propName == "emendar") {
        return `${objCode}.splice(${args})`;
      }
      
      if (propName == "paraInvertido") {
        return `${objCode}.toReversed(${args})`;
      }
      
      if (propName == "paraOrdenado") {
        return `${objCode}.toSorted(${args})`;
      }
      
      if (propName == "paraRecortado") {
        return `${objCode}.toSpliced(${args})`;
      }
      
      if (propName == "paraTexto") {
        return `${objCode}.toString(${args})`;
      }
      
      if (propName == "adicionarInicio") {
        return `${objCode}.unshift(${args})`;
      }
      
      if (propName == "valorDe") {
        return `${objCode}.valueOf(${args})`;
      }
      
      if (propName == "com") {
        return `${objCode}.with(${args})`;
      }
      
      // comportamento normal
      const callee = this._gen(node.callee);
      return `${callee}(${args})`;
    }
  
    // chamada comum
    const callee = this._gen(node.callee || node.calleeExpression || node.calleeNode);
    const args = (node.arguments || node.args || []).map(a => this._gen(a)).join(", ");
    return `${callee}(${args})`;
  }

  _genNewExpression(node) {
    const callee = this._gen(node.callee || node.calleeExpression || node.calleeNode);
    const args = (node.arguments || node.args || []).map(a => this._gen(a)).join(", ");
    return `new ${callee}(${args})`;
  }

  _genMemberExpression(node) {
    const obj = this._gen(node.object || node.callee || node.base || {});
    if (node.computed) {
      return `${obj}[${this._gen(node.property)}]`;
    }

    if (node.property && node.property.type === "PrivateIdentifier") {
      return `${obj}.#${node.property.name}`;
    }

    let propName = "";
    if (node.property) {
      if (node.property.type === "Identifier") propName = this._propertyMapping(node.property.name);
      else if (node.property.type === "Literal") propName = node.property.value;
      else propName = this._gen(node.property);
    }
    propName = this._propertyMapping(propName);

    if (node.optional) {
      return `${obj}?.${propName}`;
    }
    return `${obj}.${propName}`;
  }

  _genOptionalMemberExpression(node) {
    return this._genMemberExpression(node);
  }

  _genBinaryExpression(node) {
    const op = this._operatorMapping(node.operator || node.op);
    return `${this._gen(node.left)} ${op} ${this._gen(node.right)}`;
  }

  _genLogicalExpression(node) {
    return this._genBinaryExpression(node);
  }

  _genConditionalExpression(node) {
    return `${this._gen(node.test)} ? ${this._gen(node.consequent)} : ${this._gen(node.alternate)}`;
  }

  _genUnaryExpression(node) {
    const op = this._operatorMapping(node.operator || node.op);
    if (node.prefix === false) return `${this._gen(node.argument)} ${op}`;
    const needsSpace = /^[a-zA-Z]+$/.test(op);
    return node.prefix ? `${op}${needsSpace ? " " : ""}${this._gen(node.argument)}` : `${this._gen(node.argument)}${op}`;
  }

  _genUpdateExpression(node) {
    const arg = this._gen(node.argument);
    return node.prefix ? `${node.operator}${arg}` : `${arg}${node.operator}`;
  }

  _genAssignmentExpression(node) {
    return `${this._gen(node.left)} ${node.operator || "="} ${this._gen(node.right)}`;
  }

  _genArrayExpression(node) {
    const elements = (node.elements || node.elementsList || []).map(el => this._gen(el)).join(", ");
    return `[${elements}]`;
  }

  _genObjectExpression(node) {
    const props = (node.properties || node.propertiesList || []).map(p => this._gen(p)).join(", ");
    return `{${props}}`;
  }

  _genProperty(node) {
    let keyCode = "";
    if (node.key) {
      if (node.key.type === "Identifier") keyCode = node.key.name;
      else keyCode = this._gen(node.key);
    }
    const valueCode = this._gen(node.value || node.valueExpression || node.init);
    return `${keyCode}: ${valueCode}`;
  }

  _genSpreadElement(node) {
    return `...${this._gen(node.argument || node.expression)}`;
  }

  _genRestElement(node) {
    return `...${this._gen(node.argument || node.param)}`;
  }

  _genThisExpression() { return "this"; }
  _genSuper() { return "super"; }
  _genMetaProperty(node) {
    return `${node.meta.name}.${node.property.name}`;
  }

  _genSequenceExpression(node) {
    return (node.expressions || []).map(e => this._gen(e)).join(", ");
  }

  _genAwaitExpression(node) {
    return `await ${this._gen(node.argument || node.expression)}`;
  }

  _genYieldExpression(node) {
    const arg = node.argument ? ` ${this._gen(node.argument)}` : "";
    return `yield${arg}`;
  }

  _genTemplateElement(node) {
    return node.value && node.value.cooked ? node.value.cooked : (node.value && node.value.raw) || "";
  }

  /* =========================
     IMPORT / EXPORT
  ========================== */

  _genImportDeclaration(node) {
    const specifiers = (node.specifiers || []).map(s => {
      if (s.type === "ImportDefaultSpecifier") return this._gen(s.local || s.id);
      if (s.type === "ImportNamespaceSpecifier") return `* as ${this._gen(s.local || s.id)}`;
      if (s.type === "ImportSpecifier") {
        const imported = s.imported ? this._gen(s.imported) : this._gen(s.imported || s.id);
        const local = s.local ? this._gen(s.local) : imported;
        return imported === local ? imported : `${imported} as ${local}`;
      }
      return this._gen(s.local || s.id);
    }).join(", ");
    const source = node.source ? this._gen(node.source) : (node.sourceValue ? JSON.stringify(node.sourceValue) : "''");
    if (specifiers) return `import ${specifiers} from ${source};`;
    return `import ${source};`;
  }

  _genExportNamedDeclaration(node) {
    if (node.declaration) return `export ${this._gen(node.declaration)}`;
    const specs = (node.specifiers || []).map(s => this._gen(s)).join(", ");
    const src = node.source ? ` from ${this._gen(node.source)}` : "";
    return `export { ${specs} }${src};`;
  }

  _genExportDefaultDeclaration(node) {
    return `export default ${this._gen(node.declaration)};`;
  }

  _genImportExpression(node) {
    return `import(${this._gen(node.source)})`;
  }

  /* =========================
     MISC
  ========================== */

  _genIdentifierPattern(node) {
    return this._genIdentifier(node);
  }

  _genUnknown(node) {
    try {
      if (!node || typeof node !== "object") return String(node);
      if (node.expression) return this._gen(node.expression);
      if (node.declaration) return this._gen(node.declaration);
      if (node.body) return this._gen(node.body);
      if (node.left && node.right) return this._genBinaryExpression(node);
      if (node.callee) return this._genCallExpression(node);
    } catch (err) {}
    console.error("No generator for node (unknown):", node && node.type, node);
    throw new Error("No generator for node: " + (node && node.type));
  }
}