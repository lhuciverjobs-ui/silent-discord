/**
 * Safe math expression evaluator — recursive descent parser.
 * No eval(). No dependencies. Handles + - * / ^ ( ) % and basic functions.
 */

// --- Lexer ---

class Token {
  constructor(type, value, pos) {
    this.type = type;
    this.value = value;
    this.pos = pos;
  }
}

const TOK = {
  NUMBER: 'NUM',
  PLUS: 'PLUS',
  MINUS: 'MIN',
  STAR: 'STAR',
  SLASH: 'SLASH',
  CARET: 'CART',
  LPAREN: 'LPAR',
  RPAREN: 'RPAR',
  PERCENT: 'PERC',
  IDENT: 'IDEN',
  COMMA: 'COMM',
  EOF: 'EOF',
};

function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ' || ch === '\t') { i++; continue; }

    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = '';
      while (i < input.length && (input[i] >= '0' && input[i] <= '9' || input[i] === '.')) {
        num += input[i];
        i++;
      }
      tokens.push(new Token(TOK.NUMBER, parseFloat(num), i));
      continue;
    }

    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let ident = '';
      while (i < input.length && ((input[i] >= 'a' && input[i] <= 'z') || (input[i] >= 'A' && input[i] <= 'Z') || (input[i] >= '0' && input[i] <= '9') || input[i] === '_')) {
        ident += input[i];
        i++;
      }
      tokens.push(new Token(TOK.IDENT, ident.toLowerCase(), i));
      continue;
    }

    if (ch === '+') { tokens.push(new Token(TOK.PLUS, '+', i)); i++; continue; }
    if (ch === '-') { tokens.push(new Token(TOK.MINUS, '-', i)); i++; continue; }
    if (ch === '*') { tokens.push(new Token(TOK.STAR, '*', i)); i++; continue; }
    if (ch === '/') { tokens.push(new Token(TOK.SLASH, '/', i)); i++; continue; }
    if (ch === '^') { tokens.push(new Token(TOK.CARET, '^', i)); i++; continue; }
    if (ch === '(') { tokens.push(new Token(TOK.LPAREN, '(', i)); i++; continue; }
    if (ch === ')') { tokens.push(new Token(TOK.RPAREN, ')', i)); i++; continue; }
    if (ch === '%') { tokens.push(new Token(TOK.PERCENT, '%', i)); i++; continue; }
    if (ch === ',') { tokens.push(new Token(TOK.COMMA, ',', i)); i++; continue; }

    // Invalid character
    return null;
  }

  tokens.push(new Token(TOK.EOF, null, i));
  return tokens;
}

