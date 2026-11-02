// Deliberate safe placeholder: no AI provider is connected yet.
export async function classifyIncomingRequest(order) {
  return {
    route: 'owner_review',
    reason: 'AI provider is not configured; owner review is required.',
    summary: `${order.service}: ${order.details || 'No extra details supplied.'}`
  };
}
