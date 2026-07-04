/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RescisaoInput,
  RescisaoOutput,
  FeriasInput,
  FeriasOutput,
  ThirteenthInput,
  ThirteenthOutput,
  FGTSInput,
  FGTSOutput,
  AposentadoriaInput,
  AposentadoriaOutput,
  AposentadoriaRuleResult,
  CalculationLineItem,
  TerminationType,
  NoticeType,
} from "./types";

// --- TAX CALCULATION UTILITIES ---

/**
 * Calculates the progressive INSS deduction for a given gross salary base.
 * Rates updated approximately for 2026:
 * - Up to R$ 1.518,00: 7.5%
 * - R$ 1.518,01 to R$ 2.793,88: 9.0%
 * - R$ 2.793,89 to R$ 4.190,83: 12.0%
 * - R$ 4.190,84 to R$ 8.157,41 (Teto): 14.0%
 */
export function calculateINSS(baseSalary: number): number {
  if (baseSalary <= 0) return 0;
  
  const limit1 = 1518.00;
  const limit2 = 2793.88;
  const limit3 = 4190.83;
  const limit4 = 8157.41; // INSS Ceiling

  let inss = 0;

  if (baseSalary <= limit1) {
    inss = baseSalary * 0.075;
  } else if (baseSalary <= limit2) {
    inss = (limit1 * 0.075) + ((baseSalary - limit1) * 0.09);
  } else if (baseSalary <= limit3) {
    inss = (limit1 * 0.075) + ((limit2 - limit1) * 0.09) + ((baseSalary - limit2) * 0.12);
  } else {
    const baseCapped = Math.min(baseSalary, limit4);
    inss = (limit1 * 0.075) + 
           ((limit2 - limit1) * 0.09) + 
           ((limit3 - limit2) * 0.12) + 
           ((baseCapped - limit3) * 0.14);
  }

  return parseFloat(inss.toFixed(2));
}

/**
 * Calculates the IRRF deduction using the progressive table.
 * Base = Gross Salary - INSS Deduction - (Dependents * R$ 189,59)
 * Rates for 2026:
 * - Up to R$ 2.259,20: Exempt
 * - R$ 2.259,21 to R$ 2.826,65: 7.5% (Deduction: R$ 169,44)
 * - R$ 2.826,66 to R$ 3.751,05: 15.0% (Deduction: R$ 381,44)
 * - R$ 3.751,06 to R$ 4.664,68: 22.5% (Deduction: R$ 662,77)
 * - Above R$ 4.664,68: 27.5% (Deduction: R$ 896,00)
 */
export function calculateIRRF(grossSalary: number, inssDeduction: number, dependentes: number = 0): number {
  const baseIrrf = grossSalary - inssDeduction - (dependentes * 189.59);
  if (baseIrrf <= 2259.20) return 0;

  let rate = 0;
  let deduction = 0;

  if (baseIrrf <= 2826.65) {
    rate = 0.075;
    deduction = 169.44;
  } else if (baseIrrf <= 3751.05) {
    rate = 0.15;
    deduction = 381.44;
  } else if (baseIrrf <= 4664.68) {
    rate = 0.225;
    deduction = 662.77;
  } else {
    rate = 0.275;
    deduction = 896.00;
  }

  const irrf = (baseIrrf * rate) - deduction;
  return irrf > 0 ? parseFloat(irrf.toFixed(2)) : 0;
}

// --- CALCULATION HELPER FUNCTIONS ---

/**
 * Parses and returns date components difference
 */
export function getDiffInMonthsAndDays(startDateStr: string, endDateStr: string) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { years: 0, months: 0, days: 0, totalMonths: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    // Get total days of previous month
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = (years * 12) + months;
  return { years, months, days, totalMonths };
}

/**
 * Calculates proportional months for 13th salary (fraction >= 15 days in calendar month counts as 1/12)
 */
export function calculateThirteenthMonths(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }

  // If in different years, 13th proportional is only for the termination year
  const targetYear = end.getFullYear();
  const yearStart = start.getFullYear() === targetYear ? start : new Date(targetYear, 0, 1);
  const yearEnd = end;

  let months = 0;

  // Iterate over months of targetYear
  const current = new Date(yearStart.getFullYear(), yearStart.getMonth(), 1);
  while (current <= yearEnd) {
    const month = current.getMonth();
    const year = current.getFullYear();

    // Determine working days in this month
    let firstDayOfWorkInMonth = 1;
    if (year === start.getFullYear() && month === start.getMonth()) {
      firstDayOfWorkInMonth = start.getDate();
    }

    let lastDayOfWorkInMonth = new Date(year, month + 1, 0).getDate();
    if (year === end.getFullYear() && month === end.getMonth()) {
      lastDayOfWorkInMonth = end.getDate();
    }

    const daysWorkedInMonth = lastDayOfWorkInMonth - firstDayOfWorkInMonth + 1;
    if (daysWorkedInMonth >= 15) {
      months++;
    }

    current.setMonth(current.getMonth() + 1);
  }

  return Math.min(12, months);
}

