function createMedia({esc, icon, external}) {
  const dialog = document.getElementById('media-dialog');
  const feeds = {};
  const filters = {};
  const displayTime = new Intl.DateTimeFormat('ru-RU', {
    day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  });
  const day = 86400000;
  const pageSize = 9;
  let current = 'news';
  let youtubeReady;
  let youtubePlayer;

  function settings(kind) {
    return filters[kind] ||= {topic:'', source:'', lang:'', platform:'', fresh:false, limit:pageSize};
  }
  function instant(value) {
    const t = Date.parse(value);
    return Number.isFinite(t) ? `<time datetime="${esc(value)}">${esc(displayTime.format(t))}</time>` : '';
  }
  function isNew(item, kind) {
    const age = Date.now() - Date.parse(item.published);
    return age >= 0 && age < (kind === 'videos' ? 7 : 2) * day;
  }
  function newMark(item, kind) {
    return isNew(item,kind) ? '<span class="fresh-mark">Новое</span>' : '';
  }
  function nameOf(platform) {
    return platform === 'rutube' ? 'RUTUBE' : 'YouTube';
  }
  function duration(seconds) {
    if (!seconds) return '';
    const min = Math.floor(seconds / 60);
    const suffix = String(seconds % 60).padStart(2,'0');
    return min < 60 ? `${min}:${suffix}` : `${Math.floor(min/60)}:${String(min%60).padStart(2,'0')}:${suffix}`;
  }
  function available(kind, omitSource = false) {
    const state = settings(kind);
    return (feeds[kind]?.items || []).filter(item =>
      (!state.topic || item.topic === state.topic) && (omitSource || !state.source || item.source === state.source) &&
      (!state.lang || item.lang === state.lang) && (!state.platform || item.platform === state.platform) &&
      (!state.fresh || isNew(item,kind)));
  }
  function option(value, label, selected) {
    return `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`;
  }
  function field(key, label, options) {
    return `<label class="media-select"><span>${label}</span><select data-media-field="${key}">${options}</select></label>`;
  }
  function directory(kind) {
    const rows = feeds[kind].sources || [];
    return `<details class="source-directory"><summary>${icon(kind === 'videos' ? 'film' : 'layers')}${kind === 'videos' ? 'Все каналы' : 'Все источники'} <b>${rows.length}</b>${icon('chevron')}</summary><div class="source-index">${rows.map(source =>
      `<button type="button" data-media-source="${esc(source.name)}"><strong>${esc(source.name)}</strong><small>${esc(source.topic)} · ${source.lang === 'ru' ? 'Русский' : 'Английский'}${source.platform ? ' · '+nameOf(source.platform) : ''}</small></button>`).join('')}</div></details>`;
  }
  function filtersMarkup(kind) {
    const state = settings(kind);
    const rows = feeds[kind].sources || [];
    const topics = [...new Set(rows.map(row => row.topic))];
    const names = new Set(available(kind,true).map(row=>row.source));
    return `<div class="media-filters"><div class="topic-row" role="group" aria-label="Тема">${['',...topics].map(t=>
      `<button type="button" class="chip" aria-pressed="${state.topic === t}" data-media-topic="${esc(t)}">${esc(t || 'Все темы')}</button>`).join('')}</div>
      <div class="media-tools">${field('source',kind === 'videos' ? 'Канал' : 'Редакция',option('',kind === 'videos' ? 'Все каналы' : 'Все источники',state.source)+rows.filter(s=>names.has(s.name) || s.name === state.source).map(s=>option(s.name,s.name,state.source)).join(''))}
      ${field('lang','Язык',option('','Все языки',state.lang)+option('ru','Русский',state.lang)+option('en','Английский',state.lang))}
      ${kind === 'videos' ? field('platform','Площадка',option('','Все площадки',state.platform)+option('rutube','RUTUBE',state.platform)+option('youtube','YouTube',state.platform)) : ''}
      <label class="fresh-filter"><input type="checkbox" data-media-field="fresh"${state.fresh?' checked':''}><span>Только новое</span></label></div></div>`;
  }
  function poster(item, kind, large = false) {
    const name = esc(item.source);
    const url = external(item.thumbnail);
    const time = duration(item.duration);
    return `<span class="media-poster ${kind}" data-topic="${esc(item.topic)}">
      <span class="poster-lettering" aria-hidden="true"><small>${esc(item.topic)}</small><strong>${name}</strong></span>
      ${url ? `<img data-media-image src="${esc(url)}" alt="" loading="${large?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer">` : ''}
      ${kind === 'videos' ? `<span class="poster-play" aria-hidden="true">▶</span><span class="platform-label">${nameOf(item.platform)}${time?' · '+time:''}</span>` : ''}</span>`;
  }
  function itemCard(item,kind,index) {
    return `<article class="media-card"><button type="button" class="media-story" data-media-open="${index}" data-kind="${kind}" aria-label="${kind === 'videos'?'Смотреть':'Открыть'} · ${esc(item.title)}">
      ${poster(item,kind)}<span class="media-byline"><span>${esc(item.source)}</span>${newMark(item,kind)}</span>
      <span class="media-title" lang="${item.lang==='ru'?'ru':'en'}">${esc(item.title)}</span></button>
      <div class="media-meta">${instant(item.published)}<span>·</span>${esc(item.topic)}</div></article>`;
  }
  function results(kind) {
    const state = settings(kind);
    const rows = available(kind);
    const count = Math.min(rows.length,state.limit);
    const indices = new Map(feeds[kind].items.map((item,i)=>[item,i]));
    return `<div class="media-count" role="status"><strong>${kind==='videos'?'Выпуски':'Публикации'} · ${rows.length}</strong><small>Сначала свежие · время на вашем устройстве</small></div>
      ${rows.length ? `<div class="media-grid">${rows.slice(0,count).map(item=>itemCard(item,kind,indices.get(item))).join('')}</div>` :
        '<div class="empty-state"><p>По выбранным условиям материалов пока нет.</p><button class="button secondary" data-media-reset>Сбросить фильтры</button></div>'}
      ${count<rows.length ? `<div class="load-row"><button class="button secondary" data-media-more>Показать ещё ${Math.min(pageSize,rows.length-count)} ${icon('arrow')}</button><span>${count} из ${rows.length}</span></div>` : ''}`;
  }
  function leadVideo() {
    const rows=feeds.videos.items;
    const index=rows.findIndex(item=>item.platform==='rutube' && item.lang==='ru' && item.duration>=180);
    if(index<0) return '';
    const item=rows[index];
    return `<article class="media-lead"><button type="button" data-media-open="${index}" data-kind="videos" aria-label="Смотреть выпуск · ${esc(item.title)}">
      ${poster(item,'videos',true)}<span class="lead-copy"><span class="lead-kicker">${icon('film')} Смотреть на русском</span>
      <strong>${esc(item.title)}</strong><span class="lead-credit">${esc(item.source)} ${newMark(item,'videos')}</span>
      <span class="lead-time">${instant(item.published)}</span><span class="lead-cta">Смотреть на сайте ${icon('arrow')}</span></span></button></article>`;
  }
  function panel(kind) {
    current = kind;
    if (!feeds[kind]) return '<p class="secondary-copy" role="status">Загружаем ленту…</p>';
    if (!feeds[kind].items.length) return '<p class="empty-state">Не удалось загрузить ленту. Обновите страницу, когда появится связь.</p>';
    const state = settings(kind);
    const showLead = kind === 'videos' && !state.source && !state.lang && !state.topic && !state.platform && !state.fresh;
    return `${showLead ? leadVideo() : ''}${directory(kind)}${filtersMarkup(kind)}
      <p class="feed-window">Метка «Новое» · ${kind==='videos'?'за последние 7 дней':'за последние 48 часов'}. Обновлено ${instant(feeds[kind].updated)}.</p>
      <div id="media-results">${results(kind)}</div>`;
  }
  function change(field, value, focusSelector) {
    const state = settings(current);
    state[field] = value;
    state.limit = pageSize;
    if (field !== 'source' && state.source && !available(current,true).some(item=>item.source === state.source)) state.source = '';
    const target = document.getElementById('media-panel');
    if (!target) return;
    target.innerHTML = panel(current);
    target.querySelector(focusSelector)?.focus({preventScroll:true});
  }
  function homeNews() {
    const data = feeds.news;
    if (!data?.items?.length) return `<p class="secondary-copy">${data?'Новости временно недоступны.':'Загружаем новости…'}</p>`;
    const seen = new Set();
    const rows = [];
    for (const [i,item] of data.items.entries()) {
      if (seen.has(item.source) || item.lang !== 'ru') continue;
      seen.add(item.source);
      rows.push(`<button type="button" class="link-row" data-media-open="${i}" data-kind="news"><span><span class="row-meta">${esc(item.source)} · ${instant(item.published)}</span><strong>${esc(item.title)}</strong></span>${icon('arrow')}</button>`);
      if (rows.length === 3) break;
    }
    return rows.length ? `<div class="link-list">${rows.join('')}</div>` : '<a class="text-link" href="#media">Открыть ленту новостей</a>';
  }
  function playerUrl(item) {
    if (item.platform==='rutube' && /^[a-f0-9]{32}$/.test(item.id)) return `https://rutube.ru/play/embed/${item.id}?autostart=true`;
    if (item.platform==='youtube' && /^[\w-]{11}$/.test(item.id)) return `https://www.youtube-nocookie.com/embed/${item.id}?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    return '';
  }
  function connectYouTube(frame) {
    if (!youtubeReady) youtubeReady = new Promise(resolve=>{
      if (window.YT?.Player) { resolve(window.YT); return; }
      window.onYouTubeIframeAPIReady = ()=>resolve(window.YT);
      const loader=document.createElement('script');
      loader.src='https://www.youtube.com/iframe_api';
      loader.onerror=()=>{ youtubeReady=null; loader.remove(); resolve(null); };
      document.head.append(loader);
    });
    youtubeReady.then(api=>{
      if (!api || !dialog.open || !frame.isConnected) return;
      youtubePlayer=new api.Player(frame,{events:{
        onReady:event=>{ if(dialog.open && frame.isConnected) event.target.playVideo(); },
        onStateChange:event=>{ if(frame.isConnected) dialog.dataset.playing=String(event.data===1); },
        onError:()=>{ if(frame.isConnected) dialog.querySelector('.player-status').textContent='YouTube ограничил просмотр выпуска во встроенном плеере.'; }
      }});
    });
  }
  function openItem(kind,index) {
    const item = feeds[kind]?.items?.[index];
    if (!item) return;
    const url = playerUrl(item);
    const video = kind === 'videos';
    const stage = document.getElementById('media-detail');
    const description = item.summary && item.summary !== item.title ? `<p class="detail-summary">${esc(item.summary)}</p>` : '';
    stage.innerHTML = `${video && url ? `<div class="player-frame"><iframe title="${esc(item.title)}" src="${esc(url)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>` : poster(item,kind,true)}
      <div class="detail-copy"><p class="media-byline">${esc(item.source)} ${newMark(item,kind)}</p><h2 id="media-detail-title">${esc(item.title)}</h2>
      <p class="media-meta">Опубликовано ${instant(item.published)} · ${esc(item.topic)}</p>${description}
      <p class="player-status" role="status"></p><a class="button secondary" href="${esc(external(item.url))}" target="_blank" rel="noopener noreferrer">${video?'Открыть в '+nameOf(item.platform):'Читать у издателя'} ${icon('out')}</a>${item.platform==='youtube' ? `<button class="text-link related-rutube" data-related-rutube="${esc(item.topic)}">По этой теме на RUTUBE ${icon('arrow')}</button>` : ''}</div>`;
    dialog.dataset.playing='false';
    dialog.showModal();
    if (video && item.platform==='youtube' && url) connectYouTube(stage.querySelector('iframe'));
  }
  window.addEventListener('message',event=>{
    if (!dialog.open || !['https://www.youtube-nocookie.com','https://www.youtube.com','https://rutube.ru'].includes(event.origin)) return;
    if (event.source !== dialog.querySelector('iframe')?.contentWindow) return;
    let data = event.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return; } }
    if (event.origin === 'https://rutube.ru' && data?.type === 'player:ready') {
      event.source.postMessage(JSON.stringify({type:'player:play',data:{}}),event.origin);
    }
    if (data?.type === 'player:changeState') dialog.dataset.playing=String(data.data?.state==='playing');
    if (data?.event === 'onStateChange') dialog.dataset.playing=String(data.info===1);
    if (data?.event === 'onError' || data?.type === 'player:error') {
      dialog.querySelector('.player-status').textContent = 'Площадка ограничила просмотр этого выпуска. Его можно открыть по ссылке ниже.';
    }
  });
  document.addEventListener('error',event=>{
    if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-media-image')) event.target.remove();
  },true);
  function releasePlayer() {
    dialog.dataset.playing='false';
    if (youtubePlayer) { youtubePlayer.destroy(); youtubePlayer=null; }
    document.getElementById('media-detail').replaceChildren();
  }
  dialog.addEventListener('close',()=>{ if(!dialog.open) releasePlayer(); });
  dialog.addEventListener('cancel',releasePlayer);
  dialog.addEventListener('click',event=>{
    const related=event.target.closest('[data-related-rutube]');
    if (related) {
      releasePlayer(); dialog.close();
      delete filters.videos;
      settings('videos').platform='rutube';
      change('topic',related.dataset.relatedRutube,'[data-media-topic][aria-pressed="true"]');
      document.getElementById('media-results')?.scrollIntoView({block:'start'});
      return;
    }
    if (event.target === dialog || event.target.closest('[data-close-media]')) { releasePlayer(); dialog.close(); }
  });
  document.addEventListener('change',event=>{
    const control = event.target.closest('[data-media-field]');
    if (control) change(control.dataset.mediaField,control.type==='checkbox'?control.checked:control.value,`[data-media-field="${control.dataset.mediaField}"]`);
  });
  document.addEventListener('click',event=>{
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-media-open')) openItem(button.dataset.kind,Number(button.dataset.mediaOpen));
    if (button.hasAttribute('data-media-topic')) change('topic',button.dataset.mediaTopic,'[data-media-topic][aria-pressed="true"]');
    if (button.hasAttribute('data-media-source')) {
      delete filters[current];
      change('source',button.dataset.mediaSource,'[data-media-field="source"]');
      document.querySelector('.media-filters').scrollIntoView({block:'start'});
    }
    if (button.hasAttribute('data-media-reset')) { delete filters[current]; change('topic','','[data-media-topic]'); }
    if (button.hasAttribute('data-media-more')) {
      const state = settings(current);
      const next = state.limit;
      state.limit += pageSize;
      const target = document.getElementById('media-results');
      target.innerHTML = results(current);
      target.querySelectorAll('.media-story')[next]?.focus({preventScroll:true});
    }
  });
  return {panel, homeNews, set(kind, data){ feeds[kind]=data; }};
}
