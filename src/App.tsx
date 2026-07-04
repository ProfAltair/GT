/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scale, 
  Calculator, 
  Compass, 
  HelpCircle, 
  Bot, 
  Briefcase, 
  HeartHandshake,
  Menu,
  X,
  FileText,
  Calendar,
  Sparkles
} from "lucide-react";

import RescisaoCalc from "./components/RescisaoCalc";
import FeriasCalc from "./components/FeriasCalc";
import AposentadoriaSim from "./components/AposentadoriaSim";
import FaqGrid from "./components/FaqGrid";
import AssistenteChat from "./components/AssistenteChat";

export default function App() {
  const [activeTab, setActiveTab] = useState<"rescisao" | "ferias" | "aposentadoria" | "faq" | "chat">("rescisao");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const tabs = [
    { id: "rescisao", label: "Rescisão CLT", icon: Calculator },
    { id: "ferias", label: "Férias & Décimo", icon: Calendar },
    { id: "aposentadoria", label: "Aposentadoria", icon: Compass },
    { id: "faq", label: "Direitos Básicos", icon: HelpCircle },
    { id: "chat", label: "Assistente AI (Dr. CLT)", icon: Bot },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-800 flex flex-col font-sans" id="main-layout">
      
      {/* HEADER / BARRA DE NAVEGAÇÃO SUPERIOR */}
      <header className="bg-white border-b border-zinc-100 sticky top-0 z-50 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-teal-700 to-teal-900 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-extrabold tracking-tight text-zinc-900 leading-none">
                  GUIA DO TRABALHADOR
                </h1>
                <p className="text-[10px] text-teal-700 font-bold tracking-wider uppercase mt-1">
                  Cálculos e Direitos CLT
                </p>
              </div>
            </div>

            {/* Desktop Tabs Navigation */}
            <nav className="hidden lg:flex space-x-1" id="desktop-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      isActive 
                        ? "bg-teal-50 text-teal-800" 
                        : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
                    }`}
                    id={`nav-tab-${tab.id}`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-teal-700" : "text-zinc-400"}`} />
                    <span>{tab.label}</span>
                    {tab.id === "chat" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Hamburger Menu Toggle */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition"
                id="btn-mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-zinc-100"
              id="mobile-nav-dropdown"
            >
              <div className="px-4 py-3 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive 
                          ? "bg-teal-50 text-teal-800" 
                          : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                      id={`mobile-tab-${tab.id}`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-teal-700" : "text-zinc-400"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* PORTAL HERO BANNER */}
      <section className="bg-gradient-to-r from-teal-800 to-teal-950 text-white py-12 px-4 shadow-xs" id="app-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="h-4 w-4 text-teal-400 animate-spin-slow" />
              Portal do Trabalhador Brasileiro
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-tight text-teal-50">
              Simplifique seus direitos sob as leis da CLT
            </h2>
            <p className="text-sm md:text-base text-teal-100 max-w-xl leading-relaxed">
              Consulte e simule de forma independente valores de rescisão contratual, décimo terceiro, férias acumuladas, planejamento de tempo de aposentadoria e esclareça suas dúvidas na hora com nosso consultor inteligente.
            </p>
          </div>
          <div className="hidden md:flex md:col-span-4 justify-end">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-start gap-4 max-w-sm">
              <HeartHandshake className="h-10 w-10 text-teal-300 shrink-0" />
              <div>
                <h4 className="font-bold text-teal-50 text-sm">Cálculos Independentes</h4>
                <p className="text-xs text-teal-200 mt-1 leading-normal">
                  Todas as fórmulas seguem a legislação brasileira vigente, de forma confidencial e sem guardar seus dados pessoais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL (TABS) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" id="app-main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "rescisao" && <RescisaoCalc />}
            {activeTab === "ferias" && <FeriasCalc />}
            {activeTab === "aposentadoria" && <AposentadoriaSim />}
            {activeTab === "faq" && <FaqGrid />}
            {activeTab === "chat" && <AssistenteChat />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-zinc-100 py-8 shrink-0 mt-12" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <Scale className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">GUIA DO TRABALHADOR</span>
          </div>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-normal">
            Este aplicativo é uma ferramenta didática e de simulação privada que utiliza as fórmulas de referência da Consolidação das Leis do Trabalho (CLT). Ele não emite pareceres jurídicos oficiais e não substitui de forma alguma o aconselhamento formal de advogados, órgãos do Ministério do Trabalho ou do INSS.
          </p>
          <div className="text-[10px] text-zinc-400 font-mono">
            © 2026 Guia do Trabalhador • Desenvolvido com foco no amparo e educação trabalhista
          </div>
        </div>
      </footer>

    </div>
  );
}
