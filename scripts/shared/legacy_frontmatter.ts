function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}

export function extractYamlFrontMatter(content: string): string | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*$/m);
  return match ? match[1]! : null;
}

export function readTopLevelScalar(yaml: string, key: string): string | null {
  for (const line of yaml.split("\n")) {
    if (!line.trim() || /^\s/.test(line) || line.trim().startsWith("#")) {
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match || match[1] !== key) {
      continue;
    }
    const value = stripQuotes(match[2]!.trim());
    return value.length > 0 ? value : null;
  }
  return null;
}

export function readSectionScalars(yaml: string, section: string): Record<string, string> {
  const lines = yaml.split("\n");
  const values: Record<string, string> = {};
  let inSection = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    const trimmed = line.trim();

    if (!inSection) {
      if (trimmed === `${section}:`) {
        inSection = true;
      }
      continue;
    }

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    if (!/^\s+/.test(line)) {
      break;
    }

    const sectionMatch = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!sectionMatch) {
      continue;
    }

    const key = sectionMatch[1]!;
    const value = stripQuotes(sectionMatch[2]!.trim());
    if (value.length > 0) {
      values[key] = value;
    }
  }

  return values;
}

export function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return null;
}

export function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function coerceString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
