function shortenName(name: string): string {
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0);
    return nameParts
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase();
    };
    
    export default shortenName;