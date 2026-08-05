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

// for-in must see a prototype property that is redefined as enumerable
// through a partial property descriptor.

// case 1: class accessor redefined as enumerable (google.maps LatLngAltitude pattern)
class A {
  constructor() {
    this.x = 1;
  }
  get lat() {
    return 2;
  }
  get lng() {
    return 3;
  }
}
Object.defineProperties(A.prototype, { lat: { enumerable: true }, lng: { enumerable: true } });

var desc = Object.getOwnPropertyDescriptor(A.prototype, "lat");
assert(desc.enumerable === true);

var keys = [];
for (var k in new A()) {
  keys.push(k);
}
assert(keys.join(",") === "x,lat,lng");

// case 2: data property on a prototype redefined as enumerable
function B() {
  this.y = 1;
}
Object.defineProperty(B.prototype, "dp", { value: 9, enumerable: false, configurable: true, writable: true });
Object.defineProperty(B.prototype, "dp", { enumerable: true });

keys = [];
for (k in new B()) {
  keys.push(k);
}
assert(keys.join(",") === "y,dp");

// case 3: redefinition must not disturb own-property enumeration
var c = {};
Object.defineProperty(c, "acc", { get: function () { return 1; }, enumerable: false, configurable: true });
Object.defineProperty(c, "acc", { enumerable: true });
keys = [];
for (k in c) {
  keys.push(k);
}
assert(keys.join(",") === "acc");
assert(Object.keys(c).join(",") === "acc");

// case 4: non-enumerable class accessors must stay hidden from for-in
class D {
  constructor() {
    this.z = 1;
  }
  get hidden() {
    return 2;
  }
}
keys = [];
for (k in new D()) {
  keys.push(k);
}
assert(keys.join(",") === "z");

// case 5: descriptor replacement on a non-transition structure
var nonTransitionProto = {};
for (var i = 0; i < 40; i++) {
  Object.defineProperty(nonTransitionProto, "p" + i, {
    value: i,
    configurable: true
  });
}
Object.defineProperty(nonTransitionProto, "p39", { enumerable: true });

keys = [];
for (k in Object.create(nonTransitionProto)) {
  keys.push(k);
}
assert(keys.join(",") === "p39");

// case 6: descriptor replacement on a structure with a property map
var mapProto = {};
for (i = 0; i < 2050; i++) {
  Object.defineProperty(mapProto, "p" + i, {
    value: i,
    configurable: true
  });
}
Object.defineProperty(mapProto, "p2049", { enumerable: true });

keys = [];
for (k in Object.create(mapProto)) {
  keys.push(k);
}
assert(keys.join(",") === "p2049");

// case 7: redefining the last enumerable property as non-enumerable
// may leave a conservative structure flag, but for-in must still filter it.
Object.defineProperty(mapProto, "p2049", { enumerable: false });
keys = [];
for (k in Object.create(mapProto)) {
  keys.push(k);
}
assert(keys.length === 0);
