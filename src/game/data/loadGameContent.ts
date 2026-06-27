import type { Beat, Character, Choice, DataFile, DocumentRow, Ending, GameContent, RuntimeConfig, Tactic } from "./types";

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function loadGameContent(): Promise<GameContent> {
  const [beats, choices, characters, documents, tactics, endings, runtimeConfig] = await Promise.all([
    loadJson<DataFile<Beat>>("/data/beats.json"),
    loadJson<DataFile<Choice>>("/data/choices.json"),
    loadJson<DataFile<Character>>("/data/characters.json"),
    loadJson<DataFile<DocumentRow>>("/data/documents.json"),
    loadJson<DataFile<Tactic>>("/data/tactics.json"),
    loadJson<DataFile<Ending>>("/data/endings.json"),
    loadJson<RuntimeConfig>("/data/runtimeConfig.json"),
  ]);

  return {
    beats: beats.rows,
    choices: choices.rows,
    characters: characters.rows,
    documents: documents.rows,
    tactics: tactics.rows,
    endings: endings.rows,
    runtimeConfig,
  };
}
