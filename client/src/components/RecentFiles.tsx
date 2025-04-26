import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Stub } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function RecentFiles() {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<{ stubs: Stub[] }>({
    queryKey: ['/api/stubs'],
  });
  
  const [selectedStub, setSelectedStub] = useState<string | null>(null);
  
  const handleFileClick = async (filename: string) => {
    setSelectedStub(filename);
    
    try {
      // Get file content to show path information
      const response = await fetch(`/api/files/${filename}`);
      if (response.ok) {
        const fileData = await response.json();
        
        // Show toast with file path
        toast({
          title: "File Downloaded",
          description: (
            <div className="space-y-1">
              <p>File: {filename}</p>
              <p className="text-xs font-mono break-all">
                Server path: {fileData.filePath || `/server/stubs/${filename}`}
              </p>
            </div>
          )
        });
      }
      
      // Create anchor element to trigger download
      const a = document.createElement('a');
      a.href = `/api/files/${filename}`;
      a.download = filename;
      a.click();
    } catch (error) {
      console.error("Error fetching file details:", error);
    }
  };

  const formatTime = (dateString: Date) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recently Generated Files</h2>
        
        {isLoading ? (
          <div className="text-center py-4">
            <i className="fas fa-spinner fa-spin mr-2" /> Loading...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Failed to load recent files
          </div>
        ) : data?.stubs && data.stubs.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {data.stubs.map((stub) => (
              <li key={stub.id} className="py-2">
                <button 
                  onClick={() => handleFileClick(stub.filename)}
                  className="w-full flex justify-between items-center group text-left hover:bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center">
                    <i className="fas fa-file-code text-primary mr-2" />
                    <span className="text-gray-700 group-hover:text-primary">{stub.filename}</span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTime(stub.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No files generated yet. Use the form to create your first stub.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
