/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  FileCheck,
  Scale
} from "lucide-react";
import { FAQ_DATA } from "../utils";
import { FAQItem } from "../types";

export default function FaqGrid() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Extract unique categories
  const categories = ["Todos", ...Array.from(new Set(FAQ_DATA.map(item => item.category)))];

  // Filter FAQ items
  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cltArticle && item.cltArticle.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = selectedCategory === "Todos" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6" id="faq-wrapper">
      {/* Search and Category Filter Section */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-4" id="faq-search-bar">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquise por palavras-chave (ex: hora extra, rescisão, FGTS, grávida...)"
            className="block w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm transition"
            id="search-faq-input"
          />
        </div>

        {/* Categorias */}
        <div className="flex flex-wrap gap-2" id="faq-categories-list">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                selectedCategory === cat
                  ? "bg-teal-700 border-teal-700 text-white shadow-sm"
                  : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
              id={`cat-button-${cat.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de FAQ */}
      <div className="space-y-3" id="faq-accordion">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white border border-zinc-100 rounded-xl overflow-hidden transition-all duration-200 shadow-sm"
                id={`faq-item-${faq.id}`}
              >
                {/* Header da Pergunta */}
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none hover:bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg shrink-0">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-zinc-800 text-sm md:text-base leading-tight">
                      {faq.question}
                    </span>
                  </div>
                  <div className="shrink-0 text-zinc-400">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

                {/* Resposta Expansível */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-50 bg-zinc-50/30 overflow-hidden"
                    >
                      <div className="px-5 py-4 space-y-4">
                        {/* Conteúdo */}
                        <p className="text-zinc-600 text-sm leading-relaxed whitespace-pre-line">
                          {faq.answer}
                        </p>

                        {/* Tag Legislativa se aplicável */}
                        {faq.cltArticle && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg w-fit">
                            <Scale className="h-3.5 w-3.5 text-teal-700" />
                            <span>Referência Legal: {faq.cltArticle}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100" id="faq-empty-state">
            <BookOpen className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium text-sm">Nenhuma pergunta encontrada com o termo pesquisado.</p>
            <p className="text-zinc-400 text-xs mt-1">Tente pesquisar por palavras mais simples como "aviso", "extra", "noturno" ou "seguro".</p>
          </div>
        )}
      </div>

      {/* Cartão de Dica Geral de Defesa */}
      <div className="p-5 bg-gradient-to-br from-zinc-800 to-zinc-950 text-white rounded-2xl flex items-start gap-4 shadow-sm" id="faq-tip-card">
        <FileCheck className="h-8 w-8 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="font-semibold text-sm text-teal-300">Como provar meus direitos trabalhistas?</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            A CLT brasileira protege o trabalhador, porém, em caso de ações na Justiça do Trabalho, apresentar provas é fundamental. Guarde sempre cópias de holerites (recibos de salário), extratos de ponto diário, prints de conversas corporativas no WhatsApp, e-mails relevantes que demonstrem horas extras ou assédio, e mantenha contato com testemunhas que trabalharam junto com você.
          </p>
        </div>
      </div>
    </div>
  );
}
