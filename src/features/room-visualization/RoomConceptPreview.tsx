import type { CSSProperties } from "react";

import type { ConceptMarker } from "./types";

/**
 * Statičen konceptni prikaz prihodnje vizualizacije prostora.
 * Gre za risbo, ne za fotografijo ali rezultat analize. Ko bo funkcija
 * razvita, se ta komponenta zamenja z dejanskim urejevalnikom postavitve.
 */

export const CONCEPT_PREVIEW_LABEL =
  "Konceptni prikaz prihodnje funkcije — vizualizacija še ni na voljo.";

const VIEW_W = 800;
const VIEW_H = 520;
const VP = { x: 400, y: 200 };
const BACK = { x0: 190, x1: 610, y0: 70, y1: 330 };

const markers: (ConceptMarker & {
  box: string;
})[] = [
  {
    label: "1",
    position: { x: 505 / VIEW_W, y: 96 / VIEW_H },
    box: "M480 124 h50 v34 h-50 Z",
  },
  {
    label: "2",
    position: { x: 604 / VIEW_W, y: 202 / VIEW_H },
    box: "M505 228 h62 v28 h-62 Z",
  },
  {
    label: "3",
    position: { x: 186 / VIEW_W, y: 384 / VIEW_H },
    box: "M150 470 L250 470 L262 432 L170 432 Z",
  },
];

function floorX(xBack: number, y: number) {
  return VP.x + ((xBack - VP.x) * (y - VP.y)) / (BACK.y1 - VP.y);
}

function scale(x: number, y: number, s: number): [number, number] {
  return [VP.x + (x - VP.x) * s, VP.y + (y - VP.y) * s];
}

