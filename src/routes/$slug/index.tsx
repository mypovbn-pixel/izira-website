import { createFileRoute } from "@tanstack/react-router";
import StorePage,{loadStore} from "@/kadai/pages/StorePage";
export const Route=createFileRoute("/$slug/")({loader:({params})=>loadStore(params.slug),component:()=> <StorePage data={Route.useLoaderData()}/>,notFoundComponent:()=> <main className="shell"><div className="card" style={{margin:"80px auto",maxWidth:520}}><h1>Store not found</h1><p className="muted">This KADAI link does not exist or is not open right now.</p></div></main>});
