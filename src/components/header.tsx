"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, isLoaded } = useUser();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-gray-900"
          >
            <span className="text-blue-600">Seazone</span>
            <span className="text-gray-400">|</span>
            <span>Marketplace Hub</span>
          </Link>

          {isLoaded && user && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 hidden sm:block">
                <span className="font-medium text-gray-900">
                  {user.firstName}
                </span>
              </div>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          )}

          {!isLoaded && (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          )}
        </div>
      </div>
    </header>
  );
}
