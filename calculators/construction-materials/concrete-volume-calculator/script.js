document.addEventListener("DOMContentLoaded", function () {
  const unitSelect = document.getElementById("unitSelect");
  const shapeSelect = document.getElementById("shapeSelect");
  const calculateButton = document.getElementById("calculateButton");
  const resultDiv = document.getElementById("result");

  const panels = Array.from(document.querySelectorAll(".shape-panel"));

  const inputsByShape = {
    slab: [
      document.getElementById("slabLength"),
      document.getElementById("slabWidth"),
      document.getElementById("slabThickness")
    ],
    footing: [
      document.getElementById("footingLength"),
      document.getElementById("footingWidth"),
      document.getElementById("footingDepth")
    ],
    wall: [
      document.getElementById("wallLength"),
      document.getElementById("wallHeight"),
      document.getElementById("wallThickness")
    ],
    cylinder: [
      document.getElementById("cylDiameter"),
      document.getElementById("cylHeight")
    ],
    circular: [
      document.getElementById("circDiameter"),
      document.getElementById("circThickness")
    ]
  };

  function attachLiveFormatting(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("input", function () {
      const formatted = formatInputWithCommas(inputEl.value);
      inputEl.value = formatted;
    });
  }

  Object.keys(inputsByShape).forEach(function (shape) {
    inputsByShape[shape].forEach(function (el) {
      attachLiveFormatting(el);
    });
  });

  function getUnitToMetersFactor(unit) {
    if (unit === "m") return 1;
    if (unit === "cm") return 0.01;
    if (unit === "mm") return 0.001;
    if (unit === "ft") return 0.3048;
    if (unit === "in") return 0.0254;
    return 1;
  }

  function showShapePanel(shape) {
    panels.forEach(function (panel) {
      const panelShape = panel.getAttribute("data-shape");
      panel.hidden = panelShape !== shape;
    });
  }

  function clearResult() {
    resultDiv.classList.remove("error");
    resultDiv.classList.remove("success");
    resultDiv.textContent = "";
  }

  function setError(msg) {
    resultDiv.classList.remove("success");
    resultDiv.classList.add("error");
    resultDiv.textContent = msg;
  }

  function setSuccess(html) {
    resultDiv.classList.remove("error");
    resultDiv.classList.add("success");
    resultDiv.innerHTML = html;
  }

  function isPositiveNumber(n) {
    return typeof n === "number" && isFinite(n) && n > 0;
  }

  function calcVolumeM3(shape, unitFactor) {
    if (shape === "slab") {
      const L = toNumber(inputsByShape.slab[0].value) * unitFactor;
      const W = toNumber(inputsByShape.slab[1].value) * unitFactor;
      const T = toNumber(inputsByShape.slab[2].value) * unitFactor;

      if (!isPositiveNumber(L) || !isPositiveNumber(W) || !isPositiveNumber(T)) return NaN;
      return L * W * T;
    }

    if (shape === "footing") {
      const L = toNumber(inputsByShape.footing[0].value) * unitFactor;
      const W = toNumber(inputsByShape.footing[1].value) * unitFactor;
      const D = toNumber(inputsByShape.footing[2].value) * unitFactor;

      if (!isPositiveNumber(L) || !isPositiveNumber(W) || !isPositiveNumber(D)) return NaN;
      return L * W * D;
    }

    if (shape === "wall") {
      const L = toNumber(inputsByShape.wall[0].value) * unitFactor;
      const H = toNumber(inputsByShape.wall[1].value) * unitFactor;
      const T = toNumber(inputsByShape.wall[2].value) * unitFactor;

      if (!isPositiveNumber(L) || !isPositiveNumber(H) || !isPositiveNumber(T)) return NaN;
      return L * H * T;
    }

    if (shape === "cylinder") {
      const D = toNumber(inputsByShape.cylinder[0].value) * unitFactor;
      const H = toNumber(inputsByShape.cylinder[1].value) * unitFactor;

      if (!isPositiveNumber(D) || !isPositiveNumber(H)) return NaN;
      const r = D / 2;
      return Math.PI * r * r * H;
    }

    if (shape === "circular") {
      const D = toNumber(inputsByShape.circular[0].value) * unitFactor;
      const T = toNumber(inputsByShape.circular[1].value) * unitFactor;

      if (!isPositiveNumber(D) || !isPositiveNumber(T)) return NaN;
      const r = D / 2;
      return Math.PI * r * r * T;
    }

    return NaN;
  }

  function buildResultHtml(volumeM3) {
    const volumeLitres = volumeM3 * 1000;
    const volumeYd3 = volumeM3 * 1.3079506193143922;

    const wasteFactor = 1.1;
    const orderM3 = volumeM3 * wasteFactor;
    const orderYd3 = orderM3 * 1.3079506193143922;

    const trucks6 = orderM3 / 6;
    const trucks8 = orderM3 / 8;

    const vM3 = formatNumberTwoDecimals(volumeM3);
    const vL = formatNumberTwoDecimals(volumeLitres);
    const vYd3 = formatNumberTwoDecimals(volumeYd3);

    const oM3 = formatNumberTwoDecimals(orderM3);
    const oYd3 = formatNumberTwoDecimals(orderYd3);

    const t6 = formatNumberTwoDecimals(trucks6);
    const t8 = formatNumberTwoDecimals(trucks8);

    return `
      <div class="result-grid">
        <div class="result-row"><span>Exact volume</span><strong>${vM3} m³</strong></div>
        <div class="result-row"><span>Exact volume</span><strong>${vL} litres</strong></div>
        <div class="result-row"><span>Exact volume</span><strong>${vYd3} yd³</strong></div>
        <div class="result-row"><span>Order estimate (10% waste)</span><strong>${oM3} m³</strong></div>
        <div class="result-row"><span>Order estimate (10% waste)</span><strong>${oYd3} yd³</strong></div>
        <div class="result-row"><span>Approx trucks (6 m³)</span><strong>${t6}</strong></div>
        <div class="result-row"><span>Approx trucks (8 m³)</span><strong>${t8}</strong></div>
      </div>
    `;
  }

  function calculate() {
    clearResult();

    const unit = unitSelect ? unitSelect.value : "m";
    const shape = shapeSelect ? shapeSelect.value : "slab";
    const unitFactor = getUnitToMetersFactor(unit);

    const volumeM3 = calcVolumeM3(shape, unitFactor);
    if (!isPositiveNumber(volumeM3)) {
      setError("Enter valid, positive numbers for all required fields, then click Calculate.");
      return;
    }

    setSuccess(buildResultHtml(volumeM3));
  }

  if (shapeSelect) {
    showShapePanel(shapeSelect.value);
    shapeSelect.addEventListener("change", function () {
      showShapePanel(shapeSelect.value);
      clearResult();
    });
  }

  if (unitSelect) {
    unitSelect.addEventListener("change", function () {
      clearResult();
    });
  }

  if (calculateButton) {
    calculateButton.addEventListener("click", function () {
      calculate();
    });
  }

  const shareButton = document.getElementById("shareWhatsAppButton");
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      const pageUrl = window.location.href;
      const message = "Concrete Volume Calculator – check this calculator: " + pageUrl;
      const encoded = encodeURIComponent(message);
      const waUrl = "https://api.whatsapp.com/send?text=" + encoded;
      window.open(waUrl, "_blank");
    });
  }
});
