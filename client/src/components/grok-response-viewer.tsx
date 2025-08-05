import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Copy, Check } from "lucide-react";

interface GrokResponseViewerProps {
  document: {
    id: string;
    originalName: string;
    propertyData?: {
      fullGrokResponse?: any;
      grokModelUsed?: string;
      grokTokensUsed?: number;
      grokProcessingTime?: number;
    };
  };
}

export function GrokResponseViewer({ document }: GrokResponseViewerProps) {
  const [copied, setCopied] = useState(false);
  
  const fullResponse = document.propertyData?.fullGrokResponse;
  
  if (!fullResponse) {
    return null;
  }

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(fullResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTokenUsage = (tokens: number | undefined) => {
    if (!tokens) return "N/A";
    return tokens.toLocaleString();
  };

  const formatProcessingTime = (ms: number | undefined) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          View Full Grok Response
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Grok AI Analysis - {document.originalName}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {document.propertyData?.grokModelUsed || "Unknown Model"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyResponse}
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy JSON"}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metrics Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-slate-600">Tokens Used</div>
              <div className="font-semibold">
                {formatTokenUsage(document.propertyData?.grokTokensUsed)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600">Processing Time</div>
              <div className="font-semibold">
                {formatProcessingTime(document.propertyData?.grokProcessingTime)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-600">Response Size</div>
              <div className="font-semibold">
                {fullResponse.full_response_content?.length || 0} chars
              </div>
            </div>
          </div>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="parsed">Parsed Result</TabsTrigger>
              <TabsTrigger value="raw">Raw Response</TabsTrigger>
              <TabsTrigger value="full">Full Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">API Usage</h4>
                  <div className="space-y-1 text-sm">
                    <div>Model: {fullResponse.model}</div>
                    <div>Prompt Tokens: {fullResponse.prompt_tokens?.toLocaleString() || "N/A"}</div>
                    <div>Completion Tokens: {fullResponse.completion_tokens?.toLocaleString() || "N/A"}</div>
                    <div>Total Tokens: {fullResponse.total_tokens?.toLocaleString() || "N/A"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Processing Info</h4>
                  <div className="space-y-1 text-sm">
                    <div>Timestamp: {new Date(fullResponse.timestamp).toLocaleString()}</div>
                    <div>Response Time: {formatProcessingTime(fullResponse.response_time_ms)}</div>
                    <div>Success: {fullResponse.parsed_result ? "✅" : "❌"}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parsed">
              <ScrollArea className="h-96 w-full">
                <pre className="text-xs p-4 bg-slate-100 rounded">
                  {JSON.stringify(fullResponse.parsed_result, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw">
              <ScrollArea className="h-96 w-full">
                <pre className="text-xs p-4 bg-slate-100 rounded whitespace-pre-wrap">
                  {fullResponse.full_response_content}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="full">
              <ScrollArea className="h-96 w-full">
                <pre className="text-xs p-4 bg-slate-100 rounded">
                  {JSON.stringify(fullResponse, null, 2)}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}