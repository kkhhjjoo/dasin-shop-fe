/** 상품 상세·목록에서 옵션(또는 variants) 선택이 필요한지 판별 (ProductDetail의 optionGroups 유무와 동일 기준) */
export function productHasConfigurableOptions(product: {
  options?: { label?: string; choices?: string[] }[] | null;
  variants?: { name?: string }[] | string[] | null;
}): boolean {
  const rawOptions = product?.options;
  const fromOptions = (): { label: string; choices: string[] }[] => {
    if (!Array.isArray(rawOptions)) return [];
    return rawOptions
      .map((o) => ({
        label: typeof o?.label === 'string' ? o.label.trim() : '',
        choices: Array.isArray(o?.choices) ? o.choices.map((c) => String(c)) : [],
      }))
      .filter((g) => g.label.length > 0 || g.choices.length > 0);
  };
  const groups = fromOptions();
  if (groups.length > 0) return true;

  const vars = product?.variants;
  if (!Array.isArray(vars) || vars.length === 0) return false;
  const choices = vars
    .map((v) =>
      v != null && typeof v === 'object' && 'name' in v ? String((v as { name?: string }).name ?? '').trim() : String(v).trim(),
    )
    .filter(Boolean);
  return choices.length > 0;
}
