export const TAG_NAME_MAX_LENGTH = 30;
export const TAG_LIMIT = 10;

export function normalizeTagName(name: string): string {
  return name.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
}

export function displayTagName(name: string): string {
  return name.trim().normalize('NFC');
}
