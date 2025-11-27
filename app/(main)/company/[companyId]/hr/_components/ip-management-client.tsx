'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit, Network } from 'lucide-react'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WhitelistedIpRange } from '@/lib/generated/prisma';
import { IpSchema, IpSchemaType } from '@/schema/ip-schema'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useConfirmDialog } from '@/context/confirm-dialog';
import { useSessionData } from '@/context/session';


interface IPRangeListProps {
    initialIpRanges: WhitelistedIpRange[]; 
}

async function fetchIpRanges(companyId: string): Promise<WhitelistedIpRange[]> {
    const response = await fetch(`/api/company/${companyId}/ip-range`);
    if (!response.ok) throw new Error('Failed to fetch IP ranges');
    return response.json(); 
}

// Function to handle the DELETE mutation
async function deleteIpRange(id: string) {
    const response = await fetch(`/api/ip-ranges/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete IP range');
}

// Function to handle the PATCH (update) mutation
async function updateIpRange({ id, data }: { id: string; data: Partial<IpSchemaType> }) {
    const response = await fetch(`/api/ip-ranges/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update IP Range');
    }
    return response.json();
}

export default function IPManagementClient({ initialIpRanges }: IPRangeListProps) {
    const { user } = useSessionData(); // ✅ Get session data here
    const companyId = user?.companyId ?? ''; // ✅ Extract companyId
    const queryClient = useQueryClient();
    const confirm = useConfirmDialog();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingRange, setEditingRange] = useState<WhitelistedIpRange | null>(null);

    // --- READ (useQuery) ---
    const { data: ipRanges, isLoading } = useQuery<WhitelistedIpRange[]>({
        queryKey: ['whitelistedIps', companyId],
        queryFn: () => fetchIpRanges(companyId),
        initialData: initialIpRanges, 
        enabled: !!companyId, 
    });

    // --- MUTATIONS ---
    const deleteMutation = useMutation({
        mutationFn: deleteIpRange,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whitelistedIps', companyId] }),
        onError: (error) => console.error(`Deletion Error: ${error.message}`),
    });

    const updateMutation = useMutation({
        mutationFn: updateIpRange,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whitelistedIps', companyId] });
            setIsEditDialogOpen(false);
            setEditingRange(null);
        },
        onError: (error) => console.error(`Update Error: ${error.message}`),
    });

    // --- EDIT DIALOG LOGIC ---
    type EditFormSchema = Omit<IpSchemaType, 'companyId'>;

    const editForm = useForm<EditFormSchema>({
        resolver: zodResolver(IpSchema.omit({ companyId: true })),
        mode: 'onChange',
    });

    const handleEditClick = (range: WhitelistedIpRange) => {
        setEditingRange(range);
        editForm.reset({ 
            minIpRange: range.minIpRange, 
            maxIpRange: range.maxIpRange 
        });
        setIsEditDialogOpen(true);
    };

    const onEditSubmit = (values: EditFormSchema) => {
        if (!editingRange) return;

        updateMutation.mutate({
            id: editingRange.id,
            data: {
                minIpRange: values.minIpRange,
                maxIpRange: values.maxIpRange,
            },
        });
    };

    const handleDelete = async(id: string) => {
        const ok = await confirm({
            title: "Delete IP range",
            description: "Are you sure you want to delete this IP range? This action cannot be undone.",
            confirmText: "Delete",
            cancelText: "Cancel",
        });
        if (ok) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) return <p className="text-center p-4">Loading IP ranges...</p>;
    if (!ipRanges || ipRanges.length === 0) return (
        <p className="text-center p-4 text-slate-500">No whitelisted IP ranges defined yet.</p>
    );

    return (
        <>
            <Card className='gap-0'>
                <CardHeader className="flex items-center gap-x-2 border-b-1 border-slate-200 pb-3">
                    <Network width={30} height={30} />
                    <div className="flex flex-col">
                        <p className="text-[16px] font-semibold text-slate-950">Whitelisted IP Ranges</p>
                        <span className="text-sm font-normal text-slate-600">{ipRanges.length} range configured</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader >
                            <TableRow>
                                <TableHead className="w-[40%] pl-4">Start IP</TableHead>
                                <TableHead className="w-[40%]">End IP</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ipRanges.map((range) => (
                                <TableRow key={range.id}>
                                    <TableCell className="font-medium pl-4">{range.minIpRange}</TableCell>
                                    <TableCell>{range.maxIpRange}</TableCell>
                                    <TableCell className="text-right flex justify-end gap-2 pr-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEditClick(range)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => handleDelete(range.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* --- EDIT DIALOG --- */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit IP Range</DialogTitle>
                        <DialogDescription>
                            Editing range: {editingRange?.minIpRange} - {editingRange?.maxIpRange}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name='minIpRange'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start IP Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="192.168.0.1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name='maxIpRange'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End IP Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="192.168.0.255" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button 
                                    type="submit" 
                                    disabled={updateMutation.isPending || !editForm.formState.isValid}
                                >
                                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}