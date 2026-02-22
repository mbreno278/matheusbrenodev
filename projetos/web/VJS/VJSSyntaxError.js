export class VJSSyntaxError extends Error {
  constructor(message, line, column) {
    super(message);
    this.name = "VJSSyntaxError";
    this.line = line;
    this.column = column;
  }
}