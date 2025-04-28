import { QueryParam, Header, MountebankStub } from "@/lib/types";
import { StubFormData } from "@shared/schema";

export function parseUrl(urlString: string): { path: string, queryParams: QueryParam[] } {
  try {
    // If URL doesn't have protocol, prepend https://
    let normalizedUrl = urlString;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      normalizedUrl = 'https://' + urlString;
    }

    const url = new URL(normalizedUrl);
    const path = url.pathname;
    
    // Extract query parameters
    const queryParams: QueryParam[] = [];
    url.searchParams.forEach((value, key) => {
      queryParams.push({ key, value });
    });
    
    return { path, queryParams };
  } catch (error) {
    throw new Error("Invalid URL format");
  }
}

export function generateStub(formData: StubFormData): MountebankStub {
  // Convert query params array to object
  const queryObject: Record<string, string> = {};
  formData.queryParams.forEach(param => {
    if (param.key) {
      queryObject[param.key] = param.value;
    }
  });
  
  // Convert headers array to object
  const headersObject: Record<string, string> = {};
  formData.headers.forEach(header => {
    if (header.name) {
      headersObject[header.name] = header.value;
    }
  });
  
  // Parse response body
  let responseBody: any = "";
  try {
    if (formData.responseBody && formData.responseBody.trim() !== "") {
      responseBody = JSON.parse(formData.responseBody);
    }
  } catch (error) {
    console.error("Error parsing response body JSON:", error);
    // Use empty string as fallback
    responseBody = "";
  }
  
  return {
    predicates: [
      {
        equals: {
          method: formData.method || "PUT", // Use the method from the form or default to PUT
          path: formData.path,
          query: Object.keys(queryObject).length > 0 ? queryObject : {}
        }
      }
    ],
    responses: [
      {
        is: {
          statusCode: formData.statusCode,
          body: responseBody
        }
      }
    ]
  };
}

export function generateEjsTemplate(stub: MountebankStub): string {
  // Format the stub with proper wrapping
  const formattedStub = `{
${JSON.stringify(stub, null, 2).slice(1, -1)}
},`;
    
  return formattedStub;
}
