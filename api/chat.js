export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  let prompt = "";
try {
  let raw = "";
  await new Promise((resolve) => {
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", resolve);
  });
  prompt = JSON.parse(raw)?.prompt || "";
} catch { prompt = ""; }


  if (!prompt) return res.status(200).json({ text: "[]", debug: { body: req.body, type: typeof req.body } });


  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ text: "[]", error: err.message });
  }
}
