import{A as Ra,B as ze,C as sa,E as Da,b as ft,c as Wa,d as x,f as qe,h as R,k as P,m as z,n as xe,p as ra,q as k,r as A,s as $,u as Gt,v as me,w as ot,y as Ha,z as Ya}from"../chunk-MK2I6LY7.js";var Ye=k("eventlogger"),u={UNKNOWN:1e3,KEYBOARD:100,MOUSE:110,YOUTUBE:1,SOUNDCLOUD:2,ULTRAFUNK:50},d={UNKNOWN:-2e3,KEY_ARROW_LEFT:80,KEY_ARROW_RIGHT:81,MOUSE_CLICK:82,STATE_ERROR:-5,STATE_UNSTARTED:-1,STATE_ENDED:0,STATE_PLAYING:1,STATE_PAUSED:2,STATE_BUFFERING:3,STATE_CUED:5,RESUME_AUTOPLAY:50,PLAYER_ERROR:60,CROSSFADE_START:70},Ft={eventSource:u.UNKNOWN,eventType:d.UNKNOWN,uId:null,timeStamp:0},Re=class{constructor(t=10){this.log=[],this.maxEntries=t,this.lastPos=0,this.matchCount=0}add(t,n,r,c=Date.now()){let E=Object.create(Ft);E.eventSource=t,E.eventType=n,E.uId=r,E.timeStamp=c,this.log.length<this.maxEntries?this.log.push(E):(this.log.shift(),this.log.push(E))}clear(){this.log=[]}initMatch(){this.lastPos=this.log.length-1,this.matchCount=0}matchesEvent(t,n,r,c=null){this.log[this.lastPos-t].eventSource===n&&this.log[this.lastPos-t].eventType===r&&this.log[this.lastPos-t].uId===c&&this.matchCount++}matchesDelta(t,n){this.log[this.lastPos].timeStamp-this.log[this.lastPos-t].timeStamp<=n&&this.matchCount++}isPatternMatch(t,n){return this.matchCount===t?(Ye.log(`MATCH for: ${n}`),Ye.logEventLog(this.log,u,d),!0):!1}},we=class extends Re{constructor(t){super(t)}doubleClicked(t,n,r){return this.initMatch(),this.lastPos>=1&&(this.matchesEvent(1,t,n),this.matchesEvent(0,t,n),this.matchesDelta(1,r)),this.isPatternMatch(3,`${Ye.getObjectKeyForValue(u,t)} Double Clicked`)}},re=class extends Re{constructor(t){super(t)}ytAutoplayBlocked(t,n){return this.initMatch(),this.lastPos>=3&&(this.matchesEvent(3,u.ULTRAFUNK,d.RESUME_AUTOPLAY,null),this.matchesEvent(2,u.YOUTUBE,d.STATE_UNSTARTED,t),this.matchesEvent(1,u.YOUTUBE,d.STATE_BUFFERING,t),this.matchesEvent(0,u.YOUTUBE,d.STATE_UNSTARTED,t),this.matchesDelta(3,n)),this.isPatternMatch(5,"YouTube Autoplay Blocked")}scAutoplayBlocked(t,n){return this.initMatch(),this.lastPos>=3&&(this.matchesEvent(3,u.ULTRAFUNK,d.RESUME_AUTOPLAY,null),this.matchesEvent(2,u.SOUNDCLOUD,d.STATE_PLAYING,t),this.matchesEvent(1,u.SOUNDCLOUD,d.STATE_PAUSED,t),this.matchesEvent(0,u.SOUNDCLOUD,d.STATE_PAUSED,t),this.matchesDelta(3,n)),this.isPatternMatch(5,"SoundCloud Autoplay Blocked")}scWidgetPlayBlocked(t,n){return this.initMatch(),this.lastPos>=2&&(this.matchesEvent(2,u.SOUNDCLOUD,d.STATE_PLAYING,t),this.matchesEvent(1,u.SOUNDCLOUD,d.STATE_PAUSED,t),this.matchesEvent(0,u.SOUNDCLOUD,d.STATE_PAUSED,t),this.matchesDelta(2,n)),this.isPatternMatch(4,"SoundCloud WidgetPlay Blocked")}scPlayDoubleTrigger(t,n){return this.initMatch(),this.lastPos>=2&&(this.matchesEvent(2,u.ULTRAFUNK,d.CROSSFADE_START,null),this.matchesEvent(1,u.SOUNDCLOUD,d.STATE_PLAYING,t),this.matchesEvent(0,u.SOUNDCLOUD,d.STATE_PLAYING,t),this.matchesDelta(1,n)),this.isPatternMatch(4,"SoundCloud Play Double Trigger")}};var ye=k("playback-controls"),W={},se={},pe={progressControlsId:"progress-controls",playbackControlsId:"playback-controls"},i={DISABLED:{CLASS:"state-disabled",ID:1},ENABLED:{CLASS:"state-enabled",ID:2},PLAYING:{CLASS:"state-playing",ID:3},PAUSED:{CLASS:"state-paused",ID:4}},a={progressSeek:{element:null,STATE:i.DISABLED,click:null},progressBar:{element:null,STATE:i.DISABLED},details:{element:null,STATE:i.DISABLED,artistElement:null,titleElement:null},thumbnail:{element:null,STATE:i.DISABLED,img:null},timer:{element:null,STATE:i.DISABLED,positionElement:null,durationElement:null,positionSeconds:-1,durationSeconds:-1},prevTrack:{element:null,STATE:i.DISABLED},playPause:{element:null,STATE:i.DISABLED,iconElement:null},nextTrack:{element:null,STATE:i.DISABLED},shuffle:{element:null,STATE:i.DISABLED},mute:{element:null,STATE:i.DISABLED,iconElement:null}};function Te(e,t,n){ye.log("init()"),W=e,se=t;let r=document.getElementById(pe.progressControlsId);r!==null?(a.progressSeek.element=r.querySelector(".seek-control"),a.progressSeek.click=n,a.progressBar.element=r.querySelector(".bar-control")):ye.error(`init(): Unable to getElementById() for '#${pe.progressControlsId}'`);let c=document.getElementById(pe.playbackControlsId);c!==null?(a.details.element=c.querySelector(".details-control"),a.details.artistElement=a.details.element.querySelector(".details-artist"),a.details.titleElement=a.details.element.querySelector(".details-title"),a.thumbnail.element=c.querySelector(".thumbnail-control"),a.thumbnail.img=a.thumbnail.element.querySelector("img"),a.timer.element=c.querySelector(".timer-control"),a.timer.positionElement=a.timer.element.querySelector(".timer-position"),a.timer.durationElement=a.timer.element.querySelector(".timer-duration"),a.prevTrack.element=c.querySelector(".prev-control"),a.playPause.element=c.querySelector(".play-pause-control"),a.playPause.iconElement=a.playPause.element.querySelector("i"),a.nextTrack.element=c.querySelector(".next-control"),a.shuffle.element=c.querySelector(".shuffle-control"),a.mute.element=c.querySelector(".mute-control"),a.mute.iconElement=a.mute.element.querySelector("i")):ye.error(`init(): Unable to getElementById() for '#${pe.playbackControlsId}'`)}function Se(e,t,n,r){ye.log("ready()"),b(a.progressSeek,i.ENABLED),a.progressSeek.element.addEventListener("click",Kt),b(a.progressBar,i.ENABLED),b(a.details,i.ENABLED),b(a.thumbnail,i.ENABLED),b(a.timer,i.ENABLED),W.trackThumbnailOnMobile&&a.thumbnail.element.classList.add("show-on-mobile"),W.trackTimesOnMobile&&a.timer.element.classList.add("show-on-mobile"),b(a.prevTrack,i.DISABLED),a.prevTrack.element.addEventListener("click",e),b(a.playPause,i.PAUSED),a.playPause.element.addEventListener("click",t),b(a.nextTrack,se.getNumTracks()>1?i.ENABLED:i.DISABLED),a.nextTrack.element.addEventListener("click",n),b(a.shuffle,i.ENABLED),b(a.mute,i.ENABLED),a.mute.element.addEventListener("click",r),Ze(),ze("autoplay",jt),ze("masterMute",Ze)}function b(e,t=t.DISABLED){A(e.element,e.STATE.CLASS,t.CLASS),e.STATE=t}function ke(e,t){Me(t===0?0:e/(t*1e3))}function le(e){Me(e/100)}function Me(e){a.progressBar.element.style.transform=`scaleX(${e})`}function Kt(e){if(a.timer.durationSeconds>0){let t=e.clientX/document.documentElement.clientWidth*100,n=Math.round(a.timer.durationSeconds*t/100);a.progressSeek.click(n),f()===!1&&(le(t),H(n,a.timer.durationSeconds))}}function _e(e){a.details.artistElement.textContent=e.artist||"",a.details.titleElement.textContent=e.title||"",qt(e.thumbnail),H(-1,-1)}function qt(e){e.src!==a.thumbnail.img.src&&(a.thumbnail.element.classList.remove("type-default","type-youtube","type-soundcloud"),a.thumbnail.element.classList.add("loading",e.class),a.thumbnail.img.src=e.src,a.thumbnail.img.decode().then(()=>a.thumbnail.element.classList.remove("loading")))}function H(e,t){e!==-1&&a.timer.positionSeconds!==e?(a.timer.positionSeconds=e,W.autoplay===!1&&(e=t-e),be(a.timer.positionElement,e)):e===-1&&a.timer.positionSeconds===-1&&(a.timer.positionElement.textContent="00:00"),t!==-1&&a.timer.durationSeconds!==t?(a.timer.durationSeconds=t,be(a.timer.durationElement,t)):t===-1&&a.timer.durationSeconds===-1&&(a.timer.durationElement.textContent="00:00")}function be(e,t){let n=new Date(t*1e3).toISOString();e.textContent=t>60*60?n.substr(11,8):n.substr(14,5)}function Je(){a.timer.positionElement.textContent="00:00",a.timer.durationElement.textContent="00:00",a.timer.positionSeconds=0,a.timer.durationSeconds=0}function f(){return a.playPause.STATE.ID===i.PLAYING.ID}function ie(){let e=se.getStatus();Je(),_e(e),f()===!1&&e.currentTrack<=1&&b(a.prevTrack,i.DISABLED),e.currentTrack<e.numTracks&&b(a.nextTrack,i.ENABLED)}function ce(){let e=se.getStatus();b(a.playPause,i.PLAYING),a.playPause.iconElement.textContent="pause_circle_filled",b(a.prevTrack,i.ENABLED),_e(e)}function N(){b(a.playPause,i.PAUSED),a.playPause.iconElement.textContent="play_circle_filled"}function Ae(e){e?a.playPause.element.classList.toggle("time-remaining-warning"):a.playPause.element.classList.remove("time-remaining-warning")}function X(){let e=se.getStatus();Je(),_e(e),b(a.prevTrack,i.ENABLED),e.currentTrack>=e.numTracks&&b(a.nextTrack,i.DISABLED)}function Ze(){a.mute.iconElement.textContent=W.masterMute?"volume_off":"volume_up"}function jt(){f()===!1&&a.timer.positionSeconds!==-1&&a.timer.durationSeconds!==-1&&(be(a.timer.positionElement,W.autoplay?a.timer.positionSeconds:a.timer.durationSeconds-a.timer.positionSeconds),be(a.timer.durationElement,a.timer.durationSeconds))}var ue=k("playback-events"),Pe={},Ve={nowPlayingIconsSelector:"h2.entry-title"},Le={nowPlayingIcons:null,snackbarId:0},s={LOADING:"loading",READY:"ready",MEDIA_PLAYING:"mediaPlaying",MEDIA_PAUSED:"mediaPaused",MEDIA_ENDED:"mediaEnded",MEDIA_TIME_REMAINING:"mediaTimeRemaining",MEDIA_SHOW:"mediaShow",MEDIA_UNAVAILABLE:"mediaUnavailable",CONTINUE_AUTOPLAY:"continueAutoplay",RESUME_AUTOPLAY:"resumeAutoplay",AUTOPLAY_BLOCKED:"autoplayBlocked",PLAYBACK_BLOCKED:"playbackBlocked"},$e={[s.LOADING]:[Wt],[s.READY]:[Ht],[s.MEDIA_PLAYING]:[Xt],[s.MEDIA_PAUSED]:[zt],[s.MEDIA_ENDED]:[Qe],[s.MEDIA_TIME_REMAINING]:[Zt],[s.MEDIA_SHOW]:[Jt],[s.CONTINUE_AUTOPLAY]:[Qt],[s.RESUME_AUTOPLAY]:[ea],[s.AUTOPLAY_BLOCKED]:[ta],[s.PLAYBACK_BLOCKED]:[aa],[s.MEDIA_UNAVAILABLE]:[na]};function et(e){ue.log("init()"),Pe=e,Le.nowPlayingIcons=document.querySelectorAll(Ve.nowPlayingIconsSelector)}function V(e,t){e in $e&&$e[e].push(t)}function L(e,t=null,n=null){$e[e].forEach(r=>{r({event:e,data:t,callback:n})})}function Wt(e){le(e.data.loadingPercent)}function Ht(e){O(e),le(0)}function Xt(e){if(O(e),xe(Le.snackbarId),e.data.numTracks>1){let t=document.querySelector(`#${e.data.trackId} ${Ve.nowPlayingIconsSelector}`);tt(t),A(t,"playing-paused","now-playing-icon"),Pe.user.animateNowPlayingIcon&&t.classList.add("playing-animate")}}function zt(e){O(e),e.data.numTracks>1&&document.querySelector(`#${e.data.trackId} ${Ve.nowPlayingIconsSelector}`).classList.add("playing-paused")}function Qe(e){O(e),le(0),e!==null&&e.data.numTracks>1&&tt()}function Zt(){}function Jt(e){O(e),Qe(null),e.data.scrollToMedia&&Fe(e.data.trackId)}function Qt(e){O(e),j(navigationUrls.next,!0)}function ea(e){let t=sessionStorage.getItem(x.UF_AUTOPLAY);sessionStorage.removeItem(x.UF_AUTOPLAY),O(e),ue.log(`RESUME_AUTOPLAY: ${t!==null?"true":"false"}`),t!==null&&e.callback.resumeAutoplay()}function ta(e){O(e),Le.snackbarId=P("Autoplay blocked, Play to continue",0,"play",()=>{e.data.isPlaying===!1&&e.callback.togglePlayPause()})}function aa(e){O(e),P("Unable to play track, skipping to next",5,"Stop",()=>{},()=>Ke(e))}function na(e){O(e),oa(e.data.trackId)?P("YouTube Premium track, skipping",5,"help",()=>{window.location.href="/channel/premium/"},()=>Ke(e)):(P("Unable to play track, skipping to next",5,"Stop",()=>{},()=>Ke(e)),Gt("EVENT_MEDIA_UNAVAILABLE",e.data))}function O(e=null){ue.isDebug()&&e!==null&&ue.log(e)}function tt(e){Le.nowPlayingIcons.forEach(t=>{t!==e&&t.classList.remove("now-playing-icon","playing-animate","playing-paused")})}function Ke(e){e.data.currentTrack<e.data.numTracks?e.callback.skipToTrack(e.data.currentTrack+1,!0):navigationUrls.next!==null&&j(navigationUrls.next,!0)}function oa(e){let t=document.getElementById(e);return t!==null?t.classList.contains("category-premium"):!1}function j(e,t=!1){ue.log(`navigateTo(): ${e} - continueAutoplay: ${t}`),e!=null&&e.length>0&&(t&&sessionStorage.setItem(x.UF_AUTOPLAY,"true"),window.location.href=e)}function Fe(e){if(Pe.user.autoScroll){let t=Math.round(window.scrollY+document.getElementById(e).getBoundingClientRect().top),n=Math.round(window.pageYOffset),r=at(t>n);n+r+nt()>t&&(r=at(!1)),window.scroll({top:t-(r+nt()),left:0,behavior:Pe.user.smoothScrolling?"smooth":"auto"})}}function at(e){return e?z("--site-header-height-down"):z("--site-header-height-up")}function nt(){return z("--site-content-margin-top")-1}var T=k("embedded-players"),B=new re(10),h=null,je=0,rt=1,de,g,D,_,Z={trackCountData:"data-track-count",youTubeIframeIdRegEx:/youtube-uid/i,soundCloudIframeIdRegEx:/soundcloud-uid/i,entriesSelector:"single-track",artistTrackTitleData:"data-artist-track-title",maxPlaybackStartDelay:3};function st(e){({settings:de=null,players:g=null,playbackState:D=null,playbackTimer:_=null}=e),la(),ia()}function lt(e){let t=parseInt(document.body.getAttribute(Z.trackCountData));return T.log(`getTrackCount(): ${t}`),je=t+3,h=e,t}function he(){return{loadingPercent:100*(rt++/je)}}function it(){rt>=je?h(s.READY):h(s.LOADING,he())}function pa(){document.querySelectorAll(Z.entriesSelector).forEach(t=>{let n=t.querySelector("iframe"),r={};if(Z.youTubeIframeIdRegEx.test(n.id)){let c=new YT.Player(n.id,{events:{onReady:ca,onStateChange:ua,onError:da}});r=new ra(t.id,n.id,c,n.src)}else if(Z.soundCloudIframeIdRegEx.test(n.id)){let c=SC.Widget(n.id);r=new ot(t.id,n.id,c,n.src),c.bind(SC.Widget.Events.READY,()=>{r.setThumbnail(),ga()}),c.bind(SC.Widget.Events.PLAY,ma),c.bind(SC.Widget.Events.PAUSE,fa),c.bind(SC.Widget.Events.FINISH,Ea),c.bind(SC.Widget.Events.ERROR,ya)}sa(t.getAttribute(Z.artistTrackTitleData),r),g.add(r)})}function Ie(e,t){T.log("onPlayerError()"),T.log(e);let n=e instanceof ot?u.SOUNDCLOUD:u.YOUTUBE;g.isCurrent(e.getUid())===!1&&g.stop(),B.add(n,d.PLAYER_ERROR,e.getUid()),h(s.MEDIA_UNAVAILABLE,Ta(e,t))}function Ta(e,t){let n=e.getArtist()||"N/A",r=e.getTitle()||"N/A";return{currentTrack:g.trackFromUid(e.getUid()),numTracks:g.getNumTracks(),trackId:e.getTrackId(),mediaTitle:`${n} - ${r}`,mediaUrl:t}}function la(){T.log("initYouTubeAPI()"),h(s.LOADING,he()),window.onYouTubeIframeAPIReady=function(){T.log("onYouTubeIframeAPIReady()"),h(s.LOADING,he()),pa()};let e=document.createElement("script");e.id="youtube-iframe-api",e.src="https://www.youtube.com/iframe_api";let t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}function ca(){T.log("onYouTubePlayerReady()"),it()}function ua(e){switch(B.add(u.YOUTUBE,e.data,e.target.h.id),e.data){case YT.PlayerState.UNSTARTED:Sa(e);break;case YT.PlayerState.BUFFERING:ka(e);break;case YT.PlayerState.PLAYING:ba(e);break;case YT.PlayerState.PAUSED:Aa(e);break;case YT.PlayerState.CUED:Pa(e);break;case YT.PlayerState.ENDED:La(e);break}}function Sa(e){T.log(`onYouTubePlayerStateChange: UNSTARTED (uID: ${e.target.h.id})`),B.ytAutoplayBlocked(e.target.h.id,3e3)&&h(s.AUTOPLAY_BLOCKED)}function ka(e){if(T.log(`onYouTubePlayerStateChange: BUFFERING (uID: ${e.target.h.id})`),g.crossfade.isFading()===!1){let t=g.playerFromUid(e.target.h.id);t.mute(de.masterMute),t.setVolume(de.masterVolume)}}function ba(e){T.log(`onYouTubePlayerStateChange: PLAYING   (uID: ${e.target.h.id})`),D.syncAll(e.target.h.id,D.STATE.PLAY),g.current.setDuration(Math.round(e.target.getDuration())),_.start()}function Aa(e){T.log(`onYouTubePlayerStateChange: PAUSED    (uID: ${e.target.h.id})`),g.isCurrent(e.target.h.id)?(D.syncAll(e.target.h.id,D.STATE.PAUSE),_.stop(!1)):g.crossfade.stop()}function Pa(e){T.log(`onYouTubePlayerStateChange: CUED      (uID: ${e.target.h.id})`)}function La(e){T.log(`onYouTubePlayerStateChange: ENDED     (uID: ${e.target.h.id})`),g.isCurrent(e.target.h.id)?(_.stop(!0),h(s.MEDIA_ENDED)):g.crossfade.stop()}function da(e){T.log("onYouTubePlayerError: "+e.data);let t=g.playerFromUid(e.target.h.id);t.setPlayable(!1),Ie(t,e.target.getVideoUrl())}function ia(){T.log("initSoundCloudAPI()"),h(s.LOADING,he())}function ga(){T.log("onSoundCloudPlayerEventReady()"),it()}function ma(e){T.log(`onSoundCloudPlayerEvent: PLAY   (uID: ${e.soundId})`),B.add(u.SOUNDCLOUD,d.STATE_PLAYING,e.soundId),g.crossfade.isFading()&&g.isCurrent(e.soundId)?B.scPlayDoubleTrigger(e.soundId,Z.maxPlaybackStartDelay*1e3)&&D.syncAll(e.soundId,D.STATE.PLAY):(D.syncAll(e.soundId,D.STATE.PLAY),g.current.mute(de.masterMute),g.current.setVolume(de.masterVolume)),g.current.getEmbeddedPlayer().getDuration(t=>{g.current.setDuration(Math.round(t/1e3)),_.start()})}function fa(e){T.log(`onSoundCloudPlayerEvent: PAUSE  (uID: ${e.soundId})`),B.add(u.SOUNDCLOUD,d.STATE_PAUSED,e.soundId),B.scAutoplayBlocked(e.soundId,3e3)?(_.stop(!1),h(s.AUTOPLAY_BLOCKED)):B.scWidgetPlayBlocked(e.soundId,3e4)?(_.stop(!1),h(s.PLAYBACK_BLOCKED,{currentTrack:g.trackFromUid(e.soundId),numTracks:g.getNumTracks()})):g.isCurrent(e.soundId)?g.current.getPosition(t=>{t>0&&(D.syncAll(e.soundId,D.STATE.PAUSE),_.stop(!1))}):g.crossfade.stop()}function Ea(e){T.log(`onSoundCloudPlayerEvent: FINISH (uID: ${e.soundId})`),g.isCurrent(e.soundId)?(_.stop(!0),h(s.MEDIA_ENDED)):g.crossfade.stop()}function ya(){this.getCurrentSound(e=>{let t=g.playerFromUid(e.id);T.log(`onSoundCloudPlayerEvent: ERROR for track: ${g.trackFromUid(e.id)}. ${t.getArtist()} - ${t.getTitle()} - [${t.getUid()} / ${t.getIframeId()}]`),t.setPlayable(!1)})}var Ge=k("crossfade-controls"),ct={},De={},J={crossfadePresetSelector:".crossfade-controls .preset-control",crossfadePresetData:"data-crossfade-preset",crossfadeToSelector:".crossfade-controls .fadeto-control"},I={crossfadePreset:{elements:null},crossfadeTo:{elements:null,click:null}};function dt(e,t,n){Ge.log("init()"),ct=e,De=t,I.crossfadePreset.elements=document.querySelectorAll(J.crossfadePresetSelector),I.crossfadeTo.elements=document.querySelectorAll(J.crossfadeToSelector),I.crossfadePreset.elements.length>1&&I.crossfadeTo.elements.length>1&&(I.crossfadePreset.elements.forEach(r=>ut(r,ct.trackCrossfadeDefPreset)),I.crossfadeTo.click=n)}function mt(){Ge.log("ready()"),I.crossfadePreset.elements.length>1&&I.crossfadeTo.elements.length>1&&(I.crossfadePreset.elements.forEach(e=>{e.addEventListener("click",ha),A(e,i.DISABLED.CLASS,i.ENABLED.CLASS)}),I.crossfadeTo.elements.forEach(e=>e.addEventListener("click",Ia)),V(s.MEDIA_PLAYING,gt),V(s.MEDIA_PAUSED,gt))}function ut(e,t){e.setAttribute(J.crossfadePresetData,t),e.textContent=`${t+1}`,e.title=`Preset: ${qe.crossfade[t].name}`}function ha(e){let t=parseInt(e.target.getAttribute(J.crossfadePresetData));t+1<qe.crossfade.length?t++:t=0,ut(e.target,t)}function Ia(e){if(f()&&De.crossfade.isFading()===!1){let t=e.target.closest("single-track");if(t!==null){let n=t.querySelector("iframe"),r=t.querySelector(J.crossfadePresetSelector).getAttribute(J.crossfadePresetData);A(e.target.closest("div.fadeto-control"),i.ENABLED.CLASS,i.DISABLED.CLASS),I.crossfadeTo.click(De.uIdFromIframeId(n.id),qe.crossfade[r])}}}function gt(){let e=f(),t=e?De.getStatus().currentTrack:-1;Ge.log(`updateCrossfadeToState() - playingState: ${e} - currentTrack: ${t}`),I.crossfadeTo.elements.forEach((n,r)=>{t===r+1?A(n,e?i.ENABLED.CLASS:i.DISABLED.CLASS,e?i.DISABLED.CLASS:i.ENABLED.CLASS):A(n,e?i.DISABLED.CLASS:i.ENABLED.CLASS,e?i.ENABLED.CLASS:i.DISABLED.CLASS)})}var Y=k("playback"),ge=null,y={},o={},Ce={updateTimerInterval:200,minCrossfadeToTime:5,maxBufferingDelay:3};function pt(e){ge=B,y=e.user,et(e),o=Da(),o.init(y,va),Te(y,o,Ca),dt(y,o,Ua),st({settings:y,players:o,playbackState:Et,playbackTimer:yt})}function Tt(){return lt(Na)>0}function Q(){f()?(N(),o.current.pause()):(ce(),o.current.play(Ie))}function Oa(e){Y.log(`prevClick() - prevTrack: ${o.getCurrentTrack()-1} - numTracks: ${o.getNumTracks()} - event: ${e!==null?e.type:"null"}`),o.getCurrentTrack()>0&&o.current.getPosition(t=>{t>3e3?(o.current.seekTo(0),yt.updateCallback(0)):(o.getCurrentTrack()>1&&o.stop(),o.prevTrack(f())&&ie())})}function St(e){Y.log(`nextClick() - nextTrack: ${o.getCurrentTrack()+1} - numTracks: ${o.getNumTracks()} - event: ${e!==null?e.type:"null"}`),o.getCurrentTrack()+1<=o.getNumTracks()?(o.stop(),e!==null||y.autoplay?o.nextTrack(f())&&X():N()):e===null&&(N(),y.autoplay?L(s.CONTINUE_AUTOPLAY):o.stop())}function Ca(e){o.current.seekTo(e)}function We(){y.masterMute=y.masterMute!==!0,o.mute()}function va(e,t=!0){L(s.MEDIA_SHOW,{scrollToMedia:t,trackId:o.current.getTrackId()}),e&&o.current.play(Ie)}function kt(e,t=!0){Y.log(`skipToTrack(): ${e} - ${t}`),t===!0&&f()===!1&&(ge.clear(),ge.add(u.ULTRAFUNK,d.RESUME_AUTOPLAY,null),o.jumpToTrack(e,t)&&X())}function Ba(){Y.log("resumeAutoplay()"),ge.add(u.ULTRAFUNK,d.RESUME_AUTOPLAY,null),Q()}function C(){return{isPlaying:f(),currentTrack:o.getCurrentTrack(),numTracks:o.getNumTracks(),trackId:o.current.getTrackId(),iframeId:o.current.getIframeId()}}function Na(e,t=null){switch(Y.isDebug()&&e!==s.LOADING&&(Y.log(`embeddedEventHandler(): ${e}`),t!==null&&Y.log(t)),e){case s.LOADING:L(s.LOADING,t);break;case s.READY:Se(Oa,Q,St,We),mt(),L(s.READY),L(s.RESUME_AUTOPLAY,null,{resumeAutoplay:Ba});break;case s.MEDIA_ENDED:St(null);break;case s.AUTOPLAY_BLOCKED:N(),L(s.AUTOPLAY_BLOCKED,C(),{togglePlayPause:Q});break;case s.PLAYBACK_BLOCKED:N(),L(s.PLAYBACK_BLOCKED,t,{skipToTrack:kt});break;case s.MEDIA_UNAVAILABLE:N(),L(s.MEDIA_UNAVAILABLE,t,{skipToTrack:kt});break}}var Et=(()=>{let e={PLAY:1,PAUSE:2},t=function r(c,E){if(Y.log(`playbackState.syncAll() - previousTrack: ${o.getPlayerIndex()+1} - nextTrack: ${o.indexMap.get(c)+1} - syncState: ${Y.getObjectKeyForValue(e,E)}`),o.isCurrent(c))E===e.PLAY?(o.crossfade.start(),ce(),L(s.MEDIA_PLAYING,C())):E===e.PAUSE&&(o.crossfade.stop(),N(),L(s.MEDIA_PAUSED,C()));else{let G=o.getPlayerIndex(),Ee=o.indexMap.get(c);o.stop(),o.setPlayerIndex(Ee),n(G,Ee),r(c,E)}};function n(r,c){c>r?X():ie()}return{STATE:e,syncAll:t,syncControls:n}})(),yt=(()=>{let e=-1,t=0,n=!0;return document.addEventListener("visibilitychange",()=>{n=document.visibilityState==="visible"}),{start:r,stop:c,updateCallback:E};function r(){c(!1),e=setInterval(()=>{n&&o.current.getPosition(E)},Ce.updateTimerInterval)}function c(U=!1){e!==-1&&(clearInterval(e),e=-1),U&&(E(0),L(s.MEDIA_ENDED,C())),t=0,Ae(!1)}function E(U,M=0){let K=Math.round(U/1e3);ke(U,M),H(K,M),K>0&&M>0&&(G(K,M),Ee(K,M))}function G(U,M){if(y.autoplay===!1&&y.timeRemainingWarning&&t!==U){let K=M-U;t=U,K<=y.timeRemainingSeconds?(Ae(!0),L(s.MEDIA_TIME_REMAINING,{timeRemainingSeconds:K})):Ae(!1)}}function Ee(U,M){y.masterMute===!1&&y.autoplay&&y.autoCrossfade&&M-U===y.autoCrossfadeLength+Ce.maxBufferingDelay&&o.getCurrentTrack()+1<=o.getNumTracks()&&bt(ft.AUTO,{name:"Auto Crossfade",length:y.autoCrossfadeLength,curve:y.autoCrossfadeCurve})}})();function Ua(e,t){o.isCurrent(e)===!1&&o.current.getDuration()>0&&(Y.log(`crossfadeToClick():
fadeOut: ${o.current.getArtist()} - "${o.current.getTitle()}" (${o.current.getUid()})
fadeIn.: ${o.playerFromUid(e).getArtist()} - "${o.playerFromUid(e).getTitle()}" (${e})`),y.masterMute===!1&&y.autoplay===!1&&o.current.getPosition(n=>{o.current.getDuration()-n/1e3>=Ce.minCrossfadeToTime+Ce.maxBufferingDelay&&bt(ft.TRACK,t,e)}))}function bt(e,t,n=null){ge.add(u.ULTRAFUNK,d.CROSSFADE_START,null);let r=o.crossfade.init(e,t,n);r!==null&&Et.syncControls(r.fadeOutPlayer,r.fadeInPlayer)}var ee=k("screen-wakelock"),ve=null;function At(){return"wakeLock"in navigator&&"request"in navigator.wakeLock}async function Lt(e){At()?document.visibilityState==="visible"&&await Pt()!==!0&&ee.log("enable(): Screen Wake Lock request failed"):(ee.log("enable(): Screen Wake Lock is not supported"),P("Keep Screen On is not supported",5,"Turn Off",()=>e.user.keepMobileScreenOn=!1))}function ht(){ee.log("stateVisible()"),At()&&ve===null&&Pt()}async function Pt(){try{return ve=await navigator.wakeLock.request("screen"),ee.log("request(): Screen Wake Lock is Enabled"),ve.addEventListener("release",()=>{ee.log("request(): Screen Wake Lock was Released"),ve=null}),!0}catch(e){ee.error(`request(): ${e.name} - ${e.message}`)}return!1}var q=k("player-playlist"),te=new re(10),w={},S=null,Ue=null,It=!0,v={container:null,observer:null},l={trackId:null,element:null,snackbarId:0,autoplayValue:null};function Dt(e,t){q.log("init"),w=e,Ue=t,v.container=document.getElementById("tracklist-container"),v.observer=new IntersectionObserver(xa,{root:v.container}),$.init(),me.init(w.user),_a(),Va(),document.addEventListener("keydown",wa),document.getElementById("footer-autoplay-toggle").addEventListener("click",n=>Ue(n)),R("#playback-controls .details-control","click",Ne),R("#playback-controls .thumbnail-control","click",Ne),R("#playback-controls .timer-control","click",n=>Ue(n)),R("i.nav-bar-arrow-back","click",Oe,navigationUrls.prev),R("i.nav-bar-arrow-fwd","click",Oe,navigationUrls.next),v.container.addEventListener("click",n=>{let r=n.target.closest("div.thumbnail");if(r!==null)return ae(r.closest("div.track-entry").id,!0,!0);let c=n.target.closest("div.share-playon-button");if(c!==null)return Ma(c)})}function wa(e){if(me.allow()&&e.repeat===!1&&e.ctrlKey===!1&&e.altKey===!1){switch(e.code){case"Backquote":e.preventDefault(),Ne(e);break}switch(e.key){case" ":e.preventDefault(),l.trackId!==null?ae(l.trackId):ae(v.container.querySelector(".track-entry.current").id);break;case"ArrowLeft":e.preventDefault(),e.shiftKey===!1?vt():Oe(e,navigationUrls.prev);break;case"ArrowRight":e.preventDefault(),e.shiftKey===!1?Ut():Oe(e,navigationUrls.next);break;case"A":Ue(e);break;case"f":case"F":e.preventDefault(),$.toggle(document.getElementById("youtube-player"));break;case"m":case"M":e.preventDefault(),Ct();break}}}function Ma(e){let t=e.closest("div.track-entry"),n=t.getAttribute("data-artist-track-title"),r=t.getAttribute("data-track-url");Ra.show({string:n,filterString:!0,url:r})}function Ne(){let e=0;window.pageYOffset<1&&(e=z("--site-header-height")-z("--site-header-height-down")),window.scroll({top:e,left:0,behavior:w.user.smoothScrolling?"smooth":"auto"})}function Ct(){w.user.masterMute?w.user.masterMute=!1:w.user.masterMute=!0,w.user.masterMute?S.embedded.mute():S.embedded.unMute()}function _a(){if(l.trackId=v.container.querySelector(".track-entry").id,l.autoplayValue=sessionStorage.getItem(x.UF_AUTOPLAY),sessionStorage.removeItem(x.UF_AUTOPLAY),l.autoplayValue!==null){let e=l.autoplayValue.match(/^[a-zA-Z0-9-_]{11}$/);e!==null&&(l.trackId=e[0])}q.log(`setCurrentIdAndElement() - autoplayValue: ${l.autoplayValue!==null?l.autoplayValue:"N/A"} - current.trackId: ${l.trackId}`),l.element=document.getElementById(l.trackId),v.observer.observe(l.element)}function xa(e){v.observer.unobserve(l.element),Math.ceil(e[0].intersectionRatio*100)/100!=1&&(v.container.scrollTop=l.element.offsetTop-v.container.offsetHeight+l.element.offsetHeight)}function Oe(e,t){e.preventDefault(),j(t,f())}function ae(e,t=!0,n=!1){if(e===void 0){F(!1);return}e===l.trackId?Ot():(f()&&S.embedded.stopVideo(),l.element.classList.remove("current","playing","paused"),l.trackId=e,l.element=document.getElementById(l.trackId),n===!1&&v.observer.observe(l.element),l.element.classList.add("current"),Nt(t))}function Nt(e){S.setArtistTitleThumbnail(l.element.getAttribute("data-artist-track-title"),l.trackId),e?(S.embedded.loadVideoById(l.trackId),F(!0)):(S.embedded.cueVideoById(l.trackId),F(!1))}function Ot(){f()?S.embedded.pauseVideo():S.embedded.playVideo()}function Bt(e=!1){l.element.nextElementSibling===null?j(navigationUrls.next,e):e?ae(l.element.nextElementSibling?.id):F(!1)}function vt(){let e=l.element.previousElementSibling?.id,t=S.embeddedPlayer.getCurrentTime();e!==void 0&&t<=5?(ae(e,f()),ie()):t!==0&&(S.seekTo(0),He.update(0,0))}function Ut(){let e=l.element.nextElementSibling?.id;e!==void 0&&(ae(e,f()),X())}function F(e){e?A(l.element,"paused","playing"):A(l.element,"playing","paused")}function $a(){f()===!1&&l.autoplayValue!==null&&(te.add(u.ULTRAFUNK,d.RESUME_AUTOPLAY,null),te.add(u.YOUTUBE,-1,l.element.nextElementSibling?.id)),f()===!1&&Bt(!0)}function Fa(){l.trackId=null,F(!1)}function Va(){q.log("initYouTubeAPI()"),window.onYouTubeIframeAPIReady=function(){q.log("onYouTubeIframeAPIReady()");let n=new YT.Player("youtube-player",{events:{onReady:Ka,onStateChange:ja,onError:qa}});S=new Ya(n),Te(w.user,S,r=>{S.seekTo(r)}),q.log(S)};let e=document.createElement("script");e.id="youtube-iframe-api",e.src="https://www.youtube.com/iframe_api";let t=document.getElementsByTagName("script")[0];t.parentNode.insertBefore(e,t)}function Ka(){l.element.classList.add("current"),l.autoplayValue!==null&&te.add(u.ULTRAFUNK,d.RESUME_AUTOPLAY,null),Se(vt,Ot,Ut,Ct),Nt(l.autoplayValue!==null)}function ja(e){switch(q.log(`onYouTubePlayerStateChange(): ${e.data} - trackId: ${l.trackId}`),te.add(u.YOUTUBE,e.data,l.trackId),e.data!==YT.PlayerState.PLAYING&&N(),e.data){case YT.PlayerState.UNSTARTED:te.ytAutoplayBlocked(l.trackId,3e3)&&(F(!1),l.snackbarId=P("Autoplay blocked, Play to continue",0,"play",()=>S.embedded.playVideo()));break;case YT.PlayerState.ENDED:He.stop(!0),Bt(w.user.autoplay);break;case YT.PlayerState.PLAYING:Ga(e),He.start(),ce(),F(!0);break;case YT.PlayerState.PAUSED:F(!1);break}}function Ga(e){xe(l.snackbarId),S.setDuration(Math.round(e.target.getDuration())),It&&(It=!1,l.autoplayValue=null,setTimeout(()=>{w.user.autoplay&&f()&&window.pageYOffset<1&&Ne()},5e3))}function qa(e){q.log(`onYouTubePlayerError(): ${e.data} - trackId: ${l.trackId}`),l.element.querySelector(".track-duration").innerText="Error",l.element.querySelector(".track-duration").style.display="block",te.add(u.YOUTUBE,d.PLAYER_ERROR,l.trackId),P("Unable to play track, skipping to next",5,"Stop",Fa,$a)}var He=(()=>{let e=-1,t=!0;return document.addEventListener("visibilitychange",()=>{t=document.visibilityState==="visible"}),{start:n,stop:r,update:c};function n(){r(),e=setInterval(()=>{t&&f()&&c(S.embedded.getCurrentTime()*1e3,S.getDuration())},250)}function r(E=!1){e!==-1&&(clearInterval(e),e=-1),E&&c(0,0)}function c(E,G){ke(E,G),H(Math.round(E/1e3),G)}})();var ne=k("playback-interaction"),Yt=new we(10),m={},Rt=!1,fe={autoplayToggleId:"footer-autoplay-toggle",crossfadeToggleId:"footer-crossfade-toggle",doubleClickDelay:500},p={playbackControls:{details:null,thumbnail:null,timer:null,statePlaying:!1},autoplayToggle:null,crossfadeToggle:null};document.addEventListener("DOMContentLoaded",()=>{ne.log("DOMContentLoaded"),Xa(),Tt()?(za(),Za(),Xe(m.user.autoplay),wt(m.user.autoCrossfade)):document.getElementById("player-playlist")&&(p.autoplayToggle=document.getElementById(fe.autoplayToggleId),p.crossfadeToggle=document.getElementById(fe.crossfadeToggleId),Xe(m.user.autoplay),Dt(m,Be))});function Xa(){ne.log("readSettings()"),m=Ha(x.UF_PLAYBACK_SETTINGS,Wa,!0),ne.log(m)}function za(){ne.log("initInteraction()"),$.init(),me.init(m.user),p.playbackControls.details=document.getElementById("playback-controls").querySelector(".details-control"),p.playbackControls.thumbnail=document.getElementById("playback-controls").querySelector(".thumbnail-control"),p.playbackControls.timer=document.getElementById("playback-controls").querySelector(".timer-control"),p.autoplayToggle=document.getElementById(fe.autoplayToggleId),p.crossfadeToggle=document.getElementById(fe.crossfadeToggleId),R("i.nav-bar-arrow-back","click",oe,navigationUrls.prev),R("i.nav-bar-arrow-fwd","click",oe,navigationUrls.next),R("nav.post-navigation .nav-previous a","click",oe,navigationUrls.prev),R("nav.post-navigation .nav-next a","click",oe,navigationUrls.next),document.addEventListener("keydown",Ja),window.addEventListener("blur",Qa)}function Za(){pt(m),V(s.READY,en),V(s.MEDIA_SHOW,Mt),V(s.MEDIA_ENDED,Mt),V(s.MEDIA_TIME_REMAINING,tn)}function Ja(e){if(Rt&&me.allow()&&e.repeat===!1&&e.ctrlKey===!1&&e.altKey===!1){switch(e.code){case"Backquote":_t(e);break}switch(e.key){case" ":e.preventDefault(),Q();break;case"ArrowLeft":e.shiftKey===!0&&oe(e,navigationUrls.prev);break;case"ArrowRight":e.shiftKey===!0&&oe(e,navigationUrls.next);break;case"A":Be(e);break;case"f":case"F":e.preventDefault(),$.toggle(document.getElementById(C().iframeId));break;case"m":case"M":e.preventDefault(),We(),P(m.user.masterMute?"Volume is muted (<b>m</b> to unmute)":"Volume is unmuted (<b>m</b> to mute)",3);break;case"x":case"X":p.crossfadeToggle.classList.contains("disabled")===!1&&xt(e);break}}}function en(){p.playbackControls.details.addEventListener("click",Vt),p.playbackControls.thumbnail.addEventListener("click",Vt),p.playbackControls.timer.addEventListener("click",Be),p.autoplayToggle.addEventListener("click",Be),p.crossfadeToggle.addEventListener("click",xt),document.addEventListener("visibilitychange",an),m.user.keepMobileScreenOn&&Lt(m),Rt=!0}function Mt(){m.user.autoExitFullscreen&&$.exit()}function tn(e){m.user.autoExitFsOnWarning&&e.data.timeRemainingSeconds<=m.user.timeRemainingSeconds&&$.exit()}function Qa(){setTimeout(()=>{document.activeElement instanceof HTMLIFrameElement&&setTimeout(()=>{document.activeElement.blur(),document.activeElement instanceof HTMLIFrameElement&&document.activeElement.blur()},250)},0)}function an(){document.visibilityState==="visible"?(m.user.autoResumePlayback&&p.playbackControls.statePlaying&&C().isPlaying===!1&&Q(),m.user.keepMobileScreenOn&&ht()):document.visibilityState==="hidden"&&(m.user.autoResumePlayback&&C().isPlaying?p.playbackControls.statePlaying=!0:p.playbackControls.statePlaying=!1)}function Vt(e){_t(e),Yt.add(u.MOUSE,d.MOUSE_CLICK,null),e.target.tagName.toLowerCase()==="img"?$t("showTrackImageHint","<b>Tip:</b> Double click or tap on the Track Thumbnail for full screen"):$t("showDetailsHint","<b>Tip:</b> Double click or tap on Artist &amp; Title for full screen"),Yt.doubleClicked(u.MOUSE,d.MOUSE_CLICK,fe.doubleClickDelay)&&$.enter(document.getElementById(C().iframeId))}function $t(e,t,n=0){m.priv.tips[e]&&(P(t,n),m.priv.tips[e]=!1)}function oe(e,t){e!==null&&t!==null&&(e.preventDefault(),j(t,C().isPlaying))}function _t(e){e.preventDefault(),Fe(C().trackId)}function Be(e){e.preventDefault(),m.user.autoplay=m.user.autoplay!==!0,P(m.user.autoplay?"Autoplay enabled (<b>Shift</b> + <b>A</b> to disable)":"Autoplay disabled (<b>Shift</b> + <b>A</b> to enable)",5),Xe(m.user.autoplay)}function Xe(e){ne.log(`updateAutoplayDOM() - autoplay: ${e}`),p.autoplayToggle.querySelector(".autoplay-on-off").textContent=e?"ON":"OFF",e?A(document.body,"autoplay-off","autoplay-on"):A(document.body,"autoplay-on","autoplay-off"),e?p.crossfadeToggle.classList.remove("disabled"):p.crossfadeToggle.classList.add("disabled")}function xt(e){e.preventDefault(),m.user.autoCrossfade=m.user.autoCrossfade!==!0,P(m.user.autoCrossfade?"Auto Crossfade enabled (<b>x</b> to disable)":"Auto Crossfade disabled (<b>x</b> to enable)",5),wt(m.user.autoCrossfade)}function wt(e){ne.log(`updateCrossfadeDOM() - autoCrossfade: ${e}`),p.crossfadeToggle.querySelector(".crossfade-on-off").textContent=e?"ON":"OFF"}
//# sourceMappingURL=interaction.js.map