/**
 * Calculates proportional months for vacation (proportional vacation is based on anniversary date)
 */
export function calculateVacationProportionalMonths(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const { years, months, days } = getDiffInMonthsAndDays(startDateStr, endDateStr);
  
  // The fraction of the current period: 
  // If the remaining days are 15 or more, it counts as an extra month (1/12)
  let proportionalMonths = months;
  if (days >= 15) {
    proportionalMonths += 1;
  }

  // Proportional vacation is capped at 11, because at 12 it becomes a full "vencida" period.
  // Actually in termination, if it completed 12 months (or multiples), it's vencida. 
  // The rest is proportional (0 to 11 months).
  return proportionalMonths % 12;
}

// --- TERMINATION (RESCISÃO) CALCULATOR ---

export function calculateRescisao(input: RescisaoInput): RescisaoOutput {
  const {
    salary,
    admissionDate,
    terminationDate,
    terminationType,
    noticeType,
    pendingVacationDays,
    hasVencidasVacation,
  } = input;

  const items: CalculationLineItem[] = [];

  const timeDiff = getDiffInMonthsAndDays(admissionDate, terminationDate);
  const totalMonthsWorked = timeDiff.totalMonths;
  const daysInTerminationMonth = new Date(new Date(terminationDate).getFullYear(), new Date(terminationDate).getMonth() + 1, 0).getDate();
  const salaryDayValue = salary / 30; // Standard labor rule is dividing by 30

  // 1. Saldo de Salário
  const endDay = new Date(terminationDate).getDate();
  const salaryDays = endDay;
  const salaryDaysValue = salaryDays * salaryDayValue;
  
  if (salaryDaysValue > 0) {
    items.push({
      name: `Saldo de Salário (${salaryDays} dias)`,
      type: "receita",
      value: parseFloat(salaryDaysValue.toFixed(2)),
      description: `Referente aos dias trabalhados no mês da rescisão (${salaryDays}/${daysInTerminationMonth} dias).`,
    });
  }

  // 2. Aviso Prévio Proporcional Lei 12.506/2011
  // 30 dias + 3 dias por ano completo de serviço na empresa, limitado a 90 dias total.
  const extraNoticeDays = Math.min(20, timeDiff.years) * 3;
  const totalNoticeDays = 30 + extraNoticeDays;
  let noticeValue = 0;

  if (terminationType === "sem_justa_causa" && noticeType === "indenizado") {
    noticeValue = totalNoticeDays * salaryDayValue;
    items.push({
      name: `Aviso Prévio Indenizado (${totalNoticeDays} dias)`,
      type: "receita",
      value: parseFloat(noticeValue.toFixed(2)),
      description: `Aviso prévio indenizado proporcional ao tempo de serviço (${timeDiff.years} anos completos = 30 + ${extraNoticeDays} dias).`,
    });
  } else if (terminationType === "acordo_comum" && noticeType === "indenizado") {
    // No acordo comum, o aviso prévio indenizado é pago pela metade (50%)
    noticeValue = (totalNoticeDays * salaryDayValue) * 0.5;
    items.push({
      name: `Aviso Prévio Indenizado (Acordo - 50% de ${totalNoticeDays} dias)`,
      type: "receita",
      value: parseFloat(noticeValue.toFixed(2)),
      description: `No acordo comum, o aviso prévio indenizado é pago pela metade (50%).`,
    });
  }

  // 3. 13º Salário Proporcional
  const thirteenthMonths = calculateThirteenthMonths(admissionDate, terminationDate);
  let thirteenthProportionalValue = 0;

  if (terminationType !== "com_justa_causa") {
    thirteenthProportionalValue = (salary / 12) * thirteenthMonths;
    items.push({
      name: `13º Salário Proporcional (${thirteenthMonths}/12)`,
      type: "receita",
      value: parseFloat(thirteenthProportionalValue.toFixed(2)),
      description: `Proporcional aos meses trabalhados com fração igual ou superior a 15 dias no ano corrente.`,
    });
  }

  // 4. Férias Proporcionais
  const vacationMonths = calculateVacationProportionalMonths(admissionDate, terminationDate);
  let vacationProportionalValue = 0;
  let vacationThirdValue = 0;

  if (terminationType !== "com_justa_causa") {
    vacationProportionalValue = (salary / 12) * vacationMonths;
    vacationThirdValue = vacationProportionalValue / 3;

    items.push({
      name: `Férias Proporcionais Rescisórias (${vacationMonths}/12)`,
      type: "receita",
      value: parseFloat(vacationProportionalValue.toFixed(2)),
      description: `Direito de férias acumulado proporcional ao período aquisitivo atual.`,
    });

    items.push({
      name: `1/3 Constitucional sobre Férias Proporcionais`,
      type: "receita",
      value: parseFloat(vacationThirdValue.toFixed(2)),
      description: `Acréscimo obrigatório de um terço constitucional sobre as férias proporcionais.`,
    });
  }

  // 5. Férias Vencidas (Se houver)
  let vacationVencidasValue = 0;
  let vacationVencidasThirdValue = 0;

  if (hasVencidasVacation) {
    vacationVencidasValue = salary;
    vacationVencidasThirdValue = salary / 3;

    items.push({
      name: `Férias Vencidas Inteiras`,
      type: "receita",
      value: parseFloat(vacationVencidasValue.toFixed(2)),
      description: `Período de 12 meses de férias já completado e ainda não gozado pelo trabalhador.`,
    });

    items.push({
      name: `1/3 Constitucional sobre Férias Vencidas`,
      type: "receita",
      value: parseFloat(vacationVencidasThirdValue.toFixed(2)),
      description: `Acréscimo constitucional de um terço sobre o valor das férias vencidas.`,
    });
  }

  // 6. FGTS e Multas Rescisórias
  // FGTS deposit: 8% of salary monthly.
  // We estimate cumulative deposits based on duration. Assuming salary was stable.
  const fgtsMonthly = salary * 0.08;
  const fgtsBalanceEstimated = fgtsMonthly * totalMonthsWorked;
  let fgtsMultaValue = 0;

  if (terminationType === "sem_justa_causa") {
    fgtsMultaValue = fgtsBalanceEstimated * 0.40; // 40% penalty
    items.push({
      name: `Multa Rescisória FGTS (40% sobre saldo estimado de R$ ${fgtsBalanceEstimated.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`,
      type: "receita",
      value: parseFloat(fgtsMultaValue.toFixed(2)),
      description: `Multa paga pelo empregador por demissão sem justa causa, calculada sobre o total depositado de FGTS.`,
    });
  } else if (terminationType === "acordo_comum") {
    fgtsMultaValue = fgtsBalanceEstimated * 0.20; // 20% penalty
    items.push({
      name: `Multa Rescisória FGTS (Acordo - 20% sobre saldo de R$ ${fgtsBalanceEstimated.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})})`,
      type: "receita",
      value: parseFloat(fgtsMultaValue.toFixed(2)),
      description: `No acordo comum, a multa rescisória do FGTS é reduzida pela metade (20%).`,
    });
  }

  // 7. TAX DEDUCTIONS (INSS & IRRF)
  // Standardly, INSS/IRRF are deducted from "Saldo de Salário" and "13º Salário Proporcional".
  // Vacation in termination is compensatory, meaning it is EXEMPT from INSS and IRRF!
  // FGTS Multa is also compensatory and EXEMPT from INSS and IRRF!
  
  // INSS on Saldo de Salário
  const inssOnSalary = calculateINSS(salaryDaysValue);
  // INSS on 13th proportional
  const inssOnThirteenth = calculateINSS(thirteenthProportionalValue);
  const totalInss = inssOnSalary + inssOnThirteenth;

  if (inssOnSalary > 0) {
    items.push({
      name: "Desconto INSS sobre Saldo de Salário",
      type: "desconto",
      value: inssOnSalary,
      description: "Contribuição previdenciária progressiva sobre os dias trabalhados no mês.",
    });
  }
  if (inssOnThirteenth > 0) {
    items.push({
      name: "Desconto INSS sobre 13º Salário",
      type: "desconto",
      value: inssOnThirteenth,
      description: "Contribuição previdenciária progressiva sobre o 13º salário proporcional.",
    });
  }

  // IRRF on Saldo de Salário (using base: salaryDaysValue - inssOnSalary)
  const irrfOnSalary = calculateIRRF(salaryDaysValue, inssOnSalary, 0);
  // IRRF on 13th (using base: thirteenthProportionalValue - inssOnThirteenth)
  const irrfOnThirteenth = calculateIRRF(thirteenthProportionalValue, inssOnThirteenth, 0);
  const totalIrrf = irrfOnSalary + irrfOnThirteenth;

  if (irrfOnSalary > 0) {
    items.push({
      name: "Desconto IRRF sobre Saldo de Salário",
      type: "desconto",
      value: irrfOnSalary,
      description: "Imposto de renda retido na fonte incidente sobre o saldo de salário.",
    });
  }
  if (irrfOnThirteenth > 0) {
    items.push({
      name: "Desconto IRRF sobre 13º Salário",
      type: "desconto",
      value: irrfOnThirteenth,
      description: "Imposto de renda retido na fonte incidente sobre o 13º salário proporcional.",
    });
  }

  // 8. Pedido de Demissão: Se aviso prévio foi indenizado pelo trabalhador (ele não cumpriu e foi descontado pelo empregador)
  if (terminationType === "pedido_demissao" && noticeType === "indenizado") {
    const discountedNoticeValue = 30 * salaryDayValue; // Desconta 30 dias de salário
    items.push({
      name: "Desconto de Aviso Prévio Não Cumprido",
      type: "desconto",
      value: parseFloat(discountedNoticeValue.toFixed(2)),
      description: "Multa descontada do trabalhador que pediu demissão e não cumpriu os 30 dias de aviso prévio (Art. 487 § 2º CLT).",
    });
  }

  // Sums
  const grossTotal = items
    .filter((item) => item.type === "receita")
    .reduce((sum, item) => sum + item.value, 0);

  const discountTotal = items
    .filter((item) => item.type === "desconto")
    .reduce((sum, item) => sum + item.value, 0);

  const netTotal = grossTotal - discountTotal;

  return {
    salaryDays,
    salaryDaysValue: parseFloat(salaryDaysValue.toFixed(2)),
    noticeDays: totalNoticeDays,
    noticeValue: parseFloat(noticeValue.toFixed(2)),
    thirteenthProportionalMonths: thirteenthMonths,
    thirteenthProportionalValue: parseFloat(thirteenthProportionalValue.toFixed(2)),
    vacationProportionalMonths: vacationMonths,
    vacationProportionalValue: parseFloat(vacationProportionalValue.toFixed(2)),
    vacationThirdValue: parseFloat(vacationThirdValue.toFixed(2)),
    vacationVencidasValue: parseFloat(vacationVencidasValue.toFixed(2)),
    vacationVencidasThirdValue: parseFloat(vacationVencidasThirdValue.toFixed(2)),
    fgtsBalanceEstimated: parseFloat(fgtsBalanceEstimated.toFixed(2)),
    fgtsMultaValue: parseFloat(fgtsMultaValue.toFixed(2)),
    inssDeduction: parseFloat(totalInss.toFixed(2)),
    irrfDeduction: parseFloat(totalIrrf.toFixed(2)),
    grossTotal: parseFloat(grossTotal.toFixed(2)),
    discountTotal: parseFloat(discountTotal.toFixed(2)),
    netTotal: parseFloat(netTotal.toFixed(2)),
    items,
  };
}

