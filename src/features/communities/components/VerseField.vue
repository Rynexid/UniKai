<script setup lang="ts">
import { HUE_CLASSES } from "@/features/communities/data/communities";
import type { HueKey } from "@/features/communities/data/communities";

interface VerseNode {
  x: number;
  y: number;
  name: string;
  hue: HueKey;
}

/** Posisi konstelasi pada viewBox 960x480 - kurasi manual agar membentuk web yang seimbang. */
const NODES: VerseNode[] = [
  { x: 480, y: 235, name: "Gaming", hue: "violet" },
  { x: 255, y: 120, name: "Anime & Manga", hue: "nebula" },
  { x: 140, y: 300, name: "VTubers", hue: "sun" },
  { x: 330, y: 370, name: "Teknologi", hue: "sky" },
  { x: 640, y: 120, name: "Programming", hue: "mint" },
  { x: 800, y: 250, name: "Open Source", hue: "violet" },
  { x: 720, y: 380, name: "Digital Products", hue: "sun" },
  { x: 420, y: 80, name: "Pendidikan", hue: "sky" },
  { x: 250, y: 230, name: "Hobi", hue: "mint" },
];

/** Pasangan node yang terhubung (graf konstelasi). */
const LINKS: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 7],
  [0, 8],
  [1, 7],
  [1, 8],
  [2, 3],
  [3, 8],
  [4, 5],
  [4, 7],
  [5, 6],
];

const GLOW_IDS: Record<HueKey, string> = {
  violet: "url(#verse-glow-violet)",
  sun: "url(#verse-glow-sun)",
  nebula: "url(#verse-glow-nebula)",
  sky: "url(#verse-glow-sky)",
  mint: "url(#verse-glow-mint)",
};

const FILLS: Record<HueKey, string> = {
  violet: "#8B7DFF",
  sun: "#FF9A63",
  nebula: "#E7A6FF",
  sky: "#6CC9FF",
  mint: "#5FE8C4",
};
</script>

<template>
  <svg
    role="img"
    aria-label="Peta konstelasi komunitas UniKai Verse"
    viewBox="0 0 960 480"
    class="h-full w-full"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <radialGradient v-for="hue in (['violet','sun','nebula','sky','mint'] as HueKey[])" :id="`verse-glow-${hue}`">
        <stop offset="0%" :stop-color="FILLS[hue]" stop-opacity="0.9" />
        <stop offset="100%" :stop-color="FILLS[hue]" stop-opacity="0" />
      </radialGradient>
    </defs>

    <g class="verse-lines" stroke="#8B7DFF" stroke-width="1">
      <line
        v-for="(link, i) in LINKS"
        :key="i"
        :x1="NODES[link[0]]!.x"
        :y1="NODES[link[0]]!.y"
        :x2="NODES[link[1]]!.x"
        :y2="NODES[link[1]]!.y"
        :style="{ animationDelay: `${(i % 5) * 0.9}s` }"
      />
    </g>

    <g
      v-for="(node, i) in NODES"
      :key="node.name"
      class="group cursor-default"
    >
      <circle
        class="verse-glow"
        :cx="node.x"
        :cy="node.y"
        r="22"
        :fill="GLOW_IDS[node.hue]"
        :style="{ animationDelay: `${i * 0.55}s` }"
      />
      <circle
        class="transition-transform duration-300 group-hover:scale-150"
        :cx="node.x"
        :cy="node.y"
        r="3.5"
        :fill="FILLS[node.hue]"
      />
      <text
        :x="node.x"
        :y="node.y + 38"
        text-anchor="middle"
        class="pointer-events-none fill-current text-xs font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        :class="HUE_CLASSES[node.hue].text"
      >
        {{ node.name }}
      </text>
    </g>
  </svg>
</template>
