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

// A nested field-initializer arrow can resolve an outer class's private name.
class OuterAccess {
  #v = 10;
  make() {
    var outer = this;
    return new class Inner {
      read = () => outer.#v;
    };
  }
}
assert(new OuterAccess().make().read() === 10);

// A field-initializer arrow must not let runtime lookup cross a class that
// shadows the referenced private name. The #x used by Leaf resolves to Mid's
// #x, so an Outer instance does not carry the required brand.
class ShadowOuter {
  #x = 'outer';
  value() { return this.#x; }
  make() {
    class Mid {
      #x = 'mid';
      make() {
        class Leaf {
          #z = 0;
          read = (o) => o.#x;
          write = (o, value) => (o.#x = value);
        }
        return new Leaf();
      }
    }
    return new Mid().make();
  }
}
var shadowOuter = new ShadowOuter();
var shadowLeaf = shadowOuter.make();
assertThrows(function() { shadowLeaf.read(shadowOuter); }, TypeError);
assertThrows(function() { shadowLeaf.write(shadowOuter, 'changed'); }, TypeError);
assert(shadowOuter.value() === 'outer');

// static field initializers use the same one-expression virtual arrow wrapper
class StaticFields {
  static #v = 10;
  static read = () => this.#v;
  static has = (o) => (#v in o);
}
assert(StaticFields.read() === 10);
assert(StaticFields.has(StaticFields) === true);
assert(StaticFields.has({}) === false);

// a shadowed name must not be served by the outer class's member through an
// instance that carries the inner and outer brands but not the middle one
class ShadowExtends {
  #x = 'outer';
  value() { return this.#x; }
  m() {
    class Mid {
      #x = 'mid';
      m2() {
        class Leaf extends ShadowExtends {
          #z = 1;
          read(oo) { return oo.#x; }
          write(oo) { oo.#x = 'clobbered'; }
        }
        return { mid: this, leaf: new Leaf() };
      }
    }
    return new Mid().m2();
  }
}
var shadowExtends = new ShadowExtends();
var shadowPair = shadowExtends.m();
assert(shadowPair.leaf.read(shadowPair.mid) === 'mid');
assertThrows(function() { shadowPair.leaf.read(shadowPair.leaf); }, TypeError);
assertThrows(function() { shadowPair.leaf.write(shadowPair.leaf); }, TypeError);
assert(shadowPair.leaf.value() === 'outer');
assert(shadowExtends.value() === 'outer');

// an arrow created in a method with only a private name must not cross a
// shadowing class either
class ShadowMethodArrow {
  #x = 'outer';
  value() { return this.#x; }
  m0() {
    class Mid {
      #x = 'mid';
      m1() {
        class Leaf {
          #z = 1;
          reader() { return (o) => o.#x; }
          writer() { return (o) => { o.#x = 'clobbered'; }; }
        }
        return new Leaf();
      }
    }
    return new Mid().m1();
  }
}
var shadowMethodOuter = new ShadowMethodArrow();
var shadowMethodLeaf = shadowMethodOuter.m0();
assertThrows(function() { shadowMethodLeaf.reader()(shadowMethodOuter); }, TypeError);
assertThrows(function() { shadowMethodLeaf.writer()(shadowMethodOuter); }, TypeError);
assert(shadowMethodOuter.value() === 'outer');

// an object literal method between the classes must not crash the lookup;
// the spec resolves the name through the literal, so a correct engine
// returns the outer value and the current safe behavior is a TypeError miss
class LiteralBetween {
  #x = 'v';
  m() {
    var holder = {
      makeInner() {
        class Inner {
          f = (o) => o.#x;
        }
        return new Inner();
      }
    };
    return holder.makeInner();
  }
}
var literalOuter = new LiteralBetween();
var literalInner = literalOuter.m();
var literalOutcome;
try {
  literalOutcome = literalInner.f(literalOuter);
} catch (e) {
  literalOutcome = e;
}
assert(literalOutcome === 'v' || literalOutcome instanceof TypeError);
