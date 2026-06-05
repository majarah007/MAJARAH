const newUrl = "https://nojnqefgbpyibuhduxdx.supabase.co";
const newKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vam5xZWZnYnB5aWJ1aGR1eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDE4MTIsImV4cCI6MjA5NjE3NzgxMn0.lguSZ6IU4jQmJYKXMf0vD7Qy14j-8cjcUgDWgK8TyoM";

async function test() {
    try {
        const res = await fetch(`${newUrl}/rest/v1/settings?select=*`, {
            headers: {
                'apikey': newKey,
                'Authorization': `Bearer ${newKey}`
            }
        });
        console.log("Supabase direct status:", res.status);
        const text = await res.text();
        console.log("Supabase direct body length:", text.length);
    } catch (err) {
        console.log("Error:", err);
    }
}
test();
