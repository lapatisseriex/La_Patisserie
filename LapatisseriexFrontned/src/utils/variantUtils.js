export const formatVariantLabel = (variant = {}) => {
  if (!variant) {
    return '';
  }

  const stringCandidates = [
    variant.variantLabel,
    variant.label,
    variant.displayLabel,
    variant.name,
    variant.title,
    variant.variantName,
    variant.sizeLabel,
    variant.description
  ];

  for (const candidate of stringCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  const quantityCandidate =
    variant.quantity ??
    variant.weight ??
    variant.size ??
    variant.amount ??
    variant.value ??
    null;

  const unitCandidate =
    variant.measuringUnit ??
    variant.unit ??
    variant.unitLabel ??
    variant.unitOfMeasure ??
    variant.measurementUnit ??
    variant.measure ??
    null;

  const quantityString =
    quantityCandidate !== null && quantityCandidate !== undefined
      ? `${quantityCandidate}`.trim()
      : '';

  const unitString = typeof unitCandidate === 'string' ? unitCandidate.trim() : '';

  if (quantityString && unitString) {
    return `${quantityString} ${unitString}`.replace(/\s+/g, ' ').trim();
  }

  if (quantityString) {
    return quantityString;
  }

  if (unitString) {
    return unitString;
  }

  return '';
};

export const resolveOrderItemVariantLabel = (item = {}) => {
  if (!item || typeof item !== 'object') {
    return '';
  }

  const objectCandidates = [
    item.variant,
    item.selectedVariant,
    item.variantDetails,
    item.productVariant,
    item.variantData
  ];

  for (const candidate of objectCandidates) {
    if (candidate && typeof candidate === 'object') {
      const label = formatVariantLabel(candidate);
      if (label) {
        return label;
      }
    }
  }

  const stringCandidates = [
    item.variantLabel,
    item.variantName,
    item.variantDisplayName,
    item.variant_display_name,
    item.selectedVariantLabel,
    item.variantDescription
  ];

  for (const candidate of stringCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (Array.isArray(item.variants) && typeof item.variantIndex === 'number') {
    const variantFromArray = item.variants[item.variantIndex];
    const label = formatVariantLabel(variantFromArray);
    if (label) {
      return label;
    }
  }

  return '';
};
