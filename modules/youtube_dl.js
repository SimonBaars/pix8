// Only load Node.js modules in Electron/Node environment
var FS, ytdl, YAML, ffmpeg;
if (typeof require !== 'undefined' && (window.isElectron || typeof process !== 'undefined' && process.versions && process.versions.electron)) {
  try {
    FS = require('fs');
    ytdl = require('ytdl-core');
    YAML = require('js-yaml');
    ffmpeg = require('fluent-ffmpeg');
    if (ffmpeg.setFfmpegPath) {
      ffmpeg.setFfmpegPath('./bin/ffmpeg.exe');
    }
  } catch(e) {
    console.warn('youtube_dl module: Node.js dependencies not available', e);
  }
}

var log = t => console.log(t);

$(document).on('pref', ev => {
  Pix8.onPlus.youtube = d => {
    if (!FS || !ytdl || !YAML) {
      console.warn('youtube_dl: Node.js environment required');
      return;
    }
    
    var dat = Dats[(Pref.youtubes || '').split('://')[1]];
    var os = require('os');
    var folder = dat?dat.path:JP(os.homedir(), 'youtubes');

    const key = dat.key.toString('hex');

    var url = 'http://www.youtube.com/watch?v='+d;

    var video_file = d + '.mp4';

    log(dat);
    var stream = ytdl(url, { filter: (format) => format.container === 'mp4' });
    stream.pipe(FS.createWriteStream(JP(dat.path, video_file)));

    var $bar = $('<div>').css({
      height: '3px',
      background: 'red',
      width: '5%',
      transition: 'width 0.3s'
    }).appendTo('#pic');

    stream.on('progress', (chunk, already, total) => {
      var prc = parseFloat(100 * (already/total)).toFixed(2);
      $bar.css('width',  prc + '%');
    });

    stream.on('finish', () => {
      var thumb = 'https://img.youtube.com/vi/'+d+'/hqdefault.jpg';

      var file = FS.createWriteStream(JP(dat.path, d+'.jpg'));
      var https = require('https');
      var request = https.get(thumb, response => {
        response.pipe(file);


        var audio = ffmpeg(JP(dat.path, video_file)).toFormat('gif');
        audio.saveToFile(JP(dat.path, d+'.gif'));

        file.on('finish', () => {
          var item = {
            src: 'dat://'+key+'/'+video_file,
            thumb: 'dat://'+key+'/'+d+'.jpg',
            type: 'video'
          };
          console.log(item);

          FS.writeFileSync(JP(dat.path, d+'.yaml'), YAML.safeDump(item));

          $bar.remove();

          file.close();
        });
      });
    });
  };
});
