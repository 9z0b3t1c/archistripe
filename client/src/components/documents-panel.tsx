import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Download, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentWithData } from "@shared/schema";

export default function DocumentsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<DocumentWithData[]>({
    queryKey: ["/api/documents"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const filteredDocuments = (documents as DocumentWithData[]).filter((doc: DocumentWithData) => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.propertyData?.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || 
                       doc.propertyData?.documentType === typeFilter ||
                       (typeFilter === "unknown" && !doc.propertyData?.documentType);
    
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Uploaded</Badge>;
    }
  };

  const getDocumentTypeBadge = (type?: string) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    
    const colors = {
      listing: "bg-blue-100 text-blue-800",
      contract: "bg-purple-100 text-purple-800",
      appraisal: "bg-orange-100 text-orange-800",
      inspection: "bg-green-100 text-green-800",
    };
    
    const colorClass = colors[type as keyof typeof colors] || "bg-slate-100 text-slate-800";
    
    return (
      <Badge className={colorClass}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Document Library</h2>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="relative">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="listing">Listings</SelectItem>
                <SelectItem value="contract">Contracts</SelectItem>
                <SelectItem value="appraisal">Appraisals</SelectItem>
                <SelectItem value="inspection">Inspections</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">
                        {searchTerm || typeFilter !== "all" 
                          ? "No documents match your search criteria" 
                          : "No documents uploaded yet"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc: DocumentWithData) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-red-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {doc.originalName}
                            </div>
                            <div className="text-sm text-slate-500">
                              {formatFileSize(doc.size)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getDocumentTypeBadge(doc.propertyData?.documentType || undefined)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary-foreground hover:bg-primary"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {filteredDocuments.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Showing {filteredDocuments.length} of {(documents as DocumentWithData[]).length} documents
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
