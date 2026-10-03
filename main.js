// nav elevation on scroll
(function(){
  var nav = document.querySelector('header.nav');
  if(!nav) return;
  function update(){
    nav.classList.toggle('scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', update, {passive:true});
  update();
})();

// mobile nav: hamburger toggle / dropdown menu
(function(){
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');
  if(!toggle || !nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));

  function closeNav(){
    nav.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }
  function openNav(){
    nav.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  }

  toggle.addEventListener('click', function(){
    if(nav.classList.contains('nav-open')) closeNav(); else openNav();
  });
  links.forEach(function(link){ link.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeNav();
  });
  document.addEventListener('click', function(e){
    if(!nav.classList.contains('nav-open')) return;
    if(nav.contains(e.target) || toggle.contains(e.target)) return;
    closeNav();
  });
  window.addEventListener('resize', function(){
    if(window.innerWidth > 900) closeNav();
  });
})();

// scroll reveal
(function(){
  var els = document.querySelectorAll('.reveal');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:.12});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }
})();

// hero signature graphic: trigger the line-draw + pulse once in view
(function(){
  var host = document.getElementById('heroSignature');
  if(!host) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion){ host.classList.add('in'); return; }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ host.classList.add('in'); io.unobserve(host); } });
    },{threshold:.3});
    io.observe(host);
  } else { host.classList.add('in'); }
})();

// intro stat count-up, once on entering view
(function(){
  var stats = document.querySelectorAll('.intro-stat .i-val[data-count]');
  if(!stats.length) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animate(el){
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if(reduceMotion || isNaN(target)){ el.textContent = target + suffix; return; }
    var start = null;
    var duration = 900;
    function step(ts){
      if(!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if(progress < 1) window.requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    window.requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ animate(e.target); io.unobserve(e.target); } });
    },{threshold:.5});
    stats.forEach(function(el){ io.observe(el); });
  } else { stats.forEach(animate); }
})();

// interactive history timeline
(function(){
  var nodesHost = document.getElementById('historyNodes');
  if(!nodesHost) return;
  var fill = document.getElementById('historyFill');
  var panelInner = document.getElementById('historyPanelInner');
  var panelYear = document.getElementById('historyPanelYear');
  var panelTitle = document.getElementById('historyPanelTitle');
  var panelText = document.getElementById('historyPanelText');
  var stages = [
    {year:'1984', range:'1984–1990', title:'Foundation and Organisational Development', text:'Soma Consultants was established in 1984, focusing on organisational development, leadership effectiveness, team performance and change management. Early work supported organisations across the UK, helping develop the participative and behavioural approaches that remain central to Soma’s methodology today.'},
    {year:'1990', range:'1990–1995', title:'Leadership, Culture and Strategic Change', text:'Expanded support for public and private sector organisations, delivering leadership development, executive coaching, strategy implementation and cultural change programmes. Built a reputation for helping organisations align people, teams and business objectives across complex projects.'},
    {year:'1995', range:'1995–2000', title:'Major Projects and International Expansion', text:'Broadened into major project support, project team development and collaborative working programmes. Extended activities beyond the UK into Europe, North America and Australia, laying the foundations for the international client portfolio that developed from 2000 onwards.'},
    {year:'2000', range:'2000–2005', title:'Energy, Oil and Gas, Pharmaceuticals and Advanced Manufacturing', text:'Established work across the UK energy and industrial sectors, alongside pharmaceutical and manufacturing organisations. Expanded internationally into Ireland, Germany, France, Spain, Australia, Azerbaijan and the USA while continuing to support projects throughout the UK.'},
    {year:'2006', range:'2006–2010', title:'Infrastructure, Defence, Utilities, Engineering and Nuclear', text:'Broadened into defence, public sector, engineering and utility markets. Geographic reach extended across Scotland, Wales, France, Hungary, the USA and wider Europe, whilst maintaining strong delivery capability across the UK.'},
    {year:'2011', range:'2011–2015', title:'Nuclear, Utilities, Construction and Asset Management', text:'Strengthened expertise within nuclear, utilities and major infrastructure programmes. Continued UK-wide project delivery while supporting organisations in Australia, Canada, South Africa, the Middle East and North America.'},
    {year:'2016', range:'2016–2020', title:'Engineering, Manufacturing, Energy Transition and Major Projects', text:'Worked with global engineering, petrochemical, manufacturing and technology organisations. Expanded international activity across the Netherlands, Germany, UAE, Qatar, Azerbaijan, Canada and the USA, alongside ongoing work throughout England, Scotland and Wales.'},
    {year:'2021', range:'2021–2026', title:'Energy, Nuclear, Engineering, Construction and Industrial Services', text:'Supported large-scale energy, engineering, construction and nuclear programmes across the UK. International footprint further expanded into Bahrain, Georgia, India, Azerbaijan, UAE, Canada and North America, while continuing to deliver services nationwide across the UK.'}
  ];
  var nodeButtons = [];
  var labelEls = [];
  var current = -1;

  stages.forEach(function(stage, i){
    var wrap = document.createElement('div');
    wrap.className = 'history-node-wrap';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'history-node' + (i === 0 ? ' active' : '');
    btn.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-label', 'Stage ' + (i + 1) + ', ' + stage.range);
    btn.tabIndex = i === 0 ? 0 : -1;

    var label = document.createElement('div');
    label.className = 'history-year-label' + (i === 0 ? ' active' : '');
    label.textContent = stage.year;

    wrap.appendChild(btn);
    wrap.appendChild(label);
    nodesHost.appendChild(wrap);

    nodeButtons.push(btn);
    labelEls.push(label);

    btn.addEventListener('click', function(){ setActive(i, true); });
    btn.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){
        e.preventDefault();
        setActive(Math.min(current + 1, stages.length - 1), true);
      } else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){
        e.preventDefault();
        setActive(Math.max(current - 1, 0), true);
      } else if(e.key === 'Home'){
        e.preventDefault();
        setActive(0, true);
      } else if(e.key === 'End'){
        e.preventDefault();
        setActive(stages.length - 1, true);
      }
    });
  });

  function setActive(i, focusIt){
    if(i === current) return;
    current = i;
    nodeButtons.forEach(function(n, idx){
      var isActive = idx === i;
      n.classList.toggle('active', isActive);
      n.setAttribute('aria-selected', isActive ? 'true' : 'false');
      n.tabIndex = isActive ? 0 : -1;
    });
    labelEls.forEach(function(l, idx){ l.classList.toggle('active', idx === i); });
    var pct = (i / (stages.length - 1)) * 100;
    fill.style.width = 'calc(' + pct + '% )';
    if(focusIt) nodeButtons[i].focus();

    panelInner.classList.add('fading');
    window.setTimeout(function(){
      panelYear.textContent = stages[i].range;
      panelTitle.textContent = stages[i].title;
      panelText.textContent = stages[i].text;
      panelInner.classList.remove('fading');
    }, 180);
  }
})();

