/*!
The MIT License (MIT)

Copyright (c) 2018-present, Yuxi (Evan) You

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
/**
* @vue/shared v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function hs(e) {
  const s = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) s[n] = 1;
  return (n) => n in s;
}
const se = {}, vt = [], Ue = () => {
}, pl = () => !1, qn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Mn = (e) => e.startsWith("onUpdate:"), de = Object.assign, ys = (e, s) => {
  const n = e.indexOf(s);
  n > -1 && e.splice(n, 1);
}, Ki = Object.prototype.hasOwnProperty, Y = (e, s) => Ki.call(e, s), V = Array.isArray, ot = (e) => Ot(e) === "[object Map]", kn = (e) => Ot(e) === "[object Set]", Vs = (e) => Ot(e) === "[object Date]", z = (e) => typeof e == "function", re = (e) => typeof e == "string", We = (e) => typeof e == "symbol", ee = (e) => e !== null && typeof e == "object", Cl = (e) => (ee(e) || z(e)) && z(e.then) && z(e.catch), xl = Object.prototype.toString, Ot = (e) => xl.call(e), Vi = (e) => Ot(e).slice(8, -1), wl = (e) => Ot(e) === "[object Object]", vs = (e) => re(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Rt = /* @__PURE__ */ hs(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Bi = 1e4, Ln = (e) => {
  let s = /* @__PURE__ */ Object.create(null), n = 0;
  return ((t) => {
    const i = s[t];
    return i !== void 0 ? i : (++n > Bi && (s = /* @__PURE__ */ Object.create(null), n = 1), s[t] = e(t));
  });
}, Ui = /-\w/g, pe = /* @__PURE__ */ Ln((e) => e.replace(Ui, (s) => s.slice(1).toUpperCase())), Wi = /\B([A-Z])/g, ct = /* @__PURE__ */ Ln(
  (e) => e.replace(Wi, "-$1").toLowerCase()
), jn = /* @__PURE__ */ Ln((e) => e.charAt(0).toUpperCase() + e.slice(1)), Bn = /* @__PURE__ */ Ln((e) => e ? `on${jn(e)}` : ""), Be = (e, s) => !Object.is(e, s), bn = (e, ...s) => {
  for (let n = 0; n < e.length; n++)
    e[n](...s);
}, Tl = (e, s, n, t = !1) => {
  Object.defineProperty(e, s, {
    configurable: !0,
    enumerable: !1,
    writable: t,
    value: n
  });
}, ks = (e) => {
  const s = parseFloat(e);
  return isNaN(s) ? e : s;
};
let Bs;
const Hn = () => Bs || (Bs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {});
function Z(e) {
  if (V(e)) {
    const s = {};
    for (let n = 0; n < e.length; n++) {
      const t = e[n], i = re(t) ? Qi(t) : Z(t);
      if (i)
        for (const c in i)
          s[c] = i[c];
    }
    return s;
  } else if (re(e) || ee(e))
    return e;
}
const zi = /;(?![^(]*\))/g, Xi = /:([^]+)/, Gi = /"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;
function Qi(e) {
  const s = {};
  return e.replace(Gi, (n) => n.startsWith("/*") ? "" : n).split(zi).forEach((n) => {
    if (n) {
      const t = n.split(Xi);
      t.length > 1 && (s[t[0].trim()] = t[1].trim());
    }
  }), s;
}
function x(e) {
  let s = "";
  if (re(e))
    s = e;
  else if (V(e))
    for (let n = 0; n < e.length; n++) {
      const t = x(e[n]);
      t && (s += t + " ");
    }
  else if (ee(e))
    for (const n in e)
      e[n] && (s += n + " ");
  return s.trim();
}
const Ji = "itemscope,allowfullscreen,disablepictureinpicture,disableremoteplayback,formnovalidate,ismap,nomodule,novalidate,playsinline,readonly", Yi = /* @__PURE__ */ hs(Ji);
function Sl(e) {
  return !!e || e === "";
}
function Zi(e, s, n) {
  if (e.length !== s.length) return !1;
  let t = !0;
  for (let i = 0; t && i < e.length; i++)
    t = Pn(e[i], s[i], n);
  return t;
}
function Us(e, s, n) {
  if (e.size !== s.size) return !1;
  const t = Array.from(s), i = new Uint8Array(t.length);
  for (const c of e) {
    let u = -1;
    for (let d = 0; d < t.length; d++)
      if (!i[d] && Pn(c, t[d], n)) {
        u = d;
        break;
      }
    if (u < 0) return !1;
    i[u] = 1;
  }
  return !0;
}
function _i(e, s, n) {
  let t = ot(e), i = ot(s);
  if (t || i || (t = kn(e), i = kn(s), t || i))
    return t && i ? Us(e, s, n) : !1;
  const c = Object.keys(e).length, u = Object.keys(s).length;
  if (c !== u)
    return !1;
  for (const d in e) {
    const m = Y(e, d), v = Y(s, d);
    if (m && !v || !m && v || !Pn(e[d], s[d], n))
      return !1;
  }
  return zs(e) === zs(s);
}
function Ws(e, s, n, t) {
  n || (n = [/* @__PURE__ */ new Map(), /* @__PURE__ */ new Map()]);
  const [i, c] = n;
  if (i.has(e) || c.has(s))
    return i.get(e) === s && c.get(s) === e;
  i.set(e, s), c.set(s, e);
  const u = t(e, s, n);
  return i.delete(e), c.delete(s), u;
}
function Pn(e, s, n) {
  if (e === s) return !0;
  let t = Vs(e), i = Vs(s);
  return t || i ? t && i ? e.getTime() === s.getTime() : !1 : (t = We(e), i = We(s), t || i ? e === s : (t = V(e), i = V(s), t || i ? t && i ? Ws(e, s, n, Zi) : !1 : (t = ee(e), i = ee(s), t || i ? !t || !i ? !1 : Ws(e, s, n, _i) : String(e) === String(s))));
}
function zs(e) {
  return Object.getPrototypeOf(e) === null && e[Symbol.toPrimitive] == null && typeof e.toString != "function" && typeof e.valueOf != "function" ? Ot(e) : String(e);
}
const Ol = (e) => !!(e && e.__v_isRef === !0), a = (e) => re(e) ? e : e == null ? "" : V(e) || ee(e) && (e.toString === xl || !z(e.toString)) ? Ol(e) ? a(e.value) : JSON.stringify(e, ql, 2) : String(e), ql = (e, s) => Ol(s) ? ql(e, s.value) : ot(s) ? {
  [`Map(${s.size})`]: [...s.entries()].reduce(
    (n, [t, i], c) => (n[Un(t, c) + " =>"] = i, n),
    {}
  )
} : kn(s) ? {
  [`Set(${s.size})`]: [...s.values()].map((n) => Un(n))
} : We(s) ? Un(s) : ee(s) && !V(s) && !wl(s) ? String(s) : s, Un = (e, s = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    We(e) ? `Symbol(${(n = e.description) != null ? n : s})` : e
  );
};
/**
* @vue/reactivity v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let fe;
class eo {
  // TODO isolatedDeclarations "__v_skip"
  constructor(s = !1) {
    this.detached = s, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !s && fe && (fe.active ? (this.parent = fe, this.index = (fe.scopes || (fe.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let s, n;
      if (this.scopes) {
        const t = this.scopes.slice();
        for (s = 0, n = t.length; s < n; s++)
          t[s].pause();
      }
      for (s = 0, n = this.effects.length; s < n; s++)
        this.effects[s].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let s, n;
      if (this.scopes) {
        const i = this.scopes.slice();
        for (s = 0, n = i.length; s < n; s++)
          i[s].resume();
      }
      const t = this.effects.slice();
      for (s = 0, n = t.length; s < n; s++)
        t[s].resume();
    }
  }
  run(s) {
    if (this._active) {
      const n = fe;
      try {
        return fe = this, s();
      } finally {
        fe = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = fe, fe = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (fe === this)
        fe = this.prevScope;
      else {
        let s = fe;
        for (; s; ) {
          if (s.prevScope === this) {
            s.prevScope = this.prevScope;
            break;
          }
          s = s.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(s) {
    if (this._active) {
      this._active = !1;
      let n, t;
      for (n = 0, t = this.effects.length; n < t; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, t = this.cleanups.length; n < t; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        const i = this.scopes.slice();
        for (n = 0, t = i.length; n < t; n++)
          i[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !s) {
        const i = this.parent.scopes.pop();
        i && i !== this && (this.parent.scopes[this.index] = i, i.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function to() {
  return fe;
}
let oe;
const Wn = /* @__PURE__ */ new WeakSet();
class Ml {
  constructor(s) {
    this.fn = s, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, fe && (fe.active ? fe.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Wn.has(this) && (Wn.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || jl(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Xs(this), Hl(this);
    const s = oe, n = Ee;
    oe = this, Ee = !0;
    try {
      return this.fn();
    } finally {
      Pl(this), oe = s, Ee = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let s = this.deps; s; s = s.nextDep)
        ps(s);
      this.deps = this.depsTail = void 0, Xs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Wn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    ls(this) && this.run();
  }
  get dirty() {
    return ls(this);
  }
}
let Ll = 0, It, Nt;
function jl(e, s = !1) {
  if (e.flags |= 8, s) {
    e.next = Nt, Nt = e;
    return;
  }
  e.next = It, It = e;
}
function gs() {
  Ll++;
}
function $s() {
  if (--Ll > 0)
    return;
  if (Nt) {
    let s = Nt;
    for (Nt = void 0; s; ) {
      const n = s.next;
      s.next = void 0, s.flags &= -9, s = n;
    }
  }
  let e;
  for (; It; ) {
    let s = It;
    for (It = void 0; s; ) {
      const n = s.next;
      if (s.next = void 0, s.flags &= -9, s.flags & 1)
        try {
          s.trigger();
        } catch (t) {
          e || (e = t);
        }
      s = n;
    }
  }
  if (e) throw e;
}
function Hl(e) {
  for (let s = e.deps; s; s = s.nextDep)
    s.version = -1, s.prevActiveLink = s.dep.activeLink, s.dep.activeLink = s;
}
function Pl(e) {
  let s, n = e.depsTail, t = n;
  for (; t; ) {
    const i = t.prevDep;
    t.version === -1 ? (t === n && (n = i), ps(t), no(t)) : s = t, t.dep.activeLink = t.prevActiveLink, t.prevActiveLink = void 0, t = i;
  }
  e.deps = s, e.depsTail = n;
}
function ls(e) {
  for (let s = e.deps; s; s = s.nextDep)
    if (s.dep.version !== s.version || s.dep.computed && (El(s.dep.computed) || s.dep.version !== s.version))
      return !0;
  return !!e._dirty;
}
function El(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Ut) || (e.globalVersion = Ut, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ls(e))))
    return;
  e.flags |= 2;
  const s = e.dep, n = oe, t = Ee;
  oe = e, Ee = !0;
  try {
    Hl(e);
    const i = e.fn(e._value);
    (s.version === 0 || Be(i, e._value)) && (e.flags |= 128, e._value = i, s.version++);
  } catch (i) {
    throw s.version++, i;
  } finally {
    oe = n, Ee = t, Pl(e), e.flags &= -3;
  }
}
function ps(e, s = !1) {
  const { dep: n, prevSub: t, nextSub: i } = e;
  if (t && (t.nextSub = i, e.prevSub = void 0), i && (i.prevSub = t, e.nextSub = void 0), n.subs === e && (n.subs = t, !t && n.computed)) {
    n.computed.flags &= -5;
    for (let c = n.computed.deps; c; c = c.nextDep)
      ps(c, !0);
  }
  !s && !--n.sc && n.map && n.map.delete(n.key);
}
function no(e) {
  const { prevDep: s, nextDep: n } = e;
  s && (s.nextDep = n, e.prevDep = void 0), n && (n.prevDep = s, e.nextDep = void 0);
}
let Ee = !0;
const Al = [];
function ze() {
  Al.push(Ee), Ee = !1;
}
function Xe() {
  const e = Al.pop();
  Ee = e === void 0 ? !0 : e;
}
function Xs(e) {
  const { cleanup: s } = e;
  if (e.cleanup = void 0, s) {
    const n = oe;
    oe = void 0;
    try {
      s();
    } finally {
      oe = n;
    }
  }
}
let Ut = 0;
class so {
  constructor(s, n) {
    this.sub = s, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Cs {
  // TODO isolatedDeclarations "__v_skip"
  constructor(s) {
    this.computed = s, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(s) {
    if (!oe || !Ee || oe === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== oe)
      n = this.activeLink = new so(oe, this), oe.deps ? (n.prevDep = oe.depsTail, oe.depsTail.nextDep = n, oe.depsTail = n) : oe.deps = oe.depsTail = n, Rl(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const t = n.nextDep;
      t.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = t), n.prevDep = oe.depsTail, n.nextDep = void 0, oe.depsTail.nextDep = n, oe.depsTail = n, oe.deps === n && (oe.deps = t);
    }
    return n;
  }
  trigger(s) {
    this.version++, Ut++, this.notify(s);
  }
  notify(s) {
    gs();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      $s();
    }
  }
}
function Rl(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const s = e.dep.computed;
    if (s && !e.dep.subs) {
      s.flags |= 20;
      for (let t = s.deps; t; t = t.nextDep)
        Rl(t);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const is = /* @__PURE__ */ new WeakMap(), kt = /* @__PURE__ */ Symbol(
  ""
), os = /* @__PURE__ */ Symbol(
  ""
), Wt = /* @__PURE__ */ Symbol(
  ""
);
function be(e, s, n) {
  if (Ee && oe) {
    let t = is.get(e);
    t || is.set(e, t = /* @__PURE__ */ new Map());
    let i = t.get(n);
    i || (t.set(n, i = new Cs()), i.map = t, i.key = n), i.track();
  }
}
function et(e, s, n, t, i, c) {
  const u = is.get(e);
  if (!u) {
    Ut++;
    return;
  }
  const d = (m) => {
    m && m.trigger();
  };
  if (gs(), s === "clear")
    u.forEach(d);
  else {
    const m = V(e), v = m && vs(n);
    if (m && n === "length") {
      const h = Number(t);
      u.forEach(($, q) => {
        (q === "length" || q === Wt || !We(q) && q >= h) && d($);
      });
    } else
      switch ((n !== void 0 || u.has(void 0)) && d(u.get(n)), v && d(u.get(Wt)), s) {
        case "add":
          m ? v && d(u.get("length")) : (d(u.get(kt)), ot(e) && d(u.get(os)));
          break;
        case "delete":
          m || (d(u.get(kt)), ot(e) && d(u.get(os)));
          break;
        case "set":
          ot(e) && d(u.get(kt));
          break;
      }
  }
  $s();
}
function $t(e) {
  const s = /* @__PURE__ */ _(e);
  return s === e || (be(s, "iterate", Wt), /* @__PURE__ */ qe(e)) ? s : /* @__PURE__ */ Ge(e) ? /* @__PURE__ */ at(e) ? s.map((n) => rt(Le(n))) : s.map(rt) : s.map(Le);
}
function En(e) {
  return be(e = /* @__PURE__ */ _(e), "iterate", Wt), e;
}
function Fe(e, s) {
  return /* @__PURE__ */ Ge(e) ? rt(/* @__PURE__ */ at(e) ? Le(s) : s) : Le(s);
}
const lo = {
  __proto__: null,
  [Symbol.iterator]() {
    return zn(this, Symbol.iterator, (e) => Fe(this, e));
  },
  concat(...e) {
    return $t(this).concat(
      ...e.map((s) => V(s) ? $t(s) : s)
    );
  },
  entries() {
    return zn(this, "entries", (e) => (e[1] = Fe(this, e[1]), e));
  },
  every(e, s) {
    return Ye(this, "every", e, s, void 0, arguments);
  },
  filter(e, s) {
    return Ye(
      this,
      "filter",
      e,
      s,
      (n) => n.map((t) => Fe(this, t)),
      arguments
    );
  },
  find(e, s) {
    return Ye(
      this,
      "find",
      e,
      s,
      (n) => Fe(this, n),
      arguments
    );
  },
  findIndex(e, s) {
    return Ye(this, "findIndex", e, s, void 0, arguments);
  },
  findLast(e, s) {
    return Ye(
      this,
      "findLast",
      e,
      s,
      (n) => Fe(this, n),
      arguments
    );
  },
  findLastIndex(e, s) {
    return Ye(this, "findLastIndex", e, s, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, s) {
    return Ye(this, "forEach", e, s, void 0, arguments);
  },
  includes(...e) {
    return Xn(this, "includes", e);
  },
  indexOf(...e) {
    return Xn(this, "indexOf", e);
  },
  join(e) {
    return $t(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Xn(this, "lastIndexOf", e);
  },
  map(e, s) {
    return Ye(this, "map", e, s, void 0, arguments);
  },
  pop() {
    return jt(this, "pop");
  },
  push(...e) {
    return jt(this, "push", e);
  },
  reduce(e, ...s) {
    return Qs(this, "reduce", e, s);
  },
  reduceRight(e, ...s) {
    return Qs(this, "reduceRight", e, s);
  },
  shift() {
    return jt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, s) {
    return Ye(this, "some", e, s, void 0, arguments);
  },
  splice(...e) {
    return jt(this, "splice", e);
  },
  toReversed() {
    return $t(this).toReversed();
  },
  toSorted(e) {
    return $t(this).toSorted(e);
  },
  toSpliced(...e) {
    return $t(this).toSpliced(...e);
  },
  unshift(...e) {
    return jt(this, "unshift", e);
  },
  values() {
    return zn(this, "values", (e) => Fe(this, e));
  }
};
function zn(e, s, n) {
  const t = En(e), i = t[s], c = i.call(t);
  if (t !== e && !/* @__PURE__ */ qe(e)) {
    if (c[Symbol.toStringTag] === "Array Iterator") {
      const u = Object.create(Object.getPrototypeOf(c));
      return u.next = () => Gs(c.next(), n), i !== Il[s] && Object.defineProperties(u, {
        return: {
          get() {
            const d = c.return;
            return typeof d == "function" ? d.bind(c) : d;
          }
        },
        throw: {
          get() {
            const d = c.throw;
            return typeof d == "function" ? d.bind(c) : d;
          }
        }
      }), u;
    }
    c._next = c.next, c.next = () => Gs(c._next(), n);
  }
  return c;
}
function Gs(e, s) {
  return e.done || (e.value = s(e.value)), e;
}
const Il = Array.prototype;
function Ye(e, s, n, t, i, c) {
  const u = En(e), d = u !== e && !/* @__PURE__ */ qe(e), m = u[s];
  if (m !== Il[s]) {
    const $ = m.apply(e, c);
    return d ? Le($) : $;
  }
  let v = n;
  u !== e && (d ? v = function($, q) {
    return n.call(this, Fe(e, $), q, e);
  } : n.length > 2 && (v = function($, q) {
    return n.call(this, $, q, e);
  }));
  const h = m.call(u, v, t);
  return d && i ? i(h) : h;
}
function Qs(e, s, n, t) {
  const i = En(e), c = i !== e && !/* @__PURE__ */ qe(e);
  let u = n, d = !1;
  i !== e && (c ? (d = t.length === 0, u = function(v, h, $) {
    return d && (d = !1, v = Fe(e, v)), n.call(this, v, Fe(e, h), $, e);
  }) : n.length > 3 && (u = function(v, h, $) {
    return n.call(this, v, h, $, e);
  }));
  const m = i[s](u, ...t);
  return d ? Fe(e, m) : m;
}
function Xn(e, s, n) {
  const t = /* @__PURE__ */ _(e);
  be(t, "iterate", Wt);
  const i = t[s](...n);
  return (i === -1 || i === !1) && /* @__PURE__ */ Ss(n[0]) ? (n[0] = /* @__PURE__ */ _(n[0]), t[s](...n)) : i;
}
function jt(e, s, n = []) {
  ze(), gs();
  const t = (/* @__PURE__ */ _(e))[s].apply(e, n);
  return $s(), Xe(), t;
}
const io = /* @__PURE__ */ hs("__proto__,__v_isRef,__isVue"), Nl = /* @__PURE__ */ new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(We)
);
function oo(e) {
  We(e) || (e = String(e));
  const s = /* @__PURE__ */ _(this);
  return be(s, "has", e), s.hasOwnProperty(e);
}
class Dl {
  constructor(s = !1, n = !1) {
    this._isReadonly = s, this._isShallow = n;
  }
  get(s, n, t) {
    if (n === "__v_skip") return s.__v_skip;
    const i = this._isReadonly, c = this._isShallow;
    if (n === "__v_isReactive")
      return !i;
    if (n === "__v_isReadonly")
      return i;
    if (n === "__v_isShallow")
      return c;
    if (n === "__v_raw")
      return t === (i ? c ? vo : Bl : c ? Vl : Kl).get(s) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(s) === Object.getPrototypeOf(t) ? s : void 0;
    const u = V(s);
    if (!i) {
      let m;
      if (u && (m = lo[n]))
        return m;
      if (n === "hasOwnProperty")
        return oo;
    }
    const d = Reflect.get(
      s,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ ye(s) ? s : t
    );
    if ((We(n) ? Nl.has(n) : io(n)) || (i || be(s, "get", n), c))
      return d;
    if (/* @__PURE__ */ ye(d)) {
      const m = u && vs(n) ? d : d.value;
      return i && ee(m) ? /* @__PURE__ */ rs(m) : m;
    }
    return ee(d) ? i ? /* @__PURE__ */ rs(d) : /* @__PURE__ */ ws(d) : d;
  }
}
class Fl extends Dl {
  constructor(s = !1) {
    super(!1, s);
  }
  set(s, n, t, i) {
    let c = s[n];
    const u = V(s) && vs(n);
    if (!this._isShallow) {
      const v = /* @__PURE__ */ Ge(c);
      if (!/* @__PURE__ */ qe(t) && !/* @__PURE__ */ Ge(t) && (c = /* @__PURE__ */ _(c), t = /* @__PURE__ */ _(t)), !u && /* @__PURE__ */ ye(c) && !/* @__PURE__ */ ye(t))
        return v || (c.value = t), !0;
    }
    const d = u ? Number(n) < s.length : Y(s, n), m = Reflect.set(
      s,
      n,
      t,
      /* @__PURE__ */ ye(s) ? s : i
    );
    return s === /* @__PURE__ */ _(i) && m && (d ? Be(t, c) && et(s, "set", n, t) : et(s, "add", n, t)), m;
  }
  deleteProperty(s, n) {
    const t = Y(s, n);
    s[n];
    const i = Reflect.deleteProperty(s, n);
    return i && t && et(s, "delete", n, void 0), i;
  }
  has(s, n) {
    const t = Reflect.has(s, n);
    return (!We(n) || !Nl.has(n)) && be(s, "has", n), t;
  }
  ownKeys(s) {
    return be(
      s,
      "iterate",
      V(s) ? "length" : kt
    ), Reflect.ownKeys(s);
  }
}
class ao extends Dl {
  constructor(s = !1) {
    super(!0, s);
  }
  set(s, n) {
    return !0;
  }
  deleteProperty(s, n) {
    return !0;
  }
}
const ro = /* @__PURE__ */ new Fl(), co = /* @__PURE__ */ new ao(), uo = /* @__PURE__ */ new Fl(!0);
const as = (e) => e, an = (e) => Reflect.getPrototypeOf(e);
function mo(e, s, n) {
  return function(...t) {
    const i = this.__v_raw, c = /* @__PURE__ */ _(i), u = ot(c), d = e === "entries" || e === Symbol.iterator && u, m = e === "keys" && u, v = i[e](...t), h = n ? as : s ? rt : Le;
    return !s && be(
      c,
      "iterate",
      m ? os : kt
    ), de(
      // inheriting all iterator properties
      Object.create(v),
      {
        // iterator protocol
        next() {
          const { value: $, done: q } = v.next();
          return q ? { value: $, done: q } : {
            value: d ? [h($[0]), h($[1])] : h($),
            done: q
          };
        }
      }
    );
  };
}
function rn(e) {
  return function(...s) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function fo(e, s) {
  const n = {
    get(i) {
      const c = this.__v_raw, u = /* @__PURE__ */ _(c), d = /* @__PURE__ */ _(i);
      e || (Be(i, d) && be(u, "get", i), be(u, "get", d));
      const { has: m } = an(u), v = s ? as : e ? rt : Le;
      if (m.call(u, i))
        return v(c.get(i));
      if (m.call(u, d))
        return v(c.get(d));
      c !== u && c.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return !e && be(/* @__PURE__ */ _(i), "iterate", kt), i.size;
    },
    has(i) {
      const c = this.__v_raw, u = /* @__PURE__ */ _(c), d = /* @__PURE__ */ _(i);
      return e || (Be(i, d) && be(u, "has", i), be(u, "has", d)), i === d ? c.has(i) : c.has(i) || c.has(d);
    },
    forEach(i, c) {
      const u = this, d = u.__v_raw, m = /* @__PURE__ */ _(d), v = s ? as : e ? rt : Le;
      return !e && be(m, "iterate", kt), d.forEach((h, $) => i.call(c, v(h), v($), u));
    }
  };
  return de(
    n,
    e ? {
      add: rn("add"),
      set: rn("set"),
      delete: rn("delete"),
      clear: rn("clear")
    } : {
      add(i) {
        const c = /* @__PURE__ */ _(this), u = an(c), d = /* @__PURE__ */ _(i), m = !s && !/* @__PURE__ */ qe(i) && !/* @__PURE__ */ Ge(i) ? d : i;
        return u.has.call(c, m) || Be(i, m) && u.has.call(c, i) || Be(d, m) && u.has.call(c, d) || (c.add(m), et(c, "add", m, m)), this;
      },
      set(i, c) {
        !s && !/* @__PURE__ */ qe(c) && !/* @__PURE__ */ Ge(c) && (c = /* @__PURE__ */ _(c));
        const u = /* @__PURE__ */ _(this), { has: d, get: m } = an(u);
        let v = d.call(u, i);
        v || (i = /* @__PURE__ */ _(i), v = d.call(u, i));
        const h = m.call(u, i);
        return u.set(i, c), v ? Be(c, h) && et(u, "set", i, c) : et(u, "add", i, c), this;
      },
      delete(i) {
        const c = /* @__PURE__ */ _(this), { has: u, get: d } = an(c);
        let m = u.call(c, i);
        m || (i = /* @__PURE__ */ _(i), m = u.call(c, i)), d && d.call(c, i);
        const v = c.delete(i);
        return m && et(c, "delete", i, void 0), v;
      },
      clear() {
        const i = /* @__PURE__ */ _(this), c = i.size !== 0, u = i.clear();
        return c && et(
          i,
          "clear",
          void 0,
          void 0
        ), u;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((i) => {
    n[i] = mo(i, e, s);
  }), n;
}
function xs(e, s) {
  const n = fo(e, s);
  return (t, i, c) => i === "__v_isReactive" ? !e : i === "__v_isReadonly" ? e : i === "__v_isShallow" ? s : i === "__v_raw" ? t : Reflect.get(
    Y(n, i) && i in t ? n : t,
    i,
    c
  );
}
const bo = {
  get: /* @__PURE__ */ xs(!1, !1)
}, ho = {
  get: /* @__PURE__ */ xs(!1, !0)
}, yo = {
  get: /* @__PURE__ */ xs(!0, !1)
};
const Kl = /* @__PURE__ */ new WeakMap(), Vl = /* @__PURE__ */ new WeakMap(), Bl = /* @__PURE__ */ new WeakMap(), vo = /* @__PURE__ */ new WeakMap();
function ko(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function ws(e) {
  return /* @__PURE__ */ Ge(e) ? e : Ts(
    e,
    !1,
    ro,
    bo,
    Kl
  );
}
// @__NO_SIDE_EFFECTS__
function Ul(e) {
  return Ts(
    e,
    !1,
    uo,
    ho,
    Vl
  );
}
// @__NO_SIDE_EFFECTS__
function rs(e) {
  return Ts(
    e,
    !0,
    co,
    yo,
    Bl
  );
}
function Ts(e, s, n, t, i) {
  if (!ee(e) || e.__v_raw && !(s && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const c = i.get(e);
  if (c)
    return c;
  const u = ko(Vi(e));
  if (u === 0)
    return e;
  const d = new Proxy(
    e,
    u === 2 ? t : n
  );
  return i.set(e, d), d;
}
// @__NO_SIDE_EFFECTS__
function at(e) {
  return /* @__PURE__ */ Ge(e) ? /* @__PURE__ */ at(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function Ge(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function qe(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function Ss(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function _(e) {
  const s = e && e.__v_raw;
  return s ? /* @__PURE__ */ _(s) : e;
}
function go(e) {
  return !Y(e, "__v_skip") && Object.isExtensible(e) && Tl(e, "__v_skip", !0), e;
}
const Le = (e) => ee(e) ? /* @__PURE__ */ ws(e) : e, rt = (e) => ee(e) ? /* @__PURE__ */ rs(e) : e;
// @__NO_SIDE_EFFECTS__
function ye(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function Me(e) {
  return Wl(e, !1);
}
// @__NO_SIDE_EFFECTS__
function $o(e) {
  return Wl(e, !0);
}
function Wl(e, s) {
  return /* @__PURE__ */ ye(e) ? e : new po(e, s);
}
class po {
  constructor(s, n) {
    this.dep = new Cs(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? s : /* @__PURE__ */ _(s), this._value = n ? s : Le(s), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(s) {
    const n = this._rawValue, t = this.__v_isShallow || /* @__PURE__ */ qe(s) || /* @__PURE__ */ Ge(s);
    s = t ? s : /* @__PURE__ */ _(s), Be(s, n) && (this._rawValue = s, this._value = t ? s : Le(s), this.dep.trigger());
  }
}
function Os(e) {
  return /* @__PURE__ */ ye(e) ? e.value : e;
}
const Co = {
  get: (e, s, n) => s === "__v_raw" ? e : Os(Reflect.get(e, s, n)),
  set: (e, s, n, t) => {
    const i = e[s];
    return /* @__PURE__ */ ye(i) && !/* @__PURE__ */ ye(n) ? (i.value = n, !0) : Reflect.set(e, s, n, t);
  }
};
function zl(e) {
  return /* @__PURE__ */ at(e) ? e : new Proxy(e, Co);
}
class xo {
  constructor(s, n, t) {
    this.fn = s, this.setter = n, this._value = void 0, this.dep = new Cs(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Ut - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = t;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    oe !== this)
      return jl(this, !0), !0;
  }
  get value() {
    const s = this.dep.track();
    return El(this), s && (s.version = this.dep.version), this._value;
  }
  set value(s) {
    this.setter && this.setter(s);
  }
}
// @__NO_SIDE_EFFECTS__
function wo(e, s, n = !1) {
  let t, i;
  return z(e) ? t = e : (t = e.get, i = e.set), new xo(t, i, n);
}
const cn = {}, gn = /* @__PURE__ */ new WeakMap();
let yt;
function To(e, s = !1, n = yt) {
  if (n) {
    let t = gn.get(n);
    t || gn.set(n, t = []), t.push(e);
  }
}
function So(e, s, n = se) {
  const { immediate: t, deep: i, once: c, scheduler: u, augmentJob: d, call: m } = n, v = (M) => i ? M : /* @__PURE__ */ qe(M) || i === !1 || i === 0 ? tt(M, 1) : tt(M);
  let h, $, q, j, W = !1, F = !1;
  if (/* @__PURE__ */ ye(e) ? ($ = () => e.value, W = /* @__PURE__ */ qe(e)) : /* @__PURE__ */ at(e) ? ($ = () => v(e), W = !0) : V(e) ? (F = !0, W = e.some((M) => /* @__PURE__ */ at(M) || /* @__PURE__ */ qe(M)), $ = () => e.map((M) => {
    if (/* @__PURE__ */ ye(M))
      return M.value;
    if (/* @__PURE__ */ at(M))
      return v(M);
    if (z(M))
      return m ? m(M, 2) : M();
  })) : z(e) ? s ? $ = m ? () => m(e, 2) : e : $ = () => {
    if (q) {
      ze();
      try {
        q();
      } finally {
        Xe();
      }
    }
    const M = yt;
    yt = h;
    try {
      return m ? m(e, 3, [j]) : e(j);
    } finally {
      yt = M;
    }
  } : $ = Ue, s && i) {
    const M = $, B = i === !0 ? 1 / 0 : i;
    $ = () => tt(M(), B);
  }
  const G = to(), X = () => {
    h.stop(), G && G.active && ys(G.effects, h);
  };
  if (c && s) {
    const M = s;
    s = (...B) => {
      try {
        return M(...B);
      } finally {
        X();
      }
    };
  }
  let H = F ? new Array(e.length).fill(cn) : cn;
  const L = (M) => {
    if (!(!(h.flags & 1) || !h.dirty && !M))
      if (s) {
        const B = h.run();
        if (M || i || W || (F ? B.some((Q, xe) => Be(Q, H[xe])) : Be(B, H))) {
          const Q = yt;
          ze();
          try {
            q && q(), yt = h;
            const xe = [
              B,
              // pass undefined as the old value when it's changed for the first time
              H === cn ? void 0 : F && H[0] === cn ? [] : H,
              j
            ];
            H = B, m ? m(s, 3, xe) : (
              // @ts-expect-error
              s(...xe)
            );
          } finally {
            yt = Q, Xe();
          }
        }
      } else
        h.run();
  };
  return d && d(L), h = new Ml($), h.scheduler = u ? () => u(L, !1) : L, j = (M) => To(M, !1, h), q = h.onStop = () => {
    const M = gn.get(h);
    if (M) {
      if (m)
        m(M, 4);
      else
        for (const B of M) B();
      gn.delete(h);
    }
  }, s ? t ? L(!0) : H = h.run() : u ? u(L.bind(null, !0), !0) : h.run(), X.pause = h.pause.bind(h), X.resume = h.resume.bind(h), X.stop = X, X;
}
function tt(e, s = 1 / 0, n) {
  if (s <= 0 || !ee(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= s))
    return e;
  if (n.set(e, s), s--, /* @__PURE__ */ ye(e))
    tt(e.value, s, n);
  else if (V(e))
    for (let t = 0; t < e.length; t++)
      tt(e[t], s, n);
  else if (kn(e) || ot(e))
    e.forEach((t) => {
      tt(t, s, n);
    });
  else if (wl(e)) {
    for (const t in e)
      tt(e[t], s, n);
    for (const t of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, t) && tt(e[t], s, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function _t(e, s, n, t) {
  try {
    return t ? e(...t) : e();
  } catch (i) {
    An(i, s, n);
  }
}
function Ae(e, s, n, t) {
  if (z(e)) {
    const i = _t(e, s, n, t);
    return i && Cl(i) && i.catch((c) => {
      An(c, s, n, void 0, !0);
    }), i;
  }
  if (V(e)) {
    const i = [];
    for (let c = 0; c < e.length; c++)
      i.push(Ae(e[c], s, n, t));
    return i;
  }
}
function An(e, s, n, t = !0, i = !1) {
  const c = s ? s.vnode : null, { errorHandler: u, throwUnhandledErrorInProduction: d } = s && s.appContext.config || se;
  if (s) {
    let m = s.parent;
    const v = s.proxy, h = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; m; ) {
      const $ = m.ec;
      if ($ && !m.isUnmounted && // Async failures may outlive stopped scopes whose unmount effects
      // are deferred or discarded by Suspense.
      (!i || m.scope.active)) {
        for (let q = 0; q < $.length; q++)
          if ($[q](e, v, h) === !1)
            return;
      }
      m = m.parent;
    }
    if (u) {
      ze(), _t(u, null, 10, [
        e,
        v,
        h
      ]), Xe();
      return;
    }
  }
  Oo(e, n, c, t, d);
}
function Oo(e, s, n, t = !0, i = !1) {
  if (i)
    throw e;
  console.error(e);
}
const $e = [];
let Pe = -1;
const Ke = [];
let it = null, Ct = 0;
const Xl = /* @__PURE__ */ Promise.resolve();
let $n = null;
function qo(e) {
  const s = $n || Xl;
  return e ? s.then(this ? e.bind(this) : e) : s;
}
function Mo(e) {
  let s = Pe + 1, n = $e.length;
  for (; s < n; ) {
    const t = s + n >>> 1, i = $e[t], c = zt(i);
    c < e || c === e && i.flags & 2 ? s = t + 1 : n = t;
  }
  return s;
}
function qs(e) {
  if (!(e.flags & 1)) {
    const s = zt(e), n = $e[$e.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && s >= zt(n) ? $e.push(e) : $e.splice(Mo(s), 0, e), e.flags |= 1, Gl();
  }
}
function Gl() {
  $n || ($n = Xl.then(Yl));
}
function Lo(e) {
  if (!V(e))
    it && e.id === -1 ? it.splice(Ct + 1, 0, e) : e.flags & 1 || (Ke.push(e), e.flags |= 1);
  else
    for (let s = 0; s < e.length; s++)
      Ke.push(e[s]);
  Gl();
}
function Ql(e, s, n, t = Pe + 1) {
  for (; t < $e.length; t++) {
    const i = $e[t];
    if (i && i.flags & 2) {
      if (e && i.id !== e.uid || s !== void 0 && !(i.id >= s))
        continue;
      $e.splice(t, 1), t = e ? t - 1 : Pe, i.flags & 4 && (i.flags &= -2), i(), i.flags & 4 || (i.flags &= -2);
    }
  }
}
function Jl(e, s, n = 0) {
  if (Ke.length) {
    let t = Ke, i = 0;
    if (s) {
      t = [];
      for (let u = 0; u < Ke.length; u++) {
        const d = Ke[u];
        (d.i !== void 0 ? !d.i || d.i.uid < n : s.has(d)) ? Ke[i++] = d : t.push(d);
      }
    }
    const c = [...new Set(t)].sort((u, d) => zt(u) - zt(d));
    if (Ke.length = i, it) {
      for (let u = 0; u < c.length; u++)
        it.push(c[u]);
      return;
    }
    for (it = c, Ct = 0; Ct < it.length; Ct++) {
      const u = it[Ct];
      u.flags & 4 && (u.flags &= -2), u.flags & 8 || u(), u.flags &= -2;
    }
    it = null, Ct = 0;
  }
}
let Gn = !1;
function jo(e, s) {
  if (Gn) {
    e();
    return;
  }
  const n = s === void 0 ? void 0 : new Set(Ke);
  e(), Gn = !0;
  try {
    Ql(void 0, s), Jl(void 0, n, s);
  } finally {
    Gn = !1;
  }
}
const zt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Yl(e) {
  try {
    for (Pe = 0; Pe < $e.length; Pe++) {
      const s = $e[Pe];
      s && !(s.flags & 8) && (s.flags & 4 && (s.flags &= -2), _t(
        s,
        s.i,
        s.i ? 15 : 14
      ), s.flags & 4 || (s.flags &= -2));
    }
  } finally {
    for (; Pe < $e.length; Pe++) {
      const s = $e[Pe];
      s && (s.flags &= -2);
    }
    Pe = -1, $e.length = 0, Jl(), $n = null, ($e.length || Ke.length) && Yl();
  }
}
let Te = null, Zl = null;
function pn(e) {
  const s = Te;
  return Te = e, Zl = e && e.type.__scopeId || null, s;
}
function _l(e, s = Te, n) {
  if (!s || e._n)
    return e;
  const t = (...i) => {
    t._d && wn(-1);
    const c = pn(s), u = gt.length;
    let d;
    try {
      d = e(...i);
    } finally {
      for (let m = gt.length; m > u; m--) wi();
      pn(c), t._d && wn(1);
    }
    return d;
  };
  return t._n = !0, t._c = !0, t._d = !0, t;
}
function nt(e, s) {
  if (Te === null)
    return e;
  const n = Fn(Te), t = e.dirs || (e.dirs = []);
  for (let i = 0; i < s.length; i++) {
    let [c, u, d, m = se] = s[i];
    c && (z(c) && (c = {
      mounted: c,
      updated: c
    }), c.deep && tt(u), t.push({
      dir: c,
      instance: n,
      value: u,
      oldValue: void 0,
      arg: d,
      modifiers: m
    }));
  }
  return e;
}
function ft(e, s, n, t) {
  let i = e;
  if (t === "beforeMount")
    e._mount = e;
  else if (t === "beforeUpdate") {
    const d = s && s._mount;
    d && (d._latest = e, e._mount = d);
  } else if (t === "mounted") {
    const d = e._latest;
    e._mount = e._latest = void 0, d && (i = d, d._mount = void 0);
  }
  const c = i.dirs, u = s && s.dirs;
  for (let d = 0; d < c.length; d++) {
    let m = c[d];
    u ? m.oldValue = u[d].value : t === "mounted" && m.oldValue !== void 0 && (m = de({}, m, { oldValue: void 0 }));
    let v = m.dir[t];
    v && (ze(), Ae(v, n, 8, [
      e.el,
      m,
      i,
      s
    ]), Xe());
  }
}
function Ho(e, s) {
  if (he) {
    let n = he.provides;
    const t = he.parent && he.parent.provides;
    t === n && (n = he.provides = Object.create(t)), n[e] = s;
  }
}
function hn(e, s, n = !1) {
  const t = qi();
  if (t || wt) {
    let i = wt ? wt._context.provides : t ? t.parent == null || t.ce ? t.vnode.appContext && t.vnode.appContext.provides : t.parent.provides : void 0;
    if (i && e in i)
      return i[e];
    if (arguments.length > 1)
      return n && z(s) ? s.call(t && t.proxy) : s;
  }
}
const Po = /* @__PURE__ */ Symbol.for("v-scx"), Eo = () => hn(Po);
function yn(e, s, n) {
  return ei(e, s, n);
}
function ei(e, s, n = se) {
  const { immediate: t, deep: i, flush: c, once: u } = n, d = de({}, n), m = s && t || !s && c !== "post";
  let v;
  if (Zt) {
    if (c === "sync") {
      const j = Eo();
      v = j.__watcherHandles || (j.__watcherHandles = []);
    } else if (!m) {
      const j = () => {
      };
      return j.stop = Ue, j.resume = Ue, j.pause = Ue, j;
    }
  }
  const h = he;
  d.call = (j, W, F) => Ae(j, h, W, F);
  let $ = !1;
  c === "post" ? d.scheduler = (j) => {
    j.i = h, ge(j, h && h.suspense);
  } : c !== "sync" && ($ = !0, d.scheduler = (j, W) => {
    W ? j() : qs(j);
  }), d.augmentJob = (j) => {
    s && (j.flags |= 4), $ && (j.flags |= 2, h && (j.id = h.uid, j.i = h));
  };
  const q = So(e, s, d);
  return Zt && (v ? v.push(q) : m && q()), q;
}
function Ao(e, s, n) {
  const t = this.proxy, i = re(e) ? e.includes(".") ? ti(t, e) : () => t[e] : e.bind(t, t);
  let c;
  z(s) ? c = s : (c = s.handler, n = s);
  const u = en(this), d = ei(i, c.bind(t), n);
  return u(), d;
}
function ti(e, s) {
  const n = s.split(".");
  return () => {
    let t = e;
    for (let i = 0; i < n.length && t; i++)
      t = t[n[i]];
    return t;
  };
}
const Ro = /* @__PURE__ */ Symbol("_vte"), Rn = (e) => e.__isTeleport, Qn = /* @__PURE__ */ Symbol("_leaveCb");
function Io(e) {
  let s = e[0];
  if (e.length > 1) {
    for (const n of e)
      if (n.type !== Re) {
        s = n;
        break;
      }
  }
  return s;
}
function ni(e) {
  if (!Ms(e))
    return Rn(e.type) && e.children ? Io(e.children) : e;
  if (e.component)
    return e.component.subTree;
  const { shapeFlag: s, children: n } = e;
  if (n) {
    if (s & 16)
      return n[0];
    if (s & 32 && z(n.default))
      return n.default();
  }
}
function Dt(e, s) {
  if (e.shapeFlag & 6 && e.component) {
    e.transition = s;
    const n = e.component.subTree;
    Dt(
      Rn(n.type) && ni(n) || n,
      s
    );
  } else if (e.shapeFlag & 128) {
    const n = e.suspense;
    if (n) {
      const t = n.isHydrating ? n.pendingBranch : n.activeBranch;
      t && Dt(t, s.clone(t));
    } else
      e.ssContent.transition = s.clone(e.ssContent), e.ssFallback.transition = s.clone(e.ssFallback);
  } else if (e.transition = s, e.type === f && V(e.children)) {
    const n = di(e.children, !1);
    n && Dt(n, s);
  }
}
function cs(e) {
  if (e.component)
    return cs(e.component.subTree);
  if (e.type === f) {
    const s = V(e.children) && di(e.children, !1);
    return s ? cs(s) : void 0;
  }
  if (e.type !== Re)
    return e;
}
function si(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function Xt(e) {
  const s = qi(), n = /* @__PURE__ */ $o(null);
  if (s) {
    const i = s.refs === se ? s.refs = {} : s.refs;
    Object.defineProperty(i, e, {
      enumerable: !0,
      get: () => n.value,
      set: (c) => n.value = c
    });
  }
  return n;
}
function Js(e, s) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, s)) && !n.configurable);
}
const Cn = /* @__PURE__ */ new WeakMap();
function Ft(e, s, n, t, i = !1) {
  if (V(e)) {
    e.forEach(
      (F, G) => Ft(
        F,
        s && (V(s) ? s[G] : s),
        n,
        t,
        i
      )
    );
    return;
  }
  if (Kt(t) && !i) {
    t.shapeFlag & 512 && t.type.__asyncResolved && t.component.subTree.component && Ft(e, s, n, t.component.subTree);
    return;
  }
  const c = t.shapeFlag & 4 ? Fn(t.component) : t.el, u = i ? null : c, { i: d, r: m } = e, v = s && s.r, h = d.refs === se ? d.refs = {} : d.refs, $ = d.setupState, q = /* @__PURE__ */ _($), j = $ === se ? pl : (F) => Js(h, F) ? !1 : Y(q, F), W = (F, G) => !(G && Js(h, G));
  if (v != null && v !== m) {
    if (Ys(s), re(v))
      h[v] = null, j(v) && ($[v] = null);
    else if (/* @__PURE__ */ ye(v)) {
      const F = s;
      W(v, F.k) && (v.value = null), F.k && (h[F.k] = null);
    }
  }
  if (z(m))
    _t(m, d, 12, [u, h]);
  else {
    const F = re(m), G = /* @__PURE__ */ ye(m);
    if (F || G) {
      const X = () => {
        if (e.f) {
          const H = F ? j(m) ? $[m] : h[m] : W() || !e.k ? m.value : h[e.k];
          if (i)
            V(H) && ys(H, c);
          else if (V(H))
            H.includes(c) || H.push(c);
          else if (F)
            h[m] = [c], j(m) && ($[m] = h[m]);
          else {
            const L = [c];
            W(m, e.k) && (m.value = L), e.k && (h[e.k] = L);
          }
        } else F ? (h[m] = u, j(m) && ($[m] = u)) : G && (W(m, e.k) && (m.value = u), e.k && (h[e.k] = u));
      };
      if (u) {
        const H = () => {
          X(), Cn.delete(e);
        };
        H.id = -1, Cn.set(e, H), ge(H, n);
      } else
        Ys(e), X();
    }
  }
}
function Ys(e) {
  const s = Cn.get(e);
  s && (s.flags |= 8, Cn.delete(e));
}
Hn().requestIdleCallback;
Hn().cancelIdleCallback;
const Kt = (e) => !!e.type.__asyncLoader, Ms = (e) => e.type.__isKeepAlive;
function No(e, s) {
  li(e, "a", s);
}
function Do(e, s) {
  li(e, "da", s);
}
function li(e, s, n = he) {
  const t = e.__wdc || (e.__wdc = () => {
    let i = n;
    for (; i; ) {
      if (i.isDeactivated)
        return;
      i = i.parent;
    }
    return e();
  });
  if (Gt(s, t, n), n) {
    let i = n.parent;
    for (; i && i.parent; )
      Ms(i.parent.vnode) && Fo(t, s, n, i), i = i.parent;
  }
}
function Fo(e, s, n, t) {
  const i = Gt(
    s,
    e,
    t,
    !0
    /* prepend */
  ), c = Gt(
    "um",
    () => ys(t[s], i),
    n
  );
  c.flags = 16;
}
function Gt(e, s, n = he, t = !1) {
  if (n) {
    const i = n[e] || (n[e] = []), c = s.__weh || (s.__weh = (...u) => {
      ze();
      const d = en(n), m = Ae(s, n, e, u);
      return d(), Xe(), m;
    });
    return t ? i.unshift(c) : i.push(c), c;
  }
}
const st = (e) => (s, n = he) => {
  (!Zt || e === "sp") && Gt(e, (...t) => s(...t), n);
}, Ko = st("bm"), In = st("m"), Vo = st(
  "bu"
), Bo = st("u"), Uo = st(
  "bum"
), ii = st("um"), Wo = st(
  "sp"
), zo = st("rtg"), Xo = st("rtc");
function Go(e, s = he) {
  Gt("ec", e, s);
}
const Qo = "components", oi = /* @__PURE__ */ Symbol.for("v-ndc");
function Jo(e) {
  return re(e) ? Yo(Qo, e, !1) || e : e || oi;
}
function Yo(e, s, n = !0, t = !1) {
  const i = Te || he;
  if (i) {
    const c = i.type;
    {
      const d = Aa(
        c,
        !1
      );
      if (d && (d === s || d === pe(s) || d === jn(pe(s))))
        return c;
    }
    const u = (
      // local registration
      // check instance[type] first which is resolved for options API
      Zs(i[e] || c[e], s) || // global registration
      Zs(i.appContext[e], s)
    );
    return !u && t ? c : u;
  }
}
function Zs(e, s) {
  return e && (e[s] || e[pe(s)] || e[jn(pe(s))]);
}
function g(e, s, n, t) {
  let i;
  const c = n, u = V(e);
  if (u || re(e)) {
    const d = u && /* @__PURE__ */ at(e);
    let m = !1, v = !1;
    d && (m = !/* @__PURE__ */ qe(e), v = /* @__PURE__ */ Ge(e), e = En(e)), i = new Array(e.length);
    for (let h = 0, $ = e.length; h < $; h++)
      i[h] = s(
        m ? v ? rt(Le(e[h])) : Le(e[h]) : e[h],
        h,
        void 0,
        c
      );
  } else if (typeof e == "number")
    if (!Number.isInteger(e) || e < 0)
      i = [];
    else {
      i = new Array(e);
      for (let d = 0; d < e; d++)
        i[d] = s(d + 1, d, void 0, c);
    }
  else if (ee(e))
    if (e[Symbol.iterator])
      i = Array.from(
        e,
        (d, m) => s(d, m, void 0, c)
      );
    else {
      const d = Object.keys(e);
      i = new Array(d.length);
      for (let m = 0, v = d.length; m < v; m++) {
        const h = d[m];
        i[m] = s(e[h], h, m, c);
      }
    }
  else
    i = [];
  return i;
}
const us = (e) => e ? Mi(e) ? Fn(e) : us(e.parent) : null, Vt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ de(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => us(e.parent),
    $root: (e) => us(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ri(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      qs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = qo.bind(e.proxy)),
    $watch: (e) => Ao.bind(e)
  })
), Jn = (e, s) => e !== se && !e.__isScriptSetup && Y(e, s), Zo = {
  get({ _: e }, s) {
    if (s === "__v_skip")
      return !0;
    const { ctx: n, setupState: t, data: i, props: c, accessCache: u, type: d, appContext: m } = e;
    if (s[0] !== "$") {
      const q = u[s];
      if (q !== void 0)
        switch (q) {
          case 1:
            return t[s];
          case 2:
            return i[s];
          case 4:
            return n[s];
          case 3:
            return c[s];
        }
      else {
        if (Jn(t, s))
          return u[s] = 1, t[s];
        if (i !== se && Y(i, s))
          return u[s] = 2, i[s];
        if (Y(c, s))
          return u[s] = 3, c[s];
        if (n !== se && Y(n, s))
          return u[s] = 4, n[s];
        ds && (u[s] = 0);
      }
    }
    const v = Vt[s];
    let h, $;
    if (v)
      return s === "$attrs" && be(e.attrs, "get", ""), v(e);
    if (
      // css module (injected by vue-loader)
      (h = d.__cssModules) && (h = h[s])
    )
      return h;
    if (n !== se && Y(n, s))
      return u[s] = 4, n[s];
    if (
      // global properties
      $ = m.config.globalProperties, Y($, s)
    )
      return $[s];
  },
  set({ _: e }, s, n) {
    const { data: t, setupState: i, ctx: c } = e;
    return Jn(i, s) ? (i[s] = n, !0) : t !== se && Y(t, s) ? (t[s] = n, !0) : Y(e.props, s) || s[0] === "$" && s.slice(1) in e ? !1 : (c[s] = n, !0);
  },
  has({
    _: { data: e, setupState: s, accessCache: n, ctx: t, appContext: i, props: c, type: u }
  }, d) {
    let m;
    return !!(n[d] || e !== se && d[0] !== "$" && Y(e, d) || Jn(s, d) || Y(c, d) || Y(t, d) || Y(Vt, d) || Y(i.config.globalProperties, d) || (m = u.__cssModules) && m[d]);
  },
  defineProperty(e, s, n) {
    return n.get != null ? e._.accessCache[s] = 0 : Y(n, "value") && this.set(e, s, n.value, null), Reflect.defineProperty(e, s, n);
  }
};
function _s(e) {
  return V(e) ? e.reduce(
    (s, n) => (s[n] = null, s),
    {}
  ) : e;
}
let ds = !0;
function _o(e) {
  const s = ri(e), n = e.proxy, t = e.ctx;
  ds = !1, s.beforeCreate && el(s.beforeCreate, e, "bc");
  const {
    // state
    data: i,
    computed: c,
    methods: u,
    watch: d,
    provide: m,
    inject: v,
    // lifecycle
    created: h,
    beforeMount: $,
    mounted: q,
    beforeUpdate: j,
    updated: W,
    activated: F,
    deactivated: G,
    beforeDestroy: X,
    beforeUnmount: H,
    destroyed: L,
    unmounted: M,
    render: B,
    renderTracked: Q,
    renderTriggered: xe,
    errorCaptured: lt,
    serverPrefetch: tn,
    // public API
    expose: ut,
    inheritAttrs: qt,
    // assets
    components: nn,
    directives: sn,
    filters: Vn
  } = s;
  if (v && ea(v, t, null), u)
    for (const ae in u) {
      const ie = u[ae];
      z(ie) && (t[ae] = ie.bind(n));
    }
  if (i) {
    const ae = i.call(n, n);
    ee(ae) && (e.data = /* @__PURE__ */ ws(ae));
  }
  if (ds = !0, c)
    for (const ae in c) {
      const ie = c[ae], dt = z(ie) ? ie.bind(n, n) : z(ie.get) ? ie.get.bind(n, n) : Ue, ln = !z(ie) && z(ie.set) ? ie.set.bind(n) : Ue, mt = ne({
        get: dt,
        set: ln
      });
      Object.defineProperty(t, ae, {
        enumerable: !0,
        configurable: !0,
        get: () => mt.value,
        set: (je) => mt.value = je
      });
    }
  if (d)
    for (const ae in d)
      ai(d[ae], t, n, ae);
  if (m) {
    const ae = z(m) ? m.call(n) : m;
    Reflect.ownKeys(ae).forEach((ie) => {
      Ho(ie, ae[ie]);
    });
  }
  h && el(h, e, "c");
  function ve(ae, ie) {
    V(ie) ? ie.forEach((dt) => ae(dt.bind(n))) : ie && ae(ie.bind(n));
  }
  if (ve(Ko, $), ve(In, q), ve(Vo, j), ve(Bo, W), ve(No, F), ve(Do, G), ve(Go, lt), ve(Xo, Q), ve(zo, xe), ve(Uo, H), ve(ii, M), ve(Wo, tn), V(ut))
    if (ut.length) {
      const ae = e.exposed || (e.exposed = {});
      ut.forEach((ie) => {
        Object.defineProperty(ae, ie, {
          get: () => n[ie],
          set: (dt) => n[ie] = dt,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  B && e.render === Ue && (e.render = B), qt != null && (e.inheritAttrs = qt), nn && (e.components = nn), sn && (e.directives = sn), tn && si(e);
}
function ea(e, s, n = Ue) {
  V(e) && (e = ms(e));
  for (const t in e) {
    const i = e[t];
    let c;
    ee(i) ? "default" in i ? c = hn(
      i.from || t,
      i.default,
      !0
    ) : c = hn(i.from || t) : c = hn(i), /* @__PURE__ */ ye(c) ? Object.defineProperty(s, t, {
      enumerable: !0,
      configurable: !0,
      get: () => c.value,
      set: (u) => c.value = u
    }) : s[t] = c;
  }
}
function el(e, s, n) {
  Ae(
    V(e) ? e.map((t) => t.bind(s.proxy)) : e.bind(s.proxy),
    s,
    n
  );
}
function ai(e, s, n, t) {
  let i = t.includes(".") ? ti(n, t) : () => n[t];
  if (re(e)) {
    const c = s[e];
    z(c) && yn(i, c);
  } else if (z(e))
    yn(i, e.bind(n));
  else if (ee(e))
    if (V(e))
      e.forEach((c) => ai(c, s, n, t));
    else {
      const c = z(e.handler) ? e.handler.bind(n) : s[e.handler];
      z(c) && yn(i, c, e);
    }
}
function ri(e) {
  const s = e.type, { mixins: n, extends: t } = s, {
    mixins: i,
    optionsCache: c,
    config: { optionMergeStrategies: u }
  } = e.appContext, d = c.get(s);
  let m;
  return d ? m = d : !i.length && !n && !t ? m = s : (m = {}, i.length && i.forEach(
    (v) => xn(m, v, u, !0)
  ), xn(m, s, u)), ee(s) && c.set(s, m), m;
}
function xn(e, s, n, t = !1) {
  const { mixins: i, extends: c } = s;
  c && xn(e, c, n, !0), i && i.forEach(
    (u) => xn(e, u, n, !0)
  );
  for (const u in s)
    if (!(t && u === "expose")) {
      const d = ta[u] || n && n[u];
      e[u] = d ? d(e[u], s[u]) : s[u];
    }
  return e;
}
const ta = {
  data: tl,
  props: nl,
  emits: nl,
  // objects
  methods: Et,
  computed: Et,
  // lifecycle
  beforeCreate: ke,
  created: ke,
  beforeMount: ke,
  mounted: ke,
  beforeUpdate: ke,
  updated: ke,
  beforeDestroy: ke,
  beforeUnmount: ke,
  destroyed: ke,
  unmounted: ke,
  activated: ke,
  deactivated: ke,
  errorCaptured: ke,
  serverPrefetch: ke,
  // assets
  components: Et,
  directives: Et,
  // watch
  watch: sa,
  // provide / inject
  provide: tl,
  inject: na
};
function tl(e, s) {
  return s ? e ? function() {
    return de(
      z(e) ? e.call(this, this) : e,
      z(s) ? s.call(this, this) : s
    );
  } : s : e;
}
function na(e, s) {
  return Et(ms(e), ms(s));
}
function ms(e) {
  if (V(e)) {
    const s = {};
    for (let n = 0; n < e.length; n++)
      s[e[n]] = e[n];
    return s;
  }
  return e;
}
function ke(e, s) {
  return e ? [...new Set([].concat(e, s))] : s;
}
function Et(e, s) {
  return e ? de(/* @__PURE__ */ Object.create(null), e, s) : s;
}
function nl(e, s) {
  return e ? V(e) && V(s) ? [.../* @__PURE__ */ new Set([...e, ...s])] : de(
    /* @__PURE__ */ Object.create(null),
    _s(e),
    _s(s ?? {})
  ) : s;
}
function sa(e, s) {
  if (!e) return s;
  if (!s) return e;
  const n = de(/* @__PURE__ */ Object.create(null), e);
  for (const t in s)
    n[t] = ke(e[t], s[t]);
  return n;
}
function ci() {
  return {
    app: null,
    config: {
      isNativeTag: pl,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let la = 0;
function ia(e, s) {
  return function(t, i = null) {
    z(t) || (t = de({}, t)), i != null && !ee(i) && (i = null);
    const c = ci(), u = /* @__PURE__ */ new WeakSet(), d = [];
    let m = !1;
    const v = c.app = {
      _uid: la++,
      _component: t,
      _props: i,
      _container: null,
      _context: c,
      _instance: null,
      version: Na,
      get config() {
        return c.config;
      },
      set config(h) {
      },
      use(h, ...$) {
        return u.has(h) || (h && z(h.install) ? (u.add(h), h.install(v, ...$)) : z(h) && (u.add(h), h(v, ...$))), v;
      },
      mixin(h) {
        return c.mixins.includes(h) || c.mixins.push(h), v;
      },
      component(h, $) {
        return $ ? (c.components[h] = $, v) : c.components[h];
      },
      directive(h, $) {
        return $ ? (c.directives[h] = $, v) : c.directives[h];
      },
      mount(h, $, q) {
        if (!m) {
          const j = v._ceVNode || N(t, i);
          return j.appContext = c, q === !0 ? q = "svg" : q === !1 && (q = void 0), e(j, h, q), m = !0, v._container = h, h.__vue_app__ = v, Fn(j.component);
        }
      },
      onUnmount(h) {
        d.push(h);
      },
      unmount() {
        m && (Ae(
          d,
          v._instance,
          16
        ), e(null, v._container), delete v._container.__vue_app__);
      },
      provide(h, $) {
        return c.provides[h] = $, v;
      },
      runWithContext(h) {
        const $ = wt;
        wt = v;
        try {
          return h();
        } finally {
          wt = $;
        }
      }
    };
    return v;
  };
}
let wt = null;
const oa = (e, s) => s === "modelValue" || s === "model-value" ? e.modelModifiers : e[`${s}Modifiers`] || e[`${pe(s)}Modifiers`] || e[`${ct(s)}Modifiers`];
function aa(e, s, ...n) {
  if (e.isUnmounted) return;
  const t = e.vnode.props || se;
  let i = n;
  const c = s.startsWith("update:"), u = c && oa(t, s.slice(7));
  u && (u.trim && (i = n.map((h) => re(h) ? h.trim() : h)), u.number && (i = i.map(ks)));
  let d, m = t[d = Bn(s)] || // also try camelCase event handler (#2249)
  t[d = Bn(pe(s))];
  !m && c && (m = t[d = Bn(ct(s))]), m && Ae(
    m,
    e,
    6,
    i
  );
  const v = t[d + "Once"];
  if (v) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[d])
      return;
    e.emitted[d] = !0, Ae(
      v,
      e,
      6,
      i
    );
  }
}
const ra = /* @__PURE__ */ new WeakMap();
function ui(e, s, n = !1) {
  const t = n ? ra : s.emitsCache, i = t.get(e);
  if (i !== void 0)
    return i;
  const c = e.emits;
  let u = {}, d = !1;
  if (!z(e)) {
    const m = (v) => {
      const h = ui(v, s, !0);
      h && (d = !0, de(u, h));
    };
    !n && s.mixins.length && s.mixins.forEach(m), e.extends && m(e.extends), e.mixins && e.mixins.forEach(m);
  }
  return !c && !d ? (ee(e) && t.set(e, null), null) : (V(c) ? c.forEach((m) => u[m] = null) : de(u, c), ee(e) && t.set(e, u), u);
}
function Nn(e, s) {
  return !e || !qn(s) ? !1 : (s = s.slice(2), s = s === "Once" ? s : s.replace(/Once$/, ""), Y(e, s[0].toLowerCase() + s.slice(1)) || Y(e, ct(s)) || Y(e, s));
}
function sl(e) {
  const {
    type: s,
    vnode: n,
    proxy: t,
    withProxy: i,
    propsOptions: [c],
    slots: u,
    attrs: d,
    emit: m,
    render: v,
    renderCache: h,
    props: $,
    data: q,
    setupState: j,
    ctx: W,
    inheritAttrs: F
  } = e, G = pn(e);
  let X, H;
  try {
    if (n.shapeFlag & 4) {
      const M = i || t, B = M;
      X = Ve(
        v.call(
          B,
          M,
          h,
          $,
          j,
          q,
          W
        )
      ), H = d;
    } else {
      const M = s;
      X = Ve(
        M.length > 1 ? M(
          $,
          { attrs: d, slots: u, emit: m }
        ) : M(
          $,
          null
        )
      ), H = s.props ? d : ca(d);
    }
  } catch (M) {
    gt.length = 0, An(M, e, 1), X = N(Re);
  }
  let L = X;
  if (H && F !== !1) {
    const M = Object.keys(H), { shapeFlag: B } = L;
    M.length && B & 7 && (c && M.some(Mn) && (H = ua(
      H,
      c
    )), L = St(L, H, !1, !0));
  }
  if (n.dirs && (L = St(L, null, !1, !0), L.dirs = L.dirs ? L.dirs.concat(n.dirs) : n.dirs), n.transition) {
    const M = Rn(L.type) && ni(L) || L;
    Dt(M, n.transition);
  }
  return X = L, pn(G), X;
}
function di(e, s = !0) {
  let n;
  for (let t = 0; t < e.length; t++) {
    const i = e[t];
    if (Jt(i)) {
      if (i.type !== Re || i.children === "v-if") {
        if (n)
          return;
        n = i;
      }
    } else
      return;
  }
  return n;
}
const ca = (e) => {
  let s;
  for (const n in e)
    (n === "class" || n === "style" || qn(n)) && ((s || (s = {}))[n] = e[n]);
  return s;
}, ua = (e, s) => {
  const n = {};
  for (const t in e)
    (!Mn(t) || !(t.slice(9) in s)) && (n[t] = e[t]);
  return n;
};
function da(e, s, n) {
  const { props: t, children: i, component: c } = e, { props: u, children: d, patchFlag: m } = s, v = c.emitsOptions;
  if (s.dirs || s.transition)
    return !0;
  if (n && m >= 0) {
    if (m & 1024)
      return !0;
    if (m & 16)
      return t ? ll(t, u, v) : !!u;
    if (m & 8) {
      const h = s.dynamicProps;
      for (let $ = 0; $ < h.length; $++) {
        const q = h[$];
        if (mi(u, t, q) && !Nn(v, q))
          return !0;
      }
    }
  } else
    return (i || d) && (!d || !d.$stable) ? !0 : t === u ? !1 : t ? u ? ll(t, u, v) : !0 : !!u;
  return !1;
}
function ll(e, s, n) {
  const t = Object.keys(s);
  if (t.length !== Object.keys(e).length)
    return !0;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (!Y(e, c) || mi(s, e, c) && !Nn(n, c))
      return !0;
  }
  return !1;
}
function mi(e, s, n) {
  const t = e[n], i = s[n];
  return n === "style" && ee(t) && ee(i) ? !Pn(t, i) : t !== i;
}
function ma({ vnode: e, parent: s, suspense: n }, t) {
  for (; s; ) {
    const i = s.subTree;
    if (i.suspense && i.suspense.activeBranch === e && (i.suspense.vnode.el = i.el = t, e = i), i === e)
      (e = s.vnode).el = t, s = s.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = t);
}
const fi = {}, bi = () => Object.create(fi), hi = (e) => Object.getPrototypeOf(e) === fi;
function fa(e, s, n, t = !1) {
  const i = {}, c = bi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), yi(e, s, i, c);
  for (const u in e.propsOptions[0])
    u in i || (i[u] = void 0);
  n ? e.props = t ? i : /* @__PURE__ */ Ul(i) : e.type.props ? e.props = i : e.props = c, e.attrs = c;
}
function ba(e, s, n, t) {
  const {
    props: i,
    attrs: c,
    vnode: { patchFlag: u }
  } = e, d = /* @__PURE__ */ _(i), [m] = e.propsOptions;
  let v = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (t || u > 0) && !(u & 16)
  ) {
    if (u & 8) {
      const h = e.vnode.dynamicProps;
      for (let $ = 0; $ < h.length; $++) {
        let q = h[$];
        if (Nn(e.emitsOptions, q))
          continue;
        const j = s[q];
        if (m)
          if (Y(c, q))
            j !== c[q] && (c[q] = j, v = !0);
          else {
            const W = pe(q);
            i[W] = fs(
              m,
              d,
              W,
              j,
              e,
              !1
            );
          }
        else
          j !== c[q] && (c[q] = j, v = !0);
      }
    }
  } else {
    yi(e, s, i, c) && (v = !0);
    let h;
    for (const $ in d)
      (!s || // for camelCase
      !Y(s, $) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((h = ct($)) === $ || !Y(s, h))) && (m ? n && // for camelCase
      (n[$] !== void 0 || // for kebab-case
      n[h] !== void 0) && (i[$] = fs(
        m,
        d,
        $,
        void 0,
        e,
        !0
      )) : delete i[$]);
    if (c !== d)
      for (const $ in c)
        (!s || !Y(s, $)) && (delete c[$], v = !0);
  }
  v && et(e.attrs, "set", "");
}
function yi(e, s, n, t) {
  const [i, c] = e.propsOptions;
  let u = !1, d;
  if (s)
    for (let m in s) {
      if (Rt(m))
        continue;
      const v = s[m];
      let h;
      i && Y(i, h = pe(m)) ? !c || !c.includes(h) ? n[h] = v : (d || (d = {}))[h] = v : Nn(e.emitsOptions, m) || (!(m in t) || v !== t[m]) && (t[m] = v, u = !0);
    }
  if (c) {
    const m = /* @__PURE__ */ _(n), v = d || se;
    for (let h = 0; h < c.length; h++) {
      const $ = c[h];
      n[$] = fs(
        i,
        m,
        $,
        v[$],
        e,
        !Y(v, $)
      );
    }
  }
  return u;
}
function fs(e, s, n, t, i, c) {
  const u = e[n];
  if (u != null) {
    const d = Y(u, "default");
    if (d && t === void 0) {
      const m = u.default;
      if (u.type !== Function && !u.skipFactory && z(m)) {
        const { propsDefaults: v } = i;
        if (n in v)
          t = v[n];
        else {
          const h = en(i);
          t = v[n] = m.call(
            null,
            s
          ), h();
        }
      } else
        t = m;
      i.ce && i.ce._setProp(n, t);
    }
    u[
      0
      /* shouldCast */
    ] && (c && !d ? t = !1 : u[
      1
      /* shouldCastTrue */
    ] && (t === "" || t === ct(n)) && (t = !0));
  }
  return t;
}
const ha = /* @__PURE__ */ new WeakMap();
function vi(e, s, n = !1) {
  const t = n ? ha : s.propsCache, i = t.get(e);
  if (i)
    return i;
  const c = e.props, u = {}, d = [];
  let m = !1;
  if (!z(e)) {
    const h = ($) => {
      m = !0;
      const [q, j] = vi($, s, !0);
      de(u, q), j && d.push(...j);
    };
    !n && s.mixins.length && s.mixins.forEach(h), e.extends && h(e.extends), e.mixins && e.mixins.forEach(h);
  }
  if (!c && !m)
    return ee(e) && t.set(e, vt), vt;
  if (V(c))
    for (let h = 0; h < c.length; h++) {
      const $ = pe(c[h]);
      il($) && (u[$] = se);
    }
  else if (c)
    for (const h in c) {
      const $ = pe(h);
      if (il($)) {
        const q = c[h], j = u[$] = V(q) || z(q) ? { type: q } : de({}, q), W = j.type;
        let F = !1, G = !0;
        if (V(W))
          for (let X = 0; X < W.length; ++X) {
            const H = W[X], L = z(H) && H.name;
            if (L === "Boolean") {
              F = !0;
              break;
            } else L === "String" && (G = !1);
          }
        else
          F = z(W) && W.name === "Boolean";
        j[
          0
          /* shouldCast */
        ] = F, j[
          1
          /* shouldCastTrue */
        ] = G, (F || Y(j, "default")) && d.push($);
      }
    }
  const v = [u, d];
  return ee(e) && t.set(e, v), v;
}
function il(e) {
  return e[0] !== "$" && !Rt(e);
}
const Ls = (e) => e === "_" || e === "_ctx" || e === "$stable", js = (e) => V(e) ? e.map(Ve) : [Ve(e)], ya = (e, s, n) => {
  if (s._n)
    return s;
  const t = _l((...i) => js(s(...i)), n);
  return t._c = !1, t;
}, ki = (e, s, n) => {
  const t = e._ctx;
  for (const i in e) {
    if (Ls(i)) continue;
    const c = e[i];
    if (z(c))
      s[i] = ya(i, c, t);
    else if (c != null) {
      const u = js(c);
      s[i] = () => u;
    }
  }
}, gi = (e, s) => {
  const n = js(s);
  e.slots.default = () => n;
}, $i = (e, s, n) => {
  for (const t in s)
    (n || !Ls(t)) && (e[t] = s[t]);
}, va = (e, s, n) => {
  const t = e.slots = bi();
  if (e.vnode.shapeFlag & 32) {
    const i = s._;
    i ? ($i(t, s, n), n && Tl(t, "_", i, !0)) : ki(s, t);
  } else s && gi(e, s);
}, ka = (e, s, n) => {
  const { vnode: t, slots: i } = e;
  let c = !0, u = se;
  if (t.shapeFlag & 32) {
    const d = s._;
    d ? n && d === 1 ? c = !1 : $i(i, s, n) : (c = !s.$stable, ki(s, i)), u = s;
  } else s && (gi(e, s), u = { default: 1 });
  if (c)
    for (const d in i)
      !Ls(d) && u[d] == null && delete i[d];
}, ge = wa;
function ga(e) {
  return $a(e);
}
function $a(e, s) {
  const n = Hn();
  n.__VUE__ = !0;
  const {
    insert: t,
    remove: i,
    patchProp: c,
    createElement: u,
    createText: d,
    createComment: m,
    setText: v,
    setElementText: h,
    parentNode: $,
    nextSibling: q,
    setScopeId: j = Ue,
    insertStaticContent: W
  } = e, F = (b, y, C, O = null, w = null, S = null, A = void 0, E = null, P = !!y.dynamicChildren) => {
    if (b === y)
      return;
    b && !Ht(b, y) && (O = on(b), je(b, w, S, !0), b = null), y.patchFlag === -2 && (P = !1, y.dynamicChildren = null), y.dynamicChildren && b && b.dynamicChildren && b.dynamicChildren.hasOnce && (y.dynamicChildren === vt && (y.dynamicChildren = []), y.dynamicChildren.hasOnce = !0);
    const { type: T, ref: D, shapeFlag: R } = y;
    switch (T) {
      case Dn:
        G(b, y, C, O);
        break;
      case Re:
        X(b, y, C, O);
        break;
      case Zn:
        b == null && H(y, C, O, A);
        break;
      case f:
        nn(
          b,
          y,
          C,
          O,
          w,
          S,
          A,
          E,
          P
        );
        break;
      default:
        R & 1 ? B(
          b,
          y,
          C,
          O,
          w,
          S,
          A,
          E,
          P
        ) : R & 6 ? sn(
          b,
          y,
          C,
          O,
          w,
          S,
          A,
          E,
          P
        ) : (R & 64 || R & 128) && T.process(
          b,
          y,
          C,
          O,
          w,
          S,
          A,
          E,
          P,
          Lt
        );
    }
    D != null && w ? Ft(D, b && b.ref, S, y || b, !y) : D == null && b && b.ref != null && Ft(b.ref, null, S, b, !0);
  }, G = (b, y, C, O) => {
    if (b == null)
      t(
        y.el = d(y.children),
        C,
        O
      );
    else {
      const w = y.el = b.el;
      y.children !== b.children && v(w, y.children);
    }
  }, X = (b, y, C, O) => {
    b == null ? t(
      y.el = m(y.children || ""),
      C,
      O
    ) : y.el = b.el;
  }, H = (b, y, C, O) => {
    [b.el, b.anchor] = W(
      b.children,
      y,
      C,
      O,
      b.el,
      b.anchor
    );
  }, L = ({ el: b, anchor: y }, C, O) => {
    let w;
    for (; b && b !== y; )
      w = q(b), t(b, C, O), b = w;
    t(y, C, O);
  }, M = ({ el: b, anchor: y }) => {
    let C;
    for (; b && b !== y; )
      C = q(b), i(b), b = C;
    i(y);
  }, B = (b, y, C, O, w, S, A, E, P) => {
    if (y.type === "svg" ? A = "svg" : y.type === "math" && (A = "mathml"), b == null)
      Q(
        y,
        C,
        O,
        w,
        S,
        A,
        E,
        P
      );
    else {
      const T = b.el && b.el._isVueCE ? b.el : null;
      try {
        T && T._beginPatch(), tn(
          b,
          y,
          w,
          S,
          A,
          E,
          P
        );
      } finally {
        T && T._endPatch();
      }
    }
  }, Q = (b, y, C, O, w, S, A, E) => {
    let P, T;
    const { props: D, shapeFlag: R, transition: K, dirs: U } = b;
    if (P = b.el = u(
      b.type,
      S,
      D && D.is,
      D
    ), R & 8 ? h(P, b.children) : R & 16 && lt(
      b.children,
      P,
      null,
      O,
      w,
      Yn(b, S),
      A,
      E
    ), U && ft(b, null, O, "created"), xe(P, b, b.scopeId, A, O), D) {
      for (const le in D)
        le !== "value" && !Rt(le) && c(P, le, null, D[le], S, O);
      "value" in D && c(P, "value", null, D.value, S), (T = D.onVnodeBeforeMount) && De(T, O, b);
    }
    U && ft(b, null, O, "beforeMount");
    const J = pa(w, K);
    J ? K.beforeEnter(P) : K && !K.persisted && (P[xa] = !0), t(P, y, C), ((T = D && D.onVnodeMounted) || J || U) && ge(() => {
      T && De(T, O, b), J && K.enter(P), U && ft(b, null, O, "mounted");
    }, w);
  }, xe = (b, y, C, O, w) => {
    if (C && j(b, C), O)
      for (let S = 0; S < O.length; S++)
        j(b, O[S]);
    if (w) {
      let S = w.subTree;
      if (y === S || xi(S.type) && (S.ssContent === y || S.ssFallback === y)) {
        const A = w.vnode;
        xe(
          b,
          A,
          A.scopeId,
          A.slotScopeIds,
          w.parent
        );
      }
    }
  }, lt = (b, y, C, O, w, S, A, E, P = 0) => {
    for (let T = P; T < b.length; T++) {
      const D = b[T] = E ? _e(b[T]) : Ve(b[T]);
      F(
        null,
        D,
        y,
        C,
        O,
        w,
        S,
        A,
        E
      );
    }
  }, tn = (b, y, C, O, w, S, A) => {
    const E = y.el = b.el;
    let { patchFlag: P, dynamicChildren: T, dirs: D } = y;
    P |= b.patchFlag & 16;
    const R = b.props || se, K = y.props || se;
    let U;
    if (C && bt(C, !1), (U = K.onVnodeBeforeUpdate) && De(U, C, y, b), D && ft(y, b, C, "beforeUpdate"), C && bt(C, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    T && (!b.dynamicChildren || b.dynamicChildren.length !== T.length) && (P = 0, A = !1, T = null), (R.innerHTML && K.innerHTML == null || R.textContent && K.textContent == null) && h(E, ""), T ? ut(
      b.dynamicChildren,
      T,
      E,
      C,
      O,
      Yn(y, w),
      S
    ) : A || ie(
      b,
      y,
      E,
      null,
      C,
      O,
      Yn(y, w),
      S,
      !1
    ), P > 0) {
      if (P & 16)
        qt(E, R, K, C, w);
      else if (P & 2 && R.class !== K.class && c(E, "class", null, K.class, w), P & 4 && c(E, "style", R.style, K.style, w), P & 8) {
        const J = y.dynamicProps;
        for (let le = 0; le < J.length; le++) {
          const te = J[le], ce = R[te], me = K[te];
          (me !== ce || te === "value") && c(E, te, ce, me, w, C);
        }
      }
      P & 1 && b.children !== y.children && h(E, y.children);
    } else !A && T == null && qt(E, R, K, C, w);
    ((U = K.onVnodeUpdated) || D) && ge(() => {
      U && De(U, C, y, b), D && ft(y, b, C, "updated");
    }, O);
  }, ut = (b, y, C, O, w, S, A) => {
    for (let E = 0; E < y.length; E++) {
      const P = b[E], T = y[E], D = P.el || Bt(P), R = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        D && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (P.type === f || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Ht(P, T) || // - In the case of a component, it could contain anything.
        P.shapeFlag & 198) ? $(D) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          C
        )
      );
      F(
        P,
        T,
        R,
        null,
        O,
        w,
        S,
        A,
        !0
      );
    }
  }, qt = (b, y, C, O, w) => {
    if (y !== C) {
      if (y !== se)
        for (const S in y)
          !Rt(S) && !(S in C) && c(
            b,
            S,
            y[S],
            null,
            w,
            O
          );
      for (const S in C) {
        if (Rt(S)) continue;
        const A = C[S], E = y[S];
        A !== E && S !== "value" && c(b, S, E, A, w, O);
      }
      "value" in C && c(b, "value", y.value, C.value, w);
    }
  }, nn = (b, y, C, O, w, S, A, E, P) => {
    const T = y.el = b ? b.el : d(""), D = y.anchor = b ? b.anchor : d("");
    let { patchFlag: R, dynamicChildren: K, slotScopeIds: U } = y;
    U && (E = E ? E.concat(U) : U), b == null ? (t(T, C, O), t(D, C, O), lt(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      y.children || [],
      C,
      D,
      w,
      S,
      A,
      E,
      P
    )) : R > 0 && R & 64 && K && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    b.dynamicChildren && b.dynamicChildren.length === K.length ? (ut(
      b.dynamicChildren,
      K,
      C,
      w,
      S,
      A,
      E
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (y.key != null || w && y === w.subTree) && pi(
      b,
      y,
      !0
      /* shallow */
    )) : ie(
      b,
      y,
      C,
      D,
      w,
      S,
      A,
      E,
      P
    );
  }, sn = (b, y, C, O, w, S, A, E, P) => {
    y.slotScopeIds = E, b == null ? y.shapeFlag & 512 ? w.ctx.activate(
      y,
      C,
      O,
      A,
      P
    ) : Vn(
      y,
      C,
      O,
      w,
      S,
      A,
      P
    ) : As(b, y, P);
  }, Vn = (b, y, C, O, w, S, A) => {
    const E = b.component = La(
      b,
      O,
      w
    );
    if (Ms(b) && (E.ctx.renderer = Lt), ja(E, !1, A), E.asyncDep) {
      if (w && w.registerDep(
        E,
        ve,
        A,
        S
      ), !b.el) {
        const P = E.subTree = N(Re);
        X(null, P, y, C), b.placeholder = P.el;
      }
    } else
      ve(
        E,
        b,
        y,
        C,
        w,
        S,
        A
      );
  }, As = (b, y, C) => {
    const O = y.component = b.component;
    if (da(b, y, C))
      if (O.asyncDep && !O.asyncResolved) {
        y.el = b.el, y.placeholder = b.placeholder, ae(O, y, C);
        return;
      } else
        O.next = y, O.update();
    else
      y.el = b.el, y.placeholder = b.placeholder, O.vnode = y;
  }, ve = (b, y, C, O, w, S, A) => {
    const E = () => {
      if (b.isMounted) {
        let { next: R, bu: K, u: U, parent: J, vnode: le } = b;
        {
          const Ie = Ci(b);
          if (Ie) {
            R && (R.el = le.el, ae(b, R, A)), Ie.asyncDep.then(() => {
              const Je = () => {
                b.job.flags & 8 || (w && w.pendingBranch ? ge(Je, w) : T());
              };
              Je.flags = 48, ge(Je, w);
            });
            return;
          }
        }
        let te = R, ce;
        bt(b, !1), R ? (R.el = le.el, ae(b, R, A)) : R = le, K && bn(K), (ce = R.props && R.props.onVnodeBeforeUpdate) && De(ce, J, R, le), bt(b, !0);
        const me = sl(b), He = b.subTree;
        b.subTree = me, F(
          He,
          me,
          // parent may have changed if it's in a teleport. a root that is a
          // pending async component only has its placeholder comment
          $(
            He.el || Bt(He)
          ),
          // anchor may have changed if it's in a fragment
          on(He),
          b,
          w,
          S
        ), R.el = me.el, te === null && ma(b, me.el), U && ge(U, w), (ce = R.props && R.props.onVnodeUpdated) && ge(
          () => De(ce, J, R, le),
          w
        );
      } else {
        let R;
        const { el: K, props: U } = y, { bm: J, m: le, parent: te, root: ce, type: me } = b, He = Kt(y);
        bt(b, !1), J && bn(J), !He && (R = U && U.onVnodeBeforeMount) && De(R, te, y), bt(b, !0);
        {
          ce.ce && ce.ce._hasShadowRoot() && ce.ce._injectChildStyle(
            me,
            b.parent ? b.parent.type : void 0
          );
          const Ie = b.subTree = sl(b);
          F(
            null,
            Ie,
            C,
            O,
            b,
            w,
            S
          ), y.el = Ie.el;
        }
        if (le && ge(le, w), !He && (R = U && U.onVnodeMounted)) {
          const Ie = y;
          ge(
            () => De(R, te, Ie),
            w
          );
        }
        (y.shapeFlag & 256 || te && Kt(te.vnode) && te.vnode.shapeFlag & 256) && b.a && ge(b.a, w), b.isMounted = !0, y = C = O = null;
      }
    };
    b.scope.on();
    const P = b.effect = new Ml(E);
    b.scope.off();
    const T = b.update = P.run.bind(P), D = b.job = P.runIfDirty.bind(P);
    D.i = b, D.id = b.uid, P.scheduler = () => qs(D), bt(b, !0), T();
  }, ae = (b, y, C) => {
    y.component = b;
    const O = b.vnode.props;
    b.vnode = y, b.next = null, ba(b, y.props, O, C), ka(b, y.children, C), ze(), Ql(b), Xe();
  }, ie = (b, y, C, O, w, S, A, E, P = !1) => {
    const T = b && b.children, D = b ? b.shapeFlag : 0, R = y.children, { patchFlag: K, shapeFlag: U } = y;
    if (K > 0) {
      if (K & 128) {
        ln(
          T,
          R,
          C,
          O,
          w,
          S,
          A,
          E,
          P
        );
        return;
      } else if (K & 256) {
        dt(
          T,
          R,
          C,
          O,
          w,
          S,
          A,
          E,
          P
        );
        return;
      }
    }
    U & 8 ? (D & 16 && Mt(T, w, S), R !== T && h(C, R)) : D & 16 ? U & 16 ? ln(
      T,
      R,
      C,
      O,
      w,
      S,
      A,
      E,
      P
    ) : Mt(T, w, S, !0) : (D & 8 && h(C, ""), U & 16 && lt(
      R,
      C,
      O,
      w,
      S,
      A,
      E,
      P
    ));
  }, dt = (b, y, C, O, w, S, A, E, P) => {
    b = b || vt, y = y || vt;
    const T = b.length, D = y.length, R = Math.min(T, D);
    let K;
    for (K = 0; K < R; K++) {
      const U = y[K] = P ? _e(y[K]) : Ve(y[K]);
      F(
        b[K],
        U,
        C,
        null,
        w,
        S,
        A,
        E,
        P
      );
    }
    T > D ? Mt(
      b,
      w,
      S,
      !0,
      !1,
      R
    ) : lt(
      y,
      C,
      O,
      w,
      S,
      A,
      E,
      P,
      R
    );
  }, ln = (b, y, C, O, w, S, A, E, P) => {
    let T = 0;
    const D = y.length;
    let R = b.length - 1, K = D - 1;
    for (; T <= R && T <= K; ) {
      const U = b[T], J = y[T] = P ? _e(y[T]) : Ve(y[T]);
      if (Ht(U, J))
        F(
          U,
          J,
          C,
          null,
          w,
          S,
          A,
          E,
          P
        );
      else
        break;
      T++;
    }
    for (; T <= R && T <= K; ) {
      const U = b[R], J = y[K] = P ? _e(y[K]) : Ve(y[K]);
      if (Ht(U, J))
        F(
          U,
          J,
          C,
          null,
          w,
          S,
          A,
          E,
          P
        );
      else
        break;
      R--, K--;
    }
    if (T > R) {
      if (T <= K) {
        const U = K + 1, J = U < D ? y[U].el : O;
        for (; T <= K; )
          F(
            null,
            y[T] = P ? _e(y[T]) : Ve(y[T]),
            C,
            J,
            w,
            S,
            A,
            E,
            P
          ), T++;
      }
    } else if (T > K)
      for (; T <= R; )
        je(b[T], w, S, !0), T++;
    else {
      const U = T, J = T, le = /* @__PURE__ */ new Map();
      for (T = J; T <= K; T++) {
        const we = y[T] = P ? _e(y[T]) : Ve(y[T]);
        we.key != null && le.set(we.key, T);
      }
      let te, ce = 0;
      const me = K - J + 1;
      let He = !1, Ie = 0;
      const Je = new Array(me);
      for (T = 0; T < me; T++) Je[T] = 0;
      for (T = U; T <= R; T++) {
        const we = b[T];
        if (ce >= me) {
          je(we, w, S, !0);
          continue;
        }
        let Ne;
        if (we.key != null)
          Ne = le.get(we.key);
        else
          for (te = J; te <= K; te++)
            if (Je[te - J] === 0 && Ht(we, y[te])) {
              Ne = te;
              break;
            }
        Ne === void 0 ? je(we, w, S, !0) : (Je[Ne - J] = T + 1, Ne >= Ie ? Ie = Ne : He = !0, F(
          we,
          y[Ne],
          C,
          null,
          w,
          S,
          A,
          E,
          P
        ), ce++);
      }
      const Ds = He ? Ca(Je) : vt;
      for (te = Ds.length - 1, T = me - 1; T >= 0; T--) {
        const we = J + T, Ne = y[we], Fs = y[we + 1], Ks = we + 1 < D ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Fs.el || Bt(Fs)
        ) : O;
        Je[T] === 0 ? F(
          null,
          Ne,
          C,
          Ks,
          w,
          S,
          A,
          E,
          P
        ) : He && (te < 0 || T !== Ds[te] ? mt(Ne, C, Ks, 2) : te--);
      }
    }
  }, mt = (b, y, C, O, w = null) => {
    const { el: S, type: A, transition: E, children: P, shapeFlag: T } = b;
    if (T & 6) {
      mt(b.component.subTree, y, C, O);
      return;
    }
    if (T & 128) {
      b.suspense.move(y, C, O);
      return;
    }
    if (T & 64) {
      A.move(b, y, C, Lt);
      return;
    }
    if (A === f) {
      t(S, y, C);
      for (let R = 0; R < P.length; R++)
        mt(P[R], y, C, O);
      t(b.anchor, y, C);
      return;
    }
    if (A === Zn) {
      L(b, y, C);
      return;
    }
    if (O !== 2 && T & 1 && E)
      if (O === 0)
        E.persisted && !S[Qn] ? t(S, y, C) : (E.beforeEnter(S), t(S, y, C), ge(() => E.enter(S), w));
      else {
        const { leave: R, delayLeave: K, afterLeave: U } = E, J = () => {
          b.ctx.isUnmounted ? i(S) : t(S, y, C);
        }, le = () => {
          const te = S._isLeaving || !!S[Qn];
          S._isLeaving && S[Qn](
            !0
            /* cancelled */
          ), E.persisted && !te ? J() : R(S, () => {
            J(), U && U();
          });
        };
        K ? K(S, J, le) : le();
      }
    else
      t(S, y, C);
  }, je = (b, y, C, O = !1, w = !1) => {
    const {
      type: S,
      props: A,
      ref: E,
      children: P,
      dynamicChildren: T,
      shapeFlag: D,
      patchFlag: R,
      dirs: K,
      cacheIndex: U,
      memo: J
    } = b;
    if ((R === -2 || T && T.hasOnce) && (w = !1), E != null && (ze(), Ft(E, null, C, b, !0), Xe()), U != null && (!b.ctx || b.ctx === y) && (y.renderCache[U] = void 0), D & 256 && y.ctx.deactivate(b))
      return;
    const le = D & 1 && K, te = !Kt(b);
    let ce;
    if (te && (ce = A && A.onVnodeBeforeUnmount) && De(ce, y, b), D & 6)
      Fi(b.component, C, O);
    else {
      if (D & 128) {
        b.suspense.unmount(C, O);
        return;
      }
      le && ft(b, null, y, "beforeUnmount"), D & 64 ? b.type.remove(
        b,
        y,
        C,
        Lt,
        O
      ) : T && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !T.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (S !== f || R > 0 && R & 64) ? Mt(
        T,
        y,
        C,
        !1,
        !0
      ) : (S === f && R & 384 || !w && D & 16) && Mt(P, y, C), O && Rs(b);
    }
    const me = J != null && U == null;
    (te && (ce = A && A.onVnodeUnmounted) || le || me) && ge(() => {
      ce && De(ce, y, b), le && ft(b, null, y, "unmounted"), me && (b.el = null);
    }, C);
  }, Rs = (b) => {
    const { type: y, el: C, anchor: O, transition: w } = b, S = y === f;
    if (S && !w) {
      Is(C, O);
      return;
    }
    if (y === Zn) {
      M(b), w && !w.persisted && w.afterLeave && w.afterLeave();
      return;
    }
    const A = S ? cs(b) : b, E = () => {
      S ? $(C) && Is(C, O) : i(C), w && !w.persisted && w.afterLeave && w.afterLeave();
    };
    if (A && A.shapeFlag & 1 && w && !w.persisted) {
      const { leave: P, delayLeave: T } = w, D = A.el, R = () => P(D, E);
      T ? T(D, E, R) : R();
    } else
      E();
  }, Is = (b, y) => {
    let C;
    for (; b !== y; )
      C = q(b), i(b), b = C;
    i(y);
  }, Fi = (b, y, C) => {
    const { bum: O, scope: w, job: S, subTree: A, um: E, m: P, a: T } = b;
    ol(P), ol(T), O && bn(O), w.stop(), S ? (S.flags |= 8, je(A, b, y, C)) : A && (A.transition = b.vnode.transition, je(A, b, y, C)), E && ge(E, y);
    const D = () => {
      b.isUnmounted = !0;
    };
    D.flags = 16, ge(D, y);
  }, Mt = (b, y, C, O = !1, w = !1, S = 0) => {
    for (let A = S; A < b.length; A++)
      je(b[A], y, C, O, w);
  }, on = (b) => {
    if (b.shapeFlag & 6)
      return on(b.component.subTree);
    if (b.shapeFlag & 128)
      return b.suspense.next();
    const y = q(b.anchor || b.el), C = y && y[Ro];
    return C ? q(C) : y;
  }, Ns = (b, y, C) => {
    const O = b && y._vnode ? void 0 : b && b.component ? b.component.uid : Ma();
    jo(() => {
      b == null ? y._vnode && je(y._vnode, null, null, !0) : F(
        y._vnode || null,
        b,
        y,
        null,
        null,
        null,
        C
      ), y._vnode = b;
    }, O);
  }, Lt = {
    p: F,
    um: je,
    m: mt,
    r: Rs,
    mt: Vn,
    mc: lt,
    pc: ie,
    pbc: ut,
    n: on,
    o: e
  };
  return {
    render: Ns,
    hydrate: void 0,
    createApp: ia(Ns)
  };
}
function Yn({ type: e, props: s }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && s && s.encoding && s.encoding.includes("html") ? void 0 : n;
}
function bt({ effect: e, job: s }, n) {
  n ? (e.flags |= 32, s.flags |= 4) : (e.flags &= -33, s.flags &= -5);
}
function pa(e, s) {
  return (!e || e && !e.pendingBranch) && s && !s.persisted;
}
function pi(e, s, n = !1) {
  const t = e.children, i = s.children;
  if (V(t) && V(i))
    for (let c = 0; c < t.length; c++) {
      const u = t[c];
      let d = i[c];
      d.shapeFlag & 1 && !d.dynamicChildren && ((d.patchFlag <= 0 || d.patchFlag === 32) && (d = i[c] = _e(i[c]), d.el = u.el), !n && d.patchFlag !== -2 && pi(u, d)), d.type === Dn && (d.patchFlag === -1 && (d = i[c] = _e(d)), d.el = u.el), d.type === Re && !d.el && (d.el = u.el);
    }
}
function Ca(e) {
  const s = e.slice(), n = [0];
  let t, i, c, u, d;
  const m = e.length;
  for (t = 0; t < m; t++) {
    const v = e[t];
    if (v !== 0) {
      if (i = n[n.length - 1], e[i] < v) {
        s[t] = i, n.push(t);
        continue;
      }
      for (c = 0, u = n.length - 1; c < u; )
        d = c + u >> 1, e[n[d]] < v ? c = d + 1 : u = d;
      v < e[n[c]] && (c > 0 && (s[t] = n[c - 1]), n[c] = t);
    }
  }
  for (c = n.length, u = n[c - 1]; c-- > 0; )
    n[c] = u, u = s[u];
  return n;
}
function Ci(e) {
  const s = e.subTree.component;
  if (s)
    return s.asyncDep && !s.asyncResolved ? s : Ci(s);
}
function ol(e) {
  if (e)
    for (let s = 0; s < e.length; s++)
      e[s].flags |= 8;
}
function Bt(e) {
  if (e.placeholder)
    return e.placeholder;
  const s = e.component;
  if (s)
    return Bt(s.subTree);
  const n = e.suspense;
  return n && n.activeBranch ? Bt(n.activeBranch) : null;
}
const xi = (e) => e.__isSuspense, xa = /* @__PURE__ */ Symbol("_deferredEnter");
function wa(e, s) {
  s && s.pendingBranch ? V(e) ? s.effects.push(...e) : s.effects.push(e) : Lo(e);
}
const f = /* @__PURE__ */ Symbol.for("v-fgt"), Dn = /* @__PURE__ */ Symbol.for("v-txt"), Re = /* @__PURE__ */ Symbol.for("v-cmt"), Zn = /* @__PURE__ */ Symbol.for("v-stc"), gt = [];
let Se = null;
function o(e = !1) {
  gt.push(Se = e ? null : []);
}
function wi() {
  gt.pop(), Se = gt[gt.length - 1] || null;
}
let Qt = 1;
function wn(e, s = !1) {
  Qt += e, e < 0 && Se && s && (Se.hasOnce = !0);
}
function Ti(e) {
  return e.dynamicChildren = Qt > 0 ? Se || vt : null, wi(), Qt > 0 && Se && Se.push(e), e;
}
function r(e, s, n, t, i, c) {
  return Ti(
    l(
      e,
      s,
      n,
      t,
      i,
      c,
      !0
    )
  );
}
function Ce(e, s, n, t, i) {
  return Ti(
    N(
      e,
      s,
      n,
      t,
      i,
      !0
    )
  );
}
function Jt(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Ht(e, s) {
  return e.type === s.type && e.key === s.key;
}
const Si = ({ key: e }) => e ?? null, vn = ({
  ref: e,
  ref_key: s,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? re(e) || /* @__PURE__ */ ye(e) || z(e) ? { i: Te, r: e, k: s, f: !!n } : e : null);
function l(e, s = null, n = null, t = 0, i = null, c = e === f ? 0 : 1, u = !1, d = !1) {
  const m = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: s,
    key: s && Si(s),
    ref: s && vn(s),
    scopeId: Zl,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: c,
    patchFlag: t,
    dynamicProps: i,
    dynamicChildren: null,
    appContext: null,
    ctx: Te
  };
  return d ? (Tn(m, n), c & 128 && e.normalize(m)) : n && (m.shapeFlag |= re(n) ? 8 : 16), Qt > 0 && // avoid a block node from tracking itself
  !u && // has current parent block
  Se && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (m.patchFlag > 0 || c & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  m.patchFlag !== 32 && Se.push(m), m;
}
const N = Ta;
function Ta(e, s = null, n = null, t = 0, i = null, c = !1) {
  if ((!e || e === oi) && (e = Re), Jt(e)) {
    const d = St(
      e,
      s,
      !0
      /* mergeRef: true */
    );
    return n && Tn(d, n), Qt > 0 && !c && Se && (d.shapeFlag & 6 ? Se[Se.indexOf(e)] = d : Se.push(d)), d.patchFlag = -2, d;
  }
  if (Ra(e) && (e = e.__vccOpts), s) {
    s = Sa(s);
    let { class: d, style: m } = s;
    d && !re(d) && (s.class = x(d)), ee(m) && (/* @__PURE__ */ Ss(m) && !V(m) && (m = de({}, m)), s.style = Z(m));
  }
  const u = re(e) ? 1 : xi(e) ? 128 : Rn(e) ? 64 : ee(e) ? 4 : z(e) ? 2 : 0;
  return l(
    e,
    s,
    n,
    t,
    i,
    u,
    c,
    !0
  );
}
function Sa(e) {
  return e ? /* @__PURE__ */ Ss(e) ? de({}, e) : hi(e) ? de({}, e[ji] || e) : e : null;
}
function St(e, s, n = !1, t = !1) {
  const { props: i, ref: c, patchFlag: u, children: d, transition: m } = e, v = s ? Oa(i || {}, s) : i, h = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: v,
    key: v && Si(v),
    ref: s && s.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && c ? V(c) ? c.concat(vn(s)) : [c, vn(s)] : vn(s)
    ) : c,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: d,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: s && e.type !== f ? u === -1 ? 16 : u | 16 : u,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: m,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && St(e.ssContent),
    ssFallback: e.ssFallback && St(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce,
    cacheIndex: e.cacheIndex
  };
  return m && t && Dt(
    h,
    m.clone(h)
  ), h;
}
function p(e = " ", s = 0) {
  return N(Dn, null, e, s);
}
function k(e = "", s = !1) {
  return s ? (o(), Ce(Re, null, e)) : N(Re, null, e);
}
function Ve(e) {
  return e == null || typeof e == "boolean" ? N(Re) : V(e) ? N(
    f,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Jt(e) ? _e(e) : N(Dn, null, String(e));
}
function _e(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : St(e);
}
function Tn(e, s) {
  let n = 0;
  const { shapeFlag: t } = e;
  if (s == null)
    s = null;
  else if (V(s))
    n = 16;
  else if (typeof s == "object")
    if (t & 65) {
      const i = s.default;
      i && (i._c && (i._d = !1), Tn(e, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = s._;
      !i && !hi(s) ? s._ctx = Te : i === 3 && Te && (Te.slots._ === 1 ? s._ = 1 : (s._ = 2, e.patchFlag |= 1024));
    }
  else if (z(s)) {
    if (t & 65) {
      Tn(e, { default: s });
      return;
    }
    s = { default: s, _ctx: Te }, n = 32;
  } else
    s = String(s), t & 64 ? (n = 16, s = [p(s)]) : n = 8;
  e.children = s, e.shapeFlag |= n;
}
function Oa(...e) {
  const s = {};
  for (let n = 0; n < e.length; n++) {
    const t = e[n];
    for (const i in t)
      if (i === "class")
        s.class !== t.class && (s.class = x([s.class, t.class]));
      else if (i === "style")
        s.style = Z([s.style, t.style]);
      else if (qn(i)) {
        const c = s[i], u = t[i];
        u && c !== u && !(V(c) && c.includes(u)) ? s[i] = c ? [].concat(c, u) : u : u == null && c == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Mn(i) && (s[i] = u);
      } else i !== "" && (s[i] = t[i]);
  }
  return s;
}
function De(e, s, n, t = null) {
  Ae(e, s, 7, [
    n,
    t
  ]);
}
const qa = /* @__PURE__ */ ci();
let Oi = 0;
function Ma() {
  return Oi;
}
function La(e, s, n) {
  const t = e.type, i = (s ? s.appContext : e.appContext) || qa, c = {
    uid: Oi++,
    vnode: e,
    type: t,
    parent: s,
    appContext: i,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new eo(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: s ? s.provides : Object.create(i.provides),
    ids: s ? s.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: vi(t, i),
    emitsOptions: ui(t, i),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: se,
    // inheritAttrs
    inheritAttrs: t.inheritAttrs,
    // state
    ctx: se,
    data: se,
    props: se,
    attrs: se,
    slots: se,
    refs: se,
    setupState: se,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return c.ctx = { _: c }, c.root = s ? s.root : c, c.emit = aa.bind(null, c), e.ce && e.ce(c), c;
}
let he = null;
const qi = () => he || Te;
let Sn, Yt;
{
  const e = Hn(), s = (n, t) => {
    let i;
    return (i = e[n]) || (i = e[n] = []), i.push(t), (c) => {
      i.length > 1 ? i.forEach((u) => u(c)) : i[0](c);
    };
  };
  Sn = s(
    "__VUE_INSTANCE_SETTERS__",
    (n) => he = n
  ), Yt = s(
    "__VUE_SSR_SETTERS__",
    (n) => Zt = n
  );
}
const en = (e) => {
  const s = he;
  return Sn(e), e.scope.on(), () => {
    e.scope.off(), Sn(s);
  };
}, al = () => {
  he && he.scope.off(), Sn(null);
};
function Mi(e) {
  return e.vnode.shapeFlag & 4;
}
let Zt = !1;
function ja(e, s = !1, n = !1) {
  s && Yt(s);
  const { props: t, children: i } = e.vnode, c = Mi(e);
  fa(e, t, c, s), va(e, i, n || s);
  const u = c ? Ha(e, s) : void 0;
  return s && Yt(!1), u;
}
function Ha(e, s) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Zo);
  const { setup: t } = n;
  if (t) {
    ze();
    const i = e.setupContext = t.length > 1 ? Ea(e) : null, c = en(e), u = _t(
      t,
      e,
      0,
      [
        e.props,
        i
      ]
    ), d = Cl(u);
    if (Xe(), c(), (d || e.sp) && !Kt(e) && si(e), d) {
      if (u.then(al, al), s)
        return u.then((m) => {
          Yt(!0);
          try {
            rl(e, m, s);
          } finally {
            Yt(!1);
          }
        }).catch((m) => {
          An(m, e, 0, void 0, !0), e.ssrRender = (v, h) => h("<!---->");
        });
      e.asyncDep = u;
    } else
      rl(e, u);
  } else
    Li(e);
}
function rl(e, s, n) {
  z(s) ? e.type.__ssrInlineRender ? e.ssrRender = s : e.render = s : ee(s) && (e.setupState = zl(s)), Li(e);
}
function Li(e, s, n) {
  const t = e.type;
  e.render || (e.render = t.render || Ue);
  {
    const i = en(e);
    ze();
    try {
      _o(e);
    } finally {
      Xe(), i();
    }
  }
}
const ji = /* @__PURE__ */ Symbol(), Pa = {
  get(e, s) {
    return be(e, "get", ""), s === ji ? e : e[s];
  }
};
function Ea(e) {
  const s = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, Pa),
    slots: e.slots,
    emit: e.emit,
    expose: s
  };
}
function Fn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(zl(go(e.exposed)), {
    get(s, n) {
      if (n in s)
        return s[n];
      if (n in Vt)
        return Vt[n](e);
    },
    has(s, n) {
      return n in s || n in Vt;
    }
  })) : e.proxy;
}
function Aa(e, s = !0) {
  return z(e) ? e.displayName || e.name : e.name || s && e.__name;
}
function Ra(e) {
  return z(e) && "__vccOpts" in e;
}
const ne = (e, s) => /* @__PURE__ */ wo(e, s, Zt);
function Ia(e, s, n) {
  try {
    wn(-1);
    const t = arguments.length;
    return t === 2 ? ee(s) && !V(s) ? Jt(s) ? N(e, null, [s]) : N(e, s) : N(e, null, s) : (t > 3 ? n = Array.prototype.slice.call(arguments, 2) : t === 3 && Jt(n) && (n = [n]), N(e, s, n));
  } finally {
    wn(1);
  }
}
const Na = "3.5.46";
/**
* @vue/runtime-dom v3.5.46
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let bs;
const cl = typeof window < "u" && window.trustedTypes;
if (cl)
  try {
    bs = /* @__PURE__ */ cl.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Hi = bs ? (e) => bs.createHTML(e) : (e) => e, Da = "http://www.w3.org/2000/svg", Fa = "http://www.w3.org/1998/Math/MathML", Ze = typeof document < "u" ? document : null, ul = Ze && /* @__PURE__ */ Ze.createElement("template"), Ka = {
  insert: (e, s, n) => {
    s.insertBefore(e, n || null);
  },
  remove: (e) => {
    const s = e.parentNode;
    s && s.removeChild(e);
  },
  createElement: (e, s, n, t) => {
    const i = s === "svg" ? Ze.createElementNS(Da, e) : s === "mathml" ? Ze.createElementNS(Fa, e) : n ? Ze.createElement(e, { is: n }) : Ze.createElement(e);
    return e === "select" && t && t.multiple != null && i.setAttribute("multiple", t.multiple), i;
  },
  createText: (e) => Ze.createTextNode(e),
  createComment: (e) => Ze.createComment(e),
  setText: (e, s) => {
    e.nodeValue = s;
  },
  setElementText: (e, s) => {
    e.textContent = s;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Ze.querySelector(e),
  setScopeId(e, s) {
    e.setAttribute(s, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, s, n, t, i, c) {
    const u = n ? n.previousSibling : s.lastChild;
    if (i && (i === c || i.nextSibling))
      for (; s.insertBefore(i.cloneNode(!0), n), !(i === c || !(i = i.nextSibling)); )
        ;
    else {
      ul.innerHTML = Hi(
        t === "svg" ? `<svg>${e}</svg>` : t === "mathml" ? `<math>${e}</math>` : e
      );
      const d = ul.content;
      if (t === "svg" || t === "mathml") {
        const m = d.firstChild;
        for (; m.firstChild; )
          d.appendChild(m.firstChild);
        d.removeChild(m);
      }
      s.insertBefore(d, n);
    }
    return [
      // first
      u ? u.nextSibling : s.firstChild,
      // last
      n ? n.previousSibling : s.lastChild
    ];
  }
}, Va = /* @__PURE__ */ Symbol("_vtc");
function Ba(e, s, n) {
  const t = e[Va];
  t && (s = (s ? [s, ...t] : [...t]).join(" ")), s == null ? e.removeAttribute("class") : n ? e.setAttribute("class", s) : e.className = s;
}
const On = /* @__PURE__ */ Symbol("_vod"), Pi = /* @__PURE__ */ Symbol("_vsh"), Tt = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: s }, { transition: n }) {
    e[On] = e.style.display === "none" ? "" : e.style.display, n && s ? n.beforeEnter(e) : Pt(e, s);
  },
  mounted(e, { value: s }, { transition: n }) {
    n && s && n.enter(e);
  },
  updated(e, { value: s, oldValue: n }, { transition: t }) {
    !s != !n && (t ? s ? (t.beforeEnter(e), Pt(e, !0), t.enter(e)) : t.leave(e, () => {
      Pt(e, !1);
    }) : Pt(e, s));
  },
  beforeUnmount(e, { value: s }) {
    Pt(e, s);
  }
};
function Pt(e, s) {
  e.style.display = s ? e[On] : "none", e[Pi] = !s;
}
const Ua = /* @__PURE__ */ Symbol(""), Wa = /(?:^|;)\s*display\s*:/;
function za(e, s, n) {
  const t = e.style, i = re(n);
  let c = !1;
  if (n && !i) {
    if (s)
      if (re(s))
        for (const u of s.split(";")) {
          const d = u.slice(0, u.indexOf(":")).trim();
          n[d] == null && At(t, d, "");
        }
      else
        for (const u in s)
          n[u] == null && At(t, u, "");
    for (const u in n) {
      u === "display" && (c = !0);
      const d = n[u];
      d != null ? Ga(
        e,
        u,
        !re(s) && s ? s[u] : void 0,
        d
      ) || At(t, u, d) : At(t, u, "");
    }
  } else if (i) {
    if (s !== n) {
      const u = t[Ua];
      u && (n += ";" + u), t.cssText = n, c = Wa.test(n);
    }
  } else s && e.removeAttribute("style");
  On in e && ((!i || s !== n) && (e[On] = c ? t.display : ""), e[Pi] && (t.display = "none"));
}
const un = /\s*!important$/;
function At(e, s, n) {
  if (V(n))
    n.forEach((t) => At(e, s, t));
  else if (n == null && (n = ""), s.startsWith("--"))
    un.test(n) ? e.setProperty(s, n.replace(un, ""), "important") : e.setProperty(s, n);
  else {
    const t = Xa(e, s);
    un.test(n) ? e.setProperty(
      ct(t),
      n.replace(un, ""),
      "important"
    ) : e[t] = n;
  }
}
const dl = ["Webkit", "Moz", "ms"], _n = {};
function Xa(e, s) {
  const n = _n[s];
  if (n)
    return n;
  let t = pe(s);
  if (t !== "filter" && t in e)
    return _n[s] = t;
  t = jn(t);
  for (let i = 0; i < dl.length; i++) {
    const c = dl[i] + t;
    if (c in e)
      return _n[s] = c;
  }
  return s;
}
function Ga(e, s, n, t) {
  return e.tagName === "TEXTAREA" && (s === "width" || s === "height") && re(t) && n === t;
}
const ml = "http://www.w3.org/1999/xlink";
function fl(e, s, n, t, i, c = Yi(s)) {
  t && s.startsWith("xlink:") ? n == null ? e.removeAttributeNS(ml, s.slice(6, s.length)) : e.setAttributeNS(ml, s, n) : n == null || c && !Sl(n) ? e.removeAttribute(s) : e.setAttribute(
    s,
    c ? "" : We(n) ? String(n) : n
  );
}
function bl(e, s, n, t, i) {
  if (s === "innerHTML" || s === "textContent") {
    n != null && (e[s] = s === "innerHTML" ? Hi(n) : n);
    return;
  }
  const c = e.tagName;
  if (s === "value" && c !== "PROGRESS" && // custom elements may use _value internally
  !c.includes("-")) {
    const d = c === "OPTION" ? e.getAttribute("value") || "" : e.value, m = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (d !== m || !("_value" in e)) && (e.value = m), n == null && e.removeAttribute(s), e._value = n;
    return;
  }
  let u = !1;
  if (n === "" || n == null) {
    const d = typeof e[s];
    d === "boolean" ? n = Sl(n) : n == null && d === "string" ? (n = "", u = !0) : d === "number" && (n = 0, u = !0);
  }
  try {
    e[s] = n;
  } catch {
  }
  u && e.removeAttribute(i || s);
}
function xt(e, s, n, t) {
  e.addEventListener(s, n, t);
}
function Qa(e, s, n, t) {
  e.removeEventListener(s, n, t);
}
const hl = /* @__PURE__ */ Symbol("_vei");
function Ja(e, s, n, t, i = null) {
  const c = e[hl] || (e[hl] = {}), u = c[s];
  if (t && u)
    u.value = t;
  else {
    const [d, m] = _a(s);
    if (t) {
      const v = c[s] = nr(
        t,
        i
      );
      xt(e, d, v, m);
    } else u && (Qa(e, d, u, m), c[s] = void 0);
  }
}
const Ya = /(Once|Passive|Capture)$/, Za = /^on:?(?:Once|Passive|Capture)$/;
function _a(e) {
  let s, n;
  for (; (n = e.match(Ya)) && !Za.test(e); )
    s || (s = {}), e = e.slice(0, e.length - n[1].length), s[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : ct(e.slice(2)), s];
}
let es = 0;
const er = /* @__PURE__ */ Promise.resolve(), tr = () => es || (er.then(() => es = 0), es = Date.now());
function nr(e, s) {
  const n = (t) => {
    if (!t._vts)
      t._vts = Date.now();
    else if (t._vts <= n.attached)
      return;
    const i = n.value;
    if (V(i)) {
      const c = t.stopImmediatePropagation;
      t.stopImmediatePropagation = () => {
        c.call(t), t._stopped = !0;
      };
      const u = i.slice(), d = [t];
      for (let m = 0; m < u.length && !t._stopped; m++) {
        const v = u[m];
        v && Ae(
          v,
          s,
          5,
          d
        );
      }
    } else
      Ae(
        i,
        s,
        5,
        [t]
      );
  };
  return n.value = e, n.attached = tr(), n;
}
const yl = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, sr = (e, s, n, t, i, c) => {
  const u = i === "svg";
  s === "class" ? Ba(e, t, u) : s === "style" ? za(e, n, t) : qn(s) ? Mn(s) || Ja(e, s, n, t, c) : (s[0] === "." ? (s = s.slice(1), !0) : s[0] === "^" ? (s = s.slice(1), !1) : lr(e, s, t, u)) ? (bl(e, s, t), !e.tagName.includes("-") && (s === "value" || s === "checked" || s === "selected") && fl(e, s, t, u, c, s !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (ir(e, s) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(s) || !re(t))) ? bl(e, pe(s), t, c, s) : (s === "true-value" ? e._trueValue = t : s === "false-value" && (e._falseValue = t), fl(e, s, t, u));
};
function lr(e, s, n, t) {
  if (t)
    return !!(s === "innerHTML" || s === "textContent" || s in e && yl(s) && z(n));
  if (s === "spellcheck" || s === "draggable" || s === "translate" || s === "autocorrect" || s === "sandbox" && e.tagName === "IFRAME" || s === "form" || s === "list" && e.tagName === "INPUT" || s === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (s === "width" || s === "height") {
    const i = e.tagName;
    if (i === "IMG" || i === "VIDEO" || i === "CANVAS" || i === "SOURCE")
      return !1;
  }
  return yl(s) && re(n) ? !1 : s in e;
}
function ir(e, s) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const t = pe(s);
  return Array.isArray(n) ? n.some((i) => pe(i) === t) : Object.keys(n).some((i) => pe(i) === t);
}
const vl = (e) => {
  const s = e.props["onUpdate:modelValue"] || !1;
  return V(s) ? (n) => bn(s, n) : s;
};
function or(e) {
  e.target.composing = !0;
}
function kl(e) {
  const s = e.target;
  s.composing && (s.composing = !1, s.dispatchEvent(new Event("input")));
}
const dn = /* @__PURE__ */ Symbol("_assign"), mn = /* @__PURE__ */ Symbol("_initialValue");
function ts(e, s, n) {
  return s && (e = e.trim()), n && (e = ks(e)), e;
}
const Hs = {
  created(e, { modifiers: { lazy: s, trim: n, number: t } }, i) {
    e.parentNode && (e.type === "text" ? e[mn] = e.defaultValue.replace(/[\r\n]/g, "") : e.type === "textarea" && (e[mn] = e.defaultValue.replace(/\r\n?/g, `
`))), e[dn] = vl(i);
    const c = t || i.props && i.props.type === "number";
    xt(e, s ? "change" : "input", (u) => {
      u.target.composing || e[dn](ts(e.value, n, c));
    }), (n || c) && xt(e, "change", () => {
      e.value = ts(e.value, n, c);
    }), s || (xt(e, "compositionstart", or), xt(e, "compositionend", kl), xt(e, "change", kl));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: s, modifiers: { trim: n, number: t } }) {
    const i = s ?? "", c = e[mn];
    delete e[mn], c !== void 0 && (e.type === "text" || e.type === "textarea") && e.value !== c ? e[dn](ts(e.value, n, t)) : e.value = i;
  },
  beforeUpdate(e, { value: s, oldValue: n, modifiers: { lazy: t, trim: i, number: c } }, u) {
    if (e[dn] = vl(u), e.composing) return;
    const d = (c || e.type === "number") && !/^0\d/.test(e.value) ? ks(e.value) : e.value, m = s ?? "";
    if (d === m)
      return;
    const v = e.getRootNode();
    (v instanceof Document || v instanceof ShadowRoot) && v.activeElement === e && e.type !== "range" && (t && s === n || i && e.value.trim() === m) || (e.value = m);
  }
}, ar = ["ctrl", "shift", "alt", "meta"], rr = {
  stop: (e) => e.stopPropagation(),
  prevent: (e) => e.preventDefault(),
  self: (e) => e.target !== e.currentTarget,
  ctrl: (e) => !e.ctrlKey,
  shift: (e) => !e.shiftKey,
  alt: (e) => !e.altKey,
  meta: (e) => !e.metaKey,
  left: (e) => "button" in e && e.button !== 0,
  middle: (e) => "button" in e && e.button !== 1,
  right: (e) => "button" in e && e.button !== 2,
  exact: (e, s) => ar.some((n) => e[`${n}Key`] && !s.includes(n))
}, Qe = (e, s) => {
  if (!e) return e;
  const n = e._withMods || (e._withMods = {}), t = s.join(".");
  return n[t] || (n[t] = ((i, ...c) => {
    for (let u = 0; u < s.length; u++) {
      const d = rr[s[u]];
      if (d && d(i, s)) return;
    }
    return e(i, ...c);
  }));
}, cr = {
  esc: "escape",
  space: " ",
  up: "arrow-up",
  left: "arrow-left",
  right: "arrow-right",
  down: "arrow-down",
  delete: "backspace"
}, Oe = (e, s) => {
  const n = e._withKeys || (e._withKeys = {}), t = s.join(".");
  return n[t] || (n[t] = ((i) => {
    if (!("key" in i))
      return;
    const c = ct(i.key);
    if (s.some(
      (u) => u === c || cr[u] === c
    ))
      return e(i);
  }));
}, ur = /* @__PURE__ */ de({ patchProp: sr }, Ka);
let gl;
function dr() {
  return gl || (gl = ga(ur));
}
const mr = ((...e) => {
  const s = dr().createApp(...e), { mount: n } = s;
  return s.mount = (t) => {
    const i = br(t);
    if (!i) return;
    const c = s._component;
    !z(c) && !c.render && !c.template && (c.template = i.innerHTML), i.nodeType === 1 && (i.textContent = "");
    const u = n(i, !1, fr(i));
    return i instanceof Element && (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")), u;
  }, s;
});
function fr(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function br(e) {
  return re(e) ? document.querySelector(e) : e;
}
const hr = { class: "knowledge-card-title" }, yr = { class: "knowledge-card-sub" }, vr = { class: "knowledge-card-mastery" }, kr = {
  key: 0,
  class: "knowledge-progress-track"
}, gr = {
  key: 1,
  class: "knowledge-stages"
}, $r = ["title"], pr = {
  key: 2,
  class: "knowledge-errors"
}, Cr = { class: "knowledge-last" }, xr = {
  __name: "TopicCard",
  props: {
    topic: { type: Object, required: !0 },
    statusLabel: { type: String, required: !0 },
    activityDate: { type: String, default: "" }
  },
  emits: ["open"],
  setup(e) {
    const s = e, n = ne(() => {
      const c = s.topic;
      return c.displayStatus === "unavailable" ? "Тема ещё не доступна" : c.masteryPercent === null ? c.displayStatus === "notstarted" ? "Не начато" : "Мало данных" : `Освоение: ${c.masteryPercent}%${c.preliminary ? " • предварительно" : ""}`;
    }), t = ne(() => Math.max(0, Math.min(100, s.topic.masteryPercent))), i = ne(() => {
      const c = s.topic;
      return c.displayStatus === "unavailable" ? "Учебный генератор будет подключён позже" : s.activityDate ? "Последняя работа: " + s.activityDate : c.started ? "Есть прогресс, дата неизвестна" : "Ещё не проходил";
    });
    return (c, u) => (o(), r("button", {
      class: x(["knowledge-card", e.topic.displayStatus]),
      type: "button",
      onClick: u[0] || (u[0] = (d) => c.$emit("open", e.topic.key))
    }, [
      l("div", hr, [
        p(a(e.statusLabel), 1),
        u[1] || (u[1] = l("br", null, null, -1)),
        p(a(e.topic.title), 1)
      ]),
      l("div", yr, a(e.topic.group), 1),
      l("div", vr, a(n.value), 1),
      e.topic.masteryPercent !== null ? (o(), r("div", kr, [
        l("span", {
          style: Z({ width: t.value + "%" })
        }, null, 4)
      ])) : k("", !0),
      e.topic.stages.length ? (o(), r("div", gr, [
        (o(!0), r(f, null, g(e.topic.stages, (d) => (o(), r("span", {
          key: d.index,
          class: x(["knowledge-stage", { passed: d.passed }]),
          title: d.name + ": " + d.best + "/" + d.total
        }, a(d.ico) + " " + a(d.passed ? "✅" : "○"), 11, $r))), 128))
      ])) : k("", !0),
      e.topic.activeErrors ? (o(), r("div", pr, "🧠 Требует отработки: " + a(e.topic.activeErrors), 1)) : k("", !0),
      l("div", Cr, a(i.value), 1)
    ], 2));
  }
}, wr = { class: "home-back-row" }, Tr = { class: "knowledge-hero" }, Sr = {
  class: "knowledge-toolbar",
  role: "group",
  "aria-label": "Класс и поиск"
}, Or = ["aria-pressed", "onClick"], qr = ["innerHTML"], Mr = ["value"], Lr = {
  class: "knowledge-toolbar",
  role: "group",
  "aria-label": "Статус освоения"
}, jr = ["aria-pressed", "onClick"], Hr = {
  class: "knowledge-toolbar",
  role: "group",
  "aria-label": "Порядок тем"
}, Pr = ["aria-pressed", "onClick"], Er = { class: "knowledge-course-summary" }, Ar = { key: 0 }, Rr = { key: 1 }, Ir = { class: "teacher-progress-track" }, Nr = { class: "knowledge-summary" }, Dr = { class: "knowledge-section-head" }, Fr = { class: "knowledge-grid" }, Kr = {
  key: 0,
  class: "knowledge-empty"
}, Vr = {
  __name: "KnowledgeMap",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e, n = Array.from({ length: 8 }, (v, h) => h + 1), t = [
      ["all", "Все"],
      ["weak", "🔴 Слабые"],
      ["unstable", "🟡 Нестабильные"],
      ["strong", "🟢 Освоенные"],
      ["notstarted", "⚪ Не начато / мало данных"]
    ], i = [["course", "По курсу"], ["attention", "Требуют внимания"]], c = [
      ["mastered", "✅ освоено"],
      ["good", "🟢 хорошо"],
      ["unstable", "🟡 нестабильно"],
      ["weak", "🔴 слабые"],
      ["lowData", "⚪ мало данных"],
      ["notStarted", "⚪ не начато"],
      ["unavailable", "⏳ скоро"]
    ], u = ne(() => s.model.data.courseProgress), d = ne(() => Math.max(0, Math.min(100, Number(u.value.percent) || 0))), m = ne(() => c.filter(([v]) => v !== "unavailable" || s.model.data.summary[v]));
    return (v, h) => (o(), r(f, null, [
      l("div", wr, [
        l("button", {
          class: "home-back-btn",
          type: "button",
          onClick: h[0] || (h[0] = ($) => e.actions.back())
        }, "← " + a(e.model.backLabel), 1)
      ]),
      l("section", Tr, [
        h[3] || (h[3] = l("h1", null, "📊 Карта знаний", -1)),
        l("p", null, [
          h[2] || (h[2] = p("Ученик: ", -1)),
          l("b", null, a(e.model.name), 1)
        ])
      ]),
      l("div", Sr, [
        (o(!0), r(f, null, g(Os(n), ($) => (o(), r("button", {
          key: $,
          class: x(["knowledge-grade", { active: e.model.grade === $ }]),
          "aria-pressed": e.model.grade === $,
          type: "button",
          onClick: (q) => e.actions.grade($)
        }, [
          l("span", {
            "aria-hidden": "true",
            innerHTML: e.actions.gradeIcon($)
          }, null, 8, qr),
          p(" " + a($) + " класс", 1)
        ], 10, Or))), 128)),
        l("input", {
          id: "knowledgeSearch",
          class: "knowledge-search",
          type: "search",
          "aria-label": "Найти тему",
          placeholder: "🔎 Найти тему",
          value: e.model.search,
          onInput: h[1] || (h[1] = ($) => e.actions.search($.target.value))
        }, null, 40, Mr)
      ]),
      l("div", Lr, [
        (o(), r(f, null, g(t, ([$, q]) => l("button", {
          key: $,
          class: x(["knowledge-filter", { active: e.model.status === $ }]),
          "aria-pressed": e.model.status === $,
          type: "button",
          onClick: (j) => e.actions.status($)
        }, a(q), 11, jr)), 64))
      ]),
      l("div", Hr, [
        (o(), r(f, null, g(i, ([$, q]) => l("button", {
          key: $,
          class: x(["knowledge-sort", { active: e.model.sort === $ }]),
          "aria-pressed": e.model.sort === $,
          type: "button",
          onClick: (j) => e.actions.sort($)
        }, a(q), 11, Pr)), 64))
      ]),
      l("div", Er, [
        u.value.catalogOnly ? (o(), r("div", Ar, [
          l("span", null, "Состояние " + a(e.model.grade) + " класса", 1),
          h[4] || (h[4] = l("br", null, null, -1)),
          h[5] || (h[5] = l("b", null, "Каталог подготовлен", -1)),
          l("small", null, a(u.value.catalogTopics) + " тем — генераторы добавляются поэтапно", 1)
        ])) : (o(), r("div", Rr, [
          h[6] || (h[6] = l("span", null, "Пройдено курса", -1)),
          h[7] || (h[7] = l("br", null, null, -1)),
          l("b", null, a(u.value.percent) + "%", 1),
          l("small", null, a(u.value.done) + "/" + a(u.value.total) + " обязательных ступеней", 1),
          l("div", Ir, [
            l("span", {
              style: Z({ width: d.value + "%" })
            }, null, 4)
          ])
        ])),
        l("div", null, [
          h[8] || (h[8] = l("span", null, "Среднее освоение изученных тем", -1)),
          h[9] || (h[9] = l("br", null, null, -1)),
          l("b", null, a(e.model.data.averageMastery === null ? "—" : e.model.data.averageMastery + "%"), 1),
          l("small", null, a(e.model.data.averageMastery === null ? "Пока мало данных" : "Не начатые темы в среднее не входят"), 1)
        ])
      ]),
      l("div", Nr, [
        (o(!0), r(f, null, g(m.value, ([$, q]) => (o(), r("div", { key: $ }, [
          l("b", null, a(e.model.data.summary[$]), 1),
          l("small", null, a(q), 1)
        ]))), 128))
      ]),
      h[10] || (h[10] = l("div", { class: "knowledge-legend" }, [
        l("span", null, "⏳ Скоро"),
        l("span", null, "⚪ Не начато / мало данных"),
        l("span", null, "🔴 Слабая тема"),
        l("span", null, "🟡 Нестабильно"),
        l("span", null, "🟢 Хорошо"),
        l("span", null, "✅ Освоено")
      ], -1)),
      (o(!0), r(f, null, g(e.model.sections, ($) => (o(), r("section", {
        key: $.id,
        class: "knowledge-section"
      }, [
        l("div", Dr, [
          l("div", null, [
            l("h2", null, a($.title), 1),
            l("small", null, a($.desc || ""), 1)
          ]),
          l("small", null, a($.topics.length) + " тем", 1)
        ]),
        l("div", Fr, [
          (o(!0), r(f, null, g($.topics, (q) => (o(), Ce(xr, {
            key: q.key,
            topic: q,
            "status-label": e.actions.topicStatus(q),
            "activity-date": q.lastActivityAt ? e.actions.formatDate(q.lastActivityAt) : "",
            onOpen: e.actions.open
          }, null, 8, ["topic", "status-label", "activity-date", "onOpen"]))), 128))
        ])
      ]))), 128)),
      e.model.sections.length ? k("", !0) : (o(), r("div", Kr, "По выбранному фильтру тем нет."))
    ], 64));
  }
}, Br = { class: "home-back-row" }, Ur = { class: "knowledge-hero" }, Wr = { class: "knowledge-detail-grid" }, zr = { class: "knowledge-detail-panel" }, Xr = {
  key: 0,
  class: "weak-preliminary"
}, Gr = { key: 0 }, Qr = { key: 1 }, Jr = { key: 2 }, Yr = {
  key: 2,
  class: "lesson"
}, Zr = { style: { "margin-top": "12px" } }, _r = { class: "knowledge-detail-panel" }, ec = { class: "knowledge-detail-kpis" }, tc = { class: "knowledge-recent" }, nc = ["title"], sc = { key: 1 }, lc = { style: { "margin-top": "14px" } }, ic = { class: "actions" }, oc = {
  key: 1,
  type: "button",
  class: "btn soft",
  disabled: ""
}, ac = {
  key: 0,
  class: "knowledge-context-note"
}, rc = {
  __name: "TopicDetail",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e, n = ne(() => {
      const u = s.model.topic;
      return u.displayStatus === "unavailable" ? "Скоро" : u.masteryPercent !== null ? `Освоение: ${u.masteryPercent}%` : u.displayStatus === "notstarted" ? "Не начато" : "Мало данных";
    }), t = [
      { id: "firstTry", icon: "✅", label: "с первой" },
      { id: "corrected", icon: "🟡", label: "исправлено" },
      { id: "wrong", icon: "❌", label: "неверно" },
      { id: "skipped", icon: "⏭", label: "пропущено" }
    ], i = ne(() => {
      const u = { firstTry: 0, corrected: 0, wrong: 0, skipped: 0 };
      for (const d of s.model.recent) u[d.outcome]++;
      return u;
    }), c = Object.fromEntries(t.map(({ id: u, icon: d }) => [u, d]));
    return (u, d) => (o(), r(f, null, [
      l("div", Br, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: d[0] || (d[0] = (m) => e.actions.back())
        }, "← К карте знаний")
      ]),
      l("section", Ur, [
        l("h1", null, "📊 " + a(e.model.topic.title), 1),
        l("p", null, a(e.model.topic.grade) + " класс • " + a(e.model.topic.group) + " • " + a(e.model.statusLabel), 1)
      ]),
      l("div", Wr, [
        l("section", zr, [
          l("h2", null, a(n.value), 1),
          e.model.topic.preliminary ? (o(), r("div", Xr, "Предварительная оценка: данных пока немного.")) : k("", !0),
          e.model.topic.stages.length ? (o(), r(f, { key: 1 }, [
            d[4] || (d[4] = l("h3", null, "Ступени темы", -1)),
            (o(!0), r(f, null, g(e.model.topic.stages, (m) => (o(), r("div", {
              key: m.index,
              class: "knowledge-stage-detail"
            }, [
              l("span", null, a(m.ico) + " " + a(m.name), 1),
              m.passed ? (o(), r("b", Gr, "✅ Пройдена")) : m.started ? (o(), r("b", Qr, "○ " + a(m.best) + "/" + a(m.total), 1)) : (o(), r("b", Jr, "○ Не пройдена"))
            ]))), 128))
          ], 64)) : (o(), r("div", Yr, [...d[5] || (d[5] = [
            l("b", null, "Дополнительная тренировка.", -1),
            p(" Не входит в обязательные ступени курса.", -1)
          ])])),
          l("div", Zr, [
            d[6] || (d[6] = l("b", null, "Последняя работа:", -1)),
            p(" " + a(e.model.lastActivity || "Не проходил"), 1)
          ])
        ]),
        l("section", _r, [
          l("h3", null, "Последние " + a(e.model.recent.length) + " заданий", 1),
          l("div", ec, [
            (o(), r(f, null, g(t, (m) => l("div", {
              key: m.id
            }, [
              l("b", null, a(i.value[m.id]), 1),
              l("small", null, a(m.icon) + " " + a(m.label), 1)
            ])), 64))
          ]),
          l("div", tc, [
            e.model.recent.length ? (o(!0), r(f, { key: 0 }, g(e.model.recent, (m, v) => (o(), r("span", {
              key: v,
              title: m.date
            }, a(Os(c)[m.outcome]), 9, nc))), 128)) : (o(), r("small", sc, "Пока нет заданий."))
          ]),
          l("div", lc, [
            d[7] || (d[7] = l("b", null, "Активные ошибки:", -1)),
            p(" " + a(e.model.topic.activeErrors), 1),
            d[8] || (d[8] = l("br", null, null, -1)),
            d[9] || (d[9] = l("b", null, "Отработанные ошибки:", -1)),
            p(" " + a(e.model.topic.resolvedErrors), 1)
          ])
        ])
      ]),
      l("div", ic, [
        e.model.topic.implemented !== !1 ? (o(), r(f, { key: 0 }, [
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: d[1] || (d[1] = (m) => e.actions.train(e.model.topic.key))
          }, "Тренировать тему"),
          e.model.topic.activeErrors ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn soft",
            onClick: d[2] || (d[2] = (m) => e.actions.errors(e.model.topic.key))
          }, "🧠 Работа над ошибками")) : k("", !0)
        ], 64)) : (o(), r("button", oc, "Тема готовится")),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: d[3] || (d[3] = (m) => e.actions.back())
        }, "← К карте")
      ]),
      e.model.teacher && e.model.topic.implemented !== !1 ? (o(), r("div", ac, " Для тренировки МатКвест переключится на профиль этого ученика и закроет режим преподавателя. ")) : k("", !0)
    ], 64));
  }
}, cc = {
  class: "error-filter-row",
  role: "group",
  "aria-label": "Класс"
}, uc = ["aria-pressed"], dc = ["aria-pressed", "onClick"], Ei = {
  __name: "GradeFilters",
  props: { grade: { type: [String, Number], required: !0 } },
  emits: ["change"],
  setup(e) {
    return (s, n) => (o(), r("div", cc, [
      l("button", {
        type: "button",
        class: x(["error-filter", { active: e.grade === "all" }]),
        "aria-pressed": e.grade === "all",
        onClick: n[0] || (n[0] = (t) => s.$emit("change", "all"))
      }, "Все", 10, uc),
      (o(), r(f, null, g(8, (t) => l("button", {
        key: t,
        type: "button",
        class: x(["error-filter", { active: Number(e.grade) === t }]),
        "aria-pressed": Number(e.grade) === t,
        onClick: (i) => s.$emit("change", t)
      }, a(t) + " класс", 11, dc)), 64))
    ]));
  }
}, mc = { class: "home-back-row" }, fc = { class: "error-summary" }, bc = {
  class: "error-filter-row",
  role: "group",
  "aria-label": "Статус ошибки"
}, hc = ["aria-pressed", "onClick"], yc = {
  key: 0,
  class: "error-start-box"
}, vc = {
  key: 1,
  class: "error-start-box"
}, kc = {
  class: "actions",
  style: { "justify-content": "flex-start", "margin-top": "5px" }
}, gc = {
  key: 2,
  class: "report-empty"
}, $c = { class: "actions" }, pc = { class: "error-groups" }, Cc = {
  key: 0,
  class: "error-state red"
}, xc = {
  key: 1,
  class: "error-state yellow"
}, wc = {
  key: 2,
  class: "error-state green"
}, Tc = ["onClick"], Sc = {
  __name: "ErrorWork",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = [
      { id: "active", label: "Нужно отработать" },
      { id: "resolved", label: "Отработано" },
      { id: "all", label: "Все статусы" }
    ];
    return (n, t) => (o(), r(f, null, [
      l("div", mc, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: t[0] || (t[0] = (i) => e.actions.back())
        }, "← Главный экран")
      ]),
      t[16] || (t[16] = l("section", { class: "errorwork-hero" }, [
        l("h1", null, "🧠 Работа над ошибками"),
        l("p", null, "Реши новые задания того же типа и примерно той же сложности. Старые ответы остаются в журнале.")
      ], -1)),
      l("div", fc, [
        l("div", null, [
          l("b", null, a(e.model.summary.active), 1),
          t[7] || (t[7] = l("small", null, "нужно отработать", -1))
        ]),
        l("div", null, [
          l("b", null, a(e.model.summary.resolved), 1),
          t[8] || (t[8] = l("small", null, "отработано", -1))
        ]),
        (o(), r(f, null, g([3, 4, 5, 6, 7, 8], (i) => l("div", { key: i }, [
          l("b", null, a(e.model.summary["g" + i + "Active"]), 1),
          l("small", null, a(i) + " класс", 1)
        ])), 64))
      ]),
      N(Ei, {
        grade: e.model.grade,
        onChange: e.actions.grade
      }, null, 8, ["grade", "onChange"]),
      l("div", bc, [
        (o(), r(f, null, g(s, (i) => l("button", {
          key: i.id,
          type: "button",
          class: x(["error-filter", { active: e.model.status === i.id }]),
          "aria-pressed": e.model.status === i.id,
          onClick: (c) => e.actions.status(i.id)
        }, a(i.label), 11, hc)), 64))
      ]),
      e.model.topicTitle ? (o(), r("div", yc, [
        t[9] || (t[9] = l("b", null, "Фильтр темы:", -1)),
        p(" " + a(e.model.topicTitle) + " ", 1),
        l("button", {
          type: "button",
          class: "btn soft",
          style: { "margin-left": "8px" },
          onClick: t[1] || (t[1] = (i) => e.actions.clearTopic())
        }, "Показать все темы")
      ])) : k("", !0),
      e.model.activeCount ? (o(), r("div", vc, [
        t[10] || (t[10] = l("b", null, "🧠 Начать работу над ошибками", -1)),
        l("div", kc, [
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: t[2] || (t[2] = (i) => e.actions.start(5))
          }, "5 заданий"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[3] || (t[3] = (i) => e.actions.start(10))
          }, "10 заданий"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[4] || (t[4] = (i) => e.actions.start(15))
          }, " Все доступные" + a(e.model.activeCount > 15 ? " (макс. 15)" : ""), 1)
        ]),
        t[11] || (t[11] = l("small", { style: { color: "var(--muted)" } }, "Сначала идут неверные ответы, затем исправленные. Блок включает до выбранного числа доступных ошибок.", -1))
      ])) : k("", !0),
      e.model.groups.length ? k("", !0) : (o(), r("div", gc, [
        e.model.status === "active" && e.model.summary.active === 0 ? (o(), r(f, { key: 0 }, [
          t[12] || (t[12] = p(" 🎉 ", -1)),
          t[13] || (t[13] = l("b", null, "Всё отработано!", -1)),
          t[14] || (t[14] = l("br", null, null, -1)),
          t[15] || (t[15] = p("Сейчас у ученика нет ошибок, которые требуют повторения. ", -1))
        ], 64)) : (o(), r(f, { key: 1 }, [
          p("По выбранному фильтру записей нет.")
        ], 64)),
        l("div", $c, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[5] || (t[5] = (i) => e.actions.back())
          }, "К классам"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[6] || (t[6] = (i) => e.actions.journal())
          }, "📋 Журнал")
        ])
      ])),
      l("div", pc, [
        (o(!0), r(f, null, g(e.model.groups, (i) => (o(), r("div", {
          key: i.key,
          class: "error-group"
        }, [
          l("div", null, [
            l("h3", null, a(i.title), 1),
            l("small", null, a(i.detail), 1),
            i.wrong ? (o(), r("span", Cc, "🔴 Нужно отработать: " + a(i.wrong), 1)) : i.repeat ? (o(), r("span", xc, "🟡 Требует повторения: " + a(i.repeat), 1)) : (o(), r("span", wc, "✅ Отработано: " + a(i.resolved), 1))
          ]),
          i.wrong || i.repeat ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn soft",
            onClick: (c) => e.actions.start(5, i.key)
          }, a(i.wrong ? "Тренировать" : "Повторить"), 9, Tc)) : k("", !0)
        ]))), 128))
      ])
    ], 64));
  }
}, Oc = { class: "home-back-row" }, qc = { class: "weak-summary" }, Mc = {
  class: "error-filter-row",
  role: "group",
  "aria-label": "Состояние темы"
}, Lc = ["aria-pressed", "onClick"], jc = {
  key: 0,
  class: "weak-start-box"
}, Hc = {
  class: "actions",
  style: { "justify-content": "flex-start", "margin-top": "7px" }
}, Pc = {
  key: 1,
  class: "report-empty"
}, Ec = { class: "weak-grid" }, Ac = {
  key: 0,
  class: "report-empty"
}, Rc = { class: "weak-sub" }, Ic = { class: "weak-percent" }, Nc = {
  key: 0,
  class: "weak-preliminary"
}, Dc = { class: "weak-stats" }, Fc = { class: "weak-sub" }, Kc = { class: "weak-actions" }, Vc = ["onClick"], Bc = ["onClick"], Uc = {
  __name: "WeakTopics",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = [
      { id: "all", label: "Все состояния" },
      { id: "weak", label: "🔴 Слабые" },
      { id: "unstable", label: "🟡 Нестабильные" },
      { id: "good", label: "🟢 Хорошие" },
      { id: "nodata", label: "⚪ Мало данных" }
    ];
    return (n, t) => (o(), r(f, null, [
      l("div", Oc, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: t[0] || (t[0] = (i) => e.actions.back())
        }, "← Главный экран")
      ]),
      t[21] || (t[21] = l("section", { class: "weak-hero" }, [
        l("h1", null, "🎯 Слабые темы"),
        l("p", null, "Темы, которые стоит повторить. Свежие ответы влияют на оценку сильнее старых.")
      ], -1)),
      l("div", qc, [
        l("div", null, [
          l("b", null, a(e.model.summary.weak), 1),
          t[3] || (t[3] = l("small", null, "слабые", -1))
        ]),
        l("div", null, [
          l("b", null, a(e.model.summary.unstable), 1),
          t[4] || (t[4] = l("small", null, "нестабильные", -1))
        ]),
        l("div", null, [
          l("b", null, a(e.model.summary.good + e.model.summary.mastered), 1),
          t[5] || (t[5] = l("small", null, "хорошо / освоено", -1))
        ]),
        l("div", null, [
          l("b", null, a(e.model.summary.nodata), 1),
          t[6] || (t[6] = l("small", null, "мало данных", -1))
        ]),
        l("div", null, [
          l("b", null, a(e.model.summary.activeErrors), 1),
          t[7] || (t[7] = l("small", null, "активные ошибки", -1))
        ])
      ]),
      N(Ei, {
        grade: e.model.grade,
        onChange: e.actions.grade
      }, null, 8, ["grade", "onChange"]),
      l("div", Mc, [
        (o(), r(f, null, g(s, (i) => l("button", {
          key: i.id,
          type: "button",
          class: x(["error-filter", { active: e.model.status === i.id }]),
          "aria-pressed": e.model.status === i.id,
          onClick: (c) => e.actions.status(i.id)
        }, a(i.label), 11, Lc)), 64))
      ]),
      e.model.canMix ? (o(), r("div", jc, [
        t[8] || (t[8] = l("b", null, "🎯 Тренировать слабые темы", -1)),
        l("div", Hc, [
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: t[1] || (t[1] = (i) => e.actions.mix(5))
          }, "5 заданий"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[2] || (t[2] = (i) => e.actions.mix(10))
          }, "10 заданий")
        ]),
        t[9] || (t[9] = l("small", { style: { color: "var(--muted)" } }, "В смешанном блоке чередуются слабые и нестабильные темы, для которых есть задания.", -1))
      ])) : (o(), r("div", Pc, [...t[10] || (t[10] = [
        p(" 🎉 ", -1),
        l("b", null, "Сейчас выраженных слабых тем с готовыми генераторами нет.", -1)
      ])])),
      l("div", Ec, [
        e.model.topics.length ? k("", !0) : (o(), r("div", Ac, "По выбранному фильтру тем нет.")),
        (o(!0), r(f, null, g(e.model.topics, (i) => (o(), r("section", {
          key: i.key,
          class: "weak-card"
        }, [
          l("h3", null, a(i.title), 1),
          l("div", Rc, a(i.grade) + " класс • " + a(i.group), 1),
          l("div", Ic, a(i.masteryPercent === null ? "—" : i.masteryPercent + "%"), 1),
          i.preliminary ? (o(), r("div", Nc, " Предварительная оценка, заданий для расчёта пока " + a(i.meaningful) + ". ", 1)) : k("", !0),
          l("span", {
            class: x(["weak-status", i.status])
          }, a(i.statusLabel), 3),
          l("div", Dc, [
            l("span", null, [
              t[11] || (t[11] = p("✅ С первой: ", -1)),
              l("b", null, a(i.firstTry), 1)
            ]),
            l("span", null, [
              t[12] || (t[12] = p("🟡 Исправлено: ", -1)),
              l("b", null, a(i.corrected), 1)
            ]),
            l("span", null, [
              t[13] || (t[13] = p("❌ Неверно: ", -1)),
              l("b", null, a(i.wrong), 1)
            ]),
            l("span", null, [
              t[14] || (t[14] = p("⏭ Пропущено: ", -1)),
              l("b", null, a(i.skipped), 1)
            ]),
            l("span", null, [
              t[15] || (t[15] = p("🧠 Активных ошибок: ", -1)),
              l("b", null, a(i.activeErrors), 1)
            ]),
            l("span", null, [
              t[16] || (t[16] = p("🧠 Отработано ошибок: ", -1)),
              l("b", null, a(i.resolvedErrors), 1)
            ]),
            l("span", null, [
              t[17] || (t[17] = p("Ступеней: ", -1)),
              l("b", null, a(i.completedStages) + "/3", 1)
            ]),
            l("span", null, [
              t[18] || (t[18] = p("Лучшая ступень: ", -1)),
              l("b", null, a(i.bestStage), 1)
            ])
          ]),
          l("div", Fc, [
            t[20] || (t[20] = p(" Последняя работа: ", -1)),
            l("b", null, a(i.activityDate), 1),
            i.lastStage ? (o(), r(f, { key: 0 }, [
              t[19] || (t[19] = p(" • последняя сложность: ", -1)),
              l("b", null, a(i.lastStage), 1)
            ], 64)) : k("", !0)
          ]),
          l("div", Kc, [
            l("button", {
              type: "button",
              class: "btn primary",
              onClick: (c) => e.actions.train(i.key)
            }, "Тренировать тему", 8, Vc),
            i.activeErrors ? (o(), r("button", {
              key: 0,
              type: "button",
              class: "btn soft",
              onClick: (c) => e.actions.errors(i.key)
            }, " 🧠 Ошибки (" + a(i.activeErrors) + ") ", 9, Bc)) : k("", !0)
          ])
        ]))), 128))
      ])
    ], 64));
  }
}, Wc = { class: "home-back-row" }, zc = { class: "control-setup" }, Xc = { class: "control-box" }, Gc = {
  class: "control-choice-row",
  role: "group",
  "aria-label": "Класс"
}, Qc = ["aria-pressed", "disabled", "onClick"], Jc = ["innerHTML"], Yc = { class: "control-summary-line" }, Zc = { class: "control-box" }, _c = {
  class: "control-choice-row",
  role: "group",
  "aria-label": "Размер блока"
}, eu = ["aria-pressed", "onClick"], tu = {
  key: 0,
  class: "actions"
}, nu = {
  key: 1,
  class: "report-empty"
}, su = {
  __name: "ControlReview",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Wc, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: n[0] || (n[0] = (t) => e.actions.back())
        }, "← Главный экран")
      ]),
      n[7] || (n[7] = l("section", { class: "control-hero" }, [
        l("h1", null, "🔁 Контрольное повторение"),
        l("p", null, "Проверка по уже изученным темам. Результаты попадут в журнал и Карту знаний.")
      ], -1)),
      l("div", zc, [
        l("section", Xc, [
          n[4] || (n[4] = l("h3", null, "Выбери класс", -1)),
          l("div", Gc, [
            (o(!0), r(f, null, g(e.model.grades, (t) => (o(), r("button", {
              key: t.id,
              type: "button",
              class: x(["control-choice", { active: e.model.grade === t.id }]),
              "aria-pressed": e.model.grade === t.id,
              disabled: t.disabled,
              onClick: (i) => e.actions.grade(t.id)
            }, [
              t.icon ? (o(), r("span", {
                key: 0,
                "aria-hidden": "true",
                innerHTML: t.icon
              }, null, 8, Jc)) : k("", !0),
              p(" " + a(t.label), 1)
            ], 10, Qc))), 128))
          ]),
          l("div", Yc, [
            n[3] || (n[3] = p(" Изучено тем: ", -1)),
            l("b", null, a(e.model.studiedCount), 1),
            e.model.groups.length ? (o(), r(f, { key: 0 }, [
              n[2] || (n[2] = l("br", null, null, -1)),
              p("Разделы: " + a(e.model.groups.join(" • ")), 1)
            ], 64)) : k("", !0)
          ])
        ]),
        l("section", Zc, [
          n[5] || (n[5] = l("h3", null, "Размер блока", -1)),
          l("div", _c, [
            (o(), r(f, null, g([10, 15, 20], (t) => l("button", {
              key: t,
              type: "button",
              class: x(["control-choice", { active: e.model.count === t }]),
              "aria-pressed": e.model.count === t,
              onClick: (i) => e.actions.count(t)
            }, a(t) + " заданий", 11, eu)), 64))
          ]),
          n[6] || (n[6] = l("div", { class: "control-summary-line" }, "Слабые и нестабильные темы встречаются немного чаще.", -1))
        ])
      ]),
      e.model.studiedCount ? (o(), r("div", tu, [
        l("button", {
          type: "button",
          class: "btn primary",
          onClick: n[1] || (n[1] = (t) => e.actions.start())
        }, "Начать " + a(e.model.count) + " заданий", 1)
      ])) : (o(), r("div", nu, a(e.model.emptyText), 1))
    ], 64));
  }
}, lu = { class: "mtop" }, ue = {
  __name: "ReportHeader",
  props: { title: { type: String, required: !0 } },
  emits: ["close"],
  setup(e) {
    return (s, n) => (o(), r("div", lu, [
      l("h2", null, a(e.title), 1),
      l("button", {
        type: "button",
        class: "x",
        "aria-label": "Закрыть окно",
        onClick: n[0] || (n[0] = (t) => s.$emit("close"))
      }, "×")
    ]));
  }
}, iu = { class: "review-summary" }, Kn = {
  __name: "ReportStats",
  props: { stats: { type: Array, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r("div", iu, [
      (o(!0), r(f, null, g(e.stats, ({ label: t, value: i }) => (o(), r("div", {
        key: t,
        class: "review-stat"
      }, [
        l("b", null, a(i), 1),
        l("small", null, a(t), 1)
      ]))), 128))
    ]));
  }
}, ou = { class: "block-result" }, au = {
  key: 0,
  class: "level-box",
  style: { "text-align": "left" }
}, ru = {
  key: 1,
  class: "teacher-danger",
  style: { "margin-top": "10px" }
}, cu = { class: "actions" }, uu = {
  __name: "ControlReviewResult",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", ou, [
        l("h3", null, "Результат: " + a(e.model.correct) + " / " + a(e.model.total), 1),
        N(Kn, {
          stats: e.model.stats
        }, null, 8, ["stats"]),
        e.model.topics.length ? (o(), r("div", au, [
          n[8] || (n[8] = l("b", null, "По темам", -1)),
          (o(!0), r(f, null, g(e.model.topics, (t) => (o(), r("div", {
            key: t.key,
            class: "control-topic-result"
          }, [
            l("div", null, [
              l("b", null, a(t.title), 1),
              l("small", null, a(t.status), 1)
            ]),
            l("b", null, a(t.correct) + "/" + a(t.total), 1),
            l("small", null, [
              t.corrected ? (o(), r(f, { key: 0 }, [
                p("🟡 " + a(t.corrected) + " исправлено", 1),
                n[6] || (n[6] = l("br", null, null, -1))
              ], 64)) : k("", !0),
              t.wrong ? (o(), r(f, { key: 1 }, [
                p("❌ " + a(t.wrong) + " неверно", 1),
                n[7] || (n[7] = l("br", null, null, -1))
              ], 64)) : k("", !0),
              t.skipped ? (o(), r(f, { key: 2 }, [
                p("⏭ " + a(t.skipped) + " пропущено", 1)
              ], 64)) : k("", !0)
            ])
          ]))), 128))
        ])) : k("", !0),
        e.model.attention.length ? (o(), r("div", ru, [
          n[9] || (n[9] = l("b", null, "Стоит повторить:", -1)),
          p(" " + a(e.model.attention.join(" • ")), 1)
        ])) : k("", !0),
        n[10] || (n[10] = l("p", null, "Ответы сохранены в журнале и учтены в Карте знаний.", -1)),
        l("div", cu, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[0] || (n[0] = (t) => e.actions.review())
          }, "📋 Разбор попытки"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[1] || (n[1] = (t) => e.actions.repeat())
          }, "Повторить контрольное"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[2] || (n[2] = (t) => e.actions.map())
          }, "📊 Карта знаний"),
          e.model.attention.length ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn soft",
            onClick: n[3] || (n[3] = (t) => e.actions.weak())
          }, "🎯 Слабые темы")) : k("", !0),
          e.model.activeErrors ? (o(), r("button", {
            key: 1,
            type: "button",
            class: "btn soft",
            onClick: n[4] || (n[4] = (t) => e.actions.errors())
          }, "🧠 Работа над ошибками")) : k("", !0),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[5] || (n[5] = (t) => e.actions.home())
          }, "Главный экран")
        ])
      ])
    ], 64));
  }
}, du = { class: "report-list" }, mu = ["onClick"], fu = { class: "meta" }, bu = {
  key: 1,
  class: "report-empty"
}, hu = {
  key: 2,
  class: "actions"
}, yu = {
  __name: "AttemptJournal",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      e.model.rows.length ? (o(), r(f, { key: 0 }, [
        n[2] || (n[2] = l("div", { class: "lesson" }, [
          p("В журнале хранятся последние "),
          l("b", null, "50 завершённых или прерванных попыток"),
          p(".")
        ], -1)),
        l("div", du, [
          (o(!0), r(f, null, g(e.model.rows, (t, i) => (o(), r("button", {
            key: i,
            type: "button",
            class: "report-card",
            onClick: (c) => e.actions.review(i)
          }, [
            l("div", null, [
              l("b", null, [
                p(a(t.title), 1),
                t.stage && t.stage !== t.title ? (o(), r(f, { key: 0 }, [
                  p(" — " + a(t.stage), 1)
                ], 64)) : k("", !0)
              ]),
              l("div", fu, [
                p(a(t.status) + " • " + a(t.date) + " • " + a(t.duration), 1),
                n[1] || (n[1] = l("br", null, null, -1)),
                p(" Заданий в разборе: " + a(t.itemCount) + a(t.hasCurrent ? " + текущее" : ""), 1)
              ])
            ]),
            l("div", {
              class: x(["report-score", t.scoreClass])
            }, a(t.score), 3)
          ], 8, mu))), 128))
        ])
      ], 64)) : (o(), r("div", bu, "Здесь появится разбор после первой попытки.")),
      e.actions.back ? (o(), r("div", hu, [
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[0] || (n[0] = (t) => e.actions.back())
        }, "← К ученику")
      ])) : k("", !0)
    ], 64));
  }
}, vu = {
  key: 0,
  class: "report-active"
}, ku = { class: "lesson" }, gu = { class: "review-items" }, $u = {
  key: 0,
  class: "report-empty"
}, pu = { class: "review-item-head" }, Cu = { class: "review-number" }, xu = { class: "review-status" }, wu = {
  key: 0,
  class: "source-note"
}, Tu = ["innerHTML"], Su = { class: "review-answer-grid" }, Ou = { class: "review-answer" }, qu = ["innerHTML"], Mu = { class: "review-answer" }, Lu = ["innerHTML"], ju = {
  key: 1,
  class: "check-details"
}, Hu = ["innerHTML"], Pu = {
  key: 2,
  class: "check-list"
}, Eu = {
  key: 1,
  class: "check-details"
}, Au = { key: 0 }, Ru = {
  key: 0,
  class: "meta",
  style: { "margin-top": "5px" }
}, Iu = {
  key: 3,
  class: "remediation-note"
}, Nu = {
  class: "meta",
  style: { "margin-top": "7px" }
}, Du = { class: "actions" }, Fu = {
  __name: "AttemptReview",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      e.model.active ? (o(), r("div", vu, "🟡 Блок ещё выполняется. Здесь показаны уже сохранённые ответы.")) : k("", !0),
      l("div", ku, [
        l("b", null, a(e.model.stage), 1),
        p(" • " + a(e.model.date) + " • " + a(e.model.duration), 1),
        n[2] || (n[2] = l("br", null, null, -1)),
        p(a(e.model.status), 1)
      ]),
      N(Kn, {
        stats: e.model.stats
      }, null, 8, ["stats"]),
      l("div", gu, [
        e.model.items.length ? k("", !0) : (o(), r("div", $u, "Пока нет отвеченных заданий.")),
        (o(!0), r(f, null, g(e.model.items, (t, i) => (o(), r("div", {
          key: i,
          class: x(["review-item", t.statusClass])
        }, [
          l("div", pu, [
            l("div", Cu, a(i + 1) + ". " + a(t.label), 1),
            l("div", xu, a(t.status), 1)
          ]),
          t.sourceTitle ? (o(), r("div", wu, [
            n[3] || (n[3] = l("b", null, "Источник:", -1)),
            p(" " + a(t.sourceTitle), 1)
          ])) : k("", !0),
          l("div", {
            class: "review-problem",
            innerHTML: t.promptHtml
          }, null, 8, Tu),
          l("div", Su, [
            l("div", Ou, [
              n[4] || (n[4] = l("b", null, "Ответ ученика", -1)),
              l("div", {
                innerHTML: t.studentHtml
              }, null, 8, qu)
            ]),
            l("div", Mu, [
              n[5] || (n[5] = l("b", null, "Правильный ответ", -1)),
              l("div", {
                innerHTML: t.correctHtml
              }, null, 8, Lu)
            ])
          ]),
          t.explanationHtml ? (o(), r("div", ju, [
            n[6] || (n[6] = l("b", null, "Разбор:", -1)),
            n[7] || (n[7] = p()),
            l("span", {
              innerHTML: t.explanationHtml
            }, null, 8, Hu)
          ])) : k("", !0),
          t.checks.length ? (o(), r("div", Pu, [
            (o(!0), r(f, null, g(t.checks, (c, u) => (o(), r("div", {
              key: u,
              class: x(["check-row", c.correct ? "good" : "bad"])
            }, [
              l("b", null, a(c.correct ? "Итоговая проверка" : "Проверка " + (u + 1)) + ":", 1),
              p(" " + a(c.correct ? "верно" : "неверно") + " ", 1),
              c.answer !== void 0 && String(c.answer) !== "" ? (o(), r(f, { key: 0 }, [
                n[8] || (n[8] = p(" • ответ ученика: ", -1)),
                l("b", null, a(c.answer), 1)
              ], 64)) : k("", !0),
              c.details?.length ? (o(), r("div", Eu, [
                (o(!0), r(f, null, g(c.details, (d, m) => (o(), r(f, { key: m }, [
                  m ? (o(), r("br", Au)) : k("", !0),
                  p(a(d), 1)
                ], 64))), 128))
              ])) : k("", !0)
            ], 2))), 128)),
            t.hiddenRepeats ? (o(), r("div", Ru, "Повторные одинаковые нажатия скрыты: " + a(t.hiddenRepeats), 1)) : k("", !0)
          ])) : k("", !0),
          t.remediationDate ? (o(), r("div", Iu, "🧠 Отработано " + a(t.remediationDate), 1)) : k("", !0),
          l("div", Nu, "Время: " + a(t.duration), 1)
        ], 2))), 128))
      ]),
      l("div", Du, [
        e.actions.result ? (o(), r("button", {
          key: 0,
          type: "button",
          class: "btn soft",
          onClick: n[0] || (n[0] = (t) => e.actions.result())
        }, "← К итогам")) : k("", !0),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[1] || (n[1] = (t) => e.actions.journal())
        }, "← К журналу")
      ])
    ], 64));
  }
}, Ku = { class: "block-result" }, Vu = {
  key: 0,
  class: "level-box",
  style: { "text-align": "left" }
}, Bu = { class: "actions" }, Uu = ["onClick"], Wu = {
  __name: "PracticeResult",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", Ku, [
        l("h3", null, a(e.model.heading), 1),
        N(Kn, {
          stats: e.model.stats
        }, null, 8, ["stats"]),
        e.model.topics?.length ? (o(), r("div", Vu, [
          (o(!0), r(f, null, g(e.model.topics, (t) => (o(), r("div", {
            key: t.key
          }, [
            l("b", null, a(t.title), 1),
            p(": " + a(t.correct) + "/" + a(t.total), 1)
          ]))), 128))
        ])) : k("", !0),
        l("p", null, a(e.model.note), 1),
        l("div", Bu, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[0] || (n[0] = (t) => e.actions.review())
          }, "📋 Разбор попытки"),
          (o(!0), r(f, null, g(e.actions.buttons, (t) => (o(), r("button", {
            key: t.label,
            type: "button",
            class: x(["btn", t.primary ? "primary" : "soft"]),
            onClick: (i) => t.run()
          }, a(t.label), 11, Uu))), 128)),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[1] || (n[1] = (t) => e.actions.home())
          }, "Главный экран")
        ])
      ])
    ], 64));
  }
}, zu = { class: "v71-section-progress" }, Xu = { class: "v71-progress-count" }, Gu = ["aria-label", "aria-valuemax", "aria-valuenow"], $l = {
  __name: "CourseSectionProgress",
  props: {
    done: { type: Number, required: !0 },
    total: { type: Number, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("div", zu, [
      l("span", Xu, "Пройдено " + a(e.done) + " из " + a(e.total) + " тем", 1),
      l("span", {
        class: "v71-progress-track",
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-label": "Пройдено " + e.done + " из " + e.total + " тем",
        "aria-valuemax": e.total,
        "aria-valuenow": e.done
      }, [
        l("span", {
          class: "v71-progress-fill",
          style: Z({ width: (e.total ? Math.round(100 * e.done / e.total) : 0) + "%" })
        }, null, 4)
      ], 8, Gu)
    ]));
  }
}, Qu = ["id", "aria-labelledby"], Ju = { class: "mk-g5-toc-head" }, Yu = ["id"], Zu = { class: "mk-g5-toc-actions" }, _u = ["aria-controls", "aria-expanded"], ed = ["id", "hidden"], td = ["hidden"], nd = { class: "mk-g5-toc-part-heading" }, sd = ["hidden", "open"], ld = ["onClick"], id = {
  key: 0,
  class: "mk-g5-toc-num"
}, od = ["start"], ad = ["hidden"], rd = ["value", "data-paragraph", "hidden"], cd = ["data-topic-id", "onClick"], ud = {
  class: "mk-g5-toc-item-number",
  "aria-hidden": "true"
}, dd = { class: "mk-g5-toc-item-title" }, md = {
  key: 0,
  class: "mk-g6-toc-topic-name"
}, fd = {
  key: 1,
  class: "mk-g6-toc-status"
}, ns = /* @__PURE__ */ new Set(), bd = {
  __name: "TextbookContents",
  props: {
    grade: { type: Number, required: !0 },
    parts: { type: Array, required: !0 },
    query: { type: String, required: !0 },
    matchingRows: { type: Set, required: !0 }
  },
  emits: ["open"],
  setup(e, { emit: s }) {
    const n = e, t = s, i = /* @__PURE__ */ Me(ns.has(n.grade)), c = /* @__PURE__ */ Me(/* @__PURE__ */ new Set()), u = /* @__PURE__ */ Me(/* @__PURE__ */ new Set());
    function d(j) {
      i.value = j, j ? ns.add(n.grade) : ns.delete(n.grade);
    }
    yn(() => n.query, (j) => {
      u.value.clear(), j && d(!1);
    });
    const m = (j) => !n.query || n.matchingRows.has(j), v = (j) => j.rows.some(m), h = (j) => j.sections.some(v), $ = (j) => n.query ? !u.value.has(j) : c.value.has(j);
    function q(j) {
      const W = n.query ? u.value : c.value;
      W.has(j) ? W.delete(j) : W.add(j);
    }
    return (j, W) => (o(), r("section", {
      id: "mk-g" + e.grade + "-textbook-nav",
      class: x(["mk-g5-toc", { "mk-g5-toc-collapsed": i.value }]),
      "aria-labelledby": "mk-g" + e.grade + "-toc-heading"
    }, [
      l("div", Ju, [
        l("h2", {
          id: "mk-g" + e.grade + "-toc-heading"
        }, "Темы " + a(e.grade) + " класса", 9, Yu),
        l("div", Zu, [
          l("button", {
            type: "button",
            class: "mk-g5-toc-toggle",
            "aria-controls": "mk-g" + e.grade + "-toc-parts",
            "aria-expanded": !i.value,
            onClick: W[0] || (W[0] = (F) => d(!i.value))
          }, a(i.value ? "Показать разделы" : "К карточкам"), 9, _u)
        ])
      ]),
      l("div", {
        id: "mk-g" + e.grade + "-toc-parts",
        class: "mk-g5-toc-body",
        hidden: i.value
      }, [
        (o(!0), r(f, null, g(e.parts, (F) => (o(), r("div", {
          key: F.id,
          class: "mk-g5-toc-part",
          hidden: !F.chapters.some(h)
        }, [
          l("h3", nd, a(F.title), 1),
          (o(!0), r(f, null, g(F.chapters, (G) => (o(), r("details", {
            key: G.id,
            class: "mk-g5-toc-chapter",
            hidden: !h(G),
            open: $(G.id)
          }, [
            l("summary", {
              onClick: Qe((X) => q(G.id), ["prevent"])
            }, [
              G.ordinal ? (o(), r("span", id, a(G.ordinal), 1)) : k("", !0),
              l("span", null, a(G.title), 1)
            ], 8, ld),
            l("ol", {
              class: "mk-g5-toc-list",
              start: G.start
            }, [
              (o(!0), r(f, null, g(G.sections, (X) => (o(), r(f, {
                key: X.id
              }, [
                X.title ? (o(), r("li", {
                  key: 0,
                  class: "mk-g7-toc-section",
                  hidden: !v(X)
                }, a(X.title), 9, ad)) : k("", !0),
                (o(!0), r(f, null, g(X.rows, (H) => (o(), r("li", {
                  key: H.id,
                  value: H.number,
                  "data-paragraph": H.number,
                  hidden: !m(H)
                }, [
                  (o(!0), r(f, null, g(H.links, (L) => (o(), r("div", {
                    key: L.id,
                    class: x({ "mk-g5-toc-extra": L.secondary }),
                    style: Z(L.secondary ? null : "display: contents")
                  }, [
                    l("button", {
                      type: "button",
                      class: "mk-g5-toc-link",
                      "data-topic-id": L.id,
                      onClick: (M) => t("open", L.id)
                    }, [
                      l("span", ud, a(L.secondary ? "↳" : H.number ?? "•"), 1),
                      l("span", dd, [
                        p(a(L.title) + " ", 1),
                        L.subtitle ? (o(), r("small", md, a(L.subtitle), 1)) : k("", !0)
                      ])
                    ], 8, cd)
                  ], 6))), 128)),
                  H.missing ? (o(), r("strong", {
                    key: 0,
                    class: x(e.grade === 5 ? "mk-g5-toc-missing" : "mk-g6-toc-unavailable")
                  }, a(H.missing), 3)) : k("", !0),
                  H.status ? (o(), r("small", fd, a(H.status), 1)) : k("", !0)
                ], 8, rd))), 128))
              ], 64))), 128))
            ], 8, od)
          ], 8, sd))), 128))
        ], 8, td))), 128))
      ], 8, ed)
    ], 10, Qu));
  }
}, hd = { class: "home-back-row" }, yd = { class: "grade-hero" }, vd = { class: "grade-chip" }, kd = ["innerHTML"], gd = {
  id: "mk19c4-topic-tools",
  "aria-label": "Поиск учебных тем"
}, $d = { class: "mk19c4-search-row" }, pd = { class: "mk19c4-search-wrap" }, Cd = ["id", "name"], xd = ["disabled"], wd = {
  class: "mk19c4-count",
  role: "status"
}, Td = ["data-visible"], Sd = ["data-grade"], Od = { class: "mk19f-grade-copy" }, qd = { class: "mk19f-grade-title" }, Md = ["aria-label", "aria-valuemax", "aria-valuenow"], Ld = { class: "mk19f-grade-note" }, jd = {
  key: 0,
  class: "grade-head"
}, Hd = ["innerHTML"], Pd = { key: 0 }, Ed = ["aria-label"], Ad = { class: "grade-head" }, Rd = ["innerHTML"], Id = { key: 0 }, Nd = {
  key: 0,
  class: "g5-mix"
}, Dd = { class: "grid" }, Fd = ["data-topic-id", "onClick"], Kd = ["innerHTML"], Vd = {
  key: 1,
  class: "ico",
  "aria-hidden": "true"
}, Bd = {
  key: 2,
  class: "g7-course-chip"
}, Ud = {
  key: 3,
  class: "elementary-soon"
}, Wd = {
  key: 4,
  class: "topic-progress"
}, zd = {
  __name: "GradeCourse",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e, n = /* @__PURE__ */ Me(""), t = /* @__PURE__ */ Me(null), i = (H) => H.toLocaleLowerCase("ru").replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, " ").trim(), c = ne(() => i(n.value)), u = ne(() => c.value.split(" ").filter(Boolean)), d = ne(() => s.model.grade >= 6 && /^\d+$/.test(c.value)), m = ne(() => s.model.subjects || [{ id: "all", sections: s.model.sections }]), v = ne(() => m.value.flatMap((H) => H.sections)), h = ne(() => {
      if (!u.value.length || !s.model.contents) return /* @__PURE__ */ new Set();
      const H = s.model.grade, L = H > 3 && H !== 5 && /^\d+$/.test(c.value), M = s.model.contents.parts.flatMap(
        (B) => B.chapters.flatMap((Q) => Q.sections.flatMap((xe) => xe.rows))
      );
      return new Set(M.filter((B) => L ? B.number === Number(c.value) : u.value.every((Q) => H >= 7 && /^\d+$/.test(Q) ? B.number === Number(Q) : B.searchable.includes(Q))));
    }), $ = ne(() => new Set([...h.value].flatMap((H) => H.ids)));
    function q(H, L) {
      const M = s.model.grade === 4 ? "g4:" + H.id : H.id;
      if ($.value.has(M)) return !0;
      if (d.value) return !1;
      const B = i([H.title, H.subtitle, H.subject, H.aliases, L.title].join(" "));
      return u.value.every((Q) => B.includes(Q));
    }
    const j = (H) => !u.value.length || H.topics.some((L) => q(L, H)), W = ne(() => v.value.reduce((H, L) => H + L.topics.length, 0)), F = ne(() => v.value.reduce(
      (H, L) => H + L.topics.filter((M) => q(M, L)).length,
      0
    ));
    function G() {
      n.value = "", t.value?.focus();
    }
    function X(H) {
      n.value = "", s.actions.open(s.model.grade === 4 ? H.slice(3) : H);
    }
    return (H, L) => (o(), r(f, null, [
      l("div", hd, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: L[0] || (L[0] = (M) => e.actions.back())
        }, "← Главный экран")
      ]),
      l("section", yd, [
        l("div", null, [
          l("h1", null, "Математика " + a(e.model.grade) + " класса", 1),
          l("p", null, a(e.model.description), 1)
        ]),
        l("span", vd, [
          l("span", {
            innerHTML: e.model.icon,
            "aria-hidden": "true"
          }, null, 8, kd),
          p(" " + a(e.model.grade) + " класс", 1)
        ])
      ]),
      l("section", gd, [
        l("div", $d, [
          l("div", pd, [
            nt(l("input", {
              ref_key: "searchInput",
              ref: t,
              "onUpdate:modelValue": L[1] || (L[1] = (M) => n.value = M),
              class: "mk19c4-search-input",
              type: "search",
              id: "grade-" + e.model.grade + "-topic-search",
              name: "grade-" + e.model.grade + "-topic-search",
              "aria-label": "Найти учебную тему",
              placeholder: "Найти тему по названию…",
              autocomplete: "off",
              spellcheck: "false"
            }, null, 8, Cd), [
              [Hs, n.value]
            ])
          ]),
          l("button", {
            type: "button",
            class: "mk19c4-clear",
            disabled: !n.value,
            onClick: G
          }, "Очистить", 8, xd)
        ]),
        l("div", wd, a(u.value.length ? "Найдено тем: " + F.value + " из " + W.value : "Всего тем: " + W.value), 1),
        l("div", {
          class: "mk19c4-empty",
          "data-visible": String(u.value.length > 0 && !F.value)
        }, " Темы не найдены. Измени запрос или очисти поиск. ", 8, Td)
      ]),
      l("section", {
        id: "mk19f-grade-strip",
        "data-grade": e.model.grade,
        "aria-label": "Учебный прогресс этого класса"
      }, [
        l("div", Od, [
          l("div", qd, [
            L[4] || (L[4] = l("strong", null, "Учебный прогресс", -1)),
            l("span", null, a(e.model.progress.done) + " из " + a(e.model.progress.total) + " этапов · " + a(e.model.progress.percent) + "%", 1)
          ]),
          l("span", {
            class: "mk19f-progress-track",
            role: "progressbar",
            "aria-valuemin": "0",
            "aria-label": "Пройдено этапов в " + e.model.grade + " классе: " + e.model.progress.done + " из " + e.model.progress.total,
            "aria-valuemax": e.model.progress.total,
            "aria-valuenow": e.model.progress.done
          }, [
            l("span", {
              class: "mk19f-progress-fill",
              style: Z({ width: e.model.progress.percent + "%" })
            }, null, 4)
          ], 8, Md),
          l("div", Ld, " Разминка: " + a(e.model.progress.warmup) + " · Тренировка: " + a(e.model.progress.training) + " · Мастерство: " + a(e.model.progress.master), 1)
        ]),
        l("button", {
          type: "button",
          class: "mk19f-open-all",
          onClick: L[2] || (L[2] = (M) => e.actions.progress())
        }, "Весь прогресс")
      ], 8, Sd),
      e.model.contents ? (o(), Ce(bd, {
        key: e.model.grade,
        grade: e.model.grade,
        parts: e.model.contents.parts,
        query: c.value,
        "matching-rows": h.value,
        onOpen: X
      }, null, 8, ["grade", "parts", "query", "matching-rows"])) : k("", !0),
      (o(!0), r(f, null, g(m.value, (M) => nt((o(), Ce(Jo(M.title ? "section" : "div"), {
        key: M.id,
        class: x(M.title ? "g7-course" : null),
        style: Z(M.title ? null : { display: "contents" }),
        "aria-label": M.title
      }, {
        default: _l(() => [
          M.title ? (o(), r("div", jd, [
            l("div", null, [
              l("h2", {
                class: x({ "mk874-section-heading": M.iconHtml })
              }, [
                M.iconHtml ? (o(), r("span", {
                  key: 0,
                  style: { display: "contents" },
                  innerHTML: M.iconHtml
                }, null, 8, Hd)) : k("", !0),
                l("span", {
                  class: x({ "mk874-section-label": M.iconHtml })
                }, a(M.title), 3)
              ], 2),
              M.description ? (o(), r("p", Pd, a(M.description), 1)) : k("", !0),
              N($l, {
                done: M.done,
                total: M.total
              }, null, 8, ["done", "total"])
            ])
          ])) : k("", !0),
          (o(!0), r(f, null, g(M.sections, (B) => nt((o(), r("section", {
            key: B.id,
            class: x([e.model.grade === 5 ? "g5-group" : "g6-group", B.className]),
            "aria-label": B.title
          }, [
            l("div", Ad, [
              l("div", null, [
                l("h2", {
                  class: x({ "mk874-section-heading": B.iconHtml })
                }, [
                  B.iconHtml ? (o(), r("span", {
                    key: 0,
                    style: { display: "contents" },
                    innerHTML: B.iconHtml
                  }, null, 8, Rd)) : k("", !0),
                  l("span", {
                    class: x({ "mk874-section-label": B.iconHtml })
                  }, a(B.title), 3)
                ], 2),
                B.description ? (o(), r("p", Id, a(B.description), 1)) : k("", !0),
                B.trainers ? k("", !0) : (o(), Ce($l, {
                  key: 1,
                  done: B.done,
                  total: B.topics.length
                }, null, 8, ["done", "total"]))
              ])
            ]),
            B.mix ? (o(), r("div", Nd, [
              L[5] || (L[5] = l("div", null, [
                l("b", null, "🎲 Микс по дробям"),
                l("small", null, "12 заданий из разделов обыкновенных дробей.")
              ], -1)),
              l("button", {
                type: "button",
                class: "btn primary",
                onClick: L[3] || (L[3] = (Q) => e.actions.mix())
              }, "Играть")
            ])) : k("", !0),
            l("div", Dd, [
              (o(!0), r(f, null, g(B.topics, (Q) => nt((o(), r("button", {
                key: Q.id,
                type: "button",
                class: x(["topic", Q.className]),
                "data-topic-id": e.model.grade === 4 ? "g4:" + Q.id : Q.id,
                onClick: (xe) => e.actions.open(Q.id)
              }, [
                Q.iconHtml ? (o(), r("span", {
                  key: 0,
                  style: { display: "contents" },
                  innerHTML: Q.iconHtml
                }, null, 8, Kd)) : (o(), r("span", Vd, a(Q.icon), 1)),
                l("strong", null, a(Q.title), 1),
                l("small", null, a(Q.subtitle), 1),
                Q.subject ? (o(), r("span", Bd, a(Q.subject), 1)) : k("", !0),
                Q.pending ? (o(), r("span", Ud, "Скоро")) : (o(), r("span", Wd, a(Q.progress), 1))
              ], 10, Fd)), [
                [Tt, q(Q, B)]
              ])), 128))
            ])
          ], 10, Ed)), [
            [Tt, j(B)]
          ])), 128))
        ]),
        _: 2
      }, 1032, ["class", "style", "aria-label"])), [
        [Tt, M.sections.some(j)]
      ])), 128))
    ], 64));
  }
}, Xd = {
  key: 0,
  class: "lesson"
}, Gd = ["innerHTML"], Qd = { key: 2 }, Jd = {
  key: 2,
  class: "operation-grid"
}, Yd = ["onClick"], Zd = { class: "topic-progress" }, _d = { class: "stage-grid" }, em = ["disabled", "onClick"], tm = { class: "stage-lock" }, nm = { class: "stage-ico" }, sm = { class: "stage-best" }, lm = { class: "subtle" }, im = {
  __name: "CourseTopic",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      e.model.operations ? (o(), r("div", Xd, " В письменных вычислениях цифры одинаковых разрядов стоят друг под другом. Выбери действие, чтобы открыть объяснение и тренировку. ")) : (o(), r("div", {
        key: 1,
        class: x(["lesson", e.model.lessonClass])
      }, [
        e.model.theory ? (o(), r("div", {
          key: 0,
          innerHTML: e.model.theory
        }, null, 8, Gd)) : (o(), r(f, { key: 1 }, [
          p("Тема состоит из трёх ступеней. Следующая открывается после прохождения предыдущей.")
        ], 64)),
        e.model.column ? (o(), r("p", Qd, [...n[0] || (n[0] = [
          l("small", null, "Клетки переноса и отметки занимания можно оставлять пустыми.", -1)
        ])])) : k("", !0)
      ], 2)),
      e.model.operations ? (o(), r("div", Jd, [
        (o(!0), r(f, null, g(e.model.operations, (t) => (o(), r("button", {
          key: t.id,
          type: "button",
          class: "operation-card",
          onClick: (i) => e.actions.operation(t.id)
        }, [
          l("strong", null, a(t.icon) + " " + a(t.name), 1),
          n[1] || (n[1] = l("small", null, "Разминка → Тренировка → Мастер", -1)),
          l("span", Zd, a(t.done) + "/3 этапа", 1)
        ], 8, Yd))), 128))
      ])) : (o(), r(f, { key: 3 }, [
        l("div", _d, [
          (o(!0), r(f, null, g(e.model.stages, (t) => (o(), r("button", {
            key: t.index,
            type: "button",
            class: x(["stage-card", { locked: !t.unlocked }]),
            disabled: !t.unlocked,
            onClick: (i) => e.actions.start(t.index)
          }, [
            l("span", tm, a(t.passed ? "✅" : t.unlocked ? "" : "🔒"), 1),
            l("span", nm, a(t.icon), 1),
            l("strong", null, a(t.index + 1) + ". " + a(t.name), 1),
            l("small", null, [
              p(a(t.count) + " " + a(e.model.column ? "примеров" : "заданий") + " • пройти: " + a(t.requirement), 1),
              n[2] || (n[2] = l("br", null, null, -1)),
              p(a(t.description), 1)
            ]),
            l("div", sm, a(t.best ? "Лучший результат: " + t.best + "/" + t.count : "Ещё не пройден"), 1)
          ], 10, em))), 128))
        ]),
        l("div", lm, [
          n[3] || (n[3] = p("Пройдено этапов: ", -1)),
          l("b", null, a(e.model.done) + "/3", 1),
          n[4] || (n[4] = p(". Лучший результат сохраняется в профиле ученика.", -1))
        ])
      ], 64))
    ], 64));
  }
}, om = { class: "block-head" }, am = ["title", "innerHTML"], rm = { class: "block-progress-wrap" }, cm = {
  id: "blockProgressText",
  class: "block-progress-text"
}, um = ["aria-valuemax", "aria-valuenow"], dm = { id: "blockCorrectCount" }, Ps = {
  __name: "TrainingProgress",
  props: { model: { type: Object, required: !0 } },
  setup(e) {
    const s = e, n = ne(() => s.model.total ? Math.round(100 * s.model.done / s.model.total) : 0);
    return (t, i) => (o(), r("div", om, [
      l("span", null, [
        p(a(e.model.icon) + " " + a(e.model.stage) + " ", 1),
        e.model.petIcon ? (o(), r("span", {
          key: 0,
          class: "study-pet",
          title: "Твой питомец: " + e.model.petName,
          innerHTML: e.model.petIcon
        }, null, 8, am)) : k("", !0)
      ]),
      l("div", rm, [
        l("div", cm, [
          l("span", null, a(e.model.countText ?? `Выполнено ${e.model.done} / ${e.model.total}`), 1)
        ]),
        l("div", {
          class: "block-progress-track",
          role: "progressbar",
          "aria-label": "Выполнено заданий",
          "aria-valuemin": "0",
          "aria-valuemax": e.model.total,
          "aria-valuenow": e.model.done
        }, [
          l("span", {
            id: "blockProgressBar",
            style: Z({ width: n.value + "%" })
          }, null, 4)
        ], 8, um)
      ]),
      l("span", dm, "✅ " + a(e.model.correct), 1)
    ]));
  }
}, mm = { class: "block-result" }, fm = { class: "block-stars" }, bm = {
  class: "level-box",
  style: { margin: "8px 0 12px" }
}, hm = {
  key: 0,
  class: "level-box"
}, ym = { class: "actions" }, vm = {
  __name: "StageResult",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", mm, [
        l("div", fm, a("★".repeat(e.model.stars)) + a("☆".repeat(3 - e.model.stars)), 1),
        n[9] || (n[9] = l("div", { style: { "font-size": "12px", color: "var(--muted)", "margin-top": "2px" } }, "3 ★ — без ошибок · 2 ★ — от 80% · 1 ★ — от 60%", -1)),
        l("h3", null, "Верно с первой: " + a(e.model.correct) + " из " + a(e.model.total), 1),
        l("div", bm, [
          n[4] || (n[4] = l("b", null, "✅ С первой:", -1)),
          p(" " + a(e.model.firstTry) + " • ", 1),
          n[5] || (n[5] = l("b", null, "🟡 Исправлено:", -1)),
          p(" " + a(e.model.corrected) + " • ", 1),
          n[6] || (n[6] = l("b", null, "❌ Осталось неверно:", -1)),
          p(" " + a(e.model.wrong) + " • ", 1),
          n[7] || (n[7] = l("b", null, "⏭ Пропущено:", -1)),
          p(" " + a(e.model.skipped), 1)
        ]),
        l("p", null, a(e.model.message), 1),
        n[10] || (n[10] = l("div", { style: { "font-size": "12px", color: "var(--muted)", margin: "-4px 0 10px" } }, " Пропуск занимает одно задание в блоке. В журнале пропуски и ошибки отмечены отдельно. ", -1)),
        e.model.bonusXP ? (o(), r("div", hm, [
          n[8] || (n[8] = l("b", null, "Бонус за первое прохождение:", -1)),
          p(" +" + a(e.model.bonusXP) + " XP и +" + a(e.model.bonusCoins) + " 🪙 ", 1)
        ])) : k("", !0),
        l("div", ym, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[0] || (n[0] = (t) => e.actions.review())
          }, "📋 Разбор попытки"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[1] || (n[1] = (t) => e.actions.repeat())
          }, "Повторить блок"),
          e.actions.next ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn primary next-ready",
            onClick: n[2] || (n[2] = (t) => e.actions.next())
          }, "Следующая ступень →")) : k("", !0),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[3] || (n[3] = (t) => e.actions.close())
          }, "К темам")
        ])
      ])
    ], 64));
  }
}, km = ["disabled", "aria-pressed", "onClick"], gm = ["innerHTML"], Ai = {
  __name: "AnswerChoices",
  props: {
    choices: { type: Array, required: !0 },
    containerClass: { type: String, default: "answers" }
  },
  emits: ["choose"],
  setup(e) {
    return (s, n) => (o(), r("div", {
      class: x(e.containerClass)
    }, [
      (o(!0), r(f, null, g(e.choices, (t, i) => (o(), r("button", {
        key: i,
        type: "button",
        class: x(t.className),
        disabled: t.disabled,
        "aria-pressed": t.selected,
        onClick: (c) => s.$emit("choose", i)
      }, [
        t.labelHtml !== void 0 ? (o(), r("span", {
          key: 0,
          style: { display: "contents" },
          innerHTML: t.labelHtml
        }, null, 8, gm)) : (o(), r(f, { key: 1 }, [
          p(a(t.label), 1)
        ], 64))
      ], 10, km))), 128))
    ], 2));
  }
}, $m = { class: "flash" }, pm = {
  key: 0,
  class: "mk-g5-comparison-table",
  style: { "overflow-x": "auto", "margin-bottom": "12px" }
}, Cm = { style: { width: "100%", "text-align": "center" } }, xm = { scope: "row" }, wm = ["maxlength", "type", "data-row", "data-col", "value", "disabled", "readonly"], Tm = { class: "actions" }, Sm = ["innerHTML"], Om = {
  key: 3,
  id: "tfb",
  class: "feedback",
  role: "status"
}, qm = {
  key: 0,
  class: "school-solution"
}, Ri = {
  __name: "TableExercise",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e, n = ne(() => ["Тысячи", "Сотни", "Десятки", "Единицы"].slice(
      -(s.model.placeValues?.[0]?.length || 4)
    ));
    function t(i) {
      i.repeat ? i.preventDefault() : i.target.id === "fin" && (i.preventDefault(), s.actions.primary());
    }
    return (i, c) => (o(), r("div", {
      class: "card",
      onKeydown: Oe(t, ["enter"])
    }, [
      l("div", $m, a(e.model.prompt ?? `${e.model.a} × ${e.model.b} = ?`), 1),
      e.model.placeValues ? (o(), r("div", pm, [
        l("table", Cm, [
          c[3] || (c[3] = l("caption", null, "Разряды двух натуральных чисел", -1)),
          l("thead", null, [
            l("tr", null, [
              c[2] || (c[2] = l("th", { scope: "col" }, "Число", -1)),
              (o(!0), r(f, null, g(n.value, (u) => (o(), r("th", {
                key: u,
                scope: "col"
              }, a(u), 1))), 128))
            ])
          ]),
          l("tbody", null, [
            (o(!0), r(f, null, g(e.model.placeValues, (u, d) => (o(), r("tr", { key: d }, [
              l("th", xm, a(d ? "Второе" : "Первое"), 1),
              (o(!0), r(f, null, g(u, (m, v) => (o(), r("td", { key: v }, a(m), 1))), 128))
            ]))), 128))
          ])
        ])
      ])) : k("", !0),
      e.model.choices ? (o(), Ce(Ai, {
        key: 1,
        choices: e.model.choices,
        "container-class": "school-numeric-choices",
        onChoose: e.actions.pick
      }, null, 8, ["choices", "onChoose"])) : k("", !0),
      l("input", {
        id: "fin",
        class: x(["fin", { bad: e.model.wrong }]),
        inputmode: "numeric",
        maxlength: e.model.maxDigits ?? 3,
        "aria-label": "Ответ",
        type: e.model.choices ? "hidden" : "text",
        autocomplete: "off",
        "data-row": e.model.answerCell === !1 ? null : "answer",
        "data-col": e.model.answerCell === !1 ? null : "0",
        value: e.model.answer,
        disabled: e.model.disabled,
        readonly: e.model.readOnly
      }, null, 10, wm),
      l("div", Tm, [
        nt(l("button", {
          id: "tablePrimary",
          type: "button",
          class: x(["btn primary", { "next-ready": e.model.nextReady }]),
          onClick: c[0] || (c[0] = (...u) => e.actions.primary && e.actions.primary(...u))
        }, a(e.model.primaryLabel), 3), [
          [Tt, !e.model.choices || e.model.nextReady]
        ]),
        nt(l("button", {
          id: "tableSkip",
          type: "button",
          class: "btn soft",
          onClick: c[1] || (c[1] = (...u) => e.actions.skip && e.actions.skip(...u))
        }, a(e.model.skipLabel ?? "⏭ Пропустить задание"), 513), [
          [Tt, !e.model.hideSkip]
        ])
      ]),
      e.model.feedbackHtml !== void 0 ? (o(), r("div", {
        key: 2,
        id: "tfb",
        class: "feedback",
        role: "status",
        innerHTML: e.model.feedbackHtml
      }, null, 8, Sm)) : (o(), r("div", Om, [
        p(a(e.model.feedback) + " ", 1),
        e.model.solution?.length ? (o(), r("ol", qm, [
          (o(!0), r(f, null, g(e.model.solution, (u, d) => (o(), r("li", { key: d }, a(u), 1))), 128))
        ])) : k("", !0)
      ]))
    ], 32));
  }
}, Mm = ["innerHTML"], Lm = ["innerHTML"], jm = { class: "quiz-input-label stage18-frac-title" }, Hm = { class: "stage18-frac-entry" }, Pm = {
  key: 0,
  class: "stage18-frac-part"
}, Em = { class: "stage18-frac-label" }, Am = ["id", "inputmode", "aria-label", "value", "disabled"], Rm = { class: "stage18-frac-part" }, Im = {
  key: 0,
  class: "stage18-frac-label"
}, Nm = { class: "stage18-frac-stack" }, Dm = {
  key: 0,
  class: "stage18-frac-bar",
  role: "presentation"
}, Fm = {
  key: 1,
  class: "stage18-frac-part"
}, Km = { class: "stage18-frac-label" }, Vm = ["id", "inputmode", "aria-label", "aria-readonly", "value", "disabled", "readonly"], Bm = ["id", "inputmode", "aria-label", "value", "disabled"], Um = { class: "stage18-frac-note" }, Wm = {
  key: 0,
  class: "quiz-input-label"
}, zm = ["for"], Xm = {
  key: 2,
  class: "coordinate-input-grid"
}, Gm = ["id", "inputmode", "aria-label", "value", "disabled"], Qm = {
  key: 3,
  class: "quiz-input-line"
}, Jm = ["id", "inputmode", "value", "disabled"], Ym = {
  key: 0,
  class: "quiz-input-suffix"
}, Zm = { class: "quiz-input-hint" }, _m = ["innerHTML"], ef = {
  __name: "QuizExercise",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", {
        class: "quizq",
        innerHTML: e.model.prompt
      }, null, 8, Mm),
      e.model.visual ? (o(), r("div", {
        key: 0,
        style: { display: "contents" },
        innerHTML: e.model.visual
      }, null, 8, Lm)) : k("", !0),
      e.model.choices.length ? (o(), Ce(Ai, {
        key: 1,
        choices: e.model.choices,
        onChoose: e.actions.choose,
        onKeydown: Oe(e.actions.keydown, ["enter"])
      }, null, 8, ["choices", "onChoose", "onKeydown"])) : e.model.fraction ? (o(), r("div", {
        key: 2,
        class: "quiz-input-wrap stage18-frac-wrap",
        onKeydown: n[0] || (n[0] = Oe((...t) => e.actions.keydown && e.actions.keydown(...t), ["enter"]))
      }, [
        l("div", jm, a(e.model.inputLabel), 1),
        l("div", Hm, [
          e.model.fraction.whole ? (o(), r("label", Pm, [
            l("span", Em, [
              n[8] || (n[8] = p(" Целая часть", -1)),
              e.model.fraction.locked ? k("", !0) : (o(), r(f, { key: 0 }, [
                n[6] || (n[6] = l("br", null, null, -1)),
                n[7] || (n[7] = p("(если есть)", -1))
              ], 64))
            ]),
            l("input", {
              id: e.model.fraction.whole.id,
              class: x(e.model.fraction.whole.className),
              autocomplete: "off",
              inputmode: e.model.fraction.whole.inputMode,
              "aria-label": e.model.fraction.whole.accessibleLabel,
              value: e.model.fraction.whole.value,
              disabled: e.model.fraction.whole.disabled
            }, null, 10, Am)
          ])) : k("", !0),
          l("div", Rm, [
            e.model.fraction.locked ? k("", !0) : (o(), r("div", Im, "Дробная часть")),
            l("div", Nm, [
              (o(!0), r(f, null, g(e.model.fraction.parts, (t, i) => (o(), r(f, {
                key: t.id
              }, [
                i ? (o(), r("div", Dm)) : k("", !0),
                e.model.fraction.locked ? (o(), r("label", Fm, [
                  l("span", Km, a(t.accessibleLabel), 1),
                  l("input", {
                    id: t.id,
                    class: x(t.className),
                    autocomplete: "off",
                    inputmode: t.inputMode,
                    "aria-label": t.accessibleLabel,
                    "aria-readonly": t.readOnly || null,
                    value: t.value,
                    disabled: t.disabled,
                    readonly: t.readOnly
                  }, null, 10, Vm)
                ])) : (o(), r("input", {
                  key: 2,
                  id: t.id,
                  class: x(t.className),
                  autocomplete: "off",
                  inputmode: t.inputMode,
                  "aria-label": t.accessibleLabel,
                  value: t.value,
                  disabled: t.disabled
                }, null, 10, Bm))
              ], 64))), 128))
            ])
          ])
        ]),
        l("div", Um, a(e.model.hint), 1)
      ], 32)) : (o(), r("div", {
        key: 3,
        class: "quiz-input-wrap",
        onKeydown: n[1] || (n[1] = Oe((...t) => e.actions.keydown && e.actions.keydown(...t), ["enter"]))
      }, [
        e.model.fields.length > 1 ? (o(), r("div", Wm, a(e.model.inputLabel), 1)) : (o(), r("label", {
          key: 1,
          class: "quiz-input-label",
          for: e.model.fields[0].id
        }, a(e.model.inputLabel), 9, zm)),
        e.model.fields.length > 1 ? (o(), r("div", Xm, [
          (o(!0), r(f, null, g(e.model.fields, (t) => (o(), r("label", {
            key: t.id,
            class: "coordinate-input-field"
          }, [
            l("span", null, a(t.label), 1),
            l("input", {
              id: t.id,
              class: x(t.className),
              autocomplete: "off",
              inputmode: t.inputMode,
              "aria-label": t.accessibleLabel,
              value: t.value,
              disabled: t.disabled
            }, null, 10, Gm)
          ]))), 128))
        ])) : (o(), r("div", Qm, [
          l("input", {
            id: e.model.fields[0].id,
            class: x(e.model.fields[0].className),
            autocomplete: "off",
            inputmode: e.model.fields[0].inputMode,
            value: e.model.fields[0].value,
            disabled: e.model.fields[0].disabled
          }, null, 10, Jm),
          e.model.suffix ? (o(), r("span", Ym, a(e.model.suffix), 1)) : k("", !0)
        ])),
        l("small", Zm, a(e.model.hint), 1)
      ], 32)),
      l("div", {
        id: "qfb",
        class: "feedback",
        innerHTML: e.model.feedback
      }, null, 8, _m),
      l("div", {
        class: "actions",
        onKeydown: n[5] || (n[5] = Oe((...t) => e.actions.keydown && e.actions.keydown(...t), ["enter"]))
      }, [
        e.model.check !== null ? (o(), r("button", {
          key: 0,
          id: "quizCheck",
          type: "button",
          class: "btn primary",
          style: Z(e.model.check),
          onClick: n[2] || (n[2] = (...t) => e.actions.check && e.actions.check(...t))
        }, "Проверить", 4)) : k("", !0),
        l("button", {
          id: "quizNext",
          type: "button",
          class: x(e.model.next.className),
          style: Z(e.model.next.style),
          onClick: n[3] || (n[3] = (...t) => e.actions.next && e.actions.next(...t))
        }, a(e.model.next.label), 7),
        l("button", {
          id: "quizSkip",
          type: "button",
          class: "btn soft",
          style: Z(e.model.skipStyle),
          onClick: n[4] || (n[4] = (...t) => e.actions.skip && e.actions.skip(...t))
        }, "⏭ Пропустить задание", 4)
      ], 32)
    ], 64));
  }
}, tf = ["inputmode", "data-row", "data-col", "data-exp", "aria-label", "value", "disabled", "readonly", "onClick"], nf = ["title"], fn = {
  __name: "ColumnCells",
  props: {
    cells: { type: Array, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e;
    function n(t) {
      t.key === "Enter" ? (t.preventDefault(), t.repeat || s.actions.primary()) : s.actions.moveCell(t, t.currentTarget);
    }
    return (t, i) => (o(!0), r(f, null, g(e.cells, (c, u) => (o(), r(f, { key: u }, [
      c.field ? (o(), r("input", {
        key: 0,
        class: x(c.className),
        maxlength: "1",
        inputmode: c.dot ? null : "numeric",
        "data-row": c.row,
        "data-col": c.col,
        "data-exp": c.expected,
        "aria-label": c.label,
        value: c.value,
        disabled: c.disabled,
        readonly: c.readOnly,
        onClick: (d) => c.dot && !d.currentTarget.readOnly && e.actions.toggleDot(d.currentTarget),
        onInput: i[0] || (i[0] = (d) => e.actions.inputCell(d.currentTarget)),
        onKeydown: n
      }, null, 42, tf)) : (o(), r("div", {
        key: 1,
        class: x(c.className),
        title: c.title
      }, a(c.text), 11, nf))
    ], 64))), 128));
  }
}, sf = ["innerHTML"], lf = ["innerHTML"], of = { class: "div-rows" }, af = { class: "div-side" }, rf = { class: "divisor-box" }, cf = { class: "quotient-inputs" }, uf = {
  key: 3,
  class: "cwrap"
}, df = ["innerHTML"], mf = { class: "actions" }, ff = ["innerHTML"], bf = {
  key: 5,
  id: "fb",
  class: "feedback",
  role: "status"
}, Ii = {
  __name: "ColumnExercise",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    function s(n) {
      n.repeat && n.preventDefault();
    }
    return (n, t) => (o(), r("div", {
      class: "card",
      onKeydown: Oe(s, ["enter"])
    }, [
      e.model.title ? (o(), r("div", {
        key: 0,
        class: "task-title",
        innerHTML: e.model.title
      }, null, 8, sf)) : k("", !0),
      e.model.help ? (o(), r("div", {
        key: 1,
        class: "carry-help",
        innerHTML: e.model.help
      }, null, 8, lf)) : k("", !0),
      e.model.division ? (o(), r("div", {
        key: 2,
        class: "div-layout",
        style: Z(e.model.division.style)
      }, [
        l("div", of, [
          (o(!0), r(f, null, g(e.model.rows, (i, c) => (o(), r("div", {
            key: c,
            class: x(i.className),
            style: Z(i.style)
          }, [
            N(fn, {
              cells: i.cells,
              actions: e.actions
            }, null, 8, ["cells", "actions"])
          ], 6))), 128))
        ]),
        l("div", af, [
          l("div", rf, a(e.model.division.divisor), 1),
          l("div", cf, [
            N(fn, {
              cells: e.model.division.quotient,
              actions: e.actions
            }, null, 8, ["cells", "actions"])
          ])
        ])
      ], 4)) : (o(), r("div", uf, [
        l("div", {
          class: "cgrid",
          style: Z(e.model.gridStyle)
        }, [
          (o(!0), r(f, null, g(e.model.rows, (i, c) => (o(), r(f, { key: c }, [
            i.className ? (o(), r("div", {
              key: 0,
              class: x(i.className),
              style: Z(i.style)
            }, [
              N(fn, {
                cells: i.cells,
                actions: e.actions
              }, null, 8, ["cells", "actions"])
            ], 6)) : (o(), Ce(fn, {
              key: 1,
              cells: i.cells,
              actions: e.actions
            }, null, 8, ["cells", "actions"]))
          ], 64))), 128))
        ], 4)
      ])),
      l("div", {
        class: x(e.model.noteClass),
        innerHTML: e.model.note
      }, null, 10, df),
      l("div", mf, [
        l("button", {
          id: "columnPrimary",
          type: "button",
          class: x(e.model.primaryClass),
          onClick: t[0] || (t[0] = (...i) => e.actions.primary && e.actions.primary(...i))
        }, a(e.model.primaryLabel), 3),
        nt(l("button", {
          id: "columnSkip",
          type: "button",
          class: "btn soft",
          onClick: t[1] || (t[1] = (...i) => e.actions.skip && e.actions.skip(...i))
        }, a(e.model.skipLabel), 513), [
          [Tt, !e.model.hideSkip]
        ])
      ]),
      e.model.feedbackHtml !== void 0 ? (o(), r("div", {
        key: 4,
        id: "fb",
        class: "feedback",
        role: "status",
        innerHTML: e.model.feedbackHtml
      }, null, 8, ff)) : (o(), r("div", bf, a(e.model.feedback), 1))
    ], 32));
  }
}, hf = { class: "quick-reference-head" }, yf = ["innerHTML"], vf = { class: "quick-reference-note" }, kf = ["innerHTML"], gf = { class: "quick-config" }, $f = { class: "quick-config-head" }, pf = { id: "quickSelectionText" }, Cf = { class: "quick-choice-row" }, xf = ["data-quick-setup", "onClick", "aria-pressed"], wf = { class: "quick-smart-wrap" }, Tf = { class: "quick-smart-row" }, Sf = ["data-quick-setup", "onClick", "aria-pressed"], Of = { class: "quick-personal" }, qf = {
  id: "quickSmartMessage",
  role: "status"
}, Mf = {
  key: 0,
  class: "quick-smart-empty"
}, Lf = { class: "quick-reference-actions" }, jf = {
  __name: "QuickTrainerSetup",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    function s(n) {
      n.repeat && n.preventDefault();
    }
    return (n, t) => (o(), r("div", {
      class: "quick-reference",
      onKeydown: Oe(s, ["enter"])
    }, [
      l("div", hf, [
        l("div", {
          class: "quick-reference-icon",
          innerHTML: e.model.icon
        }, null, 8, yf),
        l("div", null, [
          l("h2", null, a(e.model.title), 1),
          t[3] || (t[3] = l("p", null, "Посмотри на таблицу, выбери нужный диапазон и начинай тренировку.", -1))
        ])
      ]),
      l("p", vf, "Полный диапазон: " + a(e.model.range), 1),
      l("div", {
        style: { display: "contents" },
        innerHTML: e.model.reference
      }, null, 8, kf),
      l("div", gf, [
        l("div", $f, [
          t[4] || (t[4] = l("h3", null, "Что потренируем?", -1)),
          l("small", pf, a(e.model.selection), 1)
        ]),
        l("div", Cf, [
          (o(!0), r(f, null, g(e.model.choices, (i) => (o(), r("button", {
            key: i.action,
            type: "button",
            "data-quick-setup": i.action,
            onClick: (c) => e.actions.run(i.action),
            class: x(["quick-choice", { active: i.active, all: i.all }]),
            "aria-pressed": i.active
          }, a(i.label), 11, xf))), 128))
        ]),
        l("div", wf, [
          t[5] || (t[5] = l("div", { class: "quick-smart-title" }, "Режим", -1)),
          l("div", Tf, [
            (o(!0), r(f, null, g(e.model.smart, (i) => (o(), r("button", {
              key: i.action,
              type: "button",
              "data-quick-setup": i.action,
              onClick: (c) => e.actions.run(i.action),
              class: x(["quick-smart-btn", { active: i.active }]),
              "aria-pressed": i.active
            }, a(i.label), 11, Sf))), 128))
          ]),
          t[6] || (t[6] = l("div", { class: "quick-smart-note" }, "«Повторить» — примеры, которым нужна практика. «Ошибки» — только те, где уже были ошибки.", -1))
        ]),
        l("div", Of, a(e.model.personal), 1),
        l("div", qf, [
          e.model.smartMessage ? (o(), r("div", Mf, [
            l("span", null, a(e.model.smartMessage), 1),
            l("button", {
              type: "button",
              class: "btn soft",
              "data-quick-setup": "train-all",
              onClick: t[0] || (t[0] = (i) => e.actions.run("train-all"))
            }, "Тренировать все")
          ])) : k("", !0)
        ])
      ]),
      l("div", Lf, [
        l("button", {
          type: "button",
          class: "btn soft",
          "data-quick-setup": "home",
          onClick: t[1] || (t[1] = (i) => e.actions.run("home"))
        }, "← На главную"),
        l("button", {
          type: "button",
          id: "quickStartBtn",
          class: "btn primary",
          "data-quick-setup": "start",
          onClick: t[2] || (t[2] = (i) => e.actions.run("start"))
        }, "Начать тренировку")
      ])
    ], 32));
  }
}, Hf = { key: 0 }, Es = {
  __name: "TrainingPlanReturn",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      e.model.note ? (o(), r("span", Hf, "🧩 Этот блок открыт из плана тренировки.")) : k("", !0),
      l("button", {
        type: "button",
        class: "btn soft",
        onClick: n[0] || (n[0] = (...t) => e.actions.returnToPlan && e.actions.returnToPlan(...t))
      }, "← Вернуться к плану")
    ], 64));
  }
}, Pf = {
  key: 0,
  class: "training-plan-returnbar"
}, Ef = { class: "quick-screen" }, Af = { class: "home-back-row" }, Rf = { class: "quick-hero" }, If = { class: "quick-chip" }, Nf = { id: "quickXP" }, Df = { class: "quick-chip" }, Ff = { id: "quickCoins" }, Kf = { class: "quick-chip" }, Vf = { id: "quickRangeLabel" }, Bf = {
  __name: "QuickTrainerFrame",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      e.model.returnToPlan ? (o(), r("div", Pf, [
        N(Es, {
          model: { note: !0 },
          actions: e.actions
        }, null, 8, ["actions"])
      ])) : k("", !0),
      l("div", Ef, [
        l("div", Af, [
          l("button", {
            type: "button",
            class: "home-back-btn",
            onClick: n[0] || (n[0] = (...t) => e.actions.home && e.actions.home(...t))
          }, "← Главный экран")
        ]),
        l("section", Rf, [
          l("h1", null, a(e.model.title), 1),
          l("p", null, a(e.model.description), 1)
        ]),
        l("div", {
          id: "quickTopline",
          class: x(["quick-topline", { "is-hidden": !e.model.training }])
        }, [
          l("span", If, [
            n[1] || (n[1] = p("⭐ XP: ", -1)),
            l("b", Nf, a(e.model.xp), 1)
          ]),
          l("span", Df, [
            n[2] || (n[2] = p("🪙 Монеты: ", -1)),
            l("b", Ff, a(e.model.coins), 1)
          ]),
          l("span", Kf, [
            n[3] || (n[3] = p("Режим: ", -1)),
            l("b", Vf, a(e.model.range), 1)
          ])
        ], 2),
        n[4] || (n[4] = l("div", {
          "data-quick-panel-outlet": "",
          style: { display: "contents" }
        }, null, -1))
      ])
    ], 64));
  }
}, Uf = { class: "quick-live" }, Wf = { class: "quick-chip" }, zf = { id: "quickAnswered" }, Xf = { class: "quick-chip" }, Gf = { id: "quickCorrect" }, Qf = { class: "quick-chip" }, Jf = { id: "quickSessionStreak" }, Yf = ["innerHTML"], Zf = ["data-quick-option", "disabled", "onClick"], _f = ["innerHTML"], e1 = {
  __name: "QuickExercise",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Uf, [
        l("span", Wf, [
          n[5] || (n[5] = p("Всего: ", -1)),
          l("b", zf, a(e.model.answered), 1)
        ]),
        l("span", Xf, [
          n[6] || (n[6] = p("✅ Правильно: ", -1)),
          l("b", Gf, a(e.model.correct), 1)
        ]),
        l("span", Qf, [
          n[7] || (n[7] = p("🔥 Серия: ", -1)),
          l("b", Jf, a(e.model.streak), 1)
        ])
      ]),
      l("div", {
        class: x(["quick-question", { words: e.model.words }]),
        innerHTML: e.model.question
      }, null, 10, Yf),
      l("div", {
        class: "quick-answers",
        onKeydown: n[0] || (n[0] = Oe((...t) => e.actions.keydown && e.actions.keydown(...t), ["enter"]))
      }, [
        (o(!0), r(f, null, g(e.model.choices, (t) => (o(), r("button", {
          key: t.value,
          type: "button",
          class: x(t.className),
          "data-quick-option": t.value,
          disabled: t.disabled,
          onClick: (i) => e.actions.choose(t.value)
        }, a(t.value), 11, Zf))), 128))
      ], 32),
      l("div", {
        id: "quickFeedback",
        class: x(e.model.feedbackClass),
        role: "status",
        innerHTML: e.model.feedback
      }, null, 10, _f),
      l("div", {
        class: "quick-next",
        onKeydown: n[2] || (n[2] = Oe((...t) => e.actions.keydown && e.actions.keydown(...t), ["enter"]))
      }, [
        l("button", {
          type: "button",
          class: "btn primary",
          id: "quickNextBtn",
          style: Z(e.model.nextStyle),
          onClick: n[1] || (n[1] = (...t) => e.actions.next && e.actions.next(...t))
        }, "Следующий пример →", 4)
      ], 32),
      l("div", {
        class: "quick-end-row",
        onKeydown: n[4] || (n[4] = Oe((...t) => e.actions.keydown && e.actions.keydown(...t), ["enter"]))
      }, [
        l("button", {
          type: "button",
          class: "btn soft quick-end-btn",
          onClick: n[3] || (n[3] = (...t) => e.actions.finish && e.actions.finish(...t))
        }, "Завершить тренировку")
      ], 32)
    ], 64));
  }
}, t1 = { class: "quick-summary-card" }, n1 = { class: "quick-summary-grid" }, s1 = { class: "quick-summary-reward" }, l1 = { class: "quick-review-summary" }, i1 = {
  key: 0,
  class: "quick-review-facts"
}, o1 = {
  key: 1,
  class: "quick-review-ok"
}, a1 = { class: "quick-summary-actions" }, r1 = {
  __name: "QuickTrainerResult",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    function s(n) {
      n.repeat && n.preventDefault();
    }
    return (n, t) => (o(), r("div", {
      class: "quick-summary",
      onKeydown: Oe(s, ["enter"])
    }, [
      l("div", t1, [
        t[2] || (t[2] = l("h2", { tabindex: "-1" }, "Тренировка завершена!", -1)),
        l("p", null, a(e.model.title) + " • " + a(e.model.selection), 1)
      ]),
      l("div", n1, [
        (o(!0), r(f, null, g(e.model.stats, (i) => (o(), r("div", {
          key: i.label,
          class: "quick-summary-stat"
        }, [
          l("b", null, a(i.value), 1),
          l("span", null, a(i.label), 1)
        ]))), 128))
      ]),
      l("div", s1, [
        l("span", null, "+" + a(e.model.xp) + " XP", 1),
        l("span", null, "+" + a(e.model.coins) + " 🪙", 1)
      ]),
      l("div", l1, [
        t[3] || (t[3] = l("h3", null, "Стоит повторить", -1)),
        e.model.facts.length ? (o(), r("div", i1, [
          (o(!0), r(f, null, g(e.model.facts, (i) => (o(), r("span", {
            key: i,
            class: "quick-review-fact"
          }, a(i), 1))), 128))
        ])) : (o(), r("div", o1, "Отлично — в этой тренировке ошибок не было."))
      ]),
      l("div", a1, [
        l("button", {
          type: "button",
          class: "btn primary",
          onClick: t[0] || (t[0] = (...i) => e.actions.again && e.actions.again(...i))
        }, "Ещё раз"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: t[1] || (t[1] = (...i) => e.actions.home && e.actions.home(...i))
        }, "На главную"),
        e.model.returnToPlan ? (o(), Ce(Es, {
          key: 0,
          model: { note: !1 },
          actions: e.actions
        }, null, 8, ["actions"])) : k("", !0)
      ])
    ], 32));
  }
}, c1 = { class: "training-history-list" }, u1 = { class: "training-history-date" }, d1 = { class: "training-history-main" }, m1 = { class: "training-history-accuracy" }, Ni = {
  __name: "TrainingHistoryRows",
  props: { rows: { type: Array, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r("div", c1, [
      (o(!0), r(f, null, g(e.rows, (t) => (o(), r("div", {
        key: t.id,
        class: "training-history-row"
      }, [
        l("div", u1, a(t.date), 1),
        l("div", d1, [
          l("b", null, a(t.title), 1),
          l("small", null, a(t.summary), 1)
        ]),
        l("div", m1, a(t.accuracy) + "%", 1)
      ]))), 128))
    ]));
  }
}, f1 = { class: "home-start" }, b1 = { class: "grade-grid" }, h1 = ["onClick"], y1 = ["innerHTML"], v1 = ["id"], k1 = ["data-home-action", "onClick"], g1 = {
  class: "quick-home",
  "aria-labelledby": "quick-home-title"
}, $1 = { class: "quick-grid" }, p1 = ["onClick"], C1 = { class: "quick-card-content" }, x1 = ["innerHTML"], w1 = { class: "quick-card-copy" }, T1 = ["aria-label", "data-home-action", "onClick"], S1 = ["data-home-action", "onClick"], O1 = ["innerHTML"], q1 = { class: "mk854-goal-main" }, M1 = { class: "mk854-goal-title" }, L1 = { class: "mk854-goal-meta" }, j1 = { class: "training-goal-actions" }, H1 = ["data-home-action", "onClick"], P1 = {
  key: 0,
  class: "training-goal-progress-row"
}, E1 = ["aria-label"], A1 = { class: "training-goal-count" }, R1 = {
  key: 0,
  class: "training-plan-card home-training-plan"
}, I1 = { class: "training-plan-head" }, N1 = ["data-home-action"], D1 = { class: "training-history mk854-compact" }, F1 = {
  key: 1,
  class: "training-history-empty"
}, K1 = ["data-home-action", "onClick"], V1 = {
  __name: "HomeDashboard",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e;
    function n(t, i) {
      t.defaultPrevented || t.button !== 0 || t.metaKey || t.ctrlKey || t.shiftKey || t.altKey || t.target.closest("button, a[href]") || t.currentTarget.matches('.soon, .disabled, .locked, [aria-disabled="true"]') || s.actions.run(i);
    }
    return (t, i) => (o(), r(f, null, [
      l("section", f1, [
        l("h1", null, a(e.model.title), 1),
        l("p", null, a(e.model.description), 1),
        l("button", {
          type: "button",
          class: "mk19f-home-open",
          "data-home-action": "progress",
          onClick: i[0] || (i[0] = (c) => e.actions.run("progress"))
        }, "Мой прогресс")
      ]),
      l("div", b1, [
        (o(!0), r(f, null, g(e.model.grades, (c) => (o(), r("section", {
          key: c.action,
          class: x(c.className),
          onClick: (u) => n(u, c.action)
        }, [
          l("div", {
            class: "grade-ico",
            innerHTML: c.icon
          }, null, 8, y1),
          l("h2", null, a(c.title), 1),
          l("p", null, a(c.description), 1),
          l("div", {
            id: c.summaryId,
            class: "grade-summary"
          }, a(c.summary), 9, v1),
          l("button", {
            type: "button",
            class: "btn primary",
            "data-home-action": c.action,
            onClick: (u) => e.actions.run(c.action)
          }, a(c.buttonLabel), 9, k1)
        ], 10, h1))), 128))
      ]),
      l("section", g1, [
        i[4] || (i[4] = l("header", { class: "quick-home-head" }, [
          l("h2", { id: "quick-home-title" }, [
            l("span", { "aria-hidden": "true" }, "⚡"),
            p(" Быстрые тренажёры")
          ])
        ], -1)),
        l("div", $1, [
          (o(!0), r(f, null, g(e.model.trainers, (c) => (o(), r("article", {
            key: c.action,
            class: x(c.className),
            onClick: (u) => n(u, c.action)
          }, [
            c.description ? (o(), r(f, { key: 0 }, [
              l("div", C1, [
                l("span", {
                  class: "quick-card-icon",
                  "aria-hidden": "true",
                  innerHTML: c.icon
                }, null, 8, x1),
                l("div", w1, [
                  l("h3", null, a(c.title), 1),
                  l("p", null, a(c.description), 1)
                ])
              ]),
              l("button", {
                type: "button",
                class: "btn primary",
                "aria-label": c.label,
                "data-home-action": c.action,
                onClick: (u) => e.actions.run(c.action)
              }, "Тренироваться", 8, T1)
            ], 64)) : (o(), r("button", {
              key: 1,
              type: "button",
              class: "btn quick-compact-action",
              "data-home-action": c.action,
              onClick: (u) => e.actions.run(c.action)
            }, [
              l("span", {
                class: "quick-card-icon",
                "aria-hidden": "true",
                innerHTML: c.icon
              }, null, 8, O1),
              l("strong", null, a(c.title), 1),
              i[3] || (i[3] = l("span", {
                class: "quick-arrow",
                "aria-hidden": "true"
              }, "→", -1))
            ], 8, S1))
          ], 10, p1))), 128))
        ])
      ]),
      l("section", {
        class: x(e.model.goal.className)
      }, [
        l("div", q1, [
          l("div", M1, a(e.model.goal.title), 1),
          l("div", L1, a(e.model.goal.detail), 1)
        ]),
        l("div", j1, [
          (o(!0), r(f, null, g(e.model.goal.buttons, (c) => (o(), r("button", {
            key: c.action,
            type: "button",
            class: x(c.className),
            "data-home-action": c.action,
            onClick: (u) => e.actions.run(c.action)
          }, a(c.label), 11, H1))), 128))
        ]),
        e.model.goal.progress ? (o(), r("div", P1, [
          l("div", {
            class: "training-goal-track",
            "aria-label": e.model.goal.progress.label
          }, [
            l("span", {
              style: Z({ width: e.model.goal.progress.width })
            }, null, 4)
          ], 8, E1),
          l("div", A1, a(e.model.goal.progress.count), 1)
        ])) : k("", !0)
      ], 2),
      e.model.plan ? (o(), r("section", R1, [
        l("div", I1, [
          l("div", null, [
            l("h2", null, a(e.model.plan.title), 1),
            l("p", null, a(e.model.plan.progress), 1)
          ]),
          l("button", {
            type: "button",
            class: x(e.model.plan.button.className),
            "data-home-action": e.model.plan.button.action,
            onClick: i[1] || (i[1] = (c) => e.actions.run(e.model.plan.button.action))
          }, a(e.model.plan.button.label), 11, N1)
        ])
      ])) : k("", !0),
      l("section", D1, [
        i[5] || (i[5] = l("div", { class: "training-history-head" }, [
          l("h2", null, "Последние тренировки")
        ], -1)),
        e.model.history.rows.length ? (o(), Ce(Ni, {
          key: 0,
          rows: e.model.history.rows
        }, null, 8, ["rows"])) : (o(), r("div", F1, "Здесь появятся 2–3 последние тренировки.")),
        e.model.history.more ? (o(), r("button", {
          key: 2,
          type: "button",
          class: "training-history-more",
          "data-home-action": "history",
          onClick: i[2] || (i[2] = (c) => e.actions.run("history"))
        }, "Вся история →")) : k("", !0)
      ]),
      (o(!0), r(f, null, g(e.model.sections, (c) => (o(), r("section", {
        key: c.action,
        class: x(c.className)
      }, [
        l("div", null, [
          l("h2", null, a(c.title), 1),
          l("p", null, a(c.description), 1),
          l("div", {
            class: x(c.countClass)
          }, a(c.count), 3)
        ]),
        l("button", {
          type: "button",
          class: x(c.buttonClass),
          "data-home-action": c.action,
          onClick: (u) => e.actions.run(c.action)
        }, a(c.buttonLabel), 11, K1)
      ], 2))), 128))
    ], 64));
  }
}, B1 = ["data-mk-ui19-menu"], U1 = ["innerHTML"], W1 = ["title"], z1 = ["aria-label", "aria-valuemax", "aria-valuenow"], X1 = { class: "mk872-xp-head" }, G1 = { id: "level" }, Q1 = { class: "mk872-xp-track" }, J1 = { class: "mk872-xp-foot" }, Y1 = { id: "coins" }, Z1 = ["aria-expanded", "aria-label"], _1 = {
  id: "mk-ui19-navigation",
  class: "mk-ui19-nav-wrap",
  "aria-label": "Разделы МатКвеста"
}, eb = ["data-header-action", "onClick"], tb = { class: "pill mk-ui19-secondary-resource" }, nb = { id: "streak" }, sb = {
  __name: "AppHeader",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e, n = [
      { action: "shop", label: "Магазин", icon: "shop" },
      { action: "data", label: "Данные", icon: "data" },
      { action: "journal", label: "Журнал", icon: "journal", pill: "report" },
      { action: "leaders", label: "Лидеры", icon: "trophy", pill: "leader" }
    ], t = /* @__PURE__ */ Me(null), i = /* @__PURE__ */ Me(null), c = window.matchMedia("(max-width: 1120px)"), u = /* @__PURE__ */ Me(c.matches && !!s.model.menuOpen), d = ne(() => s.model.progress), m = ne(() => Math.floor(d.value.xpIntoLevel)), v = ne(() => Math.ceil(d.value.xpRemaining)), h = ne(() => d.value.currentLevel + 1), $ = ne(
      () => `Уровень ${d.value.currentLevel}: ${m.value} из ${d.value.xpNeededForLevel} XP до уровня ${h.value}, осталось ${v.value} XP`
    );
    function q(H = !1) {
      u.value && (u.value = !1, H && i.value?.focus({ preventScroll: !0 }));
    }
    function j(H, L = !1) {
      q(L), s.actions[H]();
    }
    function W(H) {
      t.value?.contains(H.target) || q();
    }
    function F(H) {
      H.key !== "Escape" || !u.value || (H.preventDefault(), q(!0));
    }
    function G(H) {
      H.matches || q();
    }
    function X() {
      q();
    }
    return In(() => {
      document.addEventListener("click", W), document.addEventListener("focusin", W), document.addEventListener("keydown", F), c.addEventListener("change", G), window.addEventListener("popstate", X);
    }), ii(() => {
      document.removeEventListener("click", W), document.removeEventListener("focusin", W), document.removeEventListener("keydown", F), c.removeEventListener("change", G), window.removeEventListener("popstate", X);
    }), (H, L) => (o(), r("header", {
      ref_key: "header",
      ref: t,
      class: "top"
    }, [
      l("button", {
        type: "button",
        class: "brand mk872-brand-home",
        "data-header-action": "home",
        "aria-label": "МатКвест — на главную",
        title: "На главную",
        onClick: L[0] || (L[0] = (M) => j("home"))
      }, [...L[4] || (L[4] = [
        l("span", {
          id: "brandLogo",
          class: "logo"
        }, "M", -1),
        l("span", { id: "brandTitle" }, "МатКвест", -1)
      ])]),
      l("div", {
        class: "stats",
        "data-mk-ui19-menu": u.value ? "open" : "closed"
      }, [
        l("button", {
          type: "button",
          class: "pill profile-pill",
          "data-header-action": "profile",
          onClick: L[1] || (L[1] = (M) => j("profile"))
        }, [
          l("span", {
            id: "playerAvatar",
            "aria-hidden": "true",
            innerHTML: e.model.avatar
          }, null, 8, U1),
          l("span", {
            id: "playerName",
            class: x(["nickname-style", e.model.nameClass]),
            title: e.model.name
          }, a(e.model.name), 11, W1)
        ]),
        l("div", {
          id: "mk872TopLevelProgress",
          class: "mk872-xp-progress compact mk872-top-progress",
          role: "progressbar",
          "aria-label": $.value,
          "aria-valuemin": "0",
          "aria-valuemax": d.value.xpNeededForLevel,
          "aria-valuenow": m.value
        }, [
          l("div", X1, [
            l("span", null, [
              L[5] || (L[5] = p("Уровень ", -1)),
              l("span", G1, a(d.value.currentLevel), 1),
              p(" → " + a(h.value), 1)
            ]),
            l("span", null, a(Math.round(d.value.progressPercent)) + "%", 1)
          ]),
          l("div", Q1, [
            l("span", {
              class: "mk872-xp-fill",
              style: Z({ width: d.value.progressPercent + "%" })
            }, null, 4)
          ]),
          l("div", J1, a(m.value) + " / " + a(d.value.xpNeededForLevel) + " XP · до ур. " + a(h.value) + ": " + a(v.value) + " XP", 1)
        ], 8, z1),
        l("button", {
          type: "button",
          class: "pill mk19e-coin-shortcut",
          "data-header-action": "wallet",
          "aria-label": "Открыть кошелёк и посмотреть монеты",
          title: "Открыть кошелёк",
          onClick: L[2] || (L[2] = (M) => j("wallet"))
        }, [
          L[6] || (L[6] = l("span", {
            class: "ui-glyph ui-coin",
            "aria-hidden": "true"
          }, null, -1)),
          L[7] || (L[7] = p()),
          l("span", Y1, a(e.model.coins), 1)
        ]),
        l("button", {
          ref_key: "toggle",
          ref: i,
          type: "button",
          class: "mk-ui19-nav-toggle",
          "data-header-action": "menu",
          "aria-controls": "mk-ui19-navigation",
          "aria-expanded": u.value,
          "aria-label": u.value ? "Закрыть меню разделов" : "Открыть меню разделов",
          onClick: L[3] || (L[3] = (M) => u.value = !u.value)
        }, [...L[8] || (L[8] = [
          l("span", {
            class: "mk-ui19-hamburger",
            "aria-hidden": "true"
          }, [
            l("i"),
            l("i"),
            l("i")
          ], -1),
          l("span", null, "Меню", -1)
        ])], 8, Z1),
        l("nav", _1, [
          (o(), r(f, null, g(n, (M) => l("button", {
            key: M.action,
            type: "button",
            class: x(["pill", (M.pill || M.action) + "-pill"]),
            "data-header-action": M.action,
            onClick: (B) => j(M.action, !0)
          }, [
            l("span", {
              class: x(["ui-glyph", "ui-" + M.icon]),
              "aria-hidden": "true"
            }, null, 2),
            p(" " + a(M.label), 1)
          ], 10, eb)), 64)),
          l("div", tb, [
            L[9] || (L[9] = l("span", {
              class: "ui-glyph ui-fire",
              "aria-hidden": "true"
            }, null, -1)),
            L[10] || (L[10] = p()),
            l("span", nb, a(e.model.streak), 1)
          ])
        ])
      ], 8, B1)
    ], 512));
  }
}, lb = ["title"], ib = {
  __name: "AppFooter",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("button", {
      id: "appVersionBadge",
      type: "button",
      title: e.model.title || null,
      onClick: n[0] || (n[0] = (...t) => e.actions.activate && e.actions.activate(...t))
    }, a(e.model.label), 9, lb));
  }
}, ob = ["aria-invalid"], ab = {
  id: "devAccessError",
  class: "dev-error",
  role: "alert"
}, rb = { class: "dev-actions" }, cb = {
  __name: "DeveloperAccess",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    function s(n, t) {
      const i = n.currentTarget.elements.code, c = i.value;
      i.value = "", t.submit(c);
    }
    return (n, t) => (o(), r(f, null, [
      t[3] || (t[3] = l("h2", { id: "devAccessHeading" }, "Код разработчика", -1)),
      l("form", {
        id: "devAccessForm",
        autocomplete: "off",
        onSubmit: t[1] || (t[1] = Qe((i) => s(i, e.actions), ["prevent"]))
      }, [
        l("input", {
          id: "devAccessInput",
          name: "code",
          type: "password",
          "aria-label": "Код разработчика",
          "aria-invalid": !!e.model.error,
          "aria-describedby": "devAccessError",
          autocomplete: "off",
          required: ""
        }, null, 8, ob),
        l("div", ab, a(e.model.error), 1),
        l("div", rb, [
          l("button", {
            id: "devAccessCancel",
            type: "button",
            class: "btn soft",
            onClick: t[0] || (t[0] = (...i) => e.actions.close && e.actions.close(...i))
          }, "Отмена"),
          t[2] || (t[2] = l("button", {
            type: "submit",
            class: "btn primary"
          }, "Войти", -1))
        ])
      ], 32)
    ], 64));
  }
}, ub = { class: "mk870-top" }, db = { class: "mk870-status" }, mb = { class: "mk870-actions" }, fb = { class: "mk870-field" }, bb = ["value"], hb = ["value"], yb = { class: "mk870-status" }, vb = {
  key: 0,
  class: "mk870-group"
}, kb = ["onSubmit"], gb = ["id", "aria-label", "placeholder"], $b = ["data-dev-action"], pb = {
  key: 1,
  class: "mk870-actions"
}, Cb = ["data-dev-action", "onClick"], xb = { key: 0 }, wb = {
  id: "mk872LegacyPanel",
  class: "mk872-legacy-info"
}, Tb = {
  id: "mk870PanelError",
  class: "mk870-error",
  role: "status"
}, Sb = {
  __name: "DeveloperPanel",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", ub, [
        n[6] || (n[6] = l("h2", { id: "mk870PanelTitle" }, "Панель разработчика", -1)),
        l("button", {
          type: "button",
          class: "btn soft",
          "data-dev-action": "close",
          onClick: n[0] || (n[0] = (...t) => e.actions.close && e.actions.close(...t))
        }, "Закрыть")
      ]),
      e.model.confirmation ? (o(), r(f, { key: 0 }, [
        l("div", db, [
          l("h3", null, a(e.model.confirmation.title), 1),
          l("p", null, a(e.model.confirmation.description), 1)
        ]),
        l("div", mb, [
          l("button", {
            type: "button",
            class: "btn soft",
            "data-dev-action": "cancel",
            onClick: n[1] || (n[1] = (...t) => e.actions.cancel && e.actions.cancel(...t))
          }, "Отмена"),
          l("button", {
            type: "button",
            class: "btn primary",
            "data-dev-action": "confirm",
            onClick: n[2] || (n[2] = (...t) => e.actions.confirm && e.actions.confirm(...t))
          }, a(e.model.confirmation.label), 1)
        ])
      ], 64)) : (o(), r(f, { key: 1 }, [
        l("div", fb, [
          n[7] || (n[7] = l("label", { for: "mk870Select" }, "Профиль:", -1)),
          l("select", {
            id: "mk870Select",
            value: e.model.name,
            onChange: n[3] || (n[3] = (t) => e.actions.select(t.target.value))
          }, [
            (o(!0), r(f, null, g(e.model.profiles, (t) => (o(), r("option", {
              key: t.name,
              value: t.name
            }, a(t.label), 9, hb))), 128))
          ], 40, bb),
          l("button", {
            type: "button",
            class: "btn soft",
            "data-dev-action": "create",
            onClick: n[4] || (n[4] = (t) => e.actions.run("create"))
          }, "Создать тестового ученика")
        ]),
        l("div", yb, [
          l("b", null, a(e.model.name), 1),
          p(" • " + a(e.model.test ? "TEST" : "Обычный") + " ", 1),
          l("div", null, [
            n[8] || (n[8] = p("Монеты: ", -1)),
            l("b", null, a(e.model.coins), 1),
            n[9] || (n[9] = p(" • XP: ", -1)),
            l("b", null, a(e.model.xp), 1),
            n[10] || (n[10] = p(" • уровень: ", -1)),
            l("b", null, a(e.model.level), 1)
          ]),
          l("div", null, [
            n[11] || (n[11] = p("Предметов: ", -1)),
            l("b", null, a(e.model.items), 1),
            n[12] || (n[12] = p(" • выбранный герой: ", -1)),
            l("b", null, a(e.model.avatar), 1)
          ])
        ]),
        e.model.test ? k("", !0) : (o(), r("div", vb, "Изменение монет, опыта и предметов доступно только тестовым ученикам.")),
        (o(!0), r(f, null, g(e.model.groups, (t) => (o(), r("section", {
          key: t.title,
          class: "mk870-group"
        }, [
          l("h3", null, a(t.title), 1),
          (o(!0), r(f, null, g(t.rows, (i, c) => (o(), r(f, { key: c }, [
            i.field ? (o(), r("form", {
              key: 0,
              class: "mk870-field",
              novalidate: "",
              onSubmit: Qe((u) => e.actions.run(i.field.action, u.target.elements.amount.value), ["prevent"])
            }, [
              l("input", {
                id: i.field.id,
                name: "amount",
                type: "number",
                step: "1",
                min: "0",
                "aria-label": i.field.label,
                placeholder: i.field.label
              }, null, 8, gb),
              l("button", {
                type: "submit",
                class: "btn soft",
                "data-dev-action": i.field.action
              }, a(i.field.button), 9, $b)
            ], 40, kb)) : (o(), r("div", pb, [
              (o(!0), r(f, null, g(i.buttons, (u) => (o(), r("button", {
                key: u.action,
                type: "button",
                class: "btn soft",
                "data-dev-action": u.action,
                onClick: (d) => e.actions.run(u.action)
              }, a(u.label), 9, Cb))), 128))
            ]))
          ], 64))), 128)),
          t.note ? (o(), r("small", xb, a(t.note), 1)) : k("", !0)
        ]))), 128)),
        l("section", wb, [
          n[13] || (n[13] = l("b", null, "Старые предметы", -1)),
          l("div", null, "Архивных аватаров во владении: " + a(e.model.archive), 1),
          n[14] || (n[14] = l("small", null, "История старых аватаров доступна в «Моей коллекции».", -1)),
          l("button", {
            type: "button",
            class: "btn soft",
            "data-dev-action": "archive",
            onClick: n[5] || (n[5] = (t) => e.actions.run("archive"))
          }, "Открыть архив")
        ])
      ], 64)),
      l("div", Tb, a(e.model.status), 1)
    ], 64));
  }
}, Ob = ["aria-hidden"], qb = {
  __name: "RewardNotice",
  props: {
    model: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("div", {
      id: "rewardPop",
      class: x(["reward-pop", { show: e.model.visible }]),
      role: "status",
      "aria-atomic": "true"
    }, [
      (o(), r("span", {
        key: e.model.id,
        "aria-hidden": !e.model.visible
      }, a(e.model.text), 9, Ob))
    ], 2));
  }
}, Mb = { class: "lesson" }, Lb = {
  key: 1,
  class: "training-history-empty"
}, jb = {
  __name: "TrainingHistoryReport",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", Mb, [
        n[0] || (n[0] = p(" Только реальные тренировки — без пропусков и календарных штрафов. Всего: ", -1)),
        l("b", null, a(e.model.sessions), 1),
        n[1] || (n[1] = p(", заданий: ", -1)),
        l("b", null, a(e.model.questions), 1),
        n[2] || (n[2] = p(", общая точность: ", -1)),
        l("b", null, a(e.model.accuracy) + "%", 1),
        n[3] || (n[3] = p(". ", -1))
      ]),
      e.model.rows.length ? (o(), Ce(Ni, {
        key: 0,
        rows: e.model.rows
      }, null, 8, ["rows"])) : (o(), r("div", Lb, "Здесь появятся результаты тренировок."))
    ], 64));
  }
}, Hb = {
  id: "mk19fProgress",
  class: "mk19f-modal"
}, Pb = { class: "mk19f-xp-summary" }, Eb = { class: "mk19f-xp-top" }, Ab = { class: "mk19f-xp-percent" }, Rb = ["aria-label", "aria-valuemax", "aria-valuenow"], Ib = { class: "mk19f-xp-bottom" }, Nb = { class: "mk19f-overall" }, Db = { class: "mk19f-grade-grid" }, Fb = { class: "mk19f-grade-head" }, Kb = ["aria-label", "aria-valuemax", "aria-valuenow"], Vb = { class: "mk19f-row-detail" }, Bb = { class: "mk19f-row-modes" }, Ub = ["onClick"], Wb = { class: "mk19f-footnote" }, zb = {
  __name: "StudentProgress",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", Hb, [
        l("section", Pb, [
          l("div", Eb, [
            l("strong", null, "Игровой уровень " + a(e.model.level) + " → " + a(e.model.level + 1), 1),
            l("span", Ab, a(e.model.xp.percent) + "%", 1)
          ]),
          l("span", {
            class: "mk19f-progress-track",
            role: "progressbar",
            "aria-label": e.model.xp.label,
            "aria-valuemin": "0",
            "aria-valuemax": e.model.xp.total,
            "aria-valuenow": e.model.xp.done
          }, [
            l("span", {
              class: "mk19f-progress-fill",
              style: Z({ width: e.model.xp.percent + "%" })
            }, null, 4)
          ], 8, Rb),
          l("div", Ib, a(e.model.xp.detail), 1)
        ]),
        l("section", Nb, [
          l("div", null, [
            l("strong", null, a(e.model.overall), 1),
            n[0] || (n[0] = l("div", { class: "mk19f-small" }, "По доступным темам всех восьми классов", -1))
          ]),
          l("strong", null, a(e.model.percent) + "%", 1)
        ]),
        l("div", Db, [
          (o(!0), r(f, null, g(e.model.grades, (t) => (o(), r("article", {
            key: t.grade,
            class: "mk19f-grade-row"
          }, [
            l("div", Fb, [
              l("strong", null, a(t.grade) + " класс", 1),
              l("b", null, a(t.percent) + "%", 1)
            ]),
            l("span", {
              class: "mk19f-progress-track",
              role: "progressbar",
              "aria-label": t.label,
              "aria-valuemin": "0",
              "aria-valuemax": t.total,
              "aria-valuenow": t.done
            }, [
              l("span", {
                class: "mk19f-progress-fill",
                style: Z({ width: t.percent + "%" })
              }, null, 4)
            ], 8, Kb),
            l("div", Vb, a(t.detail), 1),
            l("div", Bb, "Разминка " + a(t.warmup) + " · Тренировка " + a(t.training) + " · Мастерство " + a(t.master), 1),
            l("button", {
              type: "button",
              onClick: (i) => e.actions.openGrade(t.grade)
            }, "Открыть " + a(t.grade) + " класс", 9, Ub)
          ]))), 128))
        ]),
        l("p", Wb, a(e.model.note), 1)
      ])
    ], 64));
  }
}, Xb = { class: "lesson" }, Gb = { class: "goal-picker-grid" }, Qb = ["onClick"], Jb = { class: "goal-reward" }, Yb = {
  __name: "TrainingGoalPicker",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", Xb, a(e.model.description), 1),
      l("div", Gb, [
        (o(!0), r(f, null, g(e.model.options, (t) => (o(), r("button", {
          key: t.index,
          type: "button",
          class: "goal-option",
          onClick: (i) => e.actions.choose(t.index)
        }, [
          l("b", null, a(t.title), 1),
          l("small", null, a(t.description), 1),
          l("span", Jb, "Награда: +" + a(t.xp) + " XP · +" + a(t.coins) + " 🪙", 1)
        ], 8, Qb))), 128))
      ])
    ], 64));
  }
}, Zb = { class: "training-plan-screen" }, _b = { class: "home-back-row" }, eh = { class: "training-plan-hero" }, th = { class: "training-plan-head" }, nh = {
  key: 0,
  class: "training-plan-progress"
}, sh = ["aria-valuemax", "aria-valuenow"], lh = { class: "training-plan-count" }, ih = {
  key: 0,
  class: "training-plan-list"
}, oh = { class: "training-plan-index" }, ah = { key: 0 }, rh = { class: "training-plan-item-meta" }, ch = { class: "training-plan-chip" }, uh = {
  key: 0,
  class: "training-plan-chip"
}, dh = { class: "training-plan-actions" }, mh = ["disabled", "onClick"], fh = {
  key: 1,
  class: "training-plan-empty"
}, bh = {
  key: 2,
  class: "training-plan-editor-actions"
}, hh = ["onClick"], yh = {
  key: 3,
  class: "training-plan-note"
}, vh = {
  __name: "TrainingPlan",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r("div", Zb, [
      l("div", _b, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: n[0] || (n[0] = (t) => e.actions.back())
        }, a(e.model.backLabel), 1)
      ]),
      l("section", eh, [
        l("div", th, [
          l("div", null, [
            l("h1", null, a(e.model.title), 1),
            l("p", null, a(e.model.description), 1)
          ]),
          l("span", {
            class: x(["training-plan-status", { done: e.model.done }])
          }, a(e.model.status), 3)
        ]),
        e.model.progress.total ? (o(), r("div", nh, [
          l("div", {
            class: "training-plan-track",
            role: "progressbar",
            "aria-label": "Выполнено блоков плана",
            "aria-valuemin": "0",
            "aria-valuemax": e.model.progress.total,
            "aria-valuenow": e.model.progress.done
          }, [
            l("span", {
              style: Z({ width: e.model.progress.pct + "%" })
            }, null, 4)
          ], 8, sh),
          l("div", lh, a(e.model.progress.done) + "/" + a(e.model.progress.total), 1)
        ])) : k("", !0)
      ]),
      e.model.items.length ? (o(), r("div", ih, [
        (o(!0), r(f, null, g(e.model.items, (t) => (o(), r("div", {
          key: t.id,
          class: x(["training-plan-item", { done: t.done, current: t.current }])
        }, [
          l("div", oh, a(t.done ? "✓" : t.number), 1),
          l("div", null, [
            l("h3", null, a(t.title), 1),
            l("p", null, [
              e.model.editor ? (o(), r("b", ah, "Почему стоит повторить: ")) : k("", !0),
              p(a(t.reason), 1)
            ]),
            l("div", rh, [
              l("span", ch, a(t.type), 1),
              t.status ? (o(), r("span", uh, a(t.status), 1)) : k("", !0)
            ])
          ]),
          l("div", dh, [
            (o(!0), r(f, null, g(t.buttons, (i) => (o(), r("button", {
              key: i.key,
              type: "button",
              class: x(i.className),
              disabled: i.disabled,
              onClick: (c) => e.actions[i.key](t.id)
            }, a(i.label), 11, mh))), 128))
          ])
        ], 2))), 128))
      ])) : (o(), r("div", fh, a(e.model.empty), 1)),
      e.model.buttons.length ? (o(), r("div", bh, [
        (o(!0), r(f, null, g(e.model.buttons, (t) => (o(), r("button", {
          key: t.key,
          type: "button",
          class: x(t.className),
          onClick: (i) => e.actions[t.key]()
        }, a(t.label), 11, hh))), 128))
      ])) : k("", !0),
      e.model.note ? (o(), r("div", yh, a(e.model.note), 1)) : k("", !0)
    ]));
  }
}, kh = ["id"], gh = { class: "column-cloud-head" }, $h = {
  key: 0,
  class: "pilot-summary column-cloud-result"
}, ph = { key: 3 }, Ch = ["id"], xh = { class: "pilot-actions column-cloud-actions" }, wh = {
  __name: "SchoolAttempt",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("section", {
        id: e.model.rootId
      }, [
        l("div", gh, [
          N(Ps, {
            model: e.model.progress,
            style: { flex: "1" }
          }, null, 8, ["model"])
        ]),
        n[4] || (n[4] = l("p", {
          class: "column-cloud-status",
          role: "status",
          "aria-live": "polite"
        }, null, -1)),
        e.model.finished ? (o(), r("div", $h, [
          e.model.summary ? (o(), r(f, { key: 0 }, [
            p(" С первой попытки " + a(e.model.summary.correct) + " из " + a(e.model.progress.total) + ". Исправлено " + a(e.model.summary.corrected) + ". Пропущено " + a(e.model.summary.skipped) + ". " + a(e.model.summary.passed ? "Этап пройден." : "Этап пока не пройден.") + " ", 1),
            e.model.summary.pending ? (o(), r(f, { key: 0 }, [
              p(" Результат сохранён. Синхронизируем, когда появится интернет.")
            ], 64)) : e.model.summary.alreadySynced ? (o(), r(f, { key: 1 }, [
              p(" Этот блок уже учтён.")
            ], 64)) : (o(), r(f, { key: 2 }, [
              p(" Начислено " + a(e.model.summary.xp) + " XP и " + a(e.model.summary.coins) + " монет.", 1)
            ], 64)),
            e.model.summary.achievement === "g4EquationsMaster" ? (o(), r("p", ph, " Достижение «Мастер уравнений», титул «Повелитель уравнений» и значок «Уравнения». ")) : k("", !0)
          ], 64)) : (o(), r(f, { key: 1 }, [
            p("Тренировка закрыта без награды.")
          ], 64))
        ])) : (o(), r("div", {
          key: 1,
          id: e.model.questionId,
          class: "school-question",
          onInput: n[0] || (n[0] = (...t) => e.actions.input && e.actions.input(...t)),
          onClick: n[1] || (n[1] = (...t) => e.actions.input && e.actions.input(...t))
        }, [
          e.model.column ? (o(), Ce(Ii, {
            key: 0,
            model: e.model.exercise,
            actions: e.actions
          }, null, 8, ["model", "actions"])) : (o(), Ce(Ri, {
            key: 1,
            model: e.model.exercise,
            actions: e.actions
          }, null, 8, ["model", "actions"]))
        ], 40, Ch)),
        l("div", xh, [
          e.model.finished ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn soft",
            onClick: n[2] || (n[2] = (...t) => e.actions.back && e.actions.back(...t))
          }, "К этапам")) : (o(), r("button", {
            key: 1,
            type: "button",
            class: "btn soft",
            onClick: n[3] || (n[3] = (...t) => e.actions.abandon && e.actions.abandon(...t))
          }, "Завершить без награды"))
        ])
      ], 8, kh)
    ], 64));
  }
}, Th = ["innerHTML"], Sh = {
  id: "schoolTrainingProgress",
  style: { display: "contents" }
}, Oh = ["innerHTML"], qh = ["innerHTML"], Mh = {
  __name: "SchoolAttemptFrame",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      e.model.lesson && e.model.lessonFirst ? (o(), r("div", {
        key: 0,
        class: "lesson",
        innerHTML: e.model.lesson
      }, null, 8, Th)) : k("", !0),
      l("div", Sh, [
        N(Ps, {
          model: e.model.progress
        }, null, 8, ["model"])
      ]),
      e.model.lesson && !e.model.lessonFirst ? (o(), r("div", {
        key: 1,
        class: "lesson",
        innerHTML: e.model.lesson
      }, null, 8, Oh)) : k("", !0),
      e.model.guide ? (o(), r("div", {
        key: 2,
        class: "column-guide",
        innerHTML: e.model.guide
      }, null, 8, qh)) : k("", !0)
    ], 64));
  }
}, Lh = { class: "actions" }, jh = {
  __name: "FractionMixIntro",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      n[1] || (n[1] = l("div", { class: "lesson" }, [
        l("b", null, "12 заданий"),
        p(" вперемешку из тем по обыкновенным дробям. Вопросы внутри попытки не повторяются, результат попадёт в общий журнал ученика. ")
      ], -1)),
      l("div", Lh, [
        l("button", {
          type: "button",
          class: "btn primary",
          onClick: n[0] || (n[0] = (...t) => e.actions.start && e.actions.start(...t))
        }, "Начать микс")
      ])
    ], 64));
  }
}, Hh = ["data-frame-rarity", "data-mk-avatar-id"], Ph = ["innerHTML"], Eh = ["innerHTML"], Ah = { class: "profile-preview-info" }, Rh = ["title"], Ih = {
  key: 0,
  class: "profile-title-line"
}, Nh = {
  key: 1,
  class: "profile-title-line empty"
}, Dh = ["aria-valuemax", "aria-valuenow", "aria-label"], Fh = { class: "mk872-xp-head" }, Kh = { class: "mk872-xp-track" }, Vh = { class: "mk872-xp-foot" }, Bh = {
  key: 2,
  class: "profile-badges compact"
}, Uh = ["title", "innerHTML"], Wh = {
  key: 3,
  class: "profile-badge-empty"
}, zh = { class: "profile-sticker-line" }, Xh = {
  key: 0,
  class: "favorite-stickers large"
}, Gh = ["title", "innerHTML"], Qh = {
  key: 1,
  class: "favorite-empty"
}, Jh = { class: "shop-balance" }, Di = {
  __name: "ProfilePreview",
  props: {
    model: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e, n = ne(() => {
      const t = s.model.progress;
      return {
        current: t.currentLevel,
        next: t.currentLevel + 1,
        xp: Math.floor(t.xpIntoLevel),
        total: t.xpNeededForLevel,
        remaining: Math.ceil(t.xpRemaining),
        percent: t.progressPercent
      };
    });
    return (t, i) => (o(), r("div", {
      class: x(["profile-preview profile-cosmetic-card", e.model.backgroundClass])
    }, [
      l("span", {
        class: x(["avatar-badge large", [e.model.avatar.frame, { "has-raster-avatar": e.model.avatar.raster }]]),
        "data-frame-rarity": e.model.avatar.rarity,
        "data-mk-avatar-id": e.model.avatar.id
      }, [
        e.model.avatar.effectClass !== null ? (o(), r("span", {
          key: 0,
          class: x(["avatar-effect-layer", e.model.avatar.effectClass])
        }, null, 2)) : k("", !0),
        l("span", {
          class: "avatar-core",
          innerHTML: e.model.avatar.core
        }, null, 8, Ph),
        e.model.avatar.pet ? (o(), r("span", {
          key: 1,
          class: "pet-mini",
          innerHTML: e.model.avatar.pet
        }, null, 8, Eh)) : k("", !0)
      ], 10, Hh),
      l("div", Ah, [
        l("b", {
          class: x(["nickname-style", e.model.nameClass]),
          title: e.model.name
        }, a(e.model.name), 11, Rh),
        e.model.title ? (o(), r("div", Ih, "🏷️ " + a(e.model.title), 1)) : (o(), r("div", Nh, "Без титула")),
        l("small", {
          class: x({ "profile-dark-copy": e.model.dark })
        }, [
          p(" Уровень " + a(n.value.current) + " • собрано " + a(e.model.owned) + " предметов", 1),
          i[0] || (i[0] = l("br", null, null, -1)),
          i[1] || (i[1] = l("b", null, "Рамка:", -1)),
          p(" " + a(e.model.frame) + " • ", 1),
          i[2] || (i[2] = l("b", null, "Питомец:", -1)),
          p(" " + a(e.model.pet) + " • ", 1),
          i[3] || (i[3] = l("b", null, "Фон:", -1)),
          p(" " + a(e.model.background), 1),
          i[4] || (i[4] = l("br", null, null, -1)),
          i[5] || (i[5] = l("b", null, "аура:", -1)),
          p(" " + a(e.model.effect), 1)
        ], 2),
        l("div", {
          class: "mk872-xp-progress",
          role: "progressbar",
          "aria-valuemin": "0",
          "aria-valuemax": n.value.total,
          "aria-valuenow": n.value.xp,
          "aria-label": `Уровень ${n.value.current}: ${n.value.xp} из ${n.value.total} XP до уровня ${n.value.next}; осталось ${n.value.remaining} XP`
        }, [
          l("div", Fh, [
            l("span", null, "Уровень " + a(n.value.current) + " → " + a(n.value.next), 1),
            l("span", null, a(Math.round(n.value.percent)) + "%", 1)
          ]),
          l("div", Kh, [
            l("span", {
              class: "mk872-xp-fill",
              style: Z({ width: n.value.percent + "%" })
            }, null, 4)
          ]),
          l("div", Vh, a(n.value.xp) + " / " + a(n.value.total) + " XP · до ур. " + a(n.value.next) + ": " + a(n.value.remaining) + " XP", 1)
        ], 8, Dh),
        e.model.badges.length ? (o(), r("span", Bh, [
          (o(!0), r(f, null, g(e.model.badges, (c) => (o(), r("span", {
            key: c.id,
            class: "profile-badge-chip",
            title: c.name,
            innerHTML: c.icon
          }, null, 8, Uh))), 128))
        ])) : (o(), r("span", Wh, "значки не выбраны")),
        l("div", zh, [
          i[6] || (i[6] = l("b", { style: { "font-size": "12px" } }, "Любимые:", -1)),
          e.model.stickers.length ? (o(), r("span", Xh, [
            (o(!0), r(f, null, g(e.model.stickers, (c) => (o(), r("span", {
              key: c.id,
              class: "favorite-sticker",
              title: c.name,
              innerHTML: c.icon
            }, null, 8, Gh))), 128))
          ])) : (o(), r("span", Qh, "стикеры не выбраны"))
        ])
      ]),
      l("div", Jh, "🪙 " + a(e.model.coins), 1)
    ], 2));
  }
}, Yh = { class: "mk871-profiles-screen" }, Zh = { class: "actions" }, _h = { class: "profile-list" }, ey = { class: "profile-row-main" }, ty = ["innerHTML"], ny = ["title"], sy = {
  key: 0,
  class: "leader-title"
}, ly = { class: "profile-info" }, iy = ["innerHTML"], oy = ["innerHTML"], ay = ["onClick"], ry = {
  __name: "StudentProfiles",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("div", Yh, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      N(Di, {
        model: e.model.preview
      }, null, 8, ["model"]),
      l("div", Zh, [
        l("button", {
          type: "button",
          class: "btn primary",
          onClick: n[0] || (n[0] = (...t) => e.actions.shop && e.actions.shop(...t))
        }, "🛍️ Магазин"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[1] || (n[1] = (...t) => e.actions.collection && e.actions.collection(...t))
        }, "🎒 Моя коллекция"),
        l("button", {
          type: "button",
          class: "btn soft mk854-edit-name-btn",
          onClick: n[2] || (n[2] = (...t) => e.actions.edit && e.actions.edit(...t))
        }, "✏️ Изменить имя")
      ]),
      l("div", _h, [
        (o(!0), r(f, null, g(e.model.profiles, (t) => (o(), r("div", {
          key: t.name,
          class: x(["profile-row", { current: t.active }])
        }, [
          l("div", ey, [
            l("div", {
              class: "profile-row-avatar",
              style: { display: "contents" },
              innerHTML: t.avatar
            }, null, 8, ty),
            l("div", null, [
              l("b", {
                class: x(["nickname-style", t.nameClass]),
                title: t.name
              }, a(t.name), 11, ny),
              t.title ? (o(), r("div", sy, a(t.title), 1)) : k("", !0),
              l("div", ly, [
                l("span", null, "ур. " + a(t.level), 1),
                l("span", null, a(t.xp) + " XP", 1),
                l("span", null, "🪙 " + a(t.coins), 1),
                l("span", null, "🔥 рекорд " + a(t.bestStreak), 1),
                l("span", null, "🎒 " + a(t.items), 1)
              ]),
              l("div", {
                style: { display: "contents" },
                innerHTML: t.details
              }, null, 8, iy),
              l("div", {
                class: "profile-sticker-line",
                innerHTML: t.stickers
              }, null, 8, oy)
            ])
          ]),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: (i) => e.actions.select(t.index)
          }, a(t.active ? "Текущий" : "Выбрать"), 9, ay)
        ], 2))), 128))
      ]),
      l("form", {
        class: "profile-create",
        onSubmit: n[3] || (n[3] = Qe((...t) => e.actions.create && e.actions.create(...t), ["prevent"]))
      }, [...n[4] || (n[4] = [
        l("input", {
          id: "newProfileName",
          maxlength: "24",
          placeholder: "Имя ученика",
          "aria-label": "Имя ученика"
        }, null, -1),
        l("button", {
          type: "submit",
          class: "btn primary"
        }, "Создать", -1)
      ])], 32)
    ]));
  }
}, cy = {
  class: "mk872-help-heading",
  tabindex: "-1"
}, uy = ["aria-label"], dy = {
  __name: "StoreSurfaceHeader",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("h2", cy, [
        p(a(e.model.title) + " ", 1),
        l("button", {
          type: "button",
          class: "mk872-help-trigger",
          title: "Справка",
          "aria-label": "Справка: " + e.model.topic,
          onClick: n[0] || (n[0] = (t) => e.actions.help(t.currentTarget))
        }, "ⓘ", 8, uy)
      ]),
      l("button", {
        type: "button",
        class: "x",
        "aria-label": "Закрыть окно",
        onClick: n[1] || (n[1] = (...t) => e.actions.close && e.actions.close(...t))
      }, "×")
    ], 64));
  }
}, my = { class: "mk854-edit-preview" }, fy = ["innerHTML"], by = {
  id: "mk854EditPreview",
  class: "mk854-edit-preview-name"
}, hy = { class: "mk854-edit-field" }, yy = { class: "mk854-edit-field" }, vy = {
  id: "mk854StyleGrid",
  class: "mk854-style-grid",
  role: "group",
  "aria-labelledby": "mk854StyleLabel"
}, ky = ["data-style", "aria-pressed", "onClick"], gy = {
  key: 0,
  class: "mk855-lock-note"
}, $y = { class: "mk854-edit-actions" }, py = {
  __name: "StudentProfileEditor",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    const s = e, n = /* @__PURE__ */ Me(s.model.name), t = /* @__PURE__ */ Me(s.model.style), i = ne(() => s.model.styles.find((c) => c.id === t.value)?.cls);
    return (c, u) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", my, [
        l("div", {
          style: { display: "contents" },
          innerHTML: e.model.avatar
        }, null, 8, fy),
        l("div", by, [
          l("span", {
            class: x(["nickname-style", i.value])
          }, a(n.value.trim() || "Имя"), 3)
        ])
      ]),
      l("form", {
        onSubmit: u[2] || (u[2] = Qe((d) => e.actions.save(n.value, t.value), ["prevent"]))
      }, [
        l("div", hy, [
          u[3] || (u[3] = l("label", { for: "mk854NicknameInput" }, "Отображаемое имя — 2–24 символа", -1)),
          nt(l("input", {
            id: "mk854NicknameInput",
            "onUpdate:modelValue": u[0] || (u[0] = (d) => n.value = d),
            class: "mk854-edit-input",
            maxlength: "24"
          }, null, 512), [
            [Hs, n.value]
          ])
        ]),
        l("div", yy, [
          u[4] || (u[4] = l("label", { id: "mk854StyleLabel" }, "Оформление имени", -1)),
          l("div", vy, [
            (o(!0), r(f, null, g(e.model.styles, (d) => (o(), r("button", {
              key: d.id,
              "data-style": d.id,
              type: "button",
              class: x(["mk854-style-btn", { active: t.value === d.id }]),
              "aria-pressed": d.locked ? null : t.value === d.id,
              onClick: (m) => d.locked ? e.actions.shop() : t.value = d.id
            }, [
              l("span", {
                class: x(["nickname-style", d.cls])
              }, a(d.label), 3),
              d.premium ? (o(), r("span", gy, a(d.locked ? "🔒 Купить в магазине" : "✓ в коллекции"), 1)) : k("", !0)
            ], 10, ky))), 128))
          ])
        ]),
        u[6] || (u[6] = l("div", {
          id: "mk854EditError",
          class: "mk854-edit-error",
          role: "status"
        }, null, -1)),
        l("div", $y, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: u[1] || (u[1] = (...d) => e.actions.close && e.actions.close(...d))
          }, "Отмена"),
          u[5] || (u[5] = l("button", {
            type: "submit",
            class: "btn primary"
          }, "Сохранить", -1))
        ])
      ], 32)
    ], 64));
  }
}, Cy = {
  key: 1,
  class: "shop-lock"
}, xy = ["innerHTML"], wy = { class: "shop-price" }, Ty = {
  key: 2,
  class: "shop-price-tier"
}, Sy = ["disabled", "onClick"], Oy = ["onClick"], qy = {
  key: 0,
  class: "report-empty",
  style: { "grid-column": "1 / -1" }
}, My = {
  __name: "StoreCatalog",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      (o(!0), r(f, null, g(e.model.cards, (t) => (o(), r("div", {
        key: t.id,
        class: x(t.className)
      }, [
        t.status ? (o(), r("span", {
          key: 0,
          class: x(["shop-state-chip", t.equipped ? "equipped" : "owned"])
        }, a(t.status), 3)) : k("", !0),
        t.level > 1 ? (o(), r("span", Cy, "ур. " + a(t.level), 1)) : k("", !0),
        l("div", {
          style: { display: "contents" },
          innerHTML: t.icon
        }, null, 8, xy),
        l("strong", null, a(t.name), 1),
        l("div", {
          class: x("rarity-" + t.rarity),
          style: { "font-size": "11px", "font-weight": "900", "margin-top": "3px" }
        }, a(t.rarityLabel), 3),
        l("small", null, a(t.description), 1),
        l("div", wy, a(t.priceLabel), 1),
        t.priceTier ? (o(), r("div", Ty, a(t.priceTier), 1)) : k("", !0),
        l("button", {
          type: "button",
          class: x(["btn", t.button.action && t.button.primary ? "primary" : "soft"]),
          disabled: !t.button.action,
          onClick: (i) => e.actions.run(t.button.action, t.id)
        }, a(t.button.label), 11, Sy),
        t.sale?.allowed ? (o(), r("button", {
          key: 3,
          type: "button",
          class: "btn soft mk865-sale-btn",
          onClick: (i) => e.actions.run("sell", t.id)
        }, "🪙 Продать", 8, Oy)) : k("", !0),
        t.sale?.text ? (o(), r("div", {
          key: 4,
          class: x(["mk865-sale-note", t.sale.className])
        }, a(t.sale.text), 3)) : k("", !0)
      ], 2))), 128)),
      e.model.cards.length ? k("", !0) : (o(), r("div", qy, " В этом фильтре пока нет предметов. "))
    ], 64));
  }
}, Ly = { class: "mk872-col-head" }, jy = {
  key: 0,
  class: "mk872-col-grid"
}, Hy = ["innerHTML"], Py = ["disabled", "onClick"], Ey = {
  key: 1,
  class: "mk872-col-empty"
}, Ay = {
  __name: "CollectionSection",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Ly, [
        l("h3", null, a(e.model.title), 1),
        l("small", null, a(e.model.owned) + " из " + a(e.model.total), 1)
      ]),
      e.model.items.length ? (o(), r("div", jy, [
        (o(!0), r(f, null, g(e.model.items, (t) => (o(), r("div", {
          key: t.id,
          class: x(["mk872-col-card", { selected: t.selected }])
        }, [
          l("div", {
            style: { display: "contents" },
            innerHTML: t.art
          }, null, 8, Hy),
          l("strong", null, a(t.title), 1),
          l("span", {
            class: x(["mk872-col-meta", t.rarityClass])
          }, a(t.meta), 3),
          t.button ? (o(), r("button", {
            key: 0,
            type: "button",
            class: x(["mk872-col-action", { primary: !t.selected }]),
            disabled: t.disabled,
            onClick: (i) => e.actions.choose(t.id)
          }, a(t.button), 11, Py)) : k("", !0)
        ], 2))), 128))
      ])) : (o(), r("div", Ey, [...n[0] || (n[0] = [
        p(" Пока ничего нет в коллекции. ", -1),
        l("div", { class: "mk872-col-help" }, "Посмотри доступные предметы в магазине.", -1)
      ])]))
    ], 64));
  }
}, Ry = ["aria-pressed", "data-mk872-collection-tab", "onClick"], Iy = {
  __name: "CollectionNavigation",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(!0), r(f, null, g(e.model.sections, (t) => (o(), r("button", {
      key: t.id,
      type: "button",
      class: x(["mk872-col-count", { active: t.id === e.model.active }]),
      "aria-pressed": t.id === e.model.active,
      "data-mk872-collection-tab": t.id,
      "aria-controls": "mk872CollectionContent",
      onClick: (i) => e.actions.select(t.id)
    }, [
      l("b", null, a(t.count), 1),
      l("small", null, a(t.label), 1)
    ], 10, Ry))), 128));
  }
}, Ny = {
  __name: "CollectionWorth",
  props: { model: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      n[0] || (n[0] = l("span", null, "📦 Стоимость коллекции", -1)),
      l("strong", null, a(e.model.amount) + " 🪙", 1),
      n[1] || (n[1] = l("small", null, "Все принадлежащие предметы по ценам каталога", -1))
    ], 64));
  }
}, Dy = { class: "mk19g-pet-head" }, Fy = ["aria-label", "innerHTML"], Ky = {
  key: 1,
  class: "mk19g-pet-icon",
  "aria-hidden": "true"
}, Vy = { class: "mk19g-pet-info" }, By = { class: "mk19g-pet-name" }, Uy = { class: "mk19g-pet-rarity" }, Wy = ["aria-label"], zy = {
  class: "mk19g-pet-actions",
  role: "group",
  "aria-label": "Выбрать имеющегося питомца"
}, Xy = ["data-pet-choice", "disabled", "aria-pressed", "onClick"], Gy = {
  key: 0,
  class: "mk19g-pet-empty"
}, Qy = {
  __name: "PetQuickPanel",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Dy, [
        e.model.artwork ? (o(), r("button", {
          key: 0,
          type: "button",
          class: "mk19g-pet-icon",
          "aria-label": "Увеличить: " + e.model.name,
          innerHTML: e.model.artwork
        }, null, 8, Fy)) : (o(), r("div", Ky, "—")),
        l("div", Vy, [
          n[1] || (n[1] = l("div", { class: "mk19g-pet-eyebrow" }, "Питомец в профиле", -1)),
          l("div", By, a(e.model.name), 1),
          l("div", Uy, a(e.model.rarity), 1)
        ]),
        l("span", {
          class: "mk19g-pet-collection-count",
          "aria-label": "Получено питомцев: " + e.model.collected + " из " + e.model.total
        }, a(e.model.collected) + " / " + a(e.model.total), 9, Wy)
      ]),
      n[2] || (n[2] = l("div", { class: "mk19g-pet-switch-title" }, "Быстрый выбор из своей коллекции", -1)),
      l("div", zy, [
        (o(!0), r(f, null, g(e.model.choices, (t) => (o(), r("button", {
          key: t.id,
          type: "button",
          class: "mk19g-pet-choice",
          "data-pet-choice": t.id,
          disabled: t.selected,
          "aria-pressed": t.selected,
          onClick: (i) => e.actions.choose(t.id)
        }, a(t.name) + a(t.selected ? " ✓" : ""), 9, Xy))), 128))
      ]),
      e.model.collected ? k("", !0) : (o(), r("span", Gy, "Покупки и награды за достижения появятся здесь.")),
      e.model.fromCollection ? (o(), r("button", {
        key: 1,
        type: "button",
        class: "mk19g-pet-market",
        onClick: n[0] || (n[0] = (...t) => e.actions.market && e.actions.market(...t))
      }, " Посмотреть всех питомцев ")) : k("", !0)
    ], 64));
  }
}, Jy = { class: "mk872-col-head" }, Yy = {
  key: 0,
  class: "mk873-archive-intro"
}, Zy = {
  key: 2,
  class: "mk872-col-grid"
}, _y = { class: "mk872-col-art" }, ev = ["innerHTML"], tv = { class: "mk872-col-meta" }, nv = { class: "mk873-archive-price" }, sv = ["disabled", "onClick"], lv = {
  key: 3,
  class: "mk872-col-empty"
}, iv = {
  key: 4,
  class: "mk873-archive-help"
}, ov = {
  __name: "CollectionArchive",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Jy, [
        n[1] || (n[1] = l("h3", null, "📦 Архивные предметы", -1)),
        l("small", null, a(e.model.count) + " обнаружено", 1)
      ]),
      (o(!0), r(f, null, g(e.model.groups, (t) => (o(), r("section", {
        key: t.type,
        class: x(t.className)
      }, [
        t.type === "avatars" ? (o(), r("div", Yy, [
          n[2] || (n[2] = l("b", null, "📦 Архивные предметы", -1)),
          l("div", null, a(t.description), 1)
        ])) : (o(), r(f, { key: 1 }, [
          l("h3", null, a(t.title), 1),
          l("p", null, a(t.description), 1)
        ], 64)),
        t.items.length ? (o(), r("div", Zy, [
          (o(!0), r(f, null, g(t.items, (i) => (o(), r("div", {
            key: i.id,
            class: "mk872-col-card mk873-archive-card"
          }, [
            l("div", _y, [
              l("span", {
                class: "shop-icon",
                style: { height: "100%", width: "100%", margin: "0" },
                innerHTML: i.icon
              }, null, 8, ev)
            ]),
            l("strong", null, a(i.name), 1),
            l("span", tv, a(t.label), 1),
            l("div", nv, a(i.detail), 1),
            i.button ? (o(), r("button", {
              key: 0,
              type: "button",
              class: x(["mk872-col-action mk873-archive-action", { primary: i.primary }]),
              disabled: !i.action,
              onClick: (c) => e.actions.run(i.action, i.id)
            }, a(i.button), 11, sv)) : k("", !0)
          ]))), 128))
        ])) : (o(), r("div", lv, a(t.empty), 1)),
        t.type === "avatars" ? (o(), r("div", iv, [
          n[3] || (n[3] = l("p", null, "Нет подтверждения старой покупки? Сохраните заявку и передайте её владельцу проекта вместе с резервной копией, если она есть. Этот файл не начисляет монеты.", -1)),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[0] || (n[0] = (i) => e.actions.run("claim"))
          }, "📄 Заявка на проверку")
        ])) : k("", !0)
      ], 2))), 128))
    ], 64));
  }
}, av = { class: "mk865-sale-head" }, rv = { id: "mk865SaleTitle" }, cv = { key: 0 }, uv = { style: { "margin-top": "4px" } }, dv = ["aria-valuenow", "aria-valuemax"], mv = {
  key: 1,
  class: "mk865-refund-grid"
}, fv = {
  key: 2,
  class: "lesson"
}, bv = {
  key: 3,
  class: "mk865-topic-grid"
}, hv = ["onClick"], yv = { class: "mk865-reason" }, vv = ["disabled", "onClick"], kv = {
  __name: "StoreSaleDialog",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", av, [
        l("div", null, [
          l("h2", rv, a(e.model.title), 1),
          e.model.subtitle ? (o(), r("p", cv, a(e.model.subtitle), 1)) : k("", !0)
        ]),
        l("button", {
          type: "button",
          class: "mk865-sale-close",
          "aria-label": "Закрыть окно продажи",
          onClick: n[0] || (n[0] = (t) => e.actions.close())
        }, "×")
      ]),
      e.model.mission ? (o(), r("div", {
        key: 0,
        class: x(["mk865-mission-box", { completed: e.model.mission.completed }])
      }, [
        l("b", null, a(e.model.mission.title), 1),
        l("div", uv, a(e.model.mission.topic), 1),
        l("div", {
          class: "mk865-mission-progress",
          role: "progressbar",
          "aria-label": "Выполнено заданий для выгодной продажи",
          "aria-valuenow": e.model.mission.progress,
          "aria-valuemax": e.model.mission.total
        }, [
          l("span", {
            style: Z({ width: e.model.mission.percent + "%" })
          }, null, 4)
        ], 8, dv),
        l("small", null, a(e.model.mission.progress) + "/" + a(e.model.mission.total) + " правильных заданий • возврат " + a(e.model.mission.refund) + " 🪙", 1)
      ], 2)) : k("", !0),
      e.model.refunds ? (o(), r("div", mv, [
        (o(!0), r(f, null, g(e.model.refunds, (t) => (o(), r("div", {
          key: t.label,
          class: x(["mk865-refund-card", { good: t.good }])
        }, [
          l("small", null, a(t.label), 1),
          l("b", null, "+" + a(t.coins) + " 🪙", 1),
          l("small", null, a(t.detail), 1)
        ], 2))), 128))
      ])) : k("", !0),
      e.model.notice ? (o(), r("div", fv, a(e.model.notice), 1)) : k("", !0),
      e.model.topics?.length ? (o(), r("div", bv, [
        (o(!0), r(f, null, g(e.model.topics, (t, i) => (o(), r("button", {
          key: t.key,
          type: "button",
          class: "mk865-topic",
          onClick: (c) => e.actions.choose(i)
        }, [
          l("b", null, a(t.grade) + " класс • " + a(t.title), 1),
          l("small", null, a(t.detail), 1),
          l("span", yv, a(t.reason), 1)
        ], 8, hv))), 128))
      ])) : k("", !0),
      (o(!0), r(f, null, g(e.model.buttons, (t, i) => (o(), r("div", {
        key: i,
        class: "mk865-inline-actions"
      }, [
        (o(!0), r(f, null, g(t, (c, u) => (o(), r("button", {
          key: u,
          type: "button",
          class: x(["btn", c.primary ? "primary" : "soft"]),
          disabled: c.disabled,
          onClick: (d) => e.actions.run(i, u)
        }, a(c.label), 11, vv))), 128))
      ]))), 128))
    ], 64));
  }
}, gv = { class: "mk19e-wallet-head" }, $v = { class: "mk19e-balance" }, pv = { class: "mk19e-id" }, Cv = { class: "mk19e-wallet-grid" }, xv = { class: "mk19e-label" }, wv = { class: "mk19e-potential" }, Tv = { class: "mk19e-potential-line" }, Sv = {
  class: "mk19e-potential-line",
  style: { "margin-top": "9px", "border-top": "1px solid #dce9df", "padding-top": "10px" }
}, Ov = { class: "mk19e-facts" }, qv = {
  key: 0,
  class: "mk19e-transactions"
}, Mv = { class: "mk19e-transaction-name" }, Lv = { class: "mk19e-transaction-value" }, jv = {
  key: 1,
  class: "mk19e-wallet-cell mk19e-info"
}, Hv = { class: "mk19e-info" }, Pv = { class: "mk19e-shortcuts" }, Ev = {
  __name: "StoreWallet",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", gv, [
        l("div", null, [
          n[2] || (n[2] = l("span", { class: "mk19e-overline" }, "Доступные монеты", -1)),
          l("div", $v, a(e.model.balance), 1),
          n[3] || (n[3] = l("small", null, "Сумма на счёте прямо сейчас", -1))
        ]),
        l("span", pv, a(e.model.profile), 1)
      ]),
      l("section", null, [
        n[4] || (n[4] = l("h3", { class: "mk19e-section-title" }, "Мои покупки и возвраты", -1)),
        l("div", Cv, [
          (o(!0), r(f, null, g(e.model.totals, (t) => (o(), r("div", {
            key: t.label,
            class: "mk19e-wallet-cell"
          }, [
            l("span", xv, a(t.label), 1),
            l("strong", null, a(t.value), 1),
            l("small", null, a(t.detail), 1)
          ]))), 128))
        ])
      ]),
      l("section", wv, [
        l("div", Tv, [
          n[5] || (n[5] = l("span", null, "Если продать доступные предметы сейчас", -1)),
          l("b", null, "+" + a(e.model.realizable), 1)
        ]),
        l("p", null, a(e.model.potentialDetails), 1),
        l("div", Sv, [
          n[6] || (n[6] = l("span", null, "Баланс + возможные возвраты", -1)),
          l("b", null, a(e.model.potential), 1)
        ])
      ]),
      l("section", null, [
        n[7] || (n[7] = l("h3", { class: "mk19e-section-title" }, "Сундуки", -1)),
        l("div", Ov, [
          (o(!0), r(f, null, g(e.model.chests, (t) => (o(), r("div", {
            key: t.label,
            class: "mk19e-fact"
          }, [
            p(a(t.label), 1),
            l("b", null, a(t.value), 1)
          ]))), 128))
        ])
      ]),
      l("section", null, [
        n[8] || (n[8] = l("h3", { class: "mk19e-section-title" }, "Последние продажи", -1)),
        e.model.sales.length ? (o(), r("div", qv, [
          (o(!0), r(f, null, g(e.model.sales, (t, i) => (o(), r("div", {
            key: i,
            class: "mk19e-transaction"
          }, [
            l("div", null, [
              l("div", Mv, a(t.name), 1),
              l("small", null, a(t.detail), 1)
            ]),
            l("span", Lv, "+" + a(t.refund), 1)
          ]))), 128))
        ])) : (o(), r("div", jv, "Пока нет сохранённых записей о продажах."))
      ]),
      l("details", Hv, [
        n[9] || (n[9] = l("summary", null, "Как считаются суммы", -1)),
        l("p", null, a(e.model.explanation), 1)
      ]),
      l("div", Pv, [
        l("button", {
          class: "btn soft",
          type: "button",
          onClick: n[0] || (n[0] = (t) => e.actions.shop())
        }, "В магазин"),
        l("button", {
          class: "btn soft",
          type: "button",
          onClick: n[1] || (n[1] = (t) => e.actions.collection())
        }, "Моя коллекция")
      ])
    ], 64));
  }
}, Av = { class: "mk861-chest-card" }, Rv = { class: "mk861-chest-head" }, Iv = { class: "mk872-help-heading" }, Nv = { class: "mk861-price" }, Dv = {
  class: "mk861-probs",
  "aria-label": "Вероятности до открытия"
}, Fv = { class: "mk861-guarantees" }, Kv = { class: "mk861-pool-progress" }, Vv = { class: "mk861-chest-actions" }, Bv = ["disabled"], Uv = {
  key: 0,
  class: "mk861-disabled-note"
}, Wv = { class: "mk861-history" }, zv = {
  key: 0,
  class: "mk861-history-list"
}, Xv = {
  key: 1,
  class: "teacher-empty"
}, Gv = {
  __name: "StoreChest",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("section", Av, [
        l("div", Rv, [
          n[3] || (n[3] = l("div", {
            class: "mk861-chest-icon",
            "aria-hidden": "true"
          }, "🎁", -1)),
          l("div", null, [
            l("h2", Iv, [
              n[2] || (n[2] = p("Сундук удачи ", -1)),
              l("button", {
                type: "button",
                class: "mk872-help-trigger",
                title: "Справка",
                "aria-label": "Справка: chest",
                onClick: n[0] || (n[0] = (t) => e.actions.help(t.currentTarget))
              }, "ⓘ")
            ]),
            l("div", Nv, a(e.model.price) + " 🪙", 1)
          ])
        ]),
        l("div", Dv, [
          (o(!0), r(f, null, g(e.model.tiers, (t) => (o(), r("div", {
            key: t.id,
            class: x(["mk861-prob", t.id])
          }, [
            l("b", null, a(t.label), 1),
            l("span", null, a(t.chance), 1)
          ], 2))), 128))
        ]),
        l("div", Fv, [
          (o(!0), r(f, null, g(e.model.guarantees, (t) => (o(), r("div", {
            key: t.text,
            class: x({ hot: t.hot })
          }, a(t.text), 3))), 128))
        ]),
        l("div", Kv, [
          (o(!0), r(f, null, g(e.model.tiers, (t) => (o(), r("span", {
            key: t.id
          }, a(t.progress), 1))), 128))
        ]),
        l("div", Vv, [
          l("button", {
            type: "button",
            class: "btn primary",
            disabled: e.model.disabled,
            onClick: n[1] || (n[1] = (t) => e.actions.open())
          }, "Открыть за " + a(e.model.price) + " 🪙", 9, Bv),
          e.model.reason ? (o(), r("span", Uv, a(e.model.reason), 1)) : k("", !0)
        ])
      ]),
      l("section", Wv, [
        n[4] || (n[4] = l("h3", null, "Последние открытия", -1)),
        e.model.history.length ? (o(), r("div", zv, [
          (o(!0), r(f, null, g(e.model.history, (t, i) => (o(), r("div", {
            key: i,
            class: "mk861-history-row"
          }, [
            l("span", null, a(t.icon), 1),
            l("b", null, a(t.name), 1),
            l("small", null, a(t.date), 1)
          ]))), 128))
        ])) : (o(), r("div", Xv, "Сундук ещё не открывали."))
      ])
    ], 64));
  }
}, Qv = { class: "mk861-reveal-stage" }, Jv = { class: "mk861-result" }, Yv = { class: "rarity" }, Zv = ["innerHTML"], _v = { class: "mk861-result-actions" }, ek = {
  __name: "StoreChestResult",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r("div", Qv, [
      n[3] || (n[3] = l("div", { class: "mk861-reveal-flash" }, null, -1)),
      n[4] || (n[4] = l("div", {
        class: "mk861-reveal-chest",
        "aria-hidden": "true"
      }, "🎁", -1)),
      l("button", {
        type: "button",
        class: "mk861-skip",
        onClick: n[0] || (n[0] = (t) => e.actions.reveal())
      }, "Пропустить"),
      l("div", Jv, [
        l("div", Yv, a(e.model.rarity), 1),
        l("div", {
          class: "mk861-result-icon",
          innerHTML: e.model.icon
        }, null, 8, Zv),
        l("h2", null, a(e.model.title), 1),
        l("div", null, a(e.model.body), 1),
        l("div", _v, [
          e.model.equip ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn primary",
            onClick: n[1] || (n[1] = (t) => e.actions.equip())
          }, "Надеть")) : k("", !0),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[2] || (n[2] = (t) => e.actions.finish())
          }, "Готово")
        ])
      ])
    ]));
  }
}, tk = { class: "mk872-help-top" }, nk = { id: "mk872-help-title" }, sk = ["innerHTML"], lk = {
  __name: "StoreHelpDialog",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", tk, [
        l("h3", nk, a(e.model.title), 1),
        l("button", {
          type: "button",
          class: "mk872-help-close",
          "aria-label": "Закрыть справку",
          onClick: n[0] || (n[0] = (t) => e.actions.close())
        }, "×")
      ]),
      l("div", {
        class: "mk872-help-content",
        innerHTML: e.model.content
      }, null, 8, sk)
    ], 64));
  }
}, ik = {
  class: "shop-filter-bar",
  role: "group",
  "aria-label": "Редкость предметов"
}, ok = ["aria-pressed", "onClick"], ak = {
  class: "mk19d-filter-count",
  "aria-hidden": "true"
}, rk = {
  class: "mk19d-shop-summary",
  role: "status"
}, ck = { class: "v71-sort-control" }, uk = ["value"], dk = ["value"], mk = {
  __name: "StoreControls",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", ik, [
        (o(!0), r(f, null, g(e.model.filters, (t) => (o(), r("button", {
          key: t.id,
          type: "button",
          class: x(["shop-filter-btn", { active: t.id === e.model.rarity }]),
          "aria-pressed": t.id === e.model.rarity,
          onClick: (i) => e.actions.filter(t.id)
        }, [
          p(a(t.label), 1),
          l("span", ak, a(t.count), 1)
        ], 10, ok))), 128))
      ]),
      l("div", rk, [
        l("span", null, [
          n[1] || (n[1] = p("Показано: ", -1)),
          l("b", null, a(e.model.shown), 1),
          p(" из " + a(e.model.total), 1)
        ]),
        l("span", null, a(e.model.range), 1)
      ]),
      l("label", ck, [
        n[2] || (n[2] = p("Сортировать: ", -1)),
        l("select", {
          "aria-label": "Сортировка предметов",
          value: e.model.mode,
          onChange: n[0] || (n[0] = (t) => e.actions.sort(t.target.value))
        }, [
          (o(!0), r(f, null, g(e.model.sortOptions, (t) => (o(), r("option", {
            key: t[0],
            value: t[0]
          }, a(t[1]), 9, dk))), 128))
        ], 40, uk)
      ])
    ], 64));
  }
}, fk = ["value"], bk = ["value"], hk = ["data-store-category", "aria-current", "onClick"], yk = {
  __name: "StoreTabs",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => e.model.picker ? (o(), r(f, { key: 0 }, [
      n[1] || (n[1] = p(" Раздел магазина ", -1)),
      l("select", {
        class: "mk-ux91-category-select",
        "aria-label": "Раздел магазина",
        value: e.model.active,
        onChange: n[0] || (n[0] = (t) => e.actions.open(t.target.value, !0))
      }, [
        (o(!0), r(f, null, g(e.model.tabs, (t) => (o(), r("option", {
          key: t.id,
          value: t.id
        }, a(t.label), 9, bk))), 128))
      ], 40, fk)
    ], 64)) : (o(!0), r(f, { key: 1 }, g(e.model.tabs, (t) => (o(), r("button", {
      key: t.id,
      type: "button",
      class: x(["shop-tab", { active: t.id === e.model.active, "mk19e-wallet-tab": t.id === "wallet" }]),
      "data-store-category": t.id,
      "aria-current": t.id === e.model.active ? "page" : null,
      onClick: (i) => e.actions.open(t.id, !1)
    }, a(t.label), 11, hk))), 128));
  }
}, vk = { class: "mtop" }, kk = { class: "mk872-help-heading" }, gk = { style: { overflow: "auto" } }, $k = { class: "leader-table" }, pk = { class: "leader-identity" }, Ck = ["innerHTML"], xk = ["title"], wk = {
  key: 0,
  class: "mk870-leader-test-badge"
}, Tk = {
  key: 1,
  class: "leader-title"
}, Sk = ["innerHTML"], Ok = ["innerHTML"], qk = { class: "leader-mobile-level" }, Mk = ["innerHTML"], Lk = {
  class: "mk30-worth",
  title: "Стоимость всех принадлежащих предметов"
}, jk = {
  __name: "Leaderboard",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", vk, [
        l("h2", kk, [
          n[2] || (n[2] = p("🏆 Таблица лидеров ", -1)),
          l("button", {
            type: "button",
            class: "mk872-help-trigger",
            title: "Справка",
            "aria-label": "Справка: leader",
            onClick: n[0] || (n[0] = (t) => e.actions.help(t.currentTarget))
          }, "ⓘ")
        ]),
        l("button", {
          type: "button",
          class: "x",
          "aria-label": "Закрыть окно",
          onClick: n[1] || (n[1] = (...t) => e.actions.close && e.actions.close(...t))
        }, "×")
      ]),
      l("div", gk, [
        l("table", $k, [
          n[3] || (n[3] = l("thead", null, [
            l("tr", null, [
              l("th", { scope: "col" }, "#"),
              l("th", { scope: "col" }, "Ученик"),
              l("th", { scope: "col" }, "Уровень"),
              l("th", { scope: "col" }, "XP"),
              l("th", { scope: "col" }, "Монеты"),
              l("th", {
                scope: "col",
                title: "Стоимость принадлежащих вещей по ценам каталога"
              }, "Коллекция 🪙"),
              l("th", { scope: "col" }, "🔥 рекорд"),
              l("th", { scope: "col" }, "Решено")
            ])
          ], -1)),
          l("tbody", null, [
            (o(!0), r(f, null, g(e.model.rows, (t) => (o(), r("tr", {
              key: t.name,
              class: x({ "leader-current": t.current })
            }, [
              l("td", null, a(t.rank), 1),
              l("td", null, [
                l("div", pk, [
                  l("span", {
                    class: "leader-avatar-html",
                    innerHTML: t.avatar
                  }, null, 8, Ck),
                  l("div", null, [
                    l("b", {
                      class: x(["nickname-style", t.nicknameClass]),
                      title: t.name
                    }, a(t.name), 11, xk),
                    t.test ? (o(), r("span", wk, "Тестовый")) : k("", !0),
                    t.title ? (o(), r("div", Tk, a(t.title), 1)) : k("", !0),
                    l("span", {
                      style: { display: "contents" },
                      innerHTML: t.badges
                    }, null, 8, Sk),
                    l("div", {
                      class: "leader-stickers",
                      innerHTML: t.stickers
                    }, null, 8, Ok),
                    l("div", qk, "ур. " + a(t.level), 1)
                  ])
                ])
              ]),
              l("td", null, [
                p("ур. " + a(t.level), 1),
                l("span", {
                  style: { display: "contents" },
                  innerHTML: t.progress
                }, null, 8, Mk)
              ]),
              l("td", null, a(t.xp), 1),
              l("td", null, a(t.coins), 1),
              l("td", Lk, a(t.worth), 1),
              l("td", null, a(t.bestStreak), 1),
              l("td", null, a(t.solved), 1)
            ], 2))), 128))
          ])
        ])
      ])
    ], 64));
  }
}, Hk = { class: "achievement-summary" }, Pk = {
  key: 0,
  class: "achievement-nearest"
}, Ek = { class: "achievement-nearest-grid" }, Ak = { style: { display: "block", color: "var(--muted)", "margin-top": "3px" } }, Rk = { class: "achievement-progress" }, Ik = { class: "achievement-toolbar" }, Nk = ["aria-pressed", "onClick"], Dk = ["value"], Fk = ["value"], Kk = ["value"], Vk = ["value"], Bk = { class: "lesson" }, Uk = {
  key: 1,
  class: "teacher-empty",
  role: "status"
}, Wk = {
  key: 0,
  class: "achievement-category"
}, zk = { class: "achievement-grid" }, Xk = ["aria-label"], Gk = ["innerHTML"], Qk = { class: "achievement-info" }, Jk = { class: "achievement-title-row" }, Yk = ["aria-label"], Zk = { class: "achievement-progress-label" }, _k = { class: "achievement-reward" }, eg = { class: "achievement-reward-label" }, tg = ["innerHTML"], ng = {
  key: 2,
  class: "achievement-date"
}, sg = {
  __name: "AchievementCatalog",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Hk, [
        (o(!0), r(f, null, g(e.model.stats, (t) => (o(), r("div", {
          key: t.label
        }, [
          l("b", null, a(t.value), 1),
          l("small", null, a(t.label), 1)
        ]))), 128))
      ]),
      e.model.nearest.length ? (o(), r("div", Pk, [
        n[2] || (n[2] = l("b", null, "🎯 Ближайшие достижения", -1)),
        l("div", Ek, [
          (o(!0), r(f, null, g(e.model.nearest, (t) => (o(), r("div", {
            key: t.id,
            class: "achievement-nearest-item"
          }, [
            l("b", null, a(t.title), 1),
            l("small", Ak, a(t.label), 1),
            l("div", Rk, [
              l("span", {
                style: Z({ width: t.percent + "%" })
              }, null, 4)
            ])
          ]))), 128))
        ])
      ])) : k("", !0),
      l("div", Ik, [
        (o(!0), r(f, null, g(e.model.views, (t) => (o(), r("button", {
          key: t.id,
          type: "button",
          class: x(["achievement-filter", { active: t.id === e.model.view }]),
          "aria-pressed": t.id === e.model.view,
          onClick: (i) => e.actions.view(t.id)
        }, a(t.label), 11, Nk))), 128)),
        l("select", {
          class: "achievement-select",
          "aria-label": "Категория достижений",
          value: e.model.category,
          onChange: n[0] || (n[0] = (t) => e.actions.category(t.target.value))
        }, [
          (o(!0), r(f, null, g(e.model.categories, (t) => (o(), r("option", {
            key: t.id,
            value: t.id
          }, a(t.label), 9, Fk))), 128))
        ], 40, Dk),
        l("select", {
          class: "achievement-select",
          "aria-label": "Сортировка достижений",
          value: e.model.sort,
          onChange: n[1] || (n[1] = (t) => e.actions.sort(t.target.value))
        }, [
          (o(!0), r(f, null, g(e.model.sorts, (t) => (o(), r("option", {
            key: t.id,
            value: t.id
          }, a(t.label), 9, Vk))), 128))
        ], 40, Kk)
      ]),
      l("div", Bk, a(e.model.note), 1),
      e.model.groups.length ? k("", !0) : (o(), r("div", Uk, "По выбранному фильтру достижений нет.")),
      (o(!0), r(f, null, g(e.model.groups, (t) => (o(), r(f, {
        key: t.id
      }, [
        t.heading ? (o(), r("h3", Wk, a(t.heading), 1)) : k("", !0),
        l("div", zk, [
          (o(!0), r(f, null, g(t.cards, (i) => (o(), r("div", {
            key: i.id,
            class: x(["achievement-card", { done: i.owned }]),
            "aria-label": i.title + ". " + i.status
          }, [
            l("div", {
              class: "achievement-icon",
              innerHTML: i.icon
            }, null, 8, Gk),
            l("div", Qk, [
              l("div", Jk, [
                l("b", null, a(i.title), 1),
                l("span", {
                  class: x(["achievement-status", { done: i.owned }])
                }, a(i.status), 3)
              ]),
              l("span", {
                class: x(["achievement-rarity", i.rarity])
              }, a(i.rarityLabel), 3),
              l("small", null, a(i.description), 1),
              i.condition ? (o(), r("div", {
                key: 0,
                class: x(["achievement-condition", { done: i.owned }])
              }, a(i.progressLabel), 3)) : (o(), r(f, { key: 1 }, [
                l("div", {
                  class: "achievement-progress",
                  "aria-label": "Прогресс " + i.percent + "%"
                }, [
                  l("span", {
                    style: Z({ width: i.percent + "%" })
                  }, null, 4)
                ], 8, Yk),
                l("div", Zk, a(i.progressLabel), 1)
              ], 64)),
              l("div", _k, [
                l("span", eg, a(i.owned ? "Получено:" : "Награда:"), 1),
                l("span", {
                  style: { display: "contents" },
                  innerHTML: i.reward
                }, null, 8, tg)
              ]),
              i.date ? (o(), r("div", ng, "Дата: " + a(i.date), 1)) : k("", !0)
            ])
          ], 10, Xk))), 128))
        ])
      ], 64))), 128))
    ], 64));
  }
}, lg = { class: "backup-box warn" }, ig = {
  role: "status",
  style: { "margin-top": "6px", color: "var(--muted)", "font-size": "12px" }
}, og = { class: "backup-grid" }, ag = { class: "file-drop" }, rg = { class: "lesson" }, cg = { class: "import-preview" }, ug = { style: { color: "var(--muted)", "font-size": "13px" } }, dg = { class: "backup-meta" }, mg = { class: "import-plan" }, fg = {
  key: 0,
  class: "backup-box warn",
  role: "alert"
}, bg = {
  key: 1,
  class: "backup-box"
}, hg = { class: "actions" }, yg = { class: "backup-box warn" }, vg = { class: "conflict-compare" }, kg = { class: "conflict-stats" }, gg = { style: { color: "var(--muted)", "font-size": "12px", "margin-top": "8px" } }, $g = { class: "backup-box" }, pg = { style: { "font-size": "13px", color: "var(--muted)", "line-height": "1.5", "margin-top": "5px" } }, Cg = { class: "actions" }, xg = {
  key: 0,
  class: "backup-box warn",
  role: "alert"
}, wg = { class: "actions" }, Tg = {
  class: "import-result",
  role: "status"
}, Sg = { class: "backup-meta" }, Og = {
  key: 0,
  class: "backup-box"
}, qg = { class: "actions" }, Mg = {
  class: "backup-box warn",
  role: "alert"
}, Lg = { style: { "margin-top": "6px" } }, jg = { class: "actions" }, Hg = {
  __name: "BackupDialog",
  props: { model: Object, actions: Object },
  setup(e) {
    const s = Xt("fileInput");
    return (n, t) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      e.model.screen === "manager" ? (o(), r(f, { key: 0 }, [
        l("div", lg, [
          t[17] || (t[17] = l("b", null, "Важно:", -1)),
          t[18] || (t[18] = p(" данные хранятся в браузере. Очистка данных браузера, переустановка или переход на другой компьютер могут удалить локальный прогресс. ", -1)),
          l("div", ig, a(e.model.lastBackup), 1)
        ]),
        l("div", og, [
          l("button", {
            type: "button",
            class: "backup-action",
            onClick: t[0] || (t[0] = (i) => e.actions.export("all"))
          }, [...t[19] || (t[19] = [
            l("b", null, "📦 Скачать полную копию", -1),
            l("small", null, "Все ученики, XP, монеты, магазин, прогресс, журнал попыток и настройки профилей.", -1)
          ])]),
          l("button", {
            type: "button",
            class: "backup-action",
            onClick: t[1] || (t[1] = (i) => e.actions.export("current"))
          }, [...t[20] || (t[20] = [
            l("b", null, "👤 Скачать текущего ученика", -1),
            l("small", null, "Удобно передать данные одного ребёнка на другой компьютер.", -1)
          ])])
        ]),
        l("div", ag, [
          t[21] || (t[21] = l("b", null, "📥 Восстановить или перенести данные", -1)),
          t[22] || (t[22] = l("div", { style: { color: "var(--muted)", "font-size": "13px", margin: "5px 0 10px" } }, "Выбери файл .json. МатКвест распознает учеников по ID профиля.", -1)),
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: t[2] || (t[2] = (i) => s.value?.click())
          }, "Выбрать файл"),
          l("input", {
            id: "backupFileInput",
            ref_key: "fileInput",
            ref: s,
            type: "file",
            accept: ".json,application/json",
            onChange: t[3] || (t[3] = (i) => e.actions.read(i.target.files?.[0]))
          }, null, 544)
        ]),
        t[29] || (t[29] = l("div", { class: "backup-box" }, [
          l("b", null, "Как работает «Умно объединить»"),
          l("div", { style: { color: "var(--muted)", "font-size": "13px", "line-height": "1.55", "margin-top": "5px" } }, " Профили с тем же ID объединяются, повторные копии пропускаются. Новый ID и новое имя добавляют ученика. Если совпадает имя, а ID разные, МатКвест спросит, один это ученик или два разных. ")
        ], -1)),
        l("div", rg, [
          t[26] || (t[26] = p(" Копии предыдущих версий поддерживаются. Старый прогресс 4 класса получает префикс ", -1)),
          t[27] || (t[27] = l("b", null, "g4:", -1)),
          t[28] || (t[28] = p(". ", -1)),
          e.model.legacy ? (o(), r(f, { key: 0 }, [
            t[23] || (t[23] = l("br", null, null, -1)),
            t[24] || (t[24] = l("b", null, "Обнаружено старое хранилище mq5_full.", -1)),
            t[25] || (t[25] = p(" Оно хранится отдельно, автоматического начисления XP и монет из него нет.", -1))
          ], 64)) : k("", !0)
        ])
      ], 64)) : e.model.screen === "preview" ? (o(), r(f, { key: 1 }, [
        l("div", cg, [
          l("h3", null, a(e.model.filename), 1),
          l("div", ug, "Создана: " + a(e.model.date) + " • версия формата " + a(e.model.version), 1),
          l("div", dg, [
            (o(!0), r(f, null, g(e.model.stats, (i) => (o(), r("div", {
              key: i.label
            }, [
              l("b", null, a(i.value), 1),
              l("small", null, a(i.label), 1)
            ]))), 128))
          ]),
          l("div", mg, [
            (o(!0), r(f, null, g(e.model.rows, (i) => (o(), r("div", {
              key: i.name,
              class: "import-plan-row"
            }, [
              l("div", null, [
                l("b", null, a(i.name), 1),
                l("small", null, a(i.detail), 1)
              ]),
              l("span", {
                class: x(["import-tag", i.className])
              }, a(i.label), 3)
            ]))), 128))
          ])
        ]),
        e.model.recoveryNotice ? (o(), r("div", fg, a(e.model.recoveryNotice), 1)) : (o(), r("div", bg, [...t[30] || (t[30] = [
          l("b", null, "Что произойдёт при «Умно объединить»?", -1),
          l("div", { style: { "font-size": "13px", color: "var(--muted)", "line-height": "1.5", "margin-top": "5px" } }, " Профили с тем же ID объединятся. Повторная копия будет пропущена. Новые ученики добавятся. При совпадении имён приложение попросит уточнить, кому принадлежит профиль из копии. ", -1)
        ])])),
        l("div", hg, [
          e.model.recoveryNotice ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn soft",
            onClick: t[4] || (t[4] = (...i) => e.actions.download && e.actions.download(...i))
          }, " Скачать повреждённые исходные данные ")) : (o(), r("button", {
            key: 1,
            type: "button",
            class: "btn primary",
            onClick: t[5] || (t[5] = (...i) => e.actions.merge && e.actions.merge(...i))
          }, "Умно объединить")),
          l("button", {
            type: "button",
            class: x(["btn", e.model.recoveryNotice ? "primary" : "soft"]),
            onClick: t[6] || (t[6] = (...i) => e.actions.replace && e.actions.replace(...i))
          }, "Заменить всё", 2),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[7] || (t[7] = (...i) => e.actions.back && e.actions.back(...i))
          }, "Отмена")
        ])
      ], 64)) : e.model.screen === "conflict" ? (o(), r(f, { key: 2 }, [
        l("div", yg, a(e.model.reason) + " Уточни, кому принадлежит профиль из копии.", 1),
        l("div", vg, [
          (o(!0), r(f, null, g(e.model.sides, (i) => (o(), r("div", {
            key: i.label,
            class: x(["conflict-side", { imported: i.imported }])
          }, [
            l("h3", null, a(i.label) + ": " + a(i.name), 1),
            l("div", kg, [
              (o(!0), r(f, null, g(i.stats, (c) => (o(), r("span", { key: c }, a(c), 1))), 128))
            ]),
            l("div", gg, "Обновлён: " + a(i.date), 1)
          ], 2))), 128))
        ]),
        l("div", $g, [
          t[31] || (t[31] = l("b", null, "Это один и тот же ребёнок?", -1)),
          l("div", pg, " Данные одного ученика объединятся в один профиль. Если это разные дети, второй профиль будет сохранён как «" + a(e.model.newName) + "». Можно пропустить профиль из копии. ", 1)
        ]),
        l("div", Cg, [
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: t[8] || (t[8] = (i) => e.actions.resolve("same"))
          }, "Да, это тот же ученик"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[9] || (t[9] = (i) => e.actions.resolve("different"))
          }, "Нет, это другой ученик"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[10] || (t[10] = (i) => e.actions.resolve("skip"))
          }, "Пропустить")
        ])
      ], 64)) : e.model.screen === "replace" ? (o(), r(f, { key: 3 }, [
        t[32] || (t[32] = l("div", { class: "backup-box warn" }, [
          l("b", null, "Это удалит текущие локальные профили из браузера"),
          p(" и восстановит данные из выбранной копии. Для обычного переноса чаще подходит «Умно объединить». ")
        ], -1)),
        e.model.recoveryError ? (o(), r("div", xg, a(e.model.recoveryError.message), 1)) : k("", !0),
        l("div", wg, [
          e.model.recoveryError?.download ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn soft",
            onClick: t[11] || (t[11] = (...i) => e.actions.download && e.actions.download(...i))
          }, " Скачать повреждённые исходные данные ")) : k("", !0),
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: t[12] || (t[12] = (...i) => e.actions.restore && e.actions.restore(...i))
          }, a(e.model.recoveryError ? "Повторить восстановление" : "Да, восстановить копию"), 1),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[13] || (t[13] = (...i) => e.actions.back && e.actions.back(...i))
          }, "Отмена")
        ])
      ], 64)) : e.model.screen === "result" ? (o(), r(f, { key: 4 }, [
        l("div", Tg, a(e.model.message), 1),
        l("div", Sg, [
          (o(!0), r(f, null, g(e.model.stats, (i) => (o(), r("div", {
            key: i.label
          }, [
            l("b", null, a(i.value), 1),
            l("small", null, a(i.label), 1)
          ]))), 128))
        ]),
        e.model.skipped ? (o(), r("div", Og, [
          t[33] || (t[33] = p("Пропущено профилей: ", -1)),
          l("b", null, a(e.model.skipped), 1)
        ])) : k("", !0),
        l("div", qg, [
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: t[14] || (t[14] = (...i) => e.actions.profiles && e.actions.profiles(...i))
          }, "Открыть профили"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[15] || (t[15] = (...i) => e.actions.back && e.actions.back(...i))
          }, "💾 Данные")
        ])
      ], 64)) : e.model.screen === "error" ? (o(), r(f, { key: 5 }, [
        l("div", Mg, [
          t[34] || (t[34] = l("b", null, "Не удалось импортировать файл.", -1)),
          l("div", Lg, a(e.model.message), 1)
        ]),
        l("div", jg, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: t[16] || (t[16] = (...i) => e.actions.back && e.actions.back(...i))
          }, "← Назад")
        ])
      ], 64)) : k("", !0)
    ], 64));
  }
}, Pg = { role: "alert" }, Eg = { id: "mk-v877-storage-recovery-actions" }, Ag = {
  __name: "StorageRecovery",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Pg, a(e.model.warning), 1),
      l("div", Eg, [
        l("button", {
          type: "button",
          onClick: n[0] || (n[0] = (...t) => e.actions.download && e.actions.download(...t))
        }, a(e.model.download), 1),
        l("button", {
          type: "button",
          onClick: n[1] || (n[1] = (...t) => e.actions.restore && e.actions.restore(...t))
        }, a(e.model.restore), 1)
      ])
    ], 64));
  }
}, Rg = { class: "teacher-pin-wrap" }, Ig = { class: "teacher-pin-card" }, Ng = { class: "actions" }, Dg = {
  type: "submit",
  class: "btn primary"
}, Fg = {
  __name: "TeacherPinDialog",
  props: { model: Object, actions: Object },
  setup(e) {
    const s = e, n = Xt("initialInput"), t = Xt("confirmInput");
    return In(() => {
      s.model.mode !== "reset" && n.value?.focus();
    }), (i, c) => (o(), r("div", Rg, [
      l("div", Ig, [
        N(ue, {
          title: e.model.title,
          onClose: e.actions.close
        }, null, 8, ["title", "onClose"]),
        l("form", {
          onSubmit: c[2] || (c[2] = Qe((...u) => e.actions.submit && e.actions.submit(...u), ["prevent"]))
        }, [
          e.model.mode === "setup" ? (o(), r(f, { key: 0 }, [
            c[3] || (c[3] = l("p", null, [
              l("b", null, "Создайте локальный PIN преподавателя"),
              p(" из 4–6 цифр.")
            ], -1)),
            c[4] || (c[4] = l("div", { class: "teacher-lock-note" }, "PIN защищает вход в кабинет на этом устройстве и хранится в браузере.", -1)),
            l("input", {
              id: "teacherPinNew",
              ref_key: "initialInput",
              ref: n,
              type: "password",
              inputmode: "numeric",
              maxlength: "6",
              autocomplete: "new-password",
              class: "teacher-pin-input",
              "aria-label": "Новый PIN",
              placeholder: "••••",
              onKeydown: c[0] || (c[0] = Oe(Qe((u) => t.value?.focus(), ["prevent"]), ["enter"]))
            }, null, 544),
            l("input", {
              id: "teacherPinConfirm",
              ref_key: "confirmInput",
              ref: t,
              type: "password",
              inputmode: "numeric",
              maxlength: "6",
              autocomplete: "new-password",
              class: "teacher-pin-input",
              "aria-label": "Повторите PIN",
              placeholder: "Повторите PIN"
            }, null, 512)
          ], 64)) : e.model.mode === "login" ? (o(), r(f, { key: 1 }, [
            c[5] || (c[5] = l("p", null, "Введите локальный PIN преподавателя.", -1)),
            l("input", {
              id: "teacherPinLogin",
              ref_key: "initialInput",
              ref: n,
              type: "password",
              inputmode: "numeric",
              maxlength: "6",
              autocomplete: "current-password",
              class: "teacher-pin-input",
              "aria-label": "PIN преподавателя",
              placeholder: "••••"
            }, null, 512)
          ], 64)) : (o(), r(f, { key: 2 }, [
            c[6] || (c[6] = l("div", { class: "teacher-danger" }, [
              l("b", null, "При сбросе PIN сохранятся ученики и учебные данные."),
              l("br"),
              p(" Профили, прогресс, журнал, магазин и резервные данные сохранятся. ")
            ], -1)),
            c[7] || (c[7] = l("p", null, [
              p("Для подтверждения введите слово "),
              l("b", null, "СБРОСИТЬ"),
              p(".")
            ], -1)),
            c[8] || (c[8] = l("input", {
              id: "teacherResetWord",
              class: "teacher-search",
              autocomplete: "off",
              "aria-label": "Подтверждение сброса PIN",
              placeholder: "СБРОСИТЬ"
            }, null, -1))
          ], 64)),
          c[9] || (c[9] = l("div", {
            id: "teacherPinError",
            class: "teacher-pin-error",
            role: "alert"
          }, null, -1)),
          l("div", Ng, [
            l("button", Dg, a(e.model.submit), 1),
            l("button", {
              type: "button",
              class: "btn soft",
              onClick: c[1] || (c[1] = (...u) => e.actions.secondary && e.actions.secondary(...u))
            }, a(e.model.secondary), 1)
          ])
        ], 32)
      ])
    ]));
  }
}, Kg = { class: "home-back-row" }, Vg = { class: "teacher-hero" }, Bg = { class: "teacher-detail-head" }, Ug = { id: "teacherDashboardBody" }, Wg = { class: "teacher-summary" }, zg = { class: "teacher-toolbar" }, Xg = ["value"], Gg = ["value"], Qg = ["value"], Jg = {
  class: "teacher-filter-row",
  role: "group",
  "aria-label": "Фильтры учеников"
}, Yg = ["aria-pressed", "onClick"], Zg = {
  class: "actions",
  style: { "justify-content": "flex-start" }
}, _g = {
  key: 0,
  class: "teacher-student-grid"
}, e$ = { class: "teacher-student-head" }, t$ = { class: "teacher-student-id" }, n$ = ["innerHTML"], s$ = { class: "teacher-progress-lines" }, l$ = ["innerHTML"], i$ = { class: "teacher-progress-track" }, o$ = { class: "teacher-card-metrics" }, a$ = { key: 0 }, r$ = { class: "teacher-card-foot" }, c$ = ["onClick"], u$ = {
  key: 0,
  class: "teacher-empty",
  role: "status"
}, d$ = {
  key: 1,
  class: "teacher-empty"
}, m$ = { class: "actions" }, f$ = {
  __name: "TeacherDashboard",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", Kg, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: n[0] || (n[0] = (...t) => e.actions.close && e.actions.close(...t))
        }, "← Главный экран")
      ]),
      l("section", Vg, [
        l("div", Bg, [
          n[7] || (n[7] = l("div", null, [
            l("h1", null, "👨‍🏫 Панель преподавателя"),
            l("p", null, "Показатели рассчитаны по сохранённым профилям учеников.")
          ], -1)),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[1] || (n[1] = (...t) => e.actions.close && e.actions.close(...t))
          }, "🔒 Закрыть режим преподавателя")
        ])
      ]),
      l("div", Ug, [
        l("div", Wg, [
          (o(!0), r(f, null, g(e.model.stats, ({ label: t, value: i }) => (o(), r("div", { key: t }, [
            l("b", null, a(i), 1),
            l("small", null, a(t), 1)
          ]))), 128))
        ]),
        l("div", zg, [
          l("input", {
            id: "teacherSearchInput",
            type: "search",
            class: "teacher-search",
            "aria-label": "Найти ученика",
            placeholder: "🔎 Найти ученика",
            value: e.model.search,
            onInput: n[2] || (n[2] = (t) => e.actions.search(t.target.value))
          }, null, 40, Xg),
          l("select", {
            class: "teacher-select",
            "aria-label": "Сортировать учеников",
            value: e.model.sort,
            onChange: n[3] || (n[3] = (t) => e.actions.sort(t.target.value))
          }, [
            (o(!0), r(f, null, g(e.model.sorts, ({ id: t, label: i }) => (o(), r("option", {
              key: t,
              value: t
            }, a(i), 9, Qg))), 128))
          ], 40, Gg)
        ]),
        l("div", Jg, [
          (o(!0), r(f, null, g(e.model.filters, ({ id: t, label: i }) => (o(), r("button", {
            key: t,
            type: "button",
            class: x(["teacher-filter", { active: t === e.model.filter }]),
            "aria-pressed": t === e.model.filter,
            onClick: (c) => e.actions.filter(t)
          }, a(i), 11, Yg))), 128))
        ]),
        l("div", Zg, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[4] || (n[4] = (...t) => e.actions.profiles && e.actions.profiles(...t))
          }, "+ Новый ученик"),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[5] || (n[5] = (...t) => e.actions.backup && e.actions.backup(...t))
          }, "💾 Резервная копия")
        ]),
        e.model.hasStudents ? (o(), r("div", _g, [
          (o(!0), r(f, null, g(e.model.rows, (t) => (o(), r("section", {
            key: t.profileId,
            class: "teacher-student-card"
          }, [
            l("div", e$, [
              l("div", t$, [
                l("span", {
                  style: { display: "contents" },
                  innerHTML: t.avatar
                }, null, 8, n$),
                l("div", null, [
                  l("h3", null, a(t.name), 1),
                  l("small", null, "Уровень " + a(t.level) + " • " + a(t.xp) + " XP", 1)
                ])
              ]),
              l("span", {
                class: x(["teacher-attention", { "teacher-calm": !t.attention }])
              }, a(t.attention ? "⚠️ Требует внимания" : "✅ Спокойно"), 3)
            ]),
            l("div", s$, [
              (o(!0), r(f, null, g(t.grades, (i) => (o(), r("div", {
                key: i.number,
                class: "teacher-progress-line"
              }, [
                l("span", null, [
                  l("span", {
                    style: { display: "contents" },
                    innerHTML: i.icon
                  }, null, 8, l$),
                  p(" " + a(i.number) + " класс", 1)
                ]),
                l("div", i$, [
                  l("span", {
                    style: Z({ width: i.percent + "%" })
                  }, null, 4)
                ]),
                l("b", null, a(i.label), 1)
              ]))), 128))
            ]),
            l("div", o$, [
              l("span", null, "🔴 Слабых: " + a(t.weakCount), 1),
              l("span", null, "🟡 Нестабильных: " + a(t.unstableCount), 1),
              l("span", null, "🧠 Ошибок: " + a(t.activeErrors), 1),
              t.recentSkipped ? (o(), r("span", a$, "⏭ Пропусков: " + a(t.recentSkipped), 1)) : k("", !0)
            ]),
            l("div", r$, [
              l("span", null, a(t.lastActivity), 1),
              l("button", {
                type: "button",
                class: "btn soft",
                onClick: (i) => e.actions.open(t.profileId)
              }, "Открыть", 8, c$)
            ])
          ]))), 128)),
          e.model.rows.length ? k("", !0) : (o(), r("div", u$, "По выбранному фильтру учеников нет."))
        ])) : (o(), r("div", d$, [
          n[8] || (n[8] = l("b", null, "Пока нет учеников.", -1)),
          l("div", m$, [
            l("button", {
              type: "button",
              class: "btn primary",
              onClick: n[6] || (n[6] = (...t) => e.actions.profiles && e.actions.profiles(...t))
            }, "+ Создать ученика")
          ])
        ]))
      ])
    ], 64));
  }
}, b$ = {
  class: "training-plan-card",
  "aria-labelledby": "teacher-training-plan-title"
}, h$ = { class: "training-plan-head" }, y$ = ["aria-valuenow", "aria-valuemax"], v$ = { class: "training-plan-track" }, k$ = { class: "training-plan-count" }, g$ = {
  key: 1,
  class: "training-plan-empty"
}, $$ = { class: "training-plan-editor-actions" }, p$ = ["onClick"], C$ = { class: "teacher-analytics-grid" }, x$ = { class: "teacher-analytics-card wide" }, w$ = { class: "teacher-analytics-kpis" }, T$ = ["data-teacher-analytics-stat"], S$ = ["data-teacher-analytics-section"], O$ = {
  key: 0,
  class: "teacher-analytics-list"
}, q$ = { key: 0 }, M$ = { key: 0 }, L$ = { key: 0 }, j$ = { class: "teacher-analytics-facts" }, H$ = ["title"], P$ = { key: 1 }, E$ = {
  key: 2,
  class: "teacher-analytics-badge"
}, A$ = {
  key: 3,
  class: "teacher-analytics-actions"
}, R$ = ["onClick"], I$ = ["onClick"], N$ = {
  key: 1,
  class: "teacher-analytics-empty"
}, D$ = { class: "teacher-analytics-card wide" }, F$ = {
  key: 0,
  class: "teacher-training-list"
}, K$ = { class: "teacher-training-score" }, V$ = {
  key: 1,
  class: "teacher-analytics-empty"
}, B$ = {
  class: "teacher-analytics-card wide",
  "data-teacher-analytics-section": "recommendations"
}, U$ = {
  key: 0,
  class: "teacher-analytics-list"
}, W$ = { class: "teacher-recommendation-index" }, z$ = ["onClick"], X$ = {
  key: 1,
  class: "teacher-analytics-empty"
}, G$ = {
  __name: "TeacherStudentAnalytics",
  props: {
    analytics: { type: Object, required: !0 },
    plan: { type: Object, required: !0 },
    run: { type: Function, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("section", b$, [
        l("div", h$, [
          l("div", null, [
            n[0] || (n[0] = l("h2", { id: "teacher-training-plan-title" }, "🧩 План тренировки", -1)),
            l("p", null, a(e.plan.description), 1)
          ]),
          e.plan.status ? (o(), r("span", {
            key: 0,
            class: x(["training-plan-status", { done: e.plan.done }])
          }, a(e.plan.status), 3)) : k("", !0)
        ]),
        e.plan.progress.total ? (o(), r("div", {
          key: 0,
          class: "training-plan-progress",
          role: "progressbar",
          "aria-label": "Выполнено блоков плана",
          "aria-valuemin": 0,
          "aria-valuenow": e.plan.progress.done,
          "aria-valuemax": e.plan.progress.total
        }, [
          l("div", v$, [
            l("span", {
              style: Z({ width: e.plan.progress.pct + "%" })
            }, null, 4)
          ]),
          l("div", k$, a(e.plan.progress.done) + "/" + a(e.plan.progress.total), 1)
        ], 8, y$)) : e.plan.status ? (o(), r("div", g$, "Пока недостаточно данных для подбора блоков.")) : k("", !0),
        l("div", $$, [
          (o(!0), r(f, null, g(e.plan.actions, (t, i) => (o(), r("button", {
            key: t.type,
            type: "button",
            class: x(["btn", i === 0 ? "primary" : "soft"]),
            onClick: (c) => e.run(t)
          }, a(t.label), 11, p$))), 128))
        ])
      ]),
      l("div", C$, [
        l("section", x$, [
          n[1] || (n[1] = l("h2", null, "Сейчас", -1)),
          l("div", w$, [
            (o(!0), r(f, null, g(e.analytics.stats, (t) => (o(), r("div", {
              key: t.id,
              class: "teacher-analytics-kpi",
              "data-teacher-analytics-stat": t.id
            }, [
              l("b", null, a(t.value), 1),
              l("small", null, a(t.label), 1)
            ], 8, T$))), 128))
          ])
        ]),
        (o(!0), r(f, null, g(e.analytics.sections, (t) => (o(), r("section", {
          key: t.id,
          class: "teacher-analytics-card",
          "data-teacher-analytics-section": t.id
        }, [
          l("h2", null, a(t.title), 1),
          t.entries.length ? (o(), r("div", O$, [
            (o(!0), r(f, null, g(t.entries, (i) => (o(), r("div", {
              key: i.id,
              class: x([i.facts ? "teacher-analytics-group" : "teacher-analytics-row", i.tone])
            }, [
              i.facts ? (o(), r(f, { key: 1 }, [
                l("b", null, a(i.title), 1),
                i.description ? (o(), r("small", L$, a(i.description), 1)) : k("", !0),
                l("div", j$, [
                  (o(!0), r(f, null, g(i.facts, (c) => (o(), r("span", {
                    key: c.id,
                    class: "teacher-analytics-fact",
                    title: c.hint
                  }, a(c.label), 9, H$))), 128))
                ]),
                i.note ? (o(), r("small", P$, a(i.note), 1)) : k("", !0)
              ], 64)) : (o(), r("div", q$, [
                l("b", null, a(i.title), 1),
                i.description ? (o(), r("small", M$, a(i.description), 1)) : k("", !0)
              ])),
              i.badge ? (o(), r("span", E$, a(i.badge), 1)) : k("", !0),
              i.facts && i.actions?.length ? (o(), r("div", A$, [
                (o(!0), r(f, null, g(i.actions, (c) => (o(), r("button", {
                  key: c.mode,
                  type: "button",
                  class: "btn soft",
                  onClick: (u) => e.run(c)
                }, a(c.label), 9, R$))), 128))
              ])) : k("", !0),
              i.action ? (o(), r("button", {
                key: 4,
                type: "button",
                class: "btn soft",
                onClick: (c) => e.run(i.action)
              }, a(i.action.label), 9, I$)) : k("", !0)
            ], 2))), 128))
          ])) : (o(), r("div", N$, a(t.empty), 1))
        ], 8, S$))), 128)),
        l("section", D$, [
          n[2] || (n[2] = l("h2", null, "🕘 Последние тренировки", -1)),
          e.analytics.training.length ? (o(), r("div", F$, [
            (o(!0), r(f, null, g(e.analytics.training, (t, i) => (o(), r("div", {
              key: i,
              class: "teacher-training-row"
            }, [
              l("div", null, a(t.date), 1),
              l("div", null, [
                l("b", null, a(t.title), 1),
                l("small", null, a(t.description), 1)
              ]),
              l("div", K$, a(t.score), 1)
            ]))), 128))
          ])) : (o(), r("div", V$, "Здесь появятся результаты реальных быстрых тренировок."))
        ]),
        l("section", B$, [
          n[3] || (n[3] = l("h2", null, "💡 Что сделать на следующем занятии", -1)),
          e.analytics.recommendations.length ? (o(), r("div", U$, [
            (o(!0), r(f, null, g(e.analytics.recommendations, (t, i) => (o(), r("div", {
              key: i,
              class: "teacher-recommendation"
            }, [
              l("div", W$, a(i + 1), 1),
              l("div", null, [
                l("b", null, a(t.title), 1),
                l("small", null, a(t.reason), 1)
              ]),
              l("button", {
                type: "button",
                class: "btn soft",
                onClick: (c) => e.run(t.action)
              }, a(t.action.label), 9, z$)
            ]))), 128))
          ])) : (o(), r("div", X$, a(e.analytics.recommendationEmpty), 1))
        ])
      ])
    ], 64));
  }
}, Q$ = ["data-teacher-course-grade"], J$ = ["innerHTML"], Y$ = {
  key: 0,
  class: "teacher-empty"
}, Z$ = { class: "teacher-section-row" }, _$ = { "data-teacher-course-status": "" }, ep = ["aria-label", "aria-valuenow"], tp = {
  class: "teacher-card-metrics",
  style: { "margin-top": "9px" }
}, np = {
  key: 0,
  class: "teacher-course-box",
  style: { "margin-top": "10px" }
}, sp = { class: "teacher-section-row" }, lp = {
  key: 0,
  style: { color: "var(--muted)" }
}, ip = {
  key: 0,
  class: "teacher-progress-track"
}, op = {
  key: 0,
  class: "teacher-lock-note"
}, ap = {
  __name: "TeacherCourseProgress",
  props: { course: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r("div", {
      "data-teacher-course-grade": e.course.grade
    }, [
      l("h3", null, [
        l("span", {
          "aria-hidden": "true",
          style: { display: "contents" },
          innerHTML: e.course.icon
        }, null, 8, J$),
        p(" " + a(e.course.grade) + " класс", 1)
      ]),
      e.course.catalog ? (o(), r("div", Y$, [
        n[0] || (n[0] = l("b", null, "Каталог подготовлен — темы добавляются поэтапно.", -1)),
        n[1] || (n[1] = l("br", null, null, -1)),
        p(" " + a(e.course.catalog), 1)
      ])) : (o(), r(f, { key: 1 }, [
        l("div", Z$, [
          n[2] || (n[2] = l("span", null, "Пройдено курса", -1)),
          l("b", _$, a(e.course.status), 1)
        ]),
        l("div", {
          class: "teacher-progress-track",
          role: "progressbar",
          "aria-label": "Прогресс " + e.course.grade + "-го класса",
          "aria-valuemin": "0",
          "aria-valuemax": "100",
          "aria-valuenow": e.course.percent
        }, [
          l("span", {
            style: Z({ width: e.course.percent + "%" })
          }, null, 4)
        ], 8, ep),
        l("div", tp, [
          (o(!0), r(f, null, g(e.course.stages, (t) => (o(), r("span", {
            key: t.label
          }, a(t.label) + ": " + a(t.value), 1))), 128))
        ]),
        e.course.sections.length || e.course.note ? (o(), r("div", np, [
          (o(!0), r(f, null, g(e.course.sections, (t) => (o(), r(f, {
            key: t.title
          }, [
            l("div", sp, [
              l("span", null, [
                p(a(t.title) + " ", 1),
                t.availability ? (o(), r("small", lp, a(t.availability), 1)) : k("", !0)
              ]),
              l("b", null, a(t.status), 1)
            ]),
            t.percent !== null ? (o(), r("div", ip, [
              l("span", {
                style: Z({ width: t.percent + "%" })
              }, null, 4)
            ])) : k("", !0)
          ], 64))), 128)),
          e.course.note ? (o(), r("div", op, a(e.course.note), 1)) : k("", !0)
        ])) : k("", !0)
      ], 64))
    ], 8, Q$));
  }
}, rp = {
  class: "teacher-panel",
  "data-teacher-milestone": "control"
}, cp = { class: "teacher-section-row" }, up = { class: "teacher-lock-note" }, dp = {
  key: 1,
  class: "teacher-empty"
}, mp = {
  class: "teacher-panel",
  "data-teacher-milestone": "achievements"
}, fp = { class: "teacher-kpis" }, bp = {
  class: "teacher-work-list",
  style: { "margin-top": "9px" }
}, hp = {
  key: 0,
  class: "teacher-empty"
}, yp = {
  class: "teacher-panel",
  "data-teacher-milestone": "quests"
}, vp = { class: "teacher-kpis" }, kp = {
  __name: "TeacherStudentMilestones",
  props: { milestones: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("section", rp, [
        n[1] || (n[1] = l("h2", null, "🔁 Контрольные повторения", -1)),
        e.milestones.control ? (o(), r(f, { key: 0 }, [
          l("div", cp, [
            n[0] || (n[0] = l("span", null, "Последнее", -1)),
            l("b", null, a(e.milestones.control.score), 1)
          ]),
          l("div", up, a(e.milestones.control.detail), 1)
        ], 64)) : (o(), r("div", dp, "Контрольных повторений пока нет.")),
        n[2] || (n[2] = l("div", { class: "teacher-lock-note" }, "Запуск доступен из профиля ученика.", -1))
      ]),
      l("section", mp, [
        n[3] || (n[3] = l("h2", null, "🏆 Достижения", -1)),
        l("div", fp, [
          (o(!0), r(f, null, g(e.milestones.achievements.stats, (t) => (o(), r("div", {
            key: t.label,
            class: "teacher-kpi"
          }, [
            l("b", null, a(t.value), 1),
            l("small", null, a(t.label), 1)
          ]))), 128))
        ]),
        l("div", bp, [
          (o(!0), r(f, null, g(e.milestones.achievements.latest, (t) => (o(), r("div", {
            key: t.id,
            class: "teacher-work-row"
          }, [
            l("div", null, [
              l("b", null, a(t.title), 1),
              l("small", null, a(t.date), 1)
            ]),
            l("span", {
              class: x(["achievement-rarity", t.rarity])
            }, a(t.rarityLabel), 3)
          ]))), 128)),
          e.milestones.achievements.latest.length ? k("", !0) : (o(), r("div", hp, "Пока достижений нет."))
        ])
      ]),
      l("section", yp, [
        n[4] || (n[4] = l("h2", null, "🔥 Квесты", -1)),
        l("div", vp, [
          (o(!0), r(f, null, g(e.milestones.quests, (t) => (o(), r("div", {
            key: t.label,
            class: "teacher-kpi"
          }, [
            l("b", null, a(t.value), 1),
            l("small", null, a(t.label), 1)
          ]))), 128))
        ])
      ])
    ], 64));
  }
}, gp = { class: "home-back-row" }, $p = { class: "teacher-hero" }, pp = { class: "teacher-detail-head" }, Cp = { class: "teacher-person" }, xp = ["innerHTML"], wp = {
  key: 0,
  class: "teacher-profile-title"
}, Tp = ["innerHTML"], Sp = { class: "meta" }, Op = {
  class: "teacher-period-row",
  role: "group",
  "aria-label": "Период статистики ученика"
}, qp = ["aria-pressed", "onClick"], Mp = { class: "teacher-detail-grid" }, Lp = ["data-teacher-course-g1", "data-teacher-course-g2"], jp = { class: "teacher-panel" }, Hp = { class: "teacher-kpis" }, Pp = { class: "teacher-kpi" }, Ep = { class: "teacher-kpi" }, Ap = {
  class: "actions",
  style: { "justify-content": "flex-start" }
}, Rp = { class: "teacher-panel wide" }, Ip = { class: "teacher-kpis" }, Np = { class: "teacher-lock-note" }, Dp = { class: "teacher-panel" }, Fp = { class: "teacher-work-list" }, Kp = { class: "teacher-work-score" }, Vp = {
  key: 0,
  class: "teacher-empty"
}, Bp = { class: "teacher-panel" }, Up = { class: "teacher-error-list" }, Wp = {
  key: 0,
  class: "teacher-empty"
}, zp = { class: "actions" }, Xp = { class: "teacher-danger-zone" }, Gp = {
  __name: "TeacherStudentDetail",
  props: { model: Object, actions: Object },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", gp, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: n[0] || (n[0] = (...t) => e.actions.back && e.actions.back(...t))
        }, "← Все ученики")
      ]),
      l("section", $p, [
        l("div", pp, [
          l("div", Cp, [
            l("span", {
              style: { display: "contents" },
              innerHTML: e.model.avatar
            }, null, 8, xp),
            l("div", null, [
              l("h1", null, a(e.model.name), 1),
              e.model.title ? (o(), r("div", wp, "🏷️ " + a(e.model.title), 1)) : k("", !0),
              l("span", {
                style: { display: "contents" },
                innerHTML: e.model.badges
              }, null, 8, Tp),
              l("div", Sp, [
                p(" Уровень " + a(e.model.level) + " • " + a(e.model.xp) + " XP • 🪙 " + a(e.model.coins), 1),
                n[10] || (n[10] = l("br", null, null, -1)),
                p(" Решено: " + a(e.model.solved) + " • Лучшая серия: " + a(e.model.bestStreak), 1),
                n[11] || (n[11] = l("br", null, null, -1)),
                n[12] || (n[12] = p(" Последняя учебная активность: ", -1)),
                l("b", null, a(e.model.activity), 1)
              ])
            ])
          ]),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: n[1] || (n[1] = (...t) => e.actions.close && e.actions.close(...t))
          }, "🔒 Закрыть режим")
        ])
      ]),
      l("div", Op, [
        (o(!0), r(f, null, g(e.model.periods, ({ id: t, label: i }) => (o(), r("button", {
          key: t,
          type: "button",
          class: x(["teacher-filter", { active: t === e.model.period }]),
          "aria-pressed": t === e.model.period,
          onClick: (c) => e.actions.period(t)
        }, a(i), 11, qp))), 128))
      ]),
      N(G$, {
        analytics: e.model.analytics,
        plan: e.model.plan,
        run: e.actions.analytics
      }, null, 8, ["analytics", "plan", "run"]),
      l("div", Mp, [
        (o(!0), r(f, null, g(e.model.courses, (t) => (o(), r("section", {
          key: t.id,
          class: "teacher-panel",
          "data-teacher-course-g1": t.id === 1 ? "1" : null,
          "data-teacher-course-g2": t.id === 2 ? "1" : null
        }, [
          (o(!0), r(f, null, g(t.courses, (i) => (o(), Ce(ap, {
            key: i.grade,
            course: i
          }, null, 8, ["course"]))), 128))
        ], 8, Lp))), 128)),
        l("section", jp, [
          n[15] || (n[15] = l("h2", null, "🧠 Работа над ошибками", -1)),
          l("div", Hp, [
            l("div", Pp, [
              l("b", null, a(e.model.errors.active), 1),
              n[13] || (n[13] = l("small", null, "активно", -1))
            ]),
            l("div", Ep, [
              l("b", null, a(e.model.errors.resolved), 1),
              n[14] || (n[14] = l("small", null, "отработано", -1))
            ])
          ]),
          l("div", Ap, [
            l("button", {
              type: "button",
              class: "btn soft",
              onClick: n[2] || (n[2] = (...t) => e.actions.errors && e.actions.errors(...t))
            }, "Посмотреть ошибки")
          ])
        ]),
        N(kp, {
          milestones: e.model.milestones
        }, null, 8, ["milestones"]),
        l("section", Rp, [
          n[16] || (n[16] = l("h2", null, "Статистика ответов по школьным заданиям", -1)),
          l("div", Ip, [
            (o(!0), r(f, null, g(e.model.responseStats, ({ label: t, value: i }) => (o(), r("div", {
              key: t,
              class: "teacher-kpi"
            }, [
              l("b", null, a(i), 1),
              l("small", null, a(t), 1)
            ]))), 128))
          ]),
          l("div", Np, "В выборке: " + a(e.model.responseCount) + " заданий. Пустой Enter и повторные проверки не считаются отдельными заданиями.", 1)
        ]),
        l("section", Dp, [
          n[17] || (n[17] = l("h2", null, "🕘 Последние школьные работы", -1)),
          l("div", Fp, [
            (o(!0), r(f, null, g(e.model.works, (t, i) => (o(), r("div", {
              key: i,
              class: "teacher-work-row"
            }, [
              l("div", null, [
                l("b", null, a(t.title), 1),
                l("small", null, a(t.info), 1)
              ]),
              l("span", Kp, a(t.score), 1)
            ]))), 128)),
            e.model.works.length ? k("", !0) : (o(), r("div", Vp, "В выбранном периоде завершённых попыток нет."))
          ])
        ]),
        l("section", Bp, [
          n[18] || (n[18] = l("h2", null, "Последние ошибки школьных тем", -1)),
          l("div", Up, [
            (o(!0), r(f, null, g(e.model.recentErrors, (t, i) => (o(), r("div", {
              key: i,
              class: "teacher-error-row"
            }, [
              l("b", null, a(t.label) + " • " + a(t.title), 1),
              l("small", null, a(t.info), 1)
            ]))), 128)),
            e.model.recentErrors.length ? k("", !0) : (o(), r("div", Wp, "В выбранном периоде ошибок нет."))
          ])
        ])
      ]),
      l("div", zp, [
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[3] || (n[3] = (...t) => e.actions.journal && e.actions.journal(...t))
        }, "📋 Журнал"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[4] || (n[4] = (...t) => e.actions.topics && e.actions.topics(...t))
        }, "🎯 Слабые темы"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[5] || (n[5] = (...t) => e.actions.errors && e.actions.errors(...t))
        }, "🧠 Ошибки"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[6] || (n[6] = (...t) => e.actions.report && e.actions.report(...t))
        }, "📄 Отчёт"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[7] || (n[7] = (...t) => e.actions.knowledge && e.actions.knowledge(...t))
        }, "📊 Карта знаний"),
        l("button", {
          type: "button",
          class: "btn primary",
          onClick: n[8] || (n[8] = (...t) => e.actions.student && e.actions.student(...t))
        }, "Открыть как ученик")
      ]),
      l("section", Xp, [
        n[19] || (n[19] = l("h3", null, "Опасная зона", -1)),
        n[20] || (n[20] = l("p", null, "Удаление полностью уберёт только этого локального ученика. Перед удалением рекомендуется сделать резервную копию.", -1)),
        l("button", {
          type: "button",
          class: "btn teacher-danger-btn",
          onClick: n[9] || (n[9] = (...t) => e.actions.remove && e.actions.remove(...t))
        }, "🗑 Удалить ученика")
      ])
    ], 64));
  }
}, Qp = ["data-report-g1", "data-report-g2", "data-report-metric"], ht = {
  __name: "StudentReportKpis",
  props: { items: { type: Array, required: !0 } },
  setup(e) {
    return (s, n) => (o(!0), r(f, null, g(e.items, (t) => (o(), r("div", {
      key: t.label,
      class: "report-kpi",
      "data-report-g1": t.grade === 1 ? "1" : null,
      "data-report-g2": t.grade === 2 ? "1" : null,
      "data-report-metric": t.id
    }, [
      l("b", null, a(t.value), 1),
      l("small", null, a(t.label), 1)
    ], 8, Qp))), 128));
  }
}, Jp = {
  key: 0,
  class: "report-list"
}, Yp = { key: 0 }, Zp = {
  key: 1,
  class: "report-control-topics"
}, _p = {
  key: 1,
  class: "report-empty"
}, pt = {
  __name: "StudentReportRows",
  props: { rows: { type: Array, required: !0 }, empty: String },
  setup(e) {
    return (s, n) => e.rows.length ? (o(), r("div", Jp, [
      (o(!0), r(f, null, g(e.rows, (t, i) => (o(), r("div", {
        key: i,
        class: x(["report-row", t.tone])
      }, [
        l("div", null, [
          l("b", null, a(t.title), 1),
          t.description ? (o(), r("small", Yp, a(t.description), 1)) : k("", !0),
          t.details?.length ? (o(), r("div", Zp, [
            (o(!0), r(f, null, g(t.details, (c) => (o(), r("div", {
              key: c.title
            }, [
              l("span", null, a(c.title), 1),
              l("b", null, a(c.score), 1)
            ]))), 128))
          ])) : k("", !0)
        ]),
        t.score !== void 0 ? (o(), r("span", {
          key: 0,
          class: x(t.scoreClass || "report-score")
        }, a(t.score), 3)) : k("", !0)
      ], 2))), 128))
    ])) : (o(), r("div", _p, a(e.empty), 1));
  }
}, e0 = { class: "student-report-document" }, t0 = { class: "report-head" }, n0 = { class: "report-head-meta" }, s0 = { class: "report-student-name" }, l0 = { "data-report-period": "" }, i0 = { class: "report-section" }, o0 = { class: "report-summary-grid" }, a0 = { class: "report-summary-grid" }, r0 = { class: "report-period-note" }, c0 = {
  key: 0,
  class: "report-section"
}, u0 = { class: "report-summary-grid" }, d0 = {
  class: "report-analytics-grid",
  style: { "margin-top": "10px" }
}, m0 = { key: 0 }, f0 = { class: "report-fact-line" }, b0 = {
  key: 1,
  class: "report-section"
}, h0 = {
  class: "report-plan-compact",
  style: { "margin-top": "8px" }
}, y0 = {
  key: 0,
  class: "report-empty"
}, v0 = {
  class: "report-section",
  "data-report-section": "courses"
}, k0 = { class: "report-two-col" }, g0 = ["data-report-course"], $0 = { class: "report-course-head" }, p0 = ["innerHTML"], C0 = { class: "report-progress" }, x0 = { class: "report-stage-line" }, w0 = { style: { "margin-top": "7px" } }, T0 = {
  key: 0,
  class: "report-period-note"
}, S0 = {
  key: 1,
  class: "report-empty"
}, O0 = {
  class: "report-section",
  "data-report-section": "knowledge"
}, q0 = ["data-report-knowledge"], M0 = { class: "report-grade-title" }, L0 = ["innerHTML"], j0 = { class: "report-not-started" }, H0 = { class: "report-knowledge-grid" }, P0 = {
  key: 1,
  class: "report-empty"
}, E0 = { class: "report-section" }, A0 = { class: "report-two-col" }, R0 = { class: "report-section" }, I0 = { class: "report-summary-grid" }, N0 = ["data-report-section"], D0 = {
  key: 0,
  class: "report-summary-grid",
  style: { "margin-bottom": "8px" }
}, F0 = { class: "report-section" }, K0 = { class: "report-note" }, V0 = {
  class: "report-two-col",
  style: { "margin-top": "10px" }
}, B0 = {
  __name: "StudentReportDocument",
  props: { model: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r("article", e0, [
      l("header", t0, [
        l("div", null, [
          n[1] || (n[1] = l("div", { class: "report-brand" }, "МАТКВЕСТ", -1)),
          n[2] || (n[2] = l("h1", null, "Отчёт об учебном прогрессе", -1)),
          l("div", n0, [
            l("span", s0, "Ученик: " + a(e.model.name), 1),
            l("span", null, [
              n[0] || (n[0] = p("Период активности: ", -1)),
              l("b", l0, a(e.model.periodLabel), 1)
            ]),
            l("span", null, "Сформировано: " + a(e.model.generated), 1)
          ])
        ]),
        n[3] || (n[3] = l("div", { class: "report-current-badge" }, "Текущее состояние + активность за период", -1))
      ]),
      l("section", i0, [
        n[4] || (n[4] = l("h2", null, "Общая сводка", -1)),
        l("div", o0, [
          N(ht, {
            items: e.model.summary
          }, null, 8, ["items"])
        ]),
        n[5] || (n[5] = l("h3", null, "Активность за период", -1)),
        l("div", a0, [
          N(ht, {
            items: e.model.activity
          }, null, 8, ["items"])
        ]),
        l("div", r0, a(e.model.periodNote), 1)
      ]),
      e.model.analytics ? (o(), r("section", c0, [
        n[6] || (n[6] = l("h2", null, "🧭 Аналитика ученика", -1)),
        l("div", u0, [
          N(ht, {
            items: e.model.analytics.stats
          }, null, 8, ["items"])
        ]),
        l("div", d0, [
          (o(!0), r(f, null, g(e.model.analytics.boxes, (t) => (o(), r("div", {
            key: t.title,
            class: x(["report-analytics-box", { wide: t.wide }])
          }, [
            l("h3", null, a(t.title), 1),
            t.groups?.length ? (o(!0), r(f, { key: 0 }, g(t.groups, (i) => (o(), r("div", {
              key: i.title,
              class: "student-report-fact-group"
            }, [
              i.title ? (o(), r("b", m0, a(i.title), 1)) : k("", !0),
              l("div", f0, [
                (o(!0), r(f, null, g(i.facts, (c) => (o(), r("span", { key: c }, a(c), 1))), 128))
              ])
            ]))), 128)) : (o(), Ce(pt, {
              key: 1,
              rows: t.rows,
              empty: t.empty
            }, null, 8, ["rows", "empty"]))
          ], 2))), 128))
        ])
      ])) : k("", !0),
      e.model.plan ? (o(), r("section", b0, [
        n[7] || (n[7] = l("h2", null, "🧩 Текущий план тренировки", -1)),
        N(ht, {
          items: e.model.plan.stats
        }, null, 8, ["items"]),
        l("div", h0, [
          (o(!0), r(f, null, g(e.model.plan.rows, (t) => (o(), r("div", {
            key: t.id,
            class: "report-plan-row"
          }, [
            l("span", null, a(t.label), 1),
            l("b", null, a(t.status), 1)
          ]))), 128)),
          e.model.plan.rows.length ? k("", !0) : (o(), r("div", y0, "План пока пуст."))
        ])
      ])) : k("", !0),
      l("section", v0, [
        n[8] || (n[8] = l("h2", null, "📚 Прогресс курса", -1)),
        l("div", k0, [
          (o(!0), r(f, null, g(e.model.courses, (t) => (o(), r("div", {
            key: t.grade,
            class: "report-course-card",
            "data-report-course": t.grade
          }, [
            l("div", $0, [
              l("b", null, [
                l("span", {
                  "aria-hidden": "true",
                  style: { display: "contents" },
                  innerHTML: t.icon
                }, null, 8, p0),
                p(" " + a(t.grade) + " класс", 1)
              ]),
              l("strong", null, a(t.status), 1)
            ]),
            t.catalogOnly ? (o(), r("div", S0, a(t.note), 1)) : (o(), r(f, { key: 0 }, [
              l("div", C0, [
                l("span", {
                  style: Z({ width: t.percent + "%" })
                }, null, 4)
              ]),
              l("div", x0, [
                (o(!0), r(f, null, g(t.stages, (i) => (o(), r("span", { key: i }, a(i), 1))), 128))
              ]),
              l("div", w0, [
                (o(!0), r(f, null, g(t.sections, (i) => (o(), r("div", {
                  key: i.title,
                  class: "report-section-line"
                }, [
                  l("span", null, a(i.title), 1),
                  l("b", null, a(i.value), 1)
                ]))), 128)),
                t.note ? (o(), r("div", T0, a(t.note), 1)) : k("", !0)
              ])
            ], 64))
          ], 8, g0))), 128))
        ])
      ]),
      l("section", O0, [
        n[9] || (n[9] = l("h2", null, "📊 Карта знаний", -1)),
        (o(!0), r(f, null, g(e.model.knowledge, (t) => (o(), r("div", {
          key: t.grade,
          class: "student-report-knowledge-grade",
          "data-report-knowledge": t.grade
        }, [
          t.started ? (o(), r(f, { key: 0 }, [
            l("div", M0, [
              l("h3", null, [
                l("span", {
                  "aria-hidden": "true",
                  style: { display: "contents" },
                  innerHTML: t.icon
                }, null, 8, L0),
                p(" " + a(t.grade) + " класс", 1)
              ]),
              l("span", j0, a(t.caption), 1)
            ]),
            l("div", H0, [
              (o(!0), r(f, null, g(t.topics, (i) => (o(), r("div", {
                key: i.id,
                class: x(["report-topic-chip", i.tone])
              }, [
                l("b", null, a(i.title), 1),
                l("small", null, a(i.description), 1)
              ], 2))), 128))
            ])
          ], 64)) : (o(), r("div", P0, a(t.empty), 1))
        ], 8, q0))), 128))
      ]),
      l("section", E0, [
        l("div", A0, [
          l("div", null, [
            n[10] || (n[10] = l("h2", null, "🎯 Что стоит повторить", -1)),
            N(pt, {
              rows: e.model.weak,
              empty: "✅ Сейчас выраженных слабых тем нет."
            }, null, 8, ["rows"])
          ]),
          l("div", null, [
            n[11] || (n[11] = l("h2", null, "✅ Хорошо освоено", -1)),
            N(pt, {
              rows: e.model.strong,
              empty: "Пока недостаточно данных, чтобы выделить уверенно освоенные темы."
            }, null, 8, ["rows"])
          ])
        ])
      ]),
      l("section", R0, [
        n[13] || (n[13] = l("h2", null, "🧠 Работа над ошибками", -1)),
        l("div", I0, [
          N(ht, {
            items: e.model.errors.stats
          }, null, 8, ["items"])
        ]),
        e.model.errors.active.length ? (o(), r(f, { key: 0 }, [
          n[12] || (n[12] = l("h3", null, "Активные по темам", -1)),
          N(pt, {
            rows: e.model.errors.active
          }, null, 8, ["rows"])
        ], 64)) : k("", !0),
        n[14] || (n[14] = l("h3", null, "Последние ошибки за период", -1)),
        N(pt, {
          rows: e.model.errors.recent,
          empty: "В выбранном периоде значимых ошибок нет."
        }, null, 8, ["rows"])
      ]),
      (o(!0), r(f, null, g(e.model.lists, (t) => (o(), r("section", {
        key: t.id,
        class: "report-section",
        "data-report-section": t.id
      }, [
        l("h2", null, a(t.title), 1),
        t.stats?.length ? (o(), r("div", D0, [
          N(ht, {
            items: t.stats
          }, null, 8, ["items"])
        ])) : k("", !0),
        N(pt, {
          rows: t.rows,
          empty: t.empty
        }, null, 8, ["rows", "empty"])
      ], 8, N0))), 128)),
      l("section", F0, [
        n[15] || (n[15] = l("h2", null, "📝 Итог", -1)),
        l("div", K0, a(e.model.conclusion), 1),
        l("div", V0, [
          N(ht, {
            items: e.model.totals
          }, null, 8, ["items"])
        ])
      ]),
      n[16] || (n[16] = l("footer", { class: "report-print-foot" }, "Отчёт сформирован локально из сохранённых данных профиля.", -1))
    ]));
  }
}, U0 = {
  key: 0,
  class: "student-report-screen report-no-print"
}, W0 = { class: "report-empty" }, z0 = { class: "report-actions" }, X0 = {
  key: 1,
  class: "student-report-screen"
}, G0 = { class: "home-back-row report-no-print" }, Q0 = {
  class: "student-report-presets",
  role: "group",
  "aria-label": "Период отчёта"
}, J0 = ["aria-pressed", "onClick"], Y0 = ["value", "aria-invalid"], Z0 = ["value", "aria-invalid"], _0 = ["aria-pressed"], e2 = {
  id: "studentReportError",
  class: "student-report-error",
  role: "alert"
}, t2 = { class: "report-actions report-no-print" }, n2 = {
  __name: "TeacherStudentReport",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    const s = Xt("periodControls");
    return (n, t) => e.model.missing ? (o(), r("section", U0, [
      l("div", W0, [
        l("h1", null, a(e.model.title), 1),
        l("p", null, a(e.model.message), 1),
        l("div", z0, [
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: t[0] || (t[0] = (...i) => e.actions.back && e.actions.back(...i))
          }, "К списку учеников")
        ])
      ])
    ])) : (o(), r("div", X0, [
      l("div", G0, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: t[1] || (t[1] = (...i) => e.actions.back && e.actions.back(...i))
        }, "← К ученику")
      ]),
      l("div", {
        id: "studentReportControls",
        ref_key: "periodControls",
        ref: s,
        class: "student-report-toolbar report-no-print"
      }, [
        l("div", Q0, [
          (o(!0), r(f, null, g(e.model.periods, (i) => (o(), r("button", {
            key: i.id,
            type: "button",
            class: x(["teacher-filter", { active: i.id === e.model.period }]),
            "aria-pressed": i.id === e.model.period,
            onClick: (c) => e.actions.period(i.id)
          }, a(i.label), 11, J0))), 128))
        ]),
        l("form", {
          class: "student-report-custom",
          onSubmit: t[4] || (t[4] = Qe((...i) => e.actions.apply && e.actions.apply(...i), ["prevent"]))
        }, [
          l("label", null, [
            t[8] || (t[8] = p("От ", -1)),
            l("input", {
              type: "date",
              "aria-label": "Начало периода",
              value: e.model.draft.from,
              "aria-describedby": "studentReportError",
              "aria-invalid": e.model.error ? "true" : null,
              onInput: t[2] || (t[2] = (i) => e.actions.date("from", i.target.value))
            }, null, 40, Y0)
          ]),
          l("label", null, [
            t[9] || (t[9] = p("До ", -1)),
            l("input", {
              type: "date",
              "aria-label": "Конец периода",
              value: e.model.draft.to,
              "aria-describedby": "studentReportError",
              "aria-invalid": e.model.error ? "true" : null,
              onInput: t[3] || (t[3] = (i) => e.actions.date("to", i.target.value))
            }, null, 40, Z0)
          ]),
          l("button", {
            type: "submit",
            class: "btn soft",
            "aria-pressed": e.model.period === "custom"
          }, "Свой период", 8, _0)
        ], 32),
        l("div", e2, a(e.model.error), 1)
      ], 512),
      N(B0, {
        model: e.model.document
      }, null, 8, ["model"]),
      l("div", t2, [
        l("button", {
          type: "button",
          class: "btn primary",
          onClick: t[5] || (t[5] = (...i) => e.actions.print && e.actions.print(...i))
        }, "🖨️ Печать / PDF"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: t[6] || (t[6] = (i) => s.value?.scrollIntoView({ behavior: "smooth" }))
        }, "Изменить период"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: t[7] || (t[7] = (...i) => e.actions.back && e.actions.back(...i))
        }, "← К ученику")
      ])
    ]));
  }
}, s2 = { class: "home-back-row" }, l2 = ["data-teacher-review-stat"], i2 = {
  key: 0,
  class: "weak-grid"
}, o2 = ["data-teacher-topic"], a2 = { class: "weak-sub" }, r2 = { class: "weak-percent" }, c2 = {
  key: 0,
  class: "weak-preliminary"
}, u2 = { class: "weak-stats" }, d2 = { class: "weak-actions" }, m2 = ["onClick"], f2 = {
  key: 0,
  class: "teacher-empty",
  role: "status"
}, b2 = { class: "error-groups" }, h2 = ["data-teacher-error-topic"], y2 = ["onClick"], v2 = {
  key: 0,
  class: "teacher-empty",
  role: "status"
}, k2 = { class: "actions" }, g2 = {
  __name: "TeacherReview",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      l("div", s2, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: n[0] || (n[0] = (...t) => e.actions.back && e.actions.back(...t))
        }, "← " + a(e.model.name), 1)
      ]),
      l("section", {
        class: x(e.model.kind === "topics" ? "weak-hero" : "errorwork-hero")
      }, [
        l("h1", null, a(e.model.title), 1),
        l("p", null, a(e.model.description), 1)
      ], 2),
      l("div", {
        class: x(e.model.kind === "topics" ? "weak-summary" : "error-summary")
      }, [
        (o(!0), r(f, null, g(e.model.summary, (t) => (o(), r("div", {
          key: t.id,
          "data-teacher-review-stat": t.id
        }, [
          l("b", null, a(t.value), 1),
          l("small", null, a(t.label), 1)
        ], 8, l2))), 128))
      ], 2),
      e.model.kind === "topics" ? (o(), r("div", i2, [
        (o(!0), r(f, null, g(e.model.rows, (t) => (o(), r("section", {
          key: t.key,
          class: "weak-card",
          "data-teacher-topic": t.key
        }, [
          l("h3", null, a(t.status) + " • " + a(t.title), 1),
          l("div", a2, a(t.grade) + " класс • " + a(t.group), 1),
          l("div", r2, a(t.mastery), 1),
          t.preliminary ? (o(), r("div", c2, "Предварительная оценка")) : k("", !0),
          l("div", u2, [
            (o(!0), r(f, null, g(t.stats, (i) => (o(), r("span", {
              key: i.id
            }, [
              p(a(i.label) + ": ", 1),
              l("b", null, a(i.value), 1)
            ]))), 128))
          ]),
          l("div", d2, [
            l("button", {
              type: "button",
              class: "btn soft",
              onClick: (i) => e.actions.detail(t.key)
            }, "Подробнее", 8, m2)
          ])
        ], 8, o2))), 128)),
        e.model.rows.length ? k("", !0) : (o(), r("div", f2, a(e.model.empty), 1))
      ])) : (o(), r(f, { key: 1 }, [
        l("div", b2, [
          (o(!0), r(f, null, g(e.model.rows, (t) => (o(), r("section", {
            key: t.id,
            class: "error-group",
            "data-teacher-error-topic": t.topicKey
          }, [
            l("div", null, [
              l("h3", null, a(t.title), 1),
              l("small", null, a(t.grade) + " класс • " + a(t.description), 1),
              l("span", {
                class: x(["error-state", t.active ? "red" : "green"])
              }, a(t.active ? "🔴 Требует отработки" : "✅ Отработано"), 3)
            ]),
            t.topicKey ? (o(), r("button", {
              key: 0,
              type: "button",
              class: "btn soft",
              onClick: (i) => e.actions.detail(t.topicKey)
            }, "Подробнее", 8, y2)) : k("", !0)
          ], 8, h2))), 128)),
          e.model.rows.length ? k("", !0) : (o(), r("div", v2, a(e.model.empty), 1))
        ]),
        n[2] || (n[2] = l("div", { class: "lesson" }, "Чтобы запустить тренировку ошибок, открой профиль ученика.", -1)),
        l("div", k2, [
          l("button", {
            type: "button",
            class: "btn primary",
            onClick: n[1] || (n[1] = (...t) => e.actions.student && e.actions.student(...t))
          }, "Открыть как ученик")
        ])
      ], 64))
    ], 64));
  }
}, $2 = { class: "lesson" }, p2 = { class: "actions" }, C2 = {
  __name: "TeacherTopicReview",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    return (s, n) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", $2, [
        l("b", null, "Ученик: " + a(e.model.name), 1),
        n[1] || (n[1] = l("br", null, null, -1)),
        p(" " + a(e.model.grade) + " класс • " + a(e.model.group), 1),
        n[2] || (n[2] = l("br", null, null, -1)),
        p(" " + a(e.model.status) + " • освоение: ", 1),
        l("b", null, a(e.model.mastery), 1)
      ]),
      N(Kn, {
        stats: e.model.stats
      }, null, 8, ["stats"]),
      l("div", p2, [
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[0] || (n[0] = (...t) => e.actions.close && e.actions.close(...t))
        }, "Закрыть")
      ])
    ], 64));
  }
}, x2 = { class: "teacher-danger" }, w2 = { class: "teacher-delete-name" }, T2 = ["aria-invalid", "onKeydown"], S2 = {
  id: "teacherDeleteError",
  class: "teacher-pin-error",
  role: "alert"
}, O2 = { class: "actions" }, q2 = ["disabled"], M2 = {
  key: 0,
  class: "teacher-danger"
}, L2 = { class: "teacher-delete-name" }, j2 = {
  key: 1,
  class: "lesson"
}, H2 = {
  key: 2,
  class: "lesson"
}, P2 = { class: "actions" }, E2 = {
  __name: "TeacherActionDialog",
  props: { model: { type: Object, required: !0 }, actions: { type: Object, required: !0 } },
  setup(e) {
    const s = e, n = Xt("nameInput"), t = /* @__PURE__ */ Me(s.model.entered || ""), i = /* @__PURE__ */ Me(s.model.error || ""), c = ne(() => t.value.trim() === s.model.name);
    In(() => n.value?.focus({ preventScroll: !0 }));
    function u() {
      if (!c.value) {
        i.value = "Введённое имя не совпадает с именем ученика.";
        return;
      }
      s.actions.confirm(t.value);
    }
    return (d, m) => (o(), r(f, null, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      e.model.kind === "name" ? (o(), r("form", {
        key: 0,
        onSubmit: Qe(u, ["prevent"])
      }, [
        l("div", x2, [
          m[6] || (m[6] = l("label", { for: "teacherDeleteName" }, [
            l("b", null, "Введите имя ученика, как показано ниже")
          ], -1)),
          l("div", w2, a(e.model.name), 1),
          nt(l("input", {
            id: "teacherDeleteName",
            ref_key: "nameInput",
            ref: n,
            "onUpdate:modelValue": m[0] || (m[0] = (v) => t.value = v),
            class: "teacher-delete-input",
            autocomplete: "off",
            "aria-invalid": i.value ? "true" : null,
            "aria-describedby": "teacherDeleteError",
            onInput: m[1] || (m[1] = (v) => i.value = ""),
            onKeydown: Oe(Qe(u, ["prevent"]), ["enter"])
          }, null, 40, T2), [
            [Hs, t.value]
          ]),
          l("div", S2, a(i.value), 1)
        ]),
        l("div", O2, [
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: m[2] || (m[2] = (...v) => e.actions.close && e.actions.close(...v))
          }, "Отмена"),
          l("button", {
            id: "teacherDeleteFinalBtn",
            type: "submit",
            class: "btn teacher-danger-btn",
            disabled: !c.value
          }, "Удалить окончательно", 8, q2)
        ])
      ], 32)) : (o(), r(f, { key: 1 }, [
        e.model.kind === "profile" ? (o(), r("div", M2, [
          l("div", L2, a(e.model.name), 1),
          m[7] || (m[7] = l("p", null, "Будут окончательно удалены локальные данные этого ученика, включая прогресс, журнал, ошибки, XP, монеты, достижения и настройки профиля.", -1)),
          m[8] || (m[8] = l("p", null, "Локальный PIN, настройки преподавателя и профили других учеников сохранятся.", -1))
        ])) : e.model.kind === "plan" ? (o(), r("div", j2, [
          m[9] || (m[9] = p(" В плане ученика ", -1)),
          l("b", null, a(e.model.name), 1),
          m[10] || (m[10] = p(" есть выполненные пункты. Учебные результаты, награды и история сохранятся после удаления плана. ", -1))
        ])) : (o(), r("div", H2, [
          m[11] || (m[11] = p(" МатКвест переключит активный профиль на ", -1)),
          l("b", null, a(e.model.name), 1),
          p(", закроет режим преподавателя и откроет " + a(e.model.destination || (e.model.kind === "quick" ? "тренажёр" : "тему")) + " ", 1),
          l("b", null, "«" + a(e.model.target) + "»", 1),
          e.model.mode ? (o(), r(f, { key: 0 }, [
            p(" в режиме «" + a(e.model.mode) + "»", 1)
          ], 64)) : k("", !0),
          m[12] || (m[12] = p(". ", -1))
        ])),
        l("div", P2, [
          e.model.kind === "profile" ? (o(), r("button", {
            key: 0,
            type: "button",
            class: "btn soft",
            onClick: m[3] || (m[3] = (...v) => e.actions.backup && e.actions.backup(...v))
          }, "💾 Сделать резервную копию")) : k("", !0),
          l("button", {
            type: "button",
            class: "btn soft",
            onClick: m[4] || (m[4] = (...v) => e.actions.close && e.actions.close(...v))
          }, "Отмена"),
          l("button", {
            type: "button",
            class: x(["btn", e.model.kind === "profile" || e.model.kind === "plan" ? "teacher-danger-btn" : "primary"]),
            onClick: m[5] || (m[5] = (v) => e.actions.confirm())
          }, a(e.model.confirmLabel), 3)
        ])
      ], 64))
    ], 64));
  }
}, A2 = { class: "quest-screen" }, R2 = { class: "home-back-row" }, I2 = { class: "quest-board-summary" }, N2 = { class: "quest-grid" }, D2 = ["data-quest-id"], F2 = { class: "quest-card-head" }, K2 = {
  class: "quest-icon",
  "aria-hidden": "true"
}, V2 = { class: "quest-meta" }, B2 = { class: "quest-pill" }, U2 = { class: "quest-desc" }, W2 = { class: "quest-progress-line" }, z2 = ["aria-label", "aria-valuemax", "aria-valuenow", "aria-valuetext"], X2 = { class: "quest-reward" }, G2 = {
  key: 0,
  class: "quest-ready"
}, Q2 = { class: "quest-actions" }, J2 = ["onClick"], Y2 = ["disabled", "onClick"], Z2 = {
  key: 0,
  class: "quest-empty"
}, _2 = { class: "quest-note" }, e8 = { class: "quest-history" }, t8 = {
  key: 0,
  class: "quest-history-list"
}, n8 = {
  key: 1,
  class: "quest-empty"
}, s8 = {
  __name: "QuestBoard",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("div", A2, [
      l("div", R2, [
        l("button", {
          type: "button",
          class: "home-back-btn",
          onClick: n[0] || (n[0] = (...t) => e.actions.back && e.actions.back(...t))
        }, "← Главный экран")
      ]),
      n[2] || (n[2] = l("section", { class: "quest-hero" }, [
        l("h1", null, "🔥 Квесты"),
        l("p", null, "Прогресс квеста считается с момента его выдачи.")
      ], -1)),
      l("div", I2, [
        (o(!0), r(f, null, g(e.model.stats, (t) => (o(), r("div", {
          key: t.label
        }, [
          l("b", null, a(t.value), 1),
          l("small", null, a(t.label), 1)
        ]))), 128))
      ]),
      l("div", N2, [
        (o(!0), r(f, null, g(e.model.cards, (t) => (o(), r("section", {
          key: t.id,
          class: x(["quest-card", { completed: t.ready }]),
          "data-quest-id": t.id
        }, [
          l("div", F2, [
            l("div", K2, a(t.icon), 1),
            l("div", null, [
              l("h3", null, a(t.title), 1),
              l("div", V2, [
                l("span", B2, a(t.category), 1),
                l("span", {
                  class: x(["quest-pill", t.difficulty])
                }, a(t.difficultyLabel), 3)
              ])
            ])
          ]),
          l("div", U2, a(t.desc), 1),
          l("div", W2, [
            l("span", null, a(t.ready ? "Готово" : "Прогресс"), 1),
            l("b", null, a(t.progressLabel), 1)
          ]),
          l("div", {
            class: "quest-progress-track",
            role: "progressbar",
            "aria-label": t.title,
            "aria-valuemin": "0",
            "aria-valuemax": t.target,
            "aria-valuenow": t.progress,
            "aria-valuetext": t.progressLabel
          }, [
            l("span", {
              style: Z({ width: t.percent + "%" })
            }, null, 4)
          ], 8, z2),
          l("div", X2, "Награда: " + a(t.reward), 1),
          t.ready ? (o(), r("div", G2, "🎁 Цель выполнена — забери награду")) : k("", !0),
          l("div", Q2, [
            t.ready ? (o(), r("button", {
              key: 0,
              type: "button",
              class: "btn primary",
              onClick: (i) => e.actions.claim(t.id)
            }, "🎁 Получить награду", 8, J2)) : (o(), r("button", {
              key: 1,
              type: "button",
              class: "btn soft",
              disabled: e.model.rerollUsed,
              onClick: (i) => e.actions.replace(t.id)
            }, "🔄 Заменить", 8, Y2))
          ])
        ], 10, D2))), 128)),
        e.model.cards.length ? k("", !0) : (o(), r("div", Z2, "Подходящие квесты пока не найдены."))
      ]),
      l("div", _2, a(e.model.rerollNote), 1),
      l("details", e8, [
        n[1] || (n[1] = l("summary", null, "История выполненных квестов", -1)),
        e.model.history.length ? (o(), r("div", t8, [
          (o(!0), r(f, null, g(e.model.history, (t) => (o(), r("div", {
            key: t.id,
            class: "quest-history-row"
          }, [
            l("div", null, [
              l("b", null, "✅ " + a(t.title), 1),
              l("small", null, a(t.date), 1)
            ]),
            l("span", null, a(t.reward), 1)
          ]))), 128))
        ])) : (o(), r("div", n8, "История появится после получения первой награды."))
      ])
    ]));
  }
}, l8 = { class: "quest-replace-dialog" }, i8 = { class: "lesson" }, o8 = {
  key: 0,
  class: "teacher-danger"
}, a8 = { class: "actions" }, r8 = {
  __name: "QuestReplaceDialog",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("div", l8, [
      N(ue, {
        title: e.model.title,
        onClose: e.actions.close
      }, null, 8, ["title", "onClose"]),
      l("div", i8, [
        l("b", null, a(e.model.questTitle), 1),
        n[2] || (n[2] = l("br", null, null, -1)),
        p(a(e.model.description), 1)
      ]),
      e.model.progress ? (o(), r("div", o8, [
        l("b", null, "Прогресс " + a(e.model.progress) + " будет потерян.", 1)
      ])) : k("", !0),
      l("div", a8, [
        l("button", {
          type: "button",
          class: "btn primary",
          onClick: n[0] || (n[0] = (...t) => e.actions.confirm && e.actions.confirm(...t))
        }, "Заменить"),
        l("button", {
          type: "button",
          class: "btn soft",
          onClick: n[1] || (n[1] = (...t) => e.actions.close && e.actions.close(...t))
        }, "Отмена")
      ])
    ]));
  }
}, c8 = {
  class: "mk872-training-panel",
  role: "alertdialog",
  "aria-modal": "true",
  "aria-labelledby": "mk872-training-heading",
  "aria-describedby": "mk872-training-description"
}, u8 = { id: "mk872-training-heading" }, d8 = { id: "mk872-training-description" }, m8 = { class: "mk872-training-actions" }, f8 = ["onClick"], b8 = {
  __name: "LearningDialog",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("section", c8, [
      l("h2", u8, a(e.model.title), 1),
      l("p", d8, a(e.model.message), 1),
      l("div", m8, [
        (o(!0), r(f, null, g(e.model.labels, (t, i) => (o(), r("button", {
          key: t,
          type: "button",
          class: x(["btn", i === 0 ? "primary" : "soft"]),
          onClick: (c) => e.actions.choose(i)
        }, a(t), 11, f8))), 128))
      ])
    ]));
  }
}, h8 = {
  class: "mk872-viewer-card",
  role: "document"
}, y8 = { id: "mk872ViewerVisual" }, v8 = ["innerHTML"], k8 = {
  id: "mk872ViewerTitle",
  class: "mk872-viewer-title"
}, g8 = {
  __name: "ArtworkViewer",
  props: {
    model: { type: Object, required: !0 },
    actions: { type: Object, required: !0 }
  },
  setup(e) {
    return (s, n) => (o(), r("div", h8, [
      l("button", {
        type: "button",
        class: "mk872-viewer-close",
        "aria-label": "Закрыть просмотр",
        onClick: n[0] || (n[0] = (...t) => e.actions.close && e.actions.close(...t))
      }, "×"),
      l("div", y8, [
        l("div", {
          class: x(["mk30-visual", e.model.kind === "pet" ? "mk30-pet" : "mk30-avatar"]),
          inert: "",
          innerHTML: e.model.artwork
        }, null, 10, v8)
      ]),
      l("div", k8, a(e.model.title), 1),
      n[1] || (n[1] = l("div", { class: "mk872-viewer-hint" }, "Нажмите вне окна или Esc, чтобы закрыть", -1))
    ]));
  }
}, ss = /* @__PURE__ */ new WeakMap();
function p8(e, s, n) {
  I(e, Vr, s, n);
}
function C8(e, s, n) {
  I(e, rc, s, n);
}
function x8(e, s, n) {
  I(e, Sc, s, n);
}
function w8(e, s, n) {
  I(e, Uc, s, n);
}
function T8(e, s, n) {
  I(e, su, s, n);
}
function S8(e, s, n) {
  I(e, uu, s, n);
}
function O8(e, s, n) {
  I(e, yu, s, n);
}
function q8(e, s, n) {
  I(e, Fu, s, n);
}
function M8(e, s, n) {
  I(e, Wu, s, n);
}
function L8(e, s, n) {
  I(e, zd, s, n);
}
function j8(e, s, n) {
  I(e, im, s, n);
}
function H8(e, s) {
  I(e, Ps, s);
}
function P8(e, s, n) {
  I(e, vm, s, n);
}
function E8(e, s, n) {
  I(e, Ri, s, n);
}
function A8(e, s, n) {
  I(e, ef, s, n);
}
function R8(e, s, n) {
  I(e, Ii, s, n);
}
function I8(e, s, n) {
  I(e, jf, s, n);
}
function N8(e, s, n) {
  I(e, Bf, s, n);
}
function D8(e, s, n) {
  I(e, e1, s, n);
}
function F8(e, s, n) {
  I(e, r1, s, n);
}
function K8(e, s, n) {
  I(e, V1, s, n);
}
function V8(e, s, n) {
  I(e, cb, s, n);
}
function B8(e, s, n) {
  I(e, Sb, s, n);
}
function U8(e, s, n) {
  I(e, ib, s, n);
}
function W8(e, s) {
  I(e, qb, s);
}
function z8(e, s, n) {
  I(e, sb, s, n);
}
function X8(e, s, n) {
  I(e, jb, s, n);
}
function G8(e, s, n) {
  I(e, zb, s, n);
}
function Q8(e, s, n) {
  I(e, Yb, s, n);
}
function J8(e, s, n) {
  I(e, vh, s, n);
}
function Y8(e, s, n) {
  I(e, Es, s, n);
}
function Z8(e, s, n) {
  s.column && (n = {
    inputCell: globalThis.columnCellInput,
    moveCell: globalThis.workKey,
    toggleDot: globalThis.toggleDot,
    ...n
  }), I(e, wh, s, n);
}
function _8(e, s, n) {
  I(e, Mh, s, n);
}
function eC(e, s, n) {
  I(e, jh, s, n);
}
function tC(e, s) {
  I(e, Di, s);
}
function nC(e, s, n) {
  I(e, dy, s, n);
}
function sC(e, s, n) {
  I(e, ry, s, n);
}
function lC(e, s, n) {
  I(e, py, s, n);
}
function iC(e, s, n) {
  I(e, My, s, n);
}
function oC(e, s, n) {
  I(e, Ay, s, n);
}
function aC(e, s, n) {
  I(e, Iy, s, n);
}
function rC(e, s) {
  I(e, Ny, s);
}
function cC(e, s, n) {
  I(e, Qy, s, n);
}
function uC(e, s, n) {
  I(e, ov, s, n);
}
function dC(e, s, n) {
  I(e, kv, s, n);
}
function mC(e, s, n) {
  I(e, Ev, s, n);
}
function fC(e, s, n) {
  I(e, Gv, s, n);
}
function bC(e, s, n) {
  I(e, ek, s, n);
}
function hC(e, s, n) {
  I(e, lk, s, n);
}
function yC(e, s, n) {
  I(e, mk, s, n);
}
function vC(e, s, n) {
  I(e, yk, s, n);
}
function kC(e, s, n) {
  I(e, jk, s, n);
}
function gC(e, s, n) {
  I(e, sg, s, n);
}
function $C(e, s, n) {
  I(e, Hg, s, n);
}
function pC(e, s, n) {
  I(e, Ag, s, n);
}
function CC(e, s, n) {
  I(e, Fg, s, n);
}
function xC(e, s, n) {
  I(e, f$, s, n);
}
function wC(e, s, n) {
  I(e, Gp, s, n);
}
function TC(e, s, n) {
  I(e, n2, s, n);
}
function SC(e, s, n) {
  I(e, g2, s, n);
}
function OC(e, s, n) {
  I(e, C2, s, n);
}
function qC(e, s, n) {
  I(e, E2, s, n);
}
function MC(e, s, n) {
  I(e, s8, s, n);
}
function LC(e, s, n) {
  I(e, r8, s, n);
}
function jC(e, s, n) {
  I(e, b8, s, n);
}
function HC(e, s, n) {
  I(e, g8, s, n);
}
function I(e, s, n, t) {
  const i = ss.get(e);
  if (i) {
    i.model = n;
    return;
  }
  const c = /* @__PURE__ */ Ul({ model: n }), u = mr({
    render: () => Ia(s, { model: c.model, actions: t })
  }), d = e.parentNode;
  u.mount(e), ss.set(e, c);
  const m = new MutationObserver(() => {
    e.isConnected && e.parentNode === d || (m.disconnect(), u.unmount(), ss.delete(e));
  });
  m.observe(d, { childList: !0 });
  const v = e.closest("#mainView, #modal");
  v && d !== v && m.observe(v, { childList: !0 });
}
export {
  gC as mountAchievementCatalog,
  U8 as mountAppFooter,
  z8 as mountAppHeader,
  HC as mountArtworkViewer,
  O8 as mountAttemptJournal,
  q8 as mountAttemptReview,
  $C as mountBackupDialog,
  uC as mountCollectionArchive,
  aC as mountCollectionNavigation,
  oC as mountCollectionSection,
  rC as mountCollectionWorth,
  R8 as mountColumnExercise,
  T8 as mountControlReview,
  S8 as mountControlReviewResult,
  j8 as mountCourseTopic,
  V8 as mountDeveloperAccess,
  B8 as mountDeveloperPanel,
  x8 as mountErrorWork,
  eC as mountFractionMixIntro,
  L8 as mountGradeCourse,
  K8 as mountHomeDashboard,
  p8 as mountKnowledgeMap,
  kC as mountLeaderboard,
  jC as mountLearningDialog,
  cC as mountPetQuickPanel,
  M8 as mountPracticeResult,
  tC as mountProfilePreview,
  MC as mountQuestBoard,
  LC as mountQuestReplaceDialog,
  D8 as mountQuickExercise,
  N8 as mountQuickTrainerFrame,
  F8 as mountQuickTrainerResult,
  I8 as mountQuickTrainerSetup,
  A8 as mountQuizExercise,
  W8 as mountRewardNotice,
  Z8 as mountSchoolAttempt,
  _8 as mountSchoolAttemptFrame,
  P8 as mountStageResult,
  pC as mountStorageRecovery,
  iC as mountStoreCatalog,
  fC as mountStoreChest,
  bC as mountStoreChestResult,
  yC as mountStoreControls,
  hC as mountStoreHelpDialog,
  dC as mountStoreSaleDialog,
  nC as mountStoreSurfaceHeader,
  vC as mountStoreTabs,
  mC as mountStoreWallet,
  lC as mountStudentProfileEditor,
  sC as mountStudentProfiles,
  G8 as mountStudentProgress,
  E8 as mountTableExercise,
  qC as mountTeacherActionDialog,
  xC as mountTeacherDashboard,
  CC as mountTeacherPinDialog,
  SC as mountTeacherReview,
  wC as mountTeacherStudentDetail,
  TC as mountTeacherStudentReport,
  OC as mountTeacherTopicReview,
  C8 as mountTopicDetail,
  Q8 as mountTrainingGoalPicker,
  X8 as mountTrainingHistoryReport,
  J8 as mountTrainingPlan,
  Y8 as mountTrainingPlanReturn,
  H8 as mountTrainingProgress,
  w8 as mountWeakTopics
};
