/* =========================================================
   Projeto Integrador de E-commerce — Fase 1
   Lógica da aplicação (armazenamento local, cálculos e UI)
   Sem dependências além de Bootstrap 5 e Chart.js (CDN)
   ========================================================= */
"use strict";

(function () {
  const STORAGE_KEY = "pi-ecommerce-fase1-respostas-v1";
  const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  let abcChart = null;

  /* =========================================================
     Utilitários numéricos e de formatação
     ========================================================= */

  // Aceita vírgula ou ponto como separador decimal
  function parseNumberInput(value) {
    if (value === null || value === undefined) return NaN;
    if (typeof value !== "string") return Number(value);
    const normalized = value.trim();
    if (normalized === "") return NaN;
    if (/,/.test(normalized) && /\./.test(normalized)) {
      return Number(normalized.replace(/\./g, "").replace(",", "."));
    }
    if (/,/.test(normalized)) {
      return Number(normalized.replace(",", "."));
    }
    return Number(normalized);
  }

  function formatCurrency(value) {
    if (!Number.isFinite(value)) return "—";
    return CURRENCY_FORMATTER.format(value);
  }

  function formatPercent(value, decimals) {
    if (!Number.isFinite(value)) return "—";
    return `${value.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals === undefined ? 2 : decimals,
      maximumFractionDigits: decimals === undefined ? 2 : decimals,
    })}%`;
  }

  function formatNumber(value, decimals) {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals === undefined ? 1 : decimals,
      maximumFractionDigits: decimals === undefined ? 1 : decimals,
    });
  }

  function getNum(id) {
    const el = document.getElementById(id);
    if (!el) return NaN;
    return parseNumberInput(el.value);
  }

  function getPercentAsFraction(id) {
    return getNum(id) / 100;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setResultBox(id, text, state) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.remove("is-warning", "is-danger");
    if (state === "warning") el.classList.add("is-warning");
    if (state === "danger") el.classList.add("is-danger");
  }

  /* =========================================================
     Persistência local (localStorage)
     ========================================================= */

  function savableFields() {
    return Array.from(document.querySelectorAll("[data-save]"));
  }

  function keyFor(field) {
    return field.dataset.save;
  }

  function readStorage() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("Não foi possível ler o armazenamento local.", error);
      return {};
    }
  }

  function initStorage() {
    if (localStorage.getItem(STORAGE_KEY) === null) {
      localStorage.setItem(STORAGE_KEY, "{}");
    }
  }

  function saveField(field) {
    const key = keyFor(field);
    if (!key) return;
    const data = readStorage();
    if (field.type === "checkbox") {
      data[key] = field.checked;
    } else {
      data[key] = field.value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function saveAllFields() {
    const data = {};
    savableFields().forEach((field) => {
      const key = keyFor(field);
      if (!key) return;
      data[key] = field.type === "checkbox" ? field.checked : field.value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function restoreFields() {
    const data = readStorage();
    savableFields().forEach((field) => {
      const key = keyFor(field);
      if (!key || !(key in data)) return;
      if (field.type === "checkbox") {
        field.checked = Boolean(data[key]);
      } else {
        field.value = data[key];
      }
    });
  }

  /* =========================================================
     Estado visual dos campos (preenchido / atenção)
     ========================================================= */

  function hasValue(field) {
    if (field.type === "checkbox") return field.checked;
    return String(field.value || "").trim().length > 0;
  }

  function updateFieldState(field) {
    field.classList.remove("field-complete", "field-attention");
    if (field.type === "checkbox") return;
    if (hasValue(field)) {
      field.classList.add("field-complete");
    } else if (field.hasAttribute("data-required")) {
      field.classList.add("field-attention");
    }
  }

  function updateAllFieldStates() {
    savableFields().forEach(updateFieldState);
  }

  /* =========================================================
     Validação numérica
     ========================================================= */

  function validateNumber(field) {
    const wrapper = field.closest(".field-wrap") || field.parentElement;
    const errorEl = wrapper ? wrapper.querySelector(".field-error") : null;
    const raw = field.value.trim();

    if (raw === "") {
      field.classList.remove("is-invalid");
      if (errorEl) errorEl.textContent = "";
      return true;
    }

    const value = parseNumberInput(raw);
    const isValid = Number.isFinite(value) && (field.min === "" || value >= Number(field.min));

    field.classList.toggle("is-invalid", !isValid);
    if (errorEl) {
      errorEl.textContent = isValid ? "" : "Informe um número válido (use vírgula ou ponto).";
    }
    return isValid;
  }

  function attachNumberValidation() {
    document.querySelectorAll('[data-validate="number"]').forEach((field) => {
      field.addEventListener("blur", () => validateNumber(field));
    });
  }

  /* =========================================================
     Progresso das etapas
     ========================================================= */

  function updateProgress() {
    const steps = Array.from(document.querySelectorAll(".step-section"));
    const total = steps.length;
    let completed = 0;

    steps.forEach((step) => {
      const required = Array.from(step.querySelectorAll("[data-required]"));
      const ok = required.length > 0 && required.every(hasValue);
      step.classList.toggle("step-complete", ok);
      const navLink = document.querySelector(`.step-nav [href="#${step.id}"]`);
      const check = navLink ? navLink.querySelector(".step-check") : null;
      if (check) check.classList.toggle("d-none", !ok);
      if (ok) completed += 1;
    });

    const percent = total ? Math.round((completed / total) * 100) : 0;
    const bar = document.getElementById("stepsProgressBar");
    const label = document.getElementById("stepsProgressLabel");
    if (bar) {
      bar.style.width = `${percent}%`;
      bar.setAttribute("aria-valuenow", String(percent));
    }
    if (label) label.textContent = `${completed} de ${total} etapas com entregável essencial preenchido (${percent}%)`;
  }

  /* =========================================================
     Contador de caracteres (título do anúncio)
     ========================================================= */

  function updateTitleCounters() {
    document.querySelectorAll("[data-title-counter]").forEach((input) => {
      const output = document.querySelector(input.dataset.titleCounter);
      const max = Number(input.dataset.maxChars || 60);
      if (!output) return;
      const count = input.value.length;
      output.textContent = `${count}/${max} caracteres`;
      output.classList.toggle("is-over", count > max);
    });
  }

  function attachTitleCounter() {
    document.querySelectorAll("[data-title-counter]").forEach((input) => {
      input.addEventListener("input", updateTitleCounters);
    });
  }

  /* =========================================================
     Etapa 3 — Simulador de importação formal
     ========================================================= */

  function calculateImportCosts() {
    const precoUnitUSD = getNum("impPrecoUnit");
    const qtd = getNum("impQtd");
    const freteInt = getNum("impFreteInt");
    const seguro = getNum("impSeguro");
    const cotacao = getNum("impCotacao");
    const aliqII = getPercentAsFraction("impAliqII");
    const aliqIPI = getPercentAsFraction("impAliqIPI");
    const aliqPIS = getPercentAsFraction("impAliqPIS");
    const aliqCOFINS = getPercentAsFraction("impAliqCOFINS");
    const afrmm = getNum("impAFRMM");
    const despachante = getNum("impDespachante");
    const aliqICMS = getPercentAsFraction("impAliqICMS");
    const freteNacional = getNum("impFreteNacional");
    const margem = getPercentAsFraction("impMargem");

    const out = document.getElementById("importSteps");
    const resultBox = document.getElementById("importResult");
    if (!out || !resultBox) return;

    const requiredValid = [precoUnitUSD, qtd, cotacao, aliqICMS].every(Number.isFinite) && qtd > 0 && aliqICMS < 1;
    if (!requiredValid) {
      out.innerHTML = "";
      setResultBox("importResult", "Preencha ao menos preço unitário, quantidade, cotação e alíquota de ICMS (menor que 100%) para simular.", "warning");
      return;
    }

    const fobTotal = precoUnitUSD * qtd;
    const cifUSD = fobTotal + (Number.isFinite(freteInt) ? freteInt : 0) + (Number.isFinite(seguro) ? seguro : 0);
    const cifBRL = cifUSD * cotacao;
    const ii = cifBRL * (Number.isFinite(aliqII) ? aliqII : 0);
    const ipi = (cifBRL + ii) * (Number.isFinite(aliqIPI) ? aliqIPI : 0);
    const pis = cifBRL * (Number.isFinite(aliqPIS) ? aliqPIS : 0);
    const cofins = cifBRL * (Number.isFinite(aliqCOFINS) ? aliqCOFINS : 0);
    const afrmmValor = Number.isFinite(afrmm) ? afrmm : 0;
    const despachanteValor = Number.isFinite(despachante) ? despachante : 0;
    const somaAntesICMS = cifBRL + ii + ipi + pis + cofins + afrmmValor + despachanteValor;
    const baseICMS = somaAntesICMS / (1 - aliqICMS);
    const icms = baseICMS * aliqICMS;
    const custoDesembaracado = somaAntesICMS + icms;
    const custoTotalLote = custoDesembaracado + (Number.isFinite(freteNacional) ? freteNacional : 0);
    const custoUnitario = custoTotalLote / qtd;
    const divisorMargem = 1 - (Number.isFinite(margem) ? margem : 0);
    const precoComMargem = divisorMargem > 0 ? custoUnitario / divisorMargem : NaN;

    const rows = [
      ["1. FOB total", `${formatNumber(precoUnitUSD, 2)} × ${formatNumber(qtd, 0)}`, `US$ ${formatNumber(fobTotal, 2)}`],
      ["2. CIF em US$", `FOB + frete internacional + seguro`, `US$ ${formatNumber(cifUSD, 2)}`],
      ["3. CIF em R$", `CIF US$ × cotação (${formatNumber(cotacao, 4)})`, formatCurrency(cifBRL)],
      ["4. II", `CIF R$ × alíquota II`, formatCurrency(ii)],
      ["5. IPI", `(CIF R$ + II) × alíquota IPI`, formatCurrency(ipi)],
      ["6. PIS", `CIF R$ × alíquota PIS`, formatCurrency(pis)],
      ["7. COFINS", `CIF R$ × alíquota COFINS`, formatCurrency(cofins)],
      ["8. AFRMM", `valor informado`, formatCurrency(afrmmValor)],
      ["9. Soma antes do ICMS", `CIF R$ + II + IPI + PIS + COFINS + AFRMM + despachante`, formatCurrency(somaAntesICMS)],
      ["10. Base do ICMS (por dentro)", `soma antes do ICMS ÷ (1 − alíquota ICMS)`, formatCurrency(baseICMS)],
      ["11. ICMS", `base ICMS × alíquota ICMS`, formatCurrency(icms)],
      ["12. Custo total desembaraçado", `soma antes do ICMS + ICMS`, formatCurrency(custoDesembaracado)],
      ["13a. Custo total do lote", `custo desembaraçado + frete nacional`, formatCurrency(custoTotalLote)],
      ["13b. Custo unitário", `custo total do lote ÷ quantidade`, formatCurrency(custoUnitario)],
      ["14. Preço sugerido com margem", `custo unitário ÷ (1 − margem)`, Number.isFinite(precoComMargem) ? formatCurrency(precoComMargem) : "Revise a margem informada."],
    ];

    out.innerHTML = rows
      .map(
        ([label, sub, value]) =>
          `<div class="calc-row"><span>${label}<br><small class="text-muted">${sub}</small></span><strong>${value}</strong></div>`
      )
      .join("");

    if (!Number.isFinite(precoComMargem)) {
      setResultBox("importResult", "A margem informada torna o cálculo inválido (divisor zero ou negativo). Revise o percentual de margem.", "danger");
    } else {
      setResultBox(
        "importResult",
        `Custo unitário desembaraçado: ${formatCurrency(custoUnitario)} | Preço sugerido com margem: ${formatCurrency(precoComMargem)}`,
        "success"
      );
    }
  }

  function attachImportSimulator() {
    const button = document.getElementById("calcImportCosts");
    if (button) button.addEventListener("click", calculateImportCosts);
  }

  /* =========================================================
     Etapa 4 — Simulador por canal de venda
     ========================================================= */

  function calculateChannels() {
    document.querySelectorAll(".channel-row").forEach((row) => {
      const price = parseNumberInput(row.querySelector("[data-ch-price]").value);
      const commission = parseNumberInput(row.querySelector("[data-ch-commission]").value) / 100;
      const sales = parseNumberInput(row.querySelector("[data-ch-sales]").value);
      const returns = parseNumberInput(row.querySelector("[data-ch-returns]").value);

      const revenue = Number.isFinite(price) && Number.isFinite(sales) ? price * sales : NaN;
      const commissionPaid = Number.isFinite(revenue) && Number.isFinite(commission) ? revenue * commission : NaN;
      const returnRate = Number.isFinite(returns) && sales > 0 ? (returns / sales) * 100 : NaN;
      const revenueAfterCommission = Number.isFinite(revenue) && Number.isFinite(commissionPaid) ? revenue - commissionPaid : NaN;

      row.querySelector("[data-ch-revenue]").textContent = formatCurrency(revenue);
      row.querySelector("[data-ch-commission-paid]").textContent = formatCurrency(commissionPaid);
      row.querySelector("[data-ch-return-rate]").textContent = formatPercent(returnRate);
      row.querySelector("[data-ch-net]").textContent = formatCurrency(revenueAfterCommission);
    });
  }

  function attachChannelSimulator() {
    const button = document.getElementById("calcChannels");
    if (button) button.addEventListener("click", calculateChannels);
  }

  /* =========================================================
     Etapa 7 — Precificação e viabilidade
     ========================================================= */

  function calculatePricing() {
    const items = [
      { id: "priceCost", toggle: "togCost" },
      { id: "pricePackage", toggle: "togPackage" },
      { id: "priceOps", toggle: "togOps" },
      { id: "priceFreight", toggle: "togFreight" },
      { id: "priceTax", toggle: "togTax" },
      { id: "priceMedia", toggle: "togMedia" },
      { id: "priceLoss", toggle: "togLoss" },
    ];

    let fixedUnitCosts = 0;
    items.forEach(({ id, toggle }) => {
      const toggleEl = document.getElementById(toggle);
      const active = !toggleEl || toggleEl.checked;
      const value = getNum(id);
      if (active && Number.isFinite(value)) fixedUnitCosts += value;
    });

    const commission = getPercentAsFraction("priceCommission");
    const margin = getPercentAsFraction("priceMargin");
    const competitorPrice = getNum("priceCompetitor");
    const intendedPrice = getNum("priceIntended");

    const divisor = 1 - (Number.isFinite(commission) ? commission : 0) - (Number.isFinite(margin) ? margin : 0);
    const minPrice = divisor > 0 ? fixedUnitCosts / divisor : NaN;

    setText("priceFixedCosts", formatCurrency(fixedUnitCosts));
    setText("priceMinResult", Number.isFinite(minPrice) ? formatCurrency(minPrice) : "—");

    if (divisor <= 0) {
      setResultBox(
        "priceResult",
        "Inviável: a soma de comissão e margem é igual ou superior a 100%. Reduza a comissão, a margem ou revise o canal escolhido.",
        "danger"
      );
      setText("priceCommissionReais", "—");
      setText("priceContribution", "—");
      setText("priceRealMargin", "—");
      setText("priceCompetitorGap", "—");
      return;
    }

    let messages = [`Preço mínimo sustentável: ${formatCurrency(minPrice)}.`];
    let state = "success";

    if (Number.isFinite(intendedPrice)) {
      const commissionReais = intendedPrice * (Number.isFinite(commission) ? commission : 0);
      const contribution = intendedPrice - fixedUnitCosts - commissionReais;
      const realMarginPercent = intendedPrice > 0 ? (contribution / intendedPrice) * 100 : NaN;

      setText("priceCommissionReais", formatCurrency(commissionReais));
      setText("priceContribution", formatCurrency(contribution));
      setText("priceRealMargin", formatPercent(realMarginPercent));

      if (intendedPrice < minPrice) {
        messages.push(`O preço pretendido (${formatCurrency(intendedPrice)}) está abaixo do preço mínimo. A margem desejada não é alcançada.`);
        state = "warning";
      } else {
        messages.push(`O preço pretendido (${formatCurrency(intendedPrice)}) cobre o preço mínimo calculado.`);
      }
    } else {
      setText("priceCommissionReais", "—");
      setText("priceContribution", "—");
      setText("priceRealMargin", "—");
    }

    if (Number.isFinite(competitorPrice) && Number.isFinite(intendedPrice)) {
      const gap = intendedPrice - competitorPrice;
      setText("priceCompetitorGap", `${gap >= 0 ? "+" : ""}${formatCurrency(gap)} em relação ao concorrente`);
    } else {
      setText("priceCompetitorGap", "—");
    }

    messages.push("Lembre-se: receita menos mídia não é lucro. Confirme se todos os custos fixos e variáveis da operação foram considerados.");
    setResultBox("priceResult", messages.join(" "), state);
  }

  function attachPricingCalculator() {
    const button = document.getElementById("calcPrice");
    if (button) button.addEventListener("click", calculatePricing);
  }

  /* =========================================================
     Etapa 8 — Indicadores de funil de marketing
     ========================================================= */

  function calculateFunnel() {
    const impressions = getNum("funnelImpressions");
    const clicks = getNum("funnelClicks");
    const investment = getNum("funnelInvestment");
    const orders = getNum("funnelOrders");
    const revenue = getNum("funnelRevenue");

    const ctr = clicks >= 0 && impressions > 0 ? (clicks / impressions) * 100 : NaN;
    const cpc = clicks > 0 ? investment / clicks : NaN;
    const conversion = clicks > 0 ? (orders / clicks) * 100 : NaN;
    const cac = orders > 0 ? investment / orders : NaN;
    const ticket = orders > 0 ? revenue / orders : NaN;
    const roas = investment > 0 ? revenue / investment : NaN;

    const rows = [
      ["CTR (taxa de cliques)", "cliques ÷ impressões × 100", `${formatNumber(clicks, 0)} ÷ ${formatNumber(impressions, 0)} × 100`, formatPercent(ctr), "% de quem viu o anúncio e clicou."],
      ["CPC (custo por clique)", "investimento ÷ cliques", `${formatCurrency(investment)} ÷ ${formatNumber(clicks, 0)}`, formatCurrency(cpc), "valor pago, em média, por clique."],
      ["Conversão", "pedidos ÷ cliques × 100", `${formatNumber(orders, 0)} ÷ ${formatNumber(clicks, 0)} × 100`, formatPercent(conversion), "% de cliques que viraram pedido."],
      ["CAC de mídia", "investimento ÷ pedidos", `${formatCurrency(investment)} ÷ ${formatNumber(orders, 0)}`, formatCurrency(cac), "custo de mídia para gerar um pedido."],
      ["Ticket médio", "receita ÷ pedidos", `${formatCurrency(revenue)} ÷ ${formatNumber(orders, 0)}`, formatCurrency(ticket), "valor médio de cada pedido."],
      ["ROAS", "receita atribuída ÷ investimento", `${formatCurrency(revenue)} ÷ ${formatCurrency(investment)}`, Number.isFinite(roas) ? `${formatNumber(roas, 2)}x` : "—", "quanto retornou em receita para cada real investido."],
    ];

    const out = document.getElementById("funnelSteps");
    if (out) {
      out.innerHTML = rows
        .map(
          ([name, formula, sub, value, interpretation]) => `
        <div class="calc-row d-block py-2">
          <div class="d-flex justify-content-between flex-wrap">
            <strong>${name}</strong><span>${value}</span>
          </div>
          <div class="text-muted small">Fórmula: ${formula} → ${sub}</div>
          <div class="text-muted small fst-italic">Interpretação: ${interpretation} Compare com sua meta antes de julgar como bom ou ruim.</div>
        </div>`
        )
        .join("");
    }
  }

  function attachFunnelCalculator() {
    const button = document.getElementById("calcFunnel");
    if (button) button.addEventListener("click", calculateFunnel);
  }

  /* =========================================================
     Etapa 9 — Estoque, reposição e capacidade
     ========================================================= */

  function calculateInventoryScenario(demand, prefix) {
    const stock = getNum("invStock");
    const leadTime = getNum("invLeadTime");
    const safety = getNum("invSafety");

    const coverage = demand > 0 ? stock / demand : NaN;
    const consumption = Number.isFinite(demand) && Number.isFinite(leadTime) ? demand * leadTime : NaN;
    const reorderPoint = Number.isFinite(consumption) && Number.isFinite(safety) ? consumption + safety : NaN;
    const timeToReorder = Number.isFinite(reorderPoint) && demand > 0 ? (stock - reorderPoint) / demand : NaN;

    setText(`${prefix}Coverage`, Number.isFinite(coverage) ? `${formatNumber(coverage, 1)} dias` : "—");
    setText(`${prefix}Consumption`, Number.isFinite(consumption) ? `${formatNumber(consumption, 1)} unidades` : "—");
    setText(`${prefix}ReorderPoint`, Number.isFinite(reorderPoint) ? `${formatNumber(reorderPoint, 1)} unidades` : "—");
    setText(
      `${prefix}TimeToReorder`,
      Number.isFinite(timeToReorder)
        ? timeToReorder <= 0
          ? "Atenção: o estoque já está no ponto de pedido ou abaixo dele."
          : `${formatNumber(timeToReorder, 1)} dias`
        : "—"
    );
  }

  function calculateInventory() {
    const currentDemand = getNum("invDemandCurrent");
    const projectedDemand = getNum("invDemandProjected");
    calculateInventoryScenario(currentDemand, "invCur");
    calculateInventoryScenario(projectedDemand, "invProj");

    const stock = getNum("invStock");
    const alert = document.getElementById("inventoryAlert");
    if (!alert) return;
    if (!Number.isFinite(stock) || stock <= 0 || (!Number.isFinite(currentDemand) && !Number.isFinite(projectedDemand))) {
      alert.textContent = "Preencha estoque disponível e ao menos uma demanda para ver o alerta de risco.";
      alert.classList.remove("d-none");
      return;
    }
    if (currentDemand === 0 && projectedDemand === 0) {
      alert.textContent = "Demanda igual a zero: revise as premissas antes de decidir sobre reposição ou mídia.";
      alert.classList.remove("d-none");
    } else {
      alert.classList.add("d-none");
    }
  }

  function attachInventoryCalculator() {
    const button = document.getElementById("calcInventory");
    if (button) button.addEventListener("click", calculateInventory);
  }

  /* =========================================================
     Etapa 10 — OTIF e devoluções
     ========================================================= */

  function calculateOTIF() {
    const total = getNum("otifTotal");
    const onTimeOrders = getNum("otifOnTime");
    const inFullOrders = getNum("otifInFull");
    const bothOrders = getNum("otifBoth");

    const onTime = total > 0 ? (onTimeOrders / total) * 100 : NaN;
    const inFull = total > 0 ? (inFullOrders / total) * 100 : NaN;
    const otif = total > 0 ? (bothOrders / total) * 100 : NaN;

    setText("otifOnTimeResult", formatPercent(onTime));
    setText("otifInFullResult", formatPercent(inFull));
    setText("otifResult", formatPercent(otif));

    const note = document.getElementById("otifNote");
    if (note) {
      note.textContent =
        Number.isFinite(otif)
          ? "OTIF é a interseção entre pedidos completos e no prazo — não a média entre On Time e In Full."
          : "Informe o total de pedidos (maior que zero) para calcular.";
    }
  }

  function calculateReturns() {
    const orders = getNum("retOrders");
    const returns = getNum("retReturns");
    const freightOut = getNum("retFreightOut");
    const freightBack = getNum("retFreightBack");
    const reprocessing = getNum("retReprocessing");

    const returnRate = orders > 0 ? (returns / orders) * 100 : NaN;
    const minCost = Number.isFinite(returns)
      ? returns * ((Number.isFinite(freightOut) ? freightOut : 0) + (Number.isFinite(freightBack) ? freightBack : 0) + (Number.isFinite(reprocessing) ? reprocessing : 0))
      : NaN;

    setText("retRateResult", formatPercent(returnRate));
    setText("retCostResult", formatCurrency(minCost));
  }

  function attachDeliveryCalculators() {
    const otifButton = document.getElementById("calcOTIF");
    if (otifButton) otifButton.addEventListener("click", calculateOTIF);
    const returnsButton = document.getElementById("calcReturns");
    if (returnsButton) returnsButton.addEventListener("click", calculateReturns);
  }

  /* =========================================================
     Etapa 11 — Curva ABC / Pareto
     ========================================================= */

  function calculateABC() {
    const rows = Array.from(document.querySelectorAll(".abc-row"));
    const items = rows
      .map((row) => ({
        name: row.querySelector("[data-abc-name]").value.trim(),
        qty: parseNumberInput(row.querySelector("[data-abc-qty]").value),
      }))
      .filter((item) => item.name !== "" && Number.isFinite(item.qty) && item.qty > 0);

    const output = document.getElementById("abcOutput");
    const chartCanvas = document.getElementById("abcChart");
    if (!output) return;

    if (items.length === 0) {
      output.innerHTML = '<p class="text-muted mb-0">Informe ao menos um item com nome e quantidade maior que zero.</p>';
      if (abcChart) {
        abcChart.destroy();
        abcChart = null;
      }
      return;
    }

    items.sort((a, b) => b.qty - a.qty);
    const total = items.reduce((sum, item) => sum + item.qty, 0);

    let cumulative = 0;
    const analyzed = items.map((item) => {
      const share = (item.qty / total) * 100;
      cumulative += share;
      let classe = "C";
      if (cumulative <= 80) classe = "A";
      else if (cumulative <= 95) classe = "B";
      return { ...item, share, cumulative, classe };
    });

    const tableRows = analyzed
      .map(
        (item) => `
      <tr class="${item.classe === "A" ? "table-warning" : ""}">
        <td>${item.name}</td>
        <td>${formatNumber(item.qty, 0)}</td>
        <td>${formatPercent(item.share)}</td>
        <td>${formatPercent(item.cumulative)}</td>
        <td><span class="badge text-bg-${item.classe === "A" ? "warning" : item.classe === "B" ? "info" : "secondary"}">${item.classe}</span></td>
      </tr>`
      )
      .join("");

    output.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm table-bordered align-middle mb-0">
          <thead><tr><th>Item</th><th>Quantidade</th><th>Participação</th><th>Acumulado</th><th>Classe</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      <p class="text-muted small mt-2 mb-0">Total analisado: ${formatNumber(total, 0)} ocorrências. Regra padrão: Classe A até ~80% acumulado, Classe B até ~95%, Classe C no restante. A política pode ser ajustada pela equipe, desde que declarada e aplicada de forma consistente.</p>
    `;

    const classAItems = analyzed.filter((item) => item.classe === "A");
    const priorityList = document.getElementById("abcPriorityList");
    if (priorityList) {
      priorityList.innerHTML = classAItems.length
        ? classAItems.map((item) => `<li><strong>${item.name}</strong> — ${formatNumber(item.qty, 0)} ocorrências (${formatPercent(item.share)} do total)</li>`).join("")
        : "<li>Nenhum item classe A identificado.</li>";
    }

    if (window.Chart && chartCanvas) {
      if (abcChart) abcChart.destroy();
      abcChart = new window.Chart(chartCanvas, {
        data: {
          labels: analyzed.map((item) => item.name),
          datasets: [
            {
              type: "bar",
              label: "Quantidade",
              data: analyzed.map((item) => item.qty),
              backgroundColor: analyzed.map((item) => (item.classe === "A" ? "#f5820d" : item.classe === "B" ? "#0f6bb8" : "#9fb0c3")),
              yAxisID: "y",
            },
            {
              type: "line",
              label: "% acumulado",
              data: analyzed.map((item) => item.cumulative),
              borderColor: "#0a2540",
              backgroundColor: "#0a2540",
              yAxisID: "y1",
              tension: 0.25,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, position: "left", title: { display: true, text: "Quantidade" } },
            y1: { beginAtZero: true, max: 100, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "% acumulado" } },
          },
        },
      });
    }
  }

  function attachABCAnalysis() {
    const button = document.getElementById("calcABC");
    if (button) button.addEventListener("click", calculateABC);
  }

  /* =========================================================
     Etapa 12 — Resumo automático e estrutura da apresentação
     ========================================================= */

  function buildFinalSummary() {
    const container = document.getElementById("finalSummary");
    if (!container) return;

    const fieldMap = [
      ["Nome do e-commerce", "d1_nome"],
      ["Proposta de valor", "d1_propostaGerada"],
      ["Persona", "d2_personaNome"],
      ["Produto principal", "d5_titulo"],
      ["Canal prioritário", "d4_canalPrioritario"],
      ["Preço mínimo calculado", "priceMinResult"],
      ["Diagnóstico principal", "d12_diagnostico"],
      ["Primeira prioridade", "d12_prioridade"],
      ["Meta e prazo de revisão", "d12_metaPrazo"],
    ];

    const rows = fieldMap
      .map(([label, id]) => {
        const el = document.getElementById(id);
        const value = el ? (el.tagName === "SPAN" || el.tagName === "STRONG" ? el.textContent : el.value) : "";
        const display = value && String(value).trim() !== "" ? String(value) : "Ainda não preenchido nesta etapa.";
        return `<div class="mb-2"><strong>${label}:</strong> <span class="text-muted">${display}</span></div>`;
      })
      .join("");

    container.innerHTML = rows;
  }

  function attachFinalSummary() {
    const button = document.getElementById("generateSummary");
    if (button) button.addEventListener("click", buildFinalSummary);
  }

  function attachPresentationOutline() {
    const button = document.getElementById("generateOutline");
    const output = document.getElementById("presentationOutline");
    if (!button || !output) return;

    button.addEventListener("click", () => {
      output.value = [
        "1. Abertura — quem somos e qual problema resolvemos",
        "   Pergunta orientadora: o problema do cliente ficou claro em uma frase?",
        "",
        "2. Cliente e proposta de valor",
        "   Pergunta orientadora: por que essa proposta é relevante para a persona escolhida?",
        "",
        "3. Catálogo e forma de abastecimento",
        "   Pergunta orientadora: a origem escolhida é compatível com prazo, capital e qualidade prometidos?",
        "",
        "4. Canais de venda e estratégia comercial",
        "   Pergunta orientadora: por que este canal é o prioritário agora?",
        "",
        "5. Cadastro, oferta e validação",
        "   Pergunta orientadora: o que foi corrigido antes da publicação?",
        "",
        "6. Precificação e viabilidade",
        "   Pergunta orientadora: o preço cobre custos, comissão e margem desejada?",
        "",
        "7. Marketing e funil",
        "   Pergunta orientadora: o custo de aquisição cabe na margem calculada?",
        "",
        "8. Estoque e logística",
        "   Pergunta orientadora: a operação suporta o crescimento projetado pela campanha?",
        "",
        "9. Entrega, atendimento e pós-venda",
        "   Pergunta orientadora: o que fazemos quando algo dá errado?",
        "",
        "10. Prioridades (Curva ABC) e plano 5W2H",
        "    Pergunta orientadora: qual problema tratamos primeiro e por quê?",
        "",
        "11. Recomendação executiva",
        "    Pergunta orientadora: qual é a decisão, a meta e o prazo para revisão?",
      ].join("\n");
      output.dispatchEvent(new Event("input", { bubbles: true }));
      showToast("Estrutura da apresentação gerada. Preencha cada bloco com o conteúdo da sua equipe.");
    });
  }

  /* =========================================================
     Checklist final
     ========================================================= */

  function updateChecklistProgress() {
    const categories = Array.from(document.querySelectorAll(".checklist-category"));
    let totalItems = 0;
    let totalChecked = 0;

    categories.forEach((category) => {
      const items = Array.from(category.querySelectorAll('input[type="checkbox"]'));
      const checked = items.filter((item) => item.checked).length;
      totalItems += items.length;
      totalChecked += checked;

      const percentEl = category.querySelector(".category-percent");
      if (percentEl) {
        const percent = items.length ? Math.round((checked / items.length) * 100) : 0;
        percentEl.textContent = `${checked}/${items.length} (${percent}%)`;
      }
    });

    const overallPercent = totalItems ? Math.round((totalChecked / totalItems) * 100) : 0;
    setText("checklistCount", `${totalChecked} de ${totalItems} itens concluídos`);
    setText("checklistPercent", `${overallPercent}%`);

    const bar = document.getElementById("checklistProgressBar");
    if (bar) {
      bar.style.width = `${overallPercent}%`;
      bar.setAttribute("aria-valuenow", String(overallPercent));
    }

    const readinessMsg = document.getElementById("readinessMessage");
    if (readinessMsg) {
      if (overallPercent < 50) {
        readinessMsg.textContent = "A Fase 1 ainda está no início. Continue preenchendo cada etapa antes de avançar.";
      } else if (overallPercent < 90) {
        readinessMsg.textContent = "Bom progresso. Revise a coerência entre dados, cálculos e justificativas antes de considerar a fase concluída.";
      } else {
        readinessMsg.textContent = "Quase tudo marcado. Antes de entregar, revise se os cálculos e as decisões realmente se conectam entre si — preencher campos não é o mesmo que concluir a análise.";
      }
    }
  }

  function attachChecklist() {
    document.querySelectorAll('.checklist-category input[type="checkbox"]').forEach((box) => {
      box.addEventListener("change", updateChecklistProgress);
    });
  }

  /* =========================================================
     Exportar / Importar projeto (JSON)
     ========================================================= */

  function exportProject() {
    saveAllFields();
    const data = readStorage();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `projeto-integrador-fase1-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Projeto exportado em JSON.");
  }

  function importProject(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        restoreFields();
        updateAllFieldStates();
        updateProgress();
        updateChecklistProgress();
        updateTitleCounters();
        showToast("Projeto importado com sucesso.");
      } catch (error) {
        console.error(error);
        showToast("Não foi possível importar o arquivo. Verifique se é um JSON exportado por esta ferramenta.", true);
      }
    };
    reader.readAsText(file);
  }

  function attachImportExport() {
    ["exportProject", "exportProjectMobile", "exportProjectFooter"].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.addEventListener("click", exportProject);
    });

    ["importProjectInput", "importProjectInputMobile"].forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];
        if (file) importProject(file);
        event.target.value = "";
      });
    });
  }

  /* =========================================================
     Salvar agora / limpar respostas / imprimir
     ========================================================= */

  function attachSaveNowButton() {
    document.querySelectorAll("[data-save-now]").forEach((button) => {
      button.addEventListener("click", () => {
        saveAllFields();
        showToast("Respostas salvas neste navegador.");
      });
    });
  }

  function attachPrintButtons() {
    document.querySelectorAll("[data-print-page]").forEach((button) => {
      button.addEventListener("click", () => window.print());
    });
  }

  function clearAllFields() {
    savableFields().forEach((field) => {
      if (field.type === "checkbox") {
        field.checked = false;
      } else {
        field.value = "";
      }
      updateFieldState(field);
    });
    localStorage.setItem(STORAGE_KEY, "{}");
    updateProgress();
    updateChecklistProgress();
    updateTitleCounters();
  }

  function attachClearButton() {
    const trigger = document.getElementById("confirmClearButton");
    if (trigger) {
      trigger.addEventListener("click", () => {
        clearAllFields();
        showToast("Respostas limpas.");
      });
    }
  }

  /* =========================================================
     Expandir / recolher todas as etapas
     ========================================================= */

  function attachExpandCollapse() {
    function toggleAll(show) {
      document.querySelectorAll("#stepsAccordion .accordion-collapse").forEach((panel) => {
        const collapseInstance = window.bootstrap ? window.bootstrap.Collapse.getOrCreateInstance(panel, { toggle: false }) : null;
        if (!collapseInstance) return;
        if (show) collapseInstance.show();
        else collapseInstance.hide();
      });
    }

    ["expandAllSteps", "expandAllStepsMobile"].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.addEventListener("click", () => toggleAll(true));
    });
    ["collapseAllSteps", "collapseAllStepsMobile"].forEach((id) => {
      const button = document.getElementById(id);
      if (button) button.addEventListener("click", () => toggleAll(false));
    });
  }

  /* =========================================================
     Etapa 1 — Gerador de proposta de valor
     ========================================================= */

  function attachValuePropositionGenerator() {
    const button = document.getElementById("gerarProposta");
    if (!button) return;

    button.addEventListener("click", () => {
      const publico = document.getElementById("d1_pv_publico").value.trim();
      const problema = document.getElementById("d1_pv_problema").value.trim();
      const solucao = document.getElementById("d1_pv_solucao").value.trim();
      const prova = document.getElementById("d1_pv_prova").value.trim();
      const beneficio = document.getElementById("d1_pv_beneficio").value.trim();

      if (!publico || !problema || !solucao || !beneficio) {
        setResultBox("d1_propostaGerada", "Preencha ao menos público, problema, solução e benefício para gerar a frase.", "warning");
        return;
      }

      const provaTrecho = prova ? `, com ${prova},` : ",";
      const phrase = `Para ${publico}, que precisa de ${problema}, nosso e-commerce oferece ${solucao}${provaTrecho} para gerar ${beneficio}.`;
      setResultBox("d1_propostaGerada", phrase, null);
    });
  }

  /* =========================================================
     Navegação: menu lateral gerado a partir das etapas
     ========================================================= */

  function buildStepNav() {
    const steps = Array.from(document.querySelectorAll(".step-section"));
    const desktop = document.getElementById("desktopStepNav");
    const mobile = document.getElementById("mobileStepNav");
    if (!desktop && !mobile) return;

    const html = steps
      .map((step) => {
        const button = step.querySelector(".accordion-button");
        const label = (button && button.dataset.navLabel) || step.id;
        const icon = (button && button.dataset.navIcon) || "bi-circle";
        return `<a class="nav-link" href="#${step.id}"><i class="bi ${icon} me-1"></i>${label}<i class="bi bi-check-circle-fill text-success ms-1 step-check d-none"></i></a>`;
      })
      .join("");

    if (desktop) desktop.innerHTML = html;
    if (mobile) mobile.innerHTML = html;
  }

  function attachAnchorExpand() {
    document.querySelectorAll('a[href^="#etapa"]').forEach((link) => {
      link.addEventListener("click", () => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target || !window.bootstrap) return;
        const collapseEl = target.querySelector(".accordion-collapse");
        if (collapseEl) window.bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }).show();
      });
    });
  }

  /* =========================================================
     Navegação: próxima etapa + destaque do item ativo
     ========================================================= */

  function attachNextStepButtons() {
    document.querySelectorAll("[data-next-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-next-step");
        const target = document.getElementById(targetId);
        if (!target) return;
        const collapseEl = target.querySelector(".accordion-collapse") || target;
        if (window.bootstrap && collapseEl.classList.contains("accordion-collapse")) {
          window.bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false }).show();
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function attachStepNavHighlight() {
    const links = Array.from(document.querySelectorAll(".step-nav .nav-link"));
    if (!links.length) return;
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = document.querySelector(`.step-nav [href="#${entry.target.id}"]`);
          if (!link) return;
          links.forEach((l) => l.classList.remove("active-step"));
          link.classList.add("active-step");
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* =========================================================
     Toasts de confirmação
     ========================================================= */

  function showToast(message, isError) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${isError ? "danger" : "success"} border-0`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
      </div>`;
    container.appendChild(toastEl);

    if (window.bootstrap) {
      const toast = new window.bootstrap.Toast(toastEl, { delay: 4000 });
      toast.show();
      toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    } else {
      setTimeout(() => toastEl.remove(), 4000);
    }
  }

  /* =========================================================
     Eventos gerais de campo (salvar + estado + progresso)
     ========================================================= */

  function attachFieldEvents() {
    savableFields().forEach((field) => {
      const eventName = field.tagName === "SELECT" || field.type === "checkbox" || field.type === "date" ? "change" : "input";
      field.addEventListener(eventName, () => {
        updateFieldState(field);
        saveField(field);
        updateProgress();
      });
    });
  }

  /* =========================================================
     Tooltips (glossário e Bootstrap)
     ========================================================= */

  function initTooltips() {
    if (!window.bootstrap) return;
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      window.bootstrap.Tooltip.getOrCreateInstance(el);
    });
  }

  /* =========================================================
     Inicialização
     ========================================================= */

  document.addEventListener("DOMContentLoaded", () => {
    try {
      initStorage();
      restoreFields();
      attachFieldEvents();
      attachNumberValidation();
      attachTitleCounter();
      attachImportSimulator();
      attachChannelSimulator();
      attachPricingCalculator();
      attachFunnelCalculator();
      attachInventoryCalculator();
      attachDeliveryCalculators();
      attachABCAnalysis();
      attachFinalSummary();
      attachPresentationOutline();
      attachValuePropositionGenerator();
      attachChecklist();
      attachImportExport();
      attachSaveNowButton();
      attachPrintButtons();
      attachClearButton();
      attachExpandCollapse();
      attachNextStepButtons();
      buildStepNav();
      attachAnchorExpand();
      attachStepNavHighlight();
      initTooltips();

      updateAllFieldStates();
      updateProgress();
      updateChecklistProgress();
      updateTitleCounters();
    } catch (error) {
      console.error("Erro ao inicializar a aplicação:", error);
    }
  });
})();
