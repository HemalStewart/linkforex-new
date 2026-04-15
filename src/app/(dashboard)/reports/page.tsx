'use client';

import React, { useState, useEffect } from 'react';
import { 
    BarChart3, 
    FileCheck, 
    Map, 
    Users, 
    FileText, 
    Download, 
    Calendar, 
    Mail, 
    Clock, 
    Plus, 
    RefreshCw, 
    TrendingUp, 
    Activity,
    DollarSign, 
    ChevronDown,
    Save
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [selectedReport, setSelectedReport] = useState('financial');
    const [dateRange, setDateRange] = useState('month');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(ENDPOINTS.REPORTS.SUMMARY);
                if (res.ok) setSummary(await res.json());
            } catch (e) {
                toast.error("Failed to load report data");
            } finally {
                setLoading(false);
            }
        };
        void fetchData();
    }, [dateRange]);

    const reportTypes = [
        { id: 'financial', name: 'Financial Summary', icon: TrendingUp, detail: 'Profit & Loss' },
        { id: 'transfers', name: 'Transfer Analytics', icon: BarChart3, detail: 'Volume Trends' },
        { id: 'kyc', name: 'Compliance & KYC', icon: FileCheck, detail: 'Audit Status' },
        { id: 'branches', name: 'Branch Performance', icon: Map, detail: 'Regional Data' },
    ];

    if (loading) return <div className="p-12 text-center animate-pulse">Loading analytics engine...</div>;

    const volume = summary?.month_to_date?.volume_gbp || 0;
    const transfers = summary?.month_to_date?.transfers || 0;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Strategic business intelligence and periodic exports.</p>
                </div>
                <Button size="sm">
                    <Plus size={14} className="mr-2" /> Generate Report
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MTD Volume</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£{volume.toLocaleString()}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Total GBP processed this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">MTD Transfers</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transfers}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Sent worldwide</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">£{(volume * 0.025).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Projected at 2.5% margin</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                        <RefreshCw className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98.2%</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Success rate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-6 lg:grid-cols-8">
                <div className="md:col-span-4 lg:col-span-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configure Report</CardTitle>
                            <CardDescription>Select parameters for data aggregation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {reportTypes.map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => setSelectedReport(t.id)}
                                        className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${selectedReport === t.id ? 'bg-primary text-primary-foreground border-transparent shadow-lg' : 'hover:bg-muted/50'}`}
                                    >
                                        <t.icon size={20} className={selectedReport === t.id ? 'text-primary-foreground' : 'text-primary'} />
                                        <span className="font-bold text-xs mt-3">{t.name}</span>
                                        <span className={`text-[10px] opacity-70 ${selectedReport === t.id ? '' : 'text-muted-foreground'}`}>{t.detail}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <Separator />

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="text-xs">Period</Label>
                                    <Select value={dateRange} onValueChange={setDateRange}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">Past 7 Days</SelectItem>
                                            <SelectItem value="month">Current Month</SelectItem>
                                            <SelectItem value="quarter">Fiscal Quarter</SelectItem>
                                            <SelectItem value="year">Full Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Format</Label>
                                    <Select defaultValue="pdf">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF Document</SelectItem>
                                            <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                                            <SelectItem value="json">Raw JSON</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Deliver To</Label>
                                    <Select defaultValue="download">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="download">Instant Download</SelectItem>
                                            <SelectItem value="email">Send to Email</SelectItem>
                                            <SelectItem value="sftp">External SFTP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t items-center justify-between">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5"><Clock size={12} /> Last run: 2 hours ago</span>
                            <Button size="sm" className="font-bold">
                                <Download size={14} className="mr-2" /> Export {selectedReport.toUpperCase()} Report
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Calendar size={14} className="text-primary" /> Historical Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors pointer-cursor">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-primary border"><FileText size={16} /></div>
                                            <div>
                                                <p className="text-xs font-bold">Financial_MTD_Dec2025.pdf</p>
                                                <p className="text-[9px] text-muted-foreground tracking-widest uppercase">Generated by Admin • 1.2 MB</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download size={14} /></Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 lg:col-span-2 space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Activity size={14} className="text-primary" /> Status Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {summary?.status_breakdown && Object.entries(summary.status_breakdown).map(([status, count]: any, i: number) => (
                                <div key={status} className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                        <span>{status.replace('_', ' ')}</span>
                                        <span className="text-primary">{count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${Math.min((count / transfers) * 100, 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                            <Separator />
                            <div className="pt-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Payout Currencies</p>
                                <div className="space-y-2">
                                    {summary?.payout_currency_breakdown?.slice(0, 5).map((curr: any) => (
                                        <div key={curr.code} className="flex items-center justify-between text-xs">
                                            <Badge variant="outline" className="h-5 text-[9px]">{curr.code}</Badge>
                                            <span className="font-bold">{curr.count} ops</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
