export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center p-4">
            {children}
        </div>
    );
}
