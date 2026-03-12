// Test login endpoint
const resp = await fetch("http://localhost:4000/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@extractiq.com", 
    password: "ExtractIQ@Admin2026!"
  })
});
const data = await resp.json();
console.log("Status:", resp.status);
console.log("Response:", JSON.stringify(data, null, 2));
const cookies = resp.headers.getSetCookie?.() || [];  
console.log("Cookies:", cookies.length > 0 ? "SET" : "NONE");
process.exit(0);
