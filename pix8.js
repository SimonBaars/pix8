window.Pix8 = {
  init: function(cfg){
    cfg = $.extend({

    }, cfg);

    var t = this;

    this.words_link = Me.link+'words';
    this.sites_link = Me.link+'sites';

    if($('#pic').length) return;

    var $pic = Pix.$pic = Pix8.$pic = Pix8.$cont = $("<div>", {id: 'pic', class: 'bar'}).prependTo('body');

    var $header = Pix8.$header = $("<div>", {id: 'pix8-header'}).prependTo($pic);
    var $title = $("<div>", {id: 'pic8-title'}).appendTo($header);
    var $url = $('<input>', {placeholder: 'URL', id: 'pix8-url'}).appendTo($title);
    $url.bindEnter(function(ev){
      Pix8.onSite(this.value);
    })

    $url.keyup(function(ev){
      t.search(''+this.value);
    }).blur(ev => {

    });

    Pix8.initInput();

    Pix8.initCarousel();

    Pix8.initList();
    if(window.isElectron){
      Pix8.iniElectron();
    }
    Pix8.initBrowser();

    //Pix8.initGgif();

    Pix8.resize();
  },

	resize: function(){
    if(this.$pic.css('position') == 'fixed')

    if($('#content').is(':visible'))
      Pix.leaveGap();

    var height = $('#pic').height();

    if($('.page').is(':visible')){
      $('.page').height(window.innerHeight - height);
      $('body').css('margin-top', height);
    }
    
    // Adjust browser iframe position when pix8 header resizes
    var $browser = $('#browser-window');
    if($browser.length && $browser.hasClass('active')){
      $browser.css('top', height + 'px');
      $browser.css('height', 'calc(100vh - ' + height + 'px)');
    }

    return;
		var height = $('#pic').height();

    var h = 0;
    $('#pic > *:visible').each(function(){
      console.log($(this).css('position'));
      if($(this).css('position') != 'absolute')
        h += $(this).height();
    });
    $('#pic').height(h);
		//chrome.storage.local.set({height: height});
		//chrome.runtime.sendMessage({cmd: 'resize', height: height});
		//Pix.leaveGap(height);
	},

  initCarousel(){
    var carousel = this.carousel = new Carousel({
			name: 'main site',
			onAdd: function(url, $thumb){
				carousel.include(url, $thumb);
			},
			preloadLocal: false,
			preloadGoogle: false
		});

		carousel.$t.insertAfter('#pix8-header');

    this.onSite();
		//this.onSite(this.getUrl());

		Pix8.resize();
  },

  preloader_domains: ['preload.lh', 'io.cx', 'th.ai', 'm', 'm8'],
  getUrl(){
    var url = document.location.href;

    var loc = document.location;

    if(url.indexOf('file://') === 0){
      url = Cfg.default_site;
    }else
    if(this.preloader_domains.indexOf(loc.hostname) + 1){
    	let uri = document.location.pathname.replace(/^\/+|[^A-Za-z0-9_.:\/~ @-]|\/+$/g, '');
    	var p = uri.split(/[\/]+/);
      var word = p.shift();

      if(word == 'http' || word == 'https')
        url = word+'://'+p.join('/');
      else
      if(!p[0]){
        var wword = word.charAt(0).toUpperCase() + word.slice(1);
        url = 'https://en.wikipedia.org/wiki/' + wword;
      }
    }


    return url;
  },

  initGgif(){
    var $iframe = $('<iframe>', {id: 'ggif', class: 'page'});
    $iframe.appendTo('body');
  },

  initBrowser(){
    // Create browser iframe if it doesn't exist
    var $browser = $('#browser-window');
    if(!$browser.length){
      $browser = this.$browser = $('<iframe>', {
        id: 'browser-window',
        allow: 'fullscreen'
      });
      $browser.appendTo('body');
      console.log('Browser iframe created, element:', $browser[0]);
    } else {
      this.$browser = $browser;
      console.log('Browser iframe already exists');
    }

    $browser.on('load', ev => {
      var src = $browser.attr('src');
      console.log('Browser iframe load event fired, src:', src);
      console.log('Iframe element:', $browser[0]);
      console.log('Iframe computed display:', window.getComputedStyle($browser[0]).display);
      console.log('Iframe computed visibility:', window.getComputedStyle($browser[0]).visibility);
      console.log('Iframe has active class:', $browser.hasClass('active'));
      
      // Check if iframe actually loaded (some sites block iframe embedding)
      setTimeout(() => {
        try {
          var iframeDoc = $browser[0].contentDocument || $browser[0].contentWindow?.document;
          if(iframeDoc && iframeDoc.body) {
            console.log('Iframe content loaded successfully, body length:', iframeDoc.body.innerHTML.length);
          } else {
            console.warn('Iframe may be blocked by X-Frame-Options or content not loaded yet');
          }
        } catch(e) {
          // Cross-origin, can't access - this is normal for external sites
          console.log('Cross-origin iframe (normal for external sites), error:', e.message);
        }
      }, 1000);
      
      // Trigger siteLoaded event if needed
      if(typeof this.siteLoaded === 'function' && src){
        try {
          var title = '';
          try {
            title = $browser[0].contentDocument?.title || '';
          } catch(e) {
            // Cross-origin, can't access
          }
          this.siteLoaded({target: {document: {src: src, title: title}}});
        } catch(e) {
          console.warn('Error in siteLoaded:', e);
        }
      }
    });
    
    $browser.on('error', ev => {
      console.error('Browser iframe error loading:', $browser.attr('src'));
    });
  },

  getLink(path){
    var url;

		if(path.indexOf('dat://') == 0)
			url = path;
		else
		if(path.indexOf('http://') == 0 || path.indexOf('https://') == 0){
			var site = Pix8.sites[path];

      var s = '/wiki/';
      if(path.indexOf(s)+1){
        var word = path.substr(path.indexOf(s) + s.length).split('/')[0].toLowerCase();
        //console.log();
        //console.log(word);
    		url = App.home_link + 'words/' + word + '.yaml';
      }
      else
			if(site)
				url = site;
			else
				url = App.home_link + 'sites/' + md5(path) + '.yaml';
		}else{
			url = App.home_link + 'words/' + path + '.yaml';
    }

		var link = new Link(url);
		return link;
  },

  createIndex: function(){
    var $cont = this.$search = $('<div>', {id: 'pix8list-search'}).appendTo(this.$Pix8list);

    var index = this.index = elasticlunr(function(){
      this.addField('title');
      this.addField('url');
      this.addField('word');
      this.setRef('ref');
      this.saveDocument(false);
    });

    var link = new Link(this.words_link);
    link.list(items => {
      (items || []).forEach(name => {
        var word = name.split('.')[0];

        index.addDoc({
          word,
          ref: word
        });
      });

      var sites = [];
      var link = new Link(this.sites_link);
      link.list(list => {
        list.forEach(name => {
        	var url = Pix8.sites_link + '/' + name;
        	sites.push(url);
        });


        Items.load(sites).then(items => {
          items.forEach(item => {
            item.ref = Pix8.sites_link + '/' + md5(item.url) + '.yaml';
            index.addDoc(item);
          });
        });
      });

    });
  },

  search: function(q){
    if(this.$Pix8list.is(':hidden')){
      $('#pic8-openMenu').click();
    }

    if(!this.index) return;

    var found = this.index.search(q);

    this.$search.empty();
    found.forEach(rez => {
      var item = (rez.ref.indexOf('://')+1)?Items[rez.ref]:{word: rez.ref}
      var $item = $('<a>', {title: item.url});
      this.$search.append($item);
      $item.text(item.title || item.url || item.word);
      $item.data(item);
      $item.click(ev => Pix8.clickResult(ev));
    });
  },

  clickResult: function(ev){
    var item = $(ev.target).data();

    this.$Pix8list.hide();

    if(item.url){
      this.onSite(item.url);
      return;
    }

    if(item.word){
      var carousel = new Carousel({
        name: item.word
      });

      var $carouselLast = $('#pic > .carousel').last();

      carousel.$t.insertAfter($carouselLast[0] || $('#pix8-header'));
      carousel.load(item.word);
      Pix8.resize();
    }
  },

  siteLoaded: function(site){
    if(!site || !site.target) return;
    var url = site.target.document ? site.target.document.src : (site.target.src || '');
    if(!url) return;
    
    var link = new Link(this.sites_link+md5(url)+'.yaml');
    link.load(item => {
      if(item){
        this.carousel.link = link;
        this.carousel.loadView(item);
      } else{
        var item = {
          url: url,
          type: 'site',
          title: (site.target.document && site.target.document.title) || ''
        };
        link.save(item);
      }
    });
  },

  initInput: function(){
    var $resize = this.$resize = $("<div id='pic-resize'></div>");
    $resize.appendTo(Pix8.$pic);

    var t = this;
    var $tag = Pix.$tag = Pix8.$tag = $("<input id='pic-tag'/>").appendTo($resize);
    $tag.focus(ev => {
      $resize.addClass('focus');
    }).blur(ev => {
      $resize.removeClass('focus');
    });

    $tag.bindEnter(function(){
      Pix8.parseTag(this.value);

      return;

      if(this.value[0] == '+'){

        Pix8.onPlus[plus[0]](this.value.substr(this.value.indexOf(':')+1));
        this.value = '';
        return;
      }

      if(
        this.value.indexOf('http://') == 0 ||
        this.value.indexOf('https://') == 0
      ) {
        Pix8.onSite(this.value);
      }

      var carousel = new Carousel({});

      carousel.$t.insertBefore(t.$resize);
      Pix8.resize();

      var link = Link(this.value);
      carousel.laylink(link);

      this.value = '';

      if(false && window.isElectron)
        window.resizeBy(0, carousel.$t.height())
    }).click(function(){
      $tag.focus();
    });

    this.enableInputDrag();
  },



  onSite(url){
    if(!url) return;
    
    // Update URL input field
    $('#pix8-url').val(url);
    
    // Load URL in browser iframe if it exists
    var $browser = $('#browser-window');
    if(!$browser.length){
      console.warn('Browser iframe not found, creating it...');
      // If iframe doesn't exist, create it
      this.initBrowser();
      $browser = $('#browser-window');
    }
    
    if($browser.length){
      console.log('Setting iframe src to:', url);
      var picHeight = $('#pic').height() || 0;
      $browser.attr('src', url);
      $browser.addClass('active');
      $browser.css({
        'display': 'block',
        'visibility': 'visible',
        'top': picHeight + 'px',
        'height': 'calc(100vh - ' + picHeight + 'px)',
        'z-index': '10'
      });
      $('body').addClass('has-browser');
      console.log('Browser iframe configured:');
      console.log('  - src:', $browser.attr('src'));
      console.log('  - has active class:', $browser.hasClass('active'));
      console.log('  - display style:', $browser.css('display'));
      console.log('  - visibility style:', $browser.css('visibility'));
      console.log('  - top:', $browser.css('top'));
      console.log('  - height:', $browser.css('height'));
      console.log('  - computed display:', window.getComputedStyle($browser[0]).display);
      console.log('  - z-index:', window.getComputedStyle($browser[0]).zIndex);
    } else {
      console.error('Failed to create browser iframe');
    }
    
    // Create link and load into carousel
    var link;
    try {
      // Try using Link as a function first (for src/data/Link.js)
      if(typeof Link === 'function' && Link.length === 1){
        link = Link(url);
      } else if(typeof Link !== 'undefined'){
        // Otherwise use new Link
        link = new Link(url);
      }
    } catch(e) {
      console.warn('Failed to create Link:', e);
    }
    
    var carousel = this.carousel;
    if(link){
      carousel.link = link;
      
      // Only call load if it exists
      if(typeof link.load === 'function'){
        link.load(item => {
          if(item){
            // If item has items array, load those items
            if(item.items && Array.isArray(item.items)){
              carousel.load(item.items);
            } else {
              // Otherwise load the item itself
              carousel.load([item]);
            }
          } else {
            // If no item exists, create a new one from the URL
            var newItem = {
              url: url,
              owner: (typeof Me !== 'undefined' && Me.link) ? Me.link : null,
              time: (new Date()).getTime()
            };
            
            if(typeof link.save === 'function'){
              link.save(newItem).then(r => {
                if(r) carousel.load([newItem]);
              }).catch(e => {
                console.warn('Failed to save item:', e);
                carousel.load([newItem]);
              });
            } else {
              carousel.load([newItem]);
            }
          }
        });
      } else {
        // If link doesn't have load method, just create a simple item
        var newItem = {
          url: url,
          owner: (typeof Me !== 'undefined' && Me.link) ? Me.link : null,
          time: (new Date()).getTime()
        };
        carousel.load([newItem]);
      }
    } else {
      // If link creation failed, still create a simple item for the carousel
      var newItem = {
        url: url,
        owner: (typeof Me !== 'undefined' && Me.link) ? Me.link : null,
        time: (new Date()).getTime()
      };
      carousel.load([newItem]);
    }
  },

  parseTag(url){
    var carousel = new Carousel({});

    carousel.$t.insertBefore(this.$resize);
    Pix8.resize();

    var link = Link(url);
    carousel.laylink(link);
  },

  onPlus: {},
  regPlus: function(handler, cb){
    this.onPlus[handler] = cb;
  },

  iniElectron: function(){
    var window = require('electron').remote.getCurrentWindow();

    $("<button>", {id: 'pic8-devTools'}).click(ev => {
      window.toggleDevTools();
    }).html('&lt;&gt;').appendTo(Pix8.$header);

    $("<button>", {id: 'pic8-minimize'}).click(ev => {
      window.minimize();
    }).html('&minus;').appendTo(Pix8.$header);


    $("<button>", {id: 'pic8-close'}).click(ev => {
      window.close();
    }).html('&#10005;').appendTo(Pix8.$header);
  },

  enableInputDrag: function(){
    var $pic = Pix8.$pic;
    jQuery.event.special.drag.defaults.not = '';
    this.$tag.drag("start", function(ev, dd){
    	dd.height = parseInt($('#pic').height());
    	var $carousel = Pix8.$pic.children('.carousel').last();
    	dd.carouselHeight = $carousel.height();
    	dd.left = $carousel[0].scrollLeft;
    	dd.clientX = ev.clientX;
    	dd.done = 0;
    }, {click: true}).drag(function(ev, dd){
    	var onTop = !($pic.css('top') == 'auto'),
    			delta = dd.deltaY * (onTop?1:(-1));

    	var dif = dd.deltaY - dd.done;
    	dd.done = dd.deltaY;

    	var $carousel = $pic.children('.carousel').last();
      if(!$carousel.length) return;

      var carousel = $carousel[0].carousel;

    	var height = $carousel.height() + dif;
    	if(height){
    		$carousel.height(height);
    		carousel.resize();
    	}
    	else
    		carousel.$t.remove();

    	var newL = (dd.left + dd.clientX) * carousel.$t.height() / dd.carouselHeight,
    		dif = newL - dd.left - dd.clientX;
    	carousel.t.scrollLeft = dd.left + dif;
    }).drag("end", function(ev, dd){
    	Pix8.resize();
    	//onScroll();
    });
  },

  logSite: function(link, site){
    if(!view.path) return;
    if(view.path.indexOf('file://') + 1) return;

    (new Link(Me.link)).log(link +' '+ site);
  },

  initList: function(){
    var $cont = this.$Pix8list = $('<div>', {id: 'pix8list'}).appendTo('#pic');

    $("<button>", {id: 'pic8-openMenu'}).click(ev => {
      $cont.toggle();

      if(!Pix8.initiated){
        //this.createIndex();
        //this.initWords();
        this.initSites();
        Pix8.initiated = true;
      }
    }).html("&#8803").prependTo(Pix8.$header);

  },
  initiated: false,

  initWords: function(){
    var $cont = this.$Pix8list_words = $('<div>', {id: 'pix8list_words'}).appendTo(this.$Pix8list);

    Pix8.loadWords();
  },

  initSites: function(){
    var $cont = this.$Pix8list_sites = $('<div>', {id: 'pix8list_sites'}).appendTo(this.$Pix8list);

    return;
    this.sites_link.load(item => {
      if(item && item.length){
        item.forEach(line => {
          var l = line.split(' ');

          Pix8.addSite(l[0]);
        });
      }
    });
  },

  addSite: function(link, url){
    this.sites[url] = link;

    var $item = $('<a>', {href: text});
    $item.text(text).data({id, text});
    $item.click(ev => Pix8.clickTag(ev));
    $('#pix8list_sites').prepend($item);
    return $item;
  },

  sites: {},
  words: {},
  items: {},

  loadWords: function(id){
    var link = new Link(this.words_link);

    link.list(items => {
      (items || []).forEach(name => {
        var word = name.split('.')[0];

        Pix8.addTag(word);
      });

      Pix8.resize();
    });
  },

  addTag: function(word){
    var $item = this.buildTag(word);
    $('#pix8list_words').prepend($item);
  },

  buildTag: function(word){
    var $item = $('<a>');
    $item.text(word);
    $item.click(ev => Pix8.clickTag(ev));
    return $item;
  },

  clickTag: function(ev){
    ev.preventDefault();

    var text = $(ev.target).text();

    var carousel = new Carousel({
      name: text,
    });

    this.$Pix8list.hide();

  	var $carouselLast = $('#pic > .carousel').last();

    carousel.$t.insertAfter($carouselLast[0] || $('#pix8-header'));
    carousel.load(text);
    Pix8.resize();


    if(text.indexOf('http') == 0)
      $('#pix8-url').val(text);
  },

  addWord: function(){

  }
};
