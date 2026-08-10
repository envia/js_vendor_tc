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

// Loud manifestation: two exported bodies both declare a local `o`. The
// name collector used while parsing the exports must stay out of the nested
// function bodies. Before the fix the reused `o` was collected as an exported
// name twice and the whole module failed to parse with
// "duplicate export name 'o'" -- the make-plural / openstreetmap.org symptom.
//
// TODO: rename to issue-<number>.mjs once the Samsung/escargot issue is filed.

export const a = t => { const o = 1; return o + t; };
export const b = t => { const o = 2; return o + t; };
export function c() { const o = 3; return o; }
export var d = function () { var o = 4; let p = 5; return o + p; };

// Reached only if the module parses (it must). The exported values are unaffected.
assert(a(0) === 1);
assert(b(0) === 2);
assert(c() === 3);
assert(d() === 9);
