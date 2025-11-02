export const generateRandomId = (): string => {
    // Combines timestamp and random string for better uniqueness
    return (
        Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
    ).toUpperCase();
};