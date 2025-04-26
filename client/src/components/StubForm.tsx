import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stubFormDataSchema, type StubFormData } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parseUrl } from "@/lib/utils/urlParser";
import { useFiles } from "@/hooks/use-files";
import { apiRequest } from "@/lib/queryClient";
import { generateStub, generateEjsTemplate } from "@/lib/utils/urlParser";

interface StubFormProps {
  onPreview: (formData: StubFormData) => void;
}

export function StubForm({ onPreview }: StubFormProps) {
  const { toast } = useToast();
  const { files, isLoading: isLoadingFiles, refetch: refetchFiles } = useFiles();
  
  const [queryParams, setQueryParams] = useState<{ key: string; value: string }[]>([]);
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([]);
  const [isNewFile, setIsNewFile] = useState(true);
  
  const { control, handleSubmit, setValue, getValues, reset, formState: { errors } } = useForm<StubFormData>({
    resolver: zodResolver(stubFormDataSchema),
    defaultValues: {
      path: "",
      statusCode: 200,
      queryParams: [],
      headers: [],
      responseBody: JSON.stringify({ message: "Success", data: {} }, null, 2),
      filename: "",
      mode: "new"
    }
  });
  
  // Update form values when queryParams or headers change
  useEffect(() => {
    setValue("queryParams", queryParams);
  }, [queryParams, setValue]);
  
  useEffect(() => {
    setValue("headers", headers);
  }, [headers, setValue]);
  
  const handleUrlParse = () => {
    const apiUrl = getValues("apiUrl");
    if (!apiUrl) return;
    
    try {
      const { path, queryParams } = parseUrl(apiUrl);
      setValue("path", path);
      setQueryParams(queryParams);
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
    }
  };
  
  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "" }]);
  };
  
  const updateQueryParam = (index: number, field: "key" | "value", value: string) => {
    const updated = [...queryParams];
    updated[index][field] = value;
    setQueryParams(updated);
  };
  
  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };
  
  const addHeader = () => {
    setHeaders([...headers, { name: "", value: "" }]);
  };
  
  const updateHeader = (index: number, field: "name" | "value", value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };
  
  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };
  
  const formatJson = () => {
    try {
      const responseBody = getValues("responseBody");
      const formatted = JSON.stringify(JSON.parse(responseBody), null, 2);
      setValue("responseBody", formatted);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please enter valid JSON",
        variant: "destructive"
      });
    }
  };
  
  const handlePreview = () => {
    const formValues = getValues();
    onPreview(formValues);
  };
  
  const onSubmit = async (data: StubFormData) => {
    try {
      // If mode is new but no filename provided, show error
      if (data.mode === "new" && !data.filename) {
        toast({
          title: "Filename Required",
          description: "Please enter a filename",
          variant: "destructive"
        });
        return;
      }
      
      // Ensure filename has .ejs extension
      if (data.mode === "new" && !data.filename.endsWith(".ejs")) {
        data.filename = `${data.filename}.ejs`;
      }
      
      // If mode is append, use the selected file
      if (data.mode === "append" && !data.filename) {
        toast({
          title: "File Selection Required",
          description: "Please select a file to append to",
          variant: "destructive"
        });
        return;
      }
      
      // Send to server
      const response = await apiRequest("POST", "/api/files", data);
      const result = await response.json();
      
      // Generate file download
      const stub = generateStub(data);
      const ejsTemplate = generateEjsTemplate(stub);
      
      const blob = new Blob([ejsTemplate], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `File "${data.filename}" saved successfully!`
      });
      
      // Refresh file list
      refetchFiles();
      
    } catch (error) {
      console.error("Error saving file:", error);
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive"
      });
    }
  };
  
  const handleFileSelectChange = (value: string) => {
    if (value === "new") {
      setIsNewFile(true);
      setValue("mode", "new");
      setValue("filename", "");
    } else {
      setIsNewFile(false);
      setValue("mode", "append");
      setValue("filename", value);
    }
  };
  
  return (
    <Card className="bg-white shadow-md">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Stub</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* URL Input Section */}
          <div>
            <Label htmlFor="apiUrl" className="text-sm font-medium text-gray-700 mb-1">API URL</Label>
            <div className="relative">
              <Controller
                name="apiUrl"
                control={control}
                render={({ field }) => (
                  <Input
                    id="apiUrl"
                    className="w-full px-4 py-2 font-mono text-sm"
                    placeholder="https://api.example.com/users?id=123&filter=active"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                    }}
                  />
                )}
              />
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-blue-700 h-auto p-1"
                onClick={handleUrlParse}
              >
                <i className="fas fa-magic" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Enter a complete URL to auto-extract path and query parameters</p>
          </div>
          
          {/* Path & Status Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="path" className="text-sm font-medium text-gray-700 mb-1">Path</Label>
              <Controller
                name="path"
                control={control}
                render={({ field }) => (
                  <Input
                    id="path"
                    className="w-full px-4 py-2 font-mono text-sm"
                    placeholder="/users"
                    {...field}
                  />
                )}
              />
              {errors.path && <p className="text-red-500 text-xs mt-1">{errors.path.message}</p>}
            </div>
            <div>
              <Label htmlFor="statusCode" className="text-sm font-medium text-gray-700 mb-1">Status Code</Label>
              <Controller
                name="statusCode"
                control={control}
                render={({ field: { onChange, value, ...rest } }) => (
                  <Input
                    id="statusCode"
                    type="number"
                    className="w-full px-4 py-2"
                    min={100}
                    max={599}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    {...rest}
                  />
                )}
              />
              {errors.statusCode && <p className="text-red-500 text-xs mt-1">{errors.statusCode.message}</p>}
            </div>
          </div>
          
          {/* Query Parameters */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Query Parameters</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
              {queryParams.length === 0 && (
                <p className="text-gray-400 text-sm">No query parameters. Add one below.</p>
              )}
              
              {queryParams.map((param, index) => (
                <div key={index} className="grid grid-cols-10 gap-2 items-center">
                  <Input
                    className="col-span-4 px-3 py-2 text-sm font-mono"
                    placeholder="key"
                    value={param.key}
                    onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                  />
                  <Input
                    className="col-span-5 px-3 py-2 text-sm font-mono"
                    placeholder="value"
                    value={param.value}
                    onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="col-span-1 text-red-500 hover:text-red-700 h-auto p-1"
                    onClick={() => removeQueryParam(index)}
                  >
                    <i className="fas fa-times" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 text-sm text-primary hover:text-blue-700"
              onClick={addQueryParam}
            >
              <i className="fas fa-plus mr-1" /> Add Query Parameter
            </Button>
          </div>
          
          {/* Headers */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Headers</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
              {headers.length === 0 && (
                <p className="text-gray-400 text-sm">No headers. Add one below.</p>
              )}
              
              {headers.map((header, index) => (
                <div key={index} className="grid grid-cols-10 gap-2 items-center">
                  <Input
                    className="col-span-4 px-3 py-2 text-sm font-mono"
                    placeholder="name"
                    value={header.name}
                    onChange={(e) => updateHeader(index, "name", e.target.value)}
                  />
                  <Input
                    className="col-span-5 px-3 py-2 text-sm font-mono"
                    placeholder="value"
                    value={header.value}
                    onChange={(e) => updateHeader(index, "value", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="col-span-1 text-red-500 hover:text-red-700 h-auto p-1"
                    onClick={() => removeHeader(index)}
                  >
                    <i className="fas fa-times" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 text-sm text-primary hover:text-blue-700"
              onClick={addHeader}
            >
              <i className="fas fa-plus mr-1" /> Add Header
            </Button>
          </div>
          
          {/* Response Body */}
          <div>
            <Label htmlFor="responseBody" className="text-sm font-medium text-gray-700 mb-1">Response Body (JSON)</Label>
            <div className="relative">
              <Controller
                name="responseBody"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="responseBody"
                    rows={5}
                    className="w-full px-4 py-2 font-mono text-sm"
                    placeholder='{ "message": "Success", "data": {} }'
                    {...field}
                  />
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-primary hover:text-blue-700 text-sm p-1"
                onClick={formatJson}
              >
                <i className="fas fa-code" /> Format
              </Button>
            </div>
            {errors.responseBody && <p className="text-red-500 text-xs mt-1">{errors.responseBody.message}</p>}
          </div>
          
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="fileSelect" className="text-sm font-medium text-gray-700">Save to File</Label>
            <div className="flex gap-2">
              <Select defaultValue="new" onValueChange={handleFileSelectChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select file" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create new file</SelectItem>
                  {files?.map((file, index) => (
                    <SelectItem key={index} value={file}>
                      {file}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => refetchFiles()}
              >
                <i className="fas fa-sync-alt" />
              </Button>
            </div>
            
            {isNewFile && (
              <div className="mt-2">
                <Label htmlFor="newFileName" className="text-sm font-medium text-gray-700">New File Name</Label>
                <div className="flex">
                  <Controller
                    name="filename"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="newFileName"
                        className="w-full px-4 py-2 rounded-l-md"
                        placeholder="filename"
                        {...field}
                      />
                    )}
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-100 text-gray-500 rounded-r-md">
                    .ejs
                  </span>
                </div>
                {errors.filename && <p className="text-red-500 text-xs mt-1">{errors.filename.message}</p>}
              </div>
            )}
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end space-x-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              className="px-4 py-2 bg-white border border-primary text-primary rounded-md hover:bg-blue-50"
            >
              <i className="fas fa-eye mr-1" /> Preview
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
            >
              <i className="fas fa-save mr-1" /> Save & Download
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
