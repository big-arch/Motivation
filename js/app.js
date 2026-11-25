(() => {
  'use strict';

  const main = document.getElementById('main');
  const searchDialog = document.getElementById('search-dialog');
  const menuDialog = document.getElementById('menu-dialog');
  const searchInput = document.getElementById('search-input');
  const items = [...aiStories, ...creatorArticles, ...articles, ...editionArticles, ...books];
  const byId = new Map(items.map(item => [item.id, item]));
  const sections = {
    journal: ['Журнал', 'grid'], stories: ['Истории', 'layers'], museum: ['Музей провалов', 'archive'],
    library: ['Библиотека', 'book'], news:['Новости','news'], video:['Видео','film'], audio:['Аудио','audio'], support: ['Точка опоры', 'sun'],
    journey: ['Мой путь', 'check'], saved: ['Личный кабинет', 'bookmark'], resources: ['Ресурсы', 'write'], archive: ['Все материалы', 'layers'], about: ['О журнале', 'star']
  };
  const descriptions = {
    stories: 'Люди, компании и решения, которые изменили их путь.',
    museum: 'Деловые ошибки крупным планом. Что произошло, где сломалась модель и что можно взять из этого опыта.',
    library: 'Короткие конспекты книг о работе, деньгах и мышлении. В каждом есть главные мысли и одно упражнение.',
    archive: 'Все истории, разборы и книжные конспекты журнала.'
  };
  const featureIds = ['waymo','patagonia','yandex-alice','nike','nvidia-cuda','kodak'];
  const featuredDetails = {
    waymo:['Бизнес и ИИ','Сан-Франциско, США'], patagonia:['История номера','Фицрой, Аргентина'],
    'yandex-alice':['Бизнес и ИИ','Санкт-Петербург, Россия'], nike:['Из архива брендов','Орегон, США'],
    'nvidia-cuda':['Бизнес и ИИ','Тайбэй, Тайвань'], kodak:['Музей провалов','Рочестер, США']
  };
  const storageKeys = {saved:'founder.saved.v1', steps:'founder.steps.v1', thoughts:'founder.thoughts.v1',
    plan:'founder.plan.v1', journey:'founder.journey.v1', reading:'founder.reading.v1', audio:'founder.audio.v1'};
  const sessionFallback = new Map();
  const media = createMedia({esc,icon,external});
  const live = createLiveSections({esc,icon,external});
  const creators = createCreatorDesk({esc,icon,media,byId});
  let journey;
  const audio = createAudioLibrary({esc,icon,external,readState,writeState,notify,
    onPlan:task=>journey?.add(task),onChange:kind=>{
      document.querySelector('.saved-dot').hidden=!savedIds().size&&!audio.hasSaved();
      if (kind==='saved' && route()[0]==='saved') render();
    }});
  const motion = createJournalMotion(main);
  const studio = createThoughtStudio({esc,icon,readState,writeState,notify,onCollectionChange:refreshShelf});
  const planner = createPlannerData({esc,icon,dateKey,notify});
  const notebook = createNotebook(planner,{byId,external,studio,onPlan:task=>journey.add(task),onChange:()=>{calendar.paint();const door=document.getElementById('home-cabinet');if (door) door.innerHTML=cabinetDoor();if (route()[0]==='saved'&&!route()[1]) render();}});
  const calendar = createCabinetCalendar(planner,notebook);
  journey = createJourney({esc,icon,readState,writeState,notify,byId,moods,audio,
    onUpdate:()=>render(),syncStep,completeStep});
  let featureDay = dateKey();
  let featureIndex = dailyCoverIndex();
  const rotation = createCoverRotation(keepFocus=>showCover((featureIndex+1)%featureIds.length,keepFocus?'[data-cover-rotation]':undefined));
  let moodIndex = 0;
  let noteIndex = 0;
  let toastTimer;
  let installPrompt;
  let activeRoute = '';
  let activeMediaPath = '';

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
  function visual(item, coverArt = false) {
    if (!coverArt && archivePhotos[item.id]) {
      return `<img class="card-art" src="./assets/archive/${item.id}-card.webp" alt="" loading="lazy" decoding="async">`;
    }
    if (!item.image) {
      return `<div class="book-art book-${item.coverType}" aria-hidden="true"><small>${esc(item.author)}</small><strong>${esc(item.title)}</strong></div>`;
    }
    const file = `./assets/photos/${item.image}`;
    return `<img class="card-art" data-image="${item.image}" src="${file}-sm.webp" srcset="${file}-sm.webp 800w, ${file}.webp ${item.image === 'fitz-roy' ? 2048 : (['apple','wework','dodo'].includes(item.image) ? 1200 : 1440)}w" sizes="(max-width: 600px) 92vw, (max-width: 850px) 45vw, 30vw" alt="${esc(item.alt)}" loading="lazy" decoding="async">`;
  }
  function card(item, coverArt = false) {
    const href = `#read/${item.id}`;
    return `<article class="story-card">
      <a class="art-link" href="${href}" tabindex="-1" aria-hidden="true">${visual(item, coverArt === true)}</a>
      ${saveButton(item)}
      <div class="card-meta"><span class="kind">${esc(item.tag)}</span><span class="meta-sep">·</span>${readTime(item)}</div>
      <h3><a href="${href}">${esc(item.title)}</a></h3><p class="deck">${esc(item.intro)}</p>
    </article>`;
  }
  function sectionHead(title, label, route, star = false) {
    return `<div class="section-head"><div class="section-title">${star ? icon('star') : ''}<h2>${esc(title)}</h2></div><a class="section-link" href="#${route}">${esc(label)} ${icon('out')}</a></div>`;
  }
  function dailySelection(values, count) {
    const start=(Math.floor(Date.parse(featureDay+'T12:00:00Z')/86400000)*count)%values.length;
    return Array.from({length:Math.min(count,values.length)},(_,i)=>values[(start+i)%values.length]);
  }
  function dailyCoverIndex() {
    return Math.floor(Date.parse(featureDay+'T12:00:00Z')/86400000)%featureIds.length;
  }
  function showCover(index,focusSelector) {
    const root=document.getElementById('feature');
    if (!root) return;
    featureIndex=index;
    root.innerHTML=cover();
    motion.cover();
    if (focusSelector) root.querySelector(focusSelector)?.focus({preventScroll:true});
    rotation.schedule();
  }
  function cover() {
    const id = featureIds[featureIndex];
    const item = byId.get(id);
    const [rubric, place] = featuredDetails[id];
    const documentary=!item.image;
    const filename=documentary?`./assets/archive/${id}-1`:`./assets/photos/${item.image}`;
    const alt=documentary?archivePhotos[id][0].caption:item.alt;
    const sources=documentary?'':`srcset="${filename}-sm.webp 800w, ${filename}.webp ${id==='patagonia'?2048:1440}w" sizes="(max-width: 820px) 96vw, 70vw"`;
    return `<section class="cover" data-id="${id}" aria-label="Материалы номера" aria-roledescription="карусель">
      <img class="cover-art" alt="${esc(alt)}" src="${filename}.webp" ${sources} fetchpriority="high">
      <div class="cover-shade"></div>${saveButton(item)}
      <div class="cover-content"><div class="rubric">${rubric}</div>
        <h1>${esc(item.cover[0].slice(0,-1))}<span class="title-dot">.</span><em>${esc(item.cover[1])}</em></h1>
        <p class="cover-dek">${esc(item.intro)}</p>
        <div class="cover-actions"><a href="#read/${id}" class="button primary">Читать историю ${icon('arrow')}</a>${readTime(item,true)}</div>
      </div>
      <div class="cover-foot"><div class="slide-meter"><span class="folio-count"><b>0${featureIndex+1}</b><span> / ${String(featureIds.length).padStart(2,'0')}</span></span>
        <div class="slide-tabs" role="group" aria-label="Выбрать материал">${featureIds.map((key,n) => `<button class="slide-tab" data-slide="${n}" aria-label="Показать материал ${n+1}: ${esc(byId.get(key).title)}" aria-pressed="${n === featureIndex}"></button>`).join('')}</div></div>
        <div class="cover-paging"><button type="button" class="round-btn cover-rotation" data-cover-rotation aria-label="${rotation.enabled()?'Приостановить автосмену обложки':'Включить автосмену обложки'}" title="${rotation.enabled()?'Пауза':'Автосмена'}">${icon(rotation.enabled()?'pause':'play')}</button><span class="cover-location">${icon('pin')}${place}</span><button class="round-btn" data-shift="-1" aria-label="Предыдущая история">${icon('back')}</button><button class="round-btn" data-shift="1" aria-label="Следующая история">${icon('arrow')}</button></div>
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
  function cabinetDoor() {
    const count=notebook.entries().length;
    return `<aside class="cabinet-door" aria-label="Личный кабинет"><div class="door-top"><span class="door-emblem">${icon('person')}</span><span>В этом браузере</span></div>
      <h2><a href="#saved">Мой кабинет</a></h2><p>Идеи, цитаты и планы из журнала.</p>
      <nav class="door-links" aria-label="Быстрый вход в кабинет">
        <a href="#saved/diary">${icon('write')}<span>Дневник</span><small>${count||''}</small>${icon('chevron')}</a>
        <a href="#saved/calendar">${icon('calendar')}<span>Календарь</span>${icon('chevron')}</a>
        <a href="#journey">${icon('check')}<span>Мой путь</span>${icon('chevron')}</a>
      </nav><div class="door-foot"><button class="button" type="button" data-entry-new="note">${icon('plus')} Новая запись</button><a href="#saved">Моя полка ${icon('arrow')}</a></div></aside>`;
  }
  function home() {
    const now=new Date();
    const date=now.toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'}).replace(/\s?г\.$/,'');
    return `<div class="topline"><span><i class="folio-diamond"></i>Независимый бизнес-журнал</span><time datetime="${dateKey(now)}">${esc(date)}</time></div>
      <div class="issue-opening"><div id="feature">${cover()}</div>
      <section class="home-wire" aria-label="Последние новости"><div class="wire-heading"><h2>Новости</h2><a class="section-link" href="#news">Вся лента ${icon('arrow')}</a></div><div id="home-news">${media.homeNews()}</div></section>
      <div id="home-cabinet">${cabinetDoor()}</div></div>
      <section class="home-section" id="home-players" tabindex="-1"><div class="section-head"><div class="section-title"><h2>Подкасты на площадках</h2></div><a class="section-link" href="#audio">Всё аудио ${icon('arrow')}</a></div>${audio.homeServices()}</section>
      <section class="home-section home-ai">${sectionHead('Как строят бизнес с ИИ','Все истории об ИИ','stories/'+encodeURIComponent('ИИ'))}
        <div class="card-grid">${dailySelection(aiStories,3).map(item=>card(item)).join('')}</div></section>
      <section class="home-section home-picks">${sectionHead('Выбор редакции','Все материалы','archive',true)}
        <div class="card-grid">${['stories','museum','library'].map(section=>card(dailySelection(items.filter(i=>i.section===section),1)[0])).join('')}</div></section>
      ${live.slot('journal')}
      <div class="home-section personal"><section class="thought"><div class="panel-label">${icon('sun')} Мысль дня</div><blockquote>${esc(dailyNote()[0])}</blockquote>
        <div class="thought-actions"><button class="text-link" data-daily-card>${icon('layers')} Карточка мысли</button><a href="#support" class="text-link">К точке опоры ${icon('arrow')}</a></div></section>${stepBox()}</div>
      <section class="home-section">${sectionHead('Авторы в эфире','Мои 16 каналов','video/channels')}${creators.home(dailySelection(creatorProfiles,3))}</section>
      <section class="home-section home-audio">${sectionHead('Слушать в журнале','Всё аудио','audio')}<div id="home-audio">${audio.homeAudio()}</div></section>`;
  }
  function breadcrumb(title, route = 'journal', parent = 'Журнал') {
    return `<nav class="breadcrumb" aria-label="Путь по журналу"><a href="#${route}">${esc(parent)}</a>${icon('chevron')}<span>${esc(title)}</span></nav>`;
  }
  function pageHeading(title, desc) {
    return `<header class="page-heading">${breadcrumb(title)}<h1>${esc(title)}</h1>${desc ? `<p>${esc(desc)}</p>` : ''}</header>`;
  }
  function libraryTabs(selected = '') {
    return `<nav class="media-tabs chips" aria-label="Виды книг"><a href="#library" ${!selected?'aria-current="page"':''}>${icon('book')} Конспекты</a><a href="#library/open" ${selected==='open'?'aria-current="page"':''}>${icon('layers')} Открытая полка</a><a href="#audio/audiobooks">${icon('audio')} Аудиокниги</a></nav>`;
  }
  function openBooksPage() {
    return `<div class="page-main">${pageHeading('Открытая полка','Открытые издания из Open Library и Internet Archive. Новые книги подтягиваются автоматически; чтение доступно в официальной читалке.')}${libraryTabs('open')}<section id="audio-panel" aria-label="Открытая книжная полка">${audio.panel('open-books')}</section></div>`;
  }
  function catalog(section, filter = '') {
    if (section === 'library' && filter === 'open') return openBooksPage();
    const base = section === 'archive' ? items : items.filter(item => item.section === section);
    const labelFor = item => section === 'archive' ? sections[item.section][0] : item.topic;
    const tags = [...new Set(base.map(labelFor))];
    const selected = tags.includes(filter) ? filter : '';
    const shown = selected ? base.filter(item => labelFor(item) === selected) : base;
    return `<div class="page-main">${pageHeading(sections[section][0],descriptions[section])}${section==='library'?libraryTabs():''}
      <nav class="chips" aria-label="Фильтр материалов">${['',...tags].map(tag => `<a class="chip" href="#${section}${tag ? '/' + encodeURIComponent(tag) : ''}" ${tag === selected ? 'aria-current="page"' : ''}>${esc(tag || 'Все')}</a>`).join('')}</nav>
      ${selected?'':live.slot(section)}
      <div class="catalog-results"><p class="catalog-count" role="status">Материалов · ${shown.length}${selected ? ' из '+base.length : ''}</p><div class="card-grid">${shown.map(item => card(item)).join('')}</div></div></div>`;
  }
  const originalTakeaways = {
    patagonia:'Вернитесь туда, где пользуются вашим продуктом. Какой след он оставляет после покупки?',
    nike:'Дайте первый образец тому, кто ежедневно встречается с задачей. Вернитесь за ним сразу после испытания.',
    kodak:'Что заставляет клиента платить повторно? Проверьте, сохраняет ли новая технология этот повод.',
    dodo:'Проведите смену рядом с командой. Запишите, когда люди ждут, что переписывают и о чём спрашивают друг друга.',
    mac:'Дайте человеку одну задачу и посмотрите, куда он укажет первым. Привычный образ работает, когда подсказывает действие.',
    wework:'Сравните сроки своих обязательств с тем, как быстро клиент может отказаться от покупки.'
  };
  function actionFor(item) {
    return item.exercise || item.takeaway || originalTakeaways[item.id] || 'Запишите одну идею материала и действие, которое можно выполнить за 15 минут.';
  }
  function challengeFor(item) {
    const challenges = {
      'Психология':'Выберите одну привычку и повторяйте её минимальную версию пять дней. Каждый раз записывайте одно наблюдение.',
      'Деньги':'Составьте на неделю простую таблицу обязательств, запаса и одного решения, которое увеличит вашу свободу.',
      'Карьера':'Назначьте три рабочих сеанса и получите в каждом один результат, который можно показать коллеге или клиенту.',
      'Технологии':'Проведите на этой неделе один небольшой эксперимент с новой технологией и заранее запишите критерий вывода.',
      'Стратегия':'Проверьте одну ключевую гипотезу вашего проекта: поговорите с тремя людьми и сравните их ответы со своим планом.'
    };
    return challenges[item.topic] || 'Примените идею материала в одном реальном деле на этой неделе и запишите, что изменилось в результате.';
  }
  function photoFigure(item, index) {
    const photo = archivePhotos[item.id][index];
    const file = `./assets/archive/${item.id}-${index+1}.webp`;
    const license = external(photo.licenseUrl);
    return `<figure class="archive-figure"><a class="archive-print" href="${file}" target="_blank" rel="noopener" aria-label="Увеличить фотографию · ${esc(photo.caption)}">
      <img src="${file}" width="${photo.width}" height="${photo.height}" alt="${esc(photo.caption)}" loading="${index?'lazy':'eager'}" decoding="async"></a>
      <figcaption><span>${esc(photo.caption)}</span><small>${esc(photo.credit)} · ${license ? `<a href="${esc(license)}" target="_blank" rel="noopener noreferrer">${esc(photo.license)}</a>` : esc(photo.license)} · <a href="${esc(external(photo.source))}" target="_blank" rel="noopener noreferrer">Оригинал ↗</a></small></figcaption></figure>`;
  }
  function pairedReading(item) {
    const ai=item.pair?item:aiStories.find(story=>story.pair[0]===item.id);
    if (!ai) return '';
    const partner=ai===item?byId.get(ai.pair[0]):ai;
    return `<aside class="paired-reading"><small>Читать в паре</small><h2><a href="#read/${esc(partner.id)}">${esc(partner.title)} ↗</a></h2><p>${esc(ai.pair[1])}</p></aside>`;
  }
  function readArticle(item) {
    const parent = sections[item.section][0];
    const inlineImage = photoFigure(item,1);
    const takeaway = item.takeaway || originalTakeaways[item.id];
    const body = item.ideas ? `<h2>Для кого эта книга</h2><p>${esc(item.audience)}</p><h2>Главные мысли</h2>
      <ol class="ideas">${item.ideas.map((idea,i) => `<li>${esc(idea)}<button class="text-link" data-idea="${item.id}" data-index="${i}">${icon('layers')} Карточка мысли</button></li>`).join('')}</ol>
      ${inlineImage}<div class="book-diary"><span>${icon('write')} Мой дневник</span><h2>Цитата на память</h2><p>Выпишите фрагмент, к которому хотите вернуться. Книга и автор уже заполнены.</p><button type="button" class="button secondary" data-book-quote="${esc(item.id)}">${icon('plus')} Записать цитату</button></div><h2>Попробуйте сегодня</h2><p class="lead-note">${esc(item.exercise)}</p>` :
      `<ul class="timeline">${item.timeline.map(([year,event]) => `<li><b>${esc(year)}</b>${esc(event)}</li>`).join('')}</ul>
      ${item.paragraphs.map(([title,paras],i) => `<section><h2>${esc(title)}</h2>${paras.map(p => `<p>${esc(p)}</p>`).join('')}</section>${i===0?inlineImage:''}`).join('')}
      <aside class="article-thought"><div class="panel-label">${icon('write')} Для своего дела</div><blockquote>${esc(takeaway)}</blockquote>
      <button class="text-link" data-takeaway="${item.id}">${icon('layers')} Сделать карточку мысли</button></aside>`;
    const family = items.filter(other=>other.section===item.section);
    const next = family[(family.indexOf(item)+1)%family.length];
    return `<article class="article-top">${breadcrumb(item.topic, item.section, parent)}
      <div class="article-spread"><header class="article-intro"><div class="card-meta"><span class="kind">${esc(item.author || item.tag)}</span><span class="meta-sep">·</span>${readTime(item,true)}</div>
      <h1>${esc(item.title)}</h1><p class="page-dek">${esc(item.intro)}</p><div class="article-response">${saveButton(item,true)}<button class="button primary" type="button" data-material-note="${esc(item.id)}">${icon('write')} ${item.ideas?'Записать идею':item.section==='museum'?'Разобрать урок':'Разобрать идею'}</button></div></header>
      ${photoFigure(item,0)}</div>
      <div class="reading">${body}${journey.practice(item,actionFor(item),challengeFor(item))}${item.ideas?journey.bookProgress(item):''}<section class="sources"><h2>${item.ideas ? 'Об издании' : 'Источники'}</h2>
      ${item.sources.map(([label,url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join('')}</section>
      ${pairedReading(item)}${creators.related(item.id)}<div class="article-next"><a class="text-link" href="#${item.section}">${icon('back')} ${parent}</a><a class="text-link next-story" href="#read/${next.id}">${esc(next.title)} ${icon('arrow')}</a></div></div></article>`;
  }
  function savedPage() {
    const ids = Array.from(savedIds()).reverse();
    return `<div class="page-main cabinet cabinet-shelf">${planner.header('','Личный кабинет','Ваша личная подборка материалов и действий.',`<button class="button primary" data-entry-new="note">${icon('plus')} Новая запись</button>`)}
      <div class="cab-portals"><a href="#saved/diary">${icon('write')}<span><b>Мой дневник</b><small>Записей · ${notebook.entries().length}</small></span>${icon('arrow')}</a>
      <a href="#saved/calendar">${icon('calendar')}<span><b>Календарь</b><small>${esc(planner.dayLabel(dateKey(),{weekday:'long',day:'numeric',month:'long'}))}</small></span>${icon('arrow')}</a>
      <a href="#journey">${icon('check')}<span><b>Мой путь</b><small>Действия и результаты</small></span>${icon('arrow')}</a></div>
      <div class="section-head"><div class="section-title"><h2>Мои закладки</h2></div></div>
      ${ids.length ? `<div class="card-grid">${ids.map(id => card(byId.get(id))).join('')}</div>` :
        `<div class="empty-state"><h2>Пока пусто</h2><p>Нажмите на закладку у любой истории или книги, чтобы вернуться к ней здесь.</p><a class="button secondary" href="#archive">Найти материал ${icon('arrow')}</a></div>`}
      ${audio.savedMarkup()}<div id="saved-thoughts">${studio.shelf()}</div><div class="saved-step">${stepBox()}<a class="button primary journey-link" href="#journey">Открыть «Мой путь» ${icon('arrow')}</a></div></div>`;
  }
  function refreshShelf() {
    const shelf = document.getElementById('saved-thoughts');
    if (shelf) shelf.innerHTML = studio.shelf();
  }
  function supportCard() {
    const [quote, story, action] = moods[moodIndex].notes[noteIndex];
    return `${icon('sun')}<blockquote>${esc(quote)}</blockquote><p>${esc(story)}</p><p class="support-task"><b>Один маленький шаг</b>${esc(action)}</p>
      <div class="action-row"><button class="button primary" data-next-note>${icon('refresh')} Другая мысль</button>
      <button class="button secondary" data-export-note>${icon('layers')} Оформить карточку</button></div>`;
  }
  function supportPage() {
    return `<div class="support-page page-main">${breadcrumb('Точка опоры')}<h1>Точка опоры</h1><p class="page-dek">Что сейчас занимает ваши мысли?</p>
      <div class="chips" role="group" aria-label="Выберите состояние">${moods.map((m,i) => `<button class="chip" data-mood="${i}" aria-pressed="${moodIndex === i}">${esc(m.label)}</button>`).join('')}</div>
      <section class="support-card" id="support-card" aria-live="polite">${supportCard()}</section>${live.slot('support')}</div>`;
  }
  function resourcePage() {
    return `<div class="page-main">${pageHeading('Ресурсы','Рабочие материалы для запуска идеи и разговора с первыми клиентами.')}<div class="toolbox link-list">${resources.map(([role,title,desc,url]) =>
      `<a class="link-row" href="${url}" target="_blank" rel="noopener noreferrer"><div><span class="row-meta">${esc(role)}</span><strong>${esc(title)}</strong><span class="secondary-copy">${esc(desc)}</span></div>${icon('out')}</a>`).join('')}</div>${live.slot('resources')}</div>`;
  }
  function aboutPage() {
    return `<div class="page-main">${pageHeading('О журнале','FOUNDER. рассказывает о людях, которые строят своё дело, и о цене их решений.')}
      <div class="reading about"><h2>Как устроен журнал</h2><p>В историях мы восстанавливаем путь от первого опыта до поворотного решения. В «Музее провалов» разбираем, где перестала работать бизнес-модель. В конце материалов стоят ссылки на документы компаний, архивы и страницы издателей.</p>
      <p>Книжные конспекты и заметки «Точки опоры» написаны редакцией. Лекции и подкасты поступают из официальных RSS, аудиокниги — из LibriVox, открытые издания — из Open Library и Internet Archive. Виджеты Spotify и Яндекс Музыки принадлежат соответствующим площадкам.</p><p>В «Моём пути» можно поставить цель, взять задание из материала, выбрать маршрут и записать итог. Позиция аудио, прогресс чтения, закладки, план и коллекция карточек хранятся только на вашем устройстве.</p>
      <h2>На экране телефона</h2><p>В Safari откройте меню «Поделиться» и выберите «На экран Домой». В Chrome на Android выберите «Установить приложение» или «Добавить на главный экран». После первой загрузки истории и книги можно читать офлайн.</p>
      <h2>Данные личного кабинета</h2><p>Дневник и события с пометкой «В этом браузере» сохраняются в хранилище сайта на устройстве. Каждую запись можно скачать. При очистке данных сайта браузер удалит местную копию.</p><p>После входа через Google журнал показывает события основного календаря. Если в форме выбрать «В Google Календаре», название, время и описание события отправятся в ваш Google-аккаунт. Доступ действует в текущей вкладке. Его можно отозвать кнопкой «Отключить» или в настройках аккаунта Google. Записи дневника хранятся отдельно.</p>
      <h2>Изображения</h2><p>В каждой статье есть две документальные фотографии. Под снимками указаны автор, лицензия и ссылка на оригинал. Файлы уменьшены и переведены в WebP для быстрой загрузки. Фотография Фицроя на обложке взята с Unsplash. Предметные обложки Nike, Kodak и книги Джеймса Клира на главной созданы с помощью ImageGen.</p>
      <div class="sources"><a href="https://unsplash.com/photos/150fZ07GQqs">Фицрой на рассвете · Andrew Svk ↗</a><a href="https://unsplash.com/photos/B5BTFxsZ92M">Компьютер Apple · Marissa Lewis ↗</a><a href="https://unsplash.com/photos/KN9FYaoAAik">Пицца в печи · Brad ↗</a><a href="https://unsplash.com/photos/lIipHR8mi3o">Офис · Fer Troulik ↗</a></div>${live.slot('status')}</div></div>`;
  }
  const mediaTitles = {news:'Новости',videos:'Видео',authors:'Гид по авторам','all-audio':'Аудио',lectures:'Лекции',podcasts:'Подкасты',audiobooks:'Аудиокниги',services:'Яндекс Музыка и Spotify'};
  function mediaPage(kind,handle,format) {
    if (kind==='news') return `<div class="page-main media-page">${pageHeading('Новости','Деловая лента по времени публикации. Новое за последние сутки.')}<section id="media-panel" aria-label="Новости">${media.panel('news')}</section></div>`;
    if (kind==='services') return `<div class="page-main media-page">${pageHeading(mediaTitles.services,'')}${audio.servicesPanel()}</div>`;
    const isVideo=kind==='videos' || kind==='authors';
    const profile=isVideo && creators.profile(handle);
    const mine=kind==='authors'||handle==='channels'||Boolean(profile);
    const title=isVideo?'Видео':'Аудио';
    const alternative=isVideo && (handle.startsWith('rutube-') || ['vimeo','without-youtube'].includes(handle));
    const options=isVideo?[['#video','Все каналы',!mine&&!alternative],['#video/channels','Мои 16 каналов',mine],['#video/without-youtube','Без YouTube',alternative]]:
      [['#audio','Всё аудио',kind==='all-audio'],['#audio/lectures','Лекции',kind==='lectures'],['#audio/podcasts','Подкасты',kind==='podcasts'],['#audio/audiobooks','Аудиокниги',kind==='audiobooks']];
    const tabs=`<nav class="format-tabs" aria-label="Выбор подборки">${options.map(([url,label,active])=>`<a href="${url}" ${active?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
    const path=location.hash.split('?')[0]||'#video';
    const formats=kind==='videos'?`<nav class="video-filters" aria-label="Формат видео">${[['full','Полные видео'],['shorts','Короткие / Shorts'],['all','Все форматы']].map(([key,label])=>`<a class="chip" href="${esc(path+(key==='full'?'':'?format='+key))}" ${key===format?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`:'';
    const platforms=alternative?`<nav class="video-platforms" aria-label="Площадка">${[['#video/without-youtube','Все площадки',handle==='without-youtube'],['#video/rutube','RUTUBE',handle.startsWith('rutube-')],['#video/vimeo','Vimeo',handle==='vimeo']].map(([url,label,active])=>`<a href="${url}" ${active?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`:'';
    let panel;
    if (kind==='authors') panel=profile?`<h2 class="channel-heading">${esc(profile.name)}</h2>${creators.detail(profile)}`:creators.index(handle);
    else if (isVideo) panel=`${mine?creators.channelList(profile):''}<section id="media-panel" aria-label="Выпуски">${media.panel('videos')}</section>`;
    else panel=`<section id="audio-panel" aria-label="${esc(mediaTitles[kind])}">${audio.panel(kind)}</section>`;
    return `<div class="page-main media-page format-page">${pageHeading(title,isVideo?'Выпуски и документальные фильмы о бизнесе, карьере и деньгах.':'Лекции, разговоры и книги в одном плеере.')}${isVideo?tabs+platforms+formats:`<div class="format-desk">${tabs}<a class="text-link" href="#journal/players">Яндекс Музыка и Spotify ${icon('arrow')}</a></div>`}${panel}</div>`;
  }
  function route() {
    try {
      const [path, query='']=location.hash.slice(1).split('?');
      const [section,part='',detail='']=path.split('/').map(decodeURIComponent);
      if (section==='news') return ['media','news',''];
      if (section==='video') {
        if (part==='authors') return ['media','authors',detail];
        const format=new URLSearchParams(query).get('format');
        const scope=part==='channel'?detail:part==='rutube'?'rutube-'+detail:['channels','vimeo','without-youtube'].includes(part)?part:'';
        return ['media','videos',scope,['shorts','all'].includes(format)?format:'full'];
      }
      if (section==='audio') return ['media',['lectures','podcasts','audiobooks'].includes(part)?part:'all-audio',detail];
      if (section==='media') return ['media',Object.hasOwn(mediaTitles,part)?part:'news',detail];
      return [section||'journal',part,detail];
    } catch {return ['missing','',''];}
  }
  function render({focus = false} = {}) {
    const [section,param,subparam,format='full'] = route();
    const audioEdition = section==='media' && param==='podcasts' && subparam.startsWith('audio-') && creatorProfiles.find(p=>p.audioId===subparam);
    const mediaPath = section==='media' ? [param || 'news', subparam, ...(param==='videos'?[format]:[])].join('/') : '';
    if (mediaPath !== activeMediaPath) {
      const profile = audioEdition || creators.profile(subparam);
      if (section==='media' && param==='videos') {
        if (profile) media.selectVideos({source:profile.name,mine:true,format});
        else if (subparam.startsWith('rutube-')) media.selectVideos({onlyPlatform:'rutube',topic:subparam.slice(7),format});
        else if (['vimeo','without-youtube'].includes(subparam)) media.selectVideos({onlyPlatform:subparam,format});
        else media.selectVideos({mine:subparam==='channels',format});
      }
      if (section==='media' && param==='podcasts') {
        if (profile?.podcast) audio.selectPodcast(profile.podcast);
        else if (activeMediaPath.startsWith('podcasts/') && activeMediaPath!=='podcasts/') audio.selectPodcast('');
      }
    }
    const item = section === 'read' && byId.get(param);
    let nav = item ? item.section : section;
    let title = item ? item.title : sections[section]?.[0];
    if (section==='library' && param==='open') title='Открытая полка';
    if (section==='media') nav=param==='news'?'news':['videos','authors'].includes(param)?'video':'audio';
    if (section==='media') title=(param==='authors' && creators.profile(subparam)?.name) || mediaTitles[param||'news'] || 'Медиа';
    let view;
    if (section === 'journal') view = home();
    else if (item) view = readArticle(item);
    else if (Object.hasOwn(descriptions,section)) view = catalog(section,param);
    else if (section === 'saved') {
      if (param==='diary') { title='Мой дневник'; view=notebook.view(subparam); }
      else if (param==='calendar') { title='Мой календарь'; view=calendar.view(subparam); }
      else view=savedPage();
    }
    else if (section === 'journey') {
      if (param === 'routes') { title='Маршруты'; view=`<div class="page-main">${pageHeading('Маршруты','Последовательные программы от первого шага до устойчивых изменений.')}${journey.routesPage()}</div>`; }
      else if (param === 'route' && journeyRoutes.some(route=>route.id===subparam)) {
        const selected=journeyRoutes.find(route=>route.id===subparam); title=selected.title;
        view=`<div class="page-main">${pageHeading(selected.title,selected.description)}${journey.routePage(selected.id)}</div>`;
      } else view=`<div class="page-main">${pageHeading('Мой путь','Цель на неделю, действия из материалов и спокойный прогресс без штрафов за паузы.')}<nav class="journey-cab" aria-label="Личный кабинет"><a href="#saved/calendar">${icon('calendar')} Мой календарь</a><a href="#saved/diary">${icon('write')} Мой дневник</a></nav><div id="journey-view">${journey.page()}</div>${live.slot('resources')}</div>`;
    }
    else if (section === 'support') {
      if (activeRoute !== 'support') noteIndex = Math.floor(Math.random() * moods[moodIndex].notes.length);
      view = supportPage();
    }
    else if (section === 'media') view = mediaPage(param || 'news', subparam, format);
    else if (section === 'resources') view = resourcePage();
    else if (section === 'about') view = aboutPage();
    else {
      title = 'Материал не найден';
      view = `<div class="page-main">${pageHeading(title,'Возможно, адрес изменился. Остальные материалы доступны в архиве.')}<a class="button primary" href="#archive">Открыть архив ${icon('arrow')}</a></div>`;
    }
    const sameCatalog = activeRoute === section && (Object.hasOwn(descriptions,section) || (section === 'media' && activeMediaPath===mediaPath));
    activeRoute = section;
    if (document.getElementById('audio-dialog').open && activeMediaPath!==mediaPath) document.getElementById('audio-dialog').close();
    activeMediaPath = mediaPath;
    main.innerHTML = view;
    if (section==='saved' && param==='diary') notebook.results();
    if (section==='saved' && param==='calendar') calendar.mount();
    if (audioEdition) audio.openEpisode(audioEdition.audioId);
    if (section==='media' && param==='videos') media.openLinked();
    const tabs = main.querySelector('.media-page>.media-tabs');
    if (tabs && tabs.scrollWidth > tabs.clientWidth) {
      const active = tabs.querySelector('[aria-current]');
      const offset = active.getBoundingClientRect().right - tabs.getBoundingClientRect().right;
      if (offset > 0) tabs.scrollLeft += offset + 12;
    }
    motion.route();
    rotation.mount();
    if (nav === 'archive') nav = 'journal';
    document.title = section === 'journal' ? 'FOUNDER. Независимый бизнес-журнал' : `${title} · FOUNDER.`;
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (nav === link.dataset.nav) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    document.querySelector('[data-menu]').toggleAttribute('data-active', !['journal','library','journey','saved'].includes(nav));
    document.querySelector('.saved-dot').hidden = !savedIds().size && !audio.hasSaved();
    if (section==='journal' && param==='players') { const players=document.getElementById('home-players');players.scrollIntoView();if (focus) players.focus({preventScroll:true}); }
    else if (focus) {
      if (sameCatalog) main.querySelector('.chips [aria-current]')?.focus({preventScroll:true});
      else { main.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
    }
  }
  const feedKinds=['news','videos','audio','open-books','sections','site-status'];
  const requested=new Map(), loaded=new Map(), pending=new Set();
  async function loadFeed(kind) {
    if (pending.has(kind)) return;
    requested.set(kind,Date.now());pending.add(kind);
    let data;
    const first=!loaded.has(kind);
    try {
      const response = await fetch(`./data/${kind}.json`,{cache:'no-cache'});
      if (!response.ok) throw new Error(String(response.status));
      data = await response.json();
      if (kind==='sections'||kind==='site-status') {
        if(data.schema!==1 || !(kind==='sections'?data.sections:data.catalogs)) throw new Error('Invalid edition');
        const version=JSON.stringify(data);
        if (loaded.get(kind)!==version) live.set(kind,data);
        loaded.set(kind,version);
        return;
      }
      if (!Array.isArray(data.items) || !data.items.length) throw new Error('Invalid feed');
      data.items = data.items.filter(item => item && typeof item.title === 'string' && external(item.url) &&
        (kind!=='audio' || external(item.audio)) && (kind!=='open-books' || external(item.embed)));
    } catch {
      if (!first || kind==='sections'||kind==='site-status') return;
      data={updated:null,items:[],sources:[]};
    } finally {pending.delete(kind);}
    if(data.items.length) {
      const version=data.updated+'/'+data.items.length;
      if(loaded.get(kind)===version) return;
      loaded.set(kind,version);
    } else if(!first) return;
    if(kind==='open-books') live.set(kind,data);
    const [section, param, subparam] = route();
    if (['news','videos'].includes(kind)) {
      media.set(kind,data);
      if (first && kind==='videos' && param==='videos') media.openLinked();
      if (section === 'journal' && kind === 'news') document.getElementById('home-news').innerHTML = media.homeNews();
      if (section === 'media' && kind === (param || 'news')) document.getElementById('media-panel').innerHTML = media.panel(kind);
    } else {
      audio.set(kind,data);
      if (section === 'journal' && kind === 'audio') document.getElementById('home-audio').innerHTML = audio.homeAudio();
      if (section === 'media' && kind === 'audio' && ['all-audio','lectures','podcasts','audiobooks'].includes(param)) {
        document.getElementById('audio-panel').innerHTML = audio.panel(param);
        if (first && param==='podcasts' && subparam.startsWith('audio-') && creatorProfiles.some(p=>p.audioId===subparam)) audio.openEpisode(subparam);
      }
      if (section === 'library' && param === 'open' && kind === 'open-books') document.getElementById('audio-panel').innerHTML = audio.panel('open-books');
    }
  }
  function toggleSave(id, button) {
    const set = savedIds();
    if (set.has(id)) set.delete(id); else set.add(id);
    const persisted = writeState('saved', [...set]);
    if (set.has(id)) navigator.serviceWorker?.ready.then(registration=>registration.active?.postMessage({article:id})).catch(()=>{});
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
    document.querySelector('.saved-dot').hidden = !set.size && !audio.hasSaved();
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
    const channels = tokens.length ? creatorProfiles.filter(p => {
      const text = normalized([p.handle,p.name,p.headline,p.intro,p.episode.title,p.topic,p.podcast,p.format,...p.reading.map(([id])=>byId.get(id).title)].join(' '));
      return tokens.every(token => text.includes(token.replace(/^@/,'')));
    }) : [];
    const count = suggestions.length + channels.length;
    const summary = tokens.length ? (count ? `Найдено · ${count}` : 'Ничего не нашлось. Попробуйте название бренда, имя автора или тему.') : 'Читают в журнале';
    document.getElementById('search-results').innerHTML = `<p class="search-summary" role="status">${summary}</p>${suggestions.map(item =>
      `<a class="link-row" href="#read/${item.id}"><div><span class="row-meta">${esc(item.tag)} · ${esc(item.author || item.topic)}</span><strong>${esc(item.title)}</strong></div>${icon('arrow')}</a>`).join('')}${channels.map(p=>
      `<a class="link-row" href="${creators.route(p)}"><div><span class="row-meta">Канал · ${esc(p.name)}</span><strong>${esc(p.headline)}</strong></div>${icon('arrow')}</a>`).join('')}`;
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
  function syncStep(text) {
    const log = stepLog();
    const key = dateKey();
    if (!log[key]?.text) { log[key]={text,done:false}; writeState('steps',log); }
  }
  function completeStep(item) {
    const log = stepLog();
    const key = dateKey();
    if (!log[key]?.text || log[key].text===item.text) { log[key]={text:item.text,done:true}; writeState('steps',log); }
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
    if (button.matches('a.wordmark,a[data-nav],#menu-items a') && button.hash === location.hash && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      main.focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});
      return;
    }
    if (button.hasAttribute('data-search')) return openSearch();
    if (button.hasAttribute('data-material-note')) {
      const item=byId.get(button.dataset.materialNote);
      if (item) notebook.fromMaterial({format:item.ideas?'book':item.section==='museum'?'failure':'story',title:item.title,author:item.author||'',href:'#read/'+item.id});
      return;
    }
    if (button.matches('[data-guide-note],[data-guide-extract-note]')) {
      const item=media.currentVideo();
      const body=button.hasAttribute('data-guide-extract-note')?button.closest('.guide-result').dataset.draft:media.guideDraft();
      if(item && body) notebook.fromMaterial({format:'video',title:item.title,author:item.source,href:item.url},body);
      return;
    }
    if (button.hasAttribute('data-video-note')||button.hasAttribute('data-listening-note')) {
      const video=button.hasAttribute('data-video-note'),item=video?media.currentVideo():audio.itemById(button.dataset.listeningNote);
      if (item) notebook.fromMaterial({format:video?'video':'audio',title:item.title,author:item.source,href:item.url});
      return;
    }
    if (journey.click(button)) return;
    if (button.hasAttribute('data-menu')) return menuDialog.showModal();
    if (button.hasAttribute('data-save')) return toggleSave(button.dataset.save,button);
    if (button.hasAttribute('data-cover-rotation')) {
      rotation.toggle(); return;
    }
    if (button.hasAttribute('data-shift') || button.hasAttribute('data-slide')) {
      const next=button.hasAttribute('data-slide')?Number(button.dataset.slide):(featureIndex+Number(button.dataset.shift)+featureIds.length)%featureIds.length;
      const selector=button.hasAttribute('data-slide')?`[data-slide="${next}"]`:`[data-shift="${button.dataset.shift}"]`;
      showCover(next,selector);
    }
    if (button.hasAttribute('data-mood') || button.hasAttribute('data-next-note')) {
      if (button.hasAttribute('data-mood')) { moodIndex = Number(button.dataset.mood); noteIndex = 0; }
      else noteIndex = (noteIndex+1) % moods[moodIndex].notes.length;
      main.querySelectorAll('[data-mood]').forEach(el => el.setAttribute('aria-pressed',Number(el.dataset.mood) === moodIndex));
      document.getElementById('support-card').innerHTML = supportCard();
      if (button.hasAttribute('data-next-note')) main.querySelector('[data-next-note]').focus({preventScroll:true});
    }
    if (button.hasAttribute('data-export-note')) studio.open({quote:moods[moodIndex].notes[noteIndex][0],credit:'Точка опоры · FOUNDER.'});
    if (button.hasAttribute('data-daily-card')) studio.open({quote:dailyNote()[0],credit:'Мысль дня · FOUNDER.'});
    if (button.hasAttribute('data-takeaway')) {
      const item=byId.get(button.dataset.takeaway);
      studio.open({quote:item.takeaway || originalTakeaways[item.id],credit:item.title+' · FOUNDER.'});
    }
    if (button.hasAttribute('data-idea')) {
      const book = byId.get(button.dataset.idea);
      studio.open({quote:book.ideas[Number(button.dataset.index)],credit:`По книге «${book.title}» · ${book.author}`});
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
    if (document.querySelector('dialog[open]:not(#search-dialog)')) return;
    const typing = event.target.matches('input,textarea,[contenteditable="true"]');
    if ((event.key === '/' && !typing || (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') && !searchDialog.open) {
      event.preventDefault(); openSearch();
    }
  });
  document.addEventListener('input',event => {
    if (journey.input(event.target)) return;
    const form = event.target.closest('.step-form');
    if (!form) return;
    const log = stepLog();
    log[form.dataset.day] = {text:form.elements.step.value,done:false};
    writeState('steps',log);
  });
  document.addEventListener('submit',event => {
    if (journey.submit(event.target)) { event.preventDefault(); return; }
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
    if (event.key?.startsWith(planner.prefix)) {
      notebook.syncVisible(); calendar.paint();
    } else if (event.key === null || Object.values(storageKeys).includes(event.key)) render();
  });
  function refreshDay() {
    if (document.hidden) return;
    if (!document.querySelector('dialog[open]')) {
      for (const kind of feedKinds) if(Date.now()-(requested.get(kind)||0)>=30*60000) loadFeed(kind);
    }
    if (dateKey()!==featureDay) { featureDay=dateKey();featureIndex=dailyCoverIndex();if (route()[0]==='journal') {render();return;} }
    const form = main.querySelector('.step-form');
    if (form && form.dataset.day !== dateKey()) render();
  }
  document.addEventListener('visibilitychange',refreshDay);
  window.addEventListener('online',()=>{requested.clear();refreshDay();});
  setInterval(refreshDay,60000);
  window.addEventListener('beforeinstallprompt',event => {
    event.preventDefault(); installPrompt = event; document.querySelector('.install').hidden = false;
  });
  window.addEventListener('appinstalled',() => { installPrompt = null; document.querySelector('.install').hidden = true; });
  window.addEventListener('hashchange',() => {
    if (searchDialog.open) searchDialog.close();
    if (menuDialog.open) menuDialog.close();
    document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    render({focus:true});
  });
  render();
  feedKinds.forEach(loadFeed);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();
