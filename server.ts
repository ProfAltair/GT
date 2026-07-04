import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } else {
    console.warn("⚠️ GEMINI_API_KEY is not defined. The AI Worker Assistant will not function correctly.");
  }

  // API Route for AI Assistant
  app.post("/api/assistente", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Mensagem é obrigatória" });
      }

      if (!ai) {
        return res.status(500).json({
          error: "O Assistente de IA não está configurado. Por favor, configure a chave GEMINI_API_KEY no menu de segredos.",
        });
      }

      const systemInstruction = `Você é o 'Doutor CLT', um assistente virtual especialista e altamente qualificado em direito do trabalho brasileiro (CLT). Seu objetivo é ajudar o trabalhador a entender seus direitos e deveres de forma clara, didática, profissional, acolhedora e humana.
Regras de Comportamento:
1. Use uma linguagem acessível, amigável, objetiva e profissional em português brasileiro. Evite 'juridiquês' excessivo, mas explique as leis de forma correta e precisa.
2. Destaque os artigos específicos da CLT relevantes para a dúvida do usuário (ex: Art. 477, Art. 134, Art. 59, etc.).
3. Estruture as respostas com tópicos claros, negritos, subtítulos e listas usando Markdown para facilitar a leitura.
4. Adicione sempre ao final um aviso (disclaimer) amigável de que a resposta é de caráter meramente educativo e informativo, não substituindo a assessoria jurídica formal de um advogado trabalhista, sindicato ou órgão oficial.`;

      // Convert client history to Gemini format (user -> user, assistant -> model)
      const formattedHistory = history ? history.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })) : [];

      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: formattedHistory,
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Erro na API do assistente CLT:", error);
      res.status(500).json({ error: error.message || "Ocorreu um erro ao processar sua pergunta de direitos trabalhistas." });
    }
  });

  // Serve static files in production / Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Guia do Trabalhador Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
});
