function createAudioLibrary({esc, icon, external, readState, writeState, notify, onPlan, onChange}) {
  const dialog = document.getElementById('audio-dialog');
  const detail = document.getElementById('audio-detail');
  const dock = document.getElementById('audio-dock');
  const engine = document.getElementById('audio-engine');
  const feeds = {audio:{updated:null,items:[],sources:[]}, 'open-books':{updated:null,items:[],sources:[]}};
  const filters = {};
  const labels = {lectures:'Лекции', podcasts:'Подкасты', audiobooks:'Аудиокниги', 'open-books':'Открытая полка'};
  const pageSize = 9;
  const day = 86400000;
  let currentKind = 'lectures';
  let current = null;
  let sleepTimer = null;
  let lastPersist = 0;
  const displayTime = new Intl.DateTimeFormat('ru-RU', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const services = [
    {platform:'Spotify', title:'HBR IdeaCast', description:'Официальное шоу Harvard Business Review. Новые выпуски появляются внутри виджета.', url:'https://open.spotify.com/show/4gtSBBxIAE142ApX6LqsvN', embed:'https://open.spotify.com/embed/show/4gtSBBxIAE142ApX6LqsvN?utm_source=generator', height:352},
    {platform:'Яндекс Музыка', title:'Новый русский бизнес', description:'Истории российских компаний после 2022 года. Подборка обновляется автором шоу.', url:'https://music.yandex.ru/album/34508968', embed:'https://music.yandex.ru/iframe/#album/34508968', height:450}
  ];

  function audioState() {
    const value = readState('audio', {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function readingState() {
    const value = readState('reading', {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function patchAudio(patch) {
    const state = {...audioState(), ...patch};
    writeState('audio', state);
    return state;
  }
  function allAudio() { return feeds.audio.items || []; }
  function findItem(id) { return allAudio().find(item=>item.id===id) || feeds['open-books'].items.find(item=>item.id===id); }
  function itemKey(item, chapter = 0) { return item.chapters?.[chapter]?.id || item.id; }
  function instant(value) {
    const time = Date.parse(value);
    return Number.isFinite(time) ? `<time datetime="${esc(value)}">${esc(displayTime.format(time))}</time>` : '';
  }
  function isNew(item, kind) {
    const age = Date.now() - Date.parse(item.published);
    return age >= 0 && age < (kind === 'open-books' ? 30 : 7) * day;
  }
  function freshMark(item,kind) { return isNew(item,kind) ? '<span class="fresh-mark">Новое</span>' : ''; }
  function duration(value) {
    const seconds = Math.max(0,Math.round(Number(value) || 0));
    if (!seconds) return '';
    const hours = Math.floor(seconds/3600);
    const minutes = Math.floor((seconds%3600)/60);
    const rest = String(seconds%60).padStart(2,'0');
    return hours ? `${hours}:${String(minutes).padStart(2,'0')}:${rest}` : `${minutes}:${rest}`;
  }
  function longDuration(value) {
    const seconds = Number(value) || 0;
    if (!seconds) return '';
    const hours = Math.floor(seconds/3600);
    const minutes = Math.max(1,Math.round((seconds%3600)/60));
    return hours ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
  }
  function settings(kind) { return filters[kind] ||= {topic:'',source:'',lang:'',fresh:false,limit:pageSize}; }
  function rowsFor(kind) {
    return kind === 'open-books' ? feeds['open-books'].items : allAudio().filter(item=>item.kind===kind);
  }
  function available(kind,omitSource = false) {
    const state = settings(kind);
    return rowsFor(kind).filter(item=>(!state.topic || item.topic===state.topic) &&
      (omitSource || !state.source || item.source===state.source) && (!state.lang || item.lang===state.lang) &&
      (!state.fresh || isNew(item,kind)));
  }
  function option(value,label,selected) { return `<option value="${esc(value)}"${value===selected?' selected':''}>${esc(label)}</option>`; }
  function field(key,label,options) { return `<label class="media-select"><span>${label}</span><select data-audio-field="${key}">${options}</select></label>`; }
  function savedButton(item) {
    const saved = (audioState().saved || []).includes(item.id);
    return `<button type="button" class="round-btn save-btn audio-save" data-audio-save="${esc(item.id)}" aria-pressed="${saved}" aria-label="${saved?'Убрать из закладок':'Прослушать позже'}: ${esc(item.title)}" title="${saved?'Убрать из закладок':'Прослушать позже'}">${icon('bookmark')}</button>`;
  }
  function progress(item) {
    const state = audioState();
    if (item.chapters?.length) {
      const listened = item.chapters.reduce((sum,chapter)=>sum+((state.completed||[]).includes(chapter.id)?(Number(chapter.duration)||0):Math.min(Number(chapter.duration)||0,Number(state.positions?.[chapter.id])||0)),0);
      const total = item.chapters.reduce((sum,chapter)=>sum+(Number(chapter.duration)||0),0);
      return total ? Math.min(100,Math.round(listened/total*100)) : 0;
    }
    const key = itemKey(item);
    if ((state.completed || []).includes(key)) return 100;
    return item.duration ? Math.min(100,Math.round((state.positions?.[key] || 0)/item.duration*100)) : 0;
  }
  function poster(item,large = false) {
    const image = external(item.thumbnail);
    const type = item.kind === 'audiobooks' ? 'Аудиокнига' : item.kind === 'lectures' ? 'Лекция' : 'Подкаст';
    return `<span class="media-poster audio-poster ${item.kind === 'audiobooks' ? 'audio-book' : ''}" data-topic="${esc(item.topic)}">
      <span class="poster-lettering" aria-hidden="true"><small>${esc(type)}</small><strong>${esc(item.source)}</strong></span>
      ${image?`<img data-media-image src="${esc(image)}" alt="" loading="${large?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer">`:''}
      <span class="poster-play" aria-hidden="true">▶</span><span class="platform-label">${esc(longDuration(item.duration) || 'Аудио')}</span></span>`;
  }
  function audioCard(item) {
    const percent = progress(item);
    return `<article class="media-card audio-card">${savedButton(item)}<button type="button" class="media-story" data-audio-open="${esc(item.id)}" aria-label="Открыть · ${esc(item.title)}">
      ${poster(item)}<span class="media-byline"><span>${esc(item.source)}</span>${freshMark(item,item.kind)}</span>
      <span class="media-title" lang="${item.lang==='ru'?'ru':'en'}">${esc(item.title)}</span></button>
      <div class="media-meta">${instant(item.published)}<span>·</span>${esc(item.topic)}${item.chapters?`<span>·</span><span>${item.chapters.length} глав</span>`:''}</div>
      ${percent?`<span class="listen-progress" aria-label="Прослушано ${percent}%"><i style="width:${percent}%"></i></span>`:''}</article>`;
  }
  function directory(kind) {
    const sourceNames = new Set(rowsFor(kind).map(item=>item.source));
    const rows = (kind === 'open-books' ? feeds['open-books'].sources : feeds.audio.sources).filter(source=>sourceNames.has(source.name));
    return `<details class="source-directory"><summary>${icon('audio')}${kind==='open-books'?'Каталоги':'Все шоу'} <b>${rows.length}</b>${icon('chevron')}</summary><div class="source-index">${rows.map(source=>
      `<button type="button" data-audio-source="${esc(source.name)}"><strong>${esc(source.name)}</strong><small>${esc(source.topic)} · ${source.lang==='ru'?'Русский':'Английский'} · ${source.count||0}</small></button>`).join('')}</div></details>`;
  }
  function filtersMarkup(kind) {
    const state = settings(kind);
    const rows = rowsFor(kind);
    const sources = [...new Set(rows.map(item=>item.source))].sort((a,b)=>a.localeCompare(b,'ru'));
    const topics = [...new Set(rows.map(item=>item.topic))];
    const names = new Set(available(kind,true).map(item=>item.source));
    return `<div class="media-filters"><div class="topic-row" role="group" aria-label="Тема">${['',...topics].map(topic=>
      `<button type="button" class="chip" aria-pressed="${state.topic===topic}" data-audio-topic="${esc(topic)}">${esc(topic||'Все темы')}</button>`).join('')}</div>
      <div class="media-tools">${field('source',kind==='open-books'?'Каталог':'Шоу',option('',kind==='open-books'?'Все каталоги':'Все шоу',state.source)+sources.filter(name=>names.has(name)||name===state.source).map(name=>option(name,name,state.source)).join(''))}
      ${field('lang','Язык',option('','Все языки',state.lang)+option('ru','Русский',state.lang)+option('en','Английский',state.lang))}
      <label class="fresh-filter"><input type="checkbox" data-audio-field="fresh"${state.fresh?' checked':''}><span>Только новое</span></label></div></div>`;
  }
  function results(kind) {
    const state = settings(kind);
    const rows = available(kind);
    const count = Math.min(rows.length,state.limit);
    return `<div class="media-count" role="status"><strong>${kind==='open-books'?'Книги':'Выпуски'} · ${rows.length}</strong><small>${kind==='open-books'?'Новые открытые издания':'Сначала свежие · позиция сохраняется'}</small></div>
      ${rows.length?`<div class="${kind==='open-books'?'open-book-grid':'media-grid'}">${rows.slice(0,count).map(item=>kind==='open-books'?bookCard(item):audioCard(item)).join('')}</div>`:
        '<div class="empty-state"><p>По выбранным условиям материалов пока нет.</p><button class="button secondary" data-audio-reset>Сбросить фильтры</button></div>'}
      ${count<rows.length?`<div class="load-row"><button class="button secondary" data-audio-more>Показать ещё ${Math.min(pageSize,rows.length-count)} ${icon('arrow')}</button><span>${count} из ${rows.length}</span></div>`:''}`;
  }
  function panel(kind) {
    currentKind = kind;
    if (kind === 'services') return servicesPanel();
    const ready = kind === 'open-books' ? feeds['open-books'].updated !== null : feeds.audio.updated !== null;
    if (!ready) return '<p class="secondary-copy" role="status">Загружаем каталог…</p>';
    if (!rowsFor(kind).length) return '<p class="empty-state">Каталог временно недоступен. Прошлая подборка появится после восстановления связи.</p>';
    return `${directory(kind)}${filtersMarkup(kind)}<p class="feed-window">Метка «Новое» · ${kind==='open-books'?'30 дней с появления в подборке':'7 дней'}. Обновлено ${instant(feeds[kind==='open-books'?'open-books':'audio'].updated)}.</p><div id="audio-results">${results(kind)}</div>`;
  }
  function servicesPanel() {
    return `<div class="service-intro"><p>Официальные виджеты площадок. Выпуски обновляются авторами шоу; для полного прослушивания сервис может попросить войти в аккаунт.</p></div><div class="service-grid">${services.map(service=>
      `<section class="service-card"><div class="service-heading"><div><span class="kind">${esc(service.platform)}</span><h2>${esc(service.title)}</h2></div><a class="text-link" href="${esc(service.url)}" target="_blank" rel="noopener noreferrer">Открыть ${icon('out')}</a></div>
      <p>${esc(service.description)}</p><iframe title="${esc(service.title)} · ${esc(service.platform)}" src="${esc(service.embed)}" height="${service.height}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></section>`).join('')}</div>`;
  }
  function bookCard(item) {
    const reading = readingState()[item.id] || {};
    const percent = Math.max(0,Math.min(100,Number(reading.percent)||0));
    return `<article class="open-book-card">${savedButton(item)}<button type="button" data-book-open="${esc(item.id)}" class="open-book-cover">
      ${item.thumbnail?`<img src="${esc(external(item.thumbnail))}" alt="" loading="lazy" decoding="async">`:`<span class="book-art book-focus"><small>${esc(item.author)}</small><strong>${esc(item.title)}</strong></span>`}</button>
      <div class="card-meta"><span class="kind">${esc(item.topic)}</span><span>·</span><span>${item.year||'Год не указан'}</span></div><h3><button type="button" data-book-open="${esc(item.id)}">${esc(item.title)}</button></h3><p>${esc(item.author)}</p>
      ${percent?`<span class="book-percent">Прочитано ${percent}%</span>`:''}</article>`;
  }
  function practice(item) {
    return `<section class="practice-block audio-practice"><div class="panel-label">${icon('check')} После прослушивания</div><h3>Превратить идею в действие</h3><p>${esc(item.action || 'Запишите одну мысль и одно действие, которое готовы выполнить сегодня.')}</p>
      <button type="button" class="button primary" data-audio-plan="${esc(item.id)}">${icon('check')} Взять в мой план</button></section>`;
  }
  function chapterList(item) {
    if (!item.chapters?.length) return '';
    const state = audioState();
    return `<section class="chapter-list"><h3>Главы · ${item.chapters.length}</h3>${item.chapters.map((chapter,index)=>{
      const position = Number(state.positions?.[chapter.id]) || 0;
      const done = (state.completed || []).includes(chapter.id);
      return `<button type="button" class="chapter-row" data-audio-chapter="${index}" data-audio-id="${esc(item.id)}"><span>${done?icon('check'):String(index+1).padStart(2,'0')}</span><strong lang="en">${esc(chapter.title)}</strong><small>${esc(duration(chapter.duration)||'')}${position && !done?' · продолжить':''}</small></button>`;
    }).join('')}</section>`;
  }
  function openItem(id,chapter = 0) {
    const item = findItem(id);
    if (!item || item.kind === undefined) return;
    const isCurrent = current?.item.id===item.id && current.chapter===chapter;
    const playing = isCurrent && !engine.paused;
    detail.innerHTML = `<div class="audio-detail-layout"><div>${poster(item,true)}</div><div class="detail-copy"><p class="media-byline">${esc(item.source)} ${freshMark(item,item.kind)}</p><h2 id="audio-detail-title" lang="${item.lang==='ru'?'ru':'en'}">${esc(item.title)}</h2>
      <p class="media-meta">${item.author?esc(item.author)+' · ':''}${esc(longDuration(item.duration)||'Аудио')} · ${esc(item.rights||item.topic)} · ${item.chapters?'В подборке с ':''}${instant(item.published)}</p>
      ${item.summary?`<p class="detail-summary" lang="${item.lang==='ru'?'ru':'en'}">${esc(item.summary)}</p>`:''}
      <div class="action-row"><button type="button" class="button primary" data-audio-play="${esc(item.id)}" data-audio-chapter="${chapter}">${icon(playing?'pause':'play')}${playing?'Пауза':isCurrent?'Продолжить':'Слушать'}</button>
      <a class="button secondary" href="${esc(external(item.url))}" target="_blank" rel="noopener noreferrer">Оригинал ${icon('out')}</a></div><p class="player-status" role="status"></p></div></div>
      ${chapterList(item)}${practice(item)}`;
    dialog.dataset.playing=String(playing);
    if (!dialog.open) dialog.showModal();
  }
  function openBook(id) {
    const item = findItem(id);
    if (!item || !item.embed) return;
    const reading = readingState()[id] || {};
    const percent = Math.max(0,Math.min(100,Number(reading.percent)||0));
    detail.innerHTML = `<div class="book-detail-head"><div class="detail-copy"><p class="media-byline">${esc(item.source)}</p><h2 id="audio-detail-title" lang="${item.lang==='ru'?'ru':'en'}">${esc(item.title)}</h2><p class="media-meta">${esc(item.author)}${item.year?' · '+item.year:''} · ${esc(item.rights)}</p><p class="detail-summary">${esc(item.summary)}</p>
      <div class="action-row"><a class="button secondary" href="${esc(external(item.url))}" target="_blank" rel="noopener noreferrer">Open Library ${icon('out')}</a><a class="text-link" href="${esc(external(item.read_url))}" target="_blank" rel="noopener noreferrer">Открыть в Internet Archive ${icon('out')}</a></div></div></div>
      <div class="book-reader"><iframe title="Чтение · ${esc(item.title)}" src="${esc(external(item.embed))}" allowfullscreen></iframe></div>
      <section class="reading-progress-panel"><div><h3>Мой прогресс</h3><output for="open-book-progress">${percent}%</output></div><label><span class="sr-only">Прогресс чтения</span><input id="open-book-progress" type="range" min="0" max="100" step="1" value="${percent}" data-book-progress="${esc(id)}"></label>
      <button type="button" class="button primary" data-book-plan="${esc(id)}">${icon('check')} Взять чтение в мой план</button></section>`;
    if (!dialog.open) dialog.showModal();
  }
  function persistPosition(force = false) {
    if (!current || !Number.isFinite(engine.currentTime)) return;
    const now = Date.now();
    if (!force && now-lastPersist<5000) return;
    lastPersist = now;
    const state = audioState();
    const positions = {...(state.positions || {}), [current.key]:Math.max(0,engine.currentTime)};
    const keys = Object.keys(positions);
    if (keys.length>150) delete positions[keys[0]];
    patchAudio({positions,recent:{id:current.item.id,chapter:current.chapter}});
  }
  function updateDock() {
    if (!current) return;
    const position = Number.isFinite(engine.currentTime)?engine.currentTime:0;
    const length = Number.isFinite(engine.duration)?engine.duration:(current.item.chapters?.[current.chapter]?.duration || current.item.duration || 0);
    const range = document.getElementById('audio-seek');
    range.max = String(Math.max(1,Math.round(length)));
    range.value = String(Math.min(range.max,Math.round(position)));
    range.setAttribute('aria-valuetext',`${duration(position)} из ${duration(length)}`);
    document.getElementById('audio-time').textContent = `${duration(position)||'0:00'} / ${duration(length)||'—'}`;
    const playing = !engine.paused && !engine.ended;
    document.getElementById('audio-toggle-icon').innerHTML = icon(playing?'pause':'play');
    document.getElementById('audio-toggle').setAttribute('aria-label',playing?'Пауза':'Продолжить');
    dock.dataset.playing=String(playing);
    dialog.dataset.playing=String(playing && dialog.open);
    const detailPlay = detail.querySelector('[data-audio-play]');
    if (detailPlay && current && detailPlay.dataset.audioPlay===current.item.id && Number(detailPlay.dataset.audioChapter||0)===current.chapter) {
      detailPlay.innerHTML = `${icon(playing?'pause':'play')}${playing?'Пауза':'Продолжить'}`;
    }
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing?'playing':'paused';
  }
  function showCurrent() {
    if (!current) return;
    dock.hidden = false;
    document.body.classList.add('audio-active');
    const chapter = current.item.chapters?.[current.chapter];
    document.getElementById('audio-now').innerHTML = `${current.item.thumbnail?`<img src="${esc(external(current.item.thumbnail))}" alt="">`:''}<span><small>${esc(current.item.source)}</small><strong>${esc(chapter?.title || current.item.title)}</strong></span>`;
    document.getElementById('audio-rate').value = String(engine.playbackRate || 1);
    updateDock();
  }
  function playItem(id,chapter = 0,forcePlay = true) {
    const item = findItem(id);
    if (!item?.audio) return;
    chapter = Math.max(0,Math.min(Number(chapter)||0,(item.chapters?.length||1)-1));
    if (current?.item.id===id && current.chapter===chapter) {
      if (engine.paused) engine.play().catch(()=>notify('Браузер не разрешил запустить аудио. Нажмите воспроизведение ещё раз.'));
      else engine.pause();
      updateDock();
      return;
    }
    persistPosition(true);
    const state = audioState();
    current = {item,chapter,key:itemKey(item,chapter)};
    engine.src = external(item.chapters?.[chapter]?.audio || item.audio);
    engine.playbackRate = Number(state.rate)||1;
    engine.load();
    showCurrent();
    patchAudio({recent:{id,chapter}});
    if (forcePlay) engine.play().catch(()=>{
      const status = detail.querySelector('.player-status');
      if (status) status.textContent = 'Не удалось запустить поток. Проверьте связь или откройте оригинал.';
      notify('Аудио не запустилось. Можно открыть оригинал выпуска.');
    });
    if ('mediaSession' in navigator && 'MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({title:item.chapters?.[chapter]?.title || item.title,artist:item.author || item.source,album:item.chapters?item.title:'FOUNDER.',artwork:item.thumbnail?[{src:external(item.thumbnail),sizes:'512x512'}]:[]});
    }
    if (dialog.open) openItem(id,chapter);
  }
  function nextItem() {
    if (!current) return;
    if (current.item.chapters && current.chapter<current.item.chapters.length-1) return playItem(current.item.id,current.chapter+1);
    const queue = allAudio().filter(item=>item.kind===current.item.kind && !item.chapters);
    const index = queue.findIndex(item=>item.id===current.item.id);
    if (index>=0 && queue[index+1]) playItem(queue[index+1].id);
    else { engine.pause(); notify('Это последний выпуск в очереди.'); }
  }
  function saveItem(id) {
    const state = audioState();
    const saved = new Set(state.saved || []);
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    patchAudio({saved:[...saved]});
    document.querySelectorAll(`[data-audio-save="${CSS.escape(id)}"]`).forEach(button=>{
      button.setAttribute('aria-pressed',String(saved.has(id)));
      button.title = saved.has(id)?'Убрать из закладок':'Прослушать позже';
    });
    notify(saved.has(id)?'Сохранено: вернуться можно в «Моём пути»':'Материал убран из сохранённых');
    onChange?.('saved');
  }
  function planItem(id,book = false) {
    const item = findItem(id);
    if (!item) return;
    onPlan?.({text:book?`Прочитать фрагмент книги «${item.title}» и записать одну применимую идею`:(item.action || `Послушать «${item.title}» и записать одно действие`),sourceId:id,sourceTitle:item.title,href:book?'#library/open':`#media/${item.kind}`});
  }
  function updateReading(id,value) {
    const state = readingState();
    state[id] = {...(state[id]||{}),percent:Math.max(0,Math.min(100,Number(value)||0)),status:Number(value)>=100?'done':'reading',updated:new Date().toISOString()};
    writeState('reading',state);
    onChange?.('reading');
  }
  function changeFilter(field,value,selector) {
    const state = settings(currentKind);
    state[field] = value;
    state.limit = pageSize;
    if (field!=='source' && state.source && !available(currentKind,true).some(item=>item.source===state.source)) state.source='';
    const target = document.getElementById('audio-panel');
    if (target) target.innerHTML = panel(currentKind);
    target?.querySelector(selector)?.focus({preventScroll:true});
  }
  function homeAudio() {
    if (!allAudio().length) return '<p class="secondary-copy">Загружаем аудиотеку…</p>';
    const candidates = allAudio().filter(item=>item.kind!=='audiobooks');
    const preferred = ['BIG MONEY','How I Built This','Planet Money','TED Radio Hour'];
    const rows = preferred.map(name=>candidates.find(item=>item.source===name)).filter(Boolean);
    for (const item of candidates) { if (rows.length>=3) break; if (!rows.includes(item)) rows.push(item); }
    return `<div class="link-list">${rows.slice(0,3).map(item=>`<button type="button" class="link-row" data-audio-open="${esc(item.id)}"><span><span class="row-meta">${esc(item.source)} · ${esc(longDuration(item.duration)||'Аудио')}</span><strong lang="${item.lang==='ru'?'ru':'en'}">${esc(item.title)}</strong></span>${icon('play')}</button>`).join('')}</div>`;
  }
  function savedMarkup() {
    const saved = new Set(audioState().saved || []);
    const rows = [...allAudio(),...feeds['open-books'].items].filter(item=>saved.has(item.id));
    if (!rows.length) return '';
    return `<section class="saved-audio"><div class="section-head"><div class="section-title"><h2>Сохранённое аудио и книги</h2></div></div><div class="link-list">${rows.map(item=>`<button type="button" class="link-row" ${item.embed?`data-book-open="${esc(item.id)}"`:`data-audio-open="${esc(item.id)}"`}><span><span class="row-meta">${esc(item.source)}</span><strong>${esc(item.title)}</strong></span>${icon(item.embed?'book':'play')}</button>`).join('')}</div></section>`;
  }
  function resumeMarkup() {
    const state = audioState();
    const rows = Object.entries(state.positions || {}).filter(([,position])=>position>5).sort((a,b)=>b[1]-a[1]);
    if (!rows.length) return '<p class="secondary-copy">Начните лекцию или подкаст — здесь появится место, с которого можно продолжить.</p>';
    return `<div class="link-list">${rows.slice(0,3).map(([key])=>{
      const item = allAudio().find(entry=>itemKey(entry)===key || entry.chapters?.some(chapter=>chapter.id===key));
      if (!item) return '';
      const chapter = Math.max(0,item.chapters?.findIndex(entry=>entry.id===key) || 0);
      return `<button type="button" class="link-row" data-audio-play="${esc(item.id)}" data-audio-chapter="${chapter}"><span><span class="row-meta">Продолжить · ${esc(item.source)}</span><strong>${esc(item.chapters?.[chapter]?.title || item.title)}</strong></span>${icon('play')}</button>`;
    }).join('')}</div>`;
  }

  engine.addEventListener('loadedmetadata',()=>{
    if (!current) return;
    const position = Number(audioState().positions?.[current.key]) || 0;
    if (position>5 && (!Number.isFinite(engine.duration) || position<engine.duration-8)) engine.currentTime=position;
    updateDock();
  });
  engine.addEventListener('timeupdate',()=>{ updateDock(); persistPosition(); });
  engine.addEventListener('play',updateDock);
  engine.addEventListener('pause',()=>{ persistPosition(true); updateDock(); });
  engine.addEventListener('ended',()=>{
    if (!current) return;
    const state = audioState();
    const completed = [...new Set([...(state.completed||[]),current.key])];
    const positions = {...(state.positions||{})};
    delete positions[current.key];
    patchAudio({completed,positions});
    onChange?.('completed');
    nextItem();
  });
  engine.addEventListener('error',()=>{
    if (!current || !engine.src) return;
    const status = detail.querySelector('.player-status');
    if (status) status.textContent = 'Площадка не отдала аудиопоток. Попробуйте позже или откройте оригинал.';
    updateDock();
  });
  document.addEventListener('visibilitychange',()=>{ if (document.hidden) persistPosition(true); });
  window.addEventListener('pagehide',()=>persistPosition(true));
  dialog.addEventListener('close',()=>{ if (!dialog.open) detail.replaceChildren(); });
  dialog.addEventListener('click',event=>{
    if (event.target===dialog || event.target.closest('[data-close-audio]')) dialog.close();
  });
  document.addEventListener('click',event=>{
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-audio-open')) openItem(button.dataset.audioOpen);
    else if (button.hasAttribute('data-book-open')) openBook(button.dataset.bookOpen);
    else if (button.hasAttribute('data-audio-play')) playItem(button.dataset.audioPlay,button.dataset.audioChapter||0);
    else if (button.hasAttribute('data-audio-chapter') && button.hasAttribute('data-audio-id')) playItem(button.dataset.audioId,button.dataset.audioChapter);
    else if (button.hasAttribute('data-audio-save')) saveItem(button.dataset.audioSave);
    else if (button.hasAttribute('data-audio-plan')) planItem(button.dataset.audioPlan);
    else if (button.hasAttribute('data-book-plan')) planItem(button.dataset.bookPlan,true);
    else if (button.id==='audio-toggle') { if (current) playItem(current.item.id,current.chapter,false); }
    else if (button.id==='audio-now' && current) openItem(current.item.id,current.chapter);
    else if (button.hasAttribute('data-audio-seek-by') && current) engine.currentTime=Math.max(0,Math.min(engine.duration||Infinity,engine.currentTime+Number(button.dataset.audioSeekBy)));
    else if (button.id==='audio-next') nextItem();
    else if (button.id==='audio-close') { engine.pause(); engine.removeAttribute('src'); engine.load(); current=null; dock.hidden=true; document.body.classList.remove('audio-active'); }
    else if (button.hasAttribute('data-audio-topic')) changeFilter('topic',button.dataset.audioTopic,'[data-audio-topic][aria-pressed="true"]');
    else if (button.hasAttribute('data-audio-source')) { delete filters[currentKind]; changeFilter('source',button.dataset.audioSource,'[data-audio-field="source"]'); }
    else if (button.hasAttribute('data-audio-reset')) { delete filters[currentKind]; changeFilter('topic','','[data-audio-topic]'); }
    else if (button.hasAttribute('data-audio-more')) {
      const state = settings(currentKind); const next = state.limit; state.limit+=pageSize;
      const target = document.getElementById('audio-results'); target.innerHTML=results(currentKind);
      target.querySelectorAll('.media-story,.open-book-cover')[next]?.focus({preventScroll:true});
    }
  });
  document.addEventListener('change',event=>{
    const control = event.target;
    if (control.matches('[data-audio-field]')) changeFilter(control.dataset.audioField,control.type==='checkbox'?control.checked:control.value,`[data-audio-field="${control.dataset.audioField}"]`);
    if (control.id==='audio-rate') { engine.playbackRate=Number(control.value)||1; patchAudio({rate:engine.playbackRate}); }
    if (control.id==='audio-sleep') {
      clearTimeout(sleepTimer);
      const minutes = Number(control.value);
      if (minutes) { sleepTimer=setTimeout(()=>{ engine.pause(); control.value='0'; notify('Таймер сна: воспроизведение остановлено'); },minutes*60000); notify(`Таймер сна: ${minutes} мин`); }
    }
    if (control.matches('[data-book-progress]')) updateReading(control.dataset.bookProgress,control.value);
  });
  document.addEventListener('input',event=>{
    if (event.target.id==='audio-seek' && Number.isFinite(engine.duration)) engine.currentTime=Number(event.target.value);
    if (event.target.matches('[data-book-progress]')) event.target.closest('.reading-progress-panel').querySelector('output').textContent=event.target.value+'%';
  });
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play',()=>{ if(current) playItem(current.item.id,current.chapter); });
    navigator.mediaSession.setActionHandler('pause',()=>engine.pause());
    navigator.mediaSession.setActionHandler('seekbackward',()=>{ if(current) engine.currentTime=Math.max(0,engine.currentTime-15); });
    navigator.mediaSession.setActionHandler('seekforward',()=>{ if(current) engine.currentTime=Math.min(engine.duration||Infinity,engine.currentTime+15); });
    navigator.mediaSession.setActionHandler('nexttrack',nextItem);
  }
  const recent = audioState().recent;
  if (recent?.id) {
    const item = findItem(recent.id);
    if (item) { current={item,chapter:recent.chapter||0,key:itemKey(item,recent.chapter||0)}; showCurrent(); }
  }
  return {
    panel, homeAudio, savedMarkup, resumeMarkup,
    openEpisode:openItem,
    selectPodcast(name) { delete filters.podcasts; settings('podcasts').source = name || ''; },
    hasSaved(){ return Boolean(audioState().saved?.length); },
    set(kind,data){
      feeds[kind]=data;
      const recent=audioState().recent;
      if (!current && recent?.id) {
        const item=findItem(recent.id);
        if(item){
          const chapter=recent.chapter||0;
          current={item,chapter,key:itemKey(item,chapter)};
          engine.src=external(item.chapters?.[chapter]?.audio || item.audio);
          engine.playbackRate=Number(audioState().rate)||1;
          engine.load();
          showCurrent();
        }
      }
    },
    refresh(){ const target=document.getElementById('audio-panel'); if(target) target.innerHTML=panel(currentKind); }
  };
}
