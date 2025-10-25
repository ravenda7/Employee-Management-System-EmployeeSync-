// hooks/use-register.ts
import { useMutation } from '@tanstack/react-query';
import * as z from 'zod';

// Define the input type based on your Zod schema
const registerSchema = z.object({
    companyEmail: z.email().nonempty(),
    companyName: z.string().nonempty(),
    name: z.string().nonempty(),
    email: z.email().nonempty(),
    password: z.string().min(1),
});
type RegisterPayload = z.infer<typeof registerSchema>;

// Define the API response structure
interface RegisterResponse {
    message: string;
    companyId: string;
    userId: string;
}

const registerUser = async (data: RegisterPayload): Promise<RegisterResponse> => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
        // Throw an error with the message from the API
        throw new Error(responseData.message || 'Registration failed');
    }

    return responseData;
};

export const useRegister = () => {
    return useMutation<RegisterResponse, Error, RegisterPayload>({
        mutationFn: registerUser,
    });
};