# Coding Rules for Mangaka Management Platform API

This document outlines the coding standards and conventions that all team members and AI assistants must follow when working on this codebase.

## 1. Error Handling

### Use Logger instead of console.log/console.error
- Every service should have a private logger: `private readonly logger = new Logger(ServiceName.name);`
- Use `this.logger.error()` for error logging
- Use `this.logger.debug()` for debug logging
- Never use `console.log()` or `console.error()` in production code

### Use ERROR constant from share/constants/message-error
- All error messages must be defined in `src/share/constants/message-error.ts`
- Import ERROR: `import { ERROR } from '../share/constants/message-error';`
- Use ERROR constants in exceptions: `throw new NotFoundException(ERROR.NFUSER)`
- Never hard-code error messages as strings

### Implement handleError pattern in services
```typescript
private handleError(error: unknown, logMessage: string, clientMessage: string): never {
  this.logger.error(logMessage, error instanceof Error ? error.stack : String(error));
  if (error instanceof HttpException) {
    throw error;
  }
  throw new InternalServerErrorException(clientMessage);
}
```

## 2. Export/Import Decorators

### Export all decorators from share/decorators/index.ts
- All custom decorators must be exported from `src/share/decorators/index.ts`
- This ensures consistent import paths across the codebase
- Example: `export * from './cookie.decorator';`

## 3. Enum Naming

### Use correct English spelling
- Always check spelling: `CANCELED` not `CANCELD`
- Use UPPER_CASE for enum values (following project convention)
- Example: `enum APPLICATION_STATUS { PENDING, APPROVE, REJECT, CANCELED }`

## 4. TypeScript Types

### Avoid implicit any types
- Always provide explicit type annotations
- Use interfaces for DTOs and complex types
- Enable strict type checking where possible

### Use Prisma types appropriately
- Use `Prisma.InputJsonValue` for JSON fields
- Use `Prisma.TransactionClient` for transaction contexts
- Use `Prisma.*WhereInput` for query filters
- Use `Prisma.*OrderByWithRelationInput` for sorting

## 5. Prisma Queries

### Use transactions for multi-step operations
```typescript
await this.prisma.$transaction(async (prisma) => {
  // multiple related operations
});
```

### Implement ensure pattern for entity existence
```typescript
private async ensureProject(id: number) {
  const project = await this.prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw new NotFoundException(ERROR.NFPROJECT);
  }
  return project;
}
```

### Use consistent pagination pattern
```typescript
private buildPagination(pagination?: Pagination) {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  return { page, limit, skip: (page - 1) * limit };
}

private buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
```

## 6. Validation DTOs

### Use class-validator decorators
- Import from `class-validator`: `@IsEmail()`, `@IsString()`, `@IsNotEmpty()`, `@MinLength()`, `@MaxLength()`
- Use `class-transformer` for response serialization

### Follow naming convention
- Request DTOs: `{Action}{Entity}.dto.ts` (e.g., `login.dto.ts`, `register.dto.ts`)
- Response DTOs: can use Prisma select or create separate DTOs

## 7. Permission Guards

### Use @Permissions decorator
```typescript
@Permissions({
  resource: Resource.PROJECT,
  permissions: ['project:read'],
  mode: PermissionMode.ANY,
})
```

### Define permissions in auth/interfaces/permission.interface.ts
- Use Resource enum instead of hard-coded strings
- Permission strings are defined centrally in the interface

## 8. Transactions

### Use transactions for related multi-table operations
- When operations affect multiple tables, wrap in `$transaction`
- Pass `Prisma.TransactionClient` parameter to helper methods
- Example:
```typescript
await this.prisma.$transaction(async (prisma) => {
  await prisma.project.create({ ... });
  await prisma.userProject.create({ ... });
});
```

### Pass TransactionClient parameter to helper methods
```typescript
private async ensureBoard(
  id: number,
  prisma: Prisma.TransactionClient | PrismaService = this.prisma,
) {
  const board = await prisma.editorBoard.findUnique({ where: { id } });
  if (!board) {
    throw new NotFoundException(ERROR.NFBOARD);
  }
  return board;
}
```

## 9. Service Structure

### Private helper methods
- `ensure{Entity}()` - validate entity existence before operations
- `buildPagination()` - calculate pagination parameters
- `buildPaginationMeta()` - create pagination metadata
- `handleError()` - centralized error handling
- `uniqueIds()` - remove duplicates from ID arrays

### Public methods
- CRUD operations: `get{Entity}ById`, `create{Entity}`, `update{Entity}`, `delete{Entity}`
- Relationship operations: `get{Entity}{Related}`, `add{Related}To{Entity}`
- Support filtering, sorting, and pagination where appropriate

### Example service structure
```typescript
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Public CRUD methods
  async createProject(data: { ... }) { ... }
  async getProjectById(id: number) { ... }
  async updateProject(id: number, data: { ... }) { ... }
  async deleteProject(id: number) { ... }

  // Private helpers
  private async ensureProject(id: number) { ... }
  private buildPagination(pagination?: Pagination) { ... }
  private buildPaginationMeta(total: number, page: number, limit: number) { ... }
  private handleError(error: unknown, logMessage: string, clientMessage: string): never { ... }
}
```
