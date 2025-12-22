document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  // 1) ELEMENT BINDINGS (REPLACE IDS PER CALCULATOR)
  // ------------------------------------------------------------

  // Required base elements (consistent across all calculators)
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");
  const shareButton = document.getElementById("shareWhatsAppButton");

  // Calculator-specific input elements
  const numbersInput = document.getElementById("numbersInput");

  // Optional: mode selector + grouped input blocks (only if calculator needs modes)
  // (not used in this calculator)

  // ------------------------------------------------------------
  // 2) LIVE FORMATTING (OPTIONAL)
  // ------------------------------------------------------------
  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      inputEl.value = formatInputWithCommas(inputEl.value);
    });
  }

  // Not applied here because users enter comma-separated lists.
  // Applying comma-formatting live would interfere with list parsing.

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

  // ------------------------------------------------------------
  // 6) MAIN CALCULATE HANDLER (CALCULATOR-SPECIFIC)
  // ------------------------------------------------------------
  function gcdTwo(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x;
  }

  function lcmTwo(a, b) {
    const g = gcdTwo(a, b);
    if (g === 0) return 0;
    const candidate = (a / g) * b;
    return Math.abs(candidate);
  }

  function gcdMany(nums) {
    let g = nums[0];
    for (let i = 1; i < nums.length; i++) {
      g = gcdTwo(g, nums[i]);
      if (g === 1) return 1;
    }
    return g;
  }

  function lcmMany(nums) {
    let l = nums[0];
    for (let i = 1; i < nums.length; i++) {
      l = lcmTwo(l, nums[i]);
      if (!Number.isSafeInteger(l)) return NaN;
    }
    return l;
  }

  function parseIntegerList(raw) {
    const cleaned = String(raw || "").trim();
    if (!cleaned) return { nums: [], error: "Enter at least two whole numbers, separated by commas (example: 12, 18, 30)." };

    const parts = cleaned
      .split(/[,\s]+/g)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length < 2) {
      return { nums: [], error: "Enter at least two whole numbers (example: 12, 18)." };
    }

    const nums = [];
    for (let i = 0; i < parts.length; i++) {
      const n = toNumber(parts[i]);
      if (!Number.isFinite(n)) {
        return { nums: [], error: "One of your entries is not a valid number. Use whole numbers only." };
      }
      if (!Number.isInteger(n)) {
        return { nums: [], error: "Whole numbers only. Remove decimals and try again." };
      }
      if (!validatePositive(n, "number")) return { nums: [], error: "" };
      if (!Number.isSafeInteger(n)) {
        return { nums: [], error: "Numbers are too large for reliable calculation in this browser. Use smaller integers." };
      }
      nums.push(n);
    }

    return { nums, error: "" };
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      clearResult();

      if (!numbersInput) return;

      const parsed = parseIntegerList(numbersInput.value);
      if (parsed.error) {
        setResultError(parsed.error);
        return;
      }

      const nums = parsed.nums;

      const lcm = lcmMany(nums);
      if (!Number.isFinite(lcm) || !Number.isSafeInteger(lcm) || lcm <= 0) {
        setResultError("The LCM result is too large to calculate safely with these inputs. Try fewer numbers or smaller values.");
        return;
      }

      const g = gcdMany(nums);

      const cleanedList = nums.join(", ");
      const count = nums.length;

      const resultHtml =
        `<p><strong>Least common multiple (LCM):</strong> ${formatInputWithCommas(String(lcm))}</p>` +
        `<p><strong>Numbers used:</strong> ${cleanedList}</p>` +
        `<p><strong>Count:</strong> ${formatInputWithCommas(String(count))}</p>` +
        `<p><strong>Greatest common divisor (GCD):</strong> ${formatInputWithCommas(String(g))}</p>`;

      setResultSuccess(resultHtml);
    });
  }

  // ------------------------------------------------------------
  // 7) WHATSAPP SHARE (CONSISTENT)
  // ------------------------------------------------------------
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Least Common Multiple Calculator - check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
