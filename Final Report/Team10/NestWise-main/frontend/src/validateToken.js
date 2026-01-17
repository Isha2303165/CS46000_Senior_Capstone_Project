export async function validateToken() {
    const token = localStorage.getItem("token");
    if (!token) return { valid: false };

    try {
        const res = await fetch("http://localhost:7001/userauth/validateToken", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) return { valid: false };

        return await res.json();
    } catch {
        return { valid: false };
    }
}
