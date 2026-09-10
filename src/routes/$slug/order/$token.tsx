import { createFileRoute } from "@tanstack/react-router";
import OrderStatus from "@/kadai/OrderStatus";
function Page(){const {slug,token}=Route.useParams();return <OrderStatus slug={slug.toLowerCase()} token={token}/>}
export const Route=createFileRoute("/$slug/order/$token")({ssr:false,component:Page});
