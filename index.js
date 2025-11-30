$(function(ev){
	let sid = Cookies.get('sid');
  let path = Cfg.host;
  let port = Cfg.port;
  if(port) path += ':' + port;
	if(sid) path += '?sid=' + sid;

	var ws = window.ws = new WS({
    server: path,
    autoReconnect: true
  });
	window.S = ws.on;
  window.W = (m, cb) => ws.send(m, cb);

	S.session = m => {
		Cookies.set('sid', m.sid);
		//if(m.user) acc.ok(m.user);


		//W({cmd: 'app'}, r => {
			window.App = {};
			//User.id = Me.link = r.home_link;

			window.Pref = {}// r || {};

			Pix8.init();

			$(document).trigger('loaded');
			$(document).trigger('pref');
		//});

		$(document).trigger('connected');
	}
});


$(document).on('loaded', ev => {
  Pix8.onPlus.dat = d => {
    Dats.load(d);

    W({
      cmd: 'save',
      path: 'dats.log',
      log: d
    });
  }
  
  // Auto-test browser iframe after a short delay
  setTimeout(() => {
    if(typeof Pix8 !== 'undefined' && typeof Pix8.onSite === 'function') {
      console.log('=== TESTING BROWSER IFRAME ===');
      Pix8.onSite('http://localhost:4251/test_iframe.html');
      setTimeout(() => {
        var $browser = $('#browser-window');
        console.log('=== IFRAME TEST RESULTS ===');
        console.log('Iframe exists:', $browser.length > 0);
        if($browser.length > 0) {
          console.log('Iframe src:', $browser.attr('src'));
          console.log('Iframe has active class:', $browser.hasClass('active'));
          console.log('Iframe display (jQuery):', $browser.css('display'));
          console.log('Iframe visibility (jQuery):', $browser.css('visibility'));
          var computed = window.getComputedStyle($browser[0]);
          console.log('Iframe display (computed):', computed.display);
          console.log('Iframe visibility (computed):', computed.visibility);
          console.log('Iframe z-index:', computed.zIndex);
          console.log('Iframe position:', computed.position);
          console.log('Iframe top:', computed.top);
          console.log('Iframe width:', computed.width);
          console.log('Iframe height:', computed.height);
        }
      }, 2000);
    }
  }, 2000);
});
