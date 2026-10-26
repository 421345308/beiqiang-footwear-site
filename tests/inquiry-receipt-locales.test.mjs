import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInquiryReceipt } from '../edgeone-deploy/cloud-functions/_lib/inquiry-receipt.js';
import { createInquiryHandler } from '../edgeone-deploy/cloud-functions/api/inquiries.js';

const payload={name:'Buyer <script>',company:'Example',buyerType:'Importer / wholesaler',market:'EU',quantity:'300',email:'qa@example.com',requirements:'Sample review only',website:'',consent:true,styleCode:'BQ018',styleLabel:'BQ018',context:'product',page:'/fr/products/bq018/',formStartedAt:Date.now()-10000,buyerTargetCost:'EUR 8 target'};
for(const [locale,heading,boundary] of [['en','Your sourcing request','confirms receipt only'],['zh','您的采购需求','仅确认收到需求'],['de','Ihre Beschaffungsanfrage','ausschließlich den Eingang'],['fr','Votre demande','uniquement la réception'],['es','Hemos recibido','únicamente la recepción']]){
  test(`persists ${locale} inquiry and sends an escaped localized receipt through injected transport`,async()=>{
    const mails=[];const records=[];
    const handler=createInquiryHandler({getStoreImpl:()=>({setJSON:async(k,v)=>records.push({...v})}),createTransportImpl:()=>({sendMail:async mail=>mails.push(mail)})});
    const response=await handler({request:new Request('https://www.beiqiang.online/api/inquiries',{method:'POST',headers:{Origin:'https://www.beiqiang.online','Content-Type':'application/json'},body:JSON.stringify({...payload,preferredResponseLanguage:locale})}),env:{SMTP_PASS:'test-only'},clientIp:'127.0.0.1'});
    assert.equal(response.status,201);assert.equal(mails.length,2);
    assert.ok(mails[1].html.includes(heading));assert.ok(mails[1].text.includes(boundary));
    assert.ok(mails[1].text.includes('EUR 8 target'));assert.ok(mails[1].html.includes('&lt;script&gt;'));assert.ok(!mails[1].html.includes('<script>'));
    assert.equal(records.at(-1).preferredResponseLanguage,locale);assert.equal(records.at(-1).buyerConfirmationSent,true);
    assert.match(mails[1].text,locale==='zh'?/\/zh\/inquiry-status\//:/https:\/\/www.beiqiang.online\/inquiry-status\//);
  });
}
test('uses Chinese page context only when no preference exists; unknown language safely falls back',()=>{
  assert.equal(buildInquiryReceipt({...payload,page:'/zh/request-quote/'},'REF','SECRET').locale,'zh');
  assert.equal(buildInquiryReceipt({...payload,preferredResponseLanguage:'__proto__'},'REF','SECRET').locale,'en');
});
test('a buyer-mail transport failure does not lose the saved inquiry',async()=>{
  let calls=0;const records=[];
  const handler=createInquiryHandler({getStoreImpl:()=>({setJSON:async(k,v)=>records.push({...v})}),createTransportImpl:()=>({sendMail:async()=>{if(++calls===2)throw new Error('test transport unavailable')}})});
  const response=await handler({request:new Request('https://www.beiqiang.online/api/inquiries',{method:'POST',headers:{Origin:'https://www.beiqiang.online','Content-Type':'application/json'},body:JSON.stringify({...payload,preferredResponseLanguage:'fr'})}),env:{SMTP_PASS:'test-only'},clientIp:'127.0.0.1'});
  const body=await response.json();assert.equal(response.status,201);assert.equal(body.buyerConfirmationSent,false);assert.equal(records.at(-1).notificationSent,true);
});
