export type AssetDef = {
  key: string;
  url: string;
  width?: number;
  height?: number;
};

export const BACKGROUNDS: AssetDef[] = [
  { key: "bg_bank_counter", url: "assets/backgrounds/bank.png", width: 1080, height: 1920 },
  { key: "bg_home", url: "assets/backgrounds/home.png", width: 1080, height: 1920 },
  { key: "bg_temple", url: "assets/backgrounds/temple.png", width: 1080, height: 1920 },
  { key: "bg_consult_desk", url: "assets/backgrounds/consult.png", width: 1080, height: 1920 },
];

export const CHARACTERS: AssetDef[] = [
  { key: "player", url: "assets/characters/player.png", width: 720, height: 920 },
  { key: "son", url: "assets/characters/son.png", width: 720, height: 920 },
  { key: "ba_hanh", url: "assets/characters/ba_hanh.png", width: 720, height: 920 },
  { key: "anh_tam", url: "assets/characters/anh_tam.png", width: 720, height: 920 },
  { key: "me", url: "assets/characters/me.png", width: 720, height: 920 },
  { key: "di_tu", url: "assets/characters/di_tu.png", width: 720, height: 920 },
  { key: "su_thay", url: "assets/characters/su_thay.png", width: 720, height: 920 },
  { key: "thay_scammer", url: "assets/characters/thay_scammer.png", width: 720, height: 920 },
  { key: "system", url: "assets/characters/son.png", width: 720, height: 920 },
  { key: "narrator", url: "assets/characters/player.png", width: 720, height: 920 },
  { key: "guidebook", url: "assets/characters/guidebook.png", width: 720, height: 920 },
];

export const DOCUMENTS: AssetDef[] = [
  { key: "doc_police_order_fake", url: "assets/documents/doc_police_order_fake.png", width: 760, height: 1000 },
  { key: "doc_transfer_order_hanh", url: "assets/documents/doc_transfer_order_hanh.png", width: 760, height: 1000 },
  { key: "doc_withdraw_slip_tam", url: "assets/documents/doc_withdraw_slip_tam.png", width: 760, height: 1000 },
  { key: "doc_supplier_invoice_tam", url: "assets/documents/doc_supplier_invoice_tam.png", width: 760, height: 1000 },
  { key: "doc_me_zalo_chat_thay", url: "assets/documents/doc_me_zalo_chat_thay.png", width: 760, height: 1000 },
  { key: "doc_me_ritual_receipts", url: "assets/documents/doc_me_ritual_receipts.png", width: 760, height: 1000 },
  { key: "doc_me_bank_transfer_history", url: "assets/documents/doc_me_bank_transfer_history.png", width: 760, height: 1000 },
  { key: "doc_me_lucky_day_calendar", url: "assets/documents/doc_me_lucky_day_calendar.png", width: 760, height: 1000 },
  { key: "doc_me_thay_account_warning", url: "assets/documents/doc_me_thay_account_warning.png", width: 760, height: 1000 },
];

export const AUDIO = [
  { key: "sfx_click", url: "assets/audio/click.wav" },
  { key: "sfx_reveal", url: "assets/audio/reveal.wav" },
  { key: "sfx_warning", url: "assets/audio/warning.wav" },
  { key: "sfx_soft_win", url: "assets/audio/soft-win.wav" },
];

export function resolveCharacterAsset(raw?: string | null): string {
  if (!raw) return "narrator";
  const id = raw.replace(/^char_/, "");
  if (id.startsWith("me_")) return "me";
  if (id.startsWith("thay_scammer")) return "thay_scammer";
  if (id.startsWith("thay")) return "thay_scammer";
  if (id.startsWith("ba_hanh")) return "ba_hanh";
  if (id.startsWith("anh_tam")) return "anh_tam";
  if (id.startsWith("son")) return "son";
  if (id.startsWith("player")) return "player";
  if (id.startsWith("di_tu")) return "di_tu";
  if (id.startsWith("su_thay")) return "su_thay";
  return id.split("_")[0] || "narrator";
}

export function resolveBackgroundAsset(raw?: string | null, stage?: string): string {
  if (raw === "bg_home") return "bg_home";
  if (raw === "bg_consult_desk") return "bg_consult_desk";
  if (raw === "bg_temple") return "bg_temple";
  if (stage === "S3" || stage === "CS2") return "bg_home";
  if (stage === "S2" || stage === "CS1") return "bg_consult_desk";
  return "bg_bank_counter";
}
