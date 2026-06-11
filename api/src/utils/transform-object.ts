// Vì id đang dùng bigint nên khi trả về client sẽ bị lỗi vì JSON không hỗ trợ kiểu bigint
// nên cần phải chuyển bigint thành string trước khi trả về client
export function serializeBigInt(data: any) {
  return JSON.parse(
    JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
  );
}
