import {
  type BoxSpec,
  boxFaces,
  boxLayerLines,
  createIso,
  frontArc,
  isoEllipse,
} from "./iso";

/**
 * Konceptna grafika za uvodni del: abstraktna telesa na tiskalni plošči,
 * eno od njih med tiskanjem. Ne prikazuje dejanskih izdelkov.
 */

const iso = createIso(280, 150);

const PLATE = 300;
const GRID_STEP = 30;

const finishedBox: BoxSpec = { x: [175, 265], y: [35, 115], z: [0, 125] };
const printedBox: BoxSpec = { x: [70, 210], y: [165, 265], z: [0, 46] };
const plannedBox: BoxSpec = { x: [70, 210], y: [165, 265], z: [0, 112] };

const cylinder = { center: [75, 80] as const, radius: 42, height: 92 };

function plannedEdges(box: BoxSpec) {
  const [x0, x1] = box.x;
  const [y0, y1] = box.y;
  const [z0, z1] = box.z;
  return [
    // navpični robovi
    iso.line([x0, y1, z0], [x0, y1, z1]),
    iso.line([x1, y1, z0], [x1, y1, z1]),
    iso.line([x1, y0, z0], [x1, y0, z1]),
    iso.line([x0, y0, z0], [x0, y0, z1]),
    // zgornji robovi
    iso.line([x0, y0, z1], [x1, y0, z1]),
    iso.line([x1, y0, z1], [x1, y1, z1]),
    iso.line([x1, y1, z1], [x0, y1, z1]),
    iso.line([x0, y1, z1], [x0, y0, z1]),
  ];
}

function infillLines(box: BoxSpec, step: number) {
  const [x0, x1] = box.x;
  const [y0, y1] = box.y;
  const z = box.z[1];
  const lines: ReturnType<typeof iso.line>[] = [];
  for (let x = x0 + step; x < x1; x += step) {
    lines.push(iso.line([x, y0, z], [x, y1, z]));
  }
  return lines;
}

