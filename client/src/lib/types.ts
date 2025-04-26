export interface QueryParam {
  key: string;
  value: string;
}

export interface Header {
  name: string;
  value: string;
}

export interface MountebankStub {
  predicates: Array<{
    equals: {
      method: string;
      path: string;
      query: Record<string, string>;
      headers: Record<string, string>;
    }
  }>;
  responses: Array<{
    is: {
      statusCode: number;
      headers: Record<string, string>;
      body: any;
    }
  }>;
}
