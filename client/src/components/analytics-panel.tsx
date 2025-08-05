import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { Document } from "@shared/schema";

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

export default function AnalyticsPanel() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-4" />
                <div className="h-64 bg-slate-200 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const successRate = analytics?.processedDocuments && analytics?.totalDocuments 
    ? ((analytics.processedDocuments / analytics.totalDocuments) * 100).toFixed(1)
    : "0";

  const recentActivity = (documents as Document[])
    .filter((doc: Document) => doc.status === "completed" || doc.status === "failed")
    .slice(0, 5)
    .map((doc: Document) => ({
      ...doc,
      timestamp: doc.processedAt || doc.uploadedAt,
    }))
    .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const propertyTypes = analytics?.propertyTypes || {};
  const totalProperties = Object.values(propertyTypes).reduce((sum: number, count: unknown) => sum + (count as number), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Price Distribution Chart Placeholder */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Price Distribution</h3>
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Chart visualization</p>
              <p className="text-sm text-slate-500">Available when more data is processed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Types */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Property Types</h3>
          <div className="space-y-4">
            {Object.entries(propertyTypes).length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No property type data yet</p>
              </div>
            ) : (
              Object.entries(propertyTypes).map(([type, count]) => {
                const percentage = (totalProperties as number) > 0 ? ((count as number) / (totalProperties as number) * 100).toFixed(0) : 0;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 capitalize">{type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 w-8">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Stats */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Processing Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-semibold text-green-600">
                {successRate}%
              </div>
              <div className="text-sm text-slate-600">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-semibold text-blue-600">
                {analytics?.totalProperties || 0}
              </div>
              <div className="text-sm text-slate-600">Properties Extracted</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-semibold text-yellow-600">
                {analytics?.processedDocuments || 0}
              </div>
              <div className="text-sm text-slate-600">Documents Processed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-semibold text-purple-600">
                {analytics?.totalDocuments || 0}
              </div>
              <div className="text-sm text-slate-600">Total Documents</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No recent activity</p>
              </div>
            ) : (
              recentActivity.map((doc: any) => (
                <div key={doc.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    doc.status === "completed" ? "bg-green-500" : 
                    doc.status === "failed" ? "bg-red-500" : 
                    "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">
                      {doc.status === "completed" && "Processed "}
                      {doc.status === "failed" && "Failed to process "}
                      <span className="font-medium">{doc.originalName}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.timestamp ? new Date(doc.timestamp).toLocaleString() : "Unknown time"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
