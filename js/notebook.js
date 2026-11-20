'use strict';

function createNotebook(data,{byId,external,onChange,onPlan,studio}) {
  const {kinds,list,save,remove,uid,dayLabel,dateOf,dateKey,esc,icon,notify,download,stem}=data;
  const dialog=document.getElementById('notebook-dialog');
  let query='', filter='', day='', editing=null;
  const prompts={
    story:['Разобрать идею','Какое решение из истории пригодится вам?'],
    failure:['Разобрать урок','Какое допущение оказалось ошибочным?'],
    book:['Записать идею','Какую мысль из книги вы сформулировали бы своими словами?'],
    video:['Идеи из видео','Первая идея из выпуска'],
    audio:['Идеи из аудио','Первая идея из выпуска']
  };
  function sourceLink(origin) {
    if (!origin || typeof origin.href!=='string') return '';
    if (/^#(?:read|audio|library|video)\//.test(origin.href)) return origin.href;
    return external(origin.href);
  }
  function sourceAddress(origin) {
    const link=sourceLink(origin);
    return link.startsWith('#')?new URL(link,location.href).href:link;
  }
  function sourceMarkup(origin) {
    const url=sourceLink(origin);if (!url) return '';
    return `<a class="entry-origin" href="${esc(url)}" ${url[0]==='#'?'':'target="_blank" rel="noopener noreferrer"'}>${icon('out')}<span>${esc([origin.title,origin.author].filter(Boolean).join(' · '))}</span></a>`;
  }
  function ideasText(row) {return [row.body,...(row.extraIdeas||[])].filter(Boolean).join('\n\n');}
  function entries() {
    return list('entry').filter(row=>Object.hasOwn(kinds,row.kind) && dateOf(row.day) && typeof row.body==='string')
      .sort((a,b)=>b.day.localeCompare(a.day) || String(b.created).localeCompare(String(a.created)) || b.id.localeCompare(a.id));
  }
  const find=id=>entries().find(row=>row.id===id);
  const normalize=s=>String(s||'').toLocaleLowerCase('ru').replaceAll('ё','е');
  function heading(row) {
    return row.title || row.book || (row.kind==='quote' && row.author) || row.body.split('\n')[0].slice(0,80) || kinds[row.kind].label;
  }
  function credit(row) {
    return [row.book && '«'+row.book+'»',row.author,row.source,row.page && 'с. '+row.page].filter(Boolean).join(' · ');
  }
  function entryCard(row) {
    const quoted=row.kind==='book'||row.kind==='quote';
    return `<article class="diary-entry entry-${row.kind}">
      <div class="entry-meta"><span>${icon(kinds[row.kind].icon)}${kinds[row.kind].label}</span><time datetime="${esc(row.day)}">${esc(dayLabel(row.day))}</time></div>
      ${row.title?`<h2>${esc(row.title)}</h2>`:''}
      ${quoted?`<blockquote>${esc(row.body)}</blockquote>`:`<p class="entry-body">${esc(ideasText(row))}</p>`}
      ${sourceMarkup(row.origin)}
      ${credit(row)?`<p class="entry-credit">${esc(credit(row))}</p>`:''}
      ${row.next?`<p class="entry-next"><b>Следующий шаг</b> ${esc(row.next)}</p>`:''}
      ${row.tags?.length?`<div class="entry-tags">${row.tags.map(tag=>`<span>#${esc(tag)}</span>`).join(' ')}</div>`:''}
      <div class="entry-actions"><button type="button" data-entry-edit="${esc(row.id)}">${icon('write')} Открыть запись</button>${row.next?`<button type="button" data-entry-plan="${esc(row.id)}">${icon('check')} В мой путь</button>`:''}<button type="button" data-entry-file="${esc(row.id)}" aria-label="Скачать оформленную запись в HTML — ${esc(heading(row))}">${icon('download')} Скачать .html</button></div></article>`;
  }
  function results() {
    const all=entries();
    const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
    const rows=all.filter(row=>{
      if ((filter && filter!==row.kind) || (day && day!==row.day)) return false;
      const hay=normalize([kinds[row.kind].label,row.title,ideasText(row),row.origin?.title,row.origin?.author,row.book,row.author,row.source,row.page,row.next,row.day,dayLabel(row.day),...(row.tags||[])].join(' '));
      return terms.every(term=>hay.includes(term.replace(/^#/,'')));
    });
    const box=document.getElementById('diary-results'); if (!box) return;
    const count=document.getElementById('diary-count');
    count.textContent='Записей: '+rows.length;
    if (rows.length) { box.innerHTML=rows.map(entryCard).join(''); return; }
    box.innerHTML=all.length && (terms.length||day||filter)
      ? `<div class="cab-empty">${icon('search')}<h2>Записей не найдено</h2><button type="button" class="text-link" data-entry-reset>Сбросить фильтры</button></div>`
      : `<div class="diary-first"><span class="diary-mark" aria-hidden="true">“</span><div><h2>Первая страница</h2><p>Какую мысль вы хотите запомнить?</p><div class="first-actions"><button type="button" data-entry-new="idea">${icon('bulb')} Записать идею</button><button type="button" data-entry-new="book">${icon('book')} Выписать цитату</button></div></div></div>`;
  }
  function view(selectedDay='') {
    day=dateOf(selectedDay)?selectedDay:'';
    return `<div class="page-main cabinet">${data.header('diary','Мой дневник','Идеи для дела, цитаты из книг и заметки по дням.',
      `<button class="button primary" data-entry-new="note">${icon('plus')} Новая запись</button>`)}
      <div class="diary-tools"><label class="cab-search">${icon('search')}<input type="search" id="diary-search" aria-label="Поиск по дневнику" placeholder="Найти мысль, книгу, автора или тег" value="${esc(query)}"></label>
      <div class="diary-filters" aria-label="Тип записи">${[['','Все записи'],...Object.entries(kinds).map(([key,x])=>[key,x.plural])].map(([key,label])=>`<button type="button" data-entry-filter="${key}" aria-pressed="${filter===key}">${label}</button>`).join('')}</div></div>
      <div class="diary-byline"><span role="status" id="diary-count"></span>${day?`<a class="day-chip" href="#saved/diary">${esc(dayLabel(day))} ×</a>`:''}<small>В этом браузере</small></div>
      <div id="diary-results" class="diary-list"></div></div>`;
  }
  function formField(label,name,value='',options={}) {
    return `<label class="cab-field" ${options.group?`data-entry-group="${options.group}"`:''}><span>${label}</span><input name="${name}" value="${esc(value)}" maxlength="${options.max||240}" ${options.required?'required':''} ${options.placeholder?`placeholder="${esc(options.placeholder)}"`:''}></label>`;
  }
  function open({id,kind='note',selectedDay,book,author,title,origin}={}) {
    const row=id?find(id):null;
    if (id&&!row) { notify('Запись уже удалена.'); return; }
    editing=row || {id:uid(),created:new Date().toISOString(),kind,day:selectedDay || day || dateKey(),book:book||'',author:author||'',title:title||'',origin,body:'',tags:[]};
    const e=editing;
    dialog.innerHTML=`<form id="notebook-form"><div class="dialog-head"><h2 id="notebook-title">${row?'Запись дневника':prompts[e.origin?.format]?.[0]||'Новая запись'}</h2><button type="button" class="icon-btn" data-entry-close aria-label="Закрыть редактор">${icon('close')}</button></div>
      <div class="cab-fields">${sourceMarkup(e.origin)}<div class="cab-pair"><label class="cab-field"><span>Что записываете?</span><select name="kind">${Object.entries(kinds).map(([k,v])=>`<option value="${k}" ${k===e.kind?'selected':''}>${v.label}</option>`).join('')}</select></label>
      <label class="cab-field"><span>Дата записи</span><input type="date" required name="day" value="${esc(e.day)}"></label></div>
      ${formField('Заголовок (по желанию)','title',e.title)}
      ${formField('Название книги','book',e.book,{group:'book',required:true})}
      <div class="cab-pair" data-entry-group="book quote">${formField('Автор','author',e.author)}${formField('Страница','page',e.page,{group:'book',max:40})}${formField('Источник','source',e.source,{group:'quote',placeholder:'Например, интервью'})}</div>
      <label class="cab-field"><span id="entry-body-label">Текст записи</span><textarea name="body" rows="5" required maxlength="60000">${esc(e.body)}</textarea></label>
      ${['video','audio'].includes(e.origin?.format)?`<details class="extra-ideas" ${e.extraIdeas?.some(Boolean)?'open':''}><summary>Ещё две идеи</summary>${formField('Вторая идея','idea2',e.extraIdeas?.[0],{max:1500})}${formField('Третья идея','idea3',e.extraIdeas?.[1],{max:1500})}</details>`:''}
      ${formField('Следующий шаг (по желанию)','next',e.next,{group:'idea',max:1000})}
      ${formField('Теги через запятую','tags',e.tags.join(', '),{placeholder:'переговоры, команда',max:400})}
      <p class="cab-hint">Запись сохранится в дневнике этого браузера.</p><p class="entry-feedback cab-hint" role="status"></p></div>
      <div class="cab-form-foot"><button class="button primary" type="submit">${icon('check')} Сохранить</button><button type="button" class="button secondary" data-entry-draft-file>${icon('download')} Скачать .txt</button>
      ${row?`<button type="button" class="cab-delete" data-entry-delete>Удалить</button>`:''}</div>
      ${row?`<div class="cab-confirm" hidden><p>Удалить эту запись из дневника?</p><button type="button" class="button secondary" data-entry-keep>Оставить</button><button type="button" class="button secondary" data-entry-delete-confirm>Удалить запись</button></div>`:''}
      ${row && (row.kind==='quote'||row.kind==='book') && row.body.length<=240?`<button type="button" class="text-link cab-to-card" data-entry-card>${icon('layers')} Оформить как карточку мысли</button>`:''}</form>`;
    setKind(); dialog.showModal();
    const target=!row && kind==='book' && !book?'book':'body';
    dialog.querySelector('[name='+target+']').focus();
  }
  function setKind() {
    const form=dialog.querySelector('form'), type=form.elements.kind.value;
    for (const group of form.querySelectorAll('[data-entry-group]')) {
      group.hidden=!group.dataset.entryGroup.split(' ').includes(type);
    }
    for (const field of form.querySelectorAll('[name]')) field.disabled=Boolean(field.closest('[hidden]'));
    dialog.querySelector('#entry-body-label').textContent={note:'Текст заметки',idea:prompts[editing.origin?.format]?.[1]||'В чём идея?',book:'Цитата из книги',quote:'Текст цитаты'}[type];
  }
  function formRow(form) {
    const f=new FormData(form), get=name=>String(f.get(name)||'').trim();
    return {id:editing.id,created:editing.created,day:get('day'),kind:get('kind'),title:get('title'),...(editing.origin?{origin:editing.origin,extraIdeas:[get('idea2'),get('idea3')]}:{}),body:String(f.get('body')||''),book:get('book'),author:get('author'),source:get('source'),page:get('page'),next:get('next'),tags:[...new Set(get('tags').split(',').map(s=>s.trim().replace(/^#+/,'')).filter(Boolean))]};
  }
  function exportRow(row) {
    const text=[row.title,kinds[row.kind].label+' · '+dayLabel(row.day),credit(row),row.origin&&[row.origin.title,row.origin.author,sourceAddress(row.origin)].filter(Boolean).join(' · '),ideasText(row),row.next && 'Следующий шаг\n'+row.next,row.tags?.length && row.tags.map(tag=>'#'+tag).join('  ')].filter(Boolean).join('\r\n\r\n');
    download(row.day+' — '+stem(heading(row))+'.txt','\uFEFF'+text);
  }

  function exportSheet(row) {
    const quoted=row.kind==='book'||row.kind==='quote', source=credit(row);
    const title=row.title||kinds[row.kind].label;
    const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'">
      <title>${esc(title)} · Мой дневник</title><style>
      *{box-sizing:border-box}html{background:#e7e0d1;color:#252920}body{max-width:800px;margin:5vw auto;padding:clamp(24px,7vw,72px);background:#faf6eb;border:1px solid #c9c1ac;font:17px/1.6 Georgia,serif;overflow-wrap:anywhere}
      header,footer{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 16px;border-bottom:1px solid #a5a28f;padding-bottom:12px}header b{font:bold 22px Georgia}header small,footer,aside b,time,.credit{font:14px/1.55 system-ui,sans-serif;color:#505746}h1{font-size:clamp(29px,5vw,52px);line-height:1.12;font-weight:500;letter-spacing:-.035em;margin:1em 0 .4em}blockquote,.body,aside p{white-space:pre-wrap;margin:1em 0}blockquote{font:italic clamp(22px,3.5vw,36px)/1.45 Georgia,serif}.credit{margin:1em 0;color:#655033}aside{margin-top:24px;border-left:3px solid #85916d;padding-left:15px}aside p{margin:4px 0}footer{border:0;border-top:1px solid #c9c1ac;padding-top:12px;margin-top:32px}
      @media print{@page{margin:18mm}html,body{background:#fff}body{margin:0;padding:0;border:0;max-width:none}header,footer{break-inside:avoid}}
      </style></head><body><header><b>FOUNDER.</b><small>Мой дневник</small></header><main><h1>${esc(title)}</h1><time datetime="${esc(row.day)}">${esc(dayLabel(row.day))}</time>
      ${quoted?`<blockquote>${esc(row.body)}</blockquote>`:`<p class="body">${esc(ideasText(row))}</p>`}${row.origin?`<p class="credit"><a href="${esc(sourceAddress(row.origin))}">${esc([row.origin.title,row.origin.author].filter(Boolean).join(' · '))}</a></p>`:''}${source?`<p class="credit">${esc(source)}</p>`:''}
      ${row.next?`<aside><b>Следующий шаг</b><p>${esc(row.next)}</p></aside>`:''}</main><footer><span>${kinds[row.kind].label}</span><span>${(row.tags||[]).map(tag=>'#'+esc(tag)).join(' · ')}</span></footer></body></html>`;
    download(row.day+' — '+stem(heading(row))+'.html',html,'text/html;charset=utf-8');
  }
  function syncVisible() {
    const search=document.getElementById('diary-search'); if (!search) return;
    search.value=query;
    document.querySelectorAll('[data-entry-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.entryFilter===filter));
    results();
  }
  dialog.addEventListener('change',e=>{if (e.target.name==='kind') setKind();});
  dialog.addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.target, row=formRow(form);
    if (!row.body.trim() || (row.kind==='book'&&!row.book) || !dateOf(row.day)) {
      const field=!row.body.trim()?'body':!dateOf(row.day)?'day':'book';
      form.elements[field].value=''; form.elements[field].reportValidity(); return;
    }
    if (!save('entry',row,editing.version)) {
      form.querySelector('.entry-feedback').textContent='Сохранение не удалось. Ваш текст остаётся здесь. Можно скачать копию.';
      return;
    }
    query='';filter='';syncVisible();onChange();
    if (row.origin && !editing.version) {
      dialog.innerHTML=`<div class="dialog-head"><h2 id="notebook-title">Вывод в дневнике</h2><button class="icon-btn" type="button" data-entry-close aria-label="Закрыть">${icon('close')}</button></div>
        <p>${esc(row.title||row.origin.title)}</p><div class="action-row">${row.next?`<button class="button primary" type="button" data-entry-plan="${esc(row.id)}">${icon('check')} Добавить шаг в «Мой путь»</button>`:''}<a class="button secondary" href="#saved/diary">Открыть дневник</a><button class="text-link" type="button" data-entry-close>Вернуться к материалу</button></div>`;
      dialog.querySelector('.action-row button,.action-row a')?.focus();
    } else {dialog.close();notify('Запись сохранена в дневнике');}
  });
  dialog.addEventListener('close',()=>{editing=null;});
  document.addEventListener('input',event=>{if (event.target.id==='diary-search') {query=event.target.value; results();}});
  document.addEventListener('click',event=>{
    const b=event.target.closest('button'); if (!b) return;
    const d=b.dataset;
    if (d.entryNew!==undefined) { open({kind:d.entryNew,selectedDay:d.day}); return; }
    if (d.bookQuote!==undefined) { const book=byId.get(d.bookQuote); if (book) open({kind:'book',book:book.title,author:book.author,selectedDay:dateKey()}); return; }
    if (d.entryPlan) {
      const row=find(d.entryPlan);
      if (row?.next) {
        onPlan({text:row.next,sourceId:'diary-'+row.id,sourceTitle:row.origin?.title||heading(row),href:sourceLink(row.origin)||'#saved/diary'});
        if (dialog.open && dialog.contains(b)) {b.disabled=true;b.textContent='В вашем плане';}
      }
      return;
    }
    if (d.entryEdit) { open({id:d.entryEdit}); return; }
    if (d.openBookQuote!==undefined) {open({kind:'book',book:d.openBookQuote,author:d.quoteAuthor,selectedDay:dateKey()});return;}
    if (d.entryFile) { const row=find(d.entryFile); if (row) exportSheet(row); return; }
    if (d.entryFilter!==undefined) { filter=d.entryFilter; syncVisible(); return; }
    if (d.entryReset!==undefined) { query='';filter=''; if (day) location.hash='saved/diary'; else syncVisible(); return; }
    if (!dialog.open || !dialog.contains(b)) return;
    if (d.entryClose!==undefined) dialog.close();
    else if (d.entryDraftFile!==undefined) exportRow(formRow(dialog.querySelector('form')));
    else if (d.entryDelete!==undefined) {dialog.querySelector('.cab-confirm').hidden=false;dialog.querySelector('[data-entry-keep]').focus();}
    else if (d.entryKeep!==undefined) {dialog.querySelector('.cab-confirm').hidden=true;dialog.querySelector('[data-entry-delete]').focus();}
    else if (d.entryDeleteConfirm!==undefined && remove('entry',editing)) {dialog.close();syncVisible();onChange();notify('Запись удалена');}
    else if (d.entryCard!==undefined) {const row=formRow(dialog.querySelector('form'));dialog.close();studio.open({quote:row.body,credit:credit(row)||row.title||'Из моего дневника'});}
  });
  return {view,entries,heading,results,syncVisible,
    fromMaterial(origin) {
      if (!prompts[origin?.format] || !sourceLink(origin)) return;
      open({kind:'idea',origin,selectedDay:dateKey(),title:origin.title});
    }
  };
}
