/* Publisher notes and an extractive reading of reader-supplied subtitles stay separate. */
function videoExcerpt(text,limit=4) {
  const stop = new Set('это что как для или есть так этом этих они она его при чем уже все ещё был было вот когда после the and that for with from this you your have they are was were will about into can but'.split(' '));
  const cleaned = text.slice(0,180000).replace(/^WEBVTT.*$|^\d+\s*$|^[\d:.,]+\s+-->.*$|^\s*(?:\d+:)?\d+:\d+(?:[.,]\d+)?\s*$/gm,' ')
    .replace(/<[^>]{1,160}>|\[(?:музыка|music|аплодисменты|applause)\]|>>/gi,' ').trim();
  const parts = cleaned.match(/[^.!?…]+(?:[.!?…]+|$)/gu) || [];
  let sentences = parts.map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>=18 && x.length<=650);
  if (!sentences.length) sentences=cleaned.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.length>=18 && x.length<=650);
  sentences=[...new Set(sentences)];
  // A bounded sample spans the entire interview, including its closing minutes.
  if (sentences.length>140) sentences=Array.from({length:140},(_,i)=>sentences[Math.round(i*(sentences.length-1)/139)]);
  const words=sentences.map(s=>new Set((s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]).filter(w=>!stop.has(w))));
  const graph=words.map((terms,i)=>words.map((other,j)=>{
    if(i===j || !terms.size || !other.size) return 0;
    let shared=0;
    for(const term of terms) if(other.has(term)) shared++;
    return shared/Math.sqrt(terms.size*other.size);
  }));
  const totals=graph.map(row=>row.reduce((a,b)=>a+b,0));
  let ranks=sentences.map(()=>1);
  for(let pass=0;pass<10;pass++) ranks=graph.map((row,i)=>0.15+0.85*row.reduce((sum,weight,j)=>sum+(totals[j]?weight*ranks[j]/totals[j]:0),0));
  const best=sentences.map((s,i)=>i).sort((a,b)=>ranks[b]-ranks[a]);
  const chosen=[];
  for(const index of best) {
    if(chosen.every(other=>graph[index][other]<0.72)) chosen.push(index);
    if(chosen.length===limit) break;
  }
  return chosen.sort((a,b)=>a-b).map(i=>sentences[i]);
}

