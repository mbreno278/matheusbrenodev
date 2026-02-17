class VJSExecutor {
  constructor(ast) {
    this.ast = ast;
    this.env = {}; // ambiente global de variáveis
  }

  run() {
    for (const stmt of this.ast.body) {
      this.execute(stmt);
    }
  }

  execute(node) {
    switch(node.type) {
      case "VariableDeclaration":
        for (const decl of node.declarations) {
          const name = decl.id.name;
          const value = decl.init ? this.evaluate(decl.init) : null;
          this.env[name] = value;
        }
        break;

      case "ExpressionStatement":
        this.evaluate(node.expression);
        break;

      case "IfStatement":
        if (this.evaluate(node.test)) {
          this.executeBlock(node.consequent);
        } else if (node.alternate) {
          this.executeBlock(node.alternate);
        }
        break;

      case "BlockStatement":
        this.executeBlock(node);
        break;

      case "ForStatement":
        this.executeFor(node);
        break;

      case "WhileStatement":
        this.executeWhile(node);
        break;

      default:
        console.warn("Nó não implementado:", node.type);
    }
  }

  executeBlock(block) {
    for (const stmt of block.body) this.execute(stmt);
  }

  executeFor(node) {
    if (node.init) this.execute(node.init);
    while (node.test ? this.evaluate(node.test) : true) {
      this.executeBlock(node.body);
      if (node.update) this.evaluate(node.update);
    }
  }

  executeWhile(node) {
    while (this.evaluate(node.test)) {
      this.executeBlock(node.body);
    }
  }

  evaluate(expr) {
    switch(expr.type) {
      case "Literal": return expr.value;
      case "Identifier": return this.env[expr.name] ?? null;
      case "UnaryExpression":
        const val = this.evaluate(expr.argument);
        switch(expr.operator) {
          case "BANG": return !val;
          case "MINUS": return -val;
          case "PLUS": return +val;
          default: return val;
        }
      case "BinaryExpression":
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch(expr.operator) {
          case "+": return left + right;
          case "-": return left - right;
          case "*": return left * right;
          case "/": return left / right;
          case "%": return left % right;
          case "**": return left ** right;
          case "==": return left == right;
          case "!=": return left != right;
          case "===": return left === right;
          case "!==": return left !== right;
          case ">": return left > right;
          case "<": return left < right;
          case ">=": return left >= right;
          case "<=": return left <= right;
          default: return null;
        }
      case "LogicalExpression":
        const l = this.evaluate(expr.left);
        if (expr.operator === "||" || expr.operator === "ou") return l || this.evaluate(expr.right);
        if (expr.operator === "&&" || expr.operator === "e") return l && this.evaluate(expr.right);
        break;
      case "AssignmentExpression":
        const valAssign = this.evaluate(expr.right);
        if (expr.left.type === "Identifier") this.env[expr.left.name] = valAssign;
        return valAssign;
      case "CallExpression":
        const fnName = expr.callee.name;
        const args = expr.arguments.map(a => this.evaluate(a));
        // built-in function: escreva()
        if (fnName === "escreva") { console.log(...args); return; }
        return null;
      default:
        console.warn("Expressão não implementada:", expr.type);
        return null;
    }
  }
}

// Attach
if (typeof window !== "undefined") { window.VJS = window.VJS || {}; window.VJS.VJSExecutor = VJSExecutor; }
if (typeof module !== "undefined") { module.exports = VJSExecutor; }