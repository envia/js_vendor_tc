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

// Quiet manifestation: the function-body locals in the helper must NOT appear
// as exported names. The helper parses fine (distinct locals, no collision)
// and its values are correct, so a values-only check would pass on the buggy
// engine; only the exported-name list exposes the leak
// (Object.keys was a,b,c,d,o,p,q,r,s before the fix, must be a,b,c,d).

import * as ns from './issue-1640_0.mjs';

// the exported names are exactly the four real exports -- no leaked body-locals
assert(Object.keys(ns).join(',') === 'a,b,c,d');

// and the exports still work
assert(ns.a(0) === 1);
assert(ns.b(0) === 2);
assert(ns.c() === 3);
assert(ns.d() === 9);
