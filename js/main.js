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
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    // Add elements
    ELEMENTS.forEach(el => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "element-cell";
      cell.tabIndex = el.n === 1 ? 0 : -1; // tabindex itinerante: solo una celda en el orden de tabulación
      cell.setAttribute("aria-label", `${el.name}, ${el.s}, número atómico ${el.n}, ${CATEGORY_LABELS[el.cat]}`);
      cell.dataset.number = el.n;
      cell.dataset.symbol = el.s;
      cell.dataset.cat = el.cat;
      cell.dataset.block = getBlock(el);
      cell.dataset.phase = getNormalizedPhase(el);
      cell.style.gridRow = el.row;
      cell.style.gridColumn = el.col;

      const weightDisplay = typeof el.w === "number" ? (el.w % 1 === 0 ? el.w : el.w.toFixed(el.w < 10 ? 3 : 2)) : el.w;

      cell.innerHTML = `
        <div class="cell-top">
          <span class="num">${el.n}</span>
          <span class="mass-sub">${weightDisplay}</span>
        </div>
        <span class="sym">${el.s}</span>
        <span class="nm">${el.name}</span>
      `;

      // Events
      cell.addEventListener("click", () => openModal(el.n));
      cell.addEventListener("mouseenter", (e) => showQuickTooltip(e, el));
      cell.addEventListener("mouseleave", hideQuickTooltip);
      cell.addEventListener("focus", (e) => { setRovingCell(cell); showQuickTooltip(e, el); });
      cell.addEventListener("blur", hideQuickTooltip);

      grid.appendChild(cell);
    });

    // Placeholders for Lanthanides (57-71) and Actinides (89-103) in main body
    const lanthHolder = document.createElement("button");
    lanthHolder.type = "button";
    lanthHolder.tabIndex = -1;
    lanthHolder.className = "placeholder-cell";
    lanthHolder.style.gridRow = 6;
    lanthHolder.style.gridColumn = 3;
    lanthHolder.innerHTML = '<span>57-71</span><span class="ph-range">La-Lu</span>';
    lanthHolder.title = "Ver serie de los Lantánidos (Tierras raras)";
    lanthHolder.setAttribute("aria-label", "Filtrar lantánidos, elementos 57 a 71");
    lanthHolder.addEventListener("click", () => highlightSeries("lantanido"));
    grid.appendChild(lanthHolder);

    const actinHolder = document.createElement("button");
    actinHolder.type = "button";
    actinHolder.tabIndex = -1;
    actinHolder.className = "placeholder-cell";
    actinHolder.style.gridRow = 7;
    actinHolder.style.gridColumn = 3;
    actinHolder.innerHTML = '<span>89-103</span><span class="ph-range">Ac-Lr</span>';
    actinHolder.title = "Ver serie de los Actínidos";
    actinHolder.setAttribute("aria-label", "Filtrar actínidos, elementos 89 a 103");
    actinHolder.addEventListener("click", () => highlightSeries("actinido"));
    grid.appendChild(actinHolder);

    applyColorMode();
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
  function neighbourOf(el, dRow, dCol){
    const byPos = {};
    ELEMENTS.forEach(e => { byPos[`${e.row},${e.col}`] = e; });
    let row = el.row, col = el.col;
    for(let i = 0; i < 18; i++){
      row += dRow; col += dCol;
      if(row < 1 || row > 10 || col < 1 || col > 18) return null;
      if(byPos[`${row},${col}`]) return byPos[`${row},${col}`];
    }
    return null;
  }

  grid.addEventListener("keydown", (e) => {
    const cell = e.target.closest(".element-cell");
    if(!cell) return;
    const el = ELEMENTS_BY_NUMBER[parseInt(cell.dataset.number, 10)];
    const moves = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    let target = null;
    if(moves[e.key]) target = neighbourOf(el, ...moves[e.key]);
    else if(e.key === "Home") target = ELEMENTS.filter(x => x.row === el.row).sort((a, b) => a.col - b.col)[0];
    else if(e.key === "End") target = ELEMENTS.filter(x => x.row === el.row).sort((a, b) => b.col - a.col)[0];
    else return;
    e.preventDefault();
    if(target) cellFor(target.n).focus();
  });

  function highlightSeries(cat){
    toggleCategoryFilter(cat);
  }

  // ================= TOOLTIP =================
  function showQuickTooltip(e, el){
    const rect = e.currentTarget.getBoundingClientRect();
    const catName = CATEGORY_LABELS[el.cat] || el.cat;
    const block = getBlock(el).toUpperCase();
    const weight = el.w + " u";

    quickTooltip.innerHTML = `
      <div class="tooltip-header">
        <span style="color: var(--accent); font-family: 'JetBrains Mono', monospace;">[${el.n}] ${el.s}</span>
        <span>${el.name}</span>
      </div>
      <div class="tooltip-meta">${catName} · Bloque ${block} · ${el.phase} · ${weight}</div>
    `;

    quickTooltip.style.left = (rect.left + rect.width / 2) + "px";
    quickTooltip.style.top = (rect.top - 6) + "px";
    quickTooltip.style.display = "block";
  }

  function hideQuickTooltip(){
    quickTooltip.style.display = "none";
  }

  // ================= LEGEND =================
  function buildLegend(){
    legend.innerHTML = "";
    Object.keys(CATEGORY_LABELS).forEach(cat => {
      const count = ELEMENTS.filter(e => e.cat === cat).length;
      const item = document.createElement("button");
      item.type = "button";
      item.className = "legend-item";
      item.setAttribute("aria-pressed", "false");
      item.dataset.cat = cat;
      item.innerHTML = `
        <span class="legend-swatch cat-${cat}"></span>
        <span>${CATEGORY_LABELS[cat]} (${count})</span>
      `;
      item.addEventListener("click", () => toggleCategoryFilter(cat));
      legend.appendChild(item);
    });
  }

  function toggleCategoryFilter(cat){
    activeCategoryFilter = (activeCategoryFilter === cat) ? null : cat;
    document.querySelectorAll(".legend-item").forEach(li => {
      li.classList.toggle("active-filter", activeCategoryFilter === li.dataset.cat);
      li.setAttribute("aria-pressed", String(activeCategoryFilter === li.dataset.cat));
      li.classList.toggle("disabled", activeCategoryFilter && li.dataset.cat !== activeCategoryFilter);
    });
    applyFilters();
  }

  // ================= COLOR MODES & HEATMAPS =================
  function applyColorMode(){
    currentColorMode = colorModeSelect.value;
    const cells = document.querySelectorAll(".element-cell");

    if(currentColorMode === "cat"){
      heatmapScaleBar.style.display = "none";
      legend.style.display = "flex";
      cells.forEach(cell => {
        const num = parseInt(cell.dataset.number, 10);
        const el = ELEMENTS_BY_NUMBER[num];
        cell.className = `element-cell cat-${el.cat}`;
        cell.style.background = "";
        cell.style.color = "";
      });
    }
    else if(currentColorMode === "block"){
      heatmapScaleBar.style.display = "none";
      legend.style.display = "none";
      cells.forEach(cell => {
        const num = parseInt(cell.dataset.number, 10);
        const el = ELEMENTS_BY_NUMBER[num];
        const block = getBlock(el);
        cell.className = `element-cell block-${block}`;
        cell.style.background = "";
        cell.style.color = "";
      });
    }
    else if(currentColorMode === "phase"){
      heatmapScaleBar.style.display = "none";
      legend.style.display = "none";
      cells.forEach(cell => {
        const num = parseInt(cell.dataset.number, 10);
        const el = ELEMENTS_BY_NUMBER[num];
        const phase = getNormalizedPhase(el);
        cell.className = `element-cell phase-${phase}`;
        cell.style.background = "";
        cell.style.color = "";
      });
    }
    else if(currentColorMode === "electroneg"){
      legend.style.display = "none";
      heatmapScaleBar.style.display = "flex";
      heatmapMinVal.textContent = "0.70 (Fr)";
      heatmapMaxVal.textContent = "3.98 (F)";
      heatmapGradientTrack.style.background = "linear-gradient(90deg, #1e3a8a, #06b6d4, #10b981, #f59e0b, #ef4444)";

      cells.forEach(cell => {
        const num = parseInt(cell.dataset.number, 10);
        const el = ELEMENTS_BY_NUMBER[num];
        cell.className = "element-cell";
        if(el.en === null){
          cell.style.background = "#1e293b";
          cell.style.color = "#94a3b8";
        } else {
          // Normalize from 0.7 to 4.0
          const ratio = Math.max(0, Math.min(1, (el.en - 0.7) / (4.0 - 0.7)));
          paintHeat(cell, interpolateColor(ratio, [
            [0.0, [30, 58, 138]],
            [0.25, [6, 182, 212]],
            [0.5, [16, 185, 129]],
            [0.75, [245, 158, 11]],
            [1.0, [239, 68, 68]]
          ]));
        }
      });
    }
    else if(currentColorMode === "density"){
      legend.style.display = "none";
      heatmapScaleBar.style.display = "flex";
      heatmapMinVal.textContent = "0.00009 g/cm³ (H)";
      heatmapMaxVal.textContent = "22.59 g/cm³ (Os)";
      heatmapGradientTrack.style.background = "linear-gradient(90deg, #0f172a, #0284c7, #8b5cf6, #ec4899, #fbbf24)";

      cells.forEach(cell => {
        const num = parseInt(cell.dataset.number, 10);
        const el = ELEMENTS_BY_NUMBER[num];
        cell.className = "element-cell";
        if(el.den === null){
          cell.style.background = "#1e293b";
          cell.style.color = "#94a3b8";
        } else {
          // Logarithmic density scale
          const logVal = Math.log10(el.den + 0.0001);
          const minLog = Math.log10(0.00009 + 0.0001);
          const maxLog = Math.log10(22.59 + 0.0001);
          const ratio = Math.max(0, Math.min(1, (logVal - minLog) / (maxLog - minLog)));

          paintHeat(cell, interpolateColor(ratio, [
            [0.0, [15, 23, 42]],
            [0.3, [2, 132, 199]],
            [0.6, [139, 92, 246]],
            [0.85, [236, 72, 153]],
            [1.0, [251, 191, 36]]
          ]));
        }
      });
    }
    else if(currentColorMode === "year"){
      legend.style.display = "none";
      heatmapScaleBar.style.display = "flex";
      heatmapMinVal.textContent = "Antigüedad (Oro, Hierro...)";
      heatmapMaxVal.textContent = "2010 (Teneso)";
      heatmapGradientTrack.style.background = "linear-gradient(90deg, #d97706, #059669, #0284c7, #6366f1, #d946ef)";

      cells.forEach(cell => {
        const num = parseInt(cell.dataset.number, 10);
        const el = ELEMENTS_BY_NUMBER[num];
        cell.className = "element-cell";
        const yr = parseInt(el.year, 10);
        let ratio;
        if(isNaN(yr)) ratio = 0; // Antigüedad
        else ratio = Math.max(0.1, Math.min(1, (yr - 1600) / (2010 - 1600)));

        paintHeat(cell, interpolateColor(ratio, [
          [0.0, [217, 119, 6]],
          [0.3, [5, 150, 105]],
          [0.6, [2, 132, 199]],
          [0.85, [99, 102, 241]],
          [1.0, [217, 70, 239]]
        ]));
      });
    }

    applyFilters();
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

    document.querySelectorAll(".element-cell").forEach(cell => {
      const num = parseInt(cell.dataset.number, 10);
      const el = ELEMENTS_BY_NUMBER[num];
      let visible = true;

      // Category filter
      if(activeCategoryFilter && el.cat !== activeCategoryFilter) visible = false;

      // Phase filter
      if(activePhaseFilter !== "all" && getNormalizedPhase(el) !== activePhaseFilter) visible = false;

      // Block filter
      if(activeBlockFilter !== "all" && getBlock(el) !== activeBlockFilter) visible = false;

      // Search query
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
  }

  function resetFilters(){
    activeCategoryFilter = null;
    activePhaseFilter = "all";
    activeBlockFilter = "all";
    searchInput.value = "";

    document.querySelectorAll(".legend-item").forEach(li => {
      li.classList.remove("active-filter", "disabled");
      li.setAttribute("aria-pressed", "false");
    });
    setActiveChip(phaseFilterGroup, phaseFilterGroup.querySelector('[data-phase="all"]'));
    setActiveChip(blockFilterGroup, blockFilterGroup.querySelector('[data-block="all"]'));

    applyFilters();
  }

  // ================= MODAL & 3D VIEWER =================
  function openModal(number, updateHistory = true){
    currentNumber = number;
    const el = ELEMENTS_BY_NUMBER[number];
    if(!el) return;

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
    const protons = el.n;
    const neutrons = Math.max(0, el.m - el.n);
    const electrons = el.n;
    document.getElementById("protonCount").textContent = protons;
    document.getElementById("neutronCount").textContent = neutrons;
    document.getElementById("electronCount").textContent = electrons;

    // Properties
    const weightLabel = (el.w % 1 === 0) ? `[${el.w}]` : el.w;
    document.getElementById("dataMass").textContent = `${weightLabel} u (Isótopo ref: ${el.m})`;
    document.getElementById("dataPeriodGroup").textContent = `Periodo ${periodOf(el)} · Grupo ${groupOf(el)}`;
    document.getElementById("dataPhase").textContent = el.phase;
    document.getElementById("dataDensity").textContent = el.den !== null ? `${el.den} g/cm³` : "Desconocida";

    // Electronegativity with visual Pauling gauge
    if(el.en !== null){
      document.getElementById("dataElectroneg").textContent = `${el.en} (Pauling)`;
      const pct = Math.min(100, Math.max(0, (el.en / 4.0) * 100));
      document.getElementById("electronegGauge").style.width = `${pct}%`;
    } else {
      document.getElementById("dataElectroneg").textContent = "Sin datos";
      document.getElementById("electronegGauge").style.width = "0%";
    }

    // Melting & Boiling in K and °C
    if(el.mp !== null){
      const c = kelvinToCelsius(el.mp);
      document.getElementById("dataMelting").textContent = `${el.mp} K (${c} °C)`;
    } else {
      document.getElementById("dataMelting").textContent = "Desconocido";
    }

    if(el.bp !== null){
      const c = kelvinToCelsius(el.bp);
      document.getElementById("dataBoiling").textContent = `${el.bp} K (${c} °C)`;
    } else {
      document.getElementById("dataBoiling").textContent = "Desconocido";
    }

    document.getElementById("dataConfig").textContent = el.cfg;
    document.getElementById("dataYear").textContent = isNaN(parseInt(el.year, 10)) ? el.year : `Año ${el.year}`;
    document.getElementById("elementSummary").textContent = el.desc;

    // Bohr Shells breakdown
    const shells = getShellOccupancy(el.cfg);
    const shellBadges = shells.map((count, idx) => {
      const letter = SHELL_LETTERS[idx] || `n=${idx+1}`;
      return `<strong>${letter}</strong>: ${count}`;
    }).join(" &nbsp;·&nbsp; ");

    document.getElementById("shellInfo").innerHTML = `Capas Bohr (${shells.length}):<br>${shellBadges}`;

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
    if(updateHistory){
      const url = `#${el.s}`;
      if(wasOpen) history.replaceState({ element: el.s, modal: true }, "", url);
      else history.pushState({ element: el.s, modal: true }, "", url);
    }
  }

  // Visor 3D con respaldo 2D si Three.js o WebGL no están disponibles
  function renderAtom(el, shells){
    const container = document.getElementById("atomCanvasContainer");
    if(atomViewer === null && !viewerFailed){
      try {
        if(typeof THREE === "undefined") throw new Error("Three.js no cargado");
        atomViewer = new AtomViewer(container);
      } catch(err){
        viewerFailed = true;
        console.warn("Visor 3D no disponible, usando diagrama 2D:", err);
        document.querySelector(".viewer-controls-overlay").style.display = "none";
        document.querySelector(".viewer-hint").textContent = "Vista 2D · el modelo 3D no está disponible en este navegador";
      }
    }

    if(atomViewer){
      if(prefersReducedMotion && isSpinning) toggleSpinBtn.click(); // sin giro automático con movimiento reducido
      atomViewer.start();
      requestAnimationFrame(() => {
        atomViewer.onResize();
        atomViewer.render(el, shells);
      });
    } else {
      container.innerHTML = buildBohrSvg(el, shells);
    }
  }

  // Diagrama de Bohr estático en SVG (respaldo sin WebGL)
  function buildBohrSvg(el, shells){
    const size = 400, c = size / 2;
    const step = Math.min(24, 150 / Math.max(1, shells.length));
    let svg = `<svg class="bohr-2d" viewBox="0 0 ${size} ${size}" role="img" aria-label="Modelo de Bohr de ${el.name}">`;
    shells.forEach((count, idx) => {
      const r = 42 + (idx + 1) * step;
      svg += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="currentColor" stroke-opacity="0.3"/>`;
      for(let i = 0; i < count; i++){
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        svg += `<circle cx="${(c + Math.cos(a) * r).toFixed(1)}" cy="${(c + Math.sin(a) * r).toFixed(1)}" r="4" fill="var(--accent)"/>`;
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
    prevBtn.disabled = currentNumber <= 1;
    nextBtn.disabled = currentNumber >= 118;
    prevBtn.style.opacity = prevBtn.disabled ? 0.3 : 1;
    nextBtn.style.opacity = nextBtn.disabled ? 0.3 : 1;
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
    if(history.state && history.state.modal) history.back();
    else history.replaceState(null, "", window.location.pathname + window.location.search);
  }

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

  // Phase filter buttons
  phaseFilterGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if(!chip) return;
    setActiveChip(phaseFilterGroup, chip);
    activePhaseFilter = chip.dataset.phase;
    applyFilters();
  });

  // Block filter buttons
  blockFilterGroup.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if(!chip) return;
    setActiveChip(blockFilterGroup, chip);
    activeBlockFilter = chip.dataset.block;
    applyFilters();
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
      isSpinning = atomViewer.toggleAutoRotate();
      toggleSpinBtn.innerHTML = isSpinning
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
      toggleSpinBtn.title = isSpinning ? "Pausar giro automático" : "Reanudar giro automático";
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
      if(e.key === " " && atomViewer){
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

  // Initialize
  buildHeaders();
  buildGrid();
  buildLegend();
  checkUrlHash();

})();
