'use strict';

function createGoogleCalendar({dateKey,offset,notify},changed) {
  const base='https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const scope='https://www.googleapis.com/auth/calendar.events.owned';
  const idKey='founder.calendar.client.v1';
  const idPattern=/^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i;
  let token='', expires=0, library=null, authorizing=false, generation=0, timer;
  function clientId() {
    let local='';
    try { local=localStorage.getItem(idKey)||''; } catch {}
    const value=local||window.FOUNDER_GOOGLE_CALENDAR_CLIENT_ID||'';
    return idPattern.test(value)?value:'';
  }
  function setClient(value) {
    value=value.trim();
    if (value && !idPattern.test(value)) throw Error('Проверьте публичный OAuth Client ID веб-приложения.');
    try { if (value) localStorage.setItem(idKey,value); else localStorage.removeItem(idKey); }
    catch { throw Error('Браузер запретил сохранение настроек.'); }
    disconnect(); return clientId();
  }
  function loadLibrary() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    if (library) return library;
    library=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      const fail=()=>{clearTimeout(timeout);script.remove();library=null;reject(Error('Не удалось загрузить вход Google. Проверьте соединение и повторите.'));};
      const timeout=setTimeout(fail,15000);
      script.src='https://accounts.google.com/gsi/client'; script.async=true;
      script.onload=()=>{clearTimeout(timeout);if (window.google?.accounts?.oauth2) resolve();else fail();};
      script.onerror=fail; document.head.append(script);
    });
    return library;
  }
  function clearSession() {
    token='';expires=0;authorizing=false;clearTimeout(timer);generation++;changed();
  }
  function disconnect() {
    const previous=token;
    clearSession();
    if (previous) { try {window.google.accounts.oauth2.revoke(previous,()=>{});} catch {} }
  }
  function connected() { return Boolean(token && Date.now()<expires); }
  function connect() {
    if (authorizing) return;
    if (!clientId()) {notify('Введите публичный Client ID в настройках подключения.');return;}
    if (!window.google?.accounts?.oauth2) {
      loadLibrary().then(()=>notify('Вход Google готов. Нажмите «Подключить» ещё раз.')).catch(e=>notify(e.message)); return;
    }
    authorizing=true;
    const attempt=++generation;
    const error=message=>{if (attempt===generation) {clearSession();notify(message);}};
    try {
      const oauth=window.google.accounts.oauth2.initTokenClient({
        client_id:clientId(),scope,include_granted_scopes:false,
        callback:result=>{
          if (attempt!==generation) return;
          if (!result.access_token || !window.google.accounts.oauth2.hasGrantedAllScopes(result,scope)) {
            error('Google не предоставил доступ к календарю.');return;
          }
          authorizing=false;token=result.access_token;expires=Date.now()+Math.max(1,Number(result.expires_in)||3600)*1000;
          timer=setTimeout(()=>{if (attempt===generation) {clearSession();notify('Сеанс Google завершён. Подключитесь снова.');}},Math.max(0,expires-Date.now()));
          changed();
        },
        error_callback:response=>error(response.type==='popup_closed'?'Окно входа Google закрыто.':'Вход Google не открылся. Разрешите всплывающее окно для сайта.')
      });
      oauth.requestAccessToken({prompt:'select_account'});
    } catch { error('Не удалось начать вход Google. Проверьте настройки подключения.'); }
  }
  async function request(suffix='',options={}) {
    if (!connected()) throw Error('Подключитесь к Google Календарю.');
    const session=generation;
    const headers={Authorization:'Bearer '+token,...options.headers};
    if (options.body) headers['Content-Type']='application/json';
    let response;
    try { response=await fetch(base+suffix,{...options,headers,cache:'no-store',referrerPolicy:'strict-origin-when-cross-origin'}); }
    catch {throw Error('Google недоступен. Проверьте интернет и повторите.');}
    if (session!==generation) throw Error('Сеанс Google изменился.');
    if (response.ok) return response.status===204?null:response.json();
    if (response.status===401) clearSession();
    const errors={401:'Сеанс Google истёк. Подключитесь снова.',403:'Google отклонил запрос. Проверьте разрешение календаря, квоту и доступ приложения.',404:'Событие уже недоступно в Google.',410:'Событие удалено в Google.',412:'Событие изменилось в Google. Закройте редактор и откройте свежую версию.',429:'Google временно ограничил запросы. Повторите позже.'};
    throw Object.assign(Error(errors[response.status]||'Google не смог выполнить запрос.'),{status:response.status});
  }
  function clock(date) {return String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');}
  function fromGoogle(item) {
    const allDay=Boolean(item.start?.date);
    const a=new Date(item.start?.dateTime),b=new Date(item.end?.dateTime);
    if (!allDay && (!Number.isFinite(+a)||!Number.isFinite(+b))) return null;
    const inclusiveEnd=allDay?offset(item.end.date,-1):dateKey(new Date(Math.max(+a,+b-1)));
    return {id:item.id,title:item.summary||'Занято',day:allDay?item.start.date:dateKey(a),lastDay:inclusiveEnd,
      endDay:allDay?inclusiveEnd:dateKey(b),start:allDay?'':clock(a),end:allDay?'':clock(b),allDay,
      source:'google',editable:item.extendedProperties?.private?.founderUid===item.id && !item.recurrence && !item.recurringEventId,
      description:item.description||'',link:item.htmlLink||'',etag:item.etag};
  }
  async function events(start,end) {
    const params=new URLSearchParams({timeMin:new Date(start+'T00:00:00').toISOString(),timeMax:new Date(end+'T00:00:00').toISOString(),
      singleEvents:'true',orderBy:'startTime',maxResults:'250',fields:'nextPageToken,items(id,status,summary,start,end,htmlLink,description,etag,recurrence,recurringEventId,extendedProperties/private)'});
    const rows=[];const session=generation;
    do {
      if (session!==generation) throw Error('Сеанс Google изменился.');
      const page=await request('?'+params);
      for (const item of page.items||[]) {if (item.status!=='cancelled' && item.start && item.end) {const row=fromGoogle(item);if (row) rows.push(row);}}
      if (!page.nextPageToken) break;
      params.set('pageToken',page.nextPageToken);
    } while (true);
    return rows;
  }
  function resource(row) {
    const all=row.allDay;
    return {summary:row.title,description:row.description||'',
      start:all?{date:row.day}:{dateTime:new Date(row.day+'T'+row.start).toISOString()},
      end:all?{date:offset(row.endDay,1)}:{dateTime:new Date(row.endDay+'T'+row.end).toISOString()}};
  }
  async function put(row,original) {
    const body=resource(row);
    if (original?.source==='google') {
      if (row.allDay!==original.allDay) {
        for (const edge of [body.start,body.end]) {
          if (row.allDay) {edge.dateTime=null;edge.timeZone=null;}
          else edge.date=null;
        }
      }
      return fromGoogle(await request('/'+encodeURIComponent(row.id),{method:'PATCH',headers:{'If-Match':original.etag},body:JSON.stringify(body)}));
    }
    try {return fromGoogle(await request('',{method:'POST',body:JSON.stringify({...body,id:row.id,extendedProperties:{private:{founderUid:row.id}}})}));}
    catch (error) {
      if (error.status!==409) throw error;
      const existing=await request('/'+encodeURIComponent(row.id));
      if (existing.status==='cancelled' || existing.extendedProperties?.private?.founderUid!==row.id) throw Error('Google уже использует этот идентификатор. Создайте новое событие.');
      const previous=fromGoogle(existing);
      const same=['title','description','allDay','day','endDay','start','end'].every(key=>previous[key]===row[key]);
      if (!same) throw Error('В Google уже есть изменённая версия этого события. Проверьте её перед переносом.');
      return previous;
    }
  }
  async function erase(row) {
    try {await request('/'+encodeURIComponent(row.id),{method:'DELETE',headers:{'If-Match':row.etag}});}
    catch (error) {if (![404,410].includes(error.status)) throw error;}
  }
  return {clientId,setClient,loadLibrary,connected,connect,disconnect,events,put,erase};
}
