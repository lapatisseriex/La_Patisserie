const sanitizePayload = (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const result = { ...payload };
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });
  return result;
};

export const emitPaymentUpdate = (paymentDoc = null, context = {}) => {
  try {
    if (!global?.io) {
      return;
    }

    const paymentIdSource = paymentDoc?._id ?? context.paymentId;
    const orderIdSource = paymentDoc?.orderId ?? context.orderId;
    const statusSource = paymentDoc?.paymentStatus ?? context.status;
    const amountSource = paymentDoc?.amount ?? context.amount;
    const methodSource = paymentDoc?.paymentMethod ?? context.paymentMethod;
    const userSource = paymentDoc?.userId ?? context.userId;

    const payload = sanitizePayload({
      paymentId: paymentIdSource && typeof paymentIdSource.toString === 'function'
        ? paymentIdSource.toString()
        : paymentIdSource || undefined,
      orderId: orderIdSource || undefined,
      status: statusSource || undefined,
      amount: amountSource ?? undefined,
      paymentMethod: methodSource || undefined,
      userId: userSource && typeof userSource.toString === 'function'
        ? userSource.toString()
        : userSource || undefined,
      previousStatus: context.previousStatus,
      source: context.source || 'unknown',
      metadata: context.metadata,
      timestamp: context.timestamp || context.updatedAt || new Date().toISOString()
    });

    global.io.emit('paymentUpdated', payload);
  } catch (error) {
    console.error('Failed to emit paymentUpdated event:', error);
  }
};
