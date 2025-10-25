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
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';


const LoginSchema = z.object({
    email: z.email().nonempty("Email is required"),
    password: z
    .string()
    .min(1, 'Password is required')
});


export default function LoginForm () {
    const router = useRouter();
    const [isShow, setIsShow] = useState(false);
    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = async(values: z.infer<typeof LoginSchema>) => {
        try {
            const signInData = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if(signInData?.error) {
                toast.error("Invalid email or password");
                return;
            }
            router.push('/');
        } catch (error) {
            toast.error('Something went wrong, please try again');
        }
    }

    return(
    <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md bg-transparent border-none">
            <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-3xl font-bold text-white">
                Welcome Back
            </CardTitle>
            <CardDescription className="text-base text-slate-400">
                Sign in to your account to continue
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className='space-y-4 text-white'>
                        <FormField
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input placeholder='mail@example.com' {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <div className='relative'>
                                        <Input
                                            type={isShow ? 'text':'password'}
                                            placeholder='Enter your password'
                                            {...field}
                                        />
                                        <button
                                        type='button'
                                        onClick={()=>setIsShow(!isShow)}
                                        aria-label={isShow ? "Hide password" : "Show password"}
                                        className='absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer'>
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
                    >
                        Sign In
                    </Button>
                </form>
            </Form>    
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                    href="/register"
                    className="text-purple-700 hover:text-white hover:underline transition-colors font-medium"
                >
                    Create one
                </Link>
                </p>
            </div>
            </CardContent>
        </Card>
    </div>
    )
}