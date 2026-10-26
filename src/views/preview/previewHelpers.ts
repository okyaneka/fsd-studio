export function metadataTitle(title: string): string {
  return title.trim() || 'Untitled FSD';
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

