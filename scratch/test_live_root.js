async function test() {
    try {
        const rootRes = await fetch('https://majarah.vercel.app/');
        console.log("Root Status:", rootRes.status);
        const rootText = await rootRes.text();
        console.log("Root starts with HTML:", rootText.trim().startsWith("<!DOCTYPE html>"));

        const fienRes = await fetch('https://majarah.vercel.app/fien/');
        console.log("Admin /fien/ Status:", fienRes.status);
        const fienText = await fienRes.text();
        console.log("Admin starts with HTML:", fienText.trim().startsWith("<!DOCTYPE html>"));
    } catch (err) {
        console.log("Error:", err);
    }
}
test();
