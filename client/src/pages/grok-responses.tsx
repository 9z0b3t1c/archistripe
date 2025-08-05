import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, EyeOff } from "lucide-react";
import type { DocumentWithData } from "@shared/schema";

export default function GrokResponsesPage() {
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());

  const { data: documents = [], isLoading } = useQuery<DocumentWithData[]>({
    queryKey: ["/api/documents"],
  });

  const documentsWithGrok = documents.filter(doc => 
    doc.propertyData?.rawExtractedData?.fullGrokResponse
  );

  const toggleExpanded = (docId: string) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedResponses(newExpanded);
  };

  const downloadGrokResponse = (doc: DocumentWithData) => {
    const grokResponse = doc.propertyData?.rawExtractedData?.fullGrokResponse;
    if (grokResponse) {
      const blob = new Blob([JSON.stringify(grokResponse, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grok_response_${doc.originalName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading Grok responses...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Full Grok AI Response Viewer</h1>
        <p className="text-slate-600">
          Access complete AI analysis responses for all processed documents
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Summary: {documentsWithGrok.length} of {documents.length} documents have full Grok responses
          </CardTitle>
        </CardHeader>
      </Card>

      {documentsWithGrok.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Grok Responses Found</h3>
            <p className="text-slate-600">Upload and process documents first to see AI responses here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {documentsWithGrok.map((doc, index) => {
            const grokResponse = doc.propertyData!.rawExtractedData!.fullGrokResponse!;
            const classification = grokResponse.parsed_result?.documentClassification || {};
            const isExpanded = expandedResponses.has(doc.id);

            return (
              <Card key={doc.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-slate-900 mb-2">
                        {index + 1}. {doc.originalName}
                      </CardTitle>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div>Uploaded: {new Date(doc.uploadedAt!).toLocaleString()}</div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            {doc.status}
                          </Badge>
                          {classification.documentType && (
                            <Badge variant="outline">
                              {classification.documentType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-green-800 mb-3">✅ Full Grok Response Available</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded">
                        <div className="text-xs text-slate-600 uppercase font-medium">Model</div>
                        <div className="text-sm font-semibold">{grokResponse.model || 'Unknown'}</div>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <div className="text-xs text-slate-600 uppercase font-medium">Total Tokens</div>
                        <div className="text-sm font-semibold">{(grokResponse.total_tokens || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <div className="text-xs text-slate-600 uppercase font-medium">Processing Time</div>
                        <div className="text-sm font-semibold">{((grokResponse.response_time_ms || 0) / 1000).toFixed(1)}s</div>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <div className="text-xs text-slate-600 uppercase font-medium">Document Type</div>
                        <div className="text-sm font-semibold">{classification.documentType || 'Unknown'}</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => downloadGrokResponse(doc)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Full Response
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toggleExpanded(doc.id)}
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Raw Response
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Show Raw Response
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">
                          Raw AI Response ({(grokResponse.full_response_content || '').length.toLocaleString()} characters):
                        </h5>
                        <div className="bg-slate-900 text-slate-200 p-4 rounded text-xs font-mono max-h-80 overflow-y-auto whitespace-pre-wrap">
                          {grokResponse.full_response_content || 'No raw content available'}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}