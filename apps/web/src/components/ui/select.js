import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(SelectPrimitive.Trigger, { ref: ref, className: cn('flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:scale-[1.01] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30 [&>span]:line-clamp-1', className), ...props, children: [children, _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(ChevronDown, { className: "h-4 w-4 opacity-50 transition-transform duration-200" }) })] })));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.ScrollUpButton, { ref: ref, className: cn('flex cursor-default items-center justify-center py-1', className), ...props, children: _jsx(ChevronUp, { className: "h-4 w-4" }) })));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.ScrollDownButton, { ref: ref, className: cn('flex cursor-default items-center justify-center py-1', className), ...props, children: _jsx(ChevronDown, { className: "h-4 w-4" }) })));
SelectScrollDownButton.displayName =
    SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = 'popper', ...props }, ref) => (_jsx(SelectPrimitive.Portal, { children: _jsxs(SelectPrimitive.Content, { ref: ref, className: cn('relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl text-popover-foreground shadow-xl shadow-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1', className), position: position, ...props, children: [_jsx(SelectScrollUpButton, {}), _jsx(SelectPrimitive.Viewport, { className: cn('p-1.5', position === 'popper' &&
                    'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'), children: children }), _jsx(SelectScrollDownButton, {})] }) })));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.Label, { ref: ref, className: cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className), ...props })));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(SelectPrimitive.Item, { ref: ref, className: cn('relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:bg-primary/10 focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className), ...props, children: [_jsx("span", { className: "absolute left-3 flex h-5 w-5 items-center justify-center", children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(Check, { className: "h-4 w-4 text-primary" }) }) }), _jsx(SelectPrimitive.ItemText, { children: children })] })));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.Separator, { ref: ref, className: cn('-mx-1 my-1 h-px bg-muted', className), ...props })));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton, };