// --- VACATION (FÉRIAS) CALCULATOR ---

export function calculateFerias(input: FeriasInput): FeriasOutput {
  const { salary, daysToTake, abonoPecuniario, adiantamento13, dependentes } = input;
  const items: CalculationLineItem[] = [];

  // Dias de férias normais
  const vacationDayValue = salary / 30;
  const baseVacationValue = daysToTake * vacationDayValue;

  items.push({
    name: `Valor das Férias (${daysToTake} dias)`,
    type: "receita",
    value: parseFloat(baseVacationValue.toFixed(2)),
    description: `Remuneração equivalente aos ${daysToTake} dias usufruídos de descanso.`,
  });

  // 1/3 constitucional das férias usufruídas
  const thirdConstitutional = baseVacationValue / 3;
  items.push({
    name: `Terço Constitucional (1/3)`,
    type: "receita",
    value: parseFloat(thirdConstitutional.toFixed(2)),
    description: `Acréscimo obrigatório de um terço constitucional sobre os dias usufruídos de férias.`,
  });

  // Abono Pecuniário ("vender" até 10 dias)
  let abonoValue = 0;
  let thirdAbonoValue = 0;

  if (abonoPecuniario) {
    abonoValue = 10 * vacationDayValue;
    thirdAbonoValue = abonoValue / 3;

    items.push({
      name: `Abono Pecuniário (Venda de 10 dias)`,
      type: "receita",
      value: parseFloat(abonoValue.toFixed(2)),
      description: `Conversão pecuniária de 10 dias de descanso em salário, conforme Art. 143 da CLT.`,
    });

    items.push({
      name: `1/3 Constitucional sobre o Abono Pecuniário`,
      type: "receita",
      value: parseFloat(thirdAbonoValue.toFixed(2)),
      description: `Acréscimo constitucional de um terço sobre o abono pecuniário (isento de impostos).`,
    });
  }

  // Adiantamento da 1ª Parcela do 13º Salário
  let adiantamento13Value = 0;
  if (adiantamento13) {
    adiantamento13Value = salary * 0.50; // 50% do salário nominal bruto
    items.push({
      name: `Adiantamento do 13º Salário (50%)`,
      type: "receita",
      value: parseFloat(adiantamento13Value.toFixed(2)),
      description: `Adiantamento da primeira parcela do 13º salário pago por ocasião das férias, conforme faculta a lei.`,
    });
  }

  // TAX CALCULATIONS FOR VACATIONS
  // INSS and IRRF are calculated ONLY on (Férias Gozadas + 1/3 Constitucional das férias gozadas).
  // Abono Pecuniário and 1/3 over Abono are legally ISEMPT from INSS, FGTS and IRRF!
  // Adiantamento of 13th is just an advance payment, taxes on it are paid only in December (2nd installment).
  
  const taxableBase = baseVacationValue + thirdConstitutional;
  const inssDeduction = calculateINSS(taxableBase);
  const irrfDeduction = calculateIRRF(taxableBase, inssDeduction, dependentes);

  if (inssDeduction > 0) {
    items.push({
      name: "Desconto INSS sobre Férias + 1/3",
      type: "desconto",
      value: inssDeduction,
      description: "Contribuição previdenciária progressiva sobre os dias de descanso + terço constitucional.",
    });
  }

  if (irrfDeduction > 0) {
    items.push({
      name: "Desconto IRRF sobre Férias + 1/3",
      type: "desconto",
      value: irrfDeduction,
      description: "Imposto de renda retido na fonte calculado sobre o valor tributável das férias.",
    });
  }

  const grossTotal = items
    .filter((item) => item.type === "receita")
    .reduce((sum, item) => sum + item.value, 0);

  const discountTotal = items
    .filter((item) => item.type === "desconto")
    .reduce((sum, item) => sum + item.value, 0);

  const netTotal = grossTotal - discountTotal;

  return {
    baseVacationValue: parseFloat(baseVacationValue.toFixed(2)),
    thirdConstitutional: parseFloat(thirdConstitutional.toFixed(2)),
    abonoValue: parseFloat(abonoValue.toFixed(2)),
    thirdAbonoValue: parseFloat(thirdAbonoValue.toFixed(2)),
    adiantamento13Value: parseFloat(adiantamento13Value.toFixed(2)),
    grossTotal: parseFloat(grossTotal.toFixed(2)),
    inssDeduction: parseFloat(inssDeduction.toFixed(2)),
    irrfDeduction: parseFloat(irrfDeduction.toFixed(2)),
    discountTotal: parseFloat(discountTotal.toFixed(2)),
    netTotal: parseFloat(netTotal.toFixed(2)),
    items,
  };
}

