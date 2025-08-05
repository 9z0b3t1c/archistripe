import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, DollarSign, Square, Bed, Download, RefreshCw } from "lucide-react";
import type { PropertyData } from "@shared/schema";

interface AnalyticsData {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  totalProperties: number;
  avgPrice: number;
  avgSquareFootage: number;
  avgBedrooms: number;
  propertyTypes: Record<string, number>;
}

export default function DataPanel() {
  const { data: propertyData = [], isLoading, refetch } = useQuery<PropertyData[]>({
    queryKey: ["/api/property-data"],
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  const formatPrice = (price?: number | string | null) => {
    if (!price) return "-";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatNumber = (num?: number | null) => {
    if (!num) return "-";
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getPropertyTypeBadge = (type?: string | null) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    
    const colors = {
      house: "bg-green-100 text-green-800",
      condo: "bg-blue-100 text-blue-800",
      apartment: "bg-purple-100 text-purple-800",
      townhouse: "bg-orange-100 text-orange-800",
    };
    
    const colorClass = colors[type as keyof typeof colors] || "bg-slate-100 text-slate-800";
    
    return (
      <Badge className={colorClass}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const handleExport = () => {
    // Convert data to CSV
    const headers = ["Address", "City", "State", "ZIP", "Price", "Sq Ft", "Bedrooms", "Bathrooms", "Type"];
    const csvContent = [
      headers.join(","),
      ...(propertyData as PropertyData[]).map((prop: PropertyData) => [
        `"${prop.address || ""}"`,
        `"${prop.city || ""}"`,
        `"${prop.state || ""}"`,
        `"${prop.zipCode || ""}"`,
        prop.price || "",
        prop.squareFootage || "",
        prop.bedrooms || "",
        prop.bathrooms || "",
        `"${prop.propertyType || ""}"`,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "property_data.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Properties</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {analytics?.totalProperties || (propertyData as PropertyData[]).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Avg. Price</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatPrice(analytics?.avgPrice)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Square className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Avg. Sq Ft</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatNumber(analytics?.avgSquareFootage)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Bed className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Avg. Bedrooms</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {analytics?.avgBedrooms ? analytics.avgBedrooms.toFixed(1) : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Extracted Property Data</h2>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
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
                      Property Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sq Ft
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Bed/Bath
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {(propertyData as PropertyData[]).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Home className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No property data extracted yet</p>
                        <p className="text-sm text-slate-400 mt-2">
                          Upload and process some documents to see extracted data here
                        </p>
                      </td>
                    </tr>
                  ) : (
                    (propertyData as PropertyData[]).map((property: PropertyData) => (
                      <tr key={property.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {property.address || "Address not extracted"}
                            </div>
                            {(property.city || property.state || property.zipCode) && (
                              <div className="text-sm text-slate-500">
                                {[property.city, property.state, property.zipCode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatPrice(property.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {formatNumber(property.squareFootage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {property.bedrooms || property.bathrooms 
                            ? `${property.bedrooms || "-"} / ${property.bathrooms || "-"}`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPropertyTypeBadge(property.propertyType)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {(propertyData as PropertyData[]).length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Showing {(propertyData as PropertyData[]).length} propert{(propertyData as PropertyData[]).length !== 1 ? "ies" : "y"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
