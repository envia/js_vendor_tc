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
class M {
  #v = 1;
  run() { return this.#v; }
}
assert(new M().run() === 1);

// control: arrow created inside a method (not a field initializer) already worked
class M2 {
  #v = 4;
  run() { var f = () => this.#v; return f(); }
}
assert(new M2().run() === 4);

// arrow field initializer reads a private field
class A {
  #v = 2;
  #b = () => this.#v;
  run() { return this.#b(); }
}
assert(new A().run() === 2);

// arrow field initializer called after the constructor has returned
class B {
  #v = 3;
  #b = () => this.#v;
  get b() { return this.#b; }
}
var later = new B().b;
assert(later() === 3);

// arrow field initializer stored and invoked as a plain callback
class C {
  #v = 5;
  #b = () => this.#v;
  run() { var cb = this.#b; return cb(); }
}
assert(new C().run() === 5);

// write to a private field from an arrow field initializer
class D {
  #s = 0;
  #b = () => { this.#s = 9; return this.#s; };
  run() { return this.#b(); }
}
assert(new D().run() === 9);

// brand check (#x in o) evaluated inside an arrow field initializer
class E {
  #v = 7;
  #has = (o) => (#v in o);
  run() { return this.#has(new E()); }
}
assert(new E().run() === true);

// the same brand check must report false for a non-instance
class F {
  #v = 8;
  #has = (o) => (#v in o);
  run() { return this.#has({}); }
}
assert(new F().run() === false);

// direct private access in a field initializer does not need to outlive the
// initializer call; keeping this control ensures it still works on a stack env
class G {
  #v = 9;
  value = this.#v;
  hasBrand = (#v in this);
}
var g = new G();
assert(g.value === 9);
assert(g.hasBrand === true);

// static field initializers use the same one-expression virtual arrow wrapper
class H {
  static #v = 10;
  static read = () => this.#v;
  static has = (o) => (#v in o);
}
assert(H.read() === 10);
assert(H.has(H) === true);
assert(H.has({}) === false);

// static initialization blocks use a function-body virtual arrow wrapper
class I {
  static #v = 11;
  static {
    this.read = () => this.#v;
    this.has = (o) => (#v in o);
  }
}
assert(I.read() === 11);
assert(I.has(I) === true);
assert(I.has({}) === false);

// keep every enclosing field-initializer environment when a nested class uses
// a private name from an outer class after the outer initializer has returned
class J {
  #v = 12;
  make = () => {
    class Inner {
      read = (o) => o.#v;
      has = (o) => (#v in o);
    }
    return new Inner();
  };
}
var j = new J();
var inner = j.make();
assert(inner.read(j) === 12);
assert(inner.has(j) === true);
assert(inner.has({}) === false);

// a private name redeclared by the nested class must not fall through to the
// outer class's same-named brand or member
class K {
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
var k = new K();
var nested = k.make();
assert(nested[1](nested[0]) === true);
assert(nested[1](k) === false);
assert(nested[2](nested[0]) === 14);
assertThrows(function() { nested[2](k); }, TypeError);

// an instance can carry both the nested and outer class brands when the nested
// class extends the outer class; a different private name in the nested class
// must not prevent member lookup from continuing to the outer class
class L {
  #v = 15;
  make = () => {
    class Inner extends L {
      #own = 0;
      has = (o) => (#v in o);
      read = (o) => o.#v;
      write = (o, value) => (o.#v = value);
    }
    return new Inner();
  };
}
var l = new L();
var derivedNested = l.make();
assert(derivedNested.has(derivedNested) === true);
assert(derivedNested.read(derivedNested) === 15);
assert(derivedNested.write(derivedNested, 16) === 16);
assert(derivedNested.read(derivedNested) === 16);
