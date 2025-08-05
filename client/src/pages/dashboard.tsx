import { useState } from "react";
import { FileText, Upload, Database, BarChart3, Settings } from "lucide-react";
import UploadPanel from "@/components/upload-panel";
import DocumentsPanel from "@/components/documents-panel";
import DataPanel from "@/components/data-panel";
import AnalyticsPanel from "@/components/analytics-panel";

type TabType = "upload" | "documents" | "data" | "analytics";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("upload");

  const tabs = [
    { id: "upload" as const, label: "Upload & Process", icon: Upload },
    { id: "documents" as const, label: "Documents", icon: FileText },
    { id: "data" as const, label: "Extracted Data", icon: Database },
    { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900">RealEstate Parser</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/grok-responses" 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Full Grok Responses
              </a>
              <span className="text-sm text-slate-600">Welcome, Admin</span>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <nav className="flex space-x-8 mb-8 border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        {activeTab === "upload" && <UploadPanel />}
        {activeTab === "documents" && <DocumentsPanel />}
        {activeTab === "data" && <DataPanel />}
        {activeTab === "analytics" && <AnalyticsPanel />}
      </div>
    </div>
  );
}
