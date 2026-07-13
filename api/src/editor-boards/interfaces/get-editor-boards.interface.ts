export interface FilterBoards {
  name?: string;
  me?: boolean;
}

export interface OrderBoards {
  field: FieldBoardsType;
  order: OrderBoardsType;
}

export type FieldBoardsType = 'createdAt' | 'updatedAt' | 'name';
export type OrderBoardsType = 'asc' | 'desc';
