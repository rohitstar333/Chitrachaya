import { Camera, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export type NavLink = {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    active?: boolean;
};

interface HeaderProps {
    userName: string;
    role: string;
    onSignOut: () => void;
    navLinks?: NavLink[];
}

export function Header({ userName, role, onSignOut, navLinks }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-black/90 backdrop-blur supports-[backdrop-filter]:bg-black/75">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] shrink-0">
                        <Camera className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg sm:text-xl font-bold leading-none tracking-tight text-white flex items-center gap-2">
                            CHITRACHAYA
                            <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest hidden sm:inline-block">Photography Club</span>
                        </span>
                    </div>
                </div>

                {/* Desktop Navigation Section */}
                {navLinks && navLinks.length > 0 && (
                    <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
                        {navLinks.map((link, idx) => (
                            <button
                                key={idx}
                                onClick={link.onClick}
                                className={`flex items-center transition-all ${link.active
                                        ? "bg-red-950/40 text-red-500 border border-red-900/50 rounded-md px-3.5 py-1.5"
                                        : "text-neutral-400 hover:text-white px-3.5 py-1.5"
                                    }`}
                            >
                                {link.icon && <span className="mr-2">{link.icon}</span>}
                                {link.label}
                            </button>
                        ))}
                    </nav>
                )}

                {/* Profile Section */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-xs sm:text-sm font-medium text-white max-w-[120px] sm:max-w-none truncate">{userName}</span>
                        <span className="text-[10px] sm:text-xs text-neutral-500">{role}</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSignOut}
                        className="text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-full h-8 w-8 sm:h-9 sm:w-9"
                        title="Sign Out"
                    >
                        <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    {/* Mobile Menu Toggle Button */}
                    {navLinks && navLinks.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-neutral-400 hover:text-white hover:bg-neutral-900 h-8 w-8"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5 text-red-500" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    )}
                </div>
            </div>

            {/* Mobile Scrollable Horizontal Navigation Bar (Always Visible on Mobile) */}
            {navLinks && navLinks.length > 0 && (
                <div className="md:hidden border-t border-neutral-900/80 bg-neutral-950/90 px-4 py-2 overflow-x-auto flex items-center gap-2 scrollbar-none">
                    {navLinks.map((link, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                link.onClick();
                                setMobileMenuOpen(false);
                            }}
                            className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all shrink-0 flex items-center gap-1.5 ${link.active
                                    ? "bg-red-600 text-white border-red-500 shadow-sm"
                                    : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
                                }`}
                        >
                            {link.icon}
                            {link.label}
                        </button>
                    ))}
                </div>
            )}
        </header>
    );
}
