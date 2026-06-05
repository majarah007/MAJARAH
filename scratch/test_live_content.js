async function test() {
    try {
        const res = await fetch('https://majarah.vercel.app/api/content?key=brand');
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (err) {
        console.log("Error:", err);
    }
}
test();
