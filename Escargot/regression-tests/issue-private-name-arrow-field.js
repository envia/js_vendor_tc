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
//
// TODO: rename to issue-<number>.js once the Samsung/escargot issue is filed.

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