export function HeroComposition() {
  const plate = iso.polygon([
    [0, 0, 0],
    [PLATE, 0, 0],
    [PLATE, PLATE, 0],
    [0, PLATE, 0],
  ]);
  const plateEdge = iso.polygon([
    [PLATE, 0, 0],
    [PLATE, PLATE, 0],
    [PLATE, PLATE, -10],
    [PLATE, 0, -10],
  ]);
  const plateEdgeLeft = iso.polygon([
    [0, PLATE, 0],
    [PLATE, PLATE, 0],
    [PLATE, PLATE, -10],
    [0, PLATE, -10],
  ]);

  const grid: ReturnType<typeof iso.line>[] = [];
  for (let i = GRID_STEP; i < PLATE; i += GRID_STEP) {
    grid.push(iso.line([i, 0, 0], [i, PLATE, 0]));
    grid.push(iso.line([0, i, 0], [PLATE, i, 0]));
  }

  const finished = boxFaces(iso, finishedBox);
  const finishedLayers = boxLayerLines(iso, finishedBox, 6);
  const printed = boxFaces(iso, printedBox);
  const printedLayers = boxLayerLines(iso, printedBox, 5);
  const planned = plannedEdges(plannedBox);
  const infill = infillLines(printedBox, 10);

  const cylBase = isoEllipse(iso, [...cylinder.center, 0], cylinder.radius);
  const cylTop = isoEllipse(
    iso,
    [...cylinder.center, cylinder.height],
    cylinder.radius,
  );
  const cylLayers: string[] = [];
  for (let z = 6; z < cylinder.height; z += 6) {
    cylLayers.push(
      frontArc(isoEllipse(iso, [...cylinder.center, z], cylinder.radius)),
    );
  }
  const cylBody = `M ${(cylBase.cx - cylBase.rx).toFixed(1)} ${cylBase.cy.toFixed(1)}
    L ${(cylTop.cx - cylTop.rx).toFixed(1)} ${cylTop.cy.toFixed(1)}
    L ${(cylTop.cx + cylTop.rx).toFixed(1)} ${cylTop.cy.toFixed(1)}
    L ${(cylBase.cx + cylBase.rx).toFixed(1)} ${cylBase.cy.toFixed(1)}
    A ${cylBase.rx.toFixed(1)} ${cylBase.ry.toFixed(1)} 0 0 1 ${(cylBase.cx - cylBase.rx).toFixed(1)} ${cylBase.cy.toFixed(1)} Z`;

  const [nozzleX, nozzleY] = iso.project([182, 238, printedBox.z[1]]);

  const [axisX, axisY] = iso.project([0, PLATE, 0]);

  return (
    <svg
      viewBox="0 0 560 480"
      role="img"
      aria-labelledby="hero-grafika-naslov"
      className="h-auto w-full"
    >
      <title id="hero-grafika-naslov">
        Konceptna grafika: abstraktna telesa na tiskalni plošči, eno od njih se
        tiska sloj za slojem.
      </title>
      <defs>
        <linearGradient id="hero-cyl" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#19212a" />
          <stop offset="0.55" stopColor="#222c37" />
          <stop offset="1" stopColor="#141a21" />
        </linearGradient>
        <linearGradient id="hero-nozzle" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#38c8ff" stopOpacity="0" />
          <stop offset="1" stopColor="#38c8ff" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Tiskalna plošča */}
      <polygon
        points={plateEdge}
        fill="#0d1115"
        stroke="#2a3440"
        strokeWidth="1"
      />
      <polygon
        points={plateEdgeLeft}
        fill="#0b0f13"
        stroke="#2a3440"
        strokeWidth="1"
      />
      <polygon points={plate} fill="#10161b" stroke="#364350" strokeWidth="1" />
      <g stroke="#1f2932" strokeWidth="1">
        {grid.map((l, i) => (
          <line key={i} {...l} />
        ))}
      </g>

      {/* Osi */}
      <g className="font-mono" fontSize="10" fill="#8a98a6" aria-hidden="true">
        <line
          x1={axisX}
          y1={axisY + 22}
          x2={axisX + 26}
          y2={axisY + 37}
          stroke="#38c8ff"
          strokeOpacity="0.7"
        />
        <text x={axisX + 30} y={axisY + 44}>
          X
        </text>
        <line
          x1={axisX}
          y1={axisY + 22}
          x2={axisX - 26}
          y2={axisY + 37}
          stroke="#38c8ff"
          strokeOpacity="0.7"
        />
        <text x={axisX - 38} y={axisY + 44}>
          Y
        </text>
        <line
          x1={axisX}
          y1={axisY + 22}
          x2={axisX}
          y2={axisY - 6}
          stroke="#38c8ff"
          strokeOpacity="0.7"
        />
        <text x={axisX + 5} y={axisY - 2}>
          Z
        </text>
      </g>

      {/* Valj */}
      <path
        d={cylBody}
        fill="url(#hero-cyl)"
        stroke="#3a4756"
        strokeWidth="1"
      />
      <g fill="none" stroke="#ffffff" strokeOpacity="0.07">
        {cylLayers.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <ellipse {...cylTop} fill="#26313c" stroke="#4a5a6a" strokeWidth="1" />
      <ellipse
        cx={cylTop.cx}
        cy={cylTop.cy}
        rx={cylTop.rx * 0.55}
        ry={cylTop.ry * 0.55}
        fill="#161d24"
        stroke="#3a4756"
      />

      {/* Dokončan kvader */}
      <polygon
        points={finished.left}
        fill="#151b22"
        stroke="#3a4756"
        strokeWidth="1"
      />
      <polygon
        points={finished.right}
        fill="#1b232c"
        stroke="#3a4756"
        strokeWidth="1"
      />
      <g stroke="#ffffff" strokeOpacity="0.07">
        {finishedLayers.map((l, i) => (
          <line key={i} {...l} />
        ))}
      </g>
      <polygon
        points={finished.top}
        fill="#26313c"
        stroke="#4a5a6a"
        strokeWidth="1"
      />

      {/* Telo med tiskanjem */}
      <g
        stroke="#38c8ff"
        strokeOpacity="0.45"
        strokeDasharray="4 5"
        strokeWidth="1"
      >
        {planned.map((l, i) => (
          <line key={i} {...l} />
        ))}
      </g>
      <polygon
        points={printed.left}
        fill="#151b22"
        stroke="#3a4756"
        strokeWidth="1"
      />
      <polygon
        points={printed.right}
        fill="#1b232c"
        stroke="#3a4756"
        strokeWidth="1"
      />
      <g stroke="#ffffff" strokeOpacity="0.08">
        {printedLayers.map((l, i) => (
          <line key={i} {...l} />
        ))}
      </g>
      <polygon
        points={printed.top}
        fill="#38c8ff"
        fillOpacity="0.1"
        stroke="#38c8ff"
        strokeWidth="1.5"
      />
      <g stroke="#38c8ff" strokeOpacity="0.35">
        {infill.map((l, i) => (
          <line key={i} {...l} />
        ))}
      </g>

      {/* Šoba */}
      <line
        x1={nozzleX}
        y1={nozzleY - 150}
        x2={nozzleX}
        y2={nozzleY - 44}
        stroke="url(#hero-nozzle)"
        strokeWidth="1"
      />
      <path
        d={`M ${nozzleX - 13} ${nozzleY - 44} h 26 v 18 l -9 10 h -8 l -9 -10 Z`}
        fill="#1b232c"
        stroke="#4a5a6a"
      />
      <path
        d={`M ${nozzleX - 3} ${nozzleY - 16} h 6 l -3 9 Z`}
        fill="#38c8ff"
      />
      <circle cx={nozzleX} cy={nozzleY - 3} r="3" fill="#38c8ff" />
      <circle
        cx={nozzleX}
        cy={nozzleY - 3}
        r="9"
        fill="#38c8ff"
        fillOpacity="0.15"
      />
    </svg>
  );
}
