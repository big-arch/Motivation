(() => {
  'use strict';

  const main = document.getElementById('main');
  const searchDialog = document.getElementById('search-dialog');
  const menuDialog = document.getElementById('menu-dialog');
  const searchInput = document.getElementById('search-input');
  const items = [...articles, ...books];
  const byId = new Map(items.map(item => [item.id, item]));
  const sections = {
    journal: ['Журнал', 'grid'], stories: ['Истории', 'layers'], museum: ['Музей провалов', 'archive'],
    library: ['Библиотека', 'book'], media: ['Медиа', 'film'], support: ['Точка опоры', 'sun'],
    saved: ['Личный уголок', 'bookmark'], resources: ['Ресурсы', 'write'], archive: ['Все материалы', 'layers'], about: ['О журнале', 'star']
  };
  const descriptions = {
    stories: 'Люди, компании и решения, которые изменили их путь.',
    museum: 'Деловые ошибки крупным планом. Что произошло, где сломалась модель и что можно взять из этого опыта.',
    library: 'Короткие конспекты книг о работе, деньгах и мышлении. В каждом есть главные мысли и одно упражнение.',
    archive: 'Все истории, разборы и книжные конспекты журнала.'
  };
  const featureIds = ['patagonia', 'nike', 'kodak'];
  const featuredDetails = {
    patagonia: ['История номера', 'Фицрой, Аргентина'], nike: ['Из архива брендов', 'Орегон, США'], kodak: ['Музей провалов', 'Рочестер, США']
  };
  const feeds = {news: null, videos: null};
  const storageKeys = {saved: 'founder.saved.v1', steps: 'founder.steps.v1'};
  const sessionFallback = new Map();
  const dateFormat = new Intl.DateTimeFormat('ru', {day:'numeric',month:'long',year:'numeric'});
  let featureIndex = 0;
  let moodIndex = 0;
  let noteIndex = 0;
  let toastTimer;
  let installPrompt;
  let activeRoute = '';

  function esc(value) {
    const entities = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'};
    return String(value ?? '').replace(/[&<>"']/g, char => entities[char]);
  }
  function icon(name) {
    return `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  }
  function external(url) {
    try {
      const value = new URL(url);
      return value.protocol === 'https:' || value.protocol === 'http:' ? value.href : '';
    } catch { return ''; }
  }
  function readState(name, fallback) {
    if (sessionFallback.has(name)) return sessionFallback.get(name);
    try { return JSON.parse(localStorage.getItem(storageKeys[name])) ?? fallback; }
    catch { return fallback; }
  }
  function writeState(name, value) {
    try {
      localStorage.setItem(storageKeys[name], JSON.stringify(value));
      sessionFallback.delete(name);
      return true;
    } catch {
      sessionFallback.set(name, value);
      notify('Хранилище браузера недоступно. Данные сохранятся на время этой вкладки.');
      return false;
    }
  }
  function savedIds() {
    const value = readState('saved', []);
    return Array.isArray(value) ? new Set(value.filter(id => byId.has(id))) : new Set();
  }
  function stepLog() {
    const value = readState('steps', {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function dateKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
  }
  function dayStreak(log, today = new Date()) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
    if (!log[dateKey(date)]?.done) date.setDate(date.getDate()-1);
    let count = 0;
    while (log[dateKey(date)]?.done) {
      count++;
      date.setDate(date.getDate()-1);
    }
    return count;
  }
  function dayWord(n) {
    const tens = n % 100;
    return tens >= 11 && tens <= 14 ? 'дней' : ({1:'день',2:'дня',3:'дня',4:'дня'}[n % 10] || 'дней');
  }
  function notify(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 2800);
  }
  function minutes(item) {
    const text = item.ideas
      ? [item.audience, ...item.ideas, item.exercise].join(' ')
      : item.paragraphs.map(([title, paragraphs]) => [title, ...paragraphs].join(' ')).join(' ');
    return Math.max(1, Math.ceil((item.intro + ' ' + text).split(/\s+/).length / 165));
  }
  function readTime(item, expanded = false) {
    return `<span class="read-time">${icon('clock')}${minutes(item)} мин${expanded ? ' чтения' : ''}</span>`;
  }
  function saveButton(item, large = false) {
    const saved = savedIds().has(item.id);
    const label = saved ? 'Убрать из закладок' : 'В закладки';
    const cls = large ? 'button secondary save-action' : 'round-btn save-btn';
    return `<button class="${cls}" data-save="${item.id}" aria-pressed="${saved}" aria-label="${label}: ${esc(item.title)}" title="${label}">${icon('bookmark')}${large ? `<span>${saved ? 'В закладках' : 'В закладки'}</span>` : ''}</button>`;
  }
  function visual(item, large = false) {
    if (!item.image) {
      return `<div class="book-art book-${item.coverType}" aria-hidden="true"><small>${esc(item.author)}</small><strong>${esc(item.title)}</strong></div>`;
    }
    const file = `./assets/photos/${item.image}`;
    return `<img class="card-art" data-image="${item.image}" src="${file}${large ? '' : '-sm'}.webp" srcset="${file}-sm.webp 800w, ${file}.webp ${item.image === 'fitz-roy' ? 2048 : (['apple','wework','dodo'].includes(item.image) ? 1200 : 1440)}w" sizes="${large ? '(max-width: 960px) 92vw, 940px' : '(max-width: 600px) 92vw, (max-width: 850px) 45vw, 30vw'}" alt="${esc(item.alt)}" loading="${large ? 'eager' : 'lazy'}" decoding="async">`;
  }
  function card(item) {
    const href = `#read/${item.id}`;
    return `<article class="story-card">
      <a class="art-link" href="${href}" tabindex="-1" aria-hidden="true">${visual(item)}</a>
      ${saveButton(item)}
      <div class="card-meta"><span class="kind">${esc(item.tag)}</span><span class="meta-sep">·</span>${readTime(item)}</div>
      <h3><a href="${href}">${esc(item.title)}</a></h3><p class="deck">${esc(item.intro)}</p>
    </article>`;
  }
  function sectionHead(title, label, route, star = false) {
    return `<div class="section-head"><div class="section-title">${star ? icon('star') : ''}<h2>${esc(title)}</h2></div><a class="section-link" href="#${route}">${esc(label)} ${icon('out')}</a></div>`;
  }
  function cover() {
    const id = featureIds[featureIndex];
    const item = byId.get(id);
    const [rubric, place] = featuredDetails[id];
    const filename = `./assets/photos/${item.image}`;
    return `<section class="cover" data-id="${id}" aria-label="Материалы номера" aria-roledescription="карусель">
      <img class="cover-art" alt="${esc(item.alt)}" src="${filename}.webp" srcset="${filename}-sm.webp 800w, ${filename}.webp ${id === 'patagonia' ? 2048 : 1440}w" sizes="(max-width: 600px) 96vw, 84vw" fetchpriority="high">
      <div class="cover-shade"></div>${saveButton(item)}
      <div class="cover-content"><div class="rubric">${rubric}</div>
        <h1>${esc(item.cover[0].slice(0,-1))}<span class="title-dot">.</span><em>${esc(item.cover[1])}</em></h1>
        <p class="cover-dek">${esc(item.intro)}</p>
        <div class="cover-actions"><a href="#read/${id}" class="button primary">Читать историю ${icon('arrow')}</a>${readTime(item,true)}</div>
      </div>
      <div class="cover-foot"><div class="slide-meter"><span class="folio-count"><b>0${featureIndex+1}</b><span> / 03</span></span>
        <div class="slide-tabs" role="group" aria-label="Выбрать материал">${featureIds.map((key,n) => `<button class="slide-tab" data-slide="${n}" aria-label="Показать материал ${n+1}: ${esc(byId.get(key).title)}" aria-pressed="${n === featureIndex}"></button>`).join('')}</div></div>
        <div class="cover-paging"><span class="cover-location">${icon('pin')}${place}</span><button class="round-btn" data-shift="-1" aria-label="Предыдущая история">${icon('back')}</button><button class="round-btn" data-shift="1" aria-label="Следующая история">${icon('arrow')}</button></div>
      </div></section>`;
  }
  function stepBox() {
    const log = stepLog();
    const key = dateKey();
    const step = log[key] || {};
    const streak = dayStreak(log);
    return `<section class="step-box" aria-label="Трекер шага"><div class="panel-label">${icon('write')} Личный уголок</div><h2>Один шаг сегодня</h2>
      <p class="step-help">Что вы можете сделать для своего дела сегодня?</p>
      <form class="step-form" data-day="${key}"><input name="step" aria-label="Мой шаг на сегодня" placeholder="Мой шаг на сегодня" maxlength="180" value="${esc(step.text)}" required ${step.done ? 'readonly' : ''}>
      <button class="button ${step.done ? 'secondary' : 'primary'}" type="submit">${icon(step.done ? 'write' : 'check')}${step.done ? 'Изменить' : 'Выполнено'}</button></form>
      <p class="step-status">${step.done ? 'Шаг отмечен. ' : ''}Серия: <strong>${streak} ${dayWord(streak)}</strong></p></section>`;
  }
  function dailyNote() {
    const all = moods.flatMap(mood => mood.notes);
    const now = new Date();
    return all[Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000) % all.length];
  }
  function home() {
    const now = new Date();
    const date = now.toLocaleDateString('ru', {day:'numeric',month:'long',year:'numeric'}).replace(/\s?г\.$/,'');
    return `<div class="topline"><span><i class="folio-diamond"></i>Независимый бизнес-журнал</span><time datetime="${dateKey(now)}">${esc(date)}</time></div>
      <div id="feature">${cover()}</div>
      <section class="home-section home-picks">${sectionHead('Выбор редакции','Все материалы','archive',true)}
      <div class="card-grid">${['nike','kodak','habits'].map(id => card(byId.get(id))).join('')}</div></section>
      <div class="home-section personal"><section class="thought"><div class="panel-label">${icon('sun')} Мысль дня</div><blockquote>${esc(dailyNote()[0])}</blockquote>
        <a href="#support" class="text-link">К точке опоры ${icon('arrow')}</a></section>${stepBox()}</div>
      <section class="home-section feed-home">${sectionHead('Деловая лента','Все новости','media')}<div id="home-news">${feedList('news',3)}</div></section>`;
  }
  function breadcrumb(title, route = 'journal', parent = 'Журнал') {
    return `<nav class="breadcrumb" aria-label="Путь по журналу"><a href="#${route}">${esc(parent)}</a>${icon('chevron')}<span>${esc(title)}</span></nav>`;
  }
  function pageHeading(title, desc) {
    return `<header class="page-heading">${breadcrumb(title)}<h1>${esc(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ''}</header>`;
  }
  function catalog(section, filter = '') {
    const base = section === 'archive' ? items : items.filter(item => item.section === section);
    const labelFor = item => section === 'archive' ? sections[item.section][0] : item.topic;
    const tags = [...new Set(base.map(labelFor))];
    const selected = tags.includes(filter) ? filter : '';
    const shown = selected ? base.filter(item => labelFor(item) === selected) : base;
    return `<div class="page-main">${pageHeading(sections[section][0],descriptions[section])}
      <nav class="chips" aria-label="Фильтр материалов">${['',...tags].map(tag => `<a class="chip" href="#${section}${tag ? '/' + encodeURIComponent(tag) : ''}" ${tag === selected ? 'aria-current="page"' : ''}>${esc(tag || 'Все')}</a>`).join('')}</nav>
      <div class="catalog-results"><div class="card-grid">${shown.map(card).join('')}</div></div></div>`;
  }
  function readArticle(item) {
    const parent = sections[item.section][0];
    const body = item.ideas ? `<h2>Для кого эта книга</h2><p>${esc(item.audience)}</p><h2>Главные мысли</h2>
      <ol class="ideas">${item.ideas.map((idea,i) => `<li>${esc(idea)}<button class="text-link" data-idea="${item.id}" data-index="${i}">${icon('download')} Карточка мысли</button></li>`).join('')}</ol>
      <h2>Попробуйте сегодня</h2><p class="lead-note">${esc(item.exercise)}</p>` :
      `<ul class="timeline">${item.timeline.map(([year,event]) => `<li><b>${esc(year)}</b>${esc(event)}</li>`).join('')}</ul>
      ${item.paragraphs.map(([title,paras]) => `<section><h2>${esc(title)}</h2>${paras.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}`;
    return `<article class="article-top">${breadcrumb(item.author || item.tag, item.section, parent)}
      <header class="article-intro"><div class="card-meta"><span class="kind">${esc(item.author || item.tag)}</span><span class="meta-sep">·</span>${readTime(item,true)}</div>
      <h1>${esc(item.title)}</h1><p class="page-dek">${esc(item.intro)}</p>${saveButton(item,true)}</header>
      <figure class="article-figure">${visual(item,true)}${item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ''}</figure>
      <div class="reading">${body}<section class="sources"><h2>${item.ideas ? 'Об издании' : 'Источники'}</h2>
      ${item.sources.map(([label,url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join('')}</section>
      <div class="article-next"><a class="text-link" href="#${item.section}">${icon('back')} ${parent}</a></div></div></article>`;
  }
  function savedPage() {
    const ids = Array.from(savedIds()).reverse();
    return `<div class="page-main">${pageHeading('Личный уголок','Закладки и сегодняшнее дело хранятся в этом браузере.')}
      <div class="section-head"><div class="section-title"><h2>Мои закладки</h2></div></div>
      ${ids.length ? `<div class="card-grid">${ids.map(id => card(byId.get(id))).join('')}</div>` :
        `<div class="empty-state"><h2>Пока пусто</h2><p>Нажмите на закладку у любой истории или книги, чтобы вернуться к ней здесь.</p><a class="button secondary" href="#archive">Найти материал ${icon('arrow')}</a></div>`}
      <div class="saved-step">${stepBox()}</div></div>`;
  }
  function supportCard() {
    const [quote, story, action] = moods[moodIndex].notes[noteIndex];
    return `${icon('sun')}<blockquote>${esc(quote)}</blockquote><p>${esc(story)}</p><p class="support-task"><b>Один маленький шаг</b>${esc(action)}</p>
      <div class="action-row"><button class="button primary" data-next-note>${icon('refresh')} Другая мысль</button>
      <button class="button secondary" data-export-note>${icon('download')} Скачать карточку</button></div>`;
  }
  function supportPage() {
    return `<div class="support-page page-main">${breadcrumb('Точка опоры')}<h1>Точка опоры</h1><p class="page-dek">Что сейчас занимает ваши мысли?</p>
      <div class="chips" role="group" aria-label="Выберите состояние">${moods.map((m,i) => `<button class="chip" data-mood="${i}" aria-pressed="${moodIndex === i}">${esc(m.label)}</button>`).join('')}</div>
      <section class="support-card" id="support-card" aria-live="polite">${supportCard()}</section></div>`;
  }
  function resourcePage() {
    return `<div class="page-main">${pageHeading('Ресурсы','Рабочие материалы для запуска идеи и разговора с первыми клиентами.')}<div class="toolbox link-list">${resources.map(([role,title,desc,url]) =>
      `<a class="link-row" href="${url}" target="_blank" rel="noopener noreferrer"><div><span class="row-meta">${esc(role)}</span><strong>${esc(title)}</strong><span class="secondary-copy">${esc(desc)}</span></div>${icon('out')}</a>`).join('')}</div></div>`;
  }
  function aboutPage() {
    return `<div class="page-main">${pageHeading('О журнале','FOUNDER. рассказывает о людях, которые строят своё дело, и о цене их решений.')}
      <div class="reading about"><h2>Как устроен журнал</h2><p>В историях мы восстанавливаем путь от первого опыта до поворотного решения. В «Музее провалов» разбираем, где перестала работать бизнес-модель. В конце материалов стоят ссылки на документы компаний, архивы и страницы издателей.</p>
      <p>Книжные конспекты и заметки «Точки опоры» написаны редакцией. Карточку с мыслью можно скачать и сохранить в телефоне. Закладки и трекер хранятся на вашем устройстве.</p>
      <h2>На экране телефона</h2><p>В Safari откройте меню «Поделиться» и выберите «На экран Домой». В Chrome на Android выберите «Установить приложение» или «Добавить на главный экран». После первой загрузки истории и книги можно читать офлайн.</p>
      <h2>Изображения</h2><p>Фотографии опубликованы по лицензии Unsplash. Предметные иллюстрации для материалов о Nike, Kodak и книги Джеймса Клира созданы для журнала с помощью ImageGen.</p>
      <div class="sources"><a href="https://unsplash.com/photos/150fZ07GQqs">Фицрой на рассвете · Andrew Svk ↗</a><a href="https://unsplash.com/photos/B5BTFxsZ92M">Компьютер Apple · Marissa Lewis ↗</a><a href="https://unsplash.com/photos/KN9FYaoAAik">Пицца в печи · Brad ↗</a><a href="https://unsplash.com/photos/lIipHR8mi3o">Офис · Fer Troulik ↗</a></div></div></div>`;
  }
  function formatDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? dateFormat.format(date).replace(/\s?г\.$/,'') : '';
  }
  function feedList(kind, limit = 18) {
    const collection = feeds[kind];
    if (!collection) return '<p class="secondary-copy">Загружаем ленту…</p>';
    if (!collection.items.length) return '<p class="empty-state">Лента пока недоступна. Попробуйте открыть её позже.</p>';
    let entries = collection.items;
    if (kind === 'news' && limit === 3) {
      const seen = new Set();
      const leads = entries.filter(item => {
        if (seen.has(item.source)) return false;
        seen.add(item.source);
        return true;
      });
      entries = [...leads.filter(item => item.source !== 'TechCrunch'), ...leads.filter(item => item.source === 'TechCrunch')];
    }
    return `<div class="link-list">${entries.slice(0,limit).map(item => `<a class="link-row" href="${esc(external(item.url))}" target="_blank" rel="noopener noreferrer"><div><span class="row-meta">${esc(item.source)}${item.published ? ' · ' + esc(formatDate(item.published)) : ''}</span><strong>${esc(item.title)}</strong></div>${icon('out')}</a>`).join('')}</div>`;
  }
  function mediaPanel(kind) {
    const data = feeds[kind];
    return `<div class="feed-head"><h2>${kind === 'videos' ? 'Свежие выпуски' : 'Деловые новости'}</h2>
    ${data?.updated ? `<span class="feed-date">Последнее обновление · ${esc(formatDate(data.updated))}</span>` : ''}</div>${feedList(kind)}
    ${kind === 'videos' ? `<div class="feed-head"><h2>Каналы</h2></div><div class="channel-grid">${channels.map(([name,desc,url]) => `<a class="channel" href="${url}" target="_blank" rel="noopener noreferrer">${icon('film')}<strong>${esc(name)} ↗</strong><small>${esc(desc)}</small></a>`).join('')}</div>` : ''}`;
  }
  function mediaPage(kind) {
    return `<div class="page-main">${pageHeading('Медиа','Деловая повестка и разговоры с предпринимателями из открытых лент редакций и каналов.')}
      <nav class="chips" aria-label="Вид медиа"><a class="chip" href="#media" ${kind === 'news' ? 'aria-current="page"' : ''}>Новости</a><a class="chip" href="#media/videos" ${kind === 'videos' ? 'aria-current="page"' : ''}>Видео</a></nav>
      <div class="feed-block" id="media-panel">${mediaPanel(kind)}</div></div>`;
  }
  function route() {
    const parts = location.hash.slice(1).split('/');
    try { return [parts[0] || 'journal', decodeURIComponent(parts[1] || '')]; }
    catch { return ['missing','']; }
  }
  function render({focus = false} = {}) {
    const [section,param] = route();
    const item = section === 'read' && byId.get(param);
    let nav = item ? item.section : section;
    let title = item ? item.title : sections[section]?.[0];
    let view;
    if (section === 'journal') view = home();
    else if (item) view = readArticle(item);
    else if (Object.hasOwn(descriptions,section)) view = catalog(section,param);
    else if (section === 'saved') view = savedPage();
    else if (section === 'support') {
      if (activeRoute !== 'support') noteIndex = Math.floor(Math.random() * moods[moodIndex].notes.length);
      view = supportPage();
    }
    else if (section === 'media') view = mediaPage(param === 'videos' ? 'videos' : 'news');
    else if (section === 'resources') view = resourcePage();
    else if (section === 'about') view = aboutPage();
    else {
      title = 'Материал не найден';
      view = `<div class="page-main">${pageHeading(title,'Возможно, адрес изменился. Остальные материалы доступны в архиве.')}<a class="button primary" href="#archive">Открыть архив ${icon('arrow')}</a></div>`;
    }
    const sameCatalog = activeRoute === section && (Object.hasOwn(descriptions,section) || section === 'media');
    activeRoute = section;
    main.innerHTML = view;
    if (nav === 'archive') nav = 'journal';
    document.title = section === 'journal' ? 'FOUNDER. Независимый бизнес-журнал' : `${title} · FOUNDER.`;
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (nav === link.dataset.nav) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    document.querySelector('[data-menu]').toggleAttribute('data-active', !['journal','library','saved'].includes(nav));
    document.querySelector('.saved-dot').hidden = !savedIds().size;
    if (focus) {
      if (sameCatalog) main.querySelector('.chips [aria-current]')?.focus({preventScroll:true});
      else { main.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
    }
  }
  async function loadFeed(kind) {
    let data;
    try {
      const response = await fetch(`./data/${kind}.json`);
      if (!response.ok) throw new Error(String(response.status));
      data = await response.json();
      if (!Array.isArray(data.items)) throw new Error('Invalid feed');
      data.items = data.items.filter(item => item && typeof item.title === 'string' && external(item.url));
    } catch { data = {updated:null,items:[]}; }
    feeds[kind] = data;
    const [section, param] = route();
    if (section === 'journal' && kind === 'news') document.getElementById('home-news').innerHTML = feedList(kind,3);
    if (section === 'media' && kind === (param === 'videos' ? 'videos' : 'news')) document.getElementById('media-panel').innerHTML = mediaPanel(kind);
  }
  function toggleSave(id, button) {
    const set = savedIds();
    if (set.has(id)) set.delete(id); else set.add(id);
    const persisted = writeState('saved', [...set]);
    if (route()[0] === 'saved') {
      render();
      (main.querySelector('[data-save]') || main.querySelector('.empty-state a'))?.focus({preventScroll:true});
    } else {
      const item = byId.get(id);
      const wasFocused = button === document.activeElement;
      document.querySelectorAll(`[data-save="${id}"]`).forEach(node => {
        const container = document.createElement('div');
        container.innerHTML = saveButton(item, node.classList.contains('save-action'));
        const replacement = container.firstElementChild;
        node.replaceWith(replacement);
        if (node === button && wasFocused) replacement.focus({preventScroll:true});
      });
    }
    document.querySelector('.saved-dot').hidden = !set.size;
    if (persisted) notify(set.has(id) ? 'Сохранено в закладках' : 'Материал убран из закладок');
  }
  function searchResults() {
    const normalized = str => String(str).toLocaleLowerCase('ru').replaceAll('ё','е');
    const tokens = normalized(searchInput.value).trim().split(/\s+/).filter(Boolean);
    const matches = items.filter(item => {
      const haystack = normalized([item.id,item.title,item.topic,item.tag,item.intro,item.author,sections[item.section][0]].filter(Boolean).join(' '));
      return tokens.every(token => haystack.includes(token));
    });
    const suggestions = tokens.length ? matches : ['patagonia','nike','kodak','habits'].map(id => byId.get(id));
    const summary = tokens.length ? (suggestions.length ? `Найдено материалов: ${suggestions.length}` : 'Ничего не нашлось. Попробуйте название бренда, имя автора или тему.') : 'Читают в журнале';
    document.getElementById('search-results').innerHTML = `<p class="search-summary" role="status">${summary}</p>${suggestions.map(item =>
      `<a class="link-row" href="#read/${item.id}"><div><span class="row-meta">${esc(item.tag)} · ${esc(item.author || item.topic)}</span><strong>${esc(item.title)}</strong></div>${icon('arrow')}</a>`).join('')}`;
  }
  function openSearch() {
    if (menuDialog.open) menuDialog.close();
    searchInput.value = '';
    searchResults();
    if (!searchDialog.open) searchDialog.showModal();
    searchInput.focus();
  }
  function refreshStep(box, keepFocus = false) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = stepBox();
    const fresh = wrapper.firstElementChild;
    box.replaceWith(fresh);
    if (keepFocus) fresh.querySelector(fresh.querySelector('input').readOnly ? 'button' : 'input').focus({preventScroll:true});
  }
  async function downloadCard(text, credit) {
    try {
      await document.fonts.ready;
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      const paper = ctx.createLinearGradient(0,0,1080,1920);
      paper.addColorStop(0,'#262b23'); paper.addColorStop(1,'#161814');
      ctx.fillStyle = paper; ctx.fillRect(0,0,1080,1920);
      ctx.strokeStyle = '#967a50'; ctx.lineWidth = 2; ctx.strokeRect(54,54,972,1812);
      ctx.fillStyle = '#f1ca8b'; ctx.font = '700 54px Playfair, Georgia'; ctx.fillText('FOUNDER.',104,178);
      const wrap = (str,maxWidth) => {
        const lines = [];
        let line = '';
        for (const word of str.split(/\s+/)) {
          const candidate = line ? line + ' ' + word : word;
          if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
          else line = candidate;
        }
        if (line) lines.push(line);
        return lines;
      };
      ctx.fillStyle = '#f5efde'; ctx.font = 'italic 62px Playfair, Georgia';
      const lines = wrap(text,850);
      const start = 930 - ((lines.length-1)*85/2);
      lines.forEach((line,i) => ctx.fillText(line,110,start+i*85));
      ctx.fillStyle = '#e9bc77'; ctx.fillRect(110,1582,90,3);
      ctx.font = '32px Inter, Arial'; wrap(credit,850).forEach((line,i) => ctx.fillText(line,110,1650+i*43));
      const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/png'));
      if (!blob) throw new Error('PNG unavailable');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'founder-card.png'; document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url),60000);
      notify('Карточка PNG готова');
    } catch { notify('Не удалось создать карточку. Попробуйте ещё раз.'); }
  }
  document.getElementById('menu-items').innerHTML = Object.entries(sections).filter(([id]) => !['archive','about'].includes(id)).map(([id,[title,name]]) =>
    `<a class="link-row" href="#${id}"><strong>${esc(title)}</strong>${icon(name)}</a>`).join('');
  searchInput.addEventListener('input',searchResults);
  for (const dialog of [searchDialog,menuDialog]) {
    dialog.addEventListener('click',event => {
      if (event.target.closest('a,[data-close]')) dialog.close();
      else if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
  }
  document.addEventListener('click',event => {
    const button = event.target.closest('button,a');
    if (!button) return;
    if (button.classList.contains('skip')) { event.preventDefault(); main.focus(); return; }
    if (button.hasAttribute('data-search')) return openSearch();
    if (button.hasAttribute('data-menu')) return menuDialog.showModal();
    if (button.hasAttribute('data-save')) return toggleSave(button.dataset.save,button);
    if (button.hasAttribute('data-shift') || button.hasAttribute('data-slide')) {
      featureIndex = button.hasAttribute('data-slide') ? Number(button.dataset.slide) : (featureIndex+Number(button.dataset.shift)+featureIds.length)%featureIds.length;
      document.getElementById('feature').innerHTML = cover();
      const selector = button.hasAttribute('data-slide') ? `[data-slide="${featureIndex}"]` : `[data-shift="${button.dataset.shift}"]`;
      document.querySelector(selector).focus({preventScroll:true});
    }
    if (button.hasAttribute('data-mood') || button.hasAttribute('data-next-note')) {
      if (button.hasAttribute('data-mood')) { moodIndex = Number(button.dataset.mood); noteIndex = 0; }
      else noteIndex = (noteIndex+1) % moods[moodIndex].notes.length;
      main.querySelectorAll('[data-mood]').forEach(el => el.setAttribute('aria-pressed',Number(el.dataset.mood) === moodIndex));
      document.getElementById('support-card').innerHTML = supportCard();
      if (button.hasAttribute('data-next-note')) main.querySelector('[data-next-note]').focus({preventScroll:true});
    }
    if (button.hasAttribute('data-export-note')) downloadCard(moods[moodIndex].notes[noteIndex][0], 'Точка опоры · FOUNDER.');
    if (button.hasAttribute('data-idea')) {
      const book = byId.get(button.dataset.idea);
      downloadCard(book.ideas[Number(button.dataset.index)], `По книге «${book.title}» · ${book.author}`);
    }
    if (button.classList.contains('install') && installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      button.hidden = true;
      prompt.prompt().catch(() => notify('Установить журнал можно через меню браузера.'));
    }
  });
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && (searchDialog.open || menuDialog.open)) {
      event.preventDefault();
      (searchDialog.open ? searchDialog : menuDialog).close();
      return;
    }
    const typing = event.target.matches('input,textarea,[contenteditable="true"]');
    if ((event.key === '/' && !typing || (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') && !searchDialog.open) {
      event.preventDefault(); openSearch();
    }
  });
  document.addEventListener('input',event => {
    const form = event.target.closest('.step-form');
    if (!form) return;
    const log = stepLog();
    log[form.dataset.day] = {text:form.elements.step.value,done:false};
    writeState('steps',log);
  });
  document.addEventListener('submit',event => {
    const form = event.target.closest('.step-form');
    if (!form) return;
    event.preventDefault();
    const key = form.dataset.day;
    if (key !== dateKey()) {
      refreshStep(form.closest('.step-box'),true);
      notify('Начался новый день. Можно записать следующий шаг.');
      return;
    }
    const log = stepLog();
    const input = form.elements.step;
    const text = input.value.trim();
    if (!text) { input.value = ''; input.reportValidity(); return; }
    const done = !log[key]?.done;
    log[key] = {text,done};
    const persisted = writeState('steps',log);
    refreshStep(form.closest('.step-box'),true);
    if (persisted) notify(done ? 'Шаг за сегодня отмечен' : 'Теперь шаг можно изменить');
  });
  window.addEventListener('storage',event => {
    if (event.key === null || Object.values(storageKeys).includes(event.key)) render();
  });
  function refreshDay() {
    if (document.hidden) return;
    const form = main.querySelector('.step-form');
    if (form && form.dataset.day !== dateKey()) render();
  }
  document.addEventListener('visibilitychange',refreshDay);
  setInterval(refreshDay,60000);
  window.addEventListener('beforeinstallprompt',event => {
    event.preventDefault(); installPrompt = event; document.querySelector('.install').hidden = false;
  });
  window.addEventListener('appinstalled',() => { installPrompt = null; document.querySelector('.install').hidden = true; });
  window.addEventListener('hashchange',() => {
    if (searchDialog.open) searchDialog.close();
    if (menuDialog.open) menuDialog.close();
    render({focus:true});
  });
  render();
  loadFeed('news'); loadFeed('videos');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load',() => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
