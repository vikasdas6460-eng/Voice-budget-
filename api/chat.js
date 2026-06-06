export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  let prompt = "";
  try {
    const body = req.body || {};
    prompt = body.prompt || "";
  } catch (e) {
    prompt = "";
  }

  if (!prompt) {
    return res.status(400).json({ error: "No prompt received", text: "[]" });
  }

  try {
    const geminiKey = process.env.VITE_GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
  contents: [{ 
    parts: [{ 
      text: `Extract expenses from this text and return ONLY a JSON array, no other text, no markdown, no explanation. Just the raw JSON array.

Text: "${prompt}"

Return format:
[{"item":"item name","category":"Food & Drinks","amount":500,"type":"debit","paymentMethod":"Cash"}]

Categories must be one of: Food & Drinks, Transport, Shopping, Entertainment, Subscriptions, Credit, Others
Type is debit for expenses, credit for money received.` 
    }] 
  }] 
}),

      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    res.status(200).json({ text, debug: data });
  } catch (err) {
    res.status(500).json({ error: err.message, text: "[]" });
  }
}
