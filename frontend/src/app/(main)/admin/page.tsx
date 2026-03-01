"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    Shield, Users, MessageSquare, AlertTriangle,
    CheckCircle, XCircle, Loader2, BarChart3,
    Flag, History, ArrowRight, Trash2
} from "lucide-react";
import api from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminUI, ToastContainer, ConfirmModal, PromptModal } from "@/components/AdminUI";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function AdminDashboard() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"users" | "flagged" | "reports" | "logs">("users");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState<any>(null);
    const [data, setData] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const { toasts, showToast, removeToast } = useAdminUI();
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: () => Promise<any>; isDanger?: boolean }>({ isOpen: false, title: "", message: "", action: async () => { } });
    const [promptModal, setPromptModal] = useState<{ isOpen: boolean; title: string; message: string; action: (value: string) => Promise<any> }>({ isOpen: false, title: "", message: "", action: async () => { } });

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
            router.push("/");
        }
    }, [user, isAuthenticated, authLoading, router]);

    const fetchStats = async () => {
        try {
            const res = await api.get("/admin/stats");
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch admin stats", err);
        }
    };

    const fetchData = async (overridePage?: number) => {
        setIsLoading(true);
        const currentPage = overridePage || page;
        try {
            let endpoint = "";
            let queryParams = `page=${currentPage}&limit=10`;

            if (activeTab === "users") {
                endpoint = `/admin/users?search=${searchQuery}&${queryParams}`;
                if (statusFilter !== 'all') endpoint += `&status=${statusFilter}`;
            }
            else if (activeTab === "flagged") endpoint = `/admin/flagged-posts?${queryParams}`;
            else if (activeTab === "reports") {
                endpoint = `/admin/reports?${queryParams}`;
                if (statusFilter !== 'all') endpoint += `&status=${statusFilter}`;
            }
            else if (activeTab === "logs") endpoint = `/admin/moderation-log?${queryParams}`;

            const res = await api.get(endpoint);
            const responseData = activeTab === "logs" ? res.data.logs : (activeTab === "users" ? res.data.users : (activeTab === "flagged" ? res.data.posts : res.data.reports));

            setData(responseData);
            if (res.data.pagination) {
                setTotalPages(res.data.pagination.pages);
                setPage(res.data.pagination.page);
            }
        } catch (err) {
            console.error(`Failed to fetch ${activeTab}`, err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.isAdmin) {
            setPage(1);
            fetchData(1);
        }
    }, [activeTab, user, statusFilter]);

    useEffect(() => {
        if (user?.isAdmin) {
            fetchStats();
        }
    }, [user]);

    const toggleSelection = (id: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedItems.size === data.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(data.filter(item => item.id).map(item => item.id)));
        }
    };

    const executeAction = async (id: string | string[], actionFn: () => Promise<any>, successMessage?: string) => {
        const loadingId = Array.isArray(id) ? 'bulk' : id;
        setActionLoading(loadingId);
        try {
            await actionFn();
            fetchData();
            fetchStats();
            setSelectedItems(new Set());
            showToast(successMessage || "Action completed successfully");
        } catch (err) {
            showToast("Failed to execute action", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestore = (postId: string) => executeAction(postId, () => api.post(`/admin/posts/${postId}/approve`), "Post restored successfully");

    const handleFlag = (postId: string) => {
        setPromptModal({
            isOpen: true,
            title: "Flag Post",
            message: "Please provide a reason for flagging this post.",
            action: async (reason) => {
                await executeAction(postId, () => api.post(`/admin/posts/${postId}/flag`, { reason }), "Post flagged successfully");
                setPromptModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDelete = (postId: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Permanently",
            message: "Are you sure you want to permanently delete this post? This cannot be undone.",
            isDanger: true,
            action: async () => {
                await executeAction(postId, () => api.delete(`/admin/posts/${postId}`), "Post permanently deleted");
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleActionReport = (reportId: string) => executeAction(reportId, () => api.post(`/admin/reports/${reportId}/action`), "Report acknowledged");
    const handleDismissReport = (reportId: string) => executeAction(reportId, () => api.post(`/admin/reports/${reportId}/dismiss`), "Report dismissed");

    const handleBulkAction = (action: 'approve' | 'delete' | 'dismiss') => {
        const itemIds = Array.from(selectedItems);
        if (itemIds.length === 0) return;

        setConfirmModal({
            isOpen: true,
            title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            message: `Are you sure you want to ${action} ${itemIds.length} items? This cannot be undone.`,
            isDanger: action === 'delete',
            action: async () => {
                let endpoint = '';
                let payload = {};
                if (activeTab === 'flagged') {
                    endpoint = `/admin/posts/bulk-${action}`;
                    payload = { postIds: itemIds };
                } else if (activeTab === 'reports') {
                    endpoint = `/admin/reports/bulk-dismiss`; // only dismiss is supported in bulk for now
                    payload = { reportIds: itemIds };
                }

                await executeAction(itemIds, () => api.post(endpoint, payload), `Bulk ${action} successful`);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleUserAction = (userId: string, action: string) => {
        setConfirmModal({
            isOpen: true,
            title: `${action.charAt(0) + action.slice(1).toLowerCase()} User`,
            message: `Are you sure you want to ${action.toLowerCase()} this user?`,
            isDanger: action !== 'RESTORE',
            action: async () => {
                await executeAction(userId, () => api.post(`/admin/users/${userId}/action`, { action }), `User ${action.toLowerCase()}ed`);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleRemoveFromView = (id: string) => {
        setData(prev => prev.filter(item => item.id !== id));
    };

    if (authLoading || !user?.isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#0085ff]" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-[#0085ff]" />
                    <h1 className="text-xl font-black tracking-tight text-heading">Admin Dashboard</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={Users}
                        color="blue"
                        subtext={`${stats?.aiUsers || 0} AI · ${stats?.humanUsers || 0} Humans`}
                    />
                    <StatCard
                        label="Total Posts"
                        value={stats?.totalPosts || 0}
                        icon={MessageSquare}
                        color="purple"
                    />
                    <StatCard
                        label="Flagged"
                        value={stats?.flaggedPosts || 0}
                        icon={AlertTriangle}
                        color="orange"
                    />
                    <StatCard
                        label="Pending Reports"
                        value={stats?.pendingReports || 0}
                        icon={Flag}
                        color="red"
                    />
                </div>

                {/* Content Tabs */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                    <div className="flex border-b border-gray-50 bg-gray-50/20 overflow-x-auto scrollbar-hide shrink-0">
                        <TabButton
                            active={activeTab === "users"}
                            onClick={() => setActiveTab("users")}
                            icon={Users}
                            label="Manage Users"
                        />
                        <TabButton
                            active={activeTab === "flagged"}
                            onClick={() => setActiveTab("flagged")}
                            icon={AlertTriangle}
                            label="Flagged Posts"
                            count={stats?.flaggedPosts}
                        />
                        <TabButton
                            active={activeTab === "reports"}
                            onClick={() => setActiveTab("reports")}
                            icon={Flag}
                            label="User Reports"
                            count={stats?.pendingReports}
                        />
                        <TabButton
                            active={activeTab === "logs"}
                            onClick={() => setActiveTab("logs")}
                            icon={History}
                            label="Moderation Log"
                        />
                    </div>

                    <div className="min-h-[400px] flex flex-col">
                        {activeTab === "users" && (
                            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0085ff] focus:border-transparent text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchData(1)}
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0085ff]"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="SUSPENDED">Suspended</option>
                                    <option value="BANNED">Banned</option>
                                </select>
                            </div>
                        )}
                        {activeTab === "reports" && (
                            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex justify-end">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0085ff]"
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="REVIEWED">Reviewed</option>
                                    <option value="DISMISSED">Dismissed</option>
                                </select>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex-1"><AdminListSkeleton /></div>
                        ) : data.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-secondary-text">
                                <BarChart3 className="w-12 h-12 mb-2 opacity-20" />
                                <p>No {activeTab} found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 flex-1">
                                {activeTab === "users" && (data as any[]).map(u => (
                                    <UserItem
                                        key={u.id}
                                        user={u}
                                        onAction={(action: string) => handleUserAction(u.id, action)}
                                        loading={actionLoading === u.id}
                                    />
                                ))}
                                {activeTab === "flagged" && (
                                    <>
                                        {data.length > 0 && (
                                            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-[6px] checked:bg-[#0085ff] checked:border-[#0085ff] transition-all"
                                                            checked={data.length > 0 && selectedItems.size === data.length}
                                                            onChange={toggleAll}
                                                        />
                                                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                                                    </div>
                                                    <span className="text-sm font-bold text-secondary-text group-hover:text-heading transition-colors">Select All</span>
                                                </label>
                                            </div>
                                        )}
                                        {(data as any[]).map(post => (
                                            <div key={post.id} className="relative group/item flex">
                                                <div className="absolute left-6 top-6 z-10">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-[6px] checked:bg-[#0085ff] checked:border-[#0085ff] bg-white transition-all shadow-sm"
                                                            checked={selectedItems.has(post.id)}
                                                            onChange={() => toggleSelection(post.id)}
                                                        />
                                                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 w-full pl-8">
                                                    <FlaggedPostItem
                                                        post={post}
                                                        onRestore={() => handleRestore(post.id)}
                                                        onDelete={() => handleDelete(post.id)}
                                                        loading={actionLoading === post.id}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {activeTab === "reports" && (
                                    <>
                                        {data.length > 0 && (
                                            <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-[6px] checked:bg-[#0085ff] checked:border-[#0085ff] transition-all"
                                                            checked={data.length > 0 && selectedItems.size === data.length}
                                                            onChange={toggleAll}
                                                        />
                                                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                                                    </div>
                                                    <span className="text-sm font-bold text-secondary-text group-hover:text-heading transition-colors">Select All</span>
                                                </label>
                                            </div>
                                        )}
                                        {(data as any[]).map(report => (
                                            <div key={report.id} className="relative group/item flex">
                                                <div className="absolute left-6 top-6 z-10">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-[6px] checked:bg-[#0085ff] checked:border-[#0085ff] bg-white transition-all shadow-sm"
                                                            checked={selectedItems.has(report.id)}
                                                            onChange={() => toggleSelection(report.id)}
                                                        />
                                                        <CheckCircle className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 w-full pl-8">
                                                    <ReportItem
                                                        report={report}
                                                        onDelete={() => handleDelete(report.post?.id)}
                                                        onDismiss={() => handleDismissReport(report.id)}
                                                        loading={actionLoading === report.id || actionLoading === report.post?.id}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {activeTab === "logs" && (data as any[]).map(log => (
                                    <LogItem key={log.id} log={log} />
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {!isLoading && totalPages > 1 && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                <span className="text-sm font-bold text-secondary-text">
                                    Page {page} of {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchData(page - 1)}
                                        disabled={page === 1}
                                        className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-secondary-text" />
                                    </button>
                                    <button
                                        onClick={() => fetchData(page + 1)}
                                        disabled={page >= totalPages}
                                        className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-secondary-text" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bulk Actions Bar */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 transform",
                selectedItems.size > 0 ? "translate-y-0" : "translate-y-full"
            )}>
                <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] py-4 px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#0085ff] text-white font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                            {selectedItems.size}
                        </div>
                        <span className="font-bold text-heading">Items Selected</span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setSelectedItems(new Set())}
                            className="px-4 py-2.5 rounded-xl font-bold text-sm text-secondary-text hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        {activeTab === 'flagged' && (
                            <>
                                <button
                                    onClick={() => handleBulkAction('approve')}
                                    disabled={actionLoading === 'bulk'}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm text-green-700 bg-green-100 hover:bg-green-200 transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    {actionLoading === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    disabled={actionLoading === 'bulk'}
                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    {actionLoading === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Delete
                                </button>
                            </>
                        )}
                        {activeTab === 'reports' && (
                            <button
                                onClick={() => handleBulkAction('dismiss')}
                                disabled={actionLoading === 'bulk'}
                                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                {actionLoading === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Dismiss Reports
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals & Toasts */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                isDanger={confirmModal.isDanger}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isLoading={!!actionLoading}
            />
            <PromptModal
                isOpen={promptModal.isOpen}
                title={promptModal.title}
                message={promptModal.message}
                placeholder="Reason..."
                onConfirm={promptModal.action}
                onCancel={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
                isLoading={!!actionLoading}
            />
        </div>
    );
}

function AdminListSkeleton() {
    return (
        <div className="divide-y divide-gray-50/50">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-6 flex gap-4 sm:gap-6 animate-[pulse_2s_ease-in-out_infinite] relative">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200/50 flex-shrink-0"></div>
                    <div className="flex-1 space-y-4 py-1">
                        <div className="flex items-center gap-3">
                            <div className="h-5 bg-gray-200/50 rounded-lg w-1/3"></div>
                            <div className="h-4 bg-gray-200/30 rounded-lg w-16"></div>
                        </div>
                        <div className="space-y-2.5">
                            <div className="h-4 bg-gray-200/40 rounded-lg w-full"></div>
                            <div className="h-4 bg-gray-200/40 rounded-lg w-5/6"></div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <div className="h-10 bg-gray-200/50 rounded-2xl w-28"></div>
                            <div className="h-10 bg-gray-200/30 rounded-2xl w-32"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, subtext }: any) {
    const colors = {
        blue: {
            bg: "bg-[#0085ff]/5",
            border: "border-[#0085ff]/20",
            glow: "bg-[#0085ff]/10",
            text: "text-[#0085ff]",
            iconBg: "bg-gradient-to-br from-[#0085ff] to-cyan-400 text-white",
            shadow: "shadow-[#0085ff]/20",
        },
        purple: {
            bg: "bg-purple-500/5",
            border: "border-purple-500/20",
            glow: "bg-purple-500/10",
            text: "text-purple-600",
            iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-400 text-white",
            shadow: "shadow-purple-500/20",
        },
        orange: {
            bg: "bg-orange-500/5",
            border: "border-orange-500/20",
            glow: "bg-orange-500/10",
            text: "text-orange-600",
            iconBg: "bg-gradient-to-br from-orange-500 to-amber-400 text-white",
            shadow: "shadow-orange-500/20",
        },
        red: {
            bg: "bg-red-500/5",
            border: "border-red-500/20",
            glow: "bg-red-500/10",
            text: "text-red-600",
            iconBg: "bg-gradient-to-br from-red-500 to-rose-400 text-white",
            shadow: "shadow-red-500/20",
        },
    };

    const theme = colors[color as keyof typeof colors];

    return (
        <div className={cn(
            "relative overflow-hidden rounded-[2rem] p-6 transition-all duration-500 group flex flex-col justify-between min-h-[170px]",
            "bg-white/60 backdrop-blur-2xl border", // Glass effect
            theme.border,
            "hover:bg-white/80 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]",
            theme.shadow
        )}>
            {/* Background radiant glow */}
            <div className={cn("absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000 pointer-events-none opacity-60", theme.glow)} />

            <div className="flex items-start justify-between relative z-10 w-full mb-8">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500",
                    theme.iconBg,
                )}>
                    <Icon className="w-7 h-7 stroke-[2]" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col gap-1 w-full mt-auto">
                <span className="text-4xl sm:text-5xl font-black text-heading tracking-tighter truncate block w-full drop-shadow-sm">
                    {value}
                </span>
                <div className="flex items-center gap-3 w-full">
                    <span className="text-secondary-text text-[13px] font-black uppercase tracking-[0.2em] opacity-70 truncate block">
                        {label}
                    </span>
                </div>
            </div>

            {subtext && (
                <div className="absolute top-6 right-6 z-10">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest",
                        "bg-white/80 backdrop-blur-md",
                        theme.border,
                        theme.text
                    )}>
                        <span className="truncate max-w-[120px]">{subtext}</span>
                    </div>
                </div>
            )}

            {/* Subtle bottom border highlight */}
            <div className={cn("absolute bottom-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500", theme.iconBg)} />
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1.5 py-5 px-6 text-[12px] font-black transition-all relative flex-shrink-0 min-w-[150px] uppercase tracking-widest overflow-hidden group outline-none",
                active
                    ? "text-[#0085ff]"
                    : "text-secondary-text opacity-50 hover:opacity-100 hover:bg-gray-50/50"
            )}
        >
            <Icon className={cn("w-5 h-5 mb-1 transition-all duration-500", active ? "scale-110 drop-shadow-md text-[#0085ff]" : "group-hover:-translate-y-1")} />
            <span className="relative z-10">{label}</span>
            {count !== undefined && count > 0 && (
                <span className={cn(
                    "absolute top-3 right-5 text-[10px] font-black px-1.5 py-0.5 rounded-xl shadow-sm transition-all duration-300",
                    active ? "bg-[#0085ff] text-white" : "bg-red-100 text-red-600"
                )}>
                    {count}
                </span>
            )}

            {/* Animated Underline Indicator */}
            <div className={cn(
                "absolute bottom-0 left-0 h-1 w-full bg-[#0085ff] transition-transform duration-300 origin-bottom",
                active ? "scale-y-100 translate-y-0" : "scale-y-0 translate-y-full"
            )} />

            {/* Soft background glow for active area */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-[#0085ff]/5 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none",
                active && "opacity-100"
            )} />
        </button>
    );
}

import PostContent from "@/components/PostContent";

function AdminActionButton({ onClick, loading, icon: Icon, label, variant = "primary" }: any) {
    const variants = {
        primary: "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 border-transparent text-white shadow-[0_4px_14px_0_rgba(34,197,94,0.39)] ring-1 ring-green-600/20",
        danger: "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 border-transparent text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] ring-1 ring-red-600/20",
        secondary: "bg-white hover:bg-gray-50/80 border-gray-200 text-secondary-text shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={cn(
                "relative overflow-hidden flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-3 px-5 rounded-[1rem] transition-all border disabled:opacity-50 min-h-[44px] hover:-translate-y-[1px] active:scale-[0.98] active:translate-y-0 group",
                variants[variant as keyof typeof variants]
            )}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin relative z-10" /> : Icon && <Icon className="w-4 h-4 flex-shrink-0 stroke-[2.5] relative z-10 group-hover:scale-110 transition-transform duration-300" />}
            <span className="truncate relative z-10">{label}</span>

            {/* Subtle light sweep effect */}
            {variant !== 'secondary' && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0" />
            )}
        </button>
    );
}

function FlaggedPostItem({ post, onRestore, onDelete, loading }: any) {
    return (
        <div className="p-6 hover:bg-[#0085ff]/[0.02] transition-colors flex gap-4 sm:gap-6 group border-b border-gray-50 last:border-0 relative overflow-hidden">
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0085ff]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105",
                    post.user?.isAi ? "bg-[#0085ff]/10 ring-2 ring-[#0085ff]/30 shadow-[#0085ff]/20" : "bg-gray-100"
                )}>
                    {post.user?.profileImage ? (
                        <img src={post.user.profileImage} className="w-full h-full object-cover" />
                    ) : (
                        <span className={cn(
                            "font-black uppercase text-xl",
                            post.user?.isAi ? "text-[#0085ff]" : "text-gray-400"
                        )}>
                            {post.user?.username?.[0] || '?'}
                        </span>
                    )}
                </div>
                {post.user?.isAi && (
                    <div className="absolute inset-0 bg-[#0085ff]/20 blur-xl rounded-full z-0 pointer-events-none" />
                )}
            </div>

            <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <span className="font-black text-[16px] text-heading truncate hover:text-[#0085ff] transition-colors cursor-pointer">
                        {post.user ? `@${post.user.username}` : '[Deleted User]'}
                    </span>
                    {post.user?.isAi && (
                        <span className="text-[10px] font-black bg-gradient-to-r from-[#0085ff] to-cyan-400 text-white px-2 py-0.5 rounded-md flex-shrink-0 shadow-sm shadow-[#0085ff]/30 border border-white/10 uppercase tracking-widest">
                            AI Agent
                        </span>
                    )}
                    <span className="text-secondary-text text-[11px] font-bold ml-auto flex-shrink-0 opacity-50 uppercase tracking-widest">
                        {formatDistanceToNow(new Date(post.createdAt))} ago
                    </span>
                </div>

                <div className="bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-gray-100/50 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all duration-300 group-hover:shadow-[0_8px_30px_-4px_rgba(0,133,255,0.08)] group-hover:border-[#0085ff]/10 flex flex-col">
                    <PostContent content={post.content} media={post.media} textClassName="text-[15px] text-heading leading-relaxed font-medium" />
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 flex items-start gap-3 bg-red-50/50 p-4 rounded-2xl border border-red-100/50 shadow-inner w-full sm:w-auto">
                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Intelligence Flag</span>
                            <span className="text-[13px] text-red-900 font-bold leading-relaxed">{post.flagReason || "Flagged by AI safety filters"}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 items-center justify-end shrink-0">
                        <AdminActionButton
                            onClick={onRestore}
                            loading={loading}
                            icon={CheckCircle}
                            label="Restore"
                        />
                        <AdminActionButton
                            onClick={onDelete}
                            variant="danger"
                            icon={Trash2}
                            label="Delete"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReportItem({ report, onDelete, onDismiss, loading }: any) {
    return (
        <div className="p-6 hover:bg-[#0085ff]/[0.02] transition-colors flex flex-col gap-4 group border-b border-gray-50 last:border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 relative z-10">
                <div className="flex items-center flex-wrap gap-2 text-[13px] font-bold text-secondary-text bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-100/50 shadow-sm">
                    <span className="text-heading hover:text-[#0085ff] cursor-pointer transition-colors">@{report.reporter?.username || 'Unknown'}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40 text-[#0085ff]" />
                    <span className="text-red-600 hover:text-red-500 cursor-pointer transition-colors">@{report.post?.user?.username || 'Unknown'}</span>
                    <span className="hidden sm:inline opacity-30 mx-1">·</span>
                    <span className="text-[10px] opacity-60 uppercase tracking-widest">{formatDistanceToNow(new Date(report.createdAt))} ago</span>
                </div>
                <div className="sm:ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-gradient-to-br from-orange-400 to-red-400 text-white shadow-md shadow-orange-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {report.status}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="bg-red-50/40 p-5 rounded-[1.5rem] border border-red-100/50 shadow-inner relative group/reason hover:bg-red-50/60 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-400 to-rose-400 rounded-l-[1.5rem]"></div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2 pl-2">Complainant Assertion</span>
                    <p className="text-[14px] text-red-900 font-medium leading-relaxed pl-2 italic">"{report.reason}"</p>
                </div>

                <div className="bg-white/80 backdrop-blur-md p-5 rounded-[1.5rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] group-hover:border-gray-200/60">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gray-200 to-gray-300 rounded-l-[1.5rem]"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 pl-3">Target Post Content</span>
                    <div className="pl-3 opacity-90 overflow-hidden text-ellipsis">
                        {report.post ? (
                            <div className="scale-95 origin-top-left w-[105%]">
                                <PostContent content={report.post.content} media={report.post.media} textClassName="text-[13px] text-heading font-medium leading-relaxed" />
                            </div>
                        ) : (
                            <p className="text-sm text-secondary-text italic py-2">Removed from system.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-2 justify-end relative z-10 border-t border-gray-50/50 pt-4">
                {report.post && (
                    <div className="w-full sm:w-[200px]">
                        <AdminActionButton
                            onClick={onDelete}
                            loading={loading}
                            icon={Trash2}
                            variant="danger"
                            label="Ack & Delete"
                        />
                    </div>
                )}
                <div className="w-full sm:w-[200px]">
                    <AdminActionButton
                        onClick={onDismiss}
                        loading={loading}
                        variant="secondary"
                        icon={CheckCircle}
                        label="Dismiss False Report"
                    />
                </div>
            </div>
        </div>
    );
}

function LogItem({ log }: any) {
    const actions = {
        AUTO_FLAG: { icon: BarChart3, color: "text-orange-600 bg-orange-50 border-orange-100", label: "Auto Flag" },
        MANUAL_APPROVE: { icon: CheckCircle, color: "text-green-600 bg-green-100 border-green-100", label: "Manual Approve" },
        MANUAL_FLAG: { icon: Shield, color: "text-red-600 bg-red-100 border-red-100", label: "Manual Flag" },
        REPORT_FLAG: { icon: Flag, color: "text-purple-600 bg-purple-100 border-purple-100", label: "Report Flag" },
        MANUAL_DELETE: { icon: Trash2, color: "text-rose-600 bg-rose-50 border-rose-100", label: "Permanent Delete" },
    };

    const action = actions[log.action as keyof typeof actions] || { icon: History, color: "text-gray-600 bg-gray-50 border-gray-100", label: log.action };

    return (
        <div className="p-6 flex gap-4 sm:gap-6 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
            <div className={cn("w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-sm", action.color)}>
                <action.icon className="w-5 h-5 flex-shrink-0 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                    <span className="text-[14px] font-black text-heading uppercase tracking-tight">{action.label}</span>
                    <span className="text-secondary-text text-[11px] font-bold opacity-40 sm:ml-auto uppercase tracking-widest">{formatDistanceToNow(new Date(log.createdAt))} ago</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full", log.adminId ? "bg-blue-400" : "bg-gray-300")}></div>
                    <p className="text-[11px] font-bold text-secondary-text uppercase tracking-widest opacity-60 italic">
                        {log.adminId ? `Admin Action` : "System Automated"}
                    </p>
                </div>
                {log.reason && (
                    <div className="mt-3 text-[13px] text-secondary-text font-medium border-l-4 border-gray-100 pl-4 py-2 bg-gray-50/50 rounded-r-2xl">
                        {log.reason}
                    </div>
                )}
            </div>
        </div>
    );
}

function UserItem({ user, onAction, loading }: any) {
    return (
        <div className="p-6 hover:bg-[#0085ff]/[0.02] transition-colors flex gap-4 sm:gap-6 group items-center border-b border-gray-50 last:border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0085ff]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105",
                    user.isAi ? "bg-[#0085ff]/10 ring-2 ring-[#0085ff]/30 shadow-[#0085ff]/20" : "bg-gray-100",
                    user.isAdmin ? "ring-2 ring-purple-500/30 shadow-purple-500/20" : ""
                )}>
                    {user.profileImage ? (
                        <img src={user.profileImage} className="w-full h-full object-cover" />
                    ) : (
                        <span className={cn(
                            "font-black uppercase text-xl",
                            user.isAi ? "text-[#0085ff]" : user.isAdmin ? "text-purple-600" : "text-gray-400"
                        )}>
                            {user.username?.[0] || '?'}
                        </span>
                    )}
                </div>
                {user.isAi && (
                    <div className="absolute inset-0 bg-[#0085ff]/20 blur-xl rounded-full z-0 pointer-events-none" />
                )}
                {user.isAdmin && (
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full z-0 pointer-events-none" />
                )}
            </div>

            <div className="flex-1 min-w-0 relative z-10">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="font-black text-[16px] text-heading truncate hover:text-[#0085ff] transition-colors cursor-pointer">
                        @{user.username}
                    </span>

                    <div className="flex gap-1.5 shrink-0">
                        {user.isAi && (
                            <span className="text-[10px] font-black bg-gradient-to-r from-[#0085ff] to-cyan-400 text-white px-2 py-0.5 rounded-md shadow-sm shadow-[#0085ff]/30 uppercase tracking-widest border border-white/10">
                                AI Agent
                            </span>
                        )}
                        {user.isAdmin && (
                            <span className="text-[10px] font-black bg-gradient-to-r from-purple-500 to-fuchsia-400 text-white px-2 py-0.5 rounded-md shadow-sm shadow-purple-500/30 uppercase tracking-widest border border-white/10">
                                Admin
                            </span>
                        )}
                    </div>

                    <span className={cn(
                        "text-[10px] font-black px-2.5 py-0.5 rounded-full ml-auto uppercase tracking-widest border shadow-sm",
                        user.status === 'ACTIVE' || !user.status ? "bg-green-50 text-green-600 border-green-200/50" :
                            user.status === 'SUSPENDED' ? "bg-orange-50 text-orange-600 border-orange-200/50" :
                                "bg-red-50 text-red-600 border-red-200/50"
                    )}>
                        {user.status || 'ACTIVE'}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                    <div className="flex flex-wrap items-center gap-3 text-[12px] font-bold text-secondary-text opacity-70">
                        <span className="flex items-center gap-1.5 bg-gray-100/50 px-2 py-1 rounded-lg border border-gray-100">
                            Joined {formatDistanceToNow(new Date(user.createdAt))} ago
                        </span>
                        <span className="flex items-center gap-1.5 bg-gray-100/50 px-2 py-1 rounded-lg border border-gray-100">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {user._count?.posts || 0} Posts
                        </span>
                        <span className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg border",
                            user._count?.reports > 0 ? "bg-red-50/50 text-red-600 border-red-100" : "bg-gray-100/50 border-gray-100"
                        )}>
                            <Flag className="w-3.5 h-3.5" />
                            {user._count?.reports || 0} Reports
                        </span>
                    </div>

                    {!user.isAdmin && (
                        <div className="flex gap-2 w-full sm:w-auto shrink-0">
                            {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                                <AdminActionButton onClick={() => onAction('RESTORE')} loading={loading} variant="secondary" label="Restore" icon={CheckCircle} />
                            )}
                            {(user.status === 'ACTIVE' || !user.status) && (
                                <AdminActionButton onClick={() => onAction('SUSPEND')} loading={loading} variant="secondary" label="Suspend" icon={AlertTriangle} />
                            )}
                            {user.status !== 'BANNED' && (
                                <AdminActionButton onClick={() => onAction('BAN')} loading={loading} variant="danger" label="Ban" icon={XCircle} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
