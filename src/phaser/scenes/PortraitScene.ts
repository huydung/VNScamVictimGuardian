import Phaser from "phaser";
import { resolveBackgroundAsset, resolveCharacterAsset } from "../../game/assets/assetMap";
import { COLORS, GAME_SIZE, GAME_TUNING, STAGE_THEMES, UI_COPY } from "../../game/config/gameConfig";
import type { Choice, GameContent } from "../../game/data/types";
import { GameModel } from "../../game/simulation/GameModel";

type InitData = {
  content: GameContent;
};

export class PortraitScene extends Phaser.Scene {
  private model!: GameModel;
  private view!: Phaser.GameObjects.Container;
  private vfx!: Phaser.GameObjects.Container;
  private lastStage = "";

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
    const theme = STAGE_THEMES[beat.stage] ?? STAGE_THEMES.S1;
    if (this.lastStage && this.lastStage !== beat.stage) this.flash(theme.accent);
    this.lastStage = beat.stage;

    const bgKey = resolveBackgroundAsset(beat.bg_asset, beat.stage);
    this.view.add(this.add.image(540, 960, bgKey).setDisplaySize(1080, 1920));
    this.view.add(this.add.rectangle(540, 960, 1080, 1920, theme.tint, beat.stage === "S3" ? 0.25 : 0.14));
    this.drawTopHud(theme);
    this.drawSceneSubjects();
    this.drawEvidenceRail();
    this.drawDialoguePanel();
    this.drawChoicePanel();
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

    const expression = beat.expression ? `Cảm xúc: ${beat.expression.split("_").join(" ")}` : "";
    if (expression) {
      this.view.add(this.add.text(72, 1010, expression, {
        fontFamily: "Arial",
        fontSize: "25px",
        color: "#f2dfbd",
        backgroundColor: "rgba(6, 25, 29, 0.62)",
        padding: { x: 16, y: 10 },
      }));
    }
  }

  private drawEvidenceRail(): void {
    const docs = this.model.currentDocuments();
    if (docs.length === 0) return;
    const rail = this.add.graphics();
    rail.fillStyle(COLORS.deep, 0.72);
    rail.fillRoundedRect(50, 1016, 980, 210, 24);
    rail.lineStyle(2, COLORS.gold, 0.55);
    rail.strokeRoundedRect(50, 1016, 980, 210, 24);
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
        .setDisplaySize(118, 156)
        .setAngle(index % 2 === 0 ? -2 : 2);
      this.view.add(card);
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
    const h = this.model.currentChoices().length > 0 ? 330 : 420;
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
    this.view.add(this.add.text(86, y + 88, beat.text_vi, {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#f6ead2",
      lineSpacing: 10,
      wordWrap: { width: 908 },
    }));
    if (beat.body_language) {
      this.view.add(this.add.text(86, y + h - 66, beat.body_language, {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#cfb98c",
        wordWrap: { width: 908 },
      }));
    }
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
    const startY = 1608;
    this.view.add(this.add.text(72, startY - 54, UI_COPY.chooseAction, {
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
      const method = choice.method ? `${choice.method} · ` : "";
      this.view.add(this.add.text(92, y + 20, `${method}${choice.label_vi}`, {
        fontFamily: "Arial",
        fontSize: "25px",
        color: enabled ? "#142225" : "#d8d8d0",
        wordWrap: { width: 880 },
      }));
    });
  }

  private choose(choice: Choice, enabled: boolean): void {
    if (!enabled) {
      this.playSound("sfx_warning");
      this.flash(COLORS.red);
      return;
    }
    this.playSound(choice.method === "Backfire" || choice.rep_delta && choice.rep_delta < 0 ? "sfx_warning" : "sfx_reveal");
    this.model.applyChoice(choice);
    this.flash(choice.method === "Backfire" ? COLORS.red : COLORS.jade);
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
