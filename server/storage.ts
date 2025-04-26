import { stubs, type Stub, type InsertStub, users, type User, type InsertUser } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory where stubs will be stored
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const STUBS_DIR = path.join(__dirname, "..", "stubs");

// Create stubs directory if it doesn't exist
async function ensureStubsDir() {
  try {
    await fs.access(STUBS_DIR);
  } catch (error) {
    await fs.mkdir(STUBS_DIR, { recursive: true });
  }
}

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Stub methods
  getStub(id: number): Promise<Stub | undefined>;
  getAllStubs(): Promise<Stub[]>;
  createStub(stub: InsertStub): Promise<Stub>;
  
  // File operations
  saveStubFile(filename: string, content: string): Promise<string>;
  appendToStubFile(filename: string, content: string): Promise<string>;
  getStubFiles(): Promise<string[]>;
  getStubFileContent(filename: string): Promise<string>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stubsMap: Map<number, Stub>;
  private currentUserId: number;
  private currentStubId: number;

  constructor() {
    this.users = new Map();
    this.stubsMap = new Map();
    this.currentUserId = 1;
    this.currentStubId = 1;
    
    // Ensure stubs directory exists
    ensureStubsDir();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getStub(id: number): Promise<Stub | undefined> {
    return this.stubsMap.get(id);
  }

  async getAllStubs(): Promise<Stub[]> {
    return Array.from(this.stubsMap.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async createStub(insertStub: InsertStub): Promise<Stub> {
    const id = this.currentStubId++;
    const stub: Stub = { 
      ...insertStub, 
      id, 
      createdAt: new Date() 
    };
    this.stubsMap.set(id, stub);
    return stub;
  }

  async saveStubFile(filename: string, content: string): Promise<string> {
    await ensureStubsDir();
    const filePath = path.join(STUBS_DIR, filename);
    await fs.writeFile(filePath, content, 'utf8');
    
    // Also add to in-memory storage
    await this.createStub({
      filename,
      content
    });
    
    return filename;
  }

  async appendToStubFile(filename: string, content: string): Promise<string> {
    await ensureStubsDir();
    const filePath = path.join(STUBS_DIR, filename);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read existing content
      const existingContent = await fs.readFile(filePath, 'utf8');
      
      // Append content (this is a simplified approach, in a real app we'd need to parse and
      // merge the mountebank stubs properly)
      const newContent = existingContent + '\n' + content;
      
      // Write back to file
      await fs.writeFile(filePath, newContent, 'utf8');
      
      // Update in-memory storage
      const stubs = Array.from(this.stubsMap.values());
      const existingStub = stubs.find(s => s.filename === filename);
      
      if (existingStub) {
        const updatedStub: Stub = {
          ...existingStub,
          content: newContent,
          createdAt: new Date()
        };
        this.stubsMap.set(existingStub.id, updatedStub);
      } else {
        // If not found in memory, create a new entry
        await this.createStub({
          filename,
          content: newContent
        });
      }
      
      return filename;
    } catch (error) {
      // If file doesn't exist, create it
      return this.saveStubFile(filename, content);
    }
  }

  async getStubFiles(): Promise<string[]> {
    await ensureStubsDir();
    try {
      const files = await fs.readdir(STUBS_DIR);
      return files.filter(file => file.endsWith('.ejs'));
    } catch (error) {
      return [];
    }
  }

  async getStubFileContent(filename: string): Promise<string> {
    await ensureStubsDir();
    const filePath = path.join(STUBS_DIR, filename);
    
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`File not found: ${filename}`);
    }
  }
}

export const storage = new MemStorage();
