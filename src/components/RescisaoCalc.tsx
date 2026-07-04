/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  Info, 
  Plus, 
  Minus, 
  HelpCircle, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Receipt
} from "lucide-react";
import { RescisaoInput, RescisaoOutput } from "../types";
import { calculateRescisao, getDiffInMonthsAndDays } from "../utils";

export default function RescisaoCalc() {
  const [salary, setSalary] = useState<number>(2500);
  const [admissionDate, setAdmissionDate] = useState<string>("2024-01-10");
  const [terminationDate, setTerminationDate] = useState<string>("2026-06-29");
  const [terminationType, setTerminationType] = useState<RescisaoInput["terminationType"]>("sem_justa_causa");
  const [noticeType, setNoticeType] = useState<RescisaoInput["noticeType"]>("indenizado");
  const [hasVencidasVacation, setHasVencidasVacation] = useState<boolean>(false);
  const [pendingVacationDays, setPendingVacationDays] = useState<number>(0);

  const [output, setOutput] = useState<RescisaoOutput | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    // Validate dates
    if (!admissionDate || !terminationDate) {
      setErrorMsg("Selecione ambas as datas.");
      setOutput(null);
      return;
    }

    const adm = new Date(admissionDate);
    const term = new Date(terminationDate);

    if (term < adm) {
      setErrorMsg("A data de desligamento não pode ser anterior à data de admissão.");
      setOutput(null);
      return;
    }

    setErrorMsg("");
    try {
      const result = calculateRescisao({
        salary,
        admissionDate,
        terminationDate,
        terminationType,
        noticeType,
        pendingVacationDays,
        hasVencidasVacation,
      });
      setOutput(result);
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro ao calcular os valores rescisórios.");
    }
  }, [salary, admissionDate, terminationDate, terminationType, noticeType, pendingVacationDays, hasVencidasVacation]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="rescisao-calc-container">
      {/* Formulário de Entrada (lg:col-span-5) */}
      <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm" id="rescisao-form">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Simulação de Rescisão</h2>
            <p className="text-xs text-zinc-500">Insira as informações contratuais para obter o cálculo</p>
          </div>
        </div>

        {/* Salário Bruto */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 flex items-center justify-between">
            <span>Salário Contratual Bruto (R$)</span>
            <span className="text-xs font-mono text-zinc-400">Mensal</span>
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 font-medium text-sm">
              R$
            </div>
            <input
              type="number"
              value={salary === 0 ? "" : salary}
              onChange={(e) => setSalary(Math.max(0, parseFloat(e.target.value) || 0))}
              className="block w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
              placeholder="0,00"
              id="input-rescisao-salary"
            />
          </div>
        </div>

        {/* Datas de Admissão e Desligamento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span>Admissão</span>
            </label>
            <input
              type="date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              className="block w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
              id="input-rescisao-admission"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <span>Desligamento</span>
            </label>
            <input
              type="date"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              className="block w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
              id="input-rescisao-termination"
            />
          </div>
        </div>

        {/* Tipo de Rescisão */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700">Motivo do Desligamento</label>
          <select
            value={terminationType}
            onChange={(e) => {
              const val = e.target.value as RescisaoInput["terminationType"];
              setTerminationType(val);
              // Set reasonable default notice types based on termination type
              if (val === "com_justa_causa") {
                setNoticeType("dispensado");
              } else if (val === "pedido_demissao") {
                setNoticeType("trabalhado");
              } else {
                setNoticeType("indenizado");
              }
            }}
            className="block w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
            id="input-rescisao-type"
          >
            <option value="sem_justa_causa">Demissão sem justa causa (pelo Empregador)</option>
            <option value="pedido_demissao">Pedido de Demissão (pelo Empregado)</option>
            <option value="com_justa_causa">Demissão por justa causa (pelo Empregador)</option>
            <option value="acordo_comum">Rescisão por Acordo Comum (Reforma Trabalhista)</option>
          </select>
        </div>

        {/* Tipo de Aviso Prévio */}
        {terminationType !== "com_justa_causa" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Aviso Prévio</label>
            <select
              value={noticeType}
              onChange={(e) => setNoticeType(e.target.value as RescisaoInput["noticeType"])}
              className="block w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium transition"
              id="input-rescisao-notice"
            >
              {terminationType === "pedido_demissao" ? (
                <>
                  <option value="trabalhado">Trabalhado (Aviso cumprido pelo empregado)</option>
                  <option value="indenizado">Indenizado / Descontado (Não cumprido, desconta 30 dias)</option>
                  <option value="dispensado">Dispensado pelo Empregador (Não trabalhado, sem descontar)</option>
                </>
              ) : (
                <>
                  <option value="indenizado">Indenizado (Pai pelo empregador sem trabalhar)</option>
                  <option value="trabalhado">Trabalhado (Trabalha e recebe o período)</option>
                  <option value="dispensado">Dispensado / Não cumprido pelo empregador</option>
                </>
              )}
            </select>
            <p className="text-xs text-zinc-400 italic">
              {noticeType === "indenizado" && terminationType === "pedido_demissao" && (
                "Atenção: Se você pedir demissão e não cumprir o aviso, a empresa tem o direito de descontar o valor de um salário integral das suas verbas."
              )}
              {noticeType === "indenizado" && terminationType === "sem_justa_causa" && (
                "O aviso proporcional estendido da Lei 12.506/11 (3 dias extras por ano trabalhado) será acrescido ao cálculo."
              )}
            </p>
          </div>
        )}

        {/* Férias Vencidas */}
        <div className="pt-2 border-t border-zinc-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium text-zinc-800">Férias Vencidas Completas?</label>
              <p className="text-xs text-zinc-400">Tem algum período de 12 meses de férias já completado e ainda NÃO tirado?</p>
            </div>
            <button
              onClick={() => setHasVencidasVacation(!hasVencidasVacation)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hasVencidasVacation ? "bg-teal-600" : "bg-zinc-200"
              }`}
              id="toggle-rescisao-vencidas"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  hasVencidasVacation ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Resultados e Detalhamento (lg:col-span-7) */}
      <div className="lg:col-span-7 space-y-6">
        {errorMsg ? (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex items-center gap-3" id="rescisao-error">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : output ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
            id="rescisao-result-panel"
          >
            {/* Resumo Card com Total Líquido */}
            <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white p-6 rounded-2xl shadow-md space-y-4 relative overflow-hidden">
              {/* Elementos decorativos */}
              <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10">
                <Receipt className="h-48 w-48" />
              </div>
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold">Total Rescisório Líquido</span>
                  <h3 className="text-3xl font-bold tracking-tight mt-1 text-teal-50">
                    R$ {output.netTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
                <div className="px-3 py-1 bg-teal-700/50 backdrop-blur-sm border border-teal-500/30 rounded-full text-xs text-teal-200 font-medium">
                  {terminationType === "sem_justa_causa" ? "Sem Justa Causa" : 
                   terminationType === "pedido_demissao" ? "Pedido de Demissão" :
                   terminationType === "com_justa_causa" ? "Com Justa Causa" : "Acordo Comum"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-teal-700/60 text-xs text-teal-100">
                <div>
                  <p className="text-teal-300">Total de Receitas (Bruto)</p>
                  <p className="text-base font-semibold text-teal-50 mt-0.5">
                    R$ {output.grossTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-teal-300">Total de Descontos</p>
                  <p className="text-base font-semibold text-teal-50 mt-0.5">
                    R$ {output.discountTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Alerta de FGTS e Saque */}
            {(terminationType === "sem_justa_causa" || terminationType === "acordo_comum") && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1.5 text-xs text-emerald-800" id="rescisao-fgts-info">
                <h4 className="font-semibold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  FGTS Disponível para Saque
                </h4>
                <p>
                  Você terá direito a sacar o saldo acumulado de seu FGTS diretamente na Caixa Econômica, acrescido da Multa Rescisória de{" "}
                  <strong>R$ {output.fgtsMultaValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> ({terminationType === "sem_justa_causa" ? "40%" : "20%"} sobre o FGTS estimado de R$ {output.fgtsBalanceEstimated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}).
                </p>
                <p className="text-emerald-700 italic">
                  *Nota: O valor exato do FGTS acumulado depende dos depósitos reais feitos ao longo do seu contrato de trabalho.
                </p>
              </div>
            )}

            {/* Recibo de Liquidação - Holerite detalhado */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden" id="rescisao-receipt">
              <div className="bg-zinc-50 border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-teal-600" />
                  Detalhamento de Proventos e Descontos
                </span>
                <span className="text-xs font-mono text-zinc-400">CLT em Vigor</span>
              </div>

              <div className="divide-y divide-zinc-100">
                {output.items.map((item, index) => (
                  <div key={index} className="px-5 py-3.5 flex items-start justify-between text-sm hover:bg-zinc-50/50 transition-colors">
                    <div className="space-y-0.5 max-w-[70%]">
                      <p className="font-medium text-zinc-800">{item.name}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono font-semibold ${item.type === "receita" ? "text-emerald-600" : "text-rose-600"}`}>
                        {item.type === "receita" ? "+ " : "- "}
                        R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Linha do Saldo FGTS não-rescisório */}
                <div className="px-5 py-4 bg-zinc-50/60 grid grid-cols-2 gap-4 text-xs text-zinc-500">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-700 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-zinc-400" />
                      Estimativa de Fundo Residual
                    </p>
                    <p>Total depositado de FGTS estimado em {getDiffInMonthsAndDays(admissionDate, terminationDate).totalMonths} meses de trabalho.</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-zinc-400">FGTS Estimado Acumulado:</p>
                    <p className="font-mono font-semibold text-zinc-700 text-sm">
                      R$ {output.fgtsBalanceEstimated.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Rodapé do Recibo */}
                <div className="px-5 py-4 bg-zinc-50 flex justify-between items-center text-sm font-semibold text-zinc-900">
                  <span>SALDO LÍQUIDO NA CONTA RESCISÓRIA</span>
                  <span className="font-mono text-teal-800 text-lg">
                    R$ {output.netTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Direitos Adicionais */}
            <div className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl space-y-3" id="rescisao-rights">
              <h4 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-zinc-500" />
                Seus Direitos nesta Modalidade de Demissão:
              </h4>
              <ul className="text-xs text-zinc-600 space-y-2 list-disc pl-5">
                {terminationType === "sem_justa_causa" && (
                  <>
                    <li><strong>Guia de Seguro-Desemprego:</strong> Direito a receber as parcelas se cumpridos os critérios de tempo trabalhado.</li>
                    <li><strong>Saque de FGTS:</strong> Chave de conectividade liberada pelo empregador para saque do saldo integral em agência da Caixa.</li>
                    <li><strong>Aviso Prévio Proporcional:</strong> Total de {output.noticeDays} dias cobertos ou trabalhados.</li>
                  </>
                )}
                {terminationType === "pedido_demissao" && (
                  <>
                    <li><strong>Perda de FGTS:</strong> O trabalhador NÃO tem direito de sacar o FGTS depositado e não recebe a multa de 40%. O saldo permanece na conta retido para outras regras de saque (ex: 3 anos inativo ou compra da casa própria).</li>
                    <li><strong>Sem Seguro-Desemprego:</strong> Quem pede demissão não tem acesso às parcelas do seguro-desemprego.</li>
                    <li><strong>Aviso Prévio obrigatório:</strong> Deve trabalhar por 30 dias se o patrão exigir, sob pena de sofrer o desconto de um salário.</li>
                  </>
                )}
                {terminationType === "com_justa_causa" && (
                  <>
                    <li><strong>Perda quase total das verbas:</strong> Recebe estritamente o Saldo de Salário e Férias Vencidas se houver.</li>
                    <li><strong>Sem FGTS e Multa:</strong> Não saca o FGTS depositado e perde qualquer direito à indenização.</li>
                    <li><strong>Sem Seguro-Desemprego:</strong> Bloqueado de solicitar parcelas de amparo governamental.</li>
                  </>
                )}
                {terminationType === "acordo_comum" && (
                  <>
                    <li><strong>Saque de FGTS Parcial:</strong> Permite o saque de até 80% do saldo de FGTS da conta vinculada.</li>
                    <li><strong>Multa FGTS Reduzida:</strong> Multa rescisória de 20% (em vez de 40%) paga pelo empregador.</li>
                    <li><strong>Aviso Prévio pela metade:</strong> Se indenizado, o aviso é pago com base em 50% dos dias de direito.</li>
                    <li><strong>Sem Seguro-Desemprego:</strong> Modalidade por acordo não dá direito a ingressar no programa de Seguro-Desemprego.</li>
                  </>
                )}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
