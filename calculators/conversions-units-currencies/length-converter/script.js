document.addEventListener("DOMContentLoaded", function () {
  const inputValue = document.getElementById("inputValue");
  const fromUnit = document.getElementById("fromUnit");
  const toUnit = document.getElementById("toUnit");
  const button = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  function formatSmartNumber(num) {
    const abs = Math.abs(num);
    if (!isFinite(num)) return "";

    if (abs === 0) return "0";
    if (abs < 1) return num.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    if (abs < 1000) return num.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
    return formatNumberTwoDecimals(num);
  }

  function unitLabel(code) {
    const map = {
      m: "m",
      km: "km",
      cm: "cm",
      mm: "mm",
      in: "in",
      ft: "ft",
      yd: "yd",
      mi: "mi"
    };
    return map[code] || code;
  }

  function safeText(s) {
    return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  attachLiveFormatting(inputValue);

  if (button) {
    button.addEventListener("click", function () {
      if (!resultDiv) return;

      const raw = inputValue ? inputValue.value : "";
      const value = toNumber(raw);

      const from = fromUnit ? fromUnit.value : "";
      const to = toUnit ? toUnit.value : "";

      resultDiv.classList.remove("error", "success");

      if (!isFinite(value)) {
        resultDiv.classList.add("error");
        resultDiv.textContent = "Enter a valid number to convert.";
        return;
      }

      if (!from || !to) {
        resultDiv.classList.add("error");
        resultDiv.textContent = "Select both units before converting.";
        return;
      }

      const toMetersFactor = {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        in: 0.0254,
        ft: 0.3048,
        yd: 0.9144,
        mi: 1609.344
      };

      const fromFactor = toMetersFactor[from];
      const toFactor = toMetersFactor[to];

      if (!fromFactor || !toFactor) {
        resultDiv.classList.add("error");
        resultDiv.textContent = "Unsupported unit selection.";
        return;
      }

      const meters = value * fromFactor;
      const converted = meters / toFactor;

      const prettyInput = formatInputWithCommas(String(value));
      const fromLbl = unitLabel(from);
      const toLbl = unitLabel(to);
      const prettyConverted = formatSmartNumber(converted);

      resultDiv.classList.add("success");
      resultDiv.innerHTML =
        "<div><strong>Result:</strong> " +
        safeText(prettyConverted) +
        " " +
        safeText(toLbl) +
        "</div>" +
        "<div style=\"margin-top:6px; font-size:13px; color:#555555;\">" +
        safeText(prettyInput) +
        " " +
        safeText(fromLbl) +
        " converted to " +
        safeText(toLbl) +
        "</div>";
    });
  }

  const shareButton = document.getElementById("shareWhatsAppButton");
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Length Converter – check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
