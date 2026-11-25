function createCreatorDesk({esc, icon, media, byId}) {
  const profiles = new Map(creatorProfiles.map(profile => [profile.handle, profile]));
  const topics = ['Бизнес', 'Карьера', 'Деньги', 'Мотивация'];
  const podcastFormats = new Set(['Интервью','Видеоподкаст','Соло-подкаст','Круглый стол']);
  const dateOrder = (a,b) => b.episode.published.localeCompare(a.episode.published);
  const route = p => '#video/authors/' + encodeURIComponent(p.handle);

  function preview(profile, large = false) {
    return `<button type="button" class="creator-preview" data-creator-play="${esc(profile.handle)}" aria-label="Смотреть на сайте · ${esc(profile.episode.title)}">
      ${media.poster(profile.episode,'videos',large)}</button>`;
  }
  function metadata(profile) {
    return `<span class="creator-meta">${media.instant(profile.episode.published)} ${media.newMark(profile.episode,'videos')}</span>`;
  }
  function card(profile) {
    return `<article class="creator-card">${preview(profile)}
      <div class="creator-byline"><span>${esc(profile.name)}</span><span>${profile.lang.toUpperCase()}</span></div>
      <h3><a href="${route(profile)}">${esc(profile.headline)}</a></h3>
      <p class="creator-format">${esc(profile.topic)} · ${esc(profile.format)}</p>${metadata(profile)}
      <a class="text-link" href="${route(profile)}">Разбор выпуска ${icon('arrow')}</a></article>`;
  }
  function featured(profile) {
    return `<article class="creator-feature">${preview(profile,true)}<div class="creator-feature-copy">
      <span class="creator-byline">${esc(profile.name)} · ${esc(profile.format)}</span>
      <h2><a href="${route(profile)}">${esc(profile.headline)}</a></h2><p>${esc(profile.intro)}</p>
      ${metadata(profile)}<a class="text-link" href="${route(profile)}">К разбору выпуска ${icon('arrow')}</a></div></article>`;
  }
  function index(filter) {
    const videoPodcasts = filter === 'podcasts';
    const selected = topics.includes(filter) ? filter : '';
    const rows = creatorProfiles.filter(p => videoPodcasts ? podcastFormats.has(p.format) : !selected || p.topic === selected).sort(dateOrder);
    const filters = [['','Все авторы'], ...topics.map(topic=>[topic,topic]), ['podcasts','Разговорные выпуски']];
    const lead = rows[0];
    return `<nav class="chips creator-topics" aria-label="Подборки авторов">${filters.map(([key,label])=>
      `<a class="chip" href="#video/authors${key ? '/'+encodeURIComponent(key) : ''}" ${key===(videoPodcasts?'podcasts':selected)?'aria-current="page"':''}>${esc(label)}</a>`).join('')}</nav>
      <p class="creator-count" role="status">Каналов в подборке · ${rows.length}</p>
      ${lead ? featured(lead) : ''}${rows.length>1 ? `<div class="creator-grid">${rows.slice(1).map(card).join('')}</div>` : ''}`;
  }
  function detail(profile) {
    const handle = esc(profile.handle), key = encodeURIComponent(profile.handle);
    const ep = profile.episode, chapter = profile.chapter;
    return `<article class="creator-detail"><div class="creator-detail-meta"><span>${esc(profile.format)} · ${esc(profile.topic)} · ${profile.lang==='ru'?'На русском':'На английском'}</span>${metadata(profile)}</div>
      <div class="creator-profile-spread">${preview(profile,true)}<div><h2>${esc(profile.headline)}</h2><p>${esc(profile.intro)}</p>
      <button class="button primary" type="button" data-creator-play="${handle}">${icon('play')} Смотреть с начала · ${media.duration(ep.duration)}</button>
      ${profile.audioId ? `<a class="text-link creator-audio-link" href="#audio/podcasts/${profile.audioId}">${icon('audio')} Аудиоверсия этого выпуска</a>` : ''}</div></div>
      <div class="creator-notes"><section><h2>На что обратить внимание</h2><p>${esc(ep.summary)}</p>
      ${chapter ? `<button class="chapter-link" type="button" data-creator-play="${handle}" data-creator-chapter><b>${media.duration(chapter.start)}</b>${esc(chapter.label)} ${icon('play')}</button>` : ''}
      <p class="creator-source">Название у автора · <a href="${esc(ep.url)}" target="_blank" rel="noopener noreferrer" lang="${profile.lang}">${esc(ep.title)} ↗</a></p></section>
      <section><h2>Читать по теме</h2><div class="link-list">${profile.reading.map(([id,relation]) => {
        const item=byId.get(id);
        return `<a class="link-row" href="#read/${id}"><span><span class="row-meta">${esc(relation)}</span><strong>${esc(item.title)}</strong></span>${icon('arrow')}</a>`;
      }).join('')}</div></section></div>
      <div class="creator-follow"><a class="button secondary" href="#video/channel/${key}">${icon('film')} Все видео канала</a>
      ${profile.podcast ? `<a class="button secondary" href="#audio/podcasts/${key}">${icon('audio')} Слушать · ${esc(profile.podcast)}</a>` : ''}
      <a class="text-link" href="https://www.youtube.com/channel/${esc(profile.id)}" target="_blank" rel="noopener noreferrer">Канал на YouTube ${icon('out')}</a></div></article>`;
  }
  function channelList(profile) {
    const sorted=[...creatorProfiles].sort((a,b)=>a.name.localeCompare(b.name,'ru'));
    return `<div class="chosen-directory">${profile?`<div class="channel-focus"><h2>${esc(profile.name)}</h2><a class="text-link" href="${route(profile)}">Разбор выпуска ${icon('arrow')}</a></div>`:''}
      <details><summary>${icon('film')} Выбрать канал <small>${sorted.length}</small>${icon('chevron')}</summary><div class="channel-index">${sorted.map(p=>`<a href="#video/channel/${encodeURIComponent(p.handle)}" ${profile?.id===p.id?'aria-current="page"':''}><strong>${esc(p.name)}</strong><small>${esc(p.topic)} · ${esc(p.format)}</small></a>`).join('')}</div></details>
      <a class="text-link" href="#video/authors">Гид по авторам ${icon('arrow')}</a></div>`;
  }
  function related(id) {
    const matches = creatorProfiles.filter(p=>p.reading.some(([book])=>book===id));
    if (!matches.length) return '';
    return `<section class="creator-related"><h2>Смотреть вместе с материалом</h2><div class="link-list">${matches.map(p=>
      `<a class="link-row" href="${route(p)}"><span><span class="row-meta">${esc(p.name)} · ${esc(p.reading.find(([book])=>book===id)[1])}</span><strong>${esc(p.headline)}</strong></span>${icon('arrow')}</a>`).join('')}</div></section>`;
  }
  function home(selection) {
    return `<div class="creator-grid home-creators">${selection.map(card).join('')}</div>`;
  }
  document.addEventListener('click', event => {
    const button=event.target.closest('[data-creator-play]');
    if (!button) return;
    const profile=profiles.get(button.dataset.creatorPlay);
    if (profile) media.watch(profile.episode, button.hasAttribute('data-creator-chapter') ? profile.chapter?.start : 0);
  });
  return {profile:handle=>profiles.get(handle), index, detail, home, related, route, channelList};
}
