const extractNumericValue = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const hasCompletedOrders = (user) => {
  if (!user) {
    return false;
  }

  if (typeof user.hasPlacedOrder === 'boolean') {
    return user.hasPlacedOrder;
  }

  if (Array.isArray(user.orders) && user.orders.length > 0) {
    return true;
  }

  const summary = user.ordersSummary || {};
  const stats = user.orderStats || {};

  const potentialCounts = [
    user.ordersCount,
    user.orderCount,
    summary.totalOrders,
    summary.completedOrders,
    summary.totalCompletedOrders,
    summary.lifetimeOrders,
    summary.totalNonCancelledOrders,
    stats.totalOrders,
    stats.completedOrders
  ];

  return potentialCounts.some((candidate) => extractNumericValue(candidate) > 0);
};

export const getOrderExperienceInfo = (user) => {
  const returningCustomer = hasCompletedOrders(user);

  return {
    label: returningCustomer ? 'Premium Choice' : 'Welcome Gift',
    color: returningCustomer ? '#4F1D4B' : '#D84874',
    isReturningCustomer: returningCustomer
  };
};
