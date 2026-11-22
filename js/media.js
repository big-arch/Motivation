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
  let mineOnly=false, channel='', videoPlatform='', openVideo=null, videoStart=0;
  const authorsById=new Map(creatorProfiles.map(p=>[p.id,p]));
  const authorsByName=new Map(creatorProfiles.map(p=>[p.name,p]));
  let sourceAuthors=new Map();
  const authorOf=item=>sourceAuthors.get(item.source);
  function sourcesFor(kind) {
    return (feeds[kind]?.sources||[]).filter(s=>kind!=='videos'||((!videoPlatform || s.platform===videoPlatform) && (!mineOnly||sourceAuthors.has(s.name)) && (!channel||sourceAuthors.get(s.name)?.name===channel)));
  }
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
    return age >= 0 && age < (kind === 'videos' ? 7 : 1) * day;
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
      (kind !== 'videos' || ((!videoPlatform || item.platform===videoPlatform) && (!mineOnly || authorOf(item)) && (!channel || authorOf(item)?.name===channel))) &&
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
    const rows = sourcesFor(kind);
    return `<details class="source-directory"><summary>${icon(kind === 'videos' ? 'film' : 'layers')}${kind === 'videos' ? 'Все каналы' : 'Все источники'} <b>${rows.length}</b>${icon('chevron')}</summary><div class="source-index">${rows.map(source =>
      `<button type="button" data-media-source="${esc(source.name)}"><strong>${esc(source.name)}</strong><small>${esc(source.topic)} · ${source.lang === 'ru' ? 'Русский' : 'Английский'}${source.platform ? ' · '+nameOf(source.platform) : ''}</small></button>`).join('')}</div></details>`;
  }
  function filtersMarkup(kind) {
    const state = settings(kind);
    const rows = sourcesFor(kind);
    const topics = [...new Set(rows.map(row => row.topic))];
    const names = new Set(available(kind,true).map(row=>row.source));
    const pinned=kind==='videos' && channel;
    return `<div class="media-filters"><div class="topic-row" role="group" aria-label="Тема">${['',...topics].map(t=>
      `<button type="button" class="chip" aria-pressed="${state.topic === t}" data-media-topic="${esc(t)}">${esc(t || 'Все темы')}</button>`).join('')}</div>
      <div class="media-tools">${pinned?'':field('source',kind === 'videos' ? 'Канал' : 'Редакция',option('',kind === 'videos' ? 'Все каналы' : 'Все источники',state.source)+rows.filter(s=>names.has(s.name) || s.name === state.source).map(s=>option(s.name,s.name,state.source)).join(''))}
      ${field('lang','Язык',option('','Все языки',state.lang)+option('ru','Русский',state.lang)+option('en','Английский',state.lang))}
      ${kind === 'videos' && new Set(rows.map(row=>row.platform)).size>1 ? field('platform','Площадка',option('','Все площадки',state.platform)+option('rutube','RUTUBE',state.platform)+option('youtube','YouTube',state.platform)) : ''}
      <label class="fresh-filter"><input type="checkbox" data-media-field="fresh"${state.fresh?' checked':''}><span>Только новое</span></label></div></div>`;
  }
  function newsIllustration(item) {
    const words=item.title.toLocaleLowerCase();
    if (item.source==='European Central Bank') return newsPhotos.bank;
    if (/автомоб|автозавод|машиностро|кроссовер|ladа|lada|automaker|carmaker|auto industr|assembl(y|ies)/i.test(words)) return newsPhotos.factory;
    if (/акци[яйию]|бирж|индекс|обыкновенн|котиров|фьючерс|shares|stock|listing|futures|bond market|equities/i.test(words)) return newsPhotos.markets;
    if (/перевоз|контейнер|пошлин|экспорт|импорт|shipping|tariff|exports?|imports?|iron ore|customs/i.test(words)) return newsPhotos.trade;
    if (/торгов[а-яё]* сет|ритейл|магазин|потребител|retail|stores?|shopper|shopping|supermarket/i.test(words)) return newsPhotos.retail;
    if (item.topic==='Технологии' || /кибератак|смартфон|openai|artificial intelligence|\bai\b|data cent|smartphone|cyber|chipmaker/i.test(words)) return newsPhotos.tech;
    if (item.topic==='Мотивация') return {...archivePhotos.habits[1],file:'./assets/archive/habits-2.webp'};
    if (item.topic==='Карьера' || /наём|работодател|найм|employer|workplace|employee|workforce/i.test(words)) return newsPhotos.office;
    return newsPhotos.press;
  }
  function newsCredit(photo) {
    return `<figcaption class="context-credit"><b>Фото по теме.</b> ${esc(photo.caption)} <small>${esc(photo.credit)} · <a href="${esc(external(photo.licenseUrl))}" rel="noopener" target="_blank">${esc(photo.license)}</a> · <a href="${esc(external(photo.source))}" rel="noopener" target="_blank">Оригинал ↗</a></small></figcaption>`;
  }
  function poster(item, kind, large = false) {
    const name = esc(item.source);
    const url = external(item.thumbnail);
    const time = duration(item.duration);
    const context = kind === 'news' ? newsIllustration(item) : null;
    const imageUrl = url || context?.file;
    return `<span class="media-poster ${kind}${!url && context ? ' is-context' : ''}" data-topic="${esc(item.topic)}">
      <span class="poster-lettering" aria-hidden="true"><small>${esc(item.topic)}</small><strong>${name}</strong></span>
      ${imageUrl ? `<img data-media-image src="${esc(imageUrl)}" alt="${large && !url && context?esc(context.caption):''}" ${context?`data-context-src="${esc(context.file)}" data-context-alt="${large?esc(context.caption):''}"`:''} loading="${large?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer">` : ''}
      ${context?'<span class="context-label">Фото по теме</span>':''}
      ${kind === 'videos' ? `<span class="poster-play" aria-hidden="true">▶</span><span class="platform-label">${nameOf(item.platform)}${time?' · '+time:''}</span>` : ''}</span>`;
  }
  function itemCard(item,kind,index) {
    return `<article class="media-card"><button type="button" class="media-story" data-media-open="${index}" data-kind="${kind}" aria-label="${kind === 'videos'?'Смотреть':'Открыть'} · ${esc(item.title)}">
      ${poster(item,kind)}<span class="media-byline"><span>${esc(item.source)}</span>${newMark(item,kind)}</span>${kind==='videos' && authorOf(item)?'<span class="chosen-channel">Из моих каналов</span>':''}
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
  function panel(kind) {
    current = kind;
    if (!feeds[kind]) return '<p class="secondary-copy" role="status">Загружаем ленту…</p>';
    if (!feeds[kind].items.length) return '<p class="empty-state">Не удалось загрузить ленту. Обновите страницу, когда появится связь.</p>';
    const state = settings(kind);
    const active=[state.topic,state.source,state.lang,state.platform,state.fresh].filter(Boolean).length;
    return `<details class="filter-drawer" ${state.drawer?'open':''}><summary>${icon('layers')} Фильтры${active?' · '+active:''}${icon('chevron')}</summary>
      ${filtersMarkup(kind)}${kind==='videos' && channel?'':directory(kind)}</details>
      <p class="feed-window">${kind==='videos'?'Новое за 7 дней':'Новое за 24 часа'} · Лента обновлена ${instant(feeds[kind].updated)}</p>
      <div id="media-results">${results(kind)}</div>`;
  }
  function change(field, value, focusSelector) {
    const state = settings(current);
    state[field] = value;
    state.limit = pageSize;
    if (field !== 'source' && state.source && !available(current,true).some(item=>item.source === state.source)) state.source = '';
    const target = document.getElementById('media-panel');
    if (!target) return;
    state.drawer=Boolean(target.querySelector('.filter-drawer[open]'));
    target.innerHTML = panel(current);
    target.querySelector(focusSelector)?.focus({preventScroll:true});
  }
  function homeNews() {
    const data = feeds.news;
    if (!data?.items?.length) return `<p class="secondary-copy">${data?'Новости временно недоступны.':'Загружаем новости…'}</p>`;
    const seen = new Set(), rows=[];
    for (const [i,item] of data.items.entries()) {
      if (seen.has(item.source)) continue;
      seen.add(item.source);
      rows.push(`<article class="wire-item"><button type="button" data-media-open="${i}" data-kind="news"><span class="wire-date">${instant(item.published)} ${newMark(item,'news')}</span><strong lang="${item.lang==='ru'?'ru':'en'}">${esc(item.title)}</strong><span class="wire-source">${esc(item.source)} ${icon('arrow')}</span></button></article>`);
      if (rows.length===3) break;
    }
    return `<div class="wire-grid">${rows.join('')}</div>`;
  }
  function playerUrl(item, start = 0) {
    if (item.platform==='rutube' && /^[a-f0-9]{32}$/.test(item.id)) return `https://rutube.ru/play/embed/${item.id}?autostart=true`;
    if (item.platform==='youtube' && /^[\w-]{11}$/.test(item.id)) return `https://www.youtube.com/embed/${item.id}?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}${start ? '&start='+start : ''}`;
    return '';
  }
  function videoStatus(message) {
    dialog.querySelector('.player-status').textContent=message;
  }
  function youtubeError(code) {
    dialog.dataset.playing='false';
    if (code===153) videoStatus('YouTube не получил адрес журнала от браузера. Повторите запуск в обычной вкладке FOUNDER.');
    else if (code===100) videoStatus('YouTube сообщает, что видео удалено или доступ ограничен.');
    else if (code===101 || code===150) videoStatus('YouTube остановил показ в этом окне. Если плеер просит войти, проверьте, что YouTube и FOUNDER открыты в одном профиле браузера, затем повторите запуск.');
    else videoStatus('YouTube не смог воспроизвести ролик. Можно повторить запуск в этом окне.');
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
        onStateChange:event=>{
          if (!frame.isConnected) return;
          dialog.dataset.playing=String(event.data===1);
          if (event.data===1) videoStatus('');
        },
        onAutoplayBlocked:()=>{ if(frame.isConnected && !dialog.querySelector('.player-status').textContent) videoStatus('Нажмите ▶ в плеере, чтобы начать просмотр.'); },
        onError:event=>{ if(frame.isConnected) youtubeError(event.data); }
      }});
    });
  }
  function destroyPlayer() {
    youtubePlayer?.destroy();
    youtubePlayer=null;
  }
  function loadVideo(item, start) {
    const container=dialog.querySelector('.player-frame');
    if (!container) return;
    destroyPlayer();
    dialog.dataset.playing='false';
    videoStatus('');
    container.innerHTML=`<iframe title="${esc(item.title)}" src="${esc(playerUrl(item,start))}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    if (item.platform==='youtube') connectYouTube(container.firstElementChild);
  }
  function openItem(kind, item, start = 0) {
    if (!item) return;
    const url = playerUrl(item, start);
    if (youtubePlayer) destroyPlayer();
    const video = kind === 'videos';
    openVideo=video?item:null;
    videoStart=start;
    const audioId = video && creatorProfiles.find(profile=>profile.episode.id===item.id)?.audioId;
    const stage = document.getElementById('media-detail');
    const description = item.summary && item.summary !== item.title ? `<p class="detail-summary">${esc(item.summary)}</p>` : '';
    stage.innerHTML = `${video && url ? '<div class="player-frame"></div>' : `<figure class="news-detail-visual">${poster(item,kind,true)}${newsCredit(newsIllustration(item))}</figure>`}
      ${video && url ? `<div class="player-help"><p class="player-status" role="status"></p>${item.platform==='youtube' ? `<button type="button" class="button secondary" data-video-retry>${icon('play')} Повторить в плеере</button>` : ''}</div>` : ''}
      <div class="detail-copy"><p class="media-byline">${esc(item.source)} ${newMark(item,kind)}</p><h2 id="media-detail-title">${esc(item.title)}</h2>
      <p class="media-meta">Опубликовано ${instant(item.published)} · ${esc(item.topic)}</p>${description}
      ${audioId ? `<a class="button secondary" href="#audio/podcasts/${esc(audioId)}" data-audio-edition>${icon('audio')} Аудиоверсия этого выпуска</a>` : ''} ${video?`<button type="button" class="button secondary" data-video-note>${icon('write')} Записать вывод</button>`:''} <a class="button secondary" href="${esc(external(start ? item.url+'&t='+start+'s' : item.url))}" target="_blank" rel="noopener noreferrer">${video?'Открыть в '+nameOf(item.platform):'Читать у издателя'} ${icon('out')}</a>${item.platform==='youtube' ? `<button class="text-link related-rutube" data-related-rutube="${esc(item.topic)}">По этой теме на RUTUBE ${icon('arrow')}</button>` : ''}</div>`;
    dialog.dataset.playing='false';
    if (video) document.getElementById('audio-engine')?.pause();
    if (!dialog.open) dialog.showModal();
    if (video && url) loadVideo(item,start);
  }
  window.addEventListener('message',event=>{
    const frame=dialog.querySelector('.player-frame iframe');
    if (!dialog.open || !frame || event.source!==frame.contentWindow || event.origin!==new URL(frame.src).origin) return;
    let data = event.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return; } }
    if (event.origin === 'https://rutube.ru' && data?.type === 'player:ready') {
      event.source.postMessage(JSON.stringify({type:'player:play',data:{}}),event.origin);
    }
    if (event.origin==='https://www.youtube.com' && data?.event==='onError') youtubeError(data.info);
    if (event.origin!=='https://rutube.ru') return;
    if (data?.type==='player:changeState') {
      const playing=data.data?.state==='playing';
      dialog.dataset.playing=String(playing);
      if (playing) videoStatus('');
    }
    if (data?.type==='player:error') videoStatus('RUTUBE не смог воспроизвести этот выпуск.');
  });
  document.addEventListener('error',event=>{
    const image=event.target;
    if (!(image instanceof HTMLImageElement) || !image.hasAttribute('data-media-image')) return;
    const poster=image.closest('.media-poster');
    if (image.dataset.contextSrc && !poster.classList.contains('is-context')) {
      poster.classList.add('is-context');
      image.alt=image.dataset.contextAlt;
      image.src=image.dataset.contextSrc;
    } else { poster.classList.remove('is-context'); image.remove(); }
  },true);
  function releasePlayer() {
    dialog.dataset.playing='false';
    openVideo=null;
    destroyPlayer();
    document.getElementById('media-detail').replaceChildren();
  }
  dialog.addEventListener('close',()=>{ if(!dialog.open) releasePlayer(); });
  dialog.addEventListener('cancel',releasePlayer);
  dialog.addEventListener('click',event=>{
    if (event.target.closest('[data-video-retry]') && openVideo?.platform==='youtube') {
      loadVideo(openVideo,videoStart);
      return;
    }
    const related=event.target.closest('[data-related-rutube]');
    if (related) {
      releasePlayer(); dialog.close();
      location.hash = 'video/rutube/' + encodeURIComponent(related.dataset.relatedRutube);
      return;
    }
    if (event.target === dialog || event.target.closest('[data-close-media],[data-audio-edition]')) { releasePlayer(); dialog.close(); }
  });
  document.addEventListener('toggle',event=>{
    if (event.target.isConnected && event.target.matches('#media-panel .filter-drawer')) settings(current).drawer=event.target.open;
  },true);
  document.addEventListener('change',event=>{
    const control = event.target.closest('[data-media-field]');
    if (control) change(control.dataset.mediaField,control.type==='checkbox'?control.checked:control.value,`[data-media-field="${control.dataset.mediaField}"]`);
  });
  document.addEventListener('click',event=>{
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-media-open')) openItem(button.dataset.kind,feeds[button.dataset.kind]?.items[Number(button.dataset.mediaOpen)]);
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
  return {
    panel, homeNews, poster, instant, duration, newMark,
    currentVideo:()=>openVideo,
    watch(item, start = 0) { openItem('videos', item, Math.max(0, Math.floor(Number(start) || 0))); },
    selectVideos({mine=false,source='',onlyPlatform='',...values}={}) {
      mineOnly=mine;channel=source;videoPlatform=onlyPlatform;delete filters.videos;Object.assign(settings('videos'),values);
    },
    set(kind,data) {
      if (kind==='videos') {
        sourceAuthors=new Map((data.sources||[]).map(s=>[s.name,authorsById.get(s.creatorChannel||s.id)||(s.platform==='youtube'&&authorsByName.get(s.name))]).filter(([,profile])=>profile));
        for (const profile of creatorProfiles) if (!sourceAuthors.has(profile.name)) sourceAuthors.set(profile.name,profile);
      }
      feeds[kind]=data;
    }
  };
}
