import { createFileRoute } from "@tanstack/react-router";
import MerchantOrders from "@/kadai/MerchantOrders";
export const Route=createFileRoute("/dashboard/orders")({ssr:false,component:MerchantOrders});
