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

// Helper for the quiet manifestation (checked by issue-1640_1.mjs). Every
// exported body declares a DISTINCT local (o, p, q, r, s), so there is no
// duplicate and the module parses on every engine. Before the fix the parser
// still collected those body-locals as exported names, so the module
// namespace leaked them (Object.keys => a,b,c,d,o,p,q,r,s instead of
// a,b,c,d). The exported values stay correct, so only inspecting the export
// list reveals the bug.

export const a = t => { const o = 1; return o + t; };
export const b = t => { const p = 2; return p + t; };
export function c() { const q = 3; return q; }
export var d = function () { var r = 4; let s = 5; return r + s; };
