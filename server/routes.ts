import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";

import { exec } from 'child_process';
import { promisify } from 'util';
const exec = promisify(require('child_process').exec);

import { storage, STUBS_DIR } from "./storage";
import { stubFormDataSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Get all stub files
  app.get('/api/files', async (req: Request, res: Response) => {
    try {
      const files = await storage.getStubFiles();
      res.json({ files });
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({ message: 'Failed to retrieve files' });
    }
  });

  // Get specific file content
  app.get('/api/files/:filename', async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const content = await storage.getStubFileContent(filename);
      const filePath = path.join(STUBS_DIR, filename);
      
      res.json({ 
        filename, 
        content,
        filePath 
      });
    } catch (error) {
      console.error('Error getting file content:', error);
      res.status(404).json({ message: `File not found: ${req.params.filename}` });
    }
  });

  // Save stub as a new file
  app.post('/api/files', async (req: Request, res: Response) => {
    try {
      const data = stubFormDataSchema.parse(req.body);
      
      const filename = data.filename.endsWith('.ejs') 
        ? data.filename 
        : `${data.filename}.ejs`;
      
      // Generate the Mountebank stub content
      const stub = {
        predicates: [
          {
            equals: {
              method: "GET",
              path: data.path,
              query: data.queryParams.reduce((obj, param) => {
                if (param.key) obj[param.key] = param.value;
                return obj;
              }, {} as Record<string, string>),
              headers: data.headers.reduce((obj, header) => {
                if (header.name) obj[header.name] = header.value;
                return obj;
              }, {} as Record<string, string>)
            }
          }
        ],
        responses: [
          {
            is: {
              statusCode: data.statusCode,
              headers: {
                "Content-Type": "application/json",
                ...data.headers.reduce((obj, header) => {
                  if (header.name) obj[header.name] = header.value;

  // Commit changes to GitHub
  app.post('/api/commit', async (req: Request, res: Response) => {
    try {
      const { content, message } = req.body;
      if (!content || !message) {
        return res.status(400).json({ message: 'Missing content or commit message' });
      }

      // Execute git commands
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `stub-${timestamp}.ejs`;
      
      await storage.saveStubFile(filename, content);
      
      await Promise.all([
        exec('git add .'),
        exec('git config --global user.email "replit@example.com"'),
        exec('git config --global user.name "Replit User"')
      ]);
      
      await exec(`git commit -m "${message}"`);
      await exec('git push');

      res.json({ message: 'Changes committed successfully' });
    } catch (error) {
      console.error('Error committing changes:', error);
      res.status(500).json({ message: 'Failed to commit changes' });
    }
  });

                  return obj;
                }, {} as Record<string, string>)
              },
              body: JSON.parse(data.responseBody)
            }
          }
        ]
      };

      // Format as EJS template
      const ejsTemplate = `<%
const stub = ${JSON.stringify(stub, null, 2)};
%>

<%= JSON.stringify(stub, null, 2) %>`;

      let savedFilename;
      if (data.mode === 'new') {
        savedFilename = await storage.saveStubFile(filename, ejsTemplate);
      } else {
        savedFilename = await storage.appendToStubFile(filename, ejsTemplate);
      }

      // Get the absolute path for display purposes
      const filePath = path.join(STUBS_DIR, savedFilename);
      
      res.status(201).json({ 
        message: 'File saved successfully', 
        filename: savedFilename,
        filePath: filePath,
        content: ejsTemplate
      });
    } catch (error) {
      console.error('Error saving file:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: validationError.details 
        });
      }
      
      res.status(500).json({ message: 'Failed to save file' });
    }
  });

  // Get recent stubs (for the recent files list)
  app.get('/api/stubs', async (req: Request, res: Response) => {
    try {
      const stubs = await storage.getAllStubs();
      res.json({ stubs });
    } catch (error) {
      console.error('Error getting stubs:', error);
      res.status(500).json({ message: 'Failed to retrieve stubs' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
