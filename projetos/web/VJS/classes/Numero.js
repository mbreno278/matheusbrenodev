// Implementação sugerida: VJS.Numero
// Aceita Number e BigInt internamente. Retorna instâncias de VJS.Numero em operações.

export class Numero {
  constructor(x = 0) {
    if (x instanceof Numero) {
      this._value = x._value;
      this._isBig = x._isBig;
    } else if (typeof x === 'bigint') {
      this._value = x;
      this._isBig = true;
    } else if (typeof x === 'number') {
      this._value = x;
      this._isBig = false;
    } else if (typeof x === 'string') {
      // tenta detectar base (0x, 0b) e bigint se tiver "n" suffix
      const s = x.trim();
      if (/^[+-]?\d+n$/.test(s)) {
        this._value = BigInt(s.replace(/n$/,''));
        this._isBig = true;
      } else if (/^0x/i.test(s)) {
        this._value = Number.parseInt(s, 16);
        this._isBig = false;
      } else if (/^0b/i.test(s)) {
        this._value = Number.parseInt(s, 2);
        this._isBig = false;
      } else if (/^\d+$/.test(s) && s.length > 15) {
        // muito longo -> BigInt presumido
        try { this._value = BigInt(s); this._isBig = true; }
        catch { this._value = Number(s); this._isBig = false; }
      } else {
        const n = Number(s);
        this._value = Number.isNaN(n) ? NaN : n;
        this._isBig = false;
      }
    } else {
      // fallback
      const n = Number(x);
      this._value = Number.isNaN(n) ? NaN : n;
      this._isBig = false;
    }
  }
  
      // --- Helpers internos ---
      _toNumber() {
        return this._isBig ? Number(this._value) : this._value;
      }
      _coerceOther(other) {
        if (!(other instanceof Numero)) return new Numero(other);
        return other;
      }
      _wrap(v, isBig=false) {
        const n = Object.create(Numero.prototype);
        n._value = v;
        n._isBig = !!isBig;
        return n;
      }
  
      // --- Valores e conversões ---
      valueOf(){ return this._toNumber(); } // permite operações JS automáticas
      toNumber(){ return this._toNumber(); }
      toBigInt(){
        if (this._isBig) return this._value;
        if (!Number.isFinite(this._value)) throw new TypeError("Não é conversível pra BigInt");
        return BigInt(Math.trunc(this._value));
      }
      toString(){ return this._isBig ? this._value.toString() : String(this._value); }
      toFixed(d) { return this._isBig ? this._value.toString() : this._value.toFixed(d); }
      toPrecision(p) { return this._isBig ? this._value.toString() : this._value.toPrecision(p); }
      toExponential(p) { return this._isBig ? this._value.toString() : this._value.toExponential(p); }
  
      // integração com Texto (se existir VJS.Texto)
      toTexto(){
        if (global.VJS && global.VJS.Texto) return new global.VJS.Texto(this.toString());
        return this.toString();
      }
  
      isBigInt(){ return !!this._isBig; }
      isNaN(){ return !this._isBig && Number.isNaN(this._value); }
      isFinite(){ return !this._isBig && Number.isFinite(this._value); }
      isInteger(){
        if (this._isBig) return true;
        return Number.isFinite(this._value) && Math.trunc(this._value) === this._value;
      }
  
      // --- constantes e estáticos ---
      static get PI(){ return Math.PI; }
      static get E(){ return Math.E; }
      static get NAN(){ return new Numero(NaN); }
      static get INFINITY(){ return new Numero(Infinity); }
      static get MAX_SAFE_INTEGER(){ return Number.MAX_SAFE_INTEGER; }
      static get MIN_SAFE_INTEGER(){ return Number.MIN_SAFE_INTEGER; }
  
      static parse(s, base = 10){
        if (typeof s !== 'string') return new Numero(s);
        if (base === 16) return new Numero(Number.parseInt(s,16));
        if (base === 2) return new Numero(Number.parseInt(s,2));
        if (base === 10) {
          if (/^\s*[+-]?\d+n\s*$/.test(s)) return new Numero(BigInt(s.replace(/n/,'')));
          const n = Number(s);
          return new Numero(n);
        }
        return new Numero(Number.parseInt(s, base));
      }
  
      static fromHex(s){ return Numero.parse(s, 16); }
      static fromBinary(s){ return Numero.parse(s, 2); }
  
