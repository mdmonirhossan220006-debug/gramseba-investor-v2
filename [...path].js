import { put, get } from '@vercel/blob';

const enc = new TextEncoder();
const DATA_PREFIX = 'gramseba/data/';
const IMAGE_PREFIX = 'gramseba/images/';
const defaults = {
  products: [
    {id:'demo1',name:'মিনিকেট চাল',price:75,category:'মুদি',description:'১ কেজি',image_url:'',active:true,created_at:new Date().toISOString()},
    {id:'demo2',name:'সয়াবিন তেল',price:180,category:'মুদি',description:'১ লিটার',image_url:'',active:true,created_at:new Date().toISOString()}
  ], orders: [], payment:{bkash:'',nagad:'',rocket:''}, expenses:[],
  investors: [{id:'INV-001',name:'Primary Investor',email:'investor@gramseba.com',investment:2000000,share:20,status:'active',created_at:new Date().toISOString()}],
  investor_login_logs: []
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function text(data,status=200,headers={}){return new Response(data,{status,headers:{'cache-control':'no-store',...headers}})}
function dataKey(k){return DATA_PREFIX+k+'.json'}
async function getJSON(key,fallback){try{const r=await get(dataKey(key),{access:'private'}); if(!r)return fallback; return await r.json()}catch{return fallback}}
async function setJSON(key,value){await put(dataKey(key),JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'})}
function b64(s){return Buffer.from(s,'utf8').toString('base64url')}
function ub64(s){return Buffer.from(s,'base64url').toString('utf8')}
async function key(){return crypto.subtle.importKey('raw',enc.encode(process.env.ADMIN_SECRET||'change-this-secret-please'),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
async function sign(payload){const k=await key();const body=b64(JSON.stringify(payload));const sig=await crypto.subtle.sign('HMAC',k,enc.encode(body));return body+'.'+b64(String.fromCharCode(...new Uint8Array(sig)))}
async function verify(token){try{const [body,sig]=token.split('.');if(!body||!sig)return null;const k=await key();const raw=Uint8Array.from(ub64(sig),c=>c.charCodeAt(0));const ok=await crypto.subtle.verify('HMAC',k,raw,enc.encode(body));if(!ok)return null;const p=JSON.parse(ub64(body));if(!p.exp||Date.now()>p.exp)return null;return p}catch{return null}}
async function requireAdmin(req){const h=req.headers.get('authorization')||'';return verify(h.startsWith('Bearer ')?h.slice(7):'')}
function adminCreds(){return {email:process.env.ADMIN_EMAIL||'mdmonirhossan220006@gmail.com',password:process.env.ADMIN_PASSWORD||'Gs@2026!'}}
function investorEnv(){return {email:process.env.INVESTOR_EMAIL||'investor@gramseba.com',password:process.env.INVESTOR_PASSWORD||'Investor@2026!'}}
async function getInvestors(){
  let arr=await getJSON('investors',null);
  if(!arr){const c=investorEnv();arr=[{...defaults.investors[0],email:c.email}]; await setJSON('investors',arr)}
  return arr;
}
function id(){return crypto.randomUUID()}
function safeName(s){return String(s||'file').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,80)}
async function signRole(role,id=''){return sign({role,id,exp:Date.now()+1000*60*60*24*7})}
async function requireInvestor(req){const h=req.headers.get('authorization')||'';const p=await verify(h.startsWith('Bearer ')?h.slice(7):'');return p?.role==='investor'?p:null}
function dayKey(d=new Date()){return new Date(d).toISOString().slice(0,10)}
function monthKey(d){return new Date(d).toISOString().slice(0,7)}
function verifiedOrders(orders){return orders.filter(o=>o.status!=='cancelled' && (o.payment_status||'submitted')==='verified')}
function salesFromOrders(orders){return verifiedOrders(orders).reduce((a,o)=>a+Number(o.total_amount||0),0)}
function investorProfit(profile, netProfit){return Math.max(0, Number(netProfit||0)) * (Number(profile.share||0)/100)}

export default async function handler(req){
 const url=new URL(req.url); const path=url.pathname.replace(/^\/api\/?/,'');
 try{
  if(req.method==='GET'&&path==='health') return json({ok:true,service:'gramseba-investor',blobConfigured:!!process.env.BLOB_READ_WRITE_TOKEN,adminConfigured:!!(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD&&process.env.ADMIN_SECRET),investorConfigured:!!(process.env.INVESTOR_EMAIL&&process.env.INVESTOR_PASSWORD)});
  if(req.method==='POST'&&path==='login'){
   const {email,password}=await req.json();const c=adminCreds();
   if(email!==c.email||password!==c.password)return json({error:'ইমেইল বা পাসওয়ার্ড ভুল।'},401);
   return json({token:await sign({role:'admin',exp:Date.now()+1000*60*60*24*7})});
  }
  if(req.method==='GET'&&path==='products'){const p=await getJSON('products',defaults.products);return json(p.filter(x=>x.active!==false))}
  if(req.method==='GET'&&path==='settings')return json(await getJSON('payment',defaults.payment));
  if(req.method==='POST'&&path==='orders'){
   const body=await req.json();
   if(!body.customer_name||!body.phone||!body.address||!['bkash','nagad','rocket'].includes(body.payment_method)||!body.trx_id||!Array.isArray(body.items)||!body.items.length)return json({error:'অর্ডারের তথ্য অসম্পূর্ণ। bKash/Nagad/Rocket পেমেন্ট ও Transaction ID দিন।'},400);
   const orders=await getJSON('orders',[]);const order={id:Date.now(),...body,status:'pending',payment_status:'submitted',created_at:new Date().toISOString()};orders.unshift(order);await setJSON('orders',orders);return json({ok:true,id:order.id});
  }
  if(req.method==='GET'&&path==='order'){
   const orderId=String(url.searchParams.get('id')||'').trim(),phone=String(url.searchParams.get('phone')||'').trim();if(!orderId||!phone)return json({error:'Order ID ও মোবাইল নম্বর দিন।'},400);
   const orders=await getJSON('orders',[]);const o=orders.find(x=>String(x.id)===orderId&&String(x.phone)===phone);if(!o)return json({error:'এই Order ID ও মোবাইল নম্বরের সাথে কোনো অর্ডার পাওয়া যায়নি।'},404);
   return json({id:o.id,customer_name:o.customer_name,phone:o.phone,total_amount:o.total_amount,items:o.items||[],payment_method:o.payment_method,trx_id:o.trx_id||'',payment_status:o.payment_status||'submitted',status:o.status||'pending',created_at:o.created_at});
  }
  if(req.method==='GET'&&path==='image'){
   const k=url.searchParams.get('key')||''; if(!k.startsWith(IMAGE_PREFIX))return text('Not found',404); const r=await get(k,{access:'public'}); if(!r)return text('Not found',404); return new Response(r.stream,{headers:{'content-type':r.blob.contentType||'image/jpeg','cache-control':'public,max-age=31536000,immutable'}})
  }
  if(req.method==='POST'&&path==='investor/login'){
   try{
    const {email,password}=await req.json();const investors=await getInvestors();const profile=investors.find(x=>x.email===email);
    if(!profile||password!==(profile.password||investorEnv().password)||profile.status!=='active'){
      try{const logs=await getJSON('investor_login_logs',[]);logs.unshift({email:String(email||''),success:false,at:new Date().toISOString()});await setJSON('investor_login_logs',logs.slice(0,200))}catch{}
      return json({error:'Investor email বা password ভুল।'},401)
    }
    try{const logs=await getJSON('investor_login_logs',[]);logs.unshift({email:profile.email,success:true,at:new Date().toISOString()});await setJSON('investor_login_logs',logs.slice(0,200))}catch{}
    return json({token:await signRole('investor',profile.id)})
   }catch(e){return json({error:'Investor storage চালু নেই। Vercel Storage থেকে Blob Store connect করে BLOB_READ_WRITE_TOKEN যোগ করুন, তারপর Redeploy করুন।'},503)}
  }
  if(req.method==='GET'&&path==='investor/dashboard'){
   const inv=await requireInvestor(req);if(!inv)return json({error:'Investor login required.'},401);const investors=await getInvestors();const profile=investors.find(x=>x.id===inv.id);if(!profile||profile.status!=='active')return json({error:'Investor account suspended.'},403);
   const [orders,expenses]=await Promise.all([getJSON('orders',[]),getJSON('expenses',[])]);const verified=verifiedOrders(orders);const cumulativeSales=salesFromOrders(orders);const cumulativeExpenses=expenses.reduce((a,e)=>a+Number(e.amount||0),0);const cumulativeNetProfit=cumulativeSales-cumulativeExpenses;const profit=investorProfit(profile,cumulativeNetProfit);const total=Number(profile.investment||0)+profit;
   const today=dayKey();const todayOrders=verified.filter(o=>dayKey(o.created_at)===today);const todaySales=salesFromOrders(todayOrders);const todayExp=expenses.filter(e=>dayKey(e.date)===today).reduce((a,e)=>a+Number(e.amount||0),0);
   const months=[];const now=new Date();for(let i=5;i>=0;i--){const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-i,1));const m=d.toISOString().slice(0,7);const ms=verified.filter(o=>monthKey(o.created_at)===m).reduce((a,o)=>a+Number(o.total_amount||0),0);const me=expenses.filter(e=>monthKey(e.date)===m).reduce((a,e)=>a+Number(e.amount||0),0);const mn=ms-me;months.push({month:m,sales:ms,expenses:me,profit:mn,investor_profit:investorProfit(profile,mn)})}
   return json({investor:{id:profile.id,name:profile.name,email:profile.email,investment:Number(profile.investment||0),share:Number(profile.share||0),profit,profit_rate_on_investment:Number(profile.investment||0)?(profit/Number(profile.investment||0))*100:0,total_value:total,status:profile.status},business:{cumulative_sales:cumulativeSales,cumulative_expenses:cumulativeExpenses,cumulative_net_profit:cumulativeNetProfit},today:{orders:todayOrders.length,sales:todaySales,expenses:todayExp,profit:todaySales-todayExp},months});
  }
  const admin=await requireAdmin(req);if(!admin)return json({error:'Admin login required.'},401);
  if(req.method==='GET'&&path==='admin/data'){const [products,orders,payment]=await Promise.all([getJSON('products',defaults.products),getJSON('orders',[]),getJSON('payment',defaults.payment)]);return json({products,orders,payment})}
  if(req.method==='GET'&&path==='admin/investor'){const [investors,logs,expenses]=await Promise.all([getInvestors(),getJSON('investor_login_logs',[]),getJSON('expenses',[])]);return json({investors,logs:logs.slice(0,100),expenses})}
  if(req.method==='POST'&&path==='admin/investor/profile'){
   const b=await req.json();let investors=await getInvestors();let p=investors.find(x=>String(x.id)===String(b.id));if(!p){p={id:id(),created_at:new Date().toISOString(),status:'active',investment:0,share:0};investors.unshift(p)}
   Object.assign(p,{name:String(b.name||p.name||'Investor'),email:String(b.email||p.email||''),password:String(b.password||p.password||investorEnv().password),investment:Number(b.investment??p.investment),share:Number(b.share??p.share),status:b.status==='suspended'?'suspended':'active'});if(!p.email)return json({error:'Investor email দিন।'},400);await setJSON('investors',investors);return json({ok:true,investor:p})
  }
  if(req.method==='POST'&&path==='admin/investor/delete'){const b=await req.json();const investors=await getInvestors();await setJSON('investors',investors.filter(x=>String(x.id)!==String(b.id)));return json({ok:true})}
  if(req.method==='POST'&&path==='admin/investor/expense'){const b=await req.json();const amount=Number(b.amount);if(!Number.isFinite(amount)||amount<0)return json({error:'সঠিক খরচের পরিমাণ দিন।'},400);const expenses=await getJSON('expenses',[]);const e={id:id(),date:String(b.date||new Date().toISOString()),category:String(b.category||'অন্যান্য'),amount,description:String(b.description||''),created_at:new Date().toISOString()};expenses.unshift(e);await setJSON('expenses',expenses);return json({ok:true,expense:e})}
  if(req.method==='POST'&&path==='admin/investor/expense/delete'){const b=await req.json();const expenses=await getJSON('expenses',[]);await setJSON('expenses',expenses.filter(e=>String(e.id)!==String(b.id)));return json({ok:true})}
  if(req.method==='POST'&&path==='admin/payment'){const b=await req.json();await setJSON('payment',{bkash:String(b.bkash||''),nagad:String(b.nagad||''),rocket:String(b.rocket||''),updated_at:new Date().toISOString()});return json({ok:true})}
  if(req.method==='POST'&&path==='admin/product'){const b=await req.json();if(!b.name||Number.isNaN(Number(b.price)))return json({error:'পণ্যের নাম ও দাম দিন।'},400);const products=await getJSON('products',defaults.products);const p={id:id(),name:String(b.name),price:Number(b.price),category:String(b.category||'অন্যান্য'),description:String(b.description||''),image_url:String(b.image_url||''),active:true,created_at:new Date().toISOString()};products.unshift(p);await setJSON('products',products);return json({ok:true,product:p})}
  if(req.method==='POST'&&path==='admin/product/toggle'){const b=await req.json();const products=await getJSON('products',defaults.products);const p=products.find(x=>String(x.id)===String(b.id));if(!p)return json({error:'পণ্য পাওয়া যায়নি।'},404);p.active=!!b.active;await setJSON('products',products);return json({ok:true})}
  if(req.method==='POST'&&path==='admin/product/delete'){const b=await req.json();let products=await getJSON('products',defaults.products);products=products.filter(x=>String(x.id)!==String(b.id));await setJSON('products',products);return json({ok:true})}
  if(req.method==='POST'&&path==='admin/order/payment-status'){const {id,payment_status}=await req.json();if(!id||!['submitted','verified','rejected'].includes(payment_status))return json({error:'Invalid payment status'},400);const orders=await getJSON('orders',[]);const i=orders.findIndex(x=>String(x.id)===String(id));if(i<0)return json({error:'অর্ডার পাওয়া যায়নি।'},404);orders[i].payment_status=payment_status;await setJSON('orders',orders);return json({ok:true})}
  if(req.method==='POST'&&path==='admin/order/status'){const b=await req.json();const orders=await getJSON('orders',[]);const o=orders.find(x=>String(x.id)===String(b.id));if(!o)return json({error:'অর্ডার পাওয়া যায়নি।'},404);o.status=String(b.status||'pending');await setJSON('orders',orders);return json({ok:true})}
  if(req.method==='POST'&&path==='admin/image'){
   const ct=req.headers.get('content-type')||'';if(!ct.startsWith('multipart/form-data'))return json({error:'Image upload format invalid.'},400);const form=await req.formData();const file=form.get('file');if(!file||typeof file.arrayBuffer!=='function')return json({error:'ফাইল দিন।'},400);if(file.size>4*1024*1024)return json({error:'ছবি 4MB-এর মধ্যে দিন।'},400);const k=IMAGE_PREFIX+id()+'-'+safeName(file.name);const r=await put(k,file,{access:'public',addRandomSuffix:false,contentType:file.type||'application/octet-stream'});return json({ok:true,url:r.url,key:k})
  }
  return json({error:'Not found'},404)
 }catch(e){return json({error:e?.message||'Server error'},500)}
}
