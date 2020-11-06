import{a as jn,b as ze,c as $t,d as Pn,e as Pt,f as Sn,g as Tn,k as bt,l as Tt,m as w,o as se,p as Kt,q as $,r as I,s as kn,t as An}from"../chunk.DDMECWGI.js";function Ke(e,t){const a=t.mediaUrl+" | "+t.mediaTitle;console.log(`DEBUGLOGGER.........: logErrorOnServer(): ${e} - ${a}`),gtag("event",a,{event_category:e,event_label:"Ultrafunk Client Error"})}const Le=I("eventlogger"),d={UNKNOWN:1e3,KEYBOARD:100,MOUSE:110,YOUTUBE:1,SOUNDCLOUD:2,ULTRAFUNK:50},f={UNKNOWN:-2e3,KEY_ARROW_LEFT:80,KEY_ARROW_RIGHT:81,MOUSE_CLICK:82,STATE_ERROR:-5,STATE_UNSTARTED:-1,STATE_ENDED:0,STATE_PLAYING:1,STATE_PAUSED:2,STATE_BUFFERING:3,STATE_CUED:5,RESUME_AUTOPLAY:50,PLAYER_ERROR:60,CROSSFADE_START:70},Mt={eventSource:d.UNKNOWN,eventType:f.UNKNOWN,uId:null,timeStamp:0};class We{constructor(e=10){this.log=[],this.maxEntries=e,this.lastPos=0,this.matchCount=0}add(e,t,a,s=Date.now()){const r=Object.create(Mt);r.eventSource=e,r.eventType=t,r.uId=a,r.timeStamp=s,this.log.length<this.maxEntries?this.log.push(r):(this.log.shift(),this.log.push(r))}clear(){this.log=[]}initMatch(){this.lastPos=this.log.length-1,this.matchCount=0}matchesEvent(e,t,a,s=null){this.log[this.lastPos-e].eventSource===t&&this.log[this.lastPos-e].eventType===a&&this.log[this.lastPos-e].uId===s&&this.matchCount++}matchesDelta(e,t){this.log[this.lastPos].timeStamp-this.log[this.lastPos-e].timeStamp<=t&&this.matchCount++}isPatternMatch(e,t){return this.matchCount===e?(Le.log(`MATCH for: ${t}`),Le.logEventLog(this.log,d,f),!0):!1}}class Ge extends We{constructor(e){super(e)}doubleClicked(e,t,a){return this.initMatch(),this.lastPos>=1&&(this.matchesEvent(1,e,t),this.matchesEvent(0,e,t),this.matchesDelta(1,a)),this.isPatternMatch(3,`${Le.getObjectKeyForValue(d,e)} Double Clicked`)}}class qe extends We{constructor(e){super(e)}ytAutoPlayBlocked(e,t){return this.initMatch(),this.lastPos>=3&&(this.matchesEvent(3,d.ULTRAFUNK,f.RESUME_AUTOPLAY,null),this.matchesEvent(2,d.YOUTUBE,f.STATE_UNSTARTED,e),this.matchesEvent(1,d.YOUTUBE,f.STATE_BUFFERING,e),this.matchesEvent(0,d.YOUTUBE,f.STATE_UNSTARTED,e),this.matchesDelta(3,t)),this.isPatternMatch(5,"YouTube AutoPlay Blocked")}scAutoPlayBlocked(e,t){return this.initMatch(),this.lastPos>=3&&(this.matchesEvent(3,d.ULTRAFUNK,f.RESUME_AUTOPLAY,null),this.matchesEvent(2,d.SOUNDCLOUD,f.STATE_PLAYING,e),this.matchesEvent(1,d.SOUNDCLOUD,f.STATE_PAUSED,e),this.matchesEvent(0,d.SOUNDCLOUD,f.STATE_PAUSED,e),this.matchesDelta(3,t)),this.isPatternMatch(5,"SoundCloud AutoPlay Blocked")}scWidgetPlayBlocked(e,t){return this.initMatch(),this.lastPos>=2&&(this.matchesEvent(2,d.SOUNDCLOUD,f.STATE_PLAYING,e),this.matchesEvent(1,d.SOUNDCLOUD,f.STATE_PAUSED,e),this.matchesEvent(0,d.SOUNDCLOUD,f.STATE_PAUSED,e),this.matchesDelta(2,t)),this.isPatternMatch(4,"SoundCloud WidgetPlay Blocked")}scPlayDoubleTrigger(e,t){return this.initMatch(),this.lastPos>=2&&(this.matchesEvent(2,d.ULTRAFUNK,f.CROSSFADE_START,null),this.matchesEvent(1,d.SOUNDCLOUD,f.STATE_PLAYING,e),this.matchesEvent(0,d.SOUNDCLOUD,f.STATE_PLAYING,e),this.matchesDelta(1,t)),this.isPatternMatch(4,"SoundCloud Play Double Trigger")}}const te=I("crossfade"),H={MIN:0,MAX:100},F={NONE:-1,AUTO:0,TRACK:1},ue={NONE:-1,EQUAL_POWER:0,LINEAR:1},Ce={updateCrossfadeInterval:50},je=(e,t)=>{const a=e,s=t;let r=!1,i=-1,g=null,y=null,c=0,h=0,S=F.NONE,ee=ue.NONE,Y=0;return{isFading(){return r},init:ke,start:Ae,stop:E,mute:G};function ke(v,N=0,A=null){return r===!1&&Ie(A)===!0?(te.log(`init() - crossfadeType: ${te.getObjectKeyForValue(F,v)} - crossfadeCurve: ${te.getObjectKeyForValue(ue,N)} - fadeInUid: ${A}`),r=!0,h=a.masterVolume,S=v,ee=N,y.setVolume(0),A===null?s.nextTrack(!0):s.jumpToTrack(s.trackFromUid(A),!0,!1),{fadeOutPlayer:s.indexMap.get(g.getUid()),fadeInPlayer:s.indexMap.get(y.getUid())}):null}function Ae(v){r&&g.getPosition(N=>{Y=(N+Ce.updateCrossfadeInterval)/1e3;const A=g.getDuration()-Y,B=A-Ce.updateCrossfadeInterval/1e3;S===F.AUTO?c=B:S===F.TRACK&&(c=A>a.trackCrossfadeLength?a.trackCrossfadeLength:B),te.log(`start() - fadeStartTime: ${Y.toFixed(2)} sec - timeRemaining: ${A.toFixed(2)} sec - fadeLength: ${c.toFixed(2)} sec - fadeInUid: ${v}`),i=setInterval(ee===ue.EQUAL_POWER?Rt:wt,Ce.updateCrossfadeInterval)})}function E(){te.log(`stop() - isFading: ${r}`),r&&(i!==-1&&(clearInterval(i),i=-1),g!==null&&(g.pause(),g.seekTo(0),setTimeout(()=>{g.setVolume(a.masterVolume),g=null},200)),y!==null&&setTimeout(()=>{y.setVolume(a.masterVolume),y=null},200),r=!1,c=0,h=0,S=F.NONE,ee=ue.NONE,Y=0)}function G(v){g!==null&&g.mute(v)}function Ie(v){return g=s.current,y=v===null?s.next:s.playerFromUid(v),!!(g.getPlayable()&&y.getPlayable())}function Rt(){g.getPosition(v=>{const N=v/1e3-Y,A=N>=0?N:0,B=h-h*(A/c),ve=B>=H.MIN?B:H.MIN,_t=Math.round(Math.sqrt(h*ve)),$e=Math.round(Math.sqrt(h*(h-ve)));A>=c&&ve<=H.MIN&&$e>=h?E():(g.setVolume(_t),y.setVolume($e))})}function wt(){g.getPosition(v=>{const N=v/1e3-Y,A=Math.round(h*(N/c)),B=h-A;N>c&&B<H.MIN&&A>h?E():(g.setVolume(B),y.setVolume(A))})}},J=I("mediaplayers"),Vt=/\s{1,}[–·-]\s{1,}/i;class He{constructor(e,t,a){this.postId=e,this.iframeId=t,this.embeddedPlayer=a,this.playable=!0,this.duration=0,this.artist=null,this.title=null,this.thumbnailSrc=null,this.thumbnail=new Image,this.thumbnail.decoding="async"}getPostId(){return this.postId}getIframeId(){return this.iframeId}getUid(){return this.iframeId}getEmbeddedPlayer(){return this.embeddedPlayer}getPlayable(){return this.playable}setPlayable(e){this.playable=e}getDuration(){return this.duration}setDuration(e){this.duration=e}getArtist(){return this.artist}setArtist(e){this.artist=e}getTitle(){return this.title}setTitle(e){this.title=e}getThumbnailSrc(){return this.thumbnailSrc}seekTo(e){this.embeddedPlayer.seekTo(e)}setVolume(e){this.embeddedPlayer.setVolume(e)}setThumbnail(e){this.thumbnailSrc=e,this.thumbnail.src=e}}class Je extends He{constructor(e,t,a,s){super(e,t,a);this.previousPlayerState=-1,this.setThumbnail(s)}setThumbnail(e){const t=new URL(decodeURIComponent(e)),a=t.pathname.split("/embed/");a.length===2&&a[1].length===11?super.setThumbnail(`https://img.youtube.com/vi/${a[1]}/mqdefault.jpg`):J.warn(`MediaPlayer.YouTube.setThumbnail() failed for: ${this.iframeId}`)}pause(){this.embeddedPlayer.pauseVideo()}stop(){this.embeddedPlayer.stopVideo()}isPlaybackError(e){return J.log(`YouTube.play() - current playerState: ${this.embeddedPlayer.getPlayerState()} - previous playerState: ${this.previousPlayerState} - playable: ${this.playable}`),this.embeddedPlayer.getPlayerState()===-1&&this.previousPlayerState===-1&&this.playable===!0?(J.warn(`MediaPlayer.YouTube.play() - Unable to play track: ${this.getArtist()} - "${this.getTitle()}" with videoId: ${this.embeddedPlayer.getVideoData().video_id} -- No YouTube API error given!`),this.playable=!1,e(this,this.embeddedPlayer.getVideoUrl()),!0):(this.previousPlayerState=this.embeddedPlayer.getPlayerState(),!1)}play(e){this.isPlaybackError(e)===!1&&(this.playable===!0?this.embeddedPlayer.playVideo():e(this,this.embeddedPlayer.getVideoUrl()))}getVolume(e){e(this.embeddedPlayer.getVolume())}mute(e){e?this.embeddedPlayer.mute():this.embeddedPlayer.unMute()}getPosition(e){e(this.embeddedPlayer.getCurrentTime()*1e3,this.duration)}}class De extends He{constructor(e,t,a,s){super(e,t,a);this.soundId=this.getSoundId(s),this.volume=H.MAX,this.muted=!1}getSoundId(e){if(e!==void 0){const t=new URL(decodeURIComponent(e)),a=t.searchParams.get("url");if(a!==null){const s=a.split("/"),r="tracks".toUpperCase();for(let i=0;i<s.length;i++)if(s[i].toUpperCase()===r)return parseInt(s[i+1])}}return J.error(`MediaPlayer.SoundCloud.getSoundId() failed for: ${this.iframeId}`),null}setThumbnail(){this.embeddedPlayer.getCurrentSound(e=>{const t=e.artwork_url!==null?e.artwork_url:e.user.avatar_url;t!=null&&super.setThumbnail(t)})}getUid(){return this.soundId}pause(){this.embeddedPlayer.pause()}play(e){this.playable===!0?this.embeddedPlayer.getCurrentSound(t=>{t.playable===!0?this.embeddedPlayer.play():e(this,t.permalink_url)}):e(this,"https://soundcloud.com")}stop(){this.embeddedPlayer.pause(),super.seekTo(0)}seekTo(e){super.seekTo(e*1e3)}getVolume(e){this.embeddedPlayer.getVolume(t=>e(t))}setVolume(e){e!==0&&(this.volume=e),(this.muted===!1||e===0)&&super.setVolume(e)}mute(e){this.muted=!!e,e?this.setVolume(0):this.setVolume(this.volume)}getPosition(e){this.embeddedPlayer.getPosition(t=>e(t,this.duration))}}function Xe(e,t){if(t!==null&&t.length>0){const a=t.match(Vt);a!==null?(e.artist=t.slice(0,a.index),e.title=t.slice(a.index+a[0].length)):e.artist=t}}const Qe=()=>{let e=null,t=null,a=null;const s=[],r=new Map;let i=0;return{indexMap:r,init:g,get crossfade(){return a},add:y,getPlayerIndex(){return i},setPlayerIndex(E){i=E},get current(){return s[i]},get next(){return s[i+1]},getNumTracks(){return s.length},getCurrentTrack(){return i+1},playerFromUid(E){return s[r.get(E)]},trackFromUid(E){return r.get(E)+1},isCurrent(E){return E===this.current.getUid()},uIdFromIframeId:c,stop:h,mute:S,getStatus:ee,prevTrack:Y,nextTrack:ke,jumpToTrack:Ae};function g(E,G){J.log("init()"),e=E,t=G,a=je(E,this)}function y(E){J.log(E),s.push(E),r.set(E.getUid(),s.length-1)}function c(E){return s.find(G=>G.iframeId===E).getUid()}function h(){this.current.stop(),a.stop()}function S(){this.current.mute(e.masterMute),a.mute(e.masterMute)}function ee(){return{currentTrack:this.getCurrentTrack(),numTracks:this.getNumTracks(),artist:this.current.getArtist(),title:this.current.getTitle(),thumbnailSrc:this.current.getThumbnailSrc()}}function Y(E){return i>0?(i--,t(E),!0):!1}function ke(E){return i++,i<this.getNumTracks()?(t(E),!0):!1}function Ae(E,G,Ie=!0){return E>0&&E<=this.getNumTracks()?(i=E-1,t(G,Ie),!0):!1}};function Ue(e,t){jn.log(`addSettingsObserver() for property: ${e}`),e in ze===!1&&(ze[e]=[]),ze[e].push(t)}const ce=I("playback-controls");let X={};const ne={progressControlsId:"progress-controls",playbackControlsId:"playback-controls",entryMetaControlsSelector:".entry-meta-controls .crossfade-control"},u={DISABLED:"state-disabled",ENABLED:"state-enabled",PLAY:"state-play",PAUSE:"state-pause"},n={progressSeek:{element:null,state:u.DISABLED,click:null},progressBar:{element:null,state:u.DISABLED},details:{element:null,state:u.DISABLED,artistElement:null,titleElement:null},thumbnail:{element:null,state:u.DISABLED,img:null},timer:{element:null,state:u.DISABLED,positionElement:null,durationElement:null,positionSeconds:-1,durationSeconds:-1},prevTrack:{element:null,state:u.DISABLED},playPause:{element:null,state:u.DISABLED,iconElement:null},nextTrack:{element:null,state:u.DISABLED},shuffle:{element:null,state:u.DISABLED},mute:{element:null,state:u.DISABLED,iconElement:null},trackCrossfade:{elements:null,click:null}};function Ze(e,t,a){ce.log("init()"),X=e;const s=document.getElementById(ne.progressControlsId);s!==null?(n.progressSeek.element=s.querySelector(".seek-control"),n.progressSeek.click=t,n.progressBar.element=s.querySelector(".bar-control")):ce.error(`playbackControls.init(): Unable to getElementById() for '#${ne.progressControlsId}'`);const r=document.getElementById(ne.playbackControlsId);r!==null?(n.details.element=r.querySelector(".details-control"),n.details.artistElement=n.details.element.querySelector(".details-artist"),n.details.titleElement=n.details.element.querySelector(".details-title"),n.thumbnail.element=r.querySelector(".thumbnail-control"),n.thumbnail.img=n.thumbnail.element.querySelector("img"),n.timer.element=r.querySelector(".timer-control"),n.timer.positionElement=n.timer.element.querySelector(".timer-position"),n.timer.durationElement=n.timer.element.querySelector(".timer-duration"),n.prevTrack.element=r.querySelector(".prev-control"),n.playPause.element=r.querySelector(".play-pause-control"),n.playPause.iconElement=n.playPause.element.querySelector("i"),n.nextTrack.element=r.querySelector(".next-control"),n.shuffle.element=r.querySelector(".shuffle-control"),n.mute.element=r.querySelector(".mute-control"),n.mute.iconElement=n.mute.element.querySelector("i")):ce.error(`playbackControls.init(): Unable to getElementById() for '#${ne.playbackControlsId}'`),n.trackCrossfade.elements=document.querySelectorAll(ne.entryMetaControlsSelector),n.trackCrossfade.elements.length!==0&&(n.trackCrossfade.click=a)}function tt(e,t,a,s,r){ce.log("ready()"),k(n.progressSeek,u.ENABLED),n.progressSeek.element.addEventListener("click",xt),k(n.progressBar,u.ENABLED),k(n.details,u.ENABLED),k(n.thumbnail,u.ENABLED),k(n.timer,u.ENABLED),X.trackThumbnailOnMobile&&n.thumbnail.element.classList.add("show-on-mobile"),X.trackTimesOnMobile&&n.timer.element.classList.add("show-on-mobile"),k(n.prevTrack,u.DISABLED),n.prevTrack.element.addEventListener("click",e),k(n.playPause,u.PLAY),n.playPause.element.addEventListener("click",t),k(n.nextTrack,r>1?u.ENABLED:u.DISABLED),n.nextTrack.element.addEventListener("click",a),k(n.shuffle,u.ENABLED),k(n.mute,u.ENABLED),n.mute.element.addEventListener("click",s),et(),n.trackCrossfade.elements.length>1&&n.trackCrossfade.elements.forEach(i=>i.addEventListener("click",Yt)),Ue("autoPlay",Bt),Ue("masterMute",et)}function k(e,t=u.DISABLED){$(e.element,e.state,t),e.state=t,t===u.PLAY?n.playPause.iconElement.textContent="play_circle_filled":t===u.PAUSE&&(n.playPause.iconElement.textContent="pause_circle_filled")}function nt(e,t){t===0?Oe(0):Oe(e/(t*1e3))}function ae(e){Oe(e/100)}function Oe(e){n.progressBar.element.style.transform=`scaleX(${e})`}function xt(e){if(n.timer.durationSeconds>0){const t=e.clientX/document.documentElement.clientWidth*100,a=Math.round(n.timer.durationSeconds*t/100);n.progressSeek.click(a),R()===!1&&(ae(t),de(a,n.timer.durationSeconds))}}function Ne(e){n.details.artistElement.textContent=e.artist||"",n.details.titleElement.textContent=e.title||"",Ft(e.thumbnailSrc),de(-1,-1)}function Ft(e){e!==n.thumbnail.img.src&&(n.thumbnail.element.classList.add("loading"),e!==null?n.thumbnail.img.src=e:n.thumbnail.img.src="/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png",n.thumbnail.img.decode().then(()=>{n.thumbnail.element.classList.remove("loading")}))}function de(e,t){e!==-1&&n.timer.positionSeconds!==e?(n.timer.positionSeconds=e,X.autoPlay===!1&&(e=t-e),ge(n.timer.positionElement,e)):e===-1&&n.timer.positionSeconds===-1&&(n.timer.positionElement.textContent="00:00"),t!==-1&&n.timer.durationSeconds!==t?(n.timer.durationSeconds=t,ge(n.timer.durationElement,t)):t===-1&&n.timer.durationSeconds===-1&&(n.timer.durationElement.textContent="00:00")}function ge(e,t){const a=new Date(t*1e3).toISOString();e.textContent=t>60*60?a.substr(11,8):a.substr(14,5)}function at(){n.timer.positionElement.textContent="00:00",n.timer.durationElement.textContent="00:00"}function R(){return n.playPause.state===u.PAUSE}function Re(e){at(),Ne(e),R()===!1&&e.currentTrack<=1&&k(n.prevTrack,u.DISABLED),e.currentTrack<e.numTracks&&k(n.nextTrack,u.ENABLED)}function we(e){k(n.playPause,u.PAUSE),k(n.prevTrack,u.ENABLED),Ne(e),st(!0,e.currentTrack)}function K(){k(n.playPause,u.PLAY),st(!1)}function fe(e){e?n.playPause.element.classList.toggle("time-remaining-warning"):n.playPause.element.classList.remove("time-remaining-warning")}function me(e){at(),Ne(e),k(n.prevTrack,u.ENABLED),e.currentTrack>=e.numTracks&&k(n.nextTrack,u.DISABLED)}function et(){n.mute.iconElement.textContent=X.masterMute?"volume_off":"volume_up"}function Yt(e){if(R()){const t=e.target.closest("article").querySelector("iframe");t!==null&&n.trackCrossfade.click(t.id)}}function st(e,t=-1){n.trackCrossfade.elements.forEach((a,s)=>{t===s+1?$(a,e?u.ENABLED:u.DISABLED,e?u.DISABLED:u.ENABLED):$(a,e?u.DISABLED:u.ENABLED,e?u.ENABLED:u.DISABLED)})}function Bt(){R()===!1&&n.timer.positionSeconds!==-1&&n.timer.durationSeconds!==-1&&(ge(n.timer.positionElement,X.autoPlay?n.timer.positionSeconds:n.timer.durationSeconds-n.timer.positionSeconds),ge(n.timer.durationElement,n.timer.durationSeconds))}const oe=I("playback-events");let W={};const _e={nowPlayingIconsSelector:"h2.entry-title"},ot={nowPlayingIcons:null},l={LOADING:"loading",READY:"ready",MEDIA_PLAYING:"mediaPlaying",MEDIA_PAUSED:"mediaPaused",MEDIA_ENDED:"mediaEnded",MEDIA_TIME_REMAINING:"mediaTimeRemaining",MEDIA_SHOW:"mediaShow",MEDIA_UNAVAILABLE:"mediaUnavailable",CONTINUE_AUTOPLAY:"continueAutoplay",RESUME_AUTOPLAY:"resumeAutoplay",AUTOPLAY_BLOCKED:"autoplayBlocked",PLAYBACK_BLOCKED:"playbackBlocked"},Me={[l.LOADING]:[Wt],[l.READY]:[Gt],[l.MEDIA_PLAYING]:[qt],[l.MEDIA_PAUSED]:[jt],[l.MEDIA_ENDED]:[rt],[l.MEDIA_TIME_REMAINING]:[Ht],[l.MEDIA_SHOW]:[Jt],[l.CONTINUE_AUTOPLAY]:[Xt],[l.RESUME_AUTOPLAY]:[Qt],[l.AUTOPLAY_BLOCKED]:[zt],[l.PLAYBACK_BLOCKED]:[Zt],[l.MEDIA_UNAVAILABLE]:[en]};function lt(e){oe.log("init()"),W=e,ot.nowPlayingIcons=document.querySelectorAll(_e.nowPlayingIconsSelector)}function pe(e,t){e in Me&&Me[e].push(t)}function L(e,t=null,a=null){Me[e].forEach(s=>{s({event:e,data:t,callback:a})})}function Wt(e){ae(e.data.loadingPercent)}function Gt(e){_(e),ae(0)}function qt(e){if(_(e),e.data.numTracks>1){const t=document.querySelector(`#${e.data.postId} ${_e.nowPlayingIconsSelector}`);it(t),$(t,"playing-paused","now-playing-icon"),W.user.animateNowPlayingIcon&&t.classList.add("playing-animate")}}function jt(e){_(e),e.data.numTracks>1&&document.querySelector(`#${e.data.postId} ${_e.nowPlayingIconsSelector}`).classList.add("playing-paused")}function rt(e){_(e),ae(0),e!==null&&e.data.numTracks>1&&it()}function Ht(){}function Jt(e){_(e),rt(null),e.data.scrollToMedia&&Ve.id(e.data.postId)}function Xt(e){_(e),Q(navigationVars.nextUrl,!0)}function Qt(e){_(e),oe.log(`RESUME_AUTOPLAY: ${W.priv.continueAutoPlay}`),W.priv.continueAutoPlay&&(W.priv.continueAutoPlay=!1,e.callback.resumeAutoPlay())}function zt(e){_(e),w("Autoplay was blocked, click or tap Play to continue...",10,"play",()=>{e.data.isPlaying===!1&&e.callback.togglePlayPause()})}function Zt(e){_(e),w("Unable to play track, skipping to next...",5),xe(e,5)}function en(e){_(e),tn(e.data.postId)?(w("YouTube Premium track, skipping...",5,"help",()=>{window.location.href="/channel/premium/"}),xe(e,5)):(w("Unable to play track, skipping to next...",5),Ke("EVENT_MEDIA_UNAVAILABLE",e.data),xe(e,5))}function _(e=null){oe.isDebug()&&e!==null&&oe.log(e)}function it(e){ot.nowPlayingIcons.forEach(t=>{t!==e&&t.classList.remove("now-playing-icon","playing-animate","playing-paused")})}function xe(e,t=5){setTimeout(()=>{e.data.currentTrack<e.data.numTracks?e.callback.skipToTrack(e.data.currentTrack+1,!0):navigationVars.nextUrl!==null&&Q(navigationVars.nextUrl,!0)},t*1e3+250)}function tn(e){const t=document.getElementById(e);return t!==null?t.classList.contains("category-premium"):!1}function Q(e,t=!1){oe.log(`navigateTo(): ${e} - continueAutoPlay: ${t}`),e!==null&&e.length>0&&(t&&(W.priv.continueAutoPlay=!0),window.location.href=e)}const Ve=(()=>{const e=se("--site-header-down"),t=se("--site-header-down-mobile"),a=se("--site-header-up"),s=se("--site-header-up-mobile");return{id:r};function r(y){if(W.user.autoScroll){const c=Math.round(window.scrollY+document.getElementById(y).getBoundingClientRect().top),h=Math.round(window.pageYOffset);let S=i(c>h);h+S+g()>c&&(S=i(!1)),window.scroll({top:c-(S+g()),left:0,behavior:W.user.smoothScrolling?"smooth":"auto"})}}function i(y){const c=Kt($t.SITE_MAX_WIDTH_MOBILE);return y?c?t:e:c?s:a}function g(){return se("--site-content-margin-top")-1}})(),P=I("embedded-players"),M=new qe(10);let re=null,p=null,O=null,x=null,D=null,Ye=0,ut=1;const q={youTubeIframeIdRegEx:/youtube-uid/i,soundCloudIframeIdRegEx:/soundcloud-uid/i,entriesSelector:"article",trackTitleData:"data-entry-track-title",maxPlaybackStartDelay:3};function ct(e,t,a,s){re=e,p=t,O=a,x=s,nn(),an()}function dt(e){let t=0;return document.querySelectorAll("iframe").forEach(a=>{(q.youTubeIframeIdRegEx.test(a.id)||q.soundCloudIframeIdRegEx.test(a.id))&&t++}),P.log(`countPlayers(): ${t}`),Ye=t+3,D=e,t}function Ee(){return{loadingPercent:100*(ut++/Ye)}}function gt(){ut>=Ye?D(l.READY):D(l.LOADING,Ee())}function fn(){const e=document.querySelectorAll(q.entriesSelector);e.forEach(t=>{const a=t.id,s=t.getAttribute(q.trackTitleData),r=t.querySelectorAll("iframe");r.forEach(i=>{const g=i.id;let y={};if(q.youTubeIframeIdRegEx.test(g)){const c=new YT.Player(g,{events:{onReady:sn,onStateChange:on,onError:rn}});y=new Je(a,g,c,i.src)}else if(q.soundCloudIframeIdRegEx.test(g)){const c=SC.Widget(g);y=new De(a,g,c,i.src),c.bind(SC.Widget.Events.READY,()=>{y.setThumbnail(),ln()}),c.bind(SC.Widget.Events.PLAY,un),c.bind(SC.Widget.Events.PAUSE,cn),c.bind(SC.Widget.Events.FINISH,dn),c.bind(SC.Widget.Events.ERROR,gn)}Xe(y,s),p.add(y)})})}function ye(e,t){P.log("onPlayerError()"),P.log(e);const a=e instanceof De?d.SOUNDCLOUD:d.YOUTUBE;p.isCurrent(e.getUid())===!1&&p.stop(),M.add(a,f.PLAYER_ERROR,e.getUid()),D(l.MEDIA_UNAVAILABLE,mn(e,t))}function mn(e,t){const a=e.getArtist()||"N/A",s=e.getTitle()||"N/A";return{currentTrack:p.trackFromUid(e.getUid()),numTracks:p.getNumTracks(),postId:e.getPostId(),mediaTitle:`${a} - ${s}`,mediaUrl:t}}function nn(){P.log("initYouTubeAPI()"),D(l.LOADING,Ee());const e=document.createElement("script");e.id="youtube-iframe-api",e.src="https://www.youtube.com/iframe_api";const t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}window.onYouTubeIframeAPIReady=function(){P.log("onYouTubeIframeAPIReady()"),D(l.LOADING,Ee()),fn()};function sn(){P.log("onYouTubePlayerReady()"),gt()}function on(e){M.add(d.YOUTUBE,e.data,e.target.f.id);switch(e.data){case YT.PlayerState.BUFFERING:if(P.log("onYouTubePlayerStateChange: BUFFERING"),p.crossfade.isFading()===!1){const t=p.playerFromUid(e.target.f.id);t.mute(re.masterMute),t.setVolume(re.masterVolume)}break;case YT.PlayerState.CUED:P.log("onYouTubePlayerStateChange: CUED");break;case YT.PlayerState.PLAYING:P.log("onYouTubePlayerStateChange: PLAYING"),O.syncAll(e.target.f.id,O.STATE.PLAY),p.current.setDuration(Math.round(e.target.getDuration())),x.start();break;case YT.PlayerState.PAUSED:P.log(`onYouTubePlayerStateChange: PAUSED (uID: ${e.target.f.id})`),p.isCurrent(e.target.f.id)?(O.syncAll(e.target.f.id,O.STATE.PAUSE),x.stop(!1)):p.crossfade.stop();break;case YT.PlayerState.ENDED:P.log(`onYouTubePlayerStateChange: ENDED (uID: ${e.target.f.id})`),p.isCurrent(e.target.f.id)?(x.stop(!0),D(l.MEDIA_ENDED)):p.crossfade.stop();break;default:P.log("onYouTubePlayerStateChange: UNSTARTED (-1)"),M.ytAutoPlayBlocked(e.target.f.id,3e3)&&D(l.AUTOPLAY_BLOCKED)}}function rn(e){P.log("onYouTubePlayerError: "+e.data);const t=p.playerFromUid(e.target.f.id);t.setPlayable(!1),ye(t,e.target.getVideoUrl())}function an(){P.log("initSoundCloudAPI()"),D(l.LOADING,Ee())}function ln(){P.log("onSoundCloudPlayerEventReady()"),gt()}function un(e){P.log(`onSoundCloudPlayerEvent: PLAY (uID: ${e.soundId})`),M.add(d.SOUNDCLOUD,f.STATE_PLAYING,e.soundId),p.crossfade.isFading()&&p.isCurrent(e.soundId)?M.scPlayDoubleTrigger(e.soundId,q.maxPlaybackStartDelay*1e3)&&O.syncAll(e.soundId,O.STATE.PLAY):(O.syncAll(e.soundId,O.STATE.PLAY),p.current.mute(re.masterMute),p.current.setVolume(re.masterVolume)),p.current.getEmbeddedPlayer().getDuration(t=>{p.current.setDuration(Math.round(t/1e3)),x.start()})}function cn(e){P.log(`onSoundCloudPlayerEvent: PAUSE (uID: ${e.soundId})`),M.add(d.SOUNDCLOUD,f.STATE_PAUSED,e.soundId),M.scAutoPlayBlocked(e.soundId,3e3)?(x.stop(!1),D(l.AUTOPLAY_BLOCKED)):M.scWidgetPlayBlocked(e.soundId,3e4)?(x.stop(!1),D(l.PLAYBACK_BLOCKED,{currentTrack:p.trackFromUid(e.soundId),numTracks:p.getNumTracks()})):p.isCurrent(e.soundId)?p.current.getPosition(t=>{t>0&&(O.syncAll(e.soundId,O.STATE.PAUSE),x.stop(!1))}):p.crossfade.stop()}function dn(e){P.log(`onSoundCloudPlayerEvent: FINISH (uID: ${e.soundId})`),p.isCurrent(e.soundId)?(x.stop(!0),D(l.MEDIA_ENDED)):p.crossfade.stop()}function gn(){this.getCurrentSound(e=>{const t=p.playerFromUid(e.id);P.log(`onSoundCloudPlayerEvent: ERROR for track: ${p.trackFromUid(e.id)}. ${t.getArtist()} - ${t.getTitle()} - [${t.getUid()} / ${t.getIframeId()}]`),t.setPlayable(!1)})}const V=I("playback");let le=null,b={},o={};const he={updateTimerInterval:200,minTrackCrossfadeTime:5,maxBufferingDelay:3};function pt(e){le=M,b=e.user,lt(e),Ze(b,pn,yn),o=Qe(),o.init(b,En),ct(b,o,ft,mt)}function Et(){return dt(hn)>0}function z(){R()?(K(),o.current.pause()):(we(o.getStatus()),o.current.play(ye))}function Be(e){V.log(`prevClick() - prevTrack: ${o.getCurrentTrack()-1} - numTracks: ${o.getNumTracks()} - event: ${e!==null?e.type:"null"}`),o.getCurrentTrack()>0&&o.current.getPosition(t=>{t>3e3?(o.current.seekTo(0),mt.updateCallback(0)):(o.getCurrentTrack()>1&&o.stop(),o.prevTrack(R())&&Re(o.getStatus()))})}function be(e){V.log(`nextClick() - nextTrack: ${o.getCurrentTrack()+1} - numTracks: ${o.getNumTracks()} - event: ${e!==null?e.type:"null"}`),o.getCurrentTrack()+1<=o.getNumTracks()?(o.stop(),e!==null||b.autoPlay?o.nextTrack(R())&&me(o.getStatus()):K()):e===null&&(K(),b.autoPlay?L(l.CONTINUE_AUTOPLAY):o.stop())}function pn(e){o.current.seekTo(e)}function Fe(){b.masterMute=!(b.masterMute===!0),o.mute()}function En(e,t=!0){L(l.MEDIA_SHOW,{scrollToMedia:t,postId:o.current.getPostId()}),e&&o.current.play(ye)}function yt(e,t=!0){V.log(`skipToTrack(): ${e} - ${t}`),t===!0&&R()===!1&&(le.clear(),le.add(d.ULTRAFUNK,f.RESUME_AUTOPLAY,null),o.jumpToTrack(e,t)&&me(o.getStatus()))}function bn(){V.log("resumeAutoPlay()"),le.add(d.ULTRAFUNK,f.RESUME_AUTOPLAY,null),z()}function U(){return{isPlaying:R(),currentTrack:o.getCurrentTrack(),numTracks:o.getNumTracks(),postId:o.current.getPostId(),iframeId:o.current.getIframeId()}}function hn(e,t=null){V.isDebug()&&e!==l.LOADING&&(V.log(`embeddedEventHandler(): ${e}`),t!==null&&V.log(t));switch(e){case l.LOADING:L(l.LOADING,t);break;case l.READY:tt(Be,z,be,Fe,o.getNumTracks()),L(l.READY),L(l.RESUME_AUTOPLAY,null,{resumeAutoPlay:bn});break;case l.MEDIA_ENDED:be(null);break;case l.AUTOPLAY_BLOCKED:K(),L(l.AUTOPLAY_BLOCKED,U(),{togglePlayPause:z});break;case l.PLAYBACK_BLOCKED:K(),L(l.PLAYBACK_BLOCKED,t,{skipToTrack:yt});break;case l.MEDIA_UNAVAILABLE:K(),L(l.MEDIA_UNAVAILABLE,t,{skipToTrack:yt});break}}const ft=(()=>{const e={PLAY:1,PAUSE:2},t=function s(r,i){if(V.log(`playbackState.syncAll() - previousTrack: ${o.getPlayerIndex()+1} - nextTrack: ${o.indexMap.get(r)+1} - syncState: ${V.getObjectKeyForValue(e,i)}`),o.isCurrent(r))i===e.PLAY?(o.crossfade.start(r),we(o.getStatus()),L(l.MEDIA_PLAYING,U())):i===e.PAUSE&&(o.crossfade.stop(),K(),L(l.MEDIA_PAUSED,U()));else{const g=o.getPlayerIndex(),y=o.indexMap.get(r);o.stop(),o.setPlayerIndex(y),a(g,y),s(r,i)}};function a(s,r){r>s?me(o.getStatus()):Re(o.getStatus())}return{STATE:e,syncAll:t,syncControls:a}})(),mt=(()=>{let e=-1,t=0;return{start:a,stop:s,updateCallback:i};function a(){s(!1),e=setInterval(r,he.updateTimerInterval)}function s(c=!1){e!==-1&&(clearInterval(e),e=-1),c&&(i(0),L(l.MEDIA_ENDED,U())),t=0,fe(!1)}function r(){o.current.getPosition(i)}function i(c,h=0){const S=Math.round(c/1e3);nt(c,h),de(S,h),S>0&&h>0&&(g(S,h),y(S,h))}function g(c,h){if(b.autoPlay===!1&&b.timeRemainingWarning&&t!==c){const S=h-c;t=c,S<=b.timeRemainingSeconds?(fe(!0),L(l.MEDIA_TIME_REMAINING,{timeRemainingSeconds:S})):fe(!1)}}function y(c,h){b.masterMute!==!0&&b.autoPlay&&b.autoCrossfade&&(h-c===b.autoCrossfadeLength+he.maxBufferingDelay&&(o.getCurrentTrack()+1<=o.getNumTracks()&&ht(F.AUTO,b.autoCrossfadeCurve)))}})();function yn(e){const t=o.uIdFromIframeId(e);o.isCurrent(t)===!1&&o.current.getDuration()>0&&(V.log(`trackCrossfadeClick():
fadeOut: ${o.current.getArtist()} - "${o.current.getTitle()}" (${o.current.getUid()})
fadeIn.: ${o.playerFromUid(t).getArtist()} - "${o.playerFromUid(t).getTitle()}" (${t})`),b.masterMute!==!0&&b.autoPlay===!1&&b.trackCrossfade&&o.current.getPosition(a=>{const s=o.current.getDuration()-a/1e3;s>=he.minTrackCrossfadeTime+he.maxBufferingDelay&&ht(F.TRACK,b.trackCrossfadeCurve,t)}))}function ht(e,t,a=null){le.add(d.ULTRAFUNK,f.CROSSFADE_START,null);const s=o.crossfade.init(e,t,a);s!==null&&ft.syncControls(s.fadeOutPlayer,s.fadeInPlayer)}const C=I("playback-interaction"),Z=new Ge(10);let m={},Te=!1,St=!1;const j={autoPlayToggleId:"footer-autoplay-toggle",crossfadeToggleId:"footer-crossfade-toggle",allowKeyboardShortcutsEvent:"allowKeyboardShortcuts",denyKeyboardShortcutsEvent:"denyKeyboardShortcuts",doubleClickDelay:500},T={playbackControls:{details:null,thumbnail:null,statePlaying:!1},fullscreenTarget:null,autoPlayToggle:null,crossfadeToggle:null};document.addEventListener("DOMContentLoaded",()=>{C.log("DOMContentLoaded"),kt(),Et()&&(In(),vn(),At(m.user.autoPlay),It(m.user.autoCrossfade))});document.addEventListener(j.allowKeyboardShortcutsEvent,()=>{m.user.keyboardShortcuts&&(Te=!0)});document.addEventListener(j.denyKeyboardShortcutsEvent,()=>{m.user.keyboardShortcuts&&(Te=!1)});function kt(){C.log("readSettings()"),m=kn(Pt.UF_PLAYBACK_SETTINGS,Tn,!0),Tt(m.user,Pn),Tt(m.priv,Sn),C.log(m)}function In(){C.log("initInteraction()"),Te=m.user.keyboardShortcuts,T.playbackControls.details=document.getElementById("playback-controls").querySelector(".details-control"),T.playbackControls.thumbnail=document.getElementById("playback-controls").querySelector(".thumbnail-control"),T.autoPlayToggle=document.getElementById(j.autoPlayToggleId),T.crossfadeToggle=document.getElementById(j.crossfadeToggleId),window.addEventListener("blur",Ln),window.addEventListener("storage",Cn),document.addEventListener("fullscreenchange",vt),document.addEventListener("webkitfullscreenchange",vt),bt("i.nav-bar-arrow-back","click",Pe,navigationVars.prevUrl),bt("i.nav-bar-arrow-fwd","click",Pe,navigationVars.nextUrl)}function vn(){pt(m),pe(l.READY,Dn),pe(l.MEDIA_ENDED,Un),pe(l.MEDIA_TIME_REMAINING,On)}document.addEventListener("keydown",e=>{if(St&&Te&&e.ctrlKey===!1&&e.altKey===!1){switch(e.code){case"Backquote":Lt(e);break}switch(e.key){case" ":e.preventDefault(),z();break;case"ArrowLeft":Rn(e);break;case"ArrowRight":wn(e);break;case"A":Ct(e);break;case"f":case"F":Nn(e);break;case"m":case"M":e.preventDefault(),Fe(),w(m.user.masterMute?"Volume is muted (<b>m</b> to unmute)":"Volume is unmuted (<b>m</b> to mute)",3);break;case"x":case"X":T.crossfadeToggle.classList.contains("disabled")===!1&&Dt(e);break}}});function Nn(e){e.preventDefault(),T.fullscreenTarget===null?Ut():ie()}function Rn(e){e.preventDefault(),ie(),e.shiftKey===!0?Pe(e,navigationVars.prevUrl):(Z.add(d.KEYBOARD,f.KEY_ARROW_LEFT,null),_n(navigationVars.prevUrl,U())||Be(e))}function _n(e,t){return e!==null&&(t.currentTrack===1&&t.isPlaying===!1&&(Se("showLeftArrowHint","<b>Tip:</b> Double click the Left Arrow key to go to the previous page"),Z.doubleClicked(d.KEYBOARD,f.KEY_ARROW_LEFT,j.doubleClickDelay)))?(Q(e,!1),!0):!1}function wn(e){e.preventDefault(),ie(),e.shiftKey===!0?Pe(e,navigationVars.nextUrl):(Z.add(d.KEYBOARD,f.KEY_ARROW_RIGHT,null),Mn(navigationVars.nextUrl,U())||be(e))}function Mn(e,t){return e!==null&&(t.currentTrack===t.numTracks&&(Se("showRightArrowHint","<b>Tip:</b> Double click the Right Arrow key to go to the next page"),Z.doubleClicked(d.KEYBOARD,f.KEY_ARROW_RIGHT,j.doubleClickDelay)))?(Q(e,t.isPlaying),!0):!1}function Se(e,t,a=0){m.priv[e]&&(w(t,a),m.priv[e]=!1)}const Ot=(()=>{let e=null;return{enable:a,stateVisible:s};function t(){return"wakeLock"in navigator&&"request"in navigator.wakeLock}async function a(){t()?document.visibilityState==="visible"&&(await r()!==!0&&C.log("screenWakeLock.enable(): Screen Wake Lock request failed")):(C.log("screenWakeLock.enable(): Screen Wake Lock is not supported"),w("Keep Screen On is not supported",5,"Turn Off",()=>m.user.keepMobileScreenOn=!1))}function s(){C.log("screenWakeLock.stateVisible()"),t()&&e===null&&r()}async function r(){try{return e=await navigator.wakeLock.request("screen"),C.log("screenWakeLock.request(): Screen Wake Lock is Enabled"),e.addEventListener("release",()=>{C.log("screenWakeLock.request(): Screen Wake Lock was Released"),e=null}),!0}catch(i){C.error(`screenWakeLock.request(): ${i.name} - ${i.message}`)}return!1}})();function Dn(){T.playbackControls.details.addEventListener("click",Nt),T.playbackControls.thumbnail.addEventListener("click",Nt),T.autoPlayToggle.addEventListener("click",Ct),T.crossfadeToggle.addEventListener("click",Dt),document.addEventListener("visibilitychange",Vn),m.user.keepMobileScreenOn&&Ot.enable(),St=!0}function Un(){m.user.autoExitFullscreen&&ie()}function On(e){m.user.autoExitFsOnWarning&&e.data.timeRemainingSeconds<=m.user.timeRemainingSeconds&&ie()}function Ln(){setTimeout(()=>{document.activeElement instanceof HTMLIFrameElement&&setTimeout(()=>{document.activeElement.blur(),document.activeElement instanceof HTMLIFrameElement&&document.activeElement.blur()},250)},0)}function Cn(e){if(m.storageChangeSync){const t=An(e,Pt.UF_PLAYBACK_SETTINGS);t!==null&&(C.log(`windowEventStorage(): ${e.key}`),kt())}}function vt(){T.fullscreenTarget=document.fullscreenElement!==null?document.fullscreenElement.id:null}function Vn(){document.visibilityState==="visible"?(m.user.autoResumePlayback&&T.playbackControls.statePlaying&&(U().isPlaying===!1&&z()),m.user.keepMobileScreenOn&&Ot.stateVisible()):document.visibilityState==="hidden"&&(m.user.autoResumePlayback&&U().isPlaying?T.playbackControls.statePlaying=!0:T.playbackControls.statePlaying=!1)}function Nt(e){Lt(e),Z.add(d.MOUSE,f.MOUSE_CLICK,null),e.target.tagName.toLowerCase()==="img"?Se("showTrackImageHint","<b>Tip:</b> Double click or double tap on the Track Thumbnail for full screen"):Se("showDetailsHint","<b>Tip:</b> Double click or double tap on Artist &amp; Title for full screen"),Z.doubleClicked(d.MOUSE,f.MOUSE_CLICK,j.doubleClickDelay)&&Ut()}function Pe(e,t){e!==null&&t!==null&&(e.preventDefault(),Q(t,U().isPlaying))}function Lt(e){e.preventDefault(),Ve.id(U().postId)}function Ut(){const e=document.getElementById(U().iframeId);e.requestFullscreen()}function ie(){T.fullscreenTarget!==null&&(document.exitFullscreen(),T.fullscreenTarget=null)}function Ct(e){e.preventDefault(),m.user.autoPlay=!(m.user.autoPlay===!0),w(m.user.autoPlay?"Autoplay enabled (<b>Shift</b> + <b>A</b> to disable)":"Autoplay disabled (<b>Shift</b> + <b>A</b> to enable)",5),At(m.user.autoPlay)}function At(e){C.log(`updateAutoPlayDOM() - autoPlay: ${e}`),T.autoPlayToggle.querySelector(".autoplay-on-off").textContent=e?"ON":"OFF",e?$(document.body,"autoplay-off","autoplay-on"):$(document.body,"autoplay-on","autoplay-off"),e?T.crossfadeToggle.classList.remove("disabled"):T.crossfadeToggle.classList.add("disabled")}function Dt(e){e.preventDefault(),m.user.autoCrossfade=!(m.user.autoCrossfade===!0),w(m.user.autoCrossfade?"Auto Crossfade enabled (<b>x</b> to disable)":"Auto Crossfade disabled (<b>x</b> to enable)",5),It(m.user.autoCrossfade)}function It(e){C.log(`updateCrossfadeDOM() - autoCrossfade: ${e}`),T.crossfadeToggle.querySelector(".crossfade-on-off").textContent=e?"ON":"OFF"}
//# sourceMappingURL=interaction.js.map
