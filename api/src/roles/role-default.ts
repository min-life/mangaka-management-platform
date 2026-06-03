import { SCOPE } from '@prisma/client';

//Sử dụng code + scope để phân biệt role nào là role default
export const DEFAULT_ROLE_CODES: Record<SCOPE, string[]> = {
  [SCOPE.SYS]: ['admin', 'staff', 'member'],
  [SCOPE.CO]: ['co_admin', 'co_staff', 'co_member', 'editor'],
  [SCOPE.PRJ]: ['manager', 'mangaka', 'assistant', 'tantou_editor'],
};

export function isDefaultRole(scope: SCOPE, code?: string | null) {
  if (!code) {
    return false;
  }
  //Kiểm tra code có nằm trong danh sách default code của scope tương ứng không.
  return DEFAULT_ROLE_CODES[scope].includes(code);
}