// generic tablist-with-panel interaction (used by Expertise explorer and any similar block)
function initTabPanel(tabHostId, panelSelector){
  var tabHost = document.getElementById(tabHostId);
  if(!tabHost) return;
  var tabs = Array.prototype.slice.call(tabHost.querySelectorAll('[role="tab"]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll(panelSelector));
  if(!tabs.length || !panels.length) return;

  function activate(index, focusIt){
    tabs.forEach(function(tab, i){
      var isActive = i === index;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.tabIndex = isActive ? 0 : -1;
    });
    panels.forEach(function(panel, i){
      panel.setAttribute('data-active', i === index ? 'true' : 'false');
    });
    if(focusIt) tabs[index].focus();
  }

  tabs.forEach(function(tab, i){
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener('click', function(){ activate(i); });
    tab.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ e.preventDefault(); activate(Math.min(i+1, tabs.length-1), true); }
      if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ e.preventDefault(); activate(Math.max(i-1, 0), true); }
    });
  });
}
initTabPanel('expertiseTabs', '.expertise-panel');
initTabPanel('expertiseIndexTabs', '.eip-panel');

// the SOMA difference: stepped progression with gentle auto-advance
(function(){
  var rail = document.getElementById('diffRail');
  var stageHost = document.getElementById('diffStage');
  if(!rail || !stageHost) return;
  var dots = Array.prototype.slice.call(rail.querySelectorAll('.diff-dot'));
  var stages = Array.prototype.slice.call(stageHost.querySelectorAll('.diff-stage-inner'));
  var current = 0;
  var timer = null;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function activate(index){
    current = index;
    dots.forEach(function(dot, i){ dot.setAttribute('aria-current', i === index ? 'true' : 'false'); });
    stages.forEach(function(stage, i){ stage.setAttribute('data-active', i === index ? 'true' : 'false'); });
  }

  function next(){ activate((current + 1) % stages.length); }

  function startAuto(){
    if(reduceMotion) return;
    stopAuto();
    timer = window.setInterval(next, 6500);
  }
  function stopAuto(){
    if(timer){ window.clearInterval(timer); timer = null; }
  }

  dots.forEach(function(dot, i){
    dot.addEventListener('click', function(){ activate(i); stopAuto(); });
    dot.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight'){ e.preventDefault(); activate(Math.min(i+1, dots.length-1)); dots[Math.min(i+1, dots.length-1)].focus(); stopAuto(); }
      if(e.key === 'ArrowLeft'){ e.preventDefault(); activate(Math.max(i-1, 0)); dots[Math.max(i-1, 0)].focus(); stopAuto(); }
    });
  });

  stageHost.addEventListener('mouseenter', stopAuto);
  rail.addEventListener('mouseenter', stopAuto);
  stageHost.addEventListener('focusin', stopAuto);
  rail.addEventListener('focusin', stopAuto);

  startAuto();
})();

// Netlify Forms: AJAX submit with success/error states
(function(){
  var form = document.querySelector('form[data-netlify="true"]');
  if(!form) return;
  var statusEl = form.parentNode.querySelector('.form-status');
  var submitBtn = form.querySelector('button[type="submit"]');

  function encode(data){
    return Object.keys(data).map(function(key){
      return encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
    }).join('&');
  }

  function showStatus(kind, message){
    if(!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('success', 'error');
    statusEl.classList.add(kind, 'show');
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();

    var honeypot = form.querySelector('input[name="bot-field"]');
    if(honeypot && honeypot.value){ return; }

    var formData = {};
    new FormData(form).forEach(function(value, key){ formData[key] = value; });

    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    fetch('/', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: encode(formData)
    }).then(function(response){
      if(response.ok){
        showStatus('success', 'Thank you for contacting Soma. Your message has been received and a member of the team will respond as soon as possible.');
        form.reset();
      } else {
        throw new Error('Form submission failed');
      }
    }).catch(function(){
      showStatus('error', 'We could not send your message. Please try again or contact us directly at soma@soma.co.uk.');
    }).finally(function(){
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Send'; }
    });
  });
})();
