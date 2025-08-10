"use client";
import { Bell, User } from "lucide-react"; 
import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed w-full top-0 z-50 bg-white backdrop-blur-xl border-b border-slate-200/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side: Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 bg-clip-text text-transparent">
                KT ASSIST AI
              </span>
            </div>
            <svg
              aria-labelledby="logo-title"
              width="30"
              height="30"
              viewBox="121.892 0 36.564 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
            >
              <g clipPath="url(#clip0_338_12517)">
                <path
                  d="M158.456 16.8545H142.983L153.926 6.08073L152.28 4.46073L141.338 15.2345V0H139.011V15.2345L128.068 4.46073L126.423 6.08073L137.365 16.8545H121.892V19.1455H137.365L126.423 29.9193L128.068 31.5393L139.011 20.7655V36H141.338V20.7655L152.28 31.5393L153.926 29.9193L142.983 19.1455H158.456V16.8545ZM140.174 19.1455C139.533 19.1455 139.011 18.6316 139.011 18C139.011 17.3684 139.533 16.8545 140.174 16.8545C140.816 16.8545 141.338 17.3684 141.338 18C141.338 18.6316 140.816 19.1455 140.174 19.1455Z"
                  fill="currentColor"
                ></path>
              </g>
            </svg>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Notification Icon */}
            <button
              className="relative p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-800" />
            </button>

            {/* User Icon */}
            <button
              className="p-2 rounded-md hover:bg-gray-200 transition"
              aria-label="User Menu"
            >
              <User className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
