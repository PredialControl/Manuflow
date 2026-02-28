"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Zap, Flame, Calendar, TrendingUp, TrendingDown, Activity, Filter, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { subDays, isAfter, startOfWeek, startOfMonth, startOfYear, parse, isValid } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MeasurementType = "WATER" | "ENERGY" | "GAS";

type Entry = {
    id: string;
    value: number;
    date: string | Date;
    user: { name: string };
    createdAt: string | Date;
};

type Device = {
    id: string;
    name: string;
    type: MeasurementType;
    unit: string;
    serialNumber?: string;
    entries: Entry[];
    contract: {
        id: string;
        name: string;
        company: string;
    };
};

interface SupervisorMeasurementsDashboardProps {
    devices: Device[];
}

export function SupervisorMeasurementsDashboard({ devices }: SupervisorMeasurementsDashboardProps) {
    const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all" | "custom">("month");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const typeIcons = {
        WATER: Droplets,
        ENERGY: Zap,
        GAS: Flame,
    };

    const typeColors = {
        WATER: { bg: "bg-blue-500/10", text: "text-blue-600", chart: "#3b82f6" },
        ENERGY: { bg: "bg-yellow-500/10", text: "text-yellow-600", chart: "#eab308" },
        GAS: { bg: "bg-orange-500/10", text: "text-orange-600", chart: "#f97316" },
    };

    // Filtrar entradas por período
    const getFilteredEntries = (entries: Entry[]) => {
        const now = new Date();
        let filterStartDate: Date | null = null;
        let filterEndDate: Date | null = null;

        if (timeRange === "week") filterStartDate = startOfWeek(now);
        else if (timeRange === "month") filterStartDate = startOfMonth(now);
        else if (timeRange === "year") filterStartDate = startOfYear(now);
        else if (timeRange === "custom") {
            if (startDate) {
                const parsed = parse(startDate, "yyyy-MM-dd", new Date());
                if (isValid(parsed)) filterStartDate = parsed;
            }
            if (endDate) {
                const parsed = parse(endDate, "yyyy-MM-dd", new Date());
                if (isValid(parsed)) {
                    filterEndDate = new Date(parsed);
                    filterEndDate.setHours(23, 59, 59, 999);
                }
            }
        } else {
            return entries;
        }

        return entries.filter(e => {
            const entryDate = new Date(e.createdAt);
            if (filterStartDate && entryDate < filterStartDate) return false;
            if (filterEndDate && entryDate > filterEndDate) return false;
            return filterStartDate ? isAfter(entryDate, filterStartDate) || entryDate.getTime() === filterStartDate.getTime() : true;
        });
    };

    // Preparar dados para gráficos
    const getChartData = (device: Device) => {
        const filtered = getFilteredEntries(device.entries);
        const sortedEntries = [...filtered]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return sortedEntries.map((entry) => ({
            date: new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: entry.value,
            fullDate: formatDate(entry.createdAt),
        }));
    };

    // Calcular consumo acumulado no período
    const getAccumulatedStats = (device: Device) => {
        const filtered = [...getFilteredEntries(device.entries)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (filtered.length < 2) return null;

        const latest = filtered[0];
        const oldest = filtered[filtered.length - 1];
        const consumption = latest.value - oldest.value;

        let period = "total";
        if (timeRange === "week") period = "esta semana";
        else if (timeRange === "month") period = "este mês";
        else if (timeRange === "year") period = "este ano";
        else if (timeRange === "custom") period = "no período";

        return {
            total: consumption,
            period,
            count: filtered.length
        };
    };

    // Calcular estatísticas
    const getDeviceStats = (device: Device) => {
        if (device.entries.length < 2) return null;

        const latest = device.entries[0];
        const previous = device.entries[1];
        const consumption = latest.value - previous.value;
        const percentChange = previous.value > 0 ? ((consumption / previous.value) * 100) : 0;

        return {
            latest: latest.value,
            consumption,
            percentChange,
            isIncrease: consumption > 0,
        };
    };

    // Últimas leituras (todas as últimas leituras de cada medidor)
    const latestReadings = devices
        .filter(d => d.entries.length > 0)
        .map(d => ({
            device: d,
            entry: d.entries[0],
            stats: getDeviceStats(d),
        }))
        .sort((a, b) => new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime())
        .slice(0, 10);

    return (
        <div className="space-y-8">
            {/* Filtros e Cabeçalho */}
            <div className="flex flex-col gap-4 bg-card/40 p-6 rounded-[2rem] border border-border/40 backdrop-blur-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight uppercase italic">Dashboard de Consumo</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Análise de medidores e eficiência</p>
                        </div>
                    </div>

                    <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/20">
                        {[
                            { id: "week", label: "Semana" },
                            { id: "month", label: "Mês" },
                            { id: "year", label: "Ano" },
                            { id: "custom", label: "Período" },
                            { id: "all", label: "Tudo" },
                        ].map((range) => (
                            <button
                                key={range.id}
                                onClick={() => setTimeRange(range.id as any)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    timeRange === range.id
                                        ? "bg-background text-primary shadow-lg"
                                        : "text-muted-foreground hover:bg-background/40 hover:text-foreground"
                                )}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtro de data customizada */}
                {timeRange === "custom" && (
                    <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-border/30">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="start-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Data Início
                            </Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="rounded-xl border-border/50"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="end-date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Data Fim
                            </Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="rounded-xl border-border/50"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {latestReadings.map(({ device, entry, stats }) => {
                    const Icon = typeIcons[device.type];
                    const colors = typeColors[device.type];

                    return (
                        <Card key={entry.id} className="card-premium overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", colors.bg)}>
                                        <Icon className={cn("h-5 w-5", colors.text)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-muted-foreground truncate">{device.contract.name}</p>
                                        <h3 className="text-sm font-black truncate">{device.name}</h3>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-2xl font-black tracking-tighter">{entry.value}</span>
                                            <span className="text-xs font-bold text-muted-foreground">{device.unit}</span>
                                        </div>
                                        {stats && stats.consumption !== 0 && (
                                            <div className={cn(
                                                "flex items-center gap-1 mt-1 text-xs font-black",
                                                stats.isIncrease ? "text-amber-600" : "text-emerald-600"
                                            )}>
                                                {stats.isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                {stats.isIncrease ? "+" : ""}{stats.consumption.toFixed(2)} {device.unit}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(entry.createdAt)} • {entry.user.name}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black tracking-tight uppercase">Histórico de Consumo</h2>
                </div>

                <div className="grid gap-6">
                    {devices
                        .filter(d => d.entries.length >= 2)
                        .map((device) => {
                            const Icon = typeIcons[device.type];
                            const colors = typeColors[device.type];
                            const chartData = getChartData(device);
                            const stats = getDeviceStats(device);

                            return (
                                <Card key={device.id} className="card-premium overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", colors.bg)}>
                                                    <Icon className={cn("h-6 w-6", colors.text)} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-black tracking-tight">{device.name}</CardTitle>
                                                    <p className="text-xs font-bold text-muted-foreground">
                                                        {device.contract.name} • {device.type === "WATER" ? "Água" : device.type === "ENERGY" ? "Energia" : "Gás"}
                                                    </p>
                                                </div>
                                            </div>
                                            {stats && (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Último Consumo</p>
                                                    <div className={cn(
                                                        "text-2xl font-black tracking-tighter flex items-center gap-1 justify-end",
                                                        stats.isIncrease ? "text-amber-600" : "text-emerald-600"
                                                    )}>
                                                        {stats.isIncrease ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                                        {stats.isIncrease ? "+" : ""}{stats.consumption.toFixed(2)}
                                                        <span className="text-sm font-bold text-muted-foreground ml-1">{device.unit}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {stats.percentChange > 0 ? "+" : ""}{stats.percentChange.toFixed(1)}% vs anterior
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                                                    <XAxis
                                                        dataKey="date"
                                                        stroke="hsl(var(--muted-foreground))"
                                                        fontSize={10}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="hsl(var(--muted-foreground))"
                                                        fontSize={10}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        width={60}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                        }}
                                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                        formatter={(value: any) => [`${value} ${device.unit}`, 'Leitura']}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke={colors.chart}
                                                        strokeWidth={3}
                                                        dot={{ fill: colors.chart, r: 4 }}
                                                        activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 p-3 bg-muted/30 rounded-xl">
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Atual</p>
                                                    <p className="text-lg font-black">{stats?.latest.toFixed(2)} {device.unit}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Total de Leituras</p>
                                                    <p className="text-lg font-black">{device.entries.length}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Última Leitura</p>
                                                    <p className="text-lg font-black text-xs">{formatDate(device.entries[0].createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                </div>
            </div>

            {
                devices.filter(d => d.entries.length >= 2).length === 0 && (
                    <div className="py-20 text-center">
                        <Activity className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-sm font-bold text-muted-foreground">
                            Aguardando mais leituras para exibir gráficos
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            É necessário pelo menos 2 leituras por medidor
                        </p>
                    </div>
                )
            }
        </div >
    );
}
