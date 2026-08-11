/* Copyright 2026-present Samsung Electronics Co., Ltd. and other contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Private member access (this.#x, #x in o) from an arrow function defined in a
// class field initializer must work when the arrow is later called. Field
// initializers compile to virtual arrow functions; a nested arrow has to keep
// the initializer's environment (which carries the class home object)
// reachable at call time. Before the fix these cases threw
// "Cannot read/write private member here".

// control: private read directly in a method
class A {
  #v = 1;
  run() { return this.#v; }
}
assert(new A().run() === 1);

// control: arrow created inside a method (not a field initializer) already worked
class A2 {
  #v = 4;
  run() { var f = () => this.#v; return f(); }
}
assert(new A2().run() === 4);

// arrow field initializer reads a private field
class B {
  #v = 2;
  #b = () => this.#v;
  run() { return this.#b(); }
}
assert(new B().run() === 2);

// arrow field initializer called after the constructor has returned
class C {
  #v = 3;
  #b = () => this.#v;
  get b() { return this.#b; }
}
var later = new C().b;
assert(later() === 3);

// arrow field initializer stored and invoked as a plain callback
class D {
  #v = 5;
  #b = () => this.#v;
  run() { var cb = this.#b; return cb(); }
}
assert(new D().run() === 5);

// write to a private field from an arrow field initializer
class E {
  #s = 0;
  #b = () => { this.#s = 9; return this.#s; };
  run() { return this.#b(); }
}
assert(new E().run() === 9);

// brand check (#x in o) evaluated inside an arrow field initializer
class F {
  #v = 7;
  #has = (o) => (#v in o);
  run() { return this.#has(new F()); }
}
assert(new F().run() === true);

// the same brand check must report false for a non-instance
class G {
  #v = 8;
  #has = (o) => (#v in o);
  run() { return this.#has({}); }
}
assert(new G().run() === false);

// direct private access in a field initializer does not need to outlive the
// initializer call; keeping this control ensures it still works on a stack env
class H {
  #v = 9;
  value = this.#v;
  hasBrand = (#v in this);
}
var h = new H();
assert(h.value === 9);
assert(h.hasBrand === true);

// static field initializers use the same one-expression virtual arrow wrapper
class I {
  static #v = 10;
  static read = () => this.#v;
  static has = (o) => (#v in o);
}
assert(I.read() === 10);
assert(I.has(I) === true);
assert(I.has({}) === false);

// static initialization blocks use a function-body virtual arrow wrapper
class J {
  static #v = 11;
  static {
    this.read = () => this.#v;
    this.has = (o) => (#v in o);
  }
}
assert(J.read() === 11);
assert(J.has(J) === true);
assert(J.has({}) === false);

// keep every enclosing field-initializer environment when a nested class uses
// a private name from an outer class after the outer initializer has returned
class K {
  #v = 12;
  make = () => {
    class Inner {
      read = (o) => o.#v;
      has = (o) => (#v in o);
    }
    return new Inner();
  };
}
var k = new K();
var inner = k.make();
assert(inner.read(k) === 12);
assert(inner.has(k) === true);
assert(inner.has({}) === false);

// a private name redeclared by the nested class must not fall through to the
// outer class's same-named brand or member
class L {
  #v = 13;
  make = () => {
    class Inner {
      #v = 14;
      has = (o) => (#v in o);
      read = (o) => o.#v;
    }
    var instance = new Inner();
    return [instance, instance.has, instance.read];
  };
}
var l = new L();
var nested = l.make();
assert(nested[1](nested[0]) === true);
assert(nested[1](l) === false);
assert(nested[2](nested[0]) === 14);
assertThrows(function() { nested[2](l); }, TypeError);

// an instance can carry both the nested and outer class brands when the nested
// class extends the outer class; a different private name in the nested class
// must not prevent member lookup from continuing to the outer class
class M {
  #v = 15;
  make = () => {
    class Inner extends M {
      #own = 0;
      has = (o) => (#v in o);
      read = (o) => o.#v;
      write = (o, value) => (o.#v = value);
    }
    return new Inner();
  };
}
var m = new M();
var derivedNested = m.make();
assert(derivedNested.has(derivedNested) === true);
assert(derivedNested.read(derivedNested) === 15);
assert(derivedNested.write(derivedNested, 16) === 16);
assert(derivedNested.read(derivedNested) === 16);

// a class without shadowed names nested inside a method of a shadowing class
// must resolve the enclosing class's name at run time instead of borrowing
// the enclosing method's name list at compile time
class N {
  #x = 'outer';
  m() {
    class Mid {
      #x = 'mid';
      m2(o) {
        class Leaf {
          #z = 1;
          read(oo) { return oo.#x; }
          has(oo) { return #x in oo; }
        }
        return new Leaf();
      }
    }
    var mid = new Mid();
    var leaf = mid.m2(mid);
    return [leaf.read(mid), leaf.has(mid), leaf.has({})];
  }
}
var nres = new N().m();
assert(nres[0] === 'mid');
assert(nres[1] === true);
assert(nres[2] === false);

// direct eval in the method also attaches name lists to the enclosing scopes
class O {
  #x = 'eval-outer';
  m(o) {
    eval('');
    class Leaf {
      read(oo) { return oo.#x; }
      has(oo) { return #x in oo; }
    }
    var leaf = new Leaf();
    return [leaf.read(o), leaf.has(o)];
  }
}
var o = new O();
var ores = o.m(o);
assert(ores[0] === 'eval-outer');
assert(ores[1] === true);

// a nested class that shadows one name must still reach a different
// outer-only name on an outer instance
class P {
  #x = 'px';
  #y = 'py';
  m() {
    class Mid {
      #x = 'mx';
      m2(o) { return o.#y; }
    }
    return new Mid().m2(this);
  }
}
assert(new P().m() === 'py');

// an object literal method between the inner and outer classes still carries
// the outer private environment but must not replace its class context
class Q {
  #x = 'qx';
  make() {
    var holder = {
      makeInner() {
        return class Inner {
          #own = 0;
          has = (o) => (#x in o);
          read = (o) => o.#x;
          write = (o, value) => (o.#x = value);
        };
      }
    };
    return holder;
  }
}
var q = new Q();
var holder = q.make();
var throughObjectMethod = new (holder.makeInner())();
assert(throughObjectMethod.has(q) === true);
assert(throughObjectMethod.has({}) === false);
assert(throughObjectMethod.read(q) === 'qx');
assert(throughObjectMethod.write(q, 'updated') === 'updated');
assert(throughObjectMethod.read(q) === 'updated');
