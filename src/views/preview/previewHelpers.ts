export function metadataTitle(title: string): string {
  return title.trim() || 'Untitled FSD';
}

export function formatDateIndonesian(
  dateInput: string | Date | undefined | null,
  fallback = 'To be confirmed'
): string {
  if (!dateInput) return fallback;
  if (typeof dateInput === 'string' && !dateInput.trim()) return fallback;

  try {
    // If it's a YYYY-MM-DD format, parse parts directly to avoid UTC timezone off-by-one
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      const [year, month, day] = dateInput.trim().split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return typeof dateInput === 'string' ? dateInput : fallback;
    }
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return typeof dateInput === 'string' ? dateInput : fallback;
  }
}

export function groupItemsByFeature<T extends { feature?: string }>(
  items: T[],
  moduleFeatures?: string[]
): { feature: string; items: T[] }[] {
  if (items.length === 0) return [];

  const hasTaggedFeature = items.some((item) => Boolean(item.feature && item.feature.trim().length > 0));
  const hasModuleFeatures = Boolean(moduleFeatures && moduleFeatures.length > 0);

  if (!hasTaggedFeature && !hasModuleFeatures) {
    return [{ feature: '', items }];
  }

  const map = new Map<string, T[]>();

  if (moduleFeatures) {
    for (const feat of moduleFeatures) {
      if (feat.trim()) {
        map.set(feat.trim(), []);
      }
    }
  }

  for (const item of items) {
    const f = item.feature?.trim() || 'Umum';
    if (!map.has(f)) {
      map.set(f, []);
    }
    map.get(f)!.push(item);
  }

  const result: { feature: string; items: T[] }[] = [];
  for (const [feature, groupItems] of map.entries()) {
    if (groupItems.length > 0) {
      result.push({ feature, items: groupItems });
    }
  }

  return result.length > 0 ? result : [{ feature: '', items }];
}

