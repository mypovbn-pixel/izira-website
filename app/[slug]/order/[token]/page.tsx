import OrderStatus from "@/components/OrderStatus";

export default async function OrderStatusPage({params}:{params:Promise<{slug:string;token:string}>}){
 const {slug,token}=await params;
 return <OrderStatus slug={slug.toLowerCase()} token={token}/>;
}
