// 'use client'
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Podcast } from "lucide-react";
// import * as z from 'zod';
// import { useForm } from "react-hook-form";
// import { zodResolver } from '@hookform/resolvers/zod';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";


// const IpSchema = z.object({
//     minIpRange: z.string().nonempty("Min IP Range is required"),
//     maxIpRange: z.string().nonempty("Max IP Range is required"),
// });

// export default function AddIPForm() {
//     const form = useForm<z.infer<typeof IpSchema>>({
//         resolver: zodResolver(IpSchema),
//         mode: 'onChange',
//         defaultValues: {
//             minIpRange: '',
//             maxIpRange: ''
//         }
//     });

//     return (
//         <Card>
//             <CardHeader className="flex items-center gap-x-2">
//                 <Podcast width={50} height={50} />
//                 <div className="flex flex-col">
//                     <p className="text-lg font-semibold text-slate-950">Add IP Range</p>
//                     <span className="text-sm font-normal text-slate-600">Define whitelisted IP address range</span>
//                 </div>
//             </CardHeader>
//             <CardContent>
//                 <Form {...form}>
//                     <form className="space-y-4">
//                         <div className='grid grid-rows-1 sm:grid-cols-2 gap-2'>
//                             <FormField
//                                 control={form.control}
//                                 name='minIpRange'
//                                 render={({ field }) => (
//                                 <FormItem className='w-full flex flex-col'>
//                                     <FormLabel>Start IP Address</FormLabel>
//                                     <FormControl className='flex-grow'> 
//                                         <Input placeholder='192.168.0.1' {...field} />
//                                     </FormControl>
//                                     <FormMessage /> 
//                                 </FormItem>
//                                 )}
//                             />
//                             <FormField
//                                 control={form.control}
//                                 name='maxIpRange'
//                                 render={({ field }) => (
//                                 <FormItem className='w-full flex flex-col'>
//                                     <FormLabel>End IP Address</FormLabel>
//                                     <FormControl className='flex-grow'>
//                                         <Input placeholder='192.168.0.255' {...field} />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                                 )}
//                             />
//                         </div>
//                         <Button 
//                             type="submit" 
//                             className="w-full text-base" 
//                         >
//                             Add IP Range
//                         </Button>
//                     </form>
//                 </Form>
//             </CardContent>
//         </Card>
//     )
// }





'use client'; 

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Podcast } from 'lucide-react'; 
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { IpSchema, IpSchemaType } from '@/schema/ip-schema'
import { toast } from 'sonner';
import { useSessionData } from '@/context/session';


async function addIpRange(data: IpSchemaType) {

    const { companyId, minIpRange, maxIpRange } = data; 
    const response = await fetch(`/api/company/${companyId}/ip-range`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minIpRange, maxIpRange }), 
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add IP Range');
    }
    return response.json();
}

export default function AddIPForm() {
    const queryClient = useQueryClient();
    const { user } = useSessionData();
    const companyId = user?.companyId ?? ''; 
    type FormSchema = Omit<IpSchemaType, 'companyId'>;

    const form = useForm<FormSchema>({
        resolver: zodResolver(IpSchema.omit({ companyId: true })), 
        mode: 'onChange',
        defaultValues: {
            minIpRange: '',
            maxIpRange: ''
        }
    });

    const mutation = useMutation({
        mutationFn: addIpRange,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whitelistedIps', companyId] }); 
            form.reset(); 
            toast.success("IP Range Added successfully!");
        },
        onError: (error) => {
            toast.error(`Error: ${error.message}`);
        },
    });

    const onSubmit = (values: FormSchema) => {
        const payload: IpSchemaType = {
            ...values,
            companyId: companyId, 
        };
        mutation.mutate(payload);
    };

    return (
        <Card>
            <CardHeader className="flex items-center gap-x-2">
                <Podcast width={30} height={30} />
                <div className="flex flex-col">
                    <p className="text-[16px] font-semibold text-slate-950">Add IP Range</p>
                    <span className="text-sm font-normal text-slate-600">Define whitelisted IP address range</span>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className='grid grid-rows-1 sm:grid-cols-2 gap-2'>
                            
                            {/* MIN IP RANGE FIELD */}
                            <FormField
                                control={form.control}
                                name='minIpRange'
                                render={({ field }) => (
                                <FormItem className='w-full flex flex-col'>
                                    <FormLabel>Start IP Address</FormLabel>
                                    <FormControl className='flex-grow'> 
                                        <Input placeholder='192.168.0.1' {...field} />
                                    </FormControl>
                                    <FormMessage /> 
                                </FormItem>
                                )}
                            />

                            {/* MAX IP RANGE FIELD */}
                            <FormField
                                control={form.control}
                                name='maxIpRange'
                                render={({ field }) => (
                                <FormItem className='w-full flex flex-col'>
                                    <FormLabel>End IP Address</FormLabel>
                                    <FormControl className='flex-grow'>
                                        <Input placeholder='192.168.0.255' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full text-base" 
                            disabled={mutation.isPending || !form.formState.isValid}
                        >
                            {mutation.isPending ? 'Adding IP...' : 'Add IP Range'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}