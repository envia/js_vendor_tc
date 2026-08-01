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
 * Test: Case-insensitive RegExp matching after Phase 3 (case folding tables -> ICU)
 *
 * Verifies that u_foldCase()/u_tolower()/u_toupper() runtime calls correctly
 * replace the static CanonicalizationRange tables.  Must pass on all ICU versions
 * and noicu builds.  No test should cause a segfault.
 */

function assertEqual(actual, expected, msg) {
    if (actual !== expected)
        throw new Error((msg || "") + " expected " + expected + " but got " + actual);
}

var hasICU;
try { eval('/\\p{Letter}/u'); hasICU = true; } catch (e) { hasICU = false; }

// 1. ASCII case-insensitive (works in all builds including noicu)
assertEqual(/hello/i.test("HELLO"), true, "ASCII upper");
assertEqual(/HELLO/i.test("hello"), true, "ASCII lower");
assertEqual(/abc/i.test("ABC"), true, "ASCII simple");
assertEqual(/abc/i.test("XYZ"), false, "ASCII no match");

// 2. Latin-1 case pairs
if (hasICU) {
    assertEqual(/\u00e9/i.test("\u00c9"), true, "Latin e-acute");
    assertEqual(/\u00c9/i.test("\u00e9"), true, "Latin E-acute");
    assertEqual(/\u00e0/i.test("\u00c0"), true, "Latin a-grave");
    assertEqual(/\u00fc/i.test("\u00dc"), true, "Latin u-umlaut");
    assertEqual(/\u00f1/i.test("\u00d1"), true, "Latin n-tilde");
}

// 3. Multi-codepoint case sets (3+ chars in one equivalence class)
if (hasICU) {
    // Kelvin sign: K, k, U+212A -- only in Unicode mode
    assertEqual(/\u212a/iu.test("K"), true, "Kelvin -> K");
    assertEqual(/\u212a/iu.test("k"), true, "Kelvin -> k");
    assertEqual(/K/iu.test("\u212a"), true, "K -> Kelvin");
    assertEqual(/k/iu.test("\u212a"), true, "k -> Kelvin");
    assertEqual(/\u212a/i.test("K"), false, "Kelvin != K (ucs2)");

    // Long S: S, s, U+017F -- only in Unicode mode
    assertEqual(/\u017f/iu.test("S"), true, "LongS -> S");
    assertEqual(/\u017f/iu.test("s"), true, "LongS -> s");
    assertEqual(/S/iu.test("\u017f"), true, "S -> LongS");
    assertEqual(/s/iu.test("\u017f"), true, "s -> LongS");
    assertEqual(/\u017f/i.test("S"), false, "LongS != S (ucs2)");

    // Angstrom: Aring, aring, U+212B
    assertEqual(/\u212b/iu.test("\u00c5"), true, "Angstrom -> Aring");
    assertEqual(/\u212b/iu.test("\u00e5"), true, "Angstrom -> aring");
}

// 4. Greek case folding (Sigma has 3 forms)
if (hasICU) {
    assertEqual(/\u03a3/iu.test("\u03c3"), true, "Sigma -> sigma");
    assertEqual(/\u03c3/iu.test("\u03a3"), true, "sigma -> Sigma");
    assertEqual(/\u03a3/iu.test("\u03c2"), true, "Sigma -> final sigma");
    assertEqual(/\u03c2/iu.test("\u03a3"), true, "final sigma -> Sigma");
    assertEqual(/\u03c2/iu.test("\u03c3"), true, "final sigma -> sigma");
    assertEqual(/\u2126/iu.test("\u03a9"), true, "Ohm -> Omega");
    assertEqual(/\u2126/iu.test("\u03c9"), true, "Ohm -> omega");
}

// 5. Cyrillic case folding
if (hasICU) {
    assertEqual(/\u0410/iu.test("\u0430"), true, "Cyrillic A -> a");
    assertEqual(/\u0412/iu.test("\u0432"), true, "Cyrillic Ve -> ve");
    assertEqual(/\u0414/iu.test("\u0434"), true, "Cyrillic De -> de");
    assertEqual(/\u0421/iu.test("\u0441"), true, "Cyrillic Es -> es");
}

// 6. Case-insensitive ranges
assertEqual(/[a-z]/i.test("A"), true, "Range a-z matches A");
assertEqual(/[a-z]/i.test("Z"), true, "Range a-z matches Z");
assertEqual(/[A-Z]/i.test("a"), true, "Range A-Z matches a");
assertEqual(/[A-Z]/i.test("0"), false, "Range A-Z no match 0");
if (hasICU) {
    assertEqual(/[\u00c0-\u00c5]/i.test("\u00e0"), true, "Range A-grave ci");
    assertEqual(/[\u0391-\u03a9]/iu.test("\u03b1"), true, "Greek range ci");
}

// 7. Characters with no case folding are unique
assertEqual(/!/i.test("a"), false, "Exclamation unique");
assertEqual(/123/i.test("123"), true, "Digits match");
if (hasICU) {
    assertEqual(/\u4e00/iu.test("\u4e00"), true, "CJK matches itself");
    assertEqual(/\u4e00/iu.test("\u4e01"), false, "CJK no false match");
}

// 8. Case-insensitive backreference matching
assertEqual(/(hello)\1/i.test("HELLOhello"), true, "Backref ci 1");
assertEqual(/(hello)\1/i.test("HELLOHELLO"), true, "Backref ci 2");
assertEqual(/(hello)\1/i.test("helloworld"), false, "Backref no match");
if (hasICU) {
    assertEqual(/(\u00e9)\1/i.test("\u00c9\u00e9"), true, "Backref Latin ci");
    assertEqual(/(\u03a3)\1/iu.test("\u03c3\u03a3"), true, "Backref Greek ci");
}

// 9. Case-insensitive with character classes
assertEqual(/[abc]+/i.test("ABCabc"), true, "Char class [abc] ci");
assertEqual(/[abc]+/i.test("XYZ"), false, "Char class [abc] no match");
assertEqual(/[^abc]/i.test("A"), false, "Negated char class ci");
if (hasICU) {
    assertEqual(/[\u0391-\u03a9]+/iu.test("\u03b1\u03b2"), true, "Greek char class ci");
}

print("case-folding-icu-graceful: all tests passed");
