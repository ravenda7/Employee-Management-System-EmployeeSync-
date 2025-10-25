// 'use client'
// import * as z from 'zod';
// import { useForm } from "react-hook-form";
// import { zodResolver } from '@hookform/resolvers/zod';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
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
// import Link from "next/link";
// import { signIn } from 'next-auth/react';
// import { toast } from 'sonner';
// import { useRouter } from 'next/navigation';
// import { Eye, EyeOff } from 'lucide-react';
// import { useState } from 'react';


// const registerSchema = z.object({
//     companyEmail: z.email().nonempty("Company Email is required"),
//     companyName: z.string().nonempty("Company Name is required"),
//     name: z.string().nonempty("Name is required"),
//     email: z.email().nonempty("Email is required"),
//     password: z
//     .string()
//     .min(1, 'Password is required')
// });


// export default function RegisterForm () {
//     const router = useRouter();
//     const [isShow, setIsShow] = useState(false);
//     const form = useForm<z.infer<typeof registerSchema>>({
//         resolver: zodResolver(registerSchema),
//         mode: 'onChange',
//         defaultValues: {
//             email: '',
//             password: ''
//         }
//     });

//     const onSubmit = async(values: z.infer<typeof registerSchema>) => {
//         try {
//             const signInData = await signIn('credentials', {
//                 email: values.email,
//                 password: values.password,
//                 redirect: false,
//             });

//             if(signInData?.error) {
//                 toast.error("Invalid email or password");
//                 return;
//             }
//             router.push('/');
//         } catch (error) {
//             toast.error('Something went wrong, please try again');
//         }
//     }

//     return(
//     <div className="flex min-h-screen items-center justify-center p-4">
//         <Card className="w-full max-w-lg bg-transparent border-none">
//             <CardHeader className="space-y-3 text-center">
//             <CardTitle className="text-3xl font-bold text-white">
//                 Welcome Back
//             </CardTitle>
//             <CardDescription className="text-base text-slate-400">
//                 Sign in to your account to continue
//             </CardDescription>
//             </CardHeader>
//             <CardContent>
//             <Form {...form}>
//                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
//                     <div className='space-y-2 text-white'>
//                         <div className='grid grid-cols-2 gap-2'>
//                             <FormField
//                                 control={form.control}
//                                 name='companyName'
//                                 render={({ field }) => (
//                                 <FormItem className='w-full flex flex-col'>
//                                     <FormLabel>Company Name</FormLabel>
//                                     <FormControl> 
//                                         <Input placeholder='acme Corporation' {...field} />
//                                     </FormControl>
//                                     <FormMessage /> 
//                                 </FormItem>
//                                 )}
//                             />
//                             <FormField
//                                 control={form.control}
//                                 name='companyEmail'
//                                 render={({ field }) => (
//                                 <FormItem className='w-full flex flex-col'>
//                                     <FormLabel>Company Email</FormLabel>
//                                     <FormControl>
//                                         <Input placeholder='contact@company.com' {...field} />
//                                     </FormControl>
//                                     <FormMessage />
//                                 </FormItem>
//                                 )}
//                             />
//                         </div>
//                         <FormField
//                             control={form.control}
//                             name='name'
//                             render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Name</FormLabel>
//                                 <FormControl>
//                                 <Input placeholder='Ravend Da' {...field} />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                             )}
//                         />
//                         <FormField
//                             control={form.control}
//                             name='email'
//                             render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Email</FormLabel>
//                                 <FormControl>
//                                 <Input placeholder='mail@example.com' {...field} />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                             )}
//                         />
//                         <FormField
//                             control={form.control}
//                             name='password'
//                             render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Password</FormLabel>
//                                 <FormControl>
//                                     <div className='relative'>
//                                         <Input
//                                             type={isShow ? 'text':'password'}
//                                             placeholder='Enter your password'
//                                             {...field}
//                                         />
//                                         <button 
//                                         type='button'
//                                         onClick={() => setIsShow(!isShow)}
//                                         aria-label={isShow ? "Hide password" : "Show password"}
//                                         className='absolute top-1 right-3 cursor-pointer'>
//                                            {isShow ? <Eye width={20} /> : <EyeOff width={20} />}
//                                         </button>
//                                     </div>
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                             )}
//                         />
//                     </div>
//                     <Button 
//                         type="submit" 
//                         className="w-full h-11 text-base" 
//                         variant="auth"
//                     >
//                         Create Account
//                     </Button>
//                 </form>
//             </Form>    
//             <div className="mt-6 text-center">
//                 <p className="text-sm text-muted-foreground">
//                 Already have an account?{" "}
//                 <Link
//                     href="/register"
//                     className="text-purple-700 hover:text-white hover:underline transition-colors font-medium"
//                 >
//                     Sign in
//                 </Link>
//                 </p>
//             </div>
//             </CardContent>
//         </Card>
//     </div>
//     )
// }

















