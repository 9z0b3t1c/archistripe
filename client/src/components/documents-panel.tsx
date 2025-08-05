import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Search, Download, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DocumentWithData } from "@shared/schema";

export default function DocumentsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithData | null>(null);
  
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

  const handleDownload = async (doc: DocumentWithData) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the document.",
        variant: "destructive",
      });
    }
  };

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

  const getDocumentTypeBadge = (type?: string | null) => {
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
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-900"
                          onClick={() => handleDownload(doc)}
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

      {/* Document Details Modal */}
      <Dialog open={selectedDocument !== null} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {selectedDocument?.originalName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-slate-600">File Size</div>
                  <div className="text-sm">{formatFileSize(selectedDocument.size)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">Upload Date</div>
                  <div className="text-sm">
                    {selectedDocument.uploadedAt ? new Date(selectedDocument.uploadedAt).toLocaleDateString() : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">Status</div>
                  <div>{getStatusBadge(selectedDocument.status)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-600">Document Type</div>
                  <div>{getDocumentTypeBadge(selectedDocument.propertyData?.documentType || "")}</div>
                </div>
              </div>

              {/* Property Data */}
              {selectedDocument.propertyData && (
                <div className="mt-6 space-y-4 max-h-96 overflow-y-auto">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Comprehensive Property Information</h3>
                  
                  {/* Check if this is a problematic document with no property data */}
                  {(!selectedDocument.propertyData.address && 
                    !selectedDocument.propertyData.squareFootage && 
                    !selectedDocument.propertyData.bedrooms) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="text-amber-600 mt-0.5">⚠️</div>
                        <div>
                          <h4 className="font-medium text-amber-800 text-sm">No Property Data Extracted</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            This PDF does not contain extractable property information. It may be:
                            <br />• A scanned document or image-based PDF
                            <br />• A floor plan or diagram without text content
                            <br />• A document with text rendering issues
                            <br />
                            Try uploading property listings, contracts, or appraisals with readable text content.
                          </p>
                          {selectedDocument.propertyData.rawExtractedData?.document_classification?.extraction_note && (
                            <p className="text-xs text-amber-600 mt-2 italic">
                              {selectedDocument.propertyData.rawExtractedData.document_classification.extraction_note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Basic Property Info */}
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2 text-sm">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {selectedDocument.propertyData.address && (
                        <div>
                          <span className="font-medium text-slate-600">Address:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.address}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.city && (
                        <div>
                          <span className="font-medium text-slate-600">City:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.city}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.state && (
                        <div>
                          <span className="font-medium text-slate-600">State:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.state}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.zipCode && (
                        <div>
                          <span className="font-medium text-slate-600">ZIP:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.zipCode}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.county && (
                        <div>
                          <span className="font-medium text-slate-600">County:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.county}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.neighborhood && (
                        <div>
                          <span className="font-medium text-slate-600">Neighborhood:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.neighborhood}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2 text-sm">Property Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {selectedDocument.propertyData.propertyType && (
                        <div>
                          <span className="font-medium text-slate-600">Type:</span>
                          <span className="text-slate-900 ml-1 capitalize">{selectedDocument.propertyData.propertyType}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.yearBuilt && (
                        <div>
                          <span className="font-medium text-slate-600">Built:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.yearBuilt}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.squareFootage && (
                        <div>
                          <span className="font-medium text-slate-600">Sq Ft:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.squareFootage.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.bedrooms && (
                        <div>
                          <span className="font-medium text-slate-600">Bedrooms:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.bedrooms}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.bathrooms && (
                        <div>
                          <span className="font-medium text-slate-600">Bathrooms:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.bathrooms}</span>
                        </div>
                      )}
                      {selectedDocument.propertyData.lotSize && (
                        <div>
                          <span className="font-medium text-slate-600">Lot Size:</span>
                          <span className="text-slate-900 ml-1">{selectedDocument.propertyData.lotSize.toLocaleString()} sq ft</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Information */}
                  {(selectedDocument.propertyData.price || selectedDocument.propertyData.listPrice || selectedDocument.propertyData.taxes || selectedDocument.propertyData.hoa) && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-slate-800 mb-2 text-sm">Financial Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {selectedDocument.propertyData.price && (
                          <div>
                            <span className="font-medium text-slate-600">Price:</span>
                            <span className="text-slate-900 ml-1 font-semibold">${selectedDocument.propertyData.price.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.listPrice && (
                          <div>
                            <span className="font-medium text-slate-600">List Price:</span>
                            <span className="text-slate-900 ml-1">${selectedDocument.propertyData.listPrice.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.salePrice && (
                          <div>
                            <span className="font-medium text-slate-600">Sale Price:</span>
                            <span className="text-slate-900 ml-1">${selectedDocument.propertyData.salePrice.toLocaleString()}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.taxes && (
                          <div>
                            <span className="font-medium text-slate-600">Taxes:</span>
                            <span className="text-slate-900 ml-1">${selectedDocument.propertyData.taxes.toLocaleString()}/yr</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.hoa && (
                          <div>
                            <span className="font-medium text-slate-600">HOA:</span>
                            <span className="text-slate-900 ml-1">${selectedDocument.propertyData.hoa}/mo</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.pricePerSqFt && (
                          <div>
                            <span className="font-medium text-slate-600">$/Sq Ft:</span>
                            <span className="text-slate-900 ml-1">${selectedDocument.propertyData.pricePerSqFt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features & Amenities */}
                  {(selectedDocument.propertyData.garage || selectedDocument.propertyData.pool !== undefined || selectedDocument.propertyData.fireplace !== undefined || selectedDocument.propertyData.basement) && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-medium text-slate-800 mb-2 text-sm">Features & Amenities</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {selectedDocument.propertyData.garage && (
                          <div>
                            <span className="font-medium text-slate-600">Garage:</span>
                            <span className="text-slate-900 ml-1 capitalize">{selectedDocument.propertyData.garage}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.basement && (
                          <div>
                            <span className="font-medium text-slate-600">Basement:</span>
                            <span className="text-slate-900 ml-1 capitalize">{selectedDocument.propertyData.basement}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.pool !== undefined && (
                          <div>
                            <span className="font-medium text-slate-600">Pool:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.pool ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.fireplace !== undefined && (
                          <div>
                            <span className="font-medium text-slate-600">Fireplace:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.fireplace ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.airConditioning && (
                          <div>
                            <span className="font-medium text-slate-600">AC:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.airConditioning}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.heating && (
                          <div>
                            <span className="font-medium text-slate-600">Heating:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.heating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Legal & ID Information */}
                  {(selectedDocument.propertyData.mlsNumber || selectedDocument.propertyData.parcelId || selectedDocument.propertyData.ownerName) && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h4 className="font-medium text-slate-800 mb-2 text-sm">Legal & Identification</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {selectedDocument.propertyData.mlsNumber && (
                          <div>
                            <span className="font-medium text-slate-600">MLS:</span>
                            <span className="text-slate-900 ml-1 font-mono">{selectedDocument.propertyData.mlsNumber}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.parcelId && (
                          <div>
                            <span className="font-medium text-slate-600">Parcel ID:</span>
                            <span className="text-slate-900 ml-1 font-mono">{selectedDocument.propertyData.parcelId}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.ownerName && (
                          <div>
                            <span className="font-medium text-slate-600">Owner:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.ownerName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates & Timeline */}
                  {(selectedDocument.propertyData.listDate || selectedDocument.propertyData.saleDate || selectedDocument.propertyData.closeDate) && (
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <h4 className="font-medium text-slate-800 mb-2 text-sm">Timeline</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {selectedDocument.propertyData.listDate && (
                          <div>
                            <span className="font-medium text-slate-600">Listed:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.listDate}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.saleDate && (
                          <div>
                            <span className="font-medium text-slate-600">Sold:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.saleDate}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.closeDate && (
                          <div>
                            <span className="font-medium text-slate-600">Closed:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.closeDate}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.inspectionDate && (
                          <div>
                            <span className="font-medium text-slate-600">Inspection:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.inspectionDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(selectedDocument.propertyData.condition || selectedDocument.propertyData.schoolDistrict || selectedDocument.propertyData.walkScore) && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-slate-800 mb-2 text-sm">Additional Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {selectedDocument.propertyData.condition && (
                          <div>
                            <span className="font-medium text-slate-600">Condition:</span>
                            <span className="text-slate-900 ml-1 capitalize">{selectedDocument.propertyData.condition}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.schoolDistrict && (
                          <div>
                            <span className="font-medium text-slate-600">School District:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.schoolDistrict}</span>
                          </div>
                        )}
                        {selectedDocument.propertyData.walkScore && (
                          <div>
                            <span className="font-medium text-slate-600">Walk Score:</span>
                            <span className="text-slate-900 ml-1">{selectedDocument.propertyData.walkScore}/100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Extracted Text Preview */}
              {selectedDocument.propertyData?.rawExtractedData && 
               typeof selectedDocument.propertyData.rawExtractedData === 'object' && 
               'extractedText' in selectedDocument.propertyData.rawExtractedData && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Extracted Text Preview</h3>
                  <div className="p-3 bg-slate-50 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                      {String(selectedDocument.propertyData.rawExtractedData.extractedText).substring(0, 500)}
                      {String(selectedDocument.propertyData.rawExtractedData.extractedText).length > 500 && "..."}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => handleDownload(selectedDocument)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedDocument(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
