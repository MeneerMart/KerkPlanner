export interface ToolRequirement {
  name: string;
  amount: number;
}

export type ToolQuantities = Record<string, number>;

export function parseToolRequirements(raw?: string | null): ToolRequirement[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is { name: string; amount: number } =>
        !!item && typeof item.name === 'string' && Number.isFinite(Number(item.amount)))
      .map(item => ({ name: item.name, amount: Math.max(0, Number(item.amount)) }))
      .filter(item => item.name.trim().length > 0);
  } catch {
    return [];
  }
}

/** Reads the current JSON format and the old comma-separated format. */
export function parseToolQuantities(raw?: string | null): ToolQuantities {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.reduce<ToolQuantities>((result, name) => {
        if (typeof name === 'string' && name.trim()) result[name] = (result[name] ?? 0) + 1;
        return result;
      }, {});
    }
    if (parsed && typeof parsed === 'object') {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .filter(([name, value]) => name.trim() && Number.isFinite(Number(value)) && Number(value) > 0)
          .map(([name, value]) => [name, Math.floor(Number(value))])
      );
    }
  } catch {
    // Ondersteun oude waarden zoals "Hamer,Schroevendraaier".
  }
  return raw.split(',').map(item => item.trim()).filter(Boolean).reduce<ToolQuantities>((result, name) => {
    result[name] = (result[name] ?? 0) + 1;
    return result;
  }, {});
}

export function formatToolQuantities(raw?: string | null): string {
  const quantities = parseToolQuantities(raw);
  return Object.entries(quantities).map(([name, count]) => `${count}× ${name}`).join(', ');
}

export function toolCountForEnrollments(enrollments: Array<{ selectedTools?: string | null }>, toolName: string, excludeEnrollmentId?: string): number {
  return enrollments.reduce((total, enrollment) => {
    if ('id' in enrollment && (enrollment as { id?: string }).id === excludeEnrollmentId) return total;
    return total + (parseToolQuantities(enrollment.selectedTools)[toolName] ?? 0);
  }, 0);
}


export function capToolQuantities(
  materialsNeeded: string | null | undefined,
  selected: ToolQuantities,
  toolsProvided: string | null | undefined,
  existingEnrollmentTools?: string | null
): ToolQuantities {
  const requirements = parseToolRequirements(materialsNeeded);
  const totals = parseToolQuantities(toolsProvided);
  const ownTotals = parseToolQuantities(existingEnrollmentTools);
  const result: ToolQuantities = {};
  for (const tool of requirements) {
    const providedByOthers = Math.max(0, (totals[tool.name] ?? 0) - (ownTotals[tool.name] ?? 0));
    const available = Math.max(0, tool.amount - providedByOthers);
    const count = Math.max(0, Math.min(available, Math.floor(Number(selected[tool.name]) || 0)));
    if (count > 0) result[tool.name] = count;
  }
  return result;
}
