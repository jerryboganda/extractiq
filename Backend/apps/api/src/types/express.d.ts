import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
    workspaceId: string;
    userRole: string;
    correlationId?: string;
  }
}
