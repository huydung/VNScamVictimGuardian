import { GAME_TUNING } from "../config/gameConfig";
import type { Beat, Choice, DocumentRow, GameContent, S3HubAction } from "../data/types";

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
  s3ActionsByDay: Record<number, string[]>;
  lastChoice?: Choice;
  endingId?: string;
};

export type HubActionState = {
  action: S3HubAction;
  enabled: boolean;
  selected: boolean;
  lockedReason?: string;
  startBeatId?: string;
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
  readonly s3HubsByDay: Map<number, S3HubAction[]>;
  readonly s3FirstBeatByScene: Map<string, string>;
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
    this.s3HubsByDay = content.s3Hubs.reduce((map, action) => {
      const actions = map.get(action.day) ?? [];
      actions.push(action);
      map.set(action.day, actions);
      return map;
    }, new Map<number, S3HubAction[]>());
    this.s3FirstBeatByScene = new Map(
      content.beats
        .filter((beat) => beat.stage === "S3" && beat.beat_idx === 1)
        .map((beat) => [String(beat.scene), beat.beat_id]),
    );
    this.state = {
      currentBeatId: GAME_TUNING.firstBeatId,
      flags: {},
      revealedTactics: new Set<string>(),
      s3ActionsByDay: {
        1: [],
        2: [],
      },
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
    const hubDay = this.currentHubDay();
    if (hubDay) return this.syntheticHubBeat(hubDay);
    const beat = this.beatsById.get(this.state.currentBeatId);
    if (!beat) throw new Error(`Missing beat ${this.state.currentBeatId}`);
    return beat;
  }

  currentChoices(): Choice[] {
    if (this.isHub()) return [];
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

  isHub(): boolean {
    return this.currentHubDay() !== null;
  }

  currentHubDay(): number | null {
    if (this.state.currentBeatId === "HUB_D1") return 1;
    if (this.state.currentBeatId === "HUB_D2") return 2;
    return null;
  }

  currentHubActionStates(): HubActionState[] {
    const day = this.currentHubDay();
    if (!day) return [];
    const selected = new Set(this.state.s3ActionsByDay[day] ?? []);
    return (this.s3HubsByDay.get(day) ?? []).map((action) => {
      const startBeatId = this.s3FirstBeatByScene.get(action.opens_scene);
      const isSelected = selected.has(action.action_id);
      const missingGate = action.gate_flag && !this.state.flags[action.gate_flag];
      return {
        action,
        selected: isSelected,
        startBeatId,
        enabled: Boolean(startBeatId) && !isSelected && !missingGate,
        lockedReason: isSelected
          ? "Đã chọn trong ngày này"
          : missingGate
            ? `Cần mở khóa: ${action.gate_flag}`
            : !startBeatId
              ? "Thiếu cảnh mở đầu"
              : undefined,
      };
    });
  }

  startHubAction(actionId: string): boolean {
    const day = this.currentHubDay();
    if (!day) return false;
    const state = this.currentHubActionStates().find((entry) => entry.action.action_id === actionId);
    if (!state?.enabled || !state.startBeatId) return false;
    const selected = this.state.s3ActionsByDay[day] ?? [];
    this.state.s3ActionsByDay[day] = [...selected, actionId];
    this.goto(state.startBeatId, { bypassHubRedirect: true });
    return true;
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
    if (beat.beat_id === "d1_end" && this.needsMoreHubActions(1)) {
      this.goto("HUB_D1");
      return;
    }
    if (beat.beat_id === "d2_end" && this.needsMoreHubActions(2)) {
      this.goto("HUB_D2");
      return;
    }
    if (beat.next_beat_id) {
      this.goto(beat.next_beat_id);
    }
  }

  goto(beatId: string, options: { bypassHubRedirect?: boolean } = {}): void {
    if (!options.bypassHubRedirect && beatId === "d1n1" && (this.state.s3ActionsByDay[1] ?? []).length === 0) {
      this.state.currentBeatId = "HUB_D1";
      return;
    }
    if (beatId === "HUB_D1" || beatId === "HUB_D2") {
      this.state.currentBeatId = beatId;
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

  private needsMoreHubActions(day: number): boolean {
    const actions = this.s3HubsByDay.get(day) ?? [];
    const pickCount = actions[0]?.pick_count ?? 1;
    return (this.state.s3ActionsByDay[day] ?? []).length < pickCount;
  }

  private syntheticHubBeat(day: number): Beat {
    const selected = this.state.s3ActionsByDay[day]?.length ?? 0;
    const actions = this.s3HubsByDay.get(day) ?? [];
    const pickCount = actions[0]?.pick_count ?? 1;
    const docAssets = day === 1
      ? "doc_me_zalo_chat_thay,doc_me_lucky_day_calendar"
      : "doc_me_ritual_receipts,doc_me_bank_transfer_history,doc_me_thay_account_warning";
    return {
      beat_id: `HUB_D${day}`,
      stage: "S3",
      scene: `DAY${day}`,
      customer_id: null,
      beat_idx: null,
      beat_type: "HUB",
      speaker_id: "narrator",
      speakers_on_screen: "player,me",
      active_speaker: null,
      text_vi: day === 1
        ? `Ngày 1: chọn ${pickCount} hướng tiếp cận. Đã chọn ${selected}/${pickCount}.`
        : `Ngày 2: chọn ${pickCount} hướng tiếp cận trước hạn cuối. Đã chọn ${selected}/${pickCount}.`,
      expression: null,
      body_language: null,
      auto_advance: false,
      next_beat_id: null,
      bg_asset: "bg_home",
      char_asset: "char_me_neutral",
      doc_assets: docAssets,
      reveal_tactic: null,
      notes: "Virtual hub beat generated from DATA_S3_Hubs.",
    };
  }
}
