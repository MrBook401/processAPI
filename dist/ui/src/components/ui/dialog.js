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
exports.Dialog = Dialog;
exports.DialogClose = DialogClose;
exports.DialogContent = DialogContent;
exports.DialogDescription = DialogDescription;
exports.DialogFooter = DialogFooter;
exports.DialogHeader = DialogHeader;
exports.DialogOverlay = DialogOverlay;
exports.DialogPortal = DialogPortal;
exports.DialogTitle = DialogTitle;
exports.DialogTrigger = DialogTrigger;
const React = __importStar(require("react"));
const dialog_1 = require("@base-ui/react/dialog");
const utils_1 = require("@/lib/utils");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function Dialog({ ...props }) {
    return <dialog_1.Dialog.Root data-slot="dialog" {...props}/>;
}
function DialogTrigger({ ...props }) {
    return <dialog_1.Dialog.Trigger data-slot="dialog-trigger" {...props}/>;
}
function DialogPortal({ ...props }) {
    return <dialog_1.Dialog.Portal data-slot="dialog-portal" {...props}/>;
}
function DialogClose({ ...props }) {
    return <dialog_1.Dialog.Close data-slot="dialog-close" {...props}/>;
}
function DialogOverlay({ className, ...props }) {
    return (<dialog_1.Dialog.Backdrop data-slot="dialog-overlay" className={(0, utils_1.cn)("fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", className)} {...props}/>);
}
function DialogContent({ className, children, showCloseButton = true, ...props }) {
    return (<DialogPortal>
      <DialogOverlay />
      <dialog_1.Dialog.Popup data-slot="dialog-content" className={(0, utils_1.cn)("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className)} {...props}>
        {children}
        {showCloseButton && (<dialog_1.Dialog.Close data-slot="dialog-close" render={<button_1.Button variant="ghost" className="absolute top-2 right-2" size="icon-sm"/>}>
            <lucide_react_1.XIcon />
            <span className="sr-only">Close</span>
          </dialog_1.Dialog.Close>)}
      </dialog_1.Dialog.Popup>
    </DialogPortal>);
}
function DialogHeader({ className, ...props }) {
    return (<div data-slot="dialog-header" className={(0, utils_1.cn)("flex flex-col gap-2", className)} {...props}/>);
}
function DialogFooter({ className, showCloseButton = false, children, ...props }) {
    return (<div data-slot="dialog-footer" className={(0, utils_1.cn)("-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end", className)} {...props}>
      {children}
      {showCloseButton && (<dialog_1.Dialog.Close render={<button_1.Button variant="outline"/>}>
          Close
        </dialog_1.Dialog.Close>)}
    </div>);
}
function DialogTitle({ className, ...props }) {
    return (<dialog_1.Dialog.Title data-slot="dialog-title" className={(0, utils_1.cn)("font-heading text-base leading-none font-medium", className)} {...props}/>);
}
function DialogDescription({ className, ...props }) {
    return (<dialog_1.Dialog.Description data-slot="dialog-description" className={(0, utils_1.cn)("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", className)} {...props}/>);
}
