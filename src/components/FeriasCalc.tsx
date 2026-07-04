/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  DollarSign,
  Info,
  Layers,
  Percent,
  TrendingUp,
  Briefcase,
  AlertCircle,
  PiggyBank,
  ArrowRight,
  Sparkles,
  Award
} from "lucide-react";
import { FeriasInput, FeriasOutput, ThirteenthInput, ThirteenthOutput, FGTSInput, FGTSOutput } from "../types";
import { calculateFerias, calculateThirteenth, calculateFGTS } from "../utils";

export default function FeriasCalc() {
  const [subTab, setSubTab] = useState<"ferias" | "13º" | "fgts">("ferias");

  // State for Vacation (Férias)
  const [vSalary, setVSalary] = useState<number>(2500);
  const [vDays, setVDays] = useState<number>(30);
  const [vAbono, setVAbono] = useState<boolean>(false);
  const [vAdvance13, setVAdvance13] = useState<boolean>(false);
  const [vDependents, setVDependents] = useState<number>(0);
  const [vResult, setVResult] = useState<FeriasOutput | null>(null);

  // State for 13th Salary
  const [tSalary, setTSalary] = useState<number>(2500);
  const [tMonths, setTMonths] = useState<number>(12);
  const [tDependents, setTDependents] = useState<number>(0);
  const [tResult, setTResult] = useState<ThirteenthOutput | null>(null);

  // State for FGTS
  const [fSalary, setFSalary] = useState<number>(2500);
  const [fMonths, setFMonths] = useState<number>(24); // Default 2 years
  const [fResult, setFResult] = useState<FGTSOutput | null>(null);

  // Re-calculate Vacation when dependencies change
  useEffect(() => {
    try {
      const res = calculateFerias({
        salary: vSalary,
        daysToTake: vDays,
        abonoPecuniario: vAbono,
        adiantamento13: vAdvance13,
        dependentes: vDependents,
      });
      setVResult(res);
    } catch (e) {
      console.error(e);
    }
  }, [vSalary, vDays, vAbono, vAdvance13, vDependents]);

  // Re-calculate 13th Salary
  useEffect(() => {
    try {
      const res = calculateThirteenth({
        salary: tSalary,
        monthsWorked: tMonths,
        dependentes: tDependents,
      });
      setTResult(res);
    } catch (e) {
      console.error(e);
    }
  }, [tSalary, tMonths, tDependents]);

  // Re-calculate FGTS
  useEffect(() => {
    try {
      const res = calculateFGTS({
        salary: fSalary,
        monthsWorked: fMonths,
      });
      setFResult(res);
    } catch (e) {
      console.error(e);
    }
  }, [fSalary, fMonths]);

  return (
    <div className="space-y-6" id="ferias-calc-wrapper">
      {/* Sub-Tabs de navegação */}
      <div className="flex border-b border-zinc-100 pb-px" id="ferias-tabs-bar">
        {(["ferias", "13º", "fgts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition -mb-px capitalize flex items-center gap-2 ${
              subTab === tab
                ? "border-teal-700 text-teal-700 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-600 hover:border-zinc-200"
            }`}
            id={`subtab-${tab}`}
          >
            {tab === "ferias" && <Calendar className="h-4 w-4" />}
            {tab === "13º" && <TrendingUp className="h-4 w-4" />}
            {tab === "fgts" && <PiggyBank className="h-4 w-4" />}
            {tab === "ferias" ? "Férias CLT" : tab === "13º" ? "13º Salário" : "FGTS Acumulado"}
          </button>
        ))}
      </div>

      {/* RENDER VACATION CALCULATOR */}
      {subTab === "ferias" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ferias-calc-grid">
          {/* Formulário de Férias (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
                <Calendar className="h-4.5 w-4.5 text-teal-700" />
                Cálculo de Férias CLT
              </h3>
              <p className="text-xs text-zinc-400">Gozar período de descanso regulamentar</p>
            </div>

            {/* Salário Bruto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Salário Bruto de Referência (R$)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 text-sm font-medium">
                  R$
                </div>
                <input
                  type="number"
                  value={vSalary === 0 ? "" : vSalary}
                  onChange={(e) => setVSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="block w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
                  placeholder="0,00"
                  id="vsalary-input"
                />
              </div>
            </div>

            {/* Dias de Férias */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex justify-between items-center">
                <span>Dias de Férias a Gozar</span>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{vDays} dias</span>
              </label>
              <input
                type="range"
                min="10"
                max="30"
                step="1"
                value={vDays}
                onChange={(e) => {
                  const d = parseInt(e.target.value);
                  setVDays(d);
                  if (d > 20) {
                    // Maximum of 10 days "vender", meaning if vacation is 30, we can sell 10.
                    // But standard formula says abono is max 1/3 of the period (e.g. 10 days for 30).
                  }
                }}
                className="w-full accent-teal-700 h-1.5 bg-zinc-100 rounded-lg cursor-pointer"
                id="vdays-slider"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 px-1">
                <span>Mínimo CLT (10)</span>
                <span>Fração (20)</span>
                <span>Máximo CLT (30)</span>
              </div>
            </div>

            {/* Dependentes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Número de Dependentes</label>
              <input
                type="number"
                min="0"
                max="15"
                value={vDependents}
                onChange={(e) => setVDependents(Math.max(0, parseInt(e.target.value) || 0))}
                className="block w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
                id="vdependents-input"
              />
              <p className="text-[10px] text-zinc-400">Cada dependente concede dedução de R$ 189,59 na base tributável do Imposto de Renda.</p>
            </div>

            {/* Toggles adicionais */}
            <div className="space-y-4 pt-3 border-t border-zinc-100">
              {/* Abono Pecuniário */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 max-w-[80%]">
                  <label className="text-sm font-medium text-zinc-800 flex items-center gap-1.5">
                    <span>Abono Pecuniário ("Vender Férias")</span>
                  </label>
                  <p className="text-xs text-zinc-400">Converter 10 dias do direito em pagamento em dinheiro. Isento de imposto!</p>
                </div>
                <button
                  onClick={() => {
                    setVAbono(!vAbono);
                    if (!vAbono) {
                      // Adjust vacation days to maximum of 20 if selling 10.
                      setVDays(20);
                    } else {
                      setVDays(30);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    vAbono ? "bg-teal-600" : "bg-zinc-200"
                  }`}
                  id="vabono-toggle"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      vAbono ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Adiantamento 13º */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 max-w-[80%]">
                  <label className="text-sm font-medium text-zinc-800">Adiantar 1ª Parcela do 13º?</label>
                  <p className="text-xs text-zinc-400">Receber metade do seu 13º antecipado junto com o valor das férias.</p>
                </div>
                <button
                  onClick={() => setVAdvance13(!vAdvance13)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    vAdvance13 ? "bg-teal-600" : "bg-zinc-200"
                  }`}
                  id="vadvance-toggle"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      vAdvance13 ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Resultado Férias (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {vResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
                id="vresult-panel"
              >
                {/* Total Líquido a Receber */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white p-6 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-teal-200">Total Líquido das Férias</span>
                      <h4 className="text-3xl font-bold text-teal-50 tracking-tight mt-1">
                        R$ {vResult.netTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h4>
                    </div>
                    <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-teal-200 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" />
                      Remuneração de Férias
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-teal-700/60 text-xs">
                    <div>
                      <p className="text-teal-300">Total Bruto de Recebimentos:</p>
                      <p className="font-semibold text-sm text-teal-50 mt-0.5">
                        R$ {vResult.grossTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-teal-300">Descontos de Impostos (INSS/IRRF):</p>
                      <p className="font-semibold text-sm text-teal-50 mt-0.5">
                        R$ {vResult.discountTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalhes do Holerite de Férias */}
                <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between text-sm font-semibold text-zinc-900">
                    <span>Recibo de Pagamento de Férias</span>
                    <span className="text-xs font-mono text-zinc-400">Isenções de Imposto Inclusas</span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {vResult.items.map((item, index) => (
                      <div key={index} className="px-5 py-3 flex justify-between items-start text-sm hover:bg-zinc-50/30 transition-colors">
                        <div className="max-w-[70%]">
                          <p className="font-medium text-zinc-800">{item.name}</p>
                          <p className="text-xs text-zinc-400 leading-normal">{item.description}</p>
                        </div>
                        <span className={`font-mono font-semibold shrink-0 ${item.type === "receita" ? "text-emerald-600" : "text-rose-600"}`}>
                          {item.type === "receita" ? "+ " : "- "}
                          R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}

                    <div className="px-5 py-4 bg-zinc-50 flex justify-between items-center text-sm font-bold text-zinc-900">
                      <span>VALOR LÍQUIDO A SER DEPOSITADO</span>
                      <span className="font-mono text-teal-800 text-lg">
                        R$ {vResult.netTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prazo de Pagamento Alert */}
                <div className="p-4 bg-amber-50 border border-amber-100 text-xs text-amber-800 rounded-xl space-y-1" id="vpayment-deadline">
                  <p className="font-semibold flex items-center gap-1 text-amber-950">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    Prazo Legal de Pagamento (Art. 145 CLT)
                  </p>
                  <p>
                    O empregador é obrigado a depositar o valor das férias para o funcionário em até <strong>2 dias úteis antes do início</strong> do gozo. O descumprimento deste prazo obriga o patrão a pagar o valor das férias em dobro!
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* RENDER 13º SALÁRIO CALCULATOR */}
      {subTab === "13º" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="thirteenth-calc-grid">
          {/* Formulário 13º (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-teal-700" />
                Cálculo de Gratificação Natalina (13º)
              </h3>
              <p className="text-xs text-zinc-400">Gratificação compulsória proporcional aos meses do ano trabalhado</p>
            </div>

            {/* Salário Bruto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Salário Contratual Bruto (R$)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 text-sm font-medium">
                  R$
                </div>
                <input
                  type="number"
                  value={tSalary === 0 ? "" : tSalary}
                  onChange={(e) => setTSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="block w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
                  placeholder="0,00"
                  id="tsalary-input"
                />
              </div>
            </div>

            {/* Meses Trabalhados */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex justify-between items-center">
                <span>Meses Trabalhados no Ano</span>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{tMonths} meses</span>
              </label>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={tMonths}
                onChange={(e) => setTMonths(parseInt(e.target.value))}
                className="w-full accent-teal-700 h-1.5 bg-zinc-100 rounded-lg cursor-pointer"
                id="tmonths-slider"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 px-1">
                <span>Fração inicial (1)</span>
                <span>Meio ano (6)</span>
                <span>Ano Completo (12)</span>
              </div>
            </div>

            {/* Dependentes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Número de Dependentes</label>
              <input
                type="number"
                min="0"
                max="15"
                value={tDependents}
                onChange={(e) => setTDependents(Math.max(0, parseInt(e.target.value) || 0))}
                className="block w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
                id="tdependents-input"
              />
              <p className="text-[10px] text-zinc-400">Sua previdência particular ou dependentes legais abatem no cálculo do imposto na 2ª parcela.</p>
            </div>
          </div>

          {/* Resultados 13º (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {tResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
                id="tresult-panel"
              >
                {/* Distribuição das Duas Parcelas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primeira Parcela Card */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full">
                      1ª Parcela (Adiantamento)
                    </span>
                    <h4 className="text-2xl font-bold text-zinc-900 font-mono">
                      R$ {tResult.firstInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Paga entre <strong>1º de fevereiro e 30 de novembro</strong> de cada ano. É equivalente a 50% do bruto integral, sem descontos de tributação!
                    </p>
                  </div>

                  {/* Segunda Parcela Card */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                    <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 text-xs font-semibold rounded-full">
                      2ª Parcela (Deduções Aplicadas)
                    </span>
                    <h4 className="text-2xl font-bold text-zinc-900 font-mono">
                      R$ {tResult.secondInstallmentNet.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Paga até <strong>20 de dezembro</strong>. Concentra todas as deduções de impostos (INSS e IRRF) calculados sobre o 13º integral bruto.
                    </p>
                  </div>
                </div>

                {/* Detalhes de Proventos do 13º */}
                <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between text-sm font-semibold text-zinc-900">
                    <span>Memória de Cálculo do 13º</span>
                    <span className="text-xs text-zinc-400">Total Líquido Consolidado</span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    <div className="px-5 py-3.5 flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-zinc-800">13º Salário Bruto Integrado ({tMonths}/12)</p>
                        <p className="text-xs text-zinc-400">Sua remuneração de direito total regulamentar.</p>
                      </div>
                      <span className="font-mono font-semibold text-emerald-600">
                        + R$ {tResult.grossTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="px-5 py-3.5 flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-zinc-800">Desconto de INSS</p>
                        <p className="text-xs text-zinc-400">Previdência calculada de forma progressiva sobre o total bruto.</p>
                      </div>
                      <span className="font-mono font-semibold text-rose-600">
                        - R$ {tResult.inssDeduction.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="px-5 py-3.5 flex justify-between items-start text-sm">
                      <div>
                        <p className="font-medium text-zinc-800">Desconto de IRRF</p>
                        <p className="text-xs text-zinc-400">Imposto de Renda retido sobre o total bruto (deduzidos INSS e dependentes).</p>
                      </div>
                      <span className="font-mono font-semibold text-rose-600">
                        - R$ {tResult.irrfDeduction.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Consolidado */}
                    <div className="px-5 py-4 bg-teal-50/50 flex justify-between items-center text-sm font-bold text-teal-950">
                      <span>LÍQUIDO TOTAL ACUMULADO (Soma das 2 parcelas)</span>
                      <span className="font-mono text-teal-800 text-lg">
                        R$ {tResult.netTotalCombined.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dica do Especialista */}
                <div className="p-5 bg-teal-50 border border-teal-100 rounded-2xl flex items-start gap-3 text-xs text-teal-800">
                  <Sparkles className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-teal-950">Você sabia?</p>
                    <p className="leading-relaxed">
                      Trabalhadores podem solicitar o recebimento da primeira parcela do 13º salário <strong>antecipado por ocasião de suas férias</strong>. O pedido deve ser formalizado por escrito ao departamento de recursos humanos do empregador até o mês de janeiro do respectivo ano.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* RENDER FGTS ACCUMULATED CALCULATOR */}
      {subTab === "fgts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="fgts-calc-grid">
          {/* Formulário FGTS (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-1.5">
                <PiggyBank className="h-4.5 w-4.5 text-teal-700" />
                Estimativa de Depósitos do FGTS
              </h3>
              <p className="text-xs text-zinc-400">Cálculo de acúmulo de poupança forçada garantida</p>
            </div>

            {/* Salário Bruto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Seu Salário Mensal Bruto (R$)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 text-sm font-medium">
                  R$
                </div>
                <input
                  type="number"
                  value={fSalary === 0 ? "" : fSalary}
                  onChange={(e) => setFSalary(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="block w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
                  placeholder="0,00"
                  id="fsalary-input"
                />
              </div>
            </div>

            {/* Meses de Depósito */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 flex justify-between items-center">
                <span>Tempo Trabalhado (Meses)</span>
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{fMonths} meses ({Math.floor(fMonths/12)} anos e {fMonths % 12} meses)</span>
              </label>
              <input
                type="range"
                min="1"
                max="120" // 10 anos
                step="1"
                value={fMonths}
                onChange={(e) => setFMonths(parseInt(e.target.value))}
                className="w-full accent-teal-700 h-1.5 bg-zinc-100 rounded-lg cursor-pointer"
                id="fmonths-slider"
              />
              <div className="flex justify-between text-[10px] text-zinc-400 px-1">
                <span>Início (1m)</span>
                <span>5 anos (60m)</span>
                <span>10 anos (120m)</span>
              </div>
            </div>
          </div>

          {/* Resultados FGTS (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {fResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
                id="fresult-panel"
              >
                {/* Total Acumulado Card */}
                <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-wider text-teal-200">Saldo Total Estimado FGTS</span>
                    <h4 className="text-3xl font-bold tracking-tight text-teal-50">
                      R$ {fResult.totalAccumulated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </h4>
                    <p className="text-[11px] text-teal-200">
                      Já inclui juros estimados de cerca de 3% ao ano + TR (Poupança CEF).
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-teal-700/60 pt-4 md:pt-0 md:pl-6 space-y-2 text-xs">
                    <div>
                      <span className="text-teal-300">Depósito Mensal (8%):</span>
                      <p className="text-lg font-bold text-teal-100 font-mono mt-0.5">
                        R$ {fResult.monthlyDeposit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /mês
                      </p>
                    </div>
                    <div>
                      <span className="text-teal-300">Total Nominal Depositado:</span>
                      <p className="text-sm font-semibold text-teal-100">
                        R$ {fResult.totalDeposited.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multas de Demissão FGTS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-2.5">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Multa Demissão sem Justa Causa (40%)
                    </h5>
                    <p className="text-2xl font-bold text-zinc-900 font-mono">
                      R$ {fResult.multaSemJustaCausa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Pago pelo empregador em sua rescisão, somado ao saque integral do saldo.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-2.5">
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Multa por Acordo Comum (20%)
                    </h5>
                    <p className="text-2xl font-bold text-zinc-900 font-mono">
                      R$ {fResult.multaAcordoComum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Pago pelo empregador na modalidade de desligamento por acordo consensual.
                    </p>
                  </div>
                </div>

                {/* Dica sobre Saque Aniversário */}
                <div className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                    <Info className="h-4.5 w-4.5 text-teal-700" />
                    Como Sacar o seu FGTS?
                  </h4>
                  <ul className="text-xs text-zinc-600 space-y-2 list-decimal pl-4 leading-relaxed">
                    <li><strong>Saque-Rescisão (Padrão):</strong> Dá direito a sacar a totalidade da conta do FGTS na demissão sem justa causa.</li>
                    <li><strong>Saque-Aniversário:</strong> Permite retirar uma parcela anual no mês do seu aniversário. No entanto, se for demitido, você perderá o direito de sacar o saldo total do fundo, recebendo APENAS a multa rescisória de 40%!</li>
                    <li><strong>Financiamento Imobiliário:</strong> O saldo pode ser integralmente usado como entrada ou abatimento de parcelas de sua casa própria.</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