      toHex(){ return this._isBig ? this._value.toString(16) : this._value.toString(16); }
      toBinary(){ return this._isBig ? this._value.toString(2) : (this.isInteger() ? this._value.toString(2) : (this._value>>>0).toString(2)); }
      toOctal(){ return this._isBig ? this._value.toString(8) : this._value.toString(8); }
  
      // --- Operações aritméticas ---
      _binaryOp(other, numFn, bigFn){
        other = this._coerceOther(other);
        if (this._isBig || other._isBig) {
          try {
            const a = this._isBig ? this._value : BigInt(Math.trunc(this._value));
            const b = other._isBig ? other._value : BigInt(Math.trunc(other._value));
            return this._wrap(bigFn(a,b), true);
          } catch(e) {
            // fallback para float
            return this._wrap(numFn(this._toNumber(), other._toNumber()), false);
          }
        }
        return this._wrap(numFn(this._value, other._value), false);
      }
  
      add(other){ return this._binaryOp(other, (a,b)=>a+b, (a,b)=>a+b); }
      sub(other){ return this._binaryOp(other, (a,b)=>a-b, (a,b)=>a-b); }
      mul(other){ return this._binaryOp(other, (a,b)=>a*b, (a,b)=>a*b); }
      div(other){
        other = this._coerceOther(other);
        if (other._isBig) {
          // divisão BigInt -> fallback para float
          return this._wrap(this._toNumber() / other._toNumber(), false);
        }
        if (this._isBig) {
          // BigInt / Number -> fallback para float
          return this._wrap(this._toNumber() / other._toNumber(), false);
        }
        return this._wrap(this._value / other._value, false);
      }
      mod(other){ return this._binaryOp(other, (a,b)=>a%b, (a,b)=>a%b); }
      pow(other){ return this._binaryOp(other, (a,b)=>Math.pow(a,b), (a,b)=>{ 
          // BigInt exponentiation requires integer exponent
          if (typeof b === 'bigint') return a ** b;
          return BigInt(Math.pow(Number(a), Number(b)));
        }); 
      }
  
      neg(){ return this._isBig ? this._wrap(-this._value, true) : this._wrap(-this._value, false); }
      inc(){ return this.add(1); }
      dec(){ return this.sub(1); }
  
      // --- trunc/round/floor/ceil ---
      round(places=0){
        if (this._isBig) return this; // BigInt já é inteiro
        if (places === 0) return this._wrap(Math.round(this._value), false);
        const p = Math.pow(10, places);
        return this._wrap(Math.round(this._value * p) / p, false);
      }
      floor(){ return this._isBig ? this : this._wrap(Math.floor(this._value), false); }
      ceil(){ return this._isBig ? this : this._wrap(Math.ceil(this._value), false); }
      trunc(){ return this._isBig ? this : this._wrap(Math.trunc(this._value), false); }
  
      // --- math / trig / log ---
      abs(){ return this._isBig ? this._wrap(this._value < 0 ? -this._value : this._value, true) : this._wrap(Math.abs(this._value), false); }
      sqrt(){ return this._wrap(Math.sqrt(this._toNumber()), false); }
      cbrt(){ return this._wrap(Math.cbrt(this._toNumber()), false); }
      sin(){ return this._wrap(Math.sin(this._toNumber()), false); }
      cos(){ return this._wrap(Math.cos(this._toNumber()), false); }
      tan(){ return this._wrap(Math.tan(this._toNumber()), false); }
      asin(){ return this._wrap(Math.asin(this._toNumber()), false); }
      acos(){ return this._wrap(Math.acos(this._toNumber()), false); }
      atan(){ return this._wrap(Math.atan(this._toNumber()), false); }
      atan2(other){ other = this._coerceOther(other); return this._wrap(Math.atan2(this._toNumber(), other._toNumber()), false); }
      log(base=Math.E){ const val = Math.log(this._toNumber()); return this._wrap(base === Math.E ? val : val / Math.log(base), false); }
      log10(){ return this._wrap(Math.log10(this._toNumber()), false); }
      log2(){ return this._wrap(Math.log2(this._toNumber()), false); }
      exp(){ return this._wrap(Math.exp(this._toNumber()), false); }
  
