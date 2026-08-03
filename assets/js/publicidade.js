/* =========================================================
   Publicidade — Procedimentos, Custos e Estratégias
   Lógica independente da Fase 1 (chave própria de armazenamento)
   ========================================================= */
"use strict";

(function () {
  const STORAGE_KEY = "pi-ecommerce-publicidade-v1";
  const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

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
     Persistência local (apenas os campos "Sua vez" desta página)
     ========================================================= */

  function savableFields() {
    return Array.from(document.querySelectorAll("[data-save]"));
  }

  function readStorage() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("Não foi possível ler o armazenamento local.", error);
      return {};
    }
  }

  function saveAllFields() {
    const data = readStorage();
    savableFields().forEach((field) => {
      const key = field.dataset.save;
      if (!key) return;
      if (field.type === "checkbox") {
        data[key] = field.checked;
      } else if (field.type === "radio") {
        if (field.checked) data[key] = field.value;
      } else {
        data[key] = field.value;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function saveField(field) {
    const key = field.dataset.save;
    if (!key) return;
    const data = readStorage();
    if (field.type === "checkbox") {
      data[key] = field.checked;
    } else if (field.type === "radio") {
      if (field.checked) data[key] = field.value;
    } else {
      data[key] = field.value;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function restoreFields() {
    const data = readStorage();
    savableFields().forEach((field) => {
      const key = field.dataset.save;
      if (!key || !(key in data)) return;
      if (field.type === "checkbox") {
        field.checked = Boolean(data[key]);
      } else if (field.type === "radio") {
        field.checked = field.value === data[key];
      } else {
        field.value = data[key];
      }
    });
  }

  function attachFieldEvents() {
    savableFields().forEach((field) => {
      const eventName = field.tagName === "SELECT" || field.type === "checkbox" || field.type === "radio" ? "change" : "input";
      field.addEventListener(eventName, () => saveField(field));
    });
  }

  function exportAnswers() {
    saveAllFields();
    const data = readStorage();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `publicidade-respostas-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Respostas de publicidade exportadas em JSON.");
  }

  function attachUtilityButtons() {
    document.querySelectorAll("[data-save-now]").forEach((btn) => {
      btn.addEventListener("click", () => {
        saveAllFields();
        showToast("Respostas salvas neste navegador.");
      });
    });
    document.querySelectorAll("[data-export-ads]").forEach((btn) => {
      btn.addEventListener("click", exportAnswers);
    });
    document.querySelectorAll("[data-print-page]").forEach((btn) => {
      btn.addEventListener("click", () => window.print());
    });
  }

  /* =========================================================
     Calculadora 1 — Orçamento diário e distribuição por funil
     ========================================================= */

  function calculateBudgetSplit() {
    const total = getNum("budgetTotal");
    const days = getNum("budgetDays");
    const topo = getNum("budgetTopo");
    const meio = getNum("budgetMeio");
    const fundo = getNum("budgetFundo");

    const daily = days > 0 ? total / days : NaN;
    setText("budgetDailyResult", Number.isFinite(daily) ? formatCurrency(daily) : "—");

    const soma = (Number.isFinite(topo) ? topo : 0) + (Number.isFinite(meio) ? meio : 0) + (Number.isFinite(fundo) ? fundo : 0);
    const alert = document.getElementById("budgetSplitAlert");

    if (!Number.isFinite(total) || total <= 0) {
      setResultBox("budgetSplitResult", "Informe um orçamento total maior que zero.", "warning");
      return;
    }

    if (Math.round(soma) !== 100) {
      if (alert) {
        alert.classList.remove("d-none");
        alert.textContent = `A soma dos percentuais está em ${formatNumber(soma, 0)}%. Ajuste topo, meio e fundo de funil para somar 100%.`;
      }
      setResultBox("budgetSplitResult", "Ajuste os percentuais de funil para somar 100% antes de ver a divisão da verba.", "warning");
      return;
    }

    if (alert) alert.classList.add("d-none");

    const topoValor = total * (topo / 100);
    const meioValor = total * (meio / 100);
    const fundoValor = total * (fundo / 100);

    setResultBox(
      "budgetSplitResult",
      `Topo de funil: ${formatCurrency(topoValor)} · Meio de funil: ${formatCurrency(meioValor)} · Fundo de funil: ${formatCurrency(fundoValor)}`,
      "success"
    );
  }

  function attachBudgetSplit() {
    const button = document.getElementById("calcBudgetSplit");
    if (button) button.addEventListener("click", calculateBudgetSplit);
  }

  /* =========================================================
     Calculadora 2 — CPM, CPC e CPA (estrutura de custo do anúncio)
     ========================================================= */

  function calculateAdCosts() {
    const investment = getNum("adInvestment");
    const impressions = getNum("adImpressions");
    const clicks = getNum("adClicks");
    const conversions = getNum("adConversions");

    const cpm = impressions > 0 ? (investment / impressions) * 1000 : NaN;
    const cpc = clicks > 0 ? investment / clicks : NaN;
    const cpa = conversions > 0 ? investment / conversions : NaN;

    const rows = [
      ["CPM (custo por mil impressões)", "(investimento ÷ impressões) × 1000", `(${formatCurrency(investment)} ÷ ${formatNumber(impressions, 0)}) × 1000`, formatCurrency(cpm), "quanto custa, em média, mostrar o anúncio 1.000 vezes."],
      ["CPC (custo por clique)", "investimento ÷ cliques", `${formatCurrency(investment)} ÷ ${formatNumber(clicks, 0)}`, formatCurrency(cpc), "quanto custa, em média, cada clique no anúncio."],
      ["CPA (custo por ação/pedido)", "investimento ÷ conversões", `${formatCurrency(investment)} ÷ ${formatNumber(conversions, 0)}`, formatCurrency(cpa), "quanto custou, em média, cada pedido gerado por este anúncio."],
    ];

    const out = document.getElementById("adCostSteps");
    if (!out) return;

    out.innerHTML = rows
      .map(
        ([name, formula, sub, value, interpretation]) => `
        <div class="calc-row d-block py-2">
          <div class="d-flex justify-content-between flex-wrap">
            <strong>${name}</strong><span>${value}</span>
          </div>
          <div class="text-muted small">Fórmula: ${formula} → ${sub}</div>
          <div class="text-muted small fst-italic">Leitura: ${interpretation}</div>
        </div>`
      )
      .join("");
  }

  function attachAdCosts() {
    const button = document.getElementById("calcAdCosts");
    if (button) button.addEventListener("click", calculateAdCosts);
  }

  /* =========================================================
     Calculadora 2b — Alcance, frequência e engajamento
     ========================================================= */

  function calculateEngagement() {
    const impressions = getNum("erImpressions");
    const reach = getNum("erReach");
    const interactions = getNum("erInteractions");
    const videoViews = getNum("erVideoViews");

    const frequency = reach > 0 ? impressions / reach : NaN;
    const engagementRate = impressions > 0 ? (interactions / impressions) * 100 : NaN;
    const hookRate = impressions > 0 ? (videoViews / impressions) * 100 : NaN;

    const rows = [
      ["Frequência", "impressões ÷ alcance", `${formatNumber(impressions, 0)} ÷ ${formatNumber(reach, 0)}`, Number.isFinite(frequency) ? `${formatNumber(frequency, 2)}x` : "—", "quantas vezes, em média, a mesma pessoa viu o anúncio. Frequência muito alta pode indicar fadiga de criativo."],
      ["Taxa de engajamento", "interações ÷ impressões × 100", `${formatNumber(interactions, 0)} ÷ ${formatNumber(impressions, 0)} × 100`, formatPercent(engagementRate), "% de quem viu o anúncio e reagiu, comentou, compartilhou ou salvou."],
      ["Hook rate (retenção inicial)", "visualizações em 3s ÷ impressões × 100", `${formatNumber(videoViews, 0)} ÷ ${formatNumber(impressions, 0)} × 100`, formatPercent(hookRate), "% de quem parou para assistir os primeiros segundos do vídeo — mede se o criativo prende atenção."],
    ];

    const out = document.getElementById("engagementSteps");
    if (!out) return;
    out.innerHTML = rows
      .map(
        ([name, formula, sub, value, interpretation]) => `
        <div class="calc-row d-block py-2">
          <div class="d-flex justify-content-between flex-wrap">
            <strong>${name}</strong><span>${value}</span>
          </div>
          <div class="text-muted small">Fórmula: ${formula} → ${sub}</div>
          <div class="text-muted small fst-italic">Leitura: ${interpretation}</div>
        </div>`
      )
      .join("");
  }

  function attachEngagement() {
    const button = document.getElementById("calcEngagement");
    if (button) button.addEventListener("click", calculateEngagement);
  }

  /* =========================================================
     Calculadora 2c — LTV, razão LTV:CAC e payback por cliente
     ========================================================= */

  function calculateLTV() {
    const ticket = getNum("ltvTicket");
    const margin = getNum("ltvMargin") / 100;
    const purchases = getNum("ltvPurchases");
    const cac = getNum("ltvCAC");

    const contributionPerOrder = Number.isFinite(ticket) && Number.isFinite(margin) ? ticket * margin : NaN;
    const ltv = Number.isFinite(contributionPerOrder) && Number.isFinite(purchases) ? contributionPerOrder * purchases : NaN;
    const ratio = Number.isFinite(ltv) && Number.isFinite(cac) && cac > 0 ? ltv / cac : NaN;
    const paybackOrders = Number.isFinite(contributionPerOrder) && contributionPerOrder > 0 && Number.isFinite(cac) ? cac / contributionPerOrder : NaN;

    const out = document.getElementById("ltvSteps");
    if (out) {
      const rows = [
        ["Contribuição por pedido", "ticket médio × margem de contribuição", `${formatCurrency(ticket)} × ${formatPercent(margin * 100, 0)}`, formatCurrency(contributionPerOrder)],
        ["LTV (valor do cliente ao longo do tempo)", "contribuição por pedido × nº médio de compras", `${formatCurrency(contributionPerOrder)} × ${formatNumber(purchases, 1)}`, formatCurrency(ltv)],
        ["Razão LTV:CAC", "LTV ÷ CAC", `${formatCurrency(ltv)} ÷ ${formatCurrency(cac)}`, Number.isFinite(ratio) ? `${formatNumber(ratio, 2)} : 1` : "—"],
        ["Payback por cliente", "CAC ÷ contribuição por pedido", `${formatCurrency(cac)} ÷ ${formatCurrency(contributionPerOrder)}`, Number.isFinite(paybackOrders) ? `${formatNumber(Math.ceil(paybackOrders), 0)} pedido(s)` : "—"],
      ];
      out.innerHTML = rows
        .map(([name, formula, sub, value]) => `
        <div class="calc-row d-block py-2">
          <div class="d-flex justify-content-between flex-wrap">
            <strong>${name}</strong><span>${value}</span>
          </div>
          <div class="text-muted small">Fórmula: ${formula} → ${sub}</div>
        </div>`)
        .join("");
    }

    setResultBox(
      "ltvResult",
      Number.isFinite(ratio)
        ? `Para cada R$ 1,00 investido em adquirir um cliente, o retorno estimado ao longo do relacionamento é de ${formatNumber(ratio, 2)} vezes. Compare essa razão com a meta e o prazo de caixa da sua equipe antes de decidir — não existe um número "correto" universal.`
        : "Preencha ticket médio, margem, número médio de compras e CAC para calcular.",
      Number.isFinite(ratio) ? "success" : "warning"
    );
  }

  function attachLTV() {
    const button = document.getElementById("calcLTV");
    if (button) button.addEventListener("click", calculateLTV);
  }

  /* =========================================================
     Calculadora 3 — Verba necessária para bater uma meta de pedidos
     ========================================================= */

  function calculateGoalBudget() {
    const goalOrders = getNum("goalOrders");
    const goalCAC = getNum("goalCAC");
    const budget = Number.isFinite(goalOrders) && Number.isFinite(goalCAC) ? goalOrders * goalCAC : NaN;

    setResultBox(
      "goalBudgetResult",
      Number.isFinite(budget)
        ? `Verba necessária: ${formatCurrency(budget)} (${formatNumber(goalOrders, 0)} pedidos × ${formatCurrency(goalCAC)} de CAC alvo).`
        : "Informe a meta de pedidos e o CAC alvo.",
      Number.isFinite(budget) ? "success" : "warning"
    );
  }

  function attachGoalBudget() {
    const button = document.getElementById("calcGoalBudget");
    if (button) button.addEventListener("click", calculateGoalBudget);
  }

  /* =========================================================
     Calculadora 4 — Ponto de equilíbrio do anúncio
     ========================================================= */

  function calculateBreakeven() {
    const investment = getNum("beInvestment");
    const contribution = getNum("beContribution");

    if (!Number.isFinite(investment) || !Number.isFinite(contribution) || contribution <= 0) {
      setResultBox("breakevenResult", "Informe o investimento em mídia e uma contribuição unitária maior que zero. A contribuição unitária vem da Etapa 7 (preço − custos − comissão).", "warning");
      return;
    }

    const minSales = investment / contribution;
    setResultBox(
      "breakevenResult",
      `Vendas mínimas para empatar o investimento: ${formatNumber(Math.ceil(minSales), 0)} unidades (${formatCurrency(investment)} ÷ ${formatCurrency(contribution)} de contribuição unitária). Acima disso, o anúncio começa a contribuir com o resultado.`,
      "success"
    );
  }

  function attachBreakeven() {
    const button = document.getElementById("calcBreakeven");
    if (button) button.addEventListener("click", calculateBreakeven);
  }

  /* =========================================================
     Calculadora 5 — Escala segura de orçamento
     ========================================================= */

  function calculateScale() {
    const current = getNum("scaleCurrent");
    const percent = getNum("scalePercent");

    if (!Number.isFinite(current) || !Number.isFinite(percent)) {
      setResultBox("scaleResult", "Informe o orçamento atual e o percentual de aumento pretendido.", "warning");
      return;
    }

    const newBudget = current * (1 + percent / 100);
    const isRisky = percent > 30;

    setResultBox(
      "scaleResult",
      `Novo orçamento sugerido: ${formatCurrency(newBudget)} (aumento de ${formatPercent(percent, 0)} sobre ${formatCurrency(current)}).${
        isRisky ? " Atenção: aumentos acima de 30% de uma vez podem reiniciar o aprendizado da plataforma e piorar o desempenho por alguns dias." : ""
      }`,
      isRisky ? "warning" : "success"
    );
  }

  function attachScale() {
    const button = document.getElementById("calcScale");
    if (button) button.addEventListener("click", calculateScale);
  }

  /* =========================================================
     Navegação: destaque do item ativo no mini-sumário
     ========================================================= */

  function attachTocHighlight() {
    const links = Array.from(document.querySelectorAll(".mini-toc .nav-link"));
    if (!links.length) return;
    const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = document.querySelector(`.mini-toc [href="#${entry.target.id}"]`);
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
     Toasts
     ========================================================= */

  function showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toastEl = document.createElement("div");
    toastEl.className = "toast align-items-center text-bg-success border-0";
    toastEl.setAttribute("role", "alert");
    toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button></div>`;
    container.appendChild(toastEl);
    if (window.bootstrap) {
      const toast = new window.bootstrap.Toast(toastEl, { delay: 4000 });
      toast.show();
      toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    } else {
      setTimeout(() => toastEl.remove(), 4000);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      restoreFields();
      attachFieldEvents();
      attachUtilityButtons();
      attachBudgetSplit();
      attachAdCosts();
      attachEngagement();
      attachLTV();
      attachGoalBudget();
      attachBreakeven();
      attachScale();
      attachTocHighlight();
    } catch (error) {
      console.error("Erro ao inicializar a página de publicidade:", error);
    }
  });
})();
