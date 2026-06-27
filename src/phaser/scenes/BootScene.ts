import Phaser from "phaser";
import { AUDIO, BACKGROUNDS, CHARACTERS, DOCUMENTS } from "../../game/assets/assetMap";
import { COLORS, GAME_SIZE } from "../../game/config/gameConfig";
import { loadGameContent } from "../../game/data/loadGameContent";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.deep);
    const loading = this.add.text(GAME_SIZE.width / 2, GAME_SIZE.height / 2, "Đang chuẩn bị ca trực...", {
      fontFamily: "Arial",
      fontSize: "42px",
      color: "#f2dfbd",
    }).setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      loading.setText(`Đang chuẩn bị ca trực... ${Math.round(value * 100)}%`);
    });

    for (const asset of [...BACKGROUNDS, ...CHARACTERS, ...DOCUMENTS]) {
      this.load.image(asset.key, asset.url);
    }
    for (const sound of AUDIO) {
      this.load.audio(sound.key, sound.url);
    }
  }

  async create(): Promise<void> {
    const content = await loadGameContent();
    this.scene.start("PortraitScene", { content });
  }
}
