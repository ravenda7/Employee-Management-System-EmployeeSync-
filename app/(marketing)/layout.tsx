
export default function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen w-full m-0 p-0">
            {children}
        </div>
    );
}