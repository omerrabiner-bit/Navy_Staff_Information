  try{ history.scrollRestoration = 'manual'; }catch(err){}
  // ===== עזרים לתאריכים =====
  var NEW_DAYS = 14;                                   // כמה ימים תוכן נחשב "חדש"
  var DOT_DAYS = 7;                                    // למבקר חדש: נקודה רק על עמודים שעודכנו בשבוע האחרון
  function fmt(iso){ var p = iso.split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
  function daysAgo(iso){ return (Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86400000; }
  function store(key, val){
    try{
      if(val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    }catch(err){ return null; }
  }
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));

  // תאריך עדכון בכותרת של כל עמוד
  var updIcon = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  pages.forEach(function(p){
    var d = p.dataset.updated, box = p.querySelector('.page-head > div:last-child');
    if(!d || !box) return;
    var el = document.createElement('div');
    el.innerHTML = '<span class="pg-upd">' + updIcon + 'עודכן: ' + fmt(d) + '</span>';
    box.appendChild(el.firstChild);
  });

  // התאריך בכותרת האתר = העדכון האחרון מכל העמודים
  var latest = pages.map(function(p){ return p.dataset.updated || ''; }).sort().pop();
  var hdrUpd = document.querySelector('.updated');
  if(latest && hdrUpd) hdrUpd.innerHTML = '<i></i>עודכן: ' + fmt(latest);

  // תגית "חדש" נעלמת אוטומטית אחרי NEW_DAYS ימים
  document.querySelectorAll('[data-date]').forEach(function(it){
    if(daysAgo(it.dataset.date) > NEW_DAYS){ var t = it.querySelector('.tag.new'); if(t) t.remove(); }
  });

  // ===== דף הבית: מספר הודעות, הודעה מובילה ותקציר =====
  (function(){
    var msgs = document.querySelectorAll('#news details.msg');
    var c = document.getElementById('newsCount');
    if(c) c.textContent = msgs.length + ' הודעות';
    if(msgs[0]){
      msgs[0].classList.add('lead');
      var firstP = msgs[0].querySelector('.msg-body p'), h3 = msgs[0].querySelector('summary h3');
      if(firstP && h3){
        var ex = document.createElement('p'); ex.className = 'msg-excerpt'; ex.textContent = firstP.textContent;
        h3.insertAdjacentElement('afterend', ex);
      }
    }
    document.querySelectorAll('a.tile').forEach(function(t){ var d = document.createElement('span'); d.className = 'dot'; d.setAttribute('aria-hidden','true'); t.appendChild(d); });
  })();

  // ===== נקודת "חדש" בתפריט =====
  function navUpdated(navId){                          // כולל עמודי משנה
    return pages.filter(function(p){ return p.id === navId || p.dataset.parent === navId; })
                .map(function(p){ return p.dataset.updated || ''; }).sort().pop() || '';
  }
  var seen = store('seenPages') || {};
  document.querySelectorAll('nav a').forEach(function(a){
    var dot = document.createElement('span'); dot.className = 'dot'; a.appendChild(dot);
  });
  function refreshDots(activeNav){
    document.querySelectorAll('nav a').forEach(function(a){
      var id = a.dataset.page, upd = navUpdated(id);
      var isNew = upd && (seen[id] ? upd > seen[id] : daysAgo(upd) <= DOT_DAYS);
      a.classList.toggle('has-new', !!isNew && id !== activeNav);
    });
    var anyNew = !!document.querySelector('nav a.has-new');
    document.querySelectorAll('a.tile').forEach(function(t){
      var link = document.querySelector('nav a[data-page="' + t.dataset.goto + '"]');
      t.classList.toggle('has-new', !!(link && link.classList.contains('has-new')));
    });
    document.querySelectorAll('.menu-btn').forEach(function(mb){ mb.classList.toggle('has-new', anyNew); });
  }
  function markSeen(navId){
    seen[navId] = navUpdated(navId);
    store('seenPages', seen);
  }

  // ===== תמונת השער: אחת משש, באקראי, בכל כניסה לדף הבית =====
  var heroBg = document.querySelector('.hero-bg'), HERO_COUNT = 6, lastNav = null;
  function pickHero(){
    if(!heroBg) return;
    var prev = parseInt(heroBg.dataset.hero, 10) || 0, n;
    if(!prev){ n = 1; }  // פתיחת האתר: תמונת הצי תמיד ראשונה
    else { do { n = 1 + Math.floor(Math.random() * HERO_COUNT); } while(n === prev); }  // אחר כך באקראי, לא אותה תמונה פעמיים ברצף
    heroBg.dataset.hero = n;
  }

  // ===== מעבר בין עמודים =====
  function show(id){
    var target = id ? document.getElementById(id) : null;
    var item = null;
    if(target && !target.classList.contains('page')){  // קישור ישיר לפריט בתוך עמוד (למשל הודעה)
      item = target; target = target.closest('.page');
    }
    if(!target || !target.classList.contains('page')) target = document.getElementById('news');
    pages.forEach(function(p){ p.classList.toggle('active', p === target); });
    var navId = target.dataset.parent || target.id;    // עמוד משנה מדגיש את עמוד האב בתפריט
    if(navId === 'news' && lastNav !== 'news') pickHero();  // נכנסו לדף הבית: תמונת שער חדשה
    lastNav = navId;
    document.documentElement.dataset.nav = navId;      // מאפשר עיצוב לפי עמוד (תמונת השער בעמוד ההודעות)
    var h2 = target.querySelector('.page-head h2');
    var pageTitle = target.dataset.title || (h2 ? h2.textContent : '');
    var tbText = document.getElementById('tbText');
    if(tbText) tbText.textContent = pageTitle;
    // כותרת הלשונית לפי העמוד
    document.title = (target.id === 'news' ? 'מחלקת סגל | חיל הים' : pageTitle + ' | מחלקת סגל');
    document.querySelectorAll('nav a').forEach(function(a){ a.classList.toggle('active', a.dataset.page === navId); });
    markSeen(navId);
    refreshDots(navId);
    if(item){
      if(item.tagName === 'DETAILS') item.open = true;
      setTimeout(function(){
        item.scrollIntoView({behavior:'smooth', block:'start'});
        item.classList.remove('flash'); void item.offsetWidth; item.classList.add('flash');
      }, 80);
    } else {
      window.scrollTo(0,0);
      // הדפדפן קופץ לעוגן (#edu וכד') אחרי הטעינה – מחזירים לראש העמוד כדי שהכותרת תיראה
      setTimeout(function(){ window.scrollTo(0,0); }, 0);
      setTimeout(function(){ window.scrollTo(0,0); }, 80);
    }
  }
  function go(id){
    show(id);
    try{ history.replaceState(null, '', '#' + id); }catch(err){}
  }
  // קישורים פנימיים בתוך העמודים (למשל לעמוד משנה וחזרה)
  document.querySelectorAll('[data-goto]').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); go(a.dataset.goto); });
  });
  // מעבר בין עמודים בלחיצה, גם בתצוגות שחוסמות שינוי כתובת
  // ===== מגירת התפריט =====
  var drawer = document.getElementById('drawer'), drawerBg = document.getElementById('drawerBg'), menuBtn = document.getElementById('menuBtn');
  var menuBtns = document.querySelectorAll('.menu-btn'), lastMenuBtn = menuBtn;
  function openDrawer(){
    drawer.classList.add('open'); drawerBg.classList.add('open');
    drawer.setAttribute('aria-hidden','false'); menuBtns.forEach(function(b){ b.setAttribute('aria-expanded','true'); });
    document.documentElement.classList.add('drawer-open');
  }
  function closeDrawer(){
    drawer.classList.remove('open'); drawerBg.classList.remove('open');
    drawer.setAttribute('aria-hidden','true'); menuBtns.forEach(function(b){ b.setAttribute('aria-expanded','false'); });
    document.documentElement.classList.remove('drawer-open');
  }
  menuBtns.forEach(function(b){ b.addEventListener('click', function(){ lastMenuBtn = b; openDrawer(); }); });
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  drawerBg.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeDrawer(); });
  // כפתור התפריט מקבל רקע כהה יותר כשגוללים מעל התוכן
  // הפס העליון מופיע כשהכותרת יוצאת מהמסך
  var topbar = document.getElementById('topbar'), headerEl = document.querySelector('header');
  function syncTopbar(){
    var show = headerEl.getBoundingClientRect().bottom < 72;
    if(show === topbar.classList.contains('show')) return;
    topbar.classList.toggle('show', show);
    topbar.setAttribute('aria-hidden', show ? 'false' : 'true');
    topbar.querySelectorAll('button').forEach(function(b){ b.tabIndex = show ? 0 : -1; });
  }
  window.addEventListener('scroll', syncTopbar, {passive:true});
  window.addEventListener('resize', syncTopbar);
  document.getElementById('tbTitle').addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  syncTopbar();

  document.querySelectorAll('nav a').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); go(a.dataset.page); closeDrawer(); });
  });
  // קישור ישיר לעמוד או להודעה, למשל ...#plans או ...#msg-gantt27
  window.addEventListener('hashchange', function(){ show(location.hash.slice(1)); });
  show(location.hash.slice(1));
  // הדפדפן גולל לעוגן של העמוד אחרי הטעינה; בעמוד שלם (ולא הודעה) מחזירים לראש כדי שהכותרת תיראה
  window.addEventListener('load', function(){
    var t = document.getElementById(location.hash.slice(1));
    if(!t || t.classList.contains('page')){ window.scrollTo(0,0); setTimeout(function(){ window.scrollTo(0,0); }, 60); }
  });

  // ===== מספר התוכניות על שערי ההשכלה (ארץ / חו״ל) =====
  document.querySelectorAll('[data-count-for]').forEach(function(el){
    var list = document.getElementById(el.dataset.countFor);
    if(list) el.textContent = list.querySelectorAll('a.perk').length + ' תוכניות';
  });

  // ===== סינון תוכניות (השכלה והעשרה) =====
  (function(){
    document.querySelectorAll('.filters').forEach(function(box){
      var list = document.getElementById(box.dataset.filterFor);
      if(!list) return;
      var items = Array.prototype.slice.call(list.children);
      var empty = list.parentNode.querySelector('.f-empty');
      var count = box.querySelector('.f-count');
      var state = {corps:'', pop:''};
      var corpsSel = box.querySelector('select[data-key="corps"]');
      var ALL_CORPS = corpsSel ? corpsSel.querySelectorAll('option').length - 1 : 99;
      function split(v){ return (v || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean); }
      // תוויות על כל תוכנית לפי הנתונים שלה
      items.forEach(function(it){
        var tags = it.querySelector('.p-tags'); if(!tags) return;
        var corps = split(it.dataset.corps);
        // תוכנית שמתאימה לכל המערכים מקבלת תווית אחת במקום שש
        tags.innerHTML = (corps.length >= ALL_CORPS ? '<span class="p-tag">כל המערכים</span>'
                           : corps.map(function(c){ return '<span class="p-tag">מערך ' + c + '</span>'; }).join('')) +
                         split(it.dataset.pop).map(function(c){ return '<span class="p-tag pop">' + c + '</span>'; }).join('');
      });
      function apply(){
        var shown = 0;
        items.forEach(function(it){
          var ok = (!state.corps || split(it.dataset.corps).indexOf(state.corps) > -1) &&
                   (!state.pop   || split(it.dataset.pop).indexOf(state.pop) > -1);
          it.style.display = ok ? '' : 'none';
          if(ok) shown++;
        });
        if(empty) empty.hidden = shown > 0;
        // מפה: מסתירים את הנקודה של תוכנית שלא מתאימה לסינון
        var page = box.closest('.page');
        items.forEach(function(it){
          if(!it.dataset.goto || !page) return;
          page.querySelectorAll('[data-pin="' + it.dataset.goto + '"]').forEach(function(p){ p.style.display = it.style.display; });
        });
        if(count) count.textContent = 'מוצגות ' + shown + ' מתוך ' + items.length + ' תוכניות';
      }
      box.querySelectorAll('select[data-key]').forEach(function(sel){
        sel.addEventListener('change', function(){
          state[sel.dataset.key] = sel.value;
          sel.closest('.f-sel').classList.toggle('active', !!sel.value);
          apply();
        });
      });
      apply();
    });
  })();

  // ===== שיתוף =====
  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg){
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('show'); }, 2200);
  }
  function copyText(txt){
    if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
    return new Promise(function(res, rej){
      var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly','');
      ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy') ? res() : rej(); }catch(e){ rej(e); } ta.remove();
    });
  }
  document.querySelectorAll('[data-share]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var url = location.href.split('#')[0] + '#' + btn.dataset.share;
      var title = btn.dataset.title || document.title;
      if(navigator.share){
        navigator.share({title: title, text: title + ' – מחלקת סגל', url: url}).catch(function(){});
      } else {
        copyText(url).then(function(){ toast('הקישור הועתק'); }, function(){ prompt('העתק את הקישור:', url); });
      }
    });
  });

  // ===== כפתור פניות בתחתית כל עמוד =====
  var CONTACT_EMAIL = 'segelnavy@gmail.com';
  var CONTACT_SUBJECT = 'פנייה למחלקת סגל';
  document.querySelectorAll('.page').forEach(function(p){
    var title = p.querySelector('.page-head h2');
    var box = document.createElement('div');
    box.className = 'contact';
    box.innerHTML =
      '<div class="c-txt"><h3>יש לך שאלה?</h3>' +
        '<span class="c-mail" dir="ltr">' + CONTACT_EMAIL + '</span></div>' +
      '<p class="c-warn">נא לשלוח הודעות ללא פרטים מסווגים</p>' +
      '<div class="c-actions">' +
        '<a class="contact-btn" href="#" role="button">' +
          '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>' +
          'שליחת פנייה' +
        '</a>' +
        '<button class="copy-btn" type="button" aria-label="העתקת כתובת המייל">' +
          '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>' +
          'העתקה' +
        '</button>' +
      '</div>';
    function mailto(e){
      e.preventDefault();
      var subject = CONTACT_SUBJECT + (title ? ' – ' + title.textContent : '');
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject);
    }
    box.querySelector('.contact-btn').addEventListener('click', mailto);
    box.querySelector('.copy-btn').addEventListener('click', function(){
      copyText(CONTACT_EMAIL).then(function(){ toast('כתובת המייל הועתקה'); }, function(){ toast(CONTACT_EMAIL); });
    });
    p.appendChild(box);
  });

  // ===== שעון מקומי בעמודי תוכניות הלימוד (לפי data-tz, כולל שעון קיץ/חורף) =====
  (function(){
    var IL = 'Asia/Jerusalem';
    function offsetMin(tz, d){
      var p = new Intl.DateTimeFormat('en-US', {timeZone:tz, hour12:false, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}).formatToParts(d);
      var o = {}; p.forEach(function(x){ o[x.type] = x.value; });
      var asUTC = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute);
      return Math.round((asUTC - d.getTime()) / 60000);
    }
    var clocks = [];
    document.querySelectorAll('.np-clock[data-tz]').forEach(function(box){
      var tz = box.dataset.tz;
      clocks.push({
        tz: tz, city: box.dataset.city || '',
        tEl: box.querySelector('.np-time'), dEl: box.querySelector('.np-date'), fEl: box.querySelector('.np-diff'),
        fTime: new Intl.DateTimeFormat('en-GB', {timeZone:tz, hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false}),
        fDate: new Intl.DateTimeFormat('he-IL', {timeZone:tz, weekday:'long', day:'numeric', month:'long'})
      });
    });
    if(!clocks.length) return;
    function hours(n){ return n === 1 ? 'בשעה אחת' : 'ב־' + n + ' שעות'; }
    function tick(){
      var now = new Date(), il = offsetMin(IL, now);
      clocks.forEach(function(c){
        c.tEl.textContent = c.fTime.format(now);
        c.dEl.textContent = c.fDate.format(now);
        var diff = (il - offsetMin(c.tz, now)) / 60;
        c.fEl.textContent = diff === 0 ? 'אותה שעה כמו בישראל'
          : c.city + (diff > 0 ? ' מאחורי ישראל ' : ' לפני ישראל ') + hours(Math.abs(diff));
      });
    }
    tick();
    setInterval(tick, 1000);
  })();

  // ===== לוחות מתחלפים (data-steps): לוח אחד בכל פעם, כפתורי המשך וחזרה =====
  document.querySelectorAll('[data-steps]').forEach(function(box){
    var steps = box.querySelectorAll('.step');
    var prev = box.querySelector('.steps-btn.prev'), next = box.querySelector('.steps-btn.next');
    var count = box.querySelector('.steps-count');
    var cur = 0;
    function show(i){
      cur = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function(s, k){ s.hidden = k !== cur; });
      prev.hidden = cur === 0;
      next.hidden = cur === steps.length - 1;
      count.textContent = (cur + 1) + ' מתוך ' + steps.length;
      (cur === 0 ? next : prev).focus({preventScroll:true});
    }
    [prev, next].forEach(function(b){
      b.addEventListener('click', function(){ show(cur + Number(b.dataset.dir)); });
    });
  });

  // ===== הוספה למסך הבית =====
  (function(){
    var root = document.documentElement;
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if(standalone){ root.classList.add('standalone'); }

    var sheet = document.getElementById('installSheet');
    var tabs = sheet.querySelectorAll('.os-tabs button');
    var panes = sheet.querySelectorAll('.os-pane');
    function pick(os){
      tabs.forEach(function(t){ var on = t.dataset.os === os; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
      panes.forEach(function(p){ p.classList.toggle('on', p.dataset.pane === os); });
    }
    tabs.forEach(function(t){ t.addEventListener('click', function(){ pick(t.dataset.os); }); });

    var ua = navigator.userAgent || '';
    var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    pick(/Android/i.test(ua) ? 'android' : (isIOS ? 'ios' : 'ios'));

    function open(){ sheet.classList.add('open'); sheet.setAttribute('aria-hidden','false'); }
    function close(){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden','true'); }
    document.getElementById('installBtn').addEventListener('click', function(){
      if(typeof closeDrawer === 'function') closeDrawer();
      setTimeout(open, 200);
    });

    // הודעה חד-פעמית בכל פתיחה של האתר (לא מוצגת למי שכבר פתח אותו ממסך הבית)
    var banner = document.getElementById('a2hs'), bannerT;
    function hideBanner(){
      banner.classList.remove('show'); clearTimeout(bannerT);
      setTimeout(function(){ banner.hidden = true; }, 350);
    }
    if(!standalone){
      setTimeout(function(){
        banner.hidden = false;
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ banner.classList.add('show'); }); });
        bannerT = setTimeout(hideBanner, 15000);           // נעלמת לבד אחרי 15 שניות
      }, 1500);
    }
    document.getElementById('a2hsX').addEventListener('click', hideBanner);
    document.getElementById('a2hsGo').addEventListener('click', function(){ hideBanner(); open(); });
    document.getElementById('sheetClose').addEventListener('click', close);
    sheet.addEventListener('click', function(e){ if(e.target === sheet) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });

    // באנדרואיד/Chrome: כפתור התקנה ישירה כשהדפדפן מאפשר
    var deferred = null, now = document.getElementById('installNow');
    window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; now.classList.add('show'); });
    now.addEventListener('click', function(){
      if(!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function(){ deferred = null; now.classList.remove('show'); close(); });
    });
    window.addEventListener('appinstalled', function(){ root.classList.add('standalone'); close(); hideBanner(); });
  })();

  // ===== מצב יום / לילה =====
  var root = document.documentElement;
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function isDark(){
    var t = root.getAttribute('data-theme');
    if(t) return t === 'dark';
    return !!(darkQuery && darkQuery.matches);
  }
  function syncTheme(){
    var dark = isDark();
    root.classList.toggle('is-dark', dark);
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', dark ? '#050f1d' : '#061a33');
  }
  try{
    var saved = localStorage.getItem('theme');
    if(saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  }catch(err){}
  syncTheme();
  if(darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', syncTheme);
  document.getElementById('themeBtn').addEventListener('click', function(){
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try{ localStorage.setItem('theme', next); }catch(err){}
    syncTheme();
  });
  // ===== כרטיסיות נפתחות: פתיחה וסגירה בגלישה, אחת בכל פעם =====
  (function(){
    var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var DUR = 320, EASE = 'cubic-bezier(.2,.8,.2,1)';
    function still(){ return !!(reduce && reduce.matches) || !Element.prototype.animate; }
    function h(el){ return el.getBoundingClientRect().height; }
    function stop(d){ if(d._anim){ d._anim.cancel(); d._anim = null; } d.style.overflow = ''; }
    function slide(d, from, to, done){
      d.style.overflow = 'hidden';
      var a = d.animate({height:[from + 'px', to + 'px']}, {duration:DUR, easing:EASE});
      d._anim = a;
      a.onfinish = function(){ d._anim = null; d.style.overflow = ''; if(done) done(); };
    }
    function reveal(d){
      var r = d.getBoundingClientRect(), vh = window.innerHeight;
      var bar = document.querySelector('.topbar'), barH = bar ? bar.getBoundingClientRect().height : 64;
      if(d.classList.contains('pol-acc') || r.top < barH){   // נושא שנפתח: ראש התיבה מתחת לפס העליון, כדי לקרוא מההתחלה
        var to = r.top - barH - 8;
        if(Math.abs(to) > 4) window.scrollBy({top:to, behavior: still() ? 'auto' : 'smooth'});
        return;
      }
      if(r.bottom <= vh - 16) return;
      var by = Math.min(r.bottom - vh + 16, r.top - 72);
      if(by > 0) window.scrollBy({top:by, behavior: still() ? 'auto' : 'smooth'});
    }
    function openAcc(d){
      var from = h(d);
      stop(d); d.classList.remove('closing'); d.open = true;
      if(still()){ reveal(d); return; }
      slide(d, from, h(d), function(){ reveal(d); });
    }
    function closeAcc(d){
      if(still()){ stop(d); d.open = false; return; }
      var from = h(d);
      stop(d); d.classList.add('closing');
      slide(d, from, h(d.querySelector('summary')) + (d.offsetHeight - d.clientHeight), function(){
        d.open = false; d.classList.remove('closing');
      });
    }
    document.querySelectorAll('details.acc').forEach(function(d){
      d.querySelector('summary').addEventListener('click', function(e){
        e.preventDefault();
        if(d.open && !d.classList.contains('closing')){ closeAcc(d); return; }
        var list = d.parentNode;
        if(!list.hasAttribute('data-multi')){          // ברשימות רגילות נפתחת כרטיסייה אחת בכל פעם
          list.querySelectorAll('details.acc[open]').forEach(function(o){
            if(o !== d && !o.classList.contains('closing')) closeAcc(o);
          });
        }
        openAcc(d);
        syncAll(list);
      });
    });
    // כפתור "פתיחת כל הנושאים" מעל רשימה שאפשר לפתוח בה כמה נושאים יחד
    function syncAll(list){
      var btn = list.previousElementSibling && list.previousElementSibling.querySelector('[data-acc-all]');
      if(!btn) return;
      var items = list.querySelectorAll('details.acc'), openN = list.querySelectorAll('details.acc[open]:not(.closing)').length;
      var all = openN === items.length;
      btn.textContent = all ? 'סגירת כל הנושאים' : 'פתיחת כל הנושאים';
      btn.setAttribute('aria-expanded', all ? 'true' : 'false');
    }
    document.querySelectorAll('[data-acc-all]').forEach(function(btn){
      var list = btn.parentNode.nextElementSibling;
      btn.addEventListener('click', function(){
        var items = list.querySelectorAll('details.acc');
        var openAll = btn.getAttribute('aria-expanded') !== 'true';
        items.forEach(function(d){ stop(d); d.classList.remove('closing'); d.open = openAll; });
        syncAll(list);
      });
      list.querySelectorAll('details.acc').forEach(function(d){
        d.addEventListener('toggle', function(){ syncAll(list); });
      });
    });
  })();

  // ===== גאנט אירועים: לוח חודשי. אירוע של כמה ימים = פס רציף, אירוע של יום אחד = נקודה =====
  (function(){
    var page = document.getElementById('gantt'), data = document.getElementById('gcData');
    if(!page || !data) return;
    var MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
    var DAYS = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
    function parse(iso){ var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
    function key(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
    function short(d){ return d.getDate() + '.' + (d.getMonth() + 1); }

    var topicName = {};
    page.querySelectorAll('.gc-chip').forEach(function(c){ topicName[c.dataset.topic] = c.textContent.trim(); });
    var events = Array.prototype.map.call(data.querySelectorAll('li'), function(li){
      var s = li.dataset.start, e = li.dataset.end || s;
      return {topic: li.dataset.topic, title: li.textContent.trim(), s: s, e: e < s ? s : e};
    }).sort(function(a, b){ return a.s < b.s ? -1 : a.s > b.s ? 1 : (b.e > a.e ? 1 : -1); });

    var active = {}; Object.keys(topicName).forEach(function(t){ active[t] = true; });
    var today = new Date(); today.setHours(12, 0, 0, 0);
    var todayKey = key(today);
    var view = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    var selKey = todayKey;
    var weeksBox = document.getElementById('gcWeeks'), titleEl = document.getElementById('gcTitle'), panel = document.getElementById('gcPanel');

    function visible(){ return events.filter(function(ev){ return active[ev.topic]; }); }
    function el(tag, cls, txt){ var x = document.createElement(tag); if(cls) x.className = cls; if(txt != null) x.textContent = txt; return x; }

    function render(){
      titleEl.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
      weeksBox.textContent = '';
      var evs = visible();
      var start = addDays(view, -view.getDay());                 // יום ראשון של השבוע הראשון
      var last = new Date(view.getFullYear(), view.getMonth() + 1, 0, 12);
      var end = addDays(last, 6 - last.getDay());                 // שבת של השבוע האחרון
      for(var ws = start; ws <= end; ws = addDays(ws, 7)){
        var wsKey = key(ws), weKey = key(addDays(ws, 6));
        var week = el('div', 'gc-week');
        // פסים של אירועים רב-יומיים בשבוע הזה, כל אחד בשורה פנויה
        var lanes = [], bars = [];
        evs.forEach(function(ev){
          if(ev.s === ev.e || ev.e < wsKey || ev.s > weKey) return;
          var a = ev.s < wsKey ? 0 : parse(ev.s).getDay(), b = ev.e > weKey ? 6 : parse(ev.e).getDay();
          var lane = 0; while(lanes[lane] != null && lanes[lane] >= a) lane++;
          lanes[lane] = b;
          bars.push({ev: ev, a: a, b: b, lane: lane, cs: ev.s < wsKey, ce: ev.e > weKey});
        });
        week.style.gridTemplateRows = '24px' + (lanes.length ? ' repeat(' + lanes.length + ', 20px)' : '') + ' minmax(14px, auto)';
        var lastRow = lanes.length + 2;
        for(var i = 0; i < 7; i++){
          var d = addDays(ws, i), k = key(d), other = d.getMonth() !== view.getMonth();
          var dayEvs = evs.filter(function(ev){ return ev.s <= k && ev.e >= k; });
          var btn = el('button', 'gc-day' + (other ? ' other' : '') + (k === selKey ? ' sel' : ''));
          btn.type = 'button'; btn.style.gridColumn = (i + 1);
          btn.dataset.key = k;
          btn.setAttribute('aria-label', d.getDate() + ' ב' + MONTHS[d.getMonth()] + (dayEvs.length ? ', ' + dayEvs.length + ' אירועים' : ', אין אירועים'));
          if(k === selKey) btn.setAttribute('aria-current', 'date');
          week.appendChild(btn);
          var num = el('span', 'gc-num' + (other ? ' other' : '') + (k === todayKey ? ' today' : ''), d.getDate());
          num.style.gridColumn = (i + 1); num.setAttribute('aria-hidden', 'true');
          week.appendChild(num);
          var singles = dayEvs.filter(function(ev){ return ev.s === ev.e; });
          if(singles.length){
            var dots = el('span', 'gc-dots'); dots.style.gridColumn = (i + 1); dots.style.gridRow = lastRow; dots.setAttribute('aria-hidden', 'true');
            singles.slice(0, 3).forEach(function(ev){ var dot = el('i'); dot.dataset.topic = ev.topic; dots.appendChild(dot); });
            week.appendChild(dots);
          }
        }
        bars.forEach(function(br){
          var bar = el('span', 'gc-bar' + (br.cs ? ' cont-s' : '') + (br.ce ? ' cont-e' : ''), br.b > br.a ? br.ev.title : '');
          bar.dataset.topic = br.ev.topic; bar.setAttribute('aria-hidden', 'true');
          bar.style.gridColumn = (br.a + 1) + ' / ' + (br.b + 2);
          bar.style.gridRow = br.lane + 2;
          week.appendChild(bar);
        });
        weeksBox.appendChild(week);
      }
      renderPanel();
    }

    function renderPanel(){
      var d = parse(selKey);
      panel.textContent = '';
      panel.appendChild(el('h3', null, 'יום ' + DAYS[d.getDay()] + ', ' + d.getDate() + ' ב' + MONTHS[d.getMonth()]));
      var list = visible().filter(function(ev){ return ev.s <= selKey && ev.e >= selKey; });
      if(!list.length){ panel.appendChild(el('div', 'gc-none', 'אין אירועים ביום הזה')); return; }
      list.forEach(function(ev){
        var card = el('div', 'gc-ev'); card.dataset.topic = ev.topic;
        var txt = el('div');
        txt.appendChild(el('strong', null, ev.title));
        txt.appendChild(el('span', null, (ev.s === ev.e ? short(parse(ev.s)) : short(parse(ev.s)) + '–' + short(parse(ev.e))) + ' · ' + (topicName[ev.topic] || '')));
        card.appendChild(txt);
        panel.appendChild(card);
      });
    }

    weeksBox.addEventListener('click', function(e){
      var b = e.target.closest('.gc-day'); if(!b) return;
      selKey = b.dataset.key;
      var d = parse(selKey);
      if(d.getMonth() !== view.getMonth()){ view = new Date(d.getFullYear(), d.getMonth(), 1, 12); }
      render();
      var again = weeksBox.querySelector('.gc-day[data-key="' + selKey + '"]'); if(again) again.focus({preventScroll: true});
    });
    function shift(n){
      view = new Date(view.getFullYear(), view.getMonth() + n, 1, 12);
      selKey = (view.getMonth() === today.getMonth() && view.getFullYear() === today.getFullYear()) ? todayKey : key(view);
      render();
    }
    document.getElementById('gcPrev').addEventListener('click', function(){ shift(-1); });
    document.getElementById('gcNext').addEventListener('click', function(){ shift(1); });
    page.querySelectorAll('.gc-chip').forEach(function(c){
      c.addEventListener('click', function(){
        active[c.dataset.topic] = !active[c.dataset.topic];
        c.setAttribute('aria-pressed', active[c.dataset.topic] ? 'true' : 'false');
        render();
      });
    });
    render();
  })();
