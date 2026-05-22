import https from "https";
const body = JSON.stringify({
  request_id: "AR_" + Date.now(), amount: 500, fees: 0, marchand_code: "KSB",
  hmac: "DEAE84FC7BE5E5FD29977DACA43258DEBE735F5366189D19987EFB0C722AB7F2",
  date_expiration: "2026-05-23 00:00:00",
  json_data: JSON.stringify([{key:"listingId",value:"ar_test"},{key:"sellerId",value:"u1"},{key:"listingTitle",value:"سردي - 100 رأس"},{key:"callbackUrl",value:"https://baggie-unguided-annex.ngrok-free.dev/api/payments/cashplus/callback"}])
});
const opts = {hostname:"moneyservicedev.cashplus.ma",port:4434,path:"/cpws/cpmarchand/index.cfm?endpoint=/generate_token",method:"POST",headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body,"utf8")},rejectUnauthorized:false};
const req = https.request(opts, res => { let d=""; res.on("data",c=>d+=c); res.on("end",()=>console.log("HTTP:",res.statusCode,"|Body:",d)); });
req.on("error", e => console.error("ERR:",e.message));
req.write(body); req.end();
