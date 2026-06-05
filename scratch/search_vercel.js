const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = "C:\\Users\\yahia\\.gemini\\antigravity\\brain\\288a17b3-eb00-4979-baf1-2b6448f754fc\\.system_generated\\logs\\transcript.jsonl";

async function search() {
    if (!fs.existsSync(logPath)) {
        console.log("Log file does not exist.");
        return;
    }
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lineNum = 0;
    for await (const line of rl) {
        lineNum++;
        if (line.toLowerCase().includes("vercel.app")) {
            console.log(`Line ${lineNum}:`);
            // Print match without printing huge dump if the line is very long
            const idx = line.toLowerCase().indexOf("vercel.app");
            const start = Math.max(0, idx - 100);
            const end = Math.min(line.length, idx + 100);
            console.log("  ...", line.substring(start, end), "...");
        }
    }
}

search();