// --- 13º SALÁRIO CALCULATOR ---

export function calculateThirteenth(input: ThirteenthInput): ThirteenthOutput {
  const { salary, monthsWorked, dependentes } = input;
  const items: CalculationLineItem[] = [];

  const grossTotal = (salary / 12) * monthsWorked;

  // 1ª Parcela (Paga entre fevereiro e novembro): 50% do bruto de direito, sem descontos previdenciários
  const firstInstallment = grossTotal * 0.50;

  // 2ª Parcela (Paga até 20 de dezembro): 50% restante com a aplicação dos descontos de INSS e IRRF sobre o valor total bruto
  const secondInstallmentGross = grossTotal * 0.50;

  items.push({
    name: `13º Salário Bruto Total (${monthsWorked}/12)`,
    type: "receita",
    value: parseFloat(grossTotal.toFixed(2)),
    description: `Valor total do direito com base em ${monthsWorked} meses trabalhados no ano.`,
  });

  items.push({
    name: `Primeira Parcela (Adiantamento - 50%)`,
    type: "receita", // Em termos de fluxo, o trabalhador recebe 100% da primeira parcela limpa
    value: parseFloat(firstInstallment.toFixed(2)),
    description: `Metade do valor total, paga adiantada livre de impostos.`,
  });

  // Calculando taxas sobre o valor Bruto total
  const inssDeduction = calculateINSS(grossTotal);
  const irrfDeduction = calculateIRRF(grossTotal, inssDeduction, dependentes);

  if (inssDeduction > 0) {
    items.push({
      name: "Desconto INSS (aplicado na 2ª parcela)",
      type: "desconto",
      value: inssDeduction,
      description: `Previdência Social calculada de forma progressiva sobre o valor total do 13º salário bruto (R$ ${grossTotal.toFixed(2)}).`,
    });
  }

  if (irrfDeduction > 0) {
    items.push({
      name: "Desconto IRRF (aplicado na 2ª parcela)",
      type: "desconto",
      value: irrfDeduction,
      description: `Imposto de renda calculado sobre o 13º bruto, deduzindo INSS e dependentes.`,
    });
  }

  // O líquido da segunda parcela é a metade restante menos todos os descontos
  const secondInstallmentNet = secondInstallmentGross - inssDeduction - irrfDeduction;

  const discountTotal = inssDeduction + irrfDeduction;
  const netTotalCombined = grossTotal - discountTotal;

  return {
    grossTotal: parseFloat(grossTotal.toFixed(2)),
    firstInstallment: parseFloat(firstInstallment.toFixed(2)),
    secondInstallmentGross: parseFloat(secondInstallmentGross.toFixed(2)),
    inssDeduction: parseFloat(inssDeduction.toFixed(2)),
    irrfDeduction: parseFloat(irrfDeduction.toFixed(2)),
    secondInstallmentNet: parseFloat(Math.max(0, secondInstallmentNet).toFixed(2)),
    discountTotal: parseFloat(discountTotal.toFixed(2)),
    netTotalCombined: parseFloat(netTotalCombined.toFixed(2)),
    items,
  };
}

