(function(){
  // DOM Elements
  const grid = document.getElementById("periodicGrid");
  const legend = document.getElementById("legend");
  const groupNumbersHeader = document.getElementById("groupNumbersHeader");
  const periodNumbersSidebar = document.getElementById("periodNumbersSidebar");
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const colorModeSelect = document.getElementById("colorModeSelect");
  const phaseFilterGroup = document.getElementById("phaseFilterGroup");
  const blockFilterGroup = document.getElementById("blockFilterGroup");
  const elementsCountBadge = document.getElementById("elementsCountBadge");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");
  const heatmapScaleBar = document.getElementById("heatmapScaleBar");
  const heatmapMinVal = document.getElementById("heatmapMinVal");
  const heatmapMaxVal = document.getElementById("heatmapMaxVal");
  const heatmapGradientTrack = document.getElementById("heatmapGradientTrack");
  const quickTooltip = document.getElementById("quickTooltip");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const temperatureSlider = document.getElementById("temperatureSlider");
  const temperatureValue = document.getElementById("temperatureValue");
  const temperatureResetBtn = document.getElementById("temperatureResetBtn");
  const viewToggleGroup = document.getElementById("viewToggleGroup");
  const tableContainer = document.querySelector(".table-container");

  // Quiz
  const quizToggleBtn = document.getElementById("quizToggleBtn");
  const quizBar = document.getElementById("quizBar");
  const quizPrompt = document.getElementById("quizPrompt");
  const quizCorrect = document.getElementById("quizCorrect");
  const quizTotal = document.getElementById("quizTotal");
  const quizStreak = document.getElementById("quizStreak");

  // Comparador
  const compareElementBtn = document.getElementById("compareElementBtn");
  const compareTray = document.getElementById("compareTray");
  const compareChips = document.getElementById("compareChips");
  const compareOpenBtn = document.getElementById("compareOpenBtn");
  const compareDialog = document.getElementById("compareDialog");
  const compareTableWrap = document.getElementById("compareTableWrap");

  // Modal DOM Elements
  const modalOverlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("closeModal");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const shareElementBtn = document.getElementById("shareElementBtn");
  const toggleSpinBtn = document.getElementById("toggleSpinBtn");
  const resetViewBtn = document.getElementById("resetViewBtn");
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const toastNotification = document.getElementById("toastNotification");

  // State
  let currentNumber = null;
  let atomViewer = null;
  let activeCategoryFilter = null;
  let activePhaseFilter = "all";
  let activeBlockFilter = "all";
  let currentColorMode = "cat";
  let isSpinning = true;
  let viewerFailed = false;
  let modalPushedHistory = false; // true si el modal añadió su propia entrada al historial
  let previewPanel = null;
  let temperatureK = 293;
  let viewMode = "table";
  let compareSet = [];
  const MAX_COMPARE = 3;
  const quiz = { active: false, target: null, misses: 0, correct: 0, total: 0, streak: 0, busy: false };

  const BLOCK_LABELS = { s: "Bloque s", p: "Bloque p", d: "Bloque d", f: "Bloque f" };
  const PHASE_LABELS = { solido: "Sólido", liquido: "Líquido", gas: "Gas", sintetico: "Sintético / desconocido" };

  // ================= UTILIDADES =================
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // "[Ar] 3d6 4s2" -> "[Ar] 3d<sup>6</sup> 4s<sup>2</sup>"
  function configHtml(configStr){
    return escapeHtml(shortConfig(configStr)).replace(/(\d[spdf])(\d+)/g, "$1<sup>$2</sup>");
  }

  function formatWeight(el){
    if(typeof el.w !== "number") return el.w;
    return el.w % 1 === 0 ? `[${el.w}]` : el.w.toFixed(el.w < 10 ? 3 : 2);
  }

  function phaseOf(el){
    return phaseAt(el, temperatureK);
  }

  // Estado a la temperatura elegida; a temperatura ambiente se usa el texto original de los datos
  function phaseLabel(el){
    if(Math.abs(temperatureK - ROOM_TEMPERATURE) < 1) return el.phase;
    return `${PHASE_LABELS[phaseOf(el)]} a ${temperatureK} K`;
  }

  function celsius(k){
    return Math.round((k - 273.15) * 10) / 10;
  }

  // ================= MODOS DE COLOR =================
  // Cada modo define cómo se colorea una celda y qué leyenda se muestra.
  //  - type "class": asigna una clase CSS por categoría y muestra una leyenda pulsable
  //  - type "heat": interpola un gradiente según un valor numérico y muestra una escala
  const HEAT_NO_DATA = { background: "#1e293b", color: "#94a3b8" };

  function yearValue(el){
    const y = parseInt(el.year, 10);
    return isNaN(y) ? 1600 : y; // "Antigüedad" se coloca al inicio de la escala
  }

  const COLOR_MODES = {
    cat: {
      type: "class",
      classFor: el => `cat-${el.cat}`,
      legend: () => Object.keys(CATEGORY_LABELS)
        .map(cat => ({ key: cat, label: CATEGORY_LABELS[cat], cls: `cat-${cat}`, count: ELEMENTS.filter(e => e.cat === cat).length }))
        .filter(item => item.count > 0),
      isActive: key => activeCategoryFilter === key,
      hasActive: () => activeCategoryFilter !== null,
      onPick: key => toggleCategoryFilter(key)
    },
    block: {
      type: "class",
      classFor: el => `block-${getBlock(el)}`,
      legend: () => ["s", "p", "d", "f"].map(b => ({ key: b, label: BLOCK_LABELS[b], cls: `block-${b}`, count: ELEMENTS.filter(e => getBlock(e) === b).length })),
      isActive: key => activeBlockFilter === key,
      hasActive: () => activeBlockFilter !== "all",
      onPick: key => setBlockFilter(activeBlockFilter === key ? "all" : key)
    },
    phase: {
      type: "class",
      classFor: el => `phase-${phaseOf(el)}`,
      legend: () => ["solido", "liquido", "gas", "sintetico"].map(p => ({ key: p, label: PHASE_LABELS[p], cls: `phase-${p}`, count: ELEMENTS.filter(e => phaseOf(e) === p).length })),
      isActive: key => activePhaseFilter === key,
      hasActive: () => activePhaseFilter !== "all",
      onPick: key => setPhaseFilter(activePhaseFilter === key ? "all" : key)
    },
    electroneg: {
      type: "heat",
      label: "Electronegatividad",
      value: el => el.en,
      format: v => `${v.toFixed(2)} (Pauling)`,
      stops: [[0.0, [30, 58, 138]], [0.25, [6, 182, 212]], [0.5, [16, 185, 129]], [0.75, [245, 158, 11]], [1.0, [239, 68, 68]]]
    },
    density: {
      type: "heat",
      label: "Densidad",
      value: el => el.den,
      log: true,
      format: v => `${v} g/cm³`,
      stops: [[0.0, [15, 23, 42]], [0.3, [2, 132, 199]], [0.6, [139, 92, 246]], [0.85, [236, 72, 153]], [1.0, [251, 191, 36]]]
    },
    mass: {
      type: "heat",
      label: "Masa atómica",
      value: el => el.w,
      format: v => `${v} u`,
      stops: [[0.0, [14, 116, 144]], [0.35, [34, 197, 94]], [0.65, [234, 179, 8]], [1.0, [220, 38, 38]]]
    },
    melting: {
      type: "heat",
      label: "Punto de fusión",
      value: el => el.mp,
      format: v => `${v} K (${celsius(v)} °C)`,
      stops: [[0.0, [30, 64, 175]], [0.3, [6, 182, 212]], [0.55, [250, 204, 21]], [0.8, [249, 115, 22]], [1.0, [220, 38, 38]]]
    },
    boiling: {
      type: "heat",
      label: "Punto de ebullición",
      value: el => el.bp,
      format: v => `${v} K (${celsius(v)} °C)`,
      stops: [[0.0, [30, 64, 175]], [0.3, [6, 182, 212]], [0.55, [250, 204, 21]], [0.8, [249, 115, 22]], [1.0, [220, 38, 38]]]
    },
    year: {
      type: "heat",
      label: "Descubrimiento",
      value: yearValue,
      format: (v, el) => isNaN(parseInt(el.year, 10)) ? "Antigüedad" : String(v),
      stops: [[0.0, [217, 119, 6]], [0.3, [5, 150, 105]], [0.6, [2, 132, 199]], [0.85, [99, 102, 241]], [1.0, [217, 70, 239]]]
    }
  };

  // Rango [min, max] de un modo de mapa de calor, con los elementos que lo marcan
  function heatRange(mode){
    let min = null, max = null;
    ELEMENTS.forEach(el => {
      const v = mode.value(el);
      if(v === null || v === undefined) return;
      if(!min || v < min.v) min = { v, el };
      if(!max || v > max.v) max = { v, el };
    });
    return { min, max };
  }

  function heatRatio(mode, range, v){
    const t = x => mode.log ? Math.log10(x + 0.0001) : x;
    const lo = t(range.min.v), hi = t(range.max.v);
    return Math.max(0, Math.min(1, (t(v) - lo) / (hi - lo)));
  }

  // ================= BUILD PERIOD & GROUP HEADERS =================
  function buildHeaders(){
    // Group headers (1-18)
    groupNumbersHeader.innerHTML = "";
    for(let g = 1; g <= 18; g++){
      const label = document.createElement("div");
      label.className = "group-num-label";
      label.textContent = g;
      groupNumbersHeader.appendChild(label);
    }

    // Period headers (1-7)
    periodNumbersSidebar.innerHTML = "";
    for(let p = 1; p <= 7; p++){
      const label = document.createElement("div");
      label.className = "period-num-label";
      label.style.gridRow = p;
      label.textContent = p;
      periodNumbersSidebar.appendChild(label);
    }

    // Indicators for Lanthanide (row 9) and Actinide (row 10) rows
    const lRow = document.createElement("div");
    lRow.className = "period-num-label";
    lRow.style.gridRow = 9;
    lRow.textContent = "6*";
    lRow.title = "Lantánidos (Periodo 6, bloque f)";
    periodNumbersSidebar.appendChild(lRow);

    const aRow = document.createElement("div");
    aRow.className = "period-num-label";
    aRow.style.gridRow = 10;
    aRow.textContent = "7*";
    aRow.title = "Actínidos (Periodo 7, bloque f)";
    periodNumbersSidebar.appendChild(aRow);
  }

  // ================= BUILD PERIODIC GRID =================
  function buildGrid(){
    grid.innerHTML = "";

    // Panel de vista previa en el hueco entre los grupos 3 y 12 (periodos 1-3)
    previewPanel = document.createElement("div");
    previewPanel.className = "preview-panel";
    previewPanel.setAttribute("aria-hidden", "true");
    grid.appendChild(previewPanel);

    // Add elements
    ELEMENTS.forEach(el => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "element-cell";
      cell.tabIndex = el.n === 1 ? 0 : -1; // tabindex itinerante: solo una celda en el orden de tabulación
      cell.setAttribute("aria-label", `${el.name}, ${el.s}, número atómico ${el.n}, ${CATEGORY_LABELS[el.cat]}`);
      cell.dataset.number = el.n;
      cell.dataset.symbol = el.s;
      cell.style.setProperty("--row", el.row);
      cell.style.setProperty("--col", el.col);
      // Retardo de la animación de entrada: una onda diagonal desde la esquina superior izquierda
      cell.style.setProperty("--delay", `${(el.row + el.col) * 22}ms`);

      cell.innerHTML = `
        <div class="cell-top">
          <span class="num">${el.n}</span>
          <span class="mass-sub">${formatWeight(el)}</span>
        </div>
        <span class="sym">${el.s}</span>
        <span class="nm">${el.name}</span>
      `;

      // Events
      cell.addEventListener("click", () => quiz.active ? answerQuiz(el, cell) : openModal(el.n));
      cell.addEventListener("mouseenter", (e) => { showPreview(el); showQuickTooltip(e, el); });
      cell.addEventListener("mouseleave", hideQuickTooltip);
      cell.addEventListener("focus", (e) => { setRovingCell(cell); showPreview(el); showQuickTooltip(e, el); });
      cell.addEventListener("blur", hideQuickTooltip);

      grid.appendChild(cell);
    });

    // Placeholders for Lanthanides (57-71) and Actinides (89-103) in main body
    const series = [
      { row: 6, cat: "lantanido", range: "57-71", sym: "La-Lu", title: "Ver serie de los Lantánidos (Tierras raras)", aria: "Filtrar lantánidos, elementos 57 a 71" },
      { row: 7, cat: "actinido", range: "89-103", sym: "Ac-Lr", title: "Ver serie de los Actínidos", aria: "Filtrar actínidos, elementos 89 a 103" }
    ];
    series.forEach(s => {
      const holder = document.createElement("button");
      holder.type = "button";
      holder.tabIndex = -1;
      holder.className = `placeholder-cell placeholder-${s.cat}`;
      holder.style.setProperty("--row", s.row);
      holder.style.setProperty("--col", 3);
      holder.innerHTML = `<span>${s.range}</span><span class="ph-range">${s.sym}</span>`;
      holder.title = s.title;
      holder.setAttribute("aria-label", s.aria);
      holder.addEventListener("click", () => toggleCategoryFilter(s.cat));
      grid.appendChild(holder);
    });

    applyColorMode();
  }

  // ================= PANEL DE VISTA PREVIA =================
  function showPreview(el){
    if(!previewPanel || quiz.active) return;
    if(!el){
      previewPanel.innerHTML = `
        <div class="pv-empty">
          <span class="pv-empty-title">Explora los 118 elementos</span>
          <span>Pasa el ratón o muévete con las flechas para ver un resumen.<br>Pulsa un elemento para abrir su modelo atómico 3D.</span>
        </div>`;
      return;
    }

    const cell = cellFor(el.n);
    const cs = cell ? getComputedStyle(cell) : null;
    const mode = COLOR_MODES[currentColorMode];
    let metric = "";
    if(mode.type === "heat"){
      const v = mode.value(el);
      metric = `<div class="pv-metric"><span>${mode.label}</span><strong>${v === null || v === undefined ? "Sin datos" : escapeHtml(mode.format(v, el))}</strong></div>`;
    }

    previewPanel.innerHTML = `
      <div class="pv-tile" style="background:${cs ? cs.backgroundColor : ""};color:${cs ? cs.color : ""}">
        <span class="pv-num">${el.n}</span>
        <span class="pv-sym">${el.s}</span>
        <span class="pv-mass">${formatWeight(el)}</span>
      </div>
      <div class="pv-info">
        <div class="pv-name">${escapeHtml(el.name)}</div>
        <div class="pv-tags">${escapeHtml(CATEGORY_LABELS[el.cat])} · Bloque ${getBlock(el)} · ${escapeHtml(phaseLabel(el))}</div>
        <div class="pv-config">${configHtml(el.cfg)}</div>
        ${metric}
      </div>`;
  }

  // ================= NAVEGACIÓN CON TECLADO EN LA TABLA =================
  function cellFor(number){
    return grid.querySelector(`.element-cell[data-number="${number}"]`);
  }

  function setRovingCell(cell){
    grid.querySelectorAll('.element-cell[tabindex="0"]').forEach(c => { if(c !== cell) c.tabIndex = -1; });
    cell.tabIndex = 0;
  }

  // Busca la celda más cercana en una dirección, saltando huecos de la tabla
  const ELEMENT_AT = {};
  ELEMENTS.forEach(e => { ELEMENT_AT[`${e.row},${e.col}`] = e; });

  function neighbourOf(el, dRow, dCol){
    let row = el.row, col = el.col;
    for(let i = 0; i < 18; i++){
      row += dRow; col += dCol;
      if(row < 1 || row > 10 || col < 1 || col > 18) return null;
      if(ELEMENT_AT[`${row},${col}`]) return ELEMENT_AT[`${row},${col}`];
    }
    return null;
  }

  grid.addEventListener("keydown", (e) => {
    const cell = e.target.closest(".element-cell");
    if(!cell) return;
    const el = ELEMENTS_BY_NUMBER[parseInt(cell.dataset.number, 10)];
    const moves = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    let target = null;
    if(viewMode === "list" && moves[e.key]){
      // En la lista los elementos van en orden: izquierda/derecha = ±1, arriba/abajo = ± una fila de la rejilla
      const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      const [dRow, dCol] = moves[e.key];
      target = ELEMENTS_BY_NUMBER[el.n + dCol + dRow * columns] || null;
    }
    else if(moves[e.key]) target = neighbourOf(el, ...moves[e.key]);
    else if(e.key === "Home") target = ELEMENTS.filter(x => x.row === el.row).sort((a, b) => a.col - b.col)[0];
    else if(e.key === "End") target = ELEMENTS.filter(x => x.row === el.row).sort((a, b) => b.col - a.col)[0];
    else return;
    e.preventDefault();
    if(target) cellFor(target.n).focus();
  });

  // ================= TOOLTIP =================
  // Solo se usa cuando el panel de vista previa no está visible (pantallas estrechas)
  function showQuickTooltip(e, el){
    if(quiz.active || (previewPanel && previewPanel.offsetParent !== null)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    quickTooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-symbol">[${el.n}] ${el.s}</span>
        <span>${escapeHtml(el.name)}</span>
      </div>
      <div class="tooltip-meta">${escapeHtml(CATEGORY_LABELS[el.cat])} · Bloque ${getBlock(el).toUpperCase()} · ${escapeHtml(el.phase)} · ${el.w} u</div>
    `;
    quickTooltip.style.left = (rect.left + rect.width / 2) + "px";
    quickTooltip.style.top = (rect.top - 6) + "px";
    quickTooltip.style.display = "block";
  }

  function hideQuickTooltip(){
    quickTooltip.style.display = "none";
  }

  // ================= LEYENDA =================
  function renderLegend(){
    const mode = COLOR_MODES[currentColorMode];
    legend.innerHTML = "";

    if(mode.type === "heat"){
      legend.style.display = "none";
      return;
    }
    legend.style.display = "flex";

    mode.legend().forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "legend-item";
      const active = mode.isActive(item.key);
      btn.classList.toggle("active-filter", active);
      btn.classList.toggle("disabled", mode.hasActive() && !active);
      btn.setAttribute("aria-pressed", String(active));
      btn.innerHTML = `
        <span class="legend-swatch ${item.cls}"></span>
        <span>${escapeHtml(item.label)} <span class="legend-count">${item.count}</span></span>
      `;
      btn.addEventListener("click", () => mode.onPick(item.key));
      legend.appendChild(btn);
    });
  }

  function toggleCategoryFilter(cat){
    activeCategoryFilter = (activeCategoryFilter === cat) ? null : cat;
    applyFilters();
  }

  function setPhaseFilter(phase){
    activePhaseFilter = phase;
    setActiveChip(phaseFilterGroup, phaseFilterGroup.querySelector(`[data-phase="${phase}"]`));
    applyFilters();
  }

  function setBlockFilter(block){
    activeBlockFilter = block;
    setActiveChip(blockFilterGroup, blockFilterGroup.querySelector(`[data-block="${block}"]`));
    applyFilters();
  }

  // ================= COLOR MODES & HEATMAPS =================
  function applyColorMode(){
    currentColorMode = colorModeSelect.value;
    const mode = COLOR_MODES[currentColorMode];
    const cells = grid.querySelectorAll(".element-cell");

    if(mode.type === "class"){
      heatmapScaleBar.style.display = "none";
      cells.forEach(cell => {
        const el = ELEMENTS_BY_NUMBER[parseInt(cell.dataset.number, 10)];
        cell.className = `element-cell ${mode.classFor(el)}`;
        cell.style.background = "";
        cell.style.color = "";
      });
    } else {
      const range = heatRange(mode);
      heatmapScaleBar.style.display = "flex";
      heatmapMinVal.textContent = `${range.min.el.s} · ${mode.format(range.min.v, range.min.el)}`;
      heatmapMaxVal.textContent = `${range.max.el.s} · ${mode.format(range.max.v, range.max.el)}`;
      heatmapGradientTrack.style.background = `linear-gradient(90deg, ${mode.stops.map(([pos, c]) => `rgb(${c.join(",")}) ${pos * 100}%`).join(", ")})`;

      cells.forEach(cell => {
        const el = ELEMENTS_BY_NUMBER[parseInt(cell.dataset.number, 10)];
        cell.className = "element-cell";
        const v = mode.value(el);
        if(v === null || v === undefined){
          cell.style.background = HEAT_NO_DATA.background;
          cell.style.color = HEAT_NO_DATA.color;
        } else {
          paintHeat(cell, interpolateColor(heatRatio(mode, range, v), mode.stops));
        }
      });
    }

    applyFilters();
    showPreview(null);
  }

  function interpolateColor(ratio, stops){
    for(let i = 0; i < stops.length - 1; i++){
      const [pos1, col1] = stops[i];
      const [pos2, col2] = stops[i + 1];
      if(ratio >= pos1 && ratio <= pos2){
        const factor = (ratio - pos1) / (pos2 - pos1);
        return col1.map((c, k) => Math.round(c + factor * (col2[k] - c)));
      }
    }
    return stops[stops.length - 1][1];
  }

  // Pinta una celda con un color de mapa de calor y elige el texto (claro u oscuro) por contraste WCAG
  function paintHeat(cell, rgb){
    cell.style.background = `rgb(${rgb.join(",")})`;
    cell.style.color = contrastText(rgb);
  }

  function contrastText(rgb){
    const lin = rgb.map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    // Contraste con blanco (L=1) frente a casi negro (L≈0.003)
    return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.053) ? "#ffffff" : "#07090e";
  }

  // ================= FILTERS & SEARCH =================
  // Números: coincidencia exacta con el número atómico (o con un año si tiene 4 cifras).
  // Texto: símbolo por prefijo, nombre y familia por subcadena, sin distinguir tildes.
  function matchesQuery(el, query){
    if(/^\d+$/.test(query)){
      return String(el.n) === query || (query.length === 4 && String(el.year) === query);
    }
    return normalizeText(el.s).startsWith(query) ||
           normalizeText(el.name).includes(query) ||
           normalizeText(CATEGORY_LABELS[el.cat]).includes(query) ||
           normalizeText(el.year).startsWith(query);
  }

  function applyFilters(){
    const query = normalizeText(searchInput.value);
    let visibleCount = 0;

    // Toggle clear search button
    clearSearchBtn.style.display = query ? "block" : "none";

    grid.querySelectorAll(".element-cell").forEach(cell => {
      const el = ELEMENTS_BY_NUMBER[parseInt(cell.dataset.number, 10)];
      let visible = true;

      if(activeCategoryFilter && el.cat !== activeCategoryFilter) visible = false;
      if(activePhaseFilter !== "all" && phaseOf(el) !== activePhaseFilter) visible = false;
      if(activeBlockFilter !== "all" && getBlock(el) !== activeBlockFilter) visible = false;
      if(query && !matchesQuery(el, query)) visible = false;

      cell.classList.toggle("dimmed", !visible);
      if(visible) visibleCount++;
    });

    elementsCountBadge.textContent = `${visibleCount} / 118 elementos`;

    const hasActiveFilters = activeCategoryFilter !== null ||
                             activePhaseFilter !== "all" ||
                             activeBlockFilter !== "all" ||
                             query.length > 0;
    resetFiltersBtn.style.display = hasActiveFilters ? "flex" : "none";

    renderLegend();
  }

  function resetFilters(){
    activeCategoryFilter = null;
    activePhaseFilter = "all";
    activeBlockFilter = "all";
    searchInput.value = "";
    setActiveChip(phaseFilterGroup, phaseFilterGroup.querySelector('[data-phase="all"]'));
    setActiveChip(blockFilterGroup, blockFilterGroup.querySelector('[data-block="all"]'));
    applyFilters();
  }

  // ================= MODAL & 3D VIEWER =================
  function openModal(number, updateHistory = true){
    const el = ELEMENTS_BY_NUMBER[number];
    if(!el) return;
    currentNumber = number;

    // Symbol & Category
    const bigSymbol = document.getElementById("bigSymbol");
    bigSymbol.textContent = el.s;
    bigSymbol.className = `big-symbol cat-${el.cat}`;
    document.getElementById("elementName").textContent = el.name;
    document.getElementById("categoryTag").textContent = CATEGORY_LABELS[el.cat];
    document.getElementById("blockTag").textContent = `Bloque ${getBlock(el).toUpperCase()}`;
    document.getElementById("phaseTag").textContent = el.phase;
    document.getElementById("atomicNumberBadge").textContent = `Z = ${el.n}`;

    // Particles
    document.getElementById("protonCount").textContent = el.n;
    document.getElementById("neutronCount").textContent = Math.max(0, el.m - el.n);
    document.getElementById("electronCount").textContent = el.n;

    // Properties
    document.getElementById("dataMass").textContent = `${formatWeight(el)} u (isótopo ref.: ${el.m})`;
    document.getElementById("dataPeriodGroup").textContent = `Periodo ${periodOf(el)} · Grupo ${groupOf(el)}`;
    const phaseNow = phaseOf(el);
    document.getElementById("dataPhase").textContent = Math.abs(temperatureK - ROOM_TEMPERATURE) < 1 || getNormalizedPhase(el) === "sintetico"
      ? `${el.phase} (20 °C)`
      : `${el.phase} (20 °C) · ${PHASE_LABELS[phaseNow]} a ${temperatureK} K`;
    document.getElementById("dataDensity").textContent = el.den !== null ? `${el.den} g/cm³` : "Desconocida";

    // Electronegativity with visual Pauling gauge
    const gauge = document.getElementById("electronegGauge");
    if(el.en !== null){
      document.getElementById("dataElectroneg").textContent = `${el.en} (Pauling)`;
      gauge.style.width = `${Math.min(100, Math.max(0, (el.en / 4.0) * 100))}%`;
    } else {
      document.getElementById("dataElectroneg").textContent = "Sin datos";
      gauge.style.width = "0%";
    }

    // Melting & Boiling in K and °C
    document.getElementById("dataMelting").textContent = el.mp !== null ? `${el.mp} K (${kelvinToCelsius(el.mp)} °C)` : "Desconocido";
    document.getElementById("dataBoiling").textContent = el.bp !== null ? `${el.bp} K (${kelvinToCelsius(el.bp)} °C)` : "Desconocido";

    const configEl = document.getElementById("dataConfig");
    configEl.innerHTML = configHtml(el.cfg);
    configEl.title = el.cfg;
    document.getElementById("dataYear").textContent = isNaN(parseInt(el.year, 10)) ? el.year : `Año ${el.year}`;
    document.getElementById("dataOxidation").textContent = OXIDATION_STATES[el.n] || "Sin datos";
    const outer = getShellOccupancy(el.cfg);
    document.getElementById("dataValence").textContent = `${outer[outer.length - 1]} (capa ${SHELL_LETTERS[outer.length - 1]})`;
    document.getElementById("wikiLink").href = wikipediaUrl(el);
    document.getElementById("wikiLink").setAttribute("aria-label", `Leer más sobre ${el.name} en Wikipedia (se abre en una pestaña nueva)`);
    updateCompareButton();
    document.getElementById("elementSummary").textContent = el.desc;

    // Bohr Shells breakdown (mismos colores que las órbitas del visor 3D)
    const shells = getShellOccupancy(el.cfg);
    document.getElementById("shellInfo").innerHTML = `
      <span class="shell-info-title">Capas de Bohr</span>
      <span class="shell-chips">${shells.map((count, idx) => `
        <span class="shell-chip${idx === shells.length - 1 ? " valence" : ""}" style="--shell:${SHELL_COLORS[idx]}" title="Capa ${SHELL_LETTERS[idx]}${idx === shells.length - 1 ? " (valencia)" : ""}: ${count} electrones">
          <strong>${SHELL_LETTERS[idx] || `n=${idx + 1}`}</strong>${count}
        </span>`).join("")}
      </span>`;

    // Open Modal Overlay
    const wasOpen = modalOverlay.classList.contains("active");
    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    if(!wasOpen){
      // El resto de la página queda inerte mientras el diálogo está abierto
      pageRegions().forEach(r => r.inert = true);
      closeModalBtn.focus();
    }

    renderAtom(el, shells);
    updateNavButtons();

    // Deep linking: la primera apertura crea una entrada de historial (el botón Atrás cierra el modal);
    // navegar entre elementos dentro del modal solo reemplaza la URL.
    if(!wasOpen) modalPushedHistory = updateHistory;
    if(updateHistory){
      const url = `#${el.s}`;
      if(wasOpen) history.replaceState(history.state, "", url);
      else history.pushState({ element: el.s }, "", url);
    }
  }

  // Visor 3D: Three.js se carga como módulo ES la primera vez que se abre un elemento.
  // Si el módulo no carga (sin conexión, sin WebGL, abierto como file://) se usa un diagrama 2D.
  let viewerPromise = null;

  function loadViewer(container){
    if(!viewerPromise){
      container.innerHTML = `<div class="viewer-loading">Cargando modelo 3D…</div>`;
      viewerPromise = import("./atom3d.js").then(({ AtomViewer }) => {
        container.innerHTML = "";
        atomViewer = new AtomViewer(container);
        syncSpinButton();
        return atomViewer;
      });
    }
    return viewerPromise;
  }

  async function renderAtom(el, shells){
    const container = document.getElementById("atomCanvasContainer");
    if(!viewerFailed){
      try {
        const viewer = await loadViewer(container);
        // Mientras cargaba, el usuario pudo cerrar el modal o pasar a otro elemento
        if(currentNumber !== el.n || !modalOverlay.classList.contains("active")) return;
        viewer.start();
        requestAnimationFrame(() => {
          viewer.onResize();
          viewer.render(el, shells);
        });
        return;
      } catch(err){
        viewerFailed = true;
        atomViewer = null;
        console.warn("Visor 3D no disponible, usando diagrama 2D:", err);
        document.querySelector(".viewer-controls-overlay").style.display = "none";
        document.querySelector(".viewer-hint").textContent = "Vista 2D · el modelo 3D no está disponible en este navegador";
      }
    }
    if(currentNumber === el.n) container.innerHTML = buildBohrSvg(el, shells);
  }

  function syncSpinButton(){
    isSpinning = !!(atomViewer && atomViewer.controls.autoRotate);
    toggleSpinBtn.innerHTML = isSpinning
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
    toggleSpinBtn.title = isSpinning ? "Pausar giro automático" : "Reanudar giro automático";
    toggleSpinBtn.setAttribute("aria-label", toggleSpinBtn.title);
  }

  // Diagrama de Bohr estático en SVG (respaldo sin WebGL)
  function buildBohrSvg(el, shells){
    const size = 400, c = size / 2;
    const step = Math.min(24, 150 / Math.max(1, shells.length));
    let svg = `<svg class="bohr-2d" viewBox="0 0 ${size} ${size}" role="img" aria-label="Modelo de Bohr de ${escapeHtml(el.name)}">`;
    shells.forEach((count, idx) => {
      const r = 42 + (idx + 1) * step;
      svg += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${SHELL_COLORS[idx]}" stroke-opacity="0.35"/>`;
      for(let i = 0; i < count; i++){
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        svg += `<circle cx="${(c + Math.cos(a) * r).toFixed(1)}" cy="${(c + Math.sin(a) * r).toFixed(1)}" r="4" fill="${SHELL_COLORS[idx]}"/>`;
      }
    });
    svg += `<circle cx="${c}" cy="${c}" r="34" fill="#ff5376" fill-opacity="0.85"/>`;
    svg += `<text x="${c}" y="${c + 7}" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">${el.s}</text></svg>`;
    return svg;
  }

  function pageRegions(){
    return document.querySelectorAll("body > :not(#modalOverlay):not(#toastNotification):not(script)");
  }

  function periodOf(el){
    if(el.cat === "lantanido") return "6 (f)";
    if(el.cat === "actinido") return "7 (f)";
    return String(el.row);
  }

  function groupOf(el){
    if(el.cat === "lantanido" || el.cat === "actinido") return "3 (bloque f)";
    return String(el.col);
  }

  function updateNavButtons(){
    const prev = ELEMENTS_BY_NUMBER[currentNumber - 1];
    const next = ELEMENTS_BY_NUMBER[currentNumber + 1];
    prevBtn.disabled = !prev;
    nextBtn.disabled = !next;
    prevBtn.title = prev ? `Anterior: ${prev.name} (←)` : "";
    nextBtn.title = next ? `Siguiente: ${next.name} (→)` : "";
    prevBtn.setAttribute("aria-label", prev ? `Elemento anterior: ${prev.name}` : "Elemento anterior");
    nextBtn.setAttribute("aria-label", next ? `Elemento siguiente: ${next.name}` : "Elemento siguiente");
  }

  function closeModal(updateHistory = true){
    if(!modalOverlay.classList.contains("active")) return;
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
    pageRegions().forEach(r => r.inert = false);
    // Devolver el foco a la celda del último elemento visto
    const lastCell = cellFor(currentNumber);
    if(lastCell){
      setRovingCell(lastCell);
      lastCell.focus({ preventScroll: true });
    }
    currentNumber = null;
    hideQuickTooltip();
    if(atomViewer) atomViewer.stop();
    if(!updateHistory) return;
    // Si abrimos nosotros la entrada de historial, volver atrás; si se llegó con un enlace directo, limpiar el hash
    if(modalPushedHistory) history.back();
    else history.replaceState(null, "", window.location.pathname + window.location.search);
    modalPushedHistory = false;
  }

  // ================= TEMA CLARO / OSCURO =================
  function readStoredTheme(){
    try { return localStorage.getItem("theme"); } catch(err){ return null; }
  }

  function effectiveTheme(){
    return document.documentElement.dataset.theme ||
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  }

  function applyTheme(theme){
    if(theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
    const current = effectiveTheme();
    const label = current === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
    themeToggleBtn.setAttribute("aria-label", label);
    themeToggleBtn.title = label;
    themeToggleBtn.dataset.current = current;
    document.querySelector('meta[name="theme-color"]').content = current === "dark" ? "#080b12" : "#eef2f8";
  }

  themeToggleBtn.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next); } catch(err){}
    applyTheme(next);
  });

  // ================= TEMPERATURA =================
  function setTemperature(k){
    temperatureK = k;
    temperatureSlider.value = k;
    temperatureValue.textContent = `${k} K · ${Math.round(k - 273.15)} °C`;
    temperatureResetBtn.hidden = k === 293;
  }

  temperatureSlider.addEventListener("input", () => {
    setTemperature(parseInt(temperatureSlider.value, 10));
    // Mover la temperatura solo tiene efecto visible en el modo de estado físico
    if(colorModeSelect.value !== "phase") colorModeSelect.value = "phase";
    applyColorMode();
  });

  temperatureResetBtn.addEventListener("click", () => {
    setTemperature(293);
    applyColorMode();
  });

  // ================= VISTA TABLA / LISTA =================
  function setViewMode(mode, persist = true){
    viewMode = mode;
    grid.classList.toggle("list-view", mode === "list");
    tableContainer.classList.toggle("list-mode", mode === "list");
    setActiveChip(viewToggleGroup, viewToggleGroup.querySelector(`[data-view="${mode}"]`));
    if(persist){
      try { localStorage.setItem("view", mode); } catch(err){}
    }
  }

  viewToggleGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if(chip) setViewMode(chip.dataset.view);
  });

  function initialViewMode(){
    let stored = null;
    try { stored = localStorage.getItem("view"); } catch(err){}
    if(stored === "table" || stored === "list") return stored;
    return window.innerWidth < 680 ? "list" : "table";
  }

  // ================= QUIZ =================
  function startQuiz(){
    quiz.active = true;
    quiz.correct = quiz.total = quiz.streak = 0;
    quiz.target = null;
    document.body.classList.add("quiz-mode");
    quizBar.hidden = false;
    quizToggleBtn.setAttribute("aria-pressed", "true");
    hideQuickTooltip();
    updateQuizScore();
    nextQuestion();
  }

  function stopQuiz(){
    quiz.active = false;
    quiz.target = null;
    document.body.classList.remove("quiz-mode");
    quizBar.hidden = true;
    quizToggleBtn.setAttribute("aria-pressed", "false");
    grid.querySelectorAll(".quiz-reveal").forEach(c => c.classList.remove("quiz-reveal"));
    showPreview(null);
  }

  function nextQuestion(){
    if(!quiz.active) return;
    grid.querySelectorAll(".quiz-reveal").forEach(c => c.classList.remove("quiz-reveal"));
    // Las preguntas salen de los elementos visibles, así los filtros sirven para practicar una familia
    let pool = [...grid.querySelectorAll(".element-cell:not(.dimmed)")].map(c => ELEMENTS_BY_NUMBER[parseInt(c.dataset.number, 10)]);
    if(pool.length === 0) pool = ELEMENTS.slice();
    if(pool.length > 1 && quiz.target) pool = pool.filter(el => el !== quiz.target);
    quiz.target = pool[Math.floor(Math.random() * pool.length)];
    quiz.misses = 0;
    quiz.busy = false;
    quizPrompt.textContent = Math.random() < 0.7
      ? quiz.target.name
      : `el elemento número ${quiz.target.n}`;
  }

  function updateQuizScore(){
    quizCorrect.textContent = quiz.correct;
    quizTotal.textContent = quiz.total;
    quizStreak.textContent = quiz.streak;
  }

  function flash(cell, cls){
    cell.classList.remove(cls);
    void cell.offsetWidth; // reinicia la animación
    cell.classList.add(cls);
    setTimeout(() => cell.classList.remove(cls), 700);
  }

  function answerQuiz(el, cell){
    if(quiz.busy || !quiz.target) return;
    if(el === quiz.target){
      quiz.busy = true;
      quiz.total++;
      if(quiz.misses === 0){ quiz.correct++; quiz.streak++; }
      else quiz.streak = 0;
      flash(cell, "quiz-correct");
      showToast(quiz.misses === 0 ? `¡Correcto! ${el.name} (${el.s})` : `${el.name} (${el.s})`);
      updateQuizScore();
      setTimeout(nextQuestion, 650);
    } else {
      quiz.misses++;
      quiz.streak = 0;
      flash(cell, "quiz-wrong");
      showToast(`No, eso es ${el.name} (${el.s})`);
      // Tras dos fallos se señala la respuesta
      if(quiz.misses >= 2) cellFor(quiz.target.n).classList.add("quiz-reveal");
      updateQuizScore();
    }
  }

  quizToggleBtn.addEventListener("click", () => quiz.active ? stopQuiz() : startQuiz());
  document.getElementById("quizExitBtn").addEventListener("click", stopQuiz);
  document.getElementById("quizSkipBtn").addEventListener("click", () => {
    if(quiz.busy || !quiz.target) return;
    quiz.busy = true;
    quiz.total++;
    quiz.streak = 0;
    updateQuizScore();
    cellFor(quiz.target.n).classList.add("quiz-reveal");
    showToast(`Era ${quiz.target.name} (${quiz.target.s})`);
    setTimeout(nextQuestion, 1200);
  });

  // ================= COMPARADOR =================
  function toggleCompare(number){
    const idx = compareSet.indexOf(number);
    if(idx >= 0){
      compareSet.splice(idx, 1);
    } else {
      if(compareSet.length >= MAX_COMPARE){
        const removed = ELEMENTS_BY_NUMBER[compareSet.shift()];
        showToast(`Máximo ${MAX_COMPARE} elementos: se quita ${removed.name}`);
      }
      compareSet.push(number);
    }
    renderCompareTray();
    updateCompareButton();
  }

  function updateCompareButton(){
    const inSet = compareSet.includes(currentNumber);
    compareElementBtn.classList.toggle("active", inSet);
    compareElementBtn.setAttribute("aria-pressed", String(inSet));
    const label = inSet ? "Quitar de la comparación" : "Añadir a la comparación";
    compareElementBtn.title = label;
    compareElementBtn.setAttribute("aria-label", label);
  }

  function renderCompareTray(){
    compareTray.hidden = compareSet.length === 0;
    compareOpenBtn.disabled = compareSet.length < 2;
    compareOpenBtn.title = compareSet.length < 2 ? "Añade al menos dos elementos" : "";
    compareChips.innerHTML = "";
    compareSet.forEach(n => {
      const el = ELEMENTS_BY_NUMBER[n];
      const chip = document.createElement("span");
      chip.className = `compare-chip cat-${el.cat}`;
      chip.innerHTML = `<strong>${el.s}</strong><button type="button" aria-label="Quitar ${escapeHtml(el.name)} de la comparación">&times;</button>`;
      chip.querySelector("button").addEventListener("click", () => toggleCompare(n));
      compareChips.appendChild(chip);
    });
  }

  const COMPARE_ROWS = [
    { label: "Número atómico", num: el => el.n },
    { label: "Masa atómica (u)", num: el => el.w },
    { label: "Familia", text: el => CATEGORY_LABELS[el.cat] },
    { label: "Bloque · Periodo · Grupo", text: el => `${getBlock(el)} · ${periodOf(el)} · ${groupOf(el)}` },
    { label: "Estado (20 °C)", text: el => el.phase },
    { label: "Densidad (g/cm³)", num: el => el.den },
    { label: "Electronegatividad", num: el => el.en },
    { label: "Punto de fusión (K)", num: el => el.mp },
    { label: "Punto de ebullición (K)", num: el => el.bp },
    { label: "Electrones de valencia", num: el => outerShellElectrons(el) },
    { label: "Estados de oxidación", text: el => OXIDATION_STATES[el.n] || "Sin datos" },
    { label: "Configuración", html: el => configHtml(el.cfg) },
    { label: "Descubrimiento", text: el => el.year }
  ];

  function openCompare(){
    const els = compareSet.map(n => ELEMENTS_BY_NUMBER[n]);
    let html = `<table class="compare-table"><thead><tr><th scope="col"><span class="sr-only">Propiedad</span></th>`;
    els.forEach(el => {
      html += `<th scope="col"><span class="compare-tile cat-${el.cat}"><span>${el.n}</span><strong>${el.s}</strong></span>${escapeHtml(el.name)}</th>`;
    });
    html += `</tr></thead><tbody>`;
    COMPARE_ROWS.forEach(row => {
      html += `<tr><th scope="row">${row.label}</th>`;
      if(row.num){
        const vals = els.map(row.num);
        const known = vals.filter(v => v !== null && v !== undefined);
        const max = Math.max(...known), min = Math.min(...known);
        const marks = known.length >= 2 && max !== min;
        vals.forEach(v => {
          if(v === null || v === undefined){ html += `<td class="muted">Sin datos</td>`; return; }
          const mark = marks && v === max ? ` <span class="cmp-max" title="Valor más alto">▲</span>`
                     : marks && v === min ? ` <span class="cmp-min" title="Valor más bajo">▼</span>` : "";
          html += `<td class="num">${v}${mark}</td>`;
        });
      } else {
        els.forEach(el => { html += `<td>${row.html ? row.html(el) : escapeHtml(row.text(el))}</td>`; });
      }
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    compareTableWrap.innerHTML = html;
    compareDialog.showModal();
  }

  compareElementBtn.addEventListener("click", () => {
    if(currentNumber) toggleCompare(currentNumber);
  });
  compareOpenBtn.addEventListener("click", openCompare);
  document.getElementById("compareClearBtn").addEventListener("click", () => {
    compareSet = [];
    renderCompareTray();
  });
  document.getElementById("compareCloseBtn").addEventListener("click", () => compareDialog.close());
  compareDialog.addEventListener("click", (e) => {
    if(e.target === compareDialog) compareDialog.close(); // clic en el fondo
  });

  // ================= TOAST NOTIFICATION =================
  let toastTimer = null;
  function showToast(message){
    toastNotification.textContent = message;
    toastNotification.classList.add("show");
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove("show");
    }, 3000);
  }

  // ================= EVENT LISTENERS =================

  // Search input & Clear button
  searchInput.addEventListener("input", applyFilters);
  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    applyFilters();
    searchInput.focus();
  });

  // Color Mode dropdown
  colorModeSelect.addEventListener("change", applyColorMode);

  // Sincroniza el estado visual y aria-pressed de un grupo de chips
  function setActiveChip(group, chip){
    group.querySelectorAll(".filter-chip").forEach(c => {
      c.classList.toggle("active", c === chip);
      c.setAttribute("aria-pressed", String(c === chip));
    });
  }

  phaseFilterGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if(chip) setPhaseFilter(chip.dataset.phase);
  });

  blockFilterGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if(chip) setBlockFilter(chip.dataset.block);
  });

  // Reset all filters button
  resetFiltersBtn.addEventListener("click", resetFilters);

  // Modal navigation & close
  prevBtn.addEventListener("click", () => {
    if(currentNumber > 1) openModal(currentNumber - 1);
  });
  nextBtn.addEventListener("click", () => {
    if(currentNumber < 118) openModal(currentNumber + 1);
  });
  closeModalBtn.addEventListener("click", () => closeModal());
  modalOverlay.addEventListener("click", (e) => {
    if(e.target === modalOverlay) closeModal();
  });

  // 3D Controls Overlay Buttons
  toggleSpinBtn.addEventListener("click", () => {
    if(atomViewer){
      atomViewer.toggleAutoRotate();
      syncSpinButton();
    }
  });
  resetViewBtn.addEventListener("click", () => {
    if(atomViewer) atomViewer.resetView();
  });
  zoomInBtn.addEventListener("click", () => {
    if(atomViewer) atomViewer.zoomIn();
  });
  zoomOutBtn.addEventListener("click", () => {
    if(atomViewer) atomViewer.zoomOut();
  });

  // Share direct URL button
  shareElementBtn.addEventListener("click", () => {
    const el = ELEMENTS_BY_NUMBER[currentNumber];
    if(!el) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#${el.s}`;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(`¡Enlace al ${el.name} (${el.s}) copiado!`);
      }).catch(() => {
        showToast(`Enlace: ${shareUrl}`);
      });
    } else {
      showToast(`Enlace: ${shareUrl}`);
    }
  });

  // Keyboard Navigation & Shortcuts
  document.addEventListener("keydown", (e) => {
    if(compareDialog.open) return; // el diálogo nativo gestiona su propio teclado

    // Quick search shortcut "/"
    if(e.key === "/" && document.activeElement !== searchInput && !modalOverlay.classList.contains("active")){
      e.preventDefault();
      searchInput.focus();
      return;
    }

    if(modalOverlay.classList.contains("active")){
      if(e.key === "Tab"){
        const focusables = [...modal.querySelectorAll("button:not([disabled]), a[href], [tabindex='0']")].filter(n => n.offsetParent !== null);
        const first = focusables[0], last = focusables[focusables.length - 1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
      if(e.key === "Escape") closeModal();
      if(e.key === "ArrowRight" && currentNumber < 118) openModal(currentNumber + 1);
      if(e.key === "ArrowLeft" && currentNumber > 1) openModal(currentNumber - 1);
      if(e.key === " " && atomViewer && !e.target.closest("button")){
        e.preventDefault();
        toggleSpinBtn.click();
      }
    } else {
      if(e.key === "Escape" && document.activeElement === searchInput){
        searchInput.value = "";
        applyFilters();
        searchInput.blur();
      }
    }
  });

  // Deep linking URL Hash routing on page load or back/forward
  function checkUrlHash(){
    const hash = normalizeText(decodeURIComponent(window.location.hash.replace("#", "")));
    if(!hash){
      closeModal(false);
      return;
    }

    // Check if numeric
    const num = parseInt(hash, 10);
    if(!isNaN(num) && ELEMENTS_BY_NUMBER[num]){
      openModal(num, false);
      return;
    }

    // Check by symbol
    if(ELEMENTS_BY_SYMBOL[hash]){
      openModal(ELEMENTS_BY_SYMBOL[hash].n, false);
      return;
    }

    // Check by element name
    const foundByName = ELEMENTS.find(e => normalizeText(e.name) === hash);
    if(foundByName){
      openModal(foundByName.n, false);
    }
  }

  window.addEventListener("popstate", checkUrlHash);

  // Service worker para uso sin conexión (solo por http/https, no desde file://)
  if("serviceWorker" in navigator && location.protocol.startsWith("http")){
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(err => console.warn("Service worker no registrado:", err));
    });
  }

  // Initialize
  applyTheme(readStoredTheme());
  setTemperature(293);
  buildHeaders();
  buildGrid();
  setViewMode(initialViewMode(), false);
  checkUrlHash();

})();
