"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Select = void 0;
exports.SelectContent = SelectContent;
exports.SelectGroup = SelectGroup;
exports.SelectItem = SelectItem;
exports.SelectLabel = SelectLabel;
exports.SelectScrollDownButton = SelectScrollDownButton;
exports.SelectScrollUpButton = SelectScrollUpButton;
exports.SelectSeparator = SelectSeparator;
exports.SelectTrigger = SelectTrigger;
exports.SelectValue = SelectValue;
const React = __importStar(require("react"));
const select_1 = require("@base-ui/react/select");
const utils_1 = require("@/lib/utils");
const lucide_react_1 = require("lucide-react");
const Select = select_1.Select.Root;
exports.Select = Select;
function SelectGroup({ className, ...props }) {
    return (<select_1.Select.Group data-slot="select-group" className={(0, utils_1.cn)("scroll-my-1 p-1", className)} {...props}/>);
}
function SelectValue({ className, ...props }) {
    return (<select_1.Select.Value data-slot="select-value" className={(0, utils_1.cn)("flex flex-1 text-left", className)} {...props}/>);
}
function SelectTrigger({ className, size = "default", children, ...props }) {
    return (<select_1.Select.Trigger data-slot="select-trigger" data-size={size} className={(0, utils_1.cn)("flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      {children}
      <select_1.Select.Icon render={<lucide_react_1.ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground"/>}/>
    </select_1.Select.Trigger>);
}
function SelectContent({ className, children, side = "bottom", sideOffset = 4, align = "center", alignOffset = 0, alignItemWithTrigger = true, ...props }) {
    return (<select_1.Select.Portal>
      <select_1.Select.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger} className="isolate z-50">
        <select_1.Select.Popup data-slot="select-content" data-align-trigger={alignItemWithTrigger} className={(0, utils_1.cn)("relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className)} {...props}>
          <SelectScrollUpButton />
          <select_1.Select.List>{children}</select_1.Select.List>
          <SelectScrollDownButton />
        </select_1.Select.Popup>
      </select_1.Select.Positioner>
    </select_1.Select.Portal>);
}
function SelectLabel({ className, ...props }) {
    return (<select_1.Select.GroupLabel data-slot="select-label" className={(0, utils_1.cn)("px-1.5 py-1 text-xs text-muted-foreground", className)} {...props}/>);
}
function SelectItem({ className, children, ...props }) {
    return (<select_1.Select.Item data-slot="select-item" className={(0, utils_1.cn)("relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2", className)} {...props}>
      <select_1.Select.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </select_1.Select.ItemText>
      <select_1.Select.ItemIndicator render={<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center"/>}>
        <lucide_react_1.CheckIcon className="pointer-events-none"/>
      </select_1.Select.ItemIndicator>
    </select_1.Select.Item>);
}
function SelectSeparator({ className, ...props }) {
    return (<select_1.Select.Separator data-slot="select-separator" className={(0, utils_1.cn)("pointer-events-none -mx-1 my-1 h-px bg-border", className)} {...props}/>);
}
function SelectScrollUpButton({ className, ...props }) {
    return (<select_1.Select.ScrollUpArrow data-slot="select-scroll-up-button" className={(0, utils_1.cn)("top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <lucide_react_1.ChevronUpIcon />
    </select_1.Select.ScrollUpArrow>);
}
function SelectScrollDownButton({ className, ...props }) {
    return (<select_1.Select.ScrollDownArrow data-slot="select-scroll-down-button" className={(0, utils_1.cn)("bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4", className)} {...props}>
      <lucide_react_1.ChevronDownIcon />
    </select_1.Select.ScrollDownArrow>);
}
