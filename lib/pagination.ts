export type PageInput = { cursor?: string | null; limit?: number };

export function page(input: PageInput = {}) {
  const take = Math.min(Math.max(Math.trunc(input.limit || 25), 1), 100);
  return {
    take: take + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
  };
}

export function pageResult<T extends { id: string }>(rows: T[], limit = 25) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items.at(-1)?.id || null : null };
}
