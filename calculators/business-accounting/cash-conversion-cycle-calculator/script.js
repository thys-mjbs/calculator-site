document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const modeSelect = document.getElementById("modeSelect");

  const modeBlockDays = document.getElementById("modeBlockDays");
  const modeBlockFinancials = document.getElementById("modeBlockFinancials");

  const dioDaysInput = document.getElementById("dioDays");
  const dsoDaysInput = document.getElementById("dsoDays");
  const dpoDaysInput = document.getElementById("dpoDays");

  const periodDaysInput = document.getElementById("periodDays");
  const avgInventoryInput = document.getElementById("avgInventory");
  const avgReceivablesInput = document.getElementById("avgReceivables");
  const avgPayablesInput = document.getElementById("avgPayables");
  const revenueInput = document.getElementById("revenue");
  const cogsInput = document.getElementById("cogs");

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Attach formatting
  attachLiveFormatting(dioDaysInput);
  attachLiveFormatting(dsoDaysInput);
  attachLiveFormatting(dpoDaysInput);

  attachLiveFormatting(periodDaysInput);
  attachLiveFormatting(avgInventoryInput);
  attachLiveFormatting(avgReceivablesInput);
  attachLiveFormatting(avgPayablesInput);
  attachLiveFormatting(revenueInput);
  attachLiveFormatting(cogsInput);

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
    if (modeBlockDays) modeBlockDays.classList.add("hidden");
    if (modeBlockFinancials) modeBlockFinancials.classList.add("hidden");

    if (mode === "financials") {
      if (modeBlockFinancials) modeBlockFinancials.classList.remove("hidden");
    } else {
      if (modeBlockDays) modeBlockDays.classList.remove("hidden");
    }

    clearResult();
  }

  if (modeSelect) {
    showMode(modeSelect.value);
    modeSelect.addEventListener("change", function () {
      showMode(modeSelect.value);
    });
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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      const mode = modeSelect ? modeSelect.value : "days";

      let dio = NaN;
      let dso = NaN;
      let dpo = NaN;

      let periodDays = NaN;
      let avgInventory = NaN;
      let avgReceivables = NaN;
      let avgPayables = NaN;
      let revenue = NaN;
      let cogs = NaN;

      if (mode === "financials") {
        periodDays = toNumber(periodDaysInput ? periodDaysInput.value : "");
        avgInventory = toNumber(avgInventoryInput ? avgInventoryInput.value : "");
        avgReceivables = toNumber(avgReceivablesInput ? avgReceivablesInput.value : "");
        avgPayables = toNumber(avgPayablesInput ? avgPayablesInput.value : "");
        revenue = toNumber(revenueInput ? revenueInput.value : "");
        cogs = toNumber(cogsInput ? cogsInput.value : "");

        if (!validatePositive(periodDays, "period length (days)")) return;
        if (!validateNonNegative(avgInventory, "average inventory")) return;
        if (!validateNonNegative(avgReceivables, "average receivables")) return;
        if (!validateNonNegative(avgPayables, "average payables")) return;
        if (!validatePositive(revenue, "revenue")) return;
        if (!validatePositive(cogs, "COGS")) return;

        dio = (avgInventory / cogs) * periodDays;
        dso = (avgReceivables / revenue) * periodDays;
        dpo = (avgPayables / cogs) * periodDays;
      } else {
        dio = toNumber(dioDaysInput ? dioDaysInput.value : "");
        dso = toNumber(dsoDaysInput ? dsoDaysInput.value : "");
        dpo = toNumber(dpoDaysInput ? dpoDaysInput.value : "");

        if (!validateNonNegative(dio, "DIO")) return;
        if (!validateNonNegative(dso, "DSO")) return;
        if (!validateNonNegative(dpo, "DPO")) return;
      }

      if (!Number.isFinite(dio) || !Number.isFinite(dso) || !Number.isFinite(dpo)) {
        setResultError("Enter valid numbers for DIO, DSO, and DPO.");
        return;
      }

      const ccc = dio + dso - dpo;

      let interpretation = "";
      if (ccc < 0) {
        interpretation = "Negative CCC means you are collecting cash faster than you pay suppliers. This can reduce working capital pressure, but supplier terms can change.";
      } else if (ccc === 0) {
        interpretation = "A CCC near zero means cash conversion is fast. You are roughly collecting cash around the same time you pay suppliers.";
      } else if (ccc <= 30) {
        interpretation = "A lower CCC usually means cash returns quickly. This is often a sign of efficient inventory and collections, or strong supplier terms.";
      } else if (ccc <= 90) {
        interpretation = "A moderate CCC suggests cash is tied up for several weeks. Improvements typically come from faster collections, tighter stock, or better supplier terms.";
      } else {
        interpretation = "A high CCC means cash is tied up for a long time. Growth can increase funding needs unless you shorten inventory time, speed collections, or extend payables.";
      }

      let componentNote = "";
      if (dio > dso && dio > dpo) componentNote = "Inventory time (DIO) is the largest component in your cycle.";
      if (dso >= dio && dso > dpo) componentNote = "Collections time (DSO) is the largest component in your cycle.";
      if (dpo >= dio && dpo >= dso) componentNote = "Payables time (DPO) is offsetting more of the cycle, which shortens CCC.";

      // Optional cash impact estimate (only meaningful if user used financials mode)
      let cashImpactHtml = "";
      if (mode === "financials" && Number.isFinite(revenue) && revenue > 0 && Number.isFinite(cogs) && cogs > 0 && Number.isFinite(periodDays) && periodDays > 0) {
        const dailyRevenue = revenue / periodDays;
        const dailyCogs = cogs / periodDays;

        // Simple proxy: daily COGS ties up inventory and payables, daily revenue ties up receivables
        const approxCashTied = (dailyCogs * dio) + (dailyRevenue * dso) - (dailyCogs * dpo);

        cashImpactHtml =
          `<p><strong>Approximate cash tied up:</strong> ${formatNumberTwoDecimals(approxCashTied)}</p>` +
          `<p>This is a rough working-capital proxy using daily averages. Use it for directional insight, not as a cash flow statement.</p>`;
      }

      const resultHtml =
        `<p><strong>Cash conversion cycle (CCC):</strong> ${formatNumberTwoDecimals(ccc)} days</p>` +
        `<p><strong>Breakdown:</strong> DIO ${formatNumberTwoDecimals(dio)} + DSO ${formatNumberTwoDecimals(dso)} − DPO ${formatNumberTwoDecimals(dpo)}</p>` +
        (componentNote ? `<p><strong>Quick insight:</strong> ${componentNote}</p>` : ``) +
        `<p><strong>What it means:</strong> ${interpretation}</p>` +
        cashImpactHtml;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Cash Conversion Cycle Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
