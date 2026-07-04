/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TerminationType = 
  | 'sem_justa_causa' // Demissão sem justa causa
  | 'com_justa_causa' // Demissão com justa causa
  | 'pedido_demissao' // Pedido de demissão
  | 'acordo_comum';    // Acordo comum (Reforma Trabalhista)

export type NoticeType =
  | 'trabalhado' // Aviso Prévio Trabalhado
  | 'indenizado'  // Aviso Prévio Indenizado
  | 'dispensado';  // Dispensado do Aviso (não cumprido)

export interface RescisaoInput {
  salary: number;
  admissionDate: string;
  terminationDate: string;
  terminationType: TerminationType;
  noticeType: NoticeType;
  pendingVacationDays: number; // Dias de férias proporcionais acumulados pendentes (normalmente calculados automaticamente ou informados)
  hasVencidasVacation: boolean; // Se tem férias vencidas completas não tiradas
}

export interface CalculationLineItem {
  name: string;
  type: 'receita' | 'desconto';
  value: number;
  description: string;
}

export interface RescisaoOutput {
  salaryDays: number; // Dias de saldo de salário
  salaryDaysValue: number;
  noticeDays: number; // Dias de aviso prévio proporcional
  noticeValue: number;
  thirteenthProportionalMonths: number;
  thirteenthProportionalValue: number;
  vacationProportionalMonths: number;
  vacationProportionalValue: number;
  vacationThirdValue: number; // 1/3 sobre férias proporcionais
  vacationVencidasValue: number; // Férias vencidas se houver
  vacationVencidasThirdValue: number; // 1/3 sobre férias vencidas
  fgtsBalanceEstimated: number; // FGTS estimado acumulado
  fgtsMultaValue: number; // Multa rescisória de 40% ou 20%
  inssDeduction: number;
  irrfDeduction: number;
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  items: CalculationLineItem[];
}

export interface FeriasInput {
  salary: number;
  daysToTake: number; // Dias de férias (geralmente de 10 a 30)
  abonoPecuniario: boolean; // Vender 10 dias de férias
  adiantamento13: boolean; // Adiantar 1ª parcela do 13º
  dependentes: number;
}

export interface FeriasOutput {
  baseVacationValue: number; // Valor dos dias de férias gozados
  thirdConstitutional: number; // 1/3 constitucional das férias gozadas
  abonoValue: number; // Abono pecuniário (se vendeu 10 dias)
  thirdAbonoValue: number; // 1/3 sobre o abono pecuniário
  adiantamento13Value: number; // Valor adiantado do 13º
  grossTotal: number;
  inssDeduction: number;
  irrfDeduction: number;
  discountTotal: number;
  netTotal: number;
  items: CalculationLineItem[];
}

export interface ThirteenthInput {
  salary: number;
  monthsWorked: number; // 1 a 12
  dependentes: number;
}

export interface ThirteenthOutput {
  grossTotal: number;
  firstInstallment: number; // Primeira parcela (50% do bruto sem descontos)
  secondInstallmentGross: number; // Segunda parcela bruta (50% restante)
  inssDeduction: number; // Desconto INSS (aplicado na 2ª parcela sobre o total)
  irrfDeduction: number; // Desconto IRRF (aplicado na 2ª parcela sobre o total)
  secondInstallmentNet: number; // Líquido da segunda parcela
  discountTotal: number;
  netTotalCombined: number; // Total líquido recebido somando as duas parcelas
  items: CalculationLineItem[];
}

export interface FGTSInput {
  salary: number;
  monthsWorked: number;
}

export interface FGTSOutput {
  monthlyDeposit: number;
  totalDeposited: number;
  interestEstimated: number;
  totalAccumulated: number;
  multaSemJustaCausa: number;
  multaAcordoComum: number;
}

export interface AposentadoriaInput {
  gender: 'M' | 'F';
  age: number;
  contributionYears: number;
  startedContributingYear: number;
}

export interface AposentadoriaRuleResult {
  ruleName: string;
  requirementsMet: boolean;
  statusMessage: string;
  details: string;
  yearsRemaining: number;
}

export interface AposentadoriaOutput {
  idadeStatus: AposentadoriaRuleResult;
  pontosStatus: AposentadoriaRuleResult;
  pedagio100Status: AposentadoriaRuleResult;
  bestOption: string;
  summaryMessage: string;
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  cltArticle?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
