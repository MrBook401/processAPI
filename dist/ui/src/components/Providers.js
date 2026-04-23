"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Providers;
const react_query_1 = require("@tanstack/react-query");
const react_1 = require("react");
function Providers({ children }) {
    const [queryClient] = (0, react_1.useState)(() => new react_query_1.QueryClient());
    return <react_query_1.QueryClientProvider client={queryClient}>{children}</react_query_1.QueryClientProvider>;
}
