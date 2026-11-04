(function () {
  'use strict';

  var script = document.currentScript;
  if (!script || !script.src) return;

  var rootUrl = new URL('../', script.src);
  var screens = [
    { id: 'home', group: 'Storefront', label: 'Home', route: '/', file: 'index.html' },
    { id: 'catalog', group: 'Storefront', label: 'Catalog', route: '/catalog', file: 'curated_architectural_assets_physical_typologies_xadboom/code.html' },
    { id: 'product', group: 'Storefront', label: 'Product', route: '/product', file: 'lumen_void_lounge_chair_product_detail_xadboom/code.html' },
    { id: 'designers', group: 'Storefront', label: 'Designers 1', route: '/designers', file: 'designers_collaborating_visionaries_xadboom_1/code.html' },
    { id: 'designers-2', group: 'Storefront', label: 'Designers 2', route: '/designers-2', file: 'designers_collaborating_visionaries_xadboom_2/code.html' },
    { id: 'contact', group: 'Storefront', label: 'Contact', route: '/contact', file: 'contact_curatorial_inquiries_xadboom/code.html' },
    { id: 'admin-overview', group: 'Atelier Admin', label: 'Overview', route: '/admin', file: 'xadboom_atelier_admin_operations_inventory_lock_harmonized/code.html' },
    { id: 'admin-pieces', group: 'Atelier Admin', label: 'Pieces', route: '/admin/pieces', file: 'pieces_catalog_xadboom_atelier_admin/code.html' },
    { id: 'admin-add-piece', group: 'Atelier Admin', label: 'Add Piece', route: '/admin/pieces/new', file: 'add_new_piece_xadboom_atelier_admin/code.html' },
    { id: 'admin-categories', group: 'Atelier Admin', label: 'Categories', route: '/admin/categories', file: 'categories_typologies_xadboom_atelier_admin/code.html' },
    { id: 'admin-designers', group: 'Atelier Admin', label: 'Designers', route: '/admin/designers', file: 'designers_collaborators_xadboom_atelier_admin/code.html' },
    { id: 'admin-orders', group: 'Atelier Admin', label: 'Orders', route: '/admin/orders', file: 'orders_dispatches_xadboom_atelier_admin/code.html' },
    { id: 'admin-inquiries', group: 'Atelier Admin', label: 'Inquiries', route: '/admin/inquiries', file: 'inquiries_forms_xadboom_atelier_admin/code.html' },
    { id: 'admin-users', group: 'Atelier Admin', label: 'Users', route: '/admin/users', file: 'users_accounts_xadboom_atelier_admin/code.html' }
  ];

  var aliases = {
    '/home': 'home',
    '/assets': 'catalog',
    '/chair': 'product',
    '/product/lumen-void': 'product',
    '/designers-1': 'designers',
    '/designer-monograph': 'designers',
    '/admin/overview': 'admin-overview'
  };

  var routeToScreen = {};
  screens.forEach(function (screen) {
    routeToScreen[screen.route] = screen.id;
  });
  Object.keys(aliases).forEach(function (route) {
    routeToScreen[route] = aliases[route];
  });

  function screenById(id) {
    return screens.find(function (screen) { return screen.id === id; });
  }

  function screenForRoute(route) {
    var id = routeToScreen[route];
    if (!id && route.indexOf('/product/') === 0) id = 'product';
    return id ? screenById(id) : null;
  }

  // Express adds its own enhanced navigation. Without it, links must point to
  // physical HTML files so the same source also works on GitHub Pages/file://.
  var hasServerNavigation = Boolean(document.getElementById('xadboom-quick-nav'));
  var useStaticDestinations = !hasServerNavigation;

  function hrefFor(screen) {
    if (!useStaticDestinations) return screen.route;
    return new URL(screen.file, rootUrl).href;
  }

  function currentScreen() {
    if (useStaticDestinations) {
      var path = decodeURIComponent(window.location.pathname);
      var rootPath = decodeURIComponent(rootUrl.pathname);
      var relativePath = path.indexOf(rootPath) === 0 ? path.slice(rootPath.length) : path.replace(/^\/+/, '');
      relativePath = relativePath.replace(/^\/+/, '');
      if (!relativePath || relativePath === 'index.html') return screens[0];
      return screens.find(function (screen) { return screen.file === relativePath; }) || screens[0];
    }
    return screenForRoute(window.location.pathname) || screens[0];
  }

  function normalizedText(element) {
    return (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function rewriteStaticLinks() {
    document.querySelectorAll('a[href]').forEach(function (anchor) {
      var rawHref = anchor.getAttribute('href');
      var route = rawHref.split(/[?#]/)[0];
      var target = screenForRoute(route);
      if (target) {
        anchor.setAttribute('href', hrefFor(target) + rawHref.slice(route.length));
        return;
      }
      if (rawHref === '#' && anchor.getAttribute('aria-label') === 'Xadboom Home') {
        anchor.setAttribute('href', hrefFor(screens[0]));
      }
    });

    var dataPaths = {
      'overview': '/admin',
      'pieces-catalog': '/admin/pieces',
      'curatorial-archives': '/admin/categories',
      'acquisitions': '/admin/orders',
      'provenance-records': '/admin/inquiries',
      'settings': '/admin/users'
    };

    document.querySelectorAll('[data-path]').forEach(function (anchor) {
      var target = screenForRoute(dataPaths[anchor.getAttribute('data-path')] || '');
      if (target) anchor.setAttribute('href', hrefFor(target));
    });

    var adminLinks = [
      ['overview & dashboard', '/admin'],
      ['pieces catalog', '/admin/pieces'],
      ['categories', '/admin/categories'],
      ['designers & collaborators', '/admin/designers'],
      ['orders & dispatches', '/admin/orders'],
      ['users & accounts', '/admin/users'],
      ['inquiries & forms', '/admin/inquiries']
    ];

    document.querySelectorAll('aside a, nav a').forEach(function (anchor) {
      var text = normalizedText(anchor);
      adminLinks.forEach(function (link) {
        if (text.indexOf(link[0]) !== -1) {
          var target = screenForRoute(link[1]);
          if (target) anchor.setAttribute('href', hrefFor(target));
        }
      });
    });

    document.querySelectorAll('a[href="#"]').forEach(function (anchor) {
      var text = normalizedText(anchor);
      var target = null;
      if (text.indexOf('see all assets') !== -1) target = screenById('catalog');
      if (text.indexOf('explore all') !== -1 && text.indexOf('collaborators') !== -1) target = screenById('designers');
      if (target) anchor.setAttribute('href', hrefFor(target));
    });

    document.querySelectorAll('[data-purpose="product-card"], article').forEach(function (card) {
      if (normalizedText(card).indexOf('lumen void lounge chair') === -1) return;
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (event) {
        if (!event.target.closest('a') && !event.target.closest('button')) {
          window.location.href = hrefFor(screenById('product'));
        }
      });
    });

    document.querySelectorAll('button, a').forEach(function (button) {
      if (normalizedText(button).indexOf('add new piece') === -1) return;
      button.addEventListener('click', function (event) {
        event.preventDefault();
        window.location.href = hrefFor(screenById('admin-add-piece'));
      });
    });
  }

  function navigationLinks(group, activeScreen) {
    return screens.filter(function (screen) {
      return screen.group === group;
    }).map(function (screen) {
      var active = screen.id === activeScreen.id;
      return '<a class="xadboom-prototype-nav__link' + (active ? ' is-active' : '') + '" href="' +
        hrefFor(screen) + '"' + (active ? ' aria-current="page"' : '') + '>' + screen.label + '</a>';
    }).join('');
  }

  function installNavigator(activeScreen) {
    if (hasServerNavigation || document.getElementById('xadboom-prototype-nav')) return;

    var activeIndex = screens.indexOf(activeScreen);
    var previous = screens[(activeIndex - 1 + screens.length) % screens.length];
    var next = screens[(activeIndex + 1) % screens.length];
    var position = String(activeIndex + 1).padStart(2, '0') + ' / ' + screens.length;
    var nav = document.createElement('nav');
    nav.id = 'xadboom-prototype-nav';
    nav.setAttribute('aria-label', 'Xadboom prototype pages');
    nav.innerHTML =
      '<div class="xadboom-prototype-nav__container">' +
        '<div class="xadboom-prototype-nav__bar">' +
          '<a class="xadboom-prototype-nav__brand" href="' + hrefFor(screens[0]) + '">' +
            '<span class="xadboom-prototype-nav__dot"></span><span>XADBOOM</span><small>PROTOTYPE</small>' +
          '</a>' +
          '<span class="xadboom-prototype-nav__current" title="' + activeScreen.group + ' — ' + activeScreen.label + '">' +
            activeScreen.group + ' / <strong>' + activeScreen.label + '</strong>' +
          '</span>' +
          '<div class="xadboom-prototype-nav__controls">' +
            '<a class="xadboom-prototype-nav__step" href="' + hrefFor(previous) + '" aria-label="Previous page: ' + previous.label + '">←</a>' +
            '<span class="xadboom-prototype-nav__position">' + position + '</span>' +
            '<a class="xadboom-prototype-nav__step" href="' + hrefFor(next) + '" aria-label="Next page: ' + next.label + '">→</a>' +
            '<button class="xadboom-prototype-nav__toggle" type="button" aria-expanded="true" aria-controls="xadboom-prototype-pages">Hide pages</button>' +
          '</div>' +
        '</div>' +
        '<div class="xadboom-prototype-nav__pages" id="xadboom-prototype-pages">' +
          '<div class="xadboom-prototype-nav__group"><span>Storefront</span><div>' + navigationLinks('Storefront', activeScreen) + '</div></div>' +
          '<div class="xadboom-prototype-nav__group"><span>Atelier Admin</span><div>' + navigationLinks('Atelier Admin', activeScreen) + '</div></div>' +
        '</div>' +
      '</div>';

    var style = document.createElement('style');
    style.textContent = [
      '#xadboom-prototype-nav{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99998;width:min(1120px,calc(100vw - 24px));font-family:"Space Grotesk",ui-monospace,monospace;color:#1c1917;-webkit-font-smoothing:antialiased}',
      '#xadboom-prototype-nav *{box-sizing:border-box}',
      '#xadboom-prototype-nav a{text-decoration:none}',
      '.xadboom-prototype-nav__container{overflow:hidden;border:1px solid #d8c3bc;border-radius:18px;background:rgba(255,248,246,.97);box-shadow:0 10px 36px rgba(35,26,22,.2);backdrop-filter:blur(16px)}',
      '.xadboom-prototype-nav__bar{display:flex;align-items:center;gap:16px;min-height:46px;padding:7px 10px 7px 14px}',
      '.xadboom-prototype-nav__brand{display:flex;align-items:center;gap:7px;flex:none;color:#1c1917!important;font-size:11px;font-weight:700;letter-spacing:.09em}',
      '.xadboom-prototype-nav__brand small{color:#7a6e69;font-size:8px;font-weight:500;letter-spacing:.12em}',
      '.xadboom-prototype-nav__dot{width:7px;height:7px;border-radius:50%;background:#844c38}',
      '.xadboom-prototype-nav__current{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#7a6e69;font-size:10px;letter-spacing:.03em}',
      '.xadboom-prototype-nav__current strong{color:#1c1917;font-weight:600}',
      '.xadboom-prototype-nav__controls{display:flex;align-items:center;gap:5px;margin-left:auto;flex:none}',
      '.xadboom-prototype-nav__step{display:grid;place-items:center;width:27px;height:27px;border:1px solid #d8c3bc;border-radius:50%;color:#1c1917!important;font-size:13px}',
      '.xadboom-prototype-nav__step:hover{background:#ecdad4}',
      '.xadboom-prototype-nav__position{min-width:46px;text-align:center;color:#7a6e69;font-size:9px}',
      '.xadboom-prototype-nav__toggle{height:28px;margin-left:4px;padding:0 11px;border:1px solid #d8c3bc;border-radius:999px;background:#ecdad4;color:#1c1917;font:600 9px "Space Grotesk",ui-monospace,monospace;cursor:pointer}',
      '.xadboom-prototype-nav__pages{display:grid;grid-template-columns:auto 1fr;gap:16px;max-height:40vh;overflow:auto;padding:10px 14px 12px;border-top:1px solid #d8c3bc}',
      '.xadboom-prototype-nav__group{display:flex;align-items:flex-start;gap:8px}',
      '.xadboom-prototype-nav__group>span{padding-top:5px;color:#844c38;font-size:8px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}',
      '.xadboom-prototype-nav__group>div{display:flex;flex-wrap:wrap;gap:4px}',
      '.xadboom-prototype-nav__link{padding:4px 7px;border-radius:5px;color:#4d4540!important;font-size:9px;white-space:nowrap}',
      '.xadboom-prototype-nav__link:hover{background:#ecdad4;color:#0a0a0a!important}',
      '.xadboom-prototype-nav__link.is-active{background:#0a0a0a;color:#fff8f6!important}',
      '#xadboom-prototype-nav.is-collapsed .xadboom-prototype-nav__pages{display:none}',
      '@media(max-width:720px){#xadboom-prototype-nav{bottom:8px;width:calc(100vw - 16px)}.xadboom-prototype-nav__container{border-radius:14px}.xadboom-prototype-nav__bar{flex-wrap:wrap;gap:6px 10px;padding:8px 9px 8px 11px}.xadboom-prototype-nav__brand small{display:none}.xadboom-prototype-nav__current{order:3;flex-basis:100%;padding-left:17px}.xadboom-prototype-nav__controls{gap:3px}.xadboom-prototype-nav__pages{grid-template-columns:1fr;gap:10px;max-height:48vh;padding:10px}.xadboom-prototype-nav__group{display:block}.xadboom-prototype-nav__group>span{display:block;padding:0 0 5px}.xadboom-prototype-nav__position{min-width:40px}.xadboom-prototype-nav__toggle{padding:0 8px}}'
    ].join('');

    document.head.appendChild(style);
    document.body.appendChild(nav);

    var toggle = nav.querySelector('.xadboom-prototype-nav__toggle');
    var storedState = null;
    try { storedState = window.localStorage.getItem('xadboom_prototype_nav_collapsed'); } catch (error) { /* Storage can be disabled for local files. */ }
    var collapsed = storedState === null ? window.matchMedia('(max-width: 720px)').matches : storedState === 'true';

    function reservePageSpace() {
      document.body.style.paddingBottom = Math.ceil(nav.offsetHeight + 28) + 'px';
    }

    function renderState() {
      nav.classList.toggle('is-collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.textContent = collapsed ? 'Show pages' : 'Hide pages';
      window.requestAnimationFrame(reservePageSpace);
    }

    toggle.addEventListener('click', function () {
      collapsed = !collapsed;
      try { window.localStorage.setItem('xadboom_prototype_nav_collapsed', String(collapsed)); } catch (error) { /* Ignore storage failures. */ }
      renderState();
    });
    window.addEventListener('resize', reservePageSpace);
    renderState();
  }

  if (useStaticDestinations) rewriteStaticLinks();
  installNavigator(currentScreen());
}());