// --- FGTS CALCULATOR ---

export function calculateFGTS(input: FGTSInput): FGTSOutput {
  const { salary, monthsWorked } = input;

  const monthlyDeposit = salary * 0.08; // 8% do salário
  const totalDeposited = monthlyDeposit * monthsWorked;
  
  // FGTS rende cerca de 3% ao ano + TR (estimando acumulado bem modesto de +0.2% ao mês)
  const interestEstimated = totalDeposited * 0.025; 
  const totalAccumulated = totalDeposited + interestEstimated;

  const multaSemJustaCausa = totalAccumulated * 0.40;
  const multaAcordoComum = totalAccumulated * 0.20;

  return {
    monthlyDeposit: parseFloat(monthlyDeposit.toFixed(2)),
    totalDeposited: parseFloat(totalDeposited.toFixed(2)),
    interestEstimated: parseFloat(interestEstimated.toFixed(2)),
    totalAccumulated: parseFloat(totalAccumulated.toFixed(2)),
    multaSemJustaCausa: parseFloat(multaSemJustaCausa.toFixed(2)),
    multaAcordoComum: parseFloat(multaAcordoComum.toFixed(2)),
  };
}

// --- APOSENTADORIA SIMULATOR (REFORMA PREVIDÊNCIA) ---

export function simulateAposentadoria(input: AposentadoriaInput): AposentadoriaOutput {
  const { gender, age, contributionYears, startedContributingYear } = input;

  const targetAge = gender === 'M' ? 65 : 62;
  const targetContribution = gender === 'M' ? 20 : 15;

  // 1. Regra 1: Idade Comum (CLT pós-Reforma de 2019)
  const ageMet = age >= targetAge;
  const contributionMet = contributionYears >= targetContribution;
  const requirementsMetAge = ageMet && contributionMet;

  let ageStatusMsg = "";
  let ageYearsRemaining = 0;

  if (requirementsMetAge) {
    ageStatusMsg = "Você já preencheu os requisitos desta regra!";
  } else {
    const yearsToAge = Math.max(0, targetAge - age);
    const yearsToContrib = Math.max(0, targetContribution - contributionYears);
    ageYearsRemaining = Math.max(yearsToAge, yearsToContrib);
    
    if (!ageMet && !contributionMet) {
      ageStatusMsg = `Faltam ${yearsToAge} anos de idade e ${yearsToContrib} anos de contribuição.`;
    } else if (!ageMet) {
      ageStatusMsg = `Tempo de contribuição atingido! Faltam ${yearsToAge} anos de idade.`;
    } else {
      ageStatusMsg = `Idade mínima atingida! Faltam ${yearsToContrib} anos de contribuição.`;
    }
  }

  const idadeStatus: AposentadoriaRuleResult = {
    ruleName: "Aposentadoria por Idade (Regra Geral)",
    requirementsMet: requirementsMetAge,
    statusMessage: ageStatusMsg,
    details: `Mulher se aposenta aos 62 anos de idade + 15 anos de contribuição. Homem se aposenta aos 65 anos de idade + 20 anos de contribuição.`,
    yearsRemaining: ageYearsRemaining,
  };

  // 2. Regra 2: Pontos (Idade + Tempo de Contribuição)
  // Requisitos de contribuição mínima em transição: Mulher 30 anos, Homem 35 anos.
  // Pontos necessários para 2026: Mulher 93 pontos, Homem 103 pontos.
  const minContribPointsRule = gender === 'M' ? 35 : 30;
  const targetPoints = gender === 'M' ? 103 : 93;
  
  const currentPoints = age + contributionYears;
  const contributionMetPoints = contributionYears >= minContribPointsRule;
  const pointsMet = currentPoints >= targetPoints;
  const requirementsMetPoints = contributionMetPoints && pointsMet;

  let pointsStatusMsg = "";
  let pointsYearsRemaining = 0;

  if (requirementsMetPoints) {
    pointsStatusMsg = `Você já possui ${currentPoints} pontos e atingiu os requisitos!`;
  } else {
    const pointsNeeded = targetPoints - currentPoints;
    const contribNeeded = minContribPointsRule - contributionYears;
    
    // Each year of working increases points by 2 (1 year of age + 1 year of contribution)
    // If they continue contributing, they gain 2 points per calendar year.
    const yearsToPoints = pointsNeeded > 0 ? Math.ceil(pointsNeeded / 2) : 0;
    pointsYearsRemaining = Math.max(yearsToPoints, contribNeeded);

    if (contribNeeded > 0) {
      pointsStatusMsg = `Faltam ${contribNeeded} anos de contribuição e mais pontos. Hoje você tem ${currentPoints} de ${targetPoints} pontos necessários.`;
    } else {
      pointsStatusMsg = `Você possui o tempo mínimo de contribuição, mas faltam ${pointsNeeded} pontos para alcançar a meta de ${targetPoints}.`;
    }
  }

  const pontosStatus: AposentadoriaRuleResult = {
    ruleName: "Regra de Transição por Pontos (Ano 2026)",
    requirementsMet: requirementsMetPoints,
    statusMessage: pointsStatusMsg,
    details: `Soma da Idade + Tempo de Contribuição. Para 2026, são necessários ${targetPoints} pontos (${gender === 'M' ? '35' : '30'} anos de contribuição mínima + idade). Sobe 1 ponto por ano.`,
    yearsRemaining: pointsYearsRemaining,
  };

  // 3. Regra 3: Pedágio 100% (Idade Mínima + Pedágio sobre tempo restante em nov/2019)
  // Idade mínima: Mulher 57 anos, Homem 60 anos.
  // Tempo contribuição: Mulher 30 anos, Homem 35 anos.
  // Pedágio: No momento da reforma (13/11/2019), quanto tempo faltava para completar o mínimo? O trabalhador precisa contribuir esse tempo restante em dobro (100% de pedágio).
  // Estimando anos de contribuição em nov/2019:
  const yearsSinceReform = 2026 - 2019; // Reform was end of 2019, around 6.5 years ago
  const estimatedContribIn2019 = Math.max(0, contributionYears - yearsSinceReform);
  const targetContribTransition = gender === 'M' ? 35 : 30;
  
  const targetAgeToll = gender === 'M' ? 60 : 57;
  const ageMetToll = age >= targetAgeToll;

  const missingIn2019 = Math.max(0, targetContribTransition - estimatedContribIn2019);
  const tollRequired = missingIn2019; // Pedágio 100% = mesma quantidade que faltava em 2019
  const totalRequiredWithToll = targetContribTransition + tollRequired;

  const contributionMetToll = contributionYears >= totalRequiredWithToll;
  const requirementsMetToll = ageMetToll && contributionMetToll;

  let tollStatusMsg = "";
  let tollYearsRemaining = 0;

  if (requirementsMetToll) {
    tollStatusMsg = "Você já preencheu os requisitos do Pedágio de 100%!";
  } else {
    const ageNeeded = Math.max(0, targetAgeToll - age);
    const contribNeeded = Math.max(0, totalRequiredWithToll - contributionYears);
    tollYearsRemaining = Math.max(ageNeeded, contribNeeded);

    if (estimatedContribIn2019 >= targetContribTransition) {
      tollStatusMsg = `Você já cumpriu a meta de contribuição em 2019! Falta apenas atingir a idade de ${targetAgeToll} anos (faltam ${ageNeeded} anos).`;
    } else {
      tollStatusMsg = `Idade mínima: ${targetAgeToll} anos. Seu tempo exigido com pedágio é de ${totalRequiredWithToll.toFixed(1)} anos (hoje você tem ${contributionYears} anos). Faltam ${contribNeeded.toFixed(1)} anos de contribuição.`;
    }
  }

  const pedagio100Status: AposentadoriaRuleResult = {
    ruleName: "Regra de Transição: Pedágio 100%",
    requirementsMet: requirementsMetToll,
    statusMessage: tollStatusMsg,
    details: `Idade mínima de ${targetAgeToll} anos (${gender === 'M' ? 'Homens' : 'Mulheres'}). Exige tempo mínimo de ${gender === 'M' ? '35' : '30'} anos de contribuição MAIS um pedágio de 100% do tempo que faltava para se aposentar em 13/11/2019.`,
    yearsRemaining: tollYearsRemaining,
  };

  // Best option calculation
  let bestOption = "";
  let summaryMessage = "";

  if (requirementsMetAge || requirementsMetPoints || requirementsMetToll) {
    bestOption = "Parabéns! Requisitos já atingidos.";
    const activeRules = [];
    if (requirementsMetAge) activeRules.push("Idade Geral");
    if (requirementsMetPoints) activeRules.push("Transição por Pontos");
    if (requirementsMetToll) activeRules.push("Pedágio 100%");
    
    summaryMessage = `Você já preencheu os requisitos legais para se aposentar por: ${activeRules.join(", ")}. Consulte o app Meu INSS para dar entrada no benefício.`;
  } else {
    // Find the minimum years remaining
    const remaining = [
      { rule: "Aposentadoria por Idade Geral", years: ageYearsRemaining },
      { rule: "Regra por Pontos", years: pointsYearsRemaining },
      { rule: "Pedágio 100%", years: tollYearsRemaining }
    ];
    
    remaining.sort((a, b) => a.years - b.years);
    const closest = remaining[0];
    
    bestOption = closest.rule;
    summaryMessage = `De acordo com as simulações, o seu caminho mais rápido de aposentadoria é pela regra **"${closest.rule}"**, que pode ser alcançada em aproximadamente **${closest.years.toFixed(1)} anos**, caso você continue contribuindo mensalmente.`;
  }

  return {
    idadeStatus,
    pontosStatus,
    pedagio100Status,
    bestOption,
    summaryMessage,
  };
}

