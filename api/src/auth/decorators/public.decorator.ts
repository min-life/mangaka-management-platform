import { SetMetadata } from '@nestjs/common';

// ChuongTV #005 start
export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => {
  return SetMetadata(IS_PUBLIC_KEY, true);
};
// ChuongTV #005 end
