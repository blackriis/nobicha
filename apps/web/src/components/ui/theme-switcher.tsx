"use client";

import React from "react";
import { LaptopMinimalIcon, MoonIcon, SunIcon } from "lucide-react";

import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ThemeSwitcher() {
 const [open, setOpen] = React.useState(false);
 const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark' | 'system'>('system');

 React.useEffect(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
   setCurrentTheme(savedTheme);
  } else {
   setCurrentTheme('system');
  }

  // Apply theme
  applyTheme(savedTheme || 'system', prefersDark);
 }, []);

 const applyTheme = (theme: 'light' | 'dark' | 'system', prefersDark?: boolean) => {
  if (theme === 'system') {
   const systemPrefersDark = prefersDark ?? window.matchMedia('(prefers-color-scheme: dark)').matches;
   if (systemPrefersDark) {
    document.documentElement.classList.add('dark');
   } else {
    document.documentElement.classList.remove('dark');
   }
  } else if (theme === 'dark') {
   document.documentElement.classList.add('dark');
  } else {
   document.documentElement.classList.remove('dark');
  }
 };

 const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
  setCurrentTheme(theme);
  localStorage.setItem('theme', theme);
  
  if (theme === 'system') {
   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
   applyTheme('system', prefersDark);
  } else {
   applyTheme(theme);
  }
  
  setOpen(false);
 };

 const getCurrentIcon = () => {
  switch (currentTheme) {
   case 'light':
    return <SunIcon className="h-4 w-4" />;
   case 'dark':
    return <MoonIcon className="h-4 w-4" />;
   case 'system':
   default:
    return <LaptopMinimalIcon className="h-4 w-4" />;
  }
 };

 return (
  <DropdownMenu open={open} onOpenChange={setOpen}>
   <DropdownMenuTrigger asChild>
    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
     {getCurrentIcon()}
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleThemeChange('light')}>
     <SunIcon className="h-4 w-4 mr-2" />
     Light
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleThemeChange('system')}>
     <LaptopMinimalIcon className="h-4 w-4 mr-2" />
     System
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
     <MoonIcon className="h-4 w-4 mr-2" />
     Dark
    </DropdownMenuItem>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
