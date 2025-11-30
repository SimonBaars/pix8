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
  
  // Test: Load Wikipedia article with images
  setTimeout(() => {
    if(typeof Pix8 !== 'undefined' && typeof Pix8.onSite === 'function') {
      console.log('=== TESTING: Loading Wikipedia article with images ===');
      // Load a Wikipedia article that has images (e.g., "Cat" article)
      Pix8.onSite('https://en.wikipedia.org/wiki/Cat');
    }
  }, 2000);
});
