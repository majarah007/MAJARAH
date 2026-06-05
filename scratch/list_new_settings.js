const newUrl = "https://nojnqefgbpyibuhduxdx.supabase.co";
const newKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vam5xZWZnYnB5aWJ1aGR1eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDE4MTIsImV4cCI6MjA5NjE3NzgxMn0.lguSZ6IU4jQmJYKXMf0vD7Qy14j-8cjcUgDWgK8TyoM";

async function listSettings() {
    try {
        const res = await fetch(`${newUrl}/rest/v1/settings?select=*`, {
            headers: {
                'apikey': newKey,
                'Authorization': `Bearer ${newKey}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            console.log("NEW SETTINGS:", JSON.stringify(data, null, 2));
        } else {
            console.log("Failed to fetch settings:", res.status, await res.text());
        }
    } catch (err) {
        console.log("Error:", err);
    }
}

listSettings();
