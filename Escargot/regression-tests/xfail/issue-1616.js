// Issue #1616: RegExp: capture count wrap causes a stack out-of-bounds write
//
// RegExp.prototype[Symbol.replace] takes result.length from a custom, fully
// attacker-controlled exec() implementation, converts it via toLength() and
// subtracts 1 to get nCaptures, then uses nCaptures+3 (or +4 with named
// captures) to size an ALLOCA'd (stack) argument array for the replacer
// callback. On a 32-bit build (32-bit size_t), a length of 2**32-2 makes
// nCaptures = 0xfffffffd, and nCaptures+3 wraps to 0 -- a zero-sized stack
// allocation -- while the code still unconditionally writes replacerArgs[0],
// causing an out-of-bounds stack write with an attacker-influenced value.
//
// Confirmed pre-fix: SIGSEGV inside builtinRegExpReplace (BuiltinRegExp.cpp)
// on a 32-bit build. After the fix, an out-of-range capture count throws a
// RangeError before the unsafe allocation/writes occur.
RegExp.prototype[Symbol.replace].call(
    {
        flags: "",
        exec() {
            return {
                0: "",
                index: 0,
                length: 2 ** 32 - 2,
                groups: undefined,
            };
        },
    },
    "",
    () => ""
);
