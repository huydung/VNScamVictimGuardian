import { GAME_TUNING } from "./gameConfig";
import type { RuntimeConfig } from "../data/types";

export type GameRuntimeSettings = {
  firstBeatId: string;
  meterMin: number;
  meterMax: number;
  defaultMoney: number;
  defaultWellbeing: number;
  defaultRelationship: number;
  defaultReputation: number;
  defaultOpenness: number;
};

function numberValue(value: string | number | boolean | null | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function stringValue(value: string | number | boolean | null | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function clampRange(value: string | number | boolean | null | undefined): [number, number] {
  if (typeof value !== "string") return [GAME_TUNING.meterMin, GAME_TUNING.meterMax];
  const match = value.match(/-?\d+(?:\.\d+)?/g);
  if (!match || match.length < 2) return [GAME_TUNING.meterMin, GAME_TUNING.meterMax];
  const min = Number(match[0]);
  const max = Number(match[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return [GAME_TUNING.meterMin, GAME_TUNING.meterMax];
  }
  return [min, max];
}

export function buildRuntimeSettings(config: RuntimeConfig): GameRuntimeSettings {
  const values = config.values ?? {};
  const [meterMin, meterMax] = clampRange(values["meter.clamp"]);
  return {
    firstBeatId: stringValue(values["flow.firstBeat"], GAME_TUNING.firstBeatId),
    meterMin,
    meterMax,
    defaultMoney: numberValue(values["meter.money.start"], GAME_TUNING.defaultMoney),
    defaultWellbeing: numberValue(values["meter.wellbeing.start"], GAME_TUNING.defaultWellbeing),
    defaultRelationship: numberValue(values["meter.relationship.start"], GAME_TUNING.defaultRelationship),
    defaultReputation: numberValue(values["s1.repStart"], GAME_TUNING.defaultReputation),
    defaultOpenness: numberValue(values["meter.openness.start"], GAME_TUNING.defaultOpenness),
  };
}
