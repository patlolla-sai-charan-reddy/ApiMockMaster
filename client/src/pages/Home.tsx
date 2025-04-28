import { useState } from "react";
import { StubForm } from "@/components/StubForm";
import { PreviewPanel } from "@/components/PreviewPanel";
import { RecentFiles } from "@/components/RecentFiles";
import { StubFormData } from "@shared/schema";
import { generateStub, generateEjsTemplate } from "@/lib/utils/urlParser";

export default function Home() {
  const [stubPreview, setStubPreview] = useState<string>("");
  
  const handleGeneratePreview = (formData: StubFormData) => {
    try {
      const stub = generateStub(formData);
      const ejsTemplate = generateEjsTemplate(stub);
      setStubPreview(ejsTemplate);
    } catch (error) {
      console.error("Error generating preview:", error);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mountebank Stub Generator</h1>
          <p className="text-gray-600">Create and manage Mountebank stubs with easy URL parsing and file generation</p>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Stub Form */}
          <div className="w-full md:w-1/2">
            <StubForm onPreview={handleGeneratePreview} />
          </div>

          {/* Preview Panel and Recent Files */}
          <div className="w-full md:w-1/2">
            <PreviewPanel stubContent={stubPreview} />
            <RecentFiles />
          </div>
        </div>
      </div>
    </div>
  );
}
