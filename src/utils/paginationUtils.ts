import { CursorPaginationQuery, PaginatedResult } from "../types/paginationType";
export const encrypt = (id:string | number) =>{
  return Buffer.from(String(id)).toString("base64");
}

export const decrypt = (cursor:string) =>{
  return Buffer.from(cursor,"base64").toString("utf-8");
}

export async function paginateWithCursor<T extends { id: string | number }>(
  query: (args: { take: number; skip: number; cursor?: { id: string | number } }) => Promise<T[]>,
  { cursor, limit = 20 }: CursorPaginationQuery
): Promise<PaginatedResult<T>>{

  const take = Math.min(limit,100);
  const args = {
    take: take + 1,           // fetch ONE extra row
    skip: cursor ? 1 : 0,    // skip the cursor row if paginating
    ...(cursor && { cursor: { id: decrypt(cursor) } }),
  };
  const rows = await query(args);
  const hasNextPage = rows.length > take;
  const data = hasNextPage ? rows.slice(0, take) : rows
  return {
  data,
  pagination: {
    nextCursor: hasNextPage ? encrypt(data[data.length - 1].id) : null,
    prevCursor: cursor ?? null,
    hasNextPage,
    hasPrevPage: !!cursor,
    },
  };
}