'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { 
    Eye, 
    Mail, 
    MessageCircle, 
    Phone, 
    RefreshCw, 
    Search, 
    Send, 
    Trash2, 
    User, 
    Save, 
    MessagesSquare,
    Clock,
    AlertCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    FilterX
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Types
type SupportTicket = {
    id: number;
    ticket_number?: string | null;
    email?: string | null;
    phone?: string | null;
    subject?: string | null;
    message_type?: string | null;
    status?: string | null;
    priority?: string | null;
    last_message_at?: string | null;
    updated_at?: string | null;
};

type SupportMessage = {
    id: number;
    sender_type: 'user' | 'admin';
    message: string;
    created_at?: string | null;
};

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [reply, setReply] = useState('');
    const [detailLoading, setDetailLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const url = statusFilter === 'all' ? ENDPOINTS.SUPPORT.LIST : `${ENDPOINTS.SUPPORT.LIST}?status=${statusFilter}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTickets(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchTickets();
    }, [statusFilter]);

    const openTicket = async (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setDetailLoading(true);
        setMessages([]);
        try {
            const res = await fetch(ENDPOINTS.SUPPORT.DETAIL(ticket.id));
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data.messages) ? data.messages : []);
                if (data.ticket) setSelectedTicket(data.ticket);
            }
        } catch (e) {
            toast.error("Failed to load conversation");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSend = async () => {
        if (!selectedTicket || !reply.trim()) return;
        setSending(true);
        try {
            const formData = new FormData();
            formData.append('message', reply.trim());
            const res = await fetch(ENDPOINTS.SUPPORT.REPLY(selectedTicket.id), {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                setReply('');
                await openTicket(selectedTicket);
                toast.success("Reply sent");
            }
        } catch (e) {
            toast.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    const filtered = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return tickets.filter(t => 
            !query || 
            String(t.ticket_number || t.id).toLowerCase().includes(query) ||
            t.subject?.toLowerCase().includes(query) ||
            t.email?.toLowerCase().includes(query)
        );
    }, [tickets, searchQuery]);

    const paged = filtered.slice((page-1)*pageSize, page*pageSize);

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
                    <p className="text-muted-foreground">Manage mobile support requests and customer conversations.</p>
                </div>
                <Button onClick={fetchTickets} variant="outline" size="sm">
                    <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets by subject, email or ID..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    />
                </div>
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="waiting_for_user">Waiting</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Num</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Last Message</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading tickets...</TableCell></TableRow>
                        ) : paged.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-24 text-center">No tickets found.</TableCell></TableRow>
                        ) : (
                            paged.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell className="font-mono text-xs">{t.ticket_number || `#${t.id}`}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            <span className="font-semibold">{t.email || 'Guest'}</span>
                                            <span className="text-muted-foreground">{t.phone || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{t.subject || t.message_type || 'Support Request'}</TableCell>
                                    <TableCell>
                                        <Badge variant={t.status === 'open' ? 'default' : t.status === 'closed' ? 'secondary' : 'outline'} className="uppercase text-[10px]">
                                            {t.status?.replace(/_/g, ' ') || 'open'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={t.priority === 'high' ? 'destructive' : 'secondary'} className="uppercase text-[10px]">
                                            {t.priority || 'normal'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {t.last_message_at ? new Date(t.last_message_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => openTicket(t)}>
                                            <Eye size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <MessagesSquare className="text-primary" />
                            Ticket {selectedTicket?.ticket_number || `#${selectedTicket?.id}`}
                        </DialogTitle>
                        <DialogDescription>
                            Conversation with {selectedTicket?.email || 'Customer'} regarding "{selectedTicket?.subject}"
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20">
                        {detailLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">No messages in this chat.</div>
                        ) : (
                            messages.map((m) => (
                                <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-3 text-sm shadow-sm ${
                                        m.sender_type === 'admin' 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-card border'
                                    }`}>
                                        <div className="flex items-center gap-2 text-[10px] opacity-70 mb-1">
                                            {m.sender_type === 'admin' ? 'Support Team' : 'Customer'} • {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}
                                        </div>
                                        <p className="whitespace-pre-wrap">{m.message}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t bg-card space-x-2">
                        <Textarea 
                            placeholder="Type your response..." 
                            className="min-h-[80px] resize-none"
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                        />
                        <div className="flex flex-col gap-2 justify-end pb-1">
                            <Button size="sm" disabled={!reply.trim() || sending} onClick={handleSend}>
                                {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
