// Replace the entire `const DEFAULT_CATALOG = {...}` block (~line 514) with this stub.
// Offline fallback ONLY. Real catalogs live in catalogs/ — edit those, not this.
const DEFAULT_CATALOG = {
 meta:{title:"Starter — load a catalog from the picker",note:"Offline fallback. See catalogs/index.json."},
 zones:[{t:"Internet",y0:20,y1:90},{t:"Private",y0:100,y1:200}],
 nodes:{
  usr:{t:"Users",x:80,y:50},
  gw:{t:"Gateway",x:200,y:55},
  app:{t:"App",x:160,y:140},
  db:{t:"Database",x:280,y:160}
 },
 layers:[{id:"net",organ:"Vascular",arch:"Network",edges:[
  {a:"usr",b:"gw",proto:"HTTPS",port:443,conn:"internet"},
  {a:"gw",b:"app",proto:"HTTPS",port:443,conn:"lan"},
  {a:"app",b:"db",proto:"SQL",port:1433,conn:"lan"}]}],
 flows:[{id:"f1",name:"User to data",steps:["usr","gw","app","db"]}]
};
