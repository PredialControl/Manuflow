"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Plus, Filter, X } from "lucide-react";
import { DeleteAssetButton } from "@/components/delete-asset-button";

interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  brand: string | null;
  power: string | null;
  category: string | null;
  frequency: string;
  operationalStatus: string;
  image: string | null;
}

interface AssetsGridWithFiltersProps {
  assets: Asset[];
  contractId: string;
  isAdmin: boolean;
}

export function AssetsGridWithFilters({ assets, contractId, isAdmin }: AssetsGridWithFiltersProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Get unique asset types
  const assetTypes = useMemo(() => {
    const types = new Set(assets.map(asset => asset.type));
    return Array.from(types).sort();
  }, [assets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesType = !selectedType || asset.type === selectedType;
      const matchesStatus = !selectedStatus || asset.operationalStatus === selectedStatus;
      return matchesType && matchesStatus;
    });
  }, [assets, selectedType, selectedStatus]);

  const clearFilters = () => {
    setSelectedType(null);
    setSelectedStatus(null);
  };

  const hasActiveFilters = selectedType !== null || selectedStatus !== null;

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="glass rounded-2xl border border-border/60 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Filtros</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Type Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center px-2">
              Tipo:
            </span>
            {assetTypes.map(type => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`h-8 text-xs font-black uppercase tracking-tight ${selectedType === type ? 'shadow-lg' : ''}`}
              >
                {type}
              </Button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 ml-auto">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center px-2">
              Status:
            </span>
            <Button
              variant={selectedStatus === 'OPERATIONAL' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(selectedStatus === 'OPERATIONAL' ? null : 'OPERATIONAL')}
              className={`h-8 text-xs font-black uppercase tracking-tight ${selectedStatus === 'OPERATIONAL' ? 'bg-green-500 hover:bg-green-600' : 'border-green-500 text-green-500 hover:bg-green-500/10'}`}
            >
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              Funcionando
            </Button>
            <Button
              variant={selectedStatus === 'NOT_OPERATIONAL' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(selectedStatus === 'NOT_OPERATIONAL' ? null : 'NOT_OPERATIONAL')}
              className={`h-8 text-xs font-black uppercase tracking-tight ${selectedStatus === 'NOT_OPERATIONAL' ? 'bg-red-500 hover:bg-red-600' : 'border-red-500 text-red-500 hover:bg-red-500/10'}`}
            >
              <div className="h-2 w-2 bg-red-500 rounded-full mr-2" />
              Parado
            </Button>
            <Button
              variant={selectedStatus === 'MAINTENANCE' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(selectedStatus === 'MAINTENANCE' ? null : 'MAINTENANCE')}
              className={`h-8 text-xs font-black uppercase tracking-tight ${selectedStatus === 'MAINTENANCE' ? 'bg-yellow-500 hover:bg-yellow-600' : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'}`}
            >
              <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2" />
              Manutenção
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Exibindo <span className="font-bold text-foreground">{filteredAssets.length}</span> de{" "}
            <span className="font-bold text-foreground">{assets.length}</span> ativos
          </p>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="relative group/asset">
            {isAdmin && (
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/asset:opacity-100 transition-opacity">
                <DeleteAssetButton
                  assetId={asset.id}
                  contractId={contractId}
                  assetName={asset.name}
                  variant="icon"
                />
              </div>
            )}
            <Link href={`/contracts/${contractId}/assets/${asset.id}`}>
              <Card className="group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden border-border/60 hover:border-primary/40 rounded-2xl bg-card/40 backdrop-blur-sm h-full">
                <div className="aspect-[16/10] w-full bg-muted overflow-hidden relative border-b border-border/40">
                  {asset.image ? (
                    <img src={asset.image} alt={asset.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/50">
                      <Package className="h-12 w-12 mb-2 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</span>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="bg-background/80 backdrop-blur-md text-[10px] font-black px-3 py-1.5 rounded-lg border border-border/40 uppercase tracking-widest shadow-sm">
                      {asset.type}
                    </span>
                    {asset.category && (
                      <span className="bg-primary/10 backdrop-blur-md text-primary text-[8px] font-black px-2 py-1 rounded-md border border-primary/20 uppercase tracking-widest shadow-sm">
                        {asset.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-4 right-4">
                    {asset.operationalStatus === 'OPERATIONAL' && (
                      <div className="flex items-center gap-2 bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                        <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Funcionando</span>
                      </div>
                    )}
                    {asset.operationalStatus === 'NOT_OPERATIONAL' && (
                      <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                        <div className="h-3 w-3 bg-white rounded-full" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Parado</span>
                      </div>
                    )}
                    {asset.operationalStatus === 'MAINTENANCE' && (
                      <div className="flex items-center gap-2 bg-yellow-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                        <div className="h-3 w-3 bg-white rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">Manutenção</span>
                      </div>
                    )}
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black tracking-tight uppercase italic leading-tight group-hover:text-primary transition-colors">{asset.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{asset.location}</p>
                      </div>
                      {(asset.brand || asset.power) && (
                        <div className="flex items-center gap-2 mt-2">
                          {asset.brand && (
                            <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded-md border border-primary/10 uppercase tracking-tighter">
                              {asset.brand}
                            </span>
                          )}
                          {asset.power && (
                            <span className="text-[9px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border/40 uppercase tracking-tighter">
                              {asset.power}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter">Frequência</span>
                        <span className="text-xs font-black uppercase tracking-widest">{asset.frequency}</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum ativo encontrado com os filtros selecionados</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
