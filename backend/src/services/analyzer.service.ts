import ai from "../config/ai.js";
import db from "../config/db.js";

export const analyzeSignals = async () => {
  const unprocessed = db.prepare(
    "SELECT * FROM signals WHERE processed = 0 LIMIT 10"
  ).all();

  if(unprocessed.length === 0){
    return { success: true, message: "No unprocessed signals", processed: 0 };
  }

  const updateSignal = db.prepare(
    "UPDATE signals SET processed=1, sentiment=?, score=? WHERE id=?"
  );

  for(const signal of unprocessed as any[]){
    const prompt = `
Analyze this AI related signal.

Title: ${signal.title}
Content: ${signal.content}

Return ONLY valid JSON.
Do not include markdown, text, or explanations.

Format exactly like this:

{
  "sentiment": 0.5,
  "score": 70
}
`;

    const completion = await ai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0
    });

    let result = { sentiment: 0, score: 0 };

    try {
      const raw = completion.choices[0].message.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.log("AI parse error:", completion.choices[0].message.content);
    }

    updateSignal.run(
      result.sentiment || 0,
      result.score || 0,
      signal.id
    );
  }

  return { success: true, processed: unprocessed.length };
};
