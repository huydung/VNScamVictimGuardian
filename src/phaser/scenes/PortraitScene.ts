import Phaser from "phaser";
import { resolveBackgroundAsset, resolveCharacterAsset } from "../../game/assets/assetMap";
import { COLORS, DEBUG_JUMPS, GAME_SIZE, GAME_TUNING, STAGE_THEMES, UI_COPY } from "../../game/config/gameConfig";
import type { Choice, DocumentRow, GameContent } from "../../game/data/types";
import { GameModel } from "../../game/simulation/GameModel";

type InitData = {
  content: GameContent;
};

export class PortraitScene extends Phaser.Scene {
  private model!: GameModel;
  private view!: Phaser.GameObjects.Container;
  private vfx!: Phaser.GameObjects.Container;
  private lastStage = "";
  private selectedDocumentId: string | null = null;
  private debugOpen = false;

  constructor() {
    super("PortraitScene");
  }

  init(data: InitData): void {
    this.model = new GameModel(data.content);
  }

  create(): void {
    this.view = this.add.container(0, 0);
    this.vfx = this.add.container(0, 0);
    this.createAmbientParticles();
    this.input.on("pointerup", (_pointer: Phaser.Input.Pointer, objects: Phaser.GameObjects.GameObject[]) => {
      if (objects.length > 0) return;
      if (this.selectedDocumentId) {
        this.selectedDocumentId = null;
        this.renderCurrentBeat();
        return;
      }
      if (this.model.currentChoices().length === 0) {
        this.playSound("sfx_click");
        this.model.continue();
        this.renderCurrentBeat();
      }
    });
    this.renderCurrentBeat();
  }

  private renderCurrentBeat(): void {
    this.view.removeAll(true);
    const beat = this.model.currentBeat();
    const currentDocIds = new Set(this.model.currentDocuments().map((doc) => doc.doc_id));
    if (this.selectedDocumentId && !currentDocIds.has(this.selectedDocumentId)) {
      this.selectedDocumentId = null;
    }
    const theme = STAGE_THEMES[beat.stage] ?? STAGE_THEMES.S1;
    if (this.lastStage && this.lastStage !== beat.stage) this.flash(theme.accent);
    this.lastStage = beat.stage;

    const bgKey = resolveBackgroundAsset(beat.bg_asset, beat.stage);
    this.view.add(this.add.image(540, 960, bgKey).setDisplaySize(1080, 1920));
    this.view.add(this.add.rectangle(540, 960, 1080, 1920, theme.tint, beat.stage === "S3" ? 0.25 : 0.14));
    this.drawTopHud(theme);
    this.drawSceneSubjects();
    this.drawEvidenceRail();
    if (this.model.isHub()) {
      this.drawHubPanel();
    } else {
      this.drawDialoguePanel();
      this.drawChoicePanel();
    }
    this.drawDebugPanel();
    this.drawDocumentModal();
  }

