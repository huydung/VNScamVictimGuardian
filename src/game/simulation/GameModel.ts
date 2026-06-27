import { GAME_TUNING } from "../config/gameConfig";
import type { Beat, Choice, DocumentRow, GameContent } from "../data/types";

export type MeterSnapshot = {
  rep: number;
  score: number;
  openness: number;
  money: number;
  wellbeing: number;
  relationship: number;
};

export type GameState = {
  currentBeatId: string;
  flags: Record<string, boolean | string | number>;
  revealedTactics: Set<string>;
  meters: MeterSnapshot;
  lastChoice?: Choice;
  endingId?: string;
};

function clamp(value: number): number {
  return Math.max(GAME_TUNING.meterMin, Math.min(GAME_TUNING.meterMax, value));
}

function numeric(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseFlags(flagSet?: string | null): Array<[string, boolean | string | number]> {
  if (!flagSet) return [];
  return flagSet
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [key, raw = "true"] = part.split("=").map((segment) => segment.trim());
      if (raw === "true") return [key, true];
      if (raw === "false") return [key, false];
      const number = Number(raw);
      return [key, Number.isFinite(number) ? number : raw];
    });
}

export class GameModel {
  readonly beatsById: Map<string, Beat>;
  readonly choicesByBeat: Map<string, Choice[]>;
  readonly charactersById: Map<string, string>;
  readonly documentsById: Map<string, DocumentRow>;
  readonly state: GameState;

  constructor(readonly content: GameContent) {
    this.beatsById = new Map(content.beats.map((beat) => [beat.beat_id, beat]));
    this.choicesByBeat = content.choices.reduce((map, choice) => {
      const choices = map.get(choice.beat_id) ?? [];
      choices.push(choice);
      choices.sort((a, b) => a.ord - b.ord);
      map.set(choice.beat_id, choices);
      return map;
    }, new Map<string, Choice[]>());
    this.charactersById = new Map(content.characters.map((character) => [character.char_id, character.name_vi]));
    this.documentsById = new Map(content.documents.map((document) => [document.doc_id, document]));
    this.state = {
      currentBeatId: GAME_TUNING.firstBeatId,
      flags: {},
      revealedTactics: new Set<string>(),
      meters: {
        rep: GAME_TUNING.defaultReputation,
        score: 0,
        openness: 40,
        money: GAME_TUNING.defaultMoney,
        wellbeing: GAME_TUNING.defaultWellbeing,
        relationship: GAME_TUNING.defaultRelationship,
      },
    };
  }

  currentBeat(): Beat {
    const beat = this.beatsById.get(this.state.currentBeatId);
    if (!beat) throw new Error(`Missing beat ${this.state.currentBeatId}`);
    return beat;
  }

  currentChoices(): Choice[] {
    return this.choicesByBeat.get(this.state.currentBeatId) ?? [];
  }

  currentDocuments(): DocumentRow[] {
    const docs = this.currentBeat().doc_assets?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
    if (docs.length > 0) {
      return docs.map((id) => this.documentsById.get(id)).filter(Boolean) as DocumentRow[];
    }
    const beat = this.currentBeat();
    if (beat.beat_type === "CHOICE" && beat.customer_id) {
      return [...this.documentsById.values()].filter((document) => document.customer_id === beat.customer_id);
    }
    return [];
  }

  canChoose(choice: Choice): boolean {
    if (!choice.req_target) return true;
    const target = choice.req_target;
    const op = choice.req_op;
    const required = choice.req_value;
    const current = target === "openness"
      ? this.state.meters.openness
      : target === "flag"
        ? this.state.flags[String(required)]
        : this.state.flags[target];
    if (op === ">=") return Number(current) >= Number(required);
    if (op === "<=") return Number(current) <= Number(required);
    if (required == null || required === true || required === "true") return Boolean(current);
    return current === required;
  }

  applyChoice(choice: Choice): void {
    this.state.lastChoice = choice;
    this.state.meters.rep = clamp(this.state.meters.rep + numeric(choice.rep_delta));
    this.state.meters.score = clamp(this.state.meters.score + numeric(choice.score_delta));
    this.state.meters.openness = clamp(this.state.meters.openness + numeric(choice.openness_delta));
    this.state.meters.money = clamp(this.state.meters.money + numeric(choice.money_delta));
    this.state.meters.wellbeing = clamp(this.state.meters.wellbeing + numeric(choice.wellbeing_delta));
    this.state.meters.relationship = clamp(this.state.meters.relationship + numeric(choice.relationship_delta));

    for (const [key, value] of parseFlags(choice.flag_set)) {
      this.state.flags[key] = value;
    }
    if (choice.reveal_tactic) this.state.revealedTactics.add(choice.reveal_tactic);
    if (choice.goto) this.goto(choice.goto);
  }

  continue(): void {
    const beat = this.currentBeat();
    if (beat.next_beat_id) {
      this.goto(beat.next_beat_id);
    }
  }

  goto(beatId: string): void {
    if (beatId === "HUB_D2") {
      this.state.currentBeatId = "d2t1";
      return;
    }
    this.state.currentBeatId = beatId;
    if (beatId === "ENDING") this.state.endingId = this.evaluateEnding();
  }

  speakerName(id?: string | null): string {
    if (!id) return "Hệ thống";
    if (id === "system") return "Hệ thống";
    if (id === "narrator") return "Người kể";
    if (id === "player") return "Bạn";
    if (id === "guidebook") return "Cẩm nang";
    return this.charactersById.get(id) ?? id;
  }

  evaluateEnding(): string {
    const { money, wellbeing, relationship } = this.state.meters;
    if (money >= 35 && wellbeing >= 50 && relationship >= 50 && this.state.flags.reported === true) return "best";
    if (money < 15 && (relationship < 20 || wellbeing < 20)) return "worst";
    return "mixed";
  }
}
