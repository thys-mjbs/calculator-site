document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const portfolioValue = document.getElementById("portfolioValue");

  const asset1Name = document.getElementById("asset1Name");
  const asset1Current = document.getElementById("asset1Current");
  const asset1Target = document.getElementById("asset1Target");

  const asset2Name = document.getElementById("asset2Name");
  const asset2Current = document.getElementById("asset2Current");
  const asset2Target = document.getElementById("asset2Target");

  const asset3Name = document.getElementById("asset3Name");
  const asset3Current = document.getElementById("asset3Current");
  const asset3Target = document.getElementById("asset3Target");

  const transactionCostPct = document.getElementById("transactionCostPct");
  const sellTaxPct = document.getElementById("sellTaxPct");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Add every input that should live-format with commas
  attachLiveFormatting(portfolioValue);

  // ------------------------------------------------------------
  // 3) RESULT HELPERS (CONSISTENT)
  // ------------------------------------------------------------
  function setResultError(message) {
    if (!resultDiv) return;
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = message;
  }

  function setResultSuccess(html) {
    if (!resultDiv) return;
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function clearResult() {
    if (!resultDiv) return;
    resultDiv.classList.remove("error", "success");
    resultDiv.textContent = "";
  }

  // ------------------------------------------------------------
  // 4) OPTIONAL MODE HANDLING (ONLY IF USED)
  // ------------------------------------------------------------
  function showMode(mode) {
    clearResult();
  }

  // ------------------------------------------------------------
  // 5) VALIDATION HELPERS (OPTIONAL)
  // ------------------------------------------------------------
  function validatePositive(value, fieldLabel) {
    if (!Number.isFinite(value) || value <= 0) {
      setResultError("Enter a valid " + fieldLabel + " greater than 0.");
      return false;
    }
    return true;
  }

  function validateNonNegative(value, fieldLabel) {
    if (!Number.isFinite(value) || value < 0) {
      setResultError("Enter a valid " + fieldLabel + " (0 or higher).");
      return false;
    }
    return true;
  }

  function safeText(v, fallback) {
    const s = (v || "").toString().trim();
    return s.length ? s : fallback;
  }

  function toPercentDecimal(pctValue) {
    if (!Number.isFinite(pctValue)) return 0;
    return pctValue / 100;
  }

  function buildAssets() {
    const a1n = safeText(asset1Name ? asset1Name.value : "", "Asset 1");
    const a2n = safeText(asset2Name ? asset2Name.value : "", "Asset 2");
    const a3n = safeText(asset3Name ? asset3Name.value : "", "Asset 3");

    const a1c = toNumber(asset1Current ? asset1Current.value : "");
    const a1t = toNumber(asset1Target ? asset1Target.value : "");
    const a2c = toNumber(asset2Current ? asset2Current.value : "");
    const a2t = toNumber(asset2Target ? asset2Target.value : "");
    const a3c = toNumber(asset3Current ? asset3Current.value : "");
    const a3t = toNumber(asset3Target ? asset3Target.value : "");

    return [
      { name: a1n, currentPct: a1c, targetPct: a1t },
      { name: a2n, currentPct: a2c, targetPct: a2t },
      { name: a3n, currentPct: a3c, targetPct: a3t }
    ];
  }

  function normalizePercents(pcts) {
    const sum = pcts.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
    if (!Number.isFinite(sum) || sum <= 0) return { sum: 0, normalized: pcts.map(() => 0) };
    return { sum, normalized: pcts.map((v) => (Number.isFinite(v) && v >= 0 ? (v / sum) : 0)) };
  }

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const pv = toNumber(portfolioValue ? portfolioValue.value : "");

      const txCostPct = toNumber(transactionCostPct ? transactionCostPct.value : "");
      const sellTax = toNumber(sellTaxPct ? sellTaxPct.value : "");

      const assets = buildAssets();

      if (!portfolioValue || !asset1Current || !asset1Target || !asset2Current || !asset2Target) return;

      if (!validatePositive(pv, "portfolio value")) return;

      for (let i = 0; i < assets.length; i++) {
        const c = assets[i].currentPct;
        const t = assets[i].targetPct;

        if (Number.isFinite(c) && c < 0) {
          setResultError("Current allocation (%) cannot be negative for " + assets[i].name + ".");
          return;
        }
        if (Number.isFinite(t) && t < 0) {
          setResultError("Target allocation (%) cannot be negative for " + assets[i].name + ".");
          return;
        }
      }

      if (!validateNonNegative(txCostPct, "transaction cost (%)")) return;
      if (!validateNonNegative(sellTax, "tax on sells (%)")) return;

      const currentPcts = assets.map((a) => (Number.isFinite(a.currentPct) ? a.currentPct : 0));
      const targetPcts = assets.map((a) => (Number.isFinite(a.targetPct) ? a.targetPct : 0));

      const currentNorm = normalizePercents(currentPcts);
      const targetNorm = normalizePercents(targetPcts);

      if (currentNorm.sum <= 0) {
        setResultError("Enter at least one current allocation percentage greater than 0.");
        return;
      }
      if (targetNorm.sum <= 0) {
        setResultError("Enter at least one target allocation percentage greater than 0.");
        return;
      }

      const rows = [];
      let totalBuys = 0;
      let totalSells = 0;

      for (let i = 0; i < assets.length; i++) {
        const currentShare = currentNorm.normalized[i];
        const targetShare = targetNorm.normalized[i];

        const currentValue = pv * currentShare;
        const targetValue = pv * targetShare;
        const trade = targetValue - currentValue;

        const buy = trade > 0 ? trade : 0;
        const sell = trade < 0 ? Math.abs(trade) : 0;

        totalBuys += buy;
        totalSells += sell;

        const driftPctPoints = (targetShare - currentShare) * 100;

        rows.push({
          name: assets[i].name,
          currentPctShown: currentShare * 100,
          targetPctShown: targetShare * 100,
          currentValue,
          targetValue,
          trade,
          driftPctPoints
        });
      }

      const imbalance = totalBuys - totalSells;
      const turnover = pv > 0 ? (totalBuys + totalSells) / pv : 0;

      const txRate = toPercentDecimal(txCostPct);
      const taxRate = toPercentDecimal(sellTax);

      const estTransactionCost = (totalBuys + totalSells) * txRate;
      const estSellTax = totalSells * taxRate;
      const estTotalFriction = estTransactionCost + estSellTax;

      const didNormalizeCurrent = Math.abs(currentNorm.sum - 100) > 0.01;
      const didNormalizeTarget = Math.abs(targetNorm.sum - 100) > 0.01;

      const notes = [];
      if (didNormalizeCurrent) notes.push("Current allocations were normalized (your inputs summed to " + formatNumberTwoDecimals(currentNorm.sum) + "%).");
      if (didNormalizeTarget) notes.push("Target allocations were normalized (your inputs summed to " + formatNumberTwoDecimals(targetNorm.sum) + "%).");

      const notesHtml = notes.length
        ? `<p class="result-pill">${notes.join(" ")}</p>`
        : "";

      const tableRowsHtml = rows
        .map((r) => {
          const tradeLabel = r.trade >= 0 ? "Buy" : "Sell";
          const tradeAbs = Math.abs(r.trade);
          return `
            <tr>
              <td>${r.name}</td>
              <td>${formatNumberTwoDecimals(r.currentPctShown)}%</td>
              <td>${formatNumberTwoDecimals(r.targetPctShown)}%</td>
              <td>${formatNumberTwoDecimals(r.driftPctPoints)} pp</td>
              <td>${formatNumberTwoDecimals(r.currentValue)}</td>
              <td>${formatNumberTwoDecimals(r.targetValue)}</td>
              <td><strong>${tradeLabel}</strong> ${formatNumberTwoDecimals(tradeAbs)}</td>
            </tr>
          `;
        })
        .join("");

      const resultHtml = `
        <div class="result-summary">
          ${notesHtml}
          <p><strong>Total buys:</strong> ${formatNumberTwoDecimals(totalBuys)}</p>
          <p><strong>Total sells:</strong> ${formatNumberTwoDecimals(totalSells)}</p>
          <p><strong>Turnover (buys + sells ÷ portfolio):</strong> ${formatNumberTwoDecimals(turnover * 100)}%</p>
          <p><strong>Estimated transaction cost:</strong> ${formatNumberTwoDecimals(estTransactionCost)} (at ${formatNumberTwoDecimals(txCostPct)}%)</p>
          <p><strong>Estimated tax on sells:</strong> ${formatNumberTwoDecimals(estSellTax)} (at ${formatNumberTwoDecimals(sellTax)}%)</p>
          <p><strong>Estimated total friction:</strong> ${formatNumberTwoDecimals(estTotalFriction)}</p>
          <p><strong>Buy/Sell imbalance (rounding effect):</strong> ${formatNumberTwoDecimals(imbalance)}</p>
        </div>

        <div class="result-table-wrap" aria-label="Scrollable table container">
          <table class="result-table" aria-label="Rebalancing trade plan">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Current</th>
                <th>Target</th>
                <th>Drift</th>
                <th>Current value</th>
                <th>Target value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>
      `;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Rebalancing Impact Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
