export const GAME_SIZE = {
  width: 1080,
  height: 1920,
};

export const GAME_TUNING = {
  firstBeatId: "s0_00",
  textRevealCharsPerSecond: 92,
  choicePanelMaxChoices: 4,
  meterMin: 0,
  meterMax: 100,
  defaultMoney: 40,
  defaultWellbeing: 55,
  defaultRelationship: 70,
  defaultReputation: 70,
  portraitY: 700,
  portraitScale: 0.74,
  choiceButtonHeight: 96,
  choiceButtonGap: 14,
  particleCount: 28,
  stageTransitionMs: 420,
  vfxPulseMs: 260,
};

export const COLORS = {
  ink: 0x102023,
  deep: 0x06191d,
  teal: 0x0e3a3f,
  tealLight: 0x2f8f7b,
  paper: 0xf2dfbd,
  paperDark: 0xd5b679,
  gold: 0xc99a46,
  red: 0xa43a32,
  warmRed: 0x7d2d2b,
  jade: 0x2f8f7b,
  white: 0xfff7e6,
  shadow: 0x000000,
};

export const STAGE_THEMES: Record<string, {
  label: string;
  bgFallback: string;
  tint: number;
  accent: number;
  mood: string;
}> = {
  S0: {
    label: "Tập sự",
    bgFallback: "bg_bank_counter",
    tint: 0x0e3a3f,
    accent: 0xc99a46,
    mood: "Bình tĩnh học nghề",
  },
  S1: {
    label: "Quầy giao dịch",
    bgFallback: "bg_bank_counter",
    tint: 0x0f3d45,
    accent: 0xd2a64e,
    mood: "Nhìn kỹ giấy tờ",
  },
  CS1: {
    label: "Chuyển ca",
    bgFallback: "bg_consult_desk",
    tint: 0x102f36,
    accent: 0xc99a46,
    mood: "Từ nhận diện đến can thiệp",
  },
  S2: {
    label: "Bàn tư vấn",
    bgFallback: "bg_consult_desk",
    tint: 0x123a3d,
    accent: 0x2f8f7b,
    mood: "Nói sao để người ta còn đường quay lại",
  },
  CS2: {
    label: "Cuộc gọi gia đình",
    bgFallback: "bg_home",
    tint: 0x5b2f2b,
    accent: 0xd6a84e,
    mood: "Chuyện đã về tới nhà",
  },
  S3: {
    label: "Cứu mẹ",
    bgFallback: "bg_home",
    tint: 0x7a3430,
    accent: 0xd6a84e,
    mood: "Giữ tiền, giữ lòng, giữ đường về",
  },
};

export const UI_COPY = {
  title: "TỈNH & TÌNH",
  tapToContinue: "Chạm để tiếp tục",
  chooseAction: "Chọn cách nói",
  inspectEvidence: "Bằng chứng",
  guidebook: "Cẩm nang 8 chiêu",
  reputation: "Uy tín",
  score: "Điểm tỉnh táo",
  money: "Tài sản",
  wellbeing: "Tinh thần",
  relationship: "Tình thân",
  flags: "Dấu vết",
  muted: "Âm thanh",
};
