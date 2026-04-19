'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Plus,
  Trash2,
  Layout,
  Image as ImageIcon,
  Link as LinkIcon,
  Hash,
  Rows3,
} from 'lucide-react';
import { ENDPOINTS } from '@/lib/api';
import type { MobileAd } from '@/lib/mobileControl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminTableFilters } from '@/components/admin/table-filters';
import { AdminTableFooter } from '@/components/admin/table-footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const placementOptions = [
  { value: 'all', label: 'All placements' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'home_carousel', label: 'Home Carousel' },
] as const;

const placementLabels: Record<'onboarding' | 'home_carousel', string> = {
  onboarding: 'Onboarding',
  home_carousel: 'Home Carousel',
};

export default function MobileOnboardingCarouselPage() {
  const [loading, setLoading] = useState(true);
  const [creatingAd, setCreatingAd] = useState(false);
  const [ads, setAds] = useState<MobileAd[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [placementFilter, setPlacementFilter] = useState<'all' | 'onboarding' | 'home_carousel'>('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [adForm, setAdForm] = useState({
    placement: 'onboarding' as 'onboarding' | 'home_carousel',
    title: '',
    description: '',
    image_url: '',
    click_url: '',
    priority: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const loadAds = async () => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.MOBILE_ADMIN.ADS);
      if (res.ok) {
        const data = await res.json();
        setAds(
          Array.isArray(data)
            ? data.map((row) => ({
                ...row,
                placement: row.placement === 'home_carousel' ? 'home_carousel' : 'onboarding',
              }))
            : []
        );
      }
    } catch {
      toast.error('Failed to load onboarding and carousel items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAds();
  }, []);

  const filteredAds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sortedAds = [...ads].sort((a, b) => b.priority - a.priority);

    return sortedAds.filter((ad) => {
      if (placementFilter !== 'all' && ad.placement !== placementFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [ad.title, ad.description, ad.status, ad.click_url, ad.placement]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [ads, searchQuery, placementFilter]);

  const totalRows = filteredAds.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pagedAds = filteredAds.slice(startIndex, endIndex);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, placementFilter, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const createAd = async () => {
    if (!adForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setCreatingAd(true);
    try {
      const res = await fetch(ENDPOINTS.MOBILE_ADMIN.ADS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adForm),
      });

      if (res.ok) {
        setAdForm({
          placement: 'onboarding',
          title: '',
          description: '',
          image_url: '',
          click_url: '',
          priority: 0,
          status: 'active',
        });
        await loadAds();
        toast.success('Content item created successfully');
      } else {
        toast.error('Failed to create content item');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setCreatingAd(false);
    }
  };

  const toggleAdStatus = async (ad: MobileAd) => {
    try {
      const res = await fetch(ENDPOINTS.MOBILE_ADMIN.AD_DETAIL(ad.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: ad.status === 'active' ? 'inactive' : 'active',
        }),
      });
      if (res.ok) {
        await loadAds();
        toast.success(`Content item ${ad.status === 'active' ? 'disabled' : 'enabled'}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const deleteAd = async (adId: number) => {
    if (!window.confirm('Delete this content item permanently?')) {
      return;
    }

    try {
      const res = await fetch(ENDPOINTS.MOBILE_ADMIN.AD_DETAIL(adId), {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadAds();
        toast.success('Content item deleted');
      } else {
        toast.error('Failed to delete content item');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding &amp; Carousel</h1>
          <p className="text-muted-foreground">
            Manage onboarding slides and home carousel content shown in the mobile app.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadAds}
          disabled={loading}
          aria-label="Refresh onboarding and carousel content"
          title="Refresh onboarding and carousel content"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Add Content Item</CardTitle>
            <CardDescription>Create an onboarding slide or a home carousel banner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground">
                <Rows3 size={12} /> Placement
              </label>
              <Select
                value={adForm.placement}
                onValueChange={(value: 'onboarding' | 'home_carousel') =>
                  setAdForm((previous) => ({ ...previous, placement: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="home_carousel">Home Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground">
                <Layout size={12} /> Title
              </label>
              <Input
                placeholder="Send Money Globally"
                value={adForm.title}
                onChange={(event) =>
                  setAdForm((previous) => ({ ...previous, title: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
              <Textarea
                placeholder="Short supporting copy for the mobile app."
                className="min-h-[80px]"
                value={adForm.description}
                onChange={(event) =>
                  setAdForm((previous) => ({ ...previous, description: event.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground">
                  <ImageIcon size={12} /> Image URL
                </label>
                <Input
                  placeholder="https://..."
                  value={adForm.image_url}
                  onChange={(event) =>
                    setAdForm((previous) => ({ ...previous, image_url: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground">
                  <LinkIcon size={12} /> Click URL
                </label>
                <Input
                  placeholder="https://..."
                  value={adForm.click_url}
                  onChange={(event) =>
                    setAdForm((previous) => ({ ...previous, click_url: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground">
                  <Hash size={12} /> Priority
                </label>
                <Input
                  type="number"
                  value={adForm.priority}
                  onChange={(event) =>
                    setAdForm((previous) => ({
                      ...previous,
                      priority: Number.parseInt(event.target.value || '0', 10) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                <Select
                  value={adForm.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setAdForm((previous) => ({ ...previous, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" disabled={creatingAd} onClick={createAd}>
              <Plus className="mr-2 h-4 w-4" /> Save Item
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Content Inventory</CardTitle>
            <CardDescription>
              Backend-managed items used by the onboarding screen and homepage carousel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminTableFilters
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search title, description, URL, or status..."
              title="Search"
              description="Filter onboarding and home carousel content by title, description, placement, status, or destination URL."
            >
              <Select
                value={placementFilter}
                onValueChange={(value: 'all' | 'onboarding' | 'home_carousel') =>
                  setPlacementFilter(value)
                }
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="All placements" />
                </SelectTrigger>
                <SelectContent>
                  {placementOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AdminTableFilters>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : pagedAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No content items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold">{ad.title}</span>
                          <span className="line-clamp-1 text-[10px] text-muted-foreground">
                            {ad.description || 'No description'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {placementLabels[ad.placement] ?? ad.placement}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {ad.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ad.status === 'active' ? 'default' : 'secondary'}
                          className="text-[9px] uppercase"
                        >
                          {ad.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px]"
                            onClick={() => toggleAdStatus(ad)}
                          >
                            {ad.status === 'active' ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => deleteAd(ad.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <AdminTableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalRows={totalRows}
              rowsPerPage={rowsPerPage}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
