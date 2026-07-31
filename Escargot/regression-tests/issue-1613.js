// Issue #1613: GetObject: object-key conversion causes an out-of-bounds fast-array read
//
// The GetObject bytecode handler checked ArrayObject::isFastModeArray() and then
// converted the property key to an array index via a call that can run arbitrary
// user JS (Object key -> toString()/valueOf()). That callback can switch the array
// to non-fast-mode storage (replacing the element buffer with a 1-element
// placeholder) and enlarge the logical length to 0xffffffff. The interpreter then
// read m_fastModeData[idx] using the post-callback length without re-checking
// fast-mode status, causing an out-of-bounds read of attacker-influenced size.
//
// configurable: true avoids an unrelated pre-existing quirk where the slow
// property-lookup path may invoke the key's toString() more than once; it does
// not affect the security property under test.
const array = [];
const key = {
    toString() {
        Object.defineProperty(array, "0", {
            get() {
                return 1;
            },
            configurable: true,
        });
        array.length = 0xffffffff;
        return "4294967294";
    },
};

const result = array[key];
if (result !== undefined) {
    throw new Error("expected undefined, got " + result);
}

print("PoC completed without crash: " + result);
