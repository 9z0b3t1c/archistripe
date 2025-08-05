import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PropertyWithDocuments } from "@shared/schema";

interface PropertySelectorProps {
  selectedPropertyId: string | null;
  onPropertySelect: (propertyId: string | null) => void;
}

export default function PropertySelector({ selectedPropertyId, onPropertySelect }: PropertySelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyAddress, setNewPropertyAddress] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties = [] } = useQuery<PropertyWithDocuments[]>({
    queryKey: ["/api/properties"],
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: { name: string; address?: string }) => {
      const response = await fetch("/api/properties", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create property");
      }
      
      return response.json();
    },
    onSuccess: (newProperty) => {
      toast({
        title: "Property created",
        description: `${newProperty.name} has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      onPropertySelect(newProperty.id);
      setShowCreateDialog(false);
      setNewPropertyName("");
      setNewPropertyAddress("");
    },
    onError: (error) => {
      toast({
        title: "Failed to create property",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleCreateProperty = () => {
    if (!newPropertyName.trim()) return;
    
    createPropertyMutation.mutate({
      name: newPropertyName.trim(),
      address: newPropertyAddress.trim() || undefined,
    });
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Property Selection
          </h3>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Property</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    placeholder="e.g., 123 Main Street Property"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    value={newPropertyAddress}
                    onChange={(e) => setNewPropertyAddress(e.target.value)}
                    placeholder="e.g., 123 Main Street, Anytown, NY 12345"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateProperty}
                    disabled={!newPropertyName.trim() || createPropertyMutation.isPending}
                  >
                    Create Property
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Select Property (Optional)</Label>
            <Select value={selectedPropertyId || "none"} onValueChange={(value) => onPropertySelect(value === "none" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a property or upload individually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Individual Documents (No Grouping)
                  </div>
                </SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{property.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {property.documents.length} docs
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProperty && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">{selectedProperty.name}</h4>
                  {selectedProperty.address && (
                    <p className="text-sm text-blue-700">{selectedProperty.address}</p>
                  )}
                </div>
                <Badge variant="secondary">
                  {selectedProperty.documents.length} existing documents
                </Badge>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                New documents will be added to this property group
              </p>
            </div>
          )}

          {!selectedPropertyId && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">
                Documents will be uploaded individually without property grouping. You can create a property to organize related documents together.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}