  private drawTopHud(theme: typeof STAGE_THEMES.S1): void {
    const beat = this.model.currentBeat();
    const top = this.add.graphics();
    top.fillStyle(COLORS.deep, 0.92);
    top.fillRoundedRect(42, 38, 996, 238, 28);
    top.lineStyle(3, theme.accent, 0.75);
    top.strokeRoundedRect(42, 38, 996, 238, 28);
    this.view.add(top);

    this.view.add(this.add.text(78, 62, UI_COPY.title, {
      fontFamily: "Georgia, serif",
      fontSize: "54px",
      color: "#fff2cf",
      fontStyle: "bold",
    }));
    this.view.add(this.add.text(78, 132, `${theme.label} · ${theme.mood}`, {
      fontFamily: "Arial",
      fontSize: "27px",
      color: "#d5c09a",
      wordWrap: { width: 680 },
    }));
    this.view.add(this.add.text(802, 76, beat.stage, {
      fontFamily: "Arial",
      fontSize: "64px",
      color: "#f2dfbd",
      fontStyle: "bold",
    }).setOrigin(0.5, 0));

    const qa = this.add.graphics();
    qa.fillStyle(this.debugOpen ? COLORS.gold : COLORS.ink, this.debugOpen ? 0.96 : 0.82);
    qa.fillRoundedRect(930, 58, 72, 48, 15);
    qa.lineStyle(2, COLORS.gold, 0.8);
    qa.strokeRoundedRect(930, 58, 72, 48, 15);
    const qaHit = this.add.zone(930, 58, 72, 48).setOrigin(0).setInteractive({ useHandCursor: true });
    qaHit.on("pointerup", () => {
      this.debugOpen = !this.debugOpen;
      this.selectedDocumentId = null;
      this.playSound("sfx_click");
      this.renderCurrentBeat();
    });
    this.view.add(qa);
    this.view.add(qaHit);
    this.view.add(this.add.text(966, 82, UI_COPY.debug, {
      fontFamily: "Arial",
      fontSize: "21px",
      color: this.debugOpen ? "#142225" : "#f8e8bf",
      fontStyle: "bold",
    }).setOrigin(0.5));

    const meters = this.model.state.meters;
    if (beat.stage === "S3") {
      this.drawMeter(78, 218, UI_COPY.money, meters.money, COLORS.gold);
      this.drawMeter(392, 218, UI_COPY.wellbeing, meters.wellbeing, COLORS.jade);
      this.drawMeter(704, 218, UI_COPY.relationship, meters.relationship, COLORS.red);
    } else {
      this.drawMeter(78, 218, UI_COPY.reputation, meters.rep, COLORS.gold);
      this.drawMeter(392, 218, UI_COPY.score, meters.score, COLORS.jade);
      this.drawMeter(704, 218, "Mở lòng", meters.openness, COLORS.red);
    }
  }