// --- Parser ---

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  next() { return this.tokens[this.pos++]; }

  expect(type) {
    const tok = this.next();
    if (tok.type !== type) throw new Error('unexpected token');
    return tok;
  }

  // expression = term (('+'|'-') term)*
  parseExpr() {
    let left = this.parseTerm();
    while (this.peek().type === TOK.PLUS || this.peek().type === TOK.MINUS) {
      const op = this.next().value;
      const right = this.parseTerm();
      if (op === '+') left += right;
      else left -= right;
    }
    return left;
  }

  // term = factor (('*'|'/') factor)*
  parseTerm() {
    let left = this.parseFactor();
    while (this.peek().type === TOK.STAR || this.peek().type === TOK.SLASH) {
      const op = this.next().value;
      const right = this.parseFactor();
      if (op === '*') left *= right;
      else left /= right;
    }
    return left;
  }

  // factor = unary ('^' unary)? | percent
  parseFactor() {
    let base = this.parseUnary();
    if (this.peek().type === TOK.CARET) {
      this.next();
      const exp = this.parseUnary();
      base = Math.pow(base, exp);
    }
    if (this.peek().type === TOK.PERCENT) {
      this.next();
      base = base / 100;
    }
    return base;
  }

  // unary = ('+'|'-')? primary
  parseUnary() {
    const tok = this.peek();
    if (tok.type === TOK.PLUS) { this.next(); return this.parsePrimary(); }
    if (tok.type === TOK.MINUS) { this.next(); return -this.parsePrimary(); }
    return this.parsePrimary();
  }

  // primary = NUMBER | '(' expression ')' | IDENT '(' args ')'
  parsePrimary() {
    const tok = this.peek();

    if (tok.type === TOK.NUMBER) {
      this.next();
      return tok.value;
    }

    if (tok.type === TOK.LPAREN) {
      this.next();
      const val = this.parseExpr();
      this.expect(TOK.RPAREN);
      return val;
    }

    if (tok.type === TOK.IDENT) {
      const name = this.next().value;
      this.expect(TOK.LPAREN);
      const args = [];
      if (this.peek().type !== TOK.RPAREN) {
        args.push(this.parseExpr());
        while (this.peek().type === TOK.COMMA) {
          this.next();
          args.push(this.parseExpr());
        }
      }
      this.expect(TOK.RPAREN);
      return this.callFunction(name, args);
    }

    throw new Error('unexpected token');
  }

  callFunction(name, args) {
    switch (name) {
      case 'sqrt':
        if (args.length !== 1) throw new Error('sqrt requires 1 arg');
        if (args[0] < 0) throw new Error('sqrt of negative');
        return Math.sqrt(args[0]);
      case 'abs':
        if (args.length !== 1) throw new Error('abs requires 1 arg');
        return Math.abs(args[0]);
      case 'round':
        if (args.length === 1) return Math.round(args[0]);
        if (args.length === 2) {
          const factor = Math.pow(10, Math.floor(args[1]));
          return Math.round(args[0] * factor) / factor;
        }
        throw new Error('round requires 1-2 args');
      case 'floor':
        if (args.length !== 1) throw new Error('floor requires 1 arg');
        return Math.floor(args[0]);
      case 'ceil':
        if (args.length !== 1) throw new Error('ceil requires 1 arg');
        return Math.ceil(args[0]);
      case 'min':
        if (args.length < 2) throw new Error('min requires 2+ args');
        return Math.min(...args);
      case 'max':
        if (args.length < 2) throw new Error('max requires 2+ args');
        return Math.max(...args);
      default:
        throw new Error(`unknown function: ${name}`);
    }
  }
}

// --- Public API ---

const MATH_EXPR_RE = /^(?![=+\-*/^%]*(?:$|[+\-*/^%]))[0-9+\-*/()^%.a-zA-Z,\s]+$/;

function isMathExpression(input) {
  if (!input || input.length > 200) return false;
  const trimmed = input.trim();
  // Must look like a math expression: start with digit/paren/ident/minus
  if (!/^[\d(\-a-zA-Z]/.test(trimmed)) return false;
  // Only allowed characters
  if (!MATH_EXPR_RE.test(trimmed)) return false;
  // Must contain at least one operator or function call
  if (!/[+\-*/^%]/.test(trimmed) && !/[a-zA-Z]/.test(trimmed)) return false;
  // Must have at least one digit
  if (!/\d/.test(trimmed)) return false;
  return true;
}

function evaluate(input) {
  const tokens = tokenize(input.trim());
  if (!tokens) return { ok: false, error: 'Karakter ilegal dalam ekspresi' };
  try {
    const parser = new Parser(tokens);
    const result = parser.parseExpr();
    if (parser.peek().type !== TOK.EOF) {
      return { ok: false, error: 'Ekspresi tidak lengkap' };
    }
    return { ok: true, value: result };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function formatNumber(n) {
  if (!isFinite(n)) return 'Tak terdefinisi';
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString('id-ID');
  // For floats, show up to 10 significant digits but strip trailing zeros
  const s = parseFloat(n.toPrecision(10)).toString();
  return s;
}

module.exports = { isMathExpression, evaluate, formatNumber };
