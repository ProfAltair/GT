/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  AlertTriangle, 
  Scale, 
  Sparkles,
  RefreshCw,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../types";

export default function AssistenteChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Olá! Eu sou o **Doutor CLT**, seu assistente virtual especializado em direitos trabalhistas sob as leis da CLT no Brasil.

Você pode me perguntar sobre cálculos de rescisão, verbas de férias, décimo terceiro, horas extras, adicionais de insalubridade, licenças e qualquer outro assunto corporativo.

**Como posso ajudar você hoje?** *(Escolha um tema abaixo ou digite sua pergunta)*`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const quickPrompts = [
    "Fui demitido hoje sem justa causa. O que eu recebo?",
    "Meu patrão pode descontar minhas faltas justificadas?",
    "O que é Adicional de Periculosidade e quem tem direito?",
    "Pedi demissão hoje. Preciso trabalhar o aviso prévio?",
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput(""); // Clear typing input if sent from input field
    setIsLoading(true);
    setApiError("");

    try {
      const response = await fetch("/api/assistente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          // Limit history depth to last 10 messages to save prompt tokens
          history: messages.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao consultar o servidor.");
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.text,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || "Não foi possível conectar com o Doutor CLT.");
      
      // Also inject a system message explaining the failure nicely
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Ocorreu um erro de comunicação:**
          
Não consegui responder no momento. Se você está desenvolvendo ou testando localmente, certifique-se de que a chave \`GEMINI_API_KEY\` foi configurada nos segredos ou arquivo \`.env\`.`,
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Olá novamente! Estou pronto para ajudar você com suas dúvidas trabalhistas. Do que precisamos hoje?",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setApiError("");
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden" id="assistente-chat-wrapper">
      {/* Cabeçalho do Chat */}
      <div className="bg-zinc-50 border-b border-zinc-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-teal-800 text-teal-50 rounded-xl">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-zinc-900 text-sm md:text-base">Doutor CLT</h3>
              <span className="bg-teal-100 text-teal-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">Consultor AI</span>
            </div>
            <p className="text-[10px] text-zinc-500">Tire dúvidas personalizadas sobre a lei do trabalho brasileiro</p>
          </div>
        </div>

        <button
          onClick={clearChat}
          title="Reiniciar Conversa"
          className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
          id="btn-clear-chat"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Corpo com as Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/45 scrollbar-thin scrollbar-thumb-zinc-200" id="chat-messages-container">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === "assistant";
          return (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              id={`chat-msg-${index}`}
            >
              {/* Avatar */}
              <div className={`p-2 h-9 w-9 rounded-xl shrink-0 flex items-center justify-center ${
                isAssistant ? "bg-teal-800 text-white" : "bg-teal-100 text-teal-800"
              }`}>
                {isAssistant ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
              </div>

              {/* Balão de Mensagem */}
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl shadow-sm border ${
                  isAssistant 
                    ? "bg-white border-zinc-100 text-zinc-800" 
                    : "bg-teal-800 border-teal-800 text-teal-50"
                }`}>
                  <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-teal markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                <span className={`text-[9px] text-zinc-400 block px-1 ${isAssistant ? "text-left" : "text-right"}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto" id="chat-loading-bubble">
            <div className="p-2 h-9 w-9 rounded-xl bg-teal-800 text-white shrink-0 flex items-center justify-center">
              <Bot className="h-4.5 w-4.5 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="p-4 rounded-2xl shadow-sm border bg-white border-zinc-100 flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-teal-700 animate-spin" />
                <span className="text-xs font-medium text-zinc-400">Doutor CLT está analisando a lei...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert inside chat if any */}
        {apiError && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs flex items-start gap-2 max-w-[80%] mx-auto" id="chat-error-alert">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erro de Conexão</p>
              <p className="text-rose-600 mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Caixa de Input e Rodapé */}
      <div className="p-4 bg-white border-t border-zinc-100 shrink-0 space-y-3">
        {/* Prompts Rápidos (Mostrado apenas se a conversa estiver no começo) */}
        {messages.length === 1 && (
          <div className="space-y-2" id="chat-quick-prompts">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-teal-600" />
              Perguntas frequentes rápidas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="text-left px-3.5 py-2.5 bg-zinc-50 hover:bg-teal-50 hover:text-teal-950 hover:border-teal-200 text-xs text-zinc-600 font-medium rounded-xl border border-zinc-100 transition truncate-none"
                  id={`quick-prompt-${idx}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Campo de Escrita */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            placeholder={isLoading ? "Aguarde a resposta..." : "Pergunte algo, ex: 'Tenho direito ao FGTS pedindo demissão?'"}
            className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent text-sm font-medium transition disabled:opacity-60"
            id="chat-text-input"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-semibold shadow-sm transition disabled:opacity-50 disabled:hover:bg-teal-800"
            id="btn-send-message"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Disclaimer final do chat */}
        <p className="text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1">
          <Scale className="h-3 w-3" />
          <span>Informações com propósito puramente didático. Não substitui consulta jurídica.</span>
        </p>
      </div>
    </div>
  );
}
