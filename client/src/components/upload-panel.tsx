import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CloudUpload, Sparkles, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import FileUpload from "@/components/ui/file-upload";
import type { Document } from "@shared/schema";

export default function UploadPanel() {
  // Processing options are now always enabled
  const processingOptions = {
    extractPropertyDetails: true,
    parseFinancialInfo: true,
    identifyDocumentType: true,
    generateSummary: true,
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for documents to show processing queue
  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    refetchInterval: 2000, // Poll every 2 seconds for updates
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        // Add processing options to the form data
        formData.append("processingOptions", JSON.stringify(processingOptions));
        
        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Upload failed: ${response.status}`);
        }
        
        return response.json();
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Your files have been uploaded and processing has started.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleFilesSelected = (files: File[]) => {
    uploadMutation.mutate(files);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Uploaded</Badge>;
    }
  };

  const processingQueue = (documents as Document[])
    .filter((doc: Document) => doc.status !== "completed")
    .slice(0, 5); // Show latest 5 processing items

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Upload Section */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Upload Real Estate Documents
            </h2>

            <FileUpload
              onFilesSelected={handleFilesSelected}
              isUploading={uploadMutation.isPending}
              accept="application/pdf"
              multiple
            />

            {/* Processing Features Info */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="text-sm font-medium text-slate-900 mb-2">AI Processing Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Property details extraction</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Financial information parsing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Document type identification</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Summary generation</span>
                </div>
              </div>
            </div>

            <Button 
              className="mt-6 w-full" 
              disabled={uploadMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Processing with Grok AI
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Processing Queue */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Processing Queue</h3>

            <div className="space-y-3">
              {processingQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CloudUpload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No documents in queue</p>
                </div>
              ) : (
                processingQueue.map((doc: Document) => (
                  <div
                    key={doc.id}
                    className={`p-4 border rounded-lg ${
                      doc.status === "processing"
                        ? "bg-blue-50 border-blue-200"
                        : doc.status === "completed"
                        ? "bg-green-50 border-green-200"
                        : doc.status === "failed"
                        ? "bg-red-50 border-red-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900 truncate">
                        {doc.originalName}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>
                    
                    {doc.status === "processing" && (
                      <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "65%" }} />
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-slate-600">
                      {getStatusIcon(doc.status)}
                      <span className="ml-1">
                        {doc.status === "processing" && "Extracting property details..."}
                        {doc.status === "completed" && "✓ Data extracted successfully"}
                        {doc.status === "failed" && (doc.errorMessage || "Processing failed")}
                        {doc.status === "uploaded" && "Waiting to process..."}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                {(documents as Document[]).length} file{(documents as Document[]).length !== 1 ? "s" : ""} total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
