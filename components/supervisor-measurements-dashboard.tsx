"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    Droplets, Zap, Flame, TrendingUp, TrendingDown, Activity,
    ArrowUpRight, ArrowDownRight, Minus, Clock, BarChart2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
    subDays, subMonths, startOfMonth, endOfMonth, format,
    isWithinInterval, startOfYear, parse, isValid,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MeasurementType = "WATER" | "ENERGY" | "GAS";

type Entry = {
    id: string;
    value: number;
    date: string | Date;
    user: { name: string };
    createdAt: string | Date;
    notes?: string;
};

type Device = {
    id: string;
    name: string;
    type: MeasurementType;
    unit: string;
    serialNumber?: string;
    entries: Entry[];
    contract: { id: string; name: string; company: any };
};

interface SupervisorMeasurementsDashboardProps {
    devices: Device[];
}

const TYPE_CONFIG: Record<MeasurementType, {
    label: string; icon: any; unit: string; color: string;
    bg: string; text: string; border: string; costPerUnit?: number;
}> = {
    WATER:  { label: "Água",    icon: Droplets, unit: "m³",  color: "#3b82f6", bg: "bg-blue-500/10",   text: "text-blue-600",   border: "border-blue-500/30",   costPerUnit: 8.5  },
    ENERGY: { label: "Energia", icon: Zap,      unit: "kWh", color: "#f59e0b", bg: "bg-amber-500/10",  text: "text-amber-600",  border: "border-amber-500/30",  costPerUnit: 0.85 },
    GAS:    { label: "Gás",     icon: Flame,    unit: "m³",  color: "#f97316", bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-500/30", costPerUnit: 4.2  },
};

function getMonthlyConsumption(entries: Entry[], monthsBack = 0): number | null {
    const now  = new Date();
    const tgt  = subMonths(now, monthsBack);
    const start = startOfMonth(tgt);
    const end   = endOfMonth(tgt);
    const inMonth = entries
        .filter(e => { const d = new Date(e.createdAt); return isWithinInterval(d, { start, end }); })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (inMonth.length < 2) return null;
    return inMonth[inMonth.length - 1].value - inMonth[0].value;
}

function buildMonthlyBars(devices: Device[], months = 6) {
    const now = new Date();
    return Array.from({ length: months }, (_, i) => {
        const tgt   = subMonths(now, months - 1 - i);
        const label = format(tgt, "MMM/yy", { locale: ptBR });
        const row: Record<string, any> = { month: label };
        for (const d of devices) {
            row[d.type + "_" + d.id.slice(-4)] = getMonthlyConsumption(d.entries, months - 1 - i) ?? 0;
        }
        return row;
    });
}

function filterEntries(entries: Entry[], range: string, s: string, e: string) {
    const now  = new Date();
    let from: Date | null = null, to: Date | null = null;
    if      (range === "7d")    from = subDays(now, 7);
    else if (range === "30d")   from = subDays(now, 30);
    else if (range === "month") from = startOfMonth(now);
    else if (range === "3m")    from = subMonths(now, 3);
    else if (range === "year")  from = startOfYear(now);
    else if (range === "custom") {
        if (s) { const p = parse(s, "yyyy-MM-dd", new Date()); if (isValid(p)) from = p; }
        if (e) { const p = parse(e, "yyyy-MM-dd", new Date()); if (isValid(p)) { to = p; to.setHours(23,59,59,999); } }
    }
    return entries.filter(entry => {
        const d = new Date(entry.createdAt);
        if (from && d < from) return false;
        if (to   && d > to)   return false;
        return true;
    });
}

const AreaTip = ({ active, payload, label, unit }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border/60 rounded-2xl shadow-xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-black">{payload[0].value} <span className="text-xs text-muted-foreground">{unit}</span></p>
            {payload[0].payload.user && <p className="text-[10px] text-muted-foreground mt-0.5">{payload[0].payload.user}</p>}
        </div>
    );
};

const BarTip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border/60 rounded-2xl shadow-xl px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                    <span className="text-xs font-bold text-muted-foreground">{p.name}:</span>
                    <span className="text-sm font-black">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