// --- FAQ/BASIC RIGHTS CONTENT DATABASE (REAL MOCK-FREE INFORMATION) ---

export const FAQ_DATA = [
  {
    id: "jornada",
    category: "Jornada & Horas",
    question: "Qual é o limite de jornada de trabalho semanal pela CLT?",
    answer: "Conforme o Artigo 7º, inciso XIII da Constituição Federal e a CLT, a jornada de trabalho normal não pode exceder 8 horas diárias e 44 horas semanais. Convenções coletivas de algumas categorias podem estipular limites ainda menores.",
    cltArticle: "Art. 58 da CLT"
  },
  {
    id: "hora-extra",
    category: "Jornada & Horas",
    question: "Como funciona o cálculo das Horas Extras?",
    answer: "As horas trabalhadas além da jornada diária comum devem ser pagas com um acréscimo de, no mínimo, 50% sobre o valor da hora normal para dias de semana e sábados. Em domingos e feriados trabalhados que não forem compensados, o acréscimo deve ser de 100% (em dobro).",
    cltArticle: "Art. 59 da CLT e Súmula 146 do TST"
  },
  {
    id: "noturno",
    category: "Benefícios & Adicionais",
    question: "Quem tem direito ao Adicional Noturno e qual o valor?",
    answer: "O trabalhador urbano que presta serviços entre as 22h de um dia e as 5h do dia seguinte tem direito ao adicional noturno de, no mínimo, 20% sobre a hora diurna. Além disso, a hora noturna urbana tem uma contagem reduzida de 52 minutos e 30 segundos, o que significa que o trabalhador recebe mais trabalhando proporcionalmente menos tempo de relógio.",
    cltArticle: "Art. 73 da CLT"
  },
  {
    id: "seguro-desemprego",
    category: "Demissão & Rescisão",
    question: "Como funciona o Seguro-Desemprego? Quantas parcelas recebo?",
    answer: "O seguro-desemprego é um benefício pago temporariamente para quem foi demitido sem justa causa. Para a primeira solicitação, o trabalhador precisa ter trabalhado pelo menos 12 meses nos últimos 18 meses. O número de parcelas varia de 3 a 5, dependendo da quantidade de meses trabalhados e se é a primeira, segunda ou terceira solicitação do benefício.",
    cltArticle: "Lei nº 7.998/90"
  },
  {
    id: "vale-transporte",
    category: "Benefícios & Adicionais",
    question: "O empregador é obrigado a dar Vale-Transporte? Quanto desconta?",
    answer: "Sim, o empregador é obrigado a fornecer o vale-transporte para o deslocamento residência-trabalho e vice-versa. O empregador pode descontar até 6% do salário-base do trabalhador para custear esse benefício. Se o custo dos vales for menor que 6% do salário, desconta-se apenas o valor real gasto. Se for maior, a empresa arca com a diferença integral.",
    cltArticle: "Lei nº 7.418/85"
  },
  {
    id: "licenca-maternidade",
    category: "Licenças & Afastamentos",
    question: "Qual o período da Licença-Maternidade e estabilidade?",
    answer: "A licença-maternidade é de 120 dias garantidos pela Previdência Social (podendo se estender para 180 dias em empresas participantes do programa Empresa Cidadã). A gestante possui estabilidade provisória no emprego desde a confirmação da gravidez até 5 meses após o parto, não podendo ser demitida sem justa causa nesse período.",
    cltArticle: "Art. 391-A e Art. 392 da CLT"
  },
  {
    id: "aviso-previo",
    category: "Demissão & Rescisão",
    question: "O que é o Aviso Prévio Proporcional e como funciona?",
    answer: "O aviso prévio é a comunicação de encerramento do contrato de trabalho com antecedência de 30 dias. Com a Lei 12.506/2011, foi instituído o aviso prévio proporcional ao tempo de serviço: a cada ano completo trabalhado na empresa, somam-se 3 dias ao aviso de 30 dias, até o limite de 60 dias de acréscimo (totalizando no máximo 90 dias de aviso prévio). O aviso pode ser trabalhado ou indenizado pelo empregador.",
    cltArticle: "Art. 487 da CLT e Lei nº 12.506/11"
  },
  {
    id: "ferias-regra",
    category: "Férias",
    question: "Quantos dias de férias posso tirar e posso 'vender' dias?",
    answer: "Após cada período de 12 meses trabalhados (período aquisitivo), o funcionário tem direito a até 30 dias corridos de férias (esse número diminui se houver mais de 5 faltas não justificadas). O trabalhador pode 'vender' até 1/3 do seu período de férias (10 dias), convertendo em abono pecuniário, que deve ser solicitado até 15 dias antes de completar o período aquisitivo.",
    cltArticle: "Art. 130 e Art. 143 da CLT"
  }
];
