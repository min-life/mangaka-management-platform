export function serializeCompany(company: {
  id: bigint;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: company.id.toString(),
    name: company.name,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}
