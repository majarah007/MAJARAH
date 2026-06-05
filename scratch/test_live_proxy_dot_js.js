async function test() {
    try {
        const res = await fetch('https://majarah.vercel.app/api/proxy.js?table=settings');
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Body:", text);
    } catch (err) {
        console.log("Error:", err);
    }
}
test();
