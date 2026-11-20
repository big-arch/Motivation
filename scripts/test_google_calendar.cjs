const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

const source = readFileSync(join(__dirname, '../js/google-calendar.js'), 'utf8');
const scope = 'https://www.googleapis.com/auth/calendar.events.owned';
const id = 'a123bc45def0';
const event = {
  id, title:'Встреча', day:'2028-02-29', endDay:'2028-03-01',
  allDay:true, start:'', end:'', description:'Повестка'
};
const stored = {
  id, summary:'Встреча', description:'Повестка', start:{date:'2028-02-29'}, end:{date:'2028-03-02'},
  extendedProperties:{private:{founderUid:id}}, etag:'"v1"'
};
const ok = body => new Response(JSON.stringify(body), {status:200});
function fixture(transport) {
  const requests = [];
  const oauth = {
    initTokenClient(options) {
      assert.equal(options.scope,scope);
      return {requestAccessToken:()=>options.callback({access_token:'fixture',scope,expires_in:60})};
    },
    hasGrantedAllScopes:()=>true
  };
  const env = {
    window:{FOUNDER_GOOGLE_CALENDAR_CLIENT_ID:'123-fixture.apps.googleusercontent.com',google:{accounts:{oauth2:oauth}}},
    localStorage:{getItem:()=>null, setItem:()=>assert.fail('No token should be written to storage')},
    URLSearchParams, setTimeout:()=>0, clearTimeout(){},
    fetch:async(url,options)=>{
      assert.equal(options.headers.Authorization,'Bearer fixture');
      const request={url:new URL(url),options,body:options.body && JSON.parse(options.body)};
      requests.push(request);
      return transport(request);
    }
  };
  const factory=runInNewContext(source+'\ncreateGoogleCalendar',env);
  const api=factory({
    dateKey:date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'),
    offset(day,days) {const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);},
    notify:()=>{}
  },()=>{});
  api.connect();
  return {api,requests};
}
test('all-day spans are inclusive locally, exclusive at Google, and all result pages are read',async()=>{
  const {api,requests}=fixture(({url})=>ok(url.searchParams.has('pageToken')?{items:[stored]}:{nextPageToken:'next'}));
  const list=await api.events('2028-02-28','2028-03-06');
  assert.equal(requests.length,2);
  assert.equal(list[0].lastDay,'2028-03-01');
  assert.equal(list[0].editable,true);
  assert.equal(requests[1].url.searchParams.get('pageToken'),'next');
});
test('retrying the same insertion accepts only the matching FOUNDER event',async()=>{
  let title=stored.summary;
  const {api,requests}=fixture(({options})=>options.method==='POST'?new Response(null,{status:409}):ok({...stored,summary:title}));
  assert.equal((await api.put(event)).id,id);
  assert.equal(requests[0].body.end.date,'2028-03-02');
  assert.equal(requests[0].body.id,id);
  title='Изменено в Google';
  await assert.rejects(api.put(event),/изменённая версия/);
});
test('changes carry the last observed ETag and clear conflicting date fields on a type switch',async()=>{
  const {api,requests}=fixture(()=>new Response(null,{status:412}));
  const timed={...event,allDay:false,start:'10:00',end:'11:00'};
  const original={...event,source:'google',etag:'"v1"'};
  await assert.rejects(api.put(timed,original),e=>e.status===412);
  assert.equal(requests[0].options.headers['If-Match'],'"v1"');
  assert.equal(requests[0].body.start.date,null);
  await assert.rejects(api.erase(original),e=>e.status===412);
  assert.equal(requests[1].options.headers['If-Match'],'"v1"');
});
test('a revoked token clears the session before another request can be issued',async()=>{
  const {api,requests}=fixture(()=>new Response(null,{status:401}));
  await assert.rejects(api.events('2028-02-28','2028-03-06'),e=>e.status===401);
  assert.equal(api.connected(),false);
  await assert.rejects(api.put(event),/Подключитесь/);
  assert.equal(requests.length,1);
});
