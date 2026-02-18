import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import MobileNav from "@/components/MobileNav";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex justify-center min-h-screen">
            <div className="flex w-full max-w-[1230px]">
                {/* Left Sidebar - hidden on mobile */}
                <div className="hidden md:flex">
                    <Sidebar />
                </div>

                {/* Center Feed */}
                <main className="flex-1 min-w-0 border-x border-gray-200 bg-white">
                    {children}
                </main>

                {/* Right Sidebar - hidden below xl */}
                <div className="hidden xl:flex">
                    <RightSidebar />
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <MobileNav />
        </div>
    );
}