function createVideoGuide({esc,external,icon}) {
  let library, latestLibrary, checked=0, lastDraft='', worker;
  const sourceText=new WeakMap();
  function stop() {
    worker?.terminate();
    worker=null;
  }
  function clock(sec) {
    const h=Math.floor(sec/3600), m=Math.floor(sec/60)%60, s=String(sec%60).padStart(2,'0');
    return h?h+':'+String(m).padStart(2,'0')+':'+s:m+':'+s;
  }
  function timeLink(value,label='') {
    if (!Number.isSafeInteger(value)||value<0) return '';
    return '<button class="guide-time" type="button" data-guide-time="'+value+'" aria-label="Воспроизвести с '+clock(value)+'">'+clock(value)+(label?' · '+esc(label):'')+'</button>';
  }
  function resource(label,url) {
    const href=external(url);
    return href?'<li><a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a></li>':'';
  }
  const basisLabels={outline:'Ключевые фрагменты из материалов автора',asr:'По автоматическим субтитрам',transcript:'По субтитрам автора',publisher:'По материалам издателя',notes:'По описанию и главам автора'};
  function draw(host,item,entry) {
    const guide=item.guide||{};
    const fullChapters=guide.chapters||[];
    const short=item.format==='shorts'||(item.platform==='rutube' && item.duration>0 && item.duration<=180);
    const ownChapters=short && fullChapters.some(([s])=>s>=(item.duration||180))?[]:fullChapters;
    const chapters=ownChapters.filter(([s])=>Number.isSafeInteger(s)&&s>=0&&(!item.duration||s<item.duration));
    const profile=creatorProfiles.find(p=>p.episode.platform===item.platform && p.episode.id===item.id);
    const boilerplate=/настоящий материал.{0,110}произвед|иностранн\S* агент|смотрите полный выпуск|полный выпуск.{0,30}(?:ссылк|канал)|check out (?:the|my|our)|wherever you get your podcasts|watch the full/i;
    const outline=(guide.notes||profile?.intro||'').split(/(?<=[.!?])\s+/).filter(s=>!boilerplate.test(s)).join(' ');
    const excerpts=outline?videoExcerpt(outline):[];
    const lead=entry?.summary || excerpts[0] || (outline && outline.length<=350?outline:'');
    const keyPoints=entry?.points||[];
    const authorLinks=(guide.links||[]).map(([label,url])=>resource(label,url)).join('');
    const mentioned=(entry?.resources||[]).filter(ref=>ref.kind==='mentioned').map(ref=>{
      const href=external(ref.url);
      return href?'<li><a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(ref.label)+' ↗</a> '+timeLink(ref.start)+'</li>':'';
    }).join('');
    const extraLinks=(entry?.resources||[]).filter(ref=>ref.kind!=='mentioned').map(ref=>resource(ref.label,ref.url)).join('');
    const related=profile?'<li><a href="#video/authors/'+encodeURIComponent(profile.handle)+'" data-guide-related>Книги и материалы из гида по автору →</a></li>':'';
    lastDraft=entry?[entry.summary,...keyPoints.map(p=>p.text+(Number.isSafeInteger(p.start)?' ('+clock(p.start)+')':'')),entry.practice||''].filter(Boolean).join('\n\n'):'';
    sourceText.set(host,[outline,...chapters.map(([s,label])=>clock(s)+' '+label)].filter(Boolean).join('\n'));
    host.innerHTML='<div class="guide-heading"><h3>'+(entry?.basis==='outline'?'ИИ-выжимка':entry?'ИИ-разбор':'О выпуске')+'</h3><small>'+esc(basisLabels[entry?.basis] || (chapters.length?'Главы автора':lead?'Описание автора':'Источник выпуска'))+'</small></div>'+
      (lead?'<p class="guide-lead">'+esc(lead)+(Number.isSafeInteger(entry?.start)?' '+timeLink(entry.start):'')+'</p>':!chapters.length?'<p class="guide-muted">Для пересказа нужна речь из выпуска. Можно вставить текст субтитров ниже.</p>':'')+
      (!entry && excerpts.length>1?'<details class="guide-fold"><summary>Ключевые фрагменты описания</summary><ul>'+excerpts.slice(1,4).map(line=>'<li>'+esc(line)+'</li>').join('')+'</ul></details>':'')+
      (keyPoints.length?'<h4>'+(entry.basis==='outline'?'На что обратить внимание':'Выводы')+'</h4><ul class="guide-points">'+keyPoints.map(p=>'<li>'+esc(p.text)+' '+timeLink(p.start)+'</li>').join('')+'</ul>':'')+
      (chapters.length?'<details class="guide-fold"><summary>Главы и таймкоды <small>'+chapters.length+'</small></summary><ol class="guide-chapters">'+chapters.map(([s,title])=>'<li>'+timeLink(s)+' <span>'+esc(title)+'</span></li>').join('')+'</ol></details>':'')+
      '<details class="guide-fold"><summary>Источники и ссылки</summary><h4>Первоисточник</h4><ul>'+resource(item.source+' · оригинал выпуска',item.url)+'</ul>'+
      (mentioned?'<h4>Упомянуто в выпуске</h4><ul>'+mentioned+'</ul>':'')+
      (authorLinks?'<h4>В описании у автора</h4><ul>'+authorLinks+'</ul>':'')+
      (extraLinks||related?'<h4>Для дальнейшего чтения</h4><ul>'+extraLinks+related+'</ul>':'')+'</details>'+
      (entry?.practice?'<div class="guide-practice"><h4>Вопрос для дневника</h4><p>'+esc(entry.practice)+'</p></div>':'')+
      (entry?'<button class="button secondary" type="button" data-guide-note>'+icon('write')+' Сохранить разбор в дневник</button>':'')+
      (!entry && sourceText.get(host)?.length>=65?localModel(false):'')+
      '<details class="guide-fold guide-input"><summary>Сделать выжимку из своих субтитров</summary><label>Текст расшифровки<textarea rows="5" maxlength="180000" placeholder="Вставьте речь или субтитры в формате SRT или VTT"></textarea></label><small>Текст обрабатывается в этом браузере.</small><button class="button secondary" type="button" data-guide-extract>Выделить главное</button><div class="guide-result" role="status"></div>'+localModel(true)+'</details>';
  }
  function localModel(personal) {
    return '<details class="guide-fold guide-model"><summary>Выделить главное с ИИ на устройстве</summary><p class="guide-muted">'+(personal?'Модель выбирает ключевые фрагменты из ваших субтитров.':'Модель выбирает ключевые фрагменты из глав и описания автора.')+' При первом запуске браузер скачает модель объёмом около 120 МБ. Текст обрабатывается на устройстве.</p><button type="button" class="button secondary" data-guide-generate>Запустить ИИ</button> <button type="button" class="button secondary" data-guide-cancel hidden>Отменить</button><div class="guide-result" role="status"></div></details>';
  }
  function generate(button,item) {
    const pane=button.closest('.guide-model'), host=button.closest('.video-guide'), input=pane.closest('.guide-input');
    const result=pane.querySelector('.guide-result'),cancel=pane.querySelector('[data-guide-cancel]');
    const text=(input?input.querySelector('textarea').value:sourceText.get(host)||'').trim();
    if(text.length<65){result.textContent='Добавьте текст речи хотя бы из нескольких фраз.';return;}
    const context=text;
    if(worker){result.textContent='Дождитесь текущего разбора или отмените его.';return;}
    button.disabled=true; cancel.hidden=false;
    result.textContent='Загружаем модель…';
    function finish(message) {
      stop();button.disabled=false;cancel.hidden=true;result.textContent=message;
    }
    cancel.onclick=()=>finish('Обработка остановлена.');
    try {
      worker=new Worker(new URL('./js/video-model-worker.js',document.baseURI),{type:'module'});
      worker.onerror=()=>finish('Браузеру не удалось запустить модель. Доступна выжимка из текста субтитров.');
      worker.onmessage=({data})=>{
        if(data.answer) {
          finish('');
          const copy=document.createElement('p');
          copy.textContent=data.answer;result.append(copy);
          result.dataset.draft=data.answer;
          const save=document.createElement('button');
          save.type='button';save.className='button secondary';save.dataset.guideExtractNote='';save.textContent='В дневник';result.append(save);
        } else if(data.error) finish('Не удалось запустить модель. Проверьте подключение и доступную память устройства.');
        else if(data.running) result.textContent='Модель отбирает ключевые фрагменты…';
        else if(Number.isFinite(data.progress)) result.textContent='Загрузка модели · '+data.progress+' %';
      };
      const fragments=videoExcerpt(context,28);
      worker.postMessage({title:item.title,source:input?'Субтитры читателя':'Описание и главы автора',fragments:fragments.length?fragments:[context.slice(0,650)]});
    } catch { finish('Браузеру не удалось запустить модель.'); }
  }
  async function mount(host,item) {
    stop();
    lastDraft='';
    try {
      if(!latestLibrary || Date.now()-checked>=30*60000) {
        library ||= fetch('./data/video-analysis.json',{cache:'no-cache'}).then(async response=>{
          if(!response.ok) throw Error();
          const data=await response.json();
          if(!data || !Object.keys(data).length) throw Error();
          latestLibrary=data;checked=Date.now();
        }).finally(()=>{library=null;});
        await library;
      }
      const entries=latestLibrary;
      if(host.isConnected) draw(host,item,entries[item.platform+':'+item.id]);
    } catch {
      library=null;
      if(host.isConnected) draw(host,item,latestLibrary?.[item.platform+':'+item.id]);
    }
  }
  function extract(button) {
    const area=button.closest('.guide-input'), result=area.querySelector('.guide-result');
    const lines=videoExcerpt(area.querySelector('textarea').value);
    if(!lines.length){result.textContent='Добавьте несколько законченных фраз из выпуска.';return;}
    result.innerHTML='<h4>Ключевые фрагменты вашего текста</h4><ul>'+lines.map(line=>'<li>'+esc(line)+'</li>').join('')+'</ul><button class="button secondary" type="button" data-guide-extract-note>В дневник</button>';
    result.dataset.draft=lines.join('\n\n');
  }
  return {mount,extract,generate,stop,draft:()=>lastDraft};
}
