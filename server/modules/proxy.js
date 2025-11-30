var http = require('http');
var https = require('https');
var url = require('url');
var cheerio;
try {
  cheerio = require('cheerio');
} catch(e) {
  console.log('cheerio not available, HTML rewriting disabled');
}

// Proxy endpoint to bypass X-Frame-Options
GET['proxy'] = function(q){
	var targetUrl = q.get.url || q.get.u;
	if(!targetUrl){
		q.res.writeHead(400, {'Content-Type': 'text/plain'});
		q.res.end('Missing url parameter');
		return;
	}

	// Validate URL
	try {
		var parsed = url.parse(targetUrl);
		if(!parsed.protocol || (!parsed.protocol.startsWith('http') && !parsed.protocol.startsWith('https'))){
			q.res.writeHead(400, {'Content-Type': 'text/plain'});
			q.res.end('Invalid URL protocol');
			return;
		}
	} catch(e){
		q.res.writeHead(400, {'Content-Type': 'text/plain'});
		q.res.end('Invalid URL');
		return;
	}

	var client = targetUrl.startsWith('https') ? https : http;
	var proxyUrl = 'http://localhost:' + (Cfg.http.port || 4251) + '/proxy?u=' + encodeURIComponent(targetUrl);

	client.get(targetUrl, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		}
	}, function(res){
		var contentType = res.headers['content-type'] || '';
		var isHtml = contentType.indexOf('text/html') !== -1;
		var chunks = [];

		res.on('data', function(chunk){
			chunks.push(chunk);
		});

		res.on('end', function(){
			var body = Buffer.concat(chunks);
			var content = body.toString('utf8');

			// If HTML, rewrite URLs to go through proxy
			if(isHtml && cheerio){
				try {
					var $ = cheerio.load(content);
					var baseUrl = targetUrl;

					// Rewrite relative URLs to absolute
					$('a[href]').each(function(){
						var href = $(this).attr('href');
						if(href && !href.match(/^(https?:|mailto:|javascript:|#)/)){
							var absolute = url.resolve(baseUrl, href);
							$(this).attr('href', '/proxy?u=' + encodeURIComponent(absolute));
						} else if(href && href.match(/^https?:\/\//)){
							$(this).attr('href', '/proxy?u=' + encodeURIComponent(href));
						}
					});

					$('img[src]').each(function(){
						var src = $(this).attr('src');
						if(src && !src.match(/^(https?:|data:)/)){
							var absolute = url.resolve(baseUrl, src);
							$(this).attr('src', absolute);
						}
					});

					$('link[href]').each(function(){
						var href = $(this).attr('href');
						if(href && !href.match(/^(https?:|data:)/)){
							var absolute = url.resolve(baseUrl, href);
							$(this).attr('href', absolute);
						}
					});

					$('script[src]').each(function(){
						var src = $(this).attr('src');
						if(src && !src.match(/^(https?:|data:)/)){
							var absolute = url.resolve(baseUrl, src);
							$(this).attr('src', absolute);
						}
					});

					$('form[action]').each(function(){
						var action = $(this).attr('action');
						if(action && !action.match(/^(https?:|javascript:)/)){
							var absolute = url.resolve(baseUrl, action);
							$(this).attr('action', '/proxy?u=' + encodeURIComponent(absolute));
						} else if(action && action.match(/^https?:\/\//)){
							$(this).attr('action', '/proxy?u=' + encodeURIComponent(action));
						}
					});

					// Add base tag if not present
					if($('base').length === 0){
						$('base').remove(); // Remove any existing base tags first
						$('head').prepend('<base href="' + targetUrl + '">');
					}

					// Inject navigation handler script to keep links in iframe
					var navScript = `
<script>
(function(){
	// Intercept link clicks to ensure they stay in iframe
	document.addEventListener('click', function(e){
		var link = e.target.closest('a[href]');
		if(link && link.href){
			var href = link.getAttribute('href');
			// Only intercept if it's a proxy link or needs to be proxied
			if(href.indexOf('/proxy?u=') === 0 || href.indexOf('http://') === 0 || href.indexOf('https://') === 0){
				// If it's already a proxy link, let it navigate normally
				if(href.indexOf('/proxy?u=') === 0){
					return; // Let it navigate
				}
				// Otherwise, prevent default and navigate through proxy
				e.preventDefault();
				e.stopPropagation();
				var proxyUrl = '/proxy?u=' + encodeURIComponent(href);
				window.location.href = proxyUrl;
				return false;
			}
		}
	}, true);
	
	// Handle form submissions
	document.addEventListener('submit', function(e){
		var form = e.target;
		if(form.tagName === 'FORM' && form.action){
			var action = form.getAttribute('action');
			if(action && (action.indexOf('http://') === 0 || action.indexOf('https://') === 0)){
				if(action.indexOf('/proxy?u=') !== 0){
					e.preventDefault();
					var proxyUrl = '/proxy?u=' + encodeURIComponent(action);
					form.action = proxyUrl;
					form.submit();
					return false;
				}
			}
		}
	}, true);
	
	// Notify parent window of navigation
	var notifyParent = function(){
		try {
			if(window.parent && window.parent !== window){
				window.parent.postMessage({
					type: 'iframe-navigation',
					url: window.location.href,
					title: document.title
				}, '*');
			}
		} catch(e) {
			// Cross-origin, can't access
		}
	};
	
	// Notify on load
	notifyParent();
	
	// Notify on hash change
	window.addEventListener('hashchange', notifyParent);
	
	// Prefetch images for better performance
	var prefetchImages = function(){
		var images = document.querySelectorAll('img[src]');
		images.forEach(function(img){
			var src = img.getAttribute('src');
			if(src && src.indexOf('data:') !== 0){
				var link = document.createElement('link');
				link.rel = 'prefetch';
				link.as = 'image';
				link.href = src;
				document.head.appendChild(link);
			}
		});
	};
	
	// Prefetch images after page load
	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', prefetchImages);
	} else {
		prefetchImages();
	}
})();
</script>`;
					
					// Inject script before closing body tag, or in head if no body
					if($('body').length > 0){
						$('body').append(navScript);
					} else {
						$('head').append(navScript);
					}

					content = $.html();
				} catch(e){
					console.log('Error parsing HTML:', e);
					// Continue with original content if parsing fails
				}
			}

			// Remove X-Frame-Options and CSP headers
			var headers = {};
			for(var key in res.headers){
				var lowerKey = key.toLowerCase();
				if(lowerKey !== 'x-frame-options' && 
				   lowerKey !== 'content-security-policy' &&
				   lowerKey !== 'frame-options'){
					headers[key] = res.headers[key];
				}
			}

			// Set content type
			if(contentType){
				headers['Content-Type'] = contentType;
			}

			// Allow iframe embedding
			headers['X-Frame-Options'] = 'ALLOWALL';
			headers['Content-Security-Policy'] = "frame-ancestors *;";

			q.res.writeHead(res.statusCode || 200, headers);
			q.res.end(content);
		});
	}).on('error', function(err){
		console.log('Proxy error:', err);
		q.res.writeHead(500, {'Content-Type': 'text/plain'});
		q.res.end('Proxy error: ' + err.message);
	});
};

