import Link from "next/link";
const orders=[
 ["#1041","Nurul","BND 24.00","Pickup","Awaiting payment"],
 ["#1040","Haziqah","BND 45.00","Delivery","Paid"],
 ["#1039","Alya","BND 30.00","Pickup","Preparing"],
 ["#1038","Farah","BND 18.00","Pickup","Ready"]
];
export default function Dashboard(){
 return <div className="dashboard"><aside className="sidebar"><div className="brand" style={{marginBottom:30}}>IZIRA</div><Link className="active" href="/dashboard">Overview</Link><a>Orders</a><a>Products</a><a>Calendar</a><a>Customers</a><a>Store</a><a>Settings</a><div style={{marginTop:30}}><Link href="/aisyahbakery">View storefront →</Link></div></aside><main className="main"><div className="eyebrow">Aisyah Bakery</div><h1 style={{fontSize:42,margin:"6px 0 26px"}}>Good afternoon.</h1><div className="metric-grid"><div className="metric"><span className="muted">Orders today</span><b>18</b></div><div className="metric"><span className="muted">Sales today</span><b>BND 286</b></div><div className="metric"><span className="muted">Awaiting payment</span><b>4</b></div><div className="metric"><span className="muted">This week</span><b>63 orders</b></div></div><div className="table"><div className="tr head"><span>Order</span><span>Customer</span><span>Total</span><span>Method</span><span>Status</span></div>{orders.map((o,i)=><div className="tr" key={o[0]}><span><b>{o[0]}</b></span><span>{o[1]}</span><span>{o[2]}</span><span>{o[3]}</span><span><span className={"badge "+(i===1||i===3?"ok":"")}>{o[4]}</span></span></div>)}</div><section className="section"><h2>Production summary</h2><div className="grid3"><div className="card"><span className="muted">Nutella Brownies</span><h2>27 boxes</h2></div><div className="card"><span className="muted">Kek Batik</span><h2>18 trays</h2></div><div className="card"><span className="muted">Sea Salt Cookies</span><h2>34 packs</h2></div></div></section></main></div>
}
