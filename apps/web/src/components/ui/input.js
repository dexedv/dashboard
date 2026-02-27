import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (_jsx("input", { type: type, className: cn('flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50 focus-visible:scale-[1.01] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30', className), ref: ref, ...props }));
});
Input.displayName = 'Input';
export { Input };
