"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CSVImportDialog } from "@/components/properties/CSVImportDialog";
import { AIGenerationDialog } from "@/components/properties/AIGenerationDialog";
import { 
  Building2, 
  Bot, 
  Plus, 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Square,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  Sparkles
} from "lucide-react";

// Mock data for properties
const mockProperties = [
  {
    id: 1,
    name: "渋谷区新築マンション",
    address: "東京都渋谷区恵比寿1-23-4",
    price: 850000,
    rooms: "2LDK",
    area: 65.5,
    built: "2024年",
    status: "available",
    aiGenerated: true,
    description: "駅徒歩3分、南向きで日当たり良好。リノベーション済みの美しい2LDKマンション。近隣にはカフェや公園があり、住環境も抜群です。"
  },
  {
    id: 2,
    name: "品川タワーマンション",
    address: "東京都品川区大崎2-1-1",
    price: 1200000,
    rooms: "3LDK",
    area: 80.2,
    built: "2023年",
    status: "available",
    aiGenerated: false,
    description: ""
  },
  {
    id: 3,
    name: "世田谷区戸建て",
    address: "東京都世田谷区駒沢3-15-8",
    price: 680000,
    rooms: "4LDK",
    area: 120.0,
    built: "2020年",
    status: "rented",
    aiGenerated: true,
    description: "閑静な住宅街に位置する戸建て住宅。庭付きで家族向けに最適。駐車場完備で都心部へのアクセスも良好です。"
  }
];

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [properties] = useState(mockProperties);

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateAI = (propertyId: number) => {
    console.log("AI生成開始:", propertyId);
    // TODO: Implement AI generation
  };

  const handleImportComplete = (result: any) => {
    console.log("Import completed:", result);
    // TODO: Refresh properties list
    // You could add a state refresh or refetch here
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">物件管理</h1>
          <p className="text-muted-foreground">
            物件情報の管理とAI生成機能
          </p>
        </div>
        <div className="flex space-x-2">
          <AIGenerationDialog onComplete={() => window.location.reload()} />
          <CSVImportDialog onImportComplete={handleImportComplete} />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規物件追加
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="物件名・住所で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>総物件数: {properties.length}</span>
            <span>AI生成済み: {properties.filter(p => p.aiGenerated).length}</span>
            <span>空室: {properties.filter(p => p.status === "available").length}</span>
          </div>
          {properties.filter(p => !p.aiGenerated).length > 0 && (
            <AIGenerationDialog 
              trigger={
                <Button size="sm" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI一括生成 ({properties.filter(p => !p.aiGenerated).length}件)
                </Button>
              }
              onComplete={() => window.location.reload()}
            />
          )}
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{property.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  {property.aiGenerated && (
                    <Badge variant="secondary" className="text-xs">
                      <Bot className="h-3 w-3 mr-1" />
                      AI生成済み
                    </Badge>
                  )}
                  <Badge 
                    variant={property.status === "available" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {property.status === "available" ? "空室" : "入居中"}
                  </Badge>
                </div>
              </div>
              <CardDescription className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {property.address}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Property Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>¥{property.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{property.rooms}</span>
                </div>
                <div className="flex items-center">
                  <Square className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{property.area}㎡</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{property.built}</span>
                </div>
              </div>

              {/* AI Description */}
              {property.aiGenerated && property.description && (
                <div className="p-3 bg-secondary/50 rounded-md">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">AI生成説明文</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {!property.aiGenerated && (
                  <Button
                    size="sm"
                    onClick={() => handleGenerateAI(property.id)}
                    className="flex-1"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI生成
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  詳細
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">物件が見つかりません</h3>
          <p className="text-muted-foreground mb-4">
            検索条件を変更するか、新しい物件を追加してください
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規物件追加
          </Button>
        </div>
      )}
    </div>
  );
}