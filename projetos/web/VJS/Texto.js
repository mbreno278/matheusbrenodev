
export class Texto {

  constructor(entrada = '') {
    this._valor = String(entrada ?? '');
  }
  
  get tamanho() {return this._valor.length;}

  // =============================
  // 🔹 Conversão e interoperabilidade
  // =============================

  toString() { return   this._valor; }
  paraString() { return   this._valor; }
  valor() { return this._valor; }
  valueOf() { return this._valor; }

  [Symbol.toPrimitive]() {
    return this._valor;
  }

  // =============================
  // 🔹 Métodos equivalentes ao String (Traduzidos)
  // =============================

  caractereNa(posicao) {
    return this._valor.charAt(posicao);
  }

  codigoDoCaractere(posicao) {
    return this._valor.charCodeAt(posicao);
  }

  concatenar(...partes) {
    return new Texto(
      this._valor.concat(...partes.map(p =>
        p instanceof Texto ? p.paraString() : String(p)
      ))
    );
  }

  contem(busca, posicao) {
    return this._valor.includes(
      busca instanceof Texto ? busca.paraString() : busca,
      posicao
    );
  }

  terminaCom(busca) {
    return this._valor.endsWith(
      busca instanceof Texto ? busca.paraString() : busca
    );
  }

  comecaCom(busca) {
    return this._valor.startsWith(
      busca instanceof Texto ? busca.paraString() : busca
    );
  }

  indiceDe(busca) {
    return this._valor.indexOf(
      busca instanceof Texto ? busca.paraString() : busca
    );
  }

  ultimoIndiceDe(busca) {
    return this._valor.lastIndexOf(
      busca instanceof Texto ? busca.paraString() : busca
    );
  }

  substituir(busca, novoValor) {
    return new Texto(
      this._valor.replace(
        busca instanceof Texto ? busca.paraString() : busca,
        novoValor instanceof Texto ? novoValor.paraString() : novoValor
      )
    );
  }

  substituirTodos(busca, novoValor) {
    return new Texto(
      this._valor.replaceAll(
        busca instanceof Texto ? busca.paraString() : busca,
        novoValor instanceof Texto ? novoValor.paraString() : novoValor
      )
    );
  }

  dividir(separador) {
    return this._valor.split(separador);
  }

  recortar(inicio, fim) {
    return new Texto(this._valor.slice(inicio, fim));
  }

  subTexto(inicio, fim) {
    return new Texto(this._valor.substring(inicio, fim));
  }

  paraMinusculo() {
    return new Texto(this._valor.toLowerCase());
  }

  paraMaiusculo() {
    return new Texto(this._valor.toUpperCase());
  }

  removerEspacos() {
    return new Texto(this._valor.trim());
  }

  removerEspacosInicio() {
    return new Texto(this._valor.trimStart());
  }

  removerEspacosFim() {
    return new Texto(this._valor.trimEnd());
  }

  repetir(quantidade) {
    return new Texto(this._valor.repeat(quantidade));
  }

  // =============================
  // 🔹 Métodos EXCLUSIVOS do VJS
  // =============================

  removerNumeros() {
    return new Texto(this._valor.replace(/\d+/g, ''));
  }

  contarPalavras() {
    const palavras = this._valor.match(/\p{L}[\p{L}'-]*/gu);
    return palavras ? palavras.length : 0;
  }

  contarLetras() {
    const letras = this._valor.match(/\p{L}/gu);
    return letras ? letras.length : 0;
  }

  contarFrases() {
    const frases = this._valor.match(/[^.!?]+[.!?]+/g) || [];
    const finalSemPontuacao = this._valor.trim().match(/[^.!?]+$/) ? 1 : 0;
    return frases.length + finalSemPontuacao;
  }

  capitalizarPalavras() {
    return new Texto(
      this._valor.replace(/\p{L}[\p{L}\p{M}'’-]*/gu, palavra =>
        palavra.charAt(0).toUpperCase() +
        palavra.slice(1).toLowerCase()
      )
    );
  }

  removerAcentos() {
    return new Texto(
      this._valor
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
    );
  }

  inverter() {
    return new Texto(
      Array.from(this._valor).reverse().join('')
    );
  }

  ehPalindromo() {
    const limpo = this._valor
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^\p{L}\p{N}]/gu, '')
      .toLowerCase();

    return limpo === Array.from(limpo).reverse().join('');
  }

  contarOcorrencias(textoBusca) {
    const busca = textoBusca instanceof Texto
      ? textoBusca.paraString()
      : String(textoBusca);

    if (!busca) return 0;

    let contador = 0;
    let pos = this._valor.indexOf(busca);

    while (pos !== -1) {
      contador++;
      pos = this._valor.indexOf(busca, pos + busca.length);
    }

    return contador;
  }

  removerPontuacao() {
    return new Texto(
      this._valor.replace(/[^\p{L}\p{N}\s]/gu, '')
    );
  }

  normalizarEspacos() {
    return new Texto(
      this._valor.replace(/\s+/g, ' ').trim()
    );
  }

  paraCamelCase() {
    const partes = this.removerAcentos()
      .paraMinusculo()
      .paraString()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    return new Texto(
      partes[0] +
      partes.slice(1).map(p =>
        p.charAt(0).toUpperCase() + p.slice(1)
      ).join('')
    );
  }

  paraSnakeCase() {
    return new Texto(
      this.removerAcentos()
        .paraMinusculo()
        .paraString()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    );
  }

  paraKebabCase() {
    return new Texto(
      this.removerAcentos()
        .paraMinusculo()
        .paraString()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    );
  }

  abreviar(maximo = 100) {
    if (this._valor.length <= maximo) {
      return new Texto(this._valor);
    }

    return new Texto(
      this._valor.slice(0, maximo) + '...'
    );
  }

  somenteLetras() {
    return /^[\p{L}]+$/u.test(this._valor);
  }

  somenteNumeros() {
    return /^\d+$/u.test(this._valor);
  }

  static criar(entrada) {
    return new Texto(entrada);
  }
}