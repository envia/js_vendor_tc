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

// https://tc39.es/ecma262/#sec-math.random requires distinct sequences for
// distinct realms. Compare whole sequences, since individual values can repeat.
(function () {
    function sampleRandom() {
        const values = [];
        for (let i = 0; i < 64; ++i) {
            values.push(Math.random());
        }
        return JSON.stringify(values);
    }

    const sequences = [];
    function checkSequence(serialized, label) {
        const values = JSON.parse(serialized);
        assert(values.length === 64);
        for (const value of values) {
            assert(typeof value === "number" && value >= 0 && value < 1);
        }
        if (sequences.indexOf(serialized) !== -1) {
            throw new Error(label + " repeated another realm's Math.random sequence");
        }
        sequences.push(serialized);
    }

    checkSequence(sampleRandom(), "Main realm");
    const source = "(" + sampleRandom.toString() + ")()";
    for (let i = 0; i < 4; ++i) {
        checkSequence($262.createRealm().evalScript(source), "Realm " + i);
    }

    // The shell omits agent support when Escargot is built without threading.
    if (typeof $262.agent === "undefined") {
        return;
    }

    // Starting several agents together exposes second-resolution seed reuse.
    // Each agent initializes a new engine thread and creates a separate realm.
    const agentCount = 8;
    const agentSource = `
        try {
            $262.agent.report(${source});
        } finally {
            $262.agent.leaving();
        }
    `;
    for (let i = 0; i < agentCount; ++i) {
        $262.agent.start(agentSource);
    }

    const reports = [];
    const deadline = Date.now() + 30000;
    while (reports.length < agentCount && Date.now() < deadline) {
        const report = $262.agent.getReport();
        if (report === null) {
            $262.agent.sleep(1);
        } else {
            reports.push(report);
        }
    }
    if (reports.length !== agentCount) {
        throw new Error("Timed out waiting for Math.random agent reports");
    }
    for (let i = 0; i < reports.length; ++i) {
        checkSequence(reports[i], "Agent " + i);
    }
})();
