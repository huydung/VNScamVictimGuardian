export type DataFile<T> = {
  title: string;
  rows: T[];
};

export type Beat = {
  beat_id: string;
  stage: string;
  scene: string | null;
  customer_id: string | null;
  beat_idx: number | null;
  beat_type: string;
  speaker_id: string | null;
  speakers_on_screen: string | null;
  active_speaker: string | null;
  text_vi: string;
  expression: string | null;
  body_language: string | null;
  auto_advance: boolean | string | null;
  next_beat_id: string | null;
  bg_asset: string | null;
  char_asset: string | null;
  doc_assets: string | null;
  reveal_tactic: string | null;
  notes: string | null;
};

export type Choice = {
  choice_id: string;
  beat_id: string;
  ord: number;
  label_vi: string;
  method: string | null;
  req_target: string | null;
  req_op: string | null;
  req_value: string | number | boolean | null;
  rep_delta: number | null;
  score_delta: number | null;
  openness_delta: number | null;
  money_delta: number | null;
  wellbeing_delta: number | null;
  relationship_delta: number | null;
  flag_set: string | null;
  reveal_tactic: string | null;
  mother_expr: string | null;
  goto: string | null;
  notes: string | null;
};

export type Character = {
  char_id: string;
  name_vi: string;
  role: string;
  age: string | number | null;
  appears_in: string | null;
  function: string | null;
  expressions: string | null;
  customer_id: string | null;
};

export type DocumentRow = {
  doc_id: string;
  doc_type: string;
  customer_id: string;
  name_vi: string;
  has_tell: boolean;
  tactic_id: string | null;
  fields_summary: string;
  tell_desc: string;
};

export type Tactic = {
  tactic_id: string;
  name_vi: string;
  name_en: string;
  type: string;
  desc_vi: string;
  icon_asset: string | null;
  collected_when: string | null;
  lineage: string | null;
};

export type Ending = {
  order_idx: number;
  ending_id: string;
  name_vi: string;
  condition: string;
  tone: string;
};

export type S3HubAction = {
  day: number;
  action_id: string;
  label_vi: string;
  opens_scene: string;
  gate_flag: string | null;
  pick_count: number;
  actions_total: number;
  reward: string;
  risk: string | null;
};

export type RuntimeConfig = {
  title: string;
  values: Record<string, string | number | boolean | null>;
};

export type GameContent = {
  beats: Beat[];
  choices: Choice[];
  characters: Character[];
  documents: DocumentRow[];
  tactics: Tactic[];
  endings: Ending[];
  s3Hubs: S3HubAction[];
  runtimeConfig: RuntimeConfig;
};
