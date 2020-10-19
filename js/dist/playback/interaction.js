import{a as gn,b as fn,c as Yt,d as Ue,e as $t,g as at,h as Kt,i as F,k as oe,l as Ft,m as j,n as _,o as Wt,p as Gt}from"../chunk.QI6SGURP.js";function Ne(e,t){const o=t.mediaUrl+" | "+t.mediaTitle;console.log(`DEBUGLOGGER....: logErrorOnServer(): ${e} - ${o}`),gtag("event",o,{event_category:e,event_label:"Ultrafunk Client Error"})}const Ee=_("eventlogger"),f={UNKNOWN:1e3,KEYBOARD:100,MOUSE:110,YOUTUBE:1,SOUNDCLOUD:2,ULTRAFUNK:50},p={UNKNOWN:-2e3,KEY_ARROW_LEFT:80,KEY_ARROW_RIGHT:81,MOUSE_CLICK:82,STATE_ERROR:-5,STATE_UNSTARTED:-1,STATE_ENDED:0,STATE_PLAYING:1,STATE_PAUSED:2,STATE_BUFFERING:3,STATE_CUED:5,RESUME_AUTOPLAY:50,PLAYER_ERROR:60,CROSSFADE_START:70},bt={eventSource:f.UNKNOWN,eventType:p.UNKNOWN,uId:null,timeStamp:0};class Re{constructor(e=10){this.log=[],this.maxEntries=e,this.lastPos=0,this.matchCount=0}add(e,t,o,s=Date.now()){const i=Object.create(bt);i.eventSource=e,i.eventType=t,i.uId=o,i.timeStamp=s,this.log.length<this.maxEntries?this.log.push(i):(this.log.shift(),this.log.push(i))}clear(){this.log=[]}initMatch(){this.lastPos=this.log.length-1,this.matchCount=0}matchesEvent(e,t,o,s=null){this.log[this.lastPos-e].eventSource===t&&this.log[this.lastPos-e].eventType===o&&this.log[this.lastPos-e].uId===s&&this.matchCount++}matchesDelta(e,t){this.log[this.lastPos].timeStamp-this.log[this.lastPos-e].timeStamp<=t&&this.matchCount++}isPatternMatch(e,t){return this.matchCount===e?(Ee.log(`MATCH for: ${t}`),Ee.logEventLog(this.log,f,p),!0):!1}}class we extends Re{constructor(e){super(e)}doubleClicked(e,t,o){return this.initMatch(),this.lastPos>=1&&(this.matchesEvent(1,e,t),this.matchesEvent(0,e,t),this.matchesDelta(1,o)),this.isPatternMatch(3,`${Ee.getObjectKeyForValue(f,e)} Double Clicked`)}}class _e extends Re{constructor(e){super(e)}ytAutoPlayBlocked(e,t){return this.initMatch(),this.lastPos>=3&&(this.matchesEvent(3,f.ULTRAFUNK,p.RESUME_AUTOPLAY,null),this.matchesEvent(2,f.YOUTUBE,p.STATE_UNSTARTED,e),this.matchesEvent(1,f.YOUTUBE,p.STATE_BUFFERING,e),this.matchesEvent(0,f.YOUTUBE,p.STATE_UNSTARTED,e),this.matchesDelta(3,t)),this.isPatternMatch(5,"YouTube AutoPlay Blocked")}scAutoPlayBlocked(e,t){return this.initMatch(),this.lastPos>=3&&(this.matchesEvent(3,f.ULTRAFUNK,p.RESUME_AUTOPLAY,null),this.matchesEvent(2,f.SOUNDCLOUD,p.STATE_PLAYING,e),this.matchesEvent(1,f.SOUNDCLOUD,p.STATE_PAUSED,e),this.matchesEvent(0,f.SOUNDCLOUD,p.STATE_PAUSED,e),this.matchesDelta(3,t)),this.isPatternMatch(5,"SoundCloud AutoPlay Blocked")}scWidgetPlayBlocked(e,t){return this.initMatch(),this.lastPos>=2&&(this.matchesEvent(2,f.SOUNDCLOUD,p.STATE_PLAYING,e),this.matchesEvent(1,f.SOUNDCLOUD,p.STATE_PAUSED,e),this.matchesEvent(0,f.SOUNDCLOUD,p.STATE_PAUSED,e),this.matchesDelta(2,t)),this.isPatternMatch(4,"SoundCloud WidgetPlay Blocked")}scPlayDoubleTrigger(e,t){return this.initMatch(),this.lastPos>=2&&(this.matchesEvent(2,f.ULTRAFUNK,p.CROSSFADE_START,null),this.matchesEvent(1,f.SOUNDCLOUD,p.STATE_PLAYING,e),this.matchesEvent(0,f.SOUNDCLOUD,p.STATE_PLAYING,e),this.matchesDelta(1,t)),this.isPatternMatch(4,"SoundCloud Play Double Trigger")}}const te=_("crossfade"),J={MIN:0,MAX:100},W={NONE:-1,AUTO:0,TRACK:1},le={NONE:-1,EQUAL_POWER:0,LINEAR:1},Me=(e,t,o)=>{let s=e,i=t,r=o,b=!1,S=-1,l=null,h=null,T=0,L=0,$=W.NONE,H=le.NONE,A=0;return{isFading(){return b},init:y,start:N,stop:Y,mute:d};function y(U,x=0,v=null){return b===!1&&g(v)===!0?(te.log(`init() - crossfadeType: ${te.getObjectKeyForValue(W,U)} - crossfadeCurve: ${te.getObjectKeyForValue(le,x)} - fadeInUid: ${v}`),b=!0,L=i.masterVolume,$=U,H=x,h.setVolume(0),v===null?r.nextTrack(!0):r.jumpToTrack(r.trackFromUid(v),!0,!1),{fadeOutPlayer:r.indexMap.get(l.getUid()),fadeInPlayer:r.indexMap.get(h.getUid())}):null}function N(U){b&&l.getPosition(x=>{A=(x+s.updateCrossfadeInterval)/1e3;const v=l.getDuration()-A,K=v-s.updateCrossfadeInterval/1e3;$===W.AUTO?T=K:$===W.TRACK&&(T=v>i.trackCrossfadeLength?i.trackCrossfadeLength:K),te.log(`start() - fadeStartTime: ${A.toFixed(2)} sec - timeRemaining: ${v.toFixed(2)} sec - fadeLength: ${T.toFixed(2)} sec - fadeInUid: ${U}`),S=setInterval(H===le.EQUAL_POWER?ee:yt,s.updateCrossfadeInterval)})}function Y(){te.log(`stop() - isFading: ${b}`),b&&(S!==-1&&(clearInterval(S),S=-1),l!==null&&(l.pause(),l.seekTo(0),setTimeout(()=>{l.setVolume(i.masterVolume),l=null},200)),h!==null&&setTimeout(()=>{h.setVolume(i.masterVolume),h=null},200),b=!1,T=0,L=0,$=W.NONE,H=le.NONE,A=0)}function d(U){l!==null&&l.mute(U)}function g(U){return l=r.current,h=U===null?r.next:r.playerFromUid(U),!!(l.getPlayable()&&h.getPlayable())}function ee(){l.getPosition(U=>{const x=U/1e3-A,v=x>=0?x:0,K=L-L*(v/T),ye=K>=J.MIN?K:J.MIN,Et=Math.round(Math.sqrt(L*ye)),Oe=Math.round(Math.sqrt(L*(L-ye)));v>=T&&ye<=J.MIN&&Oe>=L?Y():(l.setVolume(Et),h.setVolume(Oe))})}function yt(){l.getPosition(U=>{const x=U/1e3-A,v=Math.round(L*(x/T)),K=L-v;x>T&&K<J.MIN&&v>L?Y():(l.setVolume(K),h.setVolume(v))})}};const be=_("mediaplayers"),ht=/\s{1,}[–·-]\s{1,}/i;class xe{constructor(e,t,o){this.postId=e,this.iframeId=t,this.embeddedPlayer=o,this.playable=!0,this.duration=0,this.artist=null,this.title=null,this.thumbnailSrc=null,this.thumbnail=new Image,this.thumbnail.decoding="async"}getPostId(){return this.postId}getIframeId(){return this.iframeId}getUid(){return this.iframeId}getEmbeddedPlayer(){return this.embeddedPlayer}getPlayable(){return this.playable}setPlayable(e){this.playable=e}getDuration(){return this.duration}setDuration(e){this.duration=e}getArtist(){return this.artist}setArtist(e){this.artist=e}getTitle(){return this.title}setTitle(e){this.title=e}getThumbnailSrc(){return this.thumbnailSrc}seekTo(e){this.embeddedPlayer.seekTo(e)}setVolume(e){this.embeddedPlayer.setVolume(e)}}class Ve extends xe{constructor(e,t,o){super(e,t,o);this.previousPlayerState=-1}setThumbnail(e){this.thumbnailSrc=`https://img.youtube.com/vi/${e}/mqdefault.jpg`,this.thumbnail.src=this.thumbnailSrc}pause(){this.embeddedPlayer.pauseVideo()}stop(){this.embeddedPlayer.stopVideo()}isPlaybackError(e){return be.log(`YouTube.play() - current playerState: ${this.embeddedPlayer.getPlayerState()} - previous playerState: ${this.previousPlayerState} - playable: ${this.playable}`),this.embeddedPlayer.getPlayerState()===-1&&this.previousPlayerState===-1&&this.playable===!0?(be.warn(`MediaPlayer.YouTube.play() - Unable to play track: ${this.getArtist()} - "${this.getTitle()}" with videoId: ${this.embeddedPlayer.getVideoData().video_id} -- No YouTube API error given!`),this.playable=!1,e(this,this.embeddedPlayer.getVideoUrl()),!0):(this.previousPlayerState=this.embeddedPlayer.getPlayerState(),!1)}play(e){this.isPlaybackError(e)===!1&&(this.playable===!0?this.embeddedPlayer.playVideo():e(this,this.embeddedPlayer.getVideoUrl()))}getVolume(e){e(this.embeddedPlayer.getVolume())}mute(e){e?this.embeddedPlayer.mute():this.embeddedPlayer.unMute()}getPosition(e){e(this.embeddedPlayer.getCurrentTime()*1e3,this.duration)}}class he extends xe{constructor(e,t,o,s){super(e,t,o);this.soundId=s,this.volume=J.MAX,this.muted=!1}setThumbnail(){this.embeddedPlayer.getCurrentSound(e=>{const t=e.artwork_url!==null?e.artwork_url:e.user.avatar_url;t!=null&&(this.thumbnailSrc=t,this.thumbnail.src=t)})}getUid(){return this.soundId}pause(){this.embeddedPlayer.pause()}play(e){this.playable===!0?this.embeddedPlayer.getCurrentSound(t=>{t.playable===!0?this.embeddedPlayer.play():e(this,t.permalink_url)}):e(this,"https://soundcloud.com")}stop(){this.embeddedPlayer.pause(),super.seekTo(0)}seekTo(e){super.seekTo(e*1e3)}getVolume(e){this.embeddedPlayer.getVolume(t=>e(t))}setVolume(e){e!==0&&(this.volume=e),(this.muted===!1||e===0)&&super.setVolume(e)}mute(e){this.muted=!!e,e?this.setVolume(0):this.setVolume(this.volume)}getPosition(e){this.embeddedPlayer.getPosition(t=>e(t,this.duration))}}function Be(e,t){if(t!==null&&t.length>0){const o=t.match(ht);o!==null?(e.artist=t.slice(0,o.index),e.title=t.slice(o.index+o[0].length)):e.artist=t}}const Ye=()=>{let e=null,t=null,o=null;const s=[],i=new Map;let r=0;return{indexMap:i,init:b,get crossfade(){return o},add:S,getPlayerIndex(){return r},setPlayerIndex(y){r=y},get current(){return s[r]},get next(){return s[r+1]},getNumTracks(){return s.length},getCurrentTrack(){return r+1},playerFromUid(y){return s[i.get(y)]},trackFromUid(y){return i.get(y)+1},isCurrent(y){return y===this.current.getUid()},uIdFromIframeId:l,stop:h,mute:T,getStatus:L,prevTrack:$,nextTrack:H,jumpToTrack:A};function b(y,N,Y){e=N,t=Y,o=Me(y,N,this)}function S(y){be.log(y),s.push(y),i.set(y.getUid(),s.length-1)}function l(y){return s.find(N=>N.iframeId===y).getUid()}function h(){this.current.stop(),o.stop()}function T(){this.current.mute(e.masterMute),o.mute(e.masterMute)}function L(){return{currentTrack:this.getCurrentTrack(),numTracks:this.getNumTracks(),artist:this.current.getArtist(),title:this.current.getTitle(),thumbnailSrc:this.current.getThumbnailSrc()}}function $(y){return r>0?(r--,t(y),!0):!1}function H(y){return r++,r<this.getNumTracks()?(t(y),!0):!1}function A(y,N,Y=!0){return y>0&&y<=this.getNumTracks()?(r=y-1,t(N,Y),!0):!1}};function Te(e,t){gn.log(`addSettingsObserver() for property: ${e}`),fn.push({property:e,observer:t})}const Fe=_("playback-ctrls");let X={},Q={};const c={DISABLED:"state-disabled",ENABLED:"state-enabled",PLAY:"state-play",PAUSE:"state-pause"},n={progressSeek:{element:null,state:c.DISABLED,clickCallback:null},progressBar:{element:null,state:c.DISABLED},details:{element:null,state:c.DISABLED,artistElement:null,titleElement:null},thumbnail:{element:null,state:c.DISABLED,img:null},timer:{element:null,state:c.DISABLED,positionElement:null,durationElement:null,positionSeconds:-1,durationSeconds:-1},prevTrack:{element:null,state:c.DISABLED},playPause:{element:null,state:c.DISABLED,iconElement:null},nextTrack:{element:null,state:c.DISABLED},shuffle:{element:null,state:c.DISABLED},mute:{element:null,state:c.DISABLED,iconElement:null},trackCrossfade:{elements:null,clickCallback:null}};function $e(e,t,o,s){X=e,Q=t;const i=document.getElementById(X.progressControlsId);i!==null?(n.progressSeek.element=i.querySelector(".seek-control"),n.progressSeek.clickCallback=o,n.progressBar.element=i.querySelector(".bar-control")):Fe.error(`playbackControls.init(): Unable to getElementById() for '#${X.progressControlsId}'`);const r=document.getElementById(X.playbackControlsId);r!==null?(n.details.element=r.querySelector(".details-control"),n.details.artistElement=n.details.element.querySelector(".details-artist"),n.details.titleElement=n.details.element.querySelector(".details-title"),n.thumbnail.element=r.querySelector(".thumbnail-control"),n.thumbnail.img=n.thumbnail.element.querySelector("img"),n.timer.element=r.querySelector(".timer-control"),n.timer.positionElement=n.timer.element.querySelector(".timer-position"),n.timer.durationElement=n.timer.element.querySelector(".timer-duration"),n.prevTrack.element=r.querySelector(".prev-control"),n.playPause.element=r.querySelector(".play-pause-control"),n.playPause.iconElement=n.playPause.element.querySelector("i"),n.nextTrack.element=r.querySelector(".next-control"),n.shuffle.element=r.querySelector(".shuffle-control"),n.mute.element=r.querySelector(".mute-control"),n.mute.iconElement=n.mute.element.querySelector("i")):Fe.error(`playbackControls.init(): Unable to getElementById() for '#${X.playbackControlsId}'`),n.trackCrossfade.elements=document.querySelectorAll(X.entryMetaControlsSelector),n.trackCrossfade.elements.length!==0&&(n.trackCrossfade.clickCallback=s)}function We(e,t,o,s,i){C(n.progressSeek,c.ENABLED),n.progressSeek.element.addEventListener("click",Tt),C(n.progressBar,c.ENABLED),C(n.details,c.ENABLED),C(n.thumbnail,c.ENABLED),C(n.timer,c.ENABLED),Q.trackThumbnailOnMobile&&n.thumbnail.element.classList.add("show-on-mobile"),Q.trackTimesOnMobile&&n.timer.element.classList.add("show-on-mobile"),C(n.prevTrack,c.DISABLED),n.prevTrack.element.addEventListener("click",e),C(n.playPause,c.PLAY),n.playPause.element.addEventListener("click",t),C(n.nextTrack,i>1?c.ENABLED:c.DISABLED),n.nextTrack.element.addEventListener("click",o),C(n.shuffle,c.ENABLED),C(n.mute,c.ENABLED),n.mute.element.addEventListener("click",s),Ke(),n.trackCrossfade.elements.length>1&&n.trackCrossfade.elements.forEach(r=>r.addEventListener("click",St)),Te("autoPlay",kt),Te("masterMute",Ke)}function C(e,t=c.DISABLED){j(e.element,e.state,t),e.state=t,t===c.PLAY?n.playPause.iconElement.textContent="play_circle_filled":t===c.PAUSE&&(n.playPause.iconElement.textContent="pause_circle_filled")}function Ge(e,t){t===0?Se(0):Se(e/(t*1e3))}function ne(e){Se(e/100)}function Se(e){n.progressBar.element.style.transform=`scaleX(${e})`}function Tt(e){if(n.timer.durationSeconds>0){const t=e.clientX/document.documentElement.clientWidth*100,o=Math.round(n.timer.durationSeconds*t/100);n.progressSeek.clickCallback(o),V()===!1&&(ne(t),ie(o,n.timer.durationSeconds))}}function ke(e){n.details.artistElement.textContent=e.artist||"",n.details.titleElement.textContent=e.title||"",Pt(e.thumbnailSrc),ie(-1,-1)}function Pt(e){n.thumbnail.element.classList.add("loading"),e!==null?n.thumbnail.img.src=e:n.thumbnail.img.src="/wp-content/themes/ultrafunk/inc/img/photo_filled_grey.png",n.thumbnail.img.decode().then(()=>{n.thumbnail.element.classList.remove("loading")})}function ie(e,t){e!==-1&&n.timer.positionSeconds!==e?(n.timer.positionSeconds=e,Q.autoPlay===!1&&(e=t-e),ue(n.timer.positionElement,e)):e===-1&&n.timer.positionSeconds===-1&&(n.timer.positionElement.textContent="00:00"),t!==-1&&n.timer.durationSeconds!==t?(n.timer.durationSeconds=t,ue(n.timer.durationElement,t)):t===-1&&n.timer.durationSeconds===-1&&(n.timer.durationElement.textContent="00:00")}function ue(e,t){const o=new Date(t*1e3).toISOString();e.textContent=t>60*60?o.substr(11,8):o.substr(14,5)}function qe(){n.timer.positionElement.textContent="00:00",n.timer.durationElement.textContent="00:00"}function V(){return n.playPause.state===c.PAUSE}function Pe(e){qe(),ke(e),V()===!1&&e.currentTrack<=1&&C(n.prevTrack,c.DISABLED),e.currentTrack<e.numTracks&&C(n.nextTrack,c.ENABLED)}function Ae(e){C(n.playPause,c.PAUSE),C(n.prevTrack,c.ENABLED),ke(e),He(!0,e.currentTrack)}function G(){C(n.playPause,c.PLAY),He(!1)}function ce(e){e?n.playPause.element.classList.toggle("time-remaining-warning"):n.playPause.element.classList.remove("time-remaining-warning")}function de(e){qe(),ke(e),C(n.prevTrack,c.ENABLED),e.currentTrack>=e.numTracks&&C(n.nextTrack,c.DISABLED)}function Ke(){n.mute.iconElement.textContent=Q.masterMute?"volume_off":"volume_up"}function St(e){if(V()){const t=e.target.closest("article").querySelector("iframe");t!==null&&n.trackCrossfade.clickCallback(t.id)}}function He(e,t=-1){n.trackCrossfade.elements.forEach((o,s)=>{t===s+1?j(o,e?c.ENABLED:c.DISABLED,e?c.DISABLED:c.ENABLED):j(o,e?c.DISABLED:c.ENABLED,e?c.ENABLED:c.DISABLED)})}function kt(){V()===!1&&n.timer.positionSeconds>0&&(ue(n.timer.positionElement,Q.autoPlay?n.timer.positionSeconds:n.timer.durationSeconds-n.timer.positionSeconds),ue(n.timer.durationElement,n.timer.durationSeconds))}const E=_("playback"),R=new _e(10),Ie={};let k={},a={},Ce=0,je=1;const O={youTubeIframeIdRegEx:/youtube-uid/i,soundCloudIframeIdRegEx:/soundcloud-uid/i,entriesSelector:"article",trackTitleData:"data-entry-track-title",progressControlsId:"progress-controls",playbackControlsId:"playback-controls",entryMetaControlsSelector:".entry-meta-controls .crossfade-control",updateTimerInterval:200,updateCrossfadeInterval:50,minTrackCrossfadeTime:5,maxBufferingDelay:3},m={LOADING:10,READY:20,MEDIA_PLAYING:30,MEDIA_PAUSED:40,MEDIA_ENDED:50,MEDIA_TIME_REMAINING:60,MEDIA_SHOW:70,CONTINUE_AUTOPLAY:80,RESUME_AUTOPLAY:90,AUTOPLAY_BLOCKED:100,PLAYBACK_BLOCKED:110,MEDIA_UNAVAILABLE:120};function Je(e){k=e,$e(O,k,At,Ct),a=Ye(),a.init(O,k,It),Lt(),vt()}function Xe(e={}){Object.assign(Ie,e)}function D(e,t=null){e in Ie&&Ie[e](e,t)}function Qe(){let e=0;return document.querySelectorAll("iframe").forEach(t=>{(O.youTubeIframeIdRegEx.test(t.id)||O.soundCloudIframeIdRegEx.test(t.id))&&e++}),E.log(`hasEmbeddedPlayers() - playersCount: ${e}`),Ce=e+3,e>0}function Vt(){const e=document.querySelectorAll(O.entriesSelector);e.forEach(t=>{const o=t.id,s=t.getAttribute(O.trackTitleData),i=t.querySelectorAll("iframe");i.forEach(r=>{const b=r.id;let S={};if(O.youTubeIframeIdRegEx.test(b)){const l=new YT.Player(b,{events:{onReady:Dt,onStateChange:Ut,onError:Ot}});S=new Ve(o,b,l)}else if(O.soundCloudIframeIdRegEx.test(b)){const l=SC.Widget(b);S=new he(o,b,l,Rt(r.src)),l.bind(SC.Widget.Events.READY,()=>{S.setThumbnail(),Nt()}),l.bind(SC.Widget.Events.PLAY,wt),l.bind(SC.Widget.Events.PAUSE,_t),l.bind(SC.Widget.Events.FINISH,Mt),l.bind(SC.Widget.Events.ERROR,xt)}Be(S,s),a.add(S)})})}function ge(){return{loadingPercent:100*(je++/Ce)}}function ze(){je>=Ce?(We(Le,z,ae,ve,a.getNumTracks()),D(m.READY),D(m.RESUME_AUTOPLAY)):D(m.LOADING,ge())}function z(){V()?(G(),a.current.pause()):(Ae(a.getStatus()),a.current.play(De))}function Le(e){E.log(`prevClick() - prevTrack: ${a.getCurrentTrack()-1} - numTracks: ${a.getNumTracks()} - event: ${e!==null?e.type:"null"}`),a.getCurrentTrack()>0&&a.current.getPosition(t=>{t>3e3?(a.current.seekTo(0),q.updateCallback(0)):(a.getCurrentTrack()>1&&a.stop(),a.prevTrack(V())&&Pe(a.getStatus()))})}function ae(e){E.log(`nextClick() - nextTrack: ${a.getCurrentTrack()+1} - numTracks: ${a.getNumTracks()} - event: ${e!==null?e.type:"null"}`),a.getCurrentTrack()+1<=a.getNumTracks()?(a.stop(),e!==null||k.autoPlay?a.nextTrack(V())&&de(a.getStatus()):G()):e===null&&(G(),k.autoPlay?D(m.CONTINUE_AUTOPLAY):a.stop())}function At(e){a.current.seekTo(e)}function ve(){k.masterMute=!(k.masterMute===!0),a.mute()}function It(e,t=!0){D(m.MEDIA_SHOW,{scrollToMedia:t,postId:a.current.getPostId()}),e&&a.current.play(De)}function Ze(e,t=!0){E.log(`skipToTrack(): ${e} - ${t}`),t===!0&&V()===!1&&(R.clear(),R.add(f.ULTRAFUNK,p.RESUME_AUTOPLAY,null),a.jumpToTrack(e,t)&&de(a.getStatus()))}function et(){E.log("resumeAutoPlay()"),R.add(f.ULTRAFUNK,p.RESUME_AUTOPLAY,null),z()}function w(){return{isPlaying:V(),currentTrack:a.getCurrentTrack(),numTracks:a.getNumTracks(),postId:a.current.getPostId(),iframeId:a.current.getIframeId()}}function Ct(e){const t=a.uIdFromIframeId(e);a.isCurrent(t)===!1&&a.current.getDuration()>0&&(E.log(`trackCrossfadeClick():
fadeOut: ${a.current.getArtist()} - "${a.current.getTitle()}" (${a.current.getUid()})
fadeIn.: ${a.playerFromUid(t).getArtist()} - "${a.playerFromUid(t).getTitle()}" (${t})`),k.masterMute!==!0&&k.autoPlay===!1&&k.trackCrossfade&&a.current.getPosition(o=>{const s=a.current.getDuration()-o/1e3;s>=O.minTrackCrossfadeTime+O.maxBufferingDelay&&tt(W.TRACK,k.trackCrossfadeCurve,t)}))}function tt(e,t,o=null){R.add(f.ULTRAFUNK,p.CROSSFADE_START,null);const s=a.crossfade.init(e,t,o);s!==null&&M.syncControls(s.fadeOutPlayer,s.fadeInPlayer)}const M=(()=>{const e={PLAY:1,PAUSE:2};let t=function s(i,r){if(E.log(`playersState.syncAll() - previousTrack: ${a.getPlayerIndex()+1} - nextTrack: ${a.indexMap.get(i)+1} - syncState: ${E.getObjectKeyForValue(e,r)}`),a.isCurrent(i))r===e.PLAY?(a.crossfade.start(i),Ae(a.getStatus()),D(m.MEDIA_PLAYING,{postId:a.current.getPostId()})):r===e.PAUSE&&(a.crossfade.stop(),G(),D(m.MEDIA_PAUSED,{postId:a.current.getPostId()}));else{const b=a.getPlayerIndex(),S=a.indexMap.get(i);a.stop(),a.setPlayerIndex(S),o(b,S),s(i,r)}};function o(s,i){i>s?de(a.getStatus()):Pe(a.getStatus())}return{STATE:e,syncAll:t,syncControls:o}})(),q=(()=>{let e=-1,t=0;return{start:o,stop:s,updateCallback:r};function o(){s(!1),e=setInterval(i,O.updateTimerInterval)}function s(l=!1){e!==-1&&(clearInterval(e),e=-1),l&&(r(0),D(m.MEDIA_ENDED)),t=0,ce(!1)}function i(){a.current.getPosition(r)}function r(l,h=0){const T=Math.round(l/1e3);Ge(l,h),ie(T,h),T>0&&h>0&&(b(T,h),S(T,h))}function b(l,h){if(k.autoPlay===!1&&k.timeRemainingWarning&&t!==l){const T=h-l;t=l,T<=k.timeRemainingSeconds?(ce(!0),D(m.MEDIA_TIME_REMAINING,{timeRemainingSeconds:T})):ce(!1)}}function S(l,h){k.masterMute!==!0&&k.autoPlay&&k.autoCrossfade&&(h-l===k.autoCrossfadeLength+O.maxBufferingDelay&&(a.getCurrentTrack()+1<=a.getNumTracks()&&tt(W.AUTO,k.autoCrossfadeCurve)))}})();function De(e,t){E.log("onEmbeddedPlayerError()"),E.log(e);const o=e instanceof he?f.SOUNDCLOUD:f.YOUTUBE;a.isCurrent(e.getUid())===!1&&a.stop(),R.add(o,p.PLAYER_ERROR,e.getUid()),G(),D(m.MEDIA_UNAVAILABLE,Bt(e,t))}function Bt(e,t){const o=e.getArtist()||"N/A",s=e.getTitle()||"N/A";return{currentTrack:a.trackFromUid(e.getUid()),numTracks:a.getNumTracks(),postId:e.getPostId(),mediaTitle:`${o} - ${s}`,mediaUrl:t}}function Lt(){E.log("initYouTubeAPI()"),D(m.LOADING,ge());let e=document.createElement("script");e.id="youtube-iframe-api",e.src="https://www.youtube.com/iframe_api";let t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}window.onYouTubeIframeAPIReady=function(){E.log("onYouTubeIframeAPIReady()"),D(m.LOADING,ge()),Vt()};function Dt(e){E.log("onYouTubePlayerReady()"),ze(),a.playerFromUid(e.target.f.id).setThumbnail(e.target.getVideoData().video_id)}function Ut(e){R.add(f.YOUTUBE,e.data,e.target.f.id);switch(e.data){case YT.PlayerState.BUFFERING:if(E.log("onYouTubePlayerStateChange: BUFFERING"),a.crossfade.isFading()===!1){const t=a.playerFromUid(e.target.f.id);t.mute(k.masterMute),t.setVolume(k.masterVolume)}break;case YT.PlayerState.CUED:E.log("onYouTubePlayerStateChange: CUED");break;case YT.PlayerState.PLAYING:E.log("onYouTubePlayerStateChange: PLAYING"),M.syncAll(e.target.f.id,M.STATE.PLAY),a.current.setDuration(Math.round(e.target.getDuration())),q.start();break;case YT.PlayerState.PAUSED:E.log(`onYouTubePlayerStateChange: PAUSED (uID: ${e.target.f.id})`),a.isCurrent(e.target.f.id)?(M.syncAll(e.target.f.id,M.STATE.PAUSE),q.stop(!1)):a.crossfade.stop();break;case YT.PlayerState.ENDED:E.log(`onYouTubePlayerStateChange: ENDED (uID: ${e.target.f.id})`),a.isCurrent(e.target.f.id)?(q.stop(!0),ae(null)):a.crossfade.stop();break;default:E.log("onYouTubePlayerStateChange: UNSTARTED (-1)"),R.ytAutoPlayBlocked(e.target.f.id,3e3)&&(G(),D(m.AUTOPLAY_BLOCKED))}}function Ot(e){E.log("onYouTubePlayerError: "+e.data);const t=a.playerFromUid(e.target.f.id);t.setPlayable(!1),De(t,e.target.getVideoUrl())}function vt(){E.log("initSoundCloudAPI()"),D(m.LOADING,ge())}function Nt(){E.log("onSoundCloudPlayerEventReady()"),ze()}function Rt(e){if(e!==void 0){const t=new URL(decodeURIComponent(e)),o=t.searchParams.get("url");if(o!==null){const s=o.split("/"),i="tracks".toUpperCase();for(let r=0;r<s.length;r++)if(s[r].toUpperCase()===i)return parseInt(s[r+1])}}return null}function wt(e){E.log(`onSoundCloudPlayerEvent: PLAY (uID: ${e.soundId})`),R.add(f.SOUNDCLOUD,p.STATE_PLAYING,e.soundId),a.crossfade.isFading()&&a.isCurrent(e.soundId)?R.scPlayDoubleTrigger(e.soundId,O.maxBufferingDelay*1e3)&&M.syncAll(e.soundId,M.STATE.PLAY):(M.syncAll(e.soundId,M.STATE.PLAY),a.current.mute(k.masterMute),a.current.setVolume(k.masterVolume)),a.current.getEmbeddedPlayer().getDuration(t=>{a.current.setDuration(Math.round(t/1e3)),q.start()})}function nt(e,t=null){E.log(`soundCloudPlaybackBlocked(): ${E.getObjectKeyForValue(m,e)}`),G(),q.stop(!1),D(e,t)}function _t(e){E.log(`onSoundCloudPlayerEvent: PAUSE (uID: ${e.soundId})`),R.add(f.SOUNDCLOUD,p.STATE_PAUSED,e.soundId),R.scAutoPlayBlocked(e.soundId,3e3)?nt(m.AUTOPLAY_BLOCKED):R.scWidgetPlayBlocked(e.soundId,3e4)?nt(m.PLAYBACK_BLOCKED,{currentTrack:a.trackFromUid(e.soundId),numTracks:a.getNumTracks()}):a.isCurrent(e.soundId)?a.current.getPosition(t=>{t>0&&(M.syncAll(e.soundId,M.STATE.PAUSE),q.stop(!1))}):a.crossfade.stop()}function Mt(e){E.log(`onSoundCloudPlayerEvent: FINISH (uID: ${e.soundId})`),a.isCurrent(e.soundId)?(q.stop(!0),ae(null)):a.crossfade.stop()}function xt(){this.getCurrentSound(e=>{const t=a.playerFromUid(e.id);E.log(`onSoundCloudPlayerEvent: ERROR for track: ${a.trackFromUid(e.id)}. ${t.getArtist()} - ${t.getTitle()} - [${t.getUid()} / ${t.getIframeId()}]`),t.setPlayable(!1)})}const I=_("interaction"),Z=new we(10);let u={},fe=!1;const B={nowPlayingIconsSelector:"h2.entry-title",autoPlayToggleId:"footer-autoplay-toggle",crossfadeToggleId:"footer-crossfade-toggle",allowKeyboardShortcutsEvent:"allowKeyboardShortcuts",denyKeyboardShortcutsEvent:"denyKeyboardShortcuts",doubleClickDelay:500},P={playbackControls:{details:null,thumbnail:null,statePlaying:!1},fullscreenTarget:null,nowPlayingIcons:null,autoPlayToggle:null,crossfadeToggle:null};document.addEventListener("DOMContentLoaded",()=>{I.log("DOMContentLoaded"),ot(),Qe()&&(qt(),rt.setHandlers(),Je(u.user),st(u.user.autoPlay),lt(u.user.autoCrossfade))});document.addEventListener(B.allowKeyboardShortcutsEvent,()=>{u.user.keyboardShortcuts&&(fe=!0)});document.addEventListener(B.denyKeyboardShortcutsEvent,()=>{u.user.keyboardShortcuts&&(fe=!1)});function ot(){I.log("readSettings()"),u=Wt(Ue.UF_PLAYBACK_SETTINGS,$t,!0),Kt(u.user,Ue.UF_PLAYBACK_SETTINGS),I.log(u)}function qt(){I.log("initInteraction()"),fe=u.user.keyboardShortcuts,P.playbackControls.details=document.getElementById("playback-controls").querySelector(".details-control"),P.playbackControls.thumbnail=document.getElementById("playback-controls").querySelector(".thumbnail-control"),P.nowPlayingIcons=document.querySelectorAll(B.nowPlayingIconsSelector),P.autoPlayToggle=document.getElementById(B.autoPlayToggleId),P.crossfadeToggle=document.getElementById(B.crossfadeToggleId),window.addEventListener("blur",Ht),window.addEventListener("focus",jt),window.addEventListener("storage",Jt),document.addEventListener("fullscreenchange",it),document.addEventListener("webkitfullscreenchange",it),at("i.nav-bar-arrow-back","click",me,navigationVars.prevUrl),at("i.nav-bar-arrow-fwd","click",me,navigationVars.nextUrl)}document.addEventListener("keydown",e=>{if(rt.isPlaybackReady()&&fe&&e.ctrlKey===!1&&e.altKey===!1){switch(e.code){case"Backquote":ut(e);break}switch(e.key){case" ":e.preventDefault(),z();break;case"ArrowLeft":Qt(e);break;case"ArrowRight":zt(e);break;case"A":ct(e);break;case"f":case"F":Xt(e);break;case"m":case"M":e.preventDefault(),ve(),F(u.user.masterMute?"Volume is muted (<b>m</b> to unmute)":"Volume is unmuted (<b>m</b> to mute)",3);break;case"x":case"X":P.crossfadeToggle.classList.contains("disabled")===!1&&dt(e);break}}});function Xt(e){e.preventDefault(),P.fullscreenTarget===null?gt():re()}function Qt(e){e.preventDefault(),re(),e.shiftKey===!0?me(e,navigationVars.prevUrl):(Z.add(f.KEYBOARD,p.KEY_ARROW_LEFT,null),Zt(navigationVars.prevUrl,w())||Le(e))}function Zt(e,t){return e!==null&&(t.currentTrack===1&&t.isPlaying===!1&&(pe("showLeftArrowHint","<b>Tip:</b> Double click the Left Arrow key to go to the previous page"),Z.doubleClicked(f.KEYBOARD,p.KEY_ARROW_LEFT,B.doubleClickDelay)))?(se(e,!1),!0):!1}function zt(e){e.preventDefault(),re(),e.shiftKey===!0?me(e,navigationVars.nextUrl):(Z.add(f.KEYBOARD,p.KEY_ARROW_RIGHT,null),en(navigationVars.nextUrl,w())||ae(e))}function en(e,t){return e!==null&&(t.currentTrack===t.numTracks&&(pe("showRightArrowHint","<b>Tip:</b> Double click the Right Arrow key to go to the next page"),Z.doubleClicked(f.KEYBOARD,p.KEY_ARROW_RIGHT,B.doubleClickDelay)))?(se(e,t.isPlaying),!0):!1}function pe(e,t,o=0){u.priv[e]&&(F(t,o),u.priv[e]=!1)}function se(e,t=!1){I.log(`navigateTo(): ${e} - continueAutoPlay: ${t}`),e!==null&&e.length>0&&(t&&(u.priv.continueAutoPlay=!0),window.location.href=e)}const rt=(()=>{let e=!1;return{isPlaybackReady(){return e},setHandlers:t};function t(){Xe({[m.LOADING]:o,[m.READY]:s,[m.MEDIA_PLAYING]:i,[m.MEDIA_PAUSED]:r,[m.MEDIA_ENDED]:b,[m.MEDIA_TIME_REMAINING]:S,[m.MEDIA_SHOW]:l,[m.CONTINUE_AUTOPLAY]:h,[m.RESUME_AUTOPLAY]:T,[m.AUTOPLAY_BLOCKED]:L,[m.PLAYBACK_BLOCKED]:$,[m.MEDIA_UNAVAILABLE]:H})}function o(d,g){ne(g.loadingPercent)}function s(d){A(d),ne(0),P.playbackControls.details.addEventListener("click",mt),P.playbackControls.thumbnail.addEventListener("click",mt),P.autoPlayToggle.addEventListener("click",ct),P.crossfadeToggle.addEventListener("click",dt),document.addEventListener("visibilitychange",tn),u.user.keepMobileScreenOn&&ft.enable(),e=!0}function i(d,g){if(A(d,g),w().numTracks>1){const ee=document.querySelector(`#${g.postId} ${B.nowPlayingIconsSelector}`);y(ee),j(ee,"playing-paused","now-playing-icon"),u.user.animateNowPlayingIcon&&ee.classList.add("playing-animate")}}function r(d,g){A(d,g),w().numTracks>1&&document.querySelector(`#${g.postId} ${B.nowPlayingIconsSelector}`).classList.add("playing-paused")}function b(d){A(d),u.user.autoExitFullscreen&&re(),ne(0),w().numTracks>1&&y()}function S(d,g){u.user.autoExitFsOnWarning&&g.timeRemainingSeconds<=u.user.timeRemainingSeconds&&re()}function l(d,g){A(d,g),b(),g.scrollToMedia&&pt.id(g.postId)}function h(d){A(d),se(navigationVars.nextUrl,!0)}function T(d){A(d),I.log(`playbackEvents.RESUME_AUTOPLAY: ${u.priv.continueAutoPlay}`),u.priv.continueAutoPlay&&(u.priv.continueAutoPlay=!1,et())}function L(d){A(d),F("Autoplay was blocked, click or tap Play to continue...",30,"play",()=>{w().isPlaying===!1&&z()})}function $(d,g){A(d,g),F("Unable to play track, skipping to next...",5),N(g,5)}function H(d,g){A(d,g),Y(g.postId)?(F("YouTube Premium track, skipping...",5,"help",()=>{window.location.href="/channel/premium/"}),N(g,5)):(F("Unable to play track, skipping to next...",5),Ne("EVENT_MEDIA_UNAVAILABLE",g),N(g,5))}function A(d=null,g=null){I.isDebug()&&d!==null&&(I.log(`playbackEvents.${I.getObjectKeyForValue(m,d)} (${d})`),g!==null&&I.log(g))}function y(d){P.nowPlayingIcons.forEach(g=>{g!==d&&g.classList.remove("now-playing-icon","playing-animate","playing-paused")})}function N(d,g=5){setTimeout(()=>{d.currentTrack<d.numTracks?Ze(d.currentTrack+1,!0):navigationVars.nextUrl!==null&&se(navigationVars.nextUrl,!0)},g*1e3+250)}function Y(d){const g=document.getElementById(d);return g!==null?g.classList.contains("category-premium"):!1}})(),ft=(()=>{let e=null;return{enable:o,stateVisible:s};function t(){return"wakeLock"in navigator&&"request"in navigator.wakeLock}async function o(){t()?document.visibilityState==="visible"&&(await i()!==!0&&I.log("screenWakeLock.enable(): Screen Wake Lock request failed")):(I.log("screenWakeLock.enable(): Screen Wake Lock is not supported"),F("Keep Screen On is not supported",5,"Turn Off",()=>u.user.keepMobileScreenOn=!1))}function s(){I.log("screenWakeLock.stateVisible()"),t()&&e===null&&i()}async function i(){try{return e=await navigator.wakeLock.request("screen"),I.log("screenWakeLock.request(): Screen Wake Lock is Enabled"),e.addEventListener("release",()=>{I.log("screenWakeLock.request(): Screen Wake Lock was Released"),e=null}),!0}catch(r){I.error(`screenWakeLock.request(): ${r.name} - ${r.message}`)}return!1}})();function Ht(){setTimeout(()=>{document.activeElement instanceof HTMLIFrameElement?setTimeout(()=>{document.activeElement.blur(),document.activeElement instanceof HTMLIFrameElement&&document.activeElement.blur()},250):u.user.autoPlay===!1&&u.user.blurFocusBgChange&&document.body.classList.add("blurred")},0)}function jt(){u.user.autoPlay===!1&&u.user.blurFocusBgChange&&document.body.classList.remove("blurred")}function Jt(e){if(u.storageChangeSync){const t=Gt(e,Ue.UF_PLAYBACK_SETTINGS);t!==null&&(I.log(`windowEventStorage(): ${e.key}`),ot())}}function it(){P.fullscreenTarget=document.fullscreenElement!==null?document.fullscreenElement.id:null}function tn(){document.visibilityState==="visible"?(u.user.autoResumePlayback&&P.playbackControls.statePlaying&&(w().isPlaying===!1&&z()),u.user.keepMobileScreenOn&&ft.stateVisible()):document.visibilityState==="hidden"&&(u.user.autoResumePlayback&&w().isPlaying?P.playbackControls.statePlaying=!0:P.playbackControls.statePlaying=!1)}function mt(e){ut(e),Z.add(f.MOUSE,p.MOUSE_CLICK,null),e.target.tagName.toLowerCase()==="img"?pe("showTrackImageHint","<b>Tip:</b> Double click or double tap on the Track Thumbnail for full screen"):pe("showDetailsHint","<b>Tip:</b> Double click or double tap on Artist &amp; Title for full screen"),Z.doubleClicked(f.MOUSE,p.MOUSE_CLICK,B.doubleClickDelay)&&gt()}function me(e,t){e!==null&&t!==null&&(e.preventDefault(),se(t,w().isPlaying))}function ut(e){e.preventDefault(),pt.id(w().postId)}function gt(){const e=document.getElementById(w().iframeId);e.requestFullscreen()}function re(){P.fullscreenTarget!==null&&(document.exitFullscreen(),P.fullscreenTarget=null)}function ct(e){e.preventDefault(),u.user.autoPlay=!(u.user.autoPlay===!0),F(u.user.autoPlay?"Autoplay enabled (<b>Shift</b> + <b>A</b> to disable)":"Autoplay disabled (<b>Shift</b> + <b>A</b> to enable)",5),st(u.user.autoPlay)}function st(e){I.log(`updateAutoPlayDOM() - autoPlay: ${e}`),P.autoPlayToggle.querySelector(".autoplay-on-off").textContent=e?"ON":"OFF",e?j(document.body,"autoplay-off","autoplay-on"):j(document.body,"autoplay-on","autoplay-off"),e?P.crossfadeToggle.classList.remove("disabled"):P.crossfadeToggle.classList.add("disabled"),e?document.body.classList.remove("blurred"):document.hasFocus()===!1&&u.user.blurFocusBgChange&&document.body.classList.add("blurred")}function dt(e){e.preventDefault(),u.user.autoCrossfade=!(u.user.autoCrossfade===!0),F(u.user.autoCrossfade?"Auto Crossfade enabled (<b>x</b> to disable)":"Auto Crossfade disabled (<b>x</b> to enable)",5),lt(u.user.autoCrossfade)}function lt(e){I.log(`updateCrossfadeDOM() - autoCrossfade: ${e}`),P.crossfadeToggle.querySelector(".crossfade-on-off").textContent=e?"ON":"OFF"}const pt=(()=>{const e=oe("--site-header-down"),t=oe("--site-header-down-mobile"),o=oe("--site-header-up"),s=oe("--site-header-up-mobile");return{id:i};function i(S){if(u.user.autoScroll){const l=Math.round(window.scrollY+document.getElementById(S).getBoundingClientRect().top),h=Math.round(window.pageYOffset);let T=r(l>h);h+T+b()>l&&(T=r(!1)),window.scroll({top:l-(T+b()),left:0,behavior:u.user.smoothScrolling?"smooth":"auto"})}}function r(S){const l=Ft(Yt.SITE_MAX_WIDTH_MOBILE);return S?l===!0?t:e:l===!0?s:o}function b(){return oe("--site-content-margin-top")-1}})();
//# sourceMappingURL=interaction.js.map