// components/register-form.tsx (The client component)
'use client'
import * as z from 'zod';
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useRegister } from '@/hooks/use-register';


const registerSchema = z.object({
    companyEmail: z.email().nonempty("Company Email is required"),
    companyName: z.string().nonempty("Company Name is required"),
    name: z.string().nonempty("Name is required"),
    email: z.email().nonempty("Email is required"),
    password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .nonempty('Password is required')
});

type RegisterFormValues = z.infer<typeof registerSchema>;


export default function RegisterForm () {
    const router = useRouter();
    const [isShow, setIsShow] = useState(false);
    
    // 1. Initialize the mutation hook
    const { mutate, isPending } = useRegister();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            companyName: '',
            companyEmail: '',
            name: '',
            email: '',
            password: ''
        }
    });

    // 2. Corrected onSubmit function using mutate
    const onSubmit = (values: RegisterFormValues) => {
        // Trigger the registration mutation
        mutate(values, {
            onSuccess: async (data: any) => {
                toast.success('Account created successfully! Attempting sign in...');
                
                // Immediately sign in the new user after successful registration
                const signInData = await signIn('credentials', {
                    email: values.email,
                    password: values.password,
                    redirect: false,
                });
    
                if(signInData?.error) {
                    toast.error("Sign-in failed after registration. Please log in manually.");
                    router.push('/login');
                    return;
                }

                toast.success("Signed in successfully!");
                router.push('/');
            },
            onError: (error: any) => {
                toast.error(error.message || 'Registration failed. Please try again.');
            },
        });
    }

    return(
    <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-transparent border-none">
            <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl font-bold text-white">
                Register Your Company
            </CardTitle>
            <CardDescription className="text-base text-slate-400">
                Create a new company and set up your admin account.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className='space-y-4 text-white'>
                        {/* Company Name and Email (using flexbox for alignment fix) */}
                        <div className='grid grid-cols-2 gap-2'>
                            <FormField
                                control={form.control}
                                name='companyName'
                                render={({ field }) => (
                                <FormItem className='w-full flex flex-col'>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl className='flex-grow'> 
                                        <Input placeholder='Acme Corporation' {...field} />
                                    </FormControl>
                                    <FormMessage /> 
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='companyEmail'
                                render={({ field }) => (
                                <FormItem className='w-full flex flex-col'>
                                    <FormLabel>Company Admin Email</FormLabel>
                                    <FormControl className='flex-grow'>
                                        <Input placeholder='contact@acme.com' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        {/* Name Field (using flexbox for alignment fix) */}
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                            <FormItem className='w-full flex flex-col'>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl className='flex-grow'>
                                <Input placeholder='John Doe' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {/* Email Field (using flexbox for alignment fix) */}
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                            <FormItem className='w-full flex flex-col'>
                                <FormLabel>Your Personal Email</FormLabel>
                                <FormControl className='flex-grow'>
                                <Input placeholder='john.doe@personal.com' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {/* Password Field (using flexbox for alignment fix) */}
                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                            <FormItem className='w-full flex flex-col'>
                                <FormLabel>Password</FormLabel>
                                <FormControl className='flex-grow'>
                                    <div className='relative'>
                                        <Input
                                            type={isShow ? 'text':'password'}
                                            placeholder='Enter your password'
                                            {...field}
                                        />
                                        <button 
                                        type='button'
                                        onClick={() => setIsShow(!isShow)}
                                        aria-label={isShow ? "Hide password" : "Show password"}
                                        className='absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer text-gray-500 hover:text-white'>
                                            {isShow ? <Eye width={20} /> : <EyeOff width={20} />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <Button 
                        type="submit" 
                        className="w-full h-11 text-base" 
                        variant="auth"
                        disabled={isPending}
                    >
                        {isPending ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>
            </Form> 	
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="text-purple-700 hover:text-white hover:underline transition-colors font-medium"
                >
                    Sign in
                </Link>
                </p>
            </div>
            </CardContent>
        </Card>
    </div>
    )
}