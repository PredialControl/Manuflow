"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplets, Zap, Flame, Calendar, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

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

    // Preparar dados para gráficos (últimas 10 leituras, ordem crescente por data)
    const getChartData = (device: Device) => {
        const sortedEntries = [...device.entries]
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(-10);

        return sortedEntries.map((entry) => ({
            date: new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: entry.value,
            fullDate: formatDate(entry.createdAt),
        }));
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
            {/* Últimas Leituras Realizadas */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-black tracking-tight uppercase">Últimas Leituras Realizadas</h2>
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
            </div>

            {/* Gráficos por Medidor */}
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

            {devices.filter(d => d.entries.length >= 2).length === 0 && (
                <div className="py-20 text-center">
                    <Activity className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm font-bold text-muted-foreground">
                        Aguardando mais leituras para exibir gráficos
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                        É necessário pelo menos 2 leituras por medidor
                    </p>
                </div>
            )}
        </div>
    );
}