export function SupervisorMeasurementsDashboard({ devices }: SupervisorMeasurementsDashboardProps) {
    const [range, setRange]       = useState("30d");
    const [startDate, setStart]   = useState("");
    const [endDate, setEnd]       = useState("");
    const [activeId, setActiveId] = useState<string | null>(null);

    const kpis = useMemo(() => devices.map(device => {
        const cfg        = TYPE_CONFIG[device.type];
        const thisMonth  = getMonthlyConsumption(device.entries, 0);
        const lastMonth  = getMonthlyConsumption(device.entries, 1);
        const latest     = device.entries[0]?.value ?? null;
        const delta      = (thisMonth != null && lastMonth != null && lastMonth > 0)
            ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
        const cost       = thisMonth != null && cfg.costPerUnit
            ? thisMonth * cfg.costPerUnit : null;
        return { device, cfg, thisMonth, lastMonth, latest, delta, cost };
    }), [devices]);

    const monthlyBars = useMemo(() => buildMonthlyBars(devices, 6), [devices]);

    const activity = useMemo(() =>
        devices
            .flatMap(d => d.entries.map(e => ({ ...e, device: d })))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 15),
        [devices]
    );

    if (devices.length === 0) {
        return (
            <div className="py-24 text-center">
                <Activity className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Nenhum medidor cadastrado</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Adicione medidores de água, energia e gás na aba de medições</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in">

            {/* Header + filtros */}
            <div className="bg-card/60 backdrop-blur-xl p-6 rounded-[2rem] border border-border/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <BarChart2 className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Controle de Consumo</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">
                                {devices.length} medidor{devices.length !== 1 ? "es" : ""} · dados em tempo real
                            </p>
                        </div>
                    </div>
                    <div className="flex bg-muted/50 p-1.5 rounded-2xl border border-border/20 flex-wrap gap-1">
                        {[
                            { id: "7d",    label: "7d"      },
                            { id: "30d",   label: "30d"     },
                            { id: "month", label: "Mês"     },
                            { id: "3m",    label: "3 meses" },
                            { id: "year",  label: "Ano"     },
                            { id: "custom",label: "Custom"  },
                        ].map(r => (
                            <button key={r.id} onClick={() => setRange(r.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    range === r.id
                                        ? "bg-background text-primary shadow-lg"
                                        : "text-muted-foreground hover:bg-background/40"
                                )}
                            >{r.label}</button>
                        ))}
                    </div>
                </div>
                {range === "custom" && (
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/30">
                        <div className="flex-1 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">De</Label>
                            <Input type="date" value={startDate} onChange={e => setStart(e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Até</Label>
                            <Input type="date" value={endDate} onChange={e => setEnd(e.target.value)} className="rounded-xl" />
                        </div>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map(({ device, cfg, thisMonth, lastMonth, latest, delta, cost }) => {
                    const Icon = cfg.icon;
                    const isUp      = delta != null && delta > 5;
                    const isDown    = delta != null && delta < -5;
                    const isSteady  = !isUp && !isDown;
                    return (
                        <Card
                            key={device.id}
                            onClick={() => setActiveId(activeId === device.id ? null : device.id)}
                            className={cn(
                                "rounded-[1.5rem] overflow-hidden cursor-pointer transition-all border-2 hover:shadow-lg",
                                activeId === device.id ? `${cfg.border} shadow-lg scale-[1.02]` : "border-transparent"
                            )}
                        >
                            <CardContent className="p-0">
                                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}40)` }} />
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", cfg.bg)}>
                                            <Icon className={cn("h-6 w-6", cfg.text)} />
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black",
                                            isUp     ? "bg-red-500/10 text-red-600"         :
                                            isDown   ? "bg-emerald-500/10 text-emerald-600" :
                                                       "bg-muted text-muted-foreground"
                                        )}>
                                            {isUp   && <ArrowUpRight  className="h-3 w-3" />}
                                            {isDown && <ArrowDownRight className="h-3 w-3" />}
                                            {isSteady && <Minus className="h-3 w-3" />}
                                            {delta != null ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}%` : "—"}
                                            <span className="opacity-50 ml-0.5">vs ant.</span>
                                        </div>
                                    </div>

                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                                        {cfg.label} · {device.name}
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black tracking-tighter">
                                            {thisMonth != null ? thisMonth.toFixed(1) : "—"}
                                        </span>
                                        <span className="text-sm font-bold text-muted-foreground">{cfg.unit}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-bold uppercase tracking-widest">consumo este mês</p>

                                    <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Leitura atual</p>
                                            <p className="text-sm font-black mt-0.5">
                                                {latest != null ? latest.toFixed(1) : "—"} <span className="text-xs text-muted-foreground">{cfg.unit}</span>
                                            </p>
                                        </div>
                                        {cost != null && (
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Custo estim.</p>
                                                <p className="text-sm font-black text-primary mt-0.5">R$ {cost.toFixed(2)}</p>
                                            </div>
                                        )}
                                        {lastMonth != null && (
                                            <div className="col-span-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Mês anterior</p>
                                                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                                                    {lastMonth.toFixed(1)} {cfg.unit}
                                                    {isUp   && <span className="text-red-500   ml-1 font-black">↑ alta</span>}
                                                    {isDown && <span className="text-emerald-500 ml-1 font-black">↓ economia</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Area charts por medidor */}
            {devices
                .filter(d => activeId === null || activeId === d.id)
                .map(device => {
                    const cfg      = TYPE_CONFIG[device.type];
                    const Icon     = cfg.icon;
                    const filtered = filterEntries(device.entries, range, startDate, endDate);
                    const data     = [...filtered]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map(e => ({
                            date:  format(new Date(e.createdAt), "dd/MM", { locale: ptBR }),
                            value: e.value,
                            user:  e.user.name,
                        }));
                    const consumption = data.length >= 2
                        ? data[data.length - 1].value - data[0].value : null;

                    return (
                        <Card key={device.id} className="rounded-[1.5rem] overflow-hidden border border-border/40">
                            <CardHeader className="pb-3 border-b border-border/30">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", cfg.bg)}>
                                            <Icon className={cn("h-6 w-6", cfg.text)} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black tracking-tight">{device.name}</CardTitle>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                Série: {device.serialNumber ?? "—"} · {device.entries.length} leituras totais
                                            </p>
                                        </div>
                                    </div>
                                    {consumption != null && (
                                        <div className={cn(
                                            "px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-2",
                                            consumption > 0 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                                        )}>
                                            {consumption > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                            {consumption > 0 ? "+" : ""}{consumption.toFixed(2)} {cfg.unit} no período
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {data.length >= 1 ? (
                                    <>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                                    <defs>
                                                        <linearGradient id={`g-${device.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor={cfg.color} stopOpacity={0.01} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                                                    <XAxis dataKey="date" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                                    <YAxis fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} width={55} tickFormatter={v => v.toFixed(0)} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                                    <Tooltip content={<AreaTip unit={cfg.unit} />} />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke={cfg.color}
                                                        strokeWidth={2.5}
                                                        fill={`url(#g-${device.id})`}
                                                        dot={{ fill: cfg.color, r: 3, strokeWidth: 0 }}
                                                        activeDot={{ r: 6, fill: cfg.color, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { label: "Mínimo",  value: `${Math.min(...data.map(d => d.value)).toFixed(1)} ${cfg.unit}` },
                                                { label: "Máximo",  value: `${Math.max(...data.map(d => d.value)).toFixed(1)} ${cfg.unit}` },
                                                { label: "Média",   value: `${(data.reduce((s, d) => s + d.value, 0) / data.length).toFixed(1)} ${cfg.unit}` },
                                                { label: "Leituras",value: `${data.length}` },
                                            ].map(s => (
                                                <div key={s.label} className="bg-muted/30 rounded-xl p-3 text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{s.label}</p>
                                                    <p className="text-sm font-black mt-0.5">{s.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center gap-3">
                                        <div className={cn("h-14 w-14 rounded-full flex items-center justify-center opacity-20", cfg.bg)}>
                                            <Icon className={cn("h-7 w-7", cfg.text)} />
                                        </div>
                                        <p className="text-sm font-black text-muted-foreground">Sem leituras no período selecionado</p>
                                        <p className="text-xs text-muted-foreground/50">O técnico registra pelo app móvel</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

            {/* Comparativo mensal 6 meses */}
            <Card className="rounded-[1.5rem] overflow-hidden border border-border/40">
                <CardHeader className="border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BarChart2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black tracking-tight">Comparativo Mensal</CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Consumo dos últimos 6 meses por medidor</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {monthlyBars.some(row => devices.some(d => (row[d.type + "_" + d.id.slice(-4)] as number) > 0)) ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyBars} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                                    <XAxis dataKey="month" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                    <YAxis fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} width={45} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                    <Tooltip content={<BarTip />} />
                                    <Legend
                                        formatter={(value) => {
                                            const type = value.split("_")[0] as MeasurementType;
                                            return TYPE_CONFIG[type]?.label ?? value;
                                        }}
                                        iconType="circle" iconSize={8}
                                        wrapperStyle={{ fontSize: 10, fontWeight: "bold", paddingTop: 16 }}
                                    />
                                    {devices.map(d => (
                                        <Bar
                                            key={d.id}
                                            dataKey={d.type + "_" + d.id.slice(-4)}
                                            name={d.type + "_" + d.id.slice(-4)}
                                            fill={TYPE_CONFIG[d.type].color}
                                            radius={[6, 6, 0, 0]}
                                            maxBarSize={40}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground font-bold">Sem dados mensais ainda · registre leituras para visualizar</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Feed de últimas leituras */}
            {activity.length > 0 && (
                <Card className="rounded-[1.5rem] overflow-hidden border border-border/40">
                    <CardHeader className="border-b border-border/30">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight">Últimas Leituras</CardTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Histórico de registros recentes</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/30">
                            {activity.map((entry, i) => {
                                const cfg  = TYPE_CONFIG[entry.device.type];
                                const Icon = cfg.icon;
                                return (
                                    <div key={entry.id} className={cn(
                                        "flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors",
                                        i === 0 && "bg-primary/[0.02]"
                                    )}>
                                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
                                            <Icon className={cn("h-4 w-4", cfg.text)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-black truncate">{entry.device.name}</span>
                                                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest", cfg.bg, cfg.text)}>
                                                    {cfg.label}
                                                </span>
                                                {i === 0 && (
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest">
                                                        Mais recente
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                                                {entry.user.name} · {formatDate(entry.createdAt)}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xl font-black tracking-tighter">{entry.value}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold">{cfg.unit}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {activity.length === 0 && (
                <div className="py-16 text-center rounded-[1.5rem] border-2 border-dashed border-border/40">
                    <Activity className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Aguardando primeiras leituras</p>
                    <p className="text-xs text-muted-foreground/50 mt-2 max-w-xs mx-auto">
                        O técnico registra as leituras pelo app móvel na aba "Leituras de Medidores"
                    </p>
                </div>
            )}
        </div>
    );
}