  private drawMeter(x: number, y: number, label: string, value: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.ink, 0.82);
    g.fillRoundedRect(x, y, 250, 38, 16);
    g.fillStyle(color, 0.92);
    g.fillRoundedRect(x + 4, y + 4, Math.max(8, (242 * value) / 100), 30, 14);
    this.view.add(g);
    this.view.add(this.add.text(x, y - 30, `${label} ${Math.round(value)}`, {
      fontFamily: "Arial",
      fontSize: "23px",
      color: "#f8e8bf",
    }));
  }

  private drawSceneSubjects(): void {
    const beat = this.model.currentBeat();
    const speakerId = beat.speaker_id ?? "narrator";
    const speakerAsset = resolveCharacterAsset(beat.char_asset ?? speakerId);
    const showPlayer = beat.stage === "S3" || beat.stage === "S0" || beat.stage === "CS1" || beat.stage === "CS2";
    if (showPlayer && speakerAsset !== "player") {
      const player = this.add.image(260, GAME_TUNING.portraitY + 60, "player")
        .setScale(GAME_TUNING.portraitScale * 0.88)
        .setAlpha(speakerId === "player" ? 1 : 0.68);
      this.view.add(player);
    }

    if (!["system", "narrator", "guidebook"].includes(speakerId) || beat.char_asset) {
      const x = showPlayer ? 760 : 560;
      const portrait = this.add.image(x, GAME_TUNING.portraitY, speakerAsset)
        .setScale(GAME_TUNING.portraitScale)
        .setAlpha(0.97);
      this.view.add(portrait);
      this.tweens.add({
        targets: portrait,
        y: portrait.y - 10,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    // Expressions drive portrait selection and ending mood; they are not shown as debug text in the player UI.
  }

  private drawEvidenceRail(): void {
    const docs = this.model.currentDocuments();
    if (docs.length === 0) return;
    const rail = this.add.graphics();
    rail.fillStyle(COLORS.deep, 0.72);
    rail.fillRoundedRect(50, GAME_TUNING.evidenceRailY, 980, GAME_TUNING.evidenceRailHeight, 24);
    rail.lineStyle(2, COLORS.gold, 0.55);
    rail.strokeRoundedRect(50, GAME_TUNING.evidenceRailY, 980, GAME_TUNING.evidenceRailHeight, 24);
    this.view.add(rail);
    this.view.add(this.add.text(82, 1034, UI_COPY.inspectEvidence, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#fff2cf",
      fontStyle: "bold",
    }));

    docs.slice(0, 4).forEach((doc, index) => {
      const x = 132 + index * 232;
      const key = doc.doc_id;
      const card = this.add.image(x, 1132, this.textures.exists(key) ? key : "doc_me_ritual_receipts")
        .setDisplaySize(GAME_TUNING.evidenceCardWidth, GAME_TUNING.evidenceCardHeight)
        .setAngle(index % 2 === 0 ? -2 : 2);
      this.view.add(card);
      const hit = this.add.zone(
        x - GAME_TUNING.evidenceCardWidth / 2,
        1132 - GAME_TUNING.evidenceCardHeight / 2,
        210,
        GAME_TUNING.evidenceCardHeight,
      ).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on("pointerup", () => {
        this.selectedDocumentId = doc.doc_id;
        this.playSound("sfx_reveal");
        this.renderCurrentBeat();
      });
      this.view.add(hit);
      this.view.add(this.add.text(x + 72, 1068, doc.name_vi, {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#f8e8bf",
        wordWrap: { width: 140 },
      }));
      if (doc.has_tell) {
        this.view.add(this.add.text(x + 72, 1158, "có dấu hiệu", {
          fontFamily: "Arial",
          fontSize: "19px",
          color: "#ffcf83",
        }));
      }
    });
  }

  private drawDialoguePanel(): void {
    const beat = this.model.currentBeat();
    const y = this.model.currentDocuments().length > 0 ? 1254 : 1136;
    const h = this.model.currentChoices().length > 0 ? 294 : 420;
    const panel = this.add.graphics();
    panel.fillStyle(0x07191d, 0.9);
    panel.fillRoundedRect(46, y, 988, h, 30);
    panel.lineStyle(4, COLORS.gold, 0.75);
    panel.strokeRoundedRect(46, y, 988, h, 30);
    this.view.add(panel);

    this.view.add(this.add.text(86, y + 34, this.model.speakerName(beat.speaker_id), {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#fff2cf",
      fontStyle: "bold",
    }));
    const dialogueFontSize = this.model.currentChoices().length > 0 && beat.text_vi.length > 155 ? 30 : 34;
    this.view.add(this.add.text(86, y + 88, beat.text_vi, {
      fontFamily: "Arial",
      fontSize: `${dialogueFontSize}px`,
      color: "#f6ead2",
      lineSpacing: dialogueFontSize === 30 ? 7 : 10,
      wordWrap: { width: 908 },
    }));
    if (this.model.currentChoices().length === 0 && beat.next_beat_id) {
      this.view.add(this.add.text(540, y + h - 28, UI_COPY.tapToContinue, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#d6a84e",
      }).setOrigin(0.5));
    }
  }

  private drawChoicePanel(): void {
    const choices = this.model.currentChoices();
    if (choices.length === 0) return;
    const startY = GAME_TUNING.choicePanelStartY;
    this.view.add(this.add.text(72, startY - 34, UI_COPY.chooseAction, {
      fontFamily: "Arial",
      fontSize: "29px",
      color: "#fff2cf",
      fontStyle: "bold",
    }));

    choices.slice(0, GAME_TUNING.choicePanelMaxChoices).forEach((choice, index) => {
      const enabled = this.model.canChoose(choice);
      const y = startY + index * (GAME_TUNING.choiceButtonHeight + GAME_TUNING.choiceButtonGap);
      const button = this.add.graphics();
      button.fillStyle(enabled ? COLORS.paper : 0x5f615f, enabled ? 0.96 : 0.72);
      button.fillRoundedRect(58, y, 964, GAME_TUNING.choiceButtonHeight, 26);
      button.lineStyle(4, enabled ? COLORS.gold : 0x777777, enabled ? 0.88 : 0.35);
      button.strokeRoundedRect(58, y, 964, GAME_TUNING.choiceButtonHeight, 26);
      const hit = this.add.zone(58, y, 964, GAME_TUNING.choiceButtonHeight)
        .setOrigin(0)
        .setInteractive({ useHandCursor: enabled });
      hit.on("pointerup", () => this.choose(choice, enabled));
      this.view.add(button);
      this.view.add(hit);
      const method = choice.method ? `${this.methodLabel(choice.method)} · ` : "";
      this.view.add(this.add.text(92, y + 20, `${method}${choice.label_vi}`, {
        fontFamily: "Arial",
        fontSize: `${GAME_TUNING.choiceFontSize}px`,
        color: enabled ? "#142225" : "#d8d8d0",
        wordWrap: { width: 880 },
      }));
    });
  }

  private drawHubPanel(): void {
    const beat = this.model.currentBeat();
    const actions = this.model.currentHubActionStates();
    const y = 1254;
    const panel = this.add.graphics();
    panel.fillStyle(0x07191d, 0.91);
    panel.fillRoundedRect(46, y, 988, 652, 30);
    panel.lineStyle(4, COLORS.gold, 0.78);
    panel.strokeRoundedRect(46, y, 988, 652, 30);
    this.view.add(panel);

    this.view.add(this.add.text(86, y + 34, "Kế hoạch trong ngày", {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#fff2cf",
      fontStyle: "bold",
    }));
    this.view.add(this.add.text(86, y + 86, beat.text_vi, {
      fontFamily: "Arial",
      fontSize: "29px",
      color: "#f6ead2",
      wordWrap: { width: 908 },
    }));

    actions.forEach((entry, index) => {
      const bx = 78;
      const by = y + 154 + index * 116;
      const enabled = entry.enabled;
      const selected = entry.selected;
      const g = this.add.graphics();
      g.fillStyle(selected ? 0x536b62 : enabled ? COLORS.paper : 0x4f5654, enabled ? 0.96 : 0.76);
      g.fillRoundedRect(bx, by, 924, 96, 24);
      g.lineStyle(4, selected ? COLORS.jade : enabled ? COLORS.gold : 0x777777, selected ? 0.9 : 0.68);
      g.strokeRoundedRect(bx, by, 924, 96, 24);
      const hit = this.add.zone(bx, by, 924, 96).setOrigin(0).setInteractive({ useHandCursor: enabled });
      hit.on("pointerup", () => this.chooseHubAction(entry.action.action_id, enabled));
      this.view.add(g);
      this.view.add(hit);

      const status = selected ? "Đã chọn" : enabled ? "Có thể chọn" : entry.lockedReason ?? "Đang khóa";
      this.view.add(this.add.text(bx + 28, by + 16, entry.action.label_vi, {
        fontFamily: "Arial",
        fontSize: "27px",
        color: enabled ? "#142225" : "#f4e2bd",
        fontStyle: "bold",
        wordWrap: { width: 520 },
      }));
      this.view.add(this.add.text(bx + 730, by + 18, status, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: enabled ? "#6d3d25" : "#f4c66e",
        align: "right",
        wordWrap: { width: 170 },
      }));
      this.view.add(this.add.text(bx + 28, by + 54, entry.action.reward, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: enabled ? "#233034" : "#ded0af",
        wordWrap: { width: 820 },
      }));
    });
  }

  private chooseHubAction(actionId: string, enabled: boolean): void {
    if (!enabled) {
      this.playSound("sfx_warning");
      this.flash(COLORS.red);
      return;
    }
    const started = this.model.startHubAction(actionId);
    this.playSound(started ? "sfx_reveal" : "sfx_warning");
    this.flash(started ? COLORS.jade : COLORS.red);
    this.renderCurrentBeat();
  }

  private methodLabel(method: string): string {
    const labels: Record<string, string> = {
      Belonging: "Gắn bó",
      Safe: "An toàn",
      Hope: "Hy vọng",
      Clarity: "Sáng tỏ",
      Backfire: "Phản tác dụng",
    };
    return labels[method] ?? method;
  }

  private isBackfire(choice: Choice): boolean {
    return choice.method === "Backfire" || choice.method === "Phản tác dụng";
  }

  private drawDocumentModal(): void {
    if (!this.selectedDocumentId) return;
    const doc = this.model.documentsById.get(this.selectedDocumentId);
    if (!doc) return;
    const overlay = this.add.rectangle(540, 960, 1080, 1920, 0x020708, 0.66)
      .setInteractive();
    overlay.on("pointerup", () => {
      this.selectedDocumentId = null;
      this.renderCurrentBeat();
    });
    this.view.add(overlay);

    const x = (GAME_SIZE.width - GAME_TUNING.documentModalWidth) / 2;
    const y = 328;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.deep, 0.98);
    panel.fillRoundedRect(x, y, GAME_TUNING.documentModalWidth, GAME_TUNING.documentModalHeight, 34);
    panel.lineStyle(5, COLORS.gold, 0.92);
    panel.strokeRoundedRect(x, y, GAME_TUNING.documentModalWidth, GAME_TUNING.documentModalHeight, 34);
    this.view.add(panel);

    this.view.add(this.add.text(x + 42, y + 38, UI_COPY.documentDetail, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#d6a84e",
      fontStyle: "bold",
    }));
    this.view.add(this.add.text(x + 42, y + 82, doc.name_vi, {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#fff2cf",
      fontStyle: "bold",
      wordWrap: { width: GAME_TUNING.documentModalWidth - 84 },
    }));

    const docKey = this.textures.exists(doc.doc_id) ? doc.doc_id : "doc_me_ritual_receipts";
    this.view.add(this.add.image(540, y + 380, docKey).setDisplaySize(310, 410));

    const detailY = y + 630;
    this.drawModalSection(x + 52, detailY, UI_COPY.fields, doc.fields_summary);
    this.drawModalSection(x + 52, detailY + 230, UI_COPY.tell, doc.tell_desc);
    if (doc.tactic_id) {
      this.view.add(this.add.text(x + 52, detailY + 486, `Chiêu: ${doc.tactic_id}`, {
        fontFamily: "Arial",
        fontSize: "25px",
        color: "#ffcf83",
      }));
    }

    const close = this.add.graphics();
    close.fillStyle(COLORS.gold, 0.95);
    close.fillRoundedRect(x + GAME_TUNING.documentModalWidth - 190, y + GAME_TUNING.documentModalHeight - 92, 140, 56, 16);
    const closeHit = this.add.zone(x + GAME_TUNING.documentModalWidth - 190, y + GAME_TUNING.documentModalHeight - 92, 140, 56)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    closeHit.on("pointerup", () => {
      this.selectedDocumentId = null;
      this.playSound("sfx_click");
      this.renderCurrentBeat();
    });
    this.view.add(close);
    this.view.add(closeHit);
    this.view.add(this.add.text(x + GAME_TUNING.documentModalWidth - 120, y + GAME_TUNING.documentModalHeight - 64, UI_COPY.close, {
      fontFamily: "Arial",
      fontSize: "25px",
      color: "#142225",
      fontStyle: "bold",
    }).setOrigin(0.5));
  }

  private drawModalSection(x: number, y: number, label: string, body: string): void {
    this.view.add(this.add.text(x, y, label, {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#d6a84e",
      fontStyle: "bold",
    }));
    this.view.add(this.add.text(x, y + 44, body, {
      fontFamily: "Arial",
      fontSize: "30px",
      color: "#f6ead2",
      lineSpacing: 8,
      wordWrap: { width: GAME_TUNING.documentModalWidth - 104 },
    }));
  }

  private drawDebugPanel(): void {
    if (!this.debugOpen) return;
    const x = (GAME_SIZE.width - GAME_TUNING.debugMenuWidth) / 2;
    const y = GAME_TUNING.debugMenuY;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.deep, 0.96);
    panel.fillRoundedRect(x, y, GAME_TUNING.debugMenuWidth, 390, 28);
    panel.lineStyle(4, COLORS.gold, 0.9);
    panel.strokeRoundedRect(x, y, GAME_TUNING.debugMenuWidth, 390, 28);
    this.view.add(panel);
    this.view.add(this.add.text(x + 34, y + 28, `${UI_COPY.debug} · ${UI_COPY.jump}`, {
      fontFamily: "Arial",
      fontSize: "31px",
      color: "#fff2cf",
      fontStyle: "bold",
    }));

    DEBUG_JUMPS.forEach((jump, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const bx = x + 34 + col * 286;
      const by = y + 92 + row * 86;
      const g = this.add.graphics();
      g.fillStyle(COLORS.paper, 0.95);
      g.fillRoundedRect(bx, by, 256, 62, 18);
      g.lineStyle(3, COLORS.gold, 0.65);
      g.strokeRoundedRect(bx, by, 256, 62, 18);
      const hit = this.add.zone(bx, by, 256, 62).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on("pointerup", () => {
        this.debugOpen = false;
        this.selectedDocumentId = null;
        this.model.goto(jump.beatId);
        this.playSound("sfx_click");
        this.flash(COLORS.gold);
        this.renderCurrentBeat();
      });
      this.view.add(g);
      this.view.add(hit);
      this.view.add(this.add.text(bx + 128, by + 32, jump.label, {
        fontFamily: "Arial",
        fontSize: "21px",
        color: "#142225",
        fontStyle: "bold",
      }).setOrigin(0.5));
    });
  }

  private choose(choice: Choice, enabled: boolean): void {
    if (!enabled) {
      this.playSound("sfx_warning");
      this.flash(COLORS.red);
      return;
    }
    this.playSound(this.isBackfire(choice) || choice.rep_delta && choice.rep_delta < 0 ? "sfx_warning" : "sfx_reveal");
    this.model.applyChoice(choice);
    this.flash(this.isBackfire(choice) ? COLORS.red : COLORS.jade);
    this.renderCurrentBeat();
  }

  private createAmbientParticles(): void {
    for (let i = 0; i < GAME_TUNING.particleCount; i += 1) {
      const dot = this.add.circle(
        Phaser.Math.Between(40, 1040),
        Phaser.Math.Between(260, 1820),
        Phaser.Math.Between(2, 6),
        COLORS.gold,
        Phaser.Math.FloatBetween(0.08, 0.24),
      );
      this.vfx.add(dot);
      this.tweens.add({
        targets: dot,
        y: dot.y - Phaser.Math.Between(80, 180),
        alpha: Phaser.Math.FloatBetween(0.03, 0.18),
        duration: Phaser.Math.Between(2600, 5200),
        repeat: -1,
        yoyo: true,
        ease: "Sine.inOut",
      });
    }
  }

  private flash(color: number): void {
    const rect = this.add.rectangle(540, 960, 1080, 1920, color, 0.18);
    this.vfx.add(rect);
    this.tweens.add({
      targets: rect,
      alpha: 0,
      duration: GAME_TUNING.vfxPulseMs,
      onComplete: () => rect.destroy(),
    });
  }

  private playSound(key: string): void {
    if (!this.sound.locked && this.cache.audio.exists(key)) {
      this.sound.play(key, { volume: 0.55 });
    }
  }
}
