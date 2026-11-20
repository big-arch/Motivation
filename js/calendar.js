function createCabinetCalendar(data,notebook) {
  'use strict';
  const {esc,icon,dateKey,dateOf,offset,dayLabel,uid,list,save,remove,download,stem,notify}=data;
  const editor=document.getElementById('event-dialog'),settings=document.getElementById('calendar-settings');
  let day=dateKey(), remote=[], range='', loaded=0, busy=false, error='', serial=0, original=null, draftId='', sending=false;
  const google=createGoogleCalendar(data,()=>{serial++;range='';remote=[];busy=false;loaded=0;error='';paint();if (active() && google.connected()) refresh(true);});
  const embedKey='founder.calendar.embed.v1';
  function embedId() {try{return localStorage.getItem(embedKey)||'';} catch {return '';}}
  function active() {return Boolean(document.getElementById('cab-month'));}
  function days() {
    const date=dateOf(day),first=new Date(date.getFullYear(),date.getMonth(),1,12);
    const last=new Date(date.getFullYear(),date.getMonth()+1,0,12);
    const start=offset(dateKey(first),-((first.getDay()+6)%7)),end=offset(dateKey(last),7-((last.getDay()+6)%7));
    const rows=[];
    for (let value=start;value<end;value=offset(value,1)) rows.push(value);
    return {start,end,rows};
  }
  function records() {
    const local=list('event').filter(r=>dateOf(r.day)&&dateOf(r.endDay));
    return google.connected()?[...local,...remote]:local;
  }
  function view(selected) {
    if (dateOf(selected)) day=selected;
    return `<div class="page-main cabinet">${data.header('calendar','Мой календарь','Встречи, планы и записи дневника по дням.',
      `<div class="cab-head-actions"><button type="button" class="button primary" data-event-new>${icon('plus')} Новое событие</button><button type="button" class="text-link" data-google-jump>${icon('calendar')} Google Календарь</button></div>`)}
      <div class="calendar-layout"><section class="month-paper" aria-labelledby="month-title"><div class="month-head"><h2 id="month-title"></h2><div class="month-controls"><button type="button" data-month="-1" aria-label="Предыдущий месяц">${icon('back')}</button><button type="button" data-cal-today>Сегодня</button><button type="button" data-month="1" aria-label="Следующий месяц">${icon('arrow')}</button></div></div>
      <div class="month-week" aria-hidden="true">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(v=>'<span>'+v+'</span>').join('')}</div>
      <div class="month-grid" id="cab-month" role="group" aria-label="Выбор дня"></div><div class="month-legend"><span><i></i> Событие</span><span><i></i> Дневник</span></div></section>
      <section class="day-desk" id="cab-agenda" aria-label="Расписание выбранного дня"></section></div>
      <section id="google-calendar-panel" class="google-panel" tabindex="-1" aria-label="Google Календарь"></section>
      <div id="calendar-embed"></div></div>`;
  }
  function monthPart() {
    const month=dayLabel(day,{month:'long',year:'numeric'}).replace(/\s*г\.$/,'');
    document.getElementById('month-title').textContent=month.charAt(0).toUpperCase()+month.slice(1);
    const rows=records(), notes=new Set(notebook.entries().map(n=>n.day)),today=dateKey(),prefix=day.slice(0,7);
    document.getElementById('cab-month').innerHTML=days().rows.map(value=>{
      const event=rows.some(r=>r.day<=value&&r.lastDay>=value),note=notes.has(value);
      return `<button type="button" class="month-day${value.startsWith(prefix)?'':' outside'}${value===today?' is-today':''}" data-cal-day="${value}" aria-pressed="${value===day}" tabindex="${value===day?'0':'-1'}" ${value===today?'aria-current="date"':''} aria-label="${esc(dayLabel(value))}${event?', есть события':''}${note?', есть записи дневника':''}"><span>${Number(value.slice(-2))}</span><small aria-hidden="true">${event?'<i></i>':''}${note?'<i class="note-dot"></i>':''}</small></button>`;
    }).join('');
  }
  function timeLabel(row) {
    if (row.allDay) return 'Весь день';
    if (row.day===row.endDay) return row.start+'–'+row.end;
    if (day===row.day) return 'с '+row.start;
    if (day===row.endDay) return 'до '+row.end;
    return 'Весь день';
  }
  function googleLink(url) {
    try {const u=new URL(url);return u.protocol==='https:' && ['www.google.com','calendar.google.com'].includes(u.hostname)?u.href:'';} catch {return '';}
  }
  function agendaPart() {
    const rows=records().filter(r=>r.day<=day && r.lastDay>=day).sort((a,b)=>Number(b.allDay)-Number(a.allDay) || (a.start||'').localeCompare(b.start||'') || a.title.localeCompare(b.title));
    const notes=notebook.entries().filter(row=>row.day===day);
    document.getElementById('cab-agenda').innerHTML=`<div class="desk-date"><span>${esc(dayLabel(day,{weekday:'long'}))}</span><h2>${esc(dayLabel(day,{day:'numeric',month:'long'}))}</h2></div>
      <div class="desk-group"><h3>События <small>${rows.length}</small></h3>
      ${rows.length?rows.map(r=>{
        const label=`<small>${esc(timeLabel(r))} · ${r.source==='google'?'Google':'В этом браузере'}</small><strong>${esc(r.title)}</strong>`;
        const url=googleLink(r.link);
        if (r.source==='google'&&!r.editable) return url?`<a class="desk-row" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><span>${label}</span>${icon('out')}</a>`:`<p class="desk-row"><span>${label}</span></p>`;
        return `<button type="button" class="desk-row" data-event-edit="${esc(r.id)}" data-event-origin="${esc(r.source)}"><span>${label}</span>${icon('write')}</button>`;
      }).join(''):'<p>На этот день пока нет событий.</p>'}
      <button type="button" class="text-link" data-event-new>${icon('plus')} Добавить событие</button></div>
      <div class="desk-group"><h3>Дневник <small>${notes.length}</small></h3>${notes.length?notes.map(n=>`<button type="button" class="desk-row" data-entry-edit="${esc(n.id)}"><span><small>${data.kinds[n.kind].label}</small><strong>${esc(notebook.heading(n))}</strong></span>${icon('arrow')}</button>`).join(''):'<p>Здесь появятся записи с этой датой.</p>'}
      <button type="button" class="text-link" data-entry-new="note" data-day="${day}">${icon('write')} Записать мысль</button>
      ${notes.length?`<a class="text-link" href="#saved/diary/${day}">За день в дневнике ${icon('arrow')}</a>`:''}</div>`;
  }
  function googlePart() {
    const online=google.connected(),configured=Boolean(google.clientId()),embedded=Boolean(embedId());
    const status=online ? (error || (busy?'Обновляем события…':loaded?'Обновлено в '+new Date(loaded).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):'Читаем события…'))
      : configured?'Подключите основной календарь, чтобы видеть встречи и менять события FOUNDER с обеих сторон.':'Можно открыть свой календарь Google здесь или перенести в него отдельное событие.';
    document.getElementById('google-calendar-panel').innerHTML=`<div class="google-intro"><span class="cab-symbol">${icon('calendar')}</span><div><h2>Google Календарь</h2><p role="status">${esc(status)}</p></div></div><div class="google-actions">
      ${online?`<button class="button secondary" data-google-refresh>${icon('refresh')} Обновить</button><button class="text-link" data-google-disconnect>Отключить</button>`:
        configured?'<button class="button secondary" data-google-connect>Подключить Google</button>':`<button class="button secondary" data-google-settings>${icon('calendar')} ${embedded?'Изменить календарь':'Показать мой календарь'}</button>`}
      ${online||configured?'<button class="text-link" data-google-settings>Настройки</button>':'<button class="text-link" data-google-config>Настроить синхронизацию</button>'}</div>`;
  }
  function paint() {
    if (!active()) return;
    const focusDay=document.activeElement?.dataset.calDay;
    monthPart();agendaPart();googlePart();
    if (focusDay) document.querySelector('[data-cal-day="'+focusDay+'"]')?.focus({preventScroll:true});
  }
  function showEmbed() {
    const box=document.getElementById('calendar-embed'); if (!box) return;
    const id=embedId();
    if (!id) {box.replaceChildren();return;}
    const params=new URLSearchParams({src:id,ctz:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',hl:'ru',wkst:'2',showPrint:'0',showTabs:'1',showTitle:'0',mode:'MONTH'});
    box.innerHTML=`<details class="embed-block" open><summary>Календарь в Google</summary><p>Приватные события видны, когда Google узнаёт ваш аккаунт. <a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noopener noreferrer">Открыть в Google ↗</a></p><iframe title="Мой календарь в Google" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" src="https://calendar.google.com/calendar/embed?${esc(params.toString())}"></iframe></details>`;
  }
  async function refresh(force=false) {
    if (!active() || !google.connected()) return;
    const {start,end}=days(),key=start+'/'+end;
    if (key===range && (busy || (!force && loaded && Date.now()-loaded<90000))) return;
    const request=++serial;
    if (key!==range) remote=[];
    range=key;busy=true;error='';paint();
    try {
      const rows=await google.events(start,end);
      if (request===serial) {remote=rows;loaded=Date.now();}
    } catch (e) {if (request===serial) {error=e.message;loaded=0;}}
    finally {if (request===serial) {busy=false;paint();}}
  }
  function mount() {
    if (!active()) return;
    if (google.clientId()) google.loadLibrary().catch(()=>{});
    paint();showEmbed();refresh();
  }
  function pick(value,focus=false) {
    if (!dateOf(value)) return;
    day=value;
    history.replaceState(history.state,'','#saved/calendar/'+day);
    paint();refresh();
    if (focus) document.querySelector('[data-cal-day="'+day+'"]')?.focus({preventScroll:true});
  }
  function shiftMonth(delta) {
    const d=dateOf(day),first=new Date(d.getFullYear(),d.getMonth()+delta,1,12),last=new Date(first.getFullYear(),first.getMonth()+1,0,12);
    first.setDate(Math.min(d.getDate(),last.getDate()));pick(dateKey(first));
  }
  function openSettings(advanced=false) {
    const id=embedId();
    settings.innerHTML=`<div class="dialog-head"><h2 id="calendar-settings-title">Google Календарь</h2><button type="button" class="icon-btn" data-cal-close aria-label="Закрыть настройки">${icon('close')}</button></div>
      <form class="cab-fields" id="embed-form"><label class="cab-field"><span>Адрес календаря для просмотра</span><input name="address" type="email" maxlength="320" value="${esc(id)}" placeholder="name@gmail.com"></label>
      <p class="cab-hint">Для основного календаря введите адрес Gmail. Для другого — его идентификатор из настроек Google. Просмотр использует вашу сессию Google.</p>
      <div class="action-row"><button class="button secondary" type="submit">Показать в FOUNDER</button>${id?'<button type="button" class="text-link" data-embed-remove>Убрать с экрана</button>':''}</div></form>
      <details class="cal-advanced" ${advanced?'open':''}><summary>Двусторонняя синхронизация</summary>
      <p>Чтобы читать события и сохранять изменения в основном календаре, сайту нужен OAuth Client ID. Владелец сайта может подключить его для всех посетителей.</p>
      <form id="google-client-form"><label class="cab-field"><span>Публичный Client ID для этого браузера</span><input name="client" value="${esc(google.clientId())}" placeholder="…apps.googleusercontent.com" autocomplete="off" spellcheck="false"></label>
      <p class="cab-hint">В Google Cloud включите Calendar API и создайте клиент типа «Веб-приложение». В разрешённых источниках JavaScript укажите <code>${esc(location.origin)}</code>. <a target="_blank" rel="noopener noreferrer" href="https://developers.google.com/workspace/calendar/api/quickstart/js">Инструкция Google ↗</a></p>
      <button type="submit" class="button secondary">Сохранить настройку</button></form></details>`;
    settings.showModal();(advanced?settings.querySelector('[name=client]'):settings.querySelector('[name=address]')).focus();
  }
  function formState() {
    const form=editor.querySelector('form'),f=new FormData(form),get=k=>String(f.get(k)||'').trim();
    const allDay=form.elements.allDay.checked;
    const d=get('day'),endDay=get('endDay');
    const end=allDay?'':get('end'),start=allDay?'':get('start');
    const lastDay=!allDay && end==='00:00' && endDay>d?offset(endDay,-1):endDay;
    return {id:draftId,title:get('title'),day:d,endDay,lastDay,start,end,allDay,description:get('description'),source:get('where')||'local'};
  }
  function feedback(message) {const el=editor.querySelector('.event-feedback');if (el) el.textContent=message;}
  function formTimes() {
    const f=editor.querySelector('form');
    for (const name of ['start','end']) {const field=f.elements[name];field.disabled=f.elements.allDay.checked;field.closest('label').hidden=field.disabled;}
  }
  function openEvent(id,source) {
    original=id?records().find(r=>r.id===id && r.source===source):null;
    if (id && (!original || (original.source==='google'&&!original.editable))) return;
    draftId=original?.id||uid();
    const r=original||{day,endDay:day,allDay:false,start:'09:00',end:'10:00',title:'',description:'',source:'local'};
    const optionGoogle=google.connected()||r.source==='google';
    editor.innerHTML=`<form><div class="dialog-head"><h2 id="event-title">${original?'Событие':'Новое событие'}</h2><button type="button" class="icon-btn" data-cal-close aria-label="Закрыть событие">${icon('close')}</button></div>
      <div class="cab-fields"><label class="cab-field"><span>Название события</span><input name="title" value="${esc(r.title)}" maxlength="500" required placeholder="Например, встреча с командой"></label>
      <label class="cab-check"><input type="checkbox" name="allDay" ${r.allDay?'checked':''}> Весь день</label>
      <div class="cab-pair"><label class="cab-field"><span>Дата начала</span><input name="day" value="${r.day}" type="date" required></label><label class="cab-field"><span>Дата окончания</span><input name="endDay" value="${r.endDay}" type="date" required></label></div>
      <div class="cab-pair"><label class="cab-field"><span>С</span><input name="start" value="${esc(r.start||'09:00')}" type="time" required></label><label class="cab-field"><span>До</span><input name="end" value="${esc(r.end||'10:00')}" type="time" required></label></div>
      <label class="cab-field"><span>Описание (по желанию)</span><textarea name="description" rows="2" maxlength="8000">${esc(r.description)}</textarea></label>
      <label class="cab-field"><span>Где сохранить</span><select name="where">${r.source!=='google'?'<option value="local">В этом браузере</option>':''}${optionGoogle?`<option value="google" ${r.source==='google'?'selected':''}>В Google Календаре</option>`:''}</select></label>
      <p class="event-feedback" role="status"></p></div>
      <div class="cab-form-foot"><button type="submit" class="button primary">${icon('check')} Сохранить</button><button type="button" class="button secondary" data-event-ics>${icon('download')} Скачать .ics</button>
      ${original?'<button type="button" class="cab-delete" data-event-delete>Удалить</button>':''}</div>
      ${r.source==='google'?'':`<button type="button" class="text-link cab-to-card" data-event-template>Открыть форму в Google ${icon('out')}</button>`}
      <div class="cab-confirm" hidden><p>Удалить событие${r.source==='google'?' из Google Календаря':''}?</p><button type="button" class="button secondary" data-event-keep>Оставить</button><button type="button" class="button secondary" data-event-delete-confirm>Удалить событие</button></div></form>`;
    formTimes();editor.showModal();editor.querySelector('[name=title]').focus();
  }
  function valid() {
    const form=editor.querySelector('form');if (!form.reportValidity()) return null;
    const r=formState();
    if (!r.title) {form.elements.title.value='';form.elements.title.reportValidity();return null;}
    if (!dateOf(r.day)||!dateOf(r.endDay)||r.endDay<r.day||(!r.allDay && new Date(r.endDay+'T'+r.end)<=new Date(r.day+'T'+r.start))) {feedback('Окончание должно быть позже начала.');return null;}
    if (!r.allDay) {
      const exists=(value,time)=>{
        const date=new Date(value+'T'+time);
        const clock=String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
        return dateKey(date)===value && clock===time;
      };
      if (!exists(r.day,r.start)||!exists(r.endDay,r.end)) {feedback('Такого времени нет в вашем часовом поясе в этот день. Выберите другой час.');return null;}
    }
    return r;
  }
  function timeRange(r) {
    const dayOnly=d=>d.replaceAll('-','');
    const stamp=d=>d.toISOString().replace(/[-:]|\.\d{3}/g,'');
    return r.allDay?[dayOnly(r.day),dayOnly(offset(r.endDay,1))]:[stamp(new Date(r.day+'T'+r.start)),stamp(new Date(r.endDay+'T'+r.end))];
  }
  function ics(r) {
    const escape=s=>String(s).replaceAll('\\','\\\\').replace(/\r\n|\r|\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
    const row=(name,val)=>name+':'+escape(val);
    function fold(line) {
      let folded='',size=0;
      for (const letter of line) {const n=new TextEncoder().encode(letter).length;if (size+n>75) {folded+='\r\n ';size=1;}folded+=letter;size+=n;}
      return folded;
    }
    const [a,b]=timeRange(r),suffix=r.allDay?';VALUE=DATE':'';
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FOUNDER//Calendar//RU','CALSCALE:GREGORIAN','BEGIN:VEVENT',row('UID',r.id+'@founder'),row('DTSTAMP',new Date().toISOString().replace(/[-:]|\.\d{3}/g,'')),row('DTSTART'+suffix,a),row('DTEND'+suffix,b),row('SUMMARY',r.title),row('DESCRIPTION',r.description),'END:VEVENT','END:VCALENDAR'];
    download(r.day+' — '+stem(r.title)+'.ics',lines.map(fold).join('\r\n')+'\r\n','text/calendar;charset=utf-8');
  }
  function template(r) {
    const params=new URLSearchParams({action:'TEMPLATE',text:r.title,dates:timeRange(r).join('/'),details:r.description,ctz:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'});
    window.open('https://calendar.google.com/calendar/render?'+params,'_blank','noopener,noreferrer');
  }
  function working(value) {
    sending=value;
    editor.querySelectorAll('button').forEach(b=>{b.disabled=value;});
    if (value) feedback('Сохраняем изменения…');
  }
  async function commit(deleting=false) {
    if (sending) return;
    const r=deleting?original:valid();if (!r) return;
    working(true);
    try {
      if (r.source==='google') {
        if (deleting) {await google.erase(original);remote=remote.filter(item=>item.id!==r.id);}
        else {
          const result=await google.put(r,original);
          remote=[...remote.filter(item=>item.id!==r.id),result];
          if (original?.source==='local'&&!remove('event',original)) {feedback('Событие есть в Google. Локальная запись изменилась в другой вкладке.');return;}
        }
        serial++;busy=false;loaded=0;
      } else if (!(deleting?remove('event',original):save('event',r,original?.version))) {feedback('Изменения не сохранены. Можно скачать событие.');return;}
      editor.close();if (active()) pick(deleting?day:r.day);
      notify(deleting?'Событие удалено':r.source==='google'?'Событие сохранено в Google':'Событие сохранено в этом браузере');
    } catch (e) {feedback(e.message);if ([404,410,412].includes(e.status)) refresh(true);}
    finally {working(false);}
  }
  editor.addEventListener('submit',e=>{e.preventDefault();commit();});
  editor.addEventListener('cancel',e=>{if (sending) e.preventDefault();});
  editor.addEventListener('change',e=>{
    const f=e.target.form;
    if (e.target.name==='allDay') formTimes();
    if (e.target.name==='day' && f.elements.endDay.value<e.target.value) f.elements.endDay.value=e.target.value;
    feedback('');
  });
  settings.addEventListener('submit',e=>{
    e.preventDefault(); const form=e.target;
    try {
      if (form.id==='embed-form') {
        const address=form.elements.address; if (!address.value.trim()) {address.required=true;address.reportValidity();return;}
        localStorage.setItem(embedKey,address.value.trim());
      } else {google.setClient(form.elements.client.value);if (google.clientId()) google.loadLibrary().catch(err=>notify(err.message));}
      settings.close();paint();showEmbed();notify('Настройки календаря сохранены');
    } catch (err) {notify(err.message);}
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if (!b) return;
    const d=b.dataset;
    if (d.calDay) pick(d.calDay,true);
    else if (d.month) shiftMonth(Number(d.month));
    else if (d.calToday!==undefined) pick(dateKey(),true);
    else if (d.eventNew!==undefined) openEvent();
    else if (d.eventEdit) openEvent(d.eventEdit,d.eventOrigin);
    else if (d.googleJump!==undefined) {const panel=document.getElementById('google-calendar-panel');panel.focus({preventScroll:true});panel.scrollIntoView({block:'center'});}
    else if (d.googleSettings!==undefined || d.googleConfig!==undefined) openSettings(d.googleConfig!==undefined);
    else if (d.googleConnect!==undefined) google.connect();
    else if (d.googleRefresh!==undefined) refresh(true);
    else if (d.googleDisconnect!==undefined) {google.disconnect();notify('Календарь Google отключён');}
    else if (d.embedRemove!==undefined) {try {localStorage.removeItem(embedKey);settings.close();showEmbed();paint();} catch {notify('Браузер запретил изменение настроек.');}}
    else if (d.calClose!==undefined) b.closest('dialog').close();
    else if (d.eventIcs!==undefined || d.eventTemplate!==undefined) {const r=valid();if (r) (d.eventIcs!==undefined?ics:template)(r);}
    else if (d.eventDelete!==undefined) {editor.querySelector('.cab-confirm').hidden=false;editor.querySelector('[data-event-keep]').focus();}
    else if (d.eventKeep!==undefined) {editor.querySelector('.cab-confirm').hidden=true;editor.querySelector('[data-event-delete]').focus();}
    else if (d.eventDeleteConfirm!==undefined) commit(true);
  });
  document.addEventListener('keydown',e=>{
    const b=e.target.closest('[data-cal-day]');if (!b || e.altKey || e.ctrlKey || e.metaKey) return;
    const move={ArrowRight:1,ArrowLeft:-1,ArrowUp:-7,ArrowDown:7,Home:-((dateOf(day).getDay()+6)%7),End:6-((dateOf(day).getDay()+6)%7)};
    if (Object.hasOwn(move,e.key)) {e.preventDefault();pick(offset(b.dataset.calDay,move[e.key]),true);}
  });
  function refreshWhenVisible() {if (active()&&!document.hidden) refresh();}
  document.addEventListener('visibilitychange',refreshWhenVisible);
  window.addEventListener('online',refreshWhenVisible);
  window.setInterval(refreshWhenVisible,90000);
  return {view,mount,paint};
}
