import Phaser from "phaser";
import { PortraitScene } from "./phaser/scenes/PortraitScene";
import { BootScene } from "./phaser/scenes/BootScene";
import "./styles.css";

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: "app",
  backgroundColor: "#071f24",
  width: 1080,
  height: 1920,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1080,
    height: 1920,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  audio: {
    disableWebAudio: false,
  },
  scene: [BootScene, PortraitScene],
};

new Phaser.Game(gameConfig);
