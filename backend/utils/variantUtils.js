export const formatVariantLabel = (variant = {}) => {
  if (!variant) {
    return '';
  }

  const stringCandidates = [
    variant.label,
    variant.displayLabel,
    variant.name,
    variant.title,
    variant.variantLabel,
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

export const buildVariantSnapshot = (variantDoc) => {
  if (!variantDoc) {
    return null;
  }

  const plain = typeof variantDoc.toObject === 'function'
    ? variantDoc.toObject()
    : { ...variantDoc };

  return {
    ...plain,
    variantLabel: formatVariantLabel(plain)
  };
};

export const resolveVariantInfoForItem = (item = {}, product = {}) => {
  const variantsSource = Array.isArray(item?.variants)
    ? item.variants
    : Array.isArray(product?.variants)
      ? product.variants
      : [];

  const index = Number.isInteger(item?.variantIndex)
    ? item.variantIndex
    : 0;

  let variantDoc = variantsSource[index] ?? null;

  if (!variantDoc && item?.selectedVariant) {
    variantDoc = item.selectedVariant;
  }

  if (!variantDoc && item?.variant) {
    variantDoc = item.variant;
  }

  if (!variantDoc && item?.productDetails?.selectedVariant) {
    variantDoc = item.productDetails.selectedVariant;
  }

  if (!variantDoc && item?.productDetails?.variant) {
    variantDoc = item.productDetails.variant;
  }

  const variant = buildVariantSnapshot(variantDoc);

  return {
    variant,
    variantLabel: variant?.variantLabel || '',
    variantIndex: index
  };
};
