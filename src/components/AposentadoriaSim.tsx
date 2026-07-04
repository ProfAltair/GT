/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Compass, 
  User, 
  Calendar, 
  Hourglass, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Activity,
  ArrowRight,
  Clock
} from "lucide-react";
import { AposentadoriaInput, AposentadoriaOutput } from "../types";
import { simulateAposentadoria } from "../utils";

export default function AposentadoriaSim() {
  const [gender, setGender] = useState<AposentadoriaInput["gender"]>("F");
  const [age, setAge] = useState<number>(45);
  const [contributionYears, setContributionYears] = useState<number>(18);
  const [startedContributingYear, setStartedContributingYear] = useState<number>(2008);

  const [output, setOutput] = useState<AposentadoriaOutput | null>(null);

  useEffect(() => {
    // Basic sanity checks
    const currentYear = new Date().getFullYear();
    // Auto-update started contributing year based on current age and contribution years if appropriate
    // but we let the user adjust it
    const res = simulateAposentadoria({
      gender,
      age,
      contributionYears,
      startedContributingYear,
    });
    setOutput(res);
  }, [gender, age, contributionYears, startedContributingYear]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="aposentadoria-sim-wrapper">
      {/* Formulário de Configuração (lg:col-span-5) */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6" id="aposentadoria-form">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Planejamento de Aposentadoria</h2>
            <p className="text-xs text-zinc-500">Compare as regras da Reforma da Previdência</p>
          </div>
        </div>

        {/* Gênero */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Gênero Biológico</label>
          <div className="grid grid-cols-2 gap-3" id="gender-selection">
            <button
              type="button"
              onClick={() => setGender("F")}
              className={`py-2.5 px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition ${
                gender === "F"
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              <User className="h-4 w-4" />
              Feminino
            </button>
            <button
              type="button"
              onClick={() => setGender("M")}
              className={`py-2.5 px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition ${
                gender === "M"
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              <User className="h-4 w-4" />
              Masculino
            </button>
          </div>
        </div>

        {/* Idade Atual */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-700">Sua Idade Atual</label>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">{age} anos</span>
          </div>
          <input
            type="range"
            min="16"
            max="80"
            value={age}
            onChange={(e) => setAge(parseInt(e.target.value))}
            className="w-full accent-teal-700 h-1.5 bg-zinc-100 rounded-lg cursor-pointer"
            id="age-range"
          />
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>Mínimo laboral (16)</span>
            <span>Meia idade (48)</span>
            <span>Sênior (80)</span>
          </div>
        </div>

        {/* Anos de Contribuição */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-700">Anos de Contribuição (INSS)</label>
            <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">{contributionYears} anos</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={contributionYears}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setContributionYears(val);
              // Set starting contributing year estimated
              const currentYear = new Date().getFullYear();
              setStartedContributingYear(Math.min(currentYear, currentYear - val));
            }}
            className="w-full accent-teal-700 h-1.5 bg-zinc-100 rounded-lg cursor-pointer"
            id="contribution-range"
          />
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>Iniciante (0)</span>
            <span>Avançado (25)</span>
            <span>Máximo Simulado (50)</span>
          </div>
        </div>

        {/* Ano que começou a contribuir */}
        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <label className="text-sm font-medium text-zinc-700 flex items-center justify-between">
            <span>Ano de início das contribuições</span>
            <span className="text-xs font-mono text-zinc-400">(Necessário para calcular pedágio)</span>
          </label>
          <input
            type="number"
            min="1970"
            max={new Date().getFullYear()}
            value={startedContributingYear}
            onChange={(e) => setStartedContributingYear(Math.max(1970, Math.min(new Date().getFullYear(), parseInt(e.target.value) || 1970)))}
            className="block w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
            id="start-year-input"
          />
          <p className="text-[10px] text-zinc-400">
            A regra de pedágio compara o tempo que você tinha contribuído na data da Reforma da Previdência (13/11/2019).
          </p>
        </div>
      </div>

      {/* Resultados do Planejamento (lg:col-span-7) */}
      <div className="lg:col-span-7 space-y-6">
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            id="aposentadoria-results"
          >
            {/* Recomendação / Melhor Opção Card */}
            <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold uppercase tracking-wider">
                <Clock className="h-4 w-4" />
                Seu Melhor Caminho Estimado
              </div>
              <h3 className="text-xl font-bold text-teal-50">
                {output.bestOption}
              </h3>
              <p className="text-sm text-teal-100 leading-relaxed">
                {output.summaryMessage.replace(/\*\*(.*?)\*\*/g, "$1")}
              </p>
            </div>

            {/* Comparação detalhada das 3 Regras */}
            <div className="space-y-4" id="rules-cards">
              <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Status detalhado das regras principais</h4>

              {/* Regra 1: Idade Geral */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  output.idadeStatus.requirementsMet ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-400"
                }`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-2 w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-zinc-900 text-sm leading-none">{output.idadeStatus.ruleName}</h5>
                      <span className="text-[11px] text-zinc-400 block mt-1">{output.idadeStatus.details}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      output.idadeStatus.requirementsMet 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                        : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {output.idadeStatus.requirementsMet ? "Atingido" : "Pendente"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 font-medium bg-zinc-50 px-3 py-2 rounded-lg">
                    {output.idadeStatus.statusMessage}
                  </p>

                  {!output.idadeStatus.requirementsMet && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-medium text-zinc-400">
                        <span>Tempo Restante</span>
                        <span>Faltam {output.idadeStatus.yearsRemaining} anos</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-teal-700 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, (contributionYears / (gender === 'M' ? 20 : 15)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Regra 2: Transição por Pontos */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  output.pontosStatus.requirementsMet ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-400"
                }`}>
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="space-y-2 w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-zinc-900 text-sm leading-none">{output.pontosStatus.ruleName}</h5>
                      <span className="text-[11px] text-zinc-400 block mt-1">{output.pontosStatus.details}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      output.pontosStatus.requirementsMet 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                        : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {output.pontosStatus.requirementsMet ? "Atingido" : "Pendente"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 font-medium bg-zinc-50 px-3 py-2 rounded-lg">
                    {output.pontosStatus.statusMessage}
                  </p>

                  {!output.pontosStatus.requirementsMet && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-medium text-zinc-400">
                        <span>Sua Pontuação Atual: <strong>{age + contributionYears} pontos</strong></span>
                        <span>Faltam {output.pontosStatus.yearsRemaining} anos de serviço</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-teal-700 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, ((age + contributionYears) / (gender === 'M' ? 103 : 93)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Regra 3: Pedágio 100% */}
              <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                  output.pedagio100Status.requirementsMet ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-400"
                }`}>
                  <Hourglass className="h-6 w-6" />
                </div>
                <div className="space-y-2 w-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-zinc-900 text-sm leading-none">{output.pedagio100Status.ruleName}</h5>
                      <span className="text-[11px] text-zinc-400 block mt-1">{output.pedagio100Status.details}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      output.pedagio100Status.requirementsMet 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                        : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {output.pedagio100Status.requirementsMet ? "Atingido" : "Pendente"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 font-medium bg-zinc-50 px-3 py-2 rounded-lg">
                    {output.pedagio100Status.statusMessage}
                  </p>

                  {!output.pedagio100Status.requirementsMet && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-medium text-zinc-400">
                        <span>Anos de Trabalho</span>
                        <span>Faltam {output.pedagio100Status.yearsRemaining.toFixed(1)} anos</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-teal-700 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, (contributionYears / (gender === 'M' ? 35 : 30)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Aviso Importante INSS */}
            <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-3 text-xs text-zinc-500">
              <AlertCircle className="h-4.5 w-4.5 text-zinc-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-zinc-700">Importante:</p>
                <p className="leading-relaxed">
                  Esta simulação é estritamente informativa de acordo com a Emenda Constitucional nº 103/2019 (Reforma da Previdência). Fatores como tempos especiais de trabalho insalubre ou perigoso, períodos rurais, aposentadoria de professor, deficiência ou filiações públicas paralelas podem alterar severamente os tempos finais e as regras de direito adquirido. Acesse sempre o canal oficial <strong>"Meu INSS"</strong> para consultar seu CNIS (Cadastro Nacional de Informações Sociais) oficial consolidado.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