      // --- clamp / between / map / lerp / approxEquals ---
      clamp(min, max){ min = new Numero(min); max = new Numero(max); return this._wrap(Math.min(max._toNumber(), Math.max(min._toNumber(), this._toNumber())), false); }
      between(a,b){ const lo = Math.min(new Numero(a)._toNumber(), new Numero(b)._toNumber()); const hi = Math.max(new Numero(a)._toNumber(), new Numero(b)._toNumber()); const v = this._toNumber(); return v >= lo && v <= hi; }
      map(inMin, inMax, outMin, outMax){
        const x = this._toNumber();
        return this._wrap(((x - inMin) * (outMax - outMin) / (inMax - inMin)) + outMin, false);
      }
      lerp(target, t){
        target = new Numero(target);
        t = new Numero(t);
        return this._wrap(this._toNumber() + (target._toNumber() - this._toNumber()) * t._toNumber(), false);
      }
      approxEquals(other, eps = 1e-12){
        other = this._coerceOther(other);
        return Math.abs(this._toNumber() - other._toNumber()) <= eps;
      }
  
      // --- integer utilities: gcd, lcm, bitLength, factorial, comb, isPrime ---
      gcd(other){
        other = this._coerceOther(other);
        // usar BigInt se possível
        if (this._isBig || other._isBig) {
          let a = this.toBigInt(); let b = other.toBigInt();
          a = a < 0n ? -a : a; b = b < 0n ? -b : b;
          while (b !== 0n) { const t = a % b; a = b; b = t; }
          return this._wrap(a, true);
        }
        // number path (trunc)
        let a = Math.abs(Math.trunc(this._value)), b = Math.abs(Math.trunc(other._value));
        while (b !== 0) { const t = a % b; a = b; b = t; }
        return this._wrap(a, false);
      }
  
      lcm(other){
        const g = this.gcd(other);
        // (a/g)*b
        const a = this._coerceOther(this);
        const b = this._coerceOther(other);
        if (g._isBig || a._isBig || b._isBig) {
          const bigA = a.toBigInt(); const bigB = b.toBigInt(); const bigG = g.toBigInt();
          return this._wrap((bigA / bigG) * bigB, true);
        }
        const val = Math.trunc(a._value / g._value * Math.trunc(b._value));
        return this._wrap(Math.abs(val), false);
      }
  
      bitLength(){
        if (this._isBig) {
          let v = this._value < 0n ? -this._value : this._value;
          let bits = 0;
          while (v > 0n) { v >>= 1n; bits++; }
          return bits;
        } else {
          if (!Number.isFinite(this._value)) return Infinity;
          const n = Math.trunc(Math.abs(this._value));
          return n === 0 ? 0 : Math.floor(Math.log2(n)) + 1;
        }
      }
  
      factorial(){
        // válido apenas para inteiros >= 0
        if (!this.isInteger() || this._toNumber() < 0) throw new RangeError("factorial: requer inteiro não-negativo");
        if (this._isBig) {
          let n = this.toBigInt();
          let res = 1n;
          for (let i = 1n; i <= n; i++) res *= i;
          return this._wrap(res, true);
        } else {
          let n = Math.trunc(this._value);
          if (n <= 170) { // beyond ~170 overflows Number
            let r = 1;
            for (let i = 2; i <= n; i++) r *= i;
            return this._wrap(r, false);
          }
          // tentar BigInt caminho
          let big = 1n;
          for (let i = 2n; i <= BigInt(n); i++) big *= i;
          return this._wrap(big, true);
        }
      }
  
      comb(k){
        // this.choose(k) => nCk
        const n = this;
        const kk = new Numero(k);
        if (!n.isInteger() || !kk.isInteger()) throw new RangeError("comb: n e k devem ser inteiros");
        const ni = n._isBig ? n.toBigInt() : BigInt(Math.trunc(n._value));
        const ki = kk._isBig ? kk.toBigInt() : BigInt(Math.trunc(kk._value));
        if (ki < 0n || ki > ni) return this._wrap(0n, true);
        // usar multiplicativo
        let ksmall = ki;
        if (ksmall > ni - ksmall) ksmall = ni - ksmall;
        let numer = 1n, denom = 1n;
        for (let i = 1n; i <= ksmall; i++) {
          numer *= (ni - (i - 1n));
          denom *= i;
        }
        const res = numer / denom;
        return this._wrap(res, true);
      }
  
      isPrime(){
        // só suportado para inteiros não-negativos
        if (!this.isInteger() || this._toNumber() < 2) return false;
        if (this._isBig) {
          let n = this.toBigInt();
          if (n % 2n === 0n) return n === 2n;
          for (let i = 3n; i * i <= n; i += 2n) {
            if (n % i === 0n) return false;
          }
          return true;
        } else {
          const n = Math.trunc(this._value);
          if (n % 2 === 0) return n === 2;
          const limit = Math.floor(Math.sqrt(n));
          for (let i = 3; i <= limit; i += 2) if (n % i === 0) return false;
          return true;
        }
      }
  
