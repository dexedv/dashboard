import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/lib/utils";
const Checkbox = React.forwardRef(({ className, ...props }, ref) => {
    return (_jsx("input", { type: "checkbox", ref: ref, className: cn("h-5 w-5 rounded-lg border-border text-primary transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:scale-105 hover:border-primary/50 hover:shadow-sm", className), ...props }));
});
Checkbox.displayName = "Checkbox";
export { Checkbox };