export function RoomConceptPreview() {
  const boardXs = [250, 310, 370, 430, 490, 550];
  const depthYs = [352, 382, 420, 470];

  // Komoda ob zadnji steni (enotočkovna perspektiva).
  const s = 1.25;
  const [ftlx, ftly] = scale(430, 255, s);
  const [ftrx, ftry] = scale(600, 255, s);
  const [fblx, fbly] = scale(430, 330, s);
  const [fbrx, fbry] = scale(600, 330, s);

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-labelledby="sobni-koncept-naslov"
      className="h-auto w-full"
    >
      <title id="sobni-koncept-naslov">
        Konceptna risba prostora z oknom, polico in komodo ter tremi
        oštevilčenimi oznakami možnih postavitev izdelkov.
      </title>

      <rect width={VIEW_W} height={VIEW_H} fill="#0b0e11" />

      {/* Stene, strop, tla */}
      <g fill="none" stroke="#364350" strokeWidth="1.2">
        <polygon
          points={`0,0 ${BACK.x0},${BACK.y0} ${BACK.x0},${BACK.y1} 0,${VIEW_H}`}
          fill="#10151a"
        />
        <polygon
          points={`${VIEW_W},0 ${BACK.x1},${BACK.y0} ${BACK.x1},${BACK.y1} ${VIEW_W},${VIEW_H}`}
          fill="#10151a"
        />
        <polygon
          points={`0,0 ${VIEW_W},0 ${BACK.x1},${BACK.y0} ${BACK.x0},${BACK.y0}`}
          fill="#0e1317"
        />
        <polygon
          points={`${BACK.x0},${BACK.y1} ${BACK.x1},${BACK.y1} ${VIEW_W},${VIEW_H} 0,${VIEW_H}`}
          fill="#12181e"
        />
        <rect
          x={BACK.x0}
          y={BACK.y0}
          width={BACK.x1 - BACK.x0}
          height={BACK.y1 - BACK.y0}
          fill="#151b21"
        />
      </g>

      {/* Talne deske */}
      <g stroke="#232c36" strokeWidth="1">
        {boardXs.map((x) => (
          <line
            key={x}
            x1={x}
            y1={BACK.y1}
            x2={floorX(x, VIEW_H)}
            y2={VIEW_H}
          />
        ))}
        {depthYs.map((y) => (
          <line
            key={y}
            x1={BACK.x0 - (y - BACK.y1)}
            y1={y}
            x2={BACK.x1 + (y - BACK.y1)}
            y2={y}
          />
        ))}
      </g>

      {/* Okno */}
      <g stroke="#4a5a6a" strokeWidth="1.2">
        <rect x="235" y="105" width="130" height="150" fill="#182029" />
        <line x1="300" y1="105" x2="300" y2="255" />
        <line x1="235" y1="180" x2="365" y2="180" />
        <line
          x1="225"
          y1="255"
          x2="375"
          y2="255"
          strokeWidth="3"
          stroke="#364350"
        />
      </g>
      <g stroke="#ffffff" strokeOpacity="0.05">
        <line x1="245" y1="170" x2="290" y2="115" />
        <line x1="310" y1="245" x2="355" y2="190" />
      </g>

      {/* Polica */}
      <rect
        x="455"
        y="158"
        width="130"
        height="6"
        fill="#26313c"
        stroke="#4a5a6a"
      />
      <line x1="470" y1="164" x2="470" y2="176" stroke="#4a5a6a" />
      <line x1="570" y1="164" x2="570" y2="176" stroke="#4a5a6a" />

      {/* Komoda */}
      <g stroke="#4a5a6a" strokeWidth="1.2">
        <polygon
          points={`430,255 600,255 ${ftrx},${ftry} ${ftlx},${ftly}`}
          fill="#26313c"
        />
        <polygon
          points={`430,255 ${ftlx},${ftly} ${fblx},${fbly} 430,330`}
          fill="#161d24"
        />
        <polygon
          points={`${ftlx},${ftly} ${ftrx},${ftry} ${fbrx},${fbry} ${fblx},${fbly}`}
          fill="#1b232c"
        />
        <line
          x1={ftlx}
          y1={(ftly + fbly) / 2}
          x2={ftrx}
          y2={(ftry + fbry) / 2}
        />
        <line
          x1={(ftlx + ftrx) / 2 - 14}
          y1={(ftly + fbly) / 2 - 18}
          x2={(ftlx + ftrx) / 2 + 14}
          y2={(ftly + fbly) / 2 - 18}
          strokeWidth="2"
        />
        <line
          x1={(ftlx + ftrx) / 2 - 14}
          y1={(ftly + fbly) / 2 + 22}
          x2={(ftlx + ftrx) / 2 + 14}
          y2={(ftly + fbly) / 2 + 22}
          strokeWidth="2"
        />
      </g>

      {/* Oznake postavitev */}
      {markers.map((marker, index) => {
        const px = marker.position.x * VIEW_W;
        const py = marker.position.y * VIEW_H;
        return (
          <g
            key={marker.label}
            className="scene-marker"
            style={{ "--i": index } as CSSProperties}
          >
            <path
              d={marker.box}
              fill="#38c8ff"
              fillOpacity="0.1"
              stroke="#38c8ff"
              strokeWidth="1.4"
              strokeDasharray="5 4"
            />
            <circle
              cx={px}
              cy={py}
              r="20"
              fill="#0a0d10"
              stroke="#38c8ff"
              strokeWidth="2"
            />
            <text
              x={px}
              y={py + 6.5}
              textAnchor="middle"
              fontSize="19"
              fill="#38c8ff"
              className="font-mono"
              aria-hidden="true"
            >
              {marker.label}
            </text>
          </g>
        );
      })}

      {/* Okvir */}
      <g stroke="#38c8ff" strokeOpacity="0.7" strokeWidth="1.5" fill="none">
        <path d="M14 34 V14 H34" />
        <path d={`M${VIEW_W - 34} 14 H${VIEW_W - 14} V34`} />
        <path d={`M14 ${VIEW_H - 34} V${VIEW_H - 14} H34`} />
        <path
          d={`M${VIEW_W - 34} ${VIEW_H - 14} H${VIEW_W - 14} V${VIEW_H - 34}`}
        />
      </g>
    </svg>
  );
}
