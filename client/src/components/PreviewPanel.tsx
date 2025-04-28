import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PreviewPanelProps {
  stubContent: string;
}

export function PreviewPanel({ stubContent }: PreviewPanelProps) {
  const { toast } = useToast();
  const previewRef = useRef<HTMLPreElement>(null);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    // Check if there's content to display
    setHasContent(!!stubContent.trim());

    // Apply syntax highlighting if content exists
    if (stubContent.trim() && previewRef.current) {
      // If hljs is available globally (loaded via CDN in index.html)
      if (typeof window !== "undefined" && window.hljs) {
        window.hljs.highlightElement(previewRef.current);
      }
    }
  }, [stubContent]);

  const copyToClipboard = async () => {
    if (!stubContent) return;

    try {
      await navigator.clipboard.writeText(stubContent);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Preview</h2>
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-primary hover:text-blue-700"
              onClick={copyToClipboard}
            >
              <i className="fas fa-copy mr-1" /> Copy
            </Button>
          )}
        </div>

        <div className="relative">
          <pre
            ref={previewRef}
            className="language-json h-[100%] overflow-y-auto rounded-md text-sm border p-4 bg-gray-50"
          >
            {hasContent ? (
              <code>{stubContent}</code>
            ) : (
              <code className="text-gray-400">
                {`// Preview will appear here when you click the "Preview" button.
// Use the form on the left to generate a Mountebank stub.`}
              </code>
            )}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

// Add hljs to the Window interface
declare global {
  interface Window {
    hljs: any;
  }
}