      nextPrime(){
        let n = this.isInteger() ? Math.trunc(this._toNumber()) + 1 : Math.ceil(this._toNumber());
        if (this._isBig) {
          let b = this.toBigInt() + 1n;
          while (true) {
            const cand = new Numero(b);
            if (cand.isPrime()) return cand;
            b += 1n;
          }
        } else {
          while (true) {
            const cand = new Numero(n);
            if (cand.isPrime()) return cand;
            n++;
          }
        }
      }
  
      // --- bytes / java-like conversion
      byteValue(){ return this._wrap((this._toNumber() & 0xFF) - ((this._toNumber() & 0x80) ? 0x100 : 0), false); }
      intValue(){ return this._wrap(Math.trunc(this._toNumber()), false); }
      longValue(){ // em JS, Number não tem long; usamos BigInt se possivel
        if (this._isBig) return this._wrap(this._value, true);
        return this._wrap(BigInt(Math.trunc(this._value)), true);
      }
      floatValue(){ return this._wrap(Number(this._toNumber()), false); }
      doubleValue(){ return this._wrap(Number(this._toNumber()), false); }
  
      // --- representação JSON compatível
      toJSON(){ return this._isBig ? this._value.toString() : this._value; }
  
  // --- Cole estes métodos dentro da sua classe Numero ---

  // clamp(min: Número, max: Número): Número
  clamp(min, max) {
    const n = Number(this._value);
    if (!Number.isFinite(n) || !Number.isFinite(min) || !Number.isFinite(max)) return new Numero(NaN);
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return new Numero(Math.min(Math.max(n, low), high));
  }
  
  // lerp(end: Número, t: Número): Número
  lerp(end, t = 0) {
    const n = Number(this._value);
    const e = Number(end);
    const tt = Number(t);
    if (![n, e, tt].every(Number.isFinite)) return new Numero(NaN);
    return new Numero(n + (e - n) * tt);
  }
  
  // mapRange(inMin, inMax, outMin, outMax, clamp=false): Número
  mapRange(inMin, inMax, outMin, outMax, clamp = false) {
    const x = Number(this._value);
    const a = Number(inMin), b = Number(inMax), c = Number(outMin), d = Number(outMax);
    if (![x, a, b, c, d].every(Number.isFinite)) return new Numero(NaN);
    if (a === b) return new Numero(NaN); // divisão por zero no mapeamento
    let t = (x - a) / (b - a);
    if (clamp) t = Math.min(1, Math.max(0, t));
    return new Numero(c + t * (d - c));
  }
  
  // roundTo(decimals: Número = 0): Número
  roundTo(decimals = 0) {
    const n = Number(this._value);
    const d = Math.trunc(Number(decimals));
    if (!Number.isFinite(n) || !Number.isFinite(d)) return new Numero(NaN);
    const mult = Math.pow(10, d);
    return new Numero(Math.round(n * mult) / mult);
  }
  
  // floorTo(decimals: Número = 0): Número
  floorTo(decimals = 0) {
    const n = Number(this._value);
    const d = Math.trunc(Number(decimals));
    if (!Number.isFinite(n) || !Number.isFinite(d)) return new Numero(NaN);
    const mult = Math.pow(10, d);
    return new Numero(Math.floor(n * mult) / mult);
  }
  
  // ceilTo(decimals: Número = 0): Número
  ceilTo(decimals = 0) {
    const n = Number(this._value);
    const d = Math.trunc(Number(decimals));
    if (!Number.isFinite(n) || !Number.isFinite(d)) return new Numero(NaN);
    const mult = Math.pow(10, d);
    return new Numero(Math.ceil(n * mult) / mult);
  }
  
  // isEven(): Boolean
  isEven() {
    const n = Number(this._value);
    return Number.isInteger(n) && (n % 2 === 0);
  }
  
  // isOdd(): Boolean
  isOdd() {
    const n = Number(this._value);
    return Number.isInteger(n) && (Math.abs(n % 2) === 1);
  }
  
