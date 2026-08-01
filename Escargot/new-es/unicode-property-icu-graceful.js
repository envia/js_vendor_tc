/* Copyright 2026-present Samsung Electronics Co., Ltd. and other contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Test: Unicode property escapes with non-existent / future-version properties
 *
 * After Phase 2 (hash table -> runtime ICU lookup), property validation is
 * delegated to the running ICU.  This test verifies that:
 *
 *  1. Completely non-existent properties -> SyntaxError (no segfault)
 *  2. Non-existent property values -> SyntaxError (no segfault)
 *  3. Valid properties still work correctly
 *  4. \P{...} with property-of-strings -> SyntaxError (no segfault)
 *
 * This test must pass on every ICU version.  Properties that a particular ICU
 * version does not recognise must be rejected gracefully as SyntaxError, never
 * crash the process.
 */

function assertSyntaxError(code) {
    try {
        eval(code);
    } catch (e) {
        if (e instanceof SyntaxError) {
            return;
        }
        throw new Error("Expected SyntaxError but got: " + e);
    }
    throw new Error("Expected SyntaxError but no error was thrown: " + code);
}

function assertNoError(code) {
    try {
        eval(code);
    } catch (e) {
        throw new Error("Expected no error but got: " + e);
    }
}

// ---------------------------------------------------------------------------
// Detect whether Unicode property escapes are supported (ICU build).
// In noicu builds \p{...} is a SyntaxError, so we skip ICU-specific tests.
// ---------------------------------------------------------------------------
var hasICU;
try {
    eval('/\\p{Letter}/u');
    hasICU = true;
} catch (e) {
    hasICU = false;
}

// ---------------------------------------------------------------------------
// 1. Completely non-existent property names -> SyntaxError
// ---------------------------------------------------------------------------
assertSyntaxError('/\\p{NonExistentProperty}/u');
assertSyntaxError('/\\p{Fake_Property_123}/u');
assertSyntaxError('/\\p{This_Property_Does_Not_Exist}/u');
assertSyntaxError('/\\p{X}/u');
assertSyntaxError('/\\p{}/u');
assertSyntaxError('/\\p{ABCD}/u');
assertSyntaxError('/\\p{abcd}/u');
assertSyntaxError('/\\p{Foobar}/u');
assertSyntaxError('/\\p{Not_A_Real_Group}/u');

// ---------------------------------------------------------------------------
// 2. Non-existent property values -> SyntaxError
// ---------------------------------------------------------------------------
assertSyntaxError('/\\p{Script=NonExistentScript}/u');
assertSyntaxError('/\\p{General_Category=FakeCategory}/u');
assertSyntaxError('/\\p{gc=NotARealCategory}/u');
assertSyntaxError('/\\p{sc=FakeScript}/u');

if (hasICU) {
// ---------------------------------------------------------------------------
// 3. Valid properties should work (these are stable across all ICU versions)
// ---------------------------------------------------------------------------
assertNoError('/\\p{Letter}/u.test("a")');
assertNoError('/\\p{Number}/u.test("1")');
assertNoError('/\\p{Script=Latin}/u.test("a")');
assertNoError('/\\p{gc=L}/u.test("a")');
assertNoError('/\\p{Any}/u.test("a")');
assertNoError('/\\p{ASCII}/u.test("a")');
assertNoError('/\\p{Assigned}/u.test("a")');
assertNoError('/\\p{Lowercase}/u.test("a")');
assertNoError('/\\p{Uppercase}/u.test("A")');
assertNoError('/\\p{White_Space}/u.test(" ")');

// Verify correct matching behaviour
assert(eval('/\\p{Letter}/u.test("a")') === true);
assert(eval('/\\p{Letter}/u.test("1")') === false);
assert(eval('/\\p{Number}/u.test("1")') === true);
assert(eval('/\\p{Number}/u.test("a")') === false);
assert(eval('/\\p{Lowercase}/u.test("a")') === true);
assert(eval('/\\p{Lowercase}/u.test("A")') === false);
assert(eval('/\\p{Uppercase}/u.test("A")') === true);
assert(eval('/\\p{Uppercase}/u.test("a")') === false);
assert(eval('/\\p{ASCII}/u.test("a")') === true);
assert(eval('/\\P{ASCII}/u.test("\\u0100")') === true);

// ---------------------------------------------------------------------------
// 4. \P{...} with property-of-strings in /v mode -> SyntaxError
//    (property of strings cannot be negated)
// ---------------------------------------------------------------------------
assertSyntaxError('/\\P{Basic_Emoji}/v');
assertSyntaxError('/\\P{RGI_Emoji}/v');
assertSyntaxError('/\\P{RGI_Emoji_Flag_Sequence}/v');
assertSyntaxError('/\\P{RGI_Emoji_Modifier_Sequence}/v');
assertSyntaxError('/\\P{RGI_Emoji_Tag_Sequence}/v');
assertSyntaxError('/\\P{RGI_Emoji_ZWJ_Sequence}/v');
assertSyntaxError('/\\P{Emoji_Keycap_Sequence}/v');
} // end if (hasICU)

// ---------------------------------------------------------------------------
// 5. Negated non-existent property -> SyntaxError
// ---------------------------------------------------------------------------
assertSyntaxError('/\\P{NonExistentProperty}/u');
assertSyntaxError('/\\P{Fake_Property_456}/u');

print("unicode-property-icu-graceful: all tests passed");