  // gcd(other: Número): Número  -- Euclides (apenas para inteiros)
  gcd(other) {
    let a = Math.trunc(Math.abs(Number(this._value)));
    let b = Math.trunc(Math.abs(Number(other)));
    if (!Number.isFinite(a) || !Number.isFinite(b)) return new Numero(NaN);
    // Se ambos 0 -> 0
    if (a === 0 && b === 0) return new Numero(0);
    // Euclides
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return new Numero(a);
  }
  
  // lcm(other: Número): Número
  lcm(other) {
    const a0 = Math.trunc(Number(this._value));
    const b0 = Math.trunc(Number(other));
    if (![a0, b0].every(Number.isFinite)) return new Numero(NaN);
    const a = Math.abs(a0), b = Math.abs(b0);
    if (a === 0 || b === 0) return new Numero(0);
    const gcdVal = Number(this.gcd(b0).valueOf ? this.gcd(b0).valueOf() : this.gcd(b0));
    // evitar divisão por zero (já coberto), usar Math.abs para segurança
    const l = Math.abs((a / gcdVal) * b);
    return new Numero(l);
  }
  
  // isPrime(): Boolean (simples teste por divisão; adequa para inteiros razoáveis)
  isPrime() {
    const n = Math.trunc(Number(this._value));
    if (!Number.isFinite(n) || n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0) return false;
    const limit = Math.floor(Math.sqrt(n));
    for (let i = 3; i <= limit; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }
  
  // factorial(): Número  (para inteiros >= 0)
  factorial() {
    const n0 = Number(this._value);
    if (!Number.isFinite(n0)) return new Numero(NaN);
    const n = Math.trunc(n0);
    if (n < 0) return new Numero(NaN); // fatorial indefinido para negativos
    // calculo iterativo; pode resultar em Infinity para n grande
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
      // se virar Infinity, retornamos Infinity (comportamento natural do Number)
      if (!Number.isFinite(res)) break;
    }
    return new Numero(res);
  }
  
  // digits(): Número  (número de dígitos da parte inteira do valor absoluto)
  digits() {
    const v = Number(this._value);
    if (!Number.isFinite(v)) return new Numero(NaN);
    const absInt = Math.abs(Math.trunc(v));
    if (absInt === 0) return new Numero(1);
    const count = Math.floor(Math.log10(absInt)) + 1;
    return new Numero(count);
  }
  
  // toBinary(): Texto  (retorna string binária para inteiros seguros; caso contrário null)
  toBinary() {
    const n = Number(this._value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    if (Math.abs(n) > Number.MAX_SAFE_INTEGER) return null;
    if (n < 0) return '-' + Math.abs(n).toString(2);
    return n.toString(2);
  }
  
  // toHex(): Texto  (retorna string hex para inteiros seguros; caso contrário null)
  toHex() {
    const n = Number(this._value);
    if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
    if (Math.abs(n) > Number.MAX_SAFE_INTEGER) return null;
    if (n < 0) return '-' + Math.abs(n).toString(16);
    return n.toString(16);
  }
  
  // random(min = 0, max = this): Número
  random(min = 0, max = undefined) {
    const a = Number(min);
    const b = (typeof max === 'undefined') ? Number(this._value) : Number(max);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return new Numero(NaN);
    let low = Math.min(a, b), high = Math.max(a, b);
    if (low === high) return new Numero(low);
    const r = Math.random() * (high - low) + low;
    return new Numero(r);
  }
  
  static random(min = 0, max = 1) {
    const a = Number(min);
    const b = Number(max);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return new Numero(NaN);
    let low = Math.min(a, b), high = Math.max(a, b);
    if (low === high) return new Numero(low);
    const r = Math.random() * (high - low) + low;
    return new Numero(r);
  }
  
  // percentOf(total: Número): Número
  percentOf(total) {
    const t = Number(total);
    const n = Number(this._value);
    if (!Number.isFinite(n) || !Number.isFinite(t) || t === 0) return new Numero(NaN);
    return new Numero((n / t) * 100);
  }
  
  // clampPercent(): Número  (garante valor entre 0 e 100)
  clampPercent() {
    const n = Number(this._value);
    if (!Number.isFinite(n)) return new Numero(NaN);
    return new Numero(Math.min(100, Math.max(0, n)));
  }
  
  // sign(): Número  (-1, 0, 1) encapsulado em Numero
  sign() {
    const n = Number(this._value);
    if (!Number.isFinite(n)) return new Numero(NaN);
    const s = Math.sign(n);
    // Math.sign pode retornar -0; normalizamos para 0
    if (s === 0) return new Numero(0);
    return new Numero(s);
  }
    
}